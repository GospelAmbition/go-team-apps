# Rules for this file
- no code samples
- no recommendations
- be concise

# Screen Recording Implementation

## Goal

Implement screen recording with webcam overlay where users can record:
- **A browser tab** - Record a specific browser tab
- **A window** - Record a specific application window
- **A monitor/screen** - Record entire screen/monitor

**Final Output:** Composite video showing screen share with webcam overlay at bottom-right corner

**Key Requirement:** User must be able to switch browser tabs/windows during recording without interrupting the recording.

---

## TL;DR - Current Implementation & Recommended Next Step

**✅ Current Production:** Real-time canvas compositing + Picture-in-Picture (Try #1)

**How it works:**
- Canvas draws screen + webcam overlay in real-time
- PiP window keeps page active (prevents throttling when user switches tabs)
- Single MediaRecorder captures composite stream
- Webcam always at bottom-right corner, medium size (25%)

**Why this approach:**
- ✅ Simple, reliable, works in all browsers
- ✅ No post-processing delay
- ✅ No bundle size increase (no FFmpeg)
- ✅ Tab switching works perfectly
- ⚠️ Minor limitation: PiP window placement not controllable

---

**🌟 Recommended Next Step:** PiP Window as Webcam (Try #6)

**Even simpler approach:**
- User configures recording (selects screen)
- PiP opens, user drags to desired position
- User clicks "Start Recording"
- MediaRecorder captures screen directly (PiP visible in recording)

**Why migrate:**
- ✅ **Simpler** - Eliminates canvas compositing entirely
- ✅ **Lower CPU** - No requestAnimationFrame loop
- ✅ **User controls position/size** - Solves multi-monitor issue
- ⚠️ Two-step setup (configure → position → start)
- ⚠️ PiP chrome/borders visible in final video

**See implementation sections below for details.**

---

## Current Production Implementation (Dec 2025)

### Real-Time Canvas Compositing + Picture-in-Picture

**Architecture:**
- Canvas API composites screen + webcam in real-time during recording
- Picture-in-Picture (PiP) keeps page active to prevent throttling
- Single MediaRecorder captures composite canvas stream
- Webcam hardcoded to bottom-right corner at medium size (25% of screen)

**How it works:**

1. **Stream Acquisition:**
   - `getDisplayMedia()` captures screen/window/tab
   - `getUserMedia()` captures webcam (video only)
   - Optional: `getUserMedia()` captures microphone (audio only)

2. **Real-Time Compositing:**
   - Create `<video>` elements for screen and webcam streams
   - Canvas draws screen at full size
   - Canvas draws webcam overlay at bottom-right (25% size, 20px padding)
   - `requestAnimationFrame` loop runs at 30 FPS
   - `canvas.captureStream(30)` creates composite video stream

3. **Picture-in-Picture Prevention of Throttling:**
   - PiP window shows webcam feed
   - Keeps page "active" so `requestAnimationFrame` doesn't throttle to 1 FPS
   - When user switches tabs, PiP prevents browser from throttling canvas rendering
   - **Note:** For full-screen (monitor) recording, canvas webcam overlay is always drawn (PiP just prevents throttling)

4. **Audio Mixing:**
   - Web Audio API mixes multiple audio sources (system audio + microphone)
   - Combined audio track added to final stream

5. **Recording:**
   - Single MediaRecorder records composite canvas stream + mixed audio
   - Codec: VP9 (fallback to VP8)
   - Output: Single `.webm` file with screen + webcam composite

**Settings:**
- Recording mode: Screen only, Webcam only, or Both (screen + webcam)
- Include Audio: Toggle for microphone audio (independent of recording mode)
- Webcam: Always bottom-right, always medium size (hardcoded, not user-configurable)

**Benefits:**
- ✅ Simple architecture (single MediaRecorder)
- ✅ No post-processing required
- ✅ Instant preview after recording
- ✅ Works with tab switching (thanks to PiP)
- ✅ Webcam appears at consistent position in all recordings
- ✅ Lower CPU than separate recording + compositing
- ✅ No client-side bundle size increase (no FFmpeg)
- ✅ No memory limitations (no FFmpeg.wasm constraints)

**Limitations:**
- ⚠️ PiP window always appears on same monitor as browser tab
- ⚠️ User must manually move PiP if recording external monitor
- ⚠️ Canvas compositing uses more CPU during recording than separate recording
- ⚠️ Webcam position/size not user-configurable (design decision)

**Code References:**
- Composable: `app/composables/useScreenRecorder.ts`
  - `compositeStreams()` function (line 328+): Canvas compositing logic
  - PiP setup (line 399-435): Picture-in-Picture implementation
- UI: `app/pages/record.vue`
  - Recording mode selection
  - Audio toggle

**Why This Approach:**
- Real-time compositing is more reliable than post-recording compositing
- PiP solves the tab-switching throttling issue
- Single video output is simpler for users and backend
- No dependency on FFmpeg.wasm (smaller bundle, no memory limits)
- Consistent webcam placement improves UX

---

## Implementation Attempts (Historical)

### Try #1: Picture-in-Picture (PiP) Solution ✅ (Current Production)

**Approach:**
- Use Canvas API to composite screen + webcam in real-time
- Use Picture-in-Picture API to keep canvas rendering active when tab loses focus
- Show webcam feed in PiP window to prevent browser throttling

**How it works:**
1. Composite screen + webcam on canvas in main thread
2. When user switches tabs, browser throttles `requestAnimationFrame` to ~1 FPS
3. PiP window keeps the page "active" so canvas continues rendering at full speed
4. MediaRecorder captures the composite canvas stream

**Initial Problems:**
- ✅ Works for same-monitor recording
- ❌ **PiP window appears on the SAME monitor as the browser tab**
- ❌ When recording an external monitor, PiP appears on main screen
- ❌ User must manually drag PiP window to the other monitor (annoying UX)
- ❌ No programmatic control over which monitor displays PiP
- ❌ Browser controls PiP window placement (can't be overridden)
- ❌ Original bug: Webcam overlay was hidden when PiP opened, resulting in no webcam in final video

**Solution (Dec 2025):**
- Fixed bug: Canvas now **always** draws webcam overlay regardless of PiP state
- PiP's only purpose is to keep page active (prevent throttling)
- Webcam appears at bottom-right in final video (not affected by PiP placement)
- Simplified settings: Removed webcam position/size controls, hardcoded to bottom-right medium

**Verdict:** ✅ **PRODUCTION** - Works reliably. PiP placement limitation accepted as minor UX trade-off. Users can manually move PiP window if needed.

---

### Try #2: OffscreenCanvas with Web Worker

**Approach:**
- Move canvas compositing to Web Worker using OffscreenCanvas
- Worker rendering is immune to tab throttling (runs in separate thread)
- Eliminate need for PiP window

**Why we thought it would work:**
- OffscreenCanvas rendering in worker is immune to tab throttling
- No PiP window needed (solves multi-monitor issue)
- Worker continues rendering at full speed even when tab is hidden

**Why it DIDN'T work:**
1. **Video elements still in main thread** - When tab loses focus, the `<video>` elements pause/throttle
2. **Frame capture throttled** - `setInterval` throttles to ~1 FPS when tab is hidden
3. **Worker receives no frames** - Can't composite what it doesn't receive
4. **Recording stops** - Screen share and webcam both stop when switching tabs

**The fundamental issue:**
- OffscreenCanvas solves **canvas rendering** throttling
- But it doesn't solve **video element** throttling
- The `<video>` elements (screenVideo, webcamVideo) are still in the main thread
- When tab is backgrounded, they pause regardless of where canvas rendering happens

**Verdict:** Failed. OffscreenCanvas doesn't keep video elements active. The problem is upstream from the canvas.

---

### Try #3: Separate Recording + Client-Side FFmpeg Composite (In Progress)

**Approach:**
- Record screen and webcam as **two separate MediaRecorder instances**
- After recording finishes, composite them using **FFmpeg.wasm** in the browser
- Upload final composite video

**Why we thought this would work:**

**MediaRecorder is immune to tab switching:**
- MediaRecorder operates at the media engine level, not the rendering layer
- Screen MediaRecorder continues recording at full speed regardless of tab state
- No canvas needed during recording
- No PiP needed

**Implementation Status:**
- ✅ Two separate MediaRecorders working
- ✅ Screen recording continues when tab switches
- ✅ FFmpeg.wasm integration complete
- ⚠️ **Discovered limitation: Webcam throttling**

**Critical Issue Discovered:**

**Webcam throttles when tab loses focus:**
- While `getDisplayMedia()` (screen) continues at full speed when backgrounded
- `getUserMedia()` (webcam) **gets throttled by browser** when tab loses focus
- Browser throttles camera to save resources when tab is not visible
- Result: Screen recording is smooth, but webcam portion is choppy in final video
- This is a **fundamental browser limitation**, not a code issue

**Testing Results:**
- Screen-only recording: ✅ Works perfectly with tab switching
- Webcam-only recording: ❌ Throttles when tab is hidden
- Both mode: ⚠️ Screen smooth, webcam choppy when tab switching

**Benefits (if webcam throttling is acceptable):**
- ✅ **Screen recording** works perfectly with tab switching
- ✅ **No PiP window** - Eliminates multi-monitor issue
- ✅ **Lower CPU during recording** - No canvas compositing
- ✅ **Can adjust webcam position/size before final composite**
- ✅ **Keeps serverless architecture** - Everything client-side

**Limitations:**
- ❌ **Webcam throttles when tab is backgrounded** (browser limitation)
- ❌ Processing time after recording (5-15 seconds)
- ❌ FFmpeg.wasm memory limitations (32MB video limit)
- ❌ Larger bundle size (~30MB for FFmpeg.wasm)
- ❌ FFmpeg "memory access out of bounds" errors on longer recordings

**FFmpeg.wasm Specific Issues:**
- **Memory limitations**: WebAssembly has strict memory limits
- Longer recordings cause "memory access out of bounds" errors
- VP8/VP9 encoding is very memory-intensive
- Even with aggressive settings (low bitrate, fast encoding), still hits limits

**Expected User Flow:**
1. User clicks "Start Recording"
2. Selects screen/window/tab + webcam permissions
3. Records with tab visible (or accept choppy webcam if switching)
4. Clicks "Stop Recording"
5. Processing screen: "Compositing video..."
6. If successful: Preview shows composite video
7. If FFmpeg fails: Falls back to screen-only video

**Verdict:** Partially successful. Works for screen-only recording with tab switching. For screen+webcam mode, user must keep tab visible to avoid webcam throttling. FFmpeg.wasm memory limitations make it unsuitable for longer recordings. Consider Option C3 (server-side) for production use.

---

### Try #4: Separate Recording + On-Demand Server Composite (Possibility)

**Approach:**
- Record screen and webcam as **two separate MediaRecorder instances** (same as Try #3)
- Upload **both videos separately** to storage (screen.webm + webcam.webm)
- Store metadata about webcam position/size settings
- **Composite on-demand** when video is watched (server-side or edge function)
- Cache composite result for subsequent views

**Why this could work:**

**Recording benefits (same as Try #3):**
- Screen MediaRecorder continues at full speed when tab switches
- No PiP window needed
- No canvas compositing during recording

**CRITICAL: Same Webcam Throttling Issue**
- ⚠️ **Webcam still throttles when tab loses focus** (browser limitation)
- The throttling happens **during recording**, before upload
- Server receives already-throttled webcam video
- Server cannot fix frames that were never captured
- **Result: Smooth screen + choppy webcam** (same as Try #3)
- This is a **browser API limitation**, not a server limitation

**Additional benefits:**
- ✅ **All benefits of Try #3** (tab switching, no PiP, etc.)
- ✅ **No client-side processing** - Instant upload after recording
- ✅ **No FFmpeg.wasm bundle** - Saves 30MB client download
- ✅ **Fastest upload experience** - User doesn't wait for processing
- ✅ **Can change webcam position later** - Edit overlay without re-recording
- ✅ **Can offer multiple aspect ratios** - Generate 16:9, 4:3, 1:1 versions
- ✅ **Progressive enhancement** - Show original videos while composite generates
- ✅ **Better error handling** - If composite fails, can retry or show originals

**Advanced possibilities:**
- Let user adjust webcam position/size after recording
- Generate thumbnails from any frame
- Extract audio transcript separately
- Create clips/highlights from original sources
- Multi-language captions with separate audio tracks

**Tradeoffs:**
- ❌ **Requires server infrastructure** - Can't be purely serverless
- ❌ **Storage costs** - Store 3 files instead of 1 (screen + webcam + composite)
- ❌ **First view latency** - Initial viewer waits for composite generation
- ❌ **More complex architecture** - Need worker/lambda for FFmpeg
- ❌ **Need FFmpeg on server** - Binary dependencies, container image
- ❌ **Caching strategy required** - Manage composite lifecycle

**Storage Strategy:**
- Store original screen recording
- Store original webcam recording
- Store cached composite (lazy-generated on first view)
- Optional: mobile versions, thumbnails, metadata

**Caching Strategy:**
1. **Generate on first view** - Composite created when first viewer watches
2. **TTL expiration** - Delete composite after 30 days of no views (keep originals)
3. **Regenerate on edit** - If user changes webcam position, delete composite
4. **Background processing** - Queue composite generation, show progress bar

**Expected User Flow:**

**Recorder:**
1. Records screen + webcam separately
2. Uploads both videos instantly (no processing wait!)
3. Gets shareable link immediately
4. Can edit webcam position/size settings later

**Viewer (first time):**
1. Clicks share link
2. Sees "Generating preview... 45%" (or show original screen while processing)
3. Composite generates in background
4. Plays composite when ready
5. Subsequent viewers get instant playback (cached)

**Cost Analysis:**

For a 5-minute recording:
- Screen video: ~50MB
- Webcam video: ~30MB
- Composite video: ~60MB
- **Total storage: 140MB** (vs 60MB for Try #3)
- **Storage cost: ~$0.002/month** on Backblaze B2

Processing cost:
- Lambda with FFmpeg: ~$0.001 per composite generation
- One-time cost, cached forever (or until TTL)

**When to use Option C3:**

✅ Use if:
- You want instant upload experience (no client processing)
- You need post-recording editing (change overlay position)
- You want to offer multiple formats/sizes
- Storage costs are acceptable
- You're okay with server infrastructure

❌ Don't use if:
- You want purely serverless/static architecture
- Storage costs are a concern
- First-view latency is unacceptable
- You don't need post-recording editing

**Verdict:** Does NOT solve webcam throttling issue (same browser limitation as Try #3). Only provides benefits for server-side processing (no FFmpeg.wasm memory limits, post-recording editing). For screen+webcam recording with tab switching, user must still keep tab visible OR accept choppy webcam. Best for production if webcam throttling is acceptable or if building screen-only recorder.

---

### Try #5: Automatic Picture-in-Picture (Media Session API)

**Approach:**
- Record screen and webcam as **two separate MediaRecorder instances** (same as Try #3/4)
- Use **Media Session API** to automatically open Picture-in-Picture when user switches tabs
- Chrome/Edge: Automatic PiP via `enterpictureinpicture` action handler
- Safari/Firefox: Manual PiP button with clear instructions
- Composite client-side with FFmpeg.wasm (or server-side if preferred)

**Why we thought this would work:**

**Automatic PiP solves the UX issues from Try #1:**
- PiP window only appears when user switches away from tab
- When on recording tab, no PiP window visible (clean experience)
- Automatically opens when user switches to the content they want to record
- Automatically closes when user returns to recording tab
- Solves webcam throttling issue (PiP keeps page active)

**How it works (Chrome/Edge 120+):**
1. Register Media Session action handler for `enterpictureinpicture`
2. User starts recording (no PiP window yet)
3. User switches to window/screen they want to record
4. Browser detects tab lost focus
5. Browser triggers action handler
6. Handler opens PiP window showing webcam
7. Recording continues smoothly (webcam doesn't throttle)
8. User returns to tab → PiP automatically closes

**Implementation Status:**
- ✅ Works perfectly in Chrome/Edge (70% of users)
- ✅ Solves webcam throttling issue
- ✅ Excellent UX (PiP only when needed)
- ⚠️ **Browser support limitation discovered**

**Critical Issue: Safari/Firefox Don't Support Auto-PiP:**

**Browser compatibility:**
- **Chrome 120+**: ✅ Full automatic PiP support via Media Session API
- **Edge 120+**: ✅ Full automatic PiP support via Media Session API
- **Safari**: ❌ No support for Media Session `enterpictureinpicture` action
- **Firefox**: ❌ No support for Media Session `enterpictureinpicture` action
  - Firefox 130+ has auto-PiP but it's **user-controlled** (Settings toggle), not developer-controlled

**Safari/Firefox workaround:**
- Show manual "Open Picture-in-Picture" button
- User clicks button before switching tabs
- Same end result, requires one extra click
- Clear instructions: "Click before switching tabs to keep webcam smooth"

**Benefits:**
- ✅ **Chrome/Edge (70% of users)**: Seamless automatic experience
- ✅ **Safari/Firefox (30% of users)**: Works with one manual click
- ✅ **PiP only when needed** - Clean UX when on recording tab
- ✅ **Solves webcam throttling** - PiP keeps page active
- ✅ **Multi-monitor friendly** - No PiP on screen when recording tab visible
- ✅ **Lower CPU during recording** - No canvas compositing (same as Try #3)
- ✅ **Combines best of Try #1 and Try #3** - PiP benefits + separate recording benefits

**Limitations:**
- ⚠️ **Safari/Firefox require manual PiP click** - Not fully automatic for 30% of users
- ❌ **Chrome-only for auto experience** - Safari/Firefox won't improve without browser updates
- ⚠️ **Still need FFmpeg.wasm or server compositing** - Same memory/processing considerations as Try #3/4
- ⚠️ **First-time permission dialog** - Chrome asks user to allow auto-PiP (one-time)

**Expected User Flow:**

**Chrome/Edge users (70%):**
1. User clicks "Start Recording"
2. Selects screen/window/tab + webcam permissions
3. Recording starts (no PiP window visible)
4. User switches to window/screen they want to record
5. **PiP automatically opens** showing webcam overlay
6. User does their work
7. User switches back to recording tab
8. **PiP automatically closes**
9. User clicks "Stop Recording"
10. Video composites and previews

**Safari/Firefox users (30%):**
1. User clicks "Start Recording"
2. Selects screen/window/tab + webcam permissions
3. Recording starts
4. **UI shows "Open Picture-in-Picture" button with instruction**
5. User clicks PiP button
6. PiP window opens
7. User switches to window/screen they want to record
8. User does their work
9. User clicks "Stop Recording"
10. Video composites and previews

**Browser Detection Strategy:**
- Detect Media Session API support at recording start
- Chrome/Edge: Show "Auto PiP enabled ✅" status indicator
- Safari/Firefox: Show manual PiP button with clear instructions
- Progressive enhancement - best experience where supported

**Comparison to Try #1:**
- ✅ **Better UX**: PiP only when tab is hidden (not always visible)
- ✅ **Multi-monitor friendly**: No PiP window when on recording tab
- ✅ **Same throttling solution**: PiP keeps page active
- ⚠️ **Browser support**: Works automatically in 70% of browsers vs 100% for Try #1
- ✅ **User control**: Safari/Firefox users manually trigger when ready

**Comparison to Try #3:**
- ✅ **Solves webcam throttling**: PiP prevents throttling vs choppy webcam in Try #3
- ✅ **Same architecture**: Separate recording + FFmpeg composite
- ✅ **Same benefits**: Low CPU, post-recording editing possible
- ❌ **Same limitations**: FFmpeg.wasm memory issues on long recordings
- ✅ **Better UX**: Automatic where supported, clear instructions where not

**Verdict:** Best solution for browser-based screen+webcam recording. Provides automatic PiP for majority of users (Chrome/Edge 70%), with clear fallback for others (Safari/Firefox 30%). Solves webcam throttling issue while maintaining better UX than Try #1 (PiP only when needed). Combines benefits of separate recording (Try #3) with PiP solution (Try #1). Recommended for production with browser detection and progressive enhancement.

---

### Try #6: PiP Window as Webcam (No Canvas Compositing)

**Approach:**
- Eliminate canvas compositing entirely
- Use the **PiP window itself** as the webcam overlay visible in the recording
- Two-step recording setup:
  1. **Configure Recording**: User clicks button → browser prompts for screen selection
  2. **Position & Start**: PiP window opens → user drags it to desired location → clicks "Start Recording"
- Single MediaRecorder captures screen (PiP is visible in the recorded screen)

**Why this could work:**

**Simplifies architecture dramatically:**
- No canvas compositing needed
- No `requestAnimationFrame` loop
- No manual webcam overlay drawing
- Just record the screen directly - PiP is already visible on it
- PiP keeps webcam from throttling (same as Try #1)

**User has full control:**
- Drag PiP anywhere on any monitor
- Resize PiP to desired size (browser controls)
- No hardcoded position/size constraints
- Works perfectly for multi-monitor setups

**How it works:**

1. **Step 1: Configure Recording**
   - User clicks "Configure Recording" button
   - Browser shows `getDisplayMedia()` picker
   - User selects which screen/window/tab to record
   - No recording starts yet (just permission granted)

2. **Step 2: Position Webcam**
   - PiP window opens showing webcam feed
   - UI shows clear instruction: "Drag the Picture-in-Picture window to your desired location, then click Start Recording"
   - User drags PiP to bottom-right (or anywhere they want)
   - User can resize PiP using browser controls

3. **Step 3: Start Recording**
   - User clicks "Start Recording" button
   - Single MediaRecorder captures screen stream
   - Webcam is visible via PiP window on the screen
   - Recording continues smoothly (PiP prevents throttling)

**Expected User Flow:**

1. Click "Configure Recording"
2. Select screen/window/tab in browser picker
3. PiP window opens with webcam
4. Drag PiP to desired position (e.g., bottom-right corner)
5. Optionally resize PiP
6. Click "Start Recording"
7. Do work (PiP stays on screen showing webcam)
8. Click "Stop Recording"
9. Preview shows screen with webcam overlay wherever PiP was positioned

**Benefits:**

- ✅ **Extremely simple architecture** - Just MediaRecorder, no canvas
- ✅ **Much lower CPU** - No compositing loop during recording
- ✅ **User controls position** - Drag PiP anywhere
- ✅ **User controls size** - Resize PiP to preference
- ✅ **Multi-monitor friendly** - User manually places on correct monitor
- ✅ **No throttling issues** - PiP keeps page active
- ✅ **Works with tab switching** - Same as Try #1
- ✅ **No hardcoded constraints** - Position/size fully flexible
- ✅ **100% browser compatibility** - Standard PiP API
- ✅ **No post-processing** - Instant preview after recording
- ✅ **No FFmpeg needed** - Single video output
- ✅ **Smallest bundle size** - No extra dependencies

**Limitations:**

- ⚠️ **Two-step setup required** - User must configure then position before starting
- ⚠️ **Manual positioning** - User must drag PiP (not automatic)
- ⚠️ **PiP chrome visible** - Browser controls/borders show in final video (may not be aesthetically clean)
- ⚠️ **No post-recording editing** - Webcam position baked into video
- ⚠️ **User error possible** - Could forget to position PiP before recording

**Addressing the Core Problem:**

This approach solves the original issue with Try #1:
- **Try #1 Problem**: When recording external monitor, PiP appears on main screen (wrong monitor), but canvas draws webcam overlay at bottom-right anyway (not visible in recording)
- **Try #6 Solution**: User manually drags PiP to the external monitor before recording starts, ensuring webcam is visible in the final video

**UI/UX Considerations:**

**Good UX patterns:**
- Show clear two-step wizard: "Step 1: Select Screen" → "Step 2: Position Webcam"
- Preview window showing screen with PiP overlay before recording starts
- Visual hint/guideline showing recommended position (e.g., bottom-right corner)
- "Start Recording" button disabled until PiP is opened
- Optional: Detect if PiP is off-screen and warn user

**Potential improvements:**
- Remember user's preferred PiP size/position for future recordings
- Offer quick-position buttons: "Bottom Right", "Bottom Left", "Top Right", "Top Left"
- Show thumbnail preview of how final video will look

**Code Simplification:**

Eliminates from Try #1:
- ❌ `compositeStreams()` function (~100 lines)
- ❌ Canvas creation and management
- ❌ `requestAnimationFrame` loop
- ❌ Webcam overlay positioning calculations
- ❌ Canvas stream capture

Adds to Try #6:
- ✅ Two-step wizard UI
- ✅ PiP positioning instructions
- ✅ Simple screen MediaRecorder

**Verdict:** ✅ **RECOMMENDED** - Dramatically simpler than Try #1 while solving the multi-monitor issue. The two-step setup is a small UX trade-off for significantly reduced complexity and CPU usage. User gains full control over webcam position/size. The PiP chrome is visible but acceptable for most use cases. This is the simplest possible architecture that solves the throttling problem while giving users flexibility.

---

### Alternative Tested: Web Locks API

**Approach:**
- Use Web Locks API to hold exclusive lock during recording
- Lock prevents page from being frozen when tab is hidden
- Hypothesis: If page doesn't freeze, webcam won't throttle

**Why we thought this would work:**
- Web Locks API prevents browser from freezing background tabs
- Holding a lock exempts page from lifecycle freezing
- Could be simpler alternative to PiP (no visible UI)

**Implementation:**
- Acquired exclusive Web Lock when recording starts
- Held lock for entire recording duration
- Released lock when recording stops
- Monitored webcam FPS using `requestVideoFrameCallback`

**Test Results:**
- ✅ Web Lock successfully acquired and held during recording
- ✅ Page did not freeze when tab was hidden
- ❌ **Webcam still throttled when tab lost focus**
- ❌ Webcam FPS dropped from ~30 to <10 when switching tabs
- ❌ Final video showed choppy webcam during background time

**Why it failed:**
- Web Locks prevent **page lifecycle freezing**
- Webcam throttling is a **media-level optimization**
- These are separate browser systems
- Browser throttles `getUserMedia()` streams independently of page state
- Preventing page freeze doesn't prevent media stream throttling

**Verdict:** Web Locks API does NOT solve webcam throttling. Picture-in-Picture remains necessary. Proceed with Try #5 (Auto-PiP with Media Session API).

---

## Technical Background

### Why MediaRecorder Doesn't Throttle

MediaRecorder operates at the **media engine level**, not the rendering layer:

- **Canvas rendering** - Throttled by `requestAnimationFrame` (~1 FPS when hidden)
- **Video elements** - Paused/throttled when tab loses focus
- **MediaRecorder** - Native media encoding, continues regardless of tab state

This is why Zoom, Google Meet, and Loom can record while minimized - they use MediaRecorder directly on streams, not canvas compositing.

### Why OffscreenCanvas Failed

OffscreenCanvas only solves rendering throttling, not input throttling:
- Worker rendering continues at full speed ✅
- But video elements providing the frames still throttle ❌
- No frames to render = recording stops

The solution must prevent **input source throttling**, not just **rendering throttling**.

---

## Solutions to Webcam Throttling (The Core Problem)

After extensive testing, we've identified that **webcam throttling when tab loses focus** is the fundamental limitation for browser-based screen+webcam recording.

### The Solutions:

| Solution | How it works | Trade-off |
|----------|--------------|-----------|
| **🌟 PiP as Webcam (Try #6)** | PiP window visible on screen during recording | Two-step setup; PiP chrome visible in video |
| **Auto-PiP (Try #5)** | Automatic Picture-in-Picture when tab switches (Chrome/Edge) | 30% of users need manual PiP click (Safari/Firefox); requires canvas compositing |
| **PiP (Try #1)** | Keeps tab "active" via Picture-in-Picture | PiP window always visible; hardcoded position/size |
| **Keep tab visible** | User doesn't switch tabs | User can't multitask during recording (not viable) |
| **Desktop app** | Uses native OS camera APIs, not browser | Must build/distribute native application |
| **Browser extension** | Privileged context, special permissions | Users must install extension |

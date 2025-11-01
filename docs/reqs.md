# Loomsly - Requirements Document

## Project Overview

A web-based screen and webcam recording application that allows users to create, store, and share video recordings. Users can capture their screen, webcam, or both simultaneously, with recordings automatically saved to cloud storage and made shareable via unique links.

## Core Features

### Recording Capabilities

**Screen Recording**
- Capture entire screen, specific window, or browser tab
- System audio capture during screen recording
- Microphone audio capture alongside screen recording
- Ability to pause and resume recordings
- Recording time limit controls
- Visual indicators when recording is active

**Webcam Recording**
- Standalone webcam recording mode
- Picture-in-picture webcam overlay during screen recording
- Webcam positioning options (corners, draggable)
- Webcam size adjustment (small, medium, large)
- Ability to show/hide webcam during recording
- Mirror/flip webcam view option

**Recording Controls**
- Start/stop/pause controls
- Countdown timer before recording starts (3-2-1)
- Recording duration display
- Cancel recording option
- Preview before saving
- Re-record functionality

### Storage & Upload

**Video Storage**
- Automatic upload to S3 bucket after recording completion
- Upload progress indicator
- Retry mechanism for failed uploads
- Video file format standardization
- Thumbnail generation for each video
- Metadata storage (duration, resolution, creation date, file size)

**Video Management**
- List of all user recordings
- Video preview thumbnails
- Video title editing
- Video deletion
- Recording date and duration display
- Storage usage tracking

### Sharing & Viewing

**Share Functionality**
- Generate unique shareable link for each video
- Copy link to clipboard
- Shareable link works without authentication
- Optional password protection for videos
- Optional expiration dates for share links
- View count tracking

**Video Player**
- Clean, minimal player interface
- Play/pause controls
- Volume control
- Playback speed adjustment (0.5x, 1x, 1.5x, 2x)
- Fullscreen mode
- Timeline scrubbing
- Keyboard shortcuts (space for play/pause, arrows for skip)

### User Experience

**Recording Interface**
- Clear recording mode selection (screen only, webcam only, both)
- Permission request flows with helpful instructions
- Preview of what will be recorded
- Audio level indicators
- Browser compatibility warnings
- Error handling with clear messaging

**Video Library**
- Grid or list view of recordings
- Search recordings by title
- Sort by date, duration, or title
- Filter recordings
- Bulk actions (delete multiple)

## Security & Privacy

**Access Control**
- User authentication and account management
- Private recordings by default
- Share link access control
- Ability to revoke share links
- Option to make videos completely private (no sharing)

**Data Protection**
- Secure video upload (HTTPS only)
- S3 bucket security configuration
- No public listing of videos
- User data privacy compliance
- Clear privacy policy and terms of use

**Content Security**
- Video ownership tracking
- DMCA compliance mechanisms
- Ability to report inappropriate content
- User consent for screen/camera access

## Technical Requirements

**Browser Support**
- Chrome/Edge (primary support)
- Firefox (full support)
- Safari (best effort support)
- HTTPS required for all recording features
- Modern browser API requirements clearly communicated

**Performance**
- Maximum recording length limits
- Efficient video encoding
- Progress indication for uploads
- Responsive UI during recording and upload
- Handle large file uploads gracefully

**Reliability**
- Auto-save recordings locally before upload
- Recovery from interrupted uploads
- Clear error messages
- Graceful degradation when features unavailable

## User Account Features

**Authentication**
- User registration and login
- Email verification
- Password reset functionality
- Remember me option
- Session management

**User Profile**
- Profile settings
- Storage quota display
- Account upgrade options (if implementing tiers)
- Email notification preferences
- Default recording settings

**Dashboard**
- Overview of total recordings
- Recent recordings
- Storage usage visualization
- Quick record button
- Activity feed

## Limitations & Constraints

**Recording Limits**
- Maximum recording duration (e.g., 5 minutes for free tier)
- Maximum file size limits
- Storage quota per user
- Number of recordings limit

**Browser Limitations**
- Screen recording requires user permission each time
- Some browsers may not support all features
- No background recording
- System audio capture varies by browser/OS

## Success Metrics

**User Engagement**
- Number of recordings created
- Average recording duration
- Share link click-through rate
- Repeat user rate
- Time from sign-up to first recording

**Technical Performance**
- Upload success rate
- Average upload time
- Video playback success rate
- Browser compatibility rate
- Error rate

## Development Phases

### Phase 1: Core Recording MVP
**Goal:** Prove the recording technology works end-to-end

- Basic screen recording (screen only, no webcam)
- Simple start/stop controls
- Save recording to browser (download)
- Basic video preview
- No authentication required
- Single page application

### Phase 2: Cloud Storage & Sharing
**Goal:** Enable saving and sharing recordings

- S3 integration for video storage
- Upload progress indication
- Generate unique shareable links
- Basic video player page
- View any video via share link
- Simple video library (list of recordings in browser state)

### Phase 3: Webcam Integration
**Goal:** Add webcam recording capabilities

- Webcam-only recording mode
- Picture-in-picture webcam during screen recording
- Webcam positioning and sizing
- Combined audio (mic + system)
- Toggle webcam on/off during recording

### Phase 4: User Accounts & Management
**Goal:** Enable persistent user accounts and video management

- User registration and authentication
- Personal video library (persisted to database)
- Video metadata (title, date, duration)
- Edit video titles
- Delete recordings


### Phase 5: Enhanced Recording Features
**Goal:** Improve recording experience

- Users need to be logged in in order to record videos.
- Pause/resume recording
- Countdown before recording starts

### Phase 5.1
- The library page needs to display thumbnails of the video.

### Phase 6: Advanced Sharing & Security
**Goal:** Add sharing controls and security features

- Copy link to clipboard
- Private/public toggle
- View count tracking

### Phase 7: Video Player Enhancements
**Goal:** Improve viewing experience

- Playback speed controls
- Fullscreen mode
- Keyboard shortcuts
- Better timeline scrubbing
- Mobile-responsive player
- Thumbnail previews on timeline hover

### Phase 8: User Experience Polish
**Goal:** Refine overall user experience

- Improved onboarding flow
- Recording tutorials and tips
- Better error handling and messaging
- Browser compatibility warnings
- Storage quota tracking and warnings
- Bulk actions in video library
- Search and filter recordings

### Phase 9: Advanced Features
**Goal:** Differentiate from basic screen recorders

- Video trimming/editing
- Custom video thumbnails
- Recording templates/presets
- Annotation tools during recording
- Transcript generation
- Video analytics (watch time, drop-off points)

### Phase 10: Scale & Optimize
**Goal:** Prepare for production scale

- Video transcoding for compatibility
- CDN integration for faster delivery
- Upload resumability for large files
- Performance optimization
- Monitoring and analytics
- Rate limiting and abuse prevention

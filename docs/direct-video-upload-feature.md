# Video Upload Feature - Requirements

## Overview

Enable users to upload existing video files from their computer (e.g., QuickTime recordings, phone videos, existing MP4 files) in addition to creating recordings through the browser.

## User Story

As a user, I want to upload videos I've already recorded (like QuickTime screen recordings or phone videos) so that I can share them using Loomsly without having to re-record them.

## Feature Requirements

### 1. Dashboard Integration

**Upload Button**
- Add "Upload Video" button on the dashboard/library page
- Position alongside existing "Record Video" button
- Clear visual distinction between upload and record actions
- Accessible from main navigation

### 2. Upload Page/Interface

**File Selection**
- Dedicated upload page at `/upload`
- Drag-and-drop zone for video files
- Click to browse file system (standard file picker)
- Visual feedback when dragging file over drop zone
- Support for single file upload

**Accepted Formats**
- MP4 (.mp4)
- MOV (.mov) - QuickTime recordings
- WebM (.webm)
- AVI (.avi)

**File Validation**
- Check file type/extension
- Validate file is actually a video (not renamed file)
- Enforce maximum file size limit: 2GB
- Show clear error messages for invalid files

### 3. Video Compression

**Automatic Compression**
- All uploaded videos are compressed for optimal web viewing
- Browser-based compression using FFmpeg.wasm
- No server-side processing required

**Compression Strategy**
- Files < 50MB: Upload as-is (already optimized)
- Files ≥ 50MB: Auto-compress before upload
- Target: Comfortable web viewing quality while minimizing file size
- Output format: MP4 (H.264 + AAC)

**Compression Settings**
```
Video Codec: H.264
CRF: 28 (good quality, efficient compression)
Preset: medium (balance speed/compression)
Audio Codec: AAC
Audio Bitrate: 128kbps
Optimization: FastStart enabled (streaming)
```

**Expected Results**
- QuickTime 500MB file → ~60MB compressed
- 90% reduction in file size for high-bitrate recordings
- Maintains visual quality suitable for screen recordings and presentations

### 4. Upload Process Flow

**Step 1: File Selection**
```
User drags/selects video file
↓
Validate file type and size
↓
Show file preview/info (name, size, duration)
```

**Step 2: Video Processing**
```
If file ≥ 50MB:
  → Show "Optimizing video for web..."
  → Display compression progress (0-100%)
  → FFmpeg.wasm compresses in browser
  → Show estimated time remaining

If file < 50MB:
  → Skip compression
  → Proceed to upload
```

**Step 3: Upload to S3**
```
Request pre-signed S3 upload URL
↓
Upload compressed video to S3
↓
Show upload progress (0-100%)
↓
Optionally upload thumbnail
```

**Step 4: Finalization**
```
POST to /api/videos/upload-complete
↓
Save metadata to database
↓
Redirect to video watch page or library
```

### 5. User Interface Requirements

**Upload Page Elements**
- Large drop zone with clear instructions
- File size display for selected file
- Duration display (extracted from video)
- Video preview/thumbnail before upload
- Title input field (default to filename)
- Cancel button at any stage

**Progress Indicators**
- Two-stage progress bar:
  - Stage 1: Compression (if needed)
  - Stage 2: Upload to S3
- Percentage completion
- Estimated time remaining
- Current operation description ("Compressing...", "Uploading...")

**Status Messages**
- "Analyzing video..." (initial file read)
- "Optimizing video for web viewing..." (compression)
- "Uploading... X% complete" (S3 upload)
- "Processing complete!" (success)

**Error Handling**
- File too large (> 2GB): "File exceeds 2GB limit"
- Invalid format: "Please upload a video file (MP4, MOV, WebM, AVI)"
- Compression failed: "Unable to process video. Try a different file."
- Upload failed: "Upload failed. Please try again." with retry button
- Browser memory error: "File too large for browser processing"

### 6. Technical Requirements

**Browser Compatibility**
- Desktop browsers: Chrome, Firefox, Edge, Safari
- Mobile: Skip compression, upload original file (memory constraints)
- Detect mobile devices and disable compression

**Performance Constraints**
- Maximum file size: 2GB original
- Maximum compressed file: 500MB (safety limit)
- Compression timeout: 30 minutes (very long videos)
- Browser memory requirement: ~3x file size in RAM

**FFmpeg.wasm Integration**
- Load FFmpeg on-demand (not on page load)
- Cache FFmpeg library after first load
- Progress event tracking
- Cleanup virtual filesystem after processing

**Metadata Extraction**
- Duration (in seconds)
- Resolution (width x height)
- File size (original and compressed)
- Thumbnail generation (frame at 1 second)

### 7. Database Schema

**Add to videos table:**
```sql
source VARCHAR(20) -- 'recording' or 'upload'
original_filename TEXT -- preserve user's filename
original_file_size BIGINT -- size before compression
compression_ratio DECIMAL -- for analytics
```

### 8. User Experience Details

**Mobile Experience**
- Simplify interface for mobile
- Allow uploads but skip compression (memory limits)
- Show warning: "Large files may take time to upload on mobile"
- Consider file size recommendations

**Desktop Experience**
- Full compression pipeline
- Drag-and-drop support
- Multi-tab warning: "Keep this tab open while processing"
- Show file size savings: "Reduced from 500MB to 60MB"

**Empty State (No File Selected)**
```
┌─────────────────────────────────────┐
│                                     │
│      📁 Drag video here             │
│         or click to browse          │
│                                     │
│   Supports: MP4, MOV, WebM, AVI    │
│   Max size: 2GB                     │
└─────────────────────────────────────┘
```

**Processing State**
```
┌─────────────────────────────────────┐
│  my-recording.mov (500 MB)          │
│                                     │
│  Optimizing for web viewing...      │
│  [████████████────────] 65%         │
│  Estimated: 1m 30s remaining        │
│                                     │
│  This will reduce file size by ~90% │
│  [Cancel]                           │
└─────────────────────────────────────┘
```

### 9. Storage & Quota Considerations

**Storage Tracking**
- Count compressed file size (not original)
- Update user's storage quota
- Show storage savings from compression
- Warn when approaching quota limit

**Quota Limits (Future)**
- Free tier: 10GB total storage
- Premium tier: 100GB+ storage
- Enforce limits before upload starts

### 10. Security & Validation

**Client-Side Validation**
- File extension check
- MIME type verification
- File size check
- Attempt to read video metadata (ensures it's playable)

**Server-Side Validation**
- Validate S3 upload completed
- Verify file exists in S3
- Check file size matches expected
- Ensure user is authenticated

**Content Security**
- No virus/malware scanning (client-side upload limits this risk)
- User owns all uploaded content
- Same sharing/privacy controls as recordings
- Can delete uploaded videos anytime

### 11. Analytics & Monitoring

**Track Metrics**
- Number of uploads vs recordings
- Average compression ratio achieved
- Compression success/failure rate
- Upload completion rate
- Average file sizes (before/after)
- Most common source formats

### 12. Future Enhancements

**Potential Additions**
- Batch upload (multiple files)
- Video trimming before upload
- Custom thumbnail selection
- Background upload (service worker)
- Resumable uploads for large files
- Cloud import (Google Drive, Dropbox)
- Format auto-detection and handling
- Server-side transcoding for huge files

## Success Criteria

- Users can upload QuickTime screen recordings
- Large files (500MB+) compress to <100MB
- Compression completes in reasonable time (<5 min for 500MB)
- Upload success rate >95%
- Clear progress indication throughout
- No browser crashes on typical file sizes
- Compressed videos play smoothly in all browsers

## Dependencies

- FFmpeg.wasm library (@ffmpeg/ffmpeg, @ffmpeg/util)
- Existing S3 upload infrastructure
- Video metadata extraction capability
- Browser File API support

## Implementation Notes

**Why Browser Compression?**
- Zero server costs
- Scales automatically (uses user's CPU)
- No server infrastructure needed
- Matches current architecture (all processing client-side)
- User expects to wait (they're uploading anyway)

**QuickTime Use Case**
- Primary target: Users recording with QuickTime on Mac
- QuickTime creates 500MB files for short recordings
- These compress extremely well (90% reduction)
- Makes uploads faster and saves storage costs

**Fallback Strategy**
- If compression fails: upload original file
- If browser unsupported: upload without compression
- If file too large for browser memory: show error with guidance

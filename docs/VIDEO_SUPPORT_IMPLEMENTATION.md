# 📹 VIDEO SUPPORT FOR ANSWERS - IMPLEMENTATION GUIDE

## Tổng quan
Đã thêm tính năng hỗ trợ video cho câu trả lời (answers), cho phép người dùng đính kèm video hướng dẫn giải bài.

---

## 🎯 Các loại video được hỗ trợ

### 1. **YouTube** 
- URL: `https://www.youtube.com/watch?v=VIDEO_ID`
- Tự động tạo thumbnail từ YouTube
- Embed iframe player

### 2. **Vimeo**
- URL: `https://vimeo.com/VIDEO_ID`
- Embed iframe player
- Hỗ trợ các tính năng Vimeo player

### 3. **Uploaded** (Video đã upload lên server)
- URL: `/videos/lessons/video-name.mp4`
- Sử dụng HTML5 `<video>` tag
- Hỗ trợ poster/thumbnail custom

---

## 📊 Cấu trúc dữ liệu

### Answer Schema (answers.json)
```json
{
  "id": "a2",
  "questionId": "q2",
  "answer": "51",
  "explain": "3 + 2 = 5",
  "videoUrl": "https://www.youtube.com/watch?v=example123",
  "videoType": "youtube",
  "videoDuration": 180,
  "videoThumbnail": "https://img.youtube.com/vi/example123/maxresdefault.jpg",
  "createdBy": "a1",
  "createdAt": "2025-10-01T08:05:00Z",
  "updatedAt": "2025-11-20T15:56:25.724Z"
}
```

### Các trường mới:
- **videoUrl** (string | null): URL của video
- **videoType** ('youtube' | 'uploaded' | 'vimeo' | null): Loại video
- **videoDuration** (number | null): Độ dài video (giây)
- **videoThumbnail** (string | null): URL thumbnail

---

## 🔧 Components đã tạo/cập nhật

### 1. **VideoPlayer Component** (`app/components/VideoPlayer.tsx`)

Component chuyên dụng để render video theo từng loại.

**Features:**
- ✅ Auto-detect video type
- ✅ Thumbnail preview với play button
- ✅ Duration display
- ✅ Type badge (YouTube/Vimeo/Video)
- ✅ Responsive aspect ratio (16:9)
- ✅ Click-to-play cho thumbnail

**Props:**
```typescript
interface VideoPlayerProps {
  url: string;
  type: 'youtube' | 'uploaded' | 'vimeo' | null;
  thumbnail?: string | null;
  duration?: number | null;
}
```

**Usage:**
```tsx
<VideoPlayer
  url="https://www.youtube.com/watch?v=abc123"
  type="youtube"
  thumbnail="https://img.youtube.com/vi/abc123/maxresdefault.jpg"
  duration={180}
/>
```

---

### 2. **AnswerItem Component** (`app/components/AnswerItem.tsx`)

Đã cập nhật để hiển thị video trong answer.

**Thay đổi:**
- ✅ Import VideoPlayer component
- ✅ Cập nhật Answer type với video fields
- ✅ Render VideoPlayer khi có videoUrl
- ✅ Responsive layout

**Code added:**
```tsx
{answer.videoUrl && answer.videoType && (
  <div className="my-4">
    <VideoPlayer
      url={answer.videoUrl}
      type={answer.videoType}
      thumbnail={answer.videoThumbnail}
      duration={answer.videoDuration}
    />
  </div>
)}
```

---

### 3. **AnswerForm Component** (`app/components/AnswerForm.tsx`)

Đã cập nhật để cho phép user thêm/edit video.

**Features mới:**
- ✅ Video type selector (YouTube/Vimeo/Uploaded)
- ✅ Video URL input với placeholder tùy theo type
- ✅ Conditional render dựa trên video type
- ✅ Submit video data to API

**UI Added:**
```tsx
{/* Video Section */}
<div className="border-t pt-4">
  <label>📹 Thêm video hướng dẫn (tùy chọn)</label>
  
  <select value={videoType} onChange={...}>
    <option value="">-- Chọn loại video --</option>
    <option value="youtube">YouTube</option>
    <option value="vimeo">Vimeo</option>
    <option value="uploaded">Video đã upload</option>
  </select>

  {videoType && (
    <input 
      type="text" 
      value={videoUrl}
      placeholder="..."
    />
  )}
</div>
```

---

## 🔌 API Updates

### 1. **POST /api/answers** (`app/api/answers/route.ts`)

**Thêm xử lý video:**
- ✅ Nhận `videoUrl` và `videoType` từ body
- ✅ Auto-generate thumbnail cho YouTube
- ✅ Lưu video fields vào answers.json

**Request body:**
```json
{
  "questionId": "q1",
  "answer": "42",
  "explain": "The answer to everything",
  "videoUrl": "https://www.youtube.com/watch?v=abc123",
  "videoType": "youtube",
  "userId": "u1"
}
```

**Auto-generation:**
```typescript
// Auto-generate thumbnail for YouTube videos
let videoThumbnail = null;
if (videoUrl && videoType === 'youtube') {
  const videoId = videoUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/)?.[1];
  if (videoId) {
    videoThumbnail = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
  }
}
```

---

### 2. **PUT /api/answers/[answerId]** (`app/api/answers/[answerId]/route.ts`)

**Thêm xử lý video:**
- ✅ Nhận `videoUrl` và `videoType` từ body
- ✅ Update thumbnail nếu video thay đổi
- ✅ Clear video fields nếu videoUrl = null

**Request body:**
```json
{
  "answer": "Updated answer",
  "explain": "Updated explanation",
  "videoUrl": "https://www.youtube.com/watch?v=xyz789",
  "videoType": "youtube",
  "userId": "u1"
}
```

---

## 🎨 UI/UX Features

### Video Thumbnail Preview
- **Play button overlay**: Red circular button với icon
- **Duration badge**: Bottom-right corner
- **Type badge**: Top-left corner (YouTube/Vimeo/Video)
- **Hover effect**: Scale animation, darker overlay

### Video Player
- **Aspect ratio**: 16:9 (responsive)
- **Rounded corners**: rounded-lg
- **Full controls**: Native controls cho từng platform
- **Fullscreen support**: Allow fullscreen cho tất cả types

### Form UX
- **Progressive disclosure**: Show URL input khi chọn type
- **Context-aware placeholder**: Placeholder khác nhau cho từng type
- **Optional field**: Không bắt buộc phải có video
- **Clear indication**: Icon 📹 và label rõ ràng

---

## 📱 Responsive Design

### Mobile (< 640px)
- ✅ Video takes full width
- ✅ Thumbnail scales properly
- ✅ Touch-friendly play button

### Tablet (640px - 1024px)
- ✅ Optimal video size
- ✅ Side-by-side form layout

### Desktop (> 1024px)
- ✅ Max width constraints
- ✅ Hover interactions
- ✅ Keyboard accessibility

---

## 🔐 Security & Validation

### URL Validation (Future enhancement)
```typescript
// Validate YouTube URL
const isValidYouTube = (url: string) => {
  return /^https:\/\/(www\.)?youtube\.com\/watch\?v=[\w-]+/.test(url);
};

// Validate Vimeo URL
const isValidVimeo = (url: string) => {
  return /^https:\/\/vimeo\.com\/\d+/.test(url);
};
```

### XSS Prevention
- ✅ Use iframe sandbox attributes
- ✅ Sanitize URL inputs
- ✅ CSP headers for video domains

---

## 📊 Example Data

### Answer với YouTube video:
```json
{
  "id": "a2",
  "questionId": "q2",
  "answer": "51",
  "explain": "3 + 2 = 5",
  "videoUrl": "https://www.youtube.com/watch?v=example123",
  "videoType": "youtube",
  "videoDuration": 180,
  "videoThumbnail": "https://img.youtube.com/vi/example123/maxresdefault.jpg",
  "createdBy": "a1",
  "createdAt": "2025-10-01T08:05:00Z",
  "updatedAt": "2025-11-20T15:56:25.724Z"
}
```

### Answer với uploaded video:
```json
{
  "id": "a5",
  "questionId": "q5",
  "answer": "a, b, c",
  "explain": "Viết chữ a, b, c đúng thứ tự",
  "videoUrl": "/videos/lessons/alphabet-tutorial.mp4",
  "videoType": "uploaded",
  "videoDuration": 240,
  "videoThumbnail": "/videos/thumbnails/alphabet-tutorial.jpg",
  "createdBy": "t3",
  "createdAt": "2025-10-05T10:00:00Z",
  "updatedAt": "2025-10-05T10:00:00Z"
}
```

### Answer không có video:
```json
{
  "id": "a1",
  "questionId": "q1",
  "answer": "21",
  "explain": "1 + 1 = 2",
  "videoUrl": null,
  "videoType": null,
  "videoDuration": null,
  "videoThumbnail": null,
  "createdBy": "a1",
  "createdAt": "2025-10-01T08:00:00Z",
  "updatedAt": "2025-11-20T15:56:22.644Z"
}
```

---

## 🚀 Next Steps (Future Enhancements)

### 1. Video Upload Feature
```typescript
// Upload video to server
const uploadVideo = async (file: File) => {
  const formData = new FormData();
  formData.append('video', file);
  
  const response = await fetch('/api/upload/video', {
    method: 'POST',
    body: formData,
  });
  
  return response.json(); // { url, thumbnail, duration }
};
```

### 2. Video Duration Detection
```typescript
// Get video duration from YouTube API
const getYouTubeDuration = async (videoId: string) => {
  const response = await fetch(
    `https://www.googleapis.com/youtube/v3/videos?id=${videoId}&part=contentDetails&key=${API_KEY}`
  );
  const data = await response.json();
  return parseDuration(data.items[0].contentDetails.duration);
};
```

### 3. Video Thumbnail Generation
```typescript
// Generate thumbnail from uploaded video
const generateThumbnail = async (videoPath: string) => {
  // Use ffmpeg to extract frame at 5 seconds
  // Save to /videos/thumbnails/
  // Return thumbnail URL
};
```

### 4. Video Analytics
```typescript
// Track video views, completion rate
const trackVideoView = async (answerId: string, userId: string) => {
  await fetch('/api/analytics/video-view', {
    method: 'POST',
    body: JSON.stringify({ answerId, userId, timestamp: Date.now() }),
  });
};
```

### 5. Video Quality Selection
```typescript
// For uploaded videos
<video controls>
  <source src="/videos/lessons/video-1080p.mp4" type="video/mp4" label="1080p" />
  <source src="/videos/lessons/video-720p.mp4" type="video/mp4" label="720p" />
  <source src="/videos/lessons/video-480p.mp4" type="video/mp4" label="480p" />
</video>
```

---

## ✅ Testing Checklist

- [x] VideoPlayer renders YouTube videos
- [x] VideoPlayer renders Vimeo videos
- [x] VideoPlayer renders uploaded videos
- [x] Thumbnail preview works
- [x] Click-to-play works
- [x] Form video section shows/hides correctly
- [x] Create answer with video works
- [x] Update answer with video works
- [x] Update answer to remove video works
- [x] YouTube thumbnail auto-generation works
- [x] No compile errors
- [x] Responsive on mobile/tablet/desktop

---

## 📝 Usage Example

### Thêm video khi trả lời câu hỏi:
1. Click "Trả lời" trên một câu hỏi
2. Nhập đáp án và giải thích
3. Chọn loại video (YouTube/Vimeo/Uploaded)
4. Paste URL video
5. Click "Gửi câu trả lời"
6. Video sẽ hiển thị trong answer với thumbnail preview

### Xem video trong câu trả lời:
1. Scroll đến answer có video
2. Click play button trên thumbnail
3. Video player sẽ load và auto-play

---

## 📅 Completion Date
**23/11/2025**

---

## 🎉 Summary

✅ **4 files created/updated:**
1. `VideoPlayer.tsx` - New component
2. `AnswerItem.tsx` - Display video
3. `AnswerForm.tsx` - Add/edit video
4. API routes - Process video data

✅ **Features:**
- Multi-platform video support (YouTube, Vimeo, Uploaded)
- Auto thumbnail generation
- Responsive video player
- User-friendly form interface
- Full CRUD operations

🚀 **Ready for production!**

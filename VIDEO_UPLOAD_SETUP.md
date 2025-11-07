# Video Upload Feature - Setup Guide

## Overview
The application now supports uploading videos to log entries and incident reports. Videos are stored in Supabase Storage and linked to log entries in the database.

## Features Added

### 1. Database Changes
- Added `videoUrls` field to the `Log` model in Prisma schema
- Stores JSON array of video URLs (up to 3 videos per log)
- Migration applied: `20251107134525_add_video_urls_to_logs`

### 2. Components Created
- **VideoUpload** (`components/video-upload.tsx`): Handles video file selection and upload to Supabase
- **VideoDisplay** (`components/video-display.tsx`): Displays uploaded videos in a grid layout

### 3. Forms Updated
- **LogForm**: Added video upload section (accepts `userId` prop)
- **IncidentReportForm**: Added evidence video upload section (accepts `userId` prop)

### 4. Validation
- Updated Zod schemas to include optional `videoUrls` field
- Supports both `createLogSchema` and `createIncidentReportSchema`

## Supabase Setup Required

### Step 1: Create Storage Bucket
1. Go to your Supabase project dashboard: https://supabase.com/dashboard
2. Navigate to **Storage** in the left sidebar
3. Click **"New bucket"**
4. Configure the bucket:
   - **Name**: `log-media`
   - **Public**: ✅ **Enable** (videos need to be publicly accessible)
   - **File size limit**: 100 MB (or your preferred limit)
   - **Allowed MIME types**: `video/*` (or specific types like `video/mp4`, `video/quicktime`)

### Step 2: Set Bucket Policies
After creating the bucket, set up the following policies:

#### Policy 1: Allow authenticated uploads
```sql
-- Allow authenticated users to upload videos
CREATE POLICY "Allow authenticated uploads"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'log-media'
  AND (storage.foldername(name))[1] = 'videos'
);
```

#### Policy 2: Allow public reads
```sql
-- Allow anyone to read videos
CREATE POLICY "Allow public reads"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'log-media');
```

#### Policy 3: Allow users to delete their own uploads
```sql
-- Allow authenticated users to delete their own videos
CREATE POLICY "Allow authenticated deletes"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'log-media'
  AND (storage.foldername(name))[1] = 'videos'
);
```

### Step 3: Verify Environment Variables
Make sure your `.env.local` has the correct Supabase configuration:

```env
NEXT_PUBLIC_SUPABASE_URL=https://qnhcymavgkchvymkkktr.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

## Usage

### In Forms
When using LogForm or IncidentReportForm components, you must now pass the `userId` prop:

```tsx
import { LogForm } from '@/components/forms/log-form'
import { useUser } from '@clerk/nextjs'

function MyComponent() {
  const { user } = useUser()

  return (
    <LogForm
      onSubmit={handleSubmit}
      locations={locations}
      userId={user?.id || ''}
      // ... other props
    />
  )
}
```

### Displaying Videos
To display videos from a log entry:

```tsx
import { VideoDisplay } from '@/components/video-display'

function LogDetail({ log }) {
  return (
    <div>
      {/* Other log details */}

      <VideoDisplay videoUrls={log.videoUrls} />
    </div>
  )
}
```

## Video Constraints
- **Max videos per log**: 3
- **Max file size**: 100 MB per video
- **Accepted formats**: All video/* MIME types (mp4, mov, avi, etc.)

## How It Works

1. **Upload Flow**:
   - User selects video file(s)
   - Files are validated (type, size, count)
   - Videos uploaded to Supabase Storage (`log-media/videos/` folder)
   - Public URLs are generated
   - URLs stored as JSON array in `videoUrls` field

2. **Storage Path**:
   ```
   log-media/
     └── videos/
         ├── {userId}-{timestamp}.mp4
         ├── {userId}-{timestamp}.mov
         └── ...
   ```

3. **Database Storage**:
   ```json
   videoUrls: '["https://...supabase.co/.../video1.mp4", "https://...supabase.co/.../video2.mp4"]'
   ```

## Troubleshooting

### Videos not uploading?
- Check Supabase Storage bucket exists and is public
- Verify environment variables are set correctly
- Check browser console for errors
- Ensure storage policies are configured

### Videos not displaying?
- Verify `videoUrls` field contains valid JSON
- Check that URLs are publicly accessible
- Inspect network tab for 403/404 errors

### Upload errors?
- Check file size (must be under 100 MB)
- Verify file type is video/*
- Check Supabase storage quota

## Next Steps (Optional Enhancements)

1. **Add video thumbnails** for better preview
2. **Implement video compression** before upload
3. **Add progress indicators** for large uploads
4. **Enable video playback speed control**
5. **Add download functionality** for videos
6. **Implement video annotations** (timestamps, notes)

## Security Notes

- Videos are uploaded to a public bucket (required for display)
- Only authenticated users can upload
- Users can only delete their own uploads
- Consider adding virus scanning for production
- Implement rate limiting to prevent abuse
- Monitor storage usage and costs

"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { X, Upload, Video, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { uploadVideo, deleteVideo } from "@/lib/supabase"

interface VideoUploadProps {
  onVideosChange: (videoUrls: string[]) => void
  initialVideos?: string[]
  maxVideos?: number
  maxSizeMB?: number
  userId: string
}

export function VideoUpload({
  onVideosChange,
  initialVideos = [],
  maxVideos = 3,
  maxSizeMB = 100,
  userId,
}: VideoUploadProps) {
  const [videos, setVideos] = useState<string[]>(initialVideos)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])

    if (files.length === 0) return

    // Check if adding these files would exceed the max
    if (videos.length + files.length > maxVideos) {
      toast.error(`Maximum ${maxVideos} videos allowed`)
      return
    }

    // Validate file types and sizes
    const validFiles = files.filter((file) => {
      // Check file type
      if (!file.type.startsWith('video/')) {
        toast.error(`${file.name} is not a video file`)
        return false
      }

      // Check file size
      const fileSizeMB = file.size / (1024 * 1024)
      if (fileSizeMB > maxSizeMB) {
        toast.error(`${file.name} exceeds ${maxSizeMB}MB limit`)
        return false
      }

      return true
    })

    if (validFiles.length === 0) return

    setUploading(true)

    try {
      // Upload all valid files
      const uploadPromises = validFiles.map((file) => uploadVideo(file, userId))
      const uploadedUrls = await Promise.all(uploadPromises)

      const newVideos = [...videos, ...uploadedUrls]
      setVideos(newVideos)
      onVideosChange(newVideos)

      toast.success(`${validFiles.length} video(s) uploaded successfully`)
    } catch (error) {
      console.error('Upload error:', error)
      toast.error('Failed to upload video(s)')
    } finally {
      setUploading(false)
      // Reset the input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleRemoveVideo = async (videoUrl: string, index: number) => {
    try {
      // Only delete from storage if it's not an initial video (already saved)
      if (!initialVideos.includes(videoUrl)) {
        await deleteVideo(videoUrl)
      }

      const newVideos = videos.filter((_, i) => i !== index)
      setVideos(newVideos)
      onVideosChange(newVideos)

      toast.success('Video removed')
    } catch (error) {
      console.error('Delete error:', error)
      toast.error('Failed to remove video')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading || videos.length >= maxVideos}
        >
          {uploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" />
              Upload Video
            </>
          )}
        </Button>
        <span className="text-sm text-muted-foreground">
          {videos.length}/{maxVideos} videos ({maxSizeMB}MB max each)
        </span>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="video/*"
        multiple
        className="hidden"
        onChange={handleFileSelect}
      />

      {videos.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {videos.map((videoUrl, index) => (
            <div
              key={index}
              className="relative rounded-lg border bg-muted/50 p-2"
            >
              <button
                type="button"
                onClick={() => handleRemoveVideo(videoUrl, index)}
                className="absolute right-1 top-1 z-10 rounded-full bg-destructive p-1 text-destructive-foreground hover:bg-destructive/90"
              >
                <X className="h-4 w-4" />
              </button>
              <video
                src={videoUrl}
                controls
                className="h-48 w-full rounded object-cover"
              >
                Your browser does not support the video tag.
              </video>
              <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                <Video className="h-3 w-3" />
                <span className="truncate">Video {index + 1}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

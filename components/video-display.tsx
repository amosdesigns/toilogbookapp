"use client"

import { Video } from "lucide-react"

interface VideoDisplayProps {
  videoUrls: string | string[] | null | undefined
  className?: string
}

export function VideoDisplay({ videoUrls, className = "" }: VideoDisplayProps) {
  // Parse the video URLs if it's a JSON string
  let videos: string[] = []

  if (typeof videoUrls === "string") {
    try {
      const parsed = JSON.parse(videoUrls)
      videos = Array.isArray(parsed) ? parsed : [videoUrls]
    } catch {
      // If it's not JSON, treat it as a single URL
      videos = [videoUrls]
    }
  } else if (Array.isArray(videoUrls)) {
    videos = videoUrls
  }

  // Filter out empty or invalid URLs
  videos = videos.filter((url) => url && url.trim().length > 0)

  if (videos.length === 0) {
    return null
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center gap-2 text-sm font-medium">
        <Video className="h-4 w-4" />
        <span>Attached Videos ({videos.length})</span>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {videos.map((videoUrl, index) => (
          <div
            key={index}
            className="rounded-lg border bg-muted/50 p-2"
          >
            <video
              src={videoUrl}
              controls
              className="h-48 w-full rounded object-cover"
              preload="metadata"
            >
              Your browser does not support the video tag.
            </video>
            <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
              <span>Video {index + 1}</span>
              <a
                href={videoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Open in new tab
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase URL or Anon Key is missing. File uploads will not work.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Helper function to upload video
export async function uploadVideo(file: File, userId: string): Promise<string> {
  const fileExt = file.name.split('.').pop()
  const fileName = `${userId}-${Date.now()}.${fileExt}`
  const filePath = `videos/${fileName}`

  const { data, error } = await supabase.storage
    .from('log-media')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
    })

  if (error) {
    throw new Error(`Upload failed: ${error.message}`)
  }

  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from('log-media')
    .getPublicUrl(data.path)

  return publicUrl
}

// Helper function to delete video
export async function deleteVideo(videoUrl: string): Promise<void> {
  // Extract path from public URL
  const path = videoUrl.split('/storage/v1/object/public/log-media/')[1]

  if (!path) {
    throw new Error('Invalid video URL')
  }

  const { error } = await supabase.storage
    .from('log-media')
    .remove([path])

  if (error) {
    throw new Error(`Delete failed: ${error.message}`)
  }
}

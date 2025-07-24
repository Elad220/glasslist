import { supabase } from './client'

const BUCKET_NAME = 'shopping-list-images'

export interface UploadResult {
  success: boolean
  url?: string
  error?: string
}

/**
 * Upload an image file to Supabase Storage
 */
export async function uploadItemImage(file: File, itemId: string): Promise<UploadResult> {
  try {
    if (!supabase) {
      return { success: false, error: 'Storage service not available' }
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return { success: false, error: 'Please select an image file' }
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return { success: false, error: 'Image must be smaller than 5MB' }
    }

    // Generate unique filename
    const fileExt = file.name.split('.').pop()
    const timestamp = Date.now()
    const fileName = `${itemId}_${timestamp}.${fileExt}`

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (error) {
      console.error('Storage upload error:', error)
      return { success: false, error: 'Failed to upload image' }
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(fileName)

    return {
      success: true,
      url: urlData.publicUrl
    }
  } catch (error) {
    console.error('Upload error:', error)
    return { success: false, error: 'Failed to upload image' }
  }
}

/**
 * Delete an image from Supabase Storage
 */
export async function deleteItemImage(imageUrl: string): Promise<boolean> {
  try {
    if (!supabase) {
      return false
    }

    // Extract filename from URL
    const urlParts = imageUrl.split('/')
    const fileName = urlParts[urlParts.length - 1]

    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([fileName])

    if (error) {
      console.error('Storage delete error:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Delete error:', error)
    return false
  }
}

/**
 * Get optimized image URL with transformations
 */
export function getOptimizedImageUrl(imageUrl: string, width = 400, height = 300): string {
  if (!imageUrl) return ''
  
  // For Supabase Storage, you can add transformation parameters
  const url = new URL(imageUrl)
  url.searchParams.set('width', width.toString())
  url.searchParams.set('height', height.toString())
  url.searchParams.set('resize', 'cover')
  url.searchParams.set('format', 'webp')
  
  return url.toString()
}

/**
 * Create a preview URL for a File object
 */
export function createImagePreview(file: File): string {
  return URL.createObjectURL(file)
}

/**
 * Clean up preview URL
 */
export function revokeImagePreview(url: string): void {
  URL.revokeObjectURL(url)
} 
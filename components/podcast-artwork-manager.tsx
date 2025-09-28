"use client"

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ImageIcon, UploadIcon, RefreshCwIcon, CheckIcon } from '@radix-ui/react-icons'
import { toast } from 'sonner'
import Image from 'next/image'

interface PodcastArtworkManagerProps {
  podcastId: string
  podcastTitle: string
  currentArtwork?: string
  onArtworkUpdate?: (url: string) => void
}

export function PodcastArtworkManager({ 
  podcastId, 
  podcastTitle, 
  currentArtwork, 
  onArtworkUpdate 
}: PodcastArtworkManagerProps) {
  const [artwork, setArtwork] = useState(currentArtwork)
  const [uploading, setUploading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [generatedOptions, setGeneratedOptions] = useState<string[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file')
      return
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      toast.error('File size must be less than 5MB')
      return
    }

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', 'podcast-artwork')
      formData.append('entityId', podcastId)

      const response = await fetch('/api/media/upload', {
        method: 'POST',
        body: formData
      })

      if (response.ok) {
        const data = await response.json()
        setArtwork(data.url)
        onArtworkUpdate?.(data.url)
        toast.success('Artwork uploaded successfully!')
      } else {
        const error = await response.json()
        toast.error(error.message || 'Upload failed')
      }
    } catch (error) {
      console.error('Upload error:', error)
      toast.error('Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const generateArtwork = async () => {
    setGenerating(true)
    try {
      const response = await fetch('/api/media/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type: 'podcast-avatar',
          data: {
            id: podcastId,
            title: podcastTitle
          }
        })
      })

      if (response.ok) {
        const data = await response.json()
        
        // Generate multiple options
        const options = []
        for (let i = 0; i < 3; i++) {
          const seed = `${podcastId}-${i}`
          const colors = ['FF6B6B', '4ECDC4', '45B7D1', '96CEB4', 'FFEAA7']
          const color = colors[i % colors.length]
          options.push(`https://api.dicebear.com/7.x/shapes/svg?seed=${seed}&backgroundColor=${color}`)
        }
        
        setGeneratedOptions(options)
        toast.success('Artwork options generated!')
      } else {
        const error = await response.json()
        toast.error(error.message || 'Generation failed')
      }
    } catch (error) {
      console.error('Generation error:', error)
      toast.error('Generation failed')
    } finally {
      setGenerating(false)
    }
  }

  const selectGenerated = (url: string) => {
    setArtwork(url)
    onArtworkUpdate?.(url)
    setGeneratedOptions([])
    toast.success('Artwork selected!')
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ImageIcon className="w-5 h-5" />
          Podcast Artwork
        </CardTitle>
        <CardDescription>
          Upload custom artwork or generate AI-powered designs for your podcast
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Artwork */}
        <div className="text-center">
          <div className="w-48 h-48 mx-auto mb-4 border-2 border-dashed border-muted-foreground/25 rounded-lg flex items-center justify-center overflow-hidden bg-muted/10">
            {artwork ? (
              <Image
                src={artwork}
                alt="Podcast artwork"
                width={192}
                height={192}
                className="w-full h-full object-cover rounded-lg"
              />
            ) : (
              <div className="text-center">
                <ImageIcon className="w-12 h-12 mx-auto text-muted-foreground/50 mb-2" />
                <p className="text-sm text-muted-foreground">No artwork yet</p>
              </div>
            )}
          </div>
          
          {artwork && (
            <Badge variant="outline" className="mb-4">
              Current Artwork
            </Badge>
          )}
        </div>

        {/* Upload Section */}
        <div className="space-y-4">
          <div className="flex gap-2">
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="flex-1"
            >
              <UploadIcon className="w-4 h-4 mr-2" />
              {uploading ? 'Uploading...' : 'Upload Custom'}
            </Button>
            
            <Button
              onClick={generateArtwork}
              disabled={generating}
              variant="outline"
              className="flex-1"
            >
              <RefreshCwIcon className={`w-4 h-4 mr-2 ${generating ? 'animate-spin' : ''}`} />
              {generating ? 'Generating...' : 'Generate AI'}
            </Button>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            className="hidden"
          />
        </div>

        {/* Generated Options */}
        {generatedOptions.length > 0 && (
          <div className="space-y-4">
            <div className="text-center">
              <h4 className="font-medium mb-2">Choose a Generated Design</h4>
              <p className="text-sm text-muted-foreground">Click on any design to select it</p>
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              {generatedOptions.map((option, index) => (
                <div
                  key={index}
                  className="relative cursor-pointer group"
                  onClick={() => selectGenerated(option)}
                >
                  <div className="w-full aspect-square border-2 border-muted-foreground/25 rounded-lg overflow-hidden group-hover:border-primary transition-colors">
                    <Image
                      src={option}
                      alt={`Generated option ${index + 1}`}
                      width={120}
                      height={120}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 rounded-lg transition-colors flex items-center justify-center">
                    <CheckIcon className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Guidelines */}
        <div className="text-xs text-muted-foreground space-y-1">
          <p>• Recommended size: 1400x1400 pixels or larger</p>
          <p>• Supported formats: JPG, PNG, GIF, WebP</p>
          <p>• Maximum file size: 5MB</p>
          <p>• Square aspect ratio works best for most platforms</p>
        </div>
      </CardContent>
    </Card>
  )
}
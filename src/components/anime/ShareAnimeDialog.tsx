'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Share2, Copy, Check, MessageCircle, Globe } from 'lucide-react'

interface ShareAnimeDialogProps {
  isOpen: boolean
  onClose: () => void
  animeId: number
  animeTitle: string
}

export function ShareAnimeDialog({ isOpen, onClose, animeId, animeTitle }: ShareAnimeDialogProps) {
  const [copied, setCopied] = useState(false)

  const shareUrl = typeof window !== 'undefined' ? `${window.location.origin}/anime/${animeId}` : ''
  const shareText = `Посмотри это аниме: ${animeTitle}`

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

  const shareOnTwitter = () => {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  const shareOnFacebook = () => {
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  const shareNative = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: animeTitle,
          text: shareText,
          url: shareUrl,
        })
      } catch (error) {
        console.error('Error sharing:', error)
      }
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5 text-purple-400" />
            Поделиться
          </DialogTitle>
          <DialogDescription>
            Поделитесь ссылкой на &quot;{animeTitle}&quot; с друзьями
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* URL Copy */}
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <input
                type="text"
                value={shareUrl}
                readOnly
                className="w-full h-9 px-3.5 pr-10 text-sm bg-white/[0.02] border border-border/40 rounded-xl text-foreground/80 outline-none focus-visible:border-purple-500/40 focus-visible:ring-3 focus-visible:ring-purple-500/10 transition-all"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={copyToClipboard}
              className="h-9 px-3 border-border/40 hover:border-purple-500/30"
            >
              {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>

          {/* Share Buttons */}
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              onClick={shareNative}
              className="border-border/40 hover:border-purple-500/30 hover:bg-purple-500/5 gap-2"
            >
              <Share2 className="h-4 w-4" />
              Поделиться
            </Button>
            <Button
              variant="outline"
              onClick={shareOnTwitter}
              className="border-border/40 hover:border-sky-500/30 hover:bg-sky-500/5 gap-2"
            >
              <MessageCircle className="h-4 w-4" />
              X (Twitter)
            </Button>
            <Button
              variant="outline"
              onClick={shareOnFacebook}
              className="border-border/40 hover:border-blue-500/30 hover:bg-blue-500/5 gap-2"
            >
              <Globe className="h-4 w-4" />
              Facebook
            </Button>
            <Button
              variant="outline"
              onClick={copyToClipboard}
              className="border-border/40 hover:border-purple-500/30 hover:bg-purple-500/5 gap-2"
            >
              {copied ? (
                <><Check className="h-4 w-4 text-emerald-400" /> Скопировано</>
              ) : (
                <><Copy className="h-4 w-4" /> Копировать</>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

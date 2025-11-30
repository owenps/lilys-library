import { useState, useEffect } from 'react'
import { Palette, RotateCcw, Wand2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { useUpdateBook } from '@/hooks/useBooks'
import {
  extractSpineColor,
  hashStringToColor,
  rgbToHex,
  hexToRgb,
  darkenColor,
  lightenColor,
} from '@/lib/color-extraction'
import { toast } from 'sonner'

interface SpineColorPickerProps {
  bookId: string
  bookTitle: string
  currentColor?: string | null
  coverUrl?: string | null
}

export function SpineColorPicker({
  bookId,
  bookTitle,
  currentColor,
  coverUrl,
}: SpineColorPickerProps) {
  const updateBook = useUpdateBook()
  const [isExtracting, setIsExtracting] = useState(false)

  // Determine the display color
  const displayColor = currentColor || hashStringToColor(bookTitle)
  const [localColor, setLocalColor] = useState(displayColor)

  // Update local color when currentColor changes
  useEffect(() => {
    setLocalColor(currentColor || hashStringToColor(bookTitle))
  }, [currentColor, bookTitle])

  const handleColorChange = async (hexColor: string) => {
    const rgbColor = hexToRgb(hexColor)
    setLocalColor(rgbColor)

    try {
      await updateBook.mutateAsync({
        id: bookId,
        spine_color: rgbColor,
      })
      toast.success('Spine color updated')
    } catch {
      toast.error('Failed to update color')
    }
  }

  const handleAutoExtract = async () => {
    if (!coverUrl) return

    setIsExtracting(true)
    try {
      const extracted = await extractSpineColor(coverUrl)
      if (extracted) {
        setLocalColor(extracted)
        await updateBook.mutateAsync({
          id: bookId,
          spine_color: extracted,
        })
        toast.success('Color extracted from cover')
      } else {
        toast.error('Could not extract color from cover')
      }
    } catch {
      toast.error('Failed to extract color')
    } finally {
      setIsExtracting(false)
    }
  }

  const handleReset = async () => {
    try {
      await updateBook.mutateAsync({
        id: bookId,
        spine_color: null,
      })
      setLocalColor(hashStringToColor(bookTitle))
      toast.success('Reset to default color')
    } catch {
      toast.error('Failed to reset color')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Palette className="h-4 w-4 text-muted-foreground" />
        <Label>Spine Color</Label>
      </div>

      {/* Color preview with gradient like actual spine */}
      <div className="flex items-center gap-4">
        <div
          className="w-12 h-24 rounded-sm shadow-md overflow-hidden relative"
          style={{
            background: `linear-gradient(to bottom, ${lightenColor(localColor, 0.1)}, ${darkenColor(localColor, 0.15)})`,
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-white/10 via-transparent to-black/20" />
          <div className="absolute top-2 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-amber-400/50 to-transparent" />
          <div className="absolute bottom-2 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-amber-400/50 to-transparent" />
        </div>

        <div className="flex-1 space-y-2">
          <p className="text-sm text-muted-foreground font-mono">
            {localColor}
          </p>
          <p className="text-xs text-muted-foreground">
            {currentColor ? 'Custom color' : 'Auto-generated'}
          </p>
        </div>
      </div>

      {/* Color picker and actions */}
      <div className="flex flex-wrap gap-2">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
            >
              <div
                className="w-4 h-4 rounded-sm border"
                style={{ backgroundColor: localColor }}
              />
              Pick color
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-3" align="start">
            <input
              type="color"
              value={rgbToHex(localColor)}
              onChange={(e) => handleColorChange(e.target.value)}
              className="w-32 h-32 rounded cursor-pointer border-0 p-0"
              title="Pick a color"
            />
          </PopoverContent>
        </Popover>

        {coverUrl && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleAutoExtract}
            disabled={isExtracting || updateBook.isPending}
            className="gap-2"
          >
            <Wand2 className="h-4 w-4" />
            {isExtracting ? 'Extracting...' : 'Extract from cover'}
          </Button>
        )}

        {currentColor && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleReset}
            disabled={updateBook.isPending}
            className="gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            Reset
          </Button>
        )}
      </div>
    </div>
  )
}

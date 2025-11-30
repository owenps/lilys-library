/**
 * Color extraction utilities for book spine colors
 */

// Extract dominant colors from an image using canvas
async function extractColors(imageUrl: string): Promise<string[]> {
  return new Promise((resolve) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'

    const timeout = setTimeout(() => {
      resolve([])
    }, 5000) // 5 second timeout

    img.onload = () => {
      clearTimeout(timeout)
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        resolve([])
        return
      }

      // Scale down for performance
      const scale = 50 / Math.max(img.width, img.height)
      canvas.width = img.width * scale
      canvas.height = img.height * scale

      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

      try {
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
        const colors = extractDominantColors(imageData.data)
        resolve(colors)
      } catch {
        resolve([])
      }
    }

    img.onerror = () => {
      clearTimeout(timeout)
      resolve([])
    }
    img.src = imageUrl
  })
}

function extractDominantColors(data: Uint8ClampedArray): string[] {
  const colorCounts: Record<string, number> = {}

  // Sample every 4th pixel for performance
  for (let i = 0; i < data.length; i += 16) {
    const r = Math.round(data[i] / 32) * 32
    const g = Math.round(data[i + 1] / 32) * 32
    const b = Math.round(data[i + 2] / 32) * 32

    // Skip very dark or very light colors
    const brightness = (r + g + b) / 3
    if (brightness < 30 || brightness > 225) continue

    const key = `${r},${g},${b}`
    colorCounts[key] = (colorCounts[key] || 0) + 1
  }

  return Object.entries(colorCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([color]) => {
      const [r, g, b] = color.split(',').map(Number)
      return `rgb(${r}, ${g}, ${b})`
    })
}

/**
 * Extract the most dominant color from an image for spine coloring
 * Returns null if extraction fails
 */
export async function extractSpineColor(imageUrl: string): Promise<string | null> {
  try {
    const colors = await extractColors(imageUrl)
    return colors.length > 0 ? colors[0] : null
  } catch {
    return null
  }
}

/**
 * Generate a deterministic color based on a string (for books without covers)
 */
export function hashStringToColor(str: string): string {
  const colors = [
    'rgb(185, 28, 28)',   // red-700
    'rgb(29, 78, 216)',   // blue-700
    'rgb(4, 120, 87)',    // emerald-700
    'rgb(126, 34, 206)',  // purple-700
    'rgb(180, 83, 9)',    // amber-700
    'rgb(15, 118, 110)',  // teal-700
    'rgb(190, 24, 93)',   // pink-700
    'rgb(67, 56, 202)',   // indigo-700
    'rgb(234, 88, 12)',   // orange-600
    'rgb(14, 116, 144)',  // cyan-700
  ]
  const hash = str.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  return colors[hash % colors.length]
}

/**
 * Convert RGB string to hex for color picker
 */
export function rgbToHex(rgb: string): string {
  const match = rgb.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/)
  if (!match) return '#808080'

  const r = parseInt(match[1])
  const g = parseInt(match[2])
  const b = parseInt(match[3])

  return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('')
}

/**
 * Convert hex to RGB string
 */
export function hexToRgb(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (!result) return 'rgb(128, 128, 128)'

  return `rgb(${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)})`
}

/**
 * Darken an RGB color
 */
export function darkenColor(rgb: string, amount: number = 0.15): string {
  const match = rgb.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/)
  if (!match) return rgb

  const r = Math.max(0, Math.round(parseInt(match[1]) * (1 - amount)))
  const g = Math.max(0, Math.round(parseInt(match[2]) * (1 - amount)))
  const b = Math.max(0, Math.round(parseInt(match[3]) * (1 - amount)))

  return `rgb(${r}, ${g}, ${b})`
}

/**
 * Lighten an RGB color
 */
export function lightenColor(rgb: string, amount: number = 0.15): string {
  const match = rgb.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/)
  if (!match) return rgb

  const r = Math.min(255, Math.round(parseInt(match[1]) + (255 - parseInt(match[1])) * amount))
  const g = Math.min(255, Math.round(parseInt(match[2]) + (255 - parseInt(match[2])) * amount))
  const b = Math.min(255, Math.round(parseInt(match[3]) + (255 - parseInt(match[3])) * amount))

  return `rgb(${r}, ${g}, ${b})`
}

/**
 * Check if a color is bright (for determining text color contrast)
 */
export function isColorBright(rgb: string): boolean {
  const match = rgb.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/)
  if (!match) return false

  const r = parseInt(match[1])
  const g = parseInt(match[2])
  const b = parseInt(match[3])

  // Using relative luminance formula
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luminance > 0.5
}

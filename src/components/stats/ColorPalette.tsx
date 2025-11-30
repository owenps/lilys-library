import { useEffect, useState } from "react";

interface ColorPaletteProps {
  coverUrls: string[];
}

// Extract dominant colors from an image using canvas
async function extractColors(imageUrl: string): Promise<string[]> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";

    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve([]);
        return;
      }

      // Scale down for performance
      const scale = 50 / Math.max(img.width, img.height);
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;

      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      try {
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const colors = extractDominantColors(imageData.data);
        resolve(colors);
      } catch {
        resolve([]);
      }
    };

    img.onerror = () => resolve([]);
    img.src = imageUrl;
  });
}

function extractDominantColors(data: Uint8ClampedArray): string[] {
  const colorCounts: Record<string, number> = {};

  // Sample every 4th pixel for performance
  for (let i = 0; i < data.length; i += 16) {
    const r = Math.round(data[i] / 32) * 32;
    const g = Math.round(data[i + 1] / 32) * 32;
    const b = Math.round(data[i + 2] / 32) * 32;

    // Skip very dark or very light colors
    const brightness = (r + g + b) / 3;
    if (brightness < 30 || brightness > 225) continue;

    const key = `${r},${g},${b}`;
    colorCounts[key] = (colorCounts[key] || 0) + 1;
  }

  return Object.entries(colorCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([color]) => {
      const [r, g, b] = color.split(",").map(Number);
      return `rgb(${r}, ${g}, ${b})`;
    });
}

export function ColorPalette({ coverUrls }: ColorPaletteProps) {
  const [colors, setColors] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadColors() {
      setIsLoading(true);
      const allColors: string[] = [];

      // Extract colors from first 10 covers
      const promises = coverUrls.slice(0, 10).map(async (url) => {
        const extracted = await extractColors(url);
        return extracted;
      });

      const results = await Promise.all(promises);
      results.forEach((colors) => allColors.push(...colors));

      // Count color frequencies and get unique ones
      const colorCounts: Record<string, number> = {};
      allColors.forEach((color) => {
        colorCounts[color] = (colorCounts[color] || 0) + 1;
      });

      const uniqueColors = Object.entries(colorCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 12)
        .map(([color]) => color);

      setColors(uniqueColors);
      setIsLoading(false);
    }

    if (coverUrls.length > 0) {
      loadColors();
    } else {
      setIsLoading(false);
    }
  }, [coverUrls]);

  if (isLoading) {
    return (
      <div className="flex gap-2 animate-pulse">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-16 flex-1 rounded bg-muted" />
        ))}
      </div>
    );
  }

  if (colors.length === 0) {
    return (
      <div className="text-center py-4 text-muted-foreground">
        <p>Add books with covers to generate your colour palette!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2 h-24 rounded-lg overflow-hidden">
        {colors.map((color, i) => (
          <div
            key={i}
            className="flex-1 transition-all hover:flex-[2]"
            style={{ backgroundColor: color }}
            title={color}
          />
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        {colors.slice(0, 8).map((color, i) => (
          <div
            key={i}
            className="flex items-center gap-2 px-2 py-1 rounded-full bg-muted text-xs"
          >
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: color }}
            />
            <span className="text-muted-foreground">{color}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

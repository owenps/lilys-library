import { cn } from '@/lib/utils'

interface GenreChartProps {
  genres: Record<string, number>
}

const genreColors = [
  'bg-red-500',
  'bg-blue-500',
  'bg-green-500',
  'bg-yellow-500',
  'bg-purple-500',
  'bg-pink-500',
  'bg-indigo-500',
  'bg-teal-500',
  'bg-orange-500',
  'bg-cyan-500',
]

export function GenreChart({ genres }: GenreChartProps) {
  const sortedGenres = Object.entries(genres)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 8)

  const total = sortedGenres.reduce((sum, [, count]) => sum + count, 0)

  if (sortedGenres.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>No genre data yet.</p>
        <p className="text-sm mt-1">Add genres to your books to see distribution!</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {sortedGenres.map(([genre, count], i) => {
        const percentage = Math.round((count / total) * 100)
        return (
          <div key={genre} className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="truncate">{genre}</span>
              <span className="text-muted-foreground ml-2">
                {count} ({percentage}%)
              </span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className={cn('h-full rounded-full transition-all', genreColors[i % genreColors.length])}
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}

import { Link } from 'react-router-dom'
import { BookOpen } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  isColorBright,
  darkenColor,
  lightenColor,
  hashStringToColor,
} from '@/lib/color-extraction'
import type { BookWithDetails } from '@/types/database'

interface BookSpineProps {
  book: BookWithDetails
}

export function BookSpine({ book }: BookSpineProps) {
  const spineColor = book.spine_color || hashStringToColor(book.title)
  const isBright = isColorBright(spineColor)
  const textColorClass = isBright ? 'text-gray-900' : 'text-white'

  // Vary height based on page count for visual interest (44-64px range)
  const pageCount = book.page_count || 200
  const spineHeight = Math.min(Math.max(40 + pageCount / 50, 44), 64)

  return (
    <Link to={`/book/${book.id}`} className="block group">
      <div style={{ perspective: '1000px' }}>
        <div
          className={cn(
            'relative flex items-center gap-4 px-4 rounded-sm',
            'transform-gpu transition-all duration-200 ease-out',
            'group-hover:-translate-y-1'
          )}
          style={{
            height: `${spineHeight}px`,
            background: `linear-gradient(180deg,
              ${lightenColor(spineColor, 0.15)} 0%,
              ${spineColor} 20%,
              ${spineColor} 80%,
              ${darkenColor(spineColor, 0.25)} 100%)`,
            boxShadow: `
              0 4px 6px -1px rgba(0, 0, 0, 0.1),
              0 2px 4px -1px rgba(0, 0, 0, 0.06),
              inset 0 1px 0 ${lightenColor(spineColor, 0.3)},
              inset 0 -2px 0 ${darkenColor(spineColor, 0.3)}
            `,
            transform: 'rotateX(-8deg)',
            transformOrigin: 'center bottom',
          }}
        >
          {/* Author (left side) */}
          <span
            className={cn(
              'text-xs font-medium truncate w-1/4 min-w-[80px] opacity-90',
              textColorClass
            )}
          >
            {book.author}
          </span>

          {/* Title (center) */}
          <span
            className={cn(
              'flex-1 text-center text-sm font-semibold truncate px-2',
              textColorClass
            )}
          >
            {book.title}
          </span>

          {/* Publisher logo (right side) */}
          <BookOpen className={cn('h-4 w-4 flex-shrink-0 opacity-60', textColorClass)} />

          {/* Page edge highlight (right side) */}
          <div
            className="absolute right-0 top-0 bottom-0 w-[3px] rounded-r-sm"
            style={{
              background:
                'linear-gradient(180deg, #faf8f0 0%, #e8e4d4 50%, #d4d0c4 100%)',
            }}
          />
        </div>
      </div>
    </Link>
  )
}

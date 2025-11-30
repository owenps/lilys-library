import { Link } from 'react-router-dom'
import { Star, BookOpen, CheckCircle, Clock, Heart, ChevronRight } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import type { BookWithDetails, ReadingStatus } from '@/types/database'

interface BookListProps {
  books: BookWithDetails[]
}

const statusConfig: Record<ReadingStatus, { label: string; icon: typeof BookOpen; className: string }> = {
  reading: { label: 'Reading', icon: BookOpen, className: 'bg-blue-500/10 text-blue-500' },
  completed: { label: 'Completed', icon: CheckCircle, className: 'bg-green-500/10 text-green-500' },
  want_to_read: { label: 'Want to Read', icon: Clock, className: 'bg-orange-500/10 text-orange-500' },
  wishlist: { label: 'Wishlist', icon: Heart, className: 'bg-pink-500/10 text-pink-500' },
}

export function BookList({ books }: BookListProps) {
  return (
    <div className="space-y-2">
      {books.map((book) => {
        const status = book.user_book?.status || 'want_to_read'
        const statusInfo = statusConfig[status]
        const StatusIcon = statusInfo.icon
        const progress = book.page_count && book.user_book?.current_page
          ? Math.round((book.user_book.current_page / book.page_count) * 100)
          : 0

        // Get latest rating from reading sessions (sorted by read_number desc)
        const latestRating = book.reading_sessions?.find((s) => s.rating)?.rating

        return (
          <Link
            key={book.id}
            to={`/book/${book.id}`}
            className="flex items-center gap-4 p-3 rounded-lg border-2 border-transparent bg-card hover:border-primary/30 transition-colors group"
          >
            <div className="w-12 h-18 flex-shrink-0 rounded overflow-hidden bg-muted">
              {book.cover_url ? (
                <img
                  src={book.cover_url}
                  alt={book.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <BookOpen className="h-6 w-6 text-muted-foreground/40" />
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0 space-y-1">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="font-medium truncate group-hover:text-primary transition-colors">
                    {book.title}
                  </h3>
                  <p className="text-sm text-muted-foreground truncate">
                    {book.author}
                  </p>
                </div>
                <Badge className={cn('flex-shrink-0 gap-1', statusInfo.className)}>
                  <StatusIcon className="h-3 w-3" />
                  <span className="hidden sm:inline">{statusInfo.label}</span>
                </Badge>
              </div>

              <div className="flex items-center gap-4">
                {latestRating && (
                  <div className="flex items-center gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={cn(
                          'h-3 w-3',
                          i < latestRating
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-muted-foreground/30'
                        )}
                      />
                    ))}
                  </div>
                )}

                {status === 'reading' && book.page_count && (
                  <div className="flex items-center gap-2 flex-1 max-w-xs">
                    <Progress value={progress} className="h-1.5" />
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {progress}%
                    </span>
                  </div>
                )}

                {book.genre && (
                  <span className="text-xs text-muted-foreground hidden md:inline">
                    {book.genre}
                  </span>
                )}
              </div>
            </div>

            <ChevronRight className="h-5 w-5 text-muted-foreground/50 group-hover:text-primary transition-colors" />
          </Link>
        )
      })}
    </div>
  )
}

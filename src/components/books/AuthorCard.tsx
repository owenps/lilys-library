import { Link } from 'react-router-dom'
import { ChevronDown, ChevronUp, Star, BookOpen, CheckCircle, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { CountryFlag } from '@/components/ui/country-flag'
import type { BookWithDetails } from '@/types/database'

interface AuthorCardProps {
  author: string
  books: BookWithDetails[]
  isExpanded: boolean
  onToggle: () => void
}

export function AuthorCard({ author, books, isExpanded, onToggle }: AuthorCardProps) {
  const completedBooks = books.filter((b) => b.user_book?.status === 'completed')
  const ratings = books
    .flatMap((b) => b.reading_sessions?.map((s) => s.rating) || [])
    .filter((r): r is number => r != null)
  const avgRating = ratings.length > 0
    ? ratings.reduce((a, b) => a + b, 0) / ratings.length
    : null
  const nationality = books.find((b) => b.author_nationality)?.author_nationality

  return (
    <div className="rounded-lg border-2 border-transparent bg-card hover:border-primary/30 transition-colors">
      <button
        onClick={onToggle}
        className="w-full text-left p-3 flex items-center gap-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-lg"
      >
        <div className="flex-1 min-w-0">
          <h3 className="font-medium truncate group-hover:text-primary transition-colors">
            {author}
          </h3>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            {nationality && (
              <CountryFlag code={nationality} className="h-3 w-4" />
            )}
            <span className="flex items-center gap-1">
              <BookOpen className="h-3 w-3" />
              {books.length}
            </span>
            <span className="flex items-center gap-1">
              <CheckCircle className="h-3 w-3 text-green-500" />
              {completedBooks.length}
            </span>
            {avgRating && (
              <span className="flex items-center gap-1">
                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                {avgRating.toFixed(1)}
              </span>
            )}
          </div>
        </div>

        <div className="flex-shrink-0 text-muted-foreground/50">
          {isExpanded ? (
            <ChevronUp className="h-5 w-5" />
          ) : (
            <ChevronDown className="h-5 w-5" />
          )}
        </div>
      </button>

      {/* Expanded book list */}
      <div
        className={cn(
          'grid transition-all duration-200 ease-in-out',
          isExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
        )}
      >
        <div className="overflow-hidden">
          <div className="border-t mx-3 py-2 space-y-1">
            {books.map((book) => {
              const latestRating = book.reading_sessions?.find((s) => s.rating)?.rating
              return (
                <Link
                  key={book.id}
                  to={`/book/${book.id}`}
                  className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/50 transition-colors group"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                      {book.title}
                    </p>
                  </div>
                  {latestRating && (
                    <div className="flex items-center gap-0.5 flex-shrink-0">
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
                  <ChevronRight className="h-4 w-4 text-muted-foreground/50 group-hover:text-primary transition-colors flex-shrink-0" />
                </Link>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

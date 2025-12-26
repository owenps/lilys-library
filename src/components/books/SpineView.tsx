import { AlignHorizontalJustifyStart } from 'lucide-react'
import { BookSpine } from './BookSpine'
import type { BookWithDetails } from '@/types/database'

interface SpineViewProps {
  books: BookWithDetails[]
}

export function SpineView({ books }: SpineViewProps) {
  if (books.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <AlignHorizontalJustifyStart className="h-12 w-12 text-muted-foreground/50 mb-4" />
        <h3 className="text-lg font-medium">No books to display</h3>
        <p className="text-muted-foreground mt-1">
          Add some books to see them stacked here.
        </p>
      </div>
    )
  }

  return (
    <div className="flex justify-center">
      <div className="w-full max-w-3xl space-y-1 py-4">
        {/* Stack of spines */}
        <div className="space-y-0.5">
          {books.map((book) => (
            <BookSpine key={book.id} book={book} />
          ))}
        </div>
      </div>
    </div>
  )
}

import { useState, useMemo } from 'react'
import { Users } from 'lucide-react'
import { AuthorCard } from './AuthorCard'
import type { BookWithDetails } from '@/types/database'

interface AuthorsViewProps {
  books: BookWithDetails[]
}

interface AuthorData {
  author: string
  books: BookWithDetails[]
  bookCount: number
}

export function AuthorsView({ books }: AuthorsViewProps) {
  const [expandedAuthor, setExpandedAuthor] = useState<string | null>(null)

  const authors = useMemo(() => {
    // Group books by author
    const authorMap = new Map<string, BookWithDetails[]>()

    books.forEach((book) => {
      const author = book.author.trim()
      if (!authorMap.has(author)) {
        authorMap.set(author, [])
      }
      authorMap.get(author)!.push(book)
    })

    // Convert to array and sort by book count (descending)
    const authorList: AuthorData[] = Array.from(authorMap.entries()).map(
      ([author, authorBooks]) => ({
        author,
        books: authorBooks,
        bookCount: authorBooks.length,
      })
    )

    return authorList.sort((a, b) => b.bookCount - a.bookCount)
  }, [books])

  const handleToggle = (author: string) => {
    setExpandedAuthor((current) => (current === author ? null : author))
  }

  if (authors.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Users className="h-12 w-12 text-muted-foreground/50 mb-4" />
        <h3 className="text-lg font-medium">No authors found</h3>
        <p className="text-muted-foreground mt-1">
          Add some books to see your authors here.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {authors.map(({ author, books: authorBooks }) => (
        <AuthorCard
          key={author}
          author={author}
          books={authorBooks}
          isExpanded={expandedAuthor === author}
          onToggle={() => handleToggle(author)}
        />
      ))}
    </div>
  )
}

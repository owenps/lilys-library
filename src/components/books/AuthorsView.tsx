import { useState, useMemo } from 'react'
import { Users, Globe, ChevronDown, ChevronUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { AuthorCard } from './AuthorCard'
import { CountryFlag } from '@/components/ui/country-flag'
import { getCountryName } from '@/lib/countries'
import type { BookWithDetails } from '@/types/database'

type GroupMode = 'author' | 'country'

interface AuthorsViewProps {
  books: BookWithDetails[]
}

interface AuthorData {
  author: string
  books: BookWithDetails[]
  bookCount: number
  nationality?: string | null
}

interface CountryGroup {
  code: string | null
  name: string
  authors: AuthorData[]
  totalBooks: number
}

export function AuthorsView({ books }: AuthorsViewProps) {
  const [expandedAuthor, setExpandedAuthor] = useState<string | null>(null)
  const [groupMode, setGroupMode] = useState<GroupMode>('author')
  const [expandedCountries, setExpandedCountries] = useState<Set<string>>(new Set())

  // Group by author
  const authors = useMemo(() => {
    const authorMap = new Map<string, BookWithDetails[]>()

    books.forEach((book) => {
      const author = book.author.trim()
      if (!authorMap.has(author)) {
        authorMap.set(author, [])
      }
      authorMap.get(author)!.push(book)
    })

    const authorList: AuthorData[] = Array.from(authorMap.entries()).map(
      ([author, authorBooks]) => ({
        author,
        books: authorBooks,
        bookCount: authorBooks.length,
        nationality: authorBooks.find((b) => b.author_nationality)?.author_nationality,
      })
    )

    return authorList.sort((a, b) => b.bookCount - a.bookCount)
  }, [books])

  // Group by country
  const countryGroups = useMemo(() => {
    const countryMap = new Map<string, AuthorData[]>()

    authors.forEach((authorData) => {
      const country = authorData.nationality || 'unknown'
      if (!countryMap.has(country)) {
        countryMap.set(country, [])
      }
      countryMap.get(country)!.push(authorData)
    })

    const groups: CountryGroup[] = Array.from(countryMap.entries()).map(
      ([code, groupAuthors]) => ({
        code: code === 'unknown' ? null : code,
        name: code === 'unknown' ? 'Unknown' : getCountryName(code),
        authors: groupAuthors.sort((a, b) => b.bookCount - a.bookCount),
        totalBooks: groupAuthors.reduce((sum, a) => sum + a.bookCount, 0),
      })
    )

    // Sort: known countries alphabetically, "Unknown" at end
    return groups.sort((a, b) => {
      if (!a.code) return 1
      if (!b.code) return -1
      return a.name.localeCompare(b.name)
    })
  }, [authors])

  const handleToggle = (author: string) => {
    setExpandedAuthor((current) => (current === author ? null : author))
  }

  const toggleCountry = (code: string) => {
    setExpandedCountries((prev) => {
      const next = new Set(prev)
      if (next.has(code)) {
        next.delete(code)
      } else {
        next.add(code)
      }
      return next
    })
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
    <div className="space-y-4">
      {/* Group mode toggle */}
      <div className="flex items-center gap-2">
        <Button
          variant={groupMode === 'author' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setGroupMode('author')}
          className="gap-2"
        >
          <Users className="h-4 w-4" />
          By Author
        </Button>
        <Button
          variant={groupMode === 'country' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setGroupMode('country')}
          className="gap-2"
        >
          <Globe className="h-4 w-4" />
          By Country
        </Button>
      </div>

      {groupMode === 'author' ? (
        // Author list
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
      ) : (
        // Country grouped view
        <div className="space-y-3">
          {countryGroups.map((group) => {
            const groupKey = group.code ?? 'unknown'
            const isExpanded = expandedCountries.has(groupKey)
            return (
              <div key={groupKey} className="rounded-lg border bg-card">
                {/* Country header */}
                <button
                  onClick={() => toggleCountry(groupKey)}
                  className="w-full flex items-center gap-3 p-3 text-left hover:bg-muted/50 transition-colors rounded-lg"
                >
                  {group.code ? (
                    <CountryFlag code={group.code} className="h-4 w-6 flex-shrink-0" />
                  ) : (
                    <Globe className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  )}
                  <span className="font-medium flex-1">{group.name}</span>
                  <span className="text-sm text-muted-foreground">
                    {group.authors.length} {group.authors.length === 1 ? 'author' : 'authors'} • {group.totalBooks} {group.totalBooks === 1 ? 'book' : 'books'}
                  </span>
                  {isExpanded ? (
                    <ChevronUp className="h-5 w-5 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-muted-foreground" />
                  )}
                </button>

                {/* Collapsible author list */}
                <div
                  className={cn(
                    'grid transition-all duration-200 ease-in-out',
                    isExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                  )}
                >
                  <div className="overflow-hidden">
                    <div className="border-t p-2 space-y-2">
                      {group.authors.map(({ author, books: authorBooks }) => (
                        <AuthorCard
                          key={author}
                          author={author}
                          books={authorBooks}
                          isExpanded={expandedAuthor === author}
                          onToggle={() => handleToggle(author)}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

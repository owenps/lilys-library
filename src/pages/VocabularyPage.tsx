import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { BookOpen, Search } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useAllVocabulary } from '@/hooks/useVocabulary'
import { useBooks } from '@/hooks/useBooks'

export function VocabularyPage() {
  const { vocabulary, isLoading } = useAllVocabulary()
  const { books } = useBooks()

  const [searchTerm, setSearchTerm] = useState('')
  const [filterBook, setFilterBook] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'recent' | 'alphabetical'>('recent')

  const filteredVocabulary = useMemo(() => {
    let result = [...vocabulary]

    // Filter by search
    if (searchTerm) {
      const lower = searchTerm.toLowerCase()
      result = result.filter(
        (v) =>
          v.term.toLowerCase().includes(lower) ||
          v.definition.toLowerCase().includes(lower)
      )
    }

    // Filter by book
    if (filterBook !== 'all') {
      result = result.filter((v) => v.book_id === filterBook)
    }

    // Sort
    if (sortBy === 'alphabetical') {
      result.sort((a, b) => a.term.localeCompare(b.term))
    }
    // 'recent' is default from query

    return result
  }, [vocabulary, searchTerm, filterBook, sortBy])

  // Group by book for display
  const groupedByBook = useMemo(() => {
    const groups: Record<string, typeof filteredVocabulary> = {}
    for (const item of filteredVocabulary) {
      const key = item.book_id
      if (!groups[key]) groups[key] = []
      groups[key].push(item)
    }
    return groups
  }, [filteredVocabulary])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-pulse text-muted-foreground">Loading vocabulary...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Vocabulary</h1>
        <p className="text-muted-foreground">
          {vocabulary.length} {vocabulary.length === 1 ? 'word' : 'words'} across your library
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search words..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>

        <Select value={filterBook} onValueChange={setFilterBook}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="All books" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All books</SelectItem>
            {books.map((book) => (
              <SelectItem key={book.id} value={book.id}>
                {book.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
          <SelectTrigger className="w-full sm:w-[150px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="recent">Most recent</SelectItem>
            <SelectItem value="alphabetical">A-Z</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Vocabulary grouped by book */}
      {Object.entries(groupedByBook).length > 0 ? (
        Object.entries(groupedByBook).map(([bookId, words]) => {
          const book = books.find((b) => b.id === bookId)
          return (
            <Card key={bookId}>
              <CardHeader>
                <Link to={`/book/${bookId}`} className="hover:underline">
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5" />
                    {book?.title || words[0]?.book_title || 'Unknown Book'}
                  </CardTitle>
                </Link>
                <CardDescription>
                  {words.length} {words.length === 1 ? 'word' : 'words'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {words.map((item) => (
                    <div key={item.id} className="p-3 border rounded-lg">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium">{item.term}</span>
                        {item.part_of_speech && (
                          <Badge variant="outline" className="text-xs">
                            {item.part_of_speech}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {item.definition}
                      </p>
                      {item.page_number && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Page {item.page_number}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )
        })
      ) : (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <BookOpen className="h-12 w-12 text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-medium">No vocabulary yet</h3>
          <p className="text-muted-foreground mt-1">
            {vocabulary.length === 0
              ? 'Start adding words while reading your books!'
              : 'No words match your search.'}
          </p>
        </div>
      )}
    </div>
  )
}

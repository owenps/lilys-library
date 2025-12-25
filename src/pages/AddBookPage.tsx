import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Search, Plus, BookOpen, Loader2, Star } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useCreateBook } from '@/hooks/useBooks'
import { searchBooks, getBookByISBN, type BookSearchResult } from '@/lib/open-library'
import type { ReadingStatus } from '@/types/database'
import { toast } from 'sonner'

export function AddBookPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const createBook = useCreateBook()

  // Get initial status from URL params (for wishlist linking)
  const initialStatus = (searchParams.get('status') as ReadingStatus) || 'want_to_read'

  // Search state
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<BookSearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)

  // Manual form state
  const [title, setTitle] = useState('')
  const [author, setAuthor] = useState('')
  const [isbn, setIsbn] = useState('')
  const [coverUrl, setCoverUrl] = useState('')
  const [pageCount, setPageCount] = useState('')
  const [genre, setGenre] = useState('')
  const [description, setDescription] = useState('')
  const [publishedYear, setPublishedYear] = useState('')
  const [status, setStatus] = useState<ReadingStatus>(initialStatus)
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)

  // Update status if URL param changes
  useEffect(() => {
    if (initialStatus) {
      setStatus(initialStatus)
    }
  }, [initialStatus])

  const handleSearch = async () => {
    if (!searchQuery.trim()) return

    setIsSearching(true)
    try {
      // Check if it looks like an ISBN
      const cleanQuery = searchQuery.replace(/[-\s]/g, '')
      if (/^\d{10}$|^\d{13}$/.test(cleanQuery)) {
        const book = await getBookByISBN(cleanQuery)
        if (book) {
          setSearchResults([book])
        } else {
          // Fallback to regular search
          const results = await searchBooks(searchQuery)
          setSearchResults(results)
        }
      } else {
        const results = await searchBooks(searchQuery)
        setSearchResults(results)
      }
    } catch (error) {
      console.error('Search error:', error)
      toast.error('Failed to search books')
    } finally {
      setIsSearching(false)
    }
  }

  const handleSelectBook = (book: BookSearchResult) => {
    setTitle(book.title)
    setAuthor(book.author)
    setIsbn(book.isbn || '')
    setCoverUrl(book.coverUrl || '')
    setPageCount(book.pageCount?.toString() || '')
    setGenre(book.genre || '')
    setPublishedYear(book.publishYear?.toString() || '')
    setSearchResults([])
    setSearchQuery('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!title.trim() || !author.trim()) {
      toast.error('Please enter at least a title and author')
      return
    }

    try {
      await createBook.mutateAsync({
        title: title.trim(),
        author: author.trim(),
        isbn: isbn.trim() || undefined,
        cover_url: coverUrl.trim() || undefined,
        page_count: pageCount ? parseInt(pageCount) : undefined,
        genre: genre.trim() || undefined,
        description: description.trim() || undefined,
        published_year: publishedYear ? parseInt(publishedYear) : undefined,
        status,
        rating: status === 'completed' ? rating || undefined : undefined,
      })

      toast.success(status === 'wishlist' ? 'Book added to your wishlist!' : 'Book added to your library!')
      navigate(status === 'wishlist' ? '/wishlist' : '/')
    } catch (error) {
      console.error('Error creating book:', error)
      toast.error('Failed to add book')
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Add Book</h1>
        <p className="text-muted-foreground">
          Search for a book or add it manually
        </p>
      </div>

      <Tabs defaultValue="search">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="search" className="gap-2">
            <Search className="h-4 w-4" />
            Search
          </TabsTrigger>
          <TabsTrigger value="manual" className="gap-2">
            <Plus className="h-4 w-4" />
            Manual
          </TabsTrigger>
        </TabsList>

        <TabsContent value="search" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Search Books</CardTitle>
              <CardDescription>
                Search by title, author, or ISBN
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Search for a book..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
                <Button onClick={handleSearch} disabled={isSearching}>
                  {isSearching ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Search className="h-4 w-4" />
                  )}
                </Button>
              </div>

              {searchResults.length > 0 && (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {searchResults.map((book) => (
                    <button
                      key={book.key}
                      onClick={() => handleSelectBook(book)}
                      className="w-full flex items-center gap-3 p-3 rounded-lg border hover:bg-accent transition-colors text-left"
                    >
                      <div className="w-12 h-16 flex-shrink-0 rounded overflow-hidden bg-muted">
                        {book.coverUrl ? (
                          <img
                            src={book.coverUrl}
                            alt={book.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <BookOpen className="h-6 w-6 text-muted-foreground/40" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{book.title}</p>
                        <p className="text-sm text-muted-foreground truncate">
                          {book.author}
                        </p>
                        {book.publishYear && (
                          <p className="text-xs text-muted-foreground">
                            {book.publishYear}
                          </p>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="manual">
          <Card>
            <CardHeader>
              <CardTitle>Add Manually</CardTitle>
              <CardDescription>
                Enter book details yourself
              </CardDescription>
            </CardHeader>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Book form - shown after selecting from search or in manual mode */}
      {(title || author) && (
        <Card>
          <CardHeader>
            <CardTitle>Book Details</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="author">Author *</Label>
                  <Input
                    id="author"
                    value={author}
                    onChange={(e) => setAuthor(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="isbn">ISBN</Label>
                  <Input
                    id="isbn"
                    value={isbn}
                    onChange={(e) => setIsbn(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pageCount">Page Count</Label>
                  <Input
                    id="pageCount"
                    type="number"
                    value={pageCount}
                    onChange={(e) => setPageCount(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="genre">Genre</Label>
                  <Input
                    id="genre"
                    value={genre}
                    onChange={(e) => setGenre(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="publishedYear">Published Year</Label>
                  <Input
                    id="publishedYear"
                    type="number"
                    value={publishedYear}
                    onChange={(e) => setPublishedYear(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="coverUrl">Cover URL</Label>
                <Input
                  id="coverUrl"
                  value={coverUrl}
                  onChange={(e) => setCoverUrl(e.target.value.trim())}
                  placeholder="https://..."
                />
                <p className="text-xs text-muted-foreground">
                  Tip: Upload to <a href="https://imgur.com/upload" target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground">Imgur</a>, then right-click the image and "Copy image address"
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Reading Status</Label>
                <Select value={status} onValueChange={(v) => setStatus(v as ReadingStatus)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="want_to_read">Collected</SelectItem>
                    <SelectItem value="reading">Currently Reading</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="wishlist">Wishlist</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {status === 'completed' && (
                <div className="space-y-2">
                  <Label>Rating</Label>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setRating(i + 1)}
                        onMouseEnter={() => setHoverRating(i + 1)}
                        onMouseLeave={() => setHoverRating(0)}
                        className="p-0.5 transition-transform hover:scale-110"
                      >
                        <Star
                          className={cn(
                            'h-6 w-6 transition-colors',
                            i < (hoverRating || rating)
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'text-muted-foreground/30'
                          )}
                        />
                      </button>
                    ))}
                    {rating > 0 && (
                      <button
                        type="button"
                        onClick={() => setRating(0)}
                        className="ml-2 text-xs text-muted-foreground hover:text-foreground"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-4">
                <Button type="submit" disabled={createBook.isPending}>
                  {createBook.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      {status === 'wishlist' ? 'Add to Wishlist' : 'Add to Library'}
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/')}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Empty state for manual entry */}
      {!title && !author && (
        <Card>
          <CardContent className="py-8">
            <form
              onSubmit={(e) => {
                e.preventDefault()
                const formData = new FormData(e.currentTarget)
                setTitle(formData.get('title') as string)
                setAuthor(formData.get('author') as string)
              }}
              className="space-y-4"
            >
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="title-initial">Title *</Label>
                  <Input
                    id="title-initial"
                    name="title"
                    placeholder="Enter book title"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="author-initial">Author *</Label>
                  <Input
                    id="author-initial"
                    name="author"
                    placeholder="Enter author name"
                    required
                  />
                </div>
              </div>
              <Button type="submit">Continue</Button>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

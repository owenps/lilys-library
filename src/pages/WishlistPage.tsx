import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Search, Grid3X3, List, Heart, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { BookList } from '@/components/books/BookList'
import { BookshelfView } from '@/components/books/BookshelfView'
import { AuthorsView } from '@/components/books/AuthorsView'
import { useWishlistBooks } from '@/hooks/useBooks'

type ViewMode = 'list' | 'shelf' | 'authors'

export function WishlistPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('shelf')
  const [searchQuery, setSearchQuery] = useState('')
  const { books, isLoading } = useWishlistBooks()

  const filteredBooks = books.filter((book) => {
    const matchesSearch =
      searchQuery === '' ||
      book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      book.author.toLowerCase().includes(searchQuery.toLowerCase())

    return matchesSearch
  })

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Wishlist</h1>
          <p className="text-muted-foreground">
            {books.length} {books.length === 1 ? 'book' : 'books'} you want to own
          </p>
        </div>
        <Link to="/add?status=wishlist">
          <Button className="gap-2 mt-1">
            <Plus className="h-4 w-4" />
            Add to Wishlist
          </Button>
        </Link>
      </div>

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search wishlist..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)}>
          <TabsList>
            <TabsTrigger value="shelf" className="px-3">
              <Grid3X3 className="h-4 w-4" />
            </TabsTrigger>
            <TabsTrigger value="list" className="px-3">
              <List className="h-4 w-4" />
            </TabsTrigger>
            <TabsTrigger value="authors" className="px-3">
              <Users className="h-4 w-4" />
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-pulse text-muted-foreground">Loading your wishlist...</div>
        </div>
      ) : filteredBooks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Heart className="h-12 w-12 text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-medium">No books on your wishlist</h3>
          <p className="text-muted-foreground mt-1">
            {books.length === 0
              ? "Add books you'd like to own someday!"
              : "Try adjusting your search."}
          </p>
          {books.length === 0 && (
            <Link to="/add?status=wishlist" className="mt-4">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add to Wishlist
              </Button>
            </Link>
          )}
        </div>
      ) : viewMode === 'authors' ? (
        <AuthorsView books={filteredBooks} />
      ) : viewMode === 'list' ? (
        <BookList books={filteredBooks} />
      ) : (
        <BookshelfView books={filteredBooks} />
      )}
    </div>
  )
}

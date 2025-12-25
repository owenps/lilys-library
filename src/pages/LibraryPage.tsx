import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Search, Grid3X3, List, Filter, Users, BookOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { BookList } from '@/components/books/BookList'
import { BookshelfView } from '@/components/books/BookshelfView'
import { AuthorsView } from '@/components/books/AuthorsView'
import { useBooks } from '@/hooks/useBooks'
import type { ReadingStatus } from '@/types/database'

type ViewMode = 'list' | 'shelf' | 'authors'

export function LibraryPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('shelf')
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<ReadingStatus | 'all'>('all')
  const { books, isLoading } = useBooks()

  const filteredBooks = books.filter((book) => {
    const matchesSearch =
      searchQuery === '' ||
      book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      book.author.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesStatus =
      statusFilter === 'all' || book.user_book?.status === statusFilter

    return matchesSearch && matchesStatus
  })

  const statusCounts = {
    all: books.length,
    reading: books.filter((b) => b.user_book?.status === 'reading').length,
    completed: books.filter((b) => b.user_book?.status === 'completed').length,
    want_to_read: books.filter((b) => b.user_book?.status === 'want_to_read').length,
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Library</h1>
          <p className="text-muted-foreground">
            {books.length} {books.length === 1 ? 'book' : 'books'} in your collection
          </p>
        </div>
        <Link to="/add">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Add Book
          </Button>
        </Link>
      </div>

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={viewMode === 'authors' ? 'Search authors...' : 'Search books...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="flex items-center gap-2">
          <Select
            value={statusFilter}
            onValueChange={(value) => setStatusFilter(value as ReadingStatus | 'all')}
          >
            <SelectTrigger className="w-[180px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Books ({statusCounts.all})</SelectItem>
              <SelectItem value="reading">Reading ({statusCounts.reading})</SelectItem>
              <SelectItem value="completed">Completed ({statusCounts.completed})</SelectItem>
              <SelectItem value="want_to_read">Want to Read ({statusCounts.want_to_read})</SelectItem>
            </SelectContent>
          </Select>

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
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-pulse text-muted-foreground">Loading your library...</div>
        </div>
      ) : filteredBooks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <BookOpen className="h-12 w-12 text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-medium">No books found</h3>
          <p className="text-muted-foreground mt-1">
            {books.length === 0
              ? "Your library is empty. Start by adding your first book!"
              : "Try adjusting your search or filters."}
          </p>
          {books.length === 0 && (
            <Link to="/add" className="mt-4">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Book
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

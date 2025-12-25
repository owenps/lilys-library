import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { extractSpineColor } from '@/lib/color-extraction'
import type { BookWithDetails, UserBook, ReadingStatus, ReadingSession } from '@/types/database'

export function useBooks() {
  const { user } = useAuth()

  const { data: books = [], isLoading, error } = useQuery({
    queryKey: ['books', user?.id],
    queryFn: async (): Promise<BookWithDetails[]> => {
      if (!user) return []

      const { data, error } = await supabase
        .from('books')
        .select(`
          *,
          user_book:user_books(*),
          collections:book_collections(collection:collections(*)),
          reading_sessions(*)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      return (data || [])
        // Filter out wishlist books from regular library
        .filter((book) => book.user_book?.[0]?.status !== 'wishlist')
        .map((book) => {
          // Sort reading sessions by read_number descending (most recent first)
          const sessions = (book.reading_sessions || []).sort(
            (a: ReadingSession, b: ReadingSession) => b.read_number - a.read_number
          )
          return {
            ...book,
            user_book: book.user_book?.[0] || null,
            collections: book.collections?.map((bc: { collection: unknown }) => bc.collection) || [],
            reading_sessions: sessions,
          }
        })
    },
    enabled: !!user,
  })

  return { books, isLoading, error }
}

export function useWishlistBooks() {
  const { user } = useAuth()

  const { data: books = [], isLoading, error } = useQuery({
    queryKey: ['wishlist-books', user?.id],
    queryFn: async (): Promise<BookWithDetails[]> => {
      if (!user) return []

      const { data, error } = await supabase
        .from('books')
        .select(`
          *,
          user_book:user_books(*),
          collections:book_collections(collection:collections(*))
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      return (data || [])
        // Only include wishlist books
        .filter((book) => book.user_book?.[0]?.status === 'wishlist')
        .map((book) => ({
          ...book,
          user_book: book.user_book?.[0] || null,
          collections: book.collections?.map((bc: { collection: unknown }) => bc.collection) || [],
        }))
    },
    enabled: !!user,
  })

  return { books, isLoading, error }
}

export function useBook(bookId: string | undefined) {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['book', bookId],
    queryFn: async (): Promise<BookWithDetails | null> => {
      if (!user || !bookId) return null

      const { data, error } = await supabase
        .from('books')
        .select(`
          *,
          user_book:user_books(*),
          collections:book_collections(collection:collections(*)),
          notes(*),
          reading_sessions(*),
          vocabulary(*)
        `)
        .eq('id', bookId)
        .eq('user_id', user.id)
        .single()

      if (error) throw error

      // Sort reading sessions by read_number descending (most recent first)
      const sessions = (data.reading_sessions || []).sort(
        (a: ReadingSession, b: ReadingSession) => b.read_number - a.read_number
      )

      return {
        ...data,
        user_book: data.user_book?.[0] || null,
        collections: data.collections?.map((bc: { collection: unknown }) => bc.collection) || [],
        notes: data.notes || [],
        reading_sessions: sessions,
        vocabulary: data.vocabulary || [],
      }
    },
    enabled: !!user && !!bookId,
  })
}

interface CreateBookInput {
  title: string
  author: string
  isbn?: string
  cover_url?: string
  spine_color?: string
  page_count?: number
  genre?: string
  description?: string
  published_year?: number
  status: ReadingStatus
  rating?: number
}

export function useCreateBook() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: CreateBookInput) => {
      if (!user) throw new Error('Not authenticated')

      const { status, rating, ...bookData } = input

      // Auto-extract spine color if cover_url provided and spine_color not set
      let spineColor = bookData.spine_color
      if (bookData.cover_url && !spineColor) {
        try {
          spineColor = await extractSpineColor(bookData.cover_url) ?? undefined
        } catch (error) {
          console.warn('Failed to extract spine color:', error)
        }
      }

      // Create book
      const { data: book, error: bookError } = await supabase
        .from('books')
        .insert({
          ...bookData,
          spine_color: spineColor,
          user_id: user.id,
        })
        .select()
        .single()

      if (bookError) throw bookError

      // Create user_book entry
      const { data: userBook, error: userBookError } = await supabase
        .from('user_books')
        .insert({
          user_id: user.id,
          book_id: book.id,
          status,
          current_page: status === 'completed' ? (bookData.page_count || 0) : 0,
          started_at: status === 'reading' || status === 'completed' ? new Date().toISOString() : null,
          finished_at: status === 'completed' ? new Date().toISOString() : null,
          rating: status === 'completed' ? rating : null,
        })
        .select()
        .single()

      if (userBookError) throw userBookError

      // Create reading session if status is 'reading' or 'completed'
      if (status === 'reading' || status === 'completed') {
        const { data: session, error: sessionError } = await supabase
          .from('reading_sessions')
          .insert({
            user_id: user.id,
            book_id: book.id,
            user_book_id: userBook.id,
            read_number: 1,
            started_at: new Date().toISOString(),
            finished_at: status === 'completed' ? new Date().toISOString() : null,
            rating: status === 'completed' ? rating : null,
          })
          .select()
          .single()

        if (sessionError) throw sessionError

        // Update user_book with current_session_id
        await supabase
          .from('user_books')
          .update({ current_session_id: session.id })
          .eq('id', userBook.id)
      }

      return book
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['books'] })
    },
  })
}

interface UpdateBookInput {
  id: string
  title?: string
  author?: string
  isbn?: string
  cover_url?: string
  spine_color?: string | null
  page_count?: number
  genre?: string
  description?: string
  published_year?: number
}

export function useUpdateBook() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, cover_url, spine_color, ...updates }: UpdateBookInput) => {
      // Determine spine color
      let newSpineColor = spine_color

      // If cover_url is being updated and spine_color is not explicitly set,
      // re-extract the color from the new cover
      if (cover_url !== undefined && spine_color === undefined) {
        if (cover_url) {
          try {
            newSpineColor = await extractSpineColor(cover_url)
          } catch (error) {
            console.warn('Failed to extract spine color:', error)
          }
        } else {
          // Cover removed, clear the color
          newSpineColor = null
        }
      }

      const { data, error } = await supabase
        .from('books')
        .update({
          ...updates,
          cover_url,
          spine_color: newSpineColor,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['books'] })
      queryClient.invalidateQueries({ queryKey: ['book', data.id] })
    },
  })
}

export function useDeleteBook() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (bookId: string) => {
      const { error } = await supabase
        .from('books')
        .delete()
        .eq('id', bookId)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['books'] })
    },
  })
}

interface UpdateUserBookInput {
  bookId: string
  status?: ReadingStatus
  current_page?: number
  rating?: number | null
  review?: string | null
  started_at?: string | null
  finished_at?: string | null
}

export function useUpdateUserBook() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ bookId, ...updates }: UpdateUserBookInput) => {
      if (!user) throw new Error('Not authenticated')

      // Get current user_book state
      const { data: currentUserBook } = await supabase
        .from('user_books')
        .select('id, status, current_session_id')
        .eq('book_id', bookId)
        .eq('user_id', user.id)
        .single()

      if (!currentUserBook) throw new Error('User book not found')

      const additionalUpdates: Partial<UserBook> = {}

      // Handle status change to 'reading' - create new session if needed
      if (updates.status === 'reading' && currentUserBook.status !== 'reading') {
        // Check if we need to create a new session
        if (!currentUserBook.current_session_id || currentUserBook.status === 'completed') {
          // Get next read number
          const { data: existingSessions } = await supabase
            .from('reading_sessions')
            .select('read_number')
            .eq('user_book_id', currentUserBook.id)
            .order('read_number', { ascending: false })
            .limit(1)

          const nextReadNumber = (existingSessions?.[0]?.read_number || 0) + 1

          // Create new session
          const { data: newSession, error: sessionError } = await supabase
            .from('reading_sessions')
            .insert({
              user_id: user.id,
              book_id: bookId,
              user_book_id: currentUserBook.id,
              read_number: nextReadNumber,
              started_at: new Date().toISOString(),
            })
            .select()
            .single()

          if (sessionError) throw sessionError
          additionalUpdates.current_session_id = newSession.id
          additionalUpdates.started_at = new Date().toISOString()
        }
      }

      // Handle status change to 'completed' - finish current session
      if (updates.status === 'completed' && currentUserBook.status !== 'completed') {
        if (currentUserBook.current_session_id) {
          await supabase
            .from('reading_sessions')
            .update({
              finished_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq('id', currentUserBook.current_session_id)
        }
        additionalUpdates.finished_at = new Date().toISOString()
      }

      const { data, error } = await supabase
        .from('user_books')
        .update({
          ...updates,
          ...additionalUpdates,
          updated_at: new Date().toISOString(),
        })
        .eq('book_id', bookId)
        .eq('user_id', user.id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['books'] })
      queryClient.invalidateQueries({ queryKey: ['book', variables.bookId] })
      queryClient.invalidateQueries({ queryKey: ['reading-sessions', variables.bookId] })
      queryClient.invalidateQueries({ queryKey: ['stats'] })
    },
  })
}

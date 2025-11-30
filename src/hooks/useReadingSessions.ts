import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import type { ReadingSession } from '@/types/database'

// Fetch all reading sessions for a book
export function useReadingSessions(bookId: string | undefined) {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['reading-sessions', bookId],
    queryFn: async (): Promise<ReadingSession[]> => {
      if (!user || !bookId) return []

      const { data, error } = await supabase
        .from('reading_sessions')
        .select('*')
        .eq('book_id', bookId)
        .eq('user_id', user.id)
        .order('read_number', { ascending: false })

      if (error) throw error
      return data || []
    },
    enabled: !!user && !!bookId,
  })
}

interface StartNewSessionInput {
  bookId: string
  userBookId: string
}

// Start a new reading session (for re-reads or first read)
export function useStartNewSession() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ bookId, userBookId }: StartNewSessionInput) => {
      if (!user) throw new Error('Not authenticated')

      // Get next read number
      const { data: existingSessions } = await supabase
        .from('reading_sessions')
        .select('read_number')
        .eq('user_book_id', userBookId)
        .order('read_number', { ascending: false })
        .limit(1)

      const nextReadNumber = (existingSessions?.[0]?.read_number || 0) + 1

      // Create new session
      const { data: session, error: sessionError } = await supabase
        .from('reading_sessions')
        .insert({
          user_id: user.id,
          book_id: bookId,
          user_book_id: userBookId,
          read_number: nextReadNumber,
          started_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (sessionError) throw sessionError

      // Update user_book to point to new session and set status to reading
      const { error: updateError } = await supabase
        .from('user_books')
        .update({
          current_session_id: session.id,
          status: 'reading',
          current_page: 0,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userBookId)

      if (updateError) throw updateError

      return session
    },
    onSuccess: (_, { bookId }) => {
      queryClient.invalidateQueries({ queryKey: ['reading-sessions', bookId] })
      queryClient.invalidateQueries({ queryKey: ['book', bookId] })
      queryClient.invalidateQueries({ queryKey: ['books'] })
      queryClient.invalidateQueries({ queryKey: ['stats'] })
    },
  })
}

interface UpdateSessionInput {
  sessionId: string
  bookId: string
  started_at?: string | null
  finished_at?: string | null
  rating?: number | null
  review?: string | null
}

// Update a reading session's dates, rating, or review
export function useUpdateSession() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ sessionId, bookId, ...updates }: UpdateSessionInput) => {
      const { data, error } = await supabase
        .from('reading_sessions')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', sessionId)
        .select()
        .single()

      if (error) throw error
      return { ...data, bookId }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['reading-sessions', data.bookId] })
      queryClient.invalidateQueries({ queryKey: ['book', data.bookId] })
      queryClient.invalidateQueries({ queryKey: ['books'] })
      queryClient.invalidateQueries({ queryKey: ['stats'] })
    },
  })
}

interface DeleteSessionInput {
  sessionId: string
  bookId: string
  userBookId?: string
  isCurrentSession?: boolean
}

// Delete a reading session
export function useDeleteSession() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ sessionId, bookId, userBookId, isCurrentSession }: DeleteSessionInput) => {
      const { error } = await supabase
        .from('reading_sessions')
        .delete()
        .eq('id', sessionId)

      if (error) throw error

      // If deleting the current session, clear current_session_id and reset status
      if (isCurrentSession && userBookId) {
        const { error: updateError } = await supabase
          .from('user_books')
          .update({
            current_session_id: null,
            status: 'want_to_read',
            updated_at: new Date().toISOString(),
          })
          .eq('id', userBookId)

        if (updateError) throw updateError
      }

      return { bookId }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['reading-sessions', data.bookId] })
      queryClient.invalidateQueries({ queryKey: ['book', data.bookId] })
      queryClient.invalidateQueries({ queryKey: ['books'] })
      queryClient.invalidateQueries({ queryKey: ['stats'] })
    },
  })
}

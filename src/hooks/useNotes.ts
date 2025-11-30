import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import type { Note } from '@/types/database'

export function useNotes(bookId: string | undefined) {
  const { user } = useAuth()

  const { data: notes = [], isLoading, error } = useQuery({
    queryKey: ['notes', bookId],
    queryFn: async (): Promise<Note[]> => {
      if (!user || !bookId) return []

      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .eq('book_id', bookId)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data || []
    },
    enabled: !!user && !!bookId,
  })

  return { notes, isLoading, error }
}

interface CreateNoteInput {
  bookId: string
  content: string
  isQuote: boolean
  pageNumber?: number
}

export function useCreateNote() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ bookId, content, isQuote, pageNumber }: CreateNoteInput) => {
      if (!user) throw new Error('Not authenticated')

      const { data, error } = await supabase
        .from('notes')
        .insert({
          user_id: user.id,
          book_id: bookId,
          content,
          is_quote: isQuote,
          page_number: pageNumber || null,
        })
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['notes', variables.bookId] })
      queryClient.invalidateQueries({ queryKey: ['book', variables.bookId] })
    },
  })
}

export function useDeleteNote() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (noteId: string) => {
      const { error } = await supabase
        .from('notes')
        .delete()
        .eq('id', noteId)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] })
    },
  })
}

interface UpdateNoteInput {
  noteId: string
  bookId: string
  content: string
  isQuote: boolean
  pageNumber?: number | null
}

export function useUpdateNote() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ noteId, content, isQuote, pageNumber }: UpdateNoteInput) => {
      const { data, error } = await supabase
        .from('notes')
        .update({
          content,
          is_quote: isQuote,
          page_number: pageNumber || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', noteId)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['notes', variables.bookId] })
      queryClient.invalidateQueries({ queryKey: ['book', variables.bookId] })
    },
  })
}

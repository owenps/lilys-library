import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { lookupWord } from '@/lib/dictionary-api'
import type { Vocabulary } from '@/types/database'

export function useVocabulary(bookId: string | undefined) {
  const { user } = useAuth()

  const { data: vocabulary = [], isLoading, error } = useQuery({
    queryKey: ['vocabulary', bookId],
    queryFn: async (): Promise<Vocabulary[]> => {
      if (!user || !bookId) return []

      const { data, error } = await supabase
        .from('vocabulary')
        .select('*')
        .eq('book_id', bookId)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data || []
    },
    enabled: !!user && !!bookId,
  })

  return { vocabulary, isLoading, error }
}

export interface VocabularyWithBook extends Vocabulary {
  book_title: string
  book_author: string
}

export function useAllVocabulary() {
  const { user } = useAuth()

  const { data: vocabulary = [], isLoading, error } = useQuery({
    queryKey: ['all-vocabulary', user?.id],
    queryFn: async (): Promise<VocabularyWithBook[]> => {
      if (!user) return []

      const { data, error } = await supabase
        .from('vocabulary')
        .select(`
          *,
          book:books(title, author)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      return (data || []).map((item) => ({
        ...item,
        book_title: item.book?.title || 'Unknown',
        book_author: item.book?.author || 'Unknown',
      }))
    },
    enabled: !!user,
  })

  return { vocabulary, isLoading, error }
}

interface CreateVocabularyInput {
  bookId: string
  term: string
  definition: string
  partOfSpeech?: string
  phonetic?: string
  example?: string
  pageNumber?: number
}

export function useCreateVocabulary() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      bookId,
      term,
      definition,
      partOfSpeech,
      phonetic,
      example,
      pageNumber,
    }: CreateVocabularyInput) => {
      if (!user) throw new Error('Not authenticated')

      const { data, error } = await supabase
        .from('vocabulary')
        .insert({
          user_id: user.id,
          book_id: bookId,
          term,
          definition,
          part_of_speech: partOfSpeech || null,
          phonetic: phonetic || null,
          example: example || null,
          page_number: pageNumber || null,
        })
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['vocabulary', variables.bookId] })
      queryClient.invalidateQueries({ queryKey: ['all-vocabulary'] })
      queryClient.invalidateQueries({ queryKey: ['book', variables.bookId] })
    },
  })
}

interface UpdateVocabularyInput {
  vocabularyId: string
  bookId: string
  term: string
  definition: string
  partOfSpeech?: string | null
  phonetic?: string | null
  example?: string | null
  pageNumber?: number | null
}

export function useUpdateVocabulary() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      vocabularyId,
      term,
      definition,
      partOfSpeech,
      phonetic,
      example,
      pageNumber,
    }: UpdateVocabularyInput) => {
      const { data, error } = await supabase
        .from('vocabulary')
        .update({
          term,
          definition,
          part_of_speech: partOfSpeech || null,
          phonetic: phonetic || null,
          example: example || null,
          page_number: pageNumber || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', vocabularyId)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['vocabulary', variables.bookId] })
      queryClient.invalidateQueries({ queryKey: ['all-vocabulary'] })
      queryClient.invalidateQueries({ queryKey: ['book', variables.bookId] })
    },
  })
}

export function useDeleteVocabulary() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (vocabularyId: string) => {
      const { error } = await supabase
        .from('vocabulary')
        .delete()
        .eq('id', vocabularyId)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vocabulary'] })
      queryClient.invalidateQueries({ queryKey: ['all-vocabulary'] })
    },
  })
}

export function useDictionaryLookup(word: string) {
  return useQuery({
    queryKey: ['dictionary', word.toLowerCase().trim()],
    queryFn: () => lookupWord(word),
    enabled: word.trim().length >= 2,
    staleTime: 1000 * 60 * 60, // Cache for 1 hour
    retry: false, // Don't retry on 404
  })
}

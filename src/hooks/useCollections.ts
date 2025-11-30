import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import type { Collection } from '@/types/database'

interface CollectionWithMeta extends Collection {
  book_count?: number
  preview_covers?: (string | null)[]
}

export function useCollections() {
  const { user } = useAuth()

  const { data: collections = [], isLoading, error } = useQuery({
    queryKey: ['collections', user?.id],
    queryFn: async (): Promise<CollectionWithMeta[]> => {
      if (!user) return []

      const { data, error } = await supabase
        .from('collections')
        .select(`
          *,
          book_collections(
            book:books(cover_url)
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      return (data || []).map((collection) => ({
        ...collection,
        book_count: collection.book_collections?.length || 0,
        preview_covers: collection.book_collections
          ?.slice(0, 4)
          .map((bc: { book: { cover_url: string | null } }) => bc.book?.cover_url) || [],
      }))
    },
    enabled: !!user,
  })

  return { collections, isLoading, error }
}

export function useCollection(collectionId: string | undefined) {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['collection', collectionId],
    queryFn: async () => {
      if (!user || !collectionId) return null

      const { data, error } = await supabase
        .from('collections')
        .select(`
          *,
          book_collections(
            id,
            position,
            book:books(
              *,
              user_book:user_books(*)
            )
          )
        `)
        .eq('id', collectionId)
        .eq('user_id', user.id)
        .single()

      if (error) throw error

      // Sort by position (nulls last, then by id for consistency)
      const sortedBookCollections = [...(data.book_collections || [])].sort((a, b) => {
        if (a.position === null && b.position === null) return 0
        if (a.position === null) return 1
        if (b.position === null) return -1
        return a.position - b.position
      })

      return {
        ...data,
        books: sortedBookCollections.map((bc: { book: Record<string, unknown> }) => ({
          ...(bc.book || {}),
          user_book: (bc.book as { user_book?: unknown[] })?.user_book?.[0] || null,
        })) || [],
      }
    },
    enabled: !!user && !!collectionId,
  })
}

interface CreateCollectionInput {
  name: string
  description?: string
}

export function useCreateCollection() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ name, description }: CreateCollectionInput) => {
      if (!user) throw new Error('Not authenticated')

      const { data, error } = await supabase
        .from('collections')
        .insert({
          user_id: user.id,
          name,
          description,
        })
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collections'] })
    },
  })
}

export function useDeleteCollection() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (collectionId: string) => {
      const { error } = await supabase
        .from('collections')
        .delete()
        .eq('id', collectionId)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collections'] })
    },
  })
}

export function useAddBookToCollection() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ bookId, collectionId }: { bookId: string; collectionId: string }) => {
      const { error } = await supabase
        .from('book_collections')
        .insert({
          book_id: bookId,
          collection_id: collectionId,
        })

      if (error) throw error
    },
    onSuccess: (_, { collectionId }) => {
      queryClient.invalidateQueries({ queryKey: ['collections'] })
      queryClient.invalidateQueries({ queryKey: ['collection', collectionId] })
      queryClient.invalidateQueries({ queryKey: ['books'] })
    },
  })
}

export function useRemoveBookFromCollection() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ bookId, collectionId }: { bookId: string; collectionId: string }) => {
      const { error } = await supabase
        .from('book_collections')
        .delete()
        .eq('book_id', bookId)
        .eq('collection_id', collectionId)

      if (error) throw error
    },
    onSuccess: (_, { collectionId }) => {
      queryClient.invalidateQueries({ queryKey: ['collections'] })
      queryClient.invalidateQueries({ queryKey: ['collection', collectionId] })
      queryClient.invalidateQueries({ queryKey: ['books'] })
    },
  })
}

interface UpdateCollectionInput {
  collectionId: string
  name: string
  description?: string | null
}

export function useUpdateCollection() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ collectionId, name, description }: UpdateCollectionInput) => {
      const { data, error } = await supabase
        .from('collections')
        .update({
          name,
          description: description || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', collectionId)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: (_, { collectionId }) => {
      queryClient.invalidateQueries({ queryKey: ['collections'] })
      queryClient.invalidateQueries({ queryKey: ['collection', collectionId] })
    },
  })
}

interface ReorderBooksInput {
  collectionId: string
  bookIds: string[]
}

export function useReorderCollectionBooks() {
  return useMutation({
    mutationFn: async ({ collectionId, bookIds }: ReorderBooksInput) => {
      // Update each book_collection with its new position
      const updates = bookIds.map((bookId, index) =>
        supabase
          .from('book_collections')
          .update({ position: index })
          .eq('collection_id', collectionId)
          .eq('book_id', bookId)
      )

      const results = await Promise.all(updates)
      const errors = results.filter((r) => r.error)
      if (errors.length > 0) {
        throw errors[0].error
      }
    },
    // Don't invalidate on success - we use optimistic updates
  })
}

import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import type { Note, Book } from '@/types/database'

interface QuoteWithBook extends Note {
  book: Book
}

export function useRandomQuote() {
  const { user } = useAuth()

  const { data: quotes = [], isLoading } = useQuery({
    queryKey: ['quotes', user?.id],
    queryFn: async (): Promise<QuoteWithBook[]> => {
      if (!user) return []

      const { data, error } = await supabase
        .from('notes')
        .select('*, book:books(*)')
        .eq('user_id', user.id)
        .eq('is_quote', true)

      if (error) throw error
      return (data as QuoteWithBook[]) || []
    },
    enabled: !!user,
  })

  const randomQuote = useMemo(() => {
    if (quotes.length === 0) return null
    const randomIndex = Math.floor(Math.random() * quotes.length)
    return quotes[randomIndex]
  }, [quotes])

  return { quote: randomQuote, isLoading }
}

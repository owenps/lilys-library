interface OpenLibraryBook {
  title: string
  authors?: { name: string }[]
  covers?: number[]
  number_of_pages?: number
  subjects?: string[]
  description?: string | { value: string }
  publish_date?: string
}

interface OpenLibrarySearchResult {
  docs: {
    key: string
    title: string
    author_name?: string[]
    cover_i?: number
    first_publish_year?: number
    isbn?: string[]
    number_of_pages_median?: number
    subject?: string[]
  }[]
  numFound: number
}

export interface BookSearchResult {
  key: string
  title: string
  author: string
  coverUrl?: string
  publishYear?: number
  isbn?: string
  pageCount?: number
  genre?: string
}

export async function searchBooks(query: string): Promise<BookSearchResult[]> {
  const response = await fetch(
    `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=10`
  )

  if (!response.ok) {
    throw new Error('Failed to search books')
  }

  const data: OpenLibrarySearchResult = await response.json()

  return data.docs.map((doc) => ({
    key: doc.key,
    title: doc.title,
    author: doc.author_name?.[0] || 'Unknown Author',
    coverUrl: doc.cover_i
      ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg`
      : undefined,
    publishYear: doc.first_publish_year,
    isbn: doc.isbn?.[0],
    pageCount: doc.number_of_pages_median,
    genre: doc.subject?.[0],
  }))
}

export async function getBookByISBN(isbn: string): Promise<BookSearchResult | null> {
  const response = await fetch(
    `https://openlibrary.org/api/books?bibkeys=ISBN:${isbn}&format=json&jscmd=data`
  )

  if (!response.ok) {
    throw new Error('Failed to fetch book by ISBN')
  }

  const data = await response.json()
  const bookData = data[`ISBN:${isbn}`]

  if (!bookData) {
    return null
  }

  return {
    key: bookData.key || isbn,
    title: bookData.title,
    author: bookData.authors?.[0]?.name || 'Unknown Author',
    coverUrl: bookData.cover?.large || bookData.cover?.medium,
    publishYear: bookData.publish_date ? parseInt(bookData.publish_date) : undefined,
    isbn,
    pageCount: bookData.number_of_pages,
    genre: bookData.subjects?.[0]?.name,
  }
}

export async function getBookDetails(workKey: string): Promise<OpenLibraryBook | null> {
  const response = await fetch(`https://openlibrary.org${workKey}.json`)

  if (!response.ok) {
    return null
  }

  return response.json()
}

export function getCoverUrl(coverId: number | undefined, size: 'S' | 'M' | 'L' = 'M'): string | undefined {
  if (!coverId) return undefined
  return `https://covers.openlibrary.org/b/id/${coverId}-${size}.jpg`
}

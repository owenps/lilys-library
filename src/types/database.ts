export type ReadingStatus = "want_to_read" | "reading" | "completed" | "wishlist";

export interface Book {
  id: string;
  user_id: string;
  title: string;
  author: string;
  isbn?: string | null;
  cover_url?: string | null;
  spine_color?: string | null;
  page_count?: number | null;
  genre?: string | null;
  description?: string | null;
  published_year?: number | null;
  created_at: string;
  updated_at: string;
}

export interface UserBook {
  id: string;
  user_id: string;
  book_id: string;
  status: ReadingStatus;
  current_page: number;
  current_session_id?: string | null;
  // Legacy fields (kept for backward compatibility, prefer reading_sessions)
  rating?: number | null;
  review?: string | null;
  started_at?: string | null;
  finished_at?: string | null;
  created_at: string;
  updated_at: string;
  book?: Book;
}

export interface ReadingSession {
  id: string;
  user_id: string;
  book_id: string;
  user_book_id: string;
  read_number: number;
  started_at: string | null;
  finished_at: string | null;
  rating: number | null;
  review: string | null;
  created_at: string;
  updated_at: string;
}

export interface Collection {
  id: string;
  user_id: string;
  name: string;
  description?: string | null;
  cover_url?: string | null;
  created_at: string;
  updated_at: string;
}

export interface BookCollection {
  id: string;
  book_id: string;
  collection_id: string;
  created_at: string;
}

export interface Note {
  id: string;
  user_id: string;
  book_id: string;
  content: string;
  is_quote: boolean;
  page_number?: number | null;
  created_at: string;
  updated_at: string;
}

export interface Vocabulary {
  id: string;
  user_id: string;
  book_id: string;
  term: string;
  definition: string;
  part_of_speech?: string | null;
  phonetic?: string | null;
  example?: string | null;
  page_number?: number | null;
  created_at: string;
  updated_at: string;
}

export interface UserProfile {
  id: string;
  email: string;
  display_name?: string | null;
  avatar_url?: string | null;
  theme: ThemeName;
  created_at: string;
  updated_at: string;
}

export type ThemeName = "flat-white" | "espresso" | "cappuccino" | "spicy-chai" | "matcha" | "london-fog";

export interface BookWithDetails extends Book {
  user_book?: UserBook | null;
  collections?: Collection[];
  notes?: Note[];
  reading_sessions?: ReadingSession[];
  vocabulary?: Vocabulary[];
}

export interface ReadingStats {
  total_books: number;
  books_completed: number;
  books_reading: number;
  books_want_to_read: number;
  total_pages_read: number;
  average_rating: number | null;
  genres: Record<string, number>;
  monthly_reads: { month: string; count: number }[];
}

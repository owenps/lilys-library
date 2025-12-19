import { BookCard3D } from "./BookCard3D";
import type { BookWithDetails } from "@/types/database";

interface BookshelfViewProps {
  books: BookWithDetails[];
}

export function BookshelfView({ books }: BookshelfViewProps) {
  if (books.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <div className="mx-auto w-32 h-48 mb-6 rounded-sm bg-muted/20" />
        <p className="text-lg">Your bookshelf is empty.</p>
        <p className="text-sm mt-1">Add some books to see them displayed here!</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
      {books.map((book) => (
        <BookCard3D key={book.id} book={book} />
      ))}
    </div>
  );
}

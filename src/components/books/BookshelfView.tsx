import { Link } from "react-router-dom";
import { BookOpen } from "lucide-react";
import {
  hashStringToColor,
  darkenColor,
  lightenColor,
  isColorBright,
} from "@/lib/color-extraction";
import type { BookWithDetails } from "@/types/database";

interface BookshelfViewProps {
  books: BookWithDetails[];
}

// Get the spine color - use stored color or fallback to hash-based
function getSpineColor(book: BookWithDetails): string {
  if (book.spine_color) {
    return book.spine_color;
  }
  return hashStringToColor(book.title);
}

function BookSpine({ book }: { book: BookWithDetails }) {
  const spineWidth = Math.min(Math.max((book.page_count || 200) / 10, 24), 56);
  const spineHeight = Math.min(
    Math.max((book.page_count || 200) / 2, 140),
    220,
  );
  const spineColor = getSpineColor(book);
  const isBright = isColorBright(spineColor);
  const textColorClass = isBright ? "text-gray-900" : "text-white";

  return (
    <Link
      to={`/book/${book.id}`}
      className="group relative flex-shrink-0 cursor-pointer transition-all duration-200 hover:-translate-y-4"
      style={{ width: `${spineWidth}px`, height: `${spineHeight}px` }}
    >
      <div
        className="w-full h-full rounded-sm shadow-md overflow-hidden relative group-hover:shadow-xl transition-all border-2 border-transparent group-hover:border-primary/30"
        style={{
          background: `linear-gradient(to bottom, ${lightenColor(spineColor, 0.1)}, ${darkenColor(spineColor, 0.15)})`,
        }}
      >
        {/* Spine texture */}
        <div className="absolute inset-0 bg-gradient-to-r from-white/10 via-transparent to-black/20" />

        {/* Gold/silver trim lines */}
        <div className="absolute top-2.5 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-amber-400/50 to-transparent" />
        <div className="absolute bottom-6.5 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-amber-400/50 to-transparent" />

        {/* Title text (rotated) */}
        <div className="absolute inset-0 flex items-center justify-center pb-3">
          <span
            className={`font-semibold text-[10px] whitespace-nowrap overflow-hidden drop-shadow-sm ${textColorClass}`}
            style={{
              writingMode: "vertical-rl",
              textOrientation: "mixed",
              transform: "rotate(180deg)",
              maxHeight: "calc(100% - 35px)",
              textOverflow: "ellipsis",
            }}
          >
            {book.title}
          </span>
        </div>

        {/* Publisher-style logo at bottom */}
        <div className="absolute bottom-2 left-0 right-0 flex justify-center">
          <BookOpen className={`h-3 w-3 opacity-70 ${textColorClass}`} />
        </div>
      </div>

      {/* Hover preview */}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
        <div className="bg-popover border rounded-lg shadow-xl p-3 w-30">
          {book.cover_url && (
            <img
              src={book.cover_url}
              alt={book.title}
              className="w-full aspect-[2/3] object-cover rounded mb-2"
            />
          )}
          <p className="font-medium text-sm line-clamp-2">{book.title}</p>
          <p className="text-xs text-muted-foreground">{book.author}</p>
        </div>
      </div>
    </Link>
  );
}

export function BookshelfView({ books }: BookshelfViewProps) {
  // Group books into shelves (roughly 8-12 books per shelf based on viewport)
  const booksPerShelf = 12;
  const shelves: BookWithDetails[][] = [];

  for (let i = 0; i < books.length; i += booksPerShelf) {
    shelves.push(books.slice(i, i + booksPerShelf));
  }

  return (
    <div className="space-y-8">
      {shelves.map((shelfBooks, shelfIndex) => (
        <div key={shelfIndex} className="relative">
          {/* Shelf back */}
          <div className="absolute inset-x-0 bottom-0 h-4 bg-gradient-to-b from-amber-900/20 to-amber-950/40 rounded-b" />

          {/* Books on shelf */}
          <div className="flex items-end gap-1 h-64 px-4 pb-1">
            {shelfBooks.map((book) => (
              <BookSpine key={book.id} book={book} />
            ))}
          </div>

          {/* Shelf surface */}
          <div className="h-4 bg-gradient-to-b from-amber-700 to-amber-800 rounded shadow-lg border-t border-amber-600">
            <div className="h-full bg-gradient-to-b from-white/30 to-transparent rounded-t" />
          </div>

          {/* Shelf bracket shadow */}
          <div className="h-3 bg-gradient-to-b from-black/30 to-transparent" />
        </div>
      ))}

      {books.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <p>Your bookshelf is empty.</p>
          <p className="text-sm mt-1">
            Add some books to see them displayed here!
          </p>
        </div>
      )}
    </div>
  );
}

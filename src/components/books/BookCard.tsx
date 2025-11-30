import { Link } from "react-router-dom";
import { Star, BookOpen, CheckCircle, Clock, Heart } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import type { BookWithDetails, ReadingStatus } from "@/types/database";

interface BookCardProps {
  book: BookWithDetails;
}

const statusConfig: Record<
  ReadingStatus,
  { label: string; icon: typeof BookOpen; className: string }
> = {
  reading: {
    label: "Reading",
    icon: BookOpen,
    className: "bg-blue-500/10 text-blue-500",
  },
  completed: {
    label: "Completed",
    icon: CheckCircle,
    className: "bg-green-500/10 text-green-500",
  },
  want_to_read: {
    label: "Want to Read",
    icon: Clock,
    className: "bg-orange-500/10 text-orange-500",
  },
  wishlist: {
    label: "Wishlist",
    icon: Heart,
    className: "bg-pink-500/10 text-pink-500",
  },
};

export function BookCard({ book }: BookCardProps) {
  const status = book.user_book?.status || "want_to_read";
  const statusInfo = statusConfig[status];
  const StatusIcon = statusInfo.icon;
  const progress =
    book.page_count && book.user_book?.current_page
      ? Math.round((book.user_book.current_page / book.page_count) * 100)
      : 0;

  // Get latest rating from reading sessions (sorted by read_number desc)
  const latestRating = book.reading_sessions?.find((s) => s.rating)?.rating;

  return (
    <Link to={`/book/${book.id}`}>
      <Card className="group overflow-hidden border-2 border-transparent hover:border-primary/30 transition-colors">
        <div className="aspect-[2/3] overflow-hidden bg-muted">
          {book.cover_url ? (
            <img
              src={book.cover_url}
              alt={book.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
              <BookOpen className="h-12 w-12 text-primary/40" />
            </div>
          )}
        </div>
        <CardContent className="px-3 pt-1 pb-2 space-y-1">
          <Badge
            variant="secondary"
            className={cn("gap-1", statusInfo.className)}
          >
            <StatusIcon className="h-3 w-3" />
            {statusInfo.label}
          </Badge>
          <h3 className="font-semibold leading-tight line-clamp-2 group-hover:text-primary transition-colors">
            {book.title}
          </h3>
          <p className="text-sm text-muted-foreground line-clamp-1">
            {book.author}
          </p>
          {latestRating && (
            <div className="flex items-center gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={cn(
                    "h-3.5 w-3.5",
                    i < latestRating
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-muted-foreground/30",
                  )}
                />
              ))}
            </div>
          )}
          {status === "reading" && book.page_count && (
            <div className="space-y-1">
              <Progress value={progress} className="h-1.5" />
              <p className="text-xs text-muted-foreground">
                {book.user_book?.current_page || 0} of {book.page_count} pages (
                {progress}%)
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}

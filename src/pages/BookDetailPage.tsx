import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { format } from "date-fns";
import {
  ArrowLeft,
  BookOpen,
  Star,
  Edit,
  Trash2,
  Plus,
  Clock,
  CheckCircle,
  Heart,
  Calendar as CalendarIcon,
  FileText,
  Quote,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useBook, useUpdateUserBook, useDeleteBook } from "@/hooks/useBooks";
import { useNotes, useCreateNote, useDeleteNote, useUpdateNote } from "@/hooks/useNotes";
import {
  useStartNewSession,
  useUpdateSession,
  useDeleteSession,
} from "@/hooks/useReadingSessions";
import { SpineColorPicker } from "@/components/books/SpineColorPicker";
import { cn } from "@/lib/utils";
import type { ReadingStatus, ReadingSession } from "@/types/database";
import { toast } from "sonner";

const statusConfig: Record<
  ReadingStatus,
  { label: string; icon: typeof BookOpen; className: string }
> = {
  reading: {
    label: "Currently Reading",
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

export function BookDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: book, isLoading } = useBook(id);
  const { notes } = useNotes(id);
  const updateUserBook = useUpdateUserBook();
  const deleteBook = useDeleteBook();
  const createNote = useCreateNote();
  const deleteNote = useDeleteNote();
  const updateNote = useUpdateNote();
  const startNewSession = useStartNewSession();
  const updateSession = useUpdateSession();
  const deleteSession = useDeleteSession();

  const [currentPage, setCurrentPage] = useState("");
  const [newNote, setNewNote] = useState("");
  const [notePageNumber, setNotePageNumber] = useState("");
  const [isQuote, setIsQuote] = useState(false);
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [sessionStartDate, setSessionStartDate] = useState<Date | undefined>();
  const [sessionEndDate, setSessionEndDate] = useState<Date | undefined>();
  const [sessionRating, setSessionRating] = useState(0);
  const [sessionReview, setSessionReview] = useState("");
  const [expandedReviews, setExpandedReviews] = useState<Set<string>>(new Set());
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editNoteContent, setEditNoteContent] = useState("");
  const [editNoteIsQuote, setEditNoteIsQuote] = useState(false);
  const [editNotePageNumber, setEditNotePageNumber] = useState("");

  // Get sessions from book data
  const sessions = book?.reading_sessions || [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!book) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Book not found</p>
        <Link to="/" className="text-primary hover:underline mt-2 inline-block">
          Return to library
        </Link>
      </div>
    );
  }

  const status = book.user_book?.status || "want_to_read";
  const statusInfo = statusConfig[status];
  const StatusIcon = statusInfo.icon;
  const progress =
    book.page_count && book.user_book?.current_page
      ? Math.round((book.user_book.current_page / book.page_count) * 100)
      : 0;

  const handleStatusChange = async (newStatus: ReadingStatus) => {
    try {
      await updateUserBook.mutateAsync({
        bookId: book.id,
        status: newStatus,
      });
      toast.success(`Status updated to ${statusConfig[newStatus].label}`);
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  const handleUpdateProgress = async () => {
    const page = parseInt(currentPage);
    if (isNaN(page) || page < 0) return;

    try {
      await updateUserBook.mutateAsync({
        bookId: book.id,
        current_page: page,
      });
      setCurrentPage("");
      toast.success("Progress updated");
    } catch (error) {
      toast.error("Failed to update progress");
    }
  };

  const handleAddNote = async () => {
    if (!newNote.trim()) return;

    try {
      await createNote.mutateAsync({
        bookId: book.id,
        content: newNote.trim(),
        isQuote,
        pageNumber: notePageNumber ? parseInt(notePageNumber) : undefined,
      });
      setNewNote("");
      setNotePageNumber("");
      setIsQuote(false);
      toast.success(isQuote ? "Quote added" : "Note added");
    } catch {
      toast.error("Failed to add note");
    }
  };

  const handleEditNote = (note: { id: string; content: string; is_quote: boolean; page_number?: number | null }) => {
    setEditingNoteId(note.id);
    setEditNoteContent(note.content);
    setEditNoteIsQuote(note.is_quote);
    setEditNotePageNumber(note.page_number?.toString() || "");
  };

  const handleSaveNote = async () => {
    if (!editingNoteId || !editNoteContent.trim()) return;

    try {
      await updateNote.mutateAsync({
        noteId: editingNoteId,
        bookId: book.id,
        content: editNoteContent.trim(),
        isQuote: editNoteIsQuote,
        pageNumber: editNotePageNumber ? parseInt(editNotePageNumber) : null,
      });
      setEditingNoteId(null);
      toast.success("Note updated");
    } catch {
      toast.error("Failed to update note");
    }
  };

  const handleCancelEditNote = () => {
    setEditingNoteId(null);
    setEditNoteContent("");
    setEditNoteIsQuote(false);
    setEditNotePageNumber("");
  };

  const handleDeleteBook = async () => {
    try {
      await deleteBook.mutateAsync(book.id);
      toast.success("Book removed from library");
      navigate("/");
    } catch (error) {
      toast.error("Failed to delete book");
    }
  };

  const handleStartNewRead = async () => {
    if (!book.user_book) return;
    try {
      await startNewSession.mutateAsync({
        bookId: book.id,
        userBookId: book.user_book.id,
      });
      toast.success("Started a new read!");
    } catch {
      toast.error("Failed to start new read");
    }
  };

  const handleEditSession = (session: ReadingSession) => {
    setEditingSessionId(session.id);
    setSessionStartDate(
      session.started_at ? new Date(session.started_at) : undefined,
    );
    setSessionEndDate(
      session.finished_at ? new Date(session.finished_at) : undefined,
    );
    setSessionRating(session.rating || 0);
    setSessionReview(session.review || "");
  };

  const handleSaveSession = async () => {
    if (!editingSessionId) return;
    try {
      await updateSession.mutateAsync({
        sessionId: editingSessionId,
        bookId: book.id,
        started_at: sessionStartDate ? sessionStartDate.toISOString() : null,
        finished_at: sessionEndDate ? sessionEndDate.toISOString() : null,
        rating: sessionRating || null,
        review: sessionReview.trim() || null,
      });
      setEditingSessionId(null);
      toast.success("Session updated");
    } catch {
      toast.error("Failed to update session");
    }
  };

  const handleDeleteSession = async (sessionId: string, isCurrent: boolean) => {
    try {
      await deleteSession.mutateAsync({
        sessionId,
        bookId: book.id,
        userBookId: book.user_book?.id,
        isCurrentSession: isCurrent,
      });
      toast.success("Reading session deleted");
    } catch {
      toast.error("Failed to delete session");
    }
  };

  return (
    <div className="space-y-6">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate(-1)}
        className="gap-2"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </Button>

      <div className="grid gap-6 md:grid-cols-[300px_1fr]">
        {/* Book Cover & Quick Actions */}
        <div className="space-y-4">
          <div className="aspect-[2/3] rounded-lg overflow-hidden bg-muted shadow-lg">
            {book.cover_url ? (
              <img
                src={book.cover_url}
                alt={book.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
                <BookOpen className="h-16 w-16 text-primary/40" />
              </div>
            )}
          </div>

          {status === "reading" && book.page_count && (
            <Card>
              <CardContent className="pt-4 space-y-3">
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>Progress</span>
                    <span className="text-muted-foreground">
                      {book.user_book?.current_page || 0} / {book.page_count}{" "}
                      pages
                    </span>
                  </div>
                  <Progress value={progress} />
                </div>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="Page #"
                    value={currentPage}
                    onChange={(e) => setCurrentPage(e.target.value)}
                    className="flex-1"
                    min={0}
                    max={book.page_count}
                  />
                  <Button size="sm" onClick={handleUpdateProgress}>
                    Update
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex gap-2">
            <Select value={status} onValueChange={handleStatusChange}>
              <SelectTrigger className="flex-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="want_to_read">Want to Read</SelectItem>
                <SelectItem value="reading">Currently Reading</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="wishlist">Wishlist</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" asChild>
              <Link to={`/book/${book.id}/edit`}>
                <Edit className="h-4 w-4" />
              </Link>
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Book</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to remove "{book.title}" from your
                    library? This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDeleteBook}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        {/* Book Details & Tabs */}
        <div className="space-y-6">
          <div>
            <Badge className={cn("mb-2 gap-1", statusInfo.className)}>
              <StatusIcon className="h-3 w-3" />
              {statusInfo.label}
            </Badge>
            <h1 className="text-3xl font-bold tracking-tight">{book.title}</h1>
            <p className="text-xl text-muted-foreground mt-1">{book.author}</p>

            <div className="flex flex-wrap items-center gap-4 mt-4 text-sm text-muted-foreground">
              {book.published_year && (
                <span className="flex items-center gap-1">
                  <CalendarIcon className="h-4 w-4" />
                  {book.published_year}
                </span>
              )}
              {book.page_count && (
                <span className="flex items-center gap-1">
                  <FileText className="h-4 w-4" />
                  {book.page_count} pages
                </span>
              )}
              {book.genre && <Badge variant="secondary">{book.genre}</Badge>}
            </div>

            {(() => {
              const latestRating = sessions.find((s) => s.rating)?.rating;
              return latestRating ? (
                <div className="flex items-center gap-1 mt-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={cn(
                        "h-5 w-5",
                        i < latestRating
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-muted-foreground/30",
                      )}
                    />
                  ))}
                </div>
              ) : null;
            })()}
          </div>

          {book.description && (
            <p className="text-muted-foreground leading-relaxed">
              {book.description}
            </p>
          )}

          <Separator />

          <Tabs defaultValue="diary">
            <TabsList>
              <TabsTrigger value="diary">Diary</TabsTrigger>
              <TabsTrigger value="notes">Notes & Quotes</TabsTrigger>
              <TabsTrigger value="display">Display</TabsTrigger>
            </TabsList>

            <TabsContent value="diary" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Reading Diary</CardTitle>
                  <CardDescription>
                    {sessions.length === 0
                      ? "Track when you read this book"
                      : sessions.length === 1
                        ? "1 read"
                        : `${sessions.length} reads`}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {sessions.length === 0 ? (
                    <div className="text-center py-4 text-muted-foreground">
                      <CalendarIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>Start reading to track your progress</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {sessions.map((session) => {
                        const isCurrent =
                          session.id === book.user_book?.current_session_id;
                        const isEditing = editingSessionId === session.id;

                        return (
                          <div
                            key={session.id}
                            className={cn(
                              "p-3 rounded-lg border",
                              isCurrent
                                ? "border-primary bg-primary/5"
                                : "border-border",
                            )}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  {isCurrent && (
                                    <Badge
                                      variant="secondary"
                                      className="text-xs"
                                    >
                                      Current
                                    </Badge>
                                  )}
                                </div>

                                {isEditing ? (
                                  <div className="space-y-3 mt-2">
                                    <div className="flex gap-2">
                                      <Popover>
                                        <PopoverTrigger asChild>
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            className={cn(
                                              "justify-start text-left font-normal",
                                              !sessionStartDate &&
                                                "text-muted-foreground",
                                            )}
                                          >
                                            <CalendarIcon className="mr-2 h-3 w-3" />
                                            {sessionStartDate
                                              ? format(
                                                  sessionStartDate,
                                                  "MMM d, y",
                                                )
                                              : "Start"}
                                          </Button>
                                        </PopoverTrigger>
                                        <PopoverContent
                                          className="w-auto p-0"
                                          align="start"
                                        >
                                          <Calendar
                                            mode="single"
                                            selected={sessionStartDate}
                                            onSelect={setSessionStartDate}
                                            initialFocus
                                          />
                                        </PopoverContent>
                                      </Popover>
                                      {(status === "completed" ||
                                        session.finished_at) && (
                                        <Popover>
                                          <PopoverTrigger asChild>
                                            <Button
                                              variant="outline"
                                              size="sm"
                                              className={cn(
                                                "justify-start text-left font-normal",
                                                !sessionEndDate &&
                                                  "text-muted-foreground",
                                              )}
                                            >
                                              <CalendarIcon className="mr-2 h-3 w-3" />
                                              {sessionEndDate
                                                ? format(
                                                    sessionEndDate,
                                                    "MMM d, y",
                                                  )
                                                : "End"}
                                            </Button>
                                          </PopoverTrigger>
                                          <PopoverContent
                                            className="w-auto p-0"
                                            align="start"
                                          >
                                            <Calendar
                                              mode="single"
                                              selected={sessionEndDate}
                                              onSelect={setSessionEndDate}
                                              initialFocus
                                            />
                                          </PopoverContent>
                                        </Popover>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <span className="text-xs text-muted-foreground mr-1">
                                        Rating:
                                      </span>
                                      {Array.from({ length: 5 }).map((_, i) => (
                                        <button
                                          key={i}
                                          onClick={() =>
                                            setSessionRating(i + 1)
                                          }
                                          className="p-0.5 hover:scale-110 transition-transform"
                                        >
                                          <Star
                                            className={cn(
                                              "h-4 w-4",
                                              i < sessionRating
                                                ? "fill-yellow-400 text-yellow-400"
                                                : "text-muted-foreground/30",
                                            )}
                                          />
                                        </button>
                                      ))}
                                      {sessionRating > 0 && (
                                        <button
                                          onClick={() => setSessionRating(0)}
                                          className="text-xs text-muted-foreground hover:text-foreground ml-1"
                                        >
                                          Clear
                                        </button>
                                      )}
                                    </div>
                                    <Textarea
                                      placeholder="Write your review (optional)..."
                                      value={sessionReview}
                                      onChange={(e) =>
                                        setSessionReview(e.target.value)
                                      }
                                      rows={3}
                                      className="text-sm"
                                    />
                                    <div className="flex gap-2">
                                      <Button
                                        size="sm"
                                        onClick={handleSaveSession}
                                        disabled={updateSession.isPending}
                                      >
                                        {updateSession.isPending
                                          ? "Saving..."
                                          : "Save"}
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() =>
                                          setEditingSessionId(null)
                                        }
                                      >
                                        Cancel
                                      </Button>
                                    </div>
                                  </div>
                                ) : (
                                  <>
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                      <CalendarIcon className="h-3 w-3" />
                                      {session.started_at ? (
                                        <>
                                          {format(
                                            new Date(session.started_at),
                                            "MMM d, y",
                                          )}
                                          {session.finished_at && (
                                            <>
                                              {" - "}
                                              {format(
                                                new Date(session.finished_at),
                                                "MMM d, y",
                                              )}
                                            </>
                                          )}
                                        </>
                                      ) : (
                                        "Not started"
                                      )}
                                    </div>
                                    {session.rating && (
                                      <div className="flex items-center gap-0.5 mt-1">
                                        {Array.from({ length: 5 }).map(
                                          (_, i) => (
                                            <Star
                                              key={i}
                                              className={cn(
                                                "h-3 w-3",
                                                i < session.rating!
                                                  ? "fill-yellow-400 text-yellow-400"
                                                  : "text-muted-foreground/30",
                                              )}
                                            />
                                          ),
                                        )}
                                      </div>
                                    )}
                                    {session.review && (
                                      <div className="mt-2">
                                        <p className="text-sm text-muted-foreground">
                                          {expandedReviews.has(session.id) ||
                                          session.review.length <= 150
                                            ? session.review
                                            : `${session.review.slice(0, 150)}...`}
                                        </p>
                                        {session.review.length > 150 && (
                                          <button
                                            onClick={() => {
                                              setExpandedReviews((prev) => {
                                                const next = new Set(prev);
                                                if (next.has(session.id)) {
                                                  next.delete(session.id);
                                                } else {
                                                  next.add(session.id);
                                                }
                                                return next;
                                              });
                                            }}
                                            className="text-sm text-primary hover:underline mt-1"
                                          >
                                            {expandedReviews.has(session.id)
                                              ? "Show less"
                                              : "Show more"}
                                          </button>
                                        )}
                                      </div>
                                    )}
                                  </>
                                )}
                              </div>
                              {!isEditing && (
                                <div className="flex gap-1">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleEditSession(session)}
                                    className="text-muted-foreground"
                                  >
                                    <Edit className="h-3 w-3" />
                                  </Button>
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-muted-foreground hover:text-destructive"
                                      >
                                        <Trash2 className="h-3 w-3" />
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>
                                          Delete Reading Session
                                        </AlertDialogTitle>
                                        <AlertDialogDescription>
                                          Are you sure you want to delete the
                                          session
                                          {session.started_at && (
                                            <>
                                              {" "}
                                              from{" "}
                                              {format(
                                                new Date(session.started_at),
                                                "MMM d, y",
                                              )}
                                            </>
                                          )}
                                          ? This will remove the dates and
                                          rating.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>
                                          Cancel
                                        </AlertDialogCancel>
                                        <AlertDialogAction
                                          onClick={() =>
                                            handleDeleteSession(
                                              session.id,
                                              isCurrent,
                                            )
                                          }
                                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                        >
                                          Delete
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}

                      {status === "completed" && (
                        <Button
                          variant="outline"
                          className="w-full gap-2"
                          onClick={handleStartNewRead}
                          disabled={startNewSession.isPending}
                        >
                          <RefreshCw className="h-4 w-4" />
                          {startNewSession.isPending
                            ? "Starting..."
                            : "Read Again"}
                        </Button>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

            </TabsContent>

            <TabsContent value="notes" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Add Note or Quote</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-4">
                    <Button
                      variant={isQuote ? "outline" : "secondary"}
                      size="sm"
                      onClick={() => setIsQuote(false)}
                      className="gap-2"
                    >
                      <FileText className="h-4 w-4" />
                      Note
                    </Button>
                    <Button
                      variant={isQuote ? "secondary" : "outline"}
                      size="sm"
                      onClick={() => setIsQuote(true)}
                      className="gap-2"
                    >
                      <Quote className="h-4 w-4" />
                      Quote
                    </Button>
                  </div>

                  <Textarea
                    placeholder={
                      isQuote
                        ? "Enter a quote from the book..."
                        : "Write your note..."
                    }
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    rows={3}
                  />

                  <div className="flex gap-2 items-end">
                    <div className="space-y-2">
                      <Label htmlFor="pageNum">Page (optional)</Label>
                      <Input
                        id="pageNum"
                        type="number"
                        placeholder="#"
                        value={notePageNumber}
                        onChange={(e) => setNotePageNumber(e.target.value)}
                        className="w-24"
                      />
                    </div>
                    <Button onClick={handleAddNote} disabled={!newNote.trim()}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add {isQuote ? "Quote" : "Note"}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {notes.length > 0 && (
                <div className="space-y-3">
                  {notes.map((note) => {
                    const isEditing = editingNoteId === note.id;

                    return (
                      <Card key={note.id}>
                        <CardContent className="pt-4">
                          {isEditing ? (
                            <div className="space-y-3">
                              <div className="flex gap-4">
                                <Button
                                  variant={editNoteIsQuote ? "outline" : "secondary"}
                                  size="sm"
                                  onClick={() => setEditNoteIsQuote(false)}
                                  className="gap-2"
                                >
                                  <FileText className="h-4 w-4" />
                                  Note
                                </Button>
                                <Button
                                  variant={editNoteIsQuote ? "secondary" : "outline"}
                                  size="sm"
                                  onClick={() => setEditNoteIsQuote(true)}
                                  className="gap-2"
                                >
                                  <Quote className="h-4 w-4" />
                                  Quote
                                </Button>
                              </div>
                              <Textarea
                                value={editNoteContent}
                                onChange={(e) => setEditNoteContent(e.target.value)}
                                rows={3}
                              />
                              <div className="flex gap-2 items-end">
                                <div className="space-y-2">
                                  <Label htmlFor={`editPageNum-${note.id}`}>Page</Label>
                                  <Input
                                    id={`editPageNum-${note.id}`}
                                    type="number"
                                    placeholder="#"
                                    value={editNotePageNumber}
                                    onChange={(e) => setEditNotePageNumber(e.target.value)}
                                    className="w-24"
                                  />
                                </div>
                                <Button
                                  size="sm"
                                  onClick={handleSaveNote}
                                  disabled={updateNote.isPending}
                                >
                                  {updateNote.isPending ? "Saving..." : "Save"}
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={handleCancelEditNote}
                                >
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1">
                                {note.is_quote ? (
                                  <blockquote className="border-l-2 border-primary pl-4 italic">
                                    "{note.content}"
                                  </blockquote>
                                ) : (
                                  <p>{note.content}</p>
                                )}
                                <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                                  {note.page_number && (
                                    <span>Page {note.page_number}</span>
                                  )}
                                  <span>
                                    {format(
                                      new Date(note.created_at),
                                      "MMM d, yyyy"
                                    )}
                                  </span>
                                </div>
                              </div>
                              <div className="flex gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEditNote(note)}
                                  className="text-muted-foreground"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => deleteNote.mutate(note.id)}
                                  className="text-muted-foreground hover:text-destructive"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}

              {notes.length === 0 && (
                <p className="text-center text-muted-foreground py-8">
                  No notes yet. Add your first note or quote above!
                </p>
              )}
            </TabsContent>

            <TabsContent value="display" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Bookshelf Display</CardTitle>
                  <CardDescription>
                    Customize how this book appears on your bookshelf
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <SpineColorPicker
                    bookId={book.id}
                    bookTitle={book.title}
                    currentColor={book.spine_color}
                    coverUrl={book.cover_url}
                  />
                </CardContent>
              </Card>

              {book.isbn && (
                <Card>
                  <CardHeader>
                    <CardTitle>Book Info</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <dl className="grid grid-cols-2 gap-2">
                      <dt className="text-muted-foreground text-sm">ISBN</dt>
                      <dd className="text-sm">{book.isbn}</dd>
                    </dl>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

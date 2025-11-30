import { useState, useMemo, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  ArrowLeft,
  Plus,
  X,
  BookOpen,
  Trash2,
  Pencil,
  Check,
  Search,
  GripVertical,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  useCollection,
  useUpdateCollection,
  useDeleteCollection,
  useAddBookToCollection,
  useRemoveBookFromCollection,
  useReorderCollectionBooks,
} from "@/hooks/useCollections";
import { useBooks } from "@/hooks/useBooks";
import { toast } from "sonner";
import type { BookWithDetails } from "@/types/database";

interface SortableBookCardProps {
  book: BookWithDetails;
  onRemove: (bookId: string) => void;
}

function SortableBookCard({ book, onRemove }: SortableBookCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: book.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1000 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="relative group">
      <Link to={`/book/${book.id}`}>
        <Card className="overflow-hidden border-2 border-transparent hover:border-primary/30 transition-colors">
          <div className="aspect-[2/3] overflow-hidden bg-muted relative">
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
          <CardContent className="px-3 pt-1 pb-2">
            <h3 className="font-semibold leading-tight line-clamp-2 group-hover:text-primary transition-colors">
              {book.title}
            </h3>
            <p className="text-sm text-muted-foreground line-clamp-1">
              {book.author}
            </p>
          </CardContent>
        </Card>
      </Link>
      {/* Drag handle */}
      <button
        {...attributes}
        {...listeners}
        className="absolute top-2 left-2 h-7 w-7 flex items-center justify-center rounded opacity-0 group-hover:opacity-100 transition-opacity bg-background/80 hover:bg-background cursor-grab active:cursor-grabbing"
        onClick={(e) => e.preventDefault()}
      >
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </button>
      {/* Remove button */}
      <Button
        variant="secondary"
        size="icon"
        className="absolute top-2 right-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity bg-background/80 hover:bg-destructive hover:text-destructive-foreground"
        onClick={(e) => {
          e.preventDefault();
          onRemove(book.id);
        }}
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}

export function CollectionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: collection, isLoading } = useCollection(id);
  const { books: allBooks } = useBooks();
  const updateCollection = useUpdateCollection();
  const deleteCollection = useDeleteCollection();
  const addBookToCollection = useAddBookToCollection();
  const removeBookFromCollection = useRemoveBookFromCollection();
  const reorderBooks = useReorderCollectionBooks();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isAddBooksOpen, setIsAddBooksOpen] = useState(false);
  const [selectedBooks, setSelectedBooks] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [orderedBooks, setOrderedBooks] = useState<BookWithDetails[]>([]);

  // Sync local state with server data
  useEffect(() => {
    if (collection?.books) {
      setOrderedBooks(collection.books as BookWithDetails[]);
    }
  }, [collection?.books]);

  const collectionBookIds = useMemo(
    () => new Set(collection?.books?.map((b: BookWithDetails) => b.id) || []),
    [collection?.books]
  );

  const availableBooks = useMemo(() => {
    return allBooks.filter(
      (book) =>
        !collectionBookIds.has(book.id) &&
        (searchQuery === "" ||
          book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          book.author.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [allBooks, collectionBookIds, searchQuery]);

  const handleStartEditName = () => {
    setEditName(collection?.name || "");
    setIsEditingName(true);
  };

  const handleSaveName = async () => {
    if (!id || !editName.trim()) return;
    try {
      await updateCollection.mutateAsync({
        collectionId: id,
        name: editName.trim(),
        description: collection?.description,
      });
      setIsEditingName(false);
      toast.success("Collection updated");
    } catch {
      toast.error("Failed to update collection");
    }
  };

  const handleStartEditDescription = () => {
    setEditDescription(collection?.description || "");
    setIsEditingDescription(true);
  };

  const handleSaveDescription = async () => {
    if (!id) return;
    try {
      await updateCollection.mutateAsync({
        collectionId: id,
        name: collection?.name || "",
        description: editDescription.trim() || null,
      });
      setIsEditingDescription(false);
      toast.success("Collection updated");
    } catch {
      toast.error("Failed to update collection");
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    try {
      await deleteCollection.mutateAsync(id);
      toast.success("Collection deleted");
      navigate("/collections");
    } catch {
      toast.error("Failed to delete collection");
    }
  };

  const handleRemoveBook = async (bookId: string) => {
    if (!id) return;
    try {
      await removeBookFromCollection.mutateAsync({
        bookId,
        collectionId: id,
      });
      toast.success("Book removed from collection");
    } catch {
      toast.error("Failed to remove book");
    }
  };

  const handleAddBooks = async () => {
    if (!id || selectedBooks.length === 0) return;
    try {
      await Promise.all(
        selectedBooks.map((bookId) =>
          addBookToCollection.mutateAsync({ bookId, collectionId: id })
        )
      );
      toast.success(
        `Added ${selectedBooks.length} book${selectedBooks.length > 1 ? "s" : ""} to collection`
      );
      setSelectedBooks([]);
      setIsAddBooksOpen(false);
    } catch {
      toast.error("Failed to add books");
    }
  };

  const toggleBookSelection = (bookId: string) => {
    setSelectedBooks((prev) =>
      prev.includes(bookId)
        ? prev.filter((id) => id !== bookId)
        : [...prev, bookId]
    );
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || !id || orderedBooks.length === 0) return;

    if (active.id !== over.id) {
      const oldIndex = orderedBooks.findIndex((b) => b.id === active.id);
      const newIndex = orderedBooks.findIndex((b) => b.id === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        const newOrder = arrayMove(orderedBooks, oldIndex, newIndex);

        // Optimistically update local state
        setOrderedBooks(newOrder);

        // Persist to server
        const bookIds = newOrder.map((b) => b.id);
        reorderBooks.mutate(
          { collectionId: id, bookIds },
          {
            onError: () => {
              // Revert on error
              setOrderedBooks(orderedBooks);
              toast.error("Failed to reorder books");
            },
          }
        );
      }
    }
  };

  const bookIds = useMemo(
    () => orderedBooks.map((b) => b.id),
    [orderedBooks]
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-pulse text-muted-foreground">
          Loading collection...
        </div>
      </div>
    );
  }

  if (!collection) {
    return (
      <div className="space-y-4">
        <Link
          to="/collections"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Collections
        </Link>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Collection not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <Link
          to="/collections"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Collections
        </Link>

        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-2">
            {/* Editable Name */}
            {isEditingName ? (
              <div className="flex items-center gap-2">
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="text-2xl font-bold h-auto py-1"
                  autoFocus
                />
                <Button size="sm" onClick={handleSaveName}>
                  <Check className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setIsEditingName(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <h1
                className="text-3xl font-bold tracking-tight cursor-pointer hover:text-primary/80 transition-colors inline-flex items-center gap-2 group"
                onClick={handleStartEditName}
              >
                {collection.name}
                <Pencil className="h-4 w-4 opacity-0 group-hover:opacity-50 transition-opacity" />
              </h1>
            )}

            {/* Editable Description */}
            {isEditingDescription ? (
              <div className="space-y-2">
                <Textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  placeholder="Add a description..."
                  rows={2}
                  autoFocus
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleSaveDescription}>
                    Save
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setIsEditingDescription(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <p
                className="text-muted-foreground cursor-pointer hover:text-foreground transition-colors inline-flex items-center gap-2 group"
                onClick={handleStartEditDescription}
              >
                {collection.description || "Add a description..."}
                <Pencil className="h-3 w-3 opacity-0 group-hover:opacity-50 transition-opacity" />
              </p>
            )}

            <p className="text-sm text-muted-foreground">
              {orderedBooks.length} book
              {orderedBooks.length !== 1 ? "s" : ""}
            </p>
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={() => setShowDeleteDialog(true)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Add Books Button */}
      <Dialog open={isAddBooksOpen} onOpenChange={setIsAddBooksOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" className="gap-2">
            <Plus className="h-4 w-4" />
            Add Books
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Books to Collection</DialogTitle>
            <DialogDescription>
              Select books from your library to add to this collection
            </DialogDescription>
          </DialogHeader>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search books..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          <ScrollArea className="h-[300px] pr-4">
            {availableBooks.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {searchQuery
                  ? "No matching books found"
                  : "All books are already in this collection"}
              </div>
            ) : (
              <div className="space-y-2">
                {availableBooks.map((book) => (
                  <div
                    key={book.id}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted cursor-pointer"
                    onClick={() => toggleBookSelection(book.id)}
                  >
                    <Checkbox
                      checked={selectedBooks.includes(book.id)}
                      onCheckedChange={() => toggleBookSelection(book.id)}
                    />
                    <div className="h-12 w-8 rounded overflow-hidden bg-muted flex-shrink-0">
                      {book.cover_url ? (
                        <img
                          src={book.cover_url}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <BookOpen className="h-4 w-4 text-muted-foreground/40" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{book.title}</p>
                      <p className="text-sm text-muted-foreground truncate">
                        {book.author}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button
              onClick={handleAddBooks}
              disabled={selectedBooks.length === 0}
            >
              Add {selectedBooks.length > 0 ? `(${selectedBooks.length})` : ""}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Books Grid */}
      {orderedBooks.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <BookOpen className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium">No books in this collection</h3>
            <p className="text-muted-foreground mt-1">
              Add books from your library to get started
            </p>
          </CardContent>
        </Card>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={bookIds} strategy={rectSortingStrategy}>
            <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {orderedBooks.map((book) => (
                <SortableBookCard
                  key={book.id}
                  book={book}
                  onRemove={handleRemoveBook}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Collection</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{collection.name}"? The books in
              this collection will not be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

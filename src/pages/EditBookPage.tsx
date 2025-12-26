import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useBook, useUpdateBook } from "@/hooks/useBooks";
import { toast } from "sonner";
import { CountrySelect } from "@/components/ui/country-select";

export function EditBookPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: book, isLoading } = useBook(id);
  const updateBook = useUpdateBook();

  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [authorNationality, setAuthorNationality] = useState<string | undefined>();
  const [isbn, setIsbn] = useState("");
  const [coverUrl, setCoverUrl] = useState("");
  const [pageCount, setPageCount] = useState("");
  const [genre, setGenre] = useState("");
  const [description, setDescription] = useState("");
  const [publishedYear, setPublishedYear] = useState("");

  useEffect(() => {
    if (book) {
      setTitle(book.title);
      setAuthor(book.author);
      setAuthorNationality(book.author_nationality || undefined);
      setIsbn(book.isbn || "");
      setCoverUrl(book.cover_url || "");
      setPageCount(book.page_count?.toString() || "");
      setGenre(book.genre || "");
      setDescription(book.description || "");
      setPublishedYear(book.published_year?.toString() || "");
    }
  }, [book]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!id) return;

    if (!title.trim() || !author.trim()) {
      toast.error("Please enter at least a title and author");
      return;
    }

    try {
      await updateBook.mutateAsync({
        id,
        title: title.trim(),
        author: author.trim(),
        author_nationality: authorNationality || null,
        isbn: isbn.trim() || undefined,
        cover_url: coverUrl.trim() || undefined,
        page_count: pageCount ? parseInt(pageCount) : undefined,
        genre: genre.trim() || undefined,
        description: description.trim() || undefined,
        published_year: publishedYear ? parseInt(publishedYear) : undefined,
      });

      toast.success("Book updated!");
      navigate(`/book/${id}`);
    } catch (error) {
      console.error("Error updating book:", error);
      toast.error("Failed to update book");
    }
  };

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
        <Button variant="link" onClick={() => navigate("/")}>
          Return to library
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate(-1)}
        className="gap-2"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </Button>

      <div>
        <h1 className="text-3xl font-bold tracking-tight">Edit Book</h1>
        <p className="text-muted-foreground">Update book details</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Book Details</CardTitle>
          <CardDescription>
            Edit the information for "{book.title}"
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="author">Author *</Label>
                <Input
                  id="author"
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Author's Country</Label>
              <CountrySelect
                value={authorNationality}
                onChange={setAuthorNationality}
                placeholder="Select author's country..."
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="isbn">ISBN</Label>
                <Input
                  id="isbn"
                  value={isbn}
                  onChange={(e) => setIsbn(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pageCount">Page Count</Label>
                <Input
                  id="pageCount"
                  type="number"
                  value={pageCount}
                  onChange={(e) => setPageCount(e.target.value)}
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="genre">Genre</Label>
                <Input
                  id="genre"
                  value={genre}
                  onChange={(e) => setGenre(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="publishedYear">Published Year</Label>
                <Input
                  id="publishedYear"
                  type="number"
                  value={publishedYear}
                  onChange={(e) => setPublishedYear(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="coverUrl">Cover URL</Label>
              <Input
                id="coverUrl"
                value={coverUrl}
                onChange={(e) => setCoverUrl(e.target.value.trim())}
                placeholder="https://..."
              />
              <p className="text-xs text-muted-foreground">
                Tip: Upload to <a href="https://imgur.com/upload" target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground">Imgur</a>, then right-click the image and "Copy image address"
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="submit" disabled={updateBook.isPending}>
                {updateBook.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(-1)}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

import { useState } from "react";
import { Mail, Calendar, BookOpen, CheckCircle, Clock, Heart } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { useBooks, useWishlistBooks } from "@/hooks/useBooks";
import { format } from "date-fns";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

export function ProfilePage() {
  const { user } = useAuth();
  const { books } = useBooks();
  const { books: wishlistBooks } = useWishlistBooks();

  const [displayName, setDisplayName] = useState(
    user?.user_metadata?.full_name || user?.user_metadata?.name || ""
  );
  const [isSaving, setIsSaving] = useState(false);

  const stats = {
    total: books.length,
    completed: books.filter((b) => b.user_book?.status === "completed").length,
    reading: books.filter((b) => b.user_book?.status === "reading").length,
    wantToRead: books.filter((b) => b.user_book?.status === "want_to_read").length,
    wishlist: wishlistBooks.length,
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({
        data: { full_name: displayName },
      });
      if (error) throw error;
      toast.success("Profile updated");
    } catch {
      toast.error("Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  const getInitials = () => {
    const name = displayName || user?.email || "";
    return name
      .split(" ")
      .map((n: string) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (!user) return null;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
        <p className="text-muted-foreground">
          Manage your account and view your reading stats
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
          <CardDescription>Your account information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20">
              <AvatarImage
                src={user.user_metadata?.avatar_url || user.user_metadata?.picture}
                alt={displayName}
              />
              <AvatarFallback className="text-lg">{getInitials()}</AvatarFallback>
            </Avatar>
            <div className="space-y-1">
              <p className="font-medium text-lg">
                {displayName || "Reader"}
              </p>
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <Mail className="h-3 w-3" />
                {user.email}
              </p>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Joined {format(new Date(user.created_at), "MMMM yyyy")}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="displayName">Display Name</Label>
            <div className="flex gap-2">
              <Input
                id="displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Enter your name"
              />
              <Button onClick={handleSaveProfile} disabled={isSaving}>
                {isSaving ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Reading Summary</CardTitle>
          <CardDescription>Your library at a glance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
            <div className="text-center p-4 rounded-lg bg-muted/50">
              <BookOpen className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-xs text-muted-foreground">Total Books</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-muted/50">
              <CheckCircle className="h-6 w-6 mx-auto mb-2 text-green-500" />
              <p className="text-2xl font-bold">{stats.completed}</p>
              <p className="text-xs text-muted-foreground">Completed</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-muted/50">
              <BookOpen className="h-6 w-6 mx-auto mb-2 text-blue-500" />
              <p className="text-2xl font-bold">{stats.reading}</p>
              <p className="text-xs text-muted-foreground">Reading</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-muted/50">
              <Clock className="h-6 w-6 mx-auto mb-2 text-orange-500" />
              <p className="text-2xl font-bold">{stats.wantToRead}</p>
              <p className="text-xs text-muted-foreground">Want to Read</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-muted/50">
              <Heart className="h-6 w-6 mx-auto mb-2 text-pink-500" />
              <p className="text-2xl font-bold">{stats.wishlist}</p>
              <p className="text-xs text-muted-foreground">Wishlist</p>
            </div>
          </div>
        </CardContent>
      </Card>

    </div>
  );
}

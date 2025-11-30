import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { format, subMonths, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns'
import {
  BookOpen,
  CheckCircle,
  Clock,
  FileText,
  Star,
  TrendingUp,
  Calendar,
  Users,
  User,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { useBooks } from '@/hooks/useBooks'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { ReadingTimeline } from '@/components/stats/ReadingTimeline'
import { GenreChart } from '@/components/stats/GenreChart'
import { ColorPalette } from '@/components/stats/ColorPalette'
import type { ReadingSession } from '@/types/database'

export function StatsPage() {
  const { books, isLoading } = useBooks()
  const { user } = useAuth()

  // Fetch all completed reading sessions for stats
  const { data: allSessions = [] } = useQuery({
    queryKey: ['all-reading-sessions', user?.id],
    queryFn: async (): Promise<ReadingSession[]> => {
      if (!user) return []
      const { data, error } = await supabase
        .from('reading_sessions')
        .select('*')
        .eq('user_id', user.id)
        .not('finished_at', 'is', null)
      if (error) throw error
      return data || []
    },
    enabled: !!user,
  })

  const stats = useMemo(() => {
    const completed = books.filter((b) => b.user_book?.status === 'completed')
    const reading = books.filter((b) => b.user_book?.status === 'reading')
    const wantToRead = books.filter((b) => b.user_book?.status === 'want_to_read')

    const totalPages = completed.reduce((sum, book) => sum + (book.page_count || 0), 0)

    const ratings = completed
      .map((b) => b.user_book?.rating)
      .filter((r): r is number => r != null)
    const avgRating = ratings.length > 0
      ? ratings.reduce((a, b) => a + b, 0) / ratings.length
      : null

    // Genre breakdown
    const genres: Record<string, number> = {}
    books.forEach((book) => {
      if (book.genre) {
        genres[book.genre] = (genres[book.genre] || 0) + 1
      }
    })

    // Author stats
    const authorCounts: Record<string, number> = {}
    books.forEach((book) => {
      const author = book.author.trim()
      authorCounts[author] = (authorCounts[author] || 0) + 1
    })
    const uniqueAuthors = Object.keys(authorCounts).length
    const topAuthor = Object.entries(authorCounts)
      .sort(([, a], [, b]) => b - a)[0]

    // Monthly reads (last 12 months) - count sessions, not books
    const monthlyReads: { month: string; count: number }[] = []
    for (let i = 11; i >= 0; i--) {
      const monthDate = subMonths(new Date(), i)
      const monthStart = startOfMonth(monthDate)
      const monthEnd = endOfMonth(monthDate)

      // Count completed sessions in this month
      const count = allSessions.filter((session) => {
        if (!session.finished_at) return false
        const finishedDate = new Date(session.finished_at)
        return isWithinInterval(finishedDate, { start: monthStart, end: monthEnd })
      }).length

      monthlyReads.push({
        month: format(monthDate, 'MMM'),
        count,
      })
    }

    // Books with covers for color palette
    const bookCovers = books
      .filter((b) => b.cover_url)
      .map((b) => b.cover_url!)
      .slice(0, 20)

    return {
      total: books.length,
      completed: completed.length,
      reading: reading.length,
      wantToRead: wantToRead.length,
      totalPages,
      avgRating,
      genres,
      monthlyReads,
      bookCovers,
      uniqueAuthors,
      topAuthor: topAuthor ? { name: topAuthor[0], count: topAuthor[1] } : null,
      // Count sessions completed this year (re-reads count separately)
      thisYearCompleted: allSessions.filter((session) => {
        if (!session.finished_at) return false
        return new Date(session.finished_at).getFullYear() === new Date().getFullYear()
      }).length,
      // Total number of reads (sessions)
      totalReads: allSessions.length,
    }
  }, [books, allSessions])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-pulse text-muted-foreground">Loading statistics...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Reading Statistics</h1>
        <p className="text-muted-foreground">
          Insights into your reading habits
        </p>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Books</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              in your library
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Books Read</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalReads}</div>
            <p className="text-xs text-muted-foreground">
              {stats.thisYearCompleted} this year
              {stats.totalReads !== stats.completed && ` (${stats.completed} unique)`}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pages Read</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPages.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              across completed books
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
            <Star className="h-4 w-4 text-yellow-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.avgRating ? stats.avgRating.toFixed(1) : '-'}
            </div>
            <p className="text-xs text-muted-foreground">
              out of 5 stars
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Authors</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.uniqueAuthors}</div>
            <p className="text-xs text-muted-foreground">
              unique authors
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Top Author</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold truncate">
              {stats.topAuthor?.name || '-'}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.topAuthor ? `${stats.topAuthor.count} ${stats.topAuthor.count === 1 ? 'book' : 'books'}` : 'no books yet'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Reading Status Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Reading Status</CardTitle>
          <CardDescription>Breakdown of your library</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Completed</span>
              </div>
              <span className="text-muted-foreground">{stats.completed} books</span>
            </div>
            <Progress
              value={(stats.completed / stats.total) * 100 || 0}
              className="h-2 bg-muted [&>div]:bg-green-500"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-blue-500" />
                <span>Currently Reading</span>
              </div>
              <span className="text-muted-foreground">{stats.reading} books</span>
            </div>
            <Progress
              value={(stats.reading / stats.total) * 100 || 0}
              className="h-2 bg-muted [&>div]:bg-blue-500"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-orange-500" />
                <span>Want to Read</span>
              </div>
              <span className="text-muted-foreground">{stats.wantToRead} books</span>
            </div>
            <Progress
              value={(stats.wantToRead / stats.total) * 100 || 0}
              className="h-2 bg-muted [&>div]:bg-orange-500"
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Reading Timeline */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Reading Timeline
            </CardTitle>
            <CardDescription>Books finished per month</CardDescription>
          </CardHeader>
          <CardContent>
            <ReadingTimeline data={stats.monthlyReads} />
          </CardContent>
        </Card>

        {/* Genre Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Genre Distribution
            </CardTitle>
            <CardDescription>What you love to read</CardDescription>
          </CardHeader>
          <CardContent>
            <GenreChart genres={stats.genres} />
          </CardContent>
        </Card>
      </div>

      {/* Color Palette */}
      {stats.bookCovers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Your Reading Colours</CardTitle>
            <CardDescription>
              A colour palette generated from your book covers
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ColorPalette coverUrls={stats.bookCovers} />
          </CardContent>
        </Card>
      )}
    </div>
  )
}

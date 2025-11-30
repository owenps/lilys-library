interface ReadingTimelineProps {
  data: { month: string; count: number }[]
}

export function ReadingTimeline({ data }: ReadingTimelineProps) {
  const maxCount = Math.max(...data.map((d) => d.count), 1)

  if (data.every((d) => d.count === 0)) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>No completed books yet.</p>
        <p className="text-sm mt-1">Finish a book to see your reading timeline!</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between h-32 gap-1">
        {data.map((item, i) => {
          const height = item.count > 0 ? (item.count / maxCount) * 100 : 4
          return (
            <div
              key={i}
              className="flex-1 flex flex-col items-center gap-1"
            >
              <span className="text-xs text-muted-foreground">
                {item.count > 0 ? item.count : ''}
              </span>
              <div
                className="w-full bg-primary/80 rounded-t transition-all hover:bg-primary"
                style={{ height: `${height}%`, minHeight: item.count > 0 ? '8px' : '2px' }}
                title={`${item.count} books`}
              />
            </div>
          )
        })}
      </div>
      <div className="flex justify-between text-xs text-muted-foreground">
        {data.map((item, i) => (
          <span key={i} className="flex-1 text-center">
            {item.month}
          </span>
        ))}
      </div>
    </div>
  )
}

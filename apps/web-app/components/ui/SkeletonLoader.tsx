export function SkeletonLoader() {
  return (
    <div className="animate-pulse">
      <div className="h-4 bg-[var(--background-alt)] w-3/4 mb-4"></div>
      <div className="h-4 bg-[var(--background-alt)] w-1/2 mb-4"></div>
      <div className="h-4 bg-[var(--background-alt)] w-5/6"></div>
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-4 bg-white border-2 border-[var(--border)] animate-pulse">
          <div className="w-10 h-10 bg-[var(--background-alt)]"></div>
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-[var(--background-alt)] w-1/4"></div>
            <div className="h-3 bg-[var(--background-alt)] w-1/2"></div>
          </div>
          <div className="h-8 bg-[var(--background-alt)] w-20"></div>
        </div>
      ))}
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="bg-white border-2 border-[var(--border)] p-6 animate-pulse">
      <div className="h-6 bg-[var(--background-alt)] w-1/3 mb-4"></div>
      <div className="space-y-3">
        <div className="h-4 bg-[var(--background-alt)]"></div>
        <div className="h-4 bg-[var(--background-alt)] w-5/6"></div>
        <div className="h-4 bg-[var(--background-alt)] w-4/6"></div>
      </div>
    </div>
  );
}

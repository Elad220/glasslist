'use client'

interface LoadingSkeletonProps {
  count?: number
  height?: string
  width?: string
  className?: string
  variant?: 'text' | 'card' | 'button' | 'list-item'
}

export default function LoadingSkeleton({
  count = 1,
  height = 'h-4',
  width = 'w-full',
  className = '',
  variant = 'text'
}: LoadingSkeletonProps) {
  const baseClasses = 'skeleton-loader rounded-lg'
  
  const variantClasses = {
    text: `${height} ${width}`,
    card: 'h-32 w-full',
    button: 'h-10 w-24',
    'list-item': 'h-16 w-full'
  }
  
  const skeletons = Array.from({ length: count }, (_, i) => (
    <div
      key={i}
      className={`${baseClasses} ${variantClasses[variant]} ${className} animate-pulse`}
      style={{ animationDelay: `${i * 0.1}s` }}
    />
  ))
  
  return <>{skeletons}</>
}

// Skeleton wrapper for complex layouts
export function SkeletonWrapper({ children, loading }: { children: React.ReactNode; loading: boolean }) {
  if (loading) {
    return (
      <div className="space-y-4 animate-fade-in">
        <LoadingSkeleton variant="card" />
        <LoadingSkeleton variant="text" count={3} className="mb-2" />
        <div className="flex gap-2">
          <LoadingSkeleton variant="button" />
          <LoadingSkeleton variant="button" />
        </div>
      </div>
    )
  }
  
  return <>{children}</>
}
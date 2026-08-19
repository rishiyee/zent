import { Skeleton } from "@/components/ui/skeleton"

export function PageHeaderSkeleton() {
  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
      <Skeleton className="h-6 w-6 rounded-md" />
      <Skeleton className="h-4 w-px" />
      <Skeleton className="h-4 w-32" />
      <div className="ml-auto">
        <Skeleton className="h-8 w-8 rounded-md" />
      </div>
    </header>
  )
}

export function ReportsPageSkeleton() {
  return (
    <>
      <PageHeaderSkeleton />
      <div className="flex flex-1 flex-col gap-6 p-4 md:p-6" aria-busy="true" aria-label="Loading reports">
        <div className="space-y-2">
          <Skeleton className="h-7 w-32" />
          <Skeleton className="h-4 w-full max-w-md" />
        </div>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div className="grid w-full grid-cols-3 gap-1 lg:w-72">
            <Skeleton className="h-8 rounded-md" />
            <Skeleton className="h-8 rounded-md" />
            <Skeleton className="h-8 rounded-md" />
          </div>
          <div className="flex flex-wrap gap-2">
            <Skeleton className="h-8 w-36 rounded-md" />
            <Skeleton className="h-8 w-40 rounded-md" />
            <Skeleton className="h-8 w-24 rounded-md" />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => <Skeleton key={index} className="h-24 rounded-xl" />)}
        </div>
        <div className="overflow-hidden rounded-xl ring-1 ring-foreground/10">
          <div className="flex items-center justify-between border-b p-4">
            <div className="space-y-2"><Skeleton className="h-5 w-28" /><Skeleton className="h-4 w-44" /></div>
            <Skeleton className="h-8 w-28 rounded-md" />
          </div>
          <div className="p-3 sm:p-6"><Skeleton className="h-[clamp(300px,48vh,440px)] rounded-lg" /></div>
        </div>
      </div>
    </>
  )
}

export function DashboardPageSkeleton() {
  return (
    <>
      <PageHeaderSkeleton />
      <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
        <div className="space-y-2">
          <Skeleton className="h-7 w-56" />
          <Skeleton className="h-4 w-full max-w-80" />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Skeleton className="h-28 rounded-xl" />
          <Skeleton className="h-28 rounded-xl" />
          <Skeleton className="h-28 rounded-xl" />
        </div>
        <Skeleton className="h-64 rounded-xl" />
        <Skeleton className="h-96 rounded-xl" />
      </div>
    </>
  )
}

export function SettingsModalContentSkeleton() {
  return <Skeleton className="h-96 min-w-0 flex-1 rounded-xl" />
}

export function SettingsPageSkeleton() {
  return (
    <>
      <PageHeaderSkeleton />
      <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
        <div className="space-y-2">
          <Skeleton className="h-7 w-40" />
          <Skeleton className="h-4 w-full max-w-72" />
        </div>
        <div className="flex flex-col gap-6 lg:flex-row">
          <div className="flex w-full flex-col gap-1 lg:w-56">
            <Skeleton className="h-9 w-full rounded-md" />
            <Skeleton className="h-9 w-full rounded-md" />
            <Skeleton className="h-9 w-full rounded-md" />
            <Skeleton className="h-9 w-full rounded-md" />
          </div>
          <Skeleton className="h-96 flex-1 rounded-xl" />
        </div>
      </div>
    </>
  )
}

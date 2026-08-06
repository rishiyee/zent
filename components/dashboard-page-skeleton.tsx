import { Skeleton } from "@/components/ui/skeleton"

function PageHeaderSkeleton() {
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

export function DashboardPageSkeleton() {
  return (
    <>
      <PageHeaderSkeleton />
      <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
        <div className="space-y-2">
          <Skeleton className="h-7 w-56" />
          <Skeleton className="h-4 w-80" />
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

export function SettingsPageSkeleton() {
  return (
    <>
      <PageHeaderSkeleton />
      <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
        <div className="space-y-2">
          <Skeleton className="h-7 w-40" />
          <Skeleton className="h-4 w-72" />
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

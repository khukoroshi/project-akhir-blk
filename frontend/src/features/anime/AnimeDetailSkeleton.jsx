import Card from "../../components/common/Card";
import Skeleton from "../../components/common/Skeleton";

function AnimeDetailSkeleton() {
  return (
    <div role="status" aria-busy="true" className="space-y-6">
      <span className="sr-only">Loading anime details</span>

      <div>
        <Skeleton className="h-40 w-full sm:h-56 lg:h-64" />
        <div className="flex flex-col gap-4 px-4 sm:px-6 lg:flex-row lg:gap-6">
          <Skeleton className="relative z-10 -mt-24 aspect-[2/3] w-32 shrink-0 border border-border sm:-mt-32 sm:w-44 lg:-mt-40 lg:w-56" />
          <div className="min-w-0 flex-1 space-y-3 lg:pt-4">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-6 w-2/3" />
            <Skeleton className="h-11 w-full max-w-sm" />
          </div>
        </div>
      </div>

      <Card className="space-y-3 p-4 sm:p-6">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-11/12" />
        <Skeleton className="h-4 w-2/3" />
      </Card>

      <Card className="space-y-3 p-4 sm:p-6">
        <Skeleton className="h-6 w-40" />
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {Array.from({ length: 7 }, (_, index) => (
            <Skeleton key={index} className="h-16" />
          ))}
        </div>
      </Card>
    </div>
  );
}

export default AnimeDetailSkeleton;

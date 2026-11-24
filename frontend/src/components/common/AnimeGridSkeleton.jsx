import Skeleton from "./Skeleton";

// Keep the grid classes identical to DaftarAnime.
function AnimeGridSkeleton({ count = 12 }) {
  return (
    <div aria-busy="true">
      <p role="status" className="sr-only">
        Memuat anime...
      </p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-6">
        {Array.from({ length: count }, (_, i) => (
          <div
            key={i}
            className="overflow-hidden rounded-md border border-border bg-subtle"
          >
            <Skeleton className="aspect-[2/3] w-full rounded-none" />
            <div className="space-y-2 p-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default AnimeGridSkeleton;

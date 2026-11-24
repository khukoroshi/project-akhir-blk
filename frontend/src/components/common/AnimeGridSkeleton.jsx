import Skeleton from "./Skeleton";
import { getLayoutClasses } from "../../utils/catalogLayout";

function AnimeGridSkeleton({ count = 12, view = "grid" }) {
  return (
    <div aria-busy="true">
      <p role="status" className="sr-only">
        Loading anime...
      </p>
      <div className={getLayoutClasses(view)}>
        {Array.from({ length: count }, (_, i) =>
          view === "list" ? (
            <div
              key={i}
              className="flex gap-3 rounded-md border border-border bg-subtle p-3"
            >
              <Skeleton className="aspect-[2/3] w-24 shrink-0 sm:w-28" />
              <div className="min-w-0 flex-1 space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-7 w-full" />
                <Skeleton className="h-7 w-full" />
                <Skeleton className="h-7 w-full" />
              </div>
            </div>
          ) : (
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
          ),
        )}
      </div>
    </div>
  );
}

export default AnimeGridSkeleton;

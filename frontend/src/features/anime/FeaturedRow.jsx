import ForumPanel from "../community/ForumPanel";
import FeaturedCarousel from "./FeaturedCarousel";
import useFeatured from "./useFeatured";

function FeaturedRow() {
  const { items, loading, error, retry } = useFeatured();
  const hasCarousel = loading || Boolean(error) || items.length > 0;

  return (
    <section aria-label="Featured" className="grid gap-4 lg:grid-cols-3">
      {hasCarousel && (
        <div className="min-w-0 lg:col-span-2">
          <FeaturedCarousel
            items={items}
            loading={loading}
            error={error}
            onRetry={retry}
          />
        </div>
      )}
      <ForumPanel className={hasCarousel ? "" : "lg:col-span-3"} />
    </section>
  );
}

export default FeaturedRow;

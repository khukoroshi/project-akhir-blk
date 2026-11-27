import Card from "../../components/common/Card";

const PLACEHOLDER_COUNT = 6;

function PhotoBox({ className = "" }) {
  return <div className={`w-14 shrink-0 bg-border/60 ${className}`} />;
}

// Placeholder cards only; real data comes in a later task.
function AnimeCharacters() {
  return (
    <Card
      as="section"
      aria-labelledby="characters-heading"
      className="p-4 sm:p-6"
    >
      <div className="mb-3 flex items-baseline gap-2">
        <h2 id="characters-heading" className="text-xl font-semibold">
          Characters
        </h2>
        <span className="text-xs text-muted">Coming soon</span>
      </div>

      <ul aria-hidden="true" className="grid gap-3 lg:grid-cols-2">
        {Array.from({ length: PLACEHOLDER_COUNT }, (_, index) => (
          <li
            key={index}
            className="flex h-20 overflow-hidden rounded-md border border-border bg-canvas"
          >
            <PhotoBox />
            <div className="flex min-w-0 flex-1 flex-col justify-between p-2 text-xs">
              <p className="truncate text-sm text-fg">-</p>
              <p className="text-muted">-</p>
            </div>
            <div className="flex min-w-0 flex-1 flex-col items-end justify-between p-2 text-xs">
              <p className="truncate text-sm text-fg">-</p>
              <p className="text-muted">-</p>
            </div>
            <PhotoBox />
          </li>
        ))}
      </ul>
    </Card>
  );
}

export default AnimeCharacters;

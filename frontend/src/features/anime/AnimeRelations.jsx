import Card from "../../components/common/Card";

// Placeholder labels only; real data comes in a later task.
const PLACEHOLDERS = [
  "Source",
  "Sequel",
  "Side Story",
  "Side Story",
  "Character",
  "Other",
];

function AnimeRelations() {
  return (
    <Card
      as="section"
      aria-labelledby="relations-heading"
      className="p-4 sm:p-6"
    >
      <div className="mb-3 flex items-baseline gap-2">
        <h2 id="relations-heading" className="text-xl font-semibold">
          Relations
        </h2>
        <span className="text-xs text-muted">Coming soon</span>
      </div>

      <ul aria-hidden="true" className="flex gap-3 overflow-x-auto pb-1">
        {PLACEHOLDERS.map((label, index) => (
          <li
            key={index}
            className="relative aspect-[2/3] w-24 shrink-0 overflow-hidden rounded-md bg-border/60"
          >
            <span className="absolute inset-x-0 bottom-0 bg-canvas/80 px-1 py-1.5 text-center text-xs font-medium text-fg">
              {label}
            </span>
          </li>
        ))}
      </ul>
    </Card>
  );
}

export default AnimeRelations;

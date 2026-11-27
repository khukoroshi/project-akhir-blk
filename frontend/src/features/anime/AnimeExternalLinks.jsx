import Card from "../../components/common/Card";
import { ExternalLink } from "../../components/common/icons";

// Links come from an external API: allow only http(s) URLs.
function isSafeUrl(value) {
  try {
    const { protocol } = new URL(value);
    return protocol === "https:" || protocol === "http:";
  } catch {
    return false;
  }
}

function AnimeExternalLinks({ links }) {
  const items = (links ?? []).filter(
    (link) => link?.site && !link.isDisabled && isSafeUrl(link.url),
  );

  if (items.length === 0) return null;

  return (
    <Card as="section" aria-labelledby="external-links-heading" className="p-4">
      <h2 id="external-links-heading" className="mb-3 text-xl font-semibold">
        External &amp; Streaming links
      </h2>
      <ul className="space-y-2">
        {items.map((link) => (
          <li key={link.id ?? link.url}>
            <a
              href={link.url}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="flex min-h-11 items-center gap-2 rounded-md border border-border bg-canvas px-3 text-sm font-medium text-fg transition-colors hover:border-border-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent motion-reduce:transition-none"
            >
              <span className="min-w-0 flex-1 truncate">
                {link.site}
                {link.language && (
                  <span className="ml-1 text-xs font-normal text-muted">
                    {link.language}
                  </span>
                )}
              </span>
              <ExternalLink
                size={14}
                aria-hidden="true"
                className="shrink-0 text-muted"
              />
              <span className="sr-only">(opens in a new tab)</span>
            </a>
          </li>
        ))}
      </ul>
    </Card>
  );
}

export default AnimeExternalLinks;

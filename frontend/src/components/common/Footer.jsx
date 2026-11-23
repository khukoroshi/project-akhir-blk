import { Link } from "react-router-dom";

const YEAR = new Date().getFullYear();

const linkClass =
  "inline-flex min-h-11 items-center rounded-md text-sm text-muted hover:text-fg hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent lg:min-h-8";

export default function Footer({ username }) {
  return (
    <footer className="border-t border-border bg-subtle">
      <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <p className="text-sm text-muted">© {YEAR} AniSphere</p>

        <nav
          aria-label="Footer"
          className="flex flex-wrap items-center gap-x-4"
        >
          <Link to="/" className={linkClass}>
            Beranda
          </Link>
          {username && (
            <Link to="/myList" className={linkClass}>
              MyList
            </Link>
          )}
        </nav>

        <p className="text-sm text-muted">
          Data anime dari{" "}
          <a
            href="https://anilist.co"
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            AniList
          </a>
        </p>
      </div>
    </footer>
  );
}

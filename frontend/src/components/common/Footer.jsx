import { Link } from "react-router-dom";

const YEAR = new Date().getFullYear();

const linkClass =
  "inline-flex min-h-11 items-center rounded-md text-sm text-muted hover:text-fg hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent lg:min-h-8";

export default function Footer({ username }) {
  return (
    <footer className="border-t border-border bg-subtle">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-4 px-4 py-6 sm:px-6 md:flex-row md:justify-between md:gap-6 lg:px-8">
        {/* Copyright */}
        <p className="text-center text-sm text-muted md:text-left">
          © {YEAR} AniSphere
        </p>

        {/* Navigasi Footer */}
        <nav
          aria-label="Footer"
          className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2"
        >
          <Link to="/" className={linkClass}>
            Home
          </Link>
          {username && (
            <Link to="/myList" className={linkClass}>
              My List
            </Link>
          )}
        </nav>

        {/* Kredit Data */}
        <p className="text-center text-sm text-muted md:text-right">
          Anime data provided by{" "}
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

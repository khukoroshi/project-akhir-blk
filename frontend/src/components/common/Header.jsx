import { useCallback, useEffect, useId, useRef, useState } from "react";
import {
  Link,
  NavLink,
  useLocation,
  useNavigate,
  useSearchParams,
} from "react-router-dom";

import { useAuth } from "../../context/useAuth";
import cx from "../../utils/cx";
import Avatar from "./Avatar";
import {
  ChevronDown,
  LogOut,
  Menu,
  Pencil,
  Search,
  UserRound,
  X,
  ListVideo,
} from "./icons";
import {
  LINK_BUTTON_PRIMARY,
  LINK_BUTTON_SECONDARY,
} from "./linkButtonClasses";
import NavDrawer from "./NavDrawer";
import ThemeToggle from "./ThemeToggle";

// Put your logo file in frontend/public/ and set its name here.
// const LOGO_SRC = "/logo.png";
const LOGO_SRC = "/favicon.png";

const ICON_BUTTON =
  "inline-flex size-11 shrink-0 items-center justify-center rounded-md text-fg " +
  "hover:bg-border/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent lg:size-9";

/* Same rule as Home: a new search drops page and filter; empty goes to "/". */
function HeaderSearch({
  initialQuery,
  onSubmitted,
  autoFocus = false,
  className,
}) {
  const navigate = useNavigate();
  const inputId = useId();
  const [value, setValue] = useState(initialQuery);

  const handleSubmit = (event) => {
    event.preventDefault();
    const query = value.trim();
    navigate(query ? `/?q=${encodeURIComponent(query)}` : "/");
    onSubmitted?.();
  };

  return (
    <form role="search" onSubmit={handleSubmit} className={className}>
      <label htmlFor={inputId} className="sr-only">
        Cari anime
      </label>
      <div className="relative">
        <Search
          size={16}
          aria-hidden="true"
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
        />
        <input
          id={inputId}
          type="search"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder="Cari anime..."
          maxLength={100}
          enterKeyHint="search"
          autoFocus={autoFocus}
          className="min-h-11 w-full rounded-md border border-border-strong bg-canvas pl-9 pr-3 text-sm text-fg placeholder:text-muted focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-accent lg:min-h-9"
        />
      </div>
    </form>
  );
}

const menuItemClass = ({ isActive }) =>
  cx(
    "flex min-h-11 w-full items-center gap-3 rounded-md px-3 text-sm text-fg",
    "hover:bg-border/40 focus-visible:-outline-offset-2 focus-visible:outline-2 focus-visible:outline-accent lg:min-h-9",
    isActive && "bg-border/40 font-semibold",
  );

function AccountMenu({ username, onLogout }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);
  const triggerRef = useRef(null);
  const panelId = useId();

  useEffect(() => {
    if (!open) return undefined;
    const handlePointerDown = (event) => {
      if (wrapRef.current && !wrapRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [open]);

  const close = (returnFocus = false) => {
    setOpen(false);
    if (returnFocus) triggerRef.current?.focus();
  };

  const handleKeyDown = (event) => {
    if (event.key === "Escape" && open) {
      event.stopPropagation();
      close(true);
    }
  };

  // Tabbing out of the menu closes it.
  const handleBlur = (event) => {
    if (
      open &&
      event.relatedTarget &&
      !wrapRef.current.contains(event.relatedTarget)
    ) {
      setOpen(false);
    }
  };

  return (
    <div
      ref={wrapRef}
      className="relative"
      onKeyDown={handleKeyDown}
      onBlur={handleBlur}
    >
      {/* Same look as the previous header: avatar + "Welcome back" + name + chevron. */}
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={`Menu akun ${username}`}
        className="flex min-h-11 items-center gap-2 rounded-md px-1 hover:bg-border/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent sm:px-2 lg:min-h-9"
      >
        <Avatar name={username} size="md" />
        <span className="hidden max-w-28 text-left sm:block">
          <span className="block text-[10px] leading-tight text-muted">
            Welcome back
          </span>
          <span className="block truncate text-sm font-semibold text-fg">
            {username}
          </span>
        </span>
        <ChevronDown
          size={16}
          aria-hidden="true"
          className={cx(
            "hidden text-muted transition-transform motion-reduce:transition-none sm:block",
            open && "rotate-180",
          )}
        />
      </button>

      {open && (
        <div
          id={panelId}
          className="absolute right-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-md border border-border bg-canvas shadow-lg"
        >
          <div className="border-b border-border px-4 py-3">
            <p className="text-xs text-muted">Masuk sebagai</p>
            <p className="mt-0.5 truncate text-sm font-semibold text-fg">
              {username}
            </p>
          </div>
          <div className="flex flex-col gap-0.5 p-1.5">
            <NavLink
              to={`/u/${encodeURIComponent(username)}`}
              className={menuItemClass}
              onClick={() => close(true)}
            >
              <UserRound size={16} aria-hidden="true" className="text-muted" />
              Profil saya
            </NavLink>
            <NavLink
              to="/profile/edit"
              className={menuItemClass}
              onClick={() => close(true)}
            >
              <Pencil size={16} aria-hidden="true" className="text-muted" />
              Edit profil
            </NavLink>
            <NavLink
              to="/myList"
              className={menuItemClass}
              onClick={() => close(true)}
            >
              <ListVideo size={16} aria-hidden="true" className="text-muted" />
              MyList
            </NavLink>
            <button
              type="button"
              onClick={() => {
                close(true);
                onLogout();
              }}
              className="flex min-h-11 w-full items-center gap-3 rounded-md px-3 text-left text-sm text-danger hover:bg-danger/10 focus-visible:-outline-offset-2 focus-visible:outline-2 focus-visible:outline-accent lg:min-h-9"
            >
              <LogOut size={16} aria-hidden="true" />
              Keluar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Header({ username }) {
  const { logout } = useAuth();
  const { pathname } = useLocation();
  const [searchParams] = useSearchParams();
  // On Home the box mirrors ?q=; elsewhere it starts empty.
  const urlQuery = pathname === "/" ? (searchParams.get("q") ?? "") : "";

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const menuButtonRef = useRef(null);
  const searchButtonRef = useRef(null);

  const closeDrawer = useCallback(() => setDrawerOpen(false), []);
  const closeSearch = useCallback(() => setSearchOpen(false), []);

  const handleLogout = () => {
    setDrawerOpen(false);
    logout();
  };

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-subtle">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-2 px-4 sm:px-6 lg:gap-3 lg:px-8">
        <button
          ref={menuButtonRef}
          type="button"
          onClick={() => setDrawerOpen(true)}
          aria-label="Buka menu"
          aria-expanded={drawerOpen}
          aria-controls="app-drawer"
          aria-haspopup="dialog"
          className={cx(ICON_BUTTON, "border border-border-strong")}
        >
          <Menu size={18} aria-hidden="true" />
        </button>

        <Link
          to="/"
          aria-label="AniSphere, ke beranda"
          className="flex min-h-11 items-center gap-2 rounded-md px-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent lg:min-h-9"
        >
          <img
            src={LOGO_SRC}
            alt=""
            width="32"
            height="32"
            className="size-8 rounded-md"
          />
          <span className="hidden text-base font-semibold text-fg sm:inline">
            AniSphere
          </span>
        </Link>

        <div className="ml-auto flex items-center gap-1 lg:gap-3">
          {/* Laptop search */}
          <HeaderSearch
            key={urlQuery}
            initialQuery={urlQuery}
            className="hidden w-64 lg:block xl:w-80"
          />

          {/* Mobile/tablet search toggle */}
          <button
            ref={searchButtonRef}
            type="button"
            onClick={() => setSearchOpen((prev) => !prev)}
            aria-label={searchOpen ? "Tutup pencarian" : "Buka pencarian"}
            aria-expanded={searchOpen}
            aria-controls="mobile-search"
            className={cx(ICON_BUTTON, "lg:hidden")}
          >
            {searchOpen ? (
              <X size={18} aria-hidden="true" />
            ) : (
              <Search size={18} aria-hidden="true" />
            )}
          </button>

          <ThemeToggle className="hidden lg:inline-flex" />

          {username ? (
            <AccountMenu username={username} onLogout={logout} />
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/login" className={LINK_BUTTON_SECONDARY}>
                Masuk
              </Link>
              <Link
                to="/register"
                className={cx(LINK_BUTTON_PRIMARY, "hidden lg:inline-flex")}
              >
                Daftar
              </Link>
            </div>
          )}
        </div>
      </div>

      {searchOpen && (
        <div
          id="mobile-search"
          className="border-t border-border px-4 py-2 sm:px-6 lg:hidden"
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              closeSearch();
              searchButtonRef.current?.focus();
            }
          }}
        >
          <HeaderSearch
            key={urlQuery}
            initialQuery={urlQuery}
            onSubmitted={closeSearch}
            autoFocus
          />
        </div>
      )}

      <NavDrawer
        open={drawerOpen}
        onClose={closeDrawer}
        triggerRef={menuButtonRef}
        username={username}
        onLogout={handleLogout}
      />
    </header>
  );
}

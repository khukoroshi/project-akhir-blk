import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Link, NavLink } from "react-router-dom";

import cx from "../../utils/cx";
import { House, ListVideo, LogOut, Pencil, UserRound, X } from "./icons";
import {
  LINK_BUTTON_PRIMARY,
  LINK_BUTTON_SECONDARY,
} from "./linkButtonClasses";
import ThemeToggle from "./ThemeToggle";

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])';

const itemClass = ({ isActive }) =>
  cx(
    "flex min-h-11 items-center gap-3 rounded-md px-3 text-sm font-medium text-fg",
    "focus-visible:-outline-offset-2 focus-visible:outline-2 focus-visible:outline-accent",
    isActive ? "bg-border/40" : "hover:bg-border/40",
  );

export default function NavDrawer({
  open,
  onClose,
  triggerRef,
  username,
  onLogout,
}) {
  const panelRef = useRef(null);

  // Focus trap, Esc to close, scroll lock, focus back to the trigger.
  useEffect(() => {
    if (!open) return undefined;

    const panel = panelRef.current;
    const trigger = triggerRef?.current;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const getItems = () => Array.from(panel.querySelectorAll(FOCUSABLE));
    getItems()[0]?.focus();

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== "Tab") return;

      const items = getItems();
      if (items.length === 0) {
        event.preventDefault();
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;

      if (!panel.contains(active)) {
        event.preventDefault();
        first.focus();
      } else if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      trigger?.focus();
    };
  }, [open, onClose, triggerRef]);

  if (!open) return null;

  return createPortal(
    <>
      <div
        className="drawer-backdrop fixed inset-0 z-50 bg-black/50"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={panelRef}
        id="app-drawer"
        role="dialog"
        aria-modal="true"
        aria-label="Main Menu"
        className="drawer-panel fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] flex-col overflow-y-auto border-r border-border bg-canvas shadow-xl"
      >
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-border px-4">
          <span className="text-base font-semibold text-fg">AniSphere</span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className="inline-flex size-11 items-center justify-center rounded-md text-fg hover:bg-border/40 focus-visible:outline-2 focus-visible:outline-accent lg:size-9"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <nav aria-label="Main navigation" className="flex flex-col gap-1 p-3">
          <NavLink to="/" end className={itemClass} onClick={onClose}>
            <House size={18} aria-hidden="true" className="text-muted" />
            Home
          </NavLink>
          {username && (
            <NavLink to="/myList" className={itemClass} onClick={onClose}>
              <ListVideo size={18} aria-hidden="true" className="text-muted" />
              My List
            </NavLink>
          )}
        </nav>

        {/* Account and theme live here only below lg; on lg they are in the header. */}
        <div className="mt-auto flex flex-col gap-3 border-t border-border p-3 lg:hidden">
          <div className="px-3">
            <p className="mb-2 text-xs font-medium text-muted">Theme</p>
            <ThemeToggle />
          </div>

          {username ? (
            <nav aria-label="Account" className="flex flex-col gap-1">
              <p className="truncate px-3 text-xs text-muted">
                Signed in as{" "}
                <span className="font-semibold text-fg">{username}</span>
              </p>
              <NavLink
                to={`/u/${encodeURIComponent(username)}`}
                className={itemClass}
                onClick={onClose}
              >
                <UserRound
                  size={18}
                  aria-hidden="true"
                  className="text-muted"
                />
                My profile
              </NavLink>
              <NavLink
                to="/profile/edit"
                className={itemClass}
                onClick={onClose}
              >
                <Pencil size={18} aria-hidden="true" className="text-muted" />
                Edit profile
              </NavLink>
              <button
                type="button"
                onClick={onLogout}
                className="flex min-h-11 w-full items-center gap-3 rounded-md px-3 text-left text-sm font-medium text-danger hover:bg-danger/10 focus-visible:-outline-offset-2 focus-visible:outline-2 focus-visible:outline-accent"
              >
                <LogOut size={18} aria-hidden="true" />
                Log out
              </button>
            </nav>
          ) : (
            <div className="flex flex-col gap-2 px-3">
              <Link
                to="/login"
                onClick={onClose}
                className={LINK_BUTTON_PRIMARY}
              >
                Log in
              </Link>
              <Link
                to="/register"
                onClick={onClose}
                className={LINK_BUTTON_SECONDARY}
              >
                Sign up
              </Link>
            </div>
          )}
        </div>
      </div>
    </>,
    document.body,
  );
}

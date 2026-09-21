import { useEffect, useRef, useState } from "react";
import { NavLink, Link } from "react-router-dom";
import { useAuth } from "../../context/useAuth";

function Navbar({ username }) {
  const { logout } = useAuth();

  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const menuRef = useRef(null);

  /*
   * Tutup dropdown ketika klik di luar menu
   */
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  /*
   * Logout
   */
  const handleLogout = () => {
    logout();
    setIsMenuOpen(false);
  };

  const navLinkClass = ({ isActive }) =>
    `rounded-lg px-3 py-2 text-sm font-medium transition ${
      isActive
        ? "bg-slate-900 text-white"
        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
    }`;

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* ========================= */}
        {/* LOGO */}
        {/* ========================= */}

        <Link to="/" className="group flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 text-lg text-white shadow-sm transition group-hover:scale-105">
            ✦
          </div>

          <div className="hidden sm:block">
            <h1 className="text-base font-bold tracking-tight text-slate-900">
              MyAnimeWatchList
            </h1>

            <p className="text-[10px] font-medium uppercase tracking-widest text-slate-400">
              Track your anime
            </p>
          </div>
        </Link>

        {/* ========================= */}
        {/* NAVIGATION */}
        {/* ========================= */}

        <div className="flex items-center gap-1">
          <NavLink to="/" className={navLinkClass}>
            Home
          </NavLink>

          {username && (
            <NavLink to="/myList" className={navLinkClass}>
              My List
            </NavLink>
          )}
        </div>

        {/* ========================= */}
        {/* USER */}
        {/* ========================= */}

        <div ref={menuRef} className="relative">
          {username ? (
            <>
              {/* User button */}

              <button
                type="button"
                onClick={() => setIsMenuOpen((prev) => !prev)}
                className="flex items-center gap-2 rounded-lg px-2 py-1.5 transition hover:bg-slate-100"
              >
                {/* Avatar */}

                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 text-sm font-semibold text-white">
                  {username.charAt(0).toUpperCase()}
                </div>

                {/* Username */}

                <div className="hidden text-left sm:block">
                  <p className="text-[10px] text-slate-400">Welcome back</p>

                  <p className="max-w-28 truncate text-sm font-semibold text-slate-800">
                    {username}
                  </p>
                </div>

                {/* Arrow */}

                <svg
                  className={`hidden h-4 w-4 text-slate-400 transition sm:block ${
                    isMenuOpen ? "rotate-180" : ""
                  }`}
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>

              {/* ========================= */}
              {/* DROPDOWN */}
              {/* ========================= */}

              {isMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-56 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
                  {/* User info */}

                  <div className="border-b border-slate-100 px-4 py-3">
                    <p className="text-xs text-slate-400">Signed in as</p>

                    <p className="mt-0.5 truncate text-sm font-semibold text-slate-800">
                      {username}
                    </p>
                  </div>

                  {/* Logout */}

                  <div className="p-1.5">
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-red-600 transition hover:bg-red-50"
                    >
                      <svg
                        className="h-4 w-4"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4"
                        />

                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M10 17l5-5-5-5"
                        />

                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M15 12H3"
                        />
                      </svg>
                      Logout
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <Link
              to="/login"
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-700"
            >
              Login
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
}

export default Navbar;

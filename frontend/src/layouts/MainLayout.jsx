import Navbar from "../components/common/Navbar";

function MainLayout({ children, username }) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 transition-colors dark:bg-slate-950 dark:text-slate-100">
      <Navbar username={username} />

      <main className="relative">
        <div className="pointer-events-none absolute inset-x-0 top-0 -z-0 h-72 overflow-hidden">
          <div className="absolute left-1/2 top-0 h-72 w-[700px] -translate-x-1/2 rounded-full bg-indigo-100/40 blur-3xl dark:bg-indigo-500/10" />
        </div>

        <div className="relative mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>
    </div>
  );
}

export default MainLayout;

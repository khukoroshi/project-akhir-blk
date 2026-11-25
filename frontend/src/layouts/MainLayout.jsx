import Footer from "../components/common/Footer";
import Header from "../components/common/Header";

function MainLayout({ children, username }) {
  return (
    <div className="flex min-h-dvh flex-col bg-canvas text-fg">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-md focus:border focus:border-border-strong focus:bg-canvas focus:px-4 focus:py-2 focus:text-fg focus-visible:outline-2 focus-visible:outline-accent"
      >
        Skip to content
      </a>

      <Header username={username} />

      <main
        id="main-content"
        tabIndex={-1}
        className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 focus:outline-none sm:px-6 lg:px-8"
      >
        {children}
      </main>

      <Footer username={username} />
    </div>
  );
}

export default MainLayout;

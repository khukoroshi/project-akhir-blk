import { Link } from "react-router-dom";

function Navbar() {
  return (
    <header className="border-b bg-white">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
        <Link to="/" className="text-xl font-bold">
          MyApp
        </Link>

        <div className="flex gap-4">
          <Link to="/">Home</Link>

          <Link to="/login">Login</Link>
        </div>
      </nav>
    </header>
  );
}

export default Navbar;

import Navbar from "../components/common/Navbar";

function MainLayout({ children, username }) {
  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar username={username} />

      <main className="p-4">{children}</main>
    </div>
  );
}

export default MainLayout;

import MainLayout from "../layouts/MainLayout";
import Button from "../components/common/Button";

function Home() {
  return (
    <MainLayout>
      <div className="mx-auto max-w-7xl">
        <h1 className="mb-4 text-3xl font-bold">Welcome</h1>

        <p className="mb-4 text-gray-600">This is your React starter kit.</p>

        <Button>Get Started</Button>
      </div>
    </MainLayout>
  );
}

export default Home;

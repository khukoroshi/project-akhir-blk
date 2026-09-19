import MainLayout from "../layouts/MainLayout";

import { useAuth } from "../context/useAuth";

import AnimeList from "../components/features/anime/AnimeList";

function MyList() {
  const { user } = useAuth();

  return (
    <MainLayout username={user?.name}>
      <div className="mx-auto max-w-5xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">My Anime List</h1>

          <p className="mt-1 text-gray-500">
            Daftar anime yang sedang kamu ikuti.
          </p>
        </div>

        <AnimeList />
      </div>
    </MainLayout>
  );
}

export default MyList;

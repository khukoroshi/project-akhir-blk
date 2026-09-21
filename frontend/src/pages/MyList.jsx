import MainLayout from "../layouts/MainLayout";
import { useAuth } from "../context/useAuth";
import AnimeList from "../components/features/anime/AnimeList";

function MyList() {
  const { user } = useAuth();

  return (
    <MainLayout username={user?.name}>
      <div>
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-wider text-indigo-600">
            Your Collection
          </p>

          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
            My Anime List
          </h1>

          <p className="mt-2 max-w-2xl text-slate-500">
            Track your progress, rate your favorite anime, and manage your
            personal watchlist.
          </p>
        </div>

        <AnimeList />
      </div>
    </MainLayout>
  );
}

export default MyList;

import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";

import Button from "../components/common/Button";
import Card from "../components/common/Card";
import ErrorApiPage from "../components/common/ErrorApiPage";
import { ChevronLeft } from "../components/common/icons";
import { useAuth } from "../context/useAuth";
import AnimeDetailSkeleton from "../features/anime/AnimeDetailSkeleton";
import AnimeHero from "../features/anime/AnimeHero";
import AnimeCharacters from "../features/anime/AnimeCharacters";
import AnimeInfoSidebar from "../features/anime/AnimeInfoSidebar";
import AnimeRelations from "../features/anime/AnimeRelations";
import AnimeSynopsis from "../features/anime/AnimeSynopsis";
import useAnimeDetail from "../features/anime/useAnimeDetail";
import MainLayout from "../layouts/MainLayout";
import { getAnimeTitle } from "../utils/animeLabels";

function AnimeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { anime, loading, error, notFound } = useAnimeDetail(id);

  const title = anime ? getAnimeTitle(anime.title) : null;

  useEffect(() => {
    if (!title) return undefined;
    const previous = document.title;
    document.title = `${title} - AniSphere`;
    return () => {
      document.title = previous;
    };
  }, [title]);

  const goBack = () =>
    window.history.length > 1 ? navigate(-1) : navigate("/");
  const goHome = () => navigate("/");

  const backButton = (
    <Button variant="ghost" className="-ml-3" onClick={goBack}>
      <ChevronLeft size={16} aria-hidden="true" />
      Back
    </Button>
  );

  let content;

  if (loading) {
    content = (
      <>
        {backButton}
        <AnimeDetailSkeleton />
      </>
    );
  } else if (error && !notFound) {
    content = (
      <>
        <ErrorApiPage error={error} />
        <div className="flex justify-center">
          <Button onClick={goHome}>Back to home</Button>
        </div>
      </>
    );
  } else if (notFound || !anime) {
    content = (
      <Card className="space-y-3 p-6 text-center">
        <h1 className="text-2xl font-semibold">Anime not found</h1>
        <p className="text-muted">
          This anime does not exist or the link is not valid.
        </p>
        <Button onClick={goHome}>Back to home</Button>
      </Card>
    );
  } else {
    content = (
      <>
        {backButton}
        <AnimeHero key={anime.id} anime={anime} />

        {/* Below lg: one column in DOM order. From lg: sidebar left, rest right. */}
        <div className="grid gap-6 lg:grid-cols-[17rem_minmax(0,1fr)] lg:grid-rows-[auto_auto_1fr]">
          <div className="min-w-0 lg:col-start-2 lg:row-start-1">
            <AnimeSynopsis description={anime.description} />
          </div>

          {/* Tambahkan kelas responsif max-w atau atur grid di sini */}
          <div className="min-w-0 lg:col-start-1 lg:row-span-3 lg:row-start-1 lg:self-start">
            <AnimeInfoSidebar anime={anime} />
          </div>

          <div className="min-w-0 lg:col-start-2 lg:row-start-2">
            <AnimeRelations />
          </div>
          <div className="min-w-0 lg:col-start-2 lg:row-start-3 lg:self-start">
            <AnimeCharacters />
          </div>
        </div>
      </>
    );
  }

  return (
    <MainLayout username={user?.name}>
      <div className="space-y-6 py-4">{content}</div>
    </MainLayout>
  );
}

export default AnimeDetail;

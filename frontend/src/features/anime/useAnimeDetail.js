import { useEffect, useState } from "react";

import api from "../../services/api";

const INITIAL = { key: null, anime: null, error: "", status: null };

export default function useAnimeDetail(id) {
  const [result, setResult] = useState(INITIAL);

  useEffect(() => {
    const controller = new AbortController();

    api
      .get(`/catalog/anime/${id}`, { signal: controller.signal })
      .then((response) => {
        setResult({
          key: id,
          anime: response.data.data,
          error: "",
          status: null,
        });
      })
      .catch((error) => {
        if (error.code === "ERR_CANCELED") return;
        setResult({
          key: id,
          anime: null,
          error:
            error.response?.data?.message || "Failed to load anime details.",
          status: error.response?.status ?? null,
        });
      });

    return () => controller.abort();
  }, [id]);

  // A result for another id counts as "still loading" (no stale data).
  const loading = result.key !== id;

  return {
    anime: loading ? null : result.anime,
    loading,
    error: loading ? "" : result.error,
    notFound: !loading && (result.status === 404 || result.status === 400),
  };
}

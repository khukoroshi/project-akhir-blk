import { useEffect, useState } from "react";
import api from "../../services/api";

const TTL_MS = 5 * 60 * 1000;

// Simple module-level cache so returning to Home does not flash a skeleton.
let cache = null; // { items, at }

function readCache() {
  return cache && Date.now() - cache.at < TTL_MS ? cache.items : null;
}

export default function useFeatured() {
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState(() => {
    const cached = readCache();
    return cached
      ? { items: cached, loading: false, error: null }
      : { items: [], loading: true, error: null };
  });

  useEffect(() => {
    if (readCache()) return undefined;

    const controller = new AbortController();

    api
      .get("/catalog/anime/featured", { signal: controller.signal })
      .then((response) => {
        const items = response.data.data ?? [];
        cache = { items, at: Date.now() };
        setState({ items, loading: false, error: null });
      })
      .catch((error) => {
        if (controller.signal.aborted) return;
        setState({
          items: [],
          loading: false,
          error:
            error.response?.data?.message ||
            error.message ||
            "Failed to load featured anime.",
        });
      });

    return () => controller.abort();
  }, [attempt]);

  const retry = () => {
    cache = null;
    setState({ items: [], loading: true, error: null });
    setAttempt((n) => n + 1);
  };

  return { ...state, retry };
}

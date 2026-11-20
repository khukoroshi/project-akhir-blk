import { useCallback, useEffect, useState } from "react";

import { getProfile } from "./profileApi";

function toProfileError(error) {
  return {
    status: error.response?.status ?? null,
    message: error.response?.data?.message ?? null,
  };
}

/*
 * Hasil disimpan bersama kunci permintaannya. Data hanya dianggap
 * valid jika kuncinya sama dengan permintaan saat ini, jadi data
 * profil lama tidak pernah tampil setelah username berubah.
 */
function useProfile(username) {
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState({ key: null, data: null, error: null });

  const requestKey = `${attempt}:${username}`;

  useEffect(() => {
    const controller = new AbortController();

    getProfile(username, { signal: controller.signal })
      .then((data) => {
        if (controller.signal.aborted) return;
        setResult({ key: requestKey, data, error: null });
      })
      .catch((error) => {
        if (controller.signal.aborted || error?.code === "ERR_CANCELED") {
          return;
        }
        setResult({
          key: requestKey,
          data: null,
          error: toProfileError(error),
        });
      });

    return () => controller.abort();
  }, [username, requestKey]);

  const refetch = useCallback(() => setAttempt((prev) => prev + 1), []);

  const loading = result.key !== requestKey;

  return {
    loading,
    data: loading ? null : result.data,
    error: loading ? null : result.error,
    refetch,
  };
}

export default useProfile;

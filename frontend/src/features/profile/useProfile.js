import { useCallback, useEffect, useState } from "react";

import { useAuth } from "../../context/useAuth";
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
 * profil lama tidak pernah tampil setelah username atau identitas
 * login berubah. Permintaan menunggu cek sesi awal selesai agar
 * isSelf dan isFollowing langsung cocok dengan sesi.
 */
function useProfile(username) {
  const { user, loading: authLoading } = useAuth();
  const userId = user?.id ?? null;

  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState({ key: null, data: null, error: null });

  const enabled = !authLoading && Boolean(username);
  const requestKey = `${attempt}:${userId ?? "anon"}:${username}`;

  useEffect(() => {
    if (!enabled) return;

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
  }, [enabled, username, requestKey]);

  const refetch = useCallback(() => setAttempt((prev) => prev + 1), []);

  /*
   * Perbarui data lokal setelah aksi (mis. follow). Diabaikan jika
   * permintaan sudah berganti, supaya hasil aksi lama tidak menimpa
   * profil lain.
   */
  const patchProfile = useCallback(
    (patch) => {
      setResult((prev) =>
        prev.key === requestKey && prev.data
          ? { ...prev, data: { ...prev.data, ...patch } }
          : prev,
      );
    },
    [requestKey],
  );

  const loading = !enabled || result.key !== requestKey;

  return {
    loading,
    data: loading ? null : result.data,
    error: loading ? null : result.error,
    refetch,
    patchProfile,
  };
}

export default useProfile;

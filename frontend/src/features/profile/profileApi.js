import api from "../../services/api";

export async function getProfile(username, { signal } = {}) {
  const response = await api.get(`/users/${encodeURIComponent(username)}`, {
    signal,
  });

  return response.data.data;
}

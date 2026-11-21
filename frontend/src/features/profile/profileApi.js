import api from "../../services/api";

export async function getProfile(username, { signal } = {}) {
  const response = await api.get(`/users/${encodeURIComponent(username)}`, {
    signal,
  });

  return response.data.data;
}

export async function updateProfile({ displayName, bio, isPrivate }) {
  const response = await api.put("/users/profile", {
    displayName,
    bio,
    isPrivate,
  });

  return response.data.data;
}

export async function followUser(username) {
  const response = await api.post(
    `/users/${encodeURIComponent(username)}/follow`,
  );

  return response.data.data;
}

export async function unfollowUser(username) {
  const response = await api.delete(
    `/users/${encodeURIComponent(username)}/follow`,
  );

  return response.data.data;
}

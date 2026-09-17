const API_URL = import.meta.env.VITE_API_URL;

async function request(endpoint, options = {}) {
  const response = await fetch(`${API_URL}${endpoint}`, {
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => null);

    throw new Error(error?.message || "Something went wrong");
  }

  return response.json();
}

export const api = {
  get: (endpoint, options = {}) =>
    request(endpoint, {
      method: "GET",
      ...options,
    }),

  post: (endpoint, data, options = {}) =>
    request(endpoint, {
      method: "POST",
      body: JSON.stringify(data),
      ...options,
    }),

  put: (endpoint, data, options = {}) =>
    request(endpoint, {
      method: "PUT",
      body: JSON.stringify(data),
      ...options,
    }),

  patch: (endpoint, data, options = {}) =>
    request(endpoint, {
      method: "PATCH",
      body: JSON.stringify(data),
      ...options,
    }),

  delete: (endpoint, options = {}) =>
    request(endpoint, {
      method: "DELETE",
      ...options,
    }),
};

// import { api } from "../services/api";

// const users = await api.get("/users");

// POST:

// await api.post("/users", {
//   name: "John",
//   email: "john@example.com",
// });

// Ini membuat component jauh lebih bersih.

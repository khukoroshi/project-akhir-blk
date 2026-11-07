import request from "supertest";
import app from "../../src/app.mjs";

export const api = () => request(app);

export const defaultCredentials = {
  name: "tester",
  email: "tester@example.com",
  password: "Password123",
};

export const authHeader = (token) => ({ Authorization: `Bearer ${token}` });

// Registers a user, logs in through the API, and returns the token.
export const createUserAndLogin = async (overrides = {}) => {
  const credentials = { ...defaultCredentials, ...overrides };

  const registered = await api().post("/api/auth/register").send(credentials);
  if (registered.status !== 201) {
    throw new Error(`Helper register gagal: ${registered.status}`);
  }

  const login = await api()
    .post("/api/auth/login")
    .send({ email: credentials.email, password: credentials.password });
  if (login.status !== 200) {
    throw new Error(`Helper login gagal: ${login.status}`);
  }

  return {
    credentials,
    user: login.body.data.user,
    token: login.body.data.token,
  };
};

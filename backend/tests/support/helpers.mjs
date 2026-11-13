import request from "supertest";
import app from "../../src/app.mjs";

export const api = () => request(app);

export const defaultCredentials = {
  name: "tester",
  email: "tester@example.com",
  password: "Password123",
};

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

// access_token -> csrf_token, filled by createUserAndLogin.
// This is the single place that knows how cookies and CSRF fit together.
const csrfByToken = new Map();

export const findCookie = (res, name) =>
  (res.headers["set-cookie"] ?? []).find((c) => c.startsWith(`${name}=`));
export const cookieValue = (setCookie) => setCookie.split(";")[0].split("=")[1];

// Attaches the session cookies to a supertest request. For POST/PUT/PATCH/DELETE
// it also sends X-CSRF-Token, unless { csrf: false } is passed.
// Unknown tokens (forged, expired) are sent as a cookie only.
export const withSession = (req, token, { csrf = true } = {}) => {
  const csrfToken = csrfByToken.get(token);
  const cookies = [`access_token=${token}`];
  if (csrfToken) cookies.push(`csrf_token=${csrfToken}`);
  req.set("Cookie", cookies.join("; "));

  if (csrf && csrfToken && !SAFE_METHODS.has(req.method.toUpperCase())) {
    req.set("X-CSRF-Token", csrfToken);
  }
  return req;
};

// Registers a user, logs in through the API, and returns the session
// (token = access_token cookie value, csrf = csrf_token cookie value).
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

  const access = findCookie(login, "access_token");
  const csrfCookie = findCookie(login, "csrf_token");
  if (!access || !csrfCookie) {
    throw new Error("Helper login gagal: cookie sesi tidak ada");
  }
  const token = cookieValue(access);
  const csrf = cookieValue(csrfCookie);
  csrfByToken.set(token, csrf);

  return { credentials, user: login.body.data.user, token, csrf };
};

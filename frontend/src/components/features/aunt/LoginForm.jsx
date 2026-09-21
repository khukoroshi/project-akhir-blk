import { useState } from "react";

import { Link, useNavigate } from "react-router-dom";

import api from "../../../services/api";

import { useAuth } from "../../../context/useAuth";

import Button from "../../common/Button";
import Input from "../../common/Input";

function LoginForm() {
  const { login } = useAuth();

  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();

    setLoading(true);
    setErrorMsg("");

    try {
      const response = await api.post("/auth/login", {
        email,
        password,
      });

      console.log("Login response:", response.data);

      const token = response.data.data.token;
      const user = response.data.data.userInfo;

      login(token, user);

      navigate("/");
    } catch (err) {
      console.error("Login gagal:", err);

      setErrorMsg(err.response?.data?.message || "Email atau password salah");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="
      flex
      min-h-screen
      items-center
      justify-center
      bg-slate-100
      p-4
      transition-colors

      dark:bg-slate-950
    "
    >
      <form
        onSubmit={handleLogin}
        className="
        w-full
        max-w-md
        space-y-4
        rounded-2xl
        border
        border-slate-200
        bg-white
        p-6
        shadow-xl
        transition-colors

        dark:border-slate-800
        dark:bg-slate-900
      "
      >
        <h1
          className="
          text-2xl
          font-bold
          text-slate-900

          dark:text-white
        "
        >
          Login
        </h1>

        {errorMsg && (
          <div
            className="
            rounded-lg
            border
            border-red-200
            bg-red-50
            p-3
            text-sm
            text-red-700

            dark:border-red-500/20
            dark:bg-red-500/10
            dark:text-red-400
          "
          >
            {errorMsg}
          </div>
        )}

        <Input
          label="Email"
          name="email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />

        <Input
          label="Password"
          name="password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />

        <Button type="submit" disabled={loading} className="w-full">
          {loading ? "Logging in..." : "Login"}
        </Button>

        <p
          className="
          text-center
          text-sm
          text-slate-500

          dark:text-slate-400
        "
        >
          Belum punya akun?{" "}
          <Link
            to="/register"
            className="
            font-medium
            text-indigo-600
            hover:underline

            dark:text-indigo-400
          "
          >
            Register
          </Link>
        </p>
      </form>
    </div>
  );
}

export default LoginForm;

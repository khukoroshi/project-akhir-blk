import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import Button from "../../common/Button";
import Input from "../../common/Input";

import api from "../../../services/api";

function RegisterForm() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");

    if (form.password !== form.confirmPassword) {
      setError("Password dan konfirmasi password tidak sama.");
      return;
    }

    if (form.password.length < 6) {
      setError("Password minimal 6 karakter.");
      return;
    }

    setLoading(true);

    try {
      await api.post("/auth/register", {
        name: form.name,
        email: form.email,
        password: form.password,
      });

      navigate("/login");
    } catch (err) {
      console.error("Register gagal:", err);

      setError(
        err.response?.data?.message || err.message || "Gagal membuat akun.",
      );
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
      px-4
      transition-colors

      dark:bg-slate-950
    "
    >
      <div
        className="
        w-full
        max-w-md
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
          mb-2
          text-2xl
          font-bold
          text-slate-900

          dark:text-white
        "
        >
          Register
        </h1>

        <p
          className="
          mb-6
          text-sm
          text-slate-500

          dark:text-slate-400
        "
        >
          Buat akun AniWatchList
        </p>

        {error && (
          <div
            className="
            mb-4
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
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Username */}
          <Input
            label="Username"
            name="name"
            placeholder="Username"
            value={form.name}
            onChange={handleChange}
            required
          />

          {/* Email */}
          <Input
            label="Email"
            name="email"
            type="email"
            placeholder="nama@email.com"
            value={form.email}
            onChange={handleChange}
            required
          />

          {/* Password */}
          <Input
            label="Password"
            name="password"
            type="password"
            placeholder="Minimal 6 karakter"
            value={form.password}
            onChange={handleChange}
            required
          />

          {/* Confirm Password */}
          <Input
            label="Konfirmasi Password"
            name="confirmPassword"
            type="password"
            placeholder="Ulangi password"
            value={form.confirmPassword}
            onChange={handleChange}
            required
          />

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Membuat akun..." : "Register"}
          </Button>
        </form>

        <p
          className="
          mt-6
          text-center
          text-sm
          text-slate-500

          dark:text-slate-400
        "
        >
          Sudah punya akun?{" "}
          <Link
            to="/login"
            className="
            font-medium
            text-indigo-600
            hover:underline

            dark:text-indigo-400
          "
          >
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}

export default RegisterForm;

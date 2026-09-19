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
    <div className="flex min-h-screen items-center justify-center bg-gray-100 px-4">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow">
        <h1 className="mb-2 text-2xl font-bold">Register</h1>

        <p className="mb-6 text-sm text-gray-500">Buat akun AniWatchList</p>

        {error && (
          <div className="mb-4 rounded bg-red-100 p-3 text-sm text-red-700">
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
            className="w-full rounded border px-3 py-2 outline-none focus:ring-2"
            required={true}
          />

          {/* Email */}
          <Input
            label="Email"
            name="email"
            type="email"
            placeholder="nama@email.com"
            value={form.email}
            onChange={handleChange}
            className="w-full rounded border px-3 py-2 outline-none focus:ring-2"
            required={true}
          />

          {/* Password */}
          <Input
            label="Password"
            name="password"
            type="password"
            placeholder="Minimal 6 karakter"
            value={form.password}
            onChange={handleChange}
            className="w-full rounded border px-3 py-2 outline-none focus:ring-2"
            required={true}
          />

          {/* Confirm Password */}
          <Input
            label="Konfirmasi Password"
            name="confirmPassword"
            type="password"
            placeholder="Ulangi password"
            value={form.confirmPassword}
            onChange={handleChange}
            className="w-full rounded border px-3 py-2 outline-none focus:ring-2"
            required={true}
          />

          <Button
            type="submit"
            disabled={loading}
            variant="outline"
            className="w-full rounded bg-black px-4 py-2 text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Membuat akun..." : "Register"}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-600">
          Sudah punya akun?{" "}
          <Link
            to="/login"
            className="font-medium text-blue-600 hover:underline"
          >
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}

export default RegisterForm;

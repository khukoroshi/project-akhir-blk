import { useState } from "react";
import { useNavigate } from "react-router-dom"; // 1. Import useNavigate
import api from "../services/api";

import Button from "../components/common/Button";
import Input from "../components/common/Input";

function Login() {
  // const [email, setEmail] = useState("");
  // const [password, setPassword] = useState("");

  // function handleSubmit(event) {
  //   event.preventDefault();

  //   console.log({
  //     email,
  //     password,
  //   });
  // }

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const navigate = useNavigate(); // 2. Inisialisasi router

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    try {
      const response = await api.post("/auth/login", { email, password });
      const token = response.data.data.token;

      // Simpan token ke LocalStorage
      localStorage.setItem("token", token);

      // 3. Pindah halaman secara mulus ke /profile
      navigate("/myList");
    } catch (err) {
      setErrorMsg(
        err.response?.data?.message || "Terjadi kesalahan pada server",
      );
    }
  };

  const registerPage = () => {
    navigate("/register");
  };
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 p-4">
      {errorMsg && <p style={{ color: "red" }}>{errorMsg}</p>}
      <form
        onSubmit={handleLogin}
        className="w-full max-w-md space-y-4 rounded-lg bg-white p-6 shadow"
      >
        <h1 className="text-2xl font-bold">Login</h1>

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

        <Button type="submit" className="w-full">
          Login
        </Button>
      </form>
      <p>
        Belum punya akun? <span onClick={registerPage}>register</span>
      </p>
    </div>
  );
}

export default Login;

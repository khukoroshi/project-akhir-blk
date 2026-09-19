import { BrowserRouter, Routes, Route } from "react-router-dom";

import Home from "./pages/Home";
import NotFound from "./pages/NotFound";
// import AnimeList from "./pages/AnimeList";
import MyList from "./pages/MyList";
import AnimeDetail from "./pages/AnimeDetail";

import LoginForm from "./components/features/aunt/LoginForm";
import RegisterForm from "./components/features/aunt/RegisterForm";

import AuthProvider from "./context/AuthProvider";
import ProtectedRoute from "./components/common/ProtectedRoute";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/" element={<Home />} />

          <Route path="/anime/:id" element={<AnimeDetail />} />

          <Route path="/login" element={<LoginForm />} />
          <Route path="/register" element={<RegisterForm />} />

          {/* Protected */}
          <Route element={<ProtectedRoute />}>
            <Route path="/myList" element={<MyList />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;

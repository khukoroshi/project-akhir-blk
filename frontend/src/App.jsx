import { BrowserRouter, Routes, Route } from "react-router-dom";

import Home from "./pages/Home";
import NotFound from "./pages/NotFound";
// import AnimeList from "./pages/AnimeList";
import MyList from "./pages/MyList";
import AnimeDetail from "./pages/AnimeDetail";

import LoginForm from "./components/features/aunt/LoginForm";
import RegisterForm from "./components/features/aunt/RegisterForm";

import ProtectedRoute from "./components/common/ProtectedRoute";
import Profile from "./pages/Profile";
import ProfileEdit from "./pages/ProfileEdit";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/" element={<Home />} />

        <Route path="/anime/:id" element={<AnimeDetail />} />
        <Route path="/u/:username" element={<Profile />} />

        <Route path="/login" element={<LoginForm />} />
        <Route path="/register" element={<RegisterForm />} />

        {/* Protected */}
        <Route element={<ProtectedRoute />}>
          <Route path="/myList" element={<MyList />} />
          <Route path="/profile/edit" element={<ProfileEdit />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

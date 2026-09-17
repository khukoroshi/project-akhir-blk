import * as authService from "../services/auth.service.mjs";

// Controller untuk Register
export const register = async (req, res, next) => {
  try {
    const newUser = await authService.registerUser(req.body);

    // Respon sukses ke frontend
    res.status(201).json({
      status: "success",
      message: "Register berhasil",
      data: newUser,
    });
  } catch (error) {
    next(error); // Lempar error ke Global Error Handler
  }
};

// Controller untuk Login
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const result = await authService.loginUser(email, password);

    res.status(200).json({
      status: "success",
      message: "Login berhasil",
      data: {
        user: result.user,
        token: result.token,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Controller untuk Get Profile
export const getProfile = (req, res) => {
  // Objek req.user didapat dari middleware auth/protect
  res.status(200).json({
    status: "success",
    message: "Berhasil mengambil profil user",
    data: {
      userInfo: req.user,
    },
  });
};

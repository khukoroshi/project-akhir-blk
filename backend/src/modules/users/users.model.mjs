import db from "../config/db.mjs"; // Import koneksi MySQL Anda

const User = {
  getProfile: async (usId) => {
    const query =
      "SELECT us_id, us_name, us_email, us_created_at FROM users WHERE us_id = ?";
    const [rows] = await db.execute(query, [usId]);
  },
};
// export const getProfile = async (req, res) => {
//   try {
//     // Query ke database menggunakan us_id dari token

//     if (rows.length === 0) {
//       return res.status(404).json({
//         status: "fail",
//         message: "User tidak ditemukan",
//       });
//     }

//     const user = rows[0];

//     res.status(200).json({
//       status: "success",
//       message: "Berhasil mengambil profil user",
//       data: {
//         user: {
//           id: user.us_id,
//           name: user.us_name,
//           email: user.us_email,
//           createdAt: user.us_created_at,
//         },
//       },
//     });
//   } catch (error) {
//     res.status(500).json({
//       status: "error",
//       message: error.message,
//     });
//   }
// };
export default User;

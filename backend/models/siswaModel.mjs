import db from "../config/db.mjs";

const Siswa = {
  getAllSiswa: async () => {
    const [rows] = await db.execute("SELECT * FROM siswa");
    return rows;
  },

  getByNama: async (nama) => {
    const query = "SELECT * FROM siswa WHERE nama LIKE ?";
    const [rows] = await db.execute(query, [`%${nama}%`]);
    return rows;
  },

  // getSiswaById: async (id) => {
  //   const [rows] = await db.execute("SELECT * FROM siswa WHERE id = ?", [id]);
  //   return rows;
  // },

  createSiswa: async (data) => {
    const { nama, email, kelas } = data;
    const query = "INSERT INTO siswa (nama, email, kelas) VALUES (?, ?, ?)";
    const [result] = await db.execute(query, [nama, email, kelas]);
    return result.insertId;
  },

  updateSiswa: async (id, data) => {
    const { nama, email, kelas } = data;
    const query =
      "UPDATE siswa SET nama = ?, email = ?, kelas = ? WHERE id = ?";
    const [result] = await db.execute(query, [nama, email, kelas, id]);
    return result.affectedRows;
  },

  deleteSiswa: async (id) => {
    const query = "DELETE FROM siswa WHERE id = ?";
    const [result] = await db.execute(query, [id]);
    return result.affectedRows;
  },
};

export default Siswa;

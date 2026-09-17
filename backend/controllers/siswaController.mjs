import Siswa from "../models/siswaModel.mjs";

const getAllSiswa = async (req, res) => {
  try {
    const siswa = await Siswa.getAllSiswa();
    res.status(200).json(siswa);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const cariSiswaByNama = async (req, res) => {
  try {
    const namaDicari = req.params.nama;
    const siswa = await Siswa.getByNama(namaDicari);
    if (siswa.length === 0) {
      return res.status(404).json({
        message: `Siswa dengan nama "${namaDicari}" tidak ditemukan`,
      });
    }
    res.status(200).json(siswa);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// const getSiswaById = async (req, res) => {
//   try {
//     const siswa = await Siswa.getSiswaById(req.params.id);
//     if (!siswa) {
//       return res.status(404).json({ message: "Siswa tidak ditemukan." });
//     }
//     res.status(200).json(siswa);
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// };

const tambahSiswa = async (req, res) => {
  try {
    const { nama, email, kelas } = req.body;
    if (!nama || !email || !kelas) {
      return res.status(400).json({
        message: "Data tidak lengkap! Nama, email, dan kelas wajib di isi.",
      });
    }
    if (!email.includes("@")) {
      return res.status(400).json({
        message: "Format email tidak valid!",
      });
    }

    const insertId = await Siswa.createSiswa(req.body);
    res.status(200).json({
      message: "Member baru berhasil ditambahkan.",
      siswaId: insertId,
    });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        message: "Email sudah terdaftar gunakan emai lain.",
      });
    }
    res.status(500).json({ error: error.message });
  }
};

const updateSiswa = async (req, res) => {
  try {
    const { nama, email, kelas } = req.body;
    if (!nama || !email || !kelas) {
      return res.status(400).json({
        message: "Data tidak lengkap! Nama, email, dan kelas wajib di isi.",
      });
    }
    if (!email.includes("@")) {
      return res.status(400).json({
        message: "Format email tidak valid!",
      });
    }

    const affectedRows = await Siswa.updateSiswa(req.params.id, req.body);
    if (affectedRows === 0) {
      return res.status(404).json({ message: "Siswa tidak ditemukan." });
    }
    res.status(200).json({
      message: "Data siswa berhasil diperbarui.",
    });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        message: "Email sudah terdaftar gunakan emai lain.",
      });
    }
    res.status(500).json({ error: error.message });
  }
};

const kickSiswa = async (req, res) => {
  try {
    const affectedRows = await Siswa.deleteSiswa(req.params.id);
    if (affectedRows === 0) {
      return res.status(404).json({ message: "Siswa tidak ditemukan." });
    }
    res.status(200).json({
      message: "Siswa berhasil di kick!!!",
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export { getAllSiswa, cariSiswaByNama, tambahSiswa, updateSiswa, kickSiswa };

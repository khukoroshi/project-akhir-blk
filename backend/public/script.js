// import "dotenv/config";
// const port = process.env.PORT || 3000;
// const API_URL = `http://localhost:${port}/api/siswa`;
const API_URL = `http://localhost:3000/api/siswa`;
const form = document.getElementById("siswaForm");
const tabelBody = document.getElementById("tabelSiswa");

// fungsi mengambil semua data
async function ambilSemuaSiswa() {
  try {
    const response = await fetch(API_URL);
    const data = await response.json();
    renderTable(data);
  } catch (error) {
    console.error("Gagal mengambil data:", error);
  }
}

// fungsi submit di form
form.addEventListener("submit", async (e) => {
  e.preventDefault(); // FIX BUG 1: Tambahkan kurung ()

  const id = document.getElementById("siswaId").value;
  const payload = {
    nama: document.getElementById("nama").value,
    email: document.getElementById("email").value,
    kelas: document.getElementById("kelas").value,
  };

  try {
    const isEdit = Boolean(id);
    const url = isEdit ? `${API_URL}/${id}` : API_URL;
    const method = isEdit ? "PUT" : "POST";

    const response = await fetch(url, {
      method: method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const result = await response.json();

    if (response.ok) {
      alert(result.message);
      resetForm();
      ambilSemuaSiswa();
    } else {
      alert(`Error: ${result.message}`);
    }
  } catch (error) {
    alert("Terjadi kesalahan pada server");
  }
});

// fungsi mengkick siswa
async function hapusSiswa(id) {
  if (confirm("Apakah Anda yakin ingin menghapus Siswa ini?")) {
    try {
      const response = await fetch(`${API_URL}/${id}`, {
        method: "DELETE",
      });
      const result = await response.json();

      if (response.ok) {
        alert(result.message);
        ambilSemuaSiswa();
      } else {
        alert(`Error: ${result.message}`);
      }
    } catch (error) {
      console.error("Gagal menghapus:", error);
    }
  }
}

// fungsi search
async function cariSiswa() {
  const namaDicari = document.getElementById("inputCari").value;
  if (!namaDicari) return ambilSemuaSiswa();
  try {
    const response = await fetch(`${API_URL}/${namaDicari}`);
    if (response.ok) {
      const data = await response.json();
      renderTable(Array.isArray(data) ? data : [data]);
    } else {
      renderTable([]);
      alert(`Siswa tidak ditemukan`);
    }
  } catch (error) {
    console.error("Gagal mencari data:", error);
  }
}

// fungsi untuk menampilkan data ke table
async function renderTable(data) {
  tabelBody.innerHTML = "";

  if (!data || data.length === 0) {
    tabelBody.innerHTML =
      '<tr><td colspan="5" style="text-align: center;">Tidak ada data</td></tr>';
    return;
  }

  data.forEach((siswa) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
            <td>${siswa.id}</td>
            <td>${siswa.nama}</td>
            <td>${siswa.email}</td>
            <td>${siswa.kelas}</td>
            <td>
              <button class="btn-warning" onclick="siapkanEdit('${siswa.id}', \`${siswa.nama}\`, '${siswa.email}', '${siswa.kelas}')">Edit</button>
              <button class="btn-danger" onclick="hapusSiswa('${siswa.id}')">Hapus</button>
            </td>
          `;
    tabelBody.appendChild(tr);
  });
}

// fungsi untuk mempersiapkan form edit
function siapkanEdit(id, nama, email, kelas) {
  document.getElementById("siswaId").value = id;
  document.getElementById("nama").value = nama;
  document.getElementById("email").value = email;
  document.getElementById("kelas").value = kelas;

  document.getElementById("formTitle").innerText = "Edit Data Siswa";
  document.getElementById("btnSubmit").innerText = "Update Data";
  document.getElementById("btnBatal").style.display = "inline-block";
  // window.scroll
  // Opsi 1: Pakai window.scrollTo (Paling kompatibel)
  window.scrollTo({
    top: 0,
    behavior: "smooth",
  });

  // Opsi 2 (Alternatif): Langsung scroll ke elemen form-nya
  // document.getElementById("formTitle").scrollIntoView({ behavior: "smooth" });
}

// fungsi untuk mereset form
function resetForm() {
  form.reset();
  document.getElementById("siswaId").value = "";
  document.getElementById("formTitle").innerText = "Tambah Siswa Baru";
  document.getElementById("btnSubmit").innerText = "Simpan Data";
  document.getElementById("btnBatal").style.display = "none";
}

document.getElementById("btnBatal").addEventListener("click", resetForm);
ambilSemuaSiswa();

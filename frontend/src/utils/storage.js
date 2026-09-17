export const storage = {
  get(key) {
    try {
      const value = localStorage.getItem(key);

      return value ? JSON.parse(value) : null;
    } catch {
      return null;
    }
  },

  set(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  },

  remove(key) {
    localStorage.removeItem(key);
  },

  clear() {
    localStorage.clear();
  },
};

// Contoh:

// storage.set("user", {
//   id: 1,
//   name: "John",
// });

// Ambil:

// const user = storage.get("user");

// Hapus:

// storage.remove("user");

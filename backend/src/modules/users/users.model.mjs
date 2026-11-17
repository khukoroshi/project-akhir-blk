import db from "../../config/db.mjs";

const User = {
  // Existence check only, so it selects a single column.
  emailExists: async (email) => {
    const [rows] = await db.execute(
      "SELECT us_id FROM users WHERE us_email = ?",
      [email],
    );
    return rows.length > 0;
  },

  findByEmail: async (email) => {
    const [rows] = await db.execute("SELECT * FROM users WHERE us_email = ?", [
      email,
    ]);
    return rows[0] ?? null;
  },

  // Raw DB errors (e.g. ER_DUP_ENTRY) are NOT caught here; the caller maps them.
  create: async ({ name, email, hashedPassword }) => {
    const [result] = await db.execute("CALL sp_insert_user(?, ?, ?)", [
      name,
      email,
      hashedPassword,
    ]);
    // sp_insert_user returns the new row with a us_id column.
    return result[0][0].us_id;
  },
};

export default User;
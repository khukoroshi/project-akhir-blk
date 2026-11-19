import db from "../../config/db.mjs";

const PROFILE_SELECT = `
  SELECT u.us_id, u.us_name, u.us_created_at,
         p.display_name, p.bio, p.is_private
  FROM users u
  LEFT JOIN user_profiles p ON p.user_id = u.us_id`;

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

  // Profile row joined with the account. user_profiles may not exist yet.
  findProfileByUsername: async (username) => {
    const [rows] = await db.execute(`${PROFILE_SELECT} WHERE u.us_name = ?`, [
      username,
    ]);
    return rows[0] ?? null;
  },

  findProfileById: async (userId) => {
    const [rows] = await db.execute(`${PROFILE_SELECT} WHERE u.us_id = ?`, [
      userId,
    ]);
    return rows[0] ?? null;
  },

  // Returns { us_id, us_name } or null. us_name is the canonical spelling.
  findIdByUsername: async (username) => {
    const [rows] = await db.execute(
      "SELECT us_id, us_name FROM users WHERE us_name = ?",
      [username],
    );
    return rows[0] ?? null;
  },

  // Idempotent: a duplicate (also from two parallel requests) changes nothing.
  follow: async (followerId, followingId) => {
    await db.execute(
      `INSERT INTO follows (follower_id, following_id)
       VALUES (?, ?)
       ON DUPLICATE KEY UPDATE follower_id = follower_id`,
      [followerId, followingId],
    );
  },

  unfollow: async (followerId, followingId) => {
    await db.execute(
      "DELETE FROM follows WHERE follower_id = ? AND following_id = ?",
      [followerId, followingId],
    );
  },

  isFollowing: async (followerId, followingId) => {
    const [rows] = await db.execute(
      "SELECT 1 FROM follows WHERE follower_id = ? AND following_id = ? LIMIT 1",
      [followerId, followingId],
    );
    return rows.length > 0;
  },

  // One query, two COUNT(*) subqueries (primary key and foreign key indexes).
  getFollowCounts: async (userId) => {
    const [[row]] = await db.execute(
      `SELECT
         (SELECT COUNT(*) FROM follows WHERE following_id = ?) AS followers,
         (SELECT COUNT(*) FROM follows WHERE follower_id = ?) AS following`,
      [userId, userId],
    );
    return {
      followersCount: Number(row.followers),
      followingCount: Number(row.following),
    };
  },

  // First PUT creates the row, later PUTs update it. Avatar/banner untouched.
  upsertProfile: async (userId, { displayName, bio, isPrivate }) => {
    await db.execute(
      `INSERT INTO user_profiles (user_id, display_name, bio, is_private)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         display_name = VALUES(display_name),
         bio = VALUES(bio),
         is_private = VALUES(is_private)`,
      [userId, displayName, bio, isPrivate],
    );
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

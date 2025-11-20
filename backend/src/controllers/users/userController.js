// src/controllers/users/userController.js

const bcrypt = require("bcryptjs");
const pool = require("../../config/db");

// 👤 Create User with Profile Image and Unit
exports.createUser = async (req, res) => {
  try {
    const { username, email, password, mobile, role_id, unit_id } = req.body;
    const profile_image = req.file?.buffer ?? null;

    if (!username || !email || !password || !role_id || !unit_id) {
      return res.status(400).json({ error: "All fields are required." });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);

    const result = await pool.query(
      `
      INSERT INTO users (
        user_id,
        username,
        email,
        password,
        mobile,
        role_id,
        profile_image,
        unit_id
      ) VALUES (
        gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7
      )
      RETURNING
        user_id   AS id,
        username,
        email,
        mobile,
        role_id,
        unit_id
      `,
      [username, email, hashedPassword, mobile, role_id, profile_image, unit_id]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Error creating user:", error);
    res.status(500).json({ error: "Failed to create user." });
  }
};

// 📋 Get All Users (with unit name + role as `role`)
exports.getAllUsers = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        u.user_id   AS id,
        u.username,
        u.email,
        u.mobile,
        u.role_id,
        ur.role_name   AS role,
        u.unit_id,
        un.unit_name,
        u.profile_image
      FROM users u
      LEFT JOIN user_roles ur 
        ON u.role_id = ur.role_id
      LEFT JOIN unit un 
        ON u.unit_id = un.unit_id
      ORDER BY u.username;
    `);

    const users = result.rows.map((user) => ({
      id: user.id,
      username: user.username,
      email: user.email,
      mobile: user.mobile,
      role_id: user.role_id,
      role: user.role,
      unit_id: user.unit_id,
      unit_name: user.unit_name,
      has_image: !!user.profile_image,
      profile_image: user.profile_image
        ? user.profile_image.toString("base64")
        : null,
    }));

    res.json(users);
  } catch (err) {
    console.error("Error fetching users:", err);
    res.status(500).json({ error: "Failed to fetch users." });
  }
};


// ✏️ Update User (with optional password change)
exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params; // UUID string
    const {
      username,
      email,
      mobile,
      role_id,
      unit_id,
      password, // ← grab the password field
    } = req.body;
    const profile_image = req.file?.buffer ?? null;

    // 1) Required fields
    if (!username || !email || !role_id || !unit_id) {
      return res
        .status(400)
        .json({ error: "Username, email, role_id, and unit_id are required." });
    }

    // 2) Email uniqueness
    const emailCheck = await pool.query(
      `SELECT 1 FROM users WHERE email = $1 AND user_id != $2`,
      [email, id]
    );
    if (emailCheck.rowCount > 0) {
      return res
        .status(409)
        .json({ error: "Email already in use by another user." });
    }

    // 3) Start building the UPDATE
    let idx = 1;
    const params = [username, email, mobile, role_id, unit_id];
    let query = `
      UPDATE users SET
        username   = $${idx++},
        email      = $${idx++},
        mobile     = $${idx++},
        role_id    = $${idx++},
        unit_id    = $${idx++}
    `;

    // 4) Optional: password change
    if (password) {
      const hashed = bcrypt.hashSync(password, 10);
      query += `, password = $${idx++}`;
      params.push(hashed);
    }

    // 5) Optional: profile image
    if (profile_image) {
      query += `, profile_image = $${idx++}`;
      params.push(profile_image);
    }

    // 6) Finalize and run
    query += ` WHERE user_id = $${idx} 
               RETURNING
                 user_id   AS id,
                 username,
                 email,
                 mobile,
                 role_id,
                 unit_id`;
    params.push(id);

    const result = await pool.query(query, params);
    return res.json(result.rows[0]);
  } catch (err) {
    console.error("Error updating user:", err);
    return res.status(500).json({ error: "Failed to update user." });
  }
};

// 🗑️ Delete User
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query(`DELETE FROM users WHERE user_id = $1`, [id]);
    res.json({ message: "User deleted." });
  } catch (err) {
    console.error("Error deleting user:", err);
    res.status(500).json({ error: "Failed to delete user." });
  }
};

// 🖼️ Get User Profile Image
exports.getUserImage = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT profile_image FROM users WHERE user_id = $1`,
      [id]
    );

    if (!result.rows.length || !result.rows[0].profile_image) {
      return res.status(404).json({ error: "No image found." });
    }

    res.set("Content-Type", "image/png");
    res.send(result.rows[0].profile_image);
  } catch (err) {
    console.error("Error fetching image:", err);
    res.status(500).json({ error: "Image fetch failed." });
  }
};

exports.getAllRoles = async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT role_id, role_name FROM user_roles ORDER BY role_id`
    );
    res.json(rows);
  } catch (err) {
    console.error("Fetch roles error:", err);
    res.status(500).json({ error: "Failed to fetch roles." });
  }
};

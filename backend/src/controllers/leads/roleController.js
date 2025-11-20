const pool = require('../../config/db');

// GET /api/roles
exports.getRoles = async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT id, name FROM roles ORDER BY name'
    );
    return res.json(rows);
  } catch (err) {
    console.error('Error fetching roles:', err);
    return res.status(500).json({ error: 'Failed to fetch roles' });
  }
};

// POST /api/roles
exports.createRole = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Role name is required' });
    }

    const { rows } = await pool.query(
      'INSERT INTO roles (name) VALUES ($1) RETURNING id, name',
      [name]
    );
    return res.status(201).json(rows[0]);
  } catch (err) {
    console.error('Error creating role:', err);
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Role already exists' });
    }
    return res.status(500).json({ error: 'Failed to create role' });
  }
};

// PUT /api/roles/:id
exports.updateRole = async (req, res) => {
  try {
    const { id }   = req.params;
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Role name is required' });
    }

    const { rows } = await pool.query(
      'UPDATE roles SET name = $1, updated_at = now() WHERE id = $2 RETURNING id, name',
      [name, id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Role not found' });
    }
    return res.json(rows[0]);
  } catch (err) {
    console.error('Error updating role:', err);
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Role name conflicts with existing' });
    }
    return res.status(500).json({ error: 'Failed to update role' });
  }
};

// DELETE /api/roles/:id
exports.deleteRole = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'DELETE FROM roles WHERE id = $1 RETURNING id',
      [id]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Role not found' });
    }
    return res.status(204).end();
  } catch (err) {
    console.error('Error deleting role:', err);
    return res.status(500).json({ error: 'Failed to delete role' });
  }
};

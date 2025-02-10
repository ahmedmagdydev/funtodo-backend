const { pool } = require("../db/pool");

class UserModel {
  static async findByEmail(email) {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    return result.rows[0];
  }

  static async create(userData) {
    const { email, password, salt, active, verification_token } = userData;
    const result = await pool.query(
      'INSERT INTO users (email, password, salt, active, verification_token) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [email, password, salt, active, verification_token]
    );
    return result.rows[0];
  }

  static async updateVerification(userId) {
    const result = await pool.query(
      'UPDATE users SET active = true, verification_token = NULL WHERE id = $1 RETURNING *',
      [userId]
    );
    return result.rows[0];
  }

  static async updateGoogleVerification(userId, active) {
    const result = await pool.query(
      'UPDATE users SET active = $1, verification_token = null WHERE id = $2 RETURNING *',
      [active, userId]
    );
    return result.rows[0];
  }
}

module.exports = UserModel;

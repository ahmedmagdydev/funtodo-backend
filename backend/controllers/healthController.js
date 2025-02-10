const { pool } = require("../db/pool");
const logger = require("../utils/logger");

class HealthController {
  static async check(req, res) {
    try {
      await pool.query("SELECT 1");
      res.status(200).json({
        status: "ok",
        db: "connected",
        mqtt: {
          tcp: true,
        },
      });
    } catch (err) {
      logger.error("Health check failed:", err);
      res.status(500).json({ 
        status: "error", 
        details: err.message 
      });
    }
  }
}

module.exports = HealthController;

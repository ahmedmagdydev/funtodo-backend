const express = require("express");
const { pool } = require("../db/pool");
const { generateSalt, hashPassword, verifyPassword } = require("../utils/auth");
const { verifyToken } = require("../utils/jwt");
const jwt = require("jsonwebtoken");
const router = express.Router();
const { OAuth2Client } = require("google-auth-library");
const dotenv = require("dotenv");

dotenv.config();

/**
 * @route POST /api/auth/register
 * @description Register a new user
 * @access Public
 */
router.post("/register", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Invalid email format",
      });
    }

    // Check if user already exists
    const existingUser = await pool.query(
      "SELECT id FROM users WHERE email = $1",
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: "User already exists",
      });
    }

    // Generate salt and hash password
    const salt = generateSalt();
    const hashedPassword = await hashPassword(password, salt);

    // Insert new user
    const result = await pool.query(
      "INSERT INTO users (email, password, salt, tier) VALUES ($1, $2, $3, $4) RETURNING id, email, tier, active, created_at",
      [email, hashedPassword, salt, "free"]
    );

    res.status(201).json({
      success: true,
      message: "Registration successful",
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Error registering user:", error);
    res.status(500).json({
      success: false,
      message: "Registration failed",
    });
  }
});

/**
 * @route POST /api/auth/login
 * @description Authenticate user and get token
 * @access Public
 */
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    // Find user by email
    const result = await pool.query(
      "SELECT id, email, password, salt, tier, active FROM users WHERE email = $1",
      [email]
    );

    const user = result.rows[0];

    // Check if user exists
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Check if user is active
    if (!user.active) {
      return res.status(401).json({
        success: false,
        message: "Account is deactivated",
      });
    }

    // Verify password
    const isValidPassword = await verifyPassword(
      password,
      user.password,
      user.salt
    );
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        tier: user.tier,
      },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    // Return user data and token
    res.json({
      success: true,
      message: "Login successful",
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          tier: user.tier,
          active: user.active,
        },
      },
    });
  } catch (error) {
    console.error("Error during login:", error);
    res.status(500).json({
      success: false,
      message: "Login failed",
    });
  }
});

const oAuth2Client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  "postmessage"
);

router.post(
  "/google",
  // passport.authenticate("google-token", { session: false }),
  async (req, res) => {
    console.log("🚀 ~ req.body.code:", req.body.access_token);
    const { tokens } = await oAuth2Client.getToken(req.body.access_token); // exchange code for tokens
    console.log(tokens);

    res.json(tokens);
  }
);

module.exports = router;

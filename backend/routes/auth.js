const express = require("express");
const { pool } = require("../db/pool");
const {
  generateSalt,
  hashPassword,
  verifyPassword,
  sendEmail,
} = require("../utils/auth");

const jwt = require("jsonwebtoken");
const router = express.Router();
const { OAuth2Client } = require("google-auth-library");
const dotenv = require("dotenv");

dotenv.config();

/**
 * @route GET /api/auth/verify
 * @description Verify user's email using the verification token
 * @access Public
 */
router.get("/verify", async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: "Verification token is required",
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { email } = decoded;

    // Find user by email and check verification token
    const user = await pool.query(
      "SELECT id, verification_token FROM users WHERE email = $1",
      [email]
    );

    if (user.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (user.rows[0].verification_token !== token) {
      return res.status(400).json({
        success: false,
        message: "Invalid verification token",
      });
    }

    // Activate user account
    await pool.query(
      "UPDATE users SET active = true, verification_token = NULL WHERE id = $1",
      [user.rows[0].id]
    );

    return res.status(200).json({
      success: true,
      message: "Email verification successful. Your account is now active.",
    });
  } catch (error) {
    console.error("Error verifying email:", error);
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Verification link has expired",
      });
    }
    return res.status(500).json({
      success: false,
      message: "Email verification failed",
    });
  }
});

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

    // Hash password
    const salt = generateSalt();
    const hashedPassword = await hashPassword(password, salt);
    console.log("🚀 ~ router.post ~ hashedPassword:", hashedPassword);

    // Generate verification token
    const verificationToken = jwt.sign({ email }, process.env.JWT_SECRET, {
      expiresIn: "24h",
    });

    // Create user with inactive status
    const newUser = await pool.query(
      "INSERT INTO users (email, password, salt, active, verification_token) VALUES ($1, $2, $3, $4, $5) RETURNING id",
      [email, hashedPassword, salt, false, verificationToken]
    );

    // Send verification email
    await sendEmail(email, verificationToken);

    return res.status(201).json({
      success: true,
      message:
        "Registration successful. Please check your email to verify your account.",
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
        message:
          "Account is deactivated, check your email for a verification link",
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

router.get("/send-email", async (req, res) => {
  try {
    await sendEmail(
      "ahmed.magdy.dev@gmail.com",
      "Z6nbK3Vzci1jdWs4amF0dW1waHM3M2JiZHI3MJW-k-TwjK_6PD6hXjKA12Ok0bKLnwjZ5Qss71PfoIjm"
    );
    res.status(200).json({ message: "Email sent" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error sending email", error });
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

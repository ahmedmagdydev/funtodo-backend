const express = require("express");
const router = express.Router();
const { authLimiter } = require("../middleware/rateLimiter");
const AuthController = require("../controllers/authController");
const GoogleAuthController = require("../controllers/googleAuthController");
const {
  validateRegistration,
  validateLogin,
} = require("../middleware/validation");

/**
 * @route GET /api/auth/verify
 * @description Verify user's email using the verification token
 * @access Public
 */
router.use(authLimiter);

/**
 * @route POST /api/auth/register
 * @description Register a new user
 * @access Public
 */
router.post("/register", validateRegistration, AuthController.register);

/**
 * @route POST /api/auth/login
 * @description Authenticate user and get token
 * @access Public
 */
router.post("/login", validateLogin, AuthController.login);

/**
 * @route GET /api/auth/verify
 * @description Verify user's email using the verification token
 * @access Public
 */
router.get("/verify", AuthController.verifyEmail);

/**
 * @route POST /api/auth/google
 * @description Authenticate with Google
 * @access Public
 */
router.post("/google", GoogleAuthController.authenticate);

module.exports = router;

const jwt = require("jsonwebtoken");
const { generateSalt, hashPassword, verifyPassword } = require("../utils/auth");
const UserModel = require("../models/userModel");
const EmailService = require("../services/emailService");

class AuthController {
  static async register(req, res) {
    try {
      const { email, password } = req.body;

      // Check if user already exists
      const existingUser = await UserModel.findByEmail(email);
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: "Email already registered",
        });
      }

      // Generate salt and hash password
      const salt = generateSalt();
      const hashedPassword = await hashPassword(password, salt);

      // Generate verification token
      const verificationToken = jwt.sign(
        { email },
        process.env.JWT_SECRET,
        { expiresIn: "24h" }
      );

      // Create user
      const user = await UserModel.create({
        email,
        password: hashedPassword,
        salt,
        active: false,
        verification_token: verificationToken,
      });

      // Send verification email
      await EmailService.sendVerificationEmail(email, verificationToken);

      res.status(201).json({
        success: true,
        message: "Registration successful. Please check your email for verification.",
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({
        success: false,
        message: "Registration failed",
      });
    }
  }

  static async login(req, res) {
    try {
      const { email, password } = req.body;

      // Find user
      const user = await UserModel.findByEmail(email);
      if (!user) {
        return res.status(401).json({
          success: false,
          message: "Invalid credentials",
        });
      }

      // Verify password
      const isValidPassword = await verifyPassword(password, user.salt, user.password);
      if (!isValidPassword) {
        return res.status(401).json({
          success: false,
          message: "Invalid credentials",
        });
      }

      // Check if account is active
      if (!user.active) {
        return res.status(403).json({
          success: false,
          message: "Account not activated. Please check your email for verification.",
        });
      }

      // Generate JWT token
      const token = jwt.sign(
        { userId: user.id, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: "24h" }
      );

      res.json({
        success: true,
        token,
        user: {
          id: user.id,
          email: user.email,
          tier: user.tier,
          active: user.active,
        },
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({
        success: false,
        message: "Login failed",
      });
    }
  }

  static async verifyEmail(req, res) {
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

      // Find user
      const user = await UserModel.findByEmail(email);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      if (user.verification_token !== token) {
        return res.status(400).json({
          success: false,
          message: "Invalid verification token",
        });
      }

      // Activate user account
      await UserModel.updateVerification(user.id);

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
  }
}

module.exports = AuthController;

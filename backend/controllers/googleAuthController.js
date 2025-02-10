const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { generateSalt, hashPassword } = require("../utils/auth");
const UserModel = require("../models/userModel");
const GoogleService = require("../services/googleService");

class GoogleAuthController {
  static async authenticate(req, res) {
    try {
      // Get user info from Google
      const googleUserInfo = await GoogleService.getUserInfo(
        req.body.access_token
      );

      // Check if user exists
      let user = await UserModel.findByEmail(googleUserInfo.email);

      if (!user) {
        // Generate random password and salt for Google users
        const salt = generateSalt();
        const hashedPassword = await hashPassword(
          "google-oauth-" + crypto.randomBytes(16).toString("hex"),
          salt
        );

        // Create new user
        user = await UserModel.create({
          email: googleUserInfo.email,
          password: hashedPassword,
          salt,
          active: googleUserInfo.verified_email,
          verification_token: null,
        });
      } else if (googleUserInfo.verified_email && !user.active) {
        // Update user active status if email is verified
        user = await UserModel.updateGoogleVerification(user.id, true);
      }

      // Only allow login if user is active
      if (!user.active) {
        return res.status(403).json({
          success: false,
          error: "Account is not active. Please verify your email.",
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
      console.error("Google authentication error:", error);
      res.status(500).json({
        success: false,
        error: "Authentication failed",
      });
    }
  }
}

module.exports = GoogleAuthController;

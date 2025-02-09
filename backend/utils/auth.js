const crypto = require("crypto");
const dotenv = require("dotenv");

const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth2").Strategy;
const jwt = require("jsonwebtoken");

/**
 * Generate a random salt for password hashing
 * @returns {string} A random salt
 */
function generateSalt() {
  return crypto.randomBytes(16).toString("hex");
}

/**
 * Hash a password with a given salt
 * @param {string} password - The plain text password
 * @param {string} salt - The salt to use for hashing
 * @returns {Promise<string>} The hashed password
 */
async function hashPassword(password, salt) {
  return new Promise((resolve, reject) => {
    crypto.pbkdf2(password, salt, 10000, 64, "sha512", (err, derivedKey) => {
      if (err) reject(err);
      resolve(derivedKey.toString("hex"));
    });
  });
}

/**
 * Verify a password against a hash and salt
 * @param {string} password - The plain text password to verify
 * @param {string} hash - The stored hash
 * @param {string} salt - The stored salt
 * @returns {Promise<boolean>} Whether the password is valid
 */
async function verifyPassword(password, hash, salt) {
  const hashedPassword = await hashPassword(password, salt);
  return hashedPassword === hash;
}

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

passport.use(
  new GoogleStrategy(
    {
      clientID: GOOGLE_CLIENT_ID,
      clientSecret: GOOGLE_CLIENT_SECRET,
      callbackURL: "http://localhost:3001",
      passReqToCallback: true,
    },
    function (request, accessToken, refreshToken, profile, done) {
      console.log("🚀 ~ profile:", profile);
      return done(null, profile);
    }
  )
);

passport.serializeUser(function (user, done) {
  done(null, user);
});

passport.deserializeUser(function (user, done) {
  done(null, user);
});

const verifyToken = (token) => {
  return new Promise((resolve, reject) => {
    jwt.verify(token, process.env.GOOGLE_CLIENT_SECRET, (err, decoded) => {
      if (err) reject(err);
      resolve(decoded);
    });
  });
};
module.exports = {
  generateSalt,
  hashPassword,
  verifyPassword,
  verifyToken,
};

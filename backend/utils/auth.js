const crypto = require("crypto");
const dotenv = require("dotenv");

const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth2").Strategy;
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");

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
const transporter = nodemailer.createTransport({
  host: "smtp.ethereal.email",
  port: 587,
  auth: {
    user: "johnnie.heidenreich59@ethereal.email",
    pass: "88jbNpskBna8FJSQXq",
  },
});

const sendEmail = async (mail, activationToken) => {
  // send mail with defined transport object
  const info = await transporter.sendMail({
    from: '"FunTodo 👻" <maddison53@ethereal.email>', // sender address
    to: mail, // list of receivers
    subject: "Activate your Funtodo account", // Subject line
    text: "Hi there,", // plain text body
    html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4CAF50;">Welcome to FunTodo!</h2>
        <p>Hi there,</p>
        <p>Thank you for signing up for FunTodo. We're excited to have you on board!</p>
        <p>To activate your account and start using FunTodo, please click the button below:</p>
        <p style="text-align: center;">
            <a href="https://funtodo-iot.netlify.app/verify-email?token=${activationToken}" style="background-color: #4CAF50; color: white; padding: 14px 20px; text-align: center; text-decoration: none; display: inline-block; border-radius: 4px; font-size: 16px;">Activate Your Account</a>
        </p>
        <p>This activation link will expire in 24 hours. If you didn't sign up for a FunTodo account, you can safely ignore this email.</p>
        <p>If you have any questions or need assistance, please don't hesitate to contact our support team.</p>
        <p>Best regards,<br>The FunTodo Team</p>
    </div>
    `, // html body
  });

  console.log("Message sent: %s", info.messageId);
  // Message sent: <d786aa62-4e0a-070a-47ed-0b0666549519@ethereal.email>
};

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
  sendEmail,
};

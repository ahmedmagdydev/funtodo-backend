const { sendEmail } = require("../utils/auth");

class EmailService {
  static async sendVerificationEmail(email, token) {
    const verificationLink = `${process.env.FRONTEND_URL}/verify?token=${token}`;
    const emailContent = `
      Please verify your email by clicking on the following link:
      ${verificationLink}
      
      This link will expire in 24 hours.
    `;

    await sendEmail(email, "Email Verification", emailContent);
  }
}

module.exports = EmailService;

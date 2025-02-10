const { OAuth2Client } = require("google-auth-library");
const { google } = require("googleapis");
const dotenv = require("dotenv");

dotenv.config();

const oAuth2Client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

class GoogleService {
  static async getUserInfo(accessToken) {
    try {
      const { tokens } = await oAuth2Client.getToken(accessToken);
      oAuth2Client.setCredentials(tokens);
      const oauth2 = google.oauth2({ version: 'v2', auth: oAuth2Client });
      const { data } = await oauth2.userinfo.get();
      return data;
    } catch (error) {
      console.error('Error getting Google user info:', error);
      throw error;
    }
  }
}

module.exports = GoogleService;

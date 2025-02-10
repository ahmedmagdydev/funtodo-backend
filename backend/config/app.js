const dotenv = require("dotenv");
const path = require("path");

// Load environment variables
dotenv.config();

module.exports = {
  port: process.env.PORT || 3000,
  env: process.env.NODE_ENV || "development",
  cors: {
    origin: process.env.CORS_ORIGIN || "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
    maxAge: 86400,
  },
  jwt: {
    secret: process.env.JWT_SECRET,
  },
  mqtt: {
    url: process.env.MQTT_BROKER_URL,
    username: process.env.MQTT_USERNAME,
    password: process.env.MQTT_SECRET_KEY,
  },
  paths: {
    public: path.join(__dirname, "../public"),
  }
};

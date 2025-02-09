require("dotenv").config({
  path: require("path").resolve(__dirname, "../.env"),
}); // Load environment variables from parent directory

const mqtt = require("mqtt");
const jwt = require("jsonwebtoken");

// MQTT broker details
const brokerUrl = process.env.MQTT_BROKER_URL;
const username = process.env.MQTT_USERNAME;
const secretKey = process.env.MQTT_SECRET_KEY || process.env.JWT_SECRET; // Fallback to JWT_SECRET
const tokenExpiry = process.env.MQTT_TOKEN_EXPIRY || "1h";

// Validate environment variables
if (!brokerUrl) {
  console.error(
    "Error: MQTT_BROKER_URL is not defined in environment variables"
  );
  process.exit(1);
}

if (!secretKey) {
  console.error(
    "Error: Neither MQTT_SECRET_KEY nor JWT_SECRET is defined in environment variables"
  );
  process.exit(1);
}

// Generate JWT token
const tokenPayload = {
  device: "sensor-123",
  role: "sensor",
  username: username || "sensor",
};

console.log("Connecting to broker:", brokerUrl);
console.log("Using username:", tokenPayload.username);

const token = jwt.sign(tokenPayload, secretKey, { expiresIn: tokenExpiry });

// Connect to MQTT broker with authentication
const client = mqtt.connect(brokerUrl, {
  username: tokenPayload.username,
  password: token,
  rejectUnauthorized: false, // For development only
});

client.on("connect", () => {
  console.log("Connected to MQTT broker with authentication");

  // Simulate sensor data every 5 seconds
  setInterval(() => {
    const sensors = [
      {
        topic: "ahmedmadgydev/sensor/temperature",
        value: 20 + Math.random() * 10, // Random temperature between 20-30°C
        unit: "°C",
      },
      {
        topic: "ahmedmadgydev/sensor/humidity",
        value: 30 + Math.random() * 40, // Random humidity between 30-70%
        unit: "%",
      },
      {
        topic: "ahmedmadgydev/sensor/pressure",
        value: 980 + Math.random() * 40, // Random pressure between 980-1020 hPa
        unit: "hPa",
      },
    ];

    // Publish each sensor reading
    sensors.forEach((sensor) => {
      const message = {
        value: Number(sensor.value.toFixed(2)),
        unit: sensor.unit,
        timestamp: new Date().toISOString(),
        deviceId: tokenPayload.device,
      };

      client.publish(sensor.topic, JSON.stringify(message));
      console.log(`Published to ${sensor.topic}:`, message);
    });
  }, 5000);
});

client.on("error", (error) => {
  console.error("MQTT connection error:", error.message);
});

client.on("close", () => {
  console.log("MQTT connection closed");
});

// Handle process termination
process.on("SIGINT", () => {
  console.log("Closing MQTT connection...");
  client.end(true, () => {
    console.log("MQTT connection closed cleanly");
    process.exit(0);
  });
});

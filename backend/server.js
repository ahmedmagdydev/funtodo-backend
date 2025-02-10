const express = require("express");
const http = require("http");
const cors = require("cors");

const { pool } = require("./db/pool");
const dotenv = require("dotenv");
dotenv.config();
const path = require("path");

const WebSocket = require("ws");

const mqtt = require("mqtt");

// Load environment variables

const app = express();

// Core middleware setup
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
    maxAge: 86400,
  })
);
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));
app.use("/api/auth", require("./routes/auth"));

// Add health check endpoint
app.get("/health", async (req, res) => {
  try {
    await pool.query("SELECT 1");
    res.status(200).json({
      status: "ok",
      db: "connected",
      mqtt: {
        tcp: true, // TCP server is always started
      },
    });
  } catch (err) {
    res.status(500).json({ status: "error", details: err.message });
  }
});

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

function broadcast(data) {
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  });
}

const clientId = `mqtt_${Math.random().toString(16).slice(3)}`;
const client = mqtt.connect(process.env.MQTT_BROKER_URL, {
  clientId,
  clean: true,
  connectTimeout: 4000,
  username: process.env.MQTT_USERNAME,
  password: process.env.MQTT_SECRET_KEY,
  reconnectPeriod: 1000,
});
client.on("connect", () => {
  console.log("Connected to MQTT broker");
  client.subscribe("msa/#");
});
wss.on("connection", (ws) => {
  console.log("Client connected");
  // Send an initial welcome message to the client upon connection

  // When the client disconnects, the 'close' event is triggered
  ws.on("close", () => {
    console.log("Client disconnected");
    ws.send("disconnect");
    // client.end();
    triggerBackendEvent();
  });
});
// This function represents the backend event that you want to trigger
function triggerBackendEvent() {
  // Your backend logic here. For example:
  // client.end();

  console.log("Backend event triggered due to client disconnect");
  // You could perform actions like updating a database, sending notifications, etc.
}

client.on("message", (topic, message) => {
  console.log(`MQTT message received on topic ${topic}: ${message.toString()}`);
  const data = JSON.stringify({ type: topic, message: message.toString() });
  broadcast(data);
  // message is Buffer
  // console.log("Received message:", topic, message.toString());
  // ws.send(JSON.stringify({ type: topic, message: message.toString() }));
  // client.end();
});
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`HTTP server running on port ${PORT}`);
});

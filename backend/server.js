const express = require("express");
const { createServer } = require("http");
const cors = require("cors");
// const { Broker } = require("./mqtt/broker");
const { pool } = require("./db/pool");
const dotenv = require("dotenv");
const ws = require("websocket-stream");
const path = require("path");
const aedes = require("aedes")();

// Load environment variables
dotenv.config();

const app = express();
const httpServer = createServer(app);

// Initialize MQTT broker
// const mqttBroker = new Broker();
// mqttBroker.attachToServer(httpServer);
ws.createServer({ server: httpServer }, aedes.handle);
// Initialize WebSocket handler

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
// app.use('/api/users', require('./routes/users'));
// app.use('/api', require('./middleware/auth'));
// app.use('/stripe', require('./routes/stripe'));

// Add health check endpoint
app.get("/health", async (req, res) => {
  try {
    await pool.query("SELECT 1");
    res.status(200).json({
      status: "ok",
      db: "connected",
      mqtt: {
        tcp: true, // TCP server is always started
        ws: httpServer.listening, // WebSocket server status
      },
    });
  } catch (err) {
    res.status(500).json({ status: "error", details: err.message });
  }
});

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  console.log(`HTTP server running on port ${PORT}`);
  console.log(`WebSocket server is available at ws://localhost:${PORT}`);
  console.log(`Dashboard available at http://localhost:${PORT}`);
});

const express = require("express");
const http = require("http");
const cors = require("cors");

const { pool } = require("./db/pool");
const dotenv = require("dotenv");
dotenv.config();
const path = require("path");

const WebSocket = require("ws");
const jwt = require("jsonwebtoken");

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

const userConnections = new Map(); // username -> Set<WebSocket>
const userMqttClients = new Map(); // username -> mqtt.Client

function broadcast(data) {
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  });
}

// const clientId = `mqtt_${Math.random().toString(16).slice(3)}`;
// const client = mqtt.connect(process.env.MQTT_BROKER_URL, {
//   clientId,
//   clean: true,
//   connectTimeout: 4000,
//   username: process.env.MQTT_USERNAME,
//   password: process.env.MQTT_SECRET_KEY,
//   reconnectPeriod: 1000,
// });
// client.on("connect", () => {
//   console.log("Connected to MQTT broker");
//   client.subscribe("msa/#");
// });

function createUserMqttClient(username) {
  const client = mqtt.connect(process.env.MQTT_BROKER_URL, {
    clientId: `user_${username}_${Date.now()}`,
    clean: true,
    username: process.env.MQTT_USERNAME,
    password: process.env.MQTT_SECRET_KEY,
  });
  client.on("connect", () => {
    console.log("Connected to MQTT broker");
    // client.subscribe("msa/#");
  });
  client.on("message", (topic, message) => {
    userConnections.get(username)?.forEach((userWs) => {
      if (userWs.readyState === WebSocket.OPEN) {
        userWs.send(
          JSON.stringify({
            type: topic,
            message: message.toString(),
          })
        );
      }
    });
  });

  return client;
}

wss.on("connection", (ws) => {
  console.log("Client connected");

  // Authentication handler
  ws.once("message", (rawMessage) => {
    try {
      const { token } = JSON.parse(rawMessage);
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      ws.username = decoded.userId;
      if (!userConnections.has(ws.username)) {
        userConnections.set(ws.username, new Set());
      }
      userConnections.get(ws.username).add(ws);

      ws.send(JSON.stringify({ status: "authenticated" }));
      console.log(`User ${ws.username} connected`);
    } catch (error) {
      console.log("WS auth failed:", error.message);
      ws.close(1008, "Authentication required");
    }
  });

  ws.on("message", (rawMessage) => {
    if (!ws.username) return;

    try {
      const { action, sensor } = JSON.parse(rawMessage);
      if (action === "subscribe" && sensor) {
        const topic = `${ws.username}/${sensor}`;
        if (!userMqttClients.has(ws.username)) {
          userMqttClients.set(ws.username, createUserMqttClient(ws.username));
        }

        userMqttClients.get(ws.username).subscribe(topic, (err) => {
          if (!err) {
            ws.send(
              JSON.stringify({
                status: "subscribed",
                sensor,
                topic,
              })
            );
          }
        });
      }
    } catch (error) {
      console.log("Invalid message format:", error.message);
    }
  });

  ws.on("close", () => {
    console.log(`Client disconnected ${ws.username || "unauthenticated"}`);

    if (ws.username) {
      userConnections.get(ws.username)?.delete(ws);

      if (userConnections.get(ws.username)?.size === 0) {
        userConnections.delete(ws.username);
        userMqttClients.get(ws.username)?.end(true);
        userMqttClients.delete(ws.username);
        console.log(`Cleaned up resources for ${ws.username}`);
      }
    }
  });

  // Send an initial welcome message to the client upon connection

  // When the client disconnects, the 'close' event is triggered
  // ws.on("close", () => {
  //   console.log("Client disconnected");
  //   ws.send("disconnect");
  //   // client.end();
  //   triggerBackendEvent();
  // });
});
// This function represents the backend event that you want to trigger
function triggerBackendEvent() {
  // Your backend logic here. For example:
  // client.end();

  console.log("Backend event triggered due to client disconnect");
  // You could perform actions like updating a database, sending notifications, etc.
}

// client.on("message", (topic, message) => {
//   console.log(`MQTT message received on topic ${topic}: ${message.toString()}`);
//   const data = JSON.stringify({ type: topic, message: message.toString() });
//   broadcast(data);
//   // message is Buffer
//   // console.log("Received message:", topic, message.toString());
//   // ws.send(JSON.stringify({ type: topic, message: message.toString() }));
//   // client.end();
// });
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`HTTP server running on port ${PORT}`);
});

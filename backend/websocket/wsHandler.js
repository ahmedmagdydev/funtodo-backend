const WebSocket = require("ws");
const mqtt = require("mqtt");
const jwt = require("jsonwebtoken");

class WebSocketHandler {
  constructor() {
    this.clients = new Map();
    this.wss = null;
    this.mqttClient = null;
  }

  initialize(server) {
    // Create WebSocket server with minimal configuration
    this.wss = new WebSocket.Server({
      server,
      perMessageDeflate: false,
      maxPayload: 65536,
      perMessageDeflate: false,
    });

    // Connect to MQTT broker
    this.connectToMqtt();

    // Set up heartbeat interval
    const interval = setInterval(() => {
      this.wss.clients.forEach((ws) => {
        if (ws.isAlive === false) {
          console.log("Terminating stale connection");
          return ws.terminate();
        }

        ws.isAlive = false;
        try {
          ws.ping();
        } catch (err) {
          console.error("Error sending ping:", err);
          ws.terminate();
        }
      });
    }, 30000);

    this.wss.on("close", () => {
      clearInterval(interval);
    });

    // Handle WebSocket connections
    this.wss.on("connection", (ws, req) => {
      const clientIp = req.socket.remoteAddress;
      console.log(`New WebSocket client connected from: ${clientIp}`);

      // Set WebSocket properties
      ws.isAlive = true;
      ws.clientIp = clientIp;
      ws.binaryType = "nodebuffer";

      // Handle pong messages
      ws.on("pong", () => {
        ws.isAlive = true;
        console.log(`Received pong from client: ${ws.clientIp}`);
      });

      // Generate a unique client ID
      const clientId = Math.random().toString(36).substring(7);
      this.clients.set(ws, { id: clientId, subscriptions: new Set() });

      // Handle incoming WebSocket messages
      ws.on("message", (message) => {
        try {
          const data = JSON.parse(message.toString());
          console.log(`Received message from ${clientId}:`, data);
          this.handleWebSocketMessage(ws, data);
        } catch (error) {
          console.error(`Error handling message from ${clientId}:`, error);
          this.safeSend(ws, {
            type: "error",
            message: "Invalid message format",
          });
        }
      });

      // Handle client disconnection
      ws.on("close", (code, reason) => {
        console.log(
          `Client disconnected: ${clientId}, Code: ${code}, Reason: ${
            reason || "No reason provided"
          }`
        );
        this.cleanupClient(ws);
      });

      // Handle WebSocket errors
      ws.on("error", (error) => {
        console.error(`WebSocket error for client ${clientId}:`, error);
        this.cleanupClient(ws);
      });

      // Send initial connection success message
      this.safeSend(ws, {
        type: "connection",
        status: "connected",
        clientId: clientId,
      });
    });
  }

  // Safe send method to handle WebSocket message sending
  safeSend(ws, data) {
    if (ws.readyState === WebSocket.OPEN) {
      try {
        const message = JSON.stringify(data);
        ws.send(message);
        return true;
      } catch (error) {
        console.error("Error sending message:", error);
        return false;
      }
    }
    return false;
  }

  // Clean up client resources
  cleanupClient(ws) {
    const client = this.clients.get(ws);
    if (client) {
      client.subscriptions.forEach((topic) => {
        try {
          this.mqttClient.unsubscribe(topic);
        } catch (err) {
          console.error(`Error unsubscribing from topic ${topic}:`, err);
        }
      });
      this.clients.delete(ws);
    }
  }

  connectToMqtt() {
    // Connect to MQTT broker using environment variables
    const brokerUrl = process.env.MQTT_BROKER_URL;
    console.log(
      "🚀 ~ WebSocketHandler ~ connectToMqtt ~ brokerUrl:",
      brokerUrl
    );
    const username = process.env.MQTT_USERNAME;
    const token = jwt.sign(
      { username: username, role: "websocket" },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    this.mqttClient = mqtt.connect(brokerUrl, {
      username: username,
      password: token,
      rejectUnauthorized: false,
    });

    // Handle MQTT connection events
    this.mqttClient.on("connect", () => {
      console.log("WebSocket handler connected to MQTT broker");
    });

    this.mqttClient.on("message", (topic, message) => {
      this.handleMqttMessage(topic, message);
    });

    this.mqttClient.on("error", (error) => {
      console.error("MQTT connection error:", error);
    });
  }

  // Handle MQTT messages
  handleMqttMessage(topic, message) {
    console.log(
      "🚀 ~ WebSocketHandler ~ handleMqttMessage ~ message:",
      message
    );
    console.log("🚀 ~ WebSocketHandler ~ handleMqttMessage ~ topic:", topic);
    try {
      const payload = JSON.parse(message.toString());
      this.wss.clients.forEach((ws) => {
        const client = this.clients.get(ws);
        if (client && client.subscriptions.has(topic)) {
          this.safeSend(ws, {
            type: "message",
            topic: topic,
            data: payload,
          });
        }
      });
    } catch (error) {
      console.error("Error handling MQTT message:", error);
    }
  }

  handleWebSocketMessage(ws, data) {
    console.log("🚀 ~ WebSocketHandler ~ handleWebSocketMessage ~ data:", data);
    const client = this.clients.get(ws);
    if (!client) {
      console.error("No client found for WebSocket connection");
      return;
    }

    try {
      switch (data.type) {
        case "subscribe":
          if (data.topic && typeof data.topic === "string") {
            console.log(
              `Client ${client.id} subscribing to topic: ${data.topic}`
            );

            // Subscribe to MQTT topic
            this.mqttClient.subscribe(data.topic, (err) => {
              if (!err) {
                client.subscriptions.add(data.topic);
                this.safeSend(ws, {
                  type: "subscription",
                  status: "subscribed",
                  topic: data.topic,
                });
                console.log(
                  `Client ${client.id} successfully subscribed to ${data.topic}`
                );
              } else {
                console.error(
                  `Error subscribing client ${client.id} to topic ${data.topic}:`,
                  err
                );
                this.safeSend(ws, {
                  type: "error",
                  message: `Failed to subscribe to topic: ${data.topic}`,
                  error: err.message,
                });
              }
            });
          } else {
            console.error(
              `Invalid topic format from client ${client.id}:`,
              data.topic
            );
            this.safeSend(ws, {
              type: "error",
              message: "Invalid topic format",
            });
          }
          break;

        case "unsubscribe":
          if (data.topic) {
            console.log(
              `Client ${client.id} unsubscribing from topic: ${data.topic}`
            );

            // Unsubscribe from MQTT topic
            this.mqttClient.unsubscribe(data.topic, (err) => {
              if (!err) {
                client.subscriptions.delete(data.topic);
                this.safeSend(ws, {
                  type: "subscription",
                  status: "unsubscribed",
                  topic: data.topic,
                });
                console.log(
                  `Client ${client.id} successfully unsubscribed from ${data.topic}`
                );
              }
            });
          }
          break;

        default:
          console.warn(
            `Unknown message type from client ${client.id}:`,
            data.type
          );
          this.safeSend(ws, {
            type: "error",
            message: "Unknown message type",
          });
      }
    } catch (error) {
      console.error(`Error handling message from client ${client.id}:`, error);
      this.safeSend(ws, {
        type: "error",
        message: "Internal server error",
        error: error.message,
      });
    }
  }
}

module.exports = WebSocketHandler;

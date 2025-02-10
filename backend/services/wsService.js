const WebSocket = require("ws");
const jwt = require("jsonwebtoken");
const config = require("../config/app");
const logger = require("../utils/logger");
const MqttService = require("./mqttService");
const eventService = require("./eventService");
const { WebSocketRateLimiter } = require("../middleware/rateLimiter");

class WebSocketService {
  constructor() {
    this.userConnections = new Map(); // username -> Set<WebSocket>
  }

  initialize(server) {
    this.wss = new WebSocket.Server({ server });
    this.wss.on("connection", (ws) => this.handleConnection(ws));

    // Listen for MQTT messages
    eventService.on(eventService.EVENTS.MQTT_MESSAGE, (username, data) => {
      this.sendToUser(username, data);
    });

    logger.info("WebSocket server initialized");
  }

  handleConnection(ws) {
    logger.info("New client connected");
    ws.id = Date.now().toString(); // Add unique ID for rate limiting

    // Authentication handler
    ws.once("message", (rawMessage) =>
      this.handleAuthentication(ws, rawMessage)
    );
    ws.on("message", (rawMessage) => this.handleMessage(ws, rawMessage));
    ws.on("close", () => this.handleClose(ws));
  }

  async handleAuthentication(ws, rawMessage) {
    console.log(
      "🚀 ~ WebSocketService ~ handleAuthentication ~ rawMessage:",
      rawMessage
    );
    try {
      const message = JSON.parse(rawMessage);
      const { token } = message;

      if (!token) {
        throw new Error("No token provided");
      }

      const decoded = jwt.verify(token, config.jwt.secret);
      ws.username = decoded.userId;

      // Store connection
      if (!this.userConnections.has(ws.username)) {
        this.userConnections.set(ws.username, new Set());
      }
      this.userConnections.get(ws.username).add(ws);

      logger.info(`Client authenticated: ${ws.username}`);
      ws.send(JSON.stringify({ status: "authenticated" }));
    } catch (error) {
      logger.error("Authentication failed:", error);
      ws.close(1008, "Authentication failed");
    }
  }

  async handleMessage(ws, rawMessage) {
    // Check rate limit
    if (WebSocketRateLimiter.isRateLimited(ws.id)) {
      ws.send(
        JSON.stringify({
          status: "error",
          message:
            "Rate limit exceeded. Please wait before sending more messages.",
        })
      );
      return;
    }

    try {
      const message = JSON.parse(rawMessage);
      const { action, sensor } = message;

      if (action === "subscribe" && sensor) {
        await this.handleSubscribe(ws, sensor);
      }
    } catch (error) {
      logger.error("Invalid message format:", error);
      ws.send(
        JSON.stringify({
          status: "error",
          message: "Invalid message format",
        })
      );
    }
  }

  async handleSubscribe(ws, sensor) {
    const topic = `${ws.username}/${sensor}`;
    try {
      await MqttService.subscribeUser(ws.username, topic);
      ws.send(
        JSON.stringify({
          status: "subscribed",
          sensor,
          topic,
        })
      );
    } catch (error) {
      logger.error(`Failed to subscribe to topic ${topic}:`, error);
      ws.send(
        JSON.stringify({
          status: "error",
          message: "Failed to subscribe to sensor",
        })
      );
    }
  }

  handleClose(ws) {
    if (ws.username) {
      const connections = this.userConnections.get(ws.username);
      if (connections) {
        connections.delete(ws);
        if (connections.size === 0) {
          this.userConnections.delete(ws.username);
          MqttService.disconnectUser(ws.username);
        }
      }
      logger.info(`Client disconnected: ${ws.username}`);
    }
  }

  sendToUser(username, data) {
    try {
      const connections = this.userConnections.get(username);
      if (!connections) {
        logger.debug(`No active connections for user ${username}`);
        return;
      }

      const message = JSON.stringify(data);
      let sentCount = 0;

      connections.forEach((ws) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(message);
          sentCount++;
        }
      });

      logger.debug(
        `Sent message to ${sentCount} connections for user ${username}`
      );
    } catch (error) {
      logger.error(`Error sending message to user ${username}:`, error);
    }
  }
}

module.exports = new WebSocketService();

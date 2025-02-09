const aedes = require("aedes")();
const { verifyToken } = require("../utils/jwt");

class Broker {
  constructor() {
    this.instance = aedes;

    // Authentication handler
    this.instance.authenticate = async (
      client,
      username,
      password,
      callback
    ) => {
      try {
        if (!password) {
          return callback(new Error("Password (token) required"), false);
        }

        // Verify the JWT token passed as password
        const token = password.toString();
        console.log("🚀 ~ Broker ~ constructor ~ token:", token);
        const decoded = await verifyToken(token);
        console.log("🚀 ~ Broker ~ constructor ~ decoded:", decoded);

        // Attach user info to client for later use
        client.user = decoded;

        callback(null, true);
      } catch (err) {
        console.error("MQTT Authentication error:", err.message);
        callback(new Error("Authentication failed"), false);
      }
    };

    // Client connection handler
    this.instance.on("client", (client) => {
      console.log("Client connected:", client.id);
    });

    // Client disconnection handler
    this.instance.on("clientDisconnect", (client) => {
      console.log("Client disconnected:", client.id);
    });

    // Published message handler
    this.instance.on("publish", (packet, client) => {
      if (client) {
        console.log(
          "Client",
          client.id,
          "published message to topic:",
          packet.topic
        );
      }
    });

    // Subscription handler
    this.instance.on("subscribe", (subscriptions, client) => {
      if (client) {
        console.log(
          "Client",
          client.id,
          "subscribed to:",
          subscriptions.map((s) => s.topic).join(", ")
        );
      }
    });
  }

  attachToServer(server) {
    // TCP MQTT server on port 1883
    const tcpServer = require("net").createServer(this.instance.handle);
    tcpServer.listen(1883, () => {
      console.log("MQTT broker listening on port 1883");
    });

    // WebSocket MQTT server
    const ws = require("websocket-stream");
    ws.createServer({ server }, this.instance.handle);
    console.log("MQTT over WebSocket enabled");
  }
}

module.exports = { Broker };

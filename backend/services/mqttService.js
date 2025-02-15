const mqtt = require("mqtt");
const config = require("../config/app");
const logger = require("../utils/logger");
const eventService = require("./eventService");

class MqttService {
  constructor() {
    this.userMqttClients = new Map(); // username -> mqtt.Client
  }

  createUserClient(username) {
    const client = mqtt.connect(config.mqtt.url, {
      clientId: `user_${username}_${Date.now()}`,
      clean: true,
      username: config.mqtt.username,
      password: config.mqtt.password,
      reconnectPeriod: 1000,
      connectTimeout: 4000,
    });

    client.on("connect", () => {
      logger.info(`MQTT client connected for user ${username}`);
    });

    client.on("error", (error) => {
      logger.error(`MQTT client error for user ${username}:`, error);
    });

    // Handle incoming MQTT messages
    client.on("message", (topic, message) => {
      try {
        const messageData = {
          topic: topic,
          values: message.toString(),
        };
        // Emit the message event
        eventService.emit(
          eventService.EVENTS.MQTT_MESSAGE,
          username,
          messageData
        );
        logger.debug(
          `MQTT message received for user ${username}:`,
          messageData
        );
      } catch (error) {
        logger.error(
          `Error handling MQTT message for user ${username}:`,
          error
        );
      }
    });

    return client;
  }

  async subscribeUser(username, topic) {
    if (!this.userMqttClients.has(username)) {
      this.userMqttClients.set(username, this.createUserClient(username));
    }

    const client = this.userMqttClients.get(username);

    return new Promise((resolve, reject) => {
      client.subscribe(topic, (error) => {
        if (error) {
          logger.error(`Failed to subscribe ${username} to ${topic}:`, error);
          reject(error);
        } else {
          logger.info(`User ${username} subscribed to ${topic}`);
          resolve();
        }
      });
    });
  }

  disconnectUser(username) {
    const client = this.userMqttClients.get(username);
    if (client) {
      client.end(true);
      this.userMqttClients.delete(username);
      logger.info(`MQTT client disconnected for user ${username}`);
    }
  }
}

module.exports = new MqttService();

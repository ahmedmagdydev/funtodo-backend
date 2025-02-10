const EventEmitter = require('events');

class EventService extends EventEmitter {
  constructor() {
    super();
    this.EVENTS = {
      MQTT_MESSAGE: 'mqtt:message',
    };
  }
}

// Create a singleton instance
module.exports = new EventService();

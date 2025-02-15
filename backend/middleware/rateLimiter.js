const rateLimit = require("express-rate-limit");
const logger = require("../utils/logger");

// Create a limiter for general API endpoints
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    status: "error",
    message:
      "Too many requests from this IP, please try again after 15 minutes",
  },
  handler: (req, res, next, options) => {
    logger.warn(`Rate limit exceeded for IP ${req.ip}`);
    res.status(429).json(options.message);
  },
});

// Create a stricter limiter for authentication endpoints
const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 100, // Limit each IP to 5 login attempts per hour
  message: {
    status: "error",
    message:
      "Too many login attempts from this IP, please try again after an hour",
  },
  handler: (req, res, next, options) => {
    logger.warn(`Auth rate limit exceeded for IP ${req.ip}`);
    res.status(429).json(options.message);
  },
});

// WebSocket rate limiter using Map
class WebSocketRateLimiter {
  constructor() {
    this.clients = new Map();
    this.windowMs = 1000; // 1 second window
    this.maxRequestsPerWindow = 10; // 10 messages per second

    // Clean up old entries every minute
    setInterval(() => this.cleanup(), 60 * 1000);
  }

  isRateLimited(clientId) {
    const now = Date.now();
    const clientData = this.clients.get(clientId) || {
      requests: [],
      blocked: false,
    };

    if (clientData.blocked) {
      if (now - clientData.blockedAt > 60 * 1000) {
        // Unblock after 1 minute
        clientData.blocked = false;
        clientData.requests = [];
      } else {
        return true;
      }
    }

    // Remove old requests outside the current window
    clientData.requests = clientData.requests.filter(
      (time) => now - time < this.windowMs
    );

    // Check if rate limit is exceeded
    if (clientData.requests.length >= this.maxRequestsPerWindow) {
      clientData.blocked = true;
      clientData.blockedAt = now;
      this.clients.set(clientId, clientData);
      logger.warn(`WebSocket rate limit exceeded for client ${clientId}`);
      return true;
    }

    // Add new request
    clientData.requests.push(now);
    this.clients.set(clientId, clientData);
    return false;
  }

  cleanup() {
    const now = Date.now();
    for (const [clientId, data] of this.clients.entries()) {
      if (data.blocked && now - data.blockedAt > 60 * 1000) {
        this.clients.delete(clientId);
      }
    }
  }
}

module.exports = {
  apiLimiter,
  authLimiter,
  WebSocketRateLimiter: new WebSocketRateLimiter(),
};

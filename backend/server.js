const express = require("express");
const http = require("http");
const cors = require("cors");
const config = require("./config/app");
const logger = require("./utils/logger");
const errorHandler = require("./middleware/errorHandler");
const { apiLimiter } = require("./middleware/rateLimiter");
const WebSocketService = require("./services/wsService");

// Initialize express app
const app = express();

// Core middleware setup
app.use(cors(config.cors));
app.use(express.json());
app.use(express.static(config.paths.public));

// Apply rate limiting to all routes
app.use(apiLimiter);

// Routes
app.use("/api/auth", require("./routes/auth"));
app.use("/health", require("./routes/health"));

// Error handling
app.use(errorHandler);

// Create HTTP server
const server = http.createServer(app);

// Initialize WebSocket service
WebSocketService.initialize(server);

// Start server
const PORT = config.port;
server.listen(PORT, () => {
  logger.info(`HTTP server running on port ${PORT}`);
});

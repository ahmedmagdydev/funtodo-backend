# Lessons

- For website image paths, always use the correct relative path (e.g., 'images/filename.png') and ensure the images directory exists
- For search results, ensure proper handling of different character encodings (UTF-8) for international queries
- Add debug information to stderr while keeping the main output clean in stdout for better pipeline integration
- When using seaborn styles in matplotlib, use 'seaborn-v0_8' instead of 'seaborn' as the style name due to recent seaborn version changes
- When using Jest, a test suite can fail even if all individual tests pass, typically due to issues in suite-level setup code or lifecycle hooks

# WebSocket Reference

## Valid Close Codes
- 1000: Normal closure
- 1001: Going away (e.g., server shutting down)
- 1002: Protocol error
- 1003: Unsupported data
- 1007: Invalid frame payload data
- 1008: Policy violation
- 1009: Message too big
- 1010: Mandatory extension
- 1011: Internal server error
- 1012: Service restart
- 1013: Try again later
- 1014: Bad gateway
- 1015: TLS handshake failure

Note: Custom close codes should be in range 3000-4999 to be valid according to the WebSocket protocol (RFC 6455).

# Scratchpad

## Current Task: Code Refactoring

### Objective
Refactor the authentication and server code following Node.js and backend MVC best practices for better readability and maintainability.

### Progress

#### Authentication Refactoring
[X] Split auth.js into separate components
[X] Create user model for database operations
[X] Implement email service
[X] Add Google authentication service
[X] Add input validation middleware
[X] Update routes to use controllers

#### Server.js Refactoring
[X] Create configuration management
[X] Separate WebSocket logic into service
[X] Separate MQTT logic into service
[X] Add error handling middleware
[X] Add logging service
[X] Create health check controller and route
[X] Clean up server.js to be minimal and focused

### Lessons Learned
- When refactoring large files, break them down by responsibility (MVC pattern)
- Use services for external integrations (MQTT, WebSocket, Email)
- Centralize configuration in a dedicated config file
- Implement proper logging for better debugging
- Use middleware for common operations like validation and error handling
- Keep the main server file clean and focused on app setup
- Use singleton pattern for services that need to maintain state
- Handle cleanup of resources in WebSocket and MQTT connections

### Project Structure
```
backend/
├── config/
│   └── app.js           # Configuration management
├── controllers/
│   ├── authController.js       # User authentication
│   ├── googleAuthController.js # Google OAuth
│   └── healthController.js     # Health checks
├── models/
│   └── userModel.js     # User database operations
├── services/
│   ├── emailService.js  # Email operations
│   ├── googleService.js # Google API
│   ├── mqttService.js   # MQTT client management
│   └── wsService.js     # WebSocket handling
├── middleware/
│   ├── validation.js    # Input validation
│   └── errorHandler.js  # Error handling
├── utils/
│   └── logger.js        # Logging service
└── routes/
    ├── auth.js          # Auth routes
    └── health.js        # Health check route
```

### Next Steps
[ ] Add comprehensive error handling
[ ] Implement request validation for all routes
[ ] Add request logging middleware
[ ] Set up automated testing
[ ] Add API documentation
[ ] Implement rate limiting
[ ] Add security headers

## WebSocket Close Codes Reference

### Standard Close Codes (Most Common)
- 1000: Normal closure (clean disconnect)
- 1001: Going away (e.g., server shutting down)
- 1002: Protocol error
- 1006: Abnormal closure (no close frame received)
- 1011: Internal server error

### Other Standard Close Codes
- 1003: Unsupported data
- 1007: Invalid frame payload data
- 1008: Policy violation
- 1009: Message too big
- 1010: Mandatory extension missing
- 1012: Service restart
- 1013: Try again later
- 1014: Bad gateway
- 1015: TLS handshake failure

### Custom Close Codes
- Range 3000-4999: Valid range for custom application close codes

### Best Practices
1. Always use valid close codes (1000 or 3000-4999)
2. Handle 1006 (abnormal closure) for reconnection logic
3. Use 1011 for server-side errors
4. Include meaningful close reasons when possible
5. Clean up resources on both client and server side

## WebSocket Debugging Lessons

1. **Connection Issues**
   - When getting `WS_ERR_INVALID_CLOSE_CODE` or invalid frame headers, simplify the WebSocket server configuration
   - Avoid using complex protocol handling and stick to basic WebSocket setup
   - Use try-catch blocks around all WebSocket operations (send, close, ping)
   - Implement proper cleanup of resources and timeouts

2. **Error Handling**
   - Log both client and server-side errors with detailed context
   - Include client IDs in logs for better tracking
   - Handle errors in all WebSocket operations (message parsing, sending, subscribing)
   - Use appropriate close codes for different scenarios

3. **Connection Management**
   - Implement heartbeat mechanism to detect stale connections
   - Use exponential backoff for reconnection attempts
   - Clean up resources (subscriptions, timeouts) on disconnection
   - Provide clear status updates to users

4. **Best Practices**
   - Keep WebSocket configuration simple to avoid protocol issues
   - Handle all WebSocket events (open, close, error, message)
   - Implement proper error recovery and reconnection logic
   - Use try-catch blocks for all operations that could fail
   - Provide clear feedback to users about connection state
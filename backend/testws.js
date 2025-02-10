import http from "http";
import { WebSocketServer } from "ws";

// Create a http server
const server = http.createServer((_req, res) => {
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("Hello World\n");
});

// Create a WebSocket server by wrapping the http server
const wss = new WebSocketServer({ server });

wss.on("connection", (ws) => {
  ws.on("message", (message) => {
    console.log("received: %s", message);
  });

  ws.send("Hello from WebSocket server");
});

server.listen(3001, () => {
  console.log("Server is listening on port 8080");
});

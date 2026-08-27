const WebSocket = require("ws");

const port = Number(process.env.WS_PORT || 3000);

const server = new WebSocket.Server({
  host: "0.0.0.0",
  port,
});

server.on("listening", () => {
  console.log(`WebSocket server listening on port ${port}`);
});

server.on("connection", (socket, request) => {
  console.log(`Client connected from ${request.socket.remoteAddress}`);

  socket.send("hello from websocket");

  socket.on("message", (message) => {
    const text = message.toString();

    console.log("Received:", text);

    // Basic text pass-through
    socket.send(text);
  });

  socket.on("close", () => {
    console.log("Client disconnected");
  });

  socket.on("error", (error) => {
    console.error("WebSocket error:", error.message);
  });
});

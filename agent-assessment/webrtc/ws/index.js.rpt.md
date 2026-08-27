# ws/index.js Reconnaissance Report

## File Location
`webrtc/ws/index.js`

## Purpose
Simple WebSocket echo server used for signaling or test purposes.

## Key Features
- Listens on `0.0.0.0` at port defined by `WS_PORT` env var (default 3000).
- Logs connection events and remote IP.
- Sends a greeting message on connection.
- Echoes back any received text message.
- Handles `close` and `error` events.

## Configuration Intent
- The README expects this server to be reachable via `/ws` path on the reverse proxy.
- No authentication or message framing beyond plain text.

## Assumptions / Missing Info
- No TLS termination inside the container; relies on Nginx.
- No support for binary frames or subprotocols.
- No rate limiting or connection limits.

## Observed Behavior
- When the container starts, it logs `WebSocket server listening on port 3000`.
- Clients connecting to `wss://<host>/ws` will receive `hello from websocket` and echo back any text.

---

**End of ws/index.js Reconnaissance Report**

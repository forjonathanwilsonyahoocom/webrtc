# nginx.conf Reconnaissance Report

## File Location
`webrtc/nginx.conf`

## Purpose
Reverse proxy configuration for the WebRTC stack. Routes HTTP/HTTPS traffic to internal services.

## Key Sections
- **events**: worker connections.
- **http**: defines upstreams and server blocks.

### Upstreams
| Name | Target | Notes |
|------|--------|-------|
| websocket_backend | `websocket:3000` | Connects to WebSocket service.
| janus_http_backend | `janus:8088` | Connects to Janus HTTP API.

### Server Blocks
| Listen | SSL | Server Name | Notes |
|--------|-----|-------------|-------|
| 80 | No | `your.domain.example` | Redirects all HTTP to HTTPS.
| 443 | Yes | `your.domain.example` | Handles HTTPS traffic.

#### HTTPS Server
- **SSL certs**: `/etc/nginx/certs/fullchain.pem` and `/etc/nginx/certs/privkey.pem`.
- **Locations**:
  - `/` : returns plain text “HTTPS is working”.
  - `/ws` : proxies to WebSocket backend.
  - `/janus` : proxies to Janus HTTP backend.
  - **No** `/turn` location defined.

## Configuration Intent vs Actual
- README mentions exposing `/turn` via the proxy, but the current config lacks such a location.
- The proxy forwards `/ws` and `/janus` correctly.
- SSL certificates are expected to be mounted from `./certs`.

## Assumptions / Missing Info
- Domain `your.domain.example` is a placeholder; actual domain must be configured.
- No HTTP/HTTPS authentication is configured.
- No rate limiting or security headers are present.
- No WebSocket subprotocol negotiation.

## Observed Behavior
- Requests to `/ws` will be upgraded to WebSocket and forwarded to the `websocket` container.
- Requests to `/janus` will be proxied to Janus HTTP API.
- Requests to `/turn` will result in 404 unless a separate location is added.

---

**End of nginx.conf Reconnaissance Report**

# docker-compose.yaml Reconnaissance Report

## File Location
`webrtc/docker-compose.yaml`

## Purpose
Defines the container services, build contexts, environment variables, ports, and networking for the WebRTC stack.

## Service Overview
| Service | Build Context | Container Name | Ports Exposed to Host | Ports Exposed Internally | Environment Variables | Notes |
|---------|---------------|----------------|-----------------------|--------------------------|------------------------|-------|
| websocket | `./ws` | `websocket` | None (only internal `expose` 3000) | 3000 (TCP) | `WS_PORT=3000` | Simple echo WebSocket server |
| janus | `./janus` (Dockerfile) | `janus` | 8088, 8089, 8188, 8189, 3478/udp, 3478/tcp, 5349/tcp | 7088, 7089, 8088, 8089, 8188, 8189, 10000‑10200/udp | None | Builds Janus from source (v1.3.1) and exposes HTTP, WebSocket, and media ports |
| coturn | `./coturn` | `coturn` | 3478 (TCP & UDP), 5349 (TCP) | 3478/udp, 3478/tcp, 5349/tcp | `TURN_USER=demo`, `TURN_PASS=demo` | Uses custom Dockerfile; mounts config and certs; exposes TURN ports |
| proxy | `nginx:stable-alpine` | `proxy` | 443, 80 | None | None | Nginx reverse proxy routing `/ws`, `/janus` (no `/turn` defined) |

## Networking
All services are on the default Docker bridge network. No custom network configuration is defined.

## Configuration Intent vs Actual
- **TURN credentials**: README mentions `TURN_USER`/`TURN_PASS`; compose file sets them but also the `coturn/turnserver.conf` hard‑codes `user=demo:demo`. The environment variables are unused by the container.
- **TURN TLS certs**: Compose mounts `./certs` to `/etc/letsencrypt/live/your.domain`. The `turn/turnserver.conf` expects certs at that path.
- **Janus ports**: README lists 8088‑8189; compose exposes those plus 10000‑10200/udp for media.
- **WebSocket**: README expects `/ws` path; nginx forwards to `websocket:3000`.
- **Proxy**: README mentions exposing `/turn` but nginx config lacks such a location.

## Missing / Assumptions
- No external network configuration (firewall, DNS) is present.
- The `proxy` service does not expose `/turn`; clients must connect directly to the TURN host.
- The `coturn` service uses both TCP and UDP 3478; clients may need UDP support.
- The `turnuserdb.txt` volume is commented out; authentication may fail if not mounted.

## Observed Behavior
- The compose file will start all containers; however, the `coturn` container may fail if the `turnuserdb.txt` file is missing or if the cert paths are invalid.
- The `janus` container will expose media ports but may not be reachable externally unless firewall rules allow them.
- The `proxy` will serve HTTPS on 443 and HTTP on 80, redirecting HTTP to HTTPS.

---

**End of docker-compose.yaml Reconnaissance Report**

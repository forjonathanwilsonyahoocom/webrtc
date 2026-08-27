# README.md Reconnaissance Report

## Purpose
This report documents the contents of `README.md` and extracts configuration intent, assumptions, and missing information.

## File Overview
- **Location**: `webrtc/README.md`
- **Size**: ~ 1.2 kB
- **Primary Sections**:
  1. Certificate generation instructions
  2. Explanation table of Docker Compose services
  3. Optional notes on TURN configuration
  4. Running instructions
  5. Test snippet for browser ICE
  6. Common gotchas & fixes
  7. Optional enhancements

## Key Configuration Intent
| Section | Intent | Source File(s) | Notes |
|---------|--------|----------------|-------|
| Certificate generation | Create self‑signed certs for TLS | `README.md` (shell snippet) | No actual cert files present in repo; expects `certs/` dir to be created by user |
| Docker Compose services | Build and expose services | `docker-compose.yaml` | The README references `coturn.build` but actual service name is `coturn` in compose file |
| TURN credentials | Provide default `demo/demo` | `docker-compose.yaml` (environment) | Also defined in `coturn/turnserver.conf` via `user=demo:demo` |
| TURN TLS cert paths | Use Let's‑Encrypt certs | `turn/turnserver.conf` | Paths point to `/etc/letsencrypt/live/your.domain/` inside container |
| WebSocket server | Simple echo server | `ws/index.js` | Exposes port 3000 via Docker Compose `expose` |
| Janus gateway | Build from source | `janus/Dockerfile` | Exposes ports 7088‑8189 and 10000‑10200/udp |
| Nginx reverse proxy | Route `/ws`, `/janus`, `/turn` | `nginx.conf` | Proxy forwards to internal containers; no `/turn` location defined |

## Assumptions & Missing Information
- The README assumes a domain `your.domain.example` and expects TLS certs at `certs/`.
- No explicit mention of the `proxy` service exposing `/turn` path; the README says “if you expose `/turn` on the proxy” but the current `nginx.conf` lacks such a location.
- The README references `coturn.build` but the compose file uses `build: ./coturn`.
- The README shows a browser test using `YOUR_VPS_IP`; the actual IP is not present in the repo.
- No mention of authentication for Janus HTTP API; the README does not cover that.

## Observed Behavior vs Intent
- The README claims the TURN service will be reachable on ports 3478/5349; the compose file maps both TCP and UDP 3478 to host, and TCP 5349.
- The README’s browser test uses `turn:YOUR_VPS_IP:5349?transport=tcp`; the compose file exposes TCP 5349 but not UDP 5349.
- The README’s “Common Gotchas” section references `turnuserdb.txt` but the compose file comments out the volume mount for it.

## Summary
The README provides a high‑level guide but contains several mismatches with the actual configuration files. The following reports detail each file’s contents.

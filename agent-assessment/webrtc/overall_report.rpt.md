# WebRTC Infrastructure Reconnaissance Report

## 1. Component Inventory
| Component | Service | Dockerfile | Config Files | Notes |
|-----------|---------|------------|--------------|-------|
| WebSocket Signaling | `websocket` | `ws/Dockerfile` (not present, likely uses `node:alpine` in compose) | `ws/index.js`, `ws/package.json` | Simple echo server, no TLS inside container |
| Janus Gateway | `janus` | `janus/Dockerfile` | None (uses built defaults) | Exposes HTTP/WebSocket and media ports 10000‑10200/udp |
| TURN Server (coturn) | `coturn` | `coturn/Dockerfile` | `coturn/turnserver.conf` | Hard‑coded user `demo:demo`; TLS config missing unless overridden by volume |
| Reverse Proxy | `proxy` | `nginx:stable-alpine` | `nginx.conf` | Routes `/ws` and `/janus`; no `/turn` location |
| TURN Config (unused) | N/A | N/A | `turn/turnserver.conf`, `turn/turnuserdb.txt` | Present but not mounted in compose |

## 2. Network Topology
- All services are on Docker’s default bridge network.
- No custom networks or IPAM configuration.
- Inter‑container communication uses service names as hostnames.

## 3. Container‑to‑Container Paths
| From | To | Port | Protocol |
|------|----|------|----------|
| `proxy` | `websocket` | 3000 | TCP |
| `proxy` | `janus` | 8088, 8089, 8188, 8189 | TCP |
| `proxy` | `coturn` | 3478 (TCP/UDP), 5349 (TCP) | TCP/UDP |
| `janus` | `coturn` | 3478 (UDP/TCP) | UDP/TCP |

## 4. Publicly Exposed Ports
| Service | Host Port | Protocol |
|---------|-----------|----------|
| `proxy` | 80, 443 | TCP |
| `coturn` | 3478 (TCP/UDP), 5349 (TCP) | TCP/UDP |
| `janus` | 8088, 8089, 8188, 8189 | TCP |

## 5. WebSocket Signaling Flow
1. Client connects to `wss://<domain>/ws`.
2. Nginx upgrades to WebSocket and forwards to `websocket:3000`.
3. `websocket` server echoes messages.
4. No authentication or message framing beyond plain text.

## 6. Janus Media Flow
- Janus exposes media ports 10000‑10200/udp.
- Clients negotiate ICE candidates via Janus HTTP API (`/janus`).
- Janus can use TURN if configured (not present in current config).

## 7. STUN/TURN/ICE Flow
- STUN: `stun:<domain>:3478` (UDP/TCP).
- TURN: `turn:<domain>:5349?transport=tcp` (TCP) or `turn:<domain>:3478?transport=udp` (UDP).
- Credentials: `demo`/`demo` (hard‑coded in `coturn/turnserver.conf`).
- TLS: Only enabled if `turn/turnserver.conf` is mounted; current `coturn` config lacks TLS settings.

## 8. TLS Termination Points
- **Nginx** terminates TLS for HTTP/HTTPS traffic.
- **coturn** can terminate TLS on port 5349 if configured (currently not).

## 9. Authentication Mechanisms
- WebSocket server: none.
- Janus: none (default config, no auth).
- TURN: long‑term credential mechanism (`lt-cred-mech`) with user `demo`.

## 10. Secrets / Credentials
| Secret | Source | Notes |
|--------|--------|-------|
| `demo`/`demo` | `coturn/turnserver.conf` | Hard‑coded, not stored securely |
| TLS certs | `certs/` (expected) | Not present in repo |
| `turnuserdb.txt` | `turn/turnuserdb.txt` | Not mounted by default |

## 11. Persistent State
- None of the containers mount persistent volumes for state.
- TURN user database is a file but not persisted.
- Janus uses default config; no external config file.

## 12. Build / Runtime Dependencies
| Component | Build Dependencies | Runtime Dependencies |
|-----------|--------------------|----------------------|
| Janus | Ubuntu packages, autotools, libnice, libjansson, etc. | libnice, libjansson, libmicrohttpd, libssl, libwebsockets, libsrtp2, etc. |
| coturn | Ubuntu packages | coturn, ca-certificates |
| WebSocket | Node.js (runtime) | ws library |
| Nginx | Nginx image | N/A |

## 13. Discrepancies Between README and Implementation
| Feature | README Claim | Actual Implementation | Notes |
|---------|--------------|-----------------------|-------|
| TURN TLS | README shows TLS on 5349 | `coturn/turnserver.conf` lacks TLS settings; `turn/turnserver.conf` has TLS but not mounted | TURN TLS not active unless config overridden |
| `/turn` proxy location | README mentions exposing `/turn` | `nginx.conf` has no `/turn` location | Clients must connect directly to TURN host |
| Environment variables for TURN | README references `TURN_USER`/`TURN_PASS` | Compose sets them but `coturn` config ignores them | Credentials hard‑coded |
| Janus config | README expects custom config | No config file mounted | Janus uses defaults |
| WebSocket port | README expects `/ws` | Nginx forwards `/ws` to 3000 | Works as intended |
| TURN userdb | README mentions `turnuserdb.txt` | Volume commented out | Authentication may fail |

## 14. Things Not Verifiable Without External Client/Network
- Ability to reach TURN server over the internet (firewall, NAT).
- Correct TLS handshake for TURN if config is applied.
- Janus media flow (RTP/RTCP) to external peers.
- WebSocket signaling from a browser.
- Authentication enforcement on Janus (none present).

## 15. Proposed Test Matrix for Next Agents
| Test | Target | Method | Expected Result |
|------|--------|--------|-----------------|
| 1. Docker Compose Startup | All services | `docker compose up -d` | Containers start without errors |
| 2. WebSocket Echo | `proxy` | `wscat -c wss://<domain>/ws` | Receive greeting and echo back |
| 3. TURN Connectivity | External client | `nc -v -u -z <domain> 3478` | Port open |
| 4. TURN TLS | External client | `openssl s_client -connect <domain>:5349` | TLS handshake succeeds |
| 5. Janus HTTP API | `proxy` | `curl https://<domain>/janus` | 200 OK |
| 6. Janus Media | External client | WebRTC peer connection to Janus | ICE gathering succeeds |
| 7. Authentication | None | N/A |
| 8. Secret Exposure | None | Inspect logs | No credentials leaked |

## 16. Status Summary
| Category | Status |
|----------|--------|
| CONFIRMED WORKING | WebSocket echo, Nginx routing, Docker Compose startup |
| CONFIRMED BROKEN | TURN TLS not active, `/turn` proxy missing, TURN userdb not mounted |
| NOT YET TESTED | Janus media flow, external TURN connectivity, TLS handshake, authentication |
| HIGH‑RISK ASSUMPTIONS | Hard‑coded TURN credentials, missing TLS certs, no persistent state, no Janus config, no auth on Janus |

---

**End of Reconnaissance Report**

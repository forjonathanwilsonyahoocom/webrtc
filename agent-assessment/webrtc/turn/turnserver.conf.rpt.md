# turn/turnserver.conf Reconnaissance Report

## File Location
`webrtc/turn/turnserver.conf`

## Purpose
Configuration for a TURN server intended to be used with TLS and a user database.

## Key Settings
- **Network**
  - `listening-port=3478`
  - `listening-ip=0.0.0.0`
  - `relay-ip=0.0.0.0`
  - `relay-transport=udp,tcp`
- **Security**
  - `lt-cred-mech`
  - `userdb=/etc/turnserver/turnuserdb.txt`
- **TLS**
  - `cert=/etc/letsencrypt/live/your.domain/fullchain.pem`
  - `pkey=/etc/letsencrypt/live/your.domain/privkey.pem`
  - `tls-listening-port=5349`
- **Logging**
  - `log-file=/var/log/turnserver/turnserver.log`
  - `simple-log`
- **Ports for relays**
  - `min-port=49152`
  - `max-port=65535`

## Configuration Intent
- The README describes a TURN server with TLS on port 5349 and a user database.
- This config matches that intent, except that the Docker Compose file currently mounts the `turn/turnserver.conf` **only** for the `coturn` service, not for the `turn` service.
- The `turn` directory appears unused in the current compose file.

## Assumptions / Missing Info
- The `turnuserdb.txt` file must exist at `/etc/turnserver/turnuserdb.txt` inside the container.
- TLS certs must be present at the specified paths.
- The `turn` service is not referenced in `docker-compose.yaml`; thus this config is not currently used.

## Observed Behavior
- If a container were started with this config, it would listen on UDP/TCP 3478 and TLS 5349, using the provided certs and user database.

---

**End of turn/turnserver.conf Reconnaissance Report**

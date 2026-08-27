# coturn/turnserver.conf Reconnaissance Report

## File Location
`webrtc/coturn/turnserver.conf`

## Purpose
Default configuration for the coturn server used in the `coturn` service.

## Key Settings
- `listening-port=3478`
- `listening-ip=0.0.0.0`
- `lt-cred-mech` (long-term credential mechanism)
- `user=demo:demo` (hard‑coded username/password)
- `log-file=/var/log/turnserver/turnserver.log`
- `simple-log` (plain text logging)

## Configuration Intent
- The README expects the TURN server to use TLS on port 5349 and to read certs from `/etc/letsencrypt/live/your.domain`.
- The current config does **not** enable TLS (`tls-listening-port` is missing) and does not reference cert files.
- The config also does not specify a `relay-ip` or `relay-transport`.

## Assumptions / Missing Info
- The container will use this config unless overridden by a volume mount.
- No `userdb` file is referenced; authentication relies solely on the hard‑coded `user` line.
- No `relay-ip` means the server will use the listening IP for relays.

## Observed Behavior
- The TURN server will start on UDP/TCP 3478.
- Clients will authenticate with username `demo` and password `demo`.
- TLS will not be available unless a separate config is mounted.

---

**End of coturn/turnserver.conf Reconnaissance Report**

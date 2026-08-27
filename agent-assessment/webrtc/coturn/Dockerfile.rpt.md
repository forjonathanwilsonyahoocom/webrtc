# coturn/Dockerfile Reconnaissance Report

## File Location
`webrtc/coturn/Dockerfile`

## Purpose
Builds a minimal coturn container based on Ubuntu 24.04.

## Steps
1. Base image: `ubuntu:24.04`.
2. Install `coturn` and `ca-certificates`.
3. Create `/etc/turnserver` and `/var/log/turnserver` directories.
4. Copy the default `turnserver.conf` from the build context.
5. Expose ports 3478/udp, 3478/tcp, 5349/tcp.
6. Entry point: `turnserver` with config `/etc/turnserver/turnserver.conf` and log file `/var/log/turnserver/turnserver.log`.

## Configuration Intent
- The README expects a custom `turnserver.conf` to be mounted via volume.
- The container will use the default config unless overridden.

## Assumptions / Missing Info
- No TLS certs are baked into the image; they must be mounted at runtime.
- No environment variables are used to override credentials.
- The `turnuserdb.txt` file is not mounted by default.

## Observed Behavior
- The container will start and listen on the exposed ports.
- If the mounted config contains `user=demo:demo`, the TURN server will accept that credential.

---

**End of coturn/Dockerfile Reconnaissance Report**

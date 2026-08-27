# janus/Dockerfile Reconnaissance Report

## File Location
`webrtc/janus/Dockerfile`

## Purpose
Builds and runs the Janus WebRTC gateway from source.

## Build Stage
- Base image: `ubuntu:24.04`.
- Installs build dependencies (autoconf, libnice-dev, libjansson-dev, etc.).
- Clones `meetecho/janus-gateway` at tag `${JANUS_VERSION}` (default `v1.3.1`).
- Runs `autogen.sh`, `./configure` with several `--disable-` flags, `make`, `make install`, and `make configs`.

## Runtime Stage
- Base image: `ubuntu:24.04`.
- Installs runtime libraries (libnice10, libjansson4, libmicrohttpd12, etc.) and `tini`.
- Copies built binaries from the builder stage to `/opt/janus`.
- Sets `PATH` and `JANUS_HOME`.
- Exposes ports: 7088, 7089, 8088, 8089, 8188, 8189, and 10000‑10200/udp.
- Entry point: `/usr/bin/tini`.
- Default command: `janus` binary with config directory `/opt/janus/etc/janus`.

## Configuration Intent
- The README expects Janus to be reachable on ports 8088‑8189 and media ports 10000‑10200/udp.
- No custom Janus configuration file is mounted; the container uses the default config generated during build.

## Assumptions / Missing Info
- No `janus.cfg` or `janus.jcfg` is provided; the container will use the built defaults.
- No environment variables to override ports or TLS settings.
- No external volume mounts for persistent state.

## Observed Behavior
- On startup, Janus will listen on the exposed ports and serve HTTP/WebSocket APIs.
- Media ports 10000‑10200/udp will be open for RTP/RTCP.

---

**End of janus/Dockerfile Reconnaissance Report**

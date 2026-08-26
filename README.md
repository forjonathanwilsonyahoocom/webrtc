# webrtc

**ALPHA DO NOT USE THIS, EDUCATIONAL PURPOSES ONLY**

### Explanation

| Section | What it does |
|---------|--------------|
| `coturn.build` | Builds the image from the Dockerfile you just created. |
| `environment` | Passes variables into the container; you can also set `TURN_USER`/`TURN_PASS` if you want a simple username/password. |
| `volumes` | *`turnserver.conf`*: overrides the image default with your TLS paths, port ranges, etc. <br>*`turnuserdb.txt`*: optional database file for many users.<br>*`certs`*: mount your Let's‑Encrypt certs. |
| `expose` | Internal ports visible to other containers on the same bridge network. |
| `proxy` | The reverse proxy exposes 443/80 to the world and forwards `/ws` → WebSocket server, `/janus` → Janus, and `/turn` → coturn (if you expose `/turn` on the proxy). |

> **Optional**: If you prefer not to expose the TURN port to the outside world (you’ll only use it internally), simply omit the `ports` block under `coturn`. Only the proxy will reach it via the internal Docker 
network.




You can use the official `coturn/coturn` image from Docker Hub, but it doesn’t expose TLS out of the box.  
A small custom Dockerfile gives you full control.

You can generate the hashed password with `openssl passwd -1` or use `turnadmin -a -u user -p password` after installing the `coturn` client utilities.


## 4.  Running it

```bash
# Build the image once
docker compose build

# Start all services (detached)
docker compose up -d

# Check logs (e.g., coturn)
docker compose logs -f coturn

# Verify TURN is reachable from outside
nc -v -u -z YOUR_VPS_IP 3478   # STUN/TURN UDP
nc -v -z YOUR_VPS_IP 5349     # TLS
```

**Test in the browser**

```js
const pc = new RTCPeerConnection({
  iceServers: [
    { urls: ["stun:YOUR_VPS_IP:3478"], username: "demo", credential: "demo" },
    { urls: ["turn:YOUR_VPS_IP:5349?transport=tcp"], username: "demo", credential: "demo" }
  ]
});
```

You should see ICE candidates like:

```
Candidate: 1 1 UDP 2130706431 192.168.1.42 3478 typ host
Candidate: 1 1 TCP 200 192.168.1.42 5349 typ relay
```

---

## 5.  Common Gotchas & Fixes

| Problem | Symptom | Fix |
|---------|---------|-----|
| `turnserver: error while opening the config file` | Wrong file path in `docker compose` volume | Ensure the path in `volumes:` matches the file on the host (`./turn/turnserver.conf`). |
| TURN handshake fails | “401 Unauthorized” or “Authentication failed” | Verify `userdb` path, use `turnadmin` to add users, or use `lt-cred-mech` in client. |
| TLS handshake fails | “no shared cipher” | Confirm certs are in PEM format and match `cert`/`pkey` paths. |
| ICE fails due to NAT | No candidates | Open UDP port 3478/5349 on the VPS firewall; confirm `listening-ip=0.0.0.0`. |
| “Could not bind listening port 3478” | Container fails to start | Another container (e.g., your own coturn instance) already listening on that port inside the host; use `expose` only, not `ports`, or map a different 
host port. |

---

## 6.  Optional Enhancements

| Feature | How to add |
|---------|------------|
| **Multiple users** | Create a `turnuserdb.txt` with many lines; add the file to the volume. |
| **High‑availability** | Run two `coturn` containers behind a load balancer (HAProxy). Make sure the port ranges don’t overlap or share the same `relay-ip`. |
| **Docker secrets** | Store credentials or TLS private keys as Docker secrets for extra security. |
| **Logging & monitoring** | Use `syslog` or forward `turnserver.log` to a central collector; expose `stdout` for Prometheus exporters. |

---


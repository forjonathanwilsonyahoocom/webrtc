# webrtc

**ALPHA DO NOT USE THIS, EDUCATIONAL PURPOSES ONLY**
for dev you can sign you own certs with:

```bash
openssl req -x509 -nodes -newkey rsa:2048 \
  -keyout certs/privkey.pem \
  -out certs/fullchain.pem \
  -days 365 \
  -subj "/CN=localhost" \
  -addext "subjectAltName=DNS:localhost,IP:127.0.0.1"
```

2. **Generate certs** (or use Let’s Encrypt in dev) and place them under `$LETSENCRYPT_PATH`. 

```bash
sudo certbot certonly --standalone -d your.website.place
```
3. **Generate a real TURN password hash**:  

```bash
openssl passwd -1 demo > /tmp/demo.hash
# copy the output into turnuserdb.txt
demo:<hash_from_file>:never
```


this project relies on a .env file that you need to create in the root of the project with your cert path
```dotenv
LETSENCRYPT_PATH=/path/to/letsencrypt
```
that file is excluded in .gitignore

there are multiple occurances of the string ${ENDPOINT} that you can replace with your actual endpoint

```bash
find . -type f -exec sed -i 's/\${ENDPOINT}/www.example.com/g' {} \;
```

there are multiple occurances of the string ${EXTERNAL_IP} that you can replace with your actual external ip

```bash
find . -type f -exec sed -i 's/\${EXTERNAL_IP}/1.1.1.1/g' {} \;
```

open firewall:

```bash
sudo ufw allow 443/tcp && \
sudo ufw allow 10000:10050/udp && \
sudo ufw allow 3478/tcp && \
sudo ufw allow 3478/udp && \
sudo ufw allow 5349/tcp && \
sudo ufw allow 5349/udp
```
then if you need to delete those rules

```bash
sudo ufw delete allow 443/tcp && \
sudo ufw delete allow 10000:10050/udp && \
sudo ufw delete allow 3478/tcp && \
sudo ufw delete allow 3478/udp && \
sudo ufw delete allow 5349/tcp && \
sudo ufw delete allow 5349/udp
```

### Explanation

| Section | What it does |
|---------|--------------|
| `environment` | Passes variables into the container; you can also set `TURN_USER`/`TURN_PASS` if you want a simple username/password. |
| `volumes` | *`turnserver.conf`*: overrides the image default with your TLS paths, port ranges, etc. <br>*`turnuserdb.txt`*: optional database file for many users.<br>*`certs`*: mount your Let's‑Encrypt certs. |
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
## Quick “memory‑squeeze” checklist for a 1 GiB VPS

| Step | What you’ll do | Why it matters | How to do it |
|------|----------------|----------------|--------------|
| **1** | **Turn the host‑level swap off** (or set it to *very* low) | Swap is slow; it only kicks in when you run out of RAM.  If you want to keep 
the stack alive you must *avoid* swapping altogether. | `sudo swapoff -a` (or edit `/etc/fstab` to remove the swap line).  If you really need a tiny 
swap for the kernel’s over‑commit, add a 16 MiB swap file and set `vm.swappiness=10`. |
| **2** | **Lower the kernel’s “swappiness”** | `vm.swappiness` tells the kernel how aggressively to move pages to swap.  A value of 10 (or 0) means 
“only swap when you’re almost out of RAM”. | `sudo sysctl -w vm.swappiness=10`  (add it to `/etc/sysctl.conf` to make it persistent). |
| **3** | **Limit each container’s memory** | Docker will use as much as it can unless you tell it otherwise.  By capping memory you force the 
container to use the host’s RAM only. | In *docker‑compose.yaml* add a `mem_limit` (or `mem_reservation` for the new “cgroup v2” syntax).  Example: 
<br>`services:`<br>`  janus:`<br>`    mem_limit: 256m`<br>`  coturn:`<br>`    mem_limit: 128m`<br>`  websocket:`<br>`    mem_limit: 64m` |
| **4** | **Turn off unneeded Janus plugins / features** | Every plugin pulls in libraries, compiles extra code, and can keep a few extra GBs 
resident.  If you only need the video‑room plugin, disable everything else. | In `janus.jcfg` set `plugins: { disable = 
"libjanus_sip.so,libjanus_recordplay.so,libjanus_sip_wss.so,..." }`  (or build a custom Janus image with only the plugins you need). |
| **5** | **Drop logging or send it to a file with rotation** | Each line of debug output is stored in RAM until it is written to disk.  With 
high‑traffic you can consume dozens of MBs a minute. | In Janus set `log_file = "/opt/janus/log/janus.log"` and use `logrotate`.  In `coturn.conf` add 
`simple-log` **and** `log-file = /var/log/turnserver/turnserver.log`.  In Nginx set `access_log off; error_log /var/log/nginx/error.log warn;`.  In 
your Node‑WebSocket server, only log errors. |
| **6** | **Use minimal base images** | Alpine images are ~50 % smaller and have a lighter libc, so they use less RAM. | `FROM node:20-alpine` (you 
already have that).  For Janus and Coturn, use the official `meetecho/janus-gateway` Docker image or build from source but *without* the 
`--disable-rabbitmq --disable-mqtt --disable-recording` flags. |
| **7** | **Configure the TURN server to use a very small port range** | Coturn keeps the range in memory.  The default `min-port=49152 
max-port=65535` can use ~16 k ports → a few MBs. | In `turnserver.conf` change to `min-port=49152 max-port=49252` (only 100 ports).  Disable 
`relay-transport=udp,tcp` if you don’t need TCP relay. |
| **8** | **Reduce the number of Nginx worker processes** | Each worker keeps its own memory footprint (~4–5 MiB).  On a 1 GiB box you’re better off 
with a single worker. | In `nginx.conf`: `worker_processes 1;`  (and keep the default `worker_connections 1024`). |
| **9** | **Limit the Node process memory** | Node’s V8 can grow to 2 GB by default.  A 1 GiB VPS can easily run out of RAM. | Start the WebSocket 
server with `node --max-old-space-size=256 node/index.js`.  Or set `NODE_OPTIONS="--max-old-space-size=256"` in the container’s env. |
| **10** | **Turn off unneeded services in your stack** | Every container that runs is a memory hog.  Keep only Janus, coturn, Nginx, your WebSocket 
server and the static audio client. | Make sure the `docker‑compose.yaml` only lists those services. |
| **11** | **Add file‑descriptor limits for containers** | High‑traffic can open many sockets.  If the limit is low, the container will hit OOM 
quickly. | In `docker‑compose.yaml`:<br>`services:`<br>`  janus:`<br>`    ulimits:`<br>`      nproc: 4096`<br>`      nofile: 65536`<br>Same for 
coturn, websocket, nginx. |
| **12** | **Use cgroup v2 (Docker 20.10+) memory limits** | Old “mem_limit” syntax is deprecated; the new syntax (`mem_limit`/`mem_reservation`) is 
more reliable. | In compose: `<service>:`<br>`    mem_limit: 256m`<br>`    mem_reservation: 200m` |

---

## Tuning the host kernel

```bash
# Disable swap completely
sudo swapoff -a
# Make the change permanent (remove the swap line from /etc/fstab)

# Low‑swappiness
sudo sysctl -w vm.swappiness=10
echo "vm.swappiness=10" | sudo tee -a /etc/sysctl.conf

# Prevent over‑commit from silently allocating more memory than you have
sudo sysctl -w vm.overcommit_memory=1
echo "vm.overcommit_memory=1" | sudo tee -a /etc/sysctl.conf
```

> **Why 10?**  
> `vm.swappiness=0` means “never swap”; `10` is a very safe middle ground that still lets the kernel swap if *absolutely* necessary (e.g., a short 
burst of page faults).  On a 1 GiB server you almost always want it low.

---

## Monitoring & quick checks

```bash
# See real‑time memory usage of each container
docker stats --no-stream

# Look at host memory usage
free -h
top -o %MEM
```

If you still see a lot of swapping even after the above, the problem is *not* the kernel but that the *total* memory requested by your containers + 
the OS + swap file is greater than 1 GiB.  In that case you’ll have to:

1. **Reduce the memory caps** further (e.g., Janus 128 MiB, coturn 64 MiB, websocket 32 MiB).
2. **Strip even more plugins** from Janus (disable SIP, SIP‑WS, recording, etc.).
3. **Move the static audio client** to a *separate* host or CDN (it can run on a tiny 32 MiB container).

---

## Bottom line

- **Turn swap off** (or keep it *tiny*) and set `vm.swappiness=10`.  
- **Cap each Docker container** with `mem_limit`/`mem_reservation`.  
- **Disable logging or log to disk with rotation**.  
- **Compile Janus with only the plugins you need** and use a minimal TURN port range.  
- **Limit the number of worker processes** in Nginx and Node.  
- **Watch the stats** – the first 200 MiB of RAM are usually enough for Janus, Coturn, the WebSocket server, and Nginx on a 1 GiB VPS.

Follow the checklist, run `docker compose up -d` again, and you should see swapping plummet to zero while the stack stays responsive. Happy hosting!


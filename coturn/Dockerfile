# Dockerfile (in ./coturn/)
FROM ubuntu:24.04

# Install coturn
RUN apt-get update && apt-get install -y coturn ca-certificates && rm -rf /var/lib/apt/lists/*

# Create config directory
RUN mkdir -p /etc/turnserver && \
    mkdir -p /var/log/turnserver

# Copy default config – you’ll override it later with a volume
COPY turnserver.conf /etc/turnserver/turnserver.conf

# Expose ports
EXPOSE 3478/udp   # STUN/TURN
EXPOSE 3478/tcp   # TURN (optional)
EXPOSE 5349/tcp   # TLS

ENTRYPOINT ["/usr/sbin/turnserver", "-c", "/etc/turnserver/turnserver.conf", "-l", "/var/log/turnserver/turnserver.log"]


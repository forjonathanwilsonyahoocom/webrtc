FROM ubuntu:24.04 AS builder

ARG DEBIAN_FRONTEND=noninteractive
ARG JANUS_VERSION=v1.3.1

RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    git \
    build-essential \
    autoconf \
    automake \
    libtool \
    pkg-config \
    gengetopt \
    libnice-dev \
    libglib2.0-dev \
    libjansson-dev \
    libconfig-dev \
    libmicrohttpd-dev \
    libssl-dev \
    libcurl4-openssl-dev \
    libsofia-sip-ua-dev \
    libopus-dev \
    libogg-dev \
    libusrsctp-dev \
    libwebsockets-dev \
    libsrtp2-dev \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /usr/src

RUN git clone --depth 1 --branch "${JANUS_VERSION}" \
      https://github.com/meetecho/janus-gateway.git \
      janus-gateway

WORKDIR /usr/src/janus-gateway

RUN sh autogen.sh && \
    ./configure \
      --prefix=/opt/janus \
      --disable-rabbitmq \
      --disable-mqtt \
      --disable-docs \
      --disable-data-channels \
      --disable-all-plugins \
      --enable-plugin-audiobridge \
      --disable-all-transports \
      --enable-ws \
      --enable-rest \ 
      --disable-all-handlers \ 
      --enable-handler-audiobridge && \ 
    make -j"$(nproc)" && \
    make install && \
    make configs

FROM ubuntu:24.04 AS runtime

ARG DEBIAN_FRONTEND=noninteractive

RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    libnice10 \
    libglib2.0-0 \
    libjansson4 \
    libconfig9 \
    libmicrohttpd12 \
    libssl3 \
    libcurl4 \
    libsofia-sip-ua0 \
    libopus0 \
    libogg0 \
    libusrsctp2 \
    libwebsockets19 \
    libsrtp2-1 \
    tini \
 && rm -rf /var/lib/apt/lists/*


COPY --from=builder /opt/janus /opt/janus

ENV PATH="/opt/janus/bin:${PATH}" \
    JANUS_HOME="/opt/janus"

WORKDIR /opt/janus

EXPOSE 7088 7089 8088 8089 8188 8189
EXPOSE 10000-10200/udp

ENTRYPOINT ["/usr/bin/tini", "--"]

CMD ["/opt/janus/bin/janus", \
     "-F", "/opt/janus/etc/janus", \
     "-C", "/opt/janus/etc/janus/janus.jcfg"]


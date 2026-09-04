FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY index.html ./
COPY src/ ./src/
COPY public/ ./public/


RUN cp node_modules/webrtc-adapter/out/adapter.js public/webrtc-adapter.js

RUN npm run build


FROM nginx:alpine

COPY favicon.ico /usr/share/nginx/html/
COPY apple-touch-icon.png  /usr/share/nginx/html/

COPY --from=build /app/dist/ /usr/share/nginx/html/
#make invalid self signed cert to use for any scanner traffic
RUN apk add --no-cache openssl \
    && mkdir -p /etc/ssl_sink/certs/sink \
    && openssl req -x509 -nodes -newkey rsa:2048 \
         -days 3650 \
         -keyout /etc/ssl_sink/certs/sink/privkey.pem \
         -out /etc/ssl_sink/certs/sink/fullchain.pem \
         -subj "/CN=invalid.local" \
    && chmod 600 /etc/ssl_sink/certs/sink/privkey.pem \
    && chmod 644 /etc/ssl_sink/certs/sink/fullchain.pem
    
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]


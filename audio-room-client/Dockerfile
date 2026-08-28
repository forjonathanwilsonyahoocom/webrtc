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

COPY --from=build /app/dist/ /usr/share/nginx/html/

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]


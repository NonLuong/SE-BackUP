FROM node:18 as builder
WORKDIR /app
COPY . ./
RUN npm install
RUN npm run build

FROM nginx:alpine
COPY nginx.conf /etc/nignx/nignx.conf
WORKDIR /usr/share/nginx/html
COPY --from=builder /app/dist .
# Mafia Spectate -- static frontend, built and served for Cloud Run.

# ---- Build the static bundle ----
FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# ---- Serve it with nginx ----
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf.template /etc/nginx/templates/default.conf.template

# Cloud Run injects $PORT (defaults to 8080 locally); the official nginx image's
# entrypoint runs envsubst over templates/*.template into conf.d/ on container start,
# so `listen ${PORT}` resolves correctly however Cloud Run configures it.
ENV PORT=8080
EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]

# CRM Fullstack Application (Dockerized)

A complete enterprise CRM application with an Express/Node.js backend, React (Vite + Tailwind CSS) frontend, MongoDB for persistence, and Redis for caching and session management.

---

## 🚀 Running Frontend & Backend Together (Docker)

You no longer need to run the frontend and backend in separate terminal windows. Both services can be started together with a single build command.

### Option 1: Docker Compose (Recommended)

Starts the frontend (Nginx on port `5173`) and the backend (Node.js on port `3000`) simultaneously:

```bash
docker compose up --build
```
Or to run in detached (background) mode:
```bash
docker compose up --build -d
```

To stop all services:
```bash
docker compose down
```

#### Access Points:
- **Frontend App**: [http://localhost:5173](http://localhost:5173)
- **Backend API**: [http://localhost:3000](http://localhost:3000)

> **Note on MongoDB & Redis**:
> By default, the backend connects to your existing MongoDB and Redis running on your host machine via `host.docker.internal:27017` and `host.docker.internal:6379`.
> If you want Docker Compose to spin up fresh, dedicated MongoDB and Redis containers with persistent volumes, run:
> ```bash
> docker compose --profile full up --build
> ```

---

### Option 2: Single All-in-One Container

If you prefer packaging both frontend and backend into a single container image:

```bash
# Build the single all-in-one image
docker build -t crm-app .

# Run the container
docker run -p 3000:3000 --env-file backend/.env crm-app
```
Then visit [http://localhost:3000](http://localhost:3000) (the backend automatically serves the compiled frontend assets and API endpoints together on port 3000).

---

## 🛠️ Project Structure

```text
├── docker-compose.yml       # Multi-container orchestration (Frontend + Backend + DBs)
├── Dockerfile               # Root all-in-one container Dockerfile
├── .dockerignore            # Root Docker ignore rules
├── .env.docker.example      # Example environment configuration for Docker
├── backend/
│   ├── Dockerfile           # Backend container definition (Node 20 Alpine)
│   ├── .dockerignore        # Backend ignore rules
│   ├── .env                 # Backend environment variables
│   └── src/
│       └── server.js        # Express API server (supports static fallback)
└── frontend/
    ├── Dockerfile           # Multi-stage frontend container (Vite build + Nginx)
    ├── nginx.conf           # Production Nginx reverse-proxy & SPA config
    ├── .dockerignore        # Frontend ignore rules
    └── src/
```

---

## ⚙️ Environment Configuration

Backend configuration is loaded automatically from `backend/.env` or can be customized in `docker-compose.yml`:

| Variable | Default Value | Description |
| :--- | :--- | :--- |
| `PORT` | `3000` | Port for Express API |
| `CLIENT_URL` | `http://localhost:5173` | Allowed CORS frontend client URL |
| `BACKEND_URL` | `http://localhost:3000` | Backend host URL |
| `MONGO_URL` | `mongodb://host.docker.internal:27017/auth_db` | MongoDB connection string |
| `REDIS_URL` | `redis://:yourpassword@host.docker.internal:6379` | Redis connection string |
| `JWT_SECRET` | *(configured in .env)* | Secret key for JWT auth tokens |

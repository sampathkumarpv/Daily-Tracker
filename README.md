# Daily-Tracker / TaskFlow

A full-stack daily task tracking application built with **React + TypeScript** (frontend) and **Spring Boot + Kotlin** (backend), backed by **PostgreSQL**.

---

## 📁 Project Structure

```
Daily-Tracker/
├── client/        # React + TypeScript + Vite frontend
└── server/        # Spring Boot Kotlin backend
```

---

## ✅ Prerequisites

Make sure you have the following installed:

| Tool | Version | Purpose |
|------|---------|---------|
| [Node.js](https://nodejs.org/) | 18+ | Frontend runtime |
| [Java JDK](https://adoptium.net/) | 17+ | Backend runtime |
| [Homebrew](https://brew.sh/) | Any | PostgreSQL install & management (macOS) |

---

## 🚀 Getting Started

### Just run one command ⚡

```bash
npm install       # only needed the first time
npm start
```

That's it. This will automatically:
1. 🔍 Check if PostgreSQL is installed via Homebrew → installs it if missing
2. 🚀 Start PostgreSQL if it isn't already running → skips with a log if it is
3. 🔧 Create the `taskflow` database and user if they don't exist
4. ▶️  Start the Spring Boot backend and Vite frontend together with colour-coded logs

| Service | URL |
|---------|-----|
| 🔵 Frontend | http://localhost:5173 |
| 🟣 Backend API | http://localhost:8080 |
| 🟡 PostgreSQL | localhost:5432 |

> API calls to `/api/*` from the frontend are automatically proxied to the backend.

---

### Or run parts individually

**Database only:**
```bash
npm run start:db
```

**Backend only:**
```bash
cd server
./gradlew bootRun     # macOS / Linux
gradlew.bat bootRun   # Windows
```

**Frontend only:**
```bash
cd client
npm install           # only needed the first time
npm run dev
```

---

## 🛠️ All Available Commands

### Frontend (`client/`)

| Command | Description |
|---------|-------------|
| `npm install` | Install all dependencies |
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Compile TypeScript and build for production |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run ESLint to check code quality |

---

### Backend (`server/`)

| Command | Description |
|---------|-------------|
| `./gradlew bootRun` | Start the Spring Boot server |
| `./gradlew build` | Compile and package the application |
| `./gradlew test` | Run all backend tests |
| `./gradlew clean` | Clean build artifacts |
| `./gradlew clean build` | Full clean rebuild |

---

### Database (Homebrew PostgreSQL)

| Command | Description |
|---------|-------------|
| `npm run start:db` | Auto-install (if needed), start DB, create user/database |
| `brew services start postgresql@16` | Start PostgreSQL manually |
| `brew services stop postgresql@16` | Stop PostgreSQL |
| `brew services restart postgresql@16` | Restart PostgreSQL |
| `brew services list` | Check status of all services (including PostgreSQL) |
| `psql -U taskflow -d taskflow` | Open a PostgreSQL shell for the app |

---

## ⚙️ Configuration

### Backend — `server/src/main/resources/application.yml`

```yaml
spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/taskflow
    username: taskflow
    password: taskflow_pass
server:
  port: 8080
```

### Frontend Proxy — `client/vite.config.ts`

All requests to `/api` are proxied to the backend:
```ts
proxy: {
  '/api': { target: 'http://localhost:8080' }
}
```

---

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, TypeScript, Vite |
| Backend | Spring Boot 3, Kotlin, JPA |
| Database | PostgreSQL 16 (via Homebrew) |
| Migrations | Flyway |
| Drag & Drop | dnd-kit |
| HTTP Client | Axios |


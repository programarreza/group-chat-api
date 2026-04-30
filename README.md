# Chat API

A highly scalable, real-time backend API for a group chat service.

**Stack:** NestJS · PostgreSQL · Drizzle ORM · Redis · Socket.io · TypeScript

## Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- PostgreSQL (v15+)
- Redis (v7+)

## Setup Instructions

### 1. Clone the repository and install dependencies

```bash
git clone https://github.com/programarreza/group-chat-api.git
cd group-chat-api
npm install
```

### 2. Start PostgreSQL and Redis

Ensure your own local instances of PostgreSQL and Redis are running.

### 3. Environment Variables

The application uses default values for local development. If your DB/Redis differ from the defaults, create a `.env` file in the root directory:

```env
DATABASE_URL=postgres://chat_user:chat_password@localhost:5432/chat_db
REDIS_URL=redis://localhost:6379
PORT=4000
```

### 4. Database Migrations

Before running the application, you must push the schema to PostgreSQL using Drizzle ORM:

```bash
npx drizzle-kit push
```

### 5. Running the Application

Start the NestJS development server:

```bash
# development
npm run start

# watch mode
npm run start:dev

# production mode
npm run start:prod
```

The REST API will be accessible at `http://localhost:4000/api/v1` and the WebSocket gateway at `ws://localhost:4000/chat`.

## Deployed Application

The API is deployed and live at:
**[https://group-chat-api-6biq.onrender.com](https://group-chat-api-6biq.onrender.com)**

## Architecture Details

Please refer to [ARCHITECTURE.md](./ARCHITECTURE.md) for a detailed breakdown of the system design, scaling strategy, and pub/sub implementation.

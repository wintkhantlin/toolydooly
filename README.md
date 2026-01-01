# ToolyDooly — A Node.js Microservice  

A **Todo application** built with **NestJS**, **Express**, **Vue**, and **MongoDB**, running in a Dockerized microservice architecture. This app is still in progress and you can see the [ROADMAP](./ROADMAP.md) [https://roadmap.sh/projects/todo-list-api](https://roadmap.sh/projects/todo-list-api)

---

## Generating Key Pair

To generate key pair that will be used for generating Json Web Token with RS512, you may either generate key manually by yourself by running `openssl` or run the script.

```sh
node generate-keypair.mjs

# Or

bun generate-keypair.mjs
```

## Requirements  

### Check Prerequisite

```sh
node scripts/prerequisite.mjs

# Or

bun scripts/prerequisite.mjs
```

### Deployment  
- **Docker** (Docker Compose recommended)  

### Development  
- **Bun** (preferred) or **Node.js**  
- **Docker** (for running dependent services like Mongo, Redis, RabbitMQ, Postgres)  

---

## Services  

- **api** → Main API gateway  
- **auth_service** → Authentication + Redis session store  
- **todo_service** → Todo CRUD with MongoDB + RabbitMQ queue  
- **web-app** → Vue frontend  

### Others

- **auth_db** → Postgres for auth service  
- **todo_db** → MongoDB for todos  
- **redis** → Caching/session storage  
- **rabbitmq** → Messaging/queueing  

---

## Getting Started  

### Clone & Setup  
```bash
git clone https://github.com/happer64bit/toolydooly.git
cd toolydooly
```

### Development (with Bun)  
```bash
bun install
bun dev
```

#### Starting Docker Services For Development
```bash
docker compose up auth_db todo_db redis rabbitmq smtp -d
```

### Run with Docker Compose  
```bash
docker-compose up --build
```

Frontend → `http://localhost:4173`  
API → `http://localhost:3001`  
Auth Service → `http://localhost:3002`  
Todo Service → `http://localhost:3003`  

---

## Environment Variables  

You’ll need a `.env` file in the root:  

```env
NODE_ENV=development
TODO_DATABASE_URL=mongodb://todo_user:todo_pass@todo_db:27017/todo_db?authSource=admin
AUTH_DATABASE_URL=postgres://auth_user:auth_pass@auth_db:5432/auth_db
REDIS_HOST=redis
REDIS_PASSWORD=redis
QUEUE_URL=amqp://rabbitmq:rabbitmq@rabbitmq:5672
```

---

## Development Notes  
- Use **Bun** for faster dev cycles, but Node.js works fine.  
- Each service has its own `Dockerfile` under `/apps`.  
- Database state is persisted in Docker volumes.

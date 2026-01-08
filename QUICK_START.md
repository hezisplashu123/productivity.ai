# ⚡ Quick Start Guide

## First Time Setup (One-time)

```bash
# 1. Install dependencies
npm install
cd backend && npm install && cd ..

# 2. Find your IP address
# Windows: .\scripts\get-local-ip.ps1
# Mac/Linux: node scripts/get-local-ip.js

# 3. Update src/config/api.ts with your IP

# 4. Start database
cd backend
docker-compose up -d

# 5. Setup database
npm run prisma:migrate
npm run prisma:generate
npm run prisma:seed
```

---

## Daily Development (Run These Every Time)

### Terminal 1: Backend
```bash
cd backend
npm run dev
```

### Terminal 2: Frontend
```bash
npm start
```

Then scan the QR code with Expo Go on your phone!

---

## Stop Everything

```bash
# Stop backend: Ctrl+C in backend terminal
# Stop frontend: Ctrl+C in frontend terminal
# Stop database:
cd backend
docker-compose down
```













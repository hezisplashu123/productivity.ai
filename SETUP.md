# 🚀 Complete Setup & Run Instructions

Follow these steps in order to get your full-stack mobile app running.

## Prerequisites

- Node.js (v18 or higher) installed
- Docker Desktop installed (for PostgreSQL) OR PostgreSQL installed locally
- Expo Go app installed on your phone
- Your phone and computer on the **same WiFi network**

---

## Step 1: Install Dependencies

### Frontend
```bash
npm install
```

### Backend
```bash
cd backend
npm install
cd ..
```

---

## Step 2: Configure Your Local IP Address

**CRITICAL:** Your phone needs to know your computer's IP address to connect to the backend.

### Find Your Local IP Address

**Windows (PowerShell):**
```powershell
.\scripts\get-local-ip.ps1
```

**Windows (Command Prompt):**
```cmd
ipconfig
```
Look for "IPv4 Address" under your active network adapter (usually starts with 192.168.x.x)

**Mac/Linux:**
```bash
node scripts/get-local-ip.js
```

### Update the IP in Frontend

1. Open `src/config/api.ts`
2. Replace `'192.168.1.100'` with your actual local IP address:
   ```typescript
   const LOCAL_IP = '192.168.1.XXX'; // Your IP here
   ```

---

## Step 3: Set Up Database

### Option A: Using Docker (Recommended)

1. **Start PostgreSQL container:**
   ```bash
   cd backend
   docker-compose up -d
   ```

2. **Wait 10-15 seconds** for the database to be ready

3. **Create database schema:**
   ```bash
   npm run prisma:migrate
   ```
   (When prompted, name it "init" or press Enter)

4. **Generate Prisma Client:**
   ```bash
   npm run prisma:generate
   ```

5. **Seed the database:**
   ```bash
   npm run prisma:seed
   ```

6. **Verify:** You should see "✅ Created user: { ... }"

### Option B: Using Local PostgreSQL

1. **Create a database:**
   ```sql
   CREATE DATABASE productivity_ai;
   ```

2. **Update `.env` file in `backend/` folder:**
   ```env
   DATABASE_URL="postgresql://your_username:your_password@localhost:5432/productivity_ai?schema=public"
   PORT=3000
   ```

3. **Run migrations and seed:**
   ```bash
   cd backend
   npm run prisma:migrate
   npm run prisma:generate
   npm run prisma:seed
   ```

---

## Step 4: Start the Backend Server

```bash
cd backend
npm run dev
```

**Expected output:**
```
🚀 Server is running on http://localhost:3000
📱 Server is accessible from your network
💡 Make sure your phone is on the same WiFi network
🔗 Use your computer's local IP address in the mobile app
```

**Keep this terminal open!** The server must be running for the app to work.

---

## Step 5: Start the Expo App

**Open a NEW terminal window** (keep the backend running in the first one):

```bash
npm start
```

**Expected output:**
```
› Metro waiting on expo://192.168.x.x:8081
› Scan the QR code above with Expo Go (Android) or the Camera app (iOS)
```

### Connect Your Phone

1. **Android:**
   - Open Expo Go app
   - Tap "Scan QR code"
   - Scan the QR code from the terminal

2. **iOS:**
   - Open the Camera app
   - Point it at the QR code
   - Tap the notification to open in Expo Go

---

## Step 6: Test the Connection

Once the app loads on your phone:

1. You should see "Productivity AI" with "Users from Backend"
2. The app will attempt to fetch users from the backend
3. If successful, you'll see the seeded user (Test User)
4. If there's an error, check:
   - Backend server is running
   - IP address is correct in `src/config/api.ts`
   - Phone and computer are on the same WiFi
   - Firewall isn't blocking port 3000

---

## Troubleshooting

### "Network request failed" or "Connection refused"

1. **Check IP address:**
   - Verify your IP in `src/config/api.ts` matches your computer's IP
   - Run the IP detection script again

2. **Check backend is running:**
   - Look for the server logs in the backend terminal
   - Try accessing `http://YOUR_IP:3000/health` in a browser on your phone

3. **Check firewall:**
   - Windows: Allow Node.js through Windows Firewall
   - Mac: System Preferences → Security & Privacy → Firewall

4. **Check WiFi:**
   - Both devices must be on the same network
   - Some public WiFi networks block device-to-device communication

### Database connection errors

1. **Docker not running:**
   - Make sure Docker Desktop is running
   - Check container status: `docker ps`

2. **Wrong DATABASE_URL:**
   - Verify `.env` file in `backend/` folder
   - For Docker: `postgresql://user:password@localhost:5432/productivity_ai?schema=public`

### Expo app won't load

1. **Clear cache:**
   ```bash
   npm start -- --clear
   ```

2. **Reinstall dependencies:**
   ```bash
   rm -rf node_modules
   npm install
   ```

---

## Quick Command Reference

```bash
# Start database (Docker)
cd backend && docker-compose up -d

# Setup database
cd backend && npm run prisma:migrate && npm run prisma:generate && npm run prisma:seed

# Start backend
cd backend && npm run dev

# Start frontend (in new terminal)
npm start

# Stop database
cd backend && docker-compose down
```

---

## Project Structure

```
productivity.ai/
├── app/                    # Expo Router screens
│   ├── _layout.tsx
│   └── index.tsx          # Home screen (fetches users)
├── src/
│   ├── config/
│   │   └── api.ts         # ⚠️ UPDATE IP ADDRESS HERE
│   └── services/
│       └── api.ts         # API service functions
├── backend/
│   ├── src/
│   │   ├── index.ts       # Express server
│   │   └── lib/
│   │       └── prisma.ts  # Prisma client
│   ├── prisma/
│   │   └── schema.prisma  # Database schema
│   └── docker-compose.yml # PostgreSQL container
└── scripts/
    └── get-local-ip.*     # IP detection scripts
```

---

## Next Steps

- ✅ Backend is running and accessible
- ✅ Database is set up with a test user
- ✅ Frontend can fetch and display users
- 🎉 You're ready to build your app!



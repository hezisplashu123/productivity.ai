# Backend Setup Instructions

## Environment Variables

Create a `.env` file in the `backend` directory with the following content:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/productivity_ai?schema=public"
PORT=3000
```

## Database Setup Options

### Option 1: Using Docker (Recommended)

1. Start PostgreSQL container:
   ```bash
   docker-compose up -d
   ```

2. Wait for the database to be ready (about 10-15 seconds)

3. Run Prisma migrations:
   ```bash
   npm run prisma:migrate
   ```

4. Generate Prisma Client:
   ```bash
   npm run prisma:generate
   ```

5. Seed the database:
   ```bash
   npm run prisma:seed
   ```

### Option 2: Using Local PostgreSQL

If you have PostgreSQL installed locally:

1. Create a database:
   ```sql
   CREATE DATABASE productivity_ai;
   ```

2. Update the `DATABASE_URL` in `.env` to match your local PostgreSQL credentials

3. Run Prisma migrations:
   ```bash
   npm run prisma:migrate
   ```

4. Generate Prisma Client:
   ```bash
   npm run prisma:generate
   ```

5. Seed the database:
   ```bash
   npm run prisma:seed
   ```

## Running the Server

Development mode (with hot reload):
```bash
npm run dev
```

Production mode:
```bash
npm run build
npm start
```

The server will run on `http://localhost:3000` (or the PORT specified in `.env`).



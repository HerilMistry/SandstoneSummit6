# Sandstone Summit 6.0 — QR Attendance System

## Project Structure
```
SandstoneSummit6/
├── backend/          # Node.js + Express + PostgreSQL
├── student-app/      # Expo React Native — for participants
└── scanner-app/      # Expo React Native — for organizers only
```

---

## 1. Backend Setup

### Install deps
```bash
cd backend
npm install
```

### Configure environment
```bash
cp .env.example .env
# Edit .env and set DATABASE_URL, JWT_SECRET, ORGANIZER_PASSWORD
```

Example `.env`:
```
DATABASE_URL=postgresql://user:password@host:5432/sandstone6
JWT_SECRET=super-long-random-secret-here
ORGANIZER_PASSWORD=sandstone2026
PORT=3001
NODE_ENV=development
```

### Run database migration (creates all tables)
```bash
npm run migrate
```

### Seed the schedule (all 14 sessions from the schedule)
```bash
npm run seed
```

### Start the server
```bash
npm run dev       # development (with nodemon)
npm start         # production
```

---

## 2. Student App Setup

```bash
cd student-app
npm install
```

### Set your backend URL
Edit `src/api/client.ts` and set `BASE_URL` to your backend's LAN IP/deployed URL.

For local testing with Expo Go on your phone:
```
http://192.168.x.x:3001    ← your machine's LAN IP
```

### Run
```bash
npx expo start
# Scan QR with Expo Go app on phone
```

---

## 3. Scanner App Setup (Organizers only)

```bash
cd scanner-app
npm install
```

### Set your backend URL
Edit `src/api/client.ts` — same as student app.

### Run
```bash
npx expo start
```

Login password = whatever `ORGANIZER_PASSWORD` is in the backend `.env`.

---

## 4. Build APKs (for distribution)

Install EAS CLI:
```bash
npm install -g eas-cli
eas login
```

Build student APK:
```bash
cd student-app
eas build --platform android --profile preview
```

Build scanner APK:
```bash
cd scanner-app
eas build --platform android --profile preview
```

---

## API Summary

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | `/api/auth/login` | — | Organizer login → JWT |
| POST | `/api/enroll` | — | Enroll student (roll + name) |
| GET | `/api/enroll/lookup/:roll` | — | Re-fetch student data by roll |
| GET | `/api/sessions` | — | All sessions with `is_active` flag |
| GET | `/api/sessions/active` | — | Only currently active sessions |
| POST | `/api/attendance/scan` | JWT | Mark attendance via QR token |
| GET | `/api/attendance/session/:id` | JWT | All attendees for a session |
| GET | `/api/attendance/session/:id/count` | JWT | Count for live polling |
| GET | `/api/attendance/student/:roll` | — | Student's attended sessions |

---

## How Session Time Validation Works

- Each session has a `start_time` and `end_time` stored in UTC (schedule is IST → converted on seed)
- `POST /api/attendance/scan` checks `NOW() BETWEEN start_time AND end_time`
- If the session is not active, the scan is rejected with a clear error
- Sessions show `is_active: true` in the session list when they are live
- The scanner app highlights active sessions in **green**

---

## QR Code Format

Each student's QR encodes:
```json
{"roll":"B22CS001","token":"<uuid>"}
```
The `token` is a unique UUID generated at enrollment. It's the secret — knowing a roll number alone isn't enough to forge a QR.

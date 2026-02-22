# 🦷 Aura Dental Clinic — Management System

> Full-stack dental clinic software: Node.js · Express · Socket.io · MySQL · Single-file SPA

---

## 📦 Project Structure

```
aura-dental/
├── public/
│   └── index.html          ← Complete SPA (all UI)
├── routes/
│   ├── patients.js         ← Patient CRUD + history
│   ├── visits.js           ← Clinical visits, payment, prescriptions
│   ├── queue.js            ← Doctor queue + chairs
│   └── reference.js        ← Doctors, treatments, medicines, auth
├── server.js               ← Express + Socket.io entry point
├── database.sql            ← MySQL schema + seed data
├── package.json
├── .env.example            ← Copy to .env and fill in credentials
├── Procfile                ← For Render / Railway / Heroku deploy
└── .gitignore
```

---

## 🚀 Local Setup (5 minutes)

### 1. Clone your repo
```bash
git clone https://github.com/YOUR_USERNAME/aura-dental.git
cd aura-dental
```

### 2. Install dependencies
```bash
npm install
```

### 3. Set up MySQL database
```bash
mysql -u root -p < database.sql
```
Or open MySQL Workbench → paste contents of `database.sql` → Execute.

### 4. Create `.env` file
```bash
cp .env.example .env
```
Edit `.env` and set your MySQL password:
```
DB_PASSWORD=your_actual_password
```

### 5. Start the server
```bash
node server.js          # production
npm run dev             # development (auto-restart on changes)
```

### 6. Open browser
```
http://localhost:3000
```

**Default logins:**
| Role | Username | Password |
|------|----------|----------|
| Admin | `admin` | `admin123` |
| Doctor | `doctor1` | `doctor123` |
| Reception | `reception` | `reception123` |

---

## ☁️ Free Cloud Deployment

### Option A — Render.com (Recommended, free tier)

1. Push code to GitHub
2. Go to [render.com](https://render.com) → New → Web Service
3. Connect your GitHub repo
4. Set environment variables:
   - `DB_HOST` → your MySQL host
   - `DB_USER`, `DB_PASSWORD`, `DB_NAME`
5. Build command: `npm install`
6. Start command: `node server.js`
7. Click Deploy

**Free MySQL on Render:** Use [PlanetScale](https://planetscale.com) (free) or [Aiven](https://aiven.io) (free tier) for hosted MySQL.

### Option B — Railway.app (free $5/month credit)

1. Go to [railway.app](https://railway.app) → New Project
2. Deploy from GitHub repo
3. Add MySQL plugin → Railway auto-sets `DATABASE_URL`
4. Add env vars → Deploy

### Option C — Heroku

```bash
heroku create aura-dental-clinic
heroku addons:create jawsdb:kitefin   # free MySQL
git push heroku main
```

---

## 🔌 Real-Time Features (Socket.io)

| Event | Direction | Action |
|-------|-----------|--------|
| `sendPrescription` | Doctor → Server → Reception | Instant beep + green popup |
| `prescriptionPrinted` | Reception → Server → Doctor | Confirmation logged |
| `paymentConfirmed` | Reception → Server → Doctor | Activity feed updated |

---

## 📡 API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/patients` | All patients |
| POST | `/api/patients` | Register patient |
| GET | `/api/patients/:id/history` | Patient visit history |
| GET | `/api/queue` | Today's queue |
| POST | `/api/queue` | Add to queue |
| POST | `/api/visits` | Create visit (doctor) |
| PUT | `/api/visits/:id/payment` | Collect payment + assign chair |
| PUT | `/api/visits/:id/update` | Update OPD form (further treatment) |
| PUT | `/api/visits/:id/complete` | Complete treatment + send Rx |
| GET | `/api/visits/pending-rx` | Prescriptions waiting to print |
| PUT | `/api/visits/:id/rx-printed` | Mark Rx printed |
| GET | `/api/stats` | Dashboard stats |
| POST | `/api/auth/login` | Login |

---

## 🔄 Clinical Workflow

```
Reception registers patient
        ↓
Walk-in & Queue → patient added to doctor queue
        ↓
Doctor Consultation → chief complaint, diagnosis,
                      tooth chart, treatments, medicines
        ↓
Treatment plan created → sent to Reception
        ↓
Collect Payment → chair assigned
        ↓
In-Treatment → Doctor sees patient on chair
    ├── [View] → read-only summary
    └── [📋 Open OPD Form] → pre-filled form for further
                               diagnostics / treatment changes
        ↓
✅ Start Treatment (Complete) → procedure notes, discount,
                                 update medicines
        ↓
Prescription sent to Reception (real-time Socket.io)
        ↓
Print Bills & Rx → reception prints, marks done
```

---

## ⚙️ Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | Server port |
| `DB_HOST` | `localhost` | MySQL host |
| `DB_USER` | `root` | MySQL username |
| `DB_PASSWORD` | _(empty)_ | MySQL password |
| `DB_NAME` | `aura_dental` | Database name |

---

## 🛠 Tech Stack

- **Frontend:** Vanilla JS SPA (single `index.html`, no build step)
- **Backend:** Node.js + Express
- **Real-time:** Socket.io
- **Database:** MySQL 8+
- **Deployment:** Any Node.js host (Render, Railway, Heroku, VPS)

---

## 📝 Notes

- The app works **offline** (opens `index.html` directly in browser, uses localStorage)
- When served via Node.js, it uses MySQL + real-time sync
- No build tools required — just `npm install` and run

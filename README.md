# 🌾 KrishiMitra AI

**A production-ready, AI-powered digital agriculture platform** that helps farmers with crop decisions, disease and pest identification, soil health, weather, market prices, government schemes, equipment rental, marketplace services, farm records, analytics, and AI-assisted support.

Modern, responsive, mobile/tablet/desktop friendly UI with simple language and clear navigation.

---

## ✨ Features

| Module | Description |
|--------|------------|
| 🔐 **Authentication** | Register, login, logout, JWT, role-based access (farmer / admin) |
| 📊 **Dashboard** | At-a-glance profit, income, expense, weather and market previews |
| 🤖 **AI Chat** | Agriculture-focused assistant (works offline with mock engine) |
| 🦠 **Disease Detection** | Upload leaf/plant image → possible disease + confidence + measures |
| 🐛 **Pest Detection** | Upload pest image → identification + prevention/control advice |
| 🌱 **Crop Recommendation** | Suggest suitable crops based on soil, season, water |
| 🪱 **Soil Health** | Enter test values → nutrient analysis + recommendations |
| 🌦️ **Weather** | Farm-informed weather + farming advisory (simulated fallback) |
| 💰 **Market Prices** | Browse/compare prices, view trends (indicative data) |
| 🏛️ **Government Schemes** | Searchable, verifiable scheme database |
| 🛒 **Marketplace** | List & browse agriculture products |
| 🚜 **Equipment Rental** | List, search, request rentals, manage records |
| 👥 **Community** | Posts, likes, comments — connect with farmers |
| 📒 **Farm Records** | Crops, activities, expenses, income ledger |
| 📈 **Analytics** | Profit, income/expense, crop performance, activity summaries |
| 👤 **Profile** | Edit profile details |
| 🛡️ **Admin Panel** | Manage users, crops, schemes, posts, listings |
| ⚙️ **Settings** | Account settings, change password |

---

## 🧰 Tech Stack

- **Backend:** Node.js, Express, better-sqlite3 (SQLite), JWT, bcrypt, multer, helmet, morgan, express-validator
- **Frontend:** React 18, Vite, React Router, Axios
- **DB:** SQLite (zero-config, file-based) with full schema, relationships, indexes
- **AI:** Clean abstraction layer with a fully working offline **mock engine** (no API key required). Plug in a real provider via `.env`.

> **AI Safety:** This app never fabricates diagnoses, pesticide instructions, market prices, weather, or scheme details. It clearly communicates uncertainty and recommends consulting qualified agricultural experts for high-risk decisions. Weather & market data are clearly flagged as *simulated/indicative* when no live API key is configured.

---

## 🚀 Setup & Run

### Prerequisites
- **Node.js v18+** (tested on v22)

### 1. Install backend dependencies
```bash
npm install
```

### 2. Install frontend dependencies
```bash
npm --prefix client install
```

### 3. Configure environment
```bash
# Copy the example env file
cp .env.example .env
```
Edit `.env` if needed (see [Environment Variables](#environment-variables)).

### 4. Start the backend (runs on http://localhost:5000)
Automatically creates & seeds the SQLite database on first run.
```bash
npm run server
```

### 5. Start the frontend (runs on http://localhost:5173)
In a **separate terminal**:
```bash
npm --prefix client run dev
```

Open **http://localhost:5173** in your browser.

> The Vite dev server proxies `/api` and `/uploads` to the backend automatically.

---

## 🔑 Sample Accounts

| Role | Email | Password |
|------|-------|----------|
| **Admin** | `admin@krishimitra.ai` | `Admin@123` |
| **Farmer** | `farmer@krishimitra.ai` | `Farmer@123` |

---

## 🧪 Quick Test (One Command Backend)
```bash
# Skip the manual steps above: install backend, then run the server
npm install
npm run server
```
Then hit the health endpoint:
```bash
curl http://localhost:5000/api/health
```

---

## 📁 Project Structure

```
├── server/
│   ├── config/          # env, db, upload config
│   ├── controllers/     # route handlers per module
│   ├── db/              # schema init + seed data
│   ├── middleware/      # auth, validate, error handler
│   ├── routes/          # REST route groups
│   ├── services/        # AI engine, weather service
│   ├── utils/           # helpers (errors, token, response)
│   └── index.js         # server entry
├── client/
│   └── src/
│       ├── api/         # axios client
│       ├── components/  # layout & shared UI
│       ├── context/     # auth, toast
│       └── pages/       # all 18 module pages
├── .env.example
└── package.json
```

---

## 🔌 API Overview

Base URL: `http://localhost:5000/api`

### Auth
| Method | Endpoint | Description |
|--------|----------|------------|
| POST | `/auth/register` | Create account |
| POST | `/auth/login` | Login → JWT |
| GET  | `/auth/me` | Current user (auth) |

### AI & Tools (authenticated unless noted)
| Method | Endpoint | Description |
|--------|----------|------------|
| POST | `/chat` | Send AI chat message |
| GET / DELETE | `/chat/history` | Get/clear chat history |
| POST | `/detection/disease` | Disease detection (multipart image) |
| POST | `/detection/pest` | Pest detection (multipart image) |
| GET | `/detection/history` | Detection history |
| POST | `/crops/recommend` | Crop recommendations |
| GET | `/crops` / `/crops/:id` | Crop catalogue |
| POST | `/soil/analyze` | Soil nutrient analysis |
| GET | `/weather?city=` | Weather + farming tips |
| GET | `/market` / `/market/:commodity` | Market prices + trends |
| GET | `/schemes` / `/schemes/:id` | Government schemes |

### Marketplaces & Community
| Method | Endpoint | Description |
|--------|----------|------------|
| GET/POST | `/marketplace` | List / create listings |
| PUT/DELETE | `/marketplace/:id` | Update / delete listing |
| GET/POST | `/equipment` | List / create equipment |
| POST | `/equipment/rent` | Request rental |
| PUT | `/equipment/:id/status` | Change rental status |
| GET | `/equipment/rentals/mine` | My rentals (renter + owner) |
| GET/POST | `/community` | List / create posts |
| POST | `/community/:id/like` | Like post |
| POST | `/community/:id/comment` | Comment |
| DELETE | `/community/:id` | Delete post |

### Farm, Records & Analytics
| Method | Endpoint | Description |
|--------|----------|------------|
| GET/POST | `/farms` | Farms |
| GET/POST | `/farms/activities` | Farm activities |
| DELETE | `/farms/activities/:id` | Delete activity |
| GET/POST | `/farms/records` | Income/expense records |
| DELETE | `/farms/records/:id` | Delete record |
| GET | `/analytics` | Analytics dashboard |

### Profile & Admin
| Method | Endpoint | Description |
|--------|----------|------------|
| PUT | `/profile` | Update profile |
| PUT | `/profile/password` | Change password |
| GET | `/profile/settings` | Get settings |
| GET | `/admin/stats` | Admin stats |
| GET | `/admin/users` | List users |
| PUT | `/admin/users/:id/status` | Approve/revoke |
| PUT | `/admin/users/:id/role` | Set role |
| POST | `/admin/crops` | Add crop |
| PUT/DELETE | `/admin/crops/:id` | Update/delete crop |
| POST | `/admin/schemes` | Add scheme |
| DELETE | `/admin/schemes/:id` | Delete scheme |
| PUT | `/admin/posts/:id/moderation` | Moderate post |
| PUT | `/admin/listings/:id/moderation` | Moderate listing |
| GET | `/health` | Health check |

All responses share a consistent shape:
```json
{ "success": true, "message": "…", "data": { … } }
```
Errors use `{ "success": false, "message": "…", "details": { … } }`.

## 🔐 Authentication
- Send `Authorization: Bearer <token>` header on protected routes.
- Role-based authorization (`farmer` / `admin`) enforced per route.

---

## 🌍 Environment Variables

See `.env.example`:

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Backend port | `5000` |
| `API_URL` | Backend base URL | `http://localhost:5000/api` |
| `CLIENT_ORIGIN` | Allowed frontend origin (CORS) | `http://localhost:5173` |
| `DB_PATH` | SQLite file path (relative to server/) | `./db/krishimitra.sqlite` |
| `JWT_SECRET` | JWT signing secret | *(dev default)* |
| `JWT_EXPIRES_IN` | Token lifespan | `7d` |
| `AI_PROVIDER` | Leave empty for built-in mock engine | `` |
| `AI_API_KEY` | External AI API key (optional) | |
| `AI_BASE_URL` | External AI endpoint (optional) | |
| `WEATHER_API_KEY` | OpenWeatherMap key (optional; else simulated) | |
| `WEATHER_BASE_URL` | OpenWeatherMap base | `https://api.openweathermap.org/data/2.5` |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | Seed admin credentials | `admin@krishimitra.ai` / `Admin@123` |

---

## 🧠 AI Abstraction

All AI logic lives behind a single service layer in `server/services/aiEngine.js`. The default `mock-engine` provides:
- Rule-based **crop recommendation**
- **Soil analysis** (threshold-based)
- **Disease & pest** preliminary identification from a curated knowledge base
- **Chat** responses from a farm-focused knowledge base

To integrate a real LLM / vision provider, implement the driver in `aiEngine.js` and set `AI_PROVIDER`, `AI_API_KEY`, `AI_BASE_URL` in `.env`. No other code changes required.

---

## 🧹 Re-seed / Reset Database
Delete the DB file and restart the server to re-seed fresh sample data:
```bash
# stop server, then:
rm -f server/db/krishimitra.sqlite*
npm run server
```

---

## 🛠️ Scripts

| Command | Action |
|---------|--------|
| `npm run server` | Run backend |
| `npm --prefix client run dev` | Run frontend (dev) |
| `npm run build` | Build frontend for production |
| `npm run seed` | Seed database (idempotent) |

---

## ⚠️ Important Disclaimers
- **Disease / pest / crop / soil outputs** are AI-assisted and may be incorrect. Always verify with a qualified agricultural expert (e.g., Krishi Vigyan Kendra) before applying any treatment.
- **Market prices** shown are indicative seed/recorded data. Verify current rates with your local mandi.
- **Weather** is simulated when no API key is set — clearly labelled in the UI.
- **Scheme details** are from seeded well-known public programs; verify current requirements from official sources.

---

Built with ❤️ for farmers. 🌾


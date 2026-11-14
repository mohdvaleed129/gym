# BODY FLEX: Gym Management System

A full-stack web application for running a gym: a public marketing website plus a secure admin panel for managing members, membership plans, payments, due dates and automated WhatsApp fee reminders.

## Features

**Public website**
- Home, About, Membership plans, Trainers, Gallery and Contact pages
- Plans and gym branding are loaded live from the backend
- Public enquiry form

**Admin panel**
- Dashboard with key membership and collection stats
- Member management: add, edit, activate/deactivate, delete, extend due date
- Member photos: resized to 500×500 WebP and stored in MongoDB GridFS
- Payment recording (cash, UPI, other) with a void workflow; payments are never edited or deleted
- Due and overdue tracking, calculated on the backend
- Membership plan management
- Collection and member summary reports
- Notification log with retry for failed messages
- Audit log of admin actions
- Gym settings and reminder preferences

**Automation**
- Daily WhatsApp due-date reminders at 9:00 AM IST via MSG91
- Duplicate-safe sending, so a member gets one reminder per billing period
- Recurring billing: the cycle moves forward automatically after an unpaid due date
- Dry-run mode for safe testing

## Tech Stack

| Layer | Technologies |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS, React Router, Axios, Recharts, Lucide Icons |
| Backend | Node.js, Express, Mongoose |
| Database | MongoDB (with GridFS for photos) |
| Auth & Security | JWT (httpOnly cookie), bcrypt, Helmet, CORS, rate limiting, NoSQL injection sanitization |
| Messaging | MSG91 WhatsApp Business API |
| Scheduling | node-cron, GitHub Actions |

## Project Structure

~~~
.
├── .github/workflows/daily-reminders.yml   # Scheduled reminder job (9:00 AM IST)
├── backend/
│   ├── src/
│   │   ├── config/        # MongoDB and GridFS setup
│   │   ├── controllers/   # Request handlers
│   │   ├── jobs/          # Reminder scheduler
│   │   ├── middleware/    # Auth, error handling, photo upload
│   │   ├── models/        # Mongoose schemas
│   │   ├── routes/        # API routes
│   │   ├── services/      # Notification logic and WhatsApp provider
│   │   ├── utils/         # Billing, dates (IST), JWT, seed script
│   │   └── server.js
│   └── package.json
└── frontend/
    ├── src/
    │   ├── components/    ├── context/    ├── layouts/
    │   ├── pages/         # public/, admin/, auth/
    │   └── services/      # API client
    └── package.json
~~~

## Getting Started

### Prerequisites
- Node.js 18 or later (Node 22 is used in CI)
- A MongoDB database (local or MongoDB Atlas)

### 1. Clone

~~~bash
git clone https://github.com/mohdvaleed129/<repo-name>.git
cd <repo-name>
~~~

### 2. Backend

~~~bash
cd backend
npm install
~~~

Create `backend/.env`:

~~~env
PORT=
NODE_ENV=
MONGO_URI=
FRONTEND_URL=

JWT_SECRET=replace_with_a_long_random_string
JWT_EXPIRES_IN=7d
JWT_COOKIE_EXPIRES_DAYS=7

# First admin account (used by the seed script)
ADMIN_NAME=
ADMIN_EMAIL=
ADMIN_PASSWORD=

# Reminders
REMINDER_DRY_RUN=
CRON_SECRET=replace_with_a_random_secret
WHATSAPP_PROVIDER=
WHATSAPP_API_KEY=
WHATSAPP_INTEGRATED_NUMBER=
WHATSAPP_TEMPLATE_NAME=
~~~

Seed the admin, default plans and settings, then start the API:

~~~bash
npm run seed
npm run dev
~~~

The API runs at `http://localhost:5000`. Health check: `GET /api/health`.

### 3. Frontend

~~~bash
cd frontend
npm install
~~~

Optionally create `frontend/.env`:

~~~env
VITE_API_URL=http://localhost:5000/api
~~~

~~~bash
npm run dev
~~~

Open `http://localhost:5173`. The admin panel is at `/login`.

## WhatsApp Reminders

Reminders are sent through MSG91 using an approved WhatsApp template that takes the member's name as its only variable.

- **Safe by default:** `REMINDER_DRY_RUN` defaults to dry-run. Set it to `false` only when you want messages actually sent.
- **Scheduling options:**
  - Built-in `node-cron` job at 9:00 AM IST while the server is running
  - GitHub Actions workflow (`daily-reminders.yml`), also runnable manually from the Actions tab
  - Secured HTTP endpoint `GET /api/cron/daily-reminders` with the `x-cron-secret` header, for external cron services
- For GitHub Actions, add these repository secrets: `MONGO_URI`, `WHATSAPP_PROVIDER`, `WHATSAPP_API_KEY`, `WHATSAPP_INTEGRATED_NUMBER`, `WHATSAPP_TEMPLATE_NAME`.

## Security

- Passwords hashed with bcrypt (12 rounds)
- Account lockout for 15 minutes after 5 failed logins
- Login rate limit (20 per 15 min) and API rate limit (300 per 15 min)
- httpOnly, `secure` (in production), `sameSite` cookies
- Helmet headers, CORS limited to `FRONTEND_URL`, MongoDB operator sanitization
- Image uploads limited to JPG, PNG and WEBP up to 2 MB
- Voided payments keep a full audit trail; billing status is always computed on the server
- Secrets are read only from environment variables and `.env` is git-ignored

## Deployment Notes

- Set `NODE_ENV=production`, a strong `JWT_SECRET` and the real `FRONTEND_URL`.
- Change the seeded admin password after first login.
- Set `VITE_API_URL` to your deployed API URL before building the frontend (`npm run build`).

## Documentation

See [`backend/README.md`](backend/README.md) for the API reference and billing logic.

## Author

**Mohd Valeed**
- GitHub: [@mohdvaleed129](https://github.com/mohdvaleed129)
- LinkedIn: [mohd-valeed-hasan](https://linkedin.com/in/mohd-valeed-hasan)

## License

Add a license of your choice, or keep the project private if it is client work.

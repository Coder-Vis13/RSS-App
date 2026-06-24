# ReadArchive

A full-stack RSS reader that brings websites, blogs, podcasts, and YouTube channels into a single personalized feed. ReadArchive automatically discovers feeds, keeps content up to date, and helps users organize everything they follow with folders, AI-powered categorization, saved articles, and read history.

**Live Demo:** *Add deployed frontend URL*

---

## Features

* Discover and follow RSS feeds, blogs, podcasts, and YouTube channels
* Automatic feed discovery from website URLs
* AI-powered article categorization
* Personalized home feed with automatic updates
* Organize sources into folders
* Save articles for later
* Track reading history
* JWT authentication with secure refresh tokens
* Modern interface built with React

---

## Tech Stack

**Frontend**

* React
* TypeScript
* Vite
* Tailwind CSS
* React Router
* Axios

**Backend**

* Node.js
* Express
* TypeScript

**Database**

* PostgreSQL (Neon)

**Deployment**

* Vercel
* Render

---

## Architecture

```
React (Vercel)
        │
        ▼
Express API (Render)
        │
        ▼
PostgreSQL (Neon)
```

The frontend communicates with a REST API hosted on Render. The backend authenticates users, manages feed ingestion, schedules background updates, and persists data in a PostgreSQL database hosted on Neon.

---

## Screenshots

| Landing Page     | Feed             |
| ---------------- | ---------------- |
| *Add screenshot* | *Add screenshot* |

---

## Getting Started

```bash
git clone https://github.com/Coder-Vis13/RSS-App.git
```

```bash
cd Frontend
npm install
npm run dev
```

In a separate terminal:

```bash
cd Backend
npm install
npm run dev
```

Create `.env` files for both the frontend and backend before running the application.

---

## Future Improvements

* Full-text search
* Offline reading support
* Feed recommendations
* OPML import/export
* Mobile application

---

Designed and developed by **Vismaya Gowda**.

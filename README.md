# ⚡ KINETIC — Gym Management Platform

<div align="center">

![KINETIC](https://img.shields.io/badge/KINETIC-Gym%20Management%20Platform-ccff00?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyIDJMMTMuMDkgOC4yNkwyMCA5TDEzLjA5IDE1Ljc0TDEyIDIyTDEwLjkxIDE1Ljc0TDQgOUwxMC45MSA4LjI2TDEyIDJaIiBmaWxsPSIjY2NmZjAwIi8+Cjwvc3ZnPgo=)

[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react)](https://reactjs.org/)
[![Convex](https://img.shields.io/badge/Convex-Backend-DC143C?style=for-the-badge)](https://convex.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)

*A modern, full-stack gym management platform with QR check-ins, membership tracking, and member portals*

[🎯 Features](#-features) • [🚀 Quick Start](#-quick-start) • [📖 Documentation](#-documentation) • [🛠️ Tech Stack](#️-tech-stack)

</div>

---

## 🎯 Features

### 🏋️ **Gym Operations**
- **QR Check-ins** - Camera-based and manual member check-in with real-time validation
- **Member Management** - Full member directory with search, profiles, and history
- **Membership Plans** - Create and manage monthly, quarterly, semi-annual, and annual plans
- **Invitation System** - Generate invitation codes for new member onboarding

### 👥 **Member Portal**
- **Personal Dashboard** - View membership status, check-in history, and daily motivation
- **QR Code Access** - Unique QR code for quick gym entry
- **Workout Plans** - View assigned workout schedules from coaches
- **Meal Plans** - Track daily meals and nutritional targets

### 📊 **Analytics & Reports**
- **Revenue Tracking** - Payment history and revenue metrics
- **Member Analytics** - Active rates, retention, and member breakdowns
- **Visit Logs** - Real-time check-in feed with member details
- **Expiry Alerts** - Automated notifications for expiring memberships

### 🔧 **Admin Tools**
- **Role-based Access** - Gym staff and member portals with separate views
- **Notification Center** - System-wide alerts for membership events
- **Dark/Light Theme** - Full theme support across all pages
- **Responsive Design** - Mobile-first layout with adaptive navigation

---

## 🚀 Quick Start

### Prerequisites
- **Node.js** 18.x or 20.x
- **Bun** or **npm**
- **Convex** account (free tier available)

### 📦 Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd gym

# Install dependencies
npm install

# Start Convex development server
npm run dev:convex

# Start frontend (in another terminal)
npm run dev
```

The app will be available at `http://localhost:5173`

### 🌍 Environment Configuration

Create a `.env.local` file:

```env
VITE_CONVEX_URL=https://<your-deployment>.convex.cloud
```

Your Convex deployment URL is shown when you run `npm run dev:convex`.

---

## 🛠️ Tech Stack

<div align="center">

### Frontend
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react)](https://reactjs.org/)
[![React Router](https://img.shields.io/badge/React_Router-7-CA4245?style=flat-square&logo=react-router)](https://reactrouter.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-38B2AC?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)
[![Framer Motion](https://img.shields.io/badge/Framer_Motion-12-0055FF?style=flat-square&logo=framer)](https://www.framer.com/motion/)
[![Lucide](https://img.shields.io/badge/Lucide_Icons-0.572-F56565?style=flat-square)](https://lucide.dev/)

### Backend
[![Convex](https://img.shields.io/badge/Convex-Realtime-FF6B6B?style=flat-square)](https://convex.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)

### Testing & Quality
[![Vitest](https://img.shields.io/badge/Vitest-4-6E9F18?style=flat-square&logo=vitest)](https://vitest.dev/)
[![ESLint](https://img.shields.io/badge/ESLint-9-4B32C3?style=flat-square&logo=eslint)](https://eslint.org/)

### Deployment
[![Vercel](https://img.shields.io/badge/Vercel-Deployment-000000?style=flat-square&logo=vercel)](https://vercel.com/)

</div>

---

## 📖 Documentation

### 🏗️ Project Structure

```
📦 KINETIC Gym
├── 🎨 src/                   # React Frontend
│   ├──  components/         # Reusable UI components
│   ├──  pages/              # Page components
│   │   ├──  dashboard/      # Gym & member dashboards
│   │   ├──  auth/           # Authentication pages
│   │   └──  ...             # Feature pages
│   ├──  lib/                # Hooks, utilities, context
│   └──  test/               # Test setup
└── ⚡ convex/               # Convex Backend
    ├──  schema.ts           # Database schema
    ├──  auth.ts             # Authentication logic
    ├──  members.ts          # Member CRUD & stats
    ├──  memberships.ts      # Membership management
    ├──  checkIns.ts         # QR check-in system
    ├──  notifications.ts    # Notification engine
    ├──  invitations.ts      # Invitation code system
    └──  lib/                # Shared utilities
```

### 🔑 Key Features Implementation

- **Authentication**: Role-based auth (gym staff / member) with session tokens
- **QR Check-in**: Camera-based scanning with qr-scanner + BarcodeDetector API
- **Membership Management**: Plan types, expiry tracking, auto-notifications
- **Real-time Updates**: Convex reactive queries for live data
- **Responsive Design**: Mobile-first with adaptive layouts
- **Dark/Light Theme**: Persistent theme preference with CSS variables
- **Brutalist UI**: High-contrast design language with strong borders and typography

---

## 🧪 Testing

```bash
# Run tests
npm run test

# Watch mode
npm run test:watch
```

---

## 🔧 Linting

```bash
npm run lint
```

---

<div align="center">

**Made with ⚡**

</div>

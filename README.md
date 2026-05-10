# 🚀 CodeMentor AI — AI-Powered Code Review & Mentor Platform

> Paste your code, get instant AI reviews — bugs, security issues, performance scores, and best practices — in a beautiful, structured format.

![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)
![Express](https://img.shields.io/badge/Express-4-green?logo=express)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-brightgreen?logo=mongodb)
![Groq](https://img.shields.io/badge/Groq-AI-blue)

---

## 🏗️ Architecture

```text
┌────────────────────────────────────────────────────────┐
│                  Next.js 14 Frontend                   │
│  ┌──────────┐ ┌──────────┐ ┌───────────────────────┐   │
│  │  Landing │ │Dashboard │ │ Code Playground       │   │
│  │  Page    │ │  + Stats │ │ (Editor + Terminal +  │   │
│  └──────────┘ └──────────┘ │  AI Mentor Chat)      │   │
│  ┌──────────────────┐ ┌────┴───────────────────┐   │   │
│  │ Review Results   │ │ Share Public Link      │   │   │
│  │ + Score Card     │ │ (Twitter/LinkedIn)     │   │   │
│  └──────────────────┘ └────────────────────────┘   │   │
└────────────────────┬───────────────────────────────┘
                     │ REST API / WebSockets
┌────────────────────▼───────────────────────────────┐
│              Express.js Backend                    │
│  ┌──────────┐ ┌──────────┐ ┌───────────────────┐   │
│  │  GitHub  │ │  Review  │ │ Groq AI Service   │   │
│  │  OAuth   │ │  CRUD    │ │ (Review/Mentor)   │   │
│  └──────────┘ └──────────┘ └───────────────────┘   │
│  ┌─────────────────────────────────────────────┐   │
│  │  WebSocket Server (Interactive Terminal)    │   │
│  └─────────────────────────────────────────────┘   │
└────────────────────┬────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────┐
│              MongoDB Atlas                       │
│  ┌──────────────┐  ┌────────────────────────┐    │
│  │  Users        │  │  Reviews (code, scores,│    │
│  │  (GitHub Auth)│  │   issues, shareId)     │    │
│  └──────────────┘  └────────────────────────┘    │
└──────────────────────────────────────────────────┘
```

## ✨ Features

- **🤖 AI Code Review** — Groq AI (Llama 3.3 70B) analyzes your code instantly
- **🎓 AI Code Mentor** — Chat with an AI mentor for logic guidance and debugging help
- **💻 Code Playground** — Write, run, and chat in a unified split-pane interface
- **🖥️ Interactive Terminal** — Real-time code execution with WebSockets and xterm.js
- **📊 Code Score Card** — Quality, Security, Performance, Best Practices (0-100) + Overall Grade
- **🐛 Issue Cards** — Bugs with severity badges (Critical 🔴 / Warning 🟡 / Info 🔵)
- **📝 VS Code Editor** — Monaco Editor with syntax highlighting for 20+ languages
- **🔐 GitHub OAuth** — Sign in with GitHub, track your review history
- **📈 Dashboard** — View all past reviews, stats, and scores at a glance
- **🔗 Shareable Links** — Every review gets a public link for LinkedIn/Twitter
- **🌙 Dark Theme** — Premium dark UI with glassmorphism effects

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14 (App Router) |
| Code Editor | Monaco Editor |
| Terminal | xterm.js + WebSockets |
| Backend | Node.js + Express.js + Socket.io |
| AI Engine | Groq API (Llama 3.3 70B) |
| Database | MongoDB Atlas + Mongoose |
| Auth | GitHub OAuth 2.0 + JWT |
| Styling | Vanilla CSS (Dark theme) |

## 🚀 Quick Setup

### Prerequisites
- Node.js 18+
- MongoDB Atlas account
- GitHub OAuth App
- Groq API key (free at [console.groq.com](https://console.groq.com))

### 1. Clone & Install

```bash
git clone https://github.com/kamranabbasi3404/AI-Powered-Code-Review-Mentor-Platform.git
cd AI-Powered-Code-Review-Mentor-Platform

# Install server dependencies
cd server && npm install

# Install client dependencies
cd ../client && npm install --ignore-scripts
```

### 2. Environment Variables

Create `server/.env`:
```env
PORT=5000
MONGODB_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/codementor
JWT_SECRET=your-secret-key
GROQ_API_KEY=gsk_your-key
GITHUB_CLIENT_ID=your-client-id
GITHUB_CLIENT_SECRET=your-client-secret
GITHUB_CALLBACK_URL=http://localhost:5000/api/auth/github/callback
FRONTEND_URL=http://localhost:3000
```

Create `client/.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Run

```bash
# Terminal 1 — Server
cd server && npm run dev

# Terminal 2 — Client
cd client && npm run dev
```

Open [http://localhost:3000](http://localhost:3000) 🎉

## 📁 Project Structure

```
├── client/                  # Next.js 14 Frontend
│   ├── app/
│   │   ├── page.js          # Landing page
│   │   ├── dashboard/       # User dashboard
│   │   ├── playground/      # Interactive Code Playground
│   │   ├── review/new/      # Code editor + review
│   │   ├── review/[id]/     # Review results
│   │   └── review/shared/   # Public shared reviews
│   ├── components/          # Reusable UI components
│   ├── context/             # Auth context
│   └── lib/                 # API helpers
├── server/                  # Express.js Backend
│   ├── config/              # DB connection
│   ├── middleware/           # JWT auth
│   ├── models/              # Mongoose schemas
│   ├── routes/              # API routes
│   ├── services/            # Groq AI service
│   ├── socket/              # WebSocket logic for terminal
│   └── server.js            # Main entry point
└── README.md
```

## 📝 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/auth/github` | Get GitHub OAuth URL |
| GET | `/api/auth/github/callback` | OAuth callback |
| GET | `/api/auth/me` | Get current user |
| POST | `/api/reviews` | Create new review |
| GET | `/api/reviews` | Get user reviews |
| GET | `/api/reviews/:id` | Get single review |
| GET | `/api/reviews/share/:shareId` | Get public review |
| DELETE | `/api/reviews/:id` | Delete review |
| GET | `/api/users/stats` | Get dashboard stats |

## 📄 License

MIT License

---

Built with ❤️ by [Kamran Abbasi](https://github.com/kamranabbasi3404)

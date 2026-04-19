# ⚡ NexusChat — AI-Powered Real-Time Chat Application

A production-ready, full-stack chat application with 16+ advanced features including AI assistant, sentiment analysis, voice messages, real-time translation, and more.

---

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite + Tailwind CSS + Framer Motion |
| Backend | Node.js + Express.js |
| Database | MongoDB (Mongoose) |
| Real-time | Socket.io |
| Auth | JWT + bcrypt |
| AI | GorkAPI (OpenAI-compatible API) |
| File Storage | Cloudinary |
| State Mgmt | Zustand |

---

## ✨ Features

### Core
- 🔐 JWT Authentication (register, login, protected routes)
- 💬 Real-time one-to-one & group messaging (Socket.io)
- 👥 Online/offline status + last seen timestamps
- ⌨️  Live typing indicators
- 📨 Read receipts with double-check marks

### AI Features (requires `GORKAPI_BASE_URL`)
- 🤖 **AI Chat Assistant** — In-app GPT-powered chatbot
- 📝 **Chat Summarizer** — Summarize long conversations to key points
- 😊 **Sentiment Analysis** — Auto-detect message mood (positive/neutral/negative)
- 💡 **Smart Reply Suggestions** — Gmail-style auto-reply hints
- 🌐 **Real-time Translation** — Translate any message to your language

### Media & Files
- 🎤 **Voice Messages** — Record and send audio; in-chat playback
- 🖼️ **Image Sharing** — Upload & preview images inline
- 📎 **File Sharing** — Send any file up to 25MB
- ☁️ Cloudinary CDN storage

### UX
- 🌗 **5 Themes** — Dark, Light, Ocean, Forest, Sunset
- 🔍 **Message Search** — Full-text search across conversations
- 📌 **Pin Messages** — Pin important messages in any chat
- ⭐ **Star Messages** — Save messages to your starred list
- 🔔 **Browser Notifications** — Push notifications when backgrounded
- 😄 **Emoji Reactions** — React to any message with 6 emojis
- 👥 **Group Chats** — Create groups, add/remove members
- 💻 Fully responsive (mobile + desktop)

---

## 📁 Project Structure

```
nexuschat/
├── client/                     # React + Vite frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── auth/
│   │   │   │   └── ProtectedRoute.jsx
│   │   │   ├── chat/
│   │   │   │   ├── AIPanel.jsx           # AI chatbot panel
│   │   │   │   ├── ChatWindow.jsx        # Main chat view
│   │   │   │   ├── CreateGroupModal.jsx  # Group creation
│   │   │   │   ├── MessageBubble.jsx     # Individual message
│   │   │   │   ├── MessageInput.jsx      # Text/file/voice input
│   │   │   │   ├── NewConversationModal.jsx
│   │   │   │   ├── SearchModal.jsx
│   │   │   │   ├── Sidebar.jsx           # Left nav panel
│   │   │   │   └── SummaryModal.jsx
│   │   │   └── ui/
│   │   │       └── ThemeSwitcher.jsx
│   │   ├── hooks/
│   │   │   ├── useSocket.js              # Socket event wiring
│   │   │   └── useTyping.js              # Debounced typing
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx             # Main app layout
│   │   │   ├── Login.jsx
│   │   │   └── Register.jsx
│   │   ├── services/
│   │   │   ├── api.js                    # Axios + all API calls
│   │   │   └── socket.js                 # Socket.io singleton
│   │   ├── store/
│   │   │   ├── authStore.js              # Zustand auth state
│   │   │   ├── chatStore.js              # Conversations + messages
│   │   │   └── themeStore.js             # Theme management
│   │   ├── App.jsx
│   │   ├── index.css                     # Global styles + CSS vars
│   │   └── main.jsx
│   ├── .env.example
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.js
│
└── server/                     # Node.js + Express backend
    ├── src/
    │   ├── config/
    │   │   ├── cloudinary.js     # Multer-Cloudinary setup
    │   │   └── db.js             # MongoDB connection
    │   ├── controllers/
    │   │   ├── aiController.js   # GorkAPI endpoints
    │   │   ├── authController.js
    │   │   ├── conversationController.js
    │   │   ├── messageController.js
    │   │   └── userController.js
    │   ├── middleware/
    │   │   └── auth.js           # JWT protect + socketAuth
    │   ├── models/
    │   │   ├── Conversation.js
    │   │   ├── Message.js
    │   │   └── User.js
    │   ├── routes/
    │   │   ├── ai.js
    │   │   ├── auth.js
    │   │   ├── conversations.js
    │   │   ├── messages.js
    │   │   └── users.js
    │   ├── socket/
    │   │   └── socketHandler.js  # All Socket.io events
    │   └── server.js             # Express app entry point
    ├── .env.example
    └── package.json
```

---

## 🚀 Local Development Setup

### Prerequisites
- Node.js >= 18
- MongoDB Atlas account (free tier works)
- GorkAPI instance running locally or remotely (optional, for AI features)
- Cloudinary account (optional, for file uploads)

### Step 1 — Clone & Install

```bash
git clone https://github.com/your-username/nexuschat.git
cd nexuschat

# Install all dependencies
npm run install:all
```

### Step 2 — Configure Environment Variables

**Backend** (`server/.env`):
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb+srv://<user>:<pass>@cluster0.xxxxx.mongodb.net/nexuschat
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
JWT_EXPIRE=7d
CLIENT_URL=http://localhost:5173

# Optional but recommended for full features:
GORKAPI_BASE_URL=http://localhost:8000/v1
CLOUDINARY_CLOUD_NAME=your-cloud
CLOUDINARY_API_KEY=your-key
CLOUDINARY_API_SECRET=your-secret
```

**Frontend** (`client/.env`):
```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
VITE_APP_NAME=NexusChat
```

### Step 3 — Run Development Servers

```bash
# Option A: Both together
npm run dev

# Option B: Separately
npm run dev:server   # Backend on :5000
npm run dev:client   # Frontend on :5173
```

Open `http://localhost:5173` in your browser.

---

## 🌍 Production Deployment

### Step 1 — MongoDB Atlas

1. Go to [mongodb.com/atlas](https://www.mongodb.com/atlas) → Create free cluster
2. **Database Access** → Add user with password
3. **Network Access** → Add `0.0.0.0/0` (allow all) or your server IP
4. **Connect** → Get connection string, replace `<password>` placeholder

### Step 2 — Cloudinary (File Uploads)

1. Sign up at [cloudinary.com](https://cloudinary.com)
2. Dashboard → Copy `Cloud Name`, `API Key`, `API Secret`
3. Add to server `.env`

### Step 3 — GorkAPI (AI Features)

1. Set up GorkAPI locally or use a remote instance
   - Local: `http://localhost:8000/v1`
   - Remote: `https://your-gorkapi-instance/v1`
2. Add `GORKAPI_BASE_URL=http://localhost:8000/v1` to server `.env`
3. (Optional) If your GorkAPI instance requires authentication, add `GORKAPI_API_KEY=your-key`
   > ⚠️ Without GORKAPI_BASE_URL configured, AI features will fall back to simple built-in logic

### Step 4 — Deploy Backend to Render

1. Push code to GitHub
2. Go to [render.com](https://render.com) → New → Web Service
3. Connect your GitHub repo
4. Configure:
   - **Root Directory**: `server`
   - **Build Command**: `npm install`
   - **Start Command**: `node src/server.js`
   - **Environment**: Node
5. Add all environment variables from `server/.env`
6. Deploy → Copy your Render URL (e.g. `https://nexuschat-api.onrender.com`)

   > Alternatively, use the `render.yaml` in the root for one-click deploy.

### Step 5 — Deploy Frontend to Vercel

1. Go to [vercel.com](https://vercel.com) → New Project
2. Import your GitHub repo
3. Configure:
   - **Root Directory**: `client`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Add environment variables:
   ```
   VITE_API_URL=https://your-render-url.onrender.com/api
   VITE_SOCKET_URL=https://your-render-url.onrender.com
   ```
5. Deploy → Get your Vercel URL

### Step 6 — Update CORS

In your Render service, update:
```
CLIENT_URL=https://your-app.vercel.app
```

---

## 📡 API Reference

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/me` | Get current user |
| PUT | `/api/auth/profile` | Update profile |
| POST | `/api/auth/logout` | Logout |

### Users
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users` | Get all users |
| GET | `/api/users/search?q=` | Search users |
| GET | `/api/users/:id` | Get user by ID |
| POST | `/api/users/star/:msgId` | Star a message |
| GET | `/api/users/starred` | Get starred messages |

### Conversations
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/conversations` | Get all conversations |
| POST | `/api/conversations/dm` | Get or create DM |
| POST | `/api/conversations/group` | Create group |
| POST | `/api/conversations/:id/add-member` | Add member |
| DELETE | `/api/conversations/:id/remove-member/:uid` | Remove member |

### Messages
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/messages/:convId` | Get messages (paginated) |
| POST | `/api/messages` | Send message (supports file upload) |
| DELETE | `/api/messages/:id` | Delete message |
| GET | `/api/messages/search?q=` | Search messages |
| POST | `/api/messages/:id/pin` | Toggle pin |
| POST | `/api/messages/:id/react` | Add reaction |

### AI
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/ai/chat` | Chat with AI assistant |
| POST | `/api/ai/summarize` | Summarize conversation |
| POST | `/api/ai/sentiment` | Analyze sentiment |
| POST | `/api/ai/suggestions` | Get smart reply suggestions |
| POST | `/api/ai/translate` | Translate message |

---

## 🔌 Socket.io Events

### Client → Server
| Event | Payload | Description |
|-------|---------|-------------|
| `message:send` | `{conversationId, content, type, tempId}` | Send text message |
| `message:file` | `{conversationId, messageId}` | Notify file sent |
| `message:delete` | `{messageId, conversationId}` | Delete message |
| `message:react` | `{messageId, conversationId, emoji}` | React to message |
| `typing:start` | `{conversationId}` | Started typing |
| `typing:stop` | `{conversationId}` | Stopped typing |
| `messages:read` | `{conversationId}` | Mark messages read |

### Server → Client
| Event | Payload | Description |
|-------|---------|-------------|
| `message:new` | `Message` | New message received |
| `message:deleted` | `{messageId}` | Message was deleted |
| `message:reacted` | `{messageId, reactions}` | Reaction updated |
| `typing:start` | `{userId, username, conversationId}` | User typing |
| `typing:stop` | `{userId, conversationId}` | User stopped |
| `user:status` | `{userId, isOnline, lastSeen}` | Online status change |
| `notification:message` | `{conversationId, sender, content}` | Push notification |

---

## 🔐 Security

- Passwords hashed with **bcrypt** (12 rounds)
- **JWT** tokens with configurable expiry
- **Helmet.js** HTTP headers
- **Rate limiting** (200 req/15min general, 10/15min for auth)
- **CORS** whitelist with origin validation
- Input validation via **express-validator**
- File type + size validation on uploads
- Socket.io authentication middleware

---

## 🛠️ Customization

### Add a New Theme
In `client/src/index.css`:
```css
[data-theme='mytheme'] {
  --bg-primary: #0a0a0a;
  --accent: #ff6b6b;
  /* ... all other vars */
}
```
Then add `'mytheme'` to the `themes` array in `themeStore.js` and update `ThemeSwitcher.jsx`.

### Change AI Model
In `server/src/controllers/aiController.js`, change:
```js
model: 'gpt-3.5-turbo'  // → 'gpt-4o', 'gpt-4-turbo', etc.
```

---

## 📝 License

MIT License — use freely for personal and commercial projects.

---

Built with ❤️ using React, Node.js, Socket.io, and GorkAPI
#   n e x u c h a t  
 #   n e x u c h a t  
 
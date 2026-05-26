# ✨ Glassmorphic Real-Time Social Media Application ✨

A premium, highly interactive, and visually stunning real-time social media application featuring a state-of-the-art **glassmorphic design system**, custom user authentication, interactive feed (with posts, likes, and comments), and a real-time messaging interface.

---

## 🎨 Design & Aesthetic Highlights

- **Frosted Glassmorphism**: Built with advanced CSS backdrop-filter blur effects, subtle transparent borders, and harmonious pastel glow backdrops.
- **Micro-animations**: Smooth fluid transitions, interactive hover scaling, and active-state feedback.
- **Premium Typography**: Uses the gorgeous **Outfit** and **Inter** font families via Google Fonts.
- **Dark Mode Accentuation**: Curated deep HSL background color palette with rich neon/pastel gradients.

---

## 🚀 Key Features

### 🔐 1. Custom User Authentication
- **Secure Register & Login**: Built entirely with usernames and passwords (no email required).
- **Interactive Profiles**: Allows users to customize their profile descriptions and upload avatar images.
- **Session Continuity**: Handles state smoothly on both the frontend and backend.

### 📝 2. Dynamic Social Feed
- **Create Posts**: Write captions and upload pictures to share with other users.
- **Interactions**: Like posts instantly and write comments within an integrated glassmorphic drawer.
- **Fluid Layout**: Fully responsive feed adapting beautifully to desktop, tablet, and mobile displays.

### 💬 3. Real-Time Chat Section
- **Direct Messaging**: Click on any user from the active user directory to initiate a chat.
- **Real-Time Delivery**: Messages synchronize instantly, powered by a robust server-client architecture.
- **Premium Chat Interface**: Chat bubbles with glassmorphic styling, smooth scroll anchoring, and quick messaging controls.

---

## 🛠️ Technology Stack

| Layer | Technologies Used |
|---|---|
| **Frontend** | React, Vite, CSS (Vanilla Custom Styles), Socket.io-client |
| **Backend** | Node.js, Express, Socket.io, Mongoose |
| **Database** | MongoDB (Local database at `mongodb://localhost:27017`) |
| **Utilities** | Concurrently, Dotenv, Cors, Bcrypt |

---

## 📦 Project Directory Structure

```text
SocialMedia/
├── .gitignore               # Root git ignore definitions
├── package.json             # Workspace runner scripts
├── backend/                 # Node.js + Express + Socket.io Server
│   ├── src/
│   │   ├── config/          # DB connection configurations
│   │   ├── controllers/     # Auth, Post, and Message business logic
│   │   ├── models/          # MongoDB schemas (User, Post, Message)
│   │   ├── routes/          # Express route definitions
│   │   └── index.js         # Backend Entrypoint & Socket.io server
│   └── package.json
└── Social Media/            # React + Vite Frontend App
    ├── src/
    │   ├── components/      # UI Components (Auth, Feed, Chat, Sidebar, RightPanel)
    │   ├── App.jsx          # Main application router and state
    │   ├── index.css        # Global CSS design tokens
    │   └── main.jsx
    └── package.json
```

---

## ⚙️ Installation & Running Locally

### 1. Prerequisites
- **Node.js** (v16.x or higher recommended)
- **MongoDB** running locally at `mongodb://localhost:27017`

### 2. Quick Start (Concurrently)
You can set up and run both the frontend and backend simultaneously using the root workspace scripts:

1. **Clone the repository:**
   ```bash
   git clone https://github.com/VURE-SATHVIK-22/SocialMedia.git
   cd SocialMedia
   ```

2. **Install all dependencies** (for root, frontend, and backend):
   ```bash
   npm run install-all
   ```

3. **Run the developer servers concurrently:**
   ```bash
   npm run dev
   ```
   - The frontend will open at `http://localhost:5173`
   - The backend will start on `http://localhost:5000`

---

## 📄 License
This project is open-source and available under the MIT License.
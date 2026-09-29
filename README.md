# Circle — Social Network Platform

A full-featured social networking web app built with the MERN stack (MongoDB, Express, React, Node.js) and Socket.IO for real-time updates. Built as part of Arch Technologies' Web Development internship (Month 2, Task 4).

## Features

- **Authentication** — register and log in with a JWT-secured session
- **Profiles** — profile photo, cover photo, bio, and privacy settings (public or friends-only)
- **Posts** — share text, photos, and videos to a news feed
- **Likes & comments** — react to and discuss posts in real time
- **Save & share** — bookmark posts to revisit later, or share a post directly to a friend's chat
- **Friends** — send, accept, and decline friend requests; see mutual-friend suggestions
- **Real-time chat** — one-on-one messaging over WebSockets (Socket.IO)
- **Stories** — photo/video stories that disappear after 24 hours
- **Videos page** — a dedicated feed of video posts
- **Notifications** — live alerts for likes, comments, and friend requests
- **Responsive design** — works on desktop and mobile

## Tech stack

| Layer      | Technology |
|------------|------------|
| Frontend   | React (Vite), React Router |
| Backend    | Node.js, Express |
| Database   | MongoDB (Mongoose) with MongoDB Atlas |
| Real-time  | Socket.IO |
| Auth       | JWT + bcrypt |
| File uploads | Multer |

## Project structure

```
social-network/
├── client/                # React frontend
│   └── src/
│       ├── components/    # Reusable UI (PostCard, Stories, Chat widgets, etc.)
│       ├── pages/         # Feed, Profile, Friends, Chat, Videos, Saved, Settings
│       ├── App.jsx        # Routes and app shell
│       └── AuthContext.jsx
└── server/                # Express backend
    ├── models/            # Mongoose schemas (User, Post, Comment, Message, Story, ...)
    ├── routes/            # REST API endpoints
    ├── middleware/         # Auth and file-upload middleware
    ├── socket.js           # Socket.IO setup for real-time events
    └── server.js           # App entry point
```

## Getting started

### Prerequisites
- Node.js 18+
- A MongoDB connection string (local MongoDB or a free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster)

### 1. Backend setup
```bash
cd server
npm install
cp .env.example .env   # then fill in MONGO_URI and JWT_SECRET
npm run dev
```
Server runs on `http://localhost:5000`.

### 2. Frontend setup
```bash
cd client
npm install
npm run dev
```
Client runs on `http://localhost:5173`.

Open `http://localhost:5173` in your browser to use the app.

### Optional: demo data
To populate the app with sample users, posts, and friend requests for screenshots or testing:
```bash
cd server
node seed.js          # add demo data
node seed.js remove   # remove it later
```

## Environment variables

`server/.env` (create from `.env.example`):
```
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=a_long_random_string
CLIENT_URL=http://localhost:5173
```

**Never commit `.env` or share it publicly** — it contains database credentials.

## How real-time works

Each logged-in user joins a private Socket.IO room named after their user ID. When someone likes a post, comments, sends a friend request, or sends a chat message, the server saves the change to MongoDB and emits an event directly to the relevant user's room — so updates appear instantly without a page refresh.

## Author

**Esha Eman** — Web Development Intern, Arch Technologies

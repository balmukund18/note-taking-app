# 📝 Note-Taking App

A full-stack note-taking application with secure authentication and note management.

## 🚀 Features

- **Authentication**: Email/OTP verification + Google OAuth
- **Notes**: Create, read, update, delete notes
- **Security**: JWT with HTTP-only cookies, rate limiting
- **Responsive**: Works on desktop, tablet, mobile

## 🛠️ Tech Stack

**Frontend**: React, TypeScript, Vite, Tailwind CSS  
**Backend**: Node.js, Express, TypeScript, MongoDB  
**Auth**: JWT, Google OAuth 2.0, Nodemailer  
**Deployment**: Vercel

## 🔧 Installation

### 1. Clone Repository
```bash
git clone https://github.com/balmukund18/note-taking-app.git
cd note-taking-app
```

### 2. Backend Setup
```bash
cd backend
npm install
```

Create `.env` file:
```env
PORT=3001
MONGODB_URI=your-mongodb-connection-string
JWT_SECRET=your-jwt-secret-32-chars-min
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-gmail-app-password
FRONTEND_URL=http://localhost:5173
```

### 3. Frontend Setup
```bash
cd ../frontend
npm install
```

Create `.env` file:
```env
VITE_API_URL=http://localhost:3001/api
VITE_GOOGLE_CLIENT_ID=your-google-client-id
```

### 4. Run Application
```bash
# Terminal 1 - Backend
cd backend && npm run dev

# Terminal 2 - Frontend
cd frontend && npm run dev
```

- Frontend: http://localhost:5173
- Backend: http://localhost:3001

## 📋 API Endpoints

### Authentication
- `POST /api/auth/signup` - Register with email
- `POST /api/auth/signin` - Login with email
- `POST /api/auth/google-signup` - Register with Google
- `POST /api/auth/google-login` - Login with Google
- `POST /api/auth/verify-otp` - Verify OTP
- `POST /api/auth/resend-otp` - Resend OTP
- `POST /api/auth/logout` - Logout

### Notes
- `GET /api/notes` - Get all notes
- `POST /api/notes` - Create note
- `PUT /api/notes/:id` - Update note
- `DELETE /api/notes/:id` - Delete note

## 🚀 Deployment

### Vercel (Recommended)

1. Push code to GitHub
2. Import project to Vercel
3. Deploy backend and frontend separately
4. Add environment variables in Vercel dashboard

[![Deploy Backend](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/balmukund18/note-taking-app&project-name=note-taking-backend&root-directory=backend)
[![Deploy Frontend](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/balmukund18/note-taking-app&project-name=note-taking-frontend&root-directory=frontend)

## 📄 License

MIT License

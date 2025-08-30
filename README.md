# 📝 Note-Taking App

A full-stack note-taking application built with React, TypeScript, Node.js, and MongoDB. Features secure authentication with Google OAuth, OTP verification, and a responsive design with custom branding.

## 🚀 Features

- **Secure Authentication**: Email/password signup, Google OAuth, OTP verification
- **Note Management**: Create, read, update, delete notes with rich text support
- **Responsive Design**: Mobile-first design optimized for all devices
- **Real-time Validation**: Form validation with proper error handling
- **Rate Limiting**: Protection against spam and abuse
- **Custom Branding**: Animated logo integration across all pages
- **User Isolation**: Secure per-user data access
- **Search & Filter**: Full-text search with organization features

## 🛠️ Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for styling
- **React Router** for navigation
- **React Hot Toast** for notifications
- **Axios** for API calls

### Backend
- **Node.js** with Express.js
- **TypeScript** for type safety
- **MongoDB** with Mongoose ODM
- **JWT** for authentication
- **Google OAuth 2.0** for social login
- **Nodemailer** for email services
- **Express Rate Limit** for API protection
- **bcryptjs** for password hashing

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v16 or higher) - [Download here](https://nodejs.org/)
- **npm** or **yarn** package manager
- **MongoDB Atlas** account - [Sign up here](https://www.mongodb.com/cloud/atlas)
- **Google Cloud Console** account for OAuth setup
- **Email service** (Gmail with App Password recommended)

## 🔧 Installation & Setup

### 1. Clone the Repository

```bash
git clone <your-repository-url>
cd note-taking-app
```

### 2. Backend Setup

```bash
cd backend
npm install
```

#### Environment Configuration

Create a `.env` file in the backend directory:

```env
# Server Configuration
PORT=3001
NODE_ENV=development

# MongoDB Configuration
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<database>?retryWrites=true&w=majority

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRES_IN=7d

# Google OAuth Configuration
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Email Configuration (Gmail recommended)
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-specific-password

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:5173
```

#### Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URIs:
   - `http://localhost:5173` (development)
   - Your production domain

#### Email Setup (Gmail)

1. Enable 2-Factor Authentication on your Gmail account
2. Generate an App Password:
   - Google Account → Security → 2-Step Verification → App passwords
3. Use the generated password in `EMAIL_PASS`

### 3. Frontend Setup

```bash
cd ../frontend
npm install
```

#### Environment Configuration

Create a `.env` file in the frontend directory:

```env
VITE_API_URL=http://localhost:3001/api
VITE_GOOGLE_CLIENT_ID=your-google-client-id
```

### 4. MongoDB Atlas Setup

1. Create a MongoDB Atlas cluster
2. Create a database user
3. Whitelist your IP address (or use 0.0.0.0/0 for development)
4. Get your connection string and update `MONGODB_URI` in backend `.env`

## 🚀 Running the Application

### Development Mode

#### Start Backend Server
```bash
cd backend
npm run dev
```
The backend will run on `http://localhost:3001`

#### Start Frontend Development Server
```bash
cd frontend
npm run dev
```
The frontend will run on `http://localhost:5173`

### Production Build

#### Build Backend
```bash
cd backend
npm run build
npm start
```

#### Build Frontend
```bash
cd frontend
npm run build
npm run preview
```

## 📁 Project Structure

```
note-taking-app/
├── backend/
│   ├── src/
│   │   ├── config/         # Database and app configuration
│   │   ├── controllers/    # Route controllers
│   │   ├── middleware/     # Custom middleware (auth, rate limiting)
│   │   ├── models/         # MongoDB schemas
│   │   ├── routes/         # API routes
│   │   ├── utils/          # Utility functions
│   │   └── server.ts       # Express server setup
│   ├── dist/               # Compiled TypeScript output
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── components/     # Reusable React components
│   │   ├── contexts/       # React contexts (Auth)
│   │   ├── hooks/          # Custom React hooks
│   │   ├── pages/          # Page components
│   │   ├── services/       # API service functions
│   │   ├── styles/         # Global styles
│   │   └── utils/          # Utility functions
│   ├── public/             # Static assets
│   ├── package.json
│   └── vite.config.ts
└── README.md
```

## 🔐 API Endpoints

### Authentication
- `POST /api/auth/signup` - User registration
- `POST /api/auth/signin` - User login
- `POST /api/auth/google` - Google OAuth login
- `POST /api/auth/verify-otp` - OTP verification
- `POST /api/auth/resend-otp` - Resend OTP
- `POST /api/auth/logout` - User logout

### Notes
- `GET /api/notes` - Get all user notes
- `POST /api/notes` - Create new note
- `PUT /api/notes/:id` - Update note
- `DELETE /api/notes/:id` - Delete note

## 🔒 Security Features

- **JWT Authentication** with secure token storage
- **Rate Limiting** (15 requests per 5 minutes)
- **Password Hashing** with bcrypt
- **Input Validation** and sanitization
- **CORS Protection** with specific origin allowlist
- **Environment Variables** for sensitive data

## 📱 Responsive Design

The application is optimized for:
- **Desktop** (1024px and above)
- **Tablet** (768px - 1023px)
- **Mobile** (320px - 767px)
- **Samsung Galaxy S8+** and similar devices

## 🎨 Custom Features

- **Animated Logo** with SVG animations
- **Custom Toast Notifications** with proper error handling
- **Mobile-First Design** with Tailwind CSS
- **Dark Mode Ready** CSS variables
- **Accessibility Features** with proper ARIA labels

## 🧪 Testing

### API Testing
```bash
cd backend
npm run test
```

### Manual Testing
Use the provided test scripts:
```bash
cd backend
./test-api.sh
./test-all-endpoints.sh
```

## 🚀 Deployment

### Backend Deployment (Heroku/Railway/Vercel)

1. **Environment Variables**: Set all required environment variables
2. **Build Command**: `npm run build`
3. **Start Command**: `npm start`
4. **Port**: Use `process.env.PORT`

### Frontend Deployment (Vercel/Netlify)

1. **Build Command**: `npm run build`
2. **Output Directory**: `dist`
3. **Environment Variables**: Set `VITE_API_URL` and `VITE_GOOGLE_CLIENT_ID`

### Database
- MongoDB Atlas is cloud-ready
- Update `MONGODB_URI` with production credentials
- Ensure IP whitelist includes production server IPs

## 🐛 Troubleshooting

### Common Issues

1. **MongoDB Connection Failed**
   - Check connection string format
   - Verify IP whitelist in MongoDB Atlas
   - Ensure database user has proper permissions

2. **Google OAuth Not Working**
   - Verify redirect URIs in Google Console
   - Check client ID configuration
   - Ensure Google+ API is enabled

3. **Email OTP Not Sending**
   - Verify Gmail App Password setup
   - Check email service configuration
   - Ensure 2FA is enabled on Gmail account

4. **Frontend Can't Connect to Backend**
   - Check if backend server is running on port 3001
   - Verify CORS configuration
   - Check API URL in frontend environment

5. **Build Errors**
   - Clear `node_modules` and reinstall: `rm -rf node_modules package-lock.json && npm install`
   - Check Node.js version compatibility
   - Verify TypeScript configuration

## 💡 Development Tips

### File Types in Backend (`dist/` folder)
- **`.js` files**: Compiled JavaScript (executable code)
- **`.d.ts` files**: TypeScript declaration files (type definitions)
- **`.js.map` files**: Source maps for debugging
- **`.d.ts.map` files**: Declaration source maps

### Authentication Flow
1. **Signup**: Email → OTP verification → Dashboard
2. **Google OAuth**: Direct authentication → Dashboard  
3. **Signin**: Email/Password → Dashboard (if verified) or OTP verification
4. **Resend OTP**: Different endpoints for signup vs signin flows

### Rate Limiting Configuration
- **General API**: 15 requests per 5 minutes
- **OTP Requests**: 30-second cooldown between requests
- **Development-friendly**: Relaxed limits for testing

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit your changes: `git commit -m 'Add some feature'`
4. Push to the branch: `git push origin feature-name`
5. Submit a pull request

## � Support

For support or questions, please open an issue in the GitHub repository.

---

**Happy Note Taking! 📝✨**
note-taking-app/
├── backend/
│   ├── src/
│   │   ├── config/          # Database configuration
│   │   ├── controllers/     # Route controllers
│   │   ├── middleware/      # Custom middleware
│   │   ├── models/          # MongoDB models
│   │   ├── routes/          # Express routes
│   │   ├── utils/           # Utility functions
│   │   └── server.ts        # Main server file

EMAIL_SERVICE=gmail
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=your-email@gmail.com

# Google OAuth Configuration (Optional)
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Frontend URL
FRONTEND_URL=http://localhost:3000
CORS_ORIGIN=http://localhost:3000
```

### 3. Start MongoDB

```bash
# If using local MongoDB
brew services start mongodb/brew/mongodb-community

# Or if using MongoDB in Docker
docker run --name mongodb -p 27017:27017 -d mongo:latest
```

### 4. Start the Backend

```bash
cd backend

# Development mode with auto-reload
npm run dev

# Or build and start
npm run build
npm start
```

Backend will run on: `http://localhost:5000`

### 5. Start the Frontend

```bash
cd frontend

# Development mode
npm run dev
```

Frontend will run on: `http://localhost:3000`

## 📋 API Endpoints

### Authentication Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/auth/signup` | Email + password signup | No |
| POST | `/api/auth/google-signup` | Google OAuth signup | No |
| POST | `/api/auth/verify-otp` | Verify OTP for email | No |
| POST | `/api/auth/login` | Email + password login | No |
| POST | `/api/auth/google-login` | Google OAuth login | No |
| POST | `/api/auth/resend-otp` | Resend OTP | No |
| POST | `/api/auth/logout` | Logout user | Yes |
| GET | `/api/auth/me` | Get user profile | Yes |

### Notes Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/notes` | Create new note | Yes |
| GET | `/api/notes` | Get all user notes | Yes |
| GET | `/api/notes/search` | Search notes | Yes |
| GET | `/api/notes/:id` | Get specific note | Yes |
| PUT | `/api/notes/:id` | Update note | Yes |
| DELETE | `/api/notes/:id` | Delete note | Yes |
| POST | `/api/notes/:id/pin` | Toggle pin status | Yes |
| POST | `/api/notes/:id/archive` | Toggle archive status | Yes |

## 🧪 Testing with Postman

1. Import the collection: `backend/postman-collection.json`
2. Set environment variables:
   - `BASE_URL`: `http://localhost:5000`
3. Test the authentication flow:
   - Run "Email Signup"
   - Check your email for OTP
   - Run "Verify OTP" with the received OTP
   - The collection will automatically set tokens for subsequent requests

### Required Error Messages Testing

The API returns these specific error messages as requested:

- ✅ "Invalid email format"
- ✅ "Password too weak"
- ✅ "Invalid OTP"
- ✅ "OTP expired"
- ✅ "OTP already used"
- ✅ "User already exists"
- ✅ "User not found"
- ✅ "Network error" (handled on frontend)
- ✅ "Server unavailable"

## 📧 Email Configuration Setup

### Gmail Setup (Recommended for Development)

1. **Enable 2-Factor Authentication** on your Gmail account
2. **Generate App Password**:
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate password for "Mail"
3. **Update .env file**:
   ```env
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASSWORD=your-16-character-app-password
   ```

### Other Email Services

For production, consider using:
- **SendGrid**
- **Mailgun**
- **Amazon SES**
- **Nodemailer with SMTP**

## 🔐 Google OAuth Setup

1. **Create Google Cloud Project**:
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create new project or select existing

2. **Enable Google+ API**:
   - API & Services → Library
   - Search for "Google+ API" and enable

3. **Create OAuth Credentials**:
   - API & Services → Credentials
   - Create OAuth 2.0 Client ID
   - Add authorized origins: `http://localhost:3000`

4. **Update Configuration**:
   ```env
   # Backend .env
   GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=your-client-secret
   
   # Frontend .env
   VITE_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
   ```

## 🛡️ Security Features

### Rate Limiting
- **General API**: 100 requests per 15 minutes
- **Authentication**: 10 requests per 15 minutes
- **OTP requests**: 5 requests per 15 minutes
- **Signup**: 5 requests per hour

### Input Validation
- Email format validation
- Password strength requirements
- OTP format validation
- Request sanitization

### JWT Security
- Access tokens (7 days expiry)
- Refresh tokens (30 days expiry)
- Secure token verification
- User session management

## 🚀 Production Deployment

### Environment Variables
Update these for production:

```env
NODE_ENV=production
JWT_SECRET=your-super-secure-secret-key-min-32-chars
JWT_REFRESH_SECRET=your-super-secure-refresh-secret-key
MONGODB_URI=your-production-mongodb-uri
CORS_ORIGIN=https://your-frontend-domain.com
```

### Database
- Use MongoDB Atlas or managed MongoDB service
- Enable MongoDB authentication
- Set up database backups
- Configure connection pooling

### Email Service
- Use production email service (SendGrid, Mailgun, etc.)
- Set up proper SPF, DKIM, DMARC records
- Monitor email delivery rates

### Deployment Options
- **Backend**: Heroku, AWS EC2, DigitalOcean, Railway
- **Frontend**: Vercel, Netlify, AWS S3 + CloudFront
- **Database**: MongoDB Atlas, AWS DocumentDB

## 🐛 Troubleshooting

### Common Issues

1. **MongoDB Connection Failed**
   ```bash
   # Start MongoDB service
   brew services start mongodb/brew/mongodb-community
   ```

2. **Email Not Sending**
   - Check email credentials in .env
   - Verify Gmail app password
   - Check firewall/network restrictions

3. **TypeScript Errors**
   ```bash
   # Rebuild the project
   cd backend
   npm run build
   ```

4. **Port Already in Use**
   ```bash
   # Kill process on port 5000
   lsof -ti:5000 | xargs kill -9
   ```

### Debug Mode

Enable debug logging:
```env
NODE_ENV=development
```

Check logs:
```bash
tail -f backend/logs/combined.log
```

## 📈 Performance Optimization

### Backend
- Database indexing on frequently queried fields
- Connection pooling for MongoDB
- Response compression with gzip
- Proper error handling and logging

### Frontend
- Code splitting with React lazy loading
- Optimized bundle size with Vite
- Image optimization
- Service worker for caching (future enhancement)

## 🔄 Future Enhancements

### Phase 3 (Frontend Implementation)
- React components for authentication
- Dashboard with notes management
- Mobile-responsive design
- Real-time updates with WebSockets

### Phase 4 (Advanced Features)
- Rich text editor for notes
- File attachments
- Collaborative notes
- Dark/light theme
- Export functionality (PDF, Markdown)
- Advanced search with filters

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

---

**Ready to continue with Phase 3 (Frontend Implementation)?** 🚀

# Penalty - Call Center Task Management Application

A full-stack web application for the Marti Technology call center penalty team to optimize and track their daily work.

## Tech Stack

- **Frontend**: React with Vite, Material UI
- **Backend**: Express.js (Node.js)
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT (JSON Web Tokens)

## Features

- 🔐 User authentication (admin-managed users)
- 📱 Modern, responsive dashboard
- 📝 Twitter-like task feed
- ✅ Task completion tracking
- 🎨 Clean, modern UI with Material UI
- 📊 Multiple pages for future features

## Prerequisites

Before you begin, ensure you have the following installed:

- Node.js (v16 or higher)
- npm or yarn
- MongoDB (running locally or MongoDB Atlas connection string)

## Installation

### 1. Clone the repository

```bash
cd penalty
```

### 2. Install dependencies

Install all dependencies for root, backend, and frontend:

```bash
npm run install-all
```

Or manually:

```bash
npm install
cd backend && npm install && cd ..
cd frontend && npm install && cd ..
```

### 3. Set up MongoDB

Make sure MongoDB is running on your system. If you're using MongoDB locally:

```bash
# On macOS with Homebrew
brew services start mongodb-community

# On Linux
sudo systemctl start mongod

# On Windows
# Start MongoDB service from Services panel
```

Alternatively, you can use MongoDB Atlas (cloud) and provide the connection string in the `.env` file.

### 4. Configure environment variables

Create a `.env` file in the `backend` directory:

**On Linux/macOS:**
```bash
cd backend
cp .env.example .env
```

**On Windows (PowerShell):**
```powershell
cd backend
Copy-Item .env.example .env
```

**Or manually create `backend/.env`** with the following content:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/penalty
JWT_SECRET=your-secret-key-change-this-in-production
NODE_ENV=development
```

**Important**: Change `JWT_SECRET` to a secure random string in production. You can generate one using:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 5. Seed the database

Create initial admin and test users:

```bash
cd backend
npm run seed
```

Or directly:

```bash
cd backend
node scripts/seed.js
```

This will create:
- **Admin user**: username: `admin`, password: `admin123`
- **Test user**: username: `testuser`, password: `test123`

## Running the Application

### Development Mode

Run both frontend and backend concurrently:

```bash
npm run dev
```

Or run them separately:

**Terminal 1 - Backend:**
```bash
npm run server
```

**Terminal 2 - Frontend:**
```bash
npm run client
```

The application will be available at:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000

### Production Build

Build the frontend:

```bash
cd frontend
npm run build
```

Start the backend:

```bash
cd backend
npm start
```

## Project Structure

```
penalty/
├── backend/
│   ├── models/          # MongoDB models (User, Task)
│   ├── routes/          # API routes (auth, tasks, users)
│   ├── middleware/      # Authentication middleware
│   ├── scripts/         # Database seeding scripts
│   ├── server.js        # Express server entry point
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── pages/       # React page components
│   │   ├── context/     # React context (AuthContext)
│   │   ├── App.jsx      # Main app component
│   │   └── main.jsx     # Entry point
│   └── package.json
└── README.md
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `GET /api/auth/verify` - Verify JWT token

### Tasks
- `GET /api/tasks` - Get all tasks (feed)
- `POST /api/tasks` - Create a new task
- `PATCH /api/tasks/:id/complete` - Mark task as completed
- `PATCH /api/tasks/:id/uncomplete` - Unmark task as completed

### Users (Admin only)
- `GET /api/users` - Get all users
- `POST /api/users` - Create a new user

## Usage

1. **Login**: Use the admin credentials (`admin` / `admin123`) or test user credentials to log in.

2. **Post Tasks**: On the main page, type a task in the text area and click "Post Task".

3. **Complete Tasks**: Click the checkmark icon on any task to mark it as completed.

4. **Navigation**: Use the sidebar to navigate between different pages.

## Adding New Users

Users must be added by an admin. To add users programmatically, you can:

1. Use the admin account to access the `/api/users` endpoint (requires admin role)
2. Or modify the seed script to add more users
3. Or use MongoDB directly to insert users

Example user creation (via API with admin token):

```bash
curl -X POST http://localhost:5000/api/users \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "newuser",
    "email": "newuser@marti.com",
    "password": "password123",
    "fullName": "New User",
    "role": "user"
  }'
```

## Troubleshooting

### MongoDB Connection Issues
- Ensure MongoDB is running: `mongosh` or check MongoDB service status
- Verify the connection string in `backend/.env`
- Check MongoDB logs for errors

### Port Already in Use
- Change the port in `backend/.env` (PORT) or `frontend/vite.config.js` (server.port)

### CORS Issues
- The backend is configured to allow requests from `localhost:3000`
- If using a different port, update CORS settings in `backend/server.js`

## Future Enhancements

The following pages are currently empty and ready for future development:
- Beyanmatik
- Mailmatik
- Destek Mailmatik
- Dekont Atıcı

## License

This project is for internal use at Marti Technology.


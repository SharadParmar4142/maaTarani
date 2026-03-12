# MAA TARINI ENTERPRISES - Full Stack Application

Complete web application for MAA TARINI ENTERPRISES with user authentication and company management.

## 🏗️ Project Structure

```
maaTarani/
├── app/                        # Next.js app directory
│   ├── login/                  # Login page
│   ├── signup/                 # Signup page (2-step form)
│   ├── layout.tsx              # Root layout with AuthProvider
│   └── page.tsx                # Home page
├── Backend/                    # Node.js + Express + Prisma
│   ├── config/                 # Database configuration
│   ├── controller/             # Business logic
│   ├── middleware/             # Auth & error handling
│   ├── prisma/                 # Database schema
│   ├── routes/                 # API routes
│   └── index.js                # Server entry point
├── components/                 # React components
│   ├── header.tsx              # Header with auth buttons
│   └── ...                     # Other components
├── contexts/                   # React contexts
│   └── AuthContext.tsx         # Authentication state
├── lib/                        # Utilities
│   ├── api.ts                  # API helper functions
│   └── utils.ts                # General utilities
├── public/                     # Static assets
├── .env.local                  # Frontend environment variables
└── package.json                # Frontend dependencies
```

## ✨ Features

### Frontend (Next.js 16)
- ✅ Modern, responsive UI with Tailwind CSS
- ✅ User authentication (Login/Signup)
- ✅ 2-step registration form (User + Company details)
- ✅ Protected routes with JWT
- ✅ Form validation and error handling
- ✅ Session management with localStorage
- ✅ Static site generation compatible

### Backend (Node.js + Express)
- ✅ RESTful API with Express.js
- ✅ MongoDB database with Prisma ORM
- ✅ JWT authentication
- ✅ Password encryption (bcrypt)
- ✅ Unique constraints validation
- ✅ MVC architecture
- ✅ Comprehensive error handling

## 🚀 Quick Start

### Prerequisites
- Node.js 14+ installed
- MongoDB Atlas account (or local MongoDB)
- Git installed

### 1. Clone/Download the Project
```bash
cd "New folder"
```

### 2. Setup Backend

```bash
cd Backend
npm install
```

Update `Backend/.env`:
```env
DATABASE_URL="mongodb+srv://username:password@cluster.mongodb.net/maaTarini"
JWT_SECRET="your-secret-key"
PORT=5000
```

Generate Prisma client and setup database:
```bash
npm run prisma:generate
npx prisma db push
```

Start backend server:
```bash
npm run dev
```

Backend will run on `http://localhost:5000`

### 3. Setup Frontend

Open new terminal:
```bash
cd ..  # Back to root folder
npm install
```

The `.env.local` is already configured:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

Start frontend:
```bash
npm run dev
```

Frontend will run on `http://localhost:3000`

### 4. Test the Application

1. Visit `http://localhost:3000`
2. Click **Sign Up** in header
3. Fill in registration form:
   - **Step 1**: User details (name, phone, email, password)
   - **Step 2**: Company details (name, size, GST, etc.)
4. Login with your credentials
5. See your name in the header after login

## 📋 API Documentation

### Base URL
```
http://localhost:5000/api
```

### Endpoints

#### 1. Register User
```http
POST /api/user/register
Content-Type: application/json

{
  "name": "John Doe",
  "phone": "9876543210",
  "email": "john@example.com",
  "password": "password123",
  "companyName": "ABC Enterprises",
  "companySize": "11-50",
  "yearOfEstablishment": 2020,
  "gstNumber": "22AAAAA0000A1Z5",
  "panNumber": "ABCDE1234F",
  "companyPhone": "9876543211"
}
```

#### 2. Login
```http
POST /api/user/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

#### 3. Get Current User (Protected)
```http
GET /api/user/current
Authorization: Bearer <your-token>
```

## 🔐 Authentication Flow

1. **Signup**: User fills 2-step form → Backend validates → Creates user & company → Returns JWT
2. **Login**: User enters credentials → Backend validates → Returns JWT
3. **Session**: JWT stored in localStorage → Used for protected API calls
4. **Logout**: Clear localStorage → Redirect to home

## 📊 Database Schema

### User Model
- id (ObjectId)
- name (String)
- phone (String, unique)
- email (String, unique)
- password (String, encrypted)
- company (Relation)
- timestamps

### Company Model
- id (ObjectId)
- userId (ObjectId, relation)
- companyName (String)
- companySize (String)
- yearOfEstablishment (Int)
- gstNumber (String, unique)
- panNumber (String?, unique)
- companyPhone (String?)
- timestamps

## 🎨 Frontend Pages

### Public Pages
- `/` - Home page with all sections
- `/login` - Login page
- `/signup` - 2-step registration form

### Header States
**Not Logged In:**
- Navigation links
- Login button
- Sign Up button (highlighted)

**Logged In:**
- Navigation links
- User name display
- Logout button

## 🛠️ Technology Stack

### Frontend
- **Next.js 16** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Lucide Icons** - UI icons
- **React Context** - State management

### Backend
- **Node.js** - Runtime
- **Express.js** - Web framework
- **Prisma** - ORM
- **MongoDB** - Database
- **JWT** - Authentication
- **bcrypt** - Password hashing

## 📁 Important Files

### Frontend
- `app/login/page.tsx` - Login page
- `app/signup/page.tsx` - Signup page (2 steps)
- `components/header.tsx` - Header with auth
- `contexts/AuthContext.tsx` - Auth state
- `lib/api.ts` - API utilities
- `.env.local` - Frontend config

### Backend
- `controller/userController.js` - User logic
- `routes/userRoutes.js` - API routes
- `middleware/validateToken.js` - JWT validation
- `prisma/schema.prisma` - Database schema
- `index.js` - Server entry
- `.env` - Backend config

## 🧪 Testing

### Test Signup
```bash
# User Details
Name: Test User
Phone: 9876543210
Email: test@example.com
Password: test123

# Company Details
Company Name: Test Corp
Company Size: 11-50
Year: 2020
GST: 22AAAAA0000A1Z5
PAN: ABCDE1234F (optional)
Company Phone: 9876543211 (optional)
```

### Test Login
```bash
Email: test@example.com
Password: test123
```

## 🚨 Common Issues

### Backend won't start
- Check MongoDB connection string in `Backend/.env`
- Ensure MongoDB Atlas IP whitelist includes your IP
- Run `npm run prisma:generate`

### Frontend can't connect to backend
- Ensure backend is running on port 5000
- Check `NEXT_PUBLIC_API_URL` in `.env.local`
- Check CORS is enabled in backend

### "User already exists"
- Email, phone, GST, or PAN already registered
- Use different values or delete test data from MongoDB

### Login button not showing
- Clear browser cache
- Check AuthProvider is wrapping app in `layout.tsx`

## 📚 Documentation

- [Frontend Integration Guide](FRONTEND_INTEGRATION.md)
- [Backend API Documentation](Backend/README.md)
- [Backend Quick Start](Backend/QUICKSTART.md)

## 🔄 Development Workflow

### Making Changes

**Frontend changes:**
1. Edit files in `app/`, `components/`, etc.
2. Changes hot-reload automatically
3. Check `http://localhost:3000`

**Backend changes:**
1. Edit files in `Backend/`
2. Server auto-restarts (nodemon)
3. Test with Postman or frontend

**Database schema changes:**
1. Edit `Backend/prisma/schema.prisma`
2. Run `npx prisma db push`
3. Run `npm run prisma:generate`

## 🌐 Deployment

### Backend (Railway/Render/Heroku)
1. Push code to GitHub
2. Connect to hosting platform
3. Set environment variables
4. Deploy

### Frontend (Vercel/Netlify)
1. Push code to GitHub
2. Connect to Vercel/Netlify
3. Set `NEXT_PUBLIC_API_URL` to production backend
4. Deploy

**Note:** For static export, remove `output: 'export'` from `next.config.mjs` for full Next.js features.

## 📝 License
Private project for MAA TARINI ENTERPRISES

## 👨‍💻 Development Notes

### Security Considerations
- ✅ Passwords encrypted with bcrypt (10 rounds)
- ✅ JWT tokens for authentication
- ✅ Unique constraints on sensitive fields
- ✅ Input validation on frontend and backend
- ⚠️ Remember to change JWT_SECRET in production
- ⚠️ Configure CORS for production domain

### Performance
- Static export enabled for fast loading
- Images unoptimized (configure optimization if needed)
- MongoDB indexes on unique fields

### Future Enhancements
- [ ] Email verification
- [ ] Password reset functionality
- [ ] User profile page
- [ ] Admin dashboard
- [ ] Role-based access control
- [ ] Company document uploads
- [ ] Order management system

## 📞 Support

For issues or questions:
1. Check this README
2. Check FRONTEND_INTEGRATION.md
3. Check Backend/README.md
4. Review error messages in browser console and terminal

---

**Made with ❤️ for MAA TARINI ENTERPRISES**

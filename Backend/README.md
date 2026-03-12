# MAA TARINI ENTERPRISES - Backend API

Backend API for user registration and authentication with company details.

## Features

- ✅ User Registration with User & Company Details
- ✅ Encrypted Password Storage (bcrypt)
- ✅ JWT Authentication
- ✅ Unique Email, Phone, GST, and PAN validation
- ✅ MongoDB with Prisma ORM
- ✅ Proper MVC Structure (Models, Controllers, Routes, Middleware)

## Folder Structure

```
Backend/
├── config/
│   └── dbConfig.js          # Database configuration
├── controller/
│   └── userController.js    # User business logic
├── middleware/
│   ├── errorHandler.js      # Global error handler
│   └── validateToken.js     # JWT token validation
├── prisma/
│   └── schema.prisma        # Database schema
├── routes/
│   └── userRoutes.js        # User routes
├── .env                      # Environment variables
├── .gitignore
├── constants.js              # Constants
├── index.js                  # Main server file
└── package.json
```

## Setup Instructions

### 1. Install Dependencies

```bash
cd Backend
npm install
```

### 2. Configure Environment Variables

Update the `.env` file with your MongoDB connection string:

```env
PORT=5000
DATABASE_URL="mongodb+srv://username:password@cluster.mongodb.net/maaTarini?retryWrites=true&w=majority"
JWT_SECRET="your-secret-key-change-this-in-production"
NODE_ENV=development
```

### 3. Generate Prisma Client

```bash
npm run prisma:generate
```

### 4. Push Database Schema

For MongoDB (no migrations needed):
```bash
npx prisma db push
```

### 5. Run the Server

Development mode (with nodemon):
```bash
npm run dev
```

Production mode:
```bash
npm start
```

The server will run on `http://localhost:5000`

## API Endpoints

### 1. Register User
**POST** `/api/user/register`

**Request Body:**
```json
{
  "name": "John Doe",
  "phone": "9876543210",
  "email": "john@example.com",
  "password": "SecurePass123",
  "companyName": "ABC Enterprises",
  "companySize": "50-100",
  "yearOfEstablishment": 2015,
  "gstNumber": "22AAAAA0000A1Z5",
  "panNumber": "ABCDE1234F",
  "companyPhone": "9876543211"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "user": {
    "id": "...",
    "name": "John Doe",
    "phone": "9876543210",
    "email": "john@example.com"
  },
  "company": {
    "id": "...",
    "companyName": "ABC Enterprises",
    "companySize": "50-100",
    "yearOfEstablishment": 2015,
    "gstNumber": "22AAAAA0000A1Z5",
    "panNumber": "ABCDE1234F",
    "companyPhone": "9876543211"
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### 2. Login User
**POST** `/api/user/login`

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "SecurePass123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "user": { "..." },
  "company": { "..." },
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### 3. Get Current User (Protected)
**GET** `/api/user/current`

**Headers:**
```
Authorization: Bearer <your-jwt-token>
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "...",
    "name": "John Doe",
    "phone": "9876543210",
    "email": "john@example.com",
    "company": { "..." },
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

## Database Schema

### User Model
- `id`: Unique identifier
- `name`: User's full name
- `phone`: Unique phone number
- `email`: Unique email address
- `password`: Encrypted password
- `company`: Relation to Company model
- `createdAt`: Timestamp
- `updatedAt`: Timestamp

### Company Model
- `id`: Unique identifier
- `userId`: Reference to User
- `companyName`: Company name
- `companySize`: Size of company
- `yearOfEstablishment`: Year company was established
- `gstNumber`: Unique GST number
- `panNumber`: Unique PAN number (optional)
- `companyPhone`: Company phone (optional)
- `createdAt`: Timestamp
- `updatedAt`: Timestamp

## Validation Rules

### User Details
- ✅ Name: Required
- ✅ Phone: Required, Unique, 10 digits
- ✅ Email: Required, Unique, Valid email format
- ✅ Password: Required, Encrypted with bcrypt

### Company Details
- ✅ Company Name: Required
- ✅ Company Size: Required
- ✅ Year of Establishment: Required
- ✅ GST Number: Required, Unique, 15 characters (format: 22AAAAA0000A1Z5)
- ✅ PAN Number: Optional, Unique if provided, 10 characters (format: ABCDE1234F)
- ✅ Company Phone: Optional

## Prisma Commands

View database in Prisma Studio:
```bash
npm run prisma:studio
```

Generate Prisma Client after schema changes:
```bash
npm run prisma:generate
```

Push schema to database:
```bash
npx prisma db push
```

## Error Handling

The API uses a centralized error handler that returns consistent error responses:

```json
{
  "title": "Validation Failed",
  "message": "Error message here",
  "stackTrace": "..."
}
```

## Security Features

- Password encryption using bcrypt (10 salt rounds)
- JWT token authentication with 7-day expiration
- Unique constraints on email, phone, GST, and PAN
- Input validation and sanitization
- Protected routes with token validation

## Technologies Used

- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **Prisma** - ORM for MongoDB
- **MongoDB** - Database
- **bcrypt** - Password hashing
- **jsonwebtoken** - JWT authentication
- **express-async-handler** - Async error handling
- **cors** - CORS middleware
- **dotenv** - Environment variables

## Development

The project follows MVC architecture:
- **Models**: Defined in Prisma schema
- **Views**: API responses (JSON)
- **Controllers**: Business logic in controller folder
- **Routes**: API endpoints in routes folder
- **Middleware**: Error handling and authentication

## Notes

- Make sure MongoDB is accessible from your IP
- Change JWT_SECRET in production to a strong random string
- PAN and Company Phone are optional fields
- All unique fields are validated before registration
- Passwords are never returned in API responses

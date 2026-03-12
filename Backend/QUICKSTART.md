# Quick Start Guide

## Prerequisites
- Node.js installed (v14 or higher)
- MongoDB Atlas account (or local MongoDB)

## Step-by-Step Setup

### 1. Navigate to Backend folder
```bash
cd Backend
```

### 2. Install all dependencies
```bash
npm install
```

### 3. Setup MongoDB Database
- Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
- Create a new cluster (free tier is fine)
- Create a database user
- Get your connection string
- Whitelist your IP address

### 4. Configure .env file
Open `.env` and update:
```env
DATABASE_URL="mongodb+srv://YOUR_USERNAME:YOUR_PASSWORD@YOUR_CLUSTER.mongodb.net/maaTarini?retryWrites=true&w=majority"
JWT_SECRET="change-this-to-a-random-secret-key"
```

### 5. Generate Prisma Client
```bash
npm run prisma:generate
```

### 6. Push schema to MongoDB
```bash
npx prisma db push
```

### 7. Start the server
```bash
npm run dev
```

You should see:
```
Server running on port 5000
Database connected successfully
```

## Test the API

### Using Postman or Thunder Client

1. **Register a new user**
   - Method: POST
   - URL: `http://localhost:5000/api/user/register`
   - Body (raw JSON):
   ```json
   {
     "name": "Test User",
     "phone": "9876543210",
     "email": "test@example.com",
     "password": "password123",
     "companyName": "Test Company",
     "companySize": "10-50",
     "yearOfEstablishment": 2020,
     "gstNumber": "22AAAAA0000A1Z5",
     "panNumber": "ABCDE1234F",
     "companyPhone": "9876543211"
   }
   ```

2. **Login**
   - Method: POST
   - URL: `http://localhost:5000/api/user/login`
   - Body (raw JSON):
   ```json
   {
     "email": "test@example.com",
     "password": "password123"
   }
   ```
   - Copy the `accessToken` from response

3. **Get Current User (Protected)**
   - Method: GET
   - URL: `http://localhost:5000/api/user/current`
   - Headers:
     - Key: `Authorization`
     - Value: `Bearer YOUR_ACCESS_TOKEN_HERE`

## Common Issues

### Issue 1: Database connection failed
**Solution**: Check your DATABASE_URL in .env file and ensure:
- Your IP is whitelisted in MongoDB Atlas
- Username and password are correct
- Network connectivity is working

### Issue 2: Prisma Client not found
**Solution**: Run `npm run prisma:generate`

### Issue 3: Port already in use
**Solution**: Change PORT in .env file to a different port (e.g., 5001)

## Prisma Studio (Database GUI)
To view and manage your database visually:
```bash
npm run prisma:studio
```
This opens a GUI at `http://localhost:5555`

## Next Steps
- Integrate this backend with your Next.js frontend
- Add more endpoints as needed
- Deploy to production (Railway, Render, or AWS)

## Need Help?
Check the main [README.md](README.md) for detailed documentation.

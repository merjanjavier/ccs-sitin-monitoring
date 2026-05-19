# Quick Start Guide

## Setup (One-time only)

1. **Install dependencies:**
   ```bash
   npm install
   ```

## Running the Application

1. **Start the server:**
   ```bash
   npm start
   ```

2. **Open your browser and visit:**
   - Home: http://localhost:3000/index.html
   - Register: http://localhost:3000/Register.html
   - Login: http://localhost:3000/Login.html

## Testing the System

### Register a New User

1. Go to http://localhost:3000/Register.html
2. Fill in all the required fields:
   - ID Number (e.g., 2024-12345)
   - Last Name
   - First Name
   - Middle Name (optional)
   - Course Level (select from dropdown)
   - Course (select from dropdown)
   - Address
   - Email
   - Password (minimum 6 characters)
   - Repeat Password (must match)
3. Click "Register"
4. You should see a success message and be redirected to the login page

### Login

1. Go to http://localhost:3000/Login.html
2. Enter your ID Number and Password
3. Click "Login"
4. You should see a welcome message and be redirected to the home page

## Troubleshooting

**Port already in use:**
- Stop any other applications using port 3000
- Or change the PORT in the `.env` file

**Cannot connect to server:**
- Make sure the server is running (`npm start`)
- Check the terminal for any error messages

**Registration/Login not working:**
- Open browser console (F12) to see error messages
- Check that the server is running
- Verify the API URL in the JavaScript files matches your server address

## API Testing (Optional)

You can test the API endpoints using tools like Postman or curl:

**Health Check:**
```bash
curl http://localhost:3000/api/health
```

**Get All Users:**
```bash
curl http://localhost:3000/api/users
```

## Stopping the Server

Press `Ctrl + C` in the terminal where the server is running.

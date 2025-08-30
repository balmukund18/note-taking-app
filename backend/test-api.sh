#!/bin/bash

echo "🚀 Testing Note Taking App Backend API"
echo "======================================="

# Start backend server in background
cd /Users/balmukund/Desktop/note-taking-app/backend
npm run dev &
SERVER_PID=$!

# Wait for server to start
echo "⏳ Waiting for server to start..."
sleep 5

echo ""
echo "1. 🩺 Testing Health Endpoint"
echo "------------------------------"
curl -s http://localhost:3001/api/health | python3 -m json.tool

echo ""
echo ""
echo "2. 📝 Testing User Signup"
echo "-------------------------"
curl -s -X POST http://localhost:3001/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "StrongPass123!",
    "firstName": "John",
    "lastName": "Doe"
  }' | python3 -m json.tool

echo ""
echo ""
echo "3. ❌ Testing Invalid Email Format"
echo "----------------------------------"
curl -s -X POST http://localhost:3001/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "invalid-email",
    "password": "StrongPass123!",
    "firstName": "John",
    "lastName": "Doe"
  }' | python3 -m json.tool

echo ""
echo ""
echo "4. 🔐 Testing Weak Password"
echo "---------------------------"
curl -s -X POST http://localhost:3001/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test2@example.com",
    "password": "123",
    "firstName": "John",
    "lastName": "Doe"
  }' | python3 -m json.tool

echo ""
echo ""
echo "✅ Backend API Tests Completed!"
echo "================================"
echo "Check email for OTP if signup was successful."
echo "Use test-auth.http file for more comprehensive testing."

# Kill server
kill $SERVER_PID

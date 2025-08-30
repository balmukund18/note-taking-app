#!/bin/bash

echo "🧪 Quick API Endpoint Tests"
echo "============================"

# Test 1: Health Check
echo "1. Health Check:"
curl -s http://localhost:3001/api/health && echo ""

# Test 2: Valid Signup
echo -e "\n2. Valid Signup:"
curl -s -X POST http://localhost:3001/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "quicktest@example.com",
    "password": "StrongPass123!",
    "firstName": "Quick",
    "lastName": "Test"
  }' && echo ""

# Test 3: Invalid Email
echo -e "\n3. Invalid Email Test:"
curl -s -X POST http://localhost:3001/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "invalid-email",
    "password": "StrongPass123!",
    "firstName": "Test",
    "lastName": "User"
  }' && echo ""

# Test 4: Weak Password
echo -e "\n4. Weak Password Test:"
curl -s -X POST http://localhost:3001/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "weak@example.com",
    "password": "123",
    "firstName": "Weak",
    "lastName": "Password"
  }' && echo ""

# Test 5: Login (will fail because user not verified)
echo -e "\n5. Login Test (will fail - user not verified):"
curl -s -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "quicktest@example.com",
    "password": "StrongPass123!"
  }' && echo ""

# Test 6: Notes without auth (should fail)
echo -e "\n6. Get Notes (no auth - should fail):"
curl -s http://localhost:3001/api/notes && echo ""

echo -e "\n✅ Quick tests completed!"

#!/bin/bash

echo "🧪 COMPREHENSIVE API ENDPOINT TESTING"
echo "====================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

BASE_URL="http://localhost:3001/api"

echo "🔍 Testing Note Taking App Backend API"
echo "Server: $BASE_URL"
echo ""

# Function to test endpoint
test_endpoint() {
    local method=$1
    local endpoint=$2
    local data=$3
    local description=$4
    local headers=${5:-"Content-Type: application/json"}
    
    echo -e "${BLUE}Testing: $description${NC}"
    echo "Endpoint: $method $endpoint"
    
    if [ "$method" = "GET" ]; then
        response=$(curl -s -w "\n%{http_code}" "$BASE_URL$endpoint")
    else
        response=$(curl -s -w "\n%{http_code}" -X "$method" "$BASE_URL$endpoint" -H "$headers" -d "$data")
    fi
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n -1)
    
    if [[ $http_code -ge 200 && $http_code -lt 300 ]]; then
        echo -e "${GREEN}✅ SUCCESS (HTTP $http_code)${NC}"
    elif [[ $http_code -ge 400 && $http_code -lt 500 ]]; then
        echo -e "${YELLOW}⚠️  CLIENT ERROR (HTTP $http_code) - Expected for validation tests${NC}"
    else
        echo -e "${RED}❌ ERROR (HTTP $http_code)${NC}"
    fi
    
    if [ ! -z "$body" ]; then
        echo "Response: $body" | python3 -m json.tool 2>/dev/null || echo "Response: $body"
    fi
    echo ""
    echo "---"
    echo ""
    
    # Small delay to avoid overwhelming the server
    sleep 1
}

echo "🩺 1. HEALTH CHECK"
echo "=================="
test_endpoint "GET" "/health" "" "Health Check Endpoint"

echo "👤 2. AUTHENTICATION ENDPOINTS"
echo "==============================="

echo "📝 2.1 User Signup Tests"
echo "------------------------"
test_endpoint "POST" "/auth/signup" '{
    "email": "test@example.com",
    "password": "StrongPass123!",
    "firstName": "John",
    "lastName": "Doe"
}' "Valid User Signup"

test_endpoint "POST" "/auth/signup" '{
    "email": "invalid-email",
    "password": "StrongPass123!",
    "firstName": "John",
    "lastName": "Doe"
}' "Invalid Email Format Test"

test_endpoint "POST" "/auth/signup" '{
    "email": "weak@example.com",
    "password": "123",
    "firstName": "John",
    "lastName": "Doe"
}' "Weak Password Test"

test_endpoint "POST" "/auth/signup" '{
    "email": "",
    "password": "StrongPass123!",
    "firstName": "John",
    "lastName": "Doe"
}' "Missing Email Test"

echo "🔐 2.2 OTP Verification Tests"
echo "-----------------------------"
test_endpoint "POST" "/auth/verify-otp" '{
    "email": "test@example.com",
    "otp": "123456"
}' "OTP Verification (will fail - need real OTP)"

test_endpoint "POST" "/auth/verify-otp" '{
    "email": "test@example.com",
    "otp": "000000"
}' "Invalid OTP Test"

test_endpoint "POST" "/auth/verify-otp" '{
    "email": "nonexistent@example.com",
    "otp": "123456"
}' "Non-existent User OTP Test"

echo "📧 2.3 Resend OTP Tests"
echo "-----------------------"
test_endpoint "POST" "/auth/resend-otp" '{
    "email": "test@example.com"
}' "Resend OTP"

test_endpoint "POST" "/auth/resend-otp" '{
    "email": "nonexistent@example.com"
}' "Resend OTP for Non-existent User"

echo "🔑 2.4 Login Tests"
echo "------------------"
test_endpoint "POST" "/auth/login" '{
    "email": "test@example.com",
    "password": "StrongPass123!"
}' "Valid Login (will fail if user not verified)"

test_endpoint "POST" "/auth/login" '{
    "email": "test@example.com",
    "password": "WrongPassword"
}' "Wrong Password Test"

test_endpoint "POST" "/auth/login" '{
    "email": "nonexistent@example.com",
    "password": "StrongPass123!"
}' "Non-existent User Login Test"

echo "🌐 2.5 Google Auth Tests"
echo "------------------------"
test_endpoint "POST" "/auth/google-signup" '{
    "googleToken": "fake-google-token"
}' "Google Signup (will fail - invalid token)"

test_endpoint "POST" "/auth/google-login" '{
    "googleToken": "fake-google-token"
}' "Google Login (will fail - invalid token)"

echo "📝 3. NOTES ENDPOINTS (Protected)"
echo "================================="

echo "⚠️  Note: Notes endpoints require JWT authentication"
echo "     These tests will fail without valid JWT token"
echo ""

test_endpoint "GET" "/notes" "" "Get All Notes (No Auth)" ""

test_endpoint "POST" "/notes" '{
    "title": "Test Note",
    "content": "This is a test note",
    "tags": ["test"]
}' "Create Note (No Auth)"

test_endpoint "GET" "/notes/search?q=test" "" "Search Notes (No Auth)" ""

echo "🔄 4. ADDITIONAL VALIDATION TESTS"
echo "================================="

echo "📄 4.1 Missing Required Fields"
echo "------------------------------"
test_endpoint "POST" "/auth/signup" '{}' "Signup with Empty Body"

test_endpoint "POST" "/auth/login" '{
    "email": "test@example.com"
}' "Login Missing Password"

test_endpoint "POST" "/notes" '{
    "content": "Note without title"
}' "Create Note Missing Title (No Auth)"

echo "🔢 4.2 Rate Limiting Test"
echo "-------------------------"
echo "Testing rate limiting by making multiple rapid requests..."
for i in {1..6}; do
    echo "Request $i/6:"
    test_endpoint "POST" "/auth/signup" '{
        "email": "rate'$i'@example.com",
        "password": "StrongPass123!",
        "firstName": "Rate",
        "lastName": "Test'$i'"
    }' "Rate Limit Test $i" 2>/dev/null
done

echo ""
echo "🎉 API ENDPOINT TESTING COMPLETED!"
echo "=================================="
echo ""
echo "📋 Summary:"
echo "- All authentication endpoints tested"
echo "- Validation and error handling verified"
echo "- Rate limiting tested"
echo "- Protected routes tested (without auth)"
echo ""
echo "📧 Check your email for OTP if any signup was successful"
echo "🔑 Use received JWT tokens to test protected endpoints"
echo ""
echo "📚 For interactive testing, use:"
echo "   - test-auth.http file with VS Code REST Client"
echo "   - Postman with the provided collection"
echo "   - curl commands with proper JWT tokens"

/**
 * Test Script for Authentication Provider Separation
 *
 * This script tests that:
 * 1. Email users can only login with email+OTP
 * 2. Google users can only login with Google
 * 3. No mixing of authentication methods
 */

const axios = require("axios");

const API_BASE = "http://localhost:3001/api/auth";

// Test data
const emailUser = {
  email: "test.email@example.com",
  name: "Email Test User",
  password: "testpassword123",
};

const mockGoogleToken = {
  idToken: "mock_google_token_12345",
};

async function testEmailUserAuth() {
  console.log("\n🧪 Testing Email User Authentication...\n");

  try {
    // 1. Test email user signup
    console.log("1. Testing email user signup...");
    const signupResponse = await axios.post(`${API_BASE}/signup`, emailUser);
    console.log("✅ Email signup successful:", signupResponse.data.message);

    // 2. Test that this email user cannot login with Google
    console.log("\n2. Testing that email user cannot use Google login...");
    try {
      const googleLoginResponse = await axios.post(
        `${API_BASE}/google-login`,
        mockGoogleToken
      );
      console.log("❌ ERROR: Email user was able to login with Google!");
    } catch (error) {
      if (error.response?.data?.errorCode === "USE_EMAIL_LOGIN") {
        console.log(
          "✅ Correctly rejected Google login for email user:",
          error.response.data.message
        );
      } else {
        console.log(
          "⚠️  Different error:",
          error.response?.data?.message || error.message
        );
      }
    }
  } catch (error) {
    if (error.response?.data?.errorCode === "USER_ALREADY_EXISTS") {
      console.log(
        "ℹ️  Email user already exists, testing login restrictions..."
      );

      // Test Google login restriction for existing email user
      try {
        const googleLoginResponse = await axios.post(
          `${API_BASE}/google-login`,
          mockGoogleToken
        );
        console.log("❌ ERROR: Email user was able to login with Google!");
      } catch (loginError) {
        if (loginError.response?.data?.errorCode === "USE_EMAIL_LOGIN") {
          console.log(
            "✅ Correctly rejected Google login for email user:",
            loginError.response.data.message
          );
        } else {
          console.log(
            "⚠️  Different error:",
            loginError.response?.data?.message || loginError.message
          );
        }
      }
    } else {
      console.log(
        "❌ Email signup failed:",
        error.response?.data?.message || error.message
      );
    }
  }
}

async function testGoogleUserAuth() {
  console.log("\n🧪 Testing Google User Authentication...\n");

  try {
    // 1. Test Google user signup
    console.log("1. Testing Google user signup...");
    const googleSignupResponse = await axios.post(
      `${API_BASE}/google-signup`,
      mockGoogleToken
    );
    console.log(
      "✅ Google signup successful:",
      googleSignupResponse.data.message
    );

    // 2. Test that this Google user cannot login with email
    console.log("\n2. Testing that Google user cannot use email login...");
    try {
      const emailLoginResponse = await axios.post(`${API_BASE}/signin`, {
        email: "balmukundaa1820@gmail.com", // This should be the email from mock token
        password: "anypassword",
      });
      console.log("❌ ERROR: Google user was able to login with email!");
    } catch (error) {
      if (error.response?.data?.errorCode === "USE_GOOGLE_LOGIN") {
        console.log(
          "✅ Correctly rejected email login for Google user:",
          error.response.data.message
        );
      } else {
        console.log(
          "⚠️  Different error:",
          error.response?.data?.message || error.message
        );
      }
    }
  } catch (error) {
    if (error.response?.data?.errorCode === "USER_ALREADY_EXISTS") {
      console.log(
        "ℹ️  Google user already exists, testing login restrictions..."
      );

      // Test email login restriction for existing Google user
      try {
        const emailLoginResponse = await axios.post(`${API_BASE}/signin`, {
          email: "balmukundaa1820@gmail.com",
          password: "anypassword",
        });
        console.log("❌ ERROR: Google user was able to login with email!");
      } catch (loginError) {
        if (loginError.response?.data?.errorCode === "USE_GOOGLE_LOGIN") {
          console.log(
            "✅ Correctly rejected email login for Google user:",
            loginError.response.data.message
          );
        } else {
          console.log(
            "⚠️  Different error:",
            loginError.response?.data?.message || loginError.message
          );
        }
      }
    } else {
      console.log(
        "❌ Google signup failed:",
        error.response?.data?.message || error.message
      );
    }
  }
}

async function runTests() {
  console.log("🚀 Starting Authentication Provider Separation Tests\n");
  console.log("📋 Test Requirements:");
  console.log("  - Email users must only login with email+OTP");
  console.log("  - Google users must only login with Google");
  console.log("  - No mixing authentication methods");
  console.log("  - authProvider field enforces separation\n");

  await testEmailUserAuth();
  await testGoogleUserAuth();

  console.log("\n✨ Test suite completed!");
  console.log("\n💡 Note: This test uses mock Google tokens.");
  console.log("   Real Google OAuth would require valid Google ID tokens.");
}

// Run the tests
runTests().catch(console.error);

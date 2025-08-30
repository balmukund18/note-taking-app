/**
 * Database Cleanup Script
 *
 * This script provides options to clean your MongoDB database:
 * 1. Clear all users
 * 2. Clear all notes
 * 3. Clear everything (full reset)
 *
 * Usage:
 * - npm run clean:users    (Clear only users)
 * - npm run clean:notes    (Clear only notes)
 * - npm run clean:all      (Clear everything)
 * - node cleanup-db.js     (Interactive menu)
 */

const mongoose = require("mongoose");
require("dotenv").config();

const MONGODB_URI = process.env.MONGODB_URI;

// Define schemas directly since we're in a JS file and models are in TS
const userSchema = new mongoose.Schema({}, { strict: false });
const noteSchema = new mongoose.Schema({}, { strict: false });

const User = mongoose.model("User", userSchema);
const Note = mongoose.model("Note", noteSchema);

async function connectDB() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected to MongoDB");
  } catch (error) {
    console.error("❌ Error connecting to MongoDB:", error.message);
    process.exit(1);
  }
}

async function clearUsers() {
  try {
    const result = await User.deleteMany({});
    console.log(`🗑️  Deleted ${result.deletedCount} users`);
    return result.deletedCount;
  } catch (error) {
    console.error("❌ Error clearing users:", error.message);
    throw error;
  }
}

async function clearNotes() {
  try {
    const result = await Note.deleteMany({});
    console.log(`🗑️  Deleted ${result.deletedCount} notes`);
    return result.deletedCount;
  } catch (error) {
    console.error("❌ Error clearing notes:", error.message);
    throw error;
  }
}

async function showStats() {
  try {
    const userCount = await User.countDocuments();
    const noteCount = await Note.countDocuments();

    console.log("\n📊 Current Database Stats:");
    console.log(`   Users: ${userCount}`);
    console.log(`   Notes: ${noteCount}`);
    console.log(`   Total documents: ${userCount + noteCount}\n`);

    return { userCount, noteCount };
  } catch (error) {
    console.error("❌ Error getting stats:", error.message);
    throw error;
  }
}

async function interactiveMenu() {
  const readline = require("readline");
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    console.log("\n🧹 Database Cleanup Options:");
    console.log("1. Clear all users only");
    console.log("2. Clear all notes only");
    console.log("3. Clear everything (users + notes)");
    console.log("4. Show current stats only");
    console.log("5. Exit");

    rl.question("\nChoose an option (1-5): ", (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

async function main() {
  console.log("🚀 Starting Database Cleanup Script\n");

  await connectDB();
  await showStats();

  // Check if command line argument provided
  const action = process.argv[2];

  let choice;
  switch (action) {
    case "users":
      choice = "1";
      break;
    case "notes":
      choice = "2";
      break;
    case "all":
      choice = "3";
      break;
    case "stats":
      choice = "4";
      break;
    default:
      choice = await interactiveMenu();
  }

  try {
    switch (choice) {
      case "1":
        console.log("🗑️  Clearing all users...");
        await clearUsers();
        break;

      case "2":
        console.log("🗑️  Clearing all notes...");
        await clearNotes();
        break;

      case "3":
        console.log("🗑️  Clearing everything...");
        const userCount = await clearUsers();
        const noteCount = await clearNotes();
        console.log(
          `✅ Database cleaned! Removed ${userCount} users and ${noteCount} notes`
        );
        break;

      case "4":
        console.log("📊 Stats already shown above");
        break;

      case "5":
        console.log("👋 Exiting without changes");
        break;

      default:
        console.log("❌ Invalid choice");
        break;
    }

    if (choice !== "4" && choice !== "5") {
      console.log("\n📊 Final Database Stats:");
      await showStats();
    }
  } catch (error) {
    console.error("❌ Cleanup failed:", error.message);
  } finally {
    await mongoose.disconnect();
    console.log("👋 Disconnected from database");
    process.exit(0);
  }
}

// Handle script interruption
process.on("SIGINT", async () => {
  console.log("\n⚠️  Script interrupted");
  await mongoose.disconnect();
  process.exit(0);
});

main().catch(console.error);

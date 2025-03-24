/**
 * Admin Creation Script
 * This script allows promoting an existing user to admin status.
 * 
 * Usage: 
 * 1. Make sure MongoDB is running
 * 2. Run: node create-admin.js
 * 3. Follow the prompts
 */

const mongoose = require('mongoose');
const readline = require('readline');
const User = require('../models/User');
require('dotenv').config({ path: '../.env' });

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Connect to MongoDB
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI;
    if (!mongoURI) {
      console.error('MONGODB_URI environment variable is not set!');
      process.exit(1);
    }
    
    await mongoose.connect(mongoURI);
    console.log('MongoDB Connected...');
  } catch (err) {
    console.error('Database connection error:', err.message);
    process.exit(1);
  }
};

// List all users
const listUsers = async () => {
  try {
    const users = await User.find({}).select('name phoneNumber planType accountStatus');
    console.log("\nUser List:");
    console.log("==========");
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name} (${user.phoneNumber}) - Plan: ${user.planType}, Status: ${user.accountStatus}`);
    });
    return users;
  } catch (err) {
    console.error(`Error listing users: ${err.message}`);
    return [];
  }
};

// Function to promote user to admin
const promoteToAdmin = async (userId) => {
  try {
    const user = await User.findByIdAndUpdate(
      userId,
      { 
        planType: 'admin',
        isPublic: false  // Make admin users private by default
      },
      { new: true }
    );
    
    if (!user) {
      console.log("User not found!");
      return false;
    }
    
    console.log(`\n✅ Success! User ${user.name} (${user.phoneNumber}) promoted to admin.`);
    console.log("You can now log in with this account and access the admin panel.");
    console.log("Note: Admin users are automatically hidden from the Directory.");
    return true;
  } catch (err) {
    console.error(`Error promoting user: ${err.message}`);
    return false;
  }
};

// Main function
const main = async () => {
  await connectDB();
  
  const users = await listUsers();
  
  if (users.length === 0) {
    console.log("No users found. Please create a user first using the application.");
    rl.close();
    return;
  }
  
  rl.question('\nEnter the number of the user to promote to admin: ', async (answer) => {
    const userIndex = parseInt(answer) - 1;
    
    if (isNaN(userIndex) || userIndex < 0 || userIndex >= users.length) {
      console.log("Invalid selection. Please run the script again.");
      rl.close();
      return;
    }
    
    const selectedUser = users[userIndex];
    
    if (selectedUser.planType === 'admin') {
      console.log(`User ${selectedUser.name} is already an admin.`);
      rl.close();
      return;
    }
    
    rl.question(`\nPromote ${selectedUser.name} (${selectedUser.phoneNumber}) to admin? (y/n): `, async (confirm) => {
      if (confirm.toLowerCase() === 'y') {
        await promoteToAdmin(selectedUser._id);
      } else {
        console.log("Operation cancelled.");
      }
      
      rl.close();
      mongoose.connection.close();
    });
  });
};

// Run the script
main();

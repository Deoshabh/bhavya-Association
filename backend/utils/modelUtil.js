const mongoose = require('mongoose');

/**
 * Helper function to verify that all required models are properly registered
 * Call this during application startup
 */
const verifyModels = () => {
  const requiredModels = ['User', 'Listing']; // Add all expected models here
  const registeredModels = Object.keys(mongoose.models);
  
  console.log('Registered Mongoose models:', registeredModels);
  
  // Check if all required models are registered
  const missingModels = requiredModels.filter(model => !registeredModels.includes(model));
  
  if (missingModels.length > 0) {
    console.error('WARNING: Missing required Mongoose models:', missingModels);
    console.error('This may cause reference errors during population!');
  } else {
    console.log('All required models are properly registered.');
  }
};

module.exports = { verifyModels };

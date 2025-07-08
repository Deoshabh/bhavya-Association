/**
 * Debug Utility for Image Upload Issues
 * 
 * This script verifies that the uploads directory structure is properly set up
 * and that permissions are correct. It also tests file creation and deletion.
 */

const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
// Create simple colored console output without dependencies
const chalk = {
  green: (s) => `\x1b[32m[SUCCESS] ${s}\x1b[0m`,
  red: (s) => `\x1b[31m[ERROR] ${s}\x1b[0m`,
  yellow: (s) => `\x1b[33m[WARNING] ${s}\x1b[0m`
};

// Promisify fs functions
const writeFile = promisify(fs.writeFile);
const unlink = promisify(fs.unlink);
const readdir = promisify(fs.readdir);
const mkdir = promisify(fs.mkdir);
const access = promisify(fs.access);

// Check directories
const checkUploadsDirectories = async () => {
  const uploadsDir = path.join(__dirname, '../uploads');
  const newsUploadsDir = path.join(uploadsDir, 'news');
  
  console.log('=== Image Upload System Check ===');
  console.log('Uploads directory path:', uploadsDir);
  console.log('News uploads directory path:', newsUploadsDir);
  
  // Ensure directories exist
  try {
    if (!fs.existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
      console.log(chalk.green('Created missing uploads directory'));
    } else {
      console.log(chalk.green('Uploads directory exists'));
    }
    
    if (!fs.existsSync(newsUploadsDir)) {
      await mkdir(newsUploadsDir, { recursive: true });
      console.log(chalk.green('Created missing news uploads directory'));
    } else {
      console.log(chalk.green('News uploads directory exists'));
    }
  } catch (err) {
    console.error(chalk.red('Failed to create directories:'), err.message);
    return false;
  }
  
  // Check permissions
  try {
    await access(uploadsDir, fs.constants.R_OK | fs.constants.W_OK);
    console.log(chalk.green('Uploads directory is readable and writable'));
    
    await access(newsUploadsDir, fs.constants.R_OK | fs.constants.W_OK);
    console.log(chalk.green('News uploads directory is readable and writable'));
  } catch (err) {
    console.error(chalk.red('Permission error:'), err.message);
    return false;
  }
  
  // Test file creation
  const testFile = path.join(newsUploadsDir, 'test-upload.txt');
  try {
    await writeFile(testFile, 'This is a test file to verify upload permissions');
    console.log(chalk.green('Test file created successfully'));
    
    await unlink(testFile);
    console.log(chalk.green('Test file deleted successfully'));
  } catch (err) {
    console.error(chalk.red('File operation error:'), err.message);
    return false;
  }
  
  // List any existing files
  try {
    const files = await readdir(newsUploadsDir);
    console.log('Files in news uploads directory:', files.length > 0 ? files : 'No files found');
  } catch (err) {
    console.error(chalk.red('Error listing directory contents:'), err.message);
  }
  
  console.log('=== Image Upload System Check Complete ===');
  return true;
};

// Export the check function
module.exports = { checkUploadsDirectories };

// If run directly
if (require.main === module) {
  checkUploadsDirectories()
    .then(success => {
      console.log(success ? 'All checks passed!' : 'Some checks failed. See errors above.');
    })
    .catch(err => {
      console.error('Unexpected error during checks:', err);
    });
}

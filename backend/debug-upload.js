const fs = require('fs');
const path = require('path');

// Test upload directory permissions and existence
const uploadsDir = path.join(__dirname, 'uploads');
const newsUploadsDir = path.join(uploadsDir, 'news');

console.log('=== Upload Directory Debug ===');
console.log('Uploads directory:', uploadsDir);
console.log('News uploads directory:', newsUploadsDir);

// Check if directories exist
console.log('Uploads dir exists:', fs.existsSync(uploadsDir));
console.log('News uploads dir exists:', fs.existsSync(newsUploadsDir));

// Check permissions
try {
  fs.accessSync(uploadsDir, fs.constants.R_OK | fs.constants.W_OK);
  console.log('Uploads directory is readable and writable');
} catch (err) {
  console.error('Uploads directory permission error:', err.message);
}

try {
  fs.accessSync(newsUploadsDir, fs.constants.R_OK | fs.constants.W_OK);
  console.log('News uploads directory is readable and writable');
} catch (err) {
  console.error('News uploads directory permission error:', err.message);
}

// Create test directories if they don't exist
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('Created uploads directory');
}

if (!fs.existsSync(newsUploadsDir)) {
  fs.mkdirSync(newsUploadsDir, { recursive: true });
  console.log('Created news uploads directory');
}

// Test file creation
const testFile = path.join(newsUploadsDir, 'test-file.txt');
try {
  fs.writeFileSync(testFile, 'Test upload');
  console.log('Test file created successfully');
  fs.unlinkSync(testFile);
  console.log('Test file deleted successfully');
} catch (err) {
  console.error('Test file creation error:', err.message);
}

console.log('=== End Debug ===');

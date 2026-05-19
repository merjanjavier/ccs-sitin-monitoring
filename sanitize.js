const fs = require('fs');
const path = require('path');

const files = [
  'register.js',
  'profile.js',
  'login.js',
  'index.js',
  'admin.js'
];

files.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    console.log(`Sanitizing ${file}...`);
    let content = fs.readFileSync(filePath, 'utf8');
    // Replace http://localhost:5501 with empty string
    const newContent = content.replace(/http:\/\/localhost:5501/g, '');
    fs.writeFileSync(filePath, newContent, 'utf8');
    console.log(`Successfully sanitized ${file}`);
  } else {
    console.log(`File not found: ${file}`);
  }
});

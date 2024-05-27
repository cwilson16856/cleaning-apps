const fs = require('fs');
const readline = require('readline');
const path = require('path');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Function to extract file paths from markdown content
function extractFilePaths(markdownContent) {
  const filePaths = [];
  const regex = /- \*\*`(.+?)`\*\*:/g;
  let match;
  while ((match = regex.exec(markdownContent)) !== null) {
    filePaths.push(match[1]);
  }
  return filePaths;
}

// Function to delete files/directories
function deleteFiles(filePaths) {
  filePaths.forEach(filePath => {
    fs.rm(path.join(__dirname, filePath), { recursive: true, force: true }, (err) => {
      if (err) {
        console.warn(`Warning: Failed to delete ${filePath}: ${err.message}`);
      } else {
        console.log(`Success: Deleted ${filePath}`);
      }
    });
  });
}

// Read the unused-code-review.md file
fs.readFile('./unused-code-review.md', 'utf8', (err, data) => {
  if (err) {
    console.log(`Failed to read unused-code-review.md: ${err.message}`);
    return;
  }
  const filePaths = extractFilePaths(data);
  
  if (!filePaths.length) {
    console.log('No files listed for deletion.');
    rl.close();
    return;
  }
  
  console.log(`The following files/directories are identified for deletion:\n${filePaths.join('\n')}`);
  
  rl.question('Are you sure you want to delete these files/directories? (yes/no) ', (answer) => {
    if (answer.toLowerCase() === 'yes') {
      deleteFiles(filePaths);
    } else {
      console.log('Deletion cancelled by the user.');
    }
    rl.close();
  });
});
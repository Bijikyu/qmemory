#!/usr/bin/env node

/**
 * Fix Import Paths Script
 * 
 * Purpose: Systematically fix corrupted import paths in compiled JavaScript files
 * caused by malformed sed replacements during build process.
 */

const fs = require('fs');
const path = require('path');

// Get all JS files in dist/lib directory
const jsFiles = [];
function findJsFiles(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      findJsFiles(fullPath);
    } else if (file.endsWith('.js')) {
      jsFiles.push(fullPath);
    }
  }
}

findJsFiles('./dist/lib');

console.log(`Found ${jsFiles.length} JavaScript files to fix...`);

let filesFixed = 0;

for (const filePath of jsFiles) {
  let content = fs.readFileSync(filePath, 'utf8');
  const originalContent = content;
  
  // Fix 1: Replace triple slashes with single slash
  content = content.replace(/from\s+['"]\.\/([^'"]*?)\/\/\/([^'"]*?)['"]/g, "from './$1/$2'");
  
  // Fix 2: Add .js extension to relative imports if missing
  content = content.replace(/from\s+['"]\.\/([^'"]*?)(?!\.js)['"]/g, "from './$1.js'");
  content = content.replace(/from\s+['"]\.\.\/([^'"]*?)(?!\.js)['"]/g, "from '../$1.js'");
  content = content.replace(/from\s+['"]\.\/\.\/\.\/([^'"]*?)(?!\.js)['"]/g, "from '../../$1.js'");
  content = content.replace(/from\s+['"]\.\.\/\.\/\.\/\.\/([^'"]*?)(?!\.js)['"]/g, "from '../../../$1.js'");
  
  // Fix 3: Ensure .js extensions for core imports
  content = content.replace(/from\s+['"]\.\/core\/([^'"]*?)(?!\.js)['"]/g, "from './core/$1.js'");
  
  if (content !== originalContent) {
    fs.writeFileSync(filePath, content);
    console.log(`✅ Fixed: ${path.relative(process.cwd(), filePath)}`);
    filesFixed++;
  }
}

console.log(`\n🎯 Import path fix complete:`);
console.log(`   Files processed: ${jsFiles.length}`);
console.log(`   Files fixed: ${filesFixed}`);
console.log(`   Files unchanged: ${jsFiles.length - filesFixed}`);

if (filesFixed > 0) {
  console.log(`\n✅ Ready for deployment verification`);
} else {
  console.log(`\n⚠️  No fixes were needed`);}

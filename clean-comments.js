const fs = require('fs');
const path = require('path');

// AI-generated comment patterns to remove
const aiCommentPatterns = [
  /^\s*\/\/ (Handle|Create|Get |Set |Add |Remove |Check if|Check |Update |Initialize |Load |Save |Calculate |Delete |Fetch |Process |Render |Clear |Reset |Toggle |Show |Hide |Close |Open |Start |Stop |Filter |Sort |Map |Find |Search |Validate |Format |Convert |Parse |Build |Generate |Apply |Call |Trigger |Execute |Prevent |Enable |Disable |Wait for|Listen |Cleanup |Setup |Register |Store |Keep |Only |Using |Map |Force |Expose |Skip |Combine |Extract |Standard |Sync |For |Use |If |Track |Main |Selection |Touch |Resize |Custom |Instructions |Frame |Image |Delete )[^]*$/gm,
  /^\s*\/\/ This prevents[^]*$/gm,
  /^\s*\/\/ Note: Auto-save removed[^]*$/gm,
];

// Patterns to KEEP (override removal)
const keepPatterns = [
  /SECURITY/i,
  /IMPORTANT/i,
  /TODO/i,
  /FIXME/i,
  /NOTE:/i,
  /CRITICAL/i,
];

function shouldKeepComment(line) {
  return keepPatterns.some(pattern => pattern.test(line));
}

function cleanFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  const originalContent = content;

  const lines = content.split('\n');
  const cleanedLines = lines.filter(line => {
    const trimmed = line.trim();

    // Keep non-comment lines
    if (!trimmed.startsWith('//')) return true;

    // Keep important comments
    if (shouldKeepComment(line)) return true;

    // Remove AI-generated comments
    const isAIComment = aiCommentPatterns.some(pattern => {
      const match = trimmed.match(pattern);
      return match !== null;
    });

    return !isAIComment;
  });

  content = cleanedLines.join('\n');

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Cleaned: ${filePath}`);
    return true;
  }

  return false;
}

function walkDir(dir, filePattern = /\.(js|jsx)$/) {
  const files = fs.readdirSync(dir);
  let cleanedCount = 0;

  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      cleanedCount += walkDir(filePath, filePattern);
    } else if (filePattern.test(file)) {
      if (cleanFile(filePath)) {
        cleanedCount++;
      }
    }
  });

  return cleanedCount;
}

const srcDir = path.join(__dirname, 'frontend', 'src');
console.log(`Cleaning AI-generated comments from: ${srcDir}`);
const count = walkDir(srcDir);
console.log(`\nCleaned ${count} files`);

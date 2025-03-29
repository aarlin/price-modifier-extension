import { copyFileSync, cpSync, writeFileSync } from 'node:fs';
import { execSync } from 'node:child_process';

// Run the build command
execSync('npm run vite-build', { stdio: 'inherit' });

// Copy manifest.json to dist directory
copyFileSync('manifest.json', 'dist/manifest.json');

// Copy icons directory to dist
cpSync('icons', 'dist/icons', { recursive: true });

// Create popup.html in dist
const popupHtml = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Price Markup Matrix</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="popup.js"></script>
  </body>
</html>`;

writeFileSync('dist/popup.html', popupHtml); 
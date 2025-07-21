// This script fixes common Vercel build issues
const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing Vercel build issues...');

// 1. Remove problematic vercel.json
if (fs.existsSync('vercel.json')) {
  fs.unlinkSync('vercel.json');
  console.log('✅ Removed problematic vercel.json');
}

// 2. Create minimal next.config.js
const nextConfig = `/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  }
}

module.exports = nextConfig`;

fs.writeFileSync('next.config.js', nextConfig);
console.log('✅ Created clean next.config.js');

// 3. Ensure _app.js exists
const appDir = 'pages';
if (!fs.existsSync(appDir)) {
  fs.mkdirSync(appDir);
}

const appContent = `export default function App({ Component, pageProps }) {
  return <Component {...pageProps} />
}`;

fs.writeFileSync(path.join(appDir, '_app.js'), appContent);
console.log('✅ Created pages/_app.js');

// 4. Clean package.json scripts
const packagePath = 'package.json';
if (fs.existsSync(packagePath)) {
  const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  
  // Clean scripts
  pkg.scripts = {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "export": "next export"
  };
  
  fs.writeFileSync(packagePath, JSON.stringify(pkg, null, 2));
  console.log('✅ Cleaned package.json scripts');
}

console.log('\n🎉 Build fixes applied! Try deploying now:');
console.log('   vercel --prod');
console.log('\nOr use an alternative deployment platform from ALTERNATIVE-DEPLOYMENTS.md');
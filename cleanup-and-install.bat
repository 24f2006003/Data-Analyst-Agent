@echo off
echo Cleaning up and installing Data Analyst Agent...

echo.
echo Removing old installations...
if exist node_modules (
    echo Removing node_modules...
    rmdir /s /q node_modules
)

if exist package-lock.json (
    echo Removing package-lock.json...
    del package-lock.json
)

if exist .next (
    echo Removing .next build folder...
    rmdir /s /q .next
)

echo.
echo Installing dependencies (Canvas-free version)...
npm install

echo.
echo Creating environment file...
if not exist .env.local (
    copy .env.example .env.local
    echo Created .env.local - Please edit it and add your OPENAI_API_KEY
) else (
    echo .env.local already exists
)

echo.
echo Setup complete!
echo.
echo Next steps:
echo 1. Edit .env.local and add your OPENAI_API_KEY
echo 2. Run: npm run dev
echo 3. Open: http://localhost:3000
echo.
pause
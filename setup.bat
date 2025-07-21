@echo off
echo Setting up Data Analyst Agent...

echo.
echo Installing dependencies...
npm install --legacy-peer-deps

echo.
echo Copying environment file...
copy .env.example .env.local

echo.
echo Setup complete!
echo.
echo Next steps:
echo 1. Edit .env.local and add your OPENAI_API_KEY
echo 2. Run: npm run dev
echo 3. Open: http://localhost:3000
echo.
pause
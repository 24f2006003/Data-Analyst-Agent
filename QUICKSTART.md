# Quick Start Guide

Get your Data Analyst Agent running in 5 minutes!

## 1. Setup

```bash
# Clone or create the project
git clone <your-repo> data-analyst-agent
cd data-analyst-agent

# Quick setup (installs dependencies and creates .env.local)
npm run setup
```

## 2. Configure Environment

Edit `.env.local` and add your OpenAI API key:

```env
OPENAI_API_KEY=your_actual_api_key_here
OPENAI_BASE_URL=https://aipipe.org/openai/v1
```

## 3. Test Locally

```bash
# Start development server
npm run dev

# In another terminal, test the agent
npm test
```

Visit `http://localhost:3000` to use the web interface.

## 4. Deploy to Vercel

```bash
# One-command deployment (includes testing)
npm run deploy
```

## 5. Test Your Deployed API

```bash
# Replace YOUR_VERCEL_URL with your actual Vercel URL
curl -X POST "https://YOUR_VERCEL_URL/api/" \
  -H "Content-Type: application/json" \
  -d "What is the square root of 16?"
```

## Sample API Calls

### Simple Question
```bash
curl -X POST "https://YOUR_VERCEL_URL/api/" \
  -H "Content-Type: application/json" \
  -d "Calculate the average of 10, 20, and 30"
```

### Wikipedia Scraping (use the sample question from test/question1.txt)
```bash
curl -X POST "https://YOUR_VERCEL_URL/api/" \
  -H "Content-Type: application/json" \
  -d @test/question1.txt
```

## That's it!

Your Data Analyst Agent is now live and ready to handle complex data analysis tasks.

Need help? Check the full README.md for detailed documentation.
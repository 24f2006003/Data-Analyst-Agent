# Deployment Guide

## Vercel Deployment

This project is ready for deployment on Vercel. Follow these steps:

### 1. Prerequisites
- Vercel account
- OpenAI API key

### 2. Environment Variables
Set the following environment variables in your Vercel dashboard:

- `OPENAI_API_KEY`: Your OpenAI API key
- `AIPIPE_ENDPOINT`: (Optional) Custom AIPIPE endpoint
- `DEFAULT_TIMEOUT`: (Optional) Custom timeout in milliseconds
- `DEBUG`: (Optional) Set to `true` for debug logging

### 3. Deploy
1. Connect your repository to Vercel
2. Vercel will automatically detect this as a Next.js project
3. Set your environment variables
4. Deploy

### 4. API Endpoint
Once deployed, your API will be available at:
`https://your-project-name.vercel.app/api`

## API Usage

### POST /api
Send a POST request with JSON body:
```json
{
  "task": "Your data analysis task description",
  "timeout": 180000
}
```

### Response
Returns a JSON array with 4 elements:
```json
[
  correlation_coefficient,
  "explanation_text",
  "top_chart_item",
  "base64_plot_data"
]
```

## Features
- Web scraping and data analysis
- Statistical calculations
- Data visualization
- AI-powered explanations
- Configurable timeouts
- Error handling

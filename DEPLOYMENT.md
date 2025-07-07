# Deployment Guide for Data Analyst Agent

**GitHub Repository**: https://github.com/24f2006003/Data-Analyst-Agent

## Quick Start (Local Development)

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env.local
   ```
   Edit `.env.local` and add your OpenAI API key:
   ```
   OPENAI_API_KEY=your_openai_api_key_here
   ```

3. **Build the project:**
   ```bash
   npm run build
   ```

4. **Start the server:**
   ```bash
   npm start
   ```

The API will be available at `http://localhost:3000/api/`

## Testing

Test the API manually:
```bash
curl -X POST http://localhost:3000/api/ \
  -H "Content-Type: application/json" \
  -d '{"task": "Your analysis task here"}'
```

Test with the evaluation question:
```bash
curl -X POST http://localhost:3000/api/ \
  -F "task=@question.txt"
```

## Evaluation

Run the automated evaluation:
```bash
# Install promptfoo (if not already installed)
npm install -g promptfoo

# Run evaluation
promptfoo eval

# View results
promptfoo view
```

Expected evaluation results:
- Array format: `[1, "Titanic", 0.485782, "data:image/png;base64,..."]`
- All 4 criteria must pass for full score

## Production Deployment

### Deploy to Vercel (Recommended)

1. **Push to GitHub:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/24f2006003/Data-Analyst-Agent.git
   git push -u origin main
   ```

2. **Deploy to Vercel:**
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Set environment variables:
     - `OPENAI_API_KEY`: Your OpenAI API key
   - Deploy

### Deploy to Railway

1. **Install Railway CLI:**
   ```bash
   npm install -g @railway/cli
   ```

2. **Login and deploy:**
   ```bash
   railway login
   railway init
   railway add
   railway deploy
   ```

3. **Set environment variables:**
   ```bash
   railway variables:set OPENAI_API_KEY=your_key_here
   ```

### Deploy to Heroku

1. **Install Heroku CLI**

2. **Create and deploy:**
   ```bash
   heroku create your-app-name
   heroku config:set OPENAI_API_KEY=your_key_here
   git push heroku main
   ```

### Deploy to DigitalOcean App Platform

1. **Create a new app in DigitalOcean**
2. **Connect your GitHub repository**
3. **Set environment variables:**
   - `OPENAI_API_KEY`: Your OpenAI API key
4. **Deploy**

## API Usage

### Health Check
```bash
GET /api/
```

### Analysis Request
```bash
POST /api/
Content-Type: application/json

{
  "task": "Your data analysis task description"
}
```

### File Upload
```bash
POST /api/
Content-Type: multipart/form-data

task=@question.txt
```

### Response Format
```json
[
  "answer1",
  "answer2", 
  "answer3",
  "data:image/png;base64,..."
]
```

## Sample Questions

The API can handle various types of data analysis tasks:

1. **Web Scraping:**
   - Extract data from Wikipedia tables
   - Scrape financial data
   - Extract product information

2. **Database Queries:**
   - DuckDB queries on large datasets
   - Parquet file analysis
   - S3 data processing

3. **Data Analysis:**
   - Statistical calculations
   - Correlation analysis
   - Trend identification

4. **Visualization:**
   - Scatter plots with regression lines
   - Bar charts and line graphs
   - Base64 encoded images

## Configuration

### Environment Variables

- `OPENAI_API_KEY`: Required for AI analysis (AIPIPE token)
- `AIPIPE_ENDPOINT`: Custom AIPIPE endpoint (optional)
- `DEFAULT_TIMEOUT`: Request timeout in milliseconds (default: 180000)
- `DEBUG`: Enable debug logging (default: false)

### Customization

The agent can be customized by modifying:

- **AI Models:** Edit `services/ai-analysis.service.ts`
- **Data Sources:** Extend `services/database.service.ts`
- **Visualizations:** Enhance `services/visualization.service.ts`
- **Processing:** Add transformations in `services/data-processing.service.ts`

## Troubleshooting

### Common Issues

1. **Module not found errors:**
   ```bash
   npm install
   npm run build
   ```

2. **API key issues:**
   - Ensure `OPENAI_API_KEY` is set correctly
   - Check if the key has proper permissions

3. **Timeout errors:**
   - Increase timeout for complex tasks
   - Use `DEFAULT_TIMEOUT` environment variable

4. **Build errors:**
   ```bash
   npm run type-check
   npm run build
   ```

### Debug Mode

Enable debug logging:
```bash
DEBUG=true npm run dev
```

## Support

For issues:
- Check the logs in the terminal
- Verify environment variables are set
- Test with simpler queries first
- Review the troubleshooting section

## Performance Tips

- Use specific column names in queries
- Limit data size for complex analyses
- Cache frequently used data
- Use appropriate timeout values

The API is designed to handle the evaluation criteria and should work with promptfoo for automated testing.

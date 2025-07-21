# Data Analyst Agent

An AI-powered data analysis agent that can scrape, process, analyze, and visualize data using Large Language Models. The agent exposes a POST API endpoint that accepts data analysis task descriptions and returns results within 3 minutes.

## Features

- 🌐 **Web Scraping**: Scrape data from websites like Wikipedia
- 📊 **Data Analysis**: Perform statistical analysis and calculations
- 📈 **Data Visualization**: Generate charts and plots as base64 encoded images
- 🔍 **DuckDB Integration**: Query large datasets using DuckDB
- ⚡ **Fast Processing**: Results delivered within 3 minutes
- 🚀 **Easy Deployment**: Deploy to Vercel with one click

## Project Structure

```
data-analyst-agent/
├── pages/
│   ├── api/
│   │   └── index.js          # Main API endpoint
│   └── index.js              # Web interface for testing
├── test/
│   ├── question1.txt         # Sample Wikipedia scraping question
│   ├── question2.txt         # Sample DuckDB analysis question
│   └── test-agent.js         # Test script
├── .env.example              # Environment variables template
├── next.config.js            # Next.js configuration
├── package.json              # Dependencies and scripts
├── vercel.json               # Vercel deployment configuration
└── README.md                 # This file
```

## Setup Instructions

### 1. Clone and Install Dependencies

```bash
git clone <your-repo>
cd data-analyst-agent
npm install
```

### 2. Environment Variables

Create a `.env.local` file based on `.env.example`:

```bash
cp .env.example .env.local
```

Edit `.env.local` and add your API key:

```env
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_BASE_URL=https://aipipe.org/openai/v1
```

### 3. Local Development

```bash
npm run dev
```

Visit `http://localhost:3000` to test the web interface.

### 4. Test the Agent

```bash
npm test
```

This will run both sample questions and validate the responses.

## API Usage

### Endpoint
```
POST https://your-app.vercel.app/api/
```

### Request Format
Send the question as raw text in the request body.

### Example using curl:
```bash
curl -X POST "https://your-app.vercel.app/api/" \
  -H "Content-Type: application/json" \
  -d "Scrape the list of highest grossing films from Wikipedia..."
```

### Sample Questions

#### 1. Wikipedia Scraping
```text
Scrape the list of highest grossing films from Wikipedia. It is at the URL:
https://en.wikipedia.org/wiki/List_of_highest-grossing_films

Answer the following questions and respond with a JSON array of strings containing the answer.

1. How many $2 bn movies were released before 2020?
2. Which is the earliest film that grossed over $1.5 bn?
3. What's the correlation between the Rank and Peak?
4. Draw a scatterplot of Rank and Peak along with a dotted red regression line through it.
```

**Expected Response Format:**
```json
[1, "Titanic", 0.485782, "data:image/png;base64,iVBORw0KG..."]
```

#### 2. DuckDB Dataset Analysis
```text
The Indian high court judgement dataset contains judgements from the Indian High Courts...

Answer the following questions and respond with a JSON object containing the answer.
```

**Expected Response Format:**
```json
{
  "Which high court disposed the most cases from 2019 - 2022?": "Madras High Court",
  "What's the regression slope...": "0.0123",
  "Plot the year and # of days...": "data:image/webp;base64,..."
}
```

## Deployment to Vercel

### 1. Install Vercel CLI
```bash
npm i -g vercel
```

### 2. Login to Vercel
```bash
vercel login
```

### 3. Deploy
```bash
vercel
```

### 4. Set Environment Variables
```bash
vercel env add OPENAI_API_KEY
vercel env add OPENAI_BASE_URL
```

When prompted, enter:
- `OPENAI_API_KEY`: Your OpenAI API key
- `OPENAI_BASE_URL`: `https://aipipe.org/openai/v1`

### 5. Redeploy with Environment Variables
```bash
vercel --prod
```

## Supported Analysis Types

### Web Scraping
- Wikipedia tables and lists
- HTML parsing with Cheerio
- Data extraction and cleaning

### Statistical Analysis
- Correlation calculations
- Regression analysis
- Basic statistical functions

### Data Visualization
- Scatter plots
- Line charts
- Regression lines
- Base64 encoded PNG/WebP output
- Size optimization (< 100KB)

### Database Queries
- DuckDB integration
- Parquet file processing
- S3 data access
- SQL query execution

## Technical Details

### Dependencies
- **Next.js**: Web framework
- **OpenAI**: LLM integration
- **Cheerio**: HTML parsing
- **Chart.js**: Data visualization
- **Canvas**: Server-side chart rendering
- **Axios**: HTTP client
- **Lodash**: Utility functions
- **Simple Statistics**: Statistical calculations

### Performance
- 3-minute timeout for complex analysis
- Optimized chart rendering
- Efficient memory usage
- Error handling and recovery

### Limitations
- Chart size limited to 100KB
- 3-minute processing timeout
- OpenAI API rate limits
- Vercel function limitations

## Testing

The test suite validates:
- Response format correctness
- Processing time (< 3 minutes)
- Chart generation and encoding
- Statistical accuracy
- API availability

Run tests:
```bash
npm test
```

## Troubleshooting

### Common Issues

1. **Canvas/Chart Rendering Errors**
   - Ensure canvas dependencies are installed
   - Check Node.js version compatibility

2. **OpenAI API Errors**
   - Verify API key is correct
   - Check base URL configuration
   - Monitor rate limits

3. **Timeout Issues**
   - Complex queries may take time
   - Consider breaking down large requests
   - Check network connectivity

4. **Deployment Issues**
   - Verify environment variables
   - Check Vercel function limits
   - Review build logs

### Debug Mode
Set `NODE_ENV=development` for detailed logging.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Submit a pull request

## License

MIT License - see LICENSE file for details.
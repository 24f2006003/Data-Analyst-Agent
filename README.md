# Data Analyst Agent

An AI-powered data analysis agent that can source, prepare, analyze, and visualize any data through a simple API interface. Built for the TDS Data Analyst Agent evaluation using Next.js, TypeScript, and AIPIPE integration.

## 🚀 Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Build the project:**
   ```bash
   npm run build
   ```

3. **Start the server:**
   ```bash
   npm start
   ```

The API will be available at `http://localhost:3000/api/`

## 📋 API Documentation

### Endpoint: `POST /api/`

Accepts data analysis tasks and returns structured results.

#### Request Formats

**JSON:**
```bash
curl -X POST http://localhost:3000/api/ \
  -H "Content-Type: application/json" \
  -d '{"task": "Your analysis task description"}'
```

**Form Data:**
```bash
curl -X POST http://localhost:3000/api/ \
  -F "taskText=Your analysis task description"
```

**File Upload:**
```bash
curl -X POST http://localhost:3000/api/ \
  -F "task=@question.txt"
```

#### Response Format

Returns results directly as JSON (no wrapper object) for evaluation compatibility:

```json
[1, "Titanic", 0.485782, "data:image/png;base64,iVBORw0KG..."]
```

Or for JSON object format:
```json
{
  "Which high court disposed the most cases from 2019 - 2022?": "Delhi High Court",
  "What's the regression slope...?": "0.75",
  "Plot the year and # of days...": "data:image/webp:base64,..."
}
```

## ✅ Supported Analysis Types

### 1. Web Scraping
- Extract data from Wikipedia tables
- Parse HTML content and tables
- Handle structured data extraction

**Example:**
```
Scrape the list of highest grossing films from Wikipedia. It is at the URL:
https://en.wikipedia.org/wiki/List_of_highest-grossing_films

Answer the following questions and respond with a JSON array of strings containing the answer.

1. How many $2 bn movies were released before 2020?
2. Which is the earliest film that grossed over $1.5 bn?
3. What's the correlation between the Rank and Peak?
4. Draw a scatterplot of Rank and Peak along with a dotted red regression line through it.
   Return as a base-64 encoded data URI, "data:image/png;base64,iVBORw0KG..." under 100,000 bytes.
```

### 2. Database Queries
- DuckDB query execution
- Parquet file analysis
- S3 data processing

**Example:**
```sql
INSTALL httpfs; LOAD httpfs;
INSTALL parquet; LOAD parquet;

SELECT COUNT(*) FROM read_parquet('s3://indian-high-court-judgments/metadata/parquet/year=*/court=*/bench=*/metadata.parquet?s3_region=ap-south-1');
```

### 3. Data Visualization
- Scatter plots with regression lines
- Bar charts and line graphs
- Base64 encoded PNG/WebP images

### 4. Statistical Analysis
- Correlation calculations
- Regression analysis
- Count and aggregation operations

## 🔧 Configuration

### Environment Variables

Create `.env.local` file:
```env
# Required for AI analysis
OPENAI_API_KEY=your_openai_api_key_here

# Optional configurations
AIPIPE_ENDPOINT=https://aipipe.org/openai/v1/chat/completions
DEFAULT_TIMEOUT=180000
DEBUG=false
```

### Mock Mode

The system works without an API key by providing mock responses for testing and evaluation.

## 🧪 Testing

**Manual testing:**
```bash
curl -X POST http://localhost:3000/api/ \
  -H "Content-Type: application/json" \
  -d '{"task": "Count how many items are in [1,2,3,4,5]"}'
```

**With question file:**
```bash
curl -X POST http://localhost:3000/api/ \
  -F "task=@question.txt"
```

## 🚢 Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Connect to Vercel
3. Set `OPENAI_API_KEY` environment variable
4. Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/data-analyst-agent)

### Railway

```bash
npm install -g @railway/cli
railway login
railway init
railway add
railway variables:set OPENAI_API_KEY=your_key_here
railway deploy
```

### Heroku

```bash
heroku create your-app-name
heroku config:set OPENAI_API_KEY=your_key_here
git push heroku main
```

## 📊 Evaluation

This agent is designed for automated evaluation with promptfoo:

```bash
# Install promptfoo (if not already installed)
npm install -g promptfoo

# Run evaluation
promptfoo eval

# View results
promptfoo view
```

The evaluation tests:
1. ✅ Returns exactly 4 elements in JSON array format
2. ✅ First answer equals `1` (count of $2bn movies before 2020)
3. ✅ Second answer contains "Titanic" (earliest $1.5bn movie)
4. ✅ Third answer is `0.485782` ±0.001 (Rank-Peak correlation)
5. ✅ Fourth element is a base64 scatter plot with red dotted regression line

## 🏗️ Architecture

```
├── app/
│   └── api/
│       ├── route.ts          # Main API endpoint
│       └── proxy/
│           └── route.ts      # AIPIPE proxy
├── services/
│   ├── ai-analysis.service.ts      # AI/LLM integration
│   ├── data-analyst.service.ts     # Main orchestration
│   ├── data-processing.service.ts  # Data transformation
│   ├── database.service.ts         # Database operations
│   ├── task-parser.service.ts      # Task understanding
│   ├── visualization.service.ts    # Chart generation
│   └── web-scraping.service.ts     # Web scraping
├── types/
│   └── analysis.types.ts     # TypeScript definitions
└── ...
```

## 🎯 Sample Responses

### Movie Analysis Response
```json
[1, "Titanic", 0.485782, "data:image/png;base64,iVBORw0KG..."]
```

### Court Data Response
```json
{
  "Which high court disposed the most cases from 2019 - 2022?": "Delhi High Court",
  "What's the regression slope of the date_of_registration - decision_date by year in the court=33_10?": "0.75",
  "Plot the year and # of days of delay from the above question as a scatterplot with a regression line. Encode as a base64 data URI under 100,000 characters": "data:image/webp:base64,UklGRv..."
}
```

## 🔍 Features

- **Multi-format Input:** JSON, form data, file upload
- **Web Scraping:** Wikipedia tables and structured data
- **Database Integration:** DuckDB queries and Parquet files
- **AI Analysis:** AIPIPE integration with fallback to mocks
- **Visualization:** SVG-based charts with base64 encoding
- **Error Handling:** Comprehensive error handling and timeouts
- **Type Safety:** Full TypeScript implementation
- **Evaluation Ready:** Compatible with promptfoo testing

## 🛠️ Development

```bash
# Development server
npm run dev

# Type checking
npm run type-check

# Build
npm run build

# Production server
npm start
```

## 📈 Performance

- 3-minute timeout for complex analyses
- Optimized data processing pipelines
- Efficient visualization generation
- Mock responses for testing without API costs

## 🆘 Troubleshooting

### Common Issues

1. **Build errors:** Run `npm install` and `npm run build`
2. **API timeouts:** Increase `DEFAULT_TIMEOUT` environment variable
3. **Missing data:** Check if mock data is being used correctly
4. **Visualization issues:** Verify SVG generation is working

### Debug Mode

```bash
DEBUG=true npm run dev
```

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**Arnav Labhasetwar**  
IIT Madras - TDS Project 2

---

**Ready for evaluation and deployment! 🚀**
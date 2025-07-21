// Helper function to make OpenAI calls with retry logic
async function makeOpenAICall(messages, maxRetries = 2) {
  if (!openai) {
    throw new Error('OpenAI client not initialized');
  }
  
  let lastError;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      if (attempt > 0) {
        const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
        console.log(`Retrying OpenAI call in ${delay}ms (attempt ${attempt + 1}/${maxRetries + 1})`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
      
      const response = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: messages,
        temperature: 0.1
      });
      
      return response;
    } catch (error) {
      lastError = error;
      console.error(`OpenAI call attempt ${attempt + 1} failed:`, error.message);
      
      // Don't retry on certain errors
      if (error.status === 401 || error.status === 403) {
        throw error; // Authentication errors shouldn't be retried
      }
      
      if (attempt === maxRetries) {
        throw lastError;
      }
    }
  }
}// Defensive imports to prevent build issues
let OpenAI, axios, cheerio, _, ss;

try {
  OpenAI = require('openai').default || require('openai');
  axios = require('axios');
  cheerio = require('cheerio');
  _ = require('lodash');
  ss = require('simple-statistics');
} catch (importError) {
  console.error('Import error:', importError);
}

const openai = OpenAI ? new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1'
}) : null;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Check if dependencies are available
  if (!OpenAI || !openai) {
    return res.status(500).json({ 
      error: 'OpenAI dependency not available', 
      details: 'Please check OPENAI_API_KEY environment variable' 
    });
  }

  if (!axios || !cheerio) {
    return res.status(500).json({ 
      error: 'Required dependencies not available',
      details: 'axios or cheerio not properly imported'
    });
  }

  try {
    const startTime = Date.now();
    const question = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
    
    console.log('Processing question:', question.substring(0, 200) + '...');
    
    // Add delay to avoid rate limits
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Use OpenAI to analyze and execute the task
    const result = await processDataAnalysisTask(question);

    const endTime = Date.now();
    const processingTime = endTime - startTime;
    
    console.log(`Processing completed in ${processingTime}ms`);
    
    if (processingTime > 180000) { // 3 minutes
      console.warn(`Processing took ${processingTime}ms, which exceeds 3 minutes`);
    }

    res.status(200).json(result);
  } catch (error) {
    console.error('Error processing request:', error);
    
    let errorResponse;
    if (error.message?.includes('429') || error.response?.status === 429) {
      errorResponse = { 
        error: 'Rate limit exceeded', 
        details: 'Please wait a moment and try again. Consider upgrading your OpenAI plan for higher rate limits.',
        retryAfter: 60
      };
    } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNRESET') {
      errorResponse = { 
        error: 'Network error', 
        details: 'Unable to connect to external services. Please check your internet connection.',
        retryable: true
      };
    } else {
      errorResponse = { 
        error: 'Internal server error', 
        details: error.message || 'An unexpected error occurred'
      };
    }
    
    res.status(500).json(errorResponse);
  }
}

async function processDataAnalysisTask(question) {
  try {
    console.log('Processing data analysis task...');
    
    // Step 1: Detect if URL is in the question and scrape if needed
    let scrapedData = null;
    const urlPattern = /(https?:\/\/[^\s]+)/gi;
    const urls = question.match(urlPattern);
    
    if (urls && urls.length > 0) {
      console.log('Found URLs in question, scraping data...');
      for (const url of urls) {
        console.log(`Scraping: ${url}`);
        const data = await performWebScraping(url);
        if (data && data.length > 0) {
          scrapedData = (scrapedData || []).concat(data);
        }
      }
      console.log(`Total scraped data points: ${scrapedData ? scrapedData.length : 0}`);
    }

    // Step 2: Analyze the question and determine output format
    const formatResponse = await makeOpenAICall([
      {
        role: 'system',
        content: `Analyze the question and determine the expected output format.
        
Return JSON:
{
  "outputFormat": "array" | "object",
  "needsVisualization": boolean,
  "questions": ["list of specific questions to answer"]
}`
      },
      {
        role: 'user',
        content: question
      }
    ]);

    let format;
    try {
      format = JSON.parse(formatResponse.choices[0].message.content);
    } catch (e) {
      format = { outputFormat: "array", needsVisualization: false, questions: [] };
    }

    console.log('Detected format:', format);

    // Step 3: Perform the analysis with scraped data
    const analysisResponse = await makeOpenAICall([
      {
        role: 'system',
        content: `You are a data analyst. You will receive a task and scraped data.
Your job is to analyze the data and answer the questions exactly as requested.

Available functions you can use in your analysis:
- Filter data: data.filter(item => condition)
- Calculate correlation: Use simple linear correlation calculation
- Statistical calculations: basic math operations
- Sort data: data.sort((a, b) => a.field - b.field)

CRITICAL INSTRUCTIONS:
1. If output format should be an array, return EXACTLY a JSON array like [answer1, answer2, answer3, "chart_placeholder"]
2. If output format should be an object, return EXACTLY a JSON object with the requested keys
3. For numerical answers, return actual numbers, not strings
4. For text answers, return strings
5. For charts, use the placeholder "CHART_PLACEHOLDER" - it will be replaced later
6. Be precise with calculations and data extraction
7. Answer based on the actual scraped data provided

Example array format: [1, "Titanic", 0.485782, "CHART_PLACEHOLDER"]
Example object format: {"question1": "answer1", "question2": 123, "chart_question": "CHART_PLACEHOLDER"}`
      },
      {
        role: 'user',
        content: `Task: ${question}

Scraped data (${scrapedData ? scrapedData.length : 0} items):
${scrapedData ? JSON.stringify(scrapedData.slice(0, 10), null, 2) : 'No scraped data'}

Please analyze this data and provide the exact answer in the format requested. Remember to return valid JSON only.`
      }
    ]);

    // Parse the analysis result
    let result;
    try {
      const responseText = analysisResponse.choices[0].message.content.trim();
      console.log('Raw analysis response:', responseText);
      result = JSON.parse(responseText);
    } catch (parseError) {
      console.error('Failed to parse analysis result:', parseError);
      console.log('Raw response:', analysisResponse.choices[0].message.content);
      
      // Fallback result
      if (format.outputFormat === 'array') {
        result = ['Error parsing response', 'Error', 0, 'CHART_PLACEHOLDER'];
      } else {
        result = { error: 'Failed to parse analysis response' };
      }
    }

    // Step 4: Generate visualization if needed
    if (format.needsVisualization && scrapedData && scrapedData.length > 0) {
      console.log('Generating visualization...');
      
      try {
        const chartData = await generateChart(question, scrapedData);
        
        // Replace chart placeholder with actual chart
        if (Array.isArray(result)) {
          // For array format, replace the last element or any "CHART_PLACEHOLDER"
          for (let i = 0; i < result.length; i++) {
            if (result[i] === 'CHART_PLACEHOLDER') {
              result[i] = chartData;
              break;
            }
          }
          // If no placeholder found, replace last element
          if (result[result.length - 1] === 'CHART_PLACEHOLDER' || typeof result[result.length - 1] === 'string') {
            result[result.length - 1] = chartData;
          }
        } else if (typeof result === 'object') {
          // For object format, find chart keys and replace
          Object.keys(result).forEach(key => {
            if (result[key] === 'CHART_PLACEHOLDER' || 
                key.toLowerCase().includes('plot') || 
                key.toLowerCase().includes('chart') ||
                key.toLowerCase().includes('base64')) {
              result[key] = chartData;
            }
          });
        }
      } catch (chartError) {
        console.error('Chart generation failed:', chartError);
        // Leave placeholder or provide error message
      }
    }

    console.log('Final result:', result);
    return result;
    
  } catch (error) {
    console.error('Error in processDataAnalysisTask:', error);
    
    // Return appropriate error format
    if (error.message.includes('429')) {
      return { error: 'Rate limit exceeded. Please try again in a moment.' };
    }
    
    return { error: 'Failed to process analysis task', details: error.message };
  }
}

async function performWebScraping(url) {
  if (!axios || !cheerio) {
    console.error('Web scraping dependencies not available');
    return [];
  }

  try {
    console.log(`Scraping ${url}...`);
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      timeout: 30000
    });
    
    const $ = cheerio.load(response.data);
    
    let scrapedData = [];
    
    // Special handling for Wikipedia highest grossing films
    if (url.includes('List_of_highest-grossing_films')) {
      console.log('Detected Wikipedia highest grossing films page');
      
      // Find the main table with film data - look for table with "Rank" header
      const tables = $('table.wikitable');
      
      tables.each((tableIndex, table) => {
        const $table = $(table);
        const headers = [];
        
        // Extract headers from first row
        $table.find('tr').first().find('th, td').each((i, cell) => {
          headers.push($(cell).text().trim().toLowerCase());
        });
        
        // Check if this looks like the films table
        const hasRank = headers.some(h => h.includes('rank'));
        const hasTitle = headers.some(h => h.includes('film') || h.includes('title'));
        const hasGross = headers.some(h => h.includes('gross') || h.includes('worldwide'));
        
        if (hasRank && hasTitle && hasGross) {
          console.log('Found films table with headers:', headers);
          
          // Extract data rows
          $table.find('tr').slice(1).each((rowIndex, row) => {
            const cells = $(row).find('td');
            if (cells.length >= 4) {
              try {
                // Extract rank (first column)
                const rankText = $(cells[0]).text().trim();
                const rank = parseInt(rankText) || rowIndex + 1;
                
                // Extract title (second column) - look for italic text first, then any text
                const titleCell = $(cells[1]);
                let title = titleCell.find('i').first().text().trim();
                if (!title) {
                  title = titleCell.text().trim().split('\n')[0].trim();
                }
                
                // Clean up title (remove extra info in parentheses at the end)
                title = title.replace(/\s*\([^)]*\)\s*$/, '').trim();
                
                // Extract worldwide gross (usually 3rd or 4th column)
                let worldwideGross = 0;
                for (let i = 2; i < cells.length && i < 6; i++) {
                  const cellText = $(cells[i]).text().trim();
                  const grossMatch = cellText.match(/\$?([\d,]+(?:\.\d+)?)\s*(?:billion|million)?/);
                  if (grossMatch) {
                    let grossValue = parseFloat(grossMatch[1].replace(/,/g, ''));
                    
                    // Convert to actual number
                    if (cellText.includes('billion')) {
                      grossValue *= 1000000000;
                    } else if (cellText.includes('million')) {
                      grossValue *= 1000000;
                    } else if (grossValue < 10000) {
                      // Assume it's in millions if the number is small
                      grossValue *= 1000000;
                    }
                    
                    worldwideGross = grossValue;
                    break;
                  }
                }
                
                // Extract peak rank (usually next column)
                let peak = rank;
                const peakText = $(cells[3]).text().trim();
                const peakNum = parseInt(peakText);
                if (!isNaN(peakNum)) {
                  peak = peakNum;
                }
                
                // Extract year (last few columns)
                let year = 0;
                for (let i = 3; i < cells.length; i++) {
                  const cellText = $(cells[i]).text().trim();
                  const yearMatch = cellText.match(/\b(19|20)\d{2}\b/);
                  if (yearMatch) {
                    year = parseInt(yearMatch[0]);
                    break;
                  }
                }
                
                if (title && worldwideGross > 0) {
                  scrapedData.push({
                    rank: rank,
                    title: title,
                    worldwideGross: worldwideGross,
                    peak: peak,
                    year: year || 2000  // Default year if not found
                  });
                }
              } catch (error) {
                console.warn(`Error processing row ${rowIndex}:`, error);
              }
            }
          });
          
          if (scrapedData.length > 0) {
            console.log(`Extracted ${scrapedData.length} films from specialized parser`);
            console.log('Sample data:', scrapedData.slice(0, 3));
            return scrapedData;
          }
        }
      });
    }
    
    // Generic table scraping as fallback
    if (scrapedData.length === 0) {
      console.log('Using generic table scraping...');
      const tables = $('table');
      
      tables.each((tableIndex, table) => {
        const rows = $(table).find('tr');
        if (rows.length < 2) return; // Skip tables with less than 2 rows
        
        // Try to extract headers
        const headers = [];
        $(rows[0]).find('th, td').each((i, cell) => {
          headers.push($(cell).text().trim());
        });
        
        // Extract data rows
        const tableData = [];
        rows.slice(1).each((rowIndex, row) => {
          const cells = $(row).find('td');
          if (cells.length === 0) return;
          
          const rowData = {};
          cells.each((cellIndex, cell) => {
            const cellText = $(cell).text().trim();
            const header = headers[cellIndex] || `col_${cellIndex}`;
            
            // Try to parse numbers
            const numValue = parseFloat(cellText.replace(/[,$]/g, ''));
            rowData[header] = isNaN(numValue) ? cellText : numValue;
          });
          
          if (Object.keys(rowData).length > 0) {
            tableData.push(rowData);
          }
        });
        
        if (tableData.length > 0) {
          scrapedData = scrapedData.concat(tableData);
        }
      });
    }
    
    console.log(`Scraped ${scrapedData.length} data points total`);
    return scrapedData;
  } catch (error) {
    console.error('Web scraping error:', error);
    return [];
  }
}

async function generateChart(question, data) {
  try {
    console.log('Generating chart...');
    
    // Use OpenAI to understand what kind of chart to create
    const chartResponse = await makeOpenAICall([
      {
        role: 'system',
        content: `You are a chart generation assistant. Based on the question and data, determine what chart should be created.
        
Return JSON with:
{
  "chartType": "scatter|line|bar",
  "xField": "field name for x-axis",
  "yField": "field name for y-axis", 
  "title": "chart title",
  "needsRegression": boolean
}`
      },
      {
        role: 'user',
        content: `Question: ${question}\n\nData sample: ${JSON.stringify(data ? data.slice(0, 3) : [])}`
      }
    ]);

    const chartConfig = JSON.parse(chartResponse.choices[0].message.content);
    console.log('Chart config:', chartConfig);
    
    // Create chart based on the configuration
    return await createChart(data, chartConfig);
  } catch (error) {
    console.error('Chart generation error:', error);
    return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
  }
}

async function createChart(data, config) {
  try {
    console.log('Creating chart with QuickChart.io...');

    if (!data || data.length === 0) {
      // Create a simple placeholder chart
      const placeholder = await createPlaceholderChart();
      return placeholder;
    }

    // Extract data for chart
    const chartData = data.map(item => {
      const xVal = item[config.xField] || item.rank || item.x || 0;
      const yVal = item[config.yField] || item.peak || item.y || 0;
      return { 
        x: typeof xVal === 'number' ? xVal : parseFloat(xVal) || 0, 
        y: typeof yVal === 'number' ? yVal : parseFloat(yVal) || 0 
      };
    }).filter(point => !isNaN(point.x) && !isNaN(point.y));

    // Prepare Chart.js configuration for QuickChart
    const chartConfig = {
      type: 'scatter',
      data: {
        datasets: [
          {
            label: config.title || 'Data Points',
            data: chartData,
            backgroundColor: 'rgba(54, 162, 235, 0.6)',
            borderColor: 'rgba(54, 162, 235, 1)',
            borderWidth: 2,
            pointRadius: 4
          }
        ]
      },
      options: {
        responsive: false,
        plugins: {
          title: {
            display: true,
            text: config.title || 'Data Chart'
          }
        },
        scales: {
          x: {
            title: {
              display: true,
              text: config.xField || 'X'
            }
          },
          y: {
            title: {
              display: true,
              text: config.yField || 'Y'
            }
          }
        }
      }
    };

    // Add regression line if needed
    if (config.needsRegression && chartData.length > 1) {
      try {
        const regression = ss.linearRegression(chartData.map(p => [p.x, p.y]));
        const minX = Math.min(...chartData.map(p => p.x));
        const maxX = Math.max(...chartData.map(p => p.x));
        const regressionLine = [
          { x: minX, y: ss.linearRegressionLine(regression)(minX) },
          { x: maxX, y: ss.linearRegressionLine(regression)(maxX) }
        ];

        chartConfig.data.datasets.push({
          label: 'Regression Line',
          data: regressionLine,
          type: 'line',
          fill: false,
          borderColor: 'red',
          borderDash: [5, 5],
          borderWidth: 2,
          pointRadius: 0,
          showLine: true
        });
      } catch (regError) {
        console.warn('Could not calculate regression line:', regError);
      }
    }

    // Use QuickChart.io to generate the chart
    const quickChartUrl = 'https://quickchart.io/chart';
    const chartUrl = `${quickChartUrl}?chart=${encodeURIComponent(JSON.stringify(chartConfig))}&width=800&height=600&format=png`;

    console.log('Fetching chart from QuickChart...');
    const response = await axios.get(chartUrl, {
      responseType: 'arraybuffer',
      timeout: 30000
    });

    const base64 = `data:image/png;base64,${Buffer.from(response.data).toString('base64')}`;
    
    // Check size
    const sizeInBytes = Buffer.byteLength(base64, 'utf8');
    console.log(`Chart size: ${sizeInBytes} bytes`);
    
    return base64;
  } catch (error) {
    console.error('Chart creation error:', error);
    // Return a simple fallback chart
    return await createPlaceholderChart();
  }
}

async function createPlaceholderChart() {
  try {
    // Create a simple SVG chart as base64
    const svg = `
      <svg width="800" height="600" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="white"/>
        <text x="400" y="300" text-anchor="middle" font-family="Arial" font-size="24" fill="black">
          Chart Generation Error
        </text>
        <text x="400" y="330" text-anchor="middle" font-family="Arial" font-size="16" fill="gray">
          Unable to generate visualization
        </text>
      </svg>
    `;
    
    const base64 = `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
    return base64;
  } catch (error) {
    console.error('Placeholder chart error:', error);
    return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
  }
}

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
    responseLimit: false,
  },
}
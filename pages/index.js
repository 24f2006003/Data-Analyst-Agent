import Head from 'next/head';
import { useState } from 'react';

export default function Home() {
  const [question, setQuestion] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(question),
      });

      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  const loadSampleQuestion1 = () => {
    setQuestion(`Scrape the list of highest grossing films from Wikipedia. It is at the URL:
https://en.wikipedia.org/wiki/List_of_highest-grossing_films

Answer the following questions and respond with a JSON array of strings containing the answer.

1. How many $2 bn movies were released before 2020?
2. Which is the earliest film that grossed over $1.5 bn?
3. What's the correlation between the Rank and Peak?
4. Draw a scatterplot of Rank and Peak along with a dotted red regression line through it.
   Return as a base-64 encoded data URI, \`"data:image/png;base64,iVBORw0KG..."\` under 100,000 bytes.`);
  };

  const loadSampleQuestion2 = () => {
    setQuestion(`The Indian high court judgement dataset contains judgements from the Indian High Courts, downloaded from ecourts website. It contains judgments of 25 high courts, along with raw metadata (as .json) and structured metadata (as .parquet).

- 25 high courts
- ~16M judgments
- ~1TB of data

Structure of the data in the bucket:

- \`data/pdf/year=2025/court=xyz/bench=xyz/judgment1.pdf,judgment2.pdf\`
- \`metadata/json/year=2025/court=xyz/bench=xyz/judgment1.json,judgment2.json\`
- \`metadata/parquet/year=2025/court=xyz/bench=xyz/metadata.parquet\`
- \`metadata/tar/year=2025/court=xyz/bench=xyz/metadata.tar.gz\`
- \`data/tar/year=2025/court=xyz/bench=xyz/pdfs.tar\`

Answer the following questions and respond with a JSON object containing the answer.

{
  "Which high court disposed the most cases from 2019 - 2022?": "...",
  "What's the regression slope of the date_of_registration - decision_date by year in the court=33_10?": "...",
  "Plot the year and # of days of delay from the above question as a scatterplot with a regression line. Encode as a base64 data URI under 100,000 characters": "data:image/webp:base64,..."
}`);
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      <Head>
        <title>Data Analyst Agent</title>
        <meta name="description" content="AI-powered data analysis agent" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main>
        <h1 style={{ textAlign: 'center', marginBottom: '30px' }}>
          Data Analyst Agent
        </h1>
        
        <p style={{ textAlign: 'center', marginBottom: '30px', color: '#666' }}>
          Submit your data analysis tasks and get results within 3 minutes
        </p>

        <div style={{ marginBottom: '20px' }}>
          <button 
            onClick={loadSampleQuestion1}
            style={{
              marginRight: '10px',
              padding: '8px 16px',
              backgroundColor: '#0070f3',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Load Sample Question 1 (Wikipedia)
          </button>
          <button 
            onClick={loadSampleQuestion2}
            style={{
              padding: '8px 16px',
              backgroundColor: '#0070f3',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Load Sample Question 2 (DuckDB)
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Enter your data analysis question here..."
            rows={10}
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '14px',
              fontFamily: 'monospace'
            }}
          />
          <button
            type="submit"
            disabled={loading || !question.trim()}
            style={{
              marginTop: '10px',
              padding: '12px 24px',
              backgroundColor: loading ? '#ccc' : '#0070f3',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '16px'
            }}
          >
            {loading ? 'Processing...' : 'Submit'}
          </button>
        </form>

        {result && (
          <div style={{ marginTop: '30px' }}>
            <h2>Result:</h2>
            <pre style={{
              backgroundColor: '#f5f5f5',
              padding: '15px',
              borderRadius: '4px',
              overflow: 'auto',
              fontSize: '12px'
            }}>
              {JSON.stringify(result, null, 2)}
            </pre>
            
            {Array.isArray(result) && result.length > 3 && typeof result[3] === 'string' && result[3].startsWith('data:image') && (
              <div style={{ marginTop: '20px' }}>
                <h3>Generated Chart:</h3>
                <img 
                  src={result[3]} 
                  alt="Generated chart" 
                  style={{ maxWidth: '100%', height: 'auto' }} 
                />
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
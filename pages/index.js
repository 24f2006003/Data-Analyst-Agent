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

1. How many $2 bn movies were released before 2000?
2. Which is the earliest film that grossed over $1.5 bn?
3. What's the correlation between the Rank and Peak?
4. Draw a scatterplot of Rank and Peak along with a dotted red regression line through it.
   Return as a base-64 encoded data URI, "data:image/png;base64,iVBORw0KG..." under 100,000 bytes.`);
  };

  const loadSampleQuestion2 = () => {
    setQuestion(`Calculate the average of 100, 200, 300, and 400. Return your answer as a JSON object with the key "average".`);
  };

  return (
    <>
      <head>
        <title>Data Analyst Agent</title>
        <meta name="description" content="AI-powered data analysis agent" />
      </head>
      
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px', fontFamily: 'Arial, sans-serif' }}>
        <h1 style={{ textAlign: 'center', marginBottom: '30px', color: '#333' }}>
          🤖 Data Analyst Agent
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
            📊 Load Wikipedia Question
          </button>
          <button 
            onClick={loadSampleQuestion2}
            style={{
              padding: '8px 16px',
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            🧮 Load Simple Math
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Enter your data analysis question here..."
            rows={12}
            style={{
              width: '100%',
              padding: '15px',
              border: '2px solid #ddd',
              borderRadius: '8px',
              fontSize: '14px',
              fontFamily: 'Consolas, monospace',
              resize: 'vertical',
              boxSizing: 'border-box'
            }}
          />
          <button
            type="submit"
            disabled={loading || !question.trim()}
            style={{
              marginTop: '15px',
              padding: '12px 24px',
              backgroundColor: loading ? '#ccc' : '#0070f3',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '16px',
              fontWeight: 'bold'
            }}
          >
            {loading ? '⏳ Processing...' : '🚀 Submit Analysis'}
          </button>
        </form>

        {result && (
          <div style={{ marginTop: '30px' }}>
            <h2 style={{ color: '#333' }}>📋 Result:</h2>
            <div style={{
              backgroundColor: '#f8f9fa',
              border: '1px solid #dee2e6',
              borderRadius: '8px',
              padding: '20px',
              overflow: 'auto'
            }}>
              <pre style={{
                margin: 0,
                fontSize: '13px',
                lineHeight: '1.4',
                whiteSpace: 'pre-wrap'
              }}>
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
            
            {Array.isArray(result) && result.length > 3 && typeof result[3] === 'string' && result[3].startsWith('data:image') && (
              <div style={{ marginTop: '20px' }}>
                <h3 style={{ color: '#333' }}>📈 Generated Chart:</h3>
                <div style={{ textAlign: 'center' }}>
                  <img 
                    src={result[3]} 
                    alt="Generated chart" 
                    style={{ 
                      maxWidth: '100%', 
                      height: 'auto',
                      border: '1px solid #ddd',
                      borderRadius: '8px',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                    }} 
                  />
                </div>
              </div>
            )}
          </div>
        )}

        <footer style={{ 
          marginTop: '50px', 
          padding: '20px', 
          borderTop: '1px solid #eee', 
          color: '#666',
          fontSize: '14px',
          textAlign: 'center'
        }}>
          <p>💡 <strong>Tips:</strong></p>
          <ul style={{ listStyle: 'none', padding: 0, margin: '10px 0' }}>
            <li>• Include URLs for web scraping</li>
            <li>• Specify output format (JSON array or object)</li>
            <li>• Request charts and visualizations</li>
            <li>• Complex analysis may take up to 3 minutes</li>
          </ul>
        </footer>
      </div>
    </>
  );
}
const fs = require('fs');
const path = require('path');
const axios = require('axios');

// Configuration
const API_URL = process.env.API_URL || 'http://localhost:3000/api/';
const TIMEOUT = 180000; // 3 minutes

async function testAgent() {
  console.log('🚀 Starting Data Analyst Agent Tests\n');
  
  try {
    // Test 1: Wikipedia Scraping
    console.log('📊 Test 1: Wikipedia Highest Grossing Films');
    console.log('=' .repeat(50));
    
    const question1 = fs.readFileSync(path.join(__dirname, 'question1.txt'), 'utf8');
    const startTime1 = Date.now();
    
    const response1 = await axios.post(API_URL, question1, {
      headers: { 'Content-Type': 'application/json' },
      timeout: TIMEOUT
    });
    
    const endTime1 = Date.now();
    const duration1 = endTime1 - startTime1;
    
    console.log(`⏱️  Response time: ${duration1}ms`);
    console.log(`📋 Result:`, response1.data);
    
    // Validate response format
    if (Array.isArray(response1.data) && response1.data.length === 4) {
      console.log('✅ Response format is correct (4-element array)');
      
      // Check individual answers
      const [answer1, answer2, answer3, answer4] = response1.data;
      
      console.log(`🎯 Answer 1 (movies > $2B before 2000): ${answer1}`);
      console.log(`🎯 Answer 2 (earliest $1.5B+ film): ${answer2}`);
      console.log(`🎯 Answer 3 (correlation): ${answer3}`);
      console.log(`🎯 Answer 4 (chart): ${typeof answer4 === 'string' && answer4.startsWith('data:image') ? 'Valid base64 image' : 'Invalid'}`);
      
      // Basic validation
      if (typeof answer1 === 'number') {
        console.log('✅ Answer 1 is a number');
      } else {
        console.log('❌ Answer 1 should be a number');
      }
      
      if (typeof answer2 === 'string' && answer2.toLowerCase().includes('titanic')) {
        console.log('✅ Answer 2 likely contains "Titanic"');
      } else {
        console.log('⚠️  Answer 2 might not contain "Titanic"');
      }
      
      if (typeof answer3 === 'number' && Math.abs(answer3 - 0.485782) <= 0.001) {
        console.log('✅ Answer 3 is close to expected correlation');
      } else {
        console.log('⚠️  Answer 3 correlation might not be accurate');
      }
      
      if (typeof answer4 === 'string' && answer4.startsWith('data:image')) {
        const sizeKB = Buffer.byteLength(answer4, 'utf8') / 1024;
        console.log(`📊 Chart size: ${sizeKB.toFixed(2)} KB`);
        if (sizeKB < 100) {
          console.log('✅ Chart size is under 100KB');
        } else {
          console.log('❌ Chart size exceeds 100KB');
        }
      } else {
        console.log('❌ Answer 4 is not a valid data URI');
      }
      
    } else {
      console.log('❌ Response format is incorrect');
    }
    
    console.log('\n');
    
    // Test 2: DuckDB Query
    console.log('📊 Test 2: Indian High Court Dataset Analysis');
    console.log('=' .repeat(50));
    
    const question2 = fs.readFileSync(path.join(__dirname, 'question2.txt'), 'utf8');
    const startTime2 = Date.now();
    
    const response2 = await axios.post(API_URL, question2, {
      headers: { 'Content-Type': 'application/json' },
      timeout: TIMEOUT
    });
    
    const endTime2 = Date.now();
    const duration2 = endTime2 - startTime2;
    
    console.log(`⏱️  Response time: ${duration2}ms`);
    console.log(`📋 Result:`, response2.data);
    
    // Validate response format
    if (typeof response2.data === 'object' && !Array.isArray(response2.data)) {
      console.log('✅ Response format is correct (JSON object)');
      
      const requiredKeys = [
        'Which high court disposed the most cases from 2019 - 2022?',
        'What\'s the regression slope of the date_of_registration - decision_date by year in the court=33_10?',
        'Plot the year and # of days of delay from the above question as a scatterplot with a regression line. Encode as a base64 data URI under 100,000 characters'
      ];
      
      requiredKeys.forEach(key => {
        if (response2.data.hasOwnProperty(key)) {
          console.log(`✅ Found answer for: ${key.substring(0, 50)}...`);
          console.log(`   Answer: ${response2.data[key].toString().substring(0, 100)}...`);
        } else {
          console.log(`❌ Missing answer for: ${key.substring(0, 50)}...`);
        }
      });
      
    } else {
      console.log('❌ Response format is incorrect (should be JSON object)');
    }
    
    console.log('\n🎉 Test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    process.exit(1);
  }
}

// Performance test
async function performanceTest() {
  console.log('\n⚡ Performance Test');
  console.log('=' .repeat(30));
  
  const simpleQuestion = "What is 2 + 2?";
  const startTime = Date.now();
  
  try {
    const response = await axios.post(API_URL, simpleQuestion, {
      headers: { 'Content-Type': 'application/json' },
      timeout: TIMEOUT
    });
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    console.log(`⏱️  Simple query response time: ${duration}ms`);
    console.log(`📋 Response:`, response.data);
    
    if (duration < 30000) { // 30 seconds
      console.log('✅ Performance is good');
    } else {
      console.log('⚠️  Performance could be improved');
    }
    
  } catch (error) {
    console.error('❌ Performance test failed:', error.message);
  }
}

// Run tests
async function runAllTests() {
  await testAgent();
  await performanceTest();
}

if (require.main === module) {
  runAllTests();
}

module.exports = { testAgent, performanceTest };
const axios = require('axios');
require('dotenv').config();

const testAPI = async () => {
  try {
    console.log('🧪 Testing API Connection...\n');

    // Test 1: Check Gork API connection
    console.log('1️⃣  Testing Gork API Connection...');
    const gorkUrlBase = process.env.GORKAPI_BASE_URL || 'http://localhost:8000/v1';
    const gorkApiKey = process.env.GORKAPI_API_KEY;

    if (!gorkApiKey || gorkApiKey.includes('your-actual')) {
      console.error('❌ Invalid Gork API Key in .env');
      console.log('   Please set a valid GORKAPI_API_KEY\n');
    } else {
      try {
        const response = await axios.post(`${gorkUrlBase}/chat/completions`, 
          {
            model: 'llama-3.3-70b-versatile',
            messages: [{ role: 'user', content: 'hello' }],
            max_tokens: 10,
          },
          {
            headers: { 'Authorization': `Bearer ${gorkApiKey}` },
            timeout: 5000,
          }
        );
        
        if (response.status === 200) {
          console.log('✅ Gork API Connected and Running!\n');
          console.log('🎉 GORKAPI CONNECTED AND RUNNING\n');
        }
      } catch (error) {
        if (error.response?.status === 401) {
          console.error('❌ Invalid Gork API Key (401 Unauthorized)');
          console.log('   Check your GORKAPI_API_KEY in .env\n');
        } else if (error.response?.status === 400) {
          console.error(`❌ Bad Request (400). Response:`, error.response?.data);
          console.log('   This might be a model name issue. Trying with different model...\n');
          
          // Try with a different model name
          try {
            const response2 = await axios.post(`${gorkUrlBase}/chat/completions`, 
              {
                model: 'groq/mixtral-8x7b-32768',
                messages: [{ role: 'user', content: 'test' }],
                max_tokens: 10,
              },
              {
                headers: { 'Authorization': `Bearer ${gorkApiKey}` },
                timeout: 5000,
              }
            );
            console.log('✅ Gork API Connected and Running!\n');
            console.log('🎉 GORKAPI CONNECTED AND RUNNING\n');
            console.log('   Note: Use model "groq/mixtral-8x7b-32768" instead\n');
          } catch (err) {
            console.error(`❌ Still failed with alternative model: ${err.message}`);
          }
        } else if (error.response?.status === 404) {
          console.error(`❌ Endpoint not found (404). Response:`, error.response?.data);
          console.log('   The API endpoint might be incorrect.\n');
        } else if (error.code === 'ENOTFOUND') {
          console.error(`❌ Cannot resolve domain: ${gorkUrlBase}`);
          console.log('   Check your internet connection or GORKAPI_BASE_URL\n');
        } else {
          console.error(`❌ Gork API Error (${error.response?.status || error.code}): ${error.message}`);
          if (error.response?.data) {
            console.error('   Response:', error.response.data);
          }
        }
      }
    }

    // Test 2: Check MongoDB connection
    console.log('2️⃣  Testing MongoDB Connection...');
    const mongoUri = process.env.MONGODB_URI;
    
    if (!mongoUri) {
      console.error('❌ MongoDB URI not configured\n');
    } else {
      console.log(`✅ MongoDB URI configured: ${mongoUri.split('@')[0]}...\n`);
    }

    // Test 3: Check Server
    console.log('3️⃣  Testing Server Health...');
    try {
      const serverResponse = await axios.get('http://localhost:5000/health', {
        timeout: 3000,
      });
      console.log('✅ Server is running!\n');
    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        console.error('❌ Server not running on port 5000');
        console.log('   Run: npm run dev\n');
      } else {
        console.error(`❌ Server error: ${error.message}\n`);
      }
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
};

testAPI();

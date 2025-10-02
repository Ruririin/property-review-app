// Test script to examine Best Places HTML structure
const fetch = require('node-fetch');

async function testBestPlaces() {
  const zipCode = '90210'; // Example zip
  const url = `https://www.bestplaces.net/crime/zip-code/california/beverly_hills/${zipCode}`;
  
  console.log('🔍 Testing Best Places URL:', url);
  
  try {
    // Try multiple proxy services
    const proxies = [
      `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`,
      `https://cors-anywhere.herokuapp.com/${url}`,
      `https://thingproxy.freeboard.io/fetch/${url}`
    ];
    
    for (const proxyUrl of proxies) {
      try {
        console.log('📡 Trying proxy:', proxyUrl);
        
        const response = await fetch(proxyUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
          }
        });
        
        if (response.ok) {
          const data = await response.text();
          const html = data.contents || data;
          
          console.log('✅ Got response, length:', html.length);
          
          // Look for crime rate data
          const violentMatch = html.match(/violent crime is (\d+\.?\d*)\./i);
          const propertyMatch = html.match(/property crime is (\d+\.?\d*)\./i);
          
          console.log('📊 Found violent crime:', violentMatch ? violentMatch[1] : 'NOT FOUND');
          console.log('📊 Found property crime:', propertyMatch ? propertyMatch[1] : 'NOT FOUND');
          
          // Look for chart data patterns
          console.log('\n🔍 Searching for chart data patterns...');
          
          const chartPatterns = [
            /chartData\s*[=:]\s*(\[.*?\])/s,
            /data\s*[=:]\s*(\[.*?\])/s,
            /series\s*[=:]\s*(\[.*?\])/s,
            /var\s+\w*[Dd]ata\s*=\s*(\[.*?\]);/s,
            /\[[\d,\s]+\]/g
          ];
          
          for (let i = 0; i < chartPatterns.length; i++) {
            const matches = html.match(chartPatterns[i]);
            if (matches) {
              console.log(`📈 Pattern ${i + 1} found:`, matches.length, 'matches');
              console.log('First match:', matches[0].substring(0, 200) + '...');
            } else {
              console.log(`❌ Pattern ${i + 1}: No matches`);
            }
          }
          
          // Look for table data
          const tableMatches = html.match(/<table[^>]*>.*?<\/table>/gsi);
          if (tableMatches) {
            console.log('📊 Found', tableMatches.length, 'tables');
          } else {
            console.log('❌ No tables found');
          }
          
          // Save a sample of the HTML for inspection
          console.log('\n📝 HTML sample (first 1000 chars):');
          console.log(html.substring(0, 1000));
          
          break; // Success, exit loop
        }
      } catch (error) {
        console.log('❌ Proxy failed:', error.message);
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testBestPlaces();

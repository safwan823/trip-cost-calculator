// Test script to discover GasBuddy GraphQL API structure
// Run with: node scripts/test-gasbuddy.js

const testGasBuddyAPI = async () => {
  const endpoint = 'https://www.gasbuddy.com/graphql';

  // Test coordinates (New York City)
  const testLat = 40.7128;
  const testLng = -74.0060;

  console.log('Testing GasBuddy GraphQL API...\n');
  console.log(`Test location: ${testLat}, ${testLng}\n`);

  // Headers from py-gasbuddy library
  const headers = {
    'Content-Type': 'application/json',
    'Sec-Fetch-Dest': '',
    'Sec-Fetch-Mode': 'cors',
    'Sec-Fetch-Site': 'same-origin',
    'Priority': 'u=0',
    'apollo-require-preflight': 'true',
    'Origin': 'https://www.gasbuddy.com',
    'Referer': 'https://www.gasbuddy.com/home',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36'
  };

  // Actual queries from py-gasbuddy library
  const queries = [
    // Query 1: LocationBySearchTerm with PRICES (from py-gasbuddy)
    {
      name: 'LocationBySearchTerm with Prices',
      body: {
        operationName: 'LocationBySearchTerm',
        variables: {
          maxAge: 0,
          lat: testLat,
          lng: testLng
        },
        query: "query LocationBySearchTerm($brandId: Int, $cursor: String, $fuel: Int, $lat: Float, $lng: Float, $maxAge: Int, $search: String) { locationBySearchTerm(lat: $lat, lng: $lng, search: $search) { stations(brandId: $brandId cursor: $cursor fuel: $fuel lat: $lat lng: $lng maxAge: $maxAge) { results { address { line1 } prices { cash { nickname postedTime price } credit { nickname postedTime price } fuelProduct longName } priceUnit currency id latitude longitude } } trends { areaName country today todayLow trend } } }"
      }
    }
  ];

  for (const { name, body } of queries) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`Testing: ${name}`);
    console.log(`${'='.repeat(60)}\n`);

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(body)
      });

      const data = await response.json();

      if (response.ok) {
        console.log('✅ Query succeeded!\n');
        console.log('Response:');
        console.log(JSON.stringify(data, null, 2));

        // If this query worked, we found it!
        if (data.data && !data.errors) {
          console.log(`\n🎉 SUCCESS! This query structure works: ${name}`);
          console.log('\nUse this query pattern for implementation.');
          break;
        }
      } else {
        console.log(`❌ Query failed (HTTP ${response.status})`);
        console.log('Response:');
        console.log(JSON.stringify(data, null, 2));
      }
    } catch (error) {
      console.log('❌ Error:', error.message);
    }
  }

  console.log('\n\n' + '='.repeat(60));
  console.log('INSTRUCTIONS FOR MANUAL TESTING:');
  console.log('='.repeat(60));
  console.log(`
1. Open Chrome and visit https://www.gasbuddy.com
2. Search for any location (e.g., "New York, NY")
3. Open Chrome DevTools (F12)
4. Go to Network tab
5. Filter by "graphql" (type in filter box)
6. Click on a gas station or interact with the map
7. Look for graphql requests in the Network tab
8. Click on a request → Headers tab → Request Payload
9. Copy the exact query structure you see
10. Update the test script with the correct query
`);
};

testGasBuddyAPI().catch(console.error);

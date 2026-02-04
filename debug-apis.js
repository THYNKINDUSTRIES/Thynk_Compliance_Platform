import fetch from 'node-fetch';

const LEGISCAN_API_KEY = 'db9e2013fe8fc89561fd857e9b9f055d';
const OPENSTATES_API_KEY = 'db79f2e7-d16e-4b9b-bb71-bb496dc308ed';

// Test LegiScan API
async function testLegiScan() {
  console.log('Testing LegiScan API...');
  try {
    const searchUrl = `https://api.legiscan.com/?key=${LEGISCAN_API_KEY}&op=getSearch&query=cannabis&state=CA&page=1`;
    console.log('URL:', searchUrl);
    const response = await fetch(searchUrl);
    const data = await response.json();
    console.log('LegiScan Response:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.log('LegiScan Error:', error.message);
  }
}

// Test OpenStates API
async function testOpenStates() {
  console.log('Testing OpenStates API...');
  try {
    const searchUrl = 'https://v3.openstates.org/bills?search_query=cannabis&sort=updated_desc&include=versions';
    console.log('URL:', searchUrl);
    const response = await fetch(searchUrl, {
      headers: { 'X-API-Key': OPENSTATES_API_KEY }
    });
    console.log('Status:', response.status);
    if (response.ok) {
      const data = await response.json();
      console.log('OpenStates Response:', JSON.stringify(data, null, 2));
    } else {
      console.log('Error response:', await response.text());
    }
  } catch (error) {
    console.log('OpenStates Error:', error.message);
  }
}

testLegiScan();
testOpenStates();
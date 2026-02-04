import fs from 'fs';
import path from 'path';

const STATE_DATA_PORTALS = {};

function getStateAbbrev(stateName) {
  const stateMap = {
    'Alabama': 'AL', 'Alaska': 'AK', 'Arizona': 'AZ', 'Arkansas': 'AR',
    'California': 'CA', 'Colorado': 'CO', 'Connecticut': 'CT', 'Delaware': 'DE',
    'Florida': 'FL', 'Georgia': 'GA', 'Hawaii': 'HI', 'Idaho': 'ID',
    'Illinois': 'IL', 'Indiana': 'IN', 'Iowa': 'IA', 'Kansas': 'KS',
    'Kentucky': 'KY', 'Louisiana': 'LA', 'Maine': 'ME', 'Maryland': 'MD',
    'Massachusetts': 'MA', 'Michigan': 'MI', 'Minnesota': 'MN', 'Mississippi': 'MS',
    'Missouri': 'MO', 'Montana': 'MT', 'Nebraska': 'NE', 'Nevada': 'NV',
    'New Hampshire': 'NH', 'New Jersey': 'NJ', 'New Mexico': 'NM', 'New York': 'NY',
    'North Carolina': 'NC', 'North Dakota': 'ND', 'Ohio': 'OH', 'Oklahoma': 'OK',
    'Oregon': 'OR', 'Pennsylvania': 'PA', 'Rhode Island': 'RI', 'South Carolina': 'SC',
    'South Dakota': 'SD', 'Tennessee': 'TN', 'Texas': 'TX', 'Utah': 'UT',
    'Vermont': 'VT', 'Virginia': 'VA', 'Washington': 'WA', 'West Virginia': 'WV',
    'Wisconsin': 'WI', 'Wyoming': 'WY'
  };
  return stateMap[stateName];
}

const csvPath = path.join(process.cwd(), 'open_data_us.csv');
const csvContent = fs.readFileSync(csvPath, 'utf8');
const lines = csvContent.split('\n');

console.log(`Processing ${lines.length} CSV lines...`);

for (const line of lines.slice(1, 15)) { // Test first 15 lines
  if (!line.trim()) continue;

  const parts = line.split(',').map(part => part.replace(/"/g, '').trim());
  console.log(`Line: "${line}"`);
  console.log(`Parts: [${parts.join(', ')}]`);

  if (parts.length >= 3 && parts[2] === 'US State') {
    const stateName = parts[0];
    const url = parts[1];
    const stateAbbrev = getStateAbbrev(stateName);
    console.log(`✅ State: ${stateName} -> ${stateAbbrev}, URL: ${url}`);

    if (stateAbbrev && url && url.startsWith('http')) {
      STATE_DATA_PORTALS[stateAbbrev] = { name: stateName, url: url };
    }
  } else {
    console.log(`❌ Not a US State line`);
  }
  console.log('---');
}

console.log(`\nLoaded ${Object.keys(STATE_DATA_PORTALS).length} state portals:`);
Object.entries(STATE_DATA_PORTALS).forEach(([abbr, data]) => {
  console.log(`${abbr}: ${data.url}`);
});
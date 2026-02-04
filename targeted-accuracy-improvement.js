import fs from 'fs';

// States with worst performance from quick check
const WORST_STATES = ['AL', 'AK', 'AZ', 'CT', 'ID', 'IN', 'KS', 'LA', 'MN', 'MT', 'ND', 'NE', 'NH', 'NJ', 'NM', 'NV', 'NY', 'OR', 'PA', 'RI', 'SC', 'SD', 'TN', 'TX', 'UT', 'VA', 'WA', 'WI', 'WY'];

const TARGETED_IMPROVEMENTS = {
  AL: [
    { url: 'https://www.alabamaagriculture.gov/', category: 'regulations', type: 'webpage' },
    { url: 'https://www.alabamapublichealth.gov/', category: 'news', type: 'webpage' },
    { url: 'https://www.alabamalegislature.gov/', category: 'news', type: 'webpage' },
    { url: 'https://www.al.gov/agriculture/', category: 'regulations', type: 'webpage' },
    { url: 'https://www.al.gov/agriculture/news/', category: 'news', type: 'webpage' },
    { url: 'https://www.al.gov/governor/', category: 'news', type: 'webpage' },
    { url: 'https://www.al.gov/governor/press-releases/', category: 'news', type: 'webpage' },
    { url: 'https://www.al.gov/agriculture/hemp/', category: 'regulations', type: 'webpage' }
  ],
  AK: [
    { url: 'https://www.alaska.gov/', category: 'news', type: 'webpage' },
    { url: 'https://www.alaska.gov/governor/', category: 'news', type: 'webpage' },
    { url: 'https://www.alaska.gov/governor/news/', category: 'news', type: 'webpage' },
    { url: 'https://www.commerce.alaska.gov/', category: 'regulations', type: 'webpage' },
    { url: 'https://www.commerce.alaska.gov/web/cbpl/', category: 'regulations', type: 'webpage' },
    { url: 'https://www.commerce.alaska.gov/web/cbpl/Hemp/', category: 'regulations', type: 'webpage' },
    { url: 'https://www.commerce.alaska.gov/web/cbpl/Hemp/news/', category: 'news', type: 'webpage' },
    { url: 'https://www.commerce.alaska.gov/web/cbpl/Marijuana/', category: 'regulations', type: 'webpage' }
  ],
  AZ: [
    { url: 'https://www.azag.gov/', category: 'regulations', type: 'webpage' },
    { url: 'https://www.azag.gov/agriculture/', category: 'regulations', type: 'webpage' },
    { url: 'https://www.azag.gov/agriculture/hemp/', category: 'regulations', type: 'webpage' },
    { url: 'https://www.azag.gov/agriculture/hemp/news/', category: 'news', type: 'webpage' },
    { url: 'https://www.azag.gov/agriculture/news/', category: 'news', type: 'webpage' },
    { url: 'https://az.gov/', category: 'news', type: 'webpage' },
    { url: 'https://az.gov/governor/', category: 'news', type: 'webpage' },
    { url: 'https://az.gov/governor/press-releases/', category: 'news', type: 'webpage' }
  ],
  CT: [
    { url: 'https://www.ct.gov/', category: 'news', type: 'webpage' },
    { url: 'https://www.ct.gov/governor/', category: 'news', type: 'webpage' },
    { url: 'https://www.ct.gov/governor/news/', category: 'news', type: 'webpage' },
    { url: 'https://www.ct.gov/agriculture/', category: 'regulations', type: 'webpage' },
    { url: 'https://www.ct.gov/agriculture/hemp/', category: 'regulations', type: 'webpage' },
    { url: 'https://www.ct.gov/agriculture/hemp/news/', category: 'news', type: 'webpage' },
    { url: 'https://www.ct.gov/agriculture/news/', category: 'news', type: 'webpage' },
    { url: 'https://portal.ct.gov/', category: 'regulations', type: 'webpage' }
  ],
  ID: [
    { url: 'https://www.idaho.gov/', category: 'news', type: 'webpage' },
    { url: 'https://www.idaho.gov/governor/', category: 'news', type: 'webpage' },
    { url: 'https://www.idaho.gov/governor/news/', category: 'news', type: 'webpage' },
    { url: 'https://www.idahoagriculture.gov/', category: 'regulations', type: 'webpage' },
    { url: 'https://www.idahoagriculture.gov/plant-industries/', category: 'regulations', type: 'webpage' },
    { url: 'https://www.idahoagriculture.gov/plant-industries/hemp/', category: 'regulations', type: 'webpage' },
    { url: 'https://www.idahoagriculture.gov/plant-industries/hemp/news/', category: 'news', type: 'webpage' },
    { url: 'https://www.idahoagriculture.gov/news/', category: 'news', type: 'webpage' }
  ],
  IN: [
    { url: 'https://www.in.gov/', category: 'news', type: 'webpage' },
    { url: 'https://www.in.gov/governor/', category: 'news', type: 'webpage' },
    { url: 'https://www.in.gov/governor/news/', category: 'news', type: 'webpage' },
    { url: 'https://www.in.gov/isda/', category: 'regulations', type: 'webpage' },
    { url: 'https://www.in.gov/isda/divisions/plant-industries/', category: 'regulations', type: 'webpage' },
    { url: 'https://www.in.gov/isda/divisions/plant-industries/hemp/', category: 'regulations', type: 'webpage' },
    { url: 'https://www.in.gov/isda/divisions/plant-industries/hemp/news/', category: 'news', type: 'webpage' },
    { url: 'https://www.in.gov/isda/news/', category: 'news', type: 'webpage' }
  ],
  KS: [
    { url: 'https://www.kansas.gov/', category: 'news', type: 'webpage' },
    { url: 'https://www.kansas.gov/governor/', category: 'news', type: 'webpage' },
    { url: 'https://www.kansas.gov/governor/news/', category: 'news', type: 'webpage' },
    { url: 'https://www.ksda.gov/', category: 'regulations', type: 'webpage' },
    { url: 'https://www.ksda.gov/plant-protection/', category: 'regulations', type: 'webpage' },
    { url: 'https://www.ksda.gov/plant-protection/hemp/', category: 'regulations', type: 'webpage' },
    { url: 'https://www.ksda.gov/plant-protection/hemp/news/', category: 'news', type: 'webpage' },
    { url: 'https://www.ksda.gov/news/', category: 'news', type: 'webpage' }
  ],
  LA: [
    { url: 'https://www.louisiana.gov/', category: 'news', type: 'webpage' },
    { url: 'https://www.louisiana.gov/governor/', category: 'news', type: 'webpage' },
    { url: 'https://www.louisiana.gov/governor/news/', category: 'news', type: 'webpage' },
    { url: 'https://www.ladaf.net/', category: 'regulations', type: 'webpage' },
    { url: 'https://www.ladaf.net/agriculture/', category: 'regulations', type: 'webpage' },
    { url: 'https://www.ladaf.net/agriculture/hemp/', category: 'regulations', type: 'webpage' },
    { url: 'https://www.ladaf.net/agriculture/hemp/news/', category: 'news', type: 'webpage' },
    { url: 'https://www.ladaf.net/news/', category: 'news', type: 'webpage' }
  ],
  MN: [
    { url: 'https://www.minnesota.gov/', category: 'news', type: 'webpage' },
    { url: 'https://www.minnesota.gov/governor/', category: 'news', type: 'webpage' },
    { url: 'https://www.minnesota.gov/governor/news/', category: 'news', type: 'webpage' },
    { url: 'https://www.mda.state.mn.us/', category: 'regulations', type: 'webpage' },
    { url: 'https://www.mda.state.mn.us/plants/', category: 'regulations', type: 'webpage' },
    { url: 'https://www.mda.state.mn.us/plants/hemp/', category: 'regulations', type: 'webpage' },
    { url: 'https://www.mda.state.mn.us/plants/hemp/news/', category: 'news', type: 'webpage' },
    { url: 'https://www.mda.state.mn.us/news/', category: 'news', type: 'webpage' }
  ],
  MT: [
    { url: 'https://www.montana.gov/', category: 'news', type: 'webpage' },
    { url: 'https://www.montana.gov/governor/', category: 'news', type: 'webpage' },
    { url: 'https://www.montana.gov/governor/news/', category: 'news', type: 'webpage' },
    { url: 'https://agr.mt.gov/', category: 'regulations', type: 'webpage' },
    { url: 'https://agr.mt.gov/agriculture/', category: 'regulations', type: 'webpage' },
    { url: 'https://agr.mt.gov/agriculture/hemp/', category: 'regulations', type: 'webpage' },
    { url: 'https://agr.mt.gov/agriculture/hemp/news/', category: 'news', type: 'webpage' },
    { url: 'https://agr.mt.gov/news/', category: 'news', type: 'webpage' }
  ],
  ND: [
    { url: 'https://www.nd.gov/', category: 'news', type: 'webpage' },
    { url: 'https://www.nd.gov/governor/', category: 'news', type: 'webpage' },
    { url: 'https://www.nd.gov/governor/news/', category: 'news', type: 'webpage' },
    { url: 'https://www.ndda.nd.gov/', category: 'regulations', type: 'webpage' },
    { url: 'https://www.ndda.nd.gov/agriculture/', category: 'regulations', type: 'webpage' },
    { url: 'https://www.ndda.nd.gov/agriculture/hemp/', category: 'regulations', type: 'webpage' },
    { url: 'https://www.ndda.nd.gov/agriculture/hemp/news/', category: 'news', type: 'webpage' },
    { url: 'https://www.ndda.nd.gov/news/', category: 'news', type: 'webpage' }
  ],
  NE: [
    { url: 'https://www.nebraska.gov/', category: 'news', type: 'webpage' },
    { url: 'https://www.nebraska.gov/governor/', category: 'news', type: 'webpage' },
    { url: 'https://www.nebraska.gov/governor/news/', category: 'news', type: 'webpage' },
    { url: 'https://nda.nebraska.gov/', category: 'regulations', type: 'webpage' },
    { url: 'https://nda.nebraska.gov/agriculture/', category: 'regulations', type: 'webpage' },
    { url: 'https://nda.nebraska.gov/agriculture/hemp/', category: 'regulations', type: 'webpage' },
    { url: 'https://nda.nebraska.gov/agriculture/hemp/news/', category: 'news', type: 'webpage' },
    { url: 'https://nda.nebraska.gov/news/', category: 'news', type: 'webpage' }
  ],
  NH: [
    { url: 'https://www.nh.gov/', category: 'news', type: 'webpage' },
    { url: 'https://www.nh.gov/governor/', category: 'news', type: 'webpage' },
    { url: 'https://www.nh.gov/governor/news/', category: 'news', type: 'webpage' },
    { url: 'https://www.nh.gov/agriculture/', category: 'regulations', type: 'webpage' },
    { url: 'https://www.nh.gov/agriculture/hemp/', category: 'regulations', type: 'webpage' },
    { url: 'https://www.nh.gov/agriculture/hemp/news/', category: 'news', type: 'webpage' },
    { url: 'https://www.nh.gov/agriculture/news/', category: 'news', type: 'webpage' },
    { url: 'https://www.nh.gov/agriculture/plant-industry/', category: 'regulations', type: 'webpage' }
  ],
  NJ: [
    { url: 'https://www.nj.gov/', category: 'news', type: 'webpage' },
    { url: 'https://www.nj.gov/governor/', category: 'news', type: 'webpage' },
    { url: 'https://www.nj.gov/governor/news/', category: 'news', type: 'webpage' },
    { url: 'https://www.nj.gov/agriculture/', category: 'regulations', type: 'webpage' },
    { url: 'https://www.nj.gov/agriculture/hemp/', category: 'regulations', type: 'webpage' },
    { url: 'https://www.nj.gov/agriculture/hemp/news/', category: 'news', type: 'webpage' },
    { url: 'https://www.nj.gov/agriculture/news/', category: 'news', type: 'webpage' },
    { url: 'https://www.nj.gov/agriculture/plant-industry/', category: 'regulations', type: 'webpage' }
  ],
  NM: [
    { url: 'https://www.newmexico.gov/', category: 'news', type: 'webpage' },
    { url: 'https://www.newmexico.gov/governor/', category: 'news', type: 'webpage' },
    { url: 'https://www.newmexico.gov/governor/news/', category: 'news', type: 'webpage' },
    { url: 'https://www.nmda.nmsu.edu/', category: 'regulations', type: 'webpage' },
    { url: 'https://www.nmda.nmsu.edu/agriculture/', category: 'regulations', type: 'webpage' },
    { url: 'https://www.nmda.nmsu.edu/agriculture/hemp/', category: 'regulations', type: 'webpage' },
    { url: 'https://www.nmda.nmsu.edu/agriculture/hemp/news/', category: 'news', type: 'webpage' },
    { url: 'https://www.nmda.nmsu.edu/news/', category: 'news', type: 'webpage' }
  ],
  NV: [
    { url: 'https://www.nv.gov/', category: 'news', type: 'webpage' },
    { url: 'https://www.nv.gov/governor/', category: 'news', type: 'webpage' },
    { url: 'https://www.nv.gov/governor/news/', category: 'news', type: 'webpage' },
    { url: 'https://www.agri.nv.gov/', category: 'regulations', type: 'webpage' },
    { url: 'https://www.agri.nv.gov/Programs/', category: 'regulations', type: 'webpage' },
    { url: 'https://www.agri.nv.gov/Programs/Industrial_Hemp/', category: 'regulations', type: 'webpage' },
    { url: 'https://www.agri.nv.gov/Programs/Industrial_Hemp/news/', category: 'news', type: 'webpage' },
    { url: 'https://www.agri.nv.gov/news/', category: 'news', type: 'webpage' }
  ],
  NY: [
    { url: 'https://www.ny.gov/', category: 'news', type: 'webpage' },
    { url: 'https://www.ny.gov/governor/', category: 'news', type: 'webpage' },
    { url: 'https://www.ny.gov/governor/press-releases/', category: 'news', type: 'webpage' },
    { url: 'https://www.agriculture.ny.gov/', category: 'regulations', type: 'webpage' },
    { url: 'https://www.agriculture.ny.gov/plant-industry/', category: 'regulations', type: 'webpage' },
    { url: 'https://www.agriculture.ny.gov/plant-industry/hemp/', category: 'regulations', type: 'webpage' },
    { url: 'https://www.agriculture.ny.gov/plant-industry/hemp/news/', category: 'news', type: 'webpage' },
    { url: 'https://www.agriculture.ny.gov/news/', category: 'news', type: 'webpage' }
  ],
  OR: [
    { url: 'https://www.oregon.gov/', category: 'news', type: 'webpage' },
    { url: 'https://www.oregon.gov/governor/', category: 'news', type: 'webpage' },
    { url: 'https://www.oregon.gov/governor/news/', category: 'news', type: 'webpage' },
    { url: 'https://www.oda.state.or.us/', category: 'regulations', type: 'webpage' },
    { url: 'https://www.oda.state.or.us/plant/', category: 'regulations', type: 'webpage' },
    { url: 'https://www.oda.state.or.us/plant/hemp/', category: 'regulations', type: 'webpage' },
    { url: 'https://www.oda.state.or.us/plant/hemp/news/', category: 'news', type: 'webpage' },
    { url: 'https://www.oda.state.or.us/news/', category: 'news', type: 'webpage' }
  ],
  PA: [
    { url: 'https://www.pa.gov/', category: 'news', type: 'webpage' },
    { url: 'https://www.pa.gov/governor/', category: 'news', type: 'webpage' },
    { url: 'https://www.pa.gov/governor/news/', category: 'news', type: 'webpage' },
    { url: 'https://www.agriculture.pa.gov/', category: 'regulations', type: 'webpage' },
    { url: 'https://www.agriculture.pa.gov/Plants_Land_Water/', category: 'regulations', type: 'webpage' },
    { url: 'https://www.agriculture.pa.gov/Plants_Land_Water/PlantIndustry/hemp/', category: 'regulations', type: 'webpage' },
    { url: 'https://www.agriculture.pa.gov/Plants_Land_Water/PlantIndustry/hemp/news/', category: 'news', type: 'webpage' },
    { url: 'https://www.agriculture.pa.gov/news/', category: 'news', type: 'webpage' }
  ],
  RI: [
    { url: 'https://www.ri.gov/', category: 'news', type: 'webpage' },
    { url: 'https://www.ri.gov/governor/', category: 'news', type: 'webpage' },
    { url: 'https://www.ri.gov/governor/news/', category: 'news', type: 'webpage' },
    { url: 'https://www.agriculture.ri.gov/', category: 'regulations', type: 'webpage' },
    { url: 'https://www.agriculture.ri.gov/plant/', category: 'regulations', type: 'webpage' },
    { url: 'https://www.agriculture.ri.gov/plant/hemp/', category: 'regulations', type: 'webpage' },
    { url: 'https://www.agriculture.ri.gov/plant/hemp/news/', category: 'news', type: 'webpage' },
    { url: 'https://www.agriculture.ri.gov/news/', category: 'news', type: 'webpage' }
  ],
  SC: [
    { url: 'https://www.sc.gov/', category: 'news', type: 'webpage' },
    { url: 'https://www.sc.gov/governor/', category: 'news', type: 'webpage' },
    { url: 'https://www.sc.gov/governor/news/', category: 'news', type: 'webpage' },
    { url: 'https://www.clemson.edu/cafls/', category: 'regulations', type: 'webpage' },
    { url: 'https://www.clemson.edu/cafls/hemp/', category: 'regulations', type: 'webpage' },
    { url: 'https://www.clemson.edu/cafls/hemp/news/', category: 'news', type: 'webpage' },
    { url: 'https://www.clemson.edu/cafls/news/', category: 'news', type: 'webpage' },
    { url: 'https://agriculture.sc.gov/', category: 'regulations', type: 'webpage' }
  ],
  SD: [
    { url: 'https://www.sd.gov/', category: 'news', type: 'webpage' },
    { url: 'https://www.sd.gov/governor/', category: 'news', type: 'webpage' },
    { url: 'https://www.sd.gov/governor/news/', category: 'news', type: 'webpage' },
    { url: 'https://sddps.gov/', category: 'regulations', type: 'webpage' },
    { url: 'https://sddps.gov/agriculture/', category: 'regulations', type: 'webpage' },
    { url: 'https://sddps.gov/agriculture/hemp/', category: 'regulations', type: 'webpage' },
    { url: 'https://sddps.gov/agriculture/hemp/news/', category: 'news', type: 'webpage' },
    { url: 'https://sddps.gov/news/', category: 'news', type: 'webpage' }
  ],
  TN: [
    { url: 'https://www.tn.gov/', category: 'news', type: 'webpage' },
    { url: 'https://www.tn.gov/governor/', category: 'news', type: 'webpage' },
    { url: 'https://www.tn.gov/governor/news/', category: 'news', type: 'webpage' },
    { url: 'https://www.tn.gov/agriculture/', category: 'regulations', type: 'webpage' },
    { url: 'https://www.tn.gov/agriculture/businesses/', category: 'regulations', type: 'webpage' },
    { url: 'https://www.tn.gov/agriculture/businesses/hemp/', category: 'regulations', type: 'webpage' },
    { url: 'https://www.tn.gov/agriculture/businesses/hemp/news/', category: 'news', type: 'webpage' },
    { url: 'https://www.tn.gov/agriculture/news/', category: 'news', type: 'webpage' }
  ],
  TX: [
    { url: 'https://www.texas.gov/', category: 'news', type: 'webpage' },
    { url: 'https://www.texas.gov/governor/', category: 'news', type: 'webpage' },
    { url: 'https://www.texas.gov/governor/news/', category: 'news', type: 'webpage' },
    { url: 'https://www.texasagriculture.gov/', category: 'regulations', type: 'webpage' },
    { url: 'https://www.texasagriculture.gov/Regulatory-Programs/', category: 'regulations', type: 'webpage' },
    { url: 'https://www.texasagriculture.gov/Regulatory-Programs/PlantQuality/Hemp/', category: 'regulations', type: 'webpage' },
    { url: 'https://www.texasagriculture.gov/Regulatory-Programs/PlantQuality/Hemp/news/', category: 'news', type: 'webpage' },
    { url: 'https://www.texasagriculture.gov/news/', category: 'news', type: 'webpage' }
  ],
  UT: [
    { url: 'https://www.utah.gov/', category: 'news', type: 'webpage' },
    { url: 'https://www.utah.gov/governor/', category: 'news', type: 'webpage' },
    { url: 'https://www.utah.gov/governor/news/', category: 'news', type: 'webpage' },
    { url: 'https://ag.utah.gov/', category: 'regulations', type: 'webpage' },
    { url: 'https://ag.utah.gov/plant/', category: 'regulations', type: 'webpage' },
    { url: 'https://ag.utah.gov/plant/hemp/', category: 'regulations', type: 'webpage' },
    { url: 'https://ag.utah.gov/plant/hemp/news/', category: 'news', type: 'webpage' },
    { url: 'https://ag.utah.gov/news/', category: 'news', type: 'webpage' }
  ],
  VA: [
    { url: 'https://www.virginia.gov/', category: 'news', type: 'webpage' },
    { url: 'https://www.virginia.gov/governor/', category: 'news', type: 'webpage' },
    { url: 'https://www.virginia.gov/governor/news/', category: 'news', type: 'webpage' },
    { url: 'https://www.vdacs.virginia.gov/', category: 'regulations', type: 'webpage' },
    { url: 'https://www.vdacs.virginia.gov/agriculture/', category: 'regulations', type: 'webpage' },
    { url: 'https://www.vdacs.virginia.gov/agriculture/hemp/', category: 'regulations', type: 'webpage' },
    { url: 'https://www.vdacs.virginia.gov/agriculture/hemp/news/', category: 'news', type: 'webpage' },
    { url: 'https://www.vdacs.virginia.gov/news/', category: 'news', type: 'webpage' }
  ],
  WA: [
    { url: 'https://www.wa.gov/', category: 'news', type: 'webpage' },
    { url: 'https://www.wa.gov/governor/', category: 'news', type: 'webpage' },
    { url: 'https://www.wa.gov/governor/news/', category: 'news', type: 'webpage' },
    { url: 'https://www.agr.wa.gov/', category: 'regulations', type: 'webpage' },
    { url: 'https://www.agr.wa.gov/lcb/', category: 'regulations', type: 'webpage' },
    { url: 'https://www.agr.wa.gov/lcb/hemp/', category: 'regulations', type: 'webpage' },
    { url: 'https://www.agr.wa.gov/lcb/hemp/news/', category: 'news', type: 'webpage' },
    { url: 'https://www.agr.wa.gov/news/', category: 'news', type: 'webpage' }
  ],
  WI: [
    { url: 'https://www.wisconsin.gov/', category: 'news', type: 'webpage' },
    { url: 'https://www.wisconsin.gov/governor/', category: 'news', type: 'webpage' },
    { url: 'https://www.wisconsin.gov/governor/news/', category: 'news', type: 'webpage' },
    { url: 'https://www.wisconsin.gov/datcp/', category: 'regulations', type: 'webpage' },
    { url: 'https://www.wisconsin.gov/datcp/agriculture/', category: 'regulations', type: 'webpage' },
    { url: 'https://www.wisconsin.gov/datcp/agriculture/hemp/', category: 'regulations', type: 'webpage' },
    { url: 'https://www.wisconsin.gov/datcp/agriculture/hemp/news/', category: 'news', type: 'webpage' },
    { url: 'https://www.wisconsin.gov/datcp/news/', category: 'news', type: 'webpage' }
  ],
  WY: [
    { url: 'https://www.wyo.gov/', category: 'news', type: 'webpage' },
    { url: 'https://www.wyo.gov/governor/', category: 'news', type: 'webpage' },
    { url: 'https://www.wyo.gov/governor/news/', category: 'news', type: 'webpage' },
    { url: 'https://www.wyo.gov/agriculture/', category: 'regulations', type: 'webpage' },
    { url: 'https://www.wyo.gov/agriculture/plant/', category: 'regulations', type: 'webpage' },
    { url: 'https://www.wyo.gov/agriculture/plant/hemp/', category: 'regulations', type: 'webpage' },
    { url: 'https://www.wyo.gov/agriculture/plant/hemp/news/', category: 'news', type: 'webpage' },
    { url: 'https://www.wyo.gov/agriculture/news/', category: 'news', type: 'webpage' }
  ]
};

console.log('Applying targeted improvements for worst-performing states...');

// Read current poller config
const pollerPath = 'supabase/functions/cannabis-hemp-poller/index.ts';
let pollerContent = fs.readFileSync(pollerPath, 'utf8');

// Apply improvements
let additionsCount = 0;
WORST_STATES.forEach(state => {
  if (TARGETED_IMPROVEMENTS[state]) {
    TARGETED_IMPROVEMENTS[state].forEach(source => {
      // Check if source already exists
      if (!pollerContent.includes(source.url)) {
        // Add to appropriate array based on category
        let targetArray = 'newsPages';
        if (source.category === 'regulations') {
          targetArray = 'regulationPages';
        }

        // Find the state's target array and add the new source
        const arrayRegex = new RegExp(`('${state}': \\{[^}]*${targetArray}: \\[)`, 'g');
        if (arrayRegex.test(pollerContent)) {
          pollerContent = pollerContent.replace(arrayRegex, `$1\n    '${source.url}',`);
          additionsCount++;
          console.log(`Added ${source.url} to ${state} ${targetArray}`);
        }
      }
    });
  }
});

// Write back the updated config
fs.writeFileSync(pollerPath, pollerContent);
console.log(`\nAdded ${additionsCount} new sources to worst-performing states.`);

// Regenerate CSVs
console.log('Regenerating CSV files...');
import('./export-poller-sources.js');
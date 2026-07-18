// Pulls live data from Google Sheets using the real Sheets API v4 (not the unreliable
// gviz CSV export) and writes it to local JSON files that the site reads from instead
// of hitting Google directly. Run by .github/workflows/sync-sheets.yml on a schedule.
//
// Requires Node 18+ (built-in fetch) and the SHEETS_API_KEY environment variable.

const fs = require('fs');
const path = require('path');

const API_KEY = process.env.SHEETS_API_KEY;
if (!API_KEY) {
  console.error('Missing SHEETS_API_KEY environment variable.');
  process.exit(1);
}

const PR_SHEET_ID = '1owKDOdQ86gmH3Nmp4SBN3tDIJWRZwZLV-ijYbUBD4zk';
const FOLK_SHEET_ID = '15bG-kIJcbrAntcEDYctZw46fBOp7G3sNudHj4ApqgVg';

// Folk Music's daily session tabs are only known by gid (numeric names in the sheet
// confused earlier gviz-by-name lookups). We resolve gid -> real tab title via the
// Sheets API metadata endpoint below, then fetch each tab's values by that title.
const FOLK_DAILY_GIDS = ['289889407', '1467656626', '193777029', '821180123', '1071256717'];

const PR_NAMED_TABS = [
  'สมัคร', 'ลงชื่อแต่ละวัน', 'สรุปรายคาบ', 'ภาพรวม',
  '20.05.69', '27.05.69', '3.06.69', '10.06.69', '17.06.69',
  '24.06.69', '1.07.69', '8.07.69', '15.07.69', '22.07.69', '29.07.69',
];
const FOLK_NAMED_TABS = ['สมัคร', 'ลงชื่อแต่ละวัน', 'ภาพรวม', 'สรุปรายคาบ'];

async function getSheetMeta(sheetId) {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}?fields=sheets.properties&key=${API_KEY}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`metadata fetch failed for ${sheetId}: ${res.status} ${await res.text()}`);
  const data = await res.json();
  const byGid = {};
  (data.sheets || []).forEach(s => { byGid[String(s.properties.sheetId)] = s.properties.title; });
  return byGid;
}

function normalizeRows(rows, width = 25) {
  return (rows || []).map(row => {
    const r = row.slice(0, width);
    while (r.length < width) r.push('');
    return r;
  });
}

async function fetchTab(sheetId, tabName) {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodeURIComponent(tabName)}?key=${API_KEY}`;
  try {
    const res = await fetch(url);
    if (!res.ok) {
      console.warn(`  ✗ "${tabName}": ${res.status}`);
      return null;
    }
    const data = await res.json();
    const rows = normalizeRows(data.values);
    console.log(`  ✓ "${tabName}": ${rows.length} rows`);
    return rows;
  } catch (e) {
    console.warn(`  ✗ "${tabName}": ${e.message}`);
    return null;
  }
}

async function fetchCourse(sheetId, namedTabs, dailyGids) {
  const sheets = {};
  for (const name of namedTabs) {
    sheets[name] = await fetchTab(sheetId, name);
  }
  if (dailyGids && dailyGids.length) {
    console.log('  Resolving daily-tab gids to names...');
    const byGid = await getSheetMeta(sheetId);
    for (const gid of dailyGids) {
      const title = byGid[gid];
      if (!title) {
        console.warn(`  ✗ gid ${gid}: not found in this spreadsheet`);
        continue;
      }
      const rows = await fetchTab(sheetId, title);
      sheets[title] = rows;
      sheets[gid] = rows; // also keyed by gid, since the HTML's SESSION_META references gids directly
    }
  }
  return sheets;
}

async function main() {
  const outDir = path.join(__dirname, '..', 'data');
  fs.mkdirSync(outDir, { recursive: true });

  console.log('Performance Resilience:');
  const prSheets = await fetchCourse(PR_SHEET_ID, PR_NAMED_TABS, null);
  fs.writeFileSync(
    path.join(outDir, 'performance-resilience.json'),
    JSON.stringify({ fetchedAt: new Date().toISOString(), sheets: prSheets }, null, 2)
  );

  console.log('Folk Music:');
  const folkSheets = await fetchCourse(FOLK_SHEET_ID, FOLK_NAMED_TABS, FOLK_DAILY_GIDS);
  fs.writeFileSync(
    path.join(outDir, 'folk-music.json'),
    JSON.stringify({ fetchedAt: new Date().toISOString(), sheets: folkSheets }, null, 2)
  );

  console.log('Done.');
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});

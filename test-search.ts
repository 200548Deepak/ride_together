import { executeSearch } from './lib/searchService';

async function main() {
  const result = await executeSearch({
    fn: 'Bengaluru, Karnataka, India',
    tn: 'Mysore, Karnataka, India',
    db: '2026-11-09',
    seats: 1,
    sort: 'dep_time:asc'
  });

  console.log('Search UUID:', result.searchUUID);
  console.log('Tabs:', JSON.stringify(result.tabs));
  console.log('Facets Title:', result.facets.title);
  console.log('Total Facet Groups:', result.facets.groups.length);
  console.log('Search Items Count:', result.resultsContent.searchItems.length);
  console.log('Summary Header:', result.resultsContent.searchItems[0]);
  console.log('First Trip Details:', JSON.stringify(result.resultsContent.searchItems[1], null, 2));
}

main().catch(console.error);


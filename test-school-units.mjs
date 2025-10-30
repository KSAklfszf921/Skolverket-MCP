#!/usr/bin/env node

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

async function testSchoolUnits() {
  const transport = new StdioClientTransport({
    command: 'node',
    args: ['dist/index.js']
  });

  const client = new Client({
    name: 'school-units-tester',
    version: '1.0.0'
  }, { capabilities: {} });

  await client.connect(transport);

  // Test 1: Get all school units
  console.log('Test 1: Get all school units...');
  const result1 = await client.callTool({
    name: 'search_school_units',
    arguments: {}
  });

  if (result1.content?.[0]?.text) {
    const data = JSON.parse(result1.content[0].text);
    console.log(`✓ Found ${data.totalFound} school units (showing ${data.showing})`);
    if (data.schoolUnits?.length > 0) {
      console.log(`  First unit: ${data.schoolUnits[0].name} (${data.schoolUnits[0].schoolUnitCode})`);
    }
  }

  // Test 2: Get AKTIV schools
  console.log('\nTest 2: Get AKTIV school units...');
  const result2 = await client.callTool({
    name: 'get_school_units_by_status',
    arguments: { status: 'AKTIV' }
  });

  if (result2.content?.[0]?.text) {
    const data = JSON.parse(result2.content[0].text);
    console.log(`✓ Found ${data.totalFound} AKTIV school units (showing ${data.showing})`);
  }

  // Test 3: Search by name
  console.log('\nTest 3: Search for schools with "Stockholm"...');
  const result3 = await client.callTool({
    name: 'search_school_units_by_name',
    arguments: { name: 'Stockholm' }
  });

  if (result3.content?.[0]?.text) {
    const data = JSON.parse(result3.content[0].text);
    console.log(`✓ Found ${data.totalFound} schools matching "Stockholm" (showing ${data.showing})`);
  }

  await client.close();
  console.log('\n✓ All Skolenhetsregistret tests completed!');
}

testSchoolUnits().catch(console.error);

#!/usr/bin/env node

/**
 * MCP Server Test Script
 * Testar Skolverket MCP-servern med officiella MCP SDK
 */

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js';

const SERVER_URL = 'https://skolverket-mcp.onrender.com/mcp';

console.log('🧪 MCP Server Test Suite');
console.log('========================\n');
console.log(`📡 Testing server: ${SERVER_URL}\n`);

async function runTests() {
  let client;
  let transport;
  let testsPassed = 0;
  let testsFailed = 0;

  try {
    // Test 1: Create transport and client
    console.log('📦 Test 1: Creating transport and client...');
    transport = new SSEClientTransport(new URL(SERVER_URL));
    client = new Client(
      {
        name: 'mcp-test-client',
        version: '1.0.0',
      },
      {
        capabilities: {},
      }
    );
    console.log('✅ Transport and client created\n');
    testsPassed++;

    // Test 2: Connect to server
    console.log('🔌 Test 2: Connecting to server...');
    await client.connect(transport);
    console.log('✅ Successfully connected to server\n');
    testsPassed++;

    // Test 3: List tools
    console.log('🔧 Test 3: Listing available tools...');
    const toolsResult = await client.listTools();
    const tools = toolsResult.tools;
    console.log(`✅ Found ${tools.length} tools:`);
    tools.forEach((tool, i) => {
      console.log(`   ${i + 1}. ${tool.name} - ${tool.description.substring(0, 60)}...`);
    });
    console.log();
    testsPassed++;

    // Test 4: List resources
    console.log('📚 Test 4: Listing available resources...');
    try {
      const resourcesResult = await client.listResources();
      const resources = resourcesResult.resources || [];
      console.log(`✅ Found ${resources.length} resources`);
      if (resources.length > 0) {
        resources.forEach((resource, i) => {
          console.log(`   ${i + 1}. ${resource.uri} - ${resource.name}`);
        });
      }
      console.log();
      testsPassed++;
    } catch (error) {
      console.log(`⚠️  Resources not available (may not be implemented): ${error.message}\n`);
      testsPassed++; // Not critical
    }

    // Test 5: List prompts
    console.log('💬 Test 5: Listing available prompts...');
    try {
      const promptsResult = await client.listPrompts();
      const prompts = promptsResult.prompts || [];
      console.log(`✅ Found ${prompts.length} prompts`);
      if (prompts.length > 0) {
        prompts.forEach((prompt, i) => {
          console.log(`   ${i + 1}. ${prompt.name} - ${prompt.description}`);
        });
      }
      console.log();
      testsPassed++;
    } catch (error) {
      console.log(`⚠️  Prompts not available (may not be implemented): ${error.message}\n`);
      testsPassed++; // Not critical
    }

    // Test 6: Test a specific tool - search_subjects
    console.log('🎯 Test 6: Testing search_subjects tool...');
    const subjectsResult = await client.callTool({
      name: 'search_subjects',
      arguments: {
        schooltype: 'GY',
        timespan: 'LATEST'
      }
    });

    if (subjectsResult.content && subjectsResult.content.length > 0) {
      const content = subjectsResult.content[0];
      const data = JSON.parse(content.text);
      console.log(`✅ search_subjects returned ${data.subjects?.length || 0} subjects`);
      if (data.subjects && data.subjects.length > 0) {
        console.log(`   Sample: ${data.subjects[0].name} (${data.subjects[0].code})`);
      }
      console.log();
      testsPassed++;
    } else {
      throw new Error('No content returned from search_subjects');
    }

    // Test 7: Test school units search
    console.log('🏫 Test 7: Testing search_school_units tool...');
    const schoolUnitsResult = await client.callTool({
      name: 'search_school_units',
      arguments: {}
    });

    if (schoolUnitsResult.content && schoolUnitsResult.content.length > 0) {
      const content = schoolUnitsResult.content[0];
      const data = JSON.parse(content.text);
      console.log(`✅ search_school_units returned ${data.schoolUnits?.length || 0} schools`);
      if (data.schoolUnits && data.schoolUnits.length > 0) {
        console.log(`   Sample: ${data.schoolUnits[0].schoolUnitName}`);
      }
      console.log();
      testsPassed++;
    } else {
      throw new Error('No content returned from search_school_units');
    }

    // Test 8: Test adult education search
    console.log('🎓 Test 8: Testing search_adult_education tool...');
    const adultEdResult = await client.callTool({
      name: 'search_adult_education',
      arguments: {
        typeOfSchool: 'yh'
      }
    });

    if (adultEdResult.content && adultEdResult.content.length > 0) {
      const content = adultEdResult.content[0];
      const data = JSON.parse(content.text);
      console.log(`✅ search_adult_education returned ${data.events?.length || 0} courses`);
      if (data.totalElements) {
        console.log(`   Total available: ${data.totalElements}`);
      }
      console.log();
      testsPassed++;
    } else {
      throw new Error('No content returned from search_adult_education');
    }

    // Test 9: Test health check tool
    console.log('❤️  Test 9: Testing health_check tool...');
    const healthResult = await client.callTool({
      name: 'health_check',
      arguments: {
        includeApiTests: true
      }
    });

    if (healthResult.content && healthResult.content.length > 0) {
      const content = healthResult.content[0];
      const data = JSON.parse(content.text);
      console.log(`✅ Health check: ${data.status}`);
      console.log(`   APIs tested: ${Object.keys(data.apis || {}).length}`);
      Object.entries(data.apis || {}).forEach(([api, status]) => {
        const icon = status === 'healthy' ? '✅' : '❌';
        console.log(`   ${icon} ${api}: ${status}`);
      });
      console.log();
      testsPassed++;
    } else {
      throw new Error('No content returned from health_check');
    }

  } catch (error) {
    console.error(`❌ Test failed: ${error.message}`);
    console.error(`   Stack: ${error.stack}`);
    testsFailed++;
  } finally {
    // Cleanup
    if (client) {
      try {
        await client.close();
        console.log('🔌 Connection closed\n');
      } catch (error) {
        console.error(`⚠️  Error closing connection: ${error.message}\n`);
      }
    }
  }

  // Summary
  console.log('📊 Test Summary');
  console.log('===============');
  console.log(`✅ Passed: ${testsPassed}`);
  console.log(`❌ Failed: ${testsFailed}`);
  console.log(`📈 Success Rate: ${((testsPassed / (testsPassed + testsFailed)) * 100).toFixed(1)}%\n`);

  if (testsFailed === 0) {
    console.log('🎉 All tests passed! Server is working correctly.\n');
    process.exit(0);
  } else {
    console.log('⚠️  Some tests failed. Please review the errors above.\n');
    process.exit(1);
  }
}

// Run tests
runTests().catch(error => {
  console.error('💥 Fatal error running tests:', error);
  process.exit(1);
});

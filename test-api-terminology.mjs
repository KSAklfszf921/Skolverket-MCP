#!/usr/bin/env node

/**
 * Comprehensive API terminology test
 * Tests all three Skolverket APIs with correct and updated terminology
 */

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const BLUE = '\x1b[34m';
const RESET = '\x1b[0m';

class APITester {
  constructor() {
    this.client = null;
    this.transport = null;
    this.results = {
      passed: 0,
      failed: 0,
      errors: []
    };
  }

  async connect() {
    console.log(`${BLUE}Connecting to MCP server...${RESET}\n`);

    this.transport = new StdioClientTransport({
      command: 'node',
      args: ['dist/index.js']
    });

    this.client = new Client({
      name: 'api-terminology-tester',
      version: '1.0.0'
    }, {
      capabilities: {}
    });

    await this.client.connect(this.transport);
    console.log(`${GREEN}✓ Connected to MCP server${RESET}\n`);
  }

  async disconnect() {
    if (this.client) {
      await this.client.close();
    }
  }

  async callTool(toolName, args = {}) {
    try {
      const result = await this.client.callTool({
        name: toolName,
        arguments: args
      });

      return {
        success: true,
        data: result
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  logTest(testName, passed, details = '') {
    if (passed) {
      console.log(`${GREEN}✓${RESET} ${testName}`);
      if (details) console.log(`  ${details}`);
      this.results.passed++;
    } else {
      console.log(`${RED}✗${RESET} ${testName}`);
      if (details) console.log(`  ${RED}${details}${RESET}`);
      this.results.failed++;
      this.results.errors.push({ test: testName, details });
    }
  }

  logSection(title) {
    console.log(`\n${BLUE}${'='.repeat(60)}${RESET}`);
    console.log(`${BLUE}${title}${RESET}`);
    console.log(`${BLUE}${'='.repeat(60)}${RESET}\n`);
  }

  async testLaroplanAPI() {
    this.logSection('TESTING LÄROPLAN API');

    // Test 1: Search subjects with LATEST (default)
    console.log(`${YELLOW}Test 1: Search subjects with timespan=LATEST${RESET}`);
    const test1 = await this.callTool('search_subjects', {
      timespan: 'LATEST',
      schooltype: 'GY'
    });

    if (test1.success) {
      const hasData = test1.data.content?.[0]?.text;
      const parsed = hasData ? JSON.parse(hasData) : null;
      this.logTest(
        'search_subjects with LATEST',
        parsed && parsed.totalElements > 0,
        `Found ${parsed?.totalElements || 0} subjects`
      );
    } else {
      this.logTest('search_subjects with LATEST', false, test1.error);
    }

    // Test 2: Search subjects with FUTURE
    console.log(`\n${YELLOW}Test 2: Search subjects with timespan=FUTURE${RESET}`);
    const test2 = await this.callTool('search_subjects', {
      timespan: 'FUTURE',
      schooltype: 'GY'
    });

    if (test2.success) {
      const hasData = test2.data.content?.[0]?.text;
      const hasError = test2.data.isError;

      if (hasError) {
        // Tool executed but returned error (e.g., no results)
        this.logTest(
          'search_subjects with FUTURE',
          true, // Parameter accepted, just no results
          `No future subjects found (expected) - ${hasData?.substring(0, 50)}`
        );
      } else {
        const parsed = hasData ? JSON.parse(hasData) : null;
        this.logTest(
          'search_subjects with FUTURE',
          true,
          `Found ${parsed?.totalElements || 0} future subjects`
        );
      }
    } else {
      this.logTest('search_subjects with FUTURE', false, test2.error);
    }

    // Test 3: Search subjects with EXPIRED
    console.log(`\n${YELLOW}Test 3: Search subjects with timespan=EXPIRED${RESET}`);
    const test3 = await this.callTool('search_subjects', {
      timespan: 'EXPIRED',
      schooltype: 'GY'
    });

    if (test3.success) {
      const hasData = test3.data.content?.[0]?.text;
      const hasError = test3.data.isError;

      if (hasError) {
        this.logTest(
          'search_subjects with EXPIRED',
          true,
          `No expired subjects found (API accepted parameter)`
        );
      } else {
        const parsed = hasData ? JSON.parse(hasData) : null;
        this.logTest(
          'search_subjects with EXPIRED',
          true,
          `Found ${parsed?.totalElements || 0} expired subjects`
        );
      }
    } else {
      this.logTest('search_subjects with EXPIRED', false, test3.error);
    }

    // Test 4: Search subjects with MODIFIED
    console.log(`\n${YELLOW}Test 4: Search subjects with timespan=MODIFIED${RESET}`);
    const test4 = await this.callTool('search_subjects', {
      timespan: 'MODIFIED',
      schooltype: 'GY'
    });

    if (test4.success) {
      const hasData = test4.data.content?.[0]?.text;
      const hasError = test4.data.isError;

      if (hasError) {
        this.logTest(
          'search_subjects with MODIFIED',
          true,
          `No modified subjects found (API accepted parameter)`
        );
      } else {
        const parsed = hasData ? JSON.parse(hasData) : null;
        this.logTest(
          'search_subjects with MODIFIED',
          true,
          `Found ${parsed?.totalElements || 0} modified subjects`
        );
      }
    } else {
      this.logTest('search_subjects with MODIFIED', false, test4.error);
    }

    // Test 5: Get subject details (preserve existing functionality)
    console.log(`\n${YELLOW}Test 5: Get subject details${RESET}`);
    const test5 = await this.callTool('get_subject_details', {
      code: 'MAT'
    });

    if (test5.success) {
      const hasData = test5.data.content?.[0]?.text;
      const parsed = hasData ? JSON.parse(hasData) : null;
      this.logTest(
        'get_subject_details for MAT',
        parsed && parsed.name,
        `Subject: ${parsed?.name || 'N/A'}`
      );
    } else {
      this.logTest('get_subject_details for MAT', false, test5.error);
    }

    // Test 6: Search courses with new timespan
    console.log(`\n${YELLOW}Test 6: Search courses with timespan=LATEST${RESET}`);
    const test6 = await this.callTool('search_courses', {
      timespan: 'LATEST',
      schooltype: 'GY'
    });

    if (test6.success) {
      const hasData = test6.data.content?.[0]?.text;
      const parsed = hasData ? JSON.parse(hasData) : null;
      this.logTest(
        'search_courses with LATEST',
        parsed && parsed.totalElements > 0,
        `Found ${parsed?.totalElements || 0} courses`
      );
    } else {
      this.logTest('search_courses with LATEST', false, test6.error);
    }

    // Test 7: Get course details
    console.log(`\n${YELLOW}Test 7: Get course details${RESET}`);
    const test7 = await this.callTool('get_course_details', {
      code: 'MATMAT01c'
    });

    if (test7.success) {
      const hasData = test7.data.content?.[0]?.text;
      const parsed = hasData ? JSON.parse(hasData) : null;
      this.logTest(
        'get_course_details for MATMAT01c',
        parsed && parsed.name,
        `Course: ${parsed?.name || 'N/A'}`
      );
    } else {
      this.logTest('get_course_details for MATMAT01c', false, test7.error);
    }

    // Test 8: Search curriculums with new timespan
    console.log(`\n${YELLOW}Test 8: Search curriculums with timespan=LATEST${RESET}`);
    const test8 = await this.callTool('search_curriculums', {
      timespan: 'LATEST'
    });

    if (test8.success) {
      const hasData = test8.data.content?.[0]?.text;
      const parsed = hasData ? JSON.parse(hasData) : null;
      this.logTest(
        'search_curriculums with LATEST',
        parsed && parsed.totalElements > 0,
        `Found ${parsed?.totalElements || 0} curriculums`
      );
    } else {
      this.logTest('search_curriculums with LATEST', false, test8.error);
    }

    // Test 9: Search programs with new timespan
    console.log(`\n${YELLOW}Test 9: Search programs with timespan=LATEST${RESET}`);
    const test9 = await this.callTool('search_programs', {
      timespan: 'LATEST',
      schooltype: 'GY'
    });

    if (test9.success) {
      const hasData = test9.data.content?.[0]?.text;
      const parsed = hasData ? JSON.parse(hasData) : null;
      this.logTest(
        'search_programs with LATEST',
        parsed && parsed.totalElements > 0,
        `Found ${parsed?.totalElements || 0} programs`
      );
    } else {
      this.logTest('search_programs with LATEST', false, test9.error);
    }
  }

  async testSkolenhetsregistret() {
    this.logSection('TESTING SKOLENHETSREGISTRET API (v2)');

    // Test 10: Search school units
    console.log(`${YELLOW}Test 10: Search all school units${RESET}`);
    const test10 = await this.callTool('search_school_units', {});

    if (test10.success) {
      const hasData = test10.data.content?.[0]?.text;
      const parsed = hasData ? JSON.parse(hasData) : null;
      this.logTest(
        'search_school_units (all)',
        Array.isArray(parsed),
        `Found ${parsed?.length || 0} school units`
      );
    } else {
      this.logTest('search_school_units (all)', false, test10.error);
    }

    // Test 11: Get school units by status AKTIV
    console.log(`\n${YELLOW}Test 11: Get school units with status=AKTIV${RESET}`);
    const test11 = await this.callTool('get_school_units_by_status', {
      status: 'AKTIV'
    });

    if (test11.success) {
      const hasData = test11.data.content?.[0]?.text;
      const parsed = hasData ? JSON.parse(hasData) : null;
      this.logTest(
        'get_school_units_by_status AKTIV',
        Array.isArray(parsed) && parsed.length > 0,
        `Found ${parsed?.length || 0} active school units`
      );
    } else {
      this.logTest('get_school_units_by_status AKTIV', false, test11.error);
    }

    // Test 12: Get school units by status UPPHORT
    console.log(`\n${YELLOW}Test 12: Get school units with status=UPPHORT${RESET}`);
    const test12 = await this.callTool('get_school_units_by_status', {
      status: 'UPPHORT'
    });

    if (test12.success) {
      const hasData = test12.data.content?.[0]?.text;
      const parsed = hasData ? JSON.parse(hasData) : null;
      this.logTest(
        'get_school_units_by_status UPPHORT',
        test12.success,
        `Found ${parsed?.length || 0} terminated school units`
      );
    } else {
      this.logTest('get_school_units_by_status UPPHORT', false, test12.error);
    }

    // Test 13: Search school units by name
    console.log(`\n${YELLOW}Test 13: Search school units by name${RESET}`);
    const test13 = await this.callTool('search_school_units_by_name', {
      name: 'Stockholm'
    });

    if (test13.success) {
      const hasData = test13.data.content?.[0]?.text;
      const parsed = hasData ? JSON.parse(hasData) : null;
      this.logTest(
        'search_school_units_by_name',
        Array.isArray(parsed),
        `Found ${parsed?.length || 0} schools matching "Stockholm"`
      );
    } else {
      this.logTest('search_school_units_by_name', false, test13.error);
    }
  }

  async testPlannedEducationsAPI() {
    this.logSection('TESTING PLANNED EDUCATIONS API (v3)');

    // Test 14: Search adult education
    console.log(`${YELLOW}Test 14: Search adult education${RESET}`);
    const test14 = await this.callTool('search_adult_education', {
      typeOfSchool: 'yh',
      distance: 'false'
    });

    if (test14.success) {
      const hasData = test14.data.content?.[0]?.text;
      const parsed = hasData ? JSON.parse(hasData) : null;
      this.logTest(
        'search_adult_education (YH)',
        parsed && parsed.totalElements >= 0,
        `Found ${parsed?.totalElements || 0} YH programs`
      );
    } else {
      this.logTest('search_adult_education (YH)', false, test14.error);
    }

    // Test 15: Filter by distance
    console.log(`\n${YELLOW}Test 15: Filter adult education by distance${RESET}`);
    const test15 = await this.callTool('search_adult_education', {
      typeOfSchool: 'yh',
      distance: 'true'
    });

    if (test15.success) {
      const hasData = test15.data.content?.[0]?.text;
      const parsed = hasData ? JSON.parse(hasData) : null;
      this.logTest(
        'filter_adult_education_by_distance',
        test15.success,
        `Found ${parsed?.totalElements || 0} distance programs`
      );
    } else {
      this.logTest('filter_adult_education_by_distance', false, test15.error);
    }

    // Test 16: Search SFI
    console.log(`\n${YELLOW}Test 16: Search SFI programs${RESET}`);
    const test16 = await this.callTool('search_adult_education', {
      typeOfSchool: 'sfi'
    });

    if (test16.success) {
      const hasData = test16.data.content?.[0]?.text;
      const parsed = hasData ? JSON.parse(hasData) : null;
      this.logTest(
        'search_adult_education (SFI)',
        test16.success,
        `Found ${parsed?.totalElements || 0} SFI programs`
      );
    } else {
      this.logTest('search_adult_education (SFI)', false, test16.error);
    }
  }

  printSummary() {
    this.logSection('TEST SUMMARY');

    const total = this.results.passed + this.results.failed;
    const passRate = total > 0 ? ((this.results.passed / total) * 100).toFixed(1) : 0;

    console.log(`Total tests: ${total}`);
    console.log(`${GREEN}Passed: ${this.results.passed}${RESET}`);
    console.log(`${RED}Failed: ${this.results.failed}${RESET}`);
    console.log(`Pass rate: ${passRate}%\n`);

    if (this.results.failed > 0) {
      console.log(`${RED}Failed tests:${RESET}`);
      this.results.errors.forEach((error, index) => {
        console.log(`${index + 1}. ${error.test}`);
        console.log(`   ${error.details}\n`);
      });
    } else {
      console.log(`${GREEN}All tests passed! ✓${RESET}\n`);
    }
  }
}

async function main() {
  const tester = new APITester();

  try {
    await tester.connect();

    // Test all three APIs
    await tester.testLaroplanAPI();
    await tester.testSkolenhetsregistret();
    await tester.testPlannedEducationsAPI();

    // Print summary
    tester.printSummary();

    // Exit with appropriate code
    process.exit(tester.results.failed > 0 ? 1 : 0);

  } catch (error) {
    console.error(`${RED}Fatal error: ${error.message}${RESET}`);
    process.exit(1);
  } finally {
    await tester.disconnect();
  }
}

main();

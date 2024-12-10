const fs = require('fs');

// Load the JSON report
const jsonReport = JSON.parse(fs.readFileSync('test-results.json', 'utf-8'));

// Initialize counters
let executedTests = 0;
let passedTests = 0;
let failedTests = 0;

// Traverse suites and accumulate stats
jsonReport.suites.forEach(suite => {
  suite.suites.forEach(subSuite => {
    subSuite.specs.forEach(spec => {
      spec.tests.forEach(test => {
        executedTests++;
        const testResult = test.results[0]; // Assuming one result per test
        if (testResult.status === 'passed') {
          passedTests++;
        } else if (testResult.status === 'failed') {
          failedTests++;
        }
      });
    });
  });
});
// Extract the flaky test count from the stats
const flakyTests = jsonReport.stats.flaky || 0;


// Output results
console.log(`Executed Tests: ${executedTests}`);
console.log(`Passed Tests: ${passedTests}`);
console.log(`Failed Tests: ${failedTests}`);
console.log(`Flaky Tests: ${flakyTests}`);

// Write results to GitHub environment variables
const envFilePath = process.env.GITHUB_ENV;
if (envFilePath) {
  fs.appendFileSync(envFilePath, `EXECUTED_TESTS=${executedTests}\n`);
  fs.appendFileSync(envFilePath, `PASSED_TESTS=${passedTests}\n`);
  fs.appendFileSync(envFilePath, `FAILED_TESTS=${failedTests}\n`);
  fs.appendFileSync(envFilePath, `FLAKY_TESTS=${flakyTests}\n`);
}

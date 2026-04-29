import { runTests } from './test_core.js';

// Mock Browser Environment
global.window = {};
global.localStorage = {
    store: {},
    getItem: function(key) { return this.store[key] || null; },
    setItem: function(key, value) { this.store[key] = value.toString(); },
    removeItem: function(key) { delete this.store[key]; }
};

console.log("Running Tests in Node Environment...");

runTests().then(results => {
    let passed = 0;
    let failed = 0;

    results.forEach(group => {
        console.log(`\n[${group.name}]`);
        group.tests.forEach(test => {
            if (test.passed) {
                console.log(`  ✓ ${test.desc}`);
                passed++;
            } else {
                console.log(`  ✗ ${test.desc} (${test.error})`);
                failed++;
            }
        });
    });

    console.log(`\nTotal: ${passed + failed} | Passed: ${passed} | Failed: ${failed}`);
    if (failed > 0) process.exit(1);
}).catch(e => {
    console.error("Test runner crashed:", e);
    process.exit(1);
});


import { SpatialHashGrid } from '../js/spatial.js';

function assert(condition, message) {
    if (!condition) {
        throw new Error(message || "Assertion failed");
    }
}

function runTests() {
    console.log("Running SpatialHashGrid Tests...");

    const grid = new SpatialHashGrid(1000, 1000, 100);

    // Test 1: Insert and Query
    const entity1 = { id: 1 };
    grid.insert(entity1, 50, 50, 10, 10); // Cell 0,0

    const results1 = grid.query(40, 40, 30, 30); // Overlaps 0,0
    assert(results1.has(entity1), "Entity should be found in its cell");
    assert(results1.size === 1, "Should find exactly 1 entity");

    console.log("Test 1 Passed");

    // Test 2: Multi-cell Insert
    const entity2 = { id: 2 };
    // Position 90, 90, size 20, 20. Spans 90-110 (Cells 0 and 1)
    grid.insert(entity2, 90, 90, 20, 20);

    const q1 = grid.query(50, 50, 10, 10); // Cell 0,0
    assert(q1.has(entity2), "Entity2 should be found in cell 0,0");

    const q2 = grid.query(105, 105, 10, 10); // Cell 1,1
    assert(q2.has(entity2), "Entity2 should be found in cell 1,1");

    console.log("Test 2 Passed");

    // Test 3: No Overlap
    const resultsEmpty = grid.query(500, 500, 10, 10);
    assert(resultsEmpty.size === 0, "Should be empty");

    console.log("Test 3 Passed");

    // Test 4: Clear
    grid.clear();
    const resultsCleared = grid.query(50, 50, 10, 10);
    assert(resultsCleared.size === 0, "Grid should be empty after clear");

    console.log("Test 4 Passed");
    console.log("All Spatial Tests Passed");
}

runTests();

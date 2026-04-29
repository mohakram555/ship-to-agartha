// ========================================
// AGARTHA: FALSE GUIDE - Spatial Partitioning
// ========================================

export class SpatialHashGrid {
    constructor(width, height, cellSize) {
        this.width = width;
        this.height = height;
        this.cellSize = cellSize;
        this.cells = new Map();
    }

    _getKey(x, y) {
        return `${x},${y}`;
    }

    _getIndices(x, y, w, h) {
        const minX = Math.floor(x / this.cellSize);
        const minY = Math.floor(y / this.cellSize);
        const maxX = Math.floor((x + w) / this.cellSize);
        const maxY = Math.floor((y + h) / this.cellSize);
        return { minX, minY, maxX, maxY };
    }

    insert(entity, x, y, w, h) {
        const { minX, minY, maxX, maxY } = this._getIndices(x, y, w, h);

        for (let cx = minX; cx <= maxX; cx++) {
            for (let cy = minY; cy <= maxY; cy++) {
                const key = this._getKey(cx, cy);
                if (!this.cells.has(key)) {
                    this.cells.set(key, []);
                }
                this.cells.get(key).push(entity);
            }
        }
    }

    query(x, y, w, h) {
        const { minX, minY, maxX, maxY } = this._getIndices(x, y, w, h);
        const results = new Set();

        for (let cx = minX; cx <= maxX; cx++) {
            for (let cy = minY; cy <= maxY; cy++) {
                const key = this._getKey(cx, cy);
                const cell = this.cells.get(key);
                if (cell) {
                    for (let i = 0; i < cell.length; i++) {
                        results.add(cell[i]);
                    }
                }
            }
        }
        return results;
    }

    clear() {
        this.cells.clear();
    }
}

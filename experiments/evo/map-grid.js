export class MapGrid {
    constructor(size, width, height) {
        this.size = size;  // size of the grid (number of cells)
        this.cellWidth = width / size;  // width of a cell
        this.cellHeight = height / size;  // height of a cell
        this.grid = new Array(size);  // Initialize the grid as a 2D array

        for(let i = 0; i < this.size; i++) {
            this.grid[i] = new Array(this.size).fill().map(() => []);
        }
    }

    // Returns the cell corresponding to the given position
    getCell(organism) {
        let cellX = Math.floor(organism.x / this.cellWidth);
        let cellY = Math.floor(organism.y / this.cellHeight);
        window.problem = organism;
        return this.grid[cellX][cellY];
    }

    // Adds an organism to the grid
    addToCell(organism) {
        let cell = this.getCell(organism);
        cell.push(organism);
        organism.cell = cell;  // Remember the organism's current cell
    }

    // Removes an organism from its current cell
    removeFromCell(organism) {
        let cell = organism.cell;
        let index = cell.indexOf(organism);
        if (index !== -1) {
            cell.splice(index, 1);
            return true;
        }
    }

    removeDead(organism) {
        this.grid.forEach((row, i) => {
            row.forEach((cell, j) => {
                cell.forEach((organism, idx) => {
                    if(organism.dead) cell.splice(idx, 1);
                });
            });
        });
    }

    totalOrganisms() {
        return this.grid.reduce((total, row) => {
            return total + row.reduce((rowTotal, cell) => {
                return rowTotal + cell.length;
            }, 0);
        }, 0);
    }

    // Returns an array of organisms in the cells neighboring the given position
    getNearbyOrganisms(organism) {
        let cellX = Math.floor(organism.x / this.cellWidth);
        let cellY = Math.floor(organism.y / this.cellHeight);
        let organisms = [];

        for(let dx = -1; dx <= 1; dx++) {
            for(let dy = -1; dy <= 1; dy++) {
                let nearbyCellX = cellX + dx;
                let nearbyCellY = cellY + dy;

                // Make sure the cell is within the grid
                if(nearbyCellX >= 0 && nearbyCellX < this.size && nearbyCellY >= 0 && nearbyCellY < this.size) {
                    organisms.push(...this.grid[nearbyCellX][nearbyCellY]);
                }
            }
        }

        return organisms;
    }

    distance(organism1, organism2) {
        const dx = organism1.x - organism2.x;
        const dy = organism2.y - organism2.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    inContact(organism1, organism2) {
        const dist = this.distance(organism1, organism2);
        return dist < 3 * (Math.sqrt(organism1.size) + Math.sqrt(organism2.size));
    }
}

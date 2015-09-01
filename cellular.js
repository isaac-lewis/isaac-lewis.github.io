var GLOBAL = {};


window.onload = function() {
    var canvas = document.getElementById('canvas');
    document.body.style.background = "url(" + canvas.toDataURL() + ")";

    var ctx = canvas.getContext("2d");
    var ticklength = 100;
    var count;
    var state;

    var numRows = 100;
    var numCols = 100;
    var cellSize = 8;
    var initialDensity = 0.3;

    canvas.height = numRows * cellSize;
    canvas.width = numCols * cellSize;

    var colorSchemes = {
	blackRed: {0: "rgb(0,0,0)",
		   0.5: "rgb(100,0,0)",
		   1: "rgb(200,0,0)"},

	blueShades: {0: "rgb(0,50,50)",
		     0.5: "rgb(0,50,140)",
		     1: "rgb(0,50,230)"},
    };

    var automata = {
	conway: {survival: [2,3],
		 birth: [3]},

	highlife: {survival: [2,3],
		   birth: [3,6]},

	replicator: {survival: [1,3,5,7],
		     birth: [1,3,5,7]},

	mazectric: {survival: [1,2,3,4,5],
		    birth: [3],
		    restartCycle: 20},

	briansbrain: {states: 3,
		      birth: [2],
		      restartCycle: 250}
    }

    var colorScheme = colorSchemes.blackRed;
    var rule = automata.briansbrain;

    var newState = function() {
	return newGrid(numRows, numCols);
    }

    var newGrid = function(rows, cols) {
	var grid = [];
	
	for(var i = 0; i < rows; i++) {
	    grid[i] = newRow(cols);
	}

	return grid;
    }

    var newRow = function(cols) {
	var row = [];

	for(var i = 0; i < cols; i++) {
	    var cellVal = Math.floor(Math.random() * (1 + initialDensity));
	    row[i] = cellVal;
	}

	return row;
    }

    var step = function(state) {
	var newState = [];

	for(var i = 0; i < numRows; i++) {
	    newState.push([]);

	    for(var j = 0; j < numCols; j++) {
		var cell = state[i][j];

		var iAbove = i != 0 ? i - 1 : numRows-1;
		var iBelow = i != numRows-1 ? i + 1 : 0;

		var jLeft = j != 0 ? j - 1 : numCols-1;
		var jRight = j != numCols-1 ? j + 1 : 0;

		var neighbours = [state[iAbove][jLeft],state[iAbove][j],state[iAbove][jRight],state[i][jLeft],state[i][jRight],state[iBelow][jLeft],state[iBelow][j],state[iBelow][jRight]]
		var livingNeighbours = 0;

		for(n in neighbours) {
		    if(neighbours[n] === 1) livingNeighbours += 1;
		}

		var newCell = stepCell(cell, livingNeighbours);

		newState[i][j] = newCell;
	    }
	}

	return newState;
    }


    var stepCell = function(cell, livingNeighbours) {
	if(rule.states !== 3) {
	    if(cell === 0) {
		if(rule.birth.indexOf(livingNeighbours) != -1) {
		    newCell = 1;
		} else {
		    newCell = 0;
		}
	    } else {
		if(rule.survival.indexOf(livingNeighbours) != -1) {
		    newCell = 1;
		} else {
		    newCell = 0;
		}
	    }
	} else if(rule.states === 3) {
	    if(cell === 0) {
		if(rule.birth.indexOf(livingNeighbours) != -1) {
		    newCell = 1;
		} else {
		    newCell = 0;
		}
	    } else if(cell === 1) {
		newCell = 0.5;
	    } else if(cell === 0.5) {
		newCell = 0;
	    }
	}
	return newCell;
    }

    var drawState = function(state) {
	ctx.clearRect(0,0,300,300);

	for(var i = 0; i < numRows; i++) {
	    for(var j = 0; j < numCols; j++) {
		var cellVal = state[i][j];
		ctx.fillStyle = getColor(cellVal);
		ctx.fillRect(i * cellSize, j * cellSize, cellSize, cellSize);

	    }
	}

	document.body.style.background = "url(" + canvas.toDataURL() + ")";
    }

    var getColor = function(cellVal) {
	return colorScheme[cellVal];
    }

    var init = function() {
	state = newState();
	count = 0;
	loop();
    }

    var loop = function() {
	drawState(state);
	state = step(state);

	count += 1;

	if(rule.restartCycle && count >= rule.restartCycle) {
	    count = 0;
	    state = newState();
	}
	setTimeout(function() {loop()}, ticklength);
    }

    init();

}


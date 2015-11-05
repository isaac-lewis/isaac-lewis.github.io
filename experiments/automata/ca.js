var timeout;

var stopCa = function() {
    clearTimeout(timeout);
    var canvas = document.getElementById("bg");
    var ctx = canvas.getContext("2d");
    
}

var selectCa = function(pcolor, prule) {
    clearTimeout(timeout);

    var canvas = document.getElementById("bg");
    var ctx = canvas.getContext("2d");
    var ticklength = 100;
    var count;
    var state;
    var oldState;

    var numRows = 100;
    var numCols = 100;
    var cellSize = 4;

    canvas.height = numRows * cellSize;
    canvas.width = numCols * cellSize;

    var colorSchemes = {
	pinks: {
	    0: "rgb(14,8,13)",
	    0.5: "rgb(116,62,97)",
	    1: "rgb(181,84,162)"
	},

	ralphLauren: {
	    0: "rgb(47,52,59)",
	    0.5: "rgb(126,130,122)",
	    1: "rgb(112,48,48)"
	},

	pomegranate: {
	    0: "rgb(99,166,159)",
	    0.5: "rgb(242,131,107)",
	    1: "rgb(242,225,172)"
	},

	sepia: {
	    0: "rgb(211,206,170)",
	    0.5: "rgb(251,247,228)",
	    1: "rgb(231,232,209)"
	}
    };

    var automata = {
	conway: {survival: [2,3],
		 birth: [3]},

	highlife: {survival: [2,3],
		   birth: [3,6]},

	replicator: {survival: [1,3,5,7],
		     birth: [1,3,5,7],
		     initialDensity: 0.002,
		     restartCycle: 25},

	mazectric: {survival: [1,2,3,4,5],
		    birth: [3],
		    restartCycle: 200,
		    initialDensity: 0.035},

	briansbrain: {states: 3,
		      birth: [2],
		      restartCycle: 500},
	
	gnarl: {survival: [1],
		birth: [1],
		initialDensity: 0.0005,
		restartCycle: 30},

	walledcities:  {survival: [2,3,4,5],
			    birth: [4,5,6,7,8],
			   initialDensity: 0.25}
    }

    var randomItem = function(obj) {
	var keys = Object.keys(obj);
	var len = keys.length;
	var rnd = Math.floor(Math.random()*len);
	var key = keys[rnd];
	return obj[key];
    }

    var colorScheme = pcolor ? colorSchemes[pcolor] : randomItem(colorSchemes);
    var rule = prule ? automata[prule] : randomItem(automata);

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
	var initialDensity = rule.initialDensity || 0.4;

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
	    } else if(cell === 1) {
		if(rule.survival.indexOf(livingNeighbours) != -1) {
		    newCell = 1;
		} else {
		    newCell = 0.5;
		}
	    } else if(cell === 0.5) {
		newCell = 0;
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
	// ctx.clearRect(0,0,canvas.height,canvas.width);

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
	oldState = state;
	state = step(oldState);
	drawState(oldState, state);

	count += 1;

	if(rule.restartCycle && count >= rule.restartCycle) {
	    count = 0;
	    state = newState();
	}
	timeout = setTimeout(function() {loop()}, ticklength);
    }

    init();
}

window.onload = selectCa('ralphLauren','mazectric');


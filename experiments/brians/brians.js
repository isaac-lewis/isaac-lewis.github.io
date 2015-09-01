var GLOBAL = {};


window.onload = function() {
    var canvas = document.getElementById('canvas');
    var popchart = document.getElementById('popchart');
    var oncount = document.getElementById('oncount');

    var ctx = canvas.getContext('2d');
    var popctx = popchart.getContext('2d');

    var cellSize = 8;

    var STATE_OFF = 0;
    var STATE_ON = 1;
    var STATE_DYING = 2;

    var initialise = function() {
	GLOBAL.gridHeight = Math.floor(canvas.height / cellSize);
	GLOBAL.gridWidth = Math.floor(canvas.width / cellSize);
	GLOBAL.ball = {x: 50, y: 24};
	GLOBAL.grid = newGrid(GLOBAL.gridHeight, GLOBAL.gridWidth);
	GLOBAL.gridSize = GLOBAL.gridHeight * GLOBAL.gridWidth;
	GLOBAL.speed = 100;
	GLOBAL.popLog = [];
    }

    window.onkeydown = function(evt) {
	if(evt.keyCode === 88) {
	    GLOBAL.speed *= 0.667;
	} else if(evt.keyCode === 90) {
	    GLOBAL.speed *= 1.5;
	} else if(evt.keyCode === 87 || evt.keyCode === 38) {
	    GLOBAL.ball.y -= 1;
	} else if(evt.keyCode === 65 || evt.keyCode === 37) {
	    GLOBAL.ball.x -= 1;
	} else if(evt.keyCode === 83 || evt.keyCode === 40) {
	    GLOBAL.ball.y += 1;
	} else if(evt.keyCode === 68 || evt.keyCode === 39) {
	    GLOBAL.ball.x += 1;
	}

	draw();

	return false;
    }
    
    var loop = function() {
	step();
	draw();
	window.setTimeout(loop, GLOBAL.speed);
    }

    var step = function() {
	var el;
	var row;

	var newGrid = [];
	var newRow;

	var onCount = 0;

	if(GLOBAL.grid[GLOBAL.ball.y][GLOBAL.ball.x] !== STATE_OFF) {
	    alert("Game over!");
	    initialise();
	}


	for(var row_i in GLOBAL.grid) {
	    row = GLOBAL.grid[row_i];
	    newRow = [];
	    var rowStr = "";

	    for(var col_j in row) {
		el = row[col_j];

		if(el === STATE_OFF) {
		    var numOn = numOnNeighbours(parseInt(row_i), parseInt(col_j));
 
		    if(numOn === 2) {
			newRow[col_j] = STATE_ON;
		    } else {
			newRow[col_j] = STATE_OFF;
		    }
		} else if(el === STATE_ON) {
		    onCount += 1;
		    newRow[col_j] = STATE_DYING;
		} else {
		    newRow[col_j] = STATE_OFF;
		}
	    }

	    newGrid.push(newRow);
	}

	oncount.innerText = onCount;
	GLOBAL.popLog.push(onCount);
	GLOBAL.grid = newGrid;

    }

    var numOnNeighbours = function(row_i, col_j) {
	var row1 = GLOBAL.grid[row_i - 1];
	var row2 = GLOBAL.grid[row_i];
	var row3 = GLOBAL.grid[row_i + 1];

	var neighbours = [];

	if(row1) {
	    neighbours.push(row1[col_j - 1]);
	    neighbours.push(row1[col_j]);
	    neighbours.push(row1[col_j + 1]);
	}

	neighbours.push(row2[col_j - 1]);
	neighbours.push(row2[col_j + 1]);

	if(row3) {
	    neighbours.push(row3[col_j - 1]);
	    neighbours.push(row3[col_j]);
	    neighbours.push(row3[col_j + 1]);
	}

	var count = 0;

	for(var i in neighbours) {
	    var n = neighbours[i];
	    if(n && n === STATE_ON) count += 1;
	}

	return count;
    }
    
    var draw = function() {
	var el;
	var row;

	ctx.fillStyle = "#000000";
	ctx.fillRect(0,0,canvas.width,canvas.height);

	for(var row_i in GLOBAL.grid) {
	    row = GLOBAL.grid[row_i];
	    
	    for(var col_j in row) {
		el = row[col_j];

		if(el === STATE_OFF) {
		    ctx.fillStyle = "#000000";
		} else if(el === STATE_ON) {
		    ctx.fillStyle = "#ff0000";
		} else {
		    ctx.fillStyle = "#880000";
		}

		ctx.fillRect(col_j * cellSize, row_i * cellSize, cellSize, cellSize);
	    }
	}


	ctx.fillStyle = "#00bb00";
	ctx.fillRect(GLOBAL.ball.x * cellSize, GLOBAL.ball.y * cellSize, cellSize, cellSize);
	drawGraph();
    }

    var drawGraph = function() {
	popctx.fillStyle = "#ffffff";
	popctx.fillRect(0,0,800,100);

	popctx.fillStyle = "#000000";
	
	var logLength = GLOBAL.popLog.length;
	var baselineLength = 800 - logLength;

	// plot the cell population graph based on % population density

	var v1 = Math.ceil(GLOBAL.popLog[0] * 100 / GLOBAL.gridSize);
	var v;

	if(baselineLength > 0) {
	    for(var i = 0; i < baselineLength; i++) {
		popctx.fillRect(i,100-v1,1,1);
	    }

	    for(var i = baselineLength; i < 800; i++) {
		v = Math.ceil(GLOBAL.popLog[i - baselineLength] * 100 / GLOBAL.gridSize);
		popctx.fillRect(i,100 - v,1,1);
	    }

	} else {

	    for(var i = 0; i < 800; i++) {
		v = Math.ceil(GLOBAL.popLog[logLength - 800 + i] * 100 / GLOBAL.gridSize);
		popctx.fillRect(i,100 - v,1,1);
	    }
	}
    }

    var newGrid = function(numRows, numCols) {
	var g = [];
	var r;
	var el;

	for(var i = 0; i < numRows; i++) {
	    r = [];
	    for(var j = 0; j < numCols; j++) {
		if(i < GLOBAL.ball.y - 15 || i > GLOBAL.ball.y + 15 ||
		   j < GLOBAL.ball.x - 15 || j > GLOBAL.ball.x + 15) {
		    el = Math.random() < 0.8 ? STATE_OFF : STATE_ON;
		    r.push(el);
		} else {
		    r.push(STATE_OFF);
		}
	    }

	    g.push(r);
	}

	return g;
    }

    initialise();
    loop();
}


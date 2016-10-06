var faces, terrainRnd, cratonSize, rowCol, rowSize, craton, row, col, foldedCol, split, coords, neigbours, n1, n2, n3;

function iToCoords(i, subdivision) {
    cratonSize = subdivision * subdivision;
    rowCol = (i % cratonSize);
    craton = (i - rowCol) / cratonSize;
    
    // convert rowCol to row, col
    row = Math.floor(Math.sqrt(rowCol));
    col = rowCol - (row * row);

    // "fold over" col value
    if(col <= row) { foldedCol = col * 2; }
    else { foldedCol = (((col - row) -1) * 2) + 1; }

    return [craton, row, foldedCol];
}

function coordsToI(coords, subdivision) {
    // need check that coords are valid
    craton = coords[0];
    row = coords[1];
    foldedCol = coords[2];

    if(foldedCol % 2 == 0) { col = foldedCol / 2; } 
    else { col = (((foldedCol - 1) / 2) + 1) + row; }

    if(row >= subdivision || col > rowLength(row) - 1) { return false; }
    else { return (craton * subdivision * subdivision) + (row * row) + col; }
}

function rowLength(row) {
    return (2*row) + 1;
}

// red=0, green=1, blue=2
function neighbourOfCraton(source, color) {
    return [
	[5,4,1],
	[6,0,2],
	[7,1,3],
	[8,2,4],
	[9,3,0],

	[0,10,14],
	[1,11,10],
	[2,12,11],
	[3,13,12],
	[4,14,13],

	[15,5,6],
	[16,6,7],
	[17,7,8],
	[18,8,9],
	[19,9,5],

	[10,16,19],
	[11,17,15],
	[12,18,16],
	[13,19,17],
	[14,15,18]
    ][source][color];
}

// 0th = green (locol), 1st blue (hicol), 2nd red (hirow OR lorow)
function neighboursOfCoords(coords, subdivision) {
    craton = coords[0], row = coords[1], col = coords[2];
    neighbours = [];

    // add n1
    if(col > 0) { 
	neighbours.push([craton, row, col-1]);
    } else {
	// cross the green line
	if(craton <= 4 || craton >= 15) 
	    neighbours.push([neighbourOfCraton(craton, 1),
			     row,
			     rowLength(row)-1]);
	else 
	    neighbours.push([neighbourOfCraton(craton, 1),
			     subdivision-row-1,
			     0]);
    }

    // add n2
    if(col < rowLength(row) - 1) { 
	neighbours.push([craton, row, col+1]);
    } else {
	// cross the blue line
	if(craton <= 4 || craton >= 15) 
	    neighbours.push([neighbourOfCraton(craton, 2),
			     row,
			     0]);
	else 
	    neighbours.push([neighbourOfCraton(craton, 2),
			     subdivision-row-1,
			     rowLength(subdivision-row-1)-1]);
    }
    
    // add n3
    if(col % 2 == 0) {
	if(row < subdivision - 1) {
	    neighbours.push([craton, row+1, col+1]);

	} else {
	    // cross the red line
	    neighbours.push([neighbourOfCraton(craton, 0),
			     subdivision-1, 
			     rowLength(row)-col-1]);
	}
    } else {
	if(row > 0) {
	    neighbours.push([craton, row-1, col-1]);
	}
    }

    return neighbours;
}

function neighboursOfI(i, n) {
    return neighboursOfCoords(iToCoords(i,n),n).map(function(c) {
	return coordsToI(c,n);
    });
}

function verticesMatch(v1, v2) {
    var match = true;
    v1.forEach(function(c,i) {
	if(c !== v2[i]) match = false;
    });

    return match;
}

// different names 'case we change the API later on
function polygonContainsVertice(polygon, v1) {
    return arrayContainsVertice(polygon, v1);
}

function arrayContainsVertice(array, v1) {
    return array.find(function(v2) {
	return verticesMatch(v1, v2);
    });
}

// a face 'i' is the vertex between 3 different hexes
// given an i, returns an array of 3 arrays of 6 tiles

// more efficient tack: make use of the neighbours function
// always returning neighbours in particular order


function allHexes(n) {
    var hexesCache = {}, hexes = [];
    var hash;

    for(var i = 0; i < isocTriangles(n); i++) {
	hexesAroundI(i,n).forEach(function(hex) {
	    hash = hexHash(hex, n);
	    if(hexesCache[hash] === undefined) {
		hexesCache[hash] = true;
		hexes.push(hex);
	    }
	});
    }

    return hexes;
}

function hexesAroundI(i, n) {

    coords = iToCoords(i, n);
    ns = neighboursOfCoords(coords, n);

    // for each trio of neighbouring tiles, 
    // find the other 3 tiles to complete the hex

    var neighbourTrio = [[ns[0],coords,ns[1]],
			  [ns[0],coords,ns[2]],
			  [ns[1],coords,ns[2]]];

    var hexes = neighbourTrio.map(function(trio) {
	return trioToHex(trio, n);
    });

    return hexes;
}


// easiest way
// take the 0th and 2nd elements in trio (1st is 'center')
// find their neighbours (subneighbours)
// find *their* neighbours (subsubneighbours)
// the subsubneighbour duplicate is the 5th tile
// it's two parents are the 3rd and 4th
// if there's a crossover, it's a pentagon

function trioToHex(trio, n) {
    var hex1 = trio[0], hex2 = trio[1], hex3 = trio[2];
    var h1subs = neighboursOfCoords(hex1, n).filter(function(sub) {
	return !verticesMatch(sub, hex2); });
    var h3subs = neighboursOfCoords(hex3, n).filter(function(sub) {
	return !verticesMatch(sub, hex2); });

    if(h1subs.length !== 2 || h3subs.length !== 2) return; // summats wrong

    var h1subsubs = _.flatten(h1subs.map(function(s) { 
	return neighboursOfCoords(s, n).filter(function(sub) {
	    return !verticesMatch(sub, hex1);
	});
    }), true);

    var h3subsubs = _.flatten(h3subs.map(function(s) {
	return neighboursOfCoords(s, n).filter(function(sub) {
	    return !verticesMatch(sub, hex3);
	});
    }), true);

    if(h1subsubs.length !== 4 || h3subsubs.length !== 4) return; // summats wrong

    var crossI1, crossI3, hex4, hex5, hex6;
    
    // now find the crossover...
    crossI1 = _.findIndex(h1subsubs, function(ss1) {
	crossI3 = _.findIndex(h3subsubs, function(ss3) {
	    return verticesMatch(ss1,ss3);
	});

	if(crossI3 !== -1) return true;
    });

    // it's a pentagon!
    if(crossI1 === -1 && crossI3 === -1) {
	crossI1 = _.findIndex(h1subsubs, function(ss1) {
	    crossI3 = _.findIndex(h3subs, function(s3) {
		return verticesMatch(ss1,s3);
	    });
	    
	    if(crossI3 !== -1) return true;
	});

	if(crossI1 <= 1) hex4 = h1subs[0];
	else hex4 = h1subs[1];

	hex5 = h3subs[crossI3];
	return [hex1,hex2,hex3,hex5,hex4];
    }

    // then find the parents...
    if(crossI1 <= 1) hex4 = h1subs[0];
    else hex4 = h1subs[1];

    if(crossI3 <= 1) hex6 = h3subs[0];
    else hex6 = h3subs[1];

    hex5 = h1subsubs[crossI1];
    return [hex1,hex2,hex3,hex6,hex5,hex4];
}

function isocTriangles(n) {
    return n * n * 20;
}

function hexHash(hex,n) {
    var size = isocTriangles(n);

    var canonical = hex.map(function(v) {
	return coordsToI(v,n);
    }).sort();
    return size*size*canonical[0] + size*canonical[1] + canonical[2];
}

function uniqueVertices(polygons) {
    var allVertices = _.flatten(polygons, true);
    var uniqs = [];

    allVertices.forEach(function(v) {
	if(!polygonContainsVertice(uniqs, v)) {
	    uniqs.push(v);
	}
	console.log(uniqs.length);
    });

    return uniqs;
}

function randomTile(subdivision) {
    return iToCoords(randInt(subdivision*subdivision*20),subdivision);
}

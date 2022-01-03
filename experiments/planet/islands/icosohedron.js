// TODO - check value of declaring vars at top of file

var faces, terrainRnd, cratonSize, rowCol, rowSize, craton, row, col, foldedCol, split, coords, n1, n2, n3,
faceSize, tileIdxInFace, faceIdx, rowIdx, rawColIdx, colIdx, rowAndColIdx, randomIdx, neighbourFaceIdx, neighbourCoordsArray;

/* SIZE/LOCATION FUNCTIONS */

var numTilesInRow = function(rowIdx) {
    return (2 * rowIdx) + 1;
}

var numTilesOnPlanet = function(vertexLength) {
    return vertexLength * vertexLength * 20;
}

var isEven = function(n) {
    return n % 2 === 0;
}

var isColIdxTooHigh = function(colIdx, rowIdx) {
    return colIdx >= numTilesInRow(rowIdx) - 1;
}

var isRowIdxTooHigh = function(rowIdx, vertexLength) {
    return rowIdx >= vertexLength - 1;
}

var isPolarFace = function(faceIdx) {
    return faceIdx <= 4 || faceIdx >= 15;
}

var randomTileIdx = function(vertexLength) {
    return (randInt(19) * (vertexLength * vertexLength))
	+ randInt(vertexLength * vertexLength);
}

var randomTile = function(vertexLength) {
    return convertIdxToCoords(randomTileIdx(vertexLength), vertexLength);
}

/* CONVERSION FUNCTIONS */

var convertTileIdxToRowColIdx = function(tileIdxInFace) {
    // convert tileIdxInFace to rowIdx, rawColIdx
    rowIdx = Math.floor(Math.sqrt(tileIdxInFace));
    rawColIdx = tileIdxInFace - (rowIdx * rowIdx);

    // "fold over" rawColIdx value
    if(rawColIdx <= rowIdx) {
	colIdx = rawColIdx * 2;
    } else {
	colIdx = (((rawColIdx - rowIdx) -1) * 2) + 1;
    }

    return [rowIdx, colIdx];
}

var convertRowColIdxToTileIdx = function(rowIdx, colIdx, vertexLength) {
    // "unfold" colIdx value
    if(colIdx % 2 == 0) {
	rawColIdx = colIdx / 2;
    } else {
	rawColIdx = (((colIdx - 1) / 2) + 1) + rowIdx;
    }

    // check values are valid
    if(rowIdx >= vertexLength || rawColIdx > numTilesInRow(rowIdx) - 1) {
	return false;
    } else {
	return (rowIdx * rowIdx) + rawColIdx;
    }
}

var convertIdxToCoords = function(idx, vertexLength) {
    faceSize = vertexLength * vertexLength;
    tileIdxInFace = (idx % faceSize);
    faceIdx = (idx - tileIdxInFace) / faceSize;
    
    rowAndColIdx = convertTileIdxToRowColIdx(tileIdxInFace);

    return [faceIdx, rowAndColIdx[0], rowAndColIdx[1]];
}


var convertCoordsToIdx = function(coords, vertexLength) {
    // need to check that coords are valid
    faceIdx = coords[0];
    rowIdx = coords[1];
    colIdx = coords[2];

    tileIdxInFace = convertRowColIdxToTileIdx(rowIdx, colIdx, vertexLength);

    if(tileIdxInFace === false) {
	return false;
    } else {
	return (faceIdx * vertexLength * vertexLength) + tileIdxInFace;
    }
}

/* VERTICES FUNCTIONS  */ 

var verticesMatch = function(v1, v2) {
    var match = true;
    v1.forEach(function(c,i) {
	if(c !== v2[i]) match = false;
    });

    return match;
}

// different names 'case we change the API later on
var polygonContainsVertice = function(polygon, v1) {
    return arrayContainsVertice(polygon, v1);
}

var arrayContainsVertice = function(array, v1) {
    return array.find(function(v2) {
	return verticesMatch(v1, v2);
    });
}


var HIGH_ROW_SIDE = 0; // side where row > max
var LOW_COL_SIDE = 1; // side where col < 0
var HIGH_COL_SIDE = 2; // side where col > max

// direction = BASE_SIDE / LEFT_SIDE / RIGHT_SIDE
var neighbourOfFace = function(faceIdx, direction) {
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
    ][faceIdx][direction];
}

var neighboursOfIdx = function(idx, vertexLength) {
    neighbourCoordsArray = neighboursOfCoords(convertIdxToCoords(idx, vertexLength), vertexLength);

    return neighbourCoordsArray.map(function(neighbourCoords) {
	return convertCoordsToIdx(neighbourCoords, vertexLength);
    });
}

var neighboursOfCoords = function(coords, vertexLength) {
    faceIdx = coords[0], rowIdx = coords[1], colIdx = coords[2];

    // add n1: "colIdx - 1" neighbour
    if(colIdx > 0) { 
	n1 = [faceIdx, rowIdx, colIdx - 1];

    } else {
	// cross the LOW_COL_SIDE line
	neighbourFaceIdx = neighbourOfFace(faceIdx, LOW_COL_SIDE);

	if(isPolarFace(faceIdx)) 
	    n1 = [neighbourFaceIdx, rowIdx, numTilesInRow(rowIdx) - 1];
	else 
	    n1 = [neighbourFaceIdx, vertexLength - rowIdx - 1, 0];
    }


    // add n2: "colIdx + 1" neighbour
    if(!isColIdxTooHigh(colIdx, rowIdx)) { 
	n2 = [faceIdx, rowIdx, colIdx + 1];

    } else {
	// cross the HIGH_COL_SIDE line
	neighbourFaceIdx = neighbourOfFace(faceIdx, HIGH_COL_SIDE);

	if(isPolarFace(faceIdx)) 
	    n2 = [neighbourFaceIdx, rowIdx, 0];
	else 
	    n2 = [neighbourFaceIdx,
		  vertexLength - rowIdx - 1,
		  numTilesInRow(vertexLength - rowIdx - 1) - 1];
    }
    
    // add n3: "adjacent row" neighbour
    if(isEven(colIdx)) {
	if(isRowIdxTooHigh(rowIdx, vertexLength)) {

	    // cross the HIGH_ROW_SIDE line
	    n3 = [neighbourOfFace(faceIdx, HIGH_ROW_SIDE),
			     vertexLength - 1, 
			     numTilesInRow(rowIdx) - colIdx - 1];

	} else {
	    n3 = [faceIdx, rowIdx + 1, colIdx + 1];
	}

    } else {
	// note - if colIdx is odd, rowIdx cannot be 0, so we can safely assume rowIdx > 0
	n3 = [faceIdx, rowIdx - 1, colIdx - 1];
    }

    return [n1, n2, n3];
}


var neighbourOfTileInDirection = function(tileCoords, direction, vertexLength) {
    return neighboursOfCoords(tileCoords, vertexLength)[direction];
}

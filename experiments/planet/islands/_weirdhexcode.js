/*

// a face 'i' is the vertex between 3 different hexes
// given an i, returns an array of 3 arrays of 6 tiles

// more efficient tack: make use of the neighbours function
// always returning neighbours in particular order


var allHexes = function(n) {
    var hexesCache = {}, hexes = [];
    var hash;

    for(var i = 0; i < numTrianglesOnPlanet(n); i++) {
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

var hexesAroundI = function(i, n) {

    coords = convertIdxToCoords(i, n);
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

var trioToHex = function(trio, n) {
    console.log(trio);
    console.log(1/0);
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


var hexHash = function(hex,n) {
    var size = numTilesOnPlanet(n);

    var canonical = hex.map(function(v) {
	return convertCoordsToIdx(v,n);
    }).sort();
    return size*size*canonical[0] + size*canonical[1] + canonical[2];
}

var uniqueVertices = function(polygons) {
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
*/


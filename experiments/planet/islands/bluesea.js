var tiles, row, col, coords, iceCapExtent, height, idx, rgb, xRotate, yRotate, zRotate, faceIdx, colIdx, rowIdx, neighbours, newHeight, plateauProbability, elevations, terrain, elevation, tile, tileIdx;

var canvasWidth = 1000,
canvasHeight = 1000,
black = '#000',
darkGrey = '#0e0e0e';

var tileBorderColor = black,
tileBorderWidth = .2,
backgroundColor = '#0f0f33';

var rotationVelocity = {x: .003, y: .0, z: .0},
t0 = Date.now();

var planetParams = {
    vertexLength: 40,
    numPeaks: 50,
    maxPeakHeight: 12,
    grassSpreadProbability: 0.98,
    beachSpreadProbability: 0.6,
};

var elevations = [];

var creatures = [];

var handleKeyDown = function(e) {
    console.log(e.code);
    if(e.code === 'Space' || e.code === 'Equal') { rotationVelocity.x *= 2; }
    else if(e.code === 'Minus') { rotationVelocity.x /= 2; }
    else if(e.code === 'KeyS') { seaLevelRise(); }
    else if(e.code === 'KeyD') { seaLevelDrop(); }
    else if(e.code === 'KeyF') { killAllVeg(); }
}

var seaLevelRise = function() {
    tiles.forEach(function(tile, idx) {
	tile.elevation -= 1;
	setTileColor(tile, idx);
    });
}

var seaLevelDrop = function() {
    tiles.forEach(function(tile, idx) {
	var t = tile.elevation;
	tile.elevation += 1;
	if(coinflip(0.05)) { console.log(t, tile.elevation); }
	setTileColor(tile, idx);
    });
}

var killAllVeg = function() {
    tiles.forEach(function(tile, idx) {
	tile.vegetation = false;
	setTileColor(tile, idx);
    });
}

// setup canvas
var projection = d3.geo.orthographic()
    .scale(canvasHeight / 2 - 100)
    .translate([canvasWidth / 2, canvasHeight / 2])

var canvas = d3.select("body").append("canvas")
    .attr("width", canvasWidth)
    .attr("height", canvasHeight);

var context = canvas.node().getContext("2d");

context.strokeStyle = tileBorderColor;
context.lineWidth = tileBorderWidth;

// utils
var msElapsed = function() {
    return Date.now() - t0;
}

var forceIntoRange = function(x, min, max) {
    if(x > max)
	return max;
    else if(x < min)
	return min;
    else
	return x;
}

var randIntBetween = function(min, max) {
    return min + randInt(max - min);
};

var repeatNTimes = function(n, fun) {
    for(var i = 0; i < n; i++) {
	fun();
    }
}

var coinflip = function(odds) {
    return Math.random() < odds;
}

// app
var tick = function() {
    rotateProjection();
    moveCreatures();
    spreadVegetation();
    redraw();
}

var rotateProjection = function() {
    xRotate = 0 + msElapsed() * rotationVelocity.x;
    yRotate = 12 + msElapsed() * rotationVelocity.y;
    zRotate = -8 + msElapsed() * rotationVelocity.z;
    projection.rotate([xRotate, yRotate, zRotate]);
};


var drawBackground = function() {
    context.clearRect(0, 0, canvasWidth, canvasHeight);
    context.fillStyle = backgroundColor;
    context.fillRect(0, 0, canvasWidth, canvasHeight);
};

var redrawTiles = function() {
    tiles.forEach(function(d) {
	for(var i in d) {
	    d.polygon[i] = projection(d[i]);
	}


	if (d.visible = d.polygon.area() > 0) {
	    drawTriangle(d.polygon, d.fill);
	}
    });
}

var redrawCreatures = function() {
    creatures.forEach(function(c) {
	if(tiles[c.location].visible) {
	    drawCreatures(tiles[c.location].polygon, '#a85');
	}
    });
}

var centerOfTriangle = function(triangle) {
    var minX = Math.min(triangle[0][0], triangle[1][0], triangle[2][0]);
    var maxX = Math.max(triangle[0][0], triangle[1][0], triangle[2][0]);
    var minY = Math.min(triangle[0][1], triangle[1][1], triangle[2][1]);
    var maxY = Math.max(triangle[0][1], triangle[1][1], triangle[2][1]);

    return [Math.round((minX + maxX) / 2), Math.round((minY + maxY) / 2)];
}

var drawTriangle = function(triangle, color) {
    context.fillStyle = color;
    context.beginPath();

    context.moveTo(triangle[0][0], triangle[0][1]);

    for(var i in triangle) {
	if(i > 0) context.lineTo(triangle[i][0], triangle[i][1]);
    }

    context.closePath();
    context.fill();
}

var drawCircle = function(center, radius, color) {
    context.fillStyle = color;
    context.beginPath();
    context.arc(center[0], center[1], radius, 0, 2 * Math.PI, false)
    context.closePath();
    context.fill();
}

var drawCreatures = function(triangle, color) {
    drawCircle(centerOfTriangle(triangle), 1, color);
}

var redrawTileBorders = function() {
    context.beginPath();
    tiles.forEach(function(d) {
	if (d.visible) {
	    drawTriangle(d.polygon);
	}
    });

    context.stroke();
}

var redraw = function() {
    drawBackground();
    redrawTiles();
    redrawCreatures();
    // redrawTileBorders();
}

var willHillDescend = function(height) {
    // plateau probability = probability tile will have 1+ neighbour with same height

    if(height >= 9) { plateauProbability = 0; }
    else if(height >= 6) { plateauProbability = 1 - (height * 0.08); }
    else if(height >= 3) { plateauProbability = 1 - (height * 0.04); }
    else if(height === 2) {
	plateauProbability = Math.min(0.999, planetParams.grassSpreadProbability); }
    else if(height === 1) {
	plateauProbability = Math.min(0.999, planetParams.beachSpreadProbability); }
    else if(height <= 0) {
	plateauProbability = 0.5;
    }

    // if plateauProbability = 0, hillProbability = 1
    // if plateauProbability = 1, hillProbability = 0.67

    hillProbability = 1 - (plateauProbability / 3);

    return coinflip(hillProbability);
}


// set height for elevationsArray[coords] to height, then recursively set neighbours
// TODO - clean up, then figure out steepness function
var recursivelySetHeight = function(coords, height, elevationsArray, vertexLength) {
    idx = convertCoordsToIdx(coords, vertexLength);

    if(idx === false) { return; }

    // if point at this elevation already set to a greater height, return
    if(height <= -5 || elevationsArray[idx] > height) { return; }

    elevationsArray[idx] = height;

    // recursively set height of neighbouring tiles
    neighbours = neighboursOfCoords(coords, vertexLength);
    
    neighbours.forEach(function(neighbour) {
	newHeight = height;

	if(willHillDescend(height)) {
	    newHeight = height - 1;
	}

	recursivelySetHeight(neighbour, newHeight, elevationsArray, vertexLength);
    });
}

var findTile = function(params) {
    var { minElevation, maxElevation } = params;
    var tile;

    for(var i = 0; i < 99; i++) {
	tile = randomTile(planetParams.vertexLength);
	idx = convertCoordsToIdx(tile, planetParams.vertexLength);
	elevation = elevations[idx];

	if(elevation >= minElevation && elevation <= maxElevation) {
	    return [tile, idx];
	}
    }

    return false;
}

var addMountain = function(vertexLength, maxPeakHeight, elevations) {
    row = randInt(vertexLength - 1);
    height = randIntBetween(1, maxPeakHeight);
    var startingTile = randomTile(vertexLength);

    recursivelySetHeight(startingTile, height, elevations, vertexLength);
}

var addCreature = function(vertexLength, creatures) {
    var location = findTile({ minElevation: 1, maxElevation: 5});

    if(!location) { return; }

    creatures.push({ location: location[1] });
}

var moveCreatures = function() {
    creatures.forEach(function(c) {
	randomlyMoveCreature(c);
	randomlyReproduceCreature(c);
	randomlyKillCreature(c);
    });
}

var randomlyMoveCreature = function(creature) {
    if(coinflip(0.2)) { return; }

    var potentialMoves = neighboursOfIdx(creature.location, planetParams.vertexLength);
    var move = potentialMoves[randInt(2)];

    if(elevations[move] >= 1 && elevations[move] <= 5) { creature.location = move; }
}

var randomlyReproduceCreature = function(creature) {
    if(creatures.length > 2000 || coinflip(0.99)) { return; }

    var creaturesAtLocation = creatures.filter(function(c) {
	return c.location === creature.location;
    });

    if(creaturesAtLocation.length < 2) {
	creatures.push({ location: creature.location });
    }
}

var randomlyKillCreature = function(creature) {
    // TODO - code this
}

var spreadVegetation = function() {
    tiles.forEach(function(face, idx) {
	if(face.vegetation && coinflip(0.25) ||
	    face.elevation === 0 && coinflip(0.001)) {

	    neighbours = neighboursOfIdx(idx, planetParams.vertexLength);
	    tileIdx = neighbours[randInt(2)];
	    tile = tiles[tileIdx];

	    if(tile.vegetation === false &&
	       tile.elevation >= 1 &&
	       tile.elevation <= 5) {

		tile.vegetation = true;
		setTileColor(tile, tileIdx);
	    }
	}
    });
}

var createGeodesicPlanet = function(planetParams) {
    var { vertexLength, numPeaks, maxPeakHeight } = planetParams;

    elevations = [], creatures = [];

    // add mountains to polygons
    repeatNTimes(numPeaks, function() { addMountain(vertexLength, maxPeakHeight, elevations); });

    repeatNTimes(10, function() { addCreature(vertexLength, creatures); });

    // set polygons for use in redraw function
    tiles = d3.geodesic.polygons(vertexLength).map(function(d, i) {
	el = elevations[i];
	d.elevation = el;

	return d;

    }).map(function(d, i) {
	elevation = d.elevation;
	d = d.coordinates;

	d.polygon = d3.geom.polygon(d.map(projection));
	d.elevation = elevation !== undefined ? elevation : -5;
	d.vegetation = false;
	setTileColor(d, i);

	return d;
    });

    redraw();
}

var iceCapColor = function() {
    var gray = randIntBetween(220, 255);
    return [gray, gray, randIntBetween(gray, gray + 15)];
}

var isIceCap = function(coords) {
    faceIdx = coords[0], colIdx = coords[1], rowIdx = coords[2];

    var iceCapExtent = 10;
    var iceBergsExtent = 10;
    var minCol = planetParams.vertexLength - iceCapExtent;
    var maxRow = 1 + planetParams.vertexLength - iceCapExtent * 2;
    var reverseRowIdx = (colIdx * 2) - rowIdx;

    if( ![0, 5, 12, 17].includes(faceIdx) ) { return false; }
    else {
	return (colIdx + randInt(iceBergsExtent) > minCol &&
		rowIdx + randInt(iceBergsExtent * 2) > maxRow &&
		reverseRowIdx + randInt(iceBergsExtent * 2) > maxRow);
    }
}

var seaColor = function() {
    return [0, 30, randIntBetween(150, 170)];
}

var beachColor = function() {
    return [randIntBetween(220, 245), 210, 150];
}

var dirtColor = function(el) {
    return [220 - (20 * el), 190 - (20 * el), 135 - (10 * el)];
}

var vegetationColor = function(el) {
    return [0, randIntBetween(240, 255) - (40*el), 50];
}

var mountainColor = function(el) {
    return [el*30, el*30, el*30 + randInt(15)];
}

var makeRgbString = function(rgbArray) {
    return "rgb("+rgbArray[0]+","+rgbArray[1]+","+rgbArray[2]+")";
}

var setTileColor = function(tile, idx) {
    tile.fill = elevationToColor(tile.elevation, tile.vegetation, idx);
};

var elevationToColor = function(el, hasVegetation, idx) {
    coords = convertIdxToCoords(idx, planetParams.vertexLength);
    
    if(isIceCap(coords)) { rgb = iceCapColor(); }
    else if(el === undefined || el <= 0) { rgb = seaColor(); }
    else if(el === 1) { rgb = beachColor(); }
    else if(el >= 2 && el <= 5) { rgb = hasVegetation ? vegetationColor(el) : dirtColor(el); }
    else if(el >= 6) { rgb = mountainColor(el); }

    return makeRgbString(rgb);
}

var logPlanetSize = function(vertexLength) {
    var tiles = numTilesOnPlanet(vertexLength);
    var tileArea = 389.71;
    var area = tiles * tileArea;
    var areaM = Math.round(area / 100000) / 10;
    console.log("Planet has "+tiles+" tiles, and a surface area of "+areaM+" million km^2.");
    
    var comparison, comparisonArea;
    if(areaM < 0.75) {
	comparison = "Mimas (moon of Saturn)", comparisonArea = 0.5;
    } else if(areaM < 1.5) {
	comparison = "Enceladus (moon of Saturn)", comparisonArea = 0.8;
    } else if(areaM < 3) {
	comparison = "Ceres (asteroid)", comparisonArea = 2.8;
    } else if(areaM < 6) {
	comparison = "Charon (moon of Pluto)", comparisonArea = 4.6;
    } else if(areaM < 12) {
	comparison = "Titania (moon of Uranus)", comparisonArea = 7.8;
    } else if(areaM < 25) {
	comparison = "Pluto", comparisonArea = 17.7;
    } else if(areaM < 35) {
	comparison = "Europa (moon of Jupiter)", comparisonArea = 30.9;
    } else if(areaM < 50) {
	comparison = "Earth's Moon", comparisonArea = 37.9;
    } else if(areaM < 100) {
	comparison = "Mercury", comparisonArea = 75;
    } else if(areaM < 250) {
	comparison = "Mars", comparisonArea = 140;
    } else if(areaM < 1000) {
	comparison = "Earth", comparisonArea = 510;
    } else {
	comparison = "Neptune", comparisonArea = 7700;
    }

    console.log("In comparison, "+comparison+" has a surface area of "+comparisonArea+" million km^2.");

    return area;
}

var promptForInt = function(text, defaultVal, min, max) {
    var inp = window.prompt(text, String(defaultVal));
    var parsedInt = parseInt(inp);
    return forceIntoRange(parsedInt, min, max);
}

var reload = function() {
    planetParams.vertexLength = promptForInt("Enter new planet size (1-50).", 25, 1, 50);
    planetParams.numPeaks = promptForInt("Enter number peaks (0-200).", 30, 0, 200);
    planetParams.maxPeakHeight = promptForInt("Enter max peak height (1-15).", 12, 1, 15);
    planetParams.grassSpreadProbability = promptForInt("Enter grass spread probability (0-100).", 90, 0, 100) / 100;
    planetParams.beachSpreadProbability = promptForInt("Enter beach spread probability (0-100).", 60, 0, 100) / 100;

    createGeodesicPlanet(planetParams);
    logPlanetSize(planetParams.vertexLength);

    return false;
}

document.addEventListener('keydown', handleKeyDown);
createGeodesicPlanet(planetParams);
d3.timer(tick);

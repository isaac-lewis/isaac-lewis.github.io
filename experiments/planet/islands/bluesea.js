var tiles, row, col, coords, iceCapExtent, height, idx, rgb, xRotate, yRotate, zRotate, faceIdx, colIdx, rowIdx, neighbours, newHeight, newSize, plateauProbability, elevations, terrain, elevation, desert, tile, tileIdx, dayLengthMs, currentTimeOfDay, nightStartTime, nightShadow;

var canvasWidth = 1000,
canvasHeight = 1000,
black = '#000',
darkGrey = '#0e0e0e';

var tileBorderColor = black,
tileBorderWidth = .2,
backgroundColor = '#0f0f33',
backgroundColorDark = '#0d0d20';

var rotationVelocity = {x: .0021, y: .0, z: .0},
t0 = Date.now(),
dayLengthMs = 20000,
nightStartTime = 10000,
scale = 400;

var planetParams = {
    vertexLength: 40,
    numPeaks: 14,
    numSmallIslands: 250,
    numCities: 250,
    numVehicles: 40,
    maxPeakHeight: 12,
    grassSpreadProbability: 0.88,
    beachSpreadProbability: 0.66,
};

var elevations = [];
var deserts = [];
var poleDistances = [];
var cities = [];
var vehicles = [];
var stars = [];

var handleKeyDown = function(e) {
    console.log(e.code);
    if(e.code === 'Space' || e.code === 'Equal') { rotationVelocity.x *= 2; }
    else if(e.code === 'Minus') { rotationVelocity.x /= 2; }
    else if(e.code === 'ArrowUp') { scale *= 1.04; }
    else if(e.code === 'ArrowDown') { scale /= 1.04; }
    else if(e.code === 'ArrowLeft') { rotateProjection(); }
    else if(e.code === 'ArrowRight') { rotateProjection(-1); }
    else if(e.code === 'KeyS') { seaLevelRise(); }
    else if(e.code === 'KeyD') { seaLevelDrop(); }
    else if(e.code === 'KeyK') { killAllVeg(); }
    else if(e.code === 'KeyG') { grassEverywhere(); }
    else if(e.code === 'KeyB') { generateVehicles(Math.max(10, Math.floor(vehicles.length * 0.3))); }
    else if(e.code === 'KeyN') { vehicles = vehicles.slice(0, Math.floor(vehicles.length * 0.77)); }
    else if(e.code === 'KeyC') { generateCities(Math.max(30, Math.floor(cities.length * 0.3))); }
    else if(e.code === 'KeyV') { cities = cities.slice(0, Math.floor(cities.length * 0.77)); }
}

var seaLevelRise = function() {
    tiles.forEach(function(tile, idx) {
	tile.elevation -= 1;
	setTileColor(tile, idx);
    });
}

var seaLevelDrop = function() {
    tiles.forEach(function(tile, idx) {
	tile.elevation += 1;
	setTileColor(tile, idx);
    });
}

var killAllVeg = function() {
    tiles.forEach(function(tile, idx) {
	tile.vegetation = false;
	setTileColor(tile, idx);
    });
}

var grassEverywhere = function() {
    tiles.forEach(function(tile, idx) {
	if(!tile.desert) tile.vegetation = true;
	setTileColor(tile, idx);
    });
}

// setup canvas
var projection = d3.geo.orthographic()
    .scale(scale)
    .translate([canvasWidth / 2, canvasHeight / 2])

var canvas = d3.select("#main").append("canvas")
    .attr("width", canvasWidth)
    .attr("height", canvasHeight);

var context = canvas.node().getContext("2d");

context.strokeStyle = tileBorderColor;
context.lineWidth = tileBorderWidth;

// utils
var msElapsed = function() {
    return Date.now() - t0;
}

var timeOfDay = function() {
    return msElapsed() % dayLengthMs;
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

// choose rand int according to logarithmic distribution. E.g.,
// if min = 1, max = 10, base = 0.3, 30% chance to return 1,
// 70% * 30% chance to return 2, 70% * 70% * 30% chance to return 3, etc
// cut off at max (so max val may be returned more times than otherwise)

var randIntLogarithmic = function(min, max, base) {
    var retVal = min;

    while(retVal < max) {
	if(coinflip(base)) {
	    return retVal;
	} else {
	    retVal += 1;
	}
    }
    return max;
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
    spreadVegetation();
    moveVehicles();
    currentTimeOfDay = timeOfDay();

    projection.scale(scale);
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
    context.fillStyle = currentlyDarkNightTime() ? backgroundColorDark : backgroundColor;
    context.fillRect(0, 0, canvasWidth, canvasHeight);

    drawStars();
};

var drawStars = function() {
    var baseBrightness = currentlyDarkNightTime() ? 70 : 30;
    stars.forEach(function(star) {
	drawCircle([star.x, star.y],
		   star.size,
		   "rgba(245,245,250," + (randIntBetween(baseBrightness, baseBrightness + 30) * 0.01) + ")");
    });
};

var redrawTiles = function() {
    nightShadow = currentNightShadow();

    tiles.forEach(function(d) {
	for(var i in d) {
	    d.polygon[i] = projection(d[i]);
	}

	if (d.visible = d.polygon.area() > 0) {
	    drawTriangle(d.polygon, d.fill);
	    drawTriangle(d.polygon, nightShadow);
	}
    });
}

var redrawCities = function() {
    cities.forEach(function(c) {
	if(tiles[c.location].visible) {
	    drawCity(tiles[c.location].polygon, c.size, '#70708a');
	}
    });
}

var redrawVehicles = function() {
    vehicles.forEach(function(v) {
	tile = tiles[v.location];
	if(tile && tile.visible) {
	    drawVehicle(tiles[v.location].polygon, v);
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

var drawCity = function(triangle, size, color) {
    if(currentlyDarkNightTime()) {
	color = '#dbe8b2';
    }
    drawCircle(centerOfTriangle(triangle), size, color);
}

var drawVehicle = function(triangle, vehicle) {
    drawCircle(centerOfTriangle(triangle),
	       vehicle.size,
	       currentlyDarkNightTime() ? vehicle.nightColor : vehicle.color);
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

var currentNightShadow = function() {
    var shade;

    if(currentTimeOfDay >= 0 && currentTimeOfDay < nightStartTime) {
	shade = 0;

    } else if (currentTimeOfDay >= nightStartTime && currentTimeOfDay < (nightStartTime + 2000)) {
	shade = (currentTimeOfDay - nightStartTime) * 0.0004; // returns number between 0 and 0.5

    } else if(currentTimeOfDay >= (nightStartTime + 2000) && currentTimeOfDay < (dayLengthMs - 2000)) {
	shade = 0.8;

    } else if (currentTimeOfDay >= (dayLengthMs - 2000) && currentTimeOfDay <= dayLengthMs) {
	shade = (dayLengthMs - currentTimeOfDay) * 0.0004; // returns number between 0 and 0.5

    }

    return "rgba(0,0,0," + shade + ")"
}

var redraw = function() {
    drawBackground();
    redrawTiles();
    redrawCities();
    redrawVehicles();
    // redrawTileBorders();
}

var findTile = function(params) {
    var { minElevation, maxElevation, desertRequired } = params;

    var tile;

    for(var i = 0; i < 99; i++) {
	tile = randomTile(planetParams.vertexLength);
	idx = convertCoordsToIdx(tile, planetParams.vertexLength);
	elevation = elevations[idx];
	desert = !!deserts[idx];

	if(elevation >= minElevation
	   && elevation <= maxElevation
	   && ((desertRequired === undefined) || desert === desertRequired)) {
	    return [tile, idx];
	}
    }

    return false;
}

var willHillDescend = function(height) {
    // plateau probability = probability tile will have 1+ neighbour with same height

    if(height >= 9) { plateauProbability = 0; }
    else if(height >= 6) { plateauProbability = 0.1; }
    else if(height >= 4) { plateauProbability = 0.1; }
    else if(height === 2 || height === 3) {
	plateauProbability = Math.min(0.999, planetParams.grassSpreadProbability); }
    else if(height === 1) {
	plateauProbability = Math.min(0.999, planetParams.beachSpreadProbability); }
    else if(height <= 0) {
	plateauProbability = 0.7;
    }

    // if plateauProbability = 0, hillProbability = 1
    // if plateauProbability = 1, hillProbability = 0.67

    hillProbability = 1 - (plateauProbability / 3);

    return coinflip(hillProbability);
}

var recursivelySetPoleDistance = function(idx, distance) {
    if((poleDistances[idx] !== undefined && poleDistances[idx] <= distance) ||
      distance > 1 + planetParams.vertexLength * 5) { return; }

    poleDistances[idx] = distance;

    neighbours = neighboursOfIdx(idx, planetParams.vertexLength);

    neighbours.forEach(function(n) {
	recursivelySetPoleDistance(n, distance + 1);
    });
}

var setPoleDistances = function() {
    var northPoleIdx = convertCoordsToIdx(northPole(), planetParams.vertexLength);

    recursivelySetPoleDistance(northPoleIdx, 0);
}

// set height for elevationsArray[coords] to height, then recursively set neighbours
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

var addMountainRange = function(maxPeakHeight, elevations, vertexLength) {
    var tile = randomTile(vertexLength);
    if(!tile) return;

    var direction = randIntBetween(0, 2);
    var maxHeight = randIntLogarithmic(6, 15, 0.32);
    var rangeLength = randIntLogarithmic(1, 6, 0.24) * 12;
    var height = maxHeight;
    var minGap = Math.floor(maxHeight / 4);

    // repeat 10...15 times
    repeatNTimes(rangeLength, function() {
	height = Math.max(3, Math.min(maxHeight, height + randIntBetween(-2, 2)));

	// randomly decide to add peak
	if(coinflip(0.78)) {
	    tile = neighbourOfTileInDirection(
		tile,
		randIntBetween(0, 2),
		vertexLength);

	    addMountainAtTile(
		tile,
		height,
		elevations,
		vertexLength);
	}


	// get neighbour of tile in direction
	repeatNTimes(randIntLogarithmic(minGap, minGap * 6, 0.1), function() {
	    tile = neighbourOfTileInDirection(tile, direction, vertexLength);
	});
    });

}

var addPeninsula = function(elevations, vertexLength) {
    var tile = findTile({ minElevation: 2, maxElevation: 2});
    if(!tile) return;

    tile = tile[0];

    var direction = randIntBetween(0, 2);
    var peninsulaLength = randIntLogarithmic(1, 8, 0.4) * 6;

    // repeat 10...15 times
    repeatNTimes(peninsulaLength, function() {

	// randomly decide to add peak
	tile = neighbourOfTileInDirection(
	    tile,
	    randIntBetween(0, 2),
	    vertexLength);

	addMountainAtTile(
	    tile,
	    3,
	    elevations,
	    vertexLength);

	// get neighbour of tile in direction
	tile = neighbourOfTileInDirection(tile, direction, vertexLength);
    });

}

var addRandomMountain = function(maxPeakHeight, elevations, vertexLength) {
    height = randIntBetween(8, maxPeakHeight);
    var startingTile = randomTile(vertexLength);

    addMountainAtTile(startingTile, height, elevations, vertexLength);
}

var addMountainAtTile = function(startingTile, height, elevations, vertexLength) {
    recursivelySetHeight(startingTile, height, elevations, vertexLength);
}

var addSmallIsland = function(vertexLength, elevations) {
    height = randIntLogarithmic(2, 4, 0.5);
    var startingTile = randomTile(vertexLength);
    recursivelySetHeight(startingTile, height, elevations, vertexLength);
}

var addCity = function(vertexLength, cities) {
    var location = findTile(
	{ minElevation: 2, maxElevation: 5});

    if(!location) { return; }

    var size = randIntLogarithmic(1, 4, 0.76);

    if(deserts[location[1]] === true) { size = 1; }

    cities.push({ location: location[1], size: size });
}

var addDesert = function(deserts, vertexLength) {
    var tile = findTile({ minElevation: 5, maxElevation: 5});

    if(!tile) { return; }

    makeTileDesert(tile[1], randIntBetween(6, 24), deserts, vertexLength);
}

var makeTileDesert = function(tileIdx, size, deserts, vertexLength) {
    if(deserts[tileIdx]) return;

    deserts[tileIdx] = true;

    neighbours = neighboursOfIdx(tileIdx, vertexLength);
    
    neighbours.forEach(function(t) {
	if(size > 0) {
	    if(size > 4) { newSize = size - 1; }
	    else { newSize = (coinflip(0.65) ? size - 1 : size); }

	    makeTileDesert(t, newSize, deserts, vertexLength);
	}
    });
}

var addVehicle = function(vertexLength, vehicles) {
    var type, color, nightColor, location, tile;

    if(coinflip(0.5)) {
	type = 'boat';
	color = '#a04070';
	nightColor = '#f04080';
	size = 1.5;
	tile = findTile({ minElevation: -10, maxElevation: 0});

	if(!tile) return;
	else location = tile[1];

    } else {
	type = 'plane';
	color = '#6090b0';
	nightColor = '#a0c0f0';
	size = 1;
	location = randomTileIdx(vertexLength);

    }

    vehicles.push({ location: location,
		    size: size,
		    type: type,
		    color: color,
		    nightColor: nightColor,
		    direction: randIntBetween(0, 2) });
}

var moveVehicles = function() {
    vertexLength = planetParams.vertexLength;
    var newTile, newTileIsWater;

    vehicles.forEach(function(vehicle) {
	neighbours = neighboursOfIdx(vehicle.location, vertexLength);
	newLocation = neighbours[vehicle.direction];

	if(vehicle.type == 'boat') {
	    newTile = tiles[newLocation];
	    newTileIsWater = newTile && newTile.elevation <= 0;

	    if(!newTileIsWater) {
		vehicle.direction = randIntBetween(0, 2);
		return;
	    }
	}

	if(vehicle.prevLocation !== newLocation || coinflip(0.1)){
	    // note: vehicles normally avoid reversing, but 10% of the time will reverse (to avoid getting stuck)

	    vehicle.prevLocation = vehicle.location;
	    vehicle.location = newLocation;

	} else {
	    vehicle.direction = randIntBetween(0, 2);
	}
    });
}

var spreadVegetation = function() {
    tiles.forEach(function(face, idx) {
	if(face.vegetation && coinflip(0.25) ||
	    face.elevation === 0 && coinflip(0.001)) {

	    neighbours = neighboursOfIdx(idx, planetParams.vertexLength);
	    tileIdx = neighbours[randInt(2)];
	    tile = tiles[tileIdx];

	    if(tile.vegetation === false &&
	       tile.desert === false &&
	       tile.elevation >= 1 &&
	       tile.elevation <= 5) {

		tile.vegetation = true;
		setTileColor(tile, tileIdx);
	    }
	}
    });
}

var clearCities = function() {
    cities = [];
}

var generateCities = function(numCities) {
    repeatNTimes(numCities, function() { addCity(planetParams.vertexLength, cities); });
}

var clearVehicles = function() {
    vehicles = [];
}

var generateVehicles = function(numVehicles) {
    repeatNTimes(numVehicles, function() { addVehicle(planetParams.vertexLength, vehicles); });
}

var clearStars = function() {
    stars = [];
}

var generateStars = function(numStars) {
    repeatNTimes(numStars, function() { stars.push({
	x: randIntBetween(0, canvasWidth),
	y: randIntBetween(0, canvasHeight),
	size: randIntBetween(1, 5) * 0.25
    })});
}

var createGeodesicPlanet = function(planetParams) {
    var { vertexLength, numPeaks, maxPeakHeight, numSmallIslands, numCities, numVehicles } = planetParams;

    elevations = [], deserts = [], cities = [], vehicles = [], poleDistances = [];

    addRandomMountain(10, elevations, vertexLength);

    repeatNTimes(35, function() { addSmallIsland(vertexLength, elevations); });

    // add mountains to polygons
    repeatNTimes(12, function() { addMountainRange(maxPeakHeight, elevations, vertexLength); });

    repeatNTimes(54, function() { addPeninsula(elevations, vertexLength); });

    repeatNTimes(16, function() { addDesert(deserts, vertexLength); });


    clearCities();
    generateCities(numCities);

    clearVehicles();
    generateVehicles(numVehicles);

    clearStars();
    generateStars(888);

    setPoleDistances();

    // set polygons for use in redraw function
    tiles = d3.geodesic.polygons(vertexLength).map(function(d, i) {
	return d;
    }).map(function(d, i) {
	d = d.coordinates;
	elevation = elevations[i];
	desert = deserts[i];

	d.polygon = d3.geom.polygon(d.map(projection));
	d.elevation = elevation !== undefined ? elevation : -5;
	d.desert = desert !== undefined ? desert : false;
	d.poleDistance = poleDistances[i] || 1000;

	if(!d.desert) d.vegetation = true;
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

var northPole = function() {
    return [0, planetParams.vertexLength - 1, planetParams.vertexLength];
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
    return [(el - 4)*38, (el-4)*38, (el-4)*38 + randInt(10)];
}

var makeRgbString = function(rgbArray) {
    return "rgb("+rgbArray[0]+","+rgbArray[1]+","+rgbArray[2]+")";
}

var setTileColor = function(tile, idx) {
    tile.fill = elevationToColor(tile.elevation, tile.vegetation, idx);
};

var currentlyNightTime = function() {
    return currentTimeOfDay >= nightStartTime && currentTimeOfDay <= dayLengthMs;
}

var currentlyDarkNightTime = function() {
    return currentTimeOfDay >= (nightStartTime + 1000) && currentTimeOfDay <= (dayLengthMs - 1000);
}

var elevationToColor = function(el, hasVegetation, idx) {
    coords = convertIdxToCoords(idx, planetParams.vertexLength);
    var dist = poleDistances[idx];

    if(dist < 20) { rgb = iceCapColor(); } // isIceCap(coords)) { rgb = iceCapColor(); }
    else if(el === undefined || el <= 0) { rgb = seaColor(); }
    else if(el === 1) { rgb = beachColor(); }
    else if(el >= 2 && el <= 5) { rgb = hasVegetation ? vegetationColor(el) : dirtColor(el); }
    else if(el >= 6) { rgb = mountainColor(el); }

    return makeRgbString(rgb);

    return makeRgbString([dist, dist, dist]);
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
    planetParams.vertexLength = promptForInt("Enter new planet size (1-50).", 35, 1, 50);
    planetParams.numPeaks = promptForInt("Enter number peaks (0-200).", 15, 0, 200);
    planetParams.maxPeakHeight = promptForInt("Enter max peak height (1-15).", 9, 1, 15);
    planetParams.numSmallIslands = promptForInt("Enter number small islands (0-200).", 50, 0, 200);
    planetParams.grassSpreadProbability = promptForInt("Enter grassland spread probability (0-100) (higher number means larger grasslands).", 68, 0, 100) / 100;
    planetParams.beachSpreadProbability = promptForInt("Enter beach spread probability (0-100) (higher number means larger beaches).", 30, 0, 100) / 100;

    planetParams.numCities = promptForInt("Enter number cities (0-4000).", 100, 0, 4000);
    planetParams.numVehicles = promptForInt("Enter number vehicles (0-1000).", 20, 0, 1000);

    createGeodesicPlanet(planetParams);
    logPlanetSize(planetParams.vertexLength);

    return false;
}

document.addEventListener('keydown', handleKeyDown);
createGeodesicPlanet(planetParams);
d3.timer(tick);

var faces, terrainRnd, cratonSize, rowCol, rowSize, craton, row, col, foldedCol, split, coords, neigbours, n1, n2, n3, iceCapConst;

var width = 1000,
height = 1000;

var velocity = [.01, .0],
t0 = Date.now();

var projection = d3.geo.orthographic()
    .scale(height / 2 - 10)
    .translate([width / 2, height / 2])

var canvas = d3.select("body").append("canvas")
    .attr("width", width)
    .attr("height", height);

var context = canvas.node().getContext("2d");

context.strokeStyle = "#000";
context.lineWidth = .2;

d3.timer(function() {
    var time = Date.now() - t0;
    projection.rotate([180 + time * velocity[0], time * velocity[1]]);
    redraw();
});

function redraw() {
    context.clearRect(0, 0, width, height);
    context.fillStyle = "#0e0e0e";
    context.fillRect(0, 0, width, height);


    faces.forEach(function(d) {
	for(var i in d) {
	    d.polygon[i] = projection(d[i]);
	}

	if (d.visible = d.polygon.area() > 0) {
	    context.fillStyle = d.fill;
	    context.beginPath();
	    drawTriangle(d.polygon);
	    context.fill();
	}
    });

    context.beginPath();
    faces.forEach(function(d) {
	if (d.visible) {
	    drawTriangle(d.polygon);
	}
    });

    context.stroke();
}

function drawTriangle(triangle) {
    context.moveTo(triangle[0][0], triangle[0][1]);

    for(var i in triangle) {
	if(i > 0) context.lineTo(triangle[i][0], triangle[i][1]);
    }

    context.closePath();
}


function setHeight(eArr, coords, height, hill, subD) {

    var i = coordsToI(coords, subD);
    if(i === false) return;

    if(eArr[i] > height) { 
	return;
    } else {
	eArr[i] = height;
	if(height > 1) {
	    neighboursOfCoords(coords, subD).forEach(function(n) {
		if(Math.random() < hill) {
		    setHeight(eArr, n, height, hill, subD);
		} else {
		    setHeight(eArr, n, height-1, hill+0.022, subD);
		}
	    });
	}
    }
}


function geodesic(subdivision) {
    planetSize(subdivision);

    iceCapConst = randInt(Math.floor(subdivision * 0.75));
    var mountainConst = randInt(300) + 100;

    var bigTriangle = subdivision * subdivision;
    var peaks = Math.floor(bigTriangle / mountainConst) * 20;
    elevations = [];

    // add mountains to polygons
    for(var i = 0; i < subdivision * 1.5; i++) {
	row = randInt(subdivision-1);
	var height = 2+randInt(10);
	hill = height > 3 ? Math.random() * 0.1 : Math.random() * 0.3;
	setHeight(elevations, 
		  randomTile(subdivision),
		  height,
		  hill,
		  subdivision);
    }

    // set polygons for use in redraw function
    faces = d3.geodesic.polygons(subdivision).map(function(d,i) {
	el = elevations[i];
	d.terrain = elevationToColor(el, i, subdivision);
	return d;

    }).map(function(d,i) {
	terrain = d.terrain;

	d = d.coordinates;
	d.polygon = d3.geom.polygon(d.map(projection));

	d.fill = terrain;
	return d;
    });

    redraw();
}

function elevationToColor(el,i,subD) {
    var el, r, g, b;
    var c = iToCoords(i,subD);
    var iceCap = (iceCapConst+randInt(3)+randInt(3)+randInt(3));

    if((c[0] < 5 || c[0] > 14) && c[1] < iceCap) { r=220, g=220, b=240; }
    else if(el === undefined || el === 0) { r=0, g=30, b=150+randInt(15); }
    else if(el === 1) { r=210+randInt(15), g=220, b=150; }
    else if(el >= 2 && el <= 5) { r=0, g= randInt(15) +290 - (50*el), b=50; }
    else if(el >= 6) { r=el*30, g=el*30, b=el*30+randInt(15); }

    return "rgb("+r+","+g+","+b+")";
}

function planetSize(subdivision) {
    var tiles = subdivision * subdivision * 20;
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

function reload() {
    var inp = window.prompt("Enter new planet size (1-50).","25");
    var size = parseInt(inp);

    if(size > 50)
	size = 50;
    else if(size < 1)
	size = 1;

    geodesic(size);

    return false;
}

geodesic(25);

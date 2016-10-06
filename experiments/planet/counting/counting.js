
var width = 1000,
height = 500;

var velocity = .003,
t0 = Date.now();

var projection = d3.geo.orthographic()
    .scale(height / 2 - 10);

var canvas = d3.select("body").append("canvas")
    .attr("width", width)
    .attr("height", height);

var context = canvas.node().getContext("2d");

context.strokeStyle = "#000";
context.lineWidth = .5;

var faces;

var terrainRnd;
var TERRAIN = {
    ocean:  "#228",
    mountain10: "#aaa",
    mountain9: "#999",
    mountain8: "#888",
    mountain7: "#777",
    mountain6: "#666",
}

d3.timer(function() {
    var time = Date.now() - t0;
    projection.rotate([time*velocity, 0]);
    redraw();
});

function redraw() {
    context.clearRect(0, 0, width, height);
    context.fillStyle = "#080008";
    context.fillRect(0, 0, width, height);

    faces.forEach(function(d) {
	d.polygon[0] = projection(d[0]);
	d.polygon[1] = projection(d[1]);
	d.polygon[2] = projection(d[2]);
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
  context.lineTo(triangle[1][0], triangle[1][1]);
  context.lineTo(triangle[2][0], triangle[2][1]);
  context.closePath();
}

// returns an array of arrays.
// ret[i] = [a,b,c] < a,b,c are the indices of the 3 
// neighbours of the i'th triangle

function topology(subdivision) {

}



/*
0: 0,0
1: 1,0
2: 1,1
3: 1,2
4: 2,0
5: 2,1
6: 2,2
7: 2,3
8: 2,4
9: 3,0

Fold over row:
Right now:

0:0
1:021
2:03142
3:0415263
3:0123456
4:051627384
5:061728394X5



1 = x-row
3 = (x-row)+1
5 = (x-row)+3
7 = (x-row)+3

(x-row)

4      :051627384
(x-row):-1-2-3-4-
-1     :-0-1-2-3-
*2     :-0-2-4-6-
+1     :-1-3-5-6-

3   :0415263
-row:-1-2-3-
-1  :-0-1-2-
*2  :-0-2-4-
+1  :-1-2-3-

2      :03142
(x-row):-1-2-
-1     :-0-1-
*2     :-0-2-
+1     :-1-3-
*/

var cratonSize, rowCol, rowSize, craton, row, col, foldedCol, split;

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

var coords, i;
function coordsToI(coords, subdivision) {
    // need check that coords are valid
    craton = coords[0];
    row = coords[1];
    foldedCol = coords[2];

    if(foldedCol % 2 == 0) { col = foldedCol / 2; } 
    else { col = (((foldedCol - 1) / 2) + 1) + row; }

    if(col > rowLength(row) - 1) { return false; }
    else { return (craton * subdivision * subdivision) + (row * row) + col; }
}

function rowLength(row) {
    return (2*row) + 1;
}

var neigbours, n1, n2, n3;
function neighboursOfCoords(coords, subdivision) {
    craton = coords[0], row = coords[1], col = coords[2];
    neighbours = [];

    if(col > 0) {
	// add n1
	neighbours.push([craton, row, col-1]);
    }

    if(col < rowLength(row) - 1) {
	// add n2
	neighbours.push([craton, row, col+1]);
    }
    
    // add n3
    if(col % 2 == 0) {
	if(row < subdivision - 1) {
	    neighbours.push([craton, row+1, col+1]);
	}
    } else {
	if(row > 0) {
	    neighbours.push([craton, row-1, col-1]);
	}
    }

    return neighbours;
}

function setHeight(eArr, coords, height, subD) {
    var i = coordsToI(coords, subD);

    if(!i) return;

    if(eArr[i] > height) { 
	return;
    } else {
	eArr[i] = height;
	if(height > 1) {
	    neighboursOfCoords(coords, subD).forEach(function(n,ni) {
		if(ni !== 0) return;
		var hill = 0;

		if(Math.random() < hill) {
		    setHeight(eArr, n, height, subD);
		} else {
		    setHeight(eArr, n, height-1, subD);
		}
	    });
	}
    }
}

function geodesic(subdivision) {
    planetSize(subdivision);

    var bigTriangle = subdivision * subdivision;
    var peaks = Math.floor(bigTriangle / 300) * 20;
    elevations = [];

    // add mountains to polygons
    for(var i = 0; i <= 10; i++) {
	setHeight(elevations, 
		  [i,
		   15,
		   15
		  ], 
		  i, 
		  subdivision);
    }

    for(var i = 11; i <= 19; i++) {
	setHeight(elevations, 
		  [i,
		   17,
		   15
		  ], 
		  1, 
		  subdivision);

	setHeight(elevations, 
		  [i,
		   15,
		   15
		  ], 
		  i-10, 
		  subdivision);
    }


    var el, r, g, b;

    // set polygons for use in redraw function
    faces = d3.geodesic.polygons(subdivision).map(function(d,i) {
	el = elevations[i];
	var c = iToCoords(i,subdivision);

	if(el === undefined || el === 0) { r=0, g=30, b=(150+((c[0] % 3) * 15)); }
	else if(el === 1) { r=220, g=220, b=150; }
	else if(el >= 2 && el <= 5) { r=0, g= 300 - (50*el), b=50; }
	else if(el >= 6) { r=el*30, g=el*30, b=el*32; }

	if(c[1] == subdivision - 1 && c[2] % 2 == 0) d.terrain = "rgb(80,0,0)";
	else if(c[2] == 0) d.terrain = "rgb(0,80,0)";
	else if(c[2] == c[1] * 2) d.terrain = "rgb(0,0,40)";
	else d.terrain = "rgb("+r+","+g+","+b+")";
	return d;

    }).map(function(d,i) {
	terrain = d.terrain;
	d = d.coordinates[0];
	d.pop(); // use an open polygon

	d.polygon = d3.geom.polygon(d.map(projection));
	d.fill = terrain;
	d.i = i;

	return d;
    });

    redraw();
}

geodesic(20);


function randInt(max) {
    return Math.floor(Math.random() * (max+1));
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

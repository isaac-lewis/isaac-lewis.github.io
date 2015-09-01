var drawLine = function(ctx, line) {
    if(i < line.start_i) {
	return;
    }

    ctx.beginPath();
    ctx.moveTo(line.x1, line.y1);

    if(i > line.end_i) {
	ctx.lineTo(line.x2, line.y2);
    } else {
	var i_pct = (i - line.start_i) / (line.end_i - line.start_i);
	x2 = line.x1 + ((line.x2 - line.x1) * i_pct);
	y2 = line.y1 + ((line.y2 - line.y1) * i_pct);
	ctx.lineTo(x2, y2);
    }

    ctx.strokeStyle = line.colour;
    ctx.lineWidth = line.thickness;
    ctx.stroke();
}

var genTree = function(width, height) {
    var addLine = function(thickness, start_i, angle, start_x, start_y, length, pwhite) {
	var angle = angle % 360;
	if(angle < 0) {
	    angle = 360 + angle;
	}

	if(angle >= 45 && angle <= 135) {
	    var end_x = start_x + length;
	} else if(angle >= 225 && angle <= 315) {
	    var end_x = start_x - length;
	} else {
	    var end_x = start_x;
	}

	if(angle >= 135 && angle <= 225) {
	    var end_y = start_y + length;
	} else if(angle <= 45 || angle >= 315) {
	    var end_y = start_y - length;
	} else {
	    var end_y = start_y;
	}

	if(pwhite) {
	    var white = true
	} else {
	    var white = Math.random() < 0.15;
	}

	// var colour = white ? "#eaf0f0" : "#5ff2e2";
	// var colour = white ? "#cad0d0" : "#3fd2c2";
	var colour = "rgba(220,220,220,0.5)";

	line = {x1: start_x, y1: start_y, x2: end_x, y2: end_y, start_i: start_i, end_i: start_i + speed, thickness: thickness, colour: colour};

	lines.push(line);

	if(thickness > 0) {
	    addLine(thickness - 0.5, start_i + 25, angle - 45, end_x, end_y, length * 0.85, white);
	    addLine(thickness - 0.5, start_i + 25, angle + 45, end_x, end_y, length * 0.85, white);
	}
    }

    var size = 80;
    var speed = 25;

    var center_x = width/2;
    var center_y = height/2;
    var line, end_x, end_y;

    var line0 = {x1: center_x * 0.4, y1: 0, x2: center_x * 0.4, y2: size * 2, start_i: 0, end_i: speed * 2, colour: "rgba(220,220,220,0.5)", thickness: 5};
    var lines = [line0];

    addLine(6, speed * 2, 180, center_x * 0.4, size * 2, size, false);



    return lines;
}

function draw(width,height) {
    var canvas = document.getElementById('canvas');
    canvas.width = width;
    canvas.height = height;
    
    var ctx = canvas.getContext( '2d' );

    ctx.fillStyle = "#fff"; // "#3c4352";
    ctx.fillRect (0, 0, width, height);

    for(var l in lines) {
	drawLine(ctx, lines[l]);
    }
}

var i = 0

var mousedover = false;
var canvas = document.getElementById('canvas');
var box = document.getElementById("fractal-box");
var lines = genTree(box.offsetWidth, box.offsetWidth * 0.667);

var timeout;


var go = function() {
    draw(box.offsetWidth, box.offsetWidth * 0.667);

    document.body.style.background = "url(" + canvas.toDataURL() + ") fixed no-repeat";

    i += 1;

    timeout = setTimeout(function() {go();}, 15);
}


var scroll = function() {
    i = Math.floor(document.body.scrollTop / 6);
    console.log('scroll',i);
    draw(box.offsetWidth, box.offsetWidth * 0.667);
    document.body.style.background = "url(" + canvas.toDataURL() + ") fixed no-repeat";
}

window.onload = scroll;
document.onscroll = scroll;

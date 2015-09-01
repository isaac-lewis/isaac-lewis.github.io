function Mandeliter( cx, cy, maxiter ){
  var
    x = 0.0,
    y = 0.0,
    xx = 0,
    yy = 0,
    xy = 0;
 
  var i = maxiter;
  while( i-- && xx + yy <= 4 ){
    xy = x * y;
    xx = x * x;
    yy = y * y;
    x = xx - yy + cx;
    y = xy + xy + cy;
  }
  return maxiter - i;
}
 
function Mandelbrot( width,height, xmin,xmax, ymin,ymax, iterations ){
  var canvas = document.getElementById('canvas');
  canvas.width = width;
  canvas.height = height;
 
  var ctx = canvas.getContext( '2d' );
  var img = ctx.getImageData( 0, 0, width, height );
  var pix = img.data;
  for( var ix = 0; ix < width; ++ix )
    for( var iy = 0; iy < height; ++iy )
    {
      var x = xmin + (xmax - xmin) * ix / (width - 1);
      var y = ymin + (ymax - ymin) * iy / (height - 1);
      var i = Mandeliter( x, y, iterations );
      var ppos = 4 * (width * iy + ix);
      var diff;

      if( i === iterations )
      {
        pix[ppos] = 46;
        pix[ppos+1] = 46;
        pix[ppos+2] = 46;
      }
      else
      {
        var c = 3 * Math.log(i)/Math.log(iterations - 1.0);
        if (c < 1)
        {
          pix[ppos] = 46;
          pix[ppos+1] = 46;
          pix[ppos+2] = 46;
        }
        else if( c < 2 )
        {
	  diff = 30 * (c-1);
	  if(mousedover && c > 1.72) diff += 8;
          pix[ppos] = 46+diff;
          pix[ppos+1] = 46+diff;
          pix[ppos+2] = 46+diff;
        }
        else
        {
	  diff = 50 * (c-2);
	  if(mousedover) diff += 35;
          pix[ppos] = 81+diff;
          pix[ppos+1] = 81+diff;
          pix[ppos+2] = 81+diff;
        }
      }
      pix[ ppos+3 ] = 255;
    }
  ctx.putImageData( img, 0,0 );
  document.body.insertBefore( canvas, document.body.childNodes[0] );
}
 

var target_x = -0.551287;
var target_y = -0.647971;

var xd1 = -0.7 - target_x;
var xd2 = -0.5 - target_x;

var yd1 = -0.7 - target_y;
var yd2 = -0.5667 - target_y;

var i = 157;

var mousedover = false;

var canvas = document.getElementById('canvas');
var box = document.getElementById("fractal-box");

var timeout;

box.addEventListener("mouseenter", function() {
    mousedover = true;
    clearTimeout(timeout);
    go();
});

box.addEventListener("mouseleave", function() {
    mousedover = false;
    clearTimeout(timeout);
    go();
});

box.addEventListener("click", function() {
    i += 5;
});



var go = function() {
    if(mousedover) {
	i = i + 5;
    } else {
	if(i > 1) {
	    i = i - 1;
	}
    }

    var w = Math.pow(0.99,i);
    var iter = 300 + i*2;

    Mandelbrot(box.offsetWidth, box.offsetWidth * 0.667, target_x + (xd1*w), target_x + (xd2*w), target_y + (yd1*w), target_y + (yd2*w), iter);

    box.style.background = "url(" + canvas.toDataURL() + ")";

    timeout = setTimeout(function() {go();}, 1000);
}

go();

// dark blue gray = 46, 51, 65 (#2e3341)
// bright turqouise = 77, 242, 220 (#4df2dc)

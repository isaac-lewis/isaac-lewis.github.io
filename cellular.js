var openPortfolio = function() {
    document.getElementById('about-box').style.display = 'none';
    document.getElementById('portfolio-box').style.display = 'block';
}

var closePortfolio = function() {
    document.getElementById('portfolio-box').style.display = 'none';
    document.getElementById('about-box').style.display = 'block';
}

var showRecent = function() {
    document.getElementById('old-projects').style.display = 'none';
    document.getElementById('recent-projects').style.display = 'block';
}

var showOld = function() {
    document.getElementById('recent-projects').style.display = 'none';
    document.getElementById('old-projects').style.display = 'block';
}

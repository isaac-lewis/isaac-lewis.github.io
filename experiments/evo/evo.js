import { Organism, Plant, Herbivore, Carnivore } from './organisms.js';
import { OrganismManager } from './organism-manager.js';
import { sunlightFactor } from './utils.js';

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

const organismManager = new OrganismManager();
Organism.manager = organismManager;
Plant.manager = organismManager;
window.organismManager = organismManager;

// UI and system logic
function drawEnvironment() {
    let sf = sunlightFactor() * 0.25;
    let r = 3 + 10 * sf;
    let g = 2 + 38 * sf;
    let b = 18 + 78 * sf;
    
    ctx.fillStyle = `rgba(${r}, ${g}, ${b}, 1)`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function drawOrganism(organism) {
    if(organism.size <= 0) return;
    ctx.beginPath();
    ctx.arc(organism.x, organism.y, 3 * Math.sqrt(organism.size), 0, Math.PI * 2, true);
    ctx.fillStyle = `rgb(${organism.interiorColor[0]}, ${organism.interiorColor[1]}, ${organism.interiorColor[2]})`;
    ctx.fill();
    ctx.lineWidth = 6;
    ctx.strokeStyle = `rgb(${organism.color[0]}, ${organism.color[1]}, ${organism.color[2]})`;
    ctx.stroke();

    if(organism.target) {
        // Draw a line from this organism to its target
        ctx.beginPath();
        ctx.moveTo(organism.x, organism.y);
        ctx.lineTo(organism.target.x, organism.target.y);
        ctx.lineWidth = 2;
        ctx.strokeStyle = "white";
        ctx.stroke();
    }
}

function update() {
    drawEnvironment();

    organismManager.updateAll();

    organismManager.getAll().forEach(organism => {
        drawOrganism(organism);
    });

    requestAnimationFrame(update);
}

// Adding event listeners to buttons
document.getElementById("addPlant").addEventListener('click', function() {
    organismManager.addPlant();
});

document.getElementById("addHerbivore").addEventListener('click', function() {
    organismManager.addHerbivore();
});

document.getElementById("addCarnivore").addEventListener('click', function() {
    organismManager.addCarnivore();
});

document.getElementById("killAll").addEventListener('click', function() {
    organismManager.killAll();
});

update();

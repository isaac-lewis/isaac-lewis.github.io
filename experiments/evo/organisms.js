import { logNormalScalingFactor, mutateColorValue, randomSelect } from './utils.js';

export class Organism {
    static manager;

    constructor(properties) {
        Object.assign(this, properties);

        this.speed = Math.max(0.1, properties.speed);
        this.direction = Math.random() * Math.PI * 2;
        this.curveRadius = 40; // Adjust this value as desired
    }

    move() {
        if(this.x === NaN || this.y === NaN) {console.log(this);}
        switch (this.movementPattern) {
            case 'linear':
                this.moveLinear();
                break;
            case 'random':
                this.moveRandom();
                break;
            case 'wiggle':
                this.moveWiggle();
                break;
            case 'chase':
                this.moveChase();
            // Add more cases for different movement patterns
            default:
                this.moveLinear();
                break;
        }
    }

    moveLinear() {
        let nextX = this.x + this.speed * Math.cos(this.direction);
        let nextY = this.y + this.speed * Math.sin(this.direction);

        if (nextX < 0 || nextX > canvas.width) {
            this.direction = Math.PI - this.direction;
        }

        if (nextY < 0 || nextY > canvas.height) {
            this.direction = 2 * Math.PI - this.direction;
        }

        this.x += this.speed * Math.cos(this.direction);
        this.y += this.speed * Math.sin(this.direction);
    }

    moveRandom() {
        const angleChange = (Math.random() - 0.5) * Math.PI / 4;
        this.direction += angleChange;

        let nextX = this.x + this.speed * Math.cos(this.direction);
        let nextY = this.y + this.speed * Math.sin(this.direction);

        if (nextX < 0 || nextX > canvas.width || nextY < 0 || nextY > canvas.height) {
            this.direction += Math.PI; // Reverse direction if about to cross the canvas boundary
        }

        this.x += this.speed * Math.cos(this.direction);
        this.y += this.speed * Math.sin(this.direction);
    }

    moveWiggle() {
        const angleChange = (Math.random() - 0.5) * this.wiggleRadius * (Math.PI / 4);
        this.direction += angleChange;

        let nextX = this.x + this.speed * Math.cos(this.direction) + Math.random() * this.wiggleAmplitude - this.wiggleAmplitude / 2;
        let nextY = this.y + this.speed * Math.sin(this.direction) + Math.random() * this.wiggleAmplitude - this.wiggleAmplitude / 2;

        if (nextX < 0 || nextX > canvas.width || nextY < 0 || nextY > canvas.height) {
            this.direction += Math.PI; // Reverse direction if about to cross the canvas boundary
        }

        this.x += this.speed * Math.cos(this.direction) + Math.random() * this.wiggleAmplitude - this.wiggleAmplitude / 2;
        this.y += this.speed * Math.sin(this.direction) + Math.random() * this.wiggleAmplitude - this.wiggleAmplitude / 2;
    }

    moveChase() {
        if(this instanceof Plant) {
            this.moveRandom();
            return;
        }

        if(this.target && this.target.dead) {
            this.target = null;
        }

        if(this.hunter) {
            this.direction = this.directionOf(this.x, this.y, this.hunter.x, this.hunter.y) + Math.PI;
            this.moveLinear();
            return;
        }

        if(!this.target) {
            const neighbours = this.constructor.manager.getEdibleNearbyOrganisms(this, {orderByNearest: true});

            if(neighbours.length > 0) {
                this.target = randomSelect(neighbours);
                this.target.hunter = this;
            }
        }

        if(this.target) {
            this.direction = this.directionOf(this.x, this.y, this.target.x, this.target.y);
            this.moveLinear();
        } else {
            this.moveRandom();
        }
    }

    directionOf(x1, y1, x2, y2) {
        return Math.atan2(y2 - y1, x2 - x1);
    }

    die() {
        this.dead = true;
        this.constructor.manager.remove(this);
    }

    eat(edibleNeighbours) {
        edibleNeighbours.forEach(organism => {
            let blood;

            if(this.size > 5 * organism.size) {
                blood = organism.size;
            } else if (this.size > 2 * organism.size) {
                blood = organism.size * 0.4;
            } else if (this.size > 0.5 * organism.size) {
                blood = organism.size * 0.2;
            } else {
                blood = this.size / 2;
            }

            blood *= 0.1;

            if(this instanceof Herbivore) blood *= 0.6;

            this.size += 0.95 * blood;
            organism.size -= blood;
            if(organism.size <= 3) organism.die();
        });
    }

    reproduce() {
        if (this.size > this.maximumSize) { // Arbitrary reproduction threshold
            if(this.constructor.manager.reproduce(this)) this.size /= 2; // The parent loses size
        }        
    }

    mutate() {
        // Randomly alter traits
        if(Math.random() < this.mutationRate) { // 10% chance to mutate each trait
            this.speed *= logNormalScalingFactor(1.5);
            this.wiggleAmplitude *= logNormalScalingFactor(1.5);
            this.wiggleRadius *= logNormalScalingFactor(1.5);
            this.maximumSize *= logNormalScalingFactor(1.24);
            this.mutationRate *= logNormalScalingFactor(2);
            if(Math.random() < 0.24) {
                this.movementPattern = randomSelect(['wiggle', 'random', 'chase']);
            }

            // Mutate each color component
            let newR = mutateColorValue(this.color[0]);
            let newG = mutateColorValue(this.color[1]);
            let newB = mutateColorValue(this.color[2]);
            // Mutate each color component again
            let newIR = mutateColorValue(newR);
            let newIG = mutateColorValue(newG);
            let newIB = mutateColorValue(newB);

            this.color = [newR, newG, newB];
            this.interiorColor = [newIR, newIG, newIB];
        }
    }
}


export class Plant extends Organism {
    static manager;

    static growthRate(sunlight) {
        const plantCount = this.manager.getPlants().length;

        // Exponential decay parameters
        const maxGrowth = 0.112; // maximum growth rate
        const minGrowth = 0.04;  // minimum growth rate
        const decayRate = 0.0015; // rate of decay, adjust this for different speeds of decrease

        let decayedGrowthRate = minGrowth + (maxGrowth - minGrowth) * Math.exp(-decayRate * plantCount);

        // Assuming sunlight varies from 0 to 1 over the course of a day, where 1 is the highest sunlight intensity.
        let sunlightFactor = Math.max(0.01, sunlight);

        return decayedGrowthRate * sunlightFactor;
    }

    // Define plant-specific methods
    move() {
        super.move();
    }

    eat(plantBiomass, sunlightFactor, neighbourCount) {
        if(plantBiomass > 50_000 || neighbourCount > 20) {
            // this.size -= 0.01;
        } else {
            let growth = 0.3;
            if(plantBiomass > 30_000) growth *= 1 - ((plantBiomass - 30_000) / 20_000);
            growth *= sunlightFactor;
            growth /= Math.sqrt(neighbourCount);

            this.size += growth;
        }

        if(this.size < 3) this.die();
    }
}

export class Herbivore extends Organism {


    move() {
        if(this.size > 60) this.size *= 0.986;
        else this.size -= 0.038 + (0.012 * Math.log10(this.speed + 1)) + (0.006 * this.wiggleAmplitude);

        if(this.size <= 3) {
            this.die();
        }
        super.move();
    }
}

export class Carnivore extends Organism {


    move() {
        if(this.size > 60) this.size *= 0.986;
        else this.size -= 0.062 + (0.024 * Math.log10(this.speed + 1)) + (0.004 * this.wiggleAmplitude);

        if(this.size <= 3) {
            this.die();
        }
        super.move();
    }
}
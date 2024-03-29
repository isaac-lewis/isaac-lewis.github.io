import { Organism, Plant, Herbivore, Carnivore } from './organisms.js';
import { OrganismManager } from './organism-manager.js';
import { randomSelect } from './utils.js';

export class OrganismBuilder {
    generateProperties() {
        return {
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            size: Math.random() * 10 + 5,
            speed: Math.random() * 2.5,
            movementPattern: randomSelect(['wiggle', 'random', 'chase']),
            wiggleAmplitude: Math.random() * 10,
            wiggleRadius: Math.random() * 2,
            maximumSize: Math.random() * 60 + 20,
            mutationRate: Math.random() * 0.5
        }
    }

    newRandomOrganism(oldProperties) {
        let properties = oldProperties || this.generateProperties();

        let roll = Math.random();
        if (roll < 0.7) {
            return this.newPlant(properties);
        } else if (roll < 0.94) {
            return this.newHerbivore(properties);
        } else {
            return this.newCarnivore(properties);
        }
    }

    newPlant(oldProperties) {
        let properties = oldProperties || this.generateProperties();
        properties.speed *= 0.38;
        properties.color = [19, 99, 1];
        properties.interiorColor = [49, 129, 31];
        return new Plant(properties);
    }

    newHerbivore(oldProperties) {
        let properties = oldProperties || this.generateProperties();
        properties.color = [99, 41, 136];
        properties.interiorColor = [129, 61, 166];
        return new Herbivore(properties);
    }

    newCarnivore(oldProperties) {
        let properties = oldProperties || this.generateProperties();
        properties.color = [179, 58, 11];
        properties.interiorColor = [120, 40, 10];
        return new Carnivore(properties);
    }
}


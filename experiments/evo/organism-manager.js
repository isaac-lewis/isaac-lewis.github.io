import { MapGrid } from './map-grid.js';
import { Organism, Plant, Herbivore, Carnivore } from './organisms.js';
import { OrganismBuilder } from './organism-builder.js';
import { coinFlip, sunlightFactor, forceIntoRange } from './utils.js';

export class OrganismManager {
    constructor() {
        this.organisms = [];
        this.organismBuilder = new OrganismBuilder();
        this.mapGrid = new MapGrid(50, canvas.width, canvas.height);
    }

    add(organism) {
        this.organisms.push(organism);
        this.mapGrid.addToCell(organism);
    }

    size() {
        return this.organisms.length;
    }

    remove(organism) {
        this.mapGrid.removeFromCell(organism);
        const index = this.organisms.indexOf(organism);
        if (index > -1) {
            this.organisms.splice(index, 1);
        }
    }

    reproduce(organism) {
        // console.log('repoducing', this.size());
        if(organism instanceof Plant && this.size() > 400 && Math.random() > (1 / Math.pow(this.size() - 400, 0.78))) {
           return false;
        }

        let properties = { ...organism, size: organism.size / 2 - (Math.random() * 2), target: null };

        let offspring, offspringType;
        if(organism instanceof Plant) {
            offspringType = coinFlip("p", "h", 0.988);
        } else if (organism instanceof Herbivore) {
            offspringType = coinFlip("h", "c", 0.988);
        } else {
            offspringType = "c";
        }

        switch(offspringType) {
            case "p": offspring = this.addPlant(properties); break;
            case "h": offspring = this.addHerbivore(properties); break;
            case "c": offspring = this.addCarnivore(properties); break;
        }

        offspring.mutate();

        offspring.x += (Math.random() * 10 - 5);
        offspring.y += (Math.random() * 10 - 5);

        return true;
    }

    updateAll() {
        let plants = this.getPlants();
        let herbivores = this.getHerbivores();
        let carnivores = this.getCarnivores();

        let plantBiomass = this.getPlants().reduce((total, p) => total + p.size, 0);
        let currentSunlightFactor = sunlightFactor();

        plants.forEach(plant => {
            let neighbourCount = this.getNearbyOrganisms(plant).length;
            plant.eat(plantBiomass, currentSunlightFactor, neighbourCount);
        });

        herbivores.forEach(herbivore => {
            let edibleNeighbours = this.getEdibleNearbyOrganismsInContact(herbivore);
            herbivore.eat(edibleNeighbours);
        });

        carnivores.forEach(carnivore => {
            let edibleNeighbours = this.getEdibleNearbyOrganismsInContact(carnivore);
            carnivore.eat(edibleNeighbours);
        });

        this.getAll().forEach(organism => {
            organism.move();

            // Update the map grid
            this.ensureOnCanvas(organism);

            const removed = this.mapGrid.removeFromCell(organism);
            this.mapGrid.addToCell(organism);

            organism.reproduce();
        });

        this.mapGrid.removeDead();

        this.randomlySpawnOrganisms();
    }

    randomlySpawnOrganisms() {
        if(Math.random() < (0.12) && this.size() < 81) {
            console.log('spawn');
            this.addRandomOrganism();
        }
    }

    ensureOnCanvas(organism) {
        organism.x = forceIntoRange(organism.x, 1, canvas.width - 1);
        organism.y = forceIntoRange(organism.y, 1, canvas.height - 1);
    }

    addRandomOrganism(oldProperties = null) {
        let newO = this.organismBuilder.newRandomOrganism(oldProperties);
        this.add(newO);
        return newO;
    }

    addPlant(oldProperties = null) {
        let newO = this.organismBuilder.newPlant(oldProperties);
        this.add(newO);
        return newO;
    }

    addHerbivore(oldProperties = null) {
        let newO = this.organismBuilder.newHerbivore(oldProperties);
        this.add(newO);
        return newO;
    }

    addCarnivore(oldProperties = null) {
        let newO = this.organismBuilder.newCarnivore(oldProperties)
        this.add(newO);
        return newO;
    }

    killAll() {
        this.organisms = [];
    }

    getAll() {
        return this.organisms;
    }

    getPlants() {
        return this.organisms.filter(organism => organism instanceof Plant);
    }

    getHerbivores() {
        return this.organisms.filter(organism => organism instanceof Herbivore);
    }

    getCarnivores() {
        return this.organisms.filter(organism => organism instanceof Carnivore);
    }

    getNearbyOrganisms(organism, opts = {orderByNearest: false}) {
        let nearbyOrganisms = this.mapGrid.getNearbyOrganisms(organism);
        if(opts.orderByNearest) {
            nearbyOrganisms.sort((o1, o2) => this.mapGrid.distance(organism, o1) - this.mapGrid.distance(organism, o2));
        }

        return nearbyOrganisms;
    }

    getEdibleNearbyOrganisms(organism, opts = {orderByNearest: false}) {
        const nearbyOrganisms = this.mapGrid.getNearbyOrganisms(organism, opts);

        return nearbyOrganisms.filter(neighbour => {
            return (neighbour !== organism) &&
            ((organism instanceof Herbivore && neighbour instanceof Plant) ||
            (organism instanceof Carnivore && neighbour instanceof Herbivore))
        });
    }

    getEdibleNearbyOrganismsInContact(organism, opts = {orderByNearest: false}) {
        const nearbyOrganisms = this.mapGrid.getNearbyOrganisms(organism, opts);

        return nearbyOrganisms.filter(neighbour => {
            return (neighbour !== organism) &&
            ((organism instanceof Herbivore && neighbour instanceof Plant) ||
            (organism instanceof Carnivore && neighbour instanceof Herbivore)) &&
            this.mapGrid.inContact(organism, neighbour);
        });
    }
}
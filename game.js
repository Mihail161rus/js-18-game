'use strict';

class Vector {
    constructor(x = 0, y = 0) {
        this.x = x;
        this.y = y;
    }

    plus(vector) {
        if (!(vector instanceof Vector)) {
            throw new Error('Можно прибавлять к вектору только вектор типа Vector');
        }

        return new Vector(this.x + vector.x, this.y + vector.y);
    }

    times(n) {
        return new Vector(this.x * n, this.y * n);
    }
}

class Actor {
    constructor(position = new Vector(), size = new Vector(1, 1), speed = new Vector()) {
        if (position instanceof Vector && size instanceof Vector && speed instanceof Vector) {
            this.pos = position;
            this.size = size;
            this.speed = speed;
        } else {
            throw new Error(`Один или несколько аргументов ${[position, size, speed]} не принадлежат классу Actor`);
        }
    }

    act() {

    }

    get left() {
        return this.pos.x;
    }

    get top() {
        return this.pos.y;
    }

    get right() {
        return this.pos.x + this.size.x;
    }

    get bottom() {
        return this.pos.y + this.size.y;
    }

    get type() {
        return 'actor';
    }

    isIntersect(actor = new Actor()) {
        if (!(actor instanceof Actor)) {
            throw new Error(`Переданный параметр ${actor} не является экземпляром класса Actor`);
        }

        if (actor === this) {
            return false;
        } else {
            return !(this.top >= actor.bottom || this.bottom <= actor.top
                || this.right <= actor.left || this.left >= actor.right);
        }
    }
}

class Level {
    constructor(grid, actors) {
        if (Array.isArray(grid)) {
            this.grid = grid;
            this.height = grid.length;
            this.width = grid.reduce((memo, el) => {
                if (memo <= el.length) {
                    return el.length;
            }
            }, 0);
        } else {
            [this.height, this.width] = [0, 0];
            this.grid = [];
        }

        if (!Array.isArray(actors)) actors = [];
        this.actors = actors;
        this.player = actors.find(el => el.type === 'player');

        this.status = null;
        this.finishDelay = 1;
    }

    isFinished() {
        return this.status !== null && this.finishDelay < 0;
    }

    actorAt(actor) {
        if (!(actor instanceof Actor)) {
            throw new Error(`Переданный параметр ${actor} не является экземпляром класса Actor`);
        }

        return this.actors.find(el => el.isIntersect(actor));
    }

    obstacleAt(position, size) {
        if (!(position instanceof Vector && size instanceof Vector)) {
            throw new Error(`Переданные параметры ${[position, size]} не являются экземплярами класса Vector`);
        }

        let actor = new Actor(position, size);

        if (actor.left < 0 || actor.right > this.width || actor.top < 0) return 'wall';
        if (actor.bottom > this.height) return 'lava';

        for (let col = Math.floor(actor.top); col < Math.ceil(actor.bottom); col++) {
            for (let row = Math.floor(actor.left); row < Math.ceil(actor.right); row++) {
                if (this.grid[col][row] !== undefined) {
                    return this.grid[col][row];
                }
            }
        }
    }

    removeActor(actor) {
        let actorIndex = this.actors.findIndex(el => el === actor);

        if (actorIndex !== -1) {
            this.actors.splice(actorIndex, 1);
        }
    }

    noMoreActors(type) {
        return (this.actors.length === 0) || (this.actors.findIndex(el => el.type === type) === -1);
    }

    playerTouched(actorType, actor) {
        if (actorType === 'lava' || actorType === 'fireball') {
            this.status = 'lost';
            return;
        }

        if (actorType === 'coin' && actor !== undefined) {
            this.removeActor(actor);
        }

        if (this.noMoreActors('coin')) {
            this.status = 'won';
        }
    }
}

class LevelParser {
    constructor(dictionary) {
        this.dictionary = dictionary;
        this.objDictionary = {
            'x': 'wall',
            '!': 'lava'
        };
    }

    actorFromSymbol(char) {
        if (char !== undefined) {
            return this.dictionary[char];
        }
    }

    obstacleFromSymbol(char) {
        if (char !== undefined) {
            return this.objDictionary[char];
        }
    }

    createGrid(grid) {
        grid = [].concat(grid).filter(Boolean);

        return grid.map(row => {
            return row.split('').map(cell => {
                return this.objDictionary[cell];
            });
        });
    }

    createActors(plan) {
        let actors = [];

        plan = [].concat(plan).filter(Boolean);

        if (plan.length > 0 && this.dictionary !== undefined) {
            plan.reduce((rowMemo, row, rowIndex) => {
                row.split('').reduce((cellMemo, cell, cellIndex) => {
                    if (this.dictionary[cell] === Actor || this.dictionary[cell] !== undefined && this.dictionary[cell].prototype instanceof Actor) {
                        actors.push(new this.dictionary[cell] (new Vector(cellIndex, rowIndex)));
                    }
                }, []);
            }, []);
        }

        return actors;
    }

    parse(plan) {
        return new Level(this.createGrid(plan), this.createActors(plan));
    }
}

class Fireball extends Actor {
    constructor(pos, speed) {
        super(pos, undefined,speed);
    }

    get type() {
        return 'fireball';
    }

    getNextPosition(time = 1) {
        if (this.speed.x === 0 && this.speed.y === 0) {
            return this.pos;
        } else {
            return new Vector(this.pos.x + (this.speed.x * time), this.pos.y + (this.speed.y * time));
        }
    }

    handleObstacle() {
        this.speed.x = -this.speed.x;
        this.speed.y = -this.speed.y;
    }

    act(time, level) {
        let nextPosition = this.getNextPosition(time);

        if (level.obstacleAt(nextPosition, this.size) === undefined) {
            this.pos = nextPosition;
        } else {
            this.handleObstacle();
        }
    }
}

class HorizontalFireball extends Fireball {
    constructor(pos) {
        super(pos, new Vector(2, 0));
    }
}

class VerticalFireball extends Fireball {
    constructor(pos) {
        super(pos, new Vector(0, 2));
    }
}
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
    constructor(grid, actor) {
        if (Array.isArray(grid)) {
            this.grid = grid;
            this.height = grid.length;
        }
    }
}
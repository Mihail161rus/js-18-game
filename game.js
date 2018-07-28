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
  constructor(position = new Vector(0, 0), size = new Vector(1, 1), speed = new Vector(0, 0)) {
    if (!(position instanceof Vector && size instanceof Vector && speed instanceof Vector)) {
      throw new Error('Переданные аргументы не являются экземплярами класса Actor');
    }

    this.pos = position;
    this.size = size;
    this.speed = speed;
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
      throw new Error('Переданный аргумент не является экземпляром класса Actor');
    }

    if (actor === this) {
      return false;
    }

    return this.top < actor.bottom && this.bottom > actor.top
      && this.right > actor.left && this.left < actor.right;
  }
}

class Level {
  constructor(grid = [], actors = []) {
    this.grid = grid.slice();
    this.height = this.grid.length;
    this.width = this.grid.reduce((memo, el) => (memo <= el.length) ? el.length : '', 0);

    this.actors = actors.slice();
    this.player = this.actors.find(el => el.type === 'player');

    this.status = null;
    this.finishDelay = 1;
  }

  isFinished() {
    return this.status !== null && this.finishDelay < 0;
  }

  actorAt(actor) {
    if (!(actor instanceof Actor)) {
      throw new Error('Переданный аргумент не является экземпляром класса Actor');
    }

    return this.actors.find(el => el.isIntersect(actor));
  }

  obstacleAt(position, size) {
    if (!(position instanceof Vector && size instanceof Vector)) {
      throw new Error('Переданные аргументы не являются экземплярами класса Vector');
    }

    const posTop = Math.floor(position.y);
    const posBottom = Math.ceil(position.y + size.y);
    const posLeft = Math.floor(position.x);
    const posRight = Math.ceil(position.x + size.x);

    if (posLeft < 0 || posRight > this.width || posTop < 0) {
      return 'wall';
    }

    if (posBottom > this.height) {
      return 'lava';
    }

    for (let col = posTop; col < posBottom; col++) {
      for (let row = posLeft; row < posRight; row++) {
        const cell = this.grid[col][row];
        if (cell) {
          return cell;
        }
      }
    }
  }

  removeActor(actor) {
    const actorIndex = this.actors.findIndex(el => el === actor);

    if (actorIndex !== -1) {
      this.actors.splice(actorIndex, 1);
    }
  }

  noMoreActors(type) {
    return !this.actors.some(el => el.type === type);
  }

  playerTouched(actorType, actor) {
    if (actorType === 'lava' || actorType === 'fireball') {
      this.status = 'lost';
      return;
    }

    if (actorType === 'coin') {
      this.removeActor(actor);
    }

    if (this.noMoreActors('coin')) {
      this.status = 'won';
    }
  }
}

class LevelParser {
  constructor(dictionary = {}) {
    this.dictionary = Object.assign({}, dictionary);
    this.objDictionary = {
      'x': 'wall',
      '!': 'lava'
    };
  }

  actorFromSymbol(char) {
    return this.dictionary[char];
  }

  obstacleFromSymbol(char) {
    return this.objDictionary[char];
  }

  createGrid(grid) {
    return grid.map(row => row.split('').map(cell => this.obstacleFromSymbol(cell)));
  }

  createActors(plan) {
    const actors = [];

    plan.forEach((row, rowIndex) => {
      row.split('').forEach((cell, cellIndex) => {
        const createActor = this.actorFromSymbol(cell);

        if (typeof createActor === 'function') {
          const actorObj = new createActor(new Vector(cellIndex, rowIndex));

          if (actorObj instanceof Actor) {
            actors.push(actorObj);
          }
        }
      });
    });

    return actors;
  }

  parse(plan) {
    return new Level(this.createGrid(plan), this.createActors(plan));
  }
}

class Fireball extends Actor {
  constructor(pos = new Vector(0, 0), speed = new Vector(0, 0)) {
    super(pos, new Vector(1, 1), speed);
  }

  get type() {
    return 'fireball';
  }

  getNextPosition(time = 1) {
    return this.pos.plus(this.speed.times(time));
  }

  handleObstacle() {
    this.speed = this.speed.times(-1);
  }

  act(time, level) {
    const nextPosition = this.getNextPosition(time);

    if (level.obstacleAt(nextPosition, this.size)) {
      this.handleObstacle();
    } else {
      this.pos = nextPosition;
    }
  }
}

class HorizontalFireball extends Fireball {
  constructor(pos = new Vector(0, 0)) {
    super(pos, new Vector(2, 0));
  }
}

class VerticalFireball extends Fireball {
  constructor(pos = new Vector(0, 0)) {
    super(pos, new Vector(0, 2));
  }
}

class FireRain extends Fireball {
  constructor(pos = new Vector(0, 0)) {
    super(pos, new Vector(0, 3));
    this.startPosition = pos;
  }

  handleObstacle() {
    this.pos = this.startPosition;
  }
}

class Coin extends Actor {
  constructor(pos = new Vector(0, 0)) {
    super(pos.plus(new Vector(0.2, 0.1)), new Vector(0.6, 0.6));
    this.startPosition = this.pos;
    this.spring = Math.random() * 2 * Math.PI;
    this.springSpeed = 8;
    this.springDist = 0.07;
  }

  get type() {
    return 'coin';
  }

  updateSpring(time = 1) {
    this.spring += this.springSpeed * time;
  }

  getSpringVector() {
    return new Vector(0, Math.sin(this.spring) * this.springDist);
  }

  getNextPosition(time = 1) {
    this.updateSpring(time);
    return this.startPosition.plus(this.getSpringVector());
  }

  act(time) {
    this.pos = this.getNextPosition(time);
  }
}

class Player extends Actor {
  constructor(pos = new Vector(0, 0)) {
    super(pos.plus(new Vector(0, -0.5)), new Vector(0.8, 1.5), new Vector(0, 0));
  }

  get type() {
    return 'player';
  }
}

const schemas = loadLevels();

const actorDict = {
  '@': Player,
  'v': FireRain,
  '=': HorizontalFireball,
  '|': VerticalFireball,
  'o': Coin
};

const parser = new LevelParser(actorDict);

schemas.then(result => {
  runGame(JSON.parse(result), parser, DOMDisplay).then(() => alert('Вы победили!'));
});
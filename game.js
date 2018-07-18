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
    // аргументы класса Vector лучше не опускать, кто-то может изменить значения по умолчанию и всё сломается
    constructor(position = new Vector(), size = new Vector(1, 1), speed = new Vector()) {
        if (position instanceof Vector && size instanceof Vector && speed instanceof Vector) {
            this.pos = position;
            this.size = size;
            this.speed = speed;
        } else {
            // лучше сначала делать проверку, а потом писать основной код
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
        // тут не нужен else, если зайдёт в if, то выполнение метода прекратиться
        } else {
            // отрицание можно внести в скобки если заменить || на &&
            // и операторы на противоположные
            // >= на <, а <= на >
            return !(this.top >= actor.bottom || this.bottom <= actor.top
                || this.right <= actor.left || this.left >= actor.right);
        }
    }
}

class Level {
    constructor(grid, actors) {
        // лучше добавьте значения по-умолчанию для аргументов
        // и уберите эти проверки
        if (Array.isArray(grid)) {
            this.grid = grid;
            this.height = grid.length;
            this.width = grid.reduce((memo, el) => {
                if (memo <= el.length) {
                    return el.length;
            }
            }, 0);
        } else {
            // не усложняйте ко там, где это не нужно
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

        // значение присваивается переменной один раз - лучше использовать const
        // а вообще тут не нужно создавать объект,
        // потому что он используется только для того,
        // чтобы сложить несколько чисел
        let actor = new Actor(position, size);

        // не опускайте фигурные скобки у if
        if (actor.left < 0 || actor.right > this.width || actor.top < 0) return 'wall';
        if (actor.bottom > this.height) return 'lava';

        //  лучше сохранить округлённые значения в переменных,
        // чтобы не округлять на кажждой итерации
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
        // тут лучше использовать метод some
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
        // если убрать проверку, то ничего не изменится
        if (char !== undefined) {
            return this.dictionary[char];
        }
    }

    obstacleFromSymbol(char) {
        // проверка лишняя
        if (char !== undefined) {
            return this.objDictionary[char];
        }
    }

    createGrid(grid) {
        // лучше не модифицировать фргументы функции
        // непонятно зачем тут этот непонятный код :)
        grid = [].concat(grid).filter(Boolean);

        // можно использовать сокращённую форму записи стрелочных функций
        return grid.map(row => {
            return row.split('').map(cell => {
                return this.objDictionary[cell];
            });
        });
    }

    createActors(plan) {
        // const
        let actors = [];

        // лишний код
        plan = [].concat(plan).filter(Boolean);

        // добавьте значение по-умолчанию для dictionary
        // в конструкторе и проверка станет лишней
        if (plan.length > 0 && this.dictionary !== undefined) {
            // зачем reduce, если вы не используете rowMemo?
            plan.reduce((rowMemo, row, rowIndex) => {
                // cellMemo тоже не используется
                row.split('').reduce((cellMemo, cell, cellIndex) => {
                    // this.dictionary[cell] лучше записать в переменную,
                    // чтобы не писать одно и то же
                    // тут достаточно проверить, что this.dictionary[cell]
                    // это функция, а потом, то, что созданный объект
                    // является экземпляром класса Actor
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
    // лучше добавить значения по-умолчанию
    constructor(pos, speed) {
        // второй аргумент неправильный, размер огненного шара нам известен
        super(pos, undefined,speed);
    }

    get type() {
        return 'fireball';
    }

    getNextPosition(time = 1) {
        // это лишняя проверка
        if (this.speed.x === 0 && this.speed.y === 0) {
            return this.pos;
        } else {
            // здесь нужно использовать методы класса Vector
            return new Vector(this.pos.x + (this.speed.x * time), this.pos.y + (this.speed.y * time));
        }
    }

    handleObstacle() {
        // здесь нужно использовать методы класса Vector
        this.speed.x = -this.speed.x;
        this.speed.y = -this.speed.y;
    }

    act(time, level) {
        let nextPosition = this.getNextPosition(time);

        // можно убрать === undefined
        if (level.obstacleAt(nextPosition, this.size) === undefined) {
            this.pos = nextPosition;
        } else {
            this.handleObstacle();
        }
    }
}

class HorizontalFireball extends Fireball {
    // лучше добавить значение по-умолчанию
    constructor(pos) {
        super(pos, new Vector(2, 0));
    }
}

class VerticalFireball extends Fireball {
    // лучше добавить значение по-умолчанию
    constructor(pos) {
        super(pos, new Vector(0, 2));
    }
}

class FireRain extends Fireball {
    // лучше добавить значение по-умолчанию
    constructor(pos) {
        super(pos, new Vector(0, 3));
        // проверка лишняя
        if (pos !== undefined) {
            // можно не создавать новый вектор
            this.startPosition = new Vector(pos.x, pos.y);
        }
    }

    handleObstacle() {
        // проверка лишняя
        if (this.startPosition !== undefined) {
            // не нужно мутировать объекты типа Vector
            // это может прривести к ошибкам, которые будет сложно отследить
            this.pos.x = this.startPosition.x;
            this.pos.y = this.startPosition.y;
        }
    }
}

class Coin extends Actor {
    // лучше добавить значение по-умолчанию
    constructor(pos) {
        // третий аргумент некорректный
        super(pos, new Vector(0.6, 0.6), undefined);

        // pos лучше задавать через вызов родительского конструктора
        this.pos = this.pos.plus(new Vector(0.2, 0.1));
        this.startPosition = this.pos;
        this.spring = Math.random() *2 * Math.PI;
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
    // значение по умолчанию
    constructor(pos) {
        // проверка лишняя
        if (pos !== undefined) {
            // аргументы лучше не менять
            pos = pos.plus(new Vector(0, -0.5));
        }
        super (pos,new Vector(0.8, 1.5), new Vector(0, 0));
    }

    get type() {
        return 'player';
    }
}

// было бы здорово, если бы вы загрузили уровни через loadLevels
const schemas = [
    [
        '         ',
        '         ',
        '    =    ',
        '       o ',
        '     !xxx',
        ' @       ',
        'xxx!     ',
        '         '
    ],
    [
        '      v  ',
        '    v    ',
        '  v      ',
        '        o',
        '        x',
        '@   x    ',
        'x        ',
        '         '
    ]
];
const actorDict = {
    '@': Player,
    'v': FireRain,
    '=': HorizontalFireball,
    '|': VerticalFireball,
    'o': Coin
} // точка с запятой
const parser = new LevelParser(actorDict);
runGame(schemas, parser, DOMDisplay)
    .then(() => console.log('Вы выиграли приз!'));
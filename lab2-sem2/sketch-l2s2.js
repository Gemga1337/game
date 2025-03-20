let gameObject = {
    collectables: [],
    environment: [],
    enemies: []
};

// Настройки персонажа
const PERSON = {
    x: 600,
    y: 200,
    size: 50,
    jumpForce: -15,
    speed: 5,
    color: "#ffdc8c",
    clothesColor: "#54e7dc"
};

let personState = {
    x: PERSON.x,
    y: PERSON.y,
    isMovingLeft: false,
    isMovingRight: false,
    isJumping: false,
    velocityY: 0,
    isFalling: false,
    fallSpeed: 0,
    lastDirection: "right",
    score: 0,
    isDead: false // Состояние смерти
};

// Звуковые файлы
let bgMusic, fallSound, hitSound;
let isSoundOn = true; // Переменная для отслеживания состояния звука
let isSoundStarted = false; // Для отслеживания первого клика

// Слайдер для регулировки громкости
let volumeSlider;

// Кнопка перезапуска игры
let restartButton;

function initSounds() {
    bgMusic = new Audio('bg-music.mp3');
    fallSound = new Audio('fall_sound.mp3');
    hitSound = new Audio('hit_sound.mp3');

    // Настройка фоновой музыки
    bgMusic.loop = true; // Зацикливание фоновой музыки
    bgMusic.volume = 0.5; // Установка громкости (от 0 до 1)
}

function setup() {
    createCanvas(720, 400);
    textFont("Arial");
    generateGameObjects();

    // Инициализация звуков
    initSounds();

    // Запуск звука после первого клика
    document.addEventListener('click', () => {
        if (!isSoundStarted && isSoundOn) {
            bgMusic.play();
            isSoundStarted = true;
        }
    });

    // Создание слайдера для регулировки громкости
    volumeSlider = createSlider(0, 1, 0.5, 0.01);
    volumeSlider.position(width - 220, 10); // Перемещен в правый верхний угол
    volumeSlider.style('width', '200px');

    // Создание кнопки перезапуска
    restartButton = createButton('Перезапустить');
    restartButton.position(width / 2 - 50, height / 2);
    restartButton.mousePressed(restartGame);
    restartButton.hide(); // Скрываем кнопку до смерти
}

function generateGameObjects() {
    // Генерация коллекционных предметов
    gameObject.collectables = [
        createCollectable(300, 150, 40, "#ff0000", "#00ff00"),
        createCollectable(500, 200, 30, "#0000ff", "#ffff00")
    ];

    // Генерация окружения
    gameObject.environment = [
        createGrass(0, 300, 720, 100),
        createSun(40, 80, 60),
        createCloud(100, 95, 100, 70),
        createCanyon(100, 300, 100, 100), // Уменьшили ширину каньона
        createRock(400, 280, 50),
        createTree(570, 200, 40, 100, 590, 170, 100, 150)
    ];

    // Генерация врагов
    gameObject.enemies = [
        createEnemy(300, 280, 60, 40, 1, 250, 350),
        createEnemy(500, 280, 60, 40, 2, 450, 550)
    ];
}

// Фабрики объектов
function createCollectable(x, y, size, c1, c2) {
    return {
        x, y, size,
        color1: c1,
        color2: c2,
        draw: function() {
            fill(this.color1);
            ellipse(this.x, this.y, this.size);
            fill(this.color2);
            ellipse(this.x, this.y, this.size / 2);
        }
    };
}

function createGrass(x, y, w, h) {
    return {
        type: "grass",
        color: "#087145",
        x, y, w, h,
        draw: function() {
            fill(this.color);
            rect(this.x, this.y, this.w, this.h);
        }
    };
}

function createSun(x, y, size) {
    return {
        type: "sun",
        color: "#f4ff00",
        x, y, size,
        draw: function() {
            fill(this.color);
            ellipse(this.x, this.y, this.size);
        }
    };
}

function createCloud(x, y, w, h) {
    return {
        type: "cloud",
        color: "#ffffff",
        x, y, w, h,
        draw: function() {
            fill(this.color);
            ellipse(this.x, this.y, this.w, this.h);
        }
    };
}

function createCanyon(x, y, w, h) {
    return {
        type: "canyon",
        color: "#9b8b8b",
        x, y, w, h,
        draw: function() {
            fill(this.color);
            quad(
                this.x, this.y,
                this.x + this.w / 2, this.y + this.h,
                this.x + this.w, this.y + this.h,
                this.x + this.w / 2, this.y
            );
        },
        checkCollision: function(px, py) {
            const footY = py + 120; // Y-координата "ног" персонажа
            const footLeft = px - 10; // Узкая коллизия слева
            const footRight = px + 10; // Узкая коллизия справа

            return (
                footY > this.y &&
                footY < this.y + this.h &&
                (
                    (footLeft > this.x && footLeft < this.x + this.w) ||
                    (footRight > this.x && footRight < this.x + this.w)
                )
            );
        }
    };
}

function createRock(x, y, size) {
    return {
        type: "rock",
        color: "#434343",
        x, y, size,
        draw: function() {
            fill(this.color);
            ellipse(this.x, this.y, this.size);
        }
    };
}

function createTree(trunkX, trunkY, trunkW, trunkH, crownX, crownY, crownW, crownH) {
    return {
        type: "tree",
        trunk: { x: trunkX, y: trunkY, w: trunkW, h: trunkH, color: "#865141" },
        crown: { x: crownX, y: crownY, w: crownW, h: crownH, color: "#09c80a" },
        draw: function() {
            fill(this.trunk.color);
            rect(this.trunk.x, this.trunk.y, this.trunk.w, this.trunk.h);
            fill(this.crown.color);
            ellipse(this.crown.x, this.crown.y, this.crown.w, this.crown.h);
        }
    };
}

function createEnemy(x, y, w, h, speed, start, end) {
    return {
        x, y, w, h, speed,
        patrolStart: start,
        patrolEnd: end,
        direction: 1,
        isAlive: true,
        draw: function() {
            if (!this.isAlive) return;
            fill("#00aa00");
            ellipse(this.x, this.y, this.w, this.h);
            fill("#00cc00");
            ellipse(this.x - 30, this.y, 20, 20);
            rect(this.x - 20, this.y + 15, 10, 20);
            rect(this.x + 20, this.y + 15, 10, 20);
        },
        update: function() {
            if (!this.isAlive) return;
            this.x += this.speed * this.direction;
            if (this.x > this.patrolEnd || this.x < this.patrolStart) {
                this.direction *= -1;
            }
        },
        checkCollision: function(px, py) {
            return this.isAlive &&
                px > this.x - this.w / 2 &&
                px < this.x + this.w / 2 &&
                py > this.y - this.h / 2 &&
                py < this.y + this.h / 2;
        }
    };
}

function draw() {
    background("#0092ff");
    updateGameLogic();
    drawGameObjects();
    drawHUD();
    drawPerson();
    drawVolumeSlider(); // Рисуем слайдер громкости
    if (personState.isDead) {
        restartButton.show(); // Показываем кнопку перезапуска при смерти
    }
}

function drawVolumeSlider() {
    fill(255);
    textSize(16);
    text("Громкость", width - 220, 35); // Текст рядом со слайдером

    // Обновляем громкость всех звуков
    const volume = volumeSlider.value();
    bgMusic.volume = volume;
    fallSound.volume = volume;
    hitSound.volume = volume;
}

function restartGame() {
    // Сброс состояния игры
    personState = {
        x: PERSON.x,
        y: PERSON.y,
        isMovingLeft: false,
        isMovingRight: false,
        isJumping: false,
        velocityY: 0,
        isFalling: false,
        fallSpeed: 0,
        lastDirection: "right",
        score: 0,
        isDead: false
    };
    restartButton.hide(); // Скрываем кнопку перезапуска
    generateGameObjects(); // Пересоздаем объекты игры
}

function updateGameLogic() {
    if (personState.isDead) return; // Останавливаем игру при смерти

    // Логика движения персонажа
    if (!personState.isFalling) {
        if (personState.isMovingRight) personState.x = min(personState.x + PERSON.speed, 670);
        if (personState.isMovingLeft) personState.x = max(personState.x - PERSON.speed, 50);
    }

    // Логика прыжка
    if (personState.isJumping && !personState.isFalling) {
        personState.y += personState.velocityY;
        personState.velocityY += 0.8; // Гравитация
        if (personState.y > PERSON.y) {
            personState.y = PERSON.y;
            personState.isJumping = false;
            personState.velocityY = 0;
        }
    }

    // Логика падения в яму
    const canyon = gameObject.environment.find(obj => obj.type === "canyon");
    if (canyon && !personState.isFalling && canyon.checkCollision(personState.x, personState.y)) {
        personState.isFalling = true;
        personState.fallSpeed = 0;
        personState.isMovingLeft = false;
        personState.isMovingRight = false;
        if (isSoundOn) fallSound.play(); // Звук падения
    }

    if (personState.isFalling) {
        personState.y += personState.fallSpeed;
        personState.fallSpeed += 0.5;
        if (personState.y > 400) {
            personState.isDead = true; // Смерть при падении
        }
    }

    // Логика сбора предметов
    for (let i = gameObject.collectables.length - 1; i >= 0; i--) {
        const item = gameObject.collectables[i];
        const distance = dist(personState.x, personState.y, item.x, item.y);
        const minDistance = 25 + item.size / 2;

        if (distance < minDistance) {
            gameObject.collectables.splice(i, 1);
            personState.score++;
        }
    }

    // Логика врагов
    gameObject.enemies.forEach(enemy => {
        enemy.update();

        if (enemy.checkCollision(personState.x, personState.y + 120)) {
            if (personState.isJumping && personState.velocityY > 0) {
                enemy.isAlive = false;
                personState.velocityY = -10;
                personState.score += 2; // Награда за убийство врага
                if (isSoundOn) hitSound.play(); // Звук удара
            } else {
                personState.isDead = true; // Смерть при столкновении с врагом
            }
        }
    });
}

function drawGameObjects() {
    gameObject.environment.forEach(obj => obj.draw());
    gameObject.collectables.forEach(item => item.draw());
    gameObject.enemies.forEach(enemy => enemy.draw());
}

function drawHUD() {
    fill(255);
    textSize(24);
    text("Счет: " + personState.score, 20, 40);
}

function drawPerson() {
    if (personState.isDead) {
        fill(255, 0, 0);
        textSize(40);
        text("Вы умерли!", width / 2 - 100, height / 2 - 50);
        return;
    }

    if (personState.isMovingLeft) {
        drawPersonLeft(personState.x, personState.y);
        personState.lastDirection = "left";
    } else if (personState.isMovingRight) {
        drawPersonRight(personState.x, personState.y);
        personState.lastDirection = "right";
    } else {
        if (personState.lastDirection === "left") drawPersonLeft(personState.x, personState.y);
        else drawPersonRight(personState.x, personState.y);
    }
}

function drawPersonLeft(x, y) {
    fill(PERSON.color);
    ellipse(x, y, PERSON.size, PERSON.size);
    fill(PERSON.clothesColor);
    rect(x - 25, y + 20, 30, 100);
    fill(PERSON.color);
    rect(x - 30, y + 20, 10, 70);
    rect(x + 10, y + 20, 10, 70);
    fill(PERSON.color);
    rect(x - 25, y + 120, 13, 70);
    rect(x + 2, y + 120, 13, 70);
    fill("#000000");
    ellipse(x - 15, y - 10, 7, 7);
    ellipse(x + 5, y - 10, 7, 7);
}

function drawPersonRight(x, y) {
    fill(PERSON.color);
    ellipse(x, y, PERSON.size, PERSON.size);
    fill(PERSON.clothesColor);
    rect(x - 5, y + 20, 30, 100);
    fill(PERSON.color);
    rect(x - 10, y + 20, 10, 70);
    rect(x + 20, y + 20, 10, 70);
    fill(PERSON.color);
    rect(x - 5, y + 120, 13, 70);
    rect(x + 12, y + 120, 13, 70);
    fill("#000000");
    ellipse(x - 5, y - 10, 7, 7);
    ellipse(x + 15, y - 10, 7, 7);
}

function keyPressed() {
    if (personState.isDead) return; // Блокируем управление при смерти

    if (keyCode === RIGHT_ARROW) {
        personState.isMovingRight = true;
        personState.lastDirection = "right";
    }
    if (keyCode === LEFT_ARROW) {
        personState.isMovingLeft = true;
        personState.lastDirection = "left";
    }
    if (keyCode === 32 && !personState.isJumping && !personState.isFalling) {
        personState.isJumping = true;
        personState.velocityY = PERSON.jumpForce;
    }
}

function keyReleased() {
    if (keyCode === RIGHT_ARROW) personState.isMovingRight = false;
    if (keyCode === LEFT_ARROW) personState.isMovingLeft = false;
}
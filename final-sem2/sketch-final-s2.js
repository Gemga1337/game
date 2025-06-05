// Глобальные переменные
let gameObjects = {
  collectables: [],
  environment: [],
  enemies: []
};

const PERSON = {
  x: 100,
  y: 200,
  size: 50,
  jumpForce: -15,
  speed: 5,
  color: "#ffdc8c",
  clothesColor: "#54e7dc",
  legHeight: 120,
  health: 3
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
  isDead: false,
  onPlatform: false,
  health: PERSON.health,
  blinkCounter: 0,
  invulnerable: false
};

let cameraOffset = { x: 0, y: 0 };
const CAMERA_SMOOTHING = 0.1;
const LEVEL_WIDTH = 1440;
const LEVEL_HEIGHT = 400;

let isSoundOn = true;
let gameWon = false;
let gameStarted = false;
let volumeSlider;

function createGrass(x, y, w, h) {
  return {
    type: "grass",
    color: "#087145",
    x, y, w, h,
    draw: function() {
      fill(this.color);
      rect(this.x, this.y, this.w, this.h);
      
      fill("#0a8a50");
      for (let i = this.x; i < this.x + this.w; i += 8) {
        if (i > cameraOffset.x - 50 && i < cameraOffset.x + width + 50) {
          const height = random(5, 15);
          rect(i, this.y - height, 3, height);
        }
      }
    }
  };
}

function createPlatform(x, y, w, h) {
  return {
    type: "platform",
    color: "#8B4513",
    x, y, w, h,
    draw: function() {
      fill(this.color);
      rect(this.x, this.y, this.w, this.h);
    },
    checkCollision: function(px, py) {
      const personFootY = py + PERSON.legHeight;
      const withinX = px > this.x && px < this.x + this.w;
      const fallingInto = (personFootY > this.y - 10) && (personFootY < this.y + 20);
      return withinX && fallingInto;
    }
  };
}

function createCanyon(x, y, w, h) {
  return {
    type: "canyon",
    color: "#7b5c5c",
    x, y, w, h,
    draw: function() {
      fill(this.color);
      beginShape();
      vertex(this.x, this.y);
      vertex(this.x + this.w/2, this.y + this.h);
      vertex(this.x + this.w, this.y);
      vertex(this.x + this.w, this.y + 100);
      vertex(this.x, this.y + 100);
      endShape(CLOSE);
      
      fill("#6a4b4b");
      rect(this.x, this.y + 20, this.w, 10);
      rect(this.x + 10, this.y + 40, this.w - 20, 8);
    },
    checkCollision: function(px, py) {
      const footY = py + PERSON.legHeight;
      const footLeft = px - 10;
      const footRight = px + 10;

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

function createCloud(x, y, w, h) {
  return {
    type: "cloud",
    color: "#ffffff",
    x, y, w, h,
    draw: function() {
      fill(this.color);
      ellipse(this.x, this.y, this.w, this.h);
      ellipse(this.x + 20, this.y - 10, this.w * 0.8, this.h * 0.8);
      ellipse(this.x - 20, this.y - 5, this.w * 0.7, this.h * 0.7);
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
      
      stroke(this.color);
      strokeWeight(3);
      for (let i = 0; i < 12; i++) {
        const angle = (i * PI) / 6;
        const startX = this.x + cos(angle) * this.size/2;
        const startY = this.y + sin(angle) * this.size/2;
        const endX = this.x + cos(angle) * this.size;
        const endY = this.y + sin(angle) * this.size;
        line(startX, startY, endX, endY);
      }
      noStroke();
    }
  };
}

// Фабрика объектов - Камень
function createRock(x, y, size) {
  return {
    type: "rock",
    color: "#434343",
    x, y, size,
    draw: function() {
      fill(this.color);
      beginShape();
      vertex(this.x, this.y);
      vertex(this.x + size/2, this.y - size/4);
      vertex(this.x + size, this.y);
      vertex(this.x + size*0.8, this.y + size/3);
      vertex(this.x + size/3, this.y + size/2);
      vertex(this.x - size/4, this.y + size/3);
      endShape(CLOSE);
      
      fill("#3a3a3a");
      ellipse(this.x + size/3, this.y + size/6, size/5, size/5);
      ellipse(this.x + size*0.7, this.y + size/4, size/4, size/4);
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
      
      fill("#07a308");
      ellipse(this.crown.x - 20, this.crown.y - 15, this.crown.w/3, this.crown.h/3);
      ellipse(this.crown.x + 25, this.crown.y - 10, this.crown.w/2.5, this.crown.h/2.5);
      ellipse(this.crown.x + 10, this.crown.y + 20, this.crown.w/3, this.crown.h/3);
    }
  };
}

function createSpikes(x, y, w, h) {
  const spikeCount = floor(w / 15);
  return {
    type: "spikes",
    color: "#a52a2a",
    x, y, w, h,
    draw: function() {
      fill(this.color);
      rect(this.x, this.y, this.w, this.h);
      
      fill("#8b0000");
      for (let i = 0; i < spikeCount; i++) {
        const spikeX = this.x + i * (this.w / spikeCount) + 5;
        triangle(
          spikeX, this.y,
          spikeX + 10, this.y - 15,
          spikeX + 20, this.y
        );
      }
    },
    checkCollision: function(px, py) {
      const footY = py + PERSON.legHeight;
      return (
        footY > this.y - 15 &&
        footY < this.y + this.h &&
        px > this.x &&
        px < this.x + this.w
      );
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
      
      fill("#d32f2f");
      ellipse(this.x, this.y, this.w, this.h);
      
      fill("#000");
      ellipse(this.x - 15, this.y - 5, 10, 10);
      ellipse(this.x + 15, this.y - 5, 10, 10);
      
      fill("#b71c1c");
      rect(this.x - 20, this.y + 15, 10, 20);
      rect(this.x + 10, this.y + 15, 10, 20);
      
      if (frameCount % 20 < 10) {
        rect(this.x - 20, this.y + 35, 10, 5);
        rect(this.x + 10, this.y + 35, 10, 5);
      } else {
        rect(this.x - 20, this.y + 30, 10, 10);
        rect(this.x + 10, this.y + 30, 10, 10);
      }
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
        py + PERSON.legHeight > this.y - this.h / 2 &&
        py + PERSON.legHeight < this.y + this.h / 2;
    }
  };
}

function createCollectable(x, y, size, c1, c2) {
  return {
    x, y, size,
    color1: c1,
    color2: c2,
    moveRange: random(50, 150),
    moveSpeed: random(0.5, 2),
    startX: x - random(0, 50),
    startY: y - random(0, 30),
    directionX: random([-1, 1]),
    directionY: random([-1, 1]),
    collected: false,
    
    draw: function() {
      if (this.collected) return;
      
      fill(this.color1);
      ellipse(this.x, this.y, this.size);
      fill(this.color2);
      ellipse(this.x, this.y, this.size / 2);
      
      noFill();
      stroke(255, 255, 0, 150);
      strokeWeight(2);
      ellipse(this.x, this.y, this.size + 5);
    },
    
    update: function() {
      if (this.collected) return;
      
      this.x += this.moveSpeed * this.directionX;
      if (this.x > this.startX + this.moveRange || this.x < this.startX - this.moveRange) {
        this.directionX *= -1;
      }
      
      this.y += this.moveSpeed * this.directionY;
      if (this.y > this.startY + this.moveRange || this.y < this.startY - this.moveRange) {
        this.directionY *= -1;
      }
    }
  };
}

// Настройка игры
function setup() {
  createCanvas(720, 400);
  textFont("Arial");
  generateGameLevel();
  
  volumeSlider = createSlider(0, 1, 0.5, 0.01);
  volumeSlider.position(width - 220, 10);
  volumeSlider.style('width', '200px');
}

// Генерация уровня
function generateGameLevel() {
  gameObjects = {
    collectables: [],
    environment: [],
    enemies: []
  };
  
  // Земля на всем протяжении уровня
  gameObjects.environment.push(createGrass(0, 300, LEVEL_WIDTH, 100));
  
  // Остальные элементы окружения
  gameObjects.environment.push(
    createSun(40, 80, 60),
    createCloud(100, 95, 100, 70),
    createCloud(400, 75, 120, 60),
    createCloud(600, 100, 90, 50),
    createCloud(900, 85, 110, 65),
    createCloud(1200, 95, 100, 70),
    createCanyon(300, 300, 100, 100),
    createPlatform(280, 270, 100, 20),
    createPlatform(450, 250, 80, 20),
    createPlatform(200, 180, 70, 20),
    createPlatform(700, 250, 120, 20),
    createPlatform(1000, 200, 100, 20),
    createRock(400, 280, 50),
    createRock(800, 280, 50),
    createTree(570, 200, 40, 100, 590, 170, 100, 150),
    createTree(1070, 200, 40, 100, 1090, 170, 100, 150),
    createSpikes(350, 300, 100, 30),
    createSpikes(550, 300, 80, 30),
    createSpikes(850, 300, 120, 30)
  );
  
  // Коллекционные предметы
  for (let i = 0; i < 20; i++) {
    const size = random(25, 40);
    const x = random(100, LEVEL_WIDTH - 100 - size);
    const y = random(150, 280 - size);
    const colors = [
      ["#ff0000", "#00ff00"],
      ["#0000ff", "#ffff00"],
      ["#ff00ff", "#00ffff"],
      ["#ff9900", "#00ff99"],
      ["#9900ff", "#ffcc00"]
    ];
    const randomColors = random(colors);
    gameObjects.collectables.push(
      createCollectable(x, y, size, randomColors[0], randomColors[1])
    );
  }
  
  // Враги
  gameObjects.enemies.push(
    createEnemy(400, 280, 60, 40, 1, 350, 450),
    createEnemy(600, 280, 60, 40, 2, 550, 650),
    createEnemy(800, 250, 70, 45, 2, 700, 900)
  );
}

// Основной игровой цикл
function draw() {
  if (!gameStarted) {
    drawStartScreen();
    return;
  }
  
  if (gameWon) {
    drawWinScreen();
    return;
  }
  
  background("#0092ff");
  
  push();
  updateCamera();
  
  updateGameLogic();
  drawGameObjects();
  drawPerson();
  
  pop();
  
  drawHUD();
}

// Управление камерой
function updateCamera() {
  const targetX = personState.x - width/2;
  const targetY = personState.y - height/2;
  
  cameraOffset.x += (targetX - cameraOffset.x) * CAMERA_SMOOTHING;
  cameraOffset.y += (targetY - cameraOffset.y) * CAMERA_SMOOTHING;
  
  cameraOffset.x = constrain(cameraOffset.x, 0, LEVEL_WIDTH - width);
  cameraOffset.y = constrain(cameraOffset.y, 0, LEVEL_HEIGHT - height);
  
  translate(-cameraOffset.x, -cameraOffset.y);
}

// Обновление игровой логики
function updateGameLogic() {
  if (personState.isDead || gameWon) return;
  
  // Движение персонажа
  if (!personState.isFalling) {
    if (personState.isMovingRight) personState.x = min(personState.x + PERSON.speed, LEVEL_WIDTH - 50);
    if (personState.isMovingLeft) personState.x = max(personState.x - PERSON.speed, 50);
  }

  // Физика прыжка
  if (personState.isJumping && !personState.isFalling) {
    personState.y += personState.velocityY;
    personState.velocityY += 0.8;
    
    let onPlatform = false;
    for (const obj of gameObjects.environment) {
      if (obj.type === "platform" && obj.checkCollision(personState.x, personState.y)) {
        onPlatform = true;
        personState.y = obj.y - PERSON.legHeight;
        personState.isJumping = false;
        personState.velocityY = 0;
        personState.onPlatform = true;
        break;
      }
    }
    
    if (!onPlatform && personState.y > PERSON.y) {
      personState.y = PERSON.y;
      personState.isJumping = false;
      personState.velocityY = 0;
      personState.onPlatform = false;
    }
  }
  
  // Проверка нахождения на платформе
  if (!personState.isJumping && !personState.isFalling) {
    let onPlatform = false;
    for (const obj of gameObjects.environment) {
      if (obj.type === "platform" && obj.checkCollision(personState.x, personState.y)) {
        onPlatform = true;
        personState.y = obj.y - PERSON.legHeight;
        personState.onPlatform = true;
        break;
      }
    }
    
    if (!onPlatform && personState.y !== PERSON.y) {
      personState.y = PERSON.y;
      personState.onPlatform = false;
    }
  }

  // Проверка падения в каньон
  let inCanyon = false;
  for (const obj of gameObjects.environment) {
    if (obj.type === "canyon" && obj.checkCollision(personState.x, personState.y)) {
      inCanyon = true;
      break;
    }
  }
  
  if (inCanyon && !personState.isFalling) {
    personState.isFalling = true;
    personState.fallSpeed = 0;
    personState.isMovingLeft = false;
    personState.isMovingRight = false;
    personState.onPlatform = false;
  }

  if (personState.isFalling) {
    personState.y += personState.fallSpeed;
    personState.fallSpeed += 0.5;
    if (personState.y > 400) {
      personState.isDead = true;
    }
  }

  // Сбор предметов
  for (let i = gameObjects.collectables.length - 1; i >= 0; i--) {
    const item = gameObjects.collectables[i];
    const distance = dist(personState.x, personState.y, item.x, item.y);
    const minDistance = 25 + item.size / 2;

    if (distance < minDistance && !item.collected) {
      item.collected = true;
      personState.score++;
      
      if (personState.score >= 20) {
        gameWon = true;
      }
    }
  }

  // Логика врагов
  gameObjects.enemies.forEach(enemy => {
    enemy.update();

    if (enemy.checkCollision(personState.x, personState.y)) {
      if (personState.isJumping && personState.velocityY > 0) {
        enemy.isAlive = false;
        personState.velocityY = -10;
        personState.score += 2;
      } else if (!personState.invulnerable) {
        personState.health--;
        personState.invulnerable = true;
        personState.blinkCounter = 60;
        
        if (personState.health <= 0) {
          personState.isDead = true;
        }
      }
    }
  });
  
  // Логика шипов
  for (const obj of gameObjects.environment) {
    if (obj.type === "spikes" && obj.checkCollision(personState.x, personState.y)) {
      if (!personState.invulnerable) {
        personState.health--;
        personState.invulnerable = true;
        personState.blinkCounter = 60;
        
        if (personState.health <= 0) {
          personState.isDead = true;
        }
      }
    }
  }
  
  // Неуязвимость
  if (personState.invulnerable) {
    personState.blinkCounter--;
    if (personState.blinkCounter <= 0) {
      personState.invulnerable = false;
    }
  }
}

// Отрисовка игровых объектов
function drawGameObjects() {
  gameObjects.environment.forEach(obj => {
    obj.draw();
  });
  
  gameObjects.collectables.forEach(item => {
    item.update();
    item.draw();
  });
  
  gameObjects.enemies.forEach(enemy => enemy.draw());
}

// Отрисовка персонажа
function drawPerson() {
  if (personState.isDead) {
    fill(255, 0, 0);
    textSize(40);
    textAlign(CENTER, CENTER);
    text("Вы умерли!", width / 2, height / 2 - 50);
    textSize(24);
    text("Нажмите R для перезапуска", width / 2, height / 2);
    return;
  }
  
  if (personState.invulnerable && frameCount % 10 < 5) {
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
  
  if (personState.isJumping) {
    fill(255, 100);
    noStroke();
    ellipse(personState.x, personState.y + 100, 30, 10);
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
  if (frameCount % 20 < 10) {
    rect(x - 25, y + 120, 13, 70);
    rect(x + 2, y + 120, 13, 50);
  } else {
    rect(x - 25, y + 120, 13, 50);
    rect(x + 2, y + 120, 13, 70);
  }
  
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
  if (frameCount % 20 < 10) {
    rect(x - 5, y + 120, 13, 50);
    rect(x + 12, y + 120, 13, 70);
  } else {
    rect(x - 5, y + 120, 13, 70);
    rect(x + 12, y + 120, 13, 50);
  }
  
  fill("#000000");
  ellipse(x - 5, y - 10, 7, 7);
  ellipse(x + 15, y - 10, 7, 7);
}

// Отрисовка интерфейса
function drawHUD() {
  push();
  resetMatrix();
  
  fill(255);
  textSize(24);
  textAlign(LEFT, TOP);
  text("Счет: " + personState.score, 20, 20);
  
  text("Жизни: ", 20, 50);
  for (let i = 0; i < personState.health; i++) {
    fill("#ff5252");
    ellipse(110 + i * 30, 60, 20, 20);
    fill("#d32f2f");
    ellipse(110 + i * 30, 60, 10, 10);
  }
  
  const totalCollectables = gameObjects.collectables.length;
  const collected = personState.score;
  text(`Кристаллы: ${collected}/${totalCollectables}`, 20, 80);
  
  const progressWidth = 200;
  const progress = collected / totalCollectables;
  noStroke();
  fill("#4CAF50");
  rect(20, 100, progressWidth * progress, 15);
  stroke(255);
  noFill();
  rect(20, 100, progressWidth, 15);
  
  pop();
}

// Экран начала игры
function drawStartScreen() {
  background("#0066cc");
  fill(255);
  textSize(32);
  textAlign(CENTER, CENTER);
  text("Прыгающий Герой", width/2, height/2 - 50);
  
  textSize(20);
  text("Собирайте кристаллы, избегайте врагов и пропастей", width/2, height/2);
  text("Управление: ← → для движения, ПРОБЕЛ для прыжка", width/2, height/2 + 40);
  
  fill("#ffd600");
  textSize(24);
  text("Нажмите ПРОБЕЛ для начала игры", width/2, height/2 + 100);
  
  const animY = height/2 + 150 + sin(frameCount * 0.1) * 10;
  drawPersonRight(width/2, animY);
}

// Экран победы
function drawWinScreen() {
  background("#0066cc");
  fill(255);
  textSize(32);
  textAlign(CENTER, CENTER);
  text("ПОБЕДА!", width/2, height/2 - 50);
  
  textSize(24);
  text(`Вы собрали ${personState.score} кристаллов`, width/2, height/2);
  
  fill("#ffd600");
  textSize(20);
  text("Нажмите R для новой игры", width/2, height/2 + 60);
  
  for (let i = 0; i < 10; i++) {
    const x = width/2 + sin(frameCount * 0.05 + i) * 200;
    const y = height/2 + 100 + cos(frameCount * 0.05 + i) * 50;
    const size = 20 + sin(frameCount * 0.1 + i) * 5;
    fill(random(['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff']));
    ellipse(x, y, size);
  }
}

// Обработка ввода
function keyPressed() {
  if (!gameStarted && keyCode === 32) {
    gameStarted = true;
    return;
  }
  
  if (gameWon && key === 'r') {
    restartGame();
    return;
  }
  
  if (personState.isDead && keyCode === 82) {
    restartGame();
    return;
  }
  
  if (personState.isDead) return;
  
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

// Перезапуск игры
function restartGame() {
  personState = {
    x: 100,
    y: 200,
    isMovingLeft: false,
    isMovingRight: false,
    isJumping: false,
    velocityY: 0,
    isFalling: false,
    fallSpeed: 0,
    lastDirection: "right",
    score: 0,
    isDead: false,
    onPlatform: false,
    health: PERSON.health,
    blinkCounter: 0,
    invulnerable: false
  };
  
  generateGameLevel();
  gameWon = false;
  gameStarted = true;
  cameraOffset = { x: 0, y: 0 };
}
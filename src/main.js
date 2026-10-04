import "./style.css";
import { createInput } from "./input.js";
import { createLoop } from "./loop.js";
import { resizeCanvas, render } from "./render.js";
import { World } from "./World.js";
import { Ship } from "./Ship.js";
import { Vector2 } from "./Vector2.js";
import { Bullet } from "./Bullet.js";

const canvas = document.querySelector("#gameCanvas");
const context = canvas.getContext("2d");
const input = createInput();

const arena = { width: window.innerWidth, height: window.innerHeight };
const world = new World(arena.width, arena.height, input);
world.shipFactory = (position) => new Ship(position);

function resize() {
  const size = resizeCanvas(canvas, context);
  arena.width = size.width;
  arena.height = size.height;
  world.width = size.width;
  world.height = size.height;
}

resize();
window.addEventListener("resize", resize);

const ship = new Ship(new Vector2(arena.width / 2, arena.height / 2));
world.spawn(ship);
world.seedAsteroids(8);

// Безпечне передавання методу: bind зберігає правильний this.
window.addEventListener("keydown", (event) => {
  const currentShip = [...world.ofKind("ship")][0];
  if (event.code === "Space" && currentShip) currentShip.fire(world);
  if (event.key === "Escape" && !currentShip) world.respawnTimer = 0;
});

// Альтернатива: стрілкова функція також зберігає зовнішній this.
const fireWithArrow = () => {
  const currentShip = [...world.ofKind("ship")][0];
  if (currentShip) currentShip.fire(world);
};
window.addEventListener("keypress", (event) => {
  if (event.code === "KeyF") {
    const currentShip = [...world.ofKind("ship")][0];
    if (currentShip) currentShip.fire(world);
  }
});

// Демонстрація композиції: окрема homing-куля, без нового класу-нащадка.
window.addEventListener("keydown", (event) => {
  const currentShip = [...world.ofKind("ship")][0];
  if (event.code === "KeyH" && currentShip) {
    const direction = Vector2.fromAngle(currentShip.angle, 500);
    world.spawn(new Bullet(currentShip.position.add(Vector2.fromAngle(currentShip.angle, 38)), direction, currentShip.id, { homing: true }));
  }
});

let enemyFireTimer = 2.5;

function update(dt) {
  enemyFireTimer -= dt;
  const currentShip = [...world.ofKind("ship")][0];
  if (enemyFireTimer <= 0 && currentShip) {
    enemyFireTimer = 2.5;
    const side = Math.floor(Math.random() * 4);
    const position = side === 0 ? new Vector2(20, Math.random() * world.height)
      : side === 1 ? new Vector2(world.width - 20, Math.random() * world.height)
      : side === 2 ? new Vector2(Math.random() * world.width, 20)
      : new Vector2(Math.random() * world.width, world.height - 20);
    const velocity = currentShip.position.sub(position).normalized().scale(280);
    world.spawn(new Bullet(position, velocity, -1));
  }

  world.step(dt);

  const hudShip = [...world.ofKind("ship")][0];
  if (hudShip) {
    document.querySelector("#hp").textContent = hudShip.hp;
  } else {
    document.querySelector("#hp").textContent = "0";
  }
  document.querySelector("#score").textContent = world.score;
  document.querySelector("#entities").textContent = world.entities.size;
}

function draw() {
  render(context, world);
}

createLoop({
  update,
  render: draw,
  onStats(stats) {
    document.querySelector("#steps").textContent = stats.stepsPerSecond;
    document.querySelector("#fps").textContent = stats.framesPerSecond;
    document.querySelector("#frameTime").textContent = stats.frameTime.toFixed(2);
  },
});

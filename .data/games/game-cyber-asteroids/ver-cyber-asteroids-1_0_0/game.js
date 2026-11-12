
const canvas = document.getElementById('c');
const ctx = canvas.getContext('2d');
let x = 400, y = 225, vx = 4, vy = 3;
function loop() {
  ctx.fillStyle = 'rgba(5, 5, 16, 0.3)';
  ctx.fillRect(0, 0, 800, 450);
  ctx.fillStyle = '#06b6d4';
  ctx.beginPath();
  ctx.arc(x, y, 15, 0, Math.PI * 2);
  ctx.fill();
  x += vx; y += vy;
  if (x < 15 || x > 785) vx = -vx;
  if (y < 15 || y > 435) vy = -vy;
  requestAnimationFrame(loop);
}
loop();
window.parent.postMessage({ type: 'GV_READY' }, '*');

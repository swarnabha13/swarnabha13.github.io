/* R0: a local, dependency-free robot companion. */
(() => {
  'use strict';
  const root = document.getElementById('robot-companion');
  if (!root) return;
  const panel = root.querySelector('.robot-panel');
  const launcher = root.querySelector('.robot-launcher');
  const close = root.querySelector('.robot-close');
  const status = root.querySelector('.robot-status');
  const game = root.querySelector('.robot-game');
  const play = root.querySelector('[data-robot-action="play"]');
  const arena = root.querySelector('.robot-arena');
  const bot = root.querySelector('.arena-bot');
  const target = root.querySelector('.arena-target');
  const scoreLabel = root.querySelector('#robot-score');
  const eyes = root.querySelector('.bot-eyes');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const stars = [[78, 24], [24, 75], [76, 76], [24, 24], [50, 50]];
  let score = 0;
  let position = { x: 50, y: 50 };
  let destination = { ...position };
  let frame = null;
  let previousTime = 0;
  let actionTimer = null;
  root.hidden = false;

  function draw() {
    bot.style.left = position.x + '%';
    bot.style.top = position.y + '%';
    scoreLabel.textContent = 'Stars: ' + score + ' / 5';
    target.hidden = score === stars.length;
    if (score < stars.length) {
      target.style.left = stars[score][0] + '%';
      target.style.top = stars[score][1] + '%';
      arena.setAttribute('aria-label', 'Robot playground. Next star: ' + stars[score][0] + '% from left, ' + stars[score][1] + '% from top.');
    } else {
      arena.setAttribute('aria-label', 'Robot playground. All five stars collected.');
    }
  }
  function stopMoving() {
    if (frame !== null) cancelAnimationFrame(frame);
    frame = null;
    previousTime = 0;
    destination = { ...position };
  }
  function collect() {
    if (score === stars.length) return;
    const rect = arena.getBoundingClientRect();
    const dx = (position.x - stars[score][0]) * rect.width / 100;
    const dy = (position.y - stars[score][1]) * rect.height / 100;
    if (Math.hypot(dx, dy) < 19) {
      score += 1;
      status.textContent = score === 5 ? 'Mission complete! Five stars, one happy robot. Play again?' : 'Star collected! ' + score + ' down, ' + (5 - score) + ' to go.';
      draw();
    }
  }
  function tick(time) {
    const dt = previousTime ? Math.min((time - previousTime) / 1000, .05) : .016;
    previousTime = time;
    const dx = destination.x - position.x;
    const dy = destination.y - position.y;
    const distance = Math.hypot(dx, dy);
    const step = Math.min(distance, dt * 65);
    if (distance > .1) {
      position.x += dx / distance * step;
      position.y += dy / distance * step;
    } else {
      position = { ...destination };
    }
    collect();
    draw();
    if (distance > .1 && score < 5) frame = requestAnimationFrame(tick);
    else stopMoving();
  }
  function move(x, y) {
    if (game.hidden || panel.hidden || score === 5) return;
    destination = { x: Math.max(7, Math.min(93, x)), y: Math.max(10, Math.min(90, y)) };
    if (reducedMotion.matches) {
      position = { ...destination };
      collect();
      draw();
    } else if (frame === null) frame = requestAnimationFrame(tick);
  }
  function reset() {
    stopMoving();
    score = 0;
    position = { x: 50, y: 50 };
    destination = { ...position };
    status.textContent = 'Help me collect five stars. Point me toward the first one!';
    draw();
  }
  function togglePanel(open) {
    panel.hidden = !open;
    launcher.setAttribute('aria-expanded', String(open));
    if (open) close.focus();
    else {
      stopMoving();
      clearTimeout(actionTimer);
      root.classList.remove('robot-wave', 'robot-dance');
      launcher.focus();
    }
  }
  launcher.addEventListener('click', () => togglePanel(panel.hidden));
  close.addEventListener('click', () => togglePanel(false));
  root.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !panel.hidden) {
      event.preventDefault();
      togglePanel(false);
    }
  });
  root.querySelectorAll('[data-robot-action]').forEach(button => {
    button.addEventListener('click', () => {
      const action = button.dataset.robotAction;
      if (action === 'play') {
        game.hidden = !game.hidden;
        play.setAttribute('aria-expanded', String(!game.hidden));
        if (!game.hidden) {
          reset();
          arena.focus();
        } else stopMoving();
        return;
      }
      clearTimeout(actionTimer);
      root.classList.remove('robot-wave', 'robot-dance');
      // Restart the short animation on repeated button presses.
      void launcher.offsetWidth;
      if (!reducedMotion.matches) root.classList.add('robot-' + action);
      status.textContent = action === 'wave' ? 'Hello, human! Great to meet you.' : 'Beep, boop. These moves are entirely self-taught.';
      actionTimer = setTimeout(() => root.classList.remove('robot-wave', 'robot-dance'), 3000);
    });
  });
  root.querySelector('.robot-reset').addEventListener('click', () => { reset(); arena.focus(); });
  arena.addEventListener('pointerdown', event => {
    if (event.button !== 0) return;
    const rect = arena.getBoundingClientRect();
    arena.focus();
    move((event.clientX - rect.left) / rect.width * 100, (event.clientY - rect.top) / rect.height * 100);
  });
  arena.addEventListener('keydown', event => {
    const steps = { ArrowLeft: [-5, 0], ArrowRight: [5, 0], ArrowUp: [0, -5], ArrowDown: [0, 5] };
    if (!steps[event.key]) return;
    event.preventDefault();
    const step = steps[event.key];
    move(destination.x + step[0], destination.y + step[1]);
  });
  launcher.addEventListener('pointermove', event => {
    if (reducedMotion.matches) return;
    const rect = launcher.getBoundingClientRect();
    const x = Math.max(-3, Math.min(3, (event.clientX - rect.left - rect.width / 2) / 15));
    const y = Math.max(-2, Math.min(2, (event.clientY - rect.top - rect.height / 2) / 15));
    eyes.style.transform = 'translate(' + x + 'px,' + y + 'px)';
  });
  launcher.addEventListener('pointerleave', () => { eyes.style.transform = ''; });
  document.addEventListener('visibilitychange', () => { if (document.hidden) stopMoving(); });
  reducedMotion.addEventListener('change', () => {
    stopMoving();
    eyes.style.transform = '';
    root.classList.remove('robot-wave', 'robot-dance');
  });
  draw();
})();

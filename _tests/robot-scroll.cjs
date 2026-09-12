/* Run with: node _tests/robot-scroll.cjs */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const source = fs.readFileSync(path.join(__dirname, '../assets/js/robot.js'), 'utf8');

function createRobot(reduced = false) {
  let now = 0, id = 0, layoutReads = 0;
  const frames = new Map(), timers = new Map(), poses = [];
  function element(inside = true) {
    return {
      inside, hidden: false, dataset: {}, listeners: {},
      style: {setProperty(k, v) {this[k] = v;}, removeProperty(k) {delete this[k];}},
      classList: {add() {}, remove() {}, toggle() {}},
      addEventListener(type, fn) {(this.listeners[type] ||= []).push(fn);},
      emit(type, extra = {}) {
        for (const fn of this.listeners[type] || []) fn({target: this, ...extra});
      },
      setAttribute() {}, focus() {}, contains(target) {return target.inside;},
      get offsetWidth() {layoutReads++; return 148;},
      getBoundingClientRect() {return {left: 1100, top: 600, width: 148, height: 190};}
    };
  }
  const root = element(), elements = new Map();
  root.dataset = new Proxy({}, {set(obj, key, value) {
    if (key === 'action') poses.push({time: now, value});
    obj[key] = value; return true;
  }});
  root.querySelector = selector => {
    if (!elements.has(selector)) elements.set(selector, element());
    return elements.get(selector);
  };
  const actions = ['wave', 'dance', 'explore', 'play'].map(action => {
    const button = root.querySelector('[data-robot-action="' + action + '"]');
    button.dataset.robotAction = action; return button;
  });
  root.querySelectorAll = () => actions;
  root.querySelector('.robot-panel').hidden = root.querySelector('.robot-game').hidden = true;
  const document = element(false), window = element(false), media = element(false);
  document.hidden = false;
  document.documentElement = {scrollHeight: 100000};
  document.getElementById = () => root;
  Object.assign(window, {scrollY: 0, innerWidth: 1280, innerHeight: 800, matchMedia: () => media});
  media.matches = reduced;
  vm.runInNewContext(source, {
    document, window, Math, performance: {now: () => now},
    requestAnimationFrame(fn) {frames.set(++id, fn); return id;},
    cancelAnimationFrame(key) {frames.delete(key);},
    setTimeout(fn, delay) {timers.set(++id, {at: now + delay, fn}); return id;},
    clearTimeout(key) {timers.delete(key);}
  });
  function frame(ms = 16) {
    now += ms;
    for (const [key, timer] of [...timers]) {
      if (timer.at <= now && timers.delete(key)) timer.fn();
    }
    const callbacks = [...frames.values()]; frames.clear();
    callbacks.forEach(fn => fn(now));
  }
  function outside(type) {
    document.emit(type, {target: document, clientX: 200, clientY: 200,
      preventDefault() {throw Error('Page input was consumed');}});
  }
  function scroll(delta = 12) {
    outside('wheel'); window.scrollY += delta; window.emit('scroll'); frame();
  }
  return {root, document, window, media, frames, poses, frame, scroll, outside,
    get layoutReads() {return layoutReads;},
    click(action) {actions.find(button => button.dataset.robotAction === action).emit('click');}
  };
}

// Reproduce interleaved wheel, touch, pointer and scroll events at 60 fps.
const robot = createRobot();
robot.scroll(60);
const firstPose = robot.root.dataset.action;
for (let i = 0; i < 100; i++) {
  robot.outside('touchmove'); robot.outside('pointermove'); robot.scroll();
  assert.equal(robot.root.dataset.action, firstPose, 'A gesture must survive page input');
}
assert.equal(robot.poses.length, 1, 'A scroll burst should select one pose');
assert.equal(robot.layoutReads, 0, 'Scrolling must not force synchronous layout');

const emotions = new Set();
for (let i = 0; i < 650; i++) {
  robot.scroll(); emotions.add(robot.root.dataset.expression);
}
assert(emotions.size >= 3, 'Sustained scrolling should show varied emotions');
for (let i = 1; i < robot.poses.length; i++) {
  assert(robot.poses[i].time - robot.poses[i - 1].time >= 2800, 'Gestures need time to finish');
}
robot.frame(3500);
assert.equal(robot.root.dataset.action, 'idle', 'R0 should settle after scrolling stops');

const burst = createRobot();
burst.window.scrollY = 500;
for (let i = 0; i < 100; i++) burst.window.emit('scroll');
assert.equal(burst.frames.size, 1, 'Multiple scroll events should share a frame');
burst.frame();
for (let i = 0; i < 100; i++) burst.scroll(i % 2 ? 1 : -1);
assert.equal(burst.poses.length, 1, 'Tiny direction changes must not flip gestures');

const upward = createRobot();
upward.scroll(1000); upward.frame(3500); upward.scroll(-100);
assert.equal(upward.root.dataset.expression, 'surprised');
upward.frame(3500); upward.scroll(-100);
upward.frame(3500); upward.scroll(-100);
upward.frame(3500); upward.scroll(-100);
assert.equal(upward.root.dataset.expression, 'curious', 'Upward scrolling has a curious pose');

for (const event of ['pointermove', 'pointerdown', 'wheel', 'touchstart', 'touchmove', 'keydown', 'focusin']) {
  const traveler = createRobot(); traveler.click('explore'); traveler.frame(); traveler.frame(1000);
  assert(parseFloat(traveler.root.style['--travel-x']) < 0);
  traveler.outside(event);
  assert.equal(traveler.root.style['--travel-x'], undefined, 'Travel must cancel immediately');
  assert.equal(traveler.frames.size, 0);
}
const quiet = createRobot(true);
quiet.scroll(100);
assert.equal(quiet.root.dataset.action, 'idle', 'Reduced motion keeps the robot still');
assert.equal(quiet.root.dataset.expression, 'focused', 'Reduced motion still shows emotions');
robot.window.emit('scroll'); robot.document.hidden = true; robot.document.emit('visibilitychange');
assert.equal(robot.frames.size, 0, 'Hiding the page cancels pending animation work');
console.log('Robot scroll regression checks passed.');

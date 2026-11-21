'use strict';
const Wind = require('../engine.js');
const { courses } = require('../data.js');

// Plan launches using only the public physics rules and the current visible lamps.
function chooseShot(s) {
  const active = s.lights.filter((l) => l.hp > 0);
  const angles = active.map((l) => Math.atan2(l.x - 200, 410 - l.y));
  for (let j = -65; j <= 65; j++) angles.push(j / 50);
  let best = { angle: 0, gain: -1, frames: Infinity };
  for (const angle of angles) {
    const trial = Wind.create(s.course, s.power);
    trial.lights.forEach((l, i) => {
      l.hp = s.lights[i].hp;
    });
    trial.lit = s.lit;
    Wind.launch(trial, angle);
    let frames = 0;
    while (trial.shots.length && frames < 500) {
      Wind.tick(trial);
      frames++;
    }
    const gain = trial.lights.reduce((n, l, i) => n + s.lights[i].hp - l.hp, 0);
    if (gain > best.gain || (gain === best.gain && frames < best.frames))
      best = { angle, gain, frames };
  }
  if (!best.gain) throw new Error('Unreachable lamp in ' + s.course.name);
  return best.angle;
}
function solve(course, power) {
  const s = Wind.create(course, power),
    shots = [];
  while (s.lit < s.lights.length) {
    const a = chooseShot(s);
    Wind.launch(s, a);
    shots.push(a);
    while (s.shots.length) Wind.tick(s);
    if (shots.length > 20) throw new Error('Course did not end');
  }
  return shots;
}
function campaign() {
  return courses.map((c, i) => solve(c, Math.floor(i / 3)));
}
if (require.main === module) process.stdout.write(JSON.stringify(campaign()));
module.exports = { solve, campaign, chooseShot };

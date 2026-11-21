'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const Wind = require('../engine.js');
const { courses } = require('../data.js');
const { solve } = require('./routes.js');
for (const [i, c] of courses.entries()) {
  test('Natural unlock order can complete ' + c.name, () => {
    const shots = solve(c, Math.floor(i / 3));
    assert.ok(shots.length > 0 && shots.length <= c.par + 2);
  });
}
test('The first course clears on the starting bearing at every power', () => {
  for (let p = 0; p <= 5; p++) {
    const s = Wind.create(courses[0], p);
    assert.equal(Wind.launch(s, 0), true);
    assert.equal(Wind.launch(s, 0), false);
    while (s.shots.length) Wind.tick(s);
    assert.equal(s.lit, s.lights.length);
  }
});
test('Wind ring affects nearby lamps once per launch', () => {
  const c = {
    lights: [
      [205, 350, 2],
      [240, 370],
      [75, 80],
    ],
    reefs: [],
    gates: [],
  };
  const s = Wind.create(c, 2);
  Wind.launch(s, 0);
  assert.equal(Wind.burst(s), true);
  assert.equal(s.lights[0].hp, 1);
  assert.equal(s.lights[1].hp, 0);
  assert.equal(s.lights[2].hp, 1);
  assert.equal(Wind.burst(s), false);
});
test('Teleport preserves course and has a cooldown', () => {
  const s = Wind.create(
    {
      lights: [[30, 60]],
      reefs: [],
      gates: [
        [200, 355],
        [70, 180],
      ],
    },
    3,
  );
  Wind.launch(s, 0);
  for (let f = 0; f < 17; f++) Wind.tick(s);
  assert.equal(s.shots[0].x, 70);
  assert.ok(s.shots[0].vy < 0);
  assert.ok(s.shots[0].gate > 0);
});
test('Crystal resonance lights a double shell on the first pass', () => {
  const s = Wind.create({ lights: [[200, 350, 2]], reefs: [], gates: [] }, 3);
  Wind.launch(s, 0);
  while (s.shots.length) Wind.tick(s);
  assert.equal(s.lit, 1);
  assert.equal(s.events.filter((e) => e.type === 'crack').length, 0);
});
test('Medal thresholds', () => {
  assert.deepEqual(
    [1, 3, 4, 5, 6].map((n) => Wind.stars(n, 3)),
    [3, 3, 2, 2, 1],
  );
});

test('Twin wind reaches three additional lamps on the same bearing in 灯守の合図', () => {
  function count(power) {
    const s = Wind.create(courses[2], power);
    Wind.launch(s, -1.05);
    while (s.shots.length) Wind.tick(s);
    return s.lit;
  }
  assert.equal(count(0), 2);
  assert.equal(count(1), 5);
});

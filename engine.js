'use strict';
const Wind = (() => {
  const W = 400,
    H = 440,
    source = { x: 200, y: 410 },
    speed = 370,
    step = 1 / 120,
    limit = 1.3;
  const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
  function lamp(x, y, hp = 1) {
    return { x, y, hp, max: hp, cool: 0 };
  }
  function create(course, power) {
    return {
      course,
      power,
      lights: course.lights.map((p) => lamp(...p)),
      shots: [],
      turn: 0,
      time: 0,
      split: false,
      burstUsed: false,
      events: [],
      lit: 0,
    };
  }
  function ray(x, y, a) {
    return { x, y, vx: Math.sin(a) * speed, vy: -Math.cos(a) * speed, age: 0, gate: 0, trail: [] };
  }
  function launch(s, a) {
    if (s.shots.length || s.lit === s.lights.length) return false;
    s.turn++;
    s.time = 0;
    s.split = false;
    s.burstUsed = false;
    s.shots = [ray(source.x, source.y, clamp(a, -limit, limit))];
    return true;
  }
  function strike(s, l, point) {
    if (l.hp <= 0 || l.cool > 0) return false;
    l.cool = 0.17;
    l.hp = Math.max(0, l.hp - (s.power >= 3 ? 2 : 1));
    if (!l.hp) s.lit++;
    s.events.push({ type: l.hp ? 'crack' : 'light', x: l.x, y: l.y });
    if (point && s.power >= 1 && !s.split) {
      s.split = true;
      const a = Math.atan2(point.vx, -point.vy);
      const turns = s.power >= 5 ? [-0.62, 0.62] : [0.62];
      if (turns.length === 1) {
        const left = s.lights.filter((v) => v.hp > 0 && v.x < l.x).length;
        const right = s.lights.filter((v) => v.hp > 0 && v.x > l.x).length;
        if (left > right) turns[0] = -0.62;
      }
      for (const offset of turns) {
        const r = ray(point.x, point.y, a + offset);
        r.age = point.age;
        s.shots.push(r);
      }
      s.events.push({ type: 'split', x: point.x, y: point.y });
    }
    return true;
  }
  function burst(s) {
    if (s.power < 2 || s.burstUsed || !s.shots.length) return false;
    s.burstUsed = true;
    const radius = s.power >= 4 ? 100 : 70;
    for (const shot of s.shots) {
      s.events.push({ type: 'burst', x: shot.x, y: shot.y, r: radius });
      for (const l of s.lights) {
        if (Math.hypot(l.x - shot.x, l.y - shot.y) <= radius) strike(s, l, null);
      }
    }
    return true;
  }
  function move(s, p, dt) {
    p.age += dt;
    p.gate = Math.max(0, p.gate - dt);
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    let bounce = false;
    if (p.x < 9 || p.x > W - 9) {
      p.x = clamp(p.x, 9, W - 9);
      p.vx = p.x === 9 ? Math.abs(p.vx) : -Math.abs(p.vx);
      bounce = true;
    }
    if (p.y < 9) {
      p.y = 9;
      p.vy = Math.abs(p.vy);
      bounce = true;
    }
    for (const [x, y, r] of s.course.reefs) {
      const dx = p.x - x,
        dy = p.y - y,
        d = Math.hypot(dx, dy);
      if (d >= r + 5 || !d) continue;
      const nx = dx / d,
        ny = dy / d,
        dot = p.vx * nx + p.vy * ny;
      p.x = x + nx * (r + 5);
      p.y = y + ny * (r + 5);
      if (dot < 0) {
        p.vx -= 2 * dot * nx;
        p.vy -= 2 * dot * ny;
        bounce = true;
      }
    }
    if (bounce) s.events.push({ type: 'bounce', x: p.x, y: p.y });
    const gates = s.course.gates;
    if (gates.length === 2 && !p.gate) {
      const k = gates.findIndex(([x, y]) => Math.hypot(x - p.x, y - p.y) < 18);
      if (k >= 0) {
        [p.x, p.y] = gates[1 - k];
        p.gate = 0.2;
        p.trail = [];
        s.events.push({ type: 'gate', x: p.x, y: p.y });
      }
    }
    for (const l of s.lights) if (Math.hypot(l.x - p.x, l.y - p.y) < 20) strike(s, l, p);
    p.trail.push([p.x, p.y]);
    if (p.trail.length > 12) p.trail.shift();
  }
  function tick(s, dt = step) {
    s.time += dt;
    for (const l of s.lights) l.cool = Math.max(0, l.cool - dt);
    for (const p of s.shots.slice()) move(s, p, dt);
    s.shots = s.shots.filter((p) => p.age < 3.2 && p.y < H + 8);
    if (s.lit === s.lights.length) s.shots = [];
  }
  function preview(s, a) {
    const dummy = { ...s, course: s.course, lights: [], events: [] },
      p = ray(source.x, source.y, a),
      points = [[p.x, p.y]];
    for (let i = 0; i < 84; i++) {
      const oldGate = p.gate;
      move(dummy, p, step);
      if (p.gate > oldGate) points.push(null);
      if (i % 3 === 0) points.push([p.x, p.y]);
      if (p.y > H) break;
    }
    return points;
  }
  const stars = (turn, par) => (turn <= par ? 3 : turn <= par + 2 ? 2 : 1);
  return { W, H, source, step, limit, clamp, create, launch, tick, burst, preview, stars };
})();
if (typeof module !== 'undefined') module.exports = Wind;

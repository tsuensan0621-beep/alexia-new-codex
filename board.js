'use strict';
const BoardView = (() => {
  const bg = new Image();
  bg.src = 'assets/sky.webp';
  const palettes = [
    ['#315e70', '#427d87'],
    ['#42665d', '#608477'],
    ['#265574', '#4c8b9e'],
    ['#725f56', '#aa8469'],
    ['#414c73', '#666b90'],
    ['#476575', '#a09468'],
  ];
  function mount(canvas, session, isle, controls) {
    const ctx = canvas.getContext('2d'),
      s = session,
      colors = palettes[isle];
    let id = 0,
      disposed = false,
      last = 0,
      acc = 0,
      t = 0,
      drag = null,
      particles = [];
    let chain = 0,
      caption = null;
    let angle = controls.angle || 0,
      points = Wind.preview(s, angle),
      previewAngle = angle;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    function line(x, y, x2, y2, color, lw = 1) {
      ctx.strokeStyle = color;
      ctx.lineWidth = lw;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }
    function circle(x, y, r, fill, stroke, lw = 1) {
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      if (fill) {
        ctx.fillStyle = fill;
        ctx.fill();
      }
      if (stroke) {
        ctx.strokeStyle = stroke;
        ctx.lineWidth = lw;
        ctx.stroke();
      }
    }
    function poly(pts, fill, stroke) {
      ctx.beginPath();
      ctx.moveTo(...pts[0]);
      pts.slice(1).forEach((p) => ctx.lineTo(...p));
      ctx.closePath();
      if (fill) {
        ctx.fillStyle = fill;
        ctx.fill();
      }
      if (stroke) {
        ctx.strokeStyle = stroke;
        ctx.lineWidth = 1.1;
        ctx.stroke();
      }
    }
    function light(l, i) {
      const { x, y, hp } = l;
      if (!hp) {
        circle(x, y, 8, '#cceecc40', '#f5e7a1a0');
        circle(x, y, 3, '#fff5bc');
        return;
      }
      const shell = hp > 1,
        hi = shell ? '#bcf6ff' : '#fff5b2',
        mid = shell ? '#63cfe9' : '#ffcf65',
        dark = shell ? '#398dac' : '#d88735';
      ctx.save();
      ctx.shadowColor = mid;
      ctx.shadowBlur = reduced ? 7 : 9 + 3 * Math.sin(t * 2 + i);
      circle(x, y, 18, null, shell ? '#bbe9ff75' : '#ffe7a766', 1);
      ctx.translate(x, y);
      poly(
        [
          [0, -14],
          [10, -3],
          [8, 7],
          [0, 14],
          [-8, 7],
          [-10, -3],
        ],
        mid,
        hi,
      );
      poly(
        [
          [0, -14],
          [-10, -3],
          [-2, -2],
        ],
        hi,
      );
      poly(
        [
          [-2, -2],
          [10, -3],
          [0, 14],
        ],
        dark,
      );
      line(0, -13, -2, -2, hi);
      line(-2, -2, 0, 13, hi);
      ctx.restore();
      if (shell) {
        line(x - 4, y + 20, x - 1, y + 20, hi, 2);
        line(x + 1, y + 20, x + 4, y + 20, hi, 2);
      }
    }
    function draw() {
      const dpr = Math.min(2, devicePixelRatio || 1);
      if (canvas.width !== 400 * dpr || canvas.height !== 440 * dpr) {
        canvas.width = 400 * dpr;
        canvas.height = 440 * dpr;
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const grad = ctx.createLinearGradient(0, 0, 400, 440);
      grad.addColorStop(0, colors[0]);
      grad.addColorStop(1, colors[1]);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 400, 440);
      if (bg.complete && bg.naturalWidth) {
        ctx.globalAlpha = 0.13;
        ctx.drawImage(
          bg,
          bg.naturalWidth * 0.36,
          0,
          bg.naturalWidth * 0.52,
          bg.naturalHeight,
          0,
          0,
          400,
          440,
        );
        ctx.globalAlpha = 1;
      }
      for (let x = 20; x < 400; x += 30) line(x, 0, x, 440, '#faf5d516', 0.6);
      for (let y = 20; y < 440; y += 30) line(0, y, 400, y, '#faf5d516', 0.6);
      ctx.strokeStyle = '#f8e9bc55';
      ctx.lineWidth = 1;
      ctx.strokeRect(5, 5, 390, 430);
      ctx.fillStyle = '#f2ecd099';
      ctx.font = '8px Georgia';
      ctx.textAlign = 'left';
      ctx.fillText('W I N D   C H A R T   /   ' + String(isle + 1).padStart(2, '0'), 16, 20);
      ctx.save();
      ctx.setLineDash([2, 7]);
      circle(200, 410, 67, null, '#e8e3c75c');
      circle(200, 410, 48, null, '#e8e3c775');
      ctx.restore();
      for (const [x, y, r] of s.course.reefs) {
        circle(x, y + 3, r + 1, '#203c4e80');
        circle(x, y, r, '#708985', '#c4d4b9', 2);
        poly(
          [
            [x - r * 0.84, y],
            [x - r * 0.45, y - r * 0.72],
            [x + r * 0.38, y - r * 0.68],
            [x + r * 0.85, y - 0.1 * r],
            [x + r * 0.35, y + r * 0.63],
            [x - r * 0.42, y + r * 0.54],
          ],
          '#587474',
          '#9bb0a1',
        );
        poly(
          [
            [x - r * 0.84, y],
            [x - r * 0.45, y - r * 0.72],
            [x + r * 0.38, y - r * 0.68],
            [x, y + 0.04 * r],
          ],
          '#92a79a',
        );
        poly(
          [
            [x - r * 0.27, y + 0.14 * r],
            [x, y - 0.27 * r],
            [x + 0.29 * r, y + 0.12 * r],
            [x, y],
          ],
          '#d6cbb0',
        );
      }
      for (const [x, y] of s.course.gates) {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(reduced ? 0 : t * 0.65);
        circle(0, 0, 18, '#a6a0fe38', '#e5d3ff', 2);
        circle(0, 0, 13, null, '#cfb8e8');
        for (let j = 0; j < 3; j++) {
          ctx.rotate((Math.PI * 2) / 3);
          poly(
            [
              [0, -20],
              [4, -14],
              [-3, -16],
            ],
            '#f5e4ff',
          );
        }
        ctx.restore();
      }
      s.lights.forEach(light);
      if (!s.shots.length && s.lit < s.lights.length) {
        if (previewAngle !== angle) {
          points = Wind.preview(s, angle);
          previewAngle = angle;
        }
        ctx.save();
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#fff4b9d9';
        ctx.setLineDash([3, 6]);
        ctx.beginPath();
        let pen = false;
        for (const p of points) {
          if (!p) {
            pen = false;
            continue;
          }
          if (!pen) {
            ctx.moveTo(...p);
            pen = true;
          } else ctx.lineTo(...p);
        }
        ctx.stroke();
        ctx.restore();
      }
      ctx.save();
      ctx.translate(200, 410);
      circle(0, 0, 20, '#213f51', '#e8d59f', 2);
      circle(0, 0, 15, null, '#b89e65');
      ctx.rotate(angle);
      poly(
        [
          [0, -29],
          [7, 1],
          [0, -2],
          [-7, 1],
        ],
        '#ffdb81',
        '#ffefbd',
      );
      poly(
        [
          [0, 14],
          [4, 2],
          [0, -2],
          [-4, 2],
        ],
        '#7cbec3',
      );
      circle(0, 0, 4, '#ffefc8');
      ctx.restore();
      for (const p of s.shots) {
        ctx.lineCap = 'round';
        for (let j = 1; j < p.trail.length; j++) {
          line(
            ...p.trail[j - 1],
            ...p.trail[j],
            'rgba(255,233,150,' + (j / p.trail.length) * 0.8 + ')',
            1 + j / 2,
          );
        }
        ctx.save();
        ctx.shadowColor = '#ffedaf';
        ctx.shadowBlur = 12;
        circle(p.x, p.y, 5, '#fffbd7', '#fff7ad');
        ctx.restore();
      }
      for (const f of particles) {
        let k = f.life / 0.5;
        ctx.globalAlpha = Math.min(1, k);
        const big = f.type === 'burst';
        circle(
          f.x,
          f.y,
          (big ? f.r : 21) * (1 - k) + 3,
          null,
          big ? '#c6f8e9' : '#ffe2a0',
          big ? 3 : 2,
        );
        if (!reduced && !big)
          for (let j = 0; j < 5; j++) {
            const a = j * 1.256 + f.x,
              dist = (1 - k) * 24 + 4;
            circle(f.x + Math.cos(a) * dist, f.y + Math.sin(a) * dist, 1.8, '#ffedaf');
          }
      }
      ctx.globalAlpha = 1;
      if (caption && t < caption.until) {
        const fade = Math.min(1, (caption.until - t) * 4);
        ctx.save();
        ctx.globalAlpha = fade;
        ctx.textAlign = 'center';
        ctx.font = 'bold 16px serif';
        const py = Math.max(37, caption.y - 24 - (0.8 - (caption.until - t)) * 9);
        ctx.lineWidth = 3;
        ctx.strokeStyle = '#385666';
        ctx.strokeText(caption.text, caption.x, py);
        ctx.fillStyle = '#fff1a9';
        ctx.fillText(caption.text, caption.x, py);
        ctx.restore();
      }
      if (s.lit === s.lights.length) {
        ctx.fillStyle = '#153746da';
        ctx.fillRect(52, 181, 296, 69);
        ctx.textAlign = 'center';
        ctx.font = '10px Georgia';
        ctx.fillStyle = '#ead39b';
        ctx.fillText('R O U T E   C O M P L E T E', 200, 203);
        ctx.font = 'bold 23px serif';
        ctx.fillStyle = '#fff8dc';
        ctx.fillText('航路、点灯！', 200, 234);
      }
    }
    function consume() {
      for (const e of s.events) {
        if (e.type === 'light') {
          chain++;
          if (chain >= 2)
            caption = {
              x: Wind.clamp(e.x, 43, 357),
              y: e.y,
              text: chain + ' 連灯！',
              until: t + 0.8,
            };
        }
        Score.fx(e.type, chain);
        if (e.type !== 'bounce') particles.push({ ...e, life: 0.5 });
      }
      s.events.length = 0;
    }
    function frame(ms) {
      if (disposed) return;
      const dt = last ? Math.min(0.075, (ms - last) / 1000) : 0;
      last = ms;
      if (!document.hidden && !controls.paused()) {
        t += dt;
        particles = particles.filter((f) => (f.life -= dt) > 0);
        const active = s.shots.length > 0;
        if (active) {
          acc += dt;
          while (acc >= Wind.step && s.shots.length) {
            Wind.tick(s);
            acc -= Wind.step;
          }
          consume();
          controls.update(s);
          if (!s.shots.length) {
            acc = 0;
            controls.settled(s, angle);
          }
        }
      }
      if (!disposed) {
        draw();
        id = requestAnimationFrame(frame);
      }
    }
    function steer(a) {
      if (!s.shots.length) {
        angle = Wind.clamp(a, -Wind.limit, Wind.limit);
      }
    }
    function aim(e) {
      const r = canvas.getBoundingClientRect(),
        x = ((e.clientX - r.left) * 400) / r.width,
        y = ((e.clientY - r.top) * 440) / r.height;
      steer(Math.atan2(x - 200, Math.max(12, 410 - y)));
    }
    function fire() {
      if (controls.paused() || disposed) return;
      if (s.shots.length) {
        if (Wind.burst(s)) {
          consume();
          controls.update(s);
        }
        return;
      }
      if (Wind.launch(s, angle)) {
        chain = 0;
        caption = null;
        Score.fx('launch');
        controls.update(s);
      }
    }
    canvas.onpointerdown = (e) => {
      if (controls.paused() || drag !== null || e.button !== 0) return;
      if (s.shots.length) {
        fire();
        return;
      }
      drag = e.pointerId;
      canvas.setPointerCapture(drag);
      aim(e);
    };
    canvas.onpointermove = (e) => {
      if (e.pointerId === drag) aim(e);
    };
    canvas.onpointerup = (e) => {
      if (e.pointerId !== drag) return;
      drag = null;
      aim(e);
      fire();
    };
    canvas.onpointercancel = canvas.onlostpointercapture = () => {
      drag = null;
    };
    function key(e) {
      if (controls.paused() || e.altKey || e.ctrlKey || e.metaKey) return;
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        e.preventDefault();
        steer(angle + (e.key === 'ArrowRight' ? 1 : -1) * 0.045);
      }
      if (e.code === 'Space' && (e.target === document.body || e.target === canvas)) {
        e.preventDefault();
        if (!e.repeat) fire();
      }
    }
    window.addEventListener('keydown', key);
    id = requestAnimationFrame(frame);
    return {
      fire,
      adjust: (d) => steer(angle + d),
      stop: () => {
        disposed = true;
        cancelAnimationFrame(id);
        window.removeEventListener('keydown', key);
      },
    };
  }
  return { mount };
})();

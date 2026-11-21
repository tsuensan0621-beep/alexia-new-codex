'use strict';
const UIArt = (() => {
  const paths = {
    map: 'M2 5 L8 2.8 15 5.3 22 2.8 V19 L15 21.4 8 19 2 21.4 Z M8 3 V19 M15 5.3 V21.4',
    book: 'M12 5 Q7 2 2 4 V20 Q7 18 12 21 Q17 18 22 20 V4 Q17 2 12 5 V21',
    mute: 'M3 9 H7 L12.5 4 V20 L7 15 H3 Z M16.5 9 L22 15 M22 9 L16.5 15',
    volume: 'M2 9 H6 L12 4 V20 L6 15 H2 Z M16 8 Q20 12 16 16 M19 4 Q26 12 19 20',
    compass: 'M22 12 A10 10 0 1 1 2 12 A10 10 0 1 1 22 12 Z M16.5 7.5 L13 13 7.5 16.5 10.7 10.6 Z',
    arrow: 'M4 12 H20 M14 6 L20 12 14 18',
    back: 'M20 12 H4 M10 6 L4 12 10 18',
    help: 'M22 12 A10 10 0 1 1 2 12 A10 10 0 1 1 22 12 Z M8.6 9 Q8.5 5.2 12.5 5.8 Q17.5 6.4 14 10.4 Q11.6 12.1 11.6 14.6 M11.6 17.3 V17.6',
    flag: 'M5 22 V3 Q9 0 14 4 Q17 6 21 3 V14 Q18 17 14 14 Q10 10 5 13',
    lock: 'M5 10 H19 V21 H5 Z M8 10 V7 A4 4 0 1 1 16 7 V10 M12 14 V17',
    save: 'M3 3 H17 L21 7 V21 H3 Z M7 3 V9 H17 V3 M7 21 V14 H17 V21',
    wind: 'M2 8 H13 C20 8 19 0 14 3 M4 12 H18 C24 12 24 6 21 6 M2 16 H12 C18 16 17 23 13 21',
    gem: 'M12 2 L20 10 12 22 4 10 Z M4 10 H20 M12 2 L9 10 12 22',
    split: 'M12 22 V15 L4 6 M4 12 V6 H10 M12 15 L20 6 M14 6 H20 V12',
    ring: 'M20 12 A8 8 0 1 1 4 12 A8 8 0 1 1 20 12 Z M15.5 12 A3.5 3.5 0 1 1 8.5 12 A3.5 3.5 0 1 1 15.5 12 Z',
    star: 'M12 2 L15 8.5 22 10 17 15.2 18.2 22 12 18.4 5.8 22 7 15.2 2 10 9 8.5 Z',
    target: 'M20 12 A8 8 0 1 1 4 12 A8 8 0 1 1 20 12 Z M12 1 V6 M12 18 V23 M1 12 H6 M18 12 H23',
    feather: 'M3 21 L16 8 M7 17 Q4 7 16 3 Q22 1 21 5 Q20 15 7 17',
    check: 'M3 12 L9 18 21 5',
  };
  function icons(scope = document) {
    scope.querySelectorAll('i[data-icon]').forEach((el) => {
      if (el.firstChild) return;
      const c = document.createElement('canvas');
      c.width = c.height = 64;
      c.setAttribute('aria-hidden', 'true');
      el.append(c);
      const ctx = c.getContext('2d');
      ctx.scale(64 / 24, 64 / 24);
      ctx.strokeStyle = getComputedStyle(el).color;
      ctx.lineWidth = 1.65;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke(new Path2D(paths[el.dataset.icon] || paths.compass));
    });
  }
  const pos = [
    [9, 60],
    [26, 41],
    [42, 60],
    [58, 40],
    [74, 60],
    [90, 44],
  ];
  function chart() {
    const c = document.querySelector('#chartLines'),
      w = c.clientWidth,
      h = c.clientHeight;
    if (!w || !h) return;
    const scale = Math.min(2, devicePixelRatio || 1);
    c.width = w * scale;
    c.height = h * scale;
    const ctx = c.getContext('2d');
    ctx.scale(scale, scale);
    ctx.strokeStyle = '#8f84551e';
    ctx.lineWidth = 0.7;
    for (let x = 0; x < w; x += 37) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y < h; y += 37) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }
    // Contour lines on the edges of the chart.
    for (const [cx, cy, r] of [
      [-0.04, 0.13, 90],
      [0.33, 1.16, 70],
      [0.75, -0.23, 79],
      [1.04, 0.96, 81],
      [0.48, -0.42, 92],
    ]) {
      for (let line = 0; line < 6; line++) {
        ctx.beginPath();
        for (let j = 0; j <= 180; j++) {
          let a = (j * Math.PI) / 90;
          let rr = (r + line * 6) * (1 + 0.13 * Math.sin(a * 5 + 0.5) + 0.09 * Math.cos(a * 3));
          let x = cx * w + rr * 1.8 * Math.cos(a),
            y = cy * h + rr * Math.sin(a);
          if (j) ctx.lineTo(x, y);
          else ctx.moveTo(x, y);
        }
        ctx.strokeStyle = '#8c8c6138';
        ctx.stroke();
      }
    }
    ctx.strokeStyle = '#968153';
    ctx.lineWidth = 2.2;
    ctx.setLineDash([3, 6]);
    ctx.lineCap = 'round';
    const pts = pos.map(([x, y]) => [(x * w) / 100, ((y - 5) * h) / 100]);
    ctx.beginPath();
    ctx.moveTo(...pts[0]);
    for (let i = 1; i < pts.length; i++) {
      const [x, y] = pts[i],
        [px, py] = pts[i - 1];
      const mid = (x + px) / 2;
      ctx.bezierCurveTo(mid, py + 15, mid, y + 13, x, y);
    }
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = '#897c584f';
    ctx.font = 'italic 11px Georgia';
    ctx.fillText('Mare Aureum', w * 0.42, 28);
    ctx.fillText('Zephyr Passage', w * 0.65, h - 18);
  }
  return { icons, pos, chart };
})();
const Score = (() => {
  let ac,
    timer,
    beat = 0,
    active = false,
    region = -1,
    play = false;
  const notes = [0, 2, 4, 7, 9, 12, 14, 16],
    tune = [
      2, -1, 3, 4, 2, 1, -1, 0, 1, -1, 2, 3, 5, -1, 4, 3, 2, -1, 0, 1, 2, 4, -1, 3, 1, 0, -1, 1, 3,
      -1, 2, -1,
    ];
  function tone(midi, sec, vol, wave = 'sine', delay = 0) {
    if (!ac || !active || ac.state !== 'running') return;
    const osc = ac.createOscillator(),
      gain = ac.createGain(),
      t = ac.currentTime + delay;
    osc.type = wave;
    osc.frequency.value = 440 * 2 ** ((midi - 69) / 12);
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(vol, t + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + sec);
    osc.connect(gain);
    gain.connect(ac.destination);
    osc.start(t);
    osc.stop(t + sec + 0.02);
  }
  function music() {
    if (document.hidden || !active) return;
    const shift = [0, 2, 5, 0, 7, 2][Math.max(0, region)] || 0;
    const k = beat++ % 32,
      n = tune[k],
      base = 60 + shift;
    if (n >= 0) tone(base + notes[n], play ? 0.39 : 0.56, 0.033, 'triangle');
    const root = [0, -5, -3, -7][Math.floor(k / 8)];
    if (k % 4 === 0) tone(base - 12 + root, 0.9, 0.037);
    if (k % 4 === 2) tone(base + root + 7, 0.53, 0.019);
  }
  function enable(value) {
    active = value;
    clearInterval(timer);
    if (!value) {
      if (ac) ac.suspend().catch(() => {});
      return;
    }
    try {
      ac = ac || new (window.AudioContext || window.webkitAudioContext)();
      ac.resume().catch(() => {});
      timer = setInterval(music, 280);
      music();
    } catch {
      active = false;
    }
  }
  function fx(name, n = 0) {
    const keys = {
      launch: [71, 78],
      light: [76 + (n % 5) * 2, 83 + (n % 5) * 2],
      bounce: [62],
      gate: [74, 81],
      crack: [69, 74],
      split: [80, 87],
      burst: [64, 71, 78],
      win: [72, 76, 79, 84],
    };
    (keys[name] || []).forEach((pitch, i) =>
      tone(
        pitch,
        name === 'bounce' ? 0.09 : 0.34,
        name === 'bounce' ? 0.022 : 0.065,
        'sine',
        i * 0.065,
      ),
    );
  }
  return {
    enable,
    fx,
    scene: (i, flying) => {
      region = i;
      play = flying;
    },
  };
})();

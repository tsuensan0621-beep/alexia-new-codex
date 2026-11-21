'use strict';
(() => {
  const $ = (sel) => document.querySelector(sel),
    { islands, courses } = AtlasData;
  const isleArt = [
    'assets/isle-0.webp',
    'assets/isle-1.webp',
    'assets/isle-2.webp',
    'assets/isle-3.webp',
    'assets/isle-4.webp',
    'assets/isle-5.webp',
  ];
  const num = (n) => String(n).padStart(2, '0'),
    ic = (name) => '<i aria-hidden="true" data-icon="' + name + '"></i>';
  const key = 'alexia.wind-atlas.v1',
    blank = () => ({ best: Array(18).fill(null), rest: null, sound: false });
  let rec = blank(),
    storageOK = true,
    view = 'home',
    board = null,
    round = null,
    stage = 0,
    lastLit = 0,
    closeAction = null;
  try {
    const raw = JSON.parse(localStorage.getItem(key) || 'null');
    if (raw && Array.isArray(raw.best)) {
      let gap = false;
      rec.best = rec.best.map((_, i) => {
        const n = raw.best[i];
        if (!Number.isSafeInteger(n) || n <= 0) gap = true;
        return gap ? null : n;
      });
      rec.sound = raw.sound === true;
      rec.rest = raw.rest;
    }
  } catch {
    rec = blank();
  }
  const done = () => rec.best.filter(Boolean).length,
    power = () => Math.min(5, Math.floor(done() / 3)),
    next = () => Math.min(17, done()),
    unlocked = (i) => i * 3 <= next();
  const marks = (i) => (rec.best[i] ? Wind.stars(rec.best[i], courses[i].par) : 0);
  const total = () => rec.best.reduce((sum, _, i) => sum + marks(i), 0),
    stars = (n) => '★'.repeat(n) + '☆'.repeat(3 - n);
  function save() {
    try {
      localStorage.setItem(key, JSON.stringify(rec));
      storageOK = true;
    } catch {
      storageOK = false;
    }
    $('#saveStatus').innerHTML =
      ic('save') + (storageOK ? '航海記録は自動保存されます' : 'この端末では一時記録で進行中');
    UIArt.icons($('footer'));
  }
  function soundUI() {
    $('#sound').innerHTML =
      ic(rec.sound ? 'volume' : 'mute') + '<span>音声 ' + (rec.sound ? 'ON' : 'OFF') + '</span>';
    $('#sound').setAttribute('aria-pressed', String(rec.sound));
    $('#sound').setAttribute('aria-label', 'サウンドを' + (rec.sound ? 'オフ' : 'オン'));
    UIArt.icons($('#sound'));
  }
  $('#sound').onclick = () => {
    rec.sound = !rec.sound;
    Score.enable(rec.sound);
    save();
    soundUI();
  };
  if (rec.sound) {
    const wake = () => {
      if (rec.sound) Score.enable(true);
    };
    document.addEventListener('pointerdown', wake, { once: true });
  }
  function stop() {
    if (board) board.stop();
    board = null;
    round = null;
  }
  function page(id) {
    view = id;
    for (const v of ['home', 'journal', 'voyage']) $('#' + v).hidden = v !== id;
    $('#mapNav').classList.toggle('active', id !== 'journal');
    $('#logNav').classList.toggle('active', id === 'journal');
    window.scrollTo(0, 0);
  }
  function closeDialog(run = false) {
    const cb = closeAction;
    closeAction = null;
    if ($('#dialog').open) $('#dialog').close();
    if (run && cb) cb();
  }
  const btn = (id, label, icon = 'arrow') =>
    '<button class="primary" id="' + id + '">' + label + ic(icon) + '</button>';
  const back = '<button class="back" id="toMap">' + ic('back') + '航路図へ</button>';
  function modal(html, onClose = null) {
    closeDialog();
    closeAction = onClose;
    $('#dialogBody').innerHTML = '<button class="close" aria-label="閉じる">×</button>' + html;
    const heading = $('#dialogBody h2');
    if (heading) {
      heading.id = 'modalTitle';
      $('#dialog').setAttribute('aria-labelledby', 'modalTitle');
    }
    $('#dialog').showModal();
    $('.close').onclick = () => closeDialog(true);
    UIArt.icons($('#dialogBody'));
  }
  $('#dialog').addEventListener('cancel', (e) => {
    e.preventDefault();
    closeDialog(true);
  });
  function home(scroll = false) {
    closeDialog();
    stop();
    Score.scene(-1, false);
    page('home');
    $('#start span').textContent =
      done() === 18 ? '航海手帳を開く' : done() || rec.rest ? '冒険をつづける' : '冒険をはじめる';
    $('#progress').innerHTML =
      ic('flag') +
      '到達した島 <strong>' +
      num(Math.min(6, Math.floor(done() / 3) + 1)) +
      ' / 06</strong>';
    const chart = $('#chart');
    chart.querySelectorAll('button').forEach((e) => e.remove());
    islands.forEach((v, i) => {
      const b = document.createElement('button'),
        [x, y] = UIArt.pos[i],
        open = unlocked(i);
      b.className = 'island ' + (!open ? 'locked' : i === Math.floor(next() / 3) ? 'current' : '');
      b.style.left = x + '%';
      b.style.top = y + '%';
      b.innerHTML =
        '<img src="' +
        isleArt[i] +
        '" alt="" draggable="false"><span class="isle-num">ISLE ' +
        num(i + 1) +
        '</span><strong>' +
        ic(open ? (rec.best[i * 3 + 2] ? 'check' : 'flag') : 'lock') +
        v.name +
        '</strong>';
      b.setAttribute('aria-label', v.name + '、' + (open ? '探索する' : '未踏'));
      b.onclick = () => brief(i);
      chart.append(b);
    });
    UIArt.icons();
    UIArt.chart();
    if (scroll) {
      $('#route').scrollIntoView();
      const b = $('.island.current');
      if (b) $('.mapscroll').scrollLeft = b.offsetLeft - $('.mapscroll').clientWidth / 2;
    }
  }
  function guide() {
    modal(
      '<div class="eyebrow">FIELD GUIDE</div><h2>風の放ち方</h2>' +
        [
          [
            'target',
            '狙って、離す',
            '盤面の行き先に指を置き、点線で風向きを確かめます。指を離すと発射。',
          ],
          [
            'gem',
            '金色の灯石をともす',
            '風は壁や岩に当たると反射します。灯石を貫く向きを見つけ、ひと息でつなぎましょう。',
          ],
          [
            'star',
            '少ない手数で風印を集める',
            '目標手数以内なら風印は三つ。何投でも続けられます。航海手帳から再挑戦できます。',
          ],
        ]
          .map(
            ([ico, title, txt]) =>
              '<div class="hint-step">' +
              ic(ico) +
              '<div><b>' +
              title +
              '</b>' +
              txt +
              '</div></div>',
          )
          .join('') +
        '<div class="note">PC はクリック、または ← → で照準、Space で発射。スマホでも盤面下の矢印で微調整できます。</div>' +
        btn('guideOK', 'わかった', 'check'),
    );
    $('#guideOK').onclick = () => closeDialog();
  }
  function brief(i) {
    const v = islands[i],
      open = unlocked(i),
      first = i * 3,
      current = Math.max(first, Math.min(first + 2, next()));
    let body =
      '<img class="brief-art" src="' +
      isleArt[i] +
      '" alt=""><div class="eyebrow">ISLE ' +
      num(i + 1) +
      '　/　' +
      v.en.toUpperCase() +
      '</div><h2>' +
      v.name +
      '</h2>';
    if (!open) {
      modal(
        body +
          '<p>' +
          islands[i - 1].name +
          'の三つの航路を灯すと、この島への風が開きます。</p>' +
          btn('guideOK', '航路図に戻る', 'back'),
      );
      $('#guideOK').onclick = () => home(true);
      return;
    }
    body += '<p>' + v.intro + '</p>';
    body +=
      '<div class="course-list">' +
      courses
        .slice(first, first + 3)
        .map(
          (c, j) =>
            '<button class="rowbtn" data-stage="' +
            (first + j) +
            '" ' +
            (first + j > next() ? 'disabled' : '') +
            '><span>' +
            num(j + 1) +
            '　' +
            c.name +
            '</span><span class="stars">' +
            (marks(first + j)
              ? stars(marks(first + j))
              : first + j > next()
                ? ic('lock')
                : ic('compass')) +
            '</span></button>',
        )
        .join('') +
      '</div>';
    modal(
      body +
        btn(
          'depart',
          rec.rest?.index === current ? '航路を再開する' : 'この島へ出航する',
          'compass',
        ),
    );
    $('#depart').onclick = () => startRound(current);
    $('#dialogBody')
      .querySelectorAll('[data-stage]')
      .forEach((b) => (b.onclick = () => startRound(+b.dataset.stage)));
  }
  function journal() {
    closeDialog();
    stop();
    Score.scene(-1, false);
    page('journal');
    $('#journal').innerHTML =
      back +
      '<div class="journal-head"><div><div class="eyebrow">VOYAGE JOURNAL</div><h2>航海手帳</h2></div><div class="pill">' +
      ic('star') +
      '風印 ' +
      total() +
      ' / 54</div></div><div class="journal-grid">' +
      islands
        .map((v, i) => {
          const clear = !!rec.best[i * 3 + 2];
          return (
            '<button class="entry" data-isle="' +
            i +
            '"><img src="' +
            isleArt[i] +
            '" alt=""><div class="kicker">ISLE ' +
            num(i + 1) +
            '</div><h3>' +
            v.name +
            '</h3><span class="chip">' +
            ic(clear ? 'check' : unlocked(i) ? 'compass' : 'lock') +
            (clear ? '踏破' : unlocked(i) ? '探索中' : '未踏') +
            '</span><p>' +
            (clear ? v.outro : unlocked(i) ? v.intro : v.place) +
            '</p>' +
            (clear ? '<span class="power">' + v.power + '</span><p>' + v.ability + '</p>' : '') +
            '</button>'
          );
        })
        .join('') +
      '</div>' +
      (done() === 18 ? btn('seeEnd', '旅の結末を読む', 'book') : '');
    $('#toMap').onclick = () => home(true);
    $('#journal')
      .querySelectorAll('[data-isle]')
      .forEach((b) => (b.onclick = () => brief(+b.dataset.isle)));
    if ($('#seeEnd')) $('#seeEnd').onclick = ending;
    UIArt.icons($('#journal'));
  }
  function checkpoint(s, a) {
    rec.rest = { index: stage, hp: s.lights.map((l) => l.hp), turn: s.turn, angle: a };
    save();
  }
  function restore(s, r) {
    if (
      !r ||
      r.index !== stage ||
      !Number.isSafeInteger(r.turn) ||
      r.turn < 0 ||
      !Array.isArray(r.hp) ||
      r.hp.length !== s.lights.length ||
      !r.hp.some((h) => h > 0) ||
      !r.hp.every((h, i) => Number.isInteger(h) && h >= 0 && h <= s.lights[i].max)
    )
      return 0;
    s.turn = r.turn;
    s.lights.forEach((l, i) => (l.hp = r.hp[i]));
    s.lit = s.lights.filter((l) => !l.hp).length;
    return Number.isFinite(r.angle) ? Wind.clamp(r.angle, -Wind.limit, Wind.limit) : 0;
  }
  function startRound(i, fresh = false) {
    stop();
    closeDialog();
    page('voyage');
    stage = i;
    const region = Math.floor(i / 3),
      v = islands[region],
      c = courses[i],
      s = Wind.create(c, power());
    round = s;
    const a = fresh ? 0 : restore(s, rec.rest);
    lastLit = s.lit;
    checkpoint(s, a);
    Score.scene(region, true);
    const tip =
      region === 0
        ? '灯石を一直線に重ねて狙おう。風は壁と岩で跳ね返る。'
        : region === 1
          ? '最初の灯石で風が二手に分かれる。手前の灯石を分岐点にしよう。'
          : region === 2
            ? '青い灯石は二重。風の近くで「風の輪」を使うと、まとめて届く。'
            : region === 3
              ? '対になった紫の門は風の抜け道。入ったときの向きで、もう一方から飛び出す。'
              : region === 4
                ? '広がった風の輪を、星の集まる場所で開こう。'
                : '三つ羽になった風を広げ、六つの島の灯をひとつにつなごう。';
    $('#voyage').innerHTML =
      back +
      '<div class="subhead"><div class="eyebrow">ISLE ' +
      num(region + 1) +
      '　 /　 ' +
      v.name +
      '</div><h2>' +
      num((i % 3) + 1) +
      '　' +
      c.name +
      '</h2></div><div class="play-layout"><section class="game-card"><div class="boardbar"><b id="counter"></b><span class="metric">' +
      ic('star') +
      '目標 ' +
      c.par +
      ' 手　<span id="turn"></span></span></div><canvas id="board" tabindex="0" aria-label="風の盤面。指で狙って離すと発射。左右キーで照準、スペースで発射。"></canvas><div class="board-bottom"><button id="left" class="outline steer" aria-label="左に照準">‹</button><button class="primary" id="fire"></button><button id="right" class="outline steer" aria-label="右に照準">›</button></div><p class="instruction" id="instruction"></p></section><aside class="aside-card"><div class="eyebrow">NAVIGATOR’S NOTE</div><div class="side-title">' +
      ic('feather') +
      '風読みの手帳</div><img src="' +
      isleArt[region] +
      '" alt=""><p>' +
      tip +
      '</p><div class="note"><strong>この航路の目標</strong><br>すべての灯石に風を届ける。</div><div class="chips" style="margin-top:12px">' +
      islands
        .slice(0, power())
        .map((z) => '<span class="chip">' + ic(z.symbol) + z.power + '</span>')
        .join('') +
      '</div><div class="tools"><button class="outline" id="roundHelp">遊び方</button><button class="outline" id="retry">やり直す</button></div></aside></div>';
    $('#toMap').onclick = () => home(true);
    $('#roundHelp').onclick = guide;
    $('#retry').onclick = () => {
      modal(
        '<div class="eyebrow">RECHART</div><h2>この航路をやり直す？</h2><p>この航路の手数と灯石を最初に戻します。獲得した風印は手帳に残ります。</p>' +
          btn('confirmRetry', '最初から風を放つ'),
      );
      $('#confirmRetry').onclick = () => startRound(i, true);
    };
    UIArt.icons($('#voyage'));
    let lastState = '';
    function update() {
      const active = s.shots.length > 0,
        canBurst = active && s.power >= 2 && !s.burstUsed;
      const signature = [s.lit, s.turn, active, canBurst].join('/');
      if (signature === lastState) return;
      lastState = signature;
      $('#counter').textContent = '灯石 ' + s.lit + ' / ' + s.lights.length;
      $('#turn').textContent = '現在 ' + s.turn + ' 手';
      $('#fire').textContent = active
        ? canBurst
          ? '◎　風の輪をひらく'
          : '風が飛行中…'
        : '✧　風を放つ';
      $('#fire').disabled = active && !canBurst;
      $('#left').disabled = $('#right').disabled = active;
      $('#instruction').textContent = active
        ? canBurst
          ? '風が灯石に近づいたら、盤面をもう一度タップ。'
          : '風の行き先を見届けよう。'
        : '盤面を押して狙い、離して発射。';
    }
    board = BoardView.mount($('#board'), s, region, {
      angle: a,
      paused: () => $('#dialog').open,
      update,
      settled: (_, aim) => {
        if (s.lit === s.lights.length) {
          finish(s);
          return;
        }
        checkpoint(s, aim);
        if (lastLit === s.lit)
          $('#instruction').textContent = '角度を少し変えて、残った灯石を直接狙おう。';
        lastLit = s.lit;
      },
    });
    // Save the exact settled aim along with the lamps, never a partially simulated shot.
    const mountedBoard = board;
    $('#fire').onclick = () => mountedBoard.fire();
    $('#left').onclick = () => mountedBoard.adjust(-0.045);
    $('#right').onclick = () => mountedBoard.adjust(0.045);
    update();
  }
  function finish(s) {
    const i = stage,
      previous = rec.best[i],
      region = Math.floor(i / 3),
      first = !previous;
    rec.best[i] = previous ? Math.min(previous, s.turn) : s.turn;
    rec.rest = null;
    save();
    $('#fire').disabled = true;
    $('#fire').textContent = '航路、点灯！';
    Score.fx('win');
    Score.scene(region, false);
    const chapter = i % 3 === 2,
      v = islands[region];
    let html =
      '<div class="center"><div class="kicker">ROUTE COMPLETE</div><h2>' +
      s.course.name +
      '、点灯！</h2><div class="bigstars" aria-label="風印' +
      Wind.stars(s.turn, s.course.par) +
      'つ">' +
      stars(Wind.stars(s.turn, s.course.par)) +
      '</div><p>今回 ' +
      s.turn +
      ' 手　／　自己ベスト ' +
      rec.best[i] +
      ' 手</p></div>';
    if (chapter)
      html +=
        '<div class="dispatch"><span class="portrait"></span><p class="result-quote">' +
        v.outro +
        '</p></div><div class="note"><b>' +
        (first ? '獲得　' : '記録　') +
        v.power +
        '</b><br>' +
        v.ability +
        '</div>';
    html +=
      btn('advance', i === 17 ? '旅の結末へ' : chapter ? '次の島を訪れる' : '次の航路へ') +
      '<div class="tools"><button id="again" class="help-link">もう一度</button><button id="returnMap" class="help-link">航路図へ</button></div>';
    window.setTimeout(() => {
      if (round !== s) return;
      board?.stop();
      board = null;
      modal(html, () => home(true));
      $('#advance').onclick = () => {
        if (i === 17) ending();
        else if (chapter) {
          home(true);
          brief(region + 1);
        } else startRound(i + 1);
      };
      $('#again').onclick = () => startRound(i, true);
      $('#returnMap').onclick = () => home(true);
    }, 700);
  }
  function ending() {
    modal(
      '<div class="ending center"><img src="assets/isle-5.webp" class="brief-art" alt=""><div class="kicker">END OF VOYAGE</div><h2>明日も、追い風。</h2><p>六つの灯台に見送られ、最初の定期船が空へすべり出す。羅針盤の針はもう、どの島を向いても金色だった。</p><p class="result-quote">「次の便は、私がお客さんね」<br>アレクシアは笑って、桟橋に腰をおろした。</p></div><div class="note center">全18航路 踏破　✦　風印 ' +
        total() +
        ' / 54</div>' +
        btn('readJournal', '航海手帳を開く', 'book'),
      journal,
    );
    $('#readJournal').onclick = journal;
  }
  $('#mapNav').onclick = () => home(true);
  $('.brand').onclick = (e) => {
    e.preventDefault();
    home();
  };
  $('#logNav').onclick = journal;
  $('#help').onclick = guide;
  $('#start').onclick = () => {
    if (done() === 18) journal();
    else if (rec.rest && rec.rest.index === next()) startRound(next());
    else brief(Math.floor(next() / 3));
  };
  new ResizeObserver(() => {
    if (view === 'home') UIArt.chart();
  }).observe($('#chart'));
  soundUI();
  home();
})();

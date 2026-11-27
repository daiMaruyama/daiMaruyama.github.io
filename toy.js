const motionPreference = matchMedia('(prefers-reduced-motion: reduce)');
const syncMotion = () => document.body.classList.toggle('still', motionPreference.matches);
syncMotion();
motionPreference.addEventListener('change', syncMotion);
const isStill = () => document.body.classList.contains('still');


// 演出A：寸劇の終わりからタイトルへ。見えたら1回流す。
// スキップはゲームと同じく、0.5秒の暗転から明けて、最後のコマ（タイトル）で止まる（TBTitleMenu::SkipStory）。
(() => {
    const film = document.querySelector('.story-film');
    if (!film) return;
    const video = film.querySelector('video');
    const black = film.querySelector('.story-blackout');
    const skip = film.querySelector('.story-skip');
    const replay = film.querySelector('.story-replay');
    const routes = document.querySelectorAll('#title-story .story-routes > div');
    let played = false;

    const route = i => routes.forEach((r, k) => r.classList.toggle('is-on', k === i));
    function state(name) {
        film.classList.toggle('is-playing', name === 'playing');
        film.classList.toggle('is-ended', name === 'ended');
        if (name === 'ended') replay.textContent = '寸劇をもう一度見る';
    }
    function play() {
        played = true;
        video.currentTime = 0;
        route(0);
        state('playing');
        video.play().catch(() => state('idle'));
    }
    video.addEventListener('ended', () => state('ended'));
    skip.addEventListener('click', () => {
        video.pause();
        route(1);
        state('ended');
        if (isStill()) return;
        // 途中で切れた画をそのまま見せず、黒から明ける。
        black.classList.remove('is-fading');
        black.classList.add('is-on');
        void black.offsetWidth;
        black.classList.add('is-fading');
        black.classList.remove('is-on');
    });
    replay.addEventListener('click', play);
    // 動きを減らす設定では自動では流さず、ボタンで流す。
    new IntersectionObserver(entries => {
        if (!played && entries.some(e => e.isIntersecting && e.intersectionRatio >= .5) && document.body.classList.contains('fx-a') && !isStill()) play();
    }, { threshold: .5 }).observe(film);
})();


// 演出B：リモコンでチャンネルを替える。0〜2は固定カメラ、3〜は箱の外のプレイヤー、映すものが無い番号は砂嵐（TBBoxTV.h）。
(() => {
    const set = document.querySelector('.tv-set');
    if (!set) return;
    const frame = set.querySelector('.tv-frame');
    const grain = set.querySelector('.tv-static');
    const ctx = grain.getContext('2d');
    // 砂嵐の粒は小さいキャンバスで作り、拡大して描く。画面の幅に約100粒。
    const seed = document.createElement('canvas');
    seed.width = 384;
    seed.height = 216;
    const seedCtx = seed.getContext('2d');
    const pixels = seedCtx.createImageData(seed.width, seed.height);
    const masks = [];
    const now = document.querySelector('.tv-now');
    const buttons = [...document.querySelectorAll('.tv-remote button')];
    // 撮影では、人間（3番）と外のおもちゃ（4番）がいて、5〜9番は誰もいない。
    const WATCHABLE = [0, 1, 2, 3, 4];
    const kind = n => n <= 2 ? '部屋の固定カメラ' : n === 3 ? '人間の視点' : n === 4 ? '箱の外のおもちゃの視点' : '誰もいない（砂嵐）';
    const NOISE = 120; // 切り替えの砂嵐。ゲームの NoiseSeconds（0.12秒）と同じ。
    let channel = Number(document.querySelector('.tv-remote [aria-pressed="true"]').dataset.ch), noiseUntil = 0, raf = 0, loaded = false;

    // 近づいたら、全チャンネルの写真と砂嵐を先に読んでおく（押した瞬間に替わるように）。
    function preload() {
        if (loaded) return;
        loaded = true;
        for (let n = 0; n < 10; n++) {
            const image = new Image();
            image.src = `../assets/toy-or-not/tv/ch${n}.jpg`;
            if (image.decode) image.decode().catch(() => {});
            masks[n] = new Image();
            masks[n].src = `../assets/toy-or-not/tv/mask${n}.png`;
        }
    }
    new IntersectionObserver((entries, observer) => {
        if (entries.some(e => e.isIntersecting)) { preload(); observer.disconnect(); }
    }, { rootMargin: '800px' }).observe(set);

    const empty = n => !WATCHABLE.includes(n);
    // 白黒の粒を描いて、そのチャンネルの画面の形で切り抜く（形の画像は撮った写真の差から作った）。
    function drawNoise() {
        const mask = masks[channel];
        if (!mask || !mask.complete || !mask.naturalWidth) return false;
        const d = pixels.data;
        for (let i = 0; i < d.length; i += 4) { const v = Math.random() * 255; d[i] = d[i + 1] = d[i + 2] = v; d[i + 3] = 255; }
        seedCtx.putImageData(pixels, 0, 0);
        ctx.globalCompositeOperation = 'copy';
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(seed, 0, 0, grain.width, grain.height);
        ctx.globalCompositeOperation = 'destination-in';
        ctx.imageSmoothingEnabled = true;
        ctx.drawImage(mask, 0, 0, grain.width, grain.height);
        return true;
    }
    function loop(t) {
        const on = empty(channel) || t < noiseUntil;
        grain.classList.toggle('is-on', on && drawNoise());
        raf = on && !isStill() ? requestAnimationFrame(loop) : 0;
    }
    function tune(n) {
        channel = (n + 10) % 10;
        buttons.forEach(b => b.setAttribute('aria-pressed', String(b.dataset.ch !== undefined && +b.dataset.ch === channel)));
        now.innerHTML = `<b>CH ${channel}</b><span>${kind(channel)}</span>`;
        frame.src = `../assets/toy-or-not/tv/ch${channel}.jpg`;
        // 動きを減らす設定：砂嵐は重ねず、写真だけを替える。
        if (isStill()) return;
        noiseUntil = performance.now() + NOISE;
        if (!raf) raf = requestAnimationFrame(loop);
    }
    // ◀▶は、ゲームと同じく映るチャンネルだけを順に回る（ATBBoxTV::StepChannel）。
    function step(direction) {
        const order = direction > 0 ? WATCHABLE : [...WATCHABLE].reverse();
        const next = order.find(c => direction > 0 ? c > channel : c < channel);
        tune(next ?? order[0]);
    }
    buttons.forEach(b => b.addEventListener('click', () => {
        preload();
        b.classList.add('is-pressed');
        setTimeout(() => b.classList.remove('is-pressed'), 160);
        if (b.dataset.step) step(+b.dataset.step); else tune(+b.dataset.ch);
    }));
})();


// 演出C：幕の場面転換。ゲームのロード画面と同じく、幕を閉じてから移り、着いた先で幕を開ける。
(() => {
    const curtain = document.querySelector('.stage-curtain');
    const root = document.documentElement;
    const MOVE = 450;
    const on = () => document.body.classList.contains('fx-c') && !isStill();
    const reset = () => { curtain.className = 'stage-curtain'; root.classList.remove('curtain-arrive'); };
    function open() {
        curtain.classList.add('is-closed');
        root.classList.remove('curtain-arrive');
        requestAnimationFrame(() => requestAnimationFrame(() => {
            curtain.classList.add('is-moving', 'is-open');
            setTimeout(reset, MOVE + 30);
        }));
    }
    function close(then) {
        reset();
        requestAnimationFrame(() => requestAnimationFrame(() => {
            curtain.classList.add('is-moving', 'is-closed');
            setTimeout(then, MOVE + 30);
        }));
    }
    // 着いたとき：閉じて移ってきたなら開ける。
    let arrived = false;
    try { arrived = sessionStorage.getItem('tb-curtain') === '1'; sessionStorage.removeItem('tb-curtain'); } catch (e) {}
    if (arrived && on()) open(); else reset();
    // 戻るボタンで、閉じたまま復元されたときは開けておく。
    addEventListener('pageshow', e => { if (e.persisted) reset(); });

    document.addEventListener('click', e => {
        const a = e.target.closest('a[href]');
        if (!a || !on() || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
        const url = new URL(a.href, location.href);
        if (a.target === '_blank' || url.origin !== location.origin || url.protocol !== location.protocol || url.host !== location.host) return;
        if (/^https?:/.test(url.protocol) === false && url.protocol !== 'file:') return;
        if (url.pathname === location.pathname && url.hash) return;
        e.preventDefault();
        close(() => {
            try { sessionStorage.setItem('tb-curtain', '1'); } catch (err) {}
            location.href = a.href;
        });
    });
})();


// 演出D：電池集め。拾うと上の数が増え、全部そろうと脱出。
(() => {
    const bats = [...document.querySelectorAll('.battery')];
    const hud = document.querySelector('.battery-hud');
    const got = hud.querySelector('.battery-got');
    hud.querySelector('.battery-total').textContent = bats.length;
    const banner = document.querySelector('.escape-banner');
    const runner = document.querySelector('.escape-duck');
    let count = 0;
    bats.forEach(b => b.addEventListener('click', () => {
        if (b.classList.contains('is-taken')) return;
        b.classList.add('is-taken');
        count++;
        got.textContent = count;
        hud.classList.remove('is-bump'); void hud.offsetWidth; hud.classList.add('is-bump');
        if (count === bats.length) {
            banner.classList.add('is-on');
            if (!isStill()) { runner.classList.remove('is-on'); void runner.offsetWidth; runner.classList.add('is-on'); }
            setTimeout(() => banner.classList.remove('is-on'), 4200);
        }
    }));

})();


// 隠れるアヒル。ページの写真やカードの後ろを移り歩き、上の縁から顔を出す。
// 0.3秒見つめると凍って置物になる（ゲームの凝視と同じ）。見られていない間だけ時間が進む。
(() => {
    const hosts = [...document.querySelectorAll('[data-hide]')];
    if (!hosts.length) return;
    const shade = document.querySelector('.gaze-shade');

    const duck = document.createElement('span');
    duck.className = 'hide-duck';
    duck.setAttribute('aria-hidden', 'true');
    duck.innerHTML = '<img src="../assets/toy-or-not/duck.png" alt="" width="310" height="310" draggable="false">';

    const GAZE = .3;   // ゲームと同じく、0.3秒見つめると凍る
    const clamp01 = v => Math.min(1, Math.max(0, v));
    const ease = t => t < .5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2;
    const outBack = t => 1 + 2.2 * (t - 1) ** 3 + 1.2 * (t - 1) ** 2;
    const heartbeat = p => Math.exp(-(((p - .05) / .05) ** 2)) + .65 * Math.exp(-(((p - .25) / .05) ** 2));
    const rand = (a, b) => a + Math.random() * (b - a);

    // 隠れ場所の、上の縁にそった顔を出す位置。横に並んだカードは1枚ごと、写真は左右2か所。
    function covers(host) {
        return host.dataset.hide === 'row'
            ? [...host.children].filter(c => c.tagName === 'DIV')
            : [...host.querySelectorAll(':scope > img, :scope > video, :scope > .tv-set, :scope > .story-film')].filter(c => c.offsetWidth > 0).slice(0, 1);
    }
    function spotsOf(host) {
        const d = duck.offsetWidth || 72;
        const cs = covers(host);
        if (!cs.length) return { xs: [0], edge: 0, d };
        const top = cs[0].offsetTop;
        const row = cs.filter(c => Math.abs(c.offsetTop - top) < 4);
        const xs = row.length > 1
            ? row.map(c => c.offsetLeft + c.offsetWidth * .62 - d / 2)
            : [cs[0].offsetLeft + cs[0].offsetWidth * .16, cs[0].offsetLeft + cs[0].offsetWidth * .84 - d];
        return { xs, edge: top, d };
    }

    // いま画面の中ほどに縁が見えている隠れ場所から、ひとつ選ぶ。
    function pickHost(current) {
        const vh = innerHeight;
        const seen = hosts.filter(h => {
            const cs = covers(h);
            if (!cs.length) return false;
            const edge = h.getBoundingClientRect().top + cs[0].offsetTop;
            return edge > Math.max(90, vh * .14) && edge < vh * .86;
        });
        if (!seen.length) return null;
        const others = seen.filter(h => h !== current);
        const list = others.length ? others : seen;
        return list[Math.floor(Math.random() * list.length)];
    }

    // ひとつの隠れ場所での段取り。顔を出し、縁を跳ねて渡り、沈む。向きを変えるのは沈んで見えない間だけ。
    function makeVisit(host) {
        const n = spotsOf(host).xs.length;
        let i = Math.floor(Math.random() * n);
        const dir = i === 0 ? 1 : i === n - 1 ? -1 : (Math.random() < .5 ? -1 : 1);
        const steps = [['rise', i, dir, .55], ['look', i, dir, rand(1.1, 1.6)]];
        const room = dir > 0 ? n - 1 - i : i;
        const hops = Math.min(room, room > 1 && Math.random() < .5 ? 2 : 1);
        for (let h = 0; h < hops; h++) {
            steps.push(['hop', [i, i + dir], dir, .85]);
            i += dir;
            steps.push(['look', i, dir, rand(.9, 1.3)]);
        }
        steps.push(['sink', i, dir, .35], ['wait', i, dir, rand(1.2, 2.6)]);
        return { host, steps, total: steps.reduce((s, x) => s + x[3], 0), t: 0 };
    }

    function pose(visit) {
        const { xs, d } = spotsOf(visit.host);
        const HIDE = d * .18, PEEK = -d * .5, ARC = d * .22;
        let u = visit.t;
        for (const [name, at, face, dur] of visit.steps) {
            if (u > dur) { u -= dur; continue; }
            const k = u / dur;
            const x = Array.isArray(at) ? 0 : xs[Math.min(at, xs.length - 1)];
            const base = { x, y: PEEK, tilt: 0, face, sx: 1, sy: 1 };
            switch (name) {
                case 'rise': return { ...base, y: HIDE + (PEEK - HIDE) * outBack(k), sx: 1 - .05 * Math.sin(k * Math.PI), sy: 1 + .07 * Math.sin(k * Math.PI) };
                case 'look': {
                    const b = Math.sin(u * 4.2) * .02;
                    return { ...base, tilt: Math.sin(k * 2 * Math.PI) * 9 * face, sx: 1 - b, sy: 1 + b };
                }
                case 'hop': {
                    const a = xs[Math.min(at[0], xs.length - 1)], z = xs[Math.min(at[1], xs.length - 1)];
                    if (k < .18) { const s = Math.sin(k / .18 * Math.PI / 2); return { ...base, x: a, y: PEEK + 4 * s, sx: 1 + .1 * s, sy: 1 - .12 * s }; }
                    if (k < .82) {
                        const q = (k - .18) / .64, arc = Math.sin(q * Math.PI);
                        return { ...base, x: a + (z - a) * ease(q), y: PEEK - arc * ARC, tilt: -10 * face * Math.cos(q * Math.PI), sx: 1 - .06 * arc, sy: 1 + .08 * arc };
                    }
                    const s = Math.sin((k - .82) / .18 * Math.PI);
                    return { ...base, x: z, y: PEEK + 3 * s, sx: 1 + .09 * s, sy: 1 - .1 * s };
                }
                case 'sink': return { ...base, y: PEEK + (HIDE - PEEK) * k * k, sx: 1 + .04 * k, sy: 1 - .04 * k };
                case 'wait': return { ...base, y: HIDE };
            }
        }
        return { x: xs[0], y: HIDE, tilt: 0, face: 1, sx: 1, sy: 1 };
    }

    function draw(visit, p, f, wobble) {
        const { edge } = spotsOf(visit.host);
        const sx = p.sx * (1 + .03 * f), sy = p.sy * (1 - .04 * f);
        const shake = wobble ? Math.sin(wobble * 40) * 3 * (1 - wobble) : 0;
        duck.style.transform = `translate(${p.x}px, ${edge + p.y}px) rotate(${p.tilt + shake}deg) scale(${p.face * sx}, ${sy})`;
        duck.style.filter = f > 0 ? `grayscale(${f}) sepia(${.25 * f}) contrast(${1 - .1 * f}) brightness(${1 + .06 * f})` : '';
    }

    let visit = null, retry = 0;
    let hover = false, touchUntil = 0, seenFor = 0, freeze = 0, thaw = 1;
    let shadeLevel = 0, beat = 0, last = performance.now();

    function moveTo(host) {
        host.prepend(duck);
        visit = makeVisit(host);
    }

    function frame(now) {
        const dt = Math.min((now - last) / 1000, .1);
        last = now;
        const still = isStill();

        if (still) {
            // 動きを減らす設定：凝視の節のカードから、顔を出したまま動かない。
            const host = document.querySelector('#gaze [data-hide]') || hosts[0];
            if (!visit || visit.host !== host || !visit.still) { moveTo(host); visit.still = true; }
        } else if (!visit || visit.still || visit.t >= visit.total || !covers(visit.host).length) {
            retry -= dt;
            if (retry <= 0) {
                const host = pickHost(visit && visit.host);
                if (host) moveTo(host); else { retry = .5; if (visit) visit.t = visit.total; }
            }
        }

        if (visit) {
            let p = pose(visit);
            if (still) { const { xs, d } = spotsOf(visit.host); p = { x: xs[xs.length - 1], y: -d * .5, tilt: 0, face: -1, sx: 1, sy: 1 }; }
            const visible = p.y < -6;
            const looking = hover || now < touchUntil;
            seenFor = looking && visible ? seenFor + dt : 0;
            const target = seenFor >= GAZE ? 1 : 0;
            const wasFrozen = freeze > .5;
            freeze = clamp01(freeze + (target ? dt / .18 : -dt / .3));
            if (wasFrozen && freeze <= .5) thaw = 0;
            thaw = Math.min(1, thaw + dt / .45);
            if (!still && freeze === 0 && visit.t < visit.total) visit.t += dt;

            // 画面のふちの影：見られている間は鼓動して濃くなり、凍りきったら引く。
            const want = still ? 0 : (looking && visible ? (target ? 0 : .5 + seenFor / GAZE * .5) : 0);
            shadeLevel += (want - shadeLevel) * Math.min(1, dt / (target ? .4 : .12));
            beat = (beat + dt * (.85 + .4 * shadeLevel)) % 1;
            const pulse = heartbeat(beat);
            shade.style.opacity = (shadeLevel * (.78 + .22 * pulse)).toFixed(3);
            shade.style.setProperty('--shade-size', `${90 + 50 * shadeLevel * (.92 + .08 * pulse)}px`);

            draw(visit, p, freeze, still || thaw >= 1 ? 0 : thaw);
        }
        requestAnimationFrame(frame);
    }

    // マウス：乗せている間が「見つめている」。スマホ：触ってから1.5秒間。
    duck.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse') hover = true; });
    duck.addEventListener('pointerleave', e => { if (e.pointerType === 'mouse') hover = false; });
    duck.addEventListener('pointerdown', e => { if (e.pointerType !== 'mouse') touchUntil = performance.now() + 1500; });
    requestAnimationFrame(frame);
})();

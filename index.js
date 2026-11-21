import { extension_settings } from '../../../extensions.js';
import { saveSettingsDebounced } from '../../../../script.js';

const MODULE = 'bg_blur_90s';
const LAYERS = ['bg', 'theme'];

/* =====================================================================
 *  ФИЛЬТРЫ ПО НАСТРОЕНИЮ (по разделам)
 *  F = CSS-фильтр, O = слой-оверлей поверх
 * ===================================================================== */
const SECTIONS = [
    { id: 'n90',     name: '📼 90-е' },
    { id: 'tokyo',   name: '🌃 Ночной Токио' },
    { id: 'cloud',   name: '☁️ Пасмурные дни' },
    { id: 'gloom',   name: '🌑 Мрачные дни' },
    { id: 'snow',    name: '❄️ Снежные' },
    { id: 'horror',  name: '🩸 Хоррор' },
    { id: 'summer',  name: '☀️ Беззаботное лето' },
    { id: 'neutral', name: '⚪ Нейтральные' },
];

const F = (sec, id, name, def, css, o = {}) => ({ type: 'f', sec, id, name, def, css, min: 0, max: 100, unit: '%', ...o });
const O = (sec, id, name, def, style, o = {}) => ({ type: 'o', sec, id, name, def, style, min: 0, max: 100, unit: '%', ...o });
const grad = (g, blend = 'overlay') => ({ background: g, mixBlendMode: blend });
const flat = (c, blend = 'normal') => grad(c, blend);

const LOOKS = [
    /* --- 90-е --- */
    F('n90', 'kodak', 'Выцветшая плёнка (Kodak)', 60, v => `sepia(${v * .4}%) contrast(${100 - v * .15}%) saturate(${100 + v * .4}%) brightness(${100 + v * .12}%)`),
    F('n90', 'coldtape', 'Холодная видеокассета', 50, v => `saturate(${100 + v * .6}%) hue-rotate(${-v * .35}deg) contrast(${100 + v * .2}%) brightness(${100 - v * .08}%)`),
    F('n90', 'rgb', 'RGB-сдвиг (VHS-аберрация)', 4, () => 'url(#n90-rgb)', { max: 20, unit: 'px' }),
    F('n90', 'poster', 'Постеризация (мало цветов)', 5, () => 'url(#n90-poster)', { min: 2, max: 12, unit: ' ур.' }),
    O('n90', 'scan', 'Сканлайны ЭЛТ', 40),
    O('n90', 'grain', 'Зерно плёнки', 35),
    O('n90', 'tvsnow', 'Помехи ТВ (снег)', 25),
    O('n90', 'vignette', 'Виньетка ЭЛТ', 60),
    O('n90', 'flicker', 'Мерцание ЭЛТ', 40),
    O('n90', 'vhsbar', 'Полоса VHS-перемотки', 50),
    O('n90', 'vhsdate', 'VHS-таймкод (▶ PLAY)', 100),
    O('n90', 'neon', 'Неон-клуб (розовый/бирюзовый)', 45),
    O('n90', 'vapor', 'Вейпорвейв', 50),
    O('n90', 'sunset', 'Закат синтвейв', 50),
    O('n90', 'matrix', 'Матрица (зелёный монитор)', 55),
    O('n90', 'amber', 'Янтарный монитор', 55),
    O('n90', 'rainbow', 'Радужные блики (голограмма)', 40),
    O('n90', 'memphis', 'Мемфис-узор', 25),
    O('n90', 'halftone', 'Растр / полутон', 35),
    O('n90', 'pixgrid', 'Пиксельная сетка (LCD)', 40),
    O('n90', 'frame', 'Неоновая рамка по краям', 50),

    /* --- Ночной Токио --- */
    F('tokyo', 'tk_dim', 'Ночное затемнение', 45, v => `brightness(${100 - v * .6}%) contrast(${100 + v * .2}%) saturate(${100 + v * .4}%)`),
    F('tokyo', 'tk_neon', 'Неоновая ночь', 60, v => `brightness(${100 - v * .2}%) contrast(${100 + v * .35}%) saturate(${100 + v * .9}%) hue-rotate(${v * .15}deg)`),
    F('tokyo', 'tk_smog', 'Оранжевый смог (киберпанк)', 50, v => `sepia(${v * .35}%) saturate(${100 + v * .8}%) hue-rotate(${-v * .15}deg) contrast(${100 + v * .2}%)`),
    O('tokyo', 'tk_cyber', 'Розово-голубой градиент', 50, grad('linear-gradient(160deg,#ff2bd6,#3a2bff 55%,#00e5ff)', 'soft-light')),
    O('tokyo', 'tk_shadow', 'Тонирование теней (сине-фиолетовое)', 50, grad('linear-gradient(to bottom,#00334d,#3a0a4d)', 'lighten')),
    O('tokyo', 'tk_sign', 'Свет вывесок (красный/синий)', 45, grad('radial-gradient(circle at 15% 25%,rgba(255,0,80,.85),transparent 40%),radial-gradient(circle at 85% 70%,rgba(0,160,255,.85),transparent 45%)', 'screen')),
    O('tokyo', 'tk_vign', 'Ночная виньетка', 50, grad('radial-gradient(ellipse at center,transparent 30%,#05001a 115%)', 'normal')),

    /* --- Пасмурные дни --- */
    F('cloud', 'cl_desat', 'Серая дымка', 60, v => `saturate(${100 - v * .6}%) contrast(${100 - v * .15}%) brightness(${100 + v * .05}%)`),
    F('cloud', 'cl_flat', 'Плоский рассеянный свет', 50, v => `contrast(${100 - v * .4}%) brightness(${100 + v * .1}%) saturate(${100 - v * .2}%)`),
    F('cloud', 'cl_damp', 'Сырой день', 50, v => `sepia(${v * .15}%) saturate(${100 - v * .3}%) hue-rotate(${v * .1}deg) contrast(${100 - v * .1}%)`),
    O('cloud', 'cl_bluegray', 'Серо-голубая вуаль', 50, flat('#8fa3b8', 'soft-light')),
    O('cloud', 'cl_haze', 'Дымка с неба', 35, grad('linear-gradient(to bottom,rgba(220,226,232,.95),rgba(220,226,232,.15))', 'normal')),

    /* --- Мрачные дни --- */
    F('gloom', 'gl_dark', 'Мрак', 50, v => `brightness(${100 - v * .55}%) contrast(${100 + v * .25}%) saturate(${100 - v * .4}%)`),
    F('gloom', 'gl_bleak', 'Выжженная серость', 50, v => `grayscale(${v * .7}%) contrast(${100 + v * .3}%) brightness(${100 - v * .2}%)`),
    F('gloom', 'gl_ash', 'Пепельный', 50, v => `sepia(${v * .25}%) grayscale(${v * .5}%) contrast(${100 + v * .15}%) brightness(${100 - v * .15}%)`),
    O('gloom', 'gl_blue', 'Синяя хмарь', 40, flat('#1c3a5c', 'multiply')),
    O('gloom', 'gl_olive', 'Грязно-оливковый', 40, flat('#6b5d2e', 'multiply')),
    O('gloom', 'gl_vign', 'Тяжёлая виньетка', 60, grad('radial-gradient(ellipse at center,transparent 20%,rgba(0,0,0,.95) 110%)', 'normal')),
    O('gloom', 'gl_bottom', 'Тьма снизу', 50, grad('linear-gradient(to top,rgba(0,0,0,.9),transparent 60%)', 'normal')),

    /* --- Снежные --- */
    F('snow', 'sn_cold', 'Морозная свежесть', 60, v => `brightness(${100 + v * .1}%) saturate(${100 - v * .25}%) hue-rotate(${v * .18}deg) contrast(${100 + v * .05}%)`),
    F('snow', 'sn_bright', 'Слепящий белый', 40, v => `brightness(${100 + v * .4}%) contrast(${100 - v * .15}%) saturate(${100 - v * .3}%)`),
    F('snow', 'sn_dusk', 'Синие сумерки', 50, v => `brightness(${100 - v * .2}%) saturate(${100 + v * .2}%) hue-rotate(${v * .25}deg)`),
    O('snow', 'sn_ice', 'Ледяной голубой', 50, flat('#bfe6ff', 'overlay')),
    O('snow', 'sn_white', 'Белая пелена / метель', 25, flat('#ffffff')),
    O('snow', 'sn_frost', 'Иней по краям', 50, { boxShadow: 'inset 0 0 12vmin 3vmin rgba(220,240,255,.95)' }),

    /* --- Хоррор --- */
    F('horror', 'hr_dread', 'Тревога', 60, v => `contrast(${100 + v * .4}%) saturate(${100 - v * .5}%) brightness(${100 - v * .3}%) sepia(${v * .2}%)`),
    F('horror', 'hr_night', 'Ночь без луны', 50, v => `brightness(${100 - v * .65}%) contrast(${100 + v * .3}%) saturate(${100 - v * .6}%) hue-rotate(${v * .1}deg)`),
    F('horror', 'hr_bw', 'Чёрно-белый триллер', 50, v => `grayscale(${v}%) contrast(${100 + v * .4}%) brightness(${100 - v * .15}%)`),
    O('horror', 'hr_blood', 'Кровавый красный', 30, flat('#8b0000', 'multiply')),
    O('horror', 'hr_green', 'Больничный зелёный', 40, flat('#3f6b4a', 'color')),
    O('horror', 'hr_vign', 'Чёрные углы', 70, grad('radial-gradient(ellipse at center,transparent 25%,#000 105%)', 'normal')),
    O('horror', 'hr_pulse', 'Пульсирующая тьма', 60),
    O('horror', 'hr_lamp', 'Мигающая лампа', 40),

    /* --- Беззаботное лето --- */
    F('summer', 'su_sun', 'Тёплое солнце', 60, v => `sepia(${v * .2}%) saturate(${100 + v * .4}%) brightness(${100 + v * .12}%) contrast(${100 + v * .05}%) hue-rotate(${-v * .06}deg)`),
    F('summer', 'su_vivid', 'Сочные краски', 50, v => `saturate(${100 + v * .8}%) contrast(${100 + v * .1}%) brightness(${100 + v * .05}%)`),
    F('summer', 'su_dreamy', 'Мечтательный блеск', 50, v => `brightness(${100 + v * .15}%) contrast(${100 - v * .12}%) saturate(${100 + v * .25}%) sepia(${v * .1}%)`),
    O('summer', 'su_glow', 'Золотой свет сверху', 50, grad('linear-gradient(to bottom,rgba(255,214,120,.95),transparent 55%)', 'overlay')),
    O('summer', 'su_sky', 'Небесная голубизна', 40, flat('#6ec6ff', 'soft-light')),
    O('summer', 'su_peach', 'Персиковый закат', 45, grad('linear-gradient(to top,#ff9a76,#ffd1a9)', 'soft-light')),
    O('summer', 'su_leak', 'Световая засветка', 40),

    /* --- Нейтральные --- */
    F('neutral', 'sepia', 'Сепия', 60, v => `sepia(${v}%)`),
    F('neutral', 'gray', 'Чёрно-белое', 100, v => `grayscale(${v}%)`),
    F('neutral', 'contrast', 'Контраст', 140, v => `contrast(${v}%)`, { min: 50, max: 250 }),
    F('neutral', 'saturate', 'Насыщенность', 200, v => `saturate(${v}%)`, { max: 400 }),
    F('neutral', 'bright', 'Яркость', 120, v => `brightness(${v}%)`, { min: 20, max: 200 }),
    F('neutral', 'hue', 'Сдвиг оттенка', 60, v => `hue-rotate(${v}deg)`, { max: 360, unit: '°' }),
    F('neutral', 'invert', 'Негатив', 100, v => `invert(${v}%)`),
    O('neutral', 'ne_tint', 'Свой оттенок (выбери цвет)', 50, flat('var(--c)', 'color'), { color: '#ff7a00' }),
    O('neutral', 'ne_warm', 'Тёплый тон', 40, flat('#ff9a3c', 'soft-light')),
    O('neutral', 'ne_cool', 'Холодный тон', 40, flat('#3c8cff', 'soft-light')),
    O('neutral', 'ne_dim', 'Затемнение', 30, flat('#000')),
    O('neutral', 'ne_light', 'Осветление', 20, flat('#fff')),
    O('neutral', 'ne_vign', 'Мягкая виньетка', 40, grad('radial-gradient(ellipse at center,transparent 45%,rgba(0,0,0,.8) 120%)', 'normal')),
];

/* =====================================================================
 *  ВИЗУАЛЬНЫЕ ЭФФЕКТЫ (анимация на canvas)
 *  make(W,H,initial) -> частица;  tick(ctx,o,dt,W,H,p,k) -> true, если частица умерла
 *  p = параметры (count, speed, size, opacity, color), k = {sp, sz, al}
 * ===================================================================== */
const R = (a, b) => a + Math.random() * (b - a);
const TAU = Math.PI * 2;
const rgbCache = {};
function rgb(hex) {
    return rgbCache[hex] || (rgbCache[hex] = [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)]);
}
function rgba(hex, a) {
    const c = rgb(hex);
    return `rgba(${c[0]},${c[1]},${c[2]},${a})`;
}
function glow(c, x, y, r, hex, a) {
    const g = c.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, rgba(hex, a));
    g.addColorStop(1, rgba(hex, 0));
    c.globalAlpha = 1;
    c.fillStyle = g;
    c.beginPath();
    c.arc(x, y, r, 0, TAU);
    c.fill();
}
function wrap(o, W, H, m) {
    if (o.x < -m) o.x = W + m; else if (o.x > W + m) o.x = -m;
    if (o.y < -m) o.y = H + m; else if (o.y > H + m) o.y = -m;
}

// падающие / поднимающиеся фигурки (лепестки, листья, сердечки, пузыри)
const faller = c0 => ({
    make: (W, H, i) => {
        const d = c0.dir || 1;
        return { x: R(-60, W), y: i ? R(0, H) : (d > 0 ? R(-20, 0) : R(H, H + 20)), r: R(c0.r[0], c0.r[1]), v: R(c0.v[0], c0.v[1]),
            rot: R(0, 6.3), vr: R(-2.5, 2.5) * (c0.spin ?? 1), ph: R(0, 6.3), a: R(.55, 1) };
    },
    tick: (c, o, dt, W, H, p, k) => {
        const d = c0.dir || 1;
        o.ph += dt * k.sp * 1.5;
        o.y += d * o.v * k.sp * dt;
        o.x += (Math.sin(o.ph) * 30 + (c0.drift || 0)) * k.sp * dt;
        o.rot += o.vr * k.sp * dt;
        const r = o.r * k.sz;
        c.save();
        c.translate(o.x, o.y);
        c.rotate(o.rot);
        c.beginPath();
        c0.shape(c, r);
        if (c0.stroke) {
            c.globalAlpha = k.al * o.a * .15; c.fillStyle = p.color; c.fill();
            c.globalAlpha = k.al * o.a; c.strokeStyle = p.color; c.lineWidth = 1.3; c.stroke();
        } else {
            c.globalAlpha = k.al * o.a; c.fillStyle = p.color; c.fill();
        }
        c.restore();
        return d > 0 ? (o.y > H + 20 || o.x > W + 40 || o.x < -60) : (o.y < -20 || o.x > W + 40 || o.x < -60);
    },
});

const KANA = 'ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄ0123456789';

const PX_FX = [
    /* --- Погода --- */
    { id: 'rain', grp: 'Погода', name: '🌧 Дождь', def: { count: 160, speed: 100, size: 100, opacity: 60, color: '#aec6ff' },
      make: (W, H, i) => ({ x: R(-100, W), y: i ? R(0, H) : R(-60, 0), l: R(12, 28), v: R(700, 1100) }),
      tick: (c, o, dt, W, H, p, k) => {
          o.y += o.v * k.sp * dt; o.x += o.v * .18 * k.sp * dt;
          const l = o.l * k.sz;
          c.globalAlpha = k.al * .7; c.strokeStyle = p.color; c.lineWidth = Math.max(.6, k.sz);
          c.beginPath(); c.moveTo(o.x, o.y); c.lineTo(o.x - l * .18, o.y - l); c.stroke();
          return o.y > H + 30 || o.x > W + 50;
      } },
    { id: 'snow', grp: 'Погода', name: '❄️ Снег', def: { count: 140, speed: 100, size: 100, opacity: 85, color: '#ffffff' },
      make: (W, H, i) => ({ x: R(0, W), y: i ? R(0, H) : R(-10, 0), r: R(1, 3.5), v: R(25, 70), ph: R(0, 6.3), sw: R(8, 30) }),
      tick: (c, o, dt, W, H, p, k) => {
          o.y += o.v * k.sp * dt; o.ph += dt * k.sp; o.x += Math.sin(o.ph) * o.sw * dt;
          c.globalAlpha = k.al * (.5 + o.r / 7); c.fillStyle = p.color;
          c.beginPath(); c.arc(o.x, o.y, o.r * k.sz, 0, TAU); c.fill();
          return o.y > H + 10;
      } },
    { id: 'fog', grp: 'Погода', name: '🌫 Туман', add: false, def: { count: 8, speed: 100, size: 100, opacity: 50, color: '#d5dde8' },
      make: (W, H) => ({ x: R(0, W), y: R(H * .25, H * 1.05), r: R(180, 380), v: R(6, 20) * (Math.random() < .5 ? -1 : 1) }),
      tick: (c, o, dt, W, H, p, k) => {
          o.x += o.v * k.sp * dt;
          const r = o.r * k.sz;
          if (o.x > W + r) o.x = -r; if (o.x < -r) o.x = W + r;
          glow(c, o.x, o.y, r, p.color, k.al * .5);
          return false;
      } },
    { id: 'lightning', grp: 'Погода', name: '⚡ Молнии', def: { count: 1, speed: 100, size: 100, opacity: 80, color: '#dfe8ff' },
      make: () => ({ t: R(2, 7), on: false, life: 0, pts: [] }),
      tick: (c, o, dt, W, H, p, k) => {
          if (!o.on) {
              o.t -= dt * k.sp;
              if (o.t <= 0) {
                  o.on = true; o.life = 0;
                  let x = R(W * .15, W * .85), y = 0;
                  o.pts = [[x, y]];
                  const ty = H * R(.5, .9);
                  while (y < ty) { y += R(20, 60); x += R(-40, 40); o.pts.push([x, y]); }
              }
              return false;
          }
          o.life += dt * k.sp;
          const f = Math.max(0, 1 - o.life * 2.2) * (Math.sin(o.life * 55) > -.35 ? 1 : .35);
          c.globalAlpha = f * k.al * .35; c.fillStyle = p.color; c.fillRect(0, 0, W, H);
          c.globalAlpha = f * k.al; c.strokeStyle = p.color; c.lineWidth = 2.5 * k.sz; c.lineJoin = 'round';
          c.shadowColor = p.color; c.shadowBlur = 18;
          c.beginPath();
          o.pts.forEach((q, i) => (i ? c.lineTo(q[0], q[1]) : c.moveTo(q[0], q[1])));
          c.stroke();
          c.shadowBlur = 0;
          if (o.life > .5) { o.on = false; o.t = R(3, 10); }
          return false;
      } },

    /* --- Природа --- */
    { id: 'sakura', grp: 'Природа', name: '🌸 Лепестки сакуры', def: { count: 50, speed: 100, size: 100, opacity: 90, color: '#ffb7d5' },
      ...faller({ r: [4, 8], v: [25, 55], drift: 20, shape: (c, r) => c.ellipse(0, 0, r, r * .55, 0, 0, TAU) }) },
    { id: 'leaves', grp: 'Природа', name: '🍂 Осенние листья', def: { count: 40, speed: 100, size: 100, opacity: 90, color: '#e0742a' },
      ...faller({ r: [6, 12], v: [30, 70], drift: 25, shape: (c, r) => { c.moveTo(0, -r); c.quadraticCurveTo(r * .9, 0, 0, r); c.quadraticCurveTo(-r * .9, 0, 0, -r); } }) },
    { id: 'fireflies', grp: 'Природа', name: '✨ Светлячки', add: true, def: { count: 40, speed: 100, size: 100, opacity: 90, color: '#d9ff6e' },
      make: (W, H) => ({ x: R(0, W), y: R(0, H), a: R(0, 6.3), v: R(10, 30), ph: R(0, 6.3), r: R(1.5, 3) }),
      tick: (c, o, dt, W, H, p, k) => {
          o.a += (Math.random() - .5) * dt * 8;
          o.x += Math.cos(o.a) * o.v * k.sp * dt; o.y += Math.sin(o.a) * o.v * k.sp * dt;
          o.ph += dt * 2.2 * k.sp;
          wrap(o, W, H, 10);
          glow(c, o.x, o.y, o.r * k.sz * 6, p.color, k.al * (.5 + .5 * Math.sin(o.ph)));
          return false;
      } },
    { id: 'bubbles', grp: 'Природа', name: '🫧 Пузыри', def: { count: 30, speed: 100, size: 100, opacity: 80, color: '#bfe9ff' },
      ...faller({ r: [3, 16], v: [20, 60], dir: -1, spin: 0, stroke: true, shape: (c, r) => c.arc(0, 0, r, 0, TAU) }) },

    /* --- Свет и космос --- */
    { id: 'stars', grp: 'Свет и космос', name: '⭐ Мерцающие звёзды', def: { count: 120, speed: 100, size: 100, opacity: 90, color: '#ffffff' },
      make: (W, H) => ({ x: R(0, W), y: R(0, H), r: R(.4, 1.6), ph: R(0, 6.3), f: R(1, 3) }),
      tick: (c, o, dt, W, H, p, k) => {
          o.ph += dt * o.f * k.sp;
          c.globalAlpha = k.al * (.35 + .65 * (.5 + .5 * Math.sin(o.ph))); c.fillStyle = p.color;
          c.beginPath(); c.arc(o.x, o.y, o.r * k.sz, 0, TAU); c.fill();
          return false;
      } },
    { id: 'shooting', grp: 'Свет и космос', name: '🌠 Падающие звёзды', add: true, def: { count: 3, speed: 100, size: 100, opacity: 90, color: '#ffffff' },
      make: () => ({ t: R(1, 6), on: false, x: 0, y: 0, vx: 0, vy: 0, life: 0 }),
      tick: (c, o, dt, W, H, p, k) => {
          if (!o.on) {
              o.t -= dt * k.sp;
              if (o.t <= 0) { o.on = true; o.life = 0; o.x = R(W * .3, W); o.y = R(0, H * .4); o.vx = -R(700, 1000); o.vy = R(250, 450); }
              return false;
          }
          o.life += dt; o.x += o.vx * k.sp * dt; o.y += o.vy * k.sp * dt;
          const L = .12 * k.sz, tx = o.x - o.vx * L, ty = o.y - o.vy * L;
          const g = c.createLinearGradient(o.x, o.y, tx, ty);
          g.addColorStop(0, rgba(p.color, k.al)); g.addColorStop(1, rgba(p.color, 0));
          c.globalAlpha = 1; c.strokeStyle = g; c.lineWidth = 2 * k.sz;
          c.beginPath(); c.moveTo(o.x, o.y); c.lineTo(tx, ty); c.stroke();
          if (o.life > 1.2 || o.y > H || o.x < 0) { o.on = false; o.t = R(3, 9); }
          return false;
      } },
    { id: 'sunrays', grp: 'Свет и космос', name: '🌤 Лучи солнца', add: true, def: { count: 5, speed: 100, size: 100, opacity: 35, color: '#fff2b0' },
      make: (W) => ({ x: R(-.1 * W, W * .9), w: R(50, 160), ph: R(0, 6.3), f: R(.2, .5) }),
      tick: (c, o, dt, W, H, p, k) => {
          o.ph += dt * o.f * k.sp;
          const a = k.al * (.5 + .5 * Math.sin(o.ph)), w = o.w * k.sz, sx = o.x + Math.sin(o.ph * .5) * 40;
          const g = c.createLinearGradient(0, 0, 0, H);
          g.addColorStop(0, rgba(p.color, a)); g.addColorStop(1, rgba(p.color, 0));
          c.globalAlpha = 1; c.fillStyle = g;
          c.beginPath(); c.moveTo(sx, 0); c.lineTo(sx + w, 0); c.lineTo(sx + w * 3 - H * .45, H); c.lineTo(sx - H * .45, H); c.closePath(); c.fill();
          return false;
      } },
    { id: 'dust', grp: 'Свет и космос', name: '🌫 Пылинки в свете', def: { count: 80, speed: 100, size: 100, opacity: 80, color: '#fff3c4' },
      make: (W, H) => ({ x: R(0, W), y: R(0, H), r: R(.6, 1.8), vx: R(-8, 8), vy: R(-8, 4), ph: R(0, 6.3) }),
      tick: (c, o, dt, W, H, p, k) => {
          o.ph += dt * k.sp;
          o.x += (o.vx + Math.sin(o.ph) * 6) * k.sp * dt; o.y += o.vy * k.sp * dt;
          wrap(o, W, H, 5);
          c.globalAlpha = k.al * (.3 + .5 * (.5 + .5 * Math.sin(o.ph * 1.7))); c.fillStyle = p.color;
          c.beginPath(); c.arc(o.x, o.y, o.r * k.sz, 0, TAU); c.fill();
          return false;
      } },
    { id: 'bokeh', grp: 'Свет и космос', name: '🔮 Боке (огни города)', add: true, def: { count: 22, speed: 100, size: 100, opacity: 35, color: '#ff5fd2' },
      make: (W, H) => ({ x: R(0, W), y: R(0, H), r: R(14, 60), vx: R(-10, 10), vy: R(-8, 8), ph: R(0, 6.3) }),
      tick: (c, o, dt, W, H, p, k) => {
          o.ph += dt * .6 * k.sp; o.x += o.vx * k.sp * dt; o.y += o.vy * k.sp * dt;
          const r = o.r * k.sz;
          wrap(o, W, H, r);
          const a = k.al * (.5 + .5 * Math.sin(o.ph));
          c.beginPath(); c.arc(o.x, o.y, r, 0, TAU);
          c.globalAlpha = a * .6; c.fillStyle = p.color; c.fill();
          c.globalAlpha = a; c.strokeStyle = p.color; c.lineWidth = 1.5; c.stroke();
          return false;
      } },

    /* --- Огонь и настроение --- */
    { id: 'embers', grp: 'Огонь и настроение', name: '🔥 Искры / угольки', add: true, def: { count: 60, speed: 100, size: 100, opacity: 90, color: '#ff8a2a' },
      make: (W, H, i) => ({ x: R(0, W), y: i ? R(0, H) : R(H, H + 20), r: R(1, 3), v: R(40, 110), ph: R(0, 6.3), sw: R(10, 30) }),
      tick: (c, o, dt, W, H, p, k) => {
          o.ph += dt * 3 * k.sp; o.y -= o.v * k.sp * dt; o.x += Math.sin(o.ph) * o.sw * dt;
          const f = .6 + .4 * Math.sin(o.ph * 3);
          glow(c, o.x, o.y, o.r * k.sz * 5, p.color, k.al * f * Math.max(0, Math.min(1, o.y / (H * .3))));
          return o.y < -10;
      } },
    { id: 'hearts', grp: 'Огонь и настроение', name: '💗 Сердечки', def: { count: 25, speed: 100, size: 100, opacity: 85, color: '#ff6b9a' },
      ...faller({ r: [6, 14], v: [30, 70], dir: -1, spin: .3, shape: (c, r) => {
          c.moveTo(0, r * .35);
          c.bezierCurveTo(-r * 1.2, -r * .5, -r * .4, -r * 1.1, 0, -r * .4);
          c.bezierCurveTo(r * .4, -r * 1.1, r * 1.2, -r * .5, 0, r * .35);
      } }) },
    { id: 'confetti', grp: 'Огонь и настроение', name: '🎉 Конфетти', def: { count: 80, speed: 100, size: 100, opacity: 90 },
      make: (W, H, i) => ({ x: R(0, W), y: i ? R(0, H) : R(-20, 0), w: R(5, 11), h: R(3, 7), rot: R(0, 6.3), vr: R(-6, 6), v: R(60, 140), ph: R(0, 6.3), hue: R(0, 360) }),
      tick: (c, o, dt, W, H, p, k) => {
          o.y += o.v * k.sp * dt; o.ph += dt * 2 * k.sp; o.x += Math.sin(o.ph) * 30 * dt; o.rot += o.vr * k.sp * dt;
          const sc = Math.abs(Math.cos(o.rot * 1.3));
          c.save(); c.translate(o.x, o.y); c.rotate(o.rot);
          c.globalAlpha = k.al; c.fillStyle = `hsl(${o.hue},90%,60%)`;
          c.fillRect(-o.w * k.sz / 2, -o.h * k.sz * sc / 2, o.w * k.sz, o.h * k.sz * sc + .5);
          c.restore();
          return o.y > H + 20;
      } },

    /* --- Цифровое --- */
    { id: 'matrixrain', grp: 'Цифровое', name: '🟩 Цифровой дождь', def: { count: 40, speed: 100, size: 100, opacity: 80, color: '#00ff41' },
      make: (W, H, i) => ({ x: Math.floor(R(0, W) / 14) * 14, y: i ? R(0, H) : R(-300, 0), v: R(80, 220), len: Math.floor(R(8, 22)), s: Math.floor(R(0, 999)) }),
      tick: (c, o, dt, W, H, p, k) => {
          const fs = Math.round(14 * k.sz);
          o.y += o.v * k.sp * dt;
          c.font = `${fs}px monospace`;
          const cy = Math.floor(o.y / fs), tt = Math.floor(performance.now() / 90);
          for (let j = 0; j < o.len; j++) {
              const ch = KANA[Math.abs((cy - j) * 7 + o.s + (j === 0 ? tt : 0)) % KANA.length];
              c.globalAlpha = k.al * (1 - j / o.len);
              c.fillStyle = j === 0 ? '#ffffff' : p.color;
              c.fillText(ch, o.x, o.y - j * fs);
          }
          return o.y - o.len * fs > H;
      } },
    { id: 'glitch', grp: 'Цифровое', name: '📺 Глитч-помехи', def: { count: 2, speed: 100, size: 100, opacity: 80 },
      make: () => ({ t: R(1, 5), on: false, life: 0, bars: [] }),
      tick: (c, o, dt, W, H, p, k) => {
          if (!o.on) {
              o.t -= dt * k.sp;
              if (o.t <= 0) {
                  o.on = true; o.life = 0;
                  o.bars = Array.from({ length: Math.floor(R(3, 8)) }, () => ({ y: R(0, H), h: R(3, 40), dx: R(-60, 60), c: ['#ff0040', '#00ffe0', '#ffffff'][Math.floor(R(0, 3))] }));
              }
              return false;
          }
          o.life += dt;
          for (const b of o.bars) {
              c.globalAlpha = k.al * R(.2, .5); c.fillStyle = b.c;
              c.fillRect(b.dx, b.y + R(-3, 3), W, b.h * k.sz);
          }
          if (o.life > .18) { o.on = false; o.t = R(2, 7); }
          return false;
      } },
];

const PX_GROUPS = [...new Set(PX_FX.map(e => e.grp))];

/* =====================================================================
 *  ГОТОВЫЕ ПРЕСЕТЫ
 * ===================================================================== */
const PRESETS = [
    { name: '📼 VHS-кассета', fx: { rgb: ['both', 4], scan: ['both', 40], grain: ['both', 35], vhsbar: ['both', 50], vhsdate: ['bg', 100], coldtape: ['bg', 50], vignette: ['bg', 40] } },
    { name: '🕹 Вейпорвейв', fx: { vapor: ['both', 55], rgb: ['bg', 3], scan: ['bg', 25], pixgrid: ['bg', 30] } },
    { name: '🖥 Старый ЭЛТ', fx: { matrix: ['both', 50], scan: ['both', 60], flicker: ['both', 40], vignette: ['both', 70] } },
    { name: '📷 Полароид', fx: { kodak: ['both', 70], grain: ['both', 30], vignette: ['bg', 40] } },
    { name: '🎨 Мемфис / MTV', fx: { memphis: ['both', 30], saturate: ['both', 220], contrast: ['bg', 130], rainbow: ['bg', 25] } },
    { name: '🌃 Ночной Токио', blur: 2, fx: { tk_dim: ['bg', 45], tk_neon: ['bg', 60], tk_shadow: ['bg', 40], tk_sign: ['bg', 45], tk_vign: ['bg', 50] },
      px: { bokeh: ['bg', {}], rain: ['bg', { count: 120, opacity: 45 }] } },
    { name: '☁️ Пасмурный день', blur: 3, fx: { cl_desat: ['bg', 60], cl_haze: ['bg', 35], cl_flat: ['bg', 50] },
      px: { rain: ['bg', { count: 90, opacity: 35 }], fog: ['bg', { count: 6, opacity: 35 }] } },
    { name: '🌑 Мрачный день', blur: 2, fx: { gl_dark: ['bg', 50], gl_blue: ['bg', 40], gl_vign: ['bg', 60] },
      px: { fog: ['bg', { count: 10, opacity: 40 }] } },
    { name: '❄️ Снежный день', blur: 2, fx: { sn_cold: ['bg', 60], sn_white: ['bg', 25], sn_frost: ['bg', 50] },
      px: { snow: ['bg', {}] } },
    { name: '🩸 Хоррор', blur: 1, fx: { hr_dread: ['bg', 60], hr_blood: ['bg', 30], hr_vign: ['bg', 70], hr_pulse: ['bg', 60], hr_lamp: ['bg', 40], grain: ['bg', 40] },
      px: { fog: ['bg', { count: 8, color: '#8a9a9a', opacity: 35 }], lightning: ['bg', { opacity: 60 }] } },
    { name: '☀️ Летний день', fx: { su_sun: ['bg', 60], su_glow: ['bg', 50], su_leak: ['bg', 40], su_vivid: ['bg', 40] },
      px: { sunrays: ['bg', {}], dust: ['bg', {}] } },
    { name: '🌸 Весна / сакура', fx: { su_peach: ['bg', 45], su_dreamy: ['bg', 50] }, px: { sakura: ['bg', {}] } },
    { name: '🔥 Огонь и тьма', fx: { gl_dark: ['bg', 40], gl_vign: ['bg', 60], ne_warm: ['bg', 50] }, px: { embers: ['bg', { count: 70 }] } },
];

/* =====================================================================
 *  НАСТРОЙКИ
 * ===================================================================== */
const defaultFx = e => ({ target: 'off', value: e.def, ...(e.color ? { color: e.color } : {}) });
const defaultPx = e => ({ target: 'off', ...e.def });
const settings = () => extension_settings[MODULE];
const save = () => saveSettingsDebounced();
const toast = (type, msg) => window.toastr?.[type]?.(msg);

function loadSettings() {
    const s = (extension_settings[MODULE] = extension_settings[MODULE] || {});
    if (s.enabled === undefined) s.enabled = true;
    if (s.blur === undefined) s.blur = 0;
    s.fx = s.fx || s.effects || {};
    delete s.effects;
    s.px = s.px || {};
    s.userPresets = s.userPresets || [];
    for (const e of LOOKS) s.fx[e.id] = { ...defaultFx(e), ...(s.fx[e.id] || {}) };
    for (const e of PX_FX) s.px[e.id] = { ...defaultPx(e), ...(s.px[e.id] || {}) };
}

/* =====================================================================
 *  DOM: SVG-фильтры, оверлеи, canvas
 * ===================================================================== */
const overlayRefs = {};
const layers = {};

function buildSvg() {
    document.body.insertAdjacentHTML('beforeend', `
<svg id="n90-svg" width="0" height="0" style="position:absolute;pointer-events:none" aria-hidden="true">
  <filter id="n90-rgb" x="-5%" y="-5%" width="110%" height="110%" color-interpolation-filters="sRGB">
    <feColorMatrix in="SourceGraphic" type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" result="r"/>
    <feColorMatrix in="SourceGraphic" type="matrix" values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0" result="g"/>
    <feColorMatrix in="SourceGraphic" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0" result="b"/>
    <feOffset id="n90-rgb-r" in="r" dx="4" dy="0" result="r2"/>
    <feOffset id="n90-rgb-b" in="b" dx="-4" dy="0" result="b2"/>
    <feBlend in="r2" in2="g" mode="screen" result="rg"/>
    <feBlend in="rg" in2="b2" mode="screen"/>
  </filter>
  <filter id="n90-poster" color-interpolation-filters="sRGB">
    <feComponentTransfer>
      <feFuncR id="n90-pr" type="discrete" tableValues="0 0.25 0.5 0.75 1"/>
      <feFuncG id="n90-pg" type="discrete" tableValues="0 0.25 0.5 0.75 1"/>
      <feFuncB id="n90-pb" type="discrete" tableValues="0 0.25 0.5 0.75 1"/>
    </feComponentTransfer>
  </filter>
</svg>`);
}

function buildOverlays() {
    const noise = `<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n' x='0' y='0' width='100%' height='100%'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0.33 0.33 0.33 0 0 0.33 0.33 0.33 0 0 0.33 0.33 0.33 0 0 0 0 0 0 1'/></filter><rect width='100%' height='100%' filter='url(#n)'/></svg>`;
    document.documentElement.style.setProperty('--n90-grain', `url("data:image/svg+xml,${encodeURIComponent(noise)}")`);

    for (const e of LOOKS.filter(l => l.type === 'o')) {
        overlayRefs[e.id] = {};
        for (const layer of LAYERS) {
            const el = document.createElement('div');
            el.className = `n90-fx n90-fx-${e.id}`;
            el.dataset.layer = layer;
            if (e.style) Object.assign(el.style, e.style);
            if (e.id === 'vhsdate') el.innerHTML = '<span class="n90-tl">▶ PLAY</span><span class="n90-tr">JAN. 01 1996<br>12:00 AM</span>';
            document.body.appendChild(el);
            overlayRefs[e.id][layer] = el;
        }
    }
}

function buildCanvases() {
    for (const L of LAYERS) {
        const cv = document.createElement('canvas');
        cv.className = 'n90-canvas';
        cv.dataset.layer = L;
        document.body.appendChild(cv);
        layers[L] = { cv, ctx: cv.getContext('2d'), sets: {} };
    }
    resizeCanvases();
}

function resizeCanvases() {
    for (const L of LAYERS) {
        layers[L].cv.width = window.innerWidth;
        layers[L].cv.height = window.innerHeight;
    }
}

/* =====================================================================
 *  Движок эффектов
 * ===================================================================== */
let raf = 0;
let lastTs = 0;

const activePx = L => {
    const s = settings();
    if (!s.enabled) return [];
    return PX_FX.filter(e => { const t = s.px[e.id].target; return t === L || t === 'both'; });
};

function loop(ts) {
    const dt = Math.min(.05, (ts - lastTs) / 1000 || .016);
    lastTs = ts;
    const s = settings();
    const W = window.innerWidth, H = window.innerHeight;
    let any = false;
    for (const L of LAYERS) {
        const { cv, ctx, sets } = layers[L];
        ctx.clearRect(0, 0, cv.width, cv.height);
        const act = activePx(L);
        for (const id in sets) if (!act.some(e => e.id === id)) delete sets[id];
        if (!act.length) continue;
        any = true;
        for (const e of act) {
            const p = s.px[e.id];
            const k = { sp: p.speed / 100, sz: p.size / 100, al: p.opacity / 100 };
            const set = sets[e.id] || (sets[e.id] = []);
            const n = Math.round(p.count);
            while (set.length < n) set.push(e.make(W, H, true));
            if (set.length > n) set.length = n;
            ctx.save();
            if (e.add) ctx.globalCompositeOperation = 'lighter';
            for (let i = 0; i < set.length; i++) {
                if (e.tick(ctx, set[i], dt, W, H, p, k)) set[i] = e.make(W, H, false);
            }
            ctx.restore();
        }
    }
    raf = any ? requestAnimationFrame(loop) : 0;
}

function ensureLoop() {
    if (!raf) {
        lastTs = performance.now();
        raf = requestAnimationFrame(loop);
    }
}

/* =====================================================================
 *  Применение настроек
 * ===================================================================== */
function apply() {
    const s = settings();
    const on = !!s.enabled;

    const rgbV = s.fx.rgb.value;
    document.getElementById('n90-rgb-r')?.setAttribute('dx', rgbV);
    document.getElementById('n90-rgb-b')?.setAttribute('dx', -rgbV);
    const lv = Math.max(2, s.fx.poster.value);
    const table = Array.from({ length: lv }, (_, i) => (i / (lv - 1)).toFixed(3)).join(' ');
    for (const id of ['n90-pr', 'n90-pg', 'n90-pb']) document.getElementById(id)?.setAttribute('tableValues', table);

    const bgF = [];
    const thF = [];
    const blur = on ? s.blur : 0;
    if (blur > 0) bgF.push(`blur(${blur}px)`);

    for (const e of LOOKS) {
        const c = s.fx[e.id];
        if (e.type === 'f') {
            if (!on || c.target === 'off') continue;
            const f = e.css(c.value);
            if (c.target === 'bg' || c.target === 'both') bgF.push(f);
            if (c.target === 'theme' || c.target === 'both') thF.push(f);
        } else {
            for (const layer of LAYERS) {
                const el = overlayRefs[e.id][layer];
                const active = on && (c.target === layer || c.target === 'both');
                el.classList.toggle('on', active);
                el.style.setProperty('--o', (c.value / 100).toFixed(2));
                if (e.color) el.style.setProperty('--c', c.color);
            }
        }
    }

    let css = '';
    if (bgF.length) {
        const scale = 1 + (blur * 2.5) / Math.max(320, Math.min(window.innerWidth, window.innerHeight));
        css += `#bg1, #bg_custom { filter: ${bgF.join(' ')} !important;${blur > 0 ? ` transform: scale(${scale.toFixed(4)}) !important;` : ''} }\n`;
    }
    if (thF.length) css += `#sheld, #top-bar { filter: ${thF.join(' ')} !important; }\n`;

    let style = document.getElementById('n90-dynamic-style');
    if (!style) {
        style = document.createElement('style');
        style.id = 'n90-dynamic-style';
        document.head.appendChild(style);
    }
    style.textContent = css;

    if (LAYERS.some(L => activePx(L).length)) ensureLoop();
}

/* =====================================================================
 *  Пресеты
 * ===================================================================== */
function applyPreset(d) {
    const s = settings();
    s.blur = d.blur || 0;
    for (const e of LOOKS) s.fx[e.id] = defaultFx(e);
    for (const e of PX_FX) s.px[e.id] = defaultPx(e);
    for (const [id, v] of Object.entries(d.fx || {})) {
        if (!s.fx[id]) continue;
        s.fx[id] = Array.isArray(v) ? { ...s.fx[id], target: v[0], value: v[1] } : { ...s.fx[id], ...v };
    }
    for (const [id, v] of Object.entries(d.px || {})) {
        if (!s.px[id]) continue;
        s.px[id] = Array.isArray(v) ? { ...s.px[id], target: v[0], ...(v[1] || {}) } : { ...s.px[id], ...v };
    }
    s.enabled = true;
    syncUI(); apply(); save();
}

function snapshot() {
    const s = settings();
    const o = { blur: s.blur, fx: {}, px: {} };
    for (const e of LOOKS) if (s.fx[e.id].target !== 'off') o.fx[e.id] = { ...s.fx[e.id] };
    for (const e of PX_FX) if (s.px[e.id].target !== 'off') o.px[e.id] = { ...s.px[e.id] };
    return o;
}

function renderUserPresets() {
    const $l = $('#n90_userlist').empty();
    const list = settings().userPresets;
    if (!list.length) {
        $l.append($('<small class="n90-note">Пока пусто. Настрой всё как нравится, впиши название и нажми «Сохранить».</small>'));
        return;
    }
    list.forEach((p, i) => {
        const $row = $('<div class="n90-up"></div>').attr('data-i', i);
        $row.append($('<span class="n90-upname"></span>').text(p.name));
        $row.append('<div class="menu_button n90-upload" title="Загрузить">▶</div>');
        $row.append('<div class="menu_button n90-upover" title="Перезаписать текущими настройками">💾</div>');
        $row.append('<div class="menu_button n90-updel" title="Удалить">🗑</div>');
        $l.append($row);
    });
}

/* =====================================================================
 *  UI
 * ===================================================================== */
const SEG = `<div class="n90-seg">
  <button data-t="off" title="Выключить">✕</button><button data-t="bg">Фон</button><button data-t="theme">Тема</button><button data-t="both">Оба</button>
</div>`;

function lookRow(e) {
    return `
<div class="n90-row" data-kind="fx" data-id="${e.id}">
  <div class="n90-row-head"><span class="n90-name">${e.name}</span><span class="n90-val"></span></div>
  <input type="range" class="n90-range" min="${e.min}" max="${e.max}" step="1">
  ${e.color ? '<label class="n90-color">Цвет <input type="color" class="n90-colorin"></label>' : ''}
  ${SEG}
</div>`;
}

function pxSlider(key, label, min, max) {
    return `<div class="n90-prm"><div class="n90-row-head"><span>${label}</span><span class="n90-val" data-k="${key}"></span></div>
<input type="range" class="n90-prange" data-k="${key}" min="${min}" max="${max}" step="1"></div>`;
}

function pxRow(e) {
    return `
<div class="n90-row n90-pfx" data-kind="px" data-id="${e.id}">
  <div class="n90-row-head"><span class="n90-name">${e.name}</span><span class="n90-gear">⚙ настроить</span></div>
  ${SEG}
  <div class="n90-params" style="display:none">
    ${pxSlider('count', 'Количество', 1, 400)}
    ${pxSlider('speed', 'Скорость', 10, 400)}
    ${pxSlider('size', 'Размер', 20, 400)}
    ${pxSlider('opacity', 'Прозрачность', 5, 100)}
    ${e.def.color ? '<label class="n90-color">Цвет <input type="color" class="n90-pcolor"></label>' : ''}
    <div class="menu_button n90-pxreset">↺ Сбросить параметры</div>
  </div>
</div>`;
}

const drawer = (title, body) => `
<div class="n90-settings">
  <div class="inline-drawer">
    <div class="inline-drawer-toggle inline-drawer-header">
      <b>${title}</b>
      <div class="inline-drawer-icon fa-solid fa-circle-chevron-down down"></div>
    </div>
    <div class="inline-drawer-content">${body}</div>
  </div>
</div>`;

function filtersPanel() {
    return drawer('🎞 Фон: блюр и фильтры', `
<label class="checkbox_label" for="n90_enabled"><input type="checkbox" id="n90_enabled"><span>Включить расширение (фильтры и эффекты)</span></label>

<div class="n90-blur-block">
  <div class="n90-row-head"><b>Блюр фона</b><span id="n90_blur_val">0px</span></div>
  <input type="range" id="n90_blur" min="0" max="50" step="1">
</div>

<div class="n90-section-title">Готовые пресеты</div>
<div class="n90-presets">
  ${PRESETS.map((p, i) => `<div class="menu_button n90-preset" data-i="${i}">${p.name}</div>`).join('')}
</div>

<div class="n90-section-title">Мои пресеты</div>
<div id="n90_userlist"></div>
<div class="n90-saverow">
  <input type="text" id="n90_pname" class="text_pole" placeholder="Название пресета" maxlength="40">
  <div class="menu_button" id="n90_psave">💾 Сохранить</div>
</div>
<small class="n90-note">Сохраняется всё: блюр, фильтры и визуальные эффекты. Такое же название — перезапишет пресет.</small>

<div class="n90-section-title">Фильтры по настроению</div>
${SECTIONS.map(sec => `
<details class="n90-sec" data-sec="${sec.id}">
  <summary>${sec.name} <span class="n90-badge"></span></summary>
  ${LOOKS.filter(l => l.sec === sec.id).map(lookRow).join('')}
</details>`).join('')}

<small class="n90-note">«Тема» = окно чата и верхняя панель. Окна настроек не фильтруются, чтобы ими можно было пользоваться.</small>
<div class="menu_button n90-reset">↺ Сбросить всё</div>`);
}

function effectsPanel() {
    return drawer('✨ Фон: визуальные эффекты', `
<small class="n90-note">Анимированные эффекты поверх фона/темы. Нажми «⚙ настроить», чтобы поменять количество, скорость, размер, прозрачность и цвет. Главный выключатель — в плашке «Фон: блюр и фильтры».</small>
${PX_GROUPS.map(g => `
<div class="n90-section-title">${g}</div>
${PX_FX.filter(e => e.grp === g).map(pxRow).join('')}`).join('')}
<div class="menu_button n90-pxoff">⏹ Выключить все эффекты</div>`);
}

function setSeg($r, target) {
    $r.find('.n90-seg button').removeClass('active');
    $r.find(`.n90-seg button[data-t="${target}"]`).addClass('active');
    $r.toggleClass('is-on', target !== 'off');
}

const fmtPx = (k, v) => (k === 'count' ? `${v}` : `${v}%`);

function syncUI() {
    const s = settings();
    $('#n90_enabled').prop('checked', s.enabled);
    $('#n90_blur').val(s.blur);
    $('#n90_blur_val').text(`${s.blur}px`);

    for (const e of LOOKS) {
        const c = s.fx[e.id];
        const $r = $(`.n90-row[data-kind="fx"][data-id="${e.id}"]`);
        $r.find('.n90-range').val(c.value);
        $r.find('.n90-val').text(`${c.value}${e.unit}`);
        if (e.color) $r.find('.n90-colorin').val(c.color);
        setSeg($r, c.target);
    }
    for (const sec of SECTIONS) {
        const n = LOOKS.filter(l => l.sec === sec.id && s.fx[l.id].target !== 'off').length;
        $(`.n90-sec[data-sec="${sec.id}"] .n90-badge`).text(n ? `● ${n}` : '');
    }
    for (const e of PX_FX) {
        const p = s.px[e.id];
        const $r = $(`.n90-row[data-kind="px"][data-id="${e.id}"]`);
        for (const k of ['count', 'speed', 'size', 'opacity']) {
            $r.find(`.n90-prange[data-k="${k}"]`).val(p[k]);
            $r.find(`.n90-val[data-k="${k}"]`).text(fmtPx(k, p[k]));
        }
        if (e.def.color) $r.find('.n90-pcolor').val(p.color);
        setSeg($r, p.target);
    }
    renderUserPresets();
}

function bindUI() {
    const $p = $('.n90-settings');
    const cfg = $r => ($r.attr('data-kind') === 'px' ? settings().px[$r.attr('data-id')] : settings().fx[$r.attr('data-id')]);

    $p.on('change', '#n90_enabled', function () { settings().enabled = this.checked; apply(); save(); });

    $p.on('input', '#n90_blur', function () {
        settings().blur = Number(this.value);
        $('#n90_blur_val').text(`${this.value}px`);
        apply(); save();
    });

    // выбор цели: выкл / фон / тема / оба
    $p.on('click', '.n90-seg button', function () {
        const c = cfg($(this).closest('.n90-row'));
        const t = $(this).data('t');
        c.target = (c.target === t && t !== 'off') ? 'off' : t;
        syncUI(); apply(); save();
    });

    // фильтры
    $p.on('input', '.n90-range', function () {
        const $r = $(this).closest('.n90-row');
        const e = LOOKS.find(x => x.id === $r.attr('data-id'));
        const v = Number(this.value);
        cfg($r).value = v;
        $r.find('.n90-val').text(`${v}${e.unit}`);
        apply(); save();
    });
    $p.on('input', '.n90-colorin', function () {
        cfg($(this).closest('.n90-row')).color = this.value;
        apply(); save();
    });

    // эффекты
    $p.on('click', '.n90-gear', function () {
        $(this).closest('.n90-row').find('.n90-params').slideToggle(120);
    });
    $p.on('input', '.n90-prange', function () {
        const k = $(this).attr('data-k');
        const $r = $(this).closest('.n90-row');
        const v = Number(this.value);
        cfg($r)[k] = v;
        $r.find(`.n90-val[data-k="${k}"]`).text(fmtPx(k, v));
        apply(); save();
    });
    $p.on('input', '.n90-pcolor', function () {
        cfg($(this).closest('.n90-row')).color = this.value;
        save();
    });
    $p.on('click', '.n90-pxreset', function () {
        const $r = $(this).closest('.n90-row');
        const e = PX_FX.find(x => x.id === $r.attr('data-id'));
        const c = cfg($r);
        Object.assign(c, e.def);
        const s = settings();
        for (const L of LAYERS) delete layers[L].sets[e.id];
        syncUI(); apply(); save();
    });
    $p.on('click', '.n90-pxoff', function () {
        for (const e of PX_FX) settings().px[e.id].target = 'off';
        syncUI(); apply(); save();
    });

    // пресеты
    $p.on('click', '.n90-preset', function () { applyPreset(PRESETS[Number($(this).data('i'))]); });
    $p.on('click', '.n90-reset', function () { applyPreset({}); });

    $p.on('click', '#n90_psave', function () {
        const name = String($('#n90_pname').val() || '').trim();
        if (!name) { toast('warning', 'Впиши название пресета'); return; }
        const list = settings().userPresets;
        const data = { name, ...snapshot() };
        const i = list.findIndex(p => p.name === name);
        if (i >= 0) list[i] = data; else list.push(data);
        $('#n90_pname').val('');
        renderUserPresets(); save();
        toast('success', `Пресет «${name}» сохранён`);
    });
    $p.on('click', '.n90-upload', function () {
        const p = settings().userPresets[Number($(this).closest('.n90-up').attr('data-i'))];
        if (p) applyPreset(p);
    });
    $p.on('click', '.n90-upover', function () {
        const list = settings().userPresets;
        const i = Number($(this).closest('.n90-up').attr('data-i'));
        if (!list[i]) return;
        list[i] = { name: list[i].name, ...snapshot() };
        save();
        toast('success', `Пресет «${list[i].name}» обновлён`);
    });
    $p.on('click', '.n90-updel', function () {
        const list = settings().userPresets;
        const i = Number($(this).closest('.n90-up').attr('data-i'));
        if (!list[i]) return;
        if (!window.confirm(`Удалить пресет «${list[i].name}»?`)) return;
        list.splice(i, 1);
        renderUserPresets(); save();
    });
}

jQuery(() => {
    loadSettings();
    buildSvg();
    buildOverlays();
    buildCanvases();

    const host = $('#extensions_settings2').length ? '#extensions_settings2' : '#extensions_settings';
    $(host).append(filtersPanel());
    $(host).append(effectsPanel());
    bindUI();
    syncUI();
    apply();

    window.addEventListener('resize', () => { resizeCanvases(); apply(); });
});

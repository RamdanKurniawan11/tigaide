/* Script block 1: data-8b-part="motion-gate" */
if (matchMedia('(prefers-reduced-motion: no-preference)').matches && CSS.supports('animation-timeline: view()')) document.documentElement.setAttribute('data-8b-live', '');

/* Script block 2: data-8b-part="section-script:nav" */
(() => {
  const root = document.getElementById('nav');
  if (!root) return;
  const bar = root.querySelector('.nav__bar');
  const toggle = root.querySelector('.nav__toggle');
  const menu = root.querySelector('.menu');
  const close = root.querySelector('.menu__close');
  window.measureNav = () => {
    document.documentElement.style.setProperty('--page-nav-h', `${Math.ceil(bar.getBoundingClientRect().bottom + 12)}px`);
  };
  window.measureNav();
  addEventListener('resize', window.measureNav);
  if (!toggle || !menu || !close) return;
  const open = () => {
    menu.hidden = false;
    toggle.setAttribute('aria-expanded', 'true');
    window.motionKit?.wheel?.stop();
    close.focus();
  };
  const shut = (focusToggle = true) => {
    menu.hidden = true;
    toggle.setAttribute('aria-expanded', 'false');
    window.motionKit?.wheel?.start();
    if (focusToggle) toggle.focus();
  };
  toggle.addEventListener('click', open);
  close.addEventListener('click', () => shut());
  menu.addEventListener('click', event => { if (event.target.closest('a')) shut(false); });
  document.addEventListener('keydown', event => { if (event.key === 'Escape' && !menu.hidden) shut(); });
})();

/* Script block 3: data-8b-part="section-script:hero" */
(() => {
  const hero = document.getElementById('hero');
  if (!hero || !('IntersectionObserver' in window)) return;
  new IntersectionObserver(([entry]) => hero.classList.toggle('is-paused', !entry.isIntersecting)).observe(hero);
})();

/* Script block 4: data-8b-part="section-script:contact" */
(() => {
  const form = document.getElementById('contact-form');
  if (!form) return;
  const status = form.querySelector('.contact__status');
  form.addEventListener('submit', event => {
    event.preventDefault();
    const valid = form.checkValidity();
    status.textContent = valid ? form.dataset.msgOk : form.dataset.msgError;
    if (valid) form.reset();
    else form.querySelector(':invalid')?.focus();
  });
})();

/* Script block 5: data-8b-part="motion-kit" */
(() => {
const live = document.documentElement.hasAttribute('data-8b-live');
const measures = new Set();
let queued = false;
const run = fn => { try { fn(); } catch (error) { console.error('[motion-kit] measure failed', error); } };
const remeasure = () => {
if (queued) return;
queued = true;
requestAnimationFrame(() => { queued = false; measures.forEach(run); realign(); });
};
const realign = () => document.getAnimations().forEach(animation => {
if (animation.timeline && animation.timeline !== document.timeline && animation.playState === 'running') { animation.pause(); animation.play(); }
});
window.motionKit = {
live,
box(element) {
if (!(element instanceof HTMLElement)) { const r = element.getBoundingClientRect(); return { x: r.left + scrollX, y: r.top + scrollY, w: r.width, h: r.height }; }
let x = 0, y = 0, node = element;
while (node) { x += node.offsetLeft; y += node.offsetTop; node = node.offsetParent; }
return { x, y, w: element.offsetWidth, h: element.offsetHeight };
},
set(element, vars) { for (const [name, value] of Object.entries(vars)) element.style.setProperty(name, String(value)); },
measure(fn) { if (!live) return; measures.add(fn); run(fn); },
scene(id, fn) {
if (!live) return;
try { fn(); } catch (error) {
console.error(`[motion-kit] scene ${id} failed; its section stays static`, error);
document.querySelector(`style[data-8b-part="scene:${id}"]`)?.setAttribute('media', 'not all');
}
}
};
if (!live) { window.motionReady = Promise.resolve(); return; }
const number = () => document.querySelectorAll('[data-8b-items]').forEach(group => {
let items;
try { items = [...group.querySelectorAll(group.getAttribute('data-8b-items'))]; } catch { return; }
items.forEach((item, index) => { item.style.setProperty('--i', index); item.style.setProperty('--n', items.length); });
});
number();
measures.add(number);
requestAnimationFrame(realign);
new ResizeObserver(remeasure).observe(document.body);
document.fonts?.ready.then(remeasure);
addEventListener('load', remeasure);
window.motionReady = (document.fonts?.ready ?? Promise.resolve()).then(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
})();
(() => {
const kit = window.motionKit;
if (!kit.live || !matchMedia('(pointer: fine)').matches) return;
let target = scrollY, current = scrollY, last = 0, running = false, paused = false;
const inner = (node, dy) => {
for (; node && node !== document.body && node !== document.documentElement; node = node.parentElement) {
if (!/(auto|scroll)/.test(getComputedStyle(node).overflowY) || node.scrollHeight <= node.clientHeight) continue;
if (dy > 0 ? node.scrollTop + node.clientHeight < node.scrollHeight - 1 : node.scrollTop > 0) return true;
}
return false;
};
const step = now => {
current += (target - current) * (1 - Math.exp(-5.3 * Math.min(0.05, (now - last) / 1000)));
last = now;
if (Math.abs(target - current) < 0.5) current = target;
scrollTo({ top: current, behavior: 'instant' });
if (current !== target) requestAnimationFrame(step); else running = false;
};
addEventListener('wheel', event => {
if (paused || event.ctrlKey || Math.abs(event.deltaX) > Math.abs(event.deltaY) || inner(event.target, event.deltaY)) return;
event.preventDefault();
if (!running) target = current = scrollY;
const unit = event.deltaMode === 1 ? 40 : event.deltaMode === 2 ? innerHeight : 1;
target = Math.max(0, Math.min(document.documentElement.scrollHeight - innerHeight, target + event.deltaY * unit * 0.95));
if (!running) { running = true; last = performance.now(); requestAnimationFrame(step); }
}, { passive: false });
kit.wheel = { stop() { paused = true; }, start() { paused = false; } };
})();
(() => {
const kit = window.motionKit;
if (!kit.live) return;
const at = element => {
const own = /^(\d{1,3}(?:\.\d+)?)%$/.exec((element.getAttribute('data-8b-enter') || '').trim());
return own && +own[1] <= 100 ? own[1] / 100 : 0.88;
};
let pending = [...document.querySelectorAll('[data-8b-motion]')].map(element => ({ element, y: 0, at: at(element) }));
let queued = false;
const check = () => {
queued = false;
pending = pending.filter(item => {
if (item.y > scrollY + innerHeight * item.at) return true;
item.element.classList.add('is-in');
return false;
});
};
const queue = () => { if (!queued) { queued = true; requestAnimationFrame(check); } };
kit.measure(() => { pending.forEach(item => { item.y = kit.box(item.element).y; }); queue(); });
addEventListener('scroll', queue, { passive: true });
})();
(() => {
const kit = window.motionKit;
if (!kit.live) return;
const sheet = new CSSStyleSheet();
sheet.replaceSync('.line{display:block;overflow:clip;padding-block:.12em;margin-block:-.12em}.line:not(:last-child){margin-bottom:0}.line+.line{margin-top:-.24em}.line+.line>.line__in{text-indent:0}:where(h1,h2,h3,h4,h5,h6,p,div,blockquote,figcaption,dd,dt):where([data-8b-split="lines"]:has(>.line)){display:flow-root}.line__in{display:block}.kit-sr{position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%);white-space:nowrap}');
document.adoptedStyleSheets = [...document.adoptedStyleSheets, sheet];
const sources = new WeakMap(), widths = new WeakMap();
const graphemes = typeof Intl.Segmenter === 'function'
? text => [...new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(text)].map(part => part.segment)
: text => [...text];
const span = (className, text) => { const element = document.createElement('span'); element.className = className; if (text != null) element.textContent = text; return element; };
const split = element => {
const mode = element.getAttribute('data-8b-split');
if (sources.has(element)) element.innerHTML = sources.get(element); else sources.set(element, element.innerHTML);
const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT), texts = [];
while (walker.nextNode()) texts.push(walker.currentNode);
let index = 0;
for (const node of texts) {
const fragment = document.createDocumentFragment();
for (const piece of node.data.split(/(\s+)/)) {
if (!piece) continue;
if (/^\s+$/.test(piece)) { fragment.append(piece); continue; }
const word = span('w');
if (mode === 'chars') {
word.setAttribute('aria-hidden', 'true');
for (const character of graphemes(piece)) { const c = span('c', character); c.style.setProperty('--i', index++); word.append(c); }
} else {
word.textContent = piece;
if (mode === 'words') word.style.setProperty('--i', index++);
}
fragment.append(word);
}
node.replaceWith(fragment);
}
if (mode === 'chars') element.append(span('kit-sr', element.textContent.replace(/\s+/g, ' ').trim()));
if (mode === 'lines') {
const lines = [];
let top = null;
for (const child of [...element.childNodes]) {
const probe = child.nodeType === 1 ? child : null;
const at = probe ? probe.getBoundingClientRect().top : top;
if (probe && (top === null || Math.abs(at - top) > 2)) { lines.push([]); top = at; }
if (!lines.length) lines.push([]);
lines.at(-1).push(child);
}
lines.forEach((nodes, i) => {
const line = span('line'), inner = span('line__in');
line.style.setProperty('--i', i);
nodes[0].before(line);
inner.append(...nodes);
line.append(inner);
});
index = lines.length;
widths.set(element, element.clientWidth);
}
element.style.setProperty('--n', index);
};
const pending = [];
let busy = false;
const drain = () => {
if (busy) return;
const element = pending.shift();
if (!element) return;
busy = true;
setTimeout(() => { try { split(element); } catch (error) { console.error('[motion-kit] split failed', error); } busy = false; drain(); }, 0);
};
const near = new IntersectionObserver(entries => entries.forEach(entry => {
if (!entry.isIntersecting) return;
near.unobserve(entry.target);
pending.push(entry.target);
drain();
}), { rootMargin: '100% 0px 100% 0px' });
(document.fonts?.ready ?? Promise.resolve()).then(() => document.querySelectorAll('[data-8b-split]').forEach(element => near.observe(element)));
kit.measure(() => document.querySelectorAll('[data-8b-split="lines"]').forEach(element => {
if (sources.has(element) && widths.get(element) !== element.clientWidth) { pending.push(element); drain(); }
}));
})();
(() => {
if (!window.motionKit.live) return;
const sheet = new CSSStyleSheet();
sheet.replaceSync('[data-8b-off],[data-8b-off]::before,[data-8b-off]::after{animation-play-state:paused!important}');
document.adoptedStyleSheets = [...document.adoptedStyleSheets, sheet];
const watch = new IntersectionObserver(entries => entries.forEach(entry => entry.target.toggleAttribute('data-8b-off', !entry.isIntersecting)));
const watched = new WeakSet();
const scan = () => document.getAnimations().forEach(animation => {
const element = animation.effect?.target;
if (!element || watched.has(element) || animation.effect.getTiming().iterations !== Infinity || animation.timeline !== document.timeline) return;
watched.add(element);
watch.observe(element);
});
scan();
addEventListener('load', scan);
document.addEventListener('animationstart', scan, true);
})();

/* Script block 6: data-8b-part="scene-script:listen" */
motionKit.scene('listen', () => {
  const root = document.getElementById('listen');
  const voice = root.querySelector('.listen__panel--voice');
  const read = root.querySelector('.listen__panel--read');
  const voiceTrack = root.querySelector('.listen__track--voice');
  const rows = [...root.querySelectorAll('.listen__track--read > .listen__row')];
  const wide = matchMedia('(min-width: 48rem)');
  const pairs = rows.map((row, index) => {
    const clone = row.cloneNode(true);
    clone.classList.add('listen__row--voice');
    const text = clone.querySelector('.m-caption__text');
    const words = text.textContent.trim().split(/\s+/);
    text.textContent = '';
    words.forEach((word, i) => {
      const span = document.createElement('span');
      span.className = 'listen__word';
      span.style.setProperty('--h', (0.45 + 0.55 * Math.abs(Math.sin(i * 1.7 + word.length))).toFixed(2));
      span.textContent = word;
      text.append(span, i < words.length - 1 ? ' ' : '');
    });
    motionKit.set(clone, { '--i': index, '--n': rows.length });
    voiceTrack.append(clone);
    return [row, clone];
  });
  root.querySelectorAll('.listen__wave > i').forEach((bar, index) => motionKit.set(bar, { '--listen-k': index }));
  motionKit.measure(() => pairs.forEach(([row, clone]) => {
    const shift = wide.matches
      ? { '--listen-dx': `${-(row.offsetLeft - read.offsetWidth + row.offsetWidth + 32)}px`, '--listen-dy': '0px' }
      : { '--listen-dx': '0px', '--listen-dy': `${voice.offsetHeight}px` };
    motionKit.set(row, shift);
    motionKit.set(clone, shift);
  }));
});

/* Script block 7: data-8b-part="scene-script:calls" */
motionKit.scene('calls', () => {
  const root = document.getElementById('calls');
  const list = root.querySelector('.calls__list');
  const items = [...list.children];
  const first = items[0], last = items[items.length - 1];
  motionKit.measure(() => {
    const at = motionKit.box(list), top = motionKit.box(first), end = motionKit.box(last);
    motionKit.set(root, { '--calls-top': `${top.y - at.y}px`, '--calls-span': `${end.y + end.h - top.y}px` });
  });
});

/* Script block 8: data-8b-part="scene-script:tune" */
motionKit.scene('tune', () => {
  const root = document.getElementById('tune');
  const stage = root.querySelector('.tune__stage');
  const thumbs = [...root.querySelectorAll('.tune__slider > .tune__thumb')];
  const offset = (element, stop) => {
    let x = 0, y = 0;
    for (let node = element; node && node !== stop; node = node.offsetParent) { x += node.offsetLeft; y += node.offsetTop; }
    return { x, y };
  };
  const order = [...document.querySelectorAll('[data-8b-section]')].filter(section => section.getAttribute('data-8b-section') !== 'navigation');
  const calls = order[order.indexOf(root) - 1]?.id === 'calls' ? order[order.indexOf(root) - 1] : null;
  const aside = calls?.querySelector('.calls__aside');
  const sticky = calls?.querySelector('.calls__sticky');
  const screen = calls?.querySelector('.phone__screen');
  const handoff = aside && sticky && screen;
  motionKit.measure(() => {
    thumbs.forEach(thumb => motionKit.set(thumb, { '--tune-track': `${thumb.parentElement.offsetWidth}px` }));
    if (!handoff) return;
    const startScroll = offset(root).y - innerHeight;
    const asideAt = offset(aside);
    const style = getComputedStyle(sticky);
    const released = asideAt.y + aside.offsetHeight - sticky.offsetHeight - startScroll;
    const fromBottom = style.top === 'auto' && style.bottom !== 'auto';
    const stickyY = fromBottom
      ? Math.min(released, innerHeight - (parseFloat(style.bottom) || 0) - sticky.offsetHeight)
      : Math.min(Math.max(asideAt.y - startScroll, parseFloat(style.top) || 0), released);
    const inner = offset(screen, sticky);
    const stageAt = offset(stage);
    motionKit.set(stage, {
      '--tune-x': `${asideAt.x + inner.x + screen.offsetWidth / 2 - (stageAt.x + stage.offsetWidth / 2)}px`,
      '--tune-y': `${stickyY + inner.y + screen.offsetHeight / 2 - (stageAt.y - startScroll + stage.offsetHeight / 2)}px`,
      '--tune-s': innerWidth < 768 ? 0.12 : Math.max(0.16, screen.offsetWidth / stage.offsetWidth)
    });
  });
  if (handoff) root.setAttribute('data-handoff', '');
});

/* Script block 9: data-8b-part="scene-script:rooms" */
motionKit.scene('rooms', () => {
  const root = document.getElementById('rooms');
  const track = root.querySelector('.rooms__track');
  const places = [...track.querySelectorAll('.rooms__place')];
  const wide = matchMedia('(min-width: 48rem)');
  places.forEach(place => {
    const talk = [...place.querySelectorAll('.rooms__talk > *')];
    talk.forEach((line, j) => motionKit.set(line, { '--rooms-j': j }));
    motionKit.set(place, { '--rooms-span': 0.5 + 0.3 * Math.max(0, talk.length - 1) });
  });
  motionKit.measure(() => {
    const width = track.scrollWidth;
    const travel = Math.max(0, width - innerWidth);
    motionKit.set(root, { '--rooms-travel': `${travel}px`, '--rooms-dash': 1 - Math.min(0.9, (innerWidth * 0.6) / width) });
    const end = wide.matches ? 0.66 : 0.4;
    places.forEach(place => {
      const left = motionKit.box(place).x;
      const a = (left - innerWidth) / (travel || 1), b = (left - innerWidth * end) / (travel || 1);
      motionKit.set(place, { '--rooms-a': a, '--rooms-k': 1 / (b - a) });
    });
  });
});

/* Script block 10: data-8b-part="scene-script:setup" */
motionKit.scene('setup', () => {
  const steps = document.getElementById('setup').querySelector('.setup__steps');
  const cards = [...steps.children];
  motionKit.measure(() => {
    const gap = parseFloat(getComputedStyle(steps).rowGap) || 0;
    let natural = 0;
    cards.slice(0, -1).forEach((card, index) => {
      natural += card.offsetHeight + gap;
      const stuck = parseFloat(getComputedStyle(cards[index + 1]).top) || 0;
      motionKit.set(card, { '--setup-from': `${natural}px`, '--setup-to': `${natural - stuck}px` });
    });
  });
});

/* Script block 11: id="calls-product-scroll-script" */
(() => {
  const root = document.querySelector('#calls');
  if (!root) return;
  const items = [...root.querySelectorAll('.calls__list .calls__item[data-product]')];
  const stage = root.querySelector('.calls__visual-stage');
  const imageA = root.querySelector('#calls-product-image');
  const label = root.querySelector('#calls-product-label');
  const device = root.querySelector('#calls-product-device');
  if (!items.length || !imageA || !stage) return;

  const products = {
    hrm: { src: 'assets/hrm.png', alt: 'Tigaide HRM mobile app mockup', label: 'Tigaide HRM', device: 'Mobile App' },
    crm: { src: 'assets/crm.png', alt: 'Tigaide CRM tablet dashboard mockup', label: 'Tigaide CRM', device: 'Tablet Dashboard' },
    commerce: { src: 'assets/commerce.png', alt: 'Tigaide Commerce laptop online store mockup', label: 'Tigaide Commerce', device: 'Online Store · Laptop' },
    compro: { src: 'assets/website.png', alt: 'Tigaide Website builder mockup', label: 'Tigaide compro', device: 'Website Builder· Laptop' },
    cuapp: { src: 'assets/inventory.png', alt: 'Tigaide customs apps', label: 'Custom apps as you go', device: 'Create your own apps· Laptop & Mobile app' },
  };

  // Two layers allow a true crossfade: the current visual stays visible while
  // the next image loads, instead of clearing the preview and causing a flash.
  const imageB = imageA.cloneNode(false);
  imageB.removeAttribute('id');
  imageB.classList.remove('is-active');
  imageB.setAttribute('aria-hidden', 'true');
  stage.insertBefore(imageB, imageA.nextSibling);
  let front = imageA;
  let back = imageB;
  let activeId = 'hrm';
  let raf = 0;
  let lastSwitchAt = 0;

  Object.values(products).forEach(product => { const preload = new Image(); preload.src = product.src; });

  function activate(item, force = false) {
    const id = item?.dataset.product;
    if (!id || !products[id] || (id === activeId && !force)) return;
    const product = products[id];
    activeId = id;
    items.forEach(entry => entry.classList.toggle('is-active', entry === item));
    label.textContent = product.label;
    device.textContent = product.device;

    back.classList.remove('is-active');
    back.alt = product.alt;
    back.onload = () => {
      // Begin fade only after the incoming asset is ready.
      requestAnimationFrame(() => {
        back.classList.add('is-active');
        front.classList.remove('is-active');
        const oldFront = front;
        front = back;
        back = oldFront;
        back.onload = null;
      });
    };
    back.onerror = () => { back.onload = null; };
    back.src = product.src;
    if (back.complete && back.naturalWidth) back.onload();
    lastSwitchAt = performance.now();
  }

  // Choose the item whose center is nearest the viewport's visual center.
  // rAF batches scroll events and avoids IntersectionObserver ratio flicker.
  function updateActive() {
    raf = 0;
    const centerY = window.innerHeight * 0.5;
    let bestItem = items[0];
    let bestDistance = Infinity;
    for (const item of items) {
      const rect = item.getBoundingClientRect();
      const distance = Math.abs((rect.top + rect.bottom) / 2 - centerY);
      if (distance < bestDistance) { bestDistance = distance; bestItem = item; }
    }
    if (bestItem.dataset.product !== activeId) {
      // A small stability window prevents rapid toggling at section boundaries.
      if (performance.now() - lastSwitchAt > 180) activate(bestItem);
    }
  }
  function onScroll() { if (!raf) raf = requestAnimationFrame(updateActive); }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
  activate(items.find(item => item.dataset.product === 'hrm') || items[0], true);
  updateActive();
})();
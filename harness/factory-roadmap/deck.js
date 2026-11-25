(() => {
  const slides = [...document.querySelectorAll('.slide')];
  const tabs = [...document.querySelectorAll('.slide-tabs a')];
  const previous = document.getElementById('previous');
  const next = document.getElementById('next');
  const counter = document.getElementById('page-current');
  const fullscreen = document.getElementById('fullscreen');
  let current = 0;

  function indexFromHash() {
    const index = slides.findIndex(slide => '#' + slide.id === window.location.hash);
    return index < 0 ? 0 : index;
  }

  function show(index, moveFocus = false) {
    current = index;
    slides.forEach((slide, position) => {
      slide.hidden = position !== current;
      slide.classList.toggle('entering', position === current);
      if (position === current) tabs[position].setAttribute('aria-current', 'page');
      else tabs[position].removeAttribute('aria-current');
    });
    previous.disabled = current === 0;
    next.disabled = current === slides.length - 1;
    counter.textContent = String(current + 1).padStart(2, '0');
    if (moveFocus) slides[current].querySelector('[tabindex="-1"]').focus({ preventScroll: true });
    window.scrollTo(0, 0);
  }

  function go(index) {
    if (index < 0 || index >= slides.length || index === current) return;
    history.pushState(null, '', '#' + slides[index].id);
    show(index, true);
  }

  previous.addEventListener('click', () => go(current - 1));
  next.addEventListener('click', () => go(current + 1));
  tabs.forEach((tab, index) => tab.addEventListener('click', event => {
    if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    go(index);
  }));
  window.addEventListener('hashchange', () => show(indexFromHash(), true));
  window.addEventListener('popstate', () => show(indexFromHash(), true));
  window.addEventListener('keydown', event => {
    if (event.altKey || event.metaKey || event.ctrlKey || event.shiftKey || event.defaultPrevented) return;
    if (event.target.closest('input, textarea, select, [contenteditable="true"]')) return;
    if (event.key === ' ' && event.target.closest('button, a, summary')) return;
    const destinations = { ArrowRight: current + 1, PageDown: current + 1, ' ': current + 1, ArrowLeft: current - 1, PageUp: current - 1, Home: 0, End: slides.length - 1 };
    if (!Object.hasOwn(destinations, event.key)) return;
    if (event.target.closest('.framework-figure') && (event.key === 'ArrowLeft' || event.key === 'ArrowRight')) return;
    event.preventDefault();
    go(destinations[event.key]);
  });

  let touchStart = null;
  document.getElementById('deck').addEventListener('touchstart', event => {
    const insideWideFigure = event.target.closest('.framework-figure');
    if (event.touches.length !== 1 || (insideWideFigure && insideWideFigure.scrollWidth > insideWideFigure.clientWidth)) {
      touchStart = null;
      return;
    }
    touchStart = { x: event.touches[0].clientX, y: event.touches[0].clientY };
  }, { passive: true });
  document.addEventListener('touchcancel', () => { touchStart = null; });
  document.addEventListener('touchend', event => {
    if (!touchStart || event.touches.length) return;
    const dx = event.changedTouches[0].clientX - touchStart.x;
    const dy = event.changedTouches[0].clientY - touchStart.y;
    touchStart = null;
    if (Math.abs(dx) > 68 && Math.abs(dx) > Math.abs(dy) * 1.8) go(current + (dx < 0 ? 1 : -1));
  }, { passive: true });

  if (!document.fullscreenEnabled) fullscreen.hidden = true;
  fullscreen.addEventListener('click', async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
    } catch {
      fullscreen.title = '浏览器未允许进入全屏，可使用浏览器的全屏功能。';
    }
  });
  document.addEventListener('fullscreenchange', () => {
    const active = Boolean(document.fullscreenElement);
    fullscreen.setAttribute('aria-label', active ? '退出全屏' : '进入全屏');
    fullscreen.querySelector('span').textContent = active ? '退出全屏' : '全屏';
  });
  show(indexFromHash());
})();

// Announce a section once per visit, after scrolling settles. Revisits announce again.
export function watchPetSections(entries, announce) {
  const controller = new AbortController();
  let timer, current = null, announced = false;
  function check() {
    const height = window.innerHeight;
    const probe = height * .35;
    const visible = entries.map(entry => ({ ...entry, rect: entry.element.getBoundingClientRect() }))
      .filter(entry => entry.rect.bottom > 0 && entry.rect.top < height);
    const atBottom = window.scrollY + height >= document.documentElement.scrollHeight - 3;
    const section = atBottom ? visible.at(-1) :
      visible.find(entry => entry.rect.top <= probe && entry.rect.bottom > probe) || visible[0];
    if (!section) return;
    if (section.element !== current) { current = section.element; announced = false; }
    if (!announced && !document.hidden) announced = announce(section.message) === true;
  }
  function refresh() { clearTimeout(timer); timer = setTimeout(check, 220); }
  for (const [target, event] of [[window, 'scroll'], [window, 'resize'], [window, 'hashchange'], [document, 'visibilitychange']]) {
    target.addEventListener(event, refresh, { signal: controller.signal, passive: true });
  }
  refresh();
  return { refresh, destroy() { clearTimeout(timer); controller.abort(); } };
}

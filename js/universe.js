// Transform-only orbits: each planet counter-rotates to keep its logo upright.
export function mountUniverse(container, data) {
  const escape = value => String(value).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const rings = [
    { size: 36, speed: 36, names: ["React", "HTML", "CSS"] },
    { size: 61, speed: 52, names: ["JavaScript", "Node.js"] },
    { size: 86, speed: 72, names: ["Firebase", "MySQL", "Git"] }
  ];
  const technologies = data.universe;
  container.innerHTML = '<div class="universe" role="group" aria-label="Tech Stack Universe">' +
    '<div class="universe-toolbar"><span class="universe-eyebrow">My development universe</span></div>' +
    '<div class="universe-scene"><div class="universe-sun"><img src="' + escape(data.profileImage) + '" alt="' + escape(data.profileImageAlt) + '" width="120" height="120" loading="lazy"><span>Neil</span></div>' +
    rings.map((ring, ringIndex) => '<ul class="universe-ring" aria-label="Orbit ' + (ringIndex + 1) + '" style="--orbit-size:' + ring.size + '%;--orbit-duration:' + ring.speed + 's">' +
      ring.names.map((name, index) => {
        const tech = technologies.find(item => item.name === name);
        const angle = index * 360 / ring.names.length + ringIndex * 25;
        return '<li class="universe-orbit" style="--angle:' + angle + 'deg;--planet-color:' + tech.color + '"><div class="universe-position"><div class="universe-counter">' +
          '<button type="button" class="universe-planet" aria-label="' + escape(name) + '" aria-pressed="false"><span class="universe-fallback" aria-hidden="true">' + escape(tech.short) + '</span><img src="https://cdn.simpleicons.org/' + tech.icon + '/' + tech.color.slice(1) + '" alt="" width="28" height="28" loading="lazy" decoding="async"><span class="universe-tooltip" aria-hidden="true">' + escape(name) + '</span></button>' +
        '</div></div></li>';
      }).join('') + '</ul>').join('') + '</div>' +
    '<ul class="universe-legend" aria-label="Technologies">' + technologies.map(tech => '<li style="--planet-color:' + tech.color + '">' + escape(tech.name) + '</li>').join('') + '</ul></div>';

  const universe = container.querySelector('.universe');

  const planets = [...container.querySelectorAll('.universe-planet')];
  const clearSelection = () => {
    planets.forEach(planet => planet.setAttribute('aria-pressed', 'false'));
    universe.classList.remove('has-selection');
  };
  planets.forEach(planet => planet.addEventListener('click', () => {
    const selected = planet.getAttribute('aria-pressed') === 'true';
    clearSelection();
    if (!selected) {
      planet.setAttribute('aria-pressed', 'true');
      universe.classList.add('has-selection');
    }
  }));
  universe.addEventListener('keydown', event => { if (event.key === 'Escape') clearSelection(); });
  container.querySelectorAll('.universe-planet img').forEach(image => {
    const loaded = () => image.parentElement.classList.add('has-image');
    if (image.complete && image.naturalWidth > 0) loaded();
    else image.addEventListener('load', loaded, { once: true });
  });
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      universe.classList.toggle('is-offscreen', !entries[0].isIntersecting);
    });
    observer.observe(universe);
  }
}

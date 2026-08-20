import { DATA } from "./data.js";
import { initializeFirebase } from "./firebase.js";

// Render portfolio content and handle page interactions.

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, function(character) {
    return {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    }[character];
  });
}

function titleCase(value) {
  return String(value).toLowerCase().replace(/(^|\s)\S/g, function(character) {
    return character.toUpperCase();
  });
}

function linkAttributes(url) {
  return url && url !== "#" ? ' target="_blank" rel="noopener"' : "";
}

document.title = DATA.name + " | " + DATA.role;
const nameParts = titleCase(DATA.name).split(" ");
const splitAt = Math.ceil(nameParts.length / 2);
document.getElementById("hero-name").innerHTML =
  escapeHtml(nameParts.slice(0, splitAt).join(" ")) +
  "<span>" + escapeHtml(nameParts.slice(splitAt).join(" ")) + "</span>";
document.getElementById("hero-tagline").textContent = DATA.tagline;
document.getElementById("about-role").textContent = DATA.role;

const profileOriginal = document.getElementById("profile-original");
const profileIllustration = document.getElementById("profile-illustration");
profileOriginal.src = DATA.profileImage;
profileIllustration.src = DATA.profileIllustration || DATA.profileImage;

const resumeLink = document.getElementById("resume-link");
if (DATA.resumeUrl && DATA.resumeUrl !== "#") {
  resumeLink.href = DATA.resumeUrl;
  resumeLink.hidden = false;
}

document.getElementById("about-body").innerHTML = DATA.about.map(function(paragraph) {
  return "<p>" + escapeHtml(paragraph) + "</p>";
}).join("");

document.getElementById("skills-body").innerHTML = DATA.skills.map(function(group, index) {
  const items = group.items.length
    ? '<div class="stack-items">' + group.items.map(function(item, itemIndex) {
      const color = /^#[0-9a-f]{6}$/i.test(item.color || "") ? item.color : "#2868ea";
      const iconUrl = typeof item.icon === "string" && item.icon.startsWith("https://cdn.simpleicons.org/") ? item.icon : "";
      const image = iconUrl
        ? '<img class="stack-logo-image" src="' + escapeHtml(iconUrl) + '" alt="" loading="lazy" decoding="async">'
        : "";
      return '<span class="stack-item" style="--stack-index:' + itemIndex + ';--stack-color:' + escapeHtml(color) + '">' +
        '<span class="stack-logo" aria-hidden="true"><span class="stack-logo-fallback">' + escapeHtml(item.logo) + '</span>' + image + '</span>' +
        '<span class="stack-item-name">' + escapeHtml(item.name) + '</span></span>';
    }).join("") + "</div>"
    : '<p class="stack-pending">' + escapeHtml(group.note || "No technologies listed yet") + "</p>";
  const delay = Math.min(index * 80, 160);
  return '<article class="stack-row" data-reveal data-reveal-delay="' + delay + '"><h3>' + escapeHtml(group.group) + "</h3>" + items + "</article>";
}).join("");

document.getElementById("projects-body").innerHTML = DATA.projects.map(function(project, index) {
  const tags = project.tags.map(function(tag) {
    return "<span>" + escapeHtml(tag) + "</span>";
  }).join("");
  const delay = Math.min(index * 65, 195);
  return '<article class="project" data-reveal data-reveal-delay="' + delay + '">' +
    '<span class="project-number">' + String(index + 1).padStart(2, "0") + "</span>" +
    "<div><h3><a href=\"" + escapeHtml(project.url || "#") + "\"" + linkAttributes(project.url) + ">" + escapeHtml(project.name) + "</a></h3>" +
    '<p class="project-desc">' + escapeHtml(project.desc) + "</p></div>" +
    '<div class="project-tags">' + tags + "</div>" +
    '<span class="project-arrow" aria-hidden="true">↗</span></article>';
}).join("");

function renderProjectPlaceholder(project, deviceType) {
  const placeholder = project.placeholder || {};
  const allowedKinds = ["service", "parking", "health", "energy"];
  const kind = allowedKinds.includes(placeholder.kind) ? placeholder.kind : "service";
  const metrics = Array.isArray(placeholder.metrics) ? placeholder.metrics.slice(0, 2) : [];
  const metricMarkup = metrics.map(function(metric, index) {
    return '<span class="project-placeholder-metric project-placeholder-metric--' + (index + 1) + '">' + escapeHtml(metric) + "</span>";
  }).join("");
  const title = placeholder.title || project.title;

  return '<div class="device-placeholder project-placeholder-' + kind + ' project-placeholder-' + deviceType + '" aria-hidden="true">' +
    '<div class="project-placeholder-topbar"><span></span><span></span><span></span></div>' +
    '<div class="project-placeholder-body">' +
      '<p class="project-placeholder-eyebrow">' + escapeHtml(placeholder.eyebrow || project.title) + "</p>" +
      '<h4>' + escapeHtml(title) + "</h4>" +
      '<div class="project-placeholder-metrics">' + metricMarkup + "</div>" +
      '<div class="project-placeholder-chart"><span></span><span></span><span></span><span></span><span></span></div>' +
      '<div class="project-placeholder-list"><span></span><span></span><span></span></div>' +
    "</div>" +
  "</div>";
}

function renderDeviceScreen(project, visual, deviceType) {
  if (visual && visual.src) {
    const fit = visual.fit === "contain" ? "contain" : "cover";
    const projectScreenClass = project.id === "handyhome" && deviceType === "desktop"
      ? " device-screen-image--handyhome-dashboard"
      : "";
    return '<img class="device-screen-image device-screen-image--' + fit + projectScreenClass + '" src="' + escapeHtml(visual.src) + '" alt="' + escapeHtml(visual.alt || (project.title + " preview")) + '" loading="lazy" decoding="async">';
  }
  return renderProjectPlaceholder(project, deviceType);
}

function renderDeviceCaption(visual, description) {
  if (visual && visual.src) return "";
  return '<figcaption class="visually-hidden">' + escapeHtml(description) + "</figcaption>";
}

function renderProjectAction(label, url, isPrimary) {
  if (!url || url === "#") return "";
  return '<a class="showcase-action' + (isPrimary ? " showcase-action-primary" : "") + '" href="' + escapeHtml(url) + '" target="_blank" rel="noopener">' +
    escapeHtml(label) + ' <span aria-hidden="true">&nearr;</span></a>';
}

function renderProjectShowcase(project, index) {
  const projectId = String(project.id || ("project-" + index)).replace(/[^a-z0-9_-]/gi, "");
  const isHandyHome = project.id === "handyhome";
  const number = String(index + 1).padStart(2, "0");
  const technologies = Array.isArray(project.technologies) ? project.technologies : [];
  const focus = Array.isArray(project.focus) ? project.focus : [];
  const tags = technologies.length ? technologies : focus;
  const tagLabel = technologies.length ? "Technology" : "Focus";
  const tagMarkup = tags.map(function(tag) {
    return "<li>" + escapeHtml(tag) + "</li>";
  }).join("");
  const features = (Array.isArray(project.features) ? project.features : []).map(function(feature) {
    return "<li>" + escapeHtml(feature) + "</li>";
  }).join("");
  const links = project.links || {};
  const actions = renderProjectAction("View Project", links.live, true) +
    renderProjectAction("GitHub", links.github, false);
  const visuals = project.visuals || {};
  const desktopDescription = visuals.desktop && visuals.desktop.alt ? visuals.desktop.alt : (project.title + " desktop concept preview");
  const mobileDescription = visuals.mobile && visuals.mobile.alt ? visuals.mobile.alt : (project.title + " mobile concept preview");
  const delay = Math.min(index * 70, 210);
  const showcaseClass = "project-showcase" + (isHandyHome ? " project-showcase--handyhome" : "");
  const motionAttributes = isHandyHome
    ? " data-handyhome-motion"
    : ' data-reveal data-reveal-delay="' + delay + '"';
  const copyRevealClass = isHandyHome ? " project-showcase-reveal" : "";

  return '<article class="' + showcaseClass + '"' + motionAttributes + ' aria-labelledby="project-' + projectId + '">' +
    '<div class="project-showcase-copy">' +
      '<p class="project-showcase-meta' + copyRevealClass + '"><span class="project-showcase-number">' + number + '</span><span class="project-showcase-kicker">' + escapeHtml(project.label || "selected project") + "</span></p>" +
      '<h3 class="project-showcase-title' + copyRevealClass + '" id="project-' + projectId + '">' + escapeHtml(project.title) + "</h3>" +
      '<p class="project-showcase-description' + copyRevealClass + '">' + escapeHtml(project.description || "") + "</p>" +
      '<dl class="project-showcase-details' + copyRevealClass + '">' +
        '<div class="project-showcase-detail"><dt class="project-showcase-detail-label">Role</dt><dd class="project-showcase-detail-value">' + escapeHtml(project.role || "Project Developer") + "</dd></div>" +
        (tags.length ? '<div class="project-showcase-detail"><dt class="project-showcase-detail-label">' + tagLabel + '</dt><dd><ul class="project-showcase-tags" aria-label="' + tagLabel + ' for ' + escapeHtml(project.title) + '">' + tagMarkup + "</ul></dd></div>" : "") +
      "</dl>" +
      '<ul class="project-showcase-features' + copyRevealClass + '" aria-label="Key features">' + features + "</ul>" +
      (actions ? '<div class="project-showcase-actions' + copyRevealClass + '">' + actions + "</div>" : "") +
    "</div>" +
    '<div class="project-showcase-visual">' +
      '<div class="device-stage" data-device-tilt' + (isHandyHome ? " data-handyhome-parallax" : "") + '>' +
        '<div class="device-laptop-motion"><div class="device-laptop-float"><figure class="device-laptop"><div class="device-laptop-camera" aria-hidden="true"></div><div class="device-screen">' +
          renderDeviceScreen(project, visuals.desktop, "desktop") +
        '</div><div class="device-laptop-base" aria-hidden="true"><span></span></div>' + renderDeviceCaption(visuals.desktop, desktopDescription) + "</figure></div></div>" +
        '<div class="device-phone-motion"><div class="device-phone-float"><figure class="device-phone"><div class="device-phone-speaker" aria-hidden="true"></div><div class="device-screen">' +
          renderDeviceScreen(project, visuals.mobile, "mobile") +
        '</div>' + renderDeviceCaption(visuals.mobile, mobileDescription) + "</figure></div></div>" +
      "</div>" +
    "</div>" +
  "</article>";
}

document.getElementById("experience-body").innerHTML = DATA.experience.map(renderProjectShowcase).join("");

const contact = DATA.contact;
const phoneHref = contact.phone.replace(/[^\d+]/g, "");
document.getElementById("contact-body").innerHTML =
  '<form class="contact-form" id="message-form" action="https://formspree.io/f/mzepapbw" method="POST">' +
  '<div class="contact-form-header"><h3>Leave a message</h3><p>Tell me about your project, opportunity, or idea.</p></div>' +
  '<div class="contact-field-row">' +
  '<div class="contact-field"><label for="sender-name">Your name</label><input id="sender-name" name="name" type="text" autocomplete="name" maxlength="80" placeholder="Your name" required></div>' +
  '<div class="contact-field"><label for="sender-email">Your email</label><input id="sender-email" name="email" type="email" autocomplete="email" maxlength="120" placeholder="you@example.com" required></div>' +
  '</div>' +
  '<div class="contact-field"><label for="sender-message">Message</label><textarea id="sender-message" name="message" maxlength="2000" placeholder="Tell me about your project or opportunity." required></textarea></div>' +
  '<button class="message-submit" type="submit">send message <span aria-hidden="true">↗</span></button>' +
  '<p class="form-note">Your message is sent securely to my inbox. I will reply to the email you provide.</p>' +
  '<p class="form-status" id="message-status" aria-live="polite"></p>' +
  '<div class="contact-honeypot" aria-hidden="true"><label for="contact-website">Website</label><input id="contact-website" name="website" type="text" tabindex="-1" autocomplete="off"></div>' +
  '</form>' +
  '<div class="contact-details" aria-label="Direct contact details">' +
  '<p class="contact-details-title">Direct contact</p>' +
  '<a class="contact-detail contact-detail-email" href="mailto:' + escapeHtml(contact.email) + '"><span class="contact-detail-label">Email</span><span class="contact-detail-value">' + escapeHtml(contact.email) + '</span><span class="contact-detail-action" aria-hidden="true">↗</span></a>' +
  '<button class="contact-detail" id="copy-email" type="button"><span class="contact-detail-label copy-label">Copy email</span><span class="contact-detail-value">' + escapeHtml(contact.email) + '</span><span class="contact-detail-action" aria-hidden="true">⌘ C</span></button>' +
  '<a class="contact-detail" href="tel:' + escapeHtml(phoneHref) + '"><span class="contact-detail-label">Phone</span><span class="contact-detail-value">' + escapeHtml(contact.phone) + '</span><span class="contact-detail-action" aria-hidden="true">↗</span></a>' +
  '<div class="contact-detail contact-detail-location"><span class="contact-detail-label">Location</span><span class="contact-detail-value">' + escapeHtml(contact.location) + '</span></div>' +
  '</div>';

async function sendContactMessage(event) {
  event.preventDefault();
  const form = event.currentTarget;
  if (!form.checkValidity()) {
    form.reportValidity();
    return;
  }

  const status = document.getElementById("message-status");
  const submitButton = form.querySelector(".message-submit");
  const originalButtonContent = submitButton.innerHTML;
  submitButton.disabled = true;
  submitButton.innerHTML = 'sending <span aria-hidden="true">↗</span>';
  status.textContent = "Sending your message...";
  form.classList.add("is-opening");
  try {
    const response = await fetch(form.action, {
      method: form.method || "POST",
      headers: { Accept: "application/json" },
      body: new FormData(form)
    });
    const result = await response.json().catch(function() { return {}; });
    if (!response.ok) {
      const messages = Array.isArray(result.errors)
        ? result.errors.map(function(error) { return error.message; }).filter(Boolean).join(" ")
        : "";
      throw new Error(messages || "Your message could not be sent right now. Please try again.");
    }

    status.textContent = "Thanks — your message has been sent. I will reply to the email you provided.";
    form.reset();
  } catch (error) {
    status.textContent = error.message || "Your message could not be sent right now. Please use the direct email link instead.";
  } finally {
    form.classList.remove("is-opening");
    submitButton.disabled = false;
    submitButton.innerHTML = originalButtonContent;
  }
}
document.getElementById("message-form").addEventListener("submit", sendContactMessage);

function copyEmail() {
  const copyButton = document.getElementById("copy-email");
  const label = copyButton.querySelector(".copy-label");
  const originalLabel = label.textContent;
  const fallbackCopy = function() {
    const helper = document.createElement("textarea");
    helper.value = contact.email;
    helper.setAttribute("readonly", "");
    helper.style.position = "fixed";
    helper.style.opacity = "0";
    document.body.appendChild(helper);
    helper.select();
    document.execCommand("copy");
    helper.remove();
  };
  const copied = navigator.clipboard && window.isSecureContext
    ? navigator.clipboard.writeText(contact.email)
    : Promise.resolve().then(fallbackCopy);

  copied.then(function() {
    label.textContent = "copied";
    window.setTimeout(function() { label.textContent = originalLabel; }, 1500);
  }).catch(function() {
    label.textContent = "copy failed";
    window.setTimeout(function() { label.textContent = originalLabel; }, 1500);
  });
}
document.getElementById("copy-email").addEventListener("click", copyEmail);

function setupImageTransitions() {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const images = Array.from(document.querySelectorAll(".portrait, .device-screen-image"));
  if (!images.length) return;

  document.documentElement.classList.add("motion-ready");
  images.forEach(function(image) {
    const showImage = function() { image.classList.add("is-loaded"); };
    if (image.complete) {
      window.requestAnimationFrame(showImage);
      return;
    }
    image.addEventListener("load", showImage, { once: true });
    image.addEventListener("error", showImage, { once: true });
  });
}

function setupProfileSequence() {
  const display = document.getElementById("profile-display");
  const illustration = document.getElementById("profile-illustration");
  const status = document.getElementById("profile-toggle-status");
  if (!display || !illustration || !status) return;

  let switchTimer;

  function setPortrait(showOriginal, announce) {
    const isOriginal = Boolean(showOriginal);
    display.classList.toggle("is-original", isOriginal);
    display.setAttribute("aria-label", isOriginal ? "Original graduation portrait of NEIL IVAN V. TANAMOR" : "Illustrated graduation portrait of NEIL IVAN V. TANAMOR");
    if (announce) {
      status.textContent = isOriginal ? "Original graduation portrait displayed." : "Illustrated graduation portrait displayed.";
    }
  }

  function playSwitchEffect() {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    display.classList.remove("is-switching");
    void display.offsetWidth;
    display.classList.add("is-switching");
    window.clearTimeout(switchTimer);
    switchTimer = window.setTimeout(function() {
      display.classList.remove("is-switching");
    }, 760);
  }

  function showOriginal() {
    setPortrait(true, true);
    playSwitchEffect();
  }

  function scheduleOriginal() {
    const delay = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 1900;
    window.setTimeout(showOriginal, delay);
  }

  function useOriginalFallback() {
    setPortrait(true, false);
  }

  if (illustration.complete) {
    if (illustration.naturalWidth > 0) scheduleOriginal();
    else useOriginalFallback();
  } else {
    illustration.addEventListener("load", scheduleOriginal, { once: true });
    illustration.addEventListener("error", useOriginalFallback, { once: true });
  }
}

function setupProjectDeviceTilt() {
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
  if (reducedMotion.matches || !finePointer.matches) return;

  const stages = Array.from(document.querySelectorAll("[data-device-tilt]"));
  stages.forEach(function(stage) {
    let frameId = 0;

    function resetTilt() {
      window.cancelAnimationFrame(frameId);
      stage.classList.remove("is-tilting");
      stage.style.removeProperty("--device-tilt-x");
      stage.style.removeProperty("--device-tilt-y");
      stage.style.removeProperty("--device-lift");
    }

    function updateTilt(event) {
      if (event.pointerType && event.pointerType !== "mouse") return;
      const bounds = stage.getBoundingClientRect();
      if (!bounds.width || !bounds.height) return;

      const relativeX = Math.max(-1, Math.min(1, ((event.clientX - bounds.left) / bounds.width - .5) * 2));
      const relativeY = Math.max(-1, Math.min(1, ((event.clientY - bounds.top) / bounds.height - .5) * 2));
      window.cancelAnimationFrame(frameId);
      frameId = window.requestAnimationFrame(function() {
        stage.classList.add("is-tilting");
        stage.style.setProperty("--device-tilt-x", String(relativeY * -3.2) + "deg");
        stage.style.setProperty("--device-tilt-y", String(relativeX * 3.2) + "deg");
        stage.style.setProperty("--device-lift", String(Math.abs(relativeX) + Math.abs(relativeY)) + "px");
      });
    }

    stage.addEventListener("pointermove", updateTilt, { passive: true });
    stage.addEventListener("pointerleave", resetTilt);
    stage.addEventListener("pointercancel", resetTilt);
  });
}

function setupHandyHomeMotion() {
  const showcases = Array.from(document.querySelectorAll("[data-handyhome-motion]"));
  if (!showcases.length) return;

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  if (reducedMotion.matches || !("IntersectionObserver" in window)) {
    showcases.forEach(function(showcase) { showcase.classList.add("is-handyhome-visible"); });
    return;
  }

  document.documentElement.classList.add("js");

  const activeStages = new Set();
  const mobileViewport = window.matchMedia("(max-width: 720px)");
  let frameId = 0;
  let isTracking = false;

  function updateParallax() {
    frameId = 0;
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
    const laptopDistance = mobileViewport.matches ? 6 : 15;
    const phoneDistance = mobileViewport.matches ? 9 : 25;

    activeStages.forEach(function(stage) {
      const bounds = stage.getBoundingClientRect();
      const progress = Math.max(0, Math.min(1, (viewportHeight - bounds.top) / (viewportHeight + bounds.height)));
      const laptop = stage.querySelector(".device-laptop-motion");
      const phone = stage.querySelector(".device-phone-motion");

      if (laptop) laptop.style.setProperty("--handyhome-laptop-parallax", String(progress * -laptopDistance) + "px");
      if (phone) phone.style.setProperty("--handyhome-phone-parallax", String(progress * -phoneDistance) + "px");
    });
  }

  function queueParallax() {
    if (!activeStages.size || frameId) return;
    frameId = window.requestAnimationFrame(updateParallax);
  }

  function stopTracking() {
    if (activeStages.size || !isTracking) return;
    window.removeEventListener("scroll", queueParallax);
    window.removeEventListener("resize", queueParallax);
    window.cancelAnimationFrame(frameId);
    frameId = 0;
    isTracking = false;
  }

  function startTracking() {
    if (!isTracking) {
      window.addEventListener("scroll", queueParallax, { passive: true });
      window.addEventListener("resize", queueParallax);
      isTracking = true;
    }
    queueParallax();
  }

  const revealObserver = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("is-handyhome-visible");
      revealObserver.unobserve(entry.target);
    });
  }, { threshold: .2 });

  const visibilityObserver = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      const stage = entry.target;
      const showcase = stage.closest("[data-handyhome-motion]");
      const laptop = stage.querySelector(".device-laptop-motion");
      const phone = stage.querySelector(".device-phone-motion");

      if (entry.isIntersecting) {
        activeStages.add(stage);
        if (showcase) showcase.classList.add("is-handyhome-in-view");
        startTracking();
        return;
      }

      activeStages.delete(stage);
      if (showcase) showcase.classList.remove("is-handyhome-in-view");
      if (laptop) laptop.style.removeProperty("--handyhome-laptop-parallax");
      if (phone) phone.style.removeProperty("--handyhome-phone-parallax");
      stopTracking();
    });
  }, { threshold: 0 });

  showcases.forEach(function(showcase) {
    revealObserver.observe(showcase);
    const stage = showcase.querySelector("[data-handyhome-parallax]");
    if (stage) visibilityObserver.observe(stage);
  });
}

function setupStackLogos() {
  const images = Array.from(document.querySelectorAll(".stack-logo-image"));
  images.forEach(function(image) {
    const logo = image.closest(".stack-logo");
    const showLogo = function() { logo.classList.add("has-image"); };
    if (image.complete && image.naturalWidth > 0) {
      window.requestAnimationFrame(showLogo);
      return;
    }
    image.addEventListener("load", showLogo, { once: true });
  });
}

function setupReveals() {
  const targets = Array.from(document.querySelectorAll("[data-reveal]"));
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reducedMotion || !("IntersectionObserver" in window)) {
    targets.forEach(function(target) { target.classList.add("is-visible"); });
    return;
  }

  document.documentElement.classList.add("js");
  targets.forEach(function(target, index) {
    const customDelay = Number(target.dataset.revealDelay);
    const delay = Number.isFinite(customDelay) ? customDelay : Math.min(index * 45, 220);
    target.style.setProperty("--reveal-delay", String(delay) + "ms");
  });
  const observer = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("is-visible");
      observer.unobserve(entry.target);
    });
  }, { threshold: .1, rootMargin: "0px 0px -30px" });
  targets.forEach(function(target) { observer.observe(target); });
}

function setupScrollSpy() {
  const links = Array.from(document.querySelectorAll('.nav-links a[href^="#"]'));
  const sections = links.map(function(link) {
    return document.querySelector(link.getAttribute("href"));
  }).filter(Boolean);
  if (!links.length || !sections.length || !("IntersectionObserver" in window)) return;

  const setActiveLink = function(sectionId) {
    links.forEach(function(link) {
      const isActive = link.getAttribute("href") === "#" + sectionId;
      link.classList.toggle("is-active", isActive);
      if (isActive) link.setAttribute("aria-current", "location");
      else link.removeAttribute("aria-current");
    });
  };

  links.forEach(function(link) {
    link.addEventListener("click", function() {
      setActiveLink(link.getAttribute("href").slice(1));
    });
  });

  const observer = new IntersectionObserver(function(entries) {
    const visible = entries.filter(function(entry) { return entry.isIntersecting; });
    if (!visible.length) return;
    visible.sort(function(a, b) { return b.intersectionRatio - a.intersectionRatio; });
    setActiveLink(visible[0].target.id);
  }, { threshold: [0.1, 0.35, 0.6], rootMargin: "-20% 0px -60% 0px" });
  sections.forEach(function(section) { observer.observe(section); });
}

setupReveals();
setupImageTransitions();
setupProfileSequence();
setupProjectDeviceTilt();
setupHandyHomeMotion();
setupStackLogos();
setupScrollSpy();
void initializeFirebase();

const themeToggle = document.getElementById("theme-toggle");
themeToggle.addEventListener("click", function() {
  const isDark = document.body.classList.toggle("dark");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!reducedMotion) {
    themeToggle.classList.remove("is-switching");
    void themeToggle.offsetWidth;
    themeToggle.classList.add("is-switching");
  }
  themeToggle.textContent = isDark ? "☼" : "◐";
  themeToggle.setAttribute("aria-label", isDark ? "Switch to light theme" : "Switch to dark theme");
  themeToggle.setAttribute("aria-pressed", String(isDark));
});
themeToggle.addEventListener("animationend", function(event) {
  if (event.animationName === "theme-swap") themeToggle.classList.remove("is-switching");
});

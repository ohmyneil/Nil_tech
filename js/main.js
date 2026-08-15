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
document.getElementById("footer-note").textContent = DATA.footerNote + " / " + new Date().getFullYear();

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

document.getElementById("experience-body").innerHTML = DATA.experience.map(function(item, index) {
  const points = item.points.map(function(point) {
    return "<li>" + escapeHtml(point) + "</li>";
  }).join("");
  const title = item.url
    ? '<a href="' + escapeHtml(item.url) + '" target="_blank" rel="noopener">' + escapeHtml(item.title) + ' ↗</a>'
    : escapeHtml(item.title);
  const projectArrow = item.url ? '<span class="experience-arrow" aria-hidden="true">↗</span>' : "";
  const gallery = item.images && item.images.length
    ? '<div class="project-gallery project-gallery--' + item.images.length + '" aria-label="' + escapeHtml(item.title) + ' project screenshots">' +
      item.images.map(function(image, index) {
        const shotClass = index === 0 ? "project-shot project-shot-main" : "project-shot";
        const shotStyle = ' style="--shot-delay:' + (120 + (index * 90)) + 'ms"';
        const figure = '<figure><img src="' + escapeHtml(image.src) + '" alt="' + escapeHtml(image.alt) + '" loading="lazy" decoding="async">' +
          '<figcaption>' + escapeHtml(image.label) + '</figcaption></figure>';
        return item.url
          ? '<a class="' + shotClass + '" href="' + escapeHtml(item.url) + '" target="_blank" rel="noopener"' + shotStyle + '>' + figure + '</a>'
          : '<div class="' + shotClass + '"' + shotStyle + '>' + figure + '</div>';
      }).join("") +
      '</div>'
    : "";
  const delay = Math.min(index * 80, 160);
  return '<article class="experience" data-reveal data-reveal-delay="' + delay + '">' +
    '<div class="experience-date">' + escapeHtml(item.meta) + "</div>" +
    "<div><h3>" + title + "</h3>" +
    '<p class="experience-meta">' + escapeHtml(item.version) + "</p></div>" +
    projectArrow +
    '<ul class="experience-points">' + points + "</ul>" + gallery + "</article>";
}).join("");

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
  const images = Array.from(document.querySelectorAll(".portrait, .project-shot img"));
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

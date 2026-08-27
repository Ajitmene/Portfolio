/* =========================================================
   AJIT MENE — Portfolio
   Dynamic project rendering, filtering, modal, nav & UX behavior
   ========================================================= */

(() => {
  "use strict";

  const DATA_URL = "data/projects.json";
  const CERTS_URL = "data/certifications.json";
  const ADMIN_OVERRIDE_KEY = "portfolio_admin_projects_v1"; // demo-mode local overrides written by /admin

  /* ---------------------------------------------------------
     Utilities
  --------------------------------------------------------- */
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  function escapeHTML(str = "") {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  /**
   * Loads project data. In production (served over http/https, e.g. GitHub
   * Pages) this fetches data/projects.json. If a demo admin session has
   * saved local edits (see /admin), those overrides are merged on top so
   * changes made in the demo admin panel are reflected immediately.
   */
  async function loadProjects() {
    let baseProjects = [];
    try {
      const res = await fetch(DATA_URL, { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      baseProjects = await res.json();
    } catch (err) {
      console.error("Could not load project data:", err);
      showProjectLoadError();
      return [];
    }

    // Merge any local demo-admin overrides (see admin/js/admin.js)
    try {
      const raw = localStorage.getItem(ADMIN_OVERRIDE_KEY);
      if (raw) {
        const overrides = JSON.parse(raw);
        if (Array.isArray(overrides) && overrides.length) {
          return overrides;
        }
      }
    } catch (e) {
      /* ignore malformed local overrides */
    }

    return baseProjects;
  }

  function showProjectLoadError() {
    const grid = $("#projectsGrid");
    const featured = $("#featuredProjectSlot");
    const msg = `
      <div class="data-error" role="alert">
        <i class="fas fa-triangle-exclamation"></i>
        <p>Projects couldn't be loaded right now. If you're viewing this file
        locally, run it through a local web server (e.g. <code>python -m http.server</code>)
        instead of opening index.html directly — browsers block JSON file
        access from the <code>file://</code> protocol.</p>
      </div>`;
    if (grid) grid.innerHTML = msg;
    if (featured) featured.innerHTML = "";
  }

  async function loadCertifications() {
    try {
      const res = await fetch(CERTS_URL, { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      console.error("Could not load certifications:", err);
      return [];
    }
  }

  /* ---------------------------------------------------------
     Project rendering
  --------------------------------------------------------- */
  let allProjects = [];
  let activeFilter = "All";

  function techBadges(technologies = []) {
    return technologies.map((t) => `<span>${escapeHTML(t)}</span>`).join("");
  }

  function statusBadge(status) {
    if (!status) return "";
    const cls = status.toLowerCase() === "live" ? "status-live" : "status-done";
    return `<span class="status-badge ${cls}">${escapeHTML(status)}</span>`;
  }

  function renderFeatured(project) {
    const slot = $("#featuredProjectSlot");
    if (!slot) return;
    if (!project) {
      slot.innerHTML = "";
      return;
    }

    const liveDemoBtn =
      project.liveDemo && project.liveDemo.trim()
        ? `<a href="${escapeHTML(project.liveDemo)}" target="_blank" rel="noopener" class="btn btn-outline-info ms-2">Live Demo</a>`
        : "";

    slot.innerHTML = `
      <div class="featured-project" data-aos="zoom-in">
        <div class="row align-items-center">
          <div class="col-lg-6">
            <img src="${escapeHTML(project.image)}" class="img-fluid rounded project-image"
                 alt="${escapeHTML(project.title)} screenshot" loading="lazy"
                 onerror="this.onerror=null;this.src='assets/images/placeholder.svg';" />
          </div>
          <div class="col-lg-6">
            <span class="featured-badge">⭐ Featured Project</span>
            ${statusBadge(project.status)}
            <h2 class="mt-3">${escapeHTML(project.title)}</h2>
            <p>${escapeHTML(project.shortDescription)}</p>
            <div class="tech-stack">${techBadges(project.technologies)}</div>
            <div class="mt-4">
              <a href="${escapeHTML(project.github)}" target="_blank" rel="noopener" class="btn btn-primary">
                <i class="fab fa-github"></i> GitHub
              </a>
              ${liveDemoBtn}
              <button type="button" class="btn btn-outline-light ms-2" data-view-project="${project.id}">
                View Details
              </button>
            </div>
          </div>
        </div>
      </div>`;
  }

  function projectCard(project) {
    const liveDemoBtn =
      project.liveDemo && project.liveDemo.trim()
        ? `<a href="${escapeHTML(project.liveDemo)}" target="_blank" rel="noopener" class="btn btn-sm btn-outline-info">Live Demo</a>`
        : "";
    const featuredTag = project.featured ? `<span class="mini-badge">Featured</span>` : "";

    return `
      <div class="col-lg-4 col-md-6 project-item" data-category="${escapeHTML(project.category)}" data-aos="fade-up">
        <div class="project-card">
          <div class="project-card-img">
            <img src="${escapeHTML(project.image)}" alt="${escapeHTML(project.title)} screenshot" loading="lazy"
                 onerror="this.onerror=null;this.src='assets/images/placeholder.svg';" />
            ${statusBadge(project.status)}
          </div>
          <div class="project-card-body">
            <div class="project-card-tags">
              <span class="category-tag">${escapeHTML(project.category)}</span>
              ${featuredTag}
            </div>
            <h4>${escapeHTML(project.title)}</h4>
            <p>${escapeHTML(project.shortDescription)}</p>
            <div class="tech-stack small-stack">${techBadges(project.technologies)}</div>
            <div class="project-card-actions">
              <a href="${escapeHTML(project.github)}" target="_blank" rel="noopener" class="btn btn-sm btn-primary">
                <i class="fab fa-github"></i> GitHub
              </a>
              ${liveDemoBtn}
              <button type="button" class="btn btn-sm btn-outline-light" data-view-project="${project.id}">
                View Details
              </button>
            </div>
          </div>
        </div>
      </div>`;
  }

  function renderGrid() {
    const grid = $("#projectsGrid");
    if (!grid) return;

    const nonFeatured = allProjects
      .slice()
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

    const visible =
      activeFilter === "All"
        ? nonFeatured
        : nonFeatured.filter((p) => p.category === activeFilter);

    if (!visible.length) {
      grid.innerHTML = `<div class="col-12 text-center text-secondary py-5">No projects in this category yet.</div>`;
      return;
    }

    grid.innerHTML = visible.map(projectCard).join("");
    if (window.AOS) AOS.refreshHard();
  }

  function renderFilters() {
    const bar = $("#projectFilters");
    if (!bar) return;
    const categories = ["All", ...new Set(allProjects.map((p) => p.category))];
    bar.innerHTML = categories
      .map(
        (cat) =>
          `<button type="button" class="filter-btn ${cat === activeFilter ? "active" : ""}" data-filter="${escapeHTML(cat)}">${escapeHTML(cat)}</button>`
      )
      .join("");

    bar.addEventListener("click", (e) => {
      const btn = e.target.closest(".filter-btn");
      if (!btn) return;
      activeFilter = btn.dataset.filter;
      $$(".filter-btn", bar).forEach((b) => b.classList.toggle("active", b === btn));
      renderGrid();
    });
  }

  /* ---------------------------------------------------------
     Modal
  --------------------------------------------------------- */
  function openProjectModal(id) {
    const project = allProjects.find((p) => String(p.id) === String(id));
    if (!project) return;

    const modal = $("#projectModal");
    const liveDemoBtn =
      project.liveDemo && project.liveDemo.trim()
        ? `<a href="${escapeHTML(project.liveDemo)}" target="_blank" rel="noopener" class="btn btn-outline-info ms-2">Live Demo</a>`
        : "";
    const metricsBlock =
      project.metrics && project.metrics.length
        ? `<h6 class="mt-3">Results</h6><ul class="modal-metrics">${project.metrics
            .map((m) => `<li>${escapeHTML(m.label)}: <strong>${escapeHTML(m.value)}</strong></li>`)
            .join("")}</ul>`
        : "";

    $("#projectModalBody").innerHTML = `
      <img src="${escapeHTML(project.image)}" class="img-fluid rounded mb-3" alt="${escapeHTML(project.title)} screenshot"
           onerror="this.onerror=null;this.src='assets/images/placeholder.svg';" />
      <h3>${escapeHTML(project.title)}</h3>
      <div class="tech-stack mb-3">${techBadges(project.technologies)}</div>
      <h6>Problem</h6>
      <p>${escapeHTML(project.problem || "—")}</p>
      <h6>Solution</h6>
      <p>${escapeHTML(project.solution || project.shortDescription)}</p>
      ${
        project.features && project.features.length
          ? `<h6>Key Features</h6><ul>${project.features.map((f) => `<li>${escapeHTML(f)}</li>`).join("")}</ul>`
          : ""
      }
      ${metricsBlock}
      <div class="mt-4">
        <a href="${escapeHTML(project.github)}" target="_blank" rel="noopener" class="btn btn-primary">
          <i class="fab fa-github"></i> GitHub
        </a>
        ${liveDemoBtn}
      </div>`;

    modal.classList.add("open");
    document.body.classList.add("modal-open-lock");
    modal.setAttribute("aria-hidden", "false");
    $("#projectModalClose").focus();
  }

  function closeProjectModal() {
    const modal = $("#projectModal");
    modal.classList.remove("open");
    document.body.classList.remove("modal-open-lock");
    modal.setAttribute("aria-hidden", "true");
  }

  function bindModalEvents() {
    document.addEventListener("click", (e) => {
      const trigger = e.target.closest("[data-view-project]");
      if (trigger) {
        openProjectModal(trigger.dataset.viewProject);
        return;
      }
      if (e.target.closest("[data-close-modal]")) {
        closeProjectModal();
      }
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeProjectModal();
    });
  }

  /* ---------------------------------------------------------
     Certifications
  --------------------------------------------------------- */
  function renderCertifications(certs) {
    const wrap = $("#certificationsList");
    if (!wrap) return;
    if (!certs.length) {
      wrap.innerHTML = `<p class="text-secondary">Certifications will appear here as they're added.</p>`;
      return;
    }
    wrap.innerHTML = certs
      .map(
        (c) => `
      <div class="cert-card" data-aos="fade-up">
        <i class="fas fa-certificate"></i>
        <div>
          <h5>${escapeHTML(c.name)}</h5>
          <p class="mb-1">${escapeHTML(c.organization)}</p>
          <span class="cert-date">${escapeHTML(c.date)}</span>
          ${c.link ? `<a href="${escapeHTML(c.link)}" target="_blank" rel="noopener" class="ms-2">View Certificate</a>` : ""}
        </div>
      </div>`
      )
      .join("");
  }

  /* ---------------------------------------------------------
     Navigation: active section highlight + mobile close on click
  --------------------------------------------------------- */
  function bindNavHighlight() {
    const sections = $$("section[id]");
    const navLinks = $$(".navbar-nav .nav-link[href^='#']");
    if (!sections.length || !navLinks.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const id = entry.target.getAttribute("id");
          navLinks.forEach((link) => {
            link.classList.toggle("active", link.getAttribute("href") === `#${id}`);
          });
        });
      },
      { rootMargin: "-40% 0px -55% 0px" }
    );

    sections.forEach((sec) => observer.observe(sec));

    // Close mobile menu after tapping a link
    navLinks.forEach((link) => {
      link.addEventListener("click", () => {
        const collapse = $("#menu");
        if (collapse && collapse.classList.contains("show")) {
          bootstrap.Collapse.getOrCreateInstance(collapse).hide();
        }
      });
    });
  }

  /* ---------------------------------------------------------
     Contact form (client-side only — see README for backend option)
  --------------------------------------------------------- */
  function bindContactForm() {
    const form = $("#contactForm");
    if (!form) return;

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const name = $("#contactName").value.trim();
      const email = $("#contactEmail").value.trim();
      const subject = $("#contactSubject").value.trim();
      const message = $("#contactMessage").value.trim();
      const status = $("#contactStatus");

      if (!name || !email || !subject || !message) {
        status.textContent = "Please fill in every field before sending.";
        status.className = "contact-status error";
        return;
      }

      const body = encodeURIComponent(`${message}\n\n— ${name} (${email})`);
      const mailtoUrl = `mailto:ajitmene04@gmail.com?subject=${encodeURIComponent(subject)}&body=${body}`;
      window.location.href = mailtoUrl;

      status.textContent = "Opening your email client to send this message…";
      status.className = "contact-status success";
    });
  }

  /* ---------------------------------------------------------
     Init
  --------------------------------------------------------- */
  async function init() {
    if (window.AOS) AOS.init({ once: true, duration: 700 });

    const [projects, certs] = await Promise.all([loadProjects(), loadCertifications()]);
    allProjects = Array.isArray(projects) ? projects : [];

    if (allProjects.length) {
      const featured = allProjects.find((p) => p.featured) || allProjects[0];
      renderFeatured(featured);
      renderFilters();
      renderGrid();
    }

    renderCertifications(certs);
    bindModalEvents();
    bindNavHighlight();
    bindContactForm();
  }

  document.addEventListener("DOMContentLoaded", init);
})();

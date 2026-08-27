/* =========================================================
   Admin panel (DEMO MODE)
   -----------------------------------------------------------
   This is a client-side-only demo. It stores project edits in
   localStorage under PROJECTS_KEY, which js/main.js reads and
   merges on top of data/projects.json when rendering the public
   site in THIS browser only.

   The "login" here is a convenience gate, not real security:
   the passphrase never ships hardcoded in this file — the first
   visitor sets one, and only its SHA-256 hash is stored locally.
   Anyone with browser devtools access can bypass this. Do not
   rely on this for a real deployment — use the Django + DRF
   backend in /backend with real authentication instead.
   ========================================================= */

(() => {
  "use strict";

  const PROJECTS_KEY = "portfolio_admin_projects_v1";
  const PASS_HASH_KEY = "portfolio_admin_pass_hash_v1";
  const SESSION_KEY = "portfolio_admin_session_v1";
  const SOURCE_URL = "../data/projects.json";

  const $ = (sel) => document.querySelector(sel);

  async function sha256(text) {
    const enc = new TextEncoder().encode(text);
    const buf = await crypto.subtle.digest("SHA-256", enc);
    return Array.from(new Uint8Array(buf))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  }

  /* ---------------- Data access ---------------- */
  async function getProjects() {
    const raw = localStorage.getItem(PROJECTS_KEY);
    if (raw) {
      try {
        return JSON.parse(raw);
      } catch (e) {
        /* fall through to source */
      }
    }
    const res = await fetch(SOURCE_URL, { cache: "no-store" });
    const data = await res.json();
    localStorage.setItem(PROJECTS_KEY, JSON.stringify(data));
    return data;
  }

  function saveProjects(projects) {
    localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
  }

  /* ---------------- Login gate ---------------- */
  async function initLogin() {
    const gate = $("#loginGate");
    const dashboard = $("#dashboard");
    const storedHash = localStorage.getItem(PASS_HASH_KEY);
    const title = $("#loginTitle");
    const subtitle = $("#loginSubtitle");

    if (!storedHash) {
      title.textContent = "Create Owner Passphrase";
      subtitle.textContent =
        "No passphrase is set yet on this browser. Choose one to protect this demo panel here.";
    }

    if (sessionStorage.getItem(SESSION_KEY) === "1") {
      gate.classList.add("d-none");
      dashboard.classList.remove("d-none");
      await renderDashboard();
      return;
    }

    $("#loginBtn").addEventListener("click", async () => {
      const val = $("#passphraseInput").value;
      const err = $("#loginError");
      if (!val) {
        err.textContent = "Enter a passphrase.";
        return;
      }
      const hash = await sha256(val);
      const currentHash = localStorage.getItem(PASS_HASH_KEY);

      if (!currentHash) {
        localStorage.setItem(PASS_HASH_KEY, hash);
        sessionStorage.setItem(SESSION_KEY, "1");
        gate.classList.add("d-none");
        dashboard.classList.remove("d-none");
        await renderDashboard();
        return;
      }

      if (hash === currentHash) {
        sessionStorage.setItem(SESSION_KEY, "1");
        gate.classList.add("d-none");
        dashboard.classList.remove("d-none");
        await renderDashboard();
      } else {
        err.textContent = "Incorrect passphrase.";
      }
    });

    $("#resetPassBtn").addEventListener("click", () => {
      if (confirm("Clear the locally stored passphrase on this browser?")) {
        localStorage.removeItem(PASS_HASH_KEY);
        sessionStorage.removeItem(SESSION_KEY);
        location.reload();
      }
    });

    $("#logoutBtn").addEventListener("click", () => {
      sessionStorage.removeItem(SESSION_KEY);
      location.reload();
    });
  }

  /* ---------------- Dashboard rendering ---------------- */
  function showAlert(message, isError = false) {
    const box = $("#adminAlert");
    box.textContent = message;
    box.classList.remove("d-none", "error");
    if (isError) box.classList.add("error");
    setTimeout(() => box.classList.add("d-none"), 3500);
  }

  async function renderDashboard() {
    const projects = (await getProjects()).slice().sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

    $("#statTotal").textContent = projects.length;
    $("#statFeatured").textContent = projects.filter((p) => p.featured).length;
    $("#statLive").textContent = projects.filter((p) => p.status === "Live").length;
    $("#statCategories").textContent = new Set(projects.map((p) => p.category)).size;

    const body = $("#projectsTableBody");
    body.innerHTML = projects
      .map(
        (p, idx) => `
      <tr>
        <td>
          <button class="btn btn-sm btn-outline-light" data-move="up" data-id="${p.id}" ${idx === 0 ? "disabled" : ""}><i class="fas fa-arrow-up"></i></button>
          <button class="btn btn-sm btn-outline-light" data-move="down" data-id="${p.id}" ${idx === projects.length - 1 ? "disabled" : ""}><i class="fas fa-arrow-down"></i></button>
        </td>
        <td>
          <img class="thumb" src="../${p.image}" alt="" onerror="this.style.display='none'">
          ${escapeHTML(p.title)}
        </td>
        <td>${escapeHTML(p.category)}</td>
        <td>${escapeHTML(p.status || "")}</td>
        <td>
          <button class="btn btn-sm ${p.featured ? "btn-warning" : "btn-outline-warning"}" data-toggle-featured="${p.id}">
            ${p.featured ? "★ Featured" : "☆ Mark Featured"}
          </button>
        </td>
        <td class="text-end">
          <button class="btn btn-sm btn-outline-info" data-edit="${p.id}">Edit</button>
          <button class="btn btn-sm btn-outline-danger ms-1" data-delete="${p.id}">Delete</button>
        </td>
      </tr>`
      )
      .join("");
  }

  function escapeHTML(str = "") {
    return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  /* ---------------- Form (add/edit) ---------------- */
  let formModal;

  function openForm(project = null) {
    $("#projectFormTitle").textContent = project ? "Edit Project" : "Add Project";
    $("#projectId").value = project ? project.id : "";
    $("#fTitle").value = project ? project.title : "";
    $("#fShortDescription").value = project ? project.shortDescription : "";
    $("#fCategory").value = project ? project.category : "Machine Learning";
    $("#fStatus").value = project ? project.status : "Completed";
    $("#fTechnologies").value = project ? (project.technologies || []).join(", ") : "";
    $("#fImage").value = project ? project.image : "";
    $("#fGithub").value = project ? project.github : "";
    $("#fLiveDemo").value = project ? project.liveDemo || "" : "";
    $("#fDate").value = project ? project.date : new Date().getFullYear().toString();
    $("#fFeatured").checked = project ? !!project.featured : false;
    formModal.show();
  }

  async function handleFormSubmit(e) {
    e.preventDefault();
    const projects = await getProjects();
    const id = $("#projectId").value;

    const payload = {
      title: $("#fTitle").value.trim(),
      shortDescription: $("#fShortDescription").value.trim(),
      category: $("#fCategory").value,
      status: $("#fStatus").value,
      technologies: $("#fTechnologies").value.split(",").map((t) => t.trim()).filter(Boolean),
      image: $("#fImage").value.trim() || "assets/images/placeholder.svg",
      github: $("#fGithub").value.trim(),
      liveDemo: $("#fLiveDemo").value.trim(),
      date: $("#fDate").value.trim(),
      featured: $("#fFeatured").checked,
    };

    if (!payload.title || !payload.shortDescription || !payload.github) {
      showAlert("Project name, description, and GitHub URL are required.", true);
      return;
    }

    if (id) {
      const idx = projects.findIndex((p) => String(p.id) === String(id));
      if (idx > -1) {
        projects[idx] = { ...projects[idx], ...payload };
      }
    } else {
      const nextId = projects.length ? Math.max(...projects.map((p) => p.id)) + 1 : 1;
      const nextOrder = projects.length ? Math.max(...projects.map((p) => p.order ?? 0)) + 1 : 1;
      projects.push({
        id: nextId,
        order: nextOrder,
        problem: "",
        solution: payload.shortDescription,
        features: [],
        metrics: [],
        ...payload,
      });
    }

    saveProjects(projects);
    formModal.hide();
    showAlert("Project saved.");
    await renderDashboard();
  }

  async function handleTableClick(e) {
    const editId = e.target.closest("[data-edit]")?.dataset.edit;
    const deleteId = e.target.closest("[data-delete]")?.dataset.delete;
    const toggleId = e.target.closest("[data-toggle-featured]")?.dataset.toggleFeatured;
    const moveBtn = e.target.closest("[data-move]");

    const projects = await getProjects();

    if (editId) {
      const project = projects.find((p) => String(p.id) === String(editId));
      openForm(project);
      return;
    }

    if (deleteId) {
      if (!confirm("Delete this project? This only affects your local browser demo data.")) return;
      const updated = projects.filter((p) => String(p.id) !== String(deleteId));
      saveProjects(updated);
      showAlert("Project deleted.");
      await renderDashboard();
      return;
    }

    if (toggleId) {
      const idx = projects.findIndex((p) => String(p.id) === String(toggleId));
      if (idx > -1) {
        projects[idx].featured = !projects[idx].featured;
        saveProjects(projects);
        await renderDashboard();
      }
      return;
    }

    if (moveBtn) {
      const id = moveBtn.dataset.id;
      const dir = moveBtn.dataset.move;
      const sorted = projects.slice().sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
      const idx = sorted.findIndex((p) => String(p.id) === String(id));
      const swapIdx = dir === "up" ? idx - 1 : idx + 1;
      if (swapIdx < 0 || swapIdx >= sorted.length) return;

      const tmpOrder = sorted[idx].order;
      sorted[idx].order = sorted[swapIdx].order;
      sorted[swapIdx].order = tmpOrder;

      saveProjects(sorted);
      await renderDashboard();
    }
  }

  /* ---------------- Init ---------------- */
  document.addEventListener("DOMContentLoaded", () => {
    formModal = new bootstrap.Modal($("#projectFormModal"));

    initLogin();

    $("#addProjectBtn").addEventListener("click", () => openForm(null));
    $("#projectForm").addEventListener("submit", handleFormSubmit);
    $("#projectsTableBody").addEventListener("click", handleTableClick);

    $("#resetDataBtn").addEventListener("click", async () => {
      if (!confirm("Discard local demo edits and reload from data/projects.json?")) return;
      localStorage.removeItem(PROJECTS_KEY);
      showAlert("Reset to source data.");
      await renderDashboard();
    });
  });
})();

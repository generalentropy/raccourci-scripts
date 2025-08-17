// ==UserScript==
// @name         Woody Status Supercharged 🚀
// @namespace    https://github.com/generalentropy/raccourci-scripts
// @version      1.2.15
// @description  Ouvre un projet dans VS Code ou gitlab (selecteur de branche) + site de dev
// @author       Eddy Nicolle
// @match        https://status.woody-wp.com/
// @icon         https://i.imgur.com/5EOGnVN.png
// @grant        none
// @homepageURL  https://github.com/generalentropy/raccourci-scripts
// @updateURL    https://raw.githubusercontent.com/generalentropy/raccourci-scripts/main/status-vscode-plugin.user.js
// @downloadURL  https://raw.githubusercontent.com/generalentropy/raccourci-scripts/main/status-vscode-plugin.user.js
// @run-at       document-idle
// ==/UserScript==

(function () {
  "use strict";

  const HOST_ALIASES = [
    "eddy.wp.rc.dev",
    "maxime.wp.rc.dev",
    "dorothee.wp.rc.dev",
    "celia.wp.rc.dev",
    "marion.wp.rc.dev",
    "sebastien.wp.rc.dev",
  ];
  const BRANCHES = ["master", "develop"];
  const STORAGE_HOST = "vscode_global_host_alias";
  const STORAGE_BRANCH = "gitlab_branch";
  const SETTINGS = {
    row: "rc_settings_row_mode",
    opacity: "rc_settings_icon_opacity_pct",
    hideHost: "rc_settings_hide_host",
    wrapSiteKey: "rc_settings_wrap_sitekey",
    showDev: "rc_settings_show_dev",
    showVS: "rc_settings_show_vscode",
    showGL: "rc_settings_show_gitlab",
  };

  // Mapping optionnel si le siteKey affiché != nom du projet
  const SITEKEY_UPDATE = [
    // { initial: "ancien_nom", updated: "nouveau_nom" }
  ];
  const GITLAB_V2 = ["marseille-tourisme", "ot-verbier", "broceliande"];
  const URL_MODIFIER = [
    { initial: "labauleguerande", updated: "labaule" },
    { initial: "perchesarthois", updated: "perche-sarthois" },
    { initial: "ifpm-orleans", updated: "ifpm45" },
    {
      initial: "staderochelais ",
      updated: "intranet.staderochelais",
      shortUrl: true,
    },
  ];

  const ICONS = {
    vscode: "https://code.visualstudio.com/favicon.ico",
    gitlab: "https://i.imgur.com/BcoMk3p.png",
    dev: "https://i.imgur.com/lLwS7mg.png",
    cog: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9.671 4.136a2.34 2.34 0 0 1 4.659 0 2.34 2.34 0 0 0 3.319 1.915 2.34 2.34 0 0 1 2.33 4.033 2.34 2.34 0 0 0 0 3.831 2.34 2.34 0 0 1-2.33 4.033 2.34 2.34 0 0 0-3.319 1.915 2.34 2.34 0 0 1-4.659 0 2.34 2.34 0 0 0-3.32-1.915 2.34 2.34 0 0 1-2.33-4.033 2.34 2.34 0 0 0 0-3.831A2.34 2.34 0 0 1 6.35 6.051a2.34 2.34 0 0 0 3.319-1.915"/><circle cx="12" cy="12" r="3"/></svg>`,
    close: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-circle-x-icon lucide-circle-x"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/></svg>`,
  };

  const getHost = () => localStorage.getItem(STORAGE_HOST) || HOST_ALIASES[0];
  const setHost = (host) => {
    localStorage.setItem(STORAGE_HOST, host);
    document.documentElement.setAttribute("data-vscode-host", host);
  };

  const getBranch = () => localStorage.getItem(STORAGE_BRANCH) || BRANCHES[0];
  const setBranch = (branch) => {
    localStorage.setItem(STORAGE_BRANCH, branch);
    document.documentElement.setAttribute("data-gitlab-branch", branch);
  };

  let neko = null;

  function ensureStyles() {
    if (document.getElementById("vscode-userscript-style")) return;
    const style = document.createElement("style");
    style.id = "vscode-userscript-style";
    style.textContent = `
:root {
  --rc-accent: rgb(247, 109, 143);
  --rc-gap: 8px;
  --rc-btn-padding: 6px 0;
  --rc-btn-radius: 6px;
  --rc-icon-opacity: 1;
  --rc-td-padding: 0;
}

:root[data-show-dev="0"] .rc-btn--dev {
  display: none !important;
}
:root[data-show-vs="0"] .rc-btn--vs {
  display: none !important;
}
:root[data-show-gl="0"] .rc-btn--gl {
  display: none !important;
}

@property --angle {
  syntax: "<angle>";
  initial-value: 0deg;
  inherits: false;
}

@keyframes border-spin {
  to {
    --angle: 360deg;
  }
}

.cores_wrapper {
  font-family: "Courier New", Courier, monospace;
  color: #fff;
  display: flex;
  flex-wrap: nowrap;
  overflow-x: auto;
  overflow-y: hidden;
  scroll-behavior: smooth;
  gap: 1rem;
  margin: 20px 0 20px 20px;
  padding-bottom: 15px;
  cursor: grab;
  user-select: none;
  scroll-snap-type: x mandatory;
}

.core {
  flex: 0 0 auto;
  width: 380px;
  min-width: 380px;
  max-width: 380px;
  scroll-snap-align: start;
  overflow: hidden;
  contain: content;
}
.core table {
  width: 100%;
  table-layout: fixed;
  border-collapse: collapse;
}
.core td {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  vertical-align: middle;
}
.core td.status {
  width: 90px;
  text-align: left;
}
.core td.site_key {
  width: auto;
  position: relative;
}

td.site_key .rc-cellwrap {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  max-width: 100%;
}
td.site_key .rc-cellwrap > a {
  flex: 1 1 auto;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  text-align: left;
}
:root[data-wrap-sitekey="1"] td.site_key .rc-cellwrap > a {
  white-space: normal;
  line-height: 1.3;
}

.rc-inline {
  margin-left: auto;
  display: inline-flex;
  align-items: center;
  gap: var(--rc-gap);
  flex: 0 0 auto;
}

.plugin-icon {
  opacity: var(--rc-icon-opacity, 1);
  transition: opacity 0.15s ease, transform 0.15s ease, filter 0.2s ease;
  transform-origin: center;
}
.rc-btn:hover .plugin-icon {
  transform: scale(1.12);
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.25));
}
.rc-btn:active .plugin-icon {
  transform: scale(0.96);
}

#vscode-global-host {
  position: fixed;
  top: 10px;
  right: 10px;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 6px 8px;
  border-radius: var(--rc-btn-radius);
  border: 1px solid rgba(0, 0, 0, 0.08);
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(4px);
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}
#vscode-global-host .row {
  display: flex;
  align-items: center;
  gap: var(--rc-gap);
}
#vscode-global-host label {
  font-size: 12px;
  color: #333;
  white-space: nowrap;
}
#vscode-global-host select {
  font-size: 12px;
  padding: 4px 6px;
  border: 1px solid #ddd;
  border-radius: var(--rc-btn-radius);
}

#rc-settings-btn {
  position: fixed;
  right: 16px;
  bottom: 16px;
  z-index: 99999;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  cursor: pointer;
  user-select: none;
  background: rgba(30, 30, 30, 0.9);
  color: #fff;
  border: 1px solid rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(6px);
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.4);
}
#rc-settings-btn:hover {
  background: rgba(45, 45, 45, 0.95);
}
#rc-settings-btn svg {
  width: 20px;
  height: 20px;
  display: block;
}

/* -------- Panel --------  */
#rc-settings-panel {
  position: fixed;
  bottom: 70px;
  right: 16px;
  min-width: 260px;
  background: #111;
  border-radius: 1rem;
  padding: 1.2rem;
  display: none;
  z-index: 9999;

  color: #eee;
  font-family: sans-serif;

  isolation: isolate;
}

/* -------- Bordure --------  */
#rc-settings-panel::before {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: inherit;
  z-index: 0;
  pointer-events: none;

  background: conic-gradient(
    from var(--angle),
    transparent 0%,
    transparent 45%,
    rgba(252, 105, 179, 1) 100%,
    transparent 60%,
    transparent 100%
  );
  animation: border-spin 11s linear infinite;
  filter: blur(8px);

  padding: 2px;
  -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
  -webkit-mask-composite: xor;

  /* pas sûr, à tester sous firefox */
  mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
  mask-composite: exclude;
}

#rc-settings-panel > * {
  position: relative;
  z-index: 1;
}

#rc-settings-panel .row {
  display: flex;
  align-items: center;
  gap: var(--rc-gap);
}
#rc-settings-panel .grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}
#rc-settings-panel .flex {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

#rc-icon-opacity {
  width: 100%;
  accent-color: var(--rc-accent);
  background: transparent;
  cursor: pointer;
}
#rc-icon-opacity::-webkit-slider-runnable-track {
  height: 4px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.2);
}
#rc-icon-opacity::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: var(--rc-accent);
  margin-top: -6px;
  border: none;
  box-shadow: 0 0 0 2px rgba(0, 0, 0, 0.25);
}
#rc-icon-opacity::-moz-range-track {
  height: 4px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.2);
}
#rc-icon-opacity::-moz-range-thumb {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: var(--rc-accent);
  border: none;
  box-shadow: 0 0 0 2px rgba(0, 0, 0, 0.25);
}

.rc-bar {
  display: flex;
  align-items: center;
  gap: var(--rc-gap);
  margin-top: 2px;
}
.rc-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: var(--rc-btn-padding);
  border: none;
  border-radius: var(--rc-btn-radius);
  background: transparent;
  color: #fff;
  font-weight: 600;
  cursor: pointer;
}
.rc-icon {
  width: 16px;
  height: 16px;
  display: block;
}

#rc-settings-panel input[type="checkbox"] {
  accent-color: var(--rc-accent);
  margin-right: 8px;
}
#rc-settings-panel input[type="checkbox"]:checked {
  background-color: var(--rc-accent);
  border-color: var(--rc-accent);
}

#rc-settings-panel hr {
  border: none;
  border-top: 1px dashed var(--rc-accent);
  opacity: 0.5;
  margin: 2px 0 10px 0;
}

td {
  padding: var(--rc-td-padding);
}

#rc-icon-opacity-value {
  font-weight: bold;
  color: rgba(255, 171, 213, 1);
}

#rc-close:hover {
  opacity: 1 !important;
}


`;
    document.head.append(style);
  }

  function updateTdPadding() {
    const showDev = localStorage.getItem(SETTINGS.showDev) !== "false";
    const showVS = localStorage.getItem(SETTINGS.showVS) !== "false";
    const showGL = localStorage.getItem(SETTINGS.showGL) !== "false";

    const allHidden = !showDev && !showVS && !showGL;
    document.documentElement.style.setProperty(
      "--rc-td-padding",
      allHidden ? "5px" : "0"
    );
  }

  function ensureSettings() {
    if (window.__rcSettingsInited) return;
    window.__rcSettingsInited = true;

    const btn = document.createElement("button");
    btn.id = "rc-settings-btn";
    btn.type = "button";
    btn.innerHTML = ICONS.cog;

    const panel = document.createElement("div");
    panel.id = "rc-settings-panel";
    panel.innerHTML = `
      <div class="row" style="justify-content:space-between;margin-bottom:8px;">
        <strong>Réglages</strong>
       <button type="button" id="rc-close" style="background:transparent;border:none;color:white;font-size:16px;line-height:1;cursor:pointer;opacity:0.8">${ICONS.close}</button>
      </div>
       <hr />

      <div class="flex" style="margin-top:6px;">
        <label><input type="checkbox" id="rc-wrap-sitekey">Ne pas tronquer les sitekey longs</label>
        <label><input type="checkbox" id="rc-show-dev">Afficher l'icone de lien vers le dev</label>
        <label><input type="checkbox" id="rc-show-vs">Afficher VS Code</label>
        <label><input type="checkbox" id="rc-show-gl">Afficher GitLab</label>
      </div>

      <div style="margin:15px 0;">
        <div class="row" style="justify-content:space-between; margin-bottom:5px;">
          <span>Opacité des icônes</span><span id="rc-icon-opacity-value">100%</span>
        </div>
        <input type="range" id="rc-icon-opacity" min="0" max="100" step="1">
      </div>
      <div class="flex" style="margin-top:10px;">
       <label><input type="checkbox" id="rc-hide-host">Masquer le panneau de sélection</label>
         <label><input type="checkbox" id="rc-row-toggle">Panneau de selection en ligne / compact</label>
      </div>
    `;

    document.body.append(btn, panel);

    const wrapCbx = panel.querySelector("#rc-wrap-sitekey");
    const devCbx = panel.querySelector("#rc-show-dev");
    const vsCbx = panel.querySelector("#rc-show-vs");
    const glCbx = panel.querySelector("#rc-show-gl");
    const rowCbx = panel.querySelector("#rc-row-toggle");
    const hideCbx = panel.querySelector("#rc-hide-host");
    const slider = panel.querySelector("#rc-icon-opacity");
    const sliderVal = panel.querySelector("#rc-icon-opacity-value");
    const closeBtn = panel.querySelector("#rc-close");

    function initBool(key, defTrue = true) {
      const v = localStorage.getItem(key);
      if (v === null) return defTrue;
      return v === "true";
    }
    function saveBool(key, val) {
      localStorage.setItem(key, String(val));
    }

    function applyWrapSiteKey(enabled) {
      document.documentElement.setAttribute(
        "data-wrap-sitekey",
        enabled ? "1" : "0"
      );
    }
    function applyIconVisibility(flag, attr) {
      document.documentElement.setAttribute(attr, flag ? "1" : "0");
    }
    function applyRow(enabled) {
      const host = document.getElementById("vscode-global-host");
      if (host) host.style.flexDirection = enabled ? "row" : "";
    }
    function applyHideHost(hidden) {
      const host = document.getElementById("vscode-global-host");
      if (host) host.style.display = hidden ? "none" : "";
    }
    function applyOpacity(pct) {
      const v = Math.max(0, Math.min(100, pct));
      const val = String(v / 100);
      document.documentElement.style.setProperty("--rc-icon-opacity", val);
      document.querySelectorAll(".cores_wrapper").forEach((el) => {
        el.style.setProperty("--rc-icon-opacity", val);
      });
      sliderVal.textContent = `${v}%`;
    }

    wrapCbx.checked = initBool(SETTINGS.wrapSiteKey, false);
    devCbx.checked = initBool(SETTINGS.showDev, true);
    vsCbx.checked = initBool(SETTINGS.showVS, true);
    glCbx.checked = initBool(SETTINGS.showGL, true);
    rowCbx.checked = initBool(SETTINGS.row, false);
    hideCbx.checked = initBool(SETTINGS.hideHost, false);

    // état initial
    updateTdPadding();

    const savedPct = parseInt(
      localStorage.getItem(SETTINGS.opacity) ?? "100",
      10
    );
    slider.value = String(Number.isFinite(savedPct) ? savedPct : 100);

    applyWrapSiteKey(wrapCbx.checked);
    applyIconVisibility(devCbx.checked, "data-show-dev");
    applyIconVisibility(vsCbx.checked, "data-show-vs");
    applyIconVisibility(glCbx.checked, "data-show-gl");
    applyRow(rowCbx.checked);
    applyHideHost(hideCbx.checked);
    applyOpacity(parseInt(slider.value, 10));

    wrapCbx.addEventListener("change", () => {
      saveBool(SETTINGS.wrapSiteKey, wrapCbx.checked);
      applyWrapSiteKey(wrapCbx.checked);
    });
    devCbx.addEventListener("change", () => {
      saveBool(SETTINGS.showDev, devCbx.checked);
      applyIconVisibility(devCbx.checked, "data-show-dev");
      updateTdPadding();
    });
    vsCbx.addEventListener("change", () => {
      saveBool(SETTINGS.showVS, vsCbx.checked);
      applyIconVisibility(vsCbx.checked, "data-show-vs");
      updateTdPadding();
    });
    glCbx.addEventListener("change", () => {
      saveBool(SETTINGS.showGL, glCbx.checked);
      applyIconVisibility(glCbx.checked, "data-show-gl");
      updateTdPadding();
    });
    rowCbx.addEventListener("change", () => {
      saveBool(SETTINGS.row, rowCbx.checked);
      applyRow(rowCbx.checked);
    });
    hideCbx.addEventListener("change", () => {
      saveBool(SETTINGS.hideHost, hideCbx.checked);
      applyHideHost(hideCbx.checked);
    });
    slider.addEventListener("input", () => {
      localStorage.setItem(
        SETTINGS.opacity,
        String(parseInt(slider.value, 10))
      );
      applyOpacity(parseInt(slider.value, 10));
    });

    btn.addEventListener("click", () => {
      panel.style.display = panel.style.display === "block" ? "none" : "block";
    });
    closeBtn.addEventListener("click", () => {
      panel.style.display = "none";
    });
  }

  function ensureGlobalSelector() {
    if (document.querySelector("#vscode-global-host")) return;

    const wrap = document.createElement("div");
    wrap.id = "vscode-global-host";

    const rowHost = document.createElement("div");
    rowHost.className = "row";
    const iconVS = document.createElement("img");
    iconVS.src = ICONS.vscode;
    iconVS.alt = "VS Code";
    iconVS.width = 16;
    iconVS.height = 16;
    iconVS.style.opacity = "0.9";
    const labelHost = document.createElement("label");
    labelHost.textContent = "Host :";
    const selectHost = document.createElement("select");
    const currHost = getHost();
    HOST_ALIASES.forEach((h) => {
      const opt = document.createElement("option");
      opt.value = h;
      opt.textContent = h;
      if (h === currHost) opt.selected = true;
      selectHost.appendChild(opt);
    });
    selectHost.addEventListener("change", () => setHost(selectHost.value));
    rowHost.append(iconVS, labelHost, selectHost);

    const rowBranch = document.createElement("div");
    rowBranch.className = "row";
    const iconGL = document.createElement("img");
    iconGL.src = ICONS.gitlab;
    iconGL.alt = "GitLab";
    iconGL.width = 16;
    iconGL.height = 16;
    iconGL.style.opacity = "0.9";
    const labelBranch = document.createElement("label");
    labelBranch.textContent = "Branch :";
    const selectBranch = document.createElement("select");
    const currBranch = getBranch();
    BRANCHES.forEach((b) => {
      const opt = document.createElement("option");
      opt.value = b;
      opt.textContent = b;
      if (b === currBranch) opt.selected = true;
      selectBranch.appendChild(opt);
    });
    selectBranch.addEventListener("change", () =>
      setBranch(selectBranch.value)
    );

    rowBranch.append(iconGL, labelBranch, selectBranch);
    wrap.append(rowHost, rowBranch);
    document.body.append(wrap);

    setHost(currHost);
    setBranch(currBranch);
  }

  function buildGitlabUrl(siteKey, branch) {
    const encoded = encodeURIComponent(siteKey);
    // check si  gitlab V1 ou V2
    return GITLAB_V2.includes(siteKey)
      ? `https://git.rc-prod.com/raccourci/woody-wordpress/themes/${encoded}/-/tree/${branch}`
      : `http://gitlab.rc.prod/wordpress-sites/${encoded}/tree/${branch}`;
  }

  function buildDevUrl(siteKey) {
    if (!siteKey) return null;
    // vérifie si le sitekey affiché diffère de celui de l'URL
    const match = URL_MODIFIER.find((s) => s.initial.trim() === siteKey.trim());
    const finalSiteKey = (match?.updated || siteKey).trim();
    const www = match?.shortUrl ? "" : "www.";

    return `http://${www}${encodeURIComponent(finalSiteKey)}.wp.rc-dev.com`;
  }

  function enhanceCard(cardEl) {
    if (!cardEl) return;
    const cellEl = cardEl.querySelector(".site_key");
    if (!cellEl || cellEl.querySelector(".rc-inline")) return;
    const anchor = cellEl.querySelector("a");
    const raw = anchor?.textContent?.trim();
    if (!raw) return;

    // check si le sitekey affiché diffère du folder du projet
    const mapped = SITEKEY_UPDATE.find((s) => s.initial.trim() === raw.trim());
    const siteKey = (mapped ? mapped.updated : raw).trim();

    let wrap = cellEl.querySelector(".rc-cellwrap");
    if (!wrap) {
      wrap = document.createElement("span");
      wrap.className = "rc-cellwrap";
      if (anchor && anchor.parentElement === cellEl) wrap.appendChild(anchor);
      cellEl.appendChild(wrap);
    }

    const inline = document.createElement("span");
    inline.className = "rc-inline";

    const createBtn = (cls, title, src, onClick) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = `rc-btn ${cls}`;
      b.title = title;
      const i = document.createElement("img");
      i.src = src;
      i.className = "plugin-icon rc-icon";
      b.appendChild(i);
      b.addEventListener("click", onClick);
      return b;
    };

    const btnDev = createBtn(
      "rc-btn--dev",
      "Ouvrir la version de dev",
      ICONS.dev,
      () => {
        const url = buildDevUrl(siteKey);
        if (url) window.open(url, "_blank");
      }
    );

    const btnVS = createBtn(
      "rc-btn--vs",
      "Ouvrir dans VS Code",
      ICONS.vscode,
      () => {
        const host = getHost();
        const abs = `/home/admin/www/themes/${siteKey}/current`;
        window.location.href = encodeURI(
          `vscode://vscode-remote/ssh-remote+${host}${abs}`
        );
      }
    );

    const btnGL = createBtn(
      "rc-btn--gl",
      "Ouvrir sur GitLab",
      ICONS.gitlab,
      () => {
        const branch = getBranch();
        window.open(buildGitlabUrl(siteKey, branch), "_blank");
      }
    );

    inline.append(btnDev, btnVS, btnGL);
    wrap.appendChild(inline);

    cellEl.setAttribute("data-vscode-ui", "true");
  }

  function enhanceAllCards() {
    document.querySelectorAll(".card").forEach(enhanceCard);
  }

  function applyInitialFlagsFromStorage() {
    document.documentElement.setAttribute(
      "data-wrap-sitekey",
      localStorage.getItem(SETTINGS.wrapSiteKey) === "true" ? "1" : "0"
    );
    document.documentElement.setAttribute(
      "data-show-dev",
      localStorage.getItem(SETTINGS.showDev) === "false" ? "0" : "1"
    );
    document.documentElement.setAttribute(
      "data-show-vs",
      localStorage.getItem(SETTINGS.showVS) === "false" ? "0" : "1"
    );
    document.documentElement.setAttribute(
      "data-show-gl",
      localStorage.getItem(SETTINGS.showGL) === "false" ? "0" : "1"
    );
    const pct = parseInt(localStorage.getItem(SETTINGS.opacity) ?? "100", 10);
    document.documentElement.style.setProperty(
      "--rc-icon-opacity",
      String((Number.isFinite(pct) ? pct : 100) / 100)
    );
  }

  function initNekoListeners() {
    let wasRunning = false;

    // Pause/reprise quand l’onglet est caché
    document.addEventListener("visibilitychange", () => {
      if (!neko) return;
      if (document.hidden) {
        wasRunning = neko.running;
        if (neko.running) neko.stop();
      } else {
        if (wasRunning) neko.start();
      }
    });

    // Raccourcis
    document.addEventListener("keydown", (e) => {
      const target = e.target;
      const isTyping =
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable);
      if (isTyping) return;

      const isMod = e.ctrlKey || e.metaKey;

      // Start/Stop — Ctrl/⌘ + Alt + N
      if (isMod && e.altKey && e.key.toLowerCase() === "n" && !e.shiftKey) {
        e.preventDefault();
        if (!neko) neko = oneko({ speed: 180 }); // (re)crée si absent
        neko.running ? neko.stop() : neko.start();
      }

      // Destroy — Ctrl/⌘ + Alt + Shift + N
      if (isMod && e.altKey && e.shiftKey && e.key.toLowerCase() === "n") {
        e.preventDefault();
        if (neko) neko.destroy();
        neko = null; // permet une relance ultérieure
      }
    });
  }

  function oneko(userOpts = {}) {
    const opts = {
      size: 32,
      speed: 160,
      spriteFps: 10,
      spriteUrl: "https://i.imgur.com/7yUmQyf.gif",
      zIndex: 2147483647,
      root: document.body,
      ...userOpts,
    };

    let el = null,
      onMouseMove,
      onResize;
    let running = false;
    let raf = null;
    let pos, mouse, lastTs, spriteAcc, idleMs, idleAnim, idleFrame, moveFrame;

    // --- spritesheet ---
    const sprites = {
      idle: [[-3, -3]],
      alert: [[-7, -3]],
      scratchSelf: [
        [-5, 0],
        [-6, 0],
        [-7, 0],
      ],
      scratchWallN: [
        [0, 0],
        [0, -1],
      ],
      scratchWallS: [
        [-7, -1],
        [-6, -2],
      ],
      scratchWallE: [
        [-2, -2],
        [-2, -3],
      ],
      scratchWallW: [
        [-4, 0],
        [-4, -1],
      ],
      tired: [[-3, -2]],
      sleeping: [
        [-2, 0],
        [-2, -1],
      ],
      N: [
        [-1, -2],
        [-1, -3],
      ],
      NE: [
        [0, -2],
        [0, -3],
      ],
      E: [
        [-3, 0],
        [-3, -1],
      ],
      SE: [
        [-5, -1],
        [-5, -2],
      ],
      S: [
        [-6, -3],
        [-7, -2],
      ],
      SW: [
        [-5, -3],
        [-6, -1],
      ],
      W: [
        [-4, -2],
        [-4, -3],
      ],
      NW: [
        [-1, 0],
        [-1, -1],
      ],
    };

    // --- timing partagé ---
    const spriteDt = 1000 / Math.max(1, opts.spriteFps); // ms/frame

    // --- utils ---
    const setSprite = (name, frame) => {
      if (!el) return;
      const seq = sprites[name];
      const [sx, sy] = seq[frame % seq.length];
      el.style.backgroundPosition = `${sx * opts.size}px ${sy * opts.size}px`;
    };

    const clamp = () => {
      const { clientWidth: w, clientHeight: h } = document.documentElement;
      const m = 16;
      pos.x = Math.min(Math.max(m, pos.x), w - m);
      pos.y = Math.min(Math.max(m, pos.y), h - m);
    };

    const resetIdle = () => {
      idleAnim = null;
      idleFrame = 0;
    };

    const runIdle = (advance) => {
      if (idleMs > 1000 && !idleAnim && Math.floor(Math.random() * 200) === 0) {
        const choices = ["sleeping", "scratchSelf"];
        const m = opts.size;
        const { innerWidth: w, innerHeight: h } = window;
        if (pos.x < m) choices.push("scratchWallW");
        if (pos.y < m) choices.push("scratchWallN");
        if (pos.x > w - m) choices.push("scratchWallE");
        if (pos.y > h - m) choices.push("scratchWallS");
        idleAnim = choices[Math.floor(Math.random() * choices.length)];
      }
      if (!idleAnim) {
        setSprite("idle", 0);
        return;
      }
      switch (idleAnim) {
        case "sleeping":
          if (idleFrame < 8) setSprite("tired", 0);
          else setSprite("sleeping", Math.floor(idleFrame / 4));
          if (idleFrame > 192) resetIdle();
          break;
        case "scratchWallN":
        case "scratchWallS":
        case "scratchWallE":
        case "scratchWallW":
        case "scratchSelf":
          setSprite(idleAnim, idleFrame);
          if (idleFrame > 9) resetIdle();
          break;
      }
      if (advance) idleFrame++;
    };

    const directionToSprite = (dx, dy, dist) => {
      let dir = "";
      const nx = dx / dist,
        ny = dy / dist;
      if (ny > 0.5) dir = "N";
      else if (ny < -0.5) dir = "S";
      if (nx > 0.5) dir += "W";
      else if (nx < -0.5) dir += "E";
      return dir || "idle";
    };

    // --- loop ---
    const step = (ts) => {
      if (!running) return;
      const dt = Math.min(0.05, (ts - lastTs) / 1000);
      const dtMs = dt * 1000;
      lastTs = ts;
      spriteAcc += dtMs;

      const dx = pos.x - mouse.x,
        dy = pos.y - mouse.y;
      const dist = Math.hypot(dx, dy);

      if (dist < opts.speed * dt || dist < opts.size * 1.5) {
        idleMs += dtMs;
        const advance = spriteAcc >= spriteDt;
        runIdle(advance);
        if (advance) spriteAcc %= spriteDt;
        raf = requestAnimationFrame(step);
        return;
      }

      idleMs = 0;
      resetIdle();

      if (spriteAcc >= spriteDt) {
        const dir = directionToSprite(dx, dy, dist);
        moveFrame++;
        setSprite(dir, moveFrame);
        spriteAcc %= spriteDt;
      }

      const stepLen = Math.min(dist, opts.speed * dt);
      pos.x -= (dx / dist) * stepLen;
      pos.y -= (dy / dist) * stepLen;
      clamp();
      el.style.transform = `translate(${pos.x - opts.size / 2}px, ${
        pos.y - opts.size / 2
      }px)`;

      raf = requestAnimationFrame(step);
    };

    // --- API ---
    const start = () => {
      if (running) return;

      if (!el) {
        el = document.createElement("div");
        el.id = "oneko";
        el.setAttribute("aria-hidden", "true");
        Object.assign(el.style, {
          position: "fixed",
          width: `${opts.size}px`,
          height: `${opts.size}px`,
          left: "0px",
          top: "0px",
          pointerEvents: "none",
          backgroundImage: `url('${opts.spriteUrl}')`,
          backgroundRepeat: "no-repeat",
          imageRendering: "pixelated",
          willChange: "transform, background-position",
          zIndex: String(opts.zIndex),
        });
        opts.root.appendChild(el);

        pos = { x: 32, y: 32 };
        mouse = { x: pos.x, y: pos.y };

        // listeners référencés
        onMouseMove = (e) => {
          mouse.x = e.clientX;
          mouse.y = e.clientY - opts.size / 2;
        };
        onResize = clamp;

        window.addEventListener("mousemove", onMouseMove, { passive: true });
        window.addEventListener("resize", onResize, { passive: true });
      }

      spriteAcc = 0;
      idleMs = 0;
      idleAnim = null;
      idleFrame = 0;
      moveFrame = 0;
      lastTs = performance.now();
      running = true;
      raf = requestAnimationFrame(step);
    };

    const stop = () => {
      if (!running) return;
      running = false;
      cancelAnimationFrame(raf);
      raf = null;
    };

    const destroy = () => {
      stop();
      //  nettoyage des listeners
      if (onMouseMove) window.removeEventListener("mousemove", onMouseMove);
      if (onResize) window.removeEventListener("resize", onResize);
      if (el) {
        el.remove();
        el = null;
      }
      onMouseMove = null;
      onResize = null;
    };

    return {
      start,
      stop,
      destroy,
      get running() {
        return running;
      },
    };
  }

  let __inited = false;
  function init() {
    if (__inited) return;
    __inited = true;

    ensureStyles();
    ensureGlobalSelector();
    applyInitialFlagsFromStorage();
    enhanceAllCards();
    ensureSettings();
    initNekoListeners();
  }

  init();
})();

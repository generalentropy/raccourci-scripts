// ==UserScript==
// @name         Status projects shortcuts
// @namespace    http://tampermonkey.net/
// @version      1.2.6
// @description  Ouvre un projet dans VS Code ou gitlab + site de dev
// @author       Eddy Nicolle
// @match        https://status.woody-wp.com/
// @icon         https://code.visualstudio.com/favicon.ico
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

  const SITEKEY_UPDATE = [{ initial: "", updated: "" }];
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

#rc-settings-panel {
  position: fixed;
  right: 16px;
  bottom: 70px;
  z-index: 99999;
  min-width: 260px;
  padding: 12px;
  border-radius: 12px;
  background: rgba(20, 20, 20, 0.95);
  color: #f5f5f5;
  border: 1px solid rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(6px);
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.4);
  font: 13px/1.4 system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
  display: none;
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
}
#rc-settings-panel input[type="checkbox"]:checked {
  background-color: var(--rc-accent);
  border-color: var(--rc-accent);
}

hr {
  border: none;
  border-top: 1px dashed var(--rc-accent);
  opacity: 0.5;
  margin: 2px 0 10px 0;
}

td {
    padding: var(--rc-td-padding);
}

`;
    document.head.appendChild(style);
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
    btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9.671 4.136a2.34 2.34 0 0 1 4.659 0 2.34 2.34 0 0 0 3.319 1.915 2.34 2.34 0 0 1 2.33 4.033 2.34 2.34 0 0 0 0 3.831 2.34 2.34 0 0 1-2.33 4.033 2.34 2.34 0 0 0-3.319 1.915 2.34 2.34 0 0 1-4.659 0 2.34 2.34 0 0 0-3.32-1.915 2.34 2.34 0 0 1-2.33-4.033 2.34 2.34 0 0 0 0-3.831A2.34 2.34 0 0 1 6.35 6.051a2.34 2.34 0 0 0 3.319-1.915"/><circle cx="12" cy="12" r="3"/></svg>`;

    const panel = document.createElement("div");
    panel.id = "rc-settings-panel";
    panel.innerHTML = `
      <div class="row" style="justify-content:space-between;margin-bottom:8px;">
        <strong>Réglages</strong>


        <button type="button" id="rc-close" style="background:transparent;border:none;color:rgb(247, 109, 143);font-size:16px;line-height:1;cursor:pointer">×</button>
      </div>
       <hr />

      <div class="flex" style="margin-top:6px;">
        <label><input type="checkbox" id="rc-wrap-sitekey">Afficher l'intégralité des sitekey longs</label>
        <label><input type="checkbox" id="rc-show-dev">Afficher l'icone de lien vers le dev</label>
        <label><input type="checkbox" id="rc-show-vs">Afficher VS Code</label>
        <label><input type="checkbox" id="rc-show-gl">Afficher GitLab</label>
      </div>

      <div style="margin:10px 0;">
        <div class="row" style="justify-content:space-between;">
          <span>Opacité des icônes</span><span id="rc-icon-opacity-value">100%</span>
        </div>
        <input type="range" id="rc-icon-opacity" min="0" max="100" step="1">
      </div>
      <div class="flex" style="margin-top:10px;">
       <label><input type="checkbox" id="rc-hide-host">Masquer le panneau de sélection</label>
         <label><input type="checkbox" id="rc-row-toggle">Panneau de selection en ligne / compact</label>
      </div>
    `;

    document.body.appendChild(btn);
    document.body.appendChild(panel);

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
    iconVS.src = "https://code.visualstudio.com/favicon.ico";
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
    rowHost.appendChild(iconVS);
    rowHost.appendChild(labelHost);
    rowHost.appendChild(selectHost);

    const rowBranch = document.createElement("div");
    rowBranch.className = "row";
    const iconGL = document.createElement("img");
    iconGL.src = "https://i.imgur.com/BcoMk3p.png";
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
    rowBranch.appendChild(iconGL);
    rowBranch.appendChild(labelBranch);
    rowBranch.appendChild(selectBranch);

    wrap.appendChild(rowHost);
    wrap.appendChild(rowBranch);
    document.body.appendChild(wrap);

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
    const mapped = SITEKEY_UPDATE.find((s) => s.initial === raw);
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
      "https://i.imgur.com/lLwS7mg.png",
      () => {
        const url = buildDevUrl(siteKey);
        if (url) window.open(url, "_blank");
      }
    );

    const btnVS = createBtn(
      "rc-btn--vs",
      "Ouvrir dans VS Code",
      "https://code.visualstudio.com/favicon.ico",
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
      "https://i.imgur.com/BcoMk3p.png",
      () => {
        const branch = getBranch();
        window.open(buildGitlabUrl(siteKey, branch), "_blank");
      }
    );

    inline.appendChild(btnDev);
    inline.appendChild(btnVS);
    inline.appendChild(btnGL);
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

  let __inited = false;

  function init() {
    if (__inited) return;
    __inited = true;

    ensureStyles();
    ensureGlobalSelector();
    applyInitialFlagsFromStorage();
    enhanceAllCards();
    ensureSettings();
  }

  init();
})();

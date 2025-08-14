// ==UserScript==
// @name         Status projects shortcuts
// @namespace    http://tampermonkey.net/
// @version      1.1.8
// @description  Ouvre un projet dans VS Code ou gitlab
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
  const STORAGE_KEY = "vscode_global_host_alias";
  const STORAGE_BRANCH_KEY = "gitlab_branch";

  const SITEKEY_UPDATE = [{ initial: "", updated: "" }];
  const GITLAB_V2 = ["marseille-tourisme", "ot-verbier", "broceliande"];

  const getCurrentHost = () =>
    localStorage.getItem(STORAGE_KEY) || HOST_ALIASES[0];
  const setCurrentHost = (host) => {
    localStorage.setItem(STORAGE_KEY, host);
    document.documentElement.setAttribute("data-vscode-host", host);
  };

  const getCurrentBranch = () =>
    localStorage.getItem(STORAGE_BRANCH_KEY) || BRANCHES[0];
  const setCurrentBranch = (branch) => {
    localStorage.setItem(STORAGE_BRANCH_KEY, branch);
    document.documentElement.setAttribute("data-gitlab-branch", branch);
  };

  function ensureStyles() {
    if (document.getElementById("vscode-userscript-style")) return;
    const style = document.createElement("style");
    style.id = "vscode-userscript-style";
    style.textContent = `
/* --- Styles globaux --- */

:root {
  --rc-accent: rgb(247, 109, 143);
  --rc-icon-opacity: 1;
  --rc-gap: 8px;
  --rc-btn-padding: 6px 0;
  --rc-btn-radius: 6px;
}

[data-vscode-ui] button .vscode-icon {
  transition: transform 0.15s ease, filter 0.2s ease;
  will-change: transform;
  transform-origin: center;
}
[data-vscode-ui] button:hover .vscode-icon {
  transform: scale(1.18);
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.25));
}
[data-vscode-ui] button:active .vscode-icon {
  transform: scale(0.96);
}
.core {
  min-width: 370px !important;
}

/* --- Global host selector --- */
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

/* --- Settings panel --- */
:root {
  --rc-accent: rgb(247, 109, 143);
}
.vscode-icon {
  opacity: var(--rc-icon-opacity, 1);
  transition: opacity 0.15s ease;
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
#rc-settings-panel label {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
}
#rc-row-toggle,
#rc-hide-host {
  accent-color: var(--rc-accent);
  transform: scale(1.1);
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

/* --- Bar & Buttons  --- */
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


    `;
    document.head.appendChild(style);
  }

  function ensureSettings() {
    if (window.__rcSettingsInited) return;
    window.__rcSettingsInited = true;

    const HOST_ID = "vscode-global-host";
    const STORAGE_KEY_ROW = "rc_settings_row_mode";
    const STORAGE_KEY_OPACITY = "rc_settings_icon_opacity_pct"; // 0..100

    // ——— UI ———
    const btn = document.createElement("button");
    btn.id = "rc-settings-btn";
    btn.title = "Ouvrir le panneau de réglage";
    btn.type = "button";
    btn.setAttribute("aria-label", "Ouvrir les réglages");
    // SVG Lucide
    btn.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
         fill="none" stroke="currentColor" stroke-width="2"
         stroke-linecap="round" stroke-linejoin="round"
         class="lucide lucide-settings-icon lucide-settings">
      <path d="M9.671 4.136a2.34 2.34 0 0 1 4.659 0 2.34 2.34 0 0 0 3.319 1.915 2.34 2.34 0 0 1 2.33 4.033 2.34 2.34 0 0 0 0 3.831 2.34 2.34 0 0 1-2.33 4.033 2.34 2.34 0 0 0-3.319 1.915 2.34 2.34 0 0 1-4.659 0 2.34 2.34 0 0 0-3.32-1.915 2.34 2.34 0 0 1-2.33-4.033 2.34 2.34 0 0 0 0-3.831A2.34 2.34 0 0 1 6.35 6.051a2.34 2.34 0 0 0 3.319-1.915"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  `;

    const panel = document.createElement("div");
    panel.id = "rc-settings-panel";
    panel.innerHTML = `
    <div class="row">
      <label title="Quand activé, #${HOST_ID} passe en flex-direction: row">
        <input type="checkbox" id="rc-row-toggle">
        Orientation en ligne
      </label>
    </div>
    <div class="row" style="margin-top:6px;">
  <label>
    <input type="checkbox" id="rc-hide-host">
    Masquer le panneau des sélecteurs
  </label>
</div>
    <div style="margin-top:10px;">
      <div class="row" style="justify-content:space-between;">
        <label for="rc-icon-opacity" style="margin-bottom:4px;">Opacité des icônes</label>
        <span id="rc-icon-opacity-value">100%</span>
      </div>
      <input type="range" id="rc-icon-opacity" min="0" max="100" step="1">
    </div>
  `;

    document.body.appendChild(btn);
    document.body.appendChild(panel);

    const toggleRow = panel.querySelector("#rc-row-toggle");
    const toggleHideHost = panel.querySelector("#rc-hide-host");
    const slider = panel.querySelector("#rc-icon-opacity");
    const sliderValue = panel.querySelector("#rc-icon-opacity-value");

    // ——— Helpers ———
    const getHost = () => document.getElementById(HOST_ID);
    const applyRowMode = (enabled) => {
      const host = getHost();
      if (host) host.style.flexDirection = enabled ? "row" : "";
    };
    const applyIconOpacityPct = (pct) => {
      const clamped = Math.max(0, Math.min(100, pct)); // 0..100
      document.documentElement.style.setProperty(
        "--rc-icon-opacity",
        String(clamped / 100)
      );
      sliderValue.textContent = `${clamped}%`;
    };
    const STORAGE_KEY_HIDE = "rc_settings_hide_host";
    const applyHideHost = (hidden) => {
      const host = getHost();
      if (host) host.style.display = hidden ? "none" : "";
    };

    // ——— Init ———
    const savedRow = localStorage.getItem(STORAGE_KEY_ROW) === "true";
    toggleRow.checked = savedRow;
    applyRowMode(savedRow);

    const savedPct = parseInt(
      localStorage.getItem(STORAGE_KEY_OPACITY) ?? "100",
      10
    );
    const initialPct = Number.isFinite(savedPct)
      ? Math.max(0, Math.min(100, savedPct))
      : 100;
    slider.value = String(initialPct);
    applyIconOpacityPct(initialPct);

    const savedHide = localStorage.getItem(STORAGE_KEY_HIDE) === "true";
    toggleHideHost.checked = savedHide;
    applyHideHost(savedHide);

    // ——— Listeners ———
    toggleRow.addEventListener("change", () => {
      const enabled = toggleRow.checked;
      localStorage.setItem(STORAGE_KEY_ROW, String(enabled));
      applyRowMode(enabled);
    });

    slider.addEventListener("input", () => {
      const pct = parseInt(slider.value, 10);
      localStorage.setItem(STORAGE_KEY_OPACITY, String(pct));
      applyIconOpacityPct(pct);
    });

    btn.addEventListener("click", () => {
      panel.style.display = panel.style.display === "block" ? "none" : "block";
    });

    toggleHideHost.addEventListener("change", () => {
      const hidden = toggleHideHost.checked;
      localStorage.setItem(STORAGE_KEY_HIDE, String(hidden));
      applyHideHost(hidden);
    });
  }

  function ensureGlobalSelector() {
    if (document.querySelector("#vscode-global-host")) return;

    const wrap = document.createElement("div");
    wrap.id = "vscode-global-host";

    // —— Host row —— //
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
    const currentHost = getCurrentHost();
    HOST_ALIASES.forEach((host) => {
      const opt = document.createElement("option");
      opt.value = host;
      opt.textContent = host;
      if (host === currentHost) opt.selected = true;
      selectHost.appendChild(opt);
    });
    selectHost.addEventListener("change", () =>
      setCurrentHost(selectHost.value)
    );

    rowHost.appendChild(iconVS);
    rowHost.appendChild(labelHost);
    rowHost.appendChild(selectHost);

    // —— Branch row —— //
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
    const currentBranch = getCurrentBranch();
    BRANCHES.forEach((b) => {
      const opt = document.createElement("option");
      opt.value = b;
      opt.textContent = b;
      if (b === currentBranch) opt.selected = true;
      selectBranch.appendChild(opt);
    });
    selectBranch.addEventListener("change", () =>
      setCurrentBranch(selectBranch.value)
    );

    rowBranch.appendChild(iconGL);
    rowBranch.appendChild(labelBranch);
    rowBranch.appendChild(selectBranch);

    wrap.appendChild(rowHost);
    wrap.appendChild(rowBranch);
    document.body.appendChild(wrap);

    setCurrentHost(currentHost);
    setCurrentBranch(currentBranch);
  }

  function buildGitlabUrl(siteKey, branch) {
    const encoded = encodeURIComponent(siteKey);
    return GITLAB_V2.includes(siteKey)
      ? `https://git.rc-prod.com/raccourci/woody-wordpress/themes/${encoded}/-/tree/${branch}`
      : `http://gitlab.rc.prod/wordpress-sites/${encoded}/tree/${branch}`;
  }

  function enhanceCard(cardEl) {
    if (!cardEl || cardEl.querySelector("[data-vscode-ui]")) return;
    const rawSiteKey = cardEl.querySelector(".site_key a")?.textContent?.trim();
    if (!rawSiteKey) return;

    // => check et remplace si le sitekey est différent
    const match = SITEKEY_UPDATE.find((stk) => stk.initial === rawSiteKey);
    const siteKey = match ? match.updated : rawSiteKey;

    if (getComputedStyle(cardEl).position === "static") {
      cardEl.style.position = "relative";
    }

    const bar = document.createElement("div");
    bar.setAttribute("data-vscode-ui", "true");
    bar.className = "rc-bar";

    const btnVS = document.createElement("button");
    btnVS.type = "button";
    btnVS.className = "rc-btn";

    const iconVS = document.createElement("img");
    iconVS.src = "https://code.visualstudio.com/favicon.ico";
    iconVS.className = "vscode-icon rc-icon";

    const btnGL = document.createElement("button");
    btnGL.type = "button";
    btnGL.className = "rc-btn";

    const iconGL = document.createElement("img");
    iconGL.src = "https://i.imgur.com/BcoMk3p.png";
    iconGL.className = "vscode-icon rc-icon";

    btnVS.addEventListener("click", () => {
      const hostAlias = getCurrentHost();
      const absPath = `/home/admin/www/themes/${siteKey}/current`;
      window.location.href = encodeURI(
        `vscode://vscode-remote/ssh-remote+${hostAlias}${absPath}`
      );
    });

    btnGL.addEventListener("click", () => {
      const branch = getCurrentBranch();
      window.open(buildGitlabUrl(siteKey, branch), "_blank");
    });

    btnVS.appendChild(iconVS);
    btnGL.appendChild(iconGL);
    bar.appendChild(btnVS);
    bar.appendChild(btnGL);
    cardEl.appendChild(bar);
  }

  function enhanceAllCards() {
    document.querySelectorAll(".card").forEach(enhanceCard);
  }

  let __inited = false;

  function globalInit() {
    if (__inited) return;
    __inited = true;

    ensureStyles();
    ensureGlobalSelector();
    enhanceAllCards();
    ensureSettings();
  }

  globalInit();
})();

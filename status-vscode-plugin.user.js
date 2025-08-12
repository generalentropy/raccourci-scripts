// ==UserScript==
// @name         Status projects shortcuts
// @namespace    http://tampermonkey.net/
// @version      1.0.4
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
      [data-vscode-ui] button .vscode-icon {
        transition: transform .15s ease, filter .2s ease;
        will-change: transform;
        transform-origin: center;
      }
      [data-vscode-ui] button:hover .vscode-icon {
        transform: scale(1.18);
        filter: drop-shadow(0 1px 2px rgba(0,0,0,.25));
      }
      [data-vscode-ui] button:active .vscode-icon {
        transform: scale(0.96);
      }
      .core { min-width: 370px !important; }
      #vscode-global-host {
        position: fixed; top: 10px; right: 10px; z-index: 9999;
        display: flex; flex-direction: column; gap: 6px;
        padding: 6px 8px; border-radius: 8px;
        border: 1px solid rgba(0,0,0,0.08);
        background: rgba(255,255,255,0.9);
        backdrop-filter: blur(4px);
        box-shadow: 0 2px 12px rgba(0,0,0,0.08);
      }
      #vscode-global-host .row {
        display: flex; align-items: center; gap: 8px;
      }
      #vscode-global-host label {
        font-size: 12px; color: #333; white-space: nowrap;
      }
      #vscode-global-host select {
        font-size: 12px; padding: 4px 6px;
        border: 1px solid #ddd; border-radius: 6px;
      }
    `;
    document.head.appendChild(style);
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

  function enhanceCard(cardEl) {
    if (!cardEl || cardEl.querySelector("[data-vscode-ui]")) return;
    const siteKey = cardEl.querySelector(".site_key a")?.textContent?.trim();
    if (!siteKey) return;

    if (getComputedStyle(cardEl).position === "static") {
      cardEl.style.position = "relative";
    }

    const bar = document.createElement("div");
    bar.setAttribute("data-vscode-ui", "true");
    bar.style.display = "flex";
    bar.style.alignItems = "center";
    bar.style.gap = "8px";
    bar.style.marginTop = "2px";

    const btnVS = document.createElement("button");
    btnVS.type = "button";
    btnVS.style.cssText = baseBtnStyle();
    btnVS.title = `Ouvrir ${siteKey} dans VS Code`;

    const iconVS = document.createElement("img");
    iconVS.src = "https://code.visualstudio.com/favicon.ico";
    iconVS.width = 16;
    iconVS.height = 16;
    iconVS.className = "vscode-icon";
    btnVS.appendChild(iconVS);

    btnVS.addEventListener("click", () => {
      const hostAlias = getCurrentHost();
      const absPath = `/home/admin/www/themes/${siteKey}/current`;
      window.location.href = encodeURI(
        `vscode://vscode-remote/ssh-remote+${hostAlias}${absPath}`
      );
    });

    const btnGL = document.createElement("button");
    btnGL.type = "button";
    btnGL.style.cssText = baseBtnStyle();
    btnGL.title = `Ouvrir ${siteKey} sur GitLab`;

    const iconGL = document.createElement("img");
    iconGL.src = "https://i.imgur.com/BcoMk3p.png";
    iconGL.width = 16;
    iconGL.height = 16;
    iconGL.className = "vscode-icon";
    btnGL.appendChild(iconGL);

    btnGL.addEventListener("click", () => {
      const branch =
        document.getElementById("gitlab-branch-select")?.value ||
        getCurrentBranch();
      window.open(
        `http://gitlab.rc.prod/wordpress-sites/${encodeURIComponent(
          siteKey
        )}/tree/${branch}`,
        "_blank"
      );
    });

    bar.appendChild(btnVS);
    bar.appendChild(btnGL);
    cardEl.appendChild(bar);
  }

  function baseBtnStyle() {
    return `
      display:inline-flex;align-items:center;border:none;gap:6px;color:#fff;
      background:transparent;font-weight:600;border-radius:6px;padding:6px 0;
      cursor:pointer;
    `;
  }

  function enhanceAllCards() {
    document.querySelectorAll(".card").forEach(enhanceCard);
  }

  function observeCards() {
    new MutationObserver((muts) => {
      muts.forEach((m) => {
        m.addedNodes.forEach((n) => {
          if (!(n instanceof Element)) return;
          if (n.matches(".card")) enhanceCard(n);
          else n.querySelectorAll?.(".card").forEach(enhanceCard);
        });
      });
    }).observe(document.body, { childList: true, subtree: true });
  }

  ensureStyles();
  ensureGlobalSelector();
  enhanceAllCards();
  observeCards();
})();

// ==UserScript==
// @name         Status projects shortcuts
// @namespace    http://tampermonkey.net/
// @version      1.0.1
// @description  Ouvre le projet dans VS Code ou gitlab
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

  // —— Config —— //
  const HOST_ALIASES = [
    "eddy.wp.rc.dev",
    "maxime.wp.rc.dev",
    "dorothee.wp.rc.dev",
    "celia.wp.rc.dev",
    "marion.wp.rc.dev",
    "sebastien.wp.rc.dev",
  ];
  const STORAGE_KEY = "vscode_global_host_alias";

  const getCurrentHost = () =>
    localStorage.getItem(STORAGE_KEY) || HOST_ALIASES[0];

  const setCurrentHost = (host) => {
    localStorage.setItem(STORAGE_KEY, host);
    document.documentElement.setAttribute("data-vscode-host", host);
  };

  // —— Styles (injectés 1x) —— //
  function ensureStyles() {
    if (document.getElementById("vscode-userscript-style")) return;
    const style = document.createElement("style");
    style.id = "vscode-userscript-style";
    style.textContent = `
      /* Hover sur l'icône des boutons carte */
      [data-vscode-ui] button .vscode-icon {
        transition: transform .15s ease, filter .2s ease;
        will-change: transform;
        transform-origin: center;
      }
      [data-vscode-ui] button:hover .vscode-icon {
        transform: scale(1.18) ;
        filter: drop-shadow(0 1px 2px rgba(0,0,0,.25));
      }
      [data-vscode-ui] button:active .vscode-icon {
        transform: scale(0.96);
      }

    `;
    document.head.appendChild(style);
  }

  //  Sélecteur global
  function ensureGlobalSelector() {
    if (document.querySelector("#vscode-global-host")) return;

    const wrap = document.createElement("div");
    wrap.id = "vscode-global-host";
    wrap.style.position = "fixed";
    wrap.style.top = "10px";
    wrap.style.right = "10px";
    wrap.style.zIndex = "9999";
    wrap.style.display = "flex";
    wrap.style.alignItems = "center";
    wrap.style.gap = "8px";
    wrap.style.padding = "6px 8px";
    wrap.style.borderRadius = "8px";
    wrap.style.border = "1px solid rgba(0,0,0,0.08)";
    wrap.style.background = "rgba(255,255,255,0.9)";
    wrap.style.backdropFilter = "blur(4px)";
    wrap.style.boxShadow = "0 2px 12px rgba(0,0,0,0.08)";

    const label = document.createElement("span");
    label.textContent = "Host :";
    label.style.fontSize = "12px";
    label.style.color = "#333";

    const select = document.createElement("select");
    select.id = "vscode-host-select";
    select.style.fontSize = "12px";
    select.style.padding = "4px 6px";
    select.style.border = "1px solid #ddd";
    select.style.borderRadius = "6px";

    const current = getCurrentHost();
    HOST_ALIASES.forEach((host) => {
      const opt = document.createElement("option");
      opt.value = host;
      opt.textContent = host;
      if (host === current) opt.selected = true;
      select.appendChild(opt);
    });

    const coreContainer = document.querySelector(".core ");
    coreContainer.style.minWidth = "initial";

    select.addEventListener("change", () => setCurrentHost(select.value));

    const icon = document.createElement("img");
    icon.src = "https://code.visualstudio.com/favicon.ico";
    icon.alt = "VS Code";
    icon.width = 16;
    icon.height = 16;
    icon.style.opacity = "0.9";

    wrap.appendChild(icon);
    wrap.appendChild(label);
    wrap.appendChild(select);
    document.body.appendChild(wrap);

    setCurrentHost(current);
  }

  function enhanceCard(cardEl) {
    if (!cardEl || cardEl.querySelector("[data-vscode-ui]")) return;

    const siteKeyEl = cardEl.querySelector(".site_key a");
    const siteKey = siteKeyEl?.textContent?.trim() || "";
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
    bar.style.width = "100%";

    const btn = document.createElement("button");
    btn.type = "button";
    btn.style.display = "inline-flex";
    btn.style.alignItems = "center";
    btn.style.border = "none";
    btn.style.gap = "6px";
    btn.style.color = "#fff";
    btn.style.background = "transparent";
    btn.style.fontWeight = "600";
    btn.style.borderRadius = "6px";
    btn.style.padding = "6px 0";
    btn.style.cursor = "pointer";
    btn.title = `Ouvrir ${siteKey} dans VS Code`;
    btn.setAttribute("aria-label", `Ouvrir ${siteKey} dans VS Code`);

    const icon = document.createElement("img");
    icon.src = "https://code.visualstudio.com/favicon.ico";
    icon.alt = "VS Code";
    icon.width = 16;
    icon.height = 16;
    icon.className = "vscode-icon";

    // ——— Bouton GitLab (à droite) ———
    const gitlabBtn = document.createElement("button");
    gitlabBtn.type = "button";
    // reprend exactement le style du bouton VS Code
    gitlabBtn.style.cssText = btn.style.cssText;
    gitlabBtn.title = `Ouvrir ${siteKey} sur GitLab`;
    gitlabBtn.setAttribute("aria-label", `Ouvrir ${siteKey} sur GitLab`);

    const gitlabIcon = document.createElement("img");
    gitlabIcon.src = "https://i.imgur.com/BcoMk3p.png";
    gitlabIcon.alt = "GitLab";
    gitlabIcon.width = 16;
    gitlabIcon.height = 16;
    // on réutilise la classe pour l'effet hover existant
    gitlabIcon.className = "vscode-icon";
    gitlabBtn.appendChild(gitlabIcon);

    gitlabBtn.addEventListener("click", () => {
      const url = `http://gitlab.rc.prod/wordpress-sites/${encodeURIComponent(
        siteKey
      )}/tree/master`;
      window.open(url, "_blank", "noopener,noreferrer");
    });

    btn.appendChild(icon);

    btn.addEventListener("click", () => {
      const hostAlias = getCurrentHost();
      const absPath = `/home/admin/www/themes/${siteKey}/current`;
      const rawUrl = `vscode://vscode-remote/ssh-remote+${hostAlias}${absPath}`;
      const vscodeUrl = encodeURI(rawUrl);
      window.location.href = vscodeUrl;
    });

    bar.appendChild(btn);
    bar.appendChild(gitlabBtn);
    cardEl.appendChild(bar);
  }

  function enhanceAllCards() {
    document.querySelectorAll(".card").forEach(enhanceCard);
  }

  function observeCards() {
    const observer = new MutationObserver((mutations) => {
      for (const m of mutations) {
        m.addedNodes.forEach((node) => {
          if (!(node instanceof Element)) return;
          if (node.matches?.(".card")) {
            enhanceCard(node);
          } else {
            node.querySelectorAll?.(".card").forEach(enhanceCard);
          }
        });
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  // Init
  ensureStyles();
  ensureGlobalSelector();
  enhanceAllCards();
  observeCards();
})();

// ==UserScript==
// @name         Ferme la modal d'erreur de l'ERP
// @namespace    http://tampermonkey.net/
// @version      2025-08-01
// @description  Ferme automatiquement la modale d’erreur 'null' de l'ERP
// @author       Eddy
// @match        https://erpv8.raccourci.fr/*
// @run-at       document-idle
// @grant        none
// @homepageURL  https://github.com/generalentropy/tampermonkey-erp-patch
// @updateURL    https://raw.githubusercontent.com/generalentropy/tampermonkey-erp-patch/main/erp-patch.user.js
// @downloadURL  https://raw.githubusercontent.com/generalentropy/tampermonkey-erp-patch/main/erp-patch.user.js
// ==/UserScript==

(function () {
  "use strict";

  function closeSpecificErrorModal(modal) {
    const errPre = modal.querySelector(".oe_error_detail pre");
    if (!errPre) return;
    if (
      !errPre.textContent.includes(
        "Cannot read properties of null (reading 'parentElement')"
      )
    ) {
      return;
    }
    // suppression de la modale
    modal.remove();
    // nettoyage des backdrops
    document.querySelectorAll(".modal-backdrop").forEach((b) => b.remove());
    // restauration du scroll
    document.body.classList.remove("modal-open");
  }

  // Observer qui ne tourne que jusqu'à la première modale détectée
  const observer = new MutationObserver((mutations, obs) => {
    for (const { addedNodes } of mutations) {
      for (const node of addedNodes) {
        if (!(node instanceof HTMLElement)) continue;
        // on cherche directement une modale Bootstrap ouverte
        const modalEl = node.matches(".modal.in, .modal.show")
          ? node
          : node.querySelector(".modal.in, .modal.show");
        if (modalEl) {
          closeSpecificErrorModal(modalEl);
          obs.disconnect(); //  Plus nécessaire => on débranche
          return;
        }
      }
    }
  });

  // on start obs sur tout le body
  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });
})();

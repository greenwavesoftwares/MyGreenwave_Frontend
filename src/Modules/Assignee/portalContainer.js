/* ==========================================================
   portalContainer.js  (REFACTOR)

   One shared answer to "where should a dialog portal to?".

   Previously each dialog did
       document.querySelector(".pai-page") || document.body
   which only worked when opened from the Activities page. Elsewhere it
   silently fell back to <body> and the dialog lost its styling.

   Dialogs are now self-contained (they carry the `pj-scope` class from
   assignee-theme.css), so the container only has to keep the app's own
   global theme variables (.light / .dark / [data-theme]) in scope. We
   portal into the nearest themed element if there is one, otherwise
   <body>. It never depends on any page-level wrapper class.
   ========================================================== */
export function getPortalContainer() {
  if (typeof document === "undefined") return undefined;
  const themed = document.querySelector(".dark, .light, [data-theme]");
  // Never portal into <html>; <body> inherits from it anyway.
  return themed && themed !== document.documentElement ? themed : document.body;
}

export default getPortalContainer;

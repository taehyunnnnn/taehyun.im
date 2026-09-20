(function () {
  "use strict";

  if (!window.history || !history.replaceState) return;

  function strip() {
    history.replaceState(null, "", location.pathname + location.search);
  }

  document.addEventListener("click", function (event) {
    if (event.defaultPrevented) return;
    if (event.button !== 0) return;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

    var link = event.target.closest && event.target.closest('a[href^="#"]');
    if (!link) return;

    var id = link.getAttribute("href").slice(1);
    var target = id ? document.getElementById(id) : null;
    if (!target) return;

    event.preventDefault();
    target.scrollIntoView({ block: "start" });

    var had = target.hasAttribute("tabindex");
    if (!had) target.setAttribute("tabindex", "-1");
    target.focus({ preventScroll: true });
    if (!had) {
      target.addEventListener(
        "blur",
        function () {
          target.removeAttribute("tabindex");
        },
        { once: true }
      );
    }

    strip();
  });

  if (location.hash) {
    window.addEventListener("load", strip);
  }
})();

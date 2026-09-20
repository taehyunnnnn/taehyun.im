(function () {
  "use strict";

  var about = document.getElementById("about");
  if (!about) return;

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  var DOWN = 0.08;
  var UP = 0.6;

  var GLIDE = 700;

  var last = window.scrollY;
  var down = true;
  var settling = false;
  var timer = null;

  function gap() {
    return about.getBoundingClientRect().top + window.scrollY;
  }

  function settle() {
    if (settling) return;

    var height = gap();
    var y = window.scrollY;

    if (height <= 0 || y <= 0 || y >= height) return;

    var target = (down ? y / height > DOWN : y / height > UP) ? height : 0;
    if (Math.abs(target - y) < 2) return;

    settling = true;
    window.scrollTo({ top: target, behavior: "smooth" });
    window.setTimeout(function () {
      settling = false;
    }, GLIDE);
  }

  window.addEventListener(
    "scroll",
    function () {
      var y = window.scrollY;

      if (!settling) down = y > last;
      last = y;

      window.clearTimeout(timer);
      timer = window.setTimeout(settle, 120);
    },
    { passive: true }
  );
})();

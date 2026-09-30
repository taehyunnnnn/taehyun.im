(() => {
  "use strict";

  const about = document.getElementById("about");
  if (!about) return;

  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const DOWN = 0.08;
  const UP = 0.6;

  const GLIDE = 700;

  let last = window.scrollY;
  let down = true;
  let settling = false;
  let timer = null;

  function gap() {
    return about.getBoundingClientRect().top + window.scrollY;
  }

  function settle() {
    if (settling) return;

    const height = gap();
    const y = window.scrollY;

    if (height <= 0 || y <= 0 || y >= height) return;

    const target = (down ? y / height > DOWN : y / height > UP) ? height : 0;
    if (Math.abs(target - y) < 2) return;

    settling = true;
    window.scrollTo({ top: target, behavior: "smooth" });
    setTimeout(() => {
      settling = false;
    }, GLIDE);
  }

  window.addEventListener(
    "scroll",
    () => {
      const y = window.scrollY;

      if (!settling) down = y > last;
      last = y;

      clearTimeout(timer);
      timer = setTimeout(settle, 120);
    },
    { passive: true }
  );
})();

(() => {
  "use strict";

  const source = document.querySelector(".nav");
  const masthead = document.querySelector(".masthead");

  if (!source || !masthead) return;
  if (!("IntersectionObserver" in window)) return;

  const bar = document.createElement("div");
  bar.className = "navbar";
  bar.setAttribute("aria-hidden", "true");

  const inner = document.createElement("div");
  inner.className = "navbar-inner";

  for (const link of source.querySelectorAll("a")) {
    const copy = link.cloneNode(true);
    copy.tabIndex = -1;
    inner.appendChild(copy);
  }

  bar.appendChild(inner);
  document.body.appendChild(bar);

  new IntersectionObserver((entries) => {
    bar.classList.toggle("is-visible", !entries[0].isIntersecting);
  }).observe(masthead);
})();

(function () {
  "use strict";

  var source = document.querySelector(".nav");
  var masthead = document.querySelector(".masthead");

  if (!source || !masthead) return;
  if (!("IntersectionObserver" in window)) return;

  var bar = document.createElement("div");
  bar.className = "navbar";
  bar.setAttribute("aria-hidden", "true");

  var inner = document.createElement("div");
  inner.className = "navbar-inner";

  Array.prototype.forEach.call(source.querySelectorAll("a"), function (link) {
    var copy = link.cloneNode(true);
    copy.tabIndex = -1;
    inner.appendChild(copy);
  });

  bar.appendChild(inner);
  document.body.appendChild(bar);

  new IntersectionObserver(function (entries) {
    bar.classList.toggle("is-visible", !entries[0].isIntersecting);
  }).observe(masthead);
})();

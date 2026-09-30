(() => {
  "use strict";

  // How many .hero-N classes base.css defines. Add a gradient there,
  // bump this.
  const GRADIENTS = 2;

  const pick = Math.floor(Math.random() * GRADIENTS) + 1;
  document.documentElement.classList.add(`hero-${pick}`);
})();

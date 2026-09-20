(function () {
  "use strict";

  function count() {
    var found = 0;
    var sheets = document.styleSheets;

    for (var s = 0; s < sheets.length; s++) {
      var rules;
      try {
        rules = sheets[s].cssRules;
      } catch (e) {
        continue;
      }
      if (!rules) continue;

      for (var r = 0; r < rules.length; r++) {
        if (/^\.hero-\d+$/.test(rules[r].selectorText || "")) found++;
      }
    }

    return found;
  }

  var total = count() || 5;
  var pick = Math.floor(Math.random() * total) + 1;

  document.documentElement.classList.add("hero-" + pick);
})();

(function () {
  "use strict";

  var mount = document.querySelector("[data-terminal]");
  if (!mount) return;

  var sourceList = mount.querySelector(".projects");
  if (!sourceList) return;

  var PATH = "taehyunim/projects";
  var MARK = "❯";

  function el(tag, className, textContent) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (textContent) node.textContent = textContent;
    return node;
  }

  function textOf(root, selector) {
    var found = root.querySelector(selector);
    return found ? found.textContent.trim() : "";
  }

  var projects = Array.prototype.map.call(
    sourceList.querySelectorAll(".project"),
    function (li) {
      var title = textOf(li, ".project-title");
      var link = li.querySelector(".project-link");
      var lang = textOf(li, ".project-meta").toLowerCase();

      return {
        num: textOf(li, ".project-index"),
        title: title,

        slug: title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, ""),
        desc: textOf(li, ".project-desc"),
        lang: lang,
        href: link ? link.getAttribute("href") : ""
      };
    }
  );

  if (!projects.length) return;

  var selected = 0;

  var term = el("div", "term");

  var bar = el("div", "term-bar");
  var dots = el("div", "term-dots");
  dots.setAttribute("aria-hidden", "true");
  for (var d = 0; d < 3; d++) dots.appendChild(el("span", "term-dot"));
  bar.appendChild(dots);
  bar.appendChild(el("span", "term-path", PATH));

  var head = el("div", "term-head");

  var list = el("ul", "term-list");

  var buttons = projects.map(function (project, i) {
    var row = el("li");
    var button = el("button", "term-item");
    button.type = "button";

    button.appendChild(el("span", "term-caret", MARK));
    button.appendChild(el("span", "term-num", project.num));
    button.appendChild(
      el("span", "term-file", project.slug + "." + project.lang)
    );
    button.appendChild(el("span", "term-label", project.title));

    button.addEventListener("click", function () {
      selected = i;
      draw();
      open(i);
    });

    row.appendChild(button);
    list.appendChild(row);
    return button;
  });

  head.appendChild(list);

  var output = el("div", "term-output");
  var inner = el("div", "term-inner");
  var log = el("div");

  log.setAttribute("aria-live", "polite");

  var form = el("form", "term-form");
  var promptMark = el("label", "term-ps1", MARK);
  promptMark.setAttribute("for", "term-input");

  var input = el("input", "term-input");
  input.id = "term-input";
  input.type = "text";
  input.autocomplete = "off";
  input.spellcheck = false;
  input.setAttribute("aria-label", "Terminal command");

  form.appendChild(promptMark);
  form.appendChild(input);

  inner.appendChild(log);
  inner.appendChild(form);
  output.appendChild(inner);

  var hint = el("p", "term-hint");
  hint.appendChild(
    el("span", "term-hint-keys", "↑↓ select · tab complete · enter open · type help")
  );
  hint.appendChild(el("span", "term-hint-touch", "tap a project to open it"));

  var aside = mount.parentNode && mount.parentNode.querySelector(".aside");
  if (aside) {
    var more = el("span", "term-hint-more");
    while (aside.firstChild) more.appendChild(aside.firstChild);
    aside.parentNode.removeChild(aside);
    hint.appendChild(more);
  }

  term.appendChild(bar);
  term.appendChild(head);
  term.appendChild(output);
  term.appendChild(hint);

  sourceList.hidden = true;
  mount.appendChild(term);

  var MIN = parseFloat(window.getComputedStyle(output).minHeight) || 0;
  var MAX = parseFloat(window.getComputedStyle(output).maxHeight) || Infinity;

  function fit() {
    var wanted = inner.offsetHeight;
    output.style.height = Math.max(MIN, Math.min(wanted, MAX)) + "px";
  }

  function draw() {
    buttons.forEach(function (button, i) {
      button.setAttribute("aria-current", i === selected ? "true" : "false");
    });
  }

  function print(command, lines) {
    var block;

    if (command) {
      block = el("details", "term-block");
      block.open = true;
      block.appendChild(el("summary", null, command));

      block.addEventListener("toggle", fit);
    } else {
      block = el("div", "term-block");
    }

    var body = el("div", "term-body");
    (lines || []).forEach(function (line) {
      body.appendChild(line);
    });
    block.appendChild(body);

    log.appendChild(block);
    settle();
  }

  function settle() {
    term.classList.add("has-output");
    fit();
    output.scrollTop = output.scrollHeight;
  }

  function table() {
    return el("div", "term-table");
  }

  function row(into, label, value) {
    into.appendChild(el("span", null, label));
    into.appendChild(el("span", "term-dim", value || ""));
  }

  function open(i, echo) {
    var project = projects[i];

    var link = el("a", null, project.href.replace(/^https?:\/\//, ""));
    link.href = project.href;
    link.target = "_blank";

    var linkLine = el("p");
    linkLine.appendChild(document.createTextNode("→ "));
    linkLine.appendChild(link);

    print(echo || "open " + project.num, [
      el("p", "term-title", project.title),
      el("p", null, project.desc),
      linkLine
    ]);
  }

  var COMMANDS = [
    { name: "open", args: "<number>", help: "show one, with its link" },
    { name: "help", args: "", help: "this" },
    { name: "clear", args: "", help: "empty the screen" }
  ];

  var NAMES = COMMANDS.map(function (c) {
    return c.name;
  });

  function find(argument) {
    for (var i = 0; i < projects.length; i++) {
      if (projects[i].num === argument) return i;
      if (projects[i].slug === argument) return i;
      if (projects[i].slug + "." + projects[i].lang === argument) return i;
      if (String(i + 1) === argument) return i;
    }
    return -1;
  }

  function run(raw) {
    var line = raw.trim();
    var parts = line.split(/\s+/);
    var command = (parts[0] || "").toLowerCase();
    var argument = (parts[1] || "").toLowerCase();

    if (!command) {
      open(selected);
      return;
    }

    if (command === "open" || command === "cat") {
      var i = find(argument);
      if (i === -1) {
        print(line, [
          el("p", null, "no such project: " + (argument || "(nothing given)"))
        ]);
        return;
      }
      selected = i;
      draw();
      open(i, line);
      return;
    }

    if (command === "help") {
      var grid = table();
      COMMANDS.forEach(function (c) {
        row(grid, c.name + (c.args ? " " + c.args : ""), c.help);
      });
      print(line, [
        grid,
        el("p", "term-dim", "tab completes · ↑ ↓ enter do the same by hand")
      ]);
      return;
    }

    if (command === "clear") {
      log.textContent = "";
      term.classList.remove("has-output");
      fit();
      return;
    }

    var guess = nearest(command);
    print(line, [
      el("p", null, command + ": command not found."),
      el(
        "p",
        "term-dim",
        guess ? "did you mean `" + guess + "`?" : "try `help`."
      )
    ]);
  }

  function distance(a, b) {
    var prev = [];
    var curr = [];
    var i, j;

    for (j = 0; j <= b.length; j++) prev[j] = j;

    for (i = 1; i <= a.length; i++) {
      curr[0] = i;
      for (j = 1; j <= b.length; j++) {
        curr[j] = Math.min(
          prev[j] + 1,
          curr[j - 1] + 1,
          prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
        );
      }
      prev = curr.slice();
    }

    return prev[b.length];
  }

  function nearest(word) {
    var best = null;
    var bestDistance = Infinity;

    NAMES.forEach(function (name) {
      var d = distance(word, name);
      if (d < bestDistance) {
        bestDistance = d;
        best = name;
      }
    });

    return bestDistance <= Math.max(2, Math.floor(word.length / 3))
      ? best
      : null;
  }

  /* -------------------------------------------------------------
     Tab completion
     Completes the word being typed: command names in the first
     position, project filenames after `open`. With one match it
     finishes the word; with several it fills in as far as they agree
     and lists them, the way a shell does.
     ------------------------------------------------------------- */
  function complete() {
    var parts = input.value.split(/\s+/);
    var token = parts[parts.length - 1].toLowerCase();
    var pool;

    if (parts.length === 1) {
      pool = NAMES;
    } else if (parts[0].toLowerCase() === "open" || parts[0].toLowerCase() === "cat") {
      pool = projects.map(function (p) {
        return p.slug + "." + p.lang;
      });
    } else {
      return false;
    }

    var matches = pool.filter(function (candidate) {
      return candidate.indexOf(token) === 0;
    });

    if (!matches.length) return false;

    /* The longest prefix every match agrees on. With one match that is
       the whole word, which is why this handles both cases. */
    var shared = matches.reduce(function (a, b) {
      var i = 0;
      while (i < a.length && i < b.length && a[i] === b[i]) i++;
      return a.slice(0, i);
    });

    if (matches.length > 1) {
      print(
        input.value,
        matches.map(function (m) {
          return el("p", null, m);
        })
      );
    }

    parts[parts.length - 1] = shared;
    input.value = parts.join(" ") + (matches.length === 1 ? " " : "");
    return true;
  }

  /* -------------------------------------------------------------
     6. KEYBOARD AND MOUSE
     ------------------------------------------------------------- */

  /* Whether the projects section is the thing being looked at, rather
     than something scrolled halfway off. The test is the middle of the
     window: if the section's box straddles it, the section has the
     screen. Measured per keypress rather than watched, because a
     rectangle read on demand can't go stale. */
  var section = term.closest("section") || document.getElementById("projects");

  function sectionHoldsTheScreen() {
    if (!section) return false;
    var box = section.getBoundingClientRect();
    var middle = window.innerHeight / 2;
    return box.top <= middle && box.bottom >= middle;
  }

  document.addEventListener("keydown", function (event) {
    if (event.key !== "ArrowUp" && event.key !== "ArrowDown") return;

    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
    if (event.defaultPrevented) return;

    var focused = term.contains(document.activeElement);
    if (!focused && !sectionHoldsTheScreen()) return;

    event.preventDefault();
    selected =
      event.key === "ArrowUp"
        ? (selected - 1 + projects.length) % projects.length
        : (selected + 1) % projects.length;

    draw();

    if (
      document.activeElement &&
      document.activeElement.classList.contains("term-item")
    ) {
      buttons[selected].focus({ preventScroll: true });
    }
  });

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    run(input.value);
    input.value = "";
  });

  input.addEventListener("keydown", function (event) {
    if (event.key !== "Tab" || event.shiftKey) return;
    if (!input.value.trim()) return;
    if (complete()) event.preventDefault();
  });

  var hasMouse = window.matchMedia("(pointer: fine)").matches;

  term.addEventListener("click", function (event) {
    if (!hasMouse) return;
    if (event.target.closest("button, a, summary")) return;
    input.focus({ preventScroll: true });
  });

  draw();

  fit();
})();

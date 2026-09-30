(() => {
  "use strict";

  const mount = document.querySelector("[data-terminal]");
  if (!mount) return;

  const sourceList = mount.querySelector(".projects");
  if (!sourceList) return;

  const PATH = "taehyunim/projects";
  const MARK = "❯";

  function el(tag, className, textContent) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (textContent) node.textContent = textContent;
    return node;
  }

  function textOf(root, selector) {
    const found = root.querySelector(selector);
    return found ? found.textContent.trim() : "";
  }

  const projects = [...sourceList.querySelectorAll(".project")].map((li) => {
    const title = textOf(li, ".project-title");
    const link = li.querySelector(".project-link");

    return {
      num: textOf(li, ".project-index"),
      title,
      slug: title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, ""),
      desc: textOf(li, ".project-desc"),
      lang: textOf(li, ".project-meta").toLowerCase(),
      href: link ? link.getAttribute("href") : ""
    };
  });

  if (!projects.length) return;

  let selected = 0;

  const term = el("div", "term");

  const bar = el("div", "term-bar");
  const dots = el("div", "term-dots");
  dots.setAttribute("aria-hidden", "true");
  for (let d = 0; d < 3; d++) dots.appendChild(el("span", "term-dot"));
  bar.appendChild(dots);
  bar.appendChild(el("span", "term-path", PATH));

  const head = el("div", "term-head");
  const list = el("ul", "term-list");

  const buttons = projects.map((project, i) => {
    const row = el("li");
    const button = el("button", "term-item");
    button.type = "button";

    button.appendChild(el("span", "term-caret", MARK));
    button.appendChild(el("span", "term-num", project.num));
    button.appendChild(el("span", "term-file", `${project.slug}.${project.lang}`));
    button.appendChild(el("span", "term-label", project.title));

    button.addEventListener("click", () => {
      selected = i;
      draw();
      open(i);
    });

    row.appendChild(button);
    list.appendChild(row);
    return button;
  });

  head.appendChild(list);

  const output = el("div", "term-output");
  const inner = el("div", "term-inner");
  const log = el("div");
  log.setAttribute("aria-live", "polite");

  const form = el("form", "term-form");
  const promptMark = el("label", "term-ps1", MARK);
  promptMark.setAttribute("for", "term-input");

  const input = el("input", "term-input");
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

  const hint = el("p", "term-hint");
  hint.appendChild(el("span", "term-hint-keys", "↑↓ select · enter open · type help"));
  hint.appendChild(el("span", "term-hint-touch", "tap a project to open it"));

  // The "More at github" line moves into the terminal's footer.
  const aside = mount.parentNode.querySelector(".aside");
  if (aside) {
    const more = el("span", "term-hint-more");
    more.append(...aside.childNodes);
    aside.remove();
    hint.appendChild(more);
  }

  term.appendChild(bar);
  term.appendChild(head);
  term.appendChild(output);
  term.appendChild(hint);

  sourceList.hidden = true;
  mount.appendChild(term);

  const MIN = parseFloat(getComputedStyle(output).minHeight) || 0;
  const MAX = parseFloat(getComputedStyle(output).maxHeight) || Infinity;

  function fit() {
    output.style.height = Math.max(MIN, Math.min(inner.offsetHeight, MAX)) + "px";
  }

  function draw() {
    buttons.forEach((button, i) => {
      button.setAttribute("aria-current", i === selected ? "true" : "false");
    });
  }

  function print(command, lines) {
    const block = el("details", "term-block");
    block.open = true;
    block.appendChild(el("summary", null, command));
    block.addEventListener("toggle", fit);

    const body = el("div", "term-body");
    body.append(...lines);
    block.appendChild(body);

    log.appendChild(block);
    term.classList.add("has-output");
    fit();
    output.scrollTop = output.scrollHeight;
  }

  function open(i, echo) {
    const project = projects[i];

    const link = el("a", null, project.href.replace(/^https?:\/\//, ""));
    link.href = project.href;
    link.target = "_blank";

    const linkLine = el("p");
    linkLine.append("→ ", link);

    print(echo || `open ${project.num}`, [
      el("p", "term-title", project.title),
      el("p", null, project.desc),
      linkLine
    ]);
  }

  const COMMANDS = [
    { usage: "open <number>", help: "show one, with its link" },
    { usage: "help", help: "this" },
    { usage: "clear", help: "empty the screen" }
  ];

  // Accepts "01", "1", "tic-tac-toe" or "tic-tac-toe.java".
  function find(argument) {
    return projects.findIndex(
      (p, i) =>
        p.num === argument ||
        p.slug === argument ||
        `${p.slug}.${p.lang}` === argument ||
        String(i + 1) === argument
    );
  }

  function run(raw) {
    const line = raw.trim();
    const [command = "", argument = ""] = line.toLowerCase().split(/\s+/);

    if (!command) {
      open(selected);
      return;
    }

    if (command === "open") {
      const i = find(argument);
      if (i === -1) {
        print(line, [el("p", null, `no such project: ${argument || "(nothing given)"}`)]);
        return;
      }
      selected = i;
      draw();
      open(i, line);
      return;
    }

    if (command === "help") {
      const grid = el("div", "term-table");
      COMMANDS.forEach((c) => {
        grid.appendChild(el("span", null, c.usage));
        grid.appendChild(el("span", "term-dim", c.help));
      });
      print(line, [grid, el("p", "term-dim", "↑ ↓ and enter do the same by hand")]);
      return;
    }

    if (command === "clear") {
      log.textContent = "";
      term.classList.remove("has-output");
      fit();
      return;
    }

    print(line, [
      el("p", null, `${command}: command not found.`),
      el("p", "term-dim", "try `help`.")
    ]);
  }

  /* Arrow keys only move the selection while the projects section is
     on screen, so they don't hijack scrolling anywhere else. "On screen"
     means the section covers the middle of the window. */
  const section = term.closest("section");

  function sectionIsOnScreen() {
    const box = section.getBoundingClientRect();
    const middle = window.innerHeight / 2;
    return box.top <= middle && box.bottom >= middle;
  }

  document.addEventListener("keydown", (event) => {
    if (event.key !== "ArrowUp" && event.key !== "ArrowDown") return;
    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
    if (event.defaultPrevented) return;

    const focused = term.contains(document.activeElement);
    if (!focused && !sectionIsOnScreen()) return;

    event.preventDefault();
    const step = event.key === "ArrowUp" ? -1 : 1;
    selected = (selected + step + projects.length) % projects.length;
    draw();

    // preventScroll: a plain focus() scrolls every ancestor, which
    // jumped the page by thousands of pixels.
    if (document.activeElement.classList.contains("term-item")) {
      buttons[selected].focus({ preventScroll: true });
    }
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    run(input.value);
    input.value = "";
  });

  // Clicking empty space in the terminal puts the cursor in the prompt,
  // but only with a mouse: on a phone it would pop up the keyboard.
  const hasMouse = matchMedia("(pointer: fine)").matches;

  term.addEventListener("click", (event) => {
    if (!hasMouse) return;
    if (event.target.closest("button, a, summary")) return;
    input.focus({ preventScroll: true });
  });

  draw();
  fit();
})();

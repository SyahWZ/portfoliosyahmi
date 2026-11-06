// ===== mobile nav toggle =====
const toggle = document.getElementById("navToggle");
const links = document.getElementById("navLinks");

toggle.addEventListener("click", () => {
  const open = links.classList.toggle("nav__links--open");
  toggle.classList.toggle("nav__toggle--open", open);
  toggle.setAttribute("aria-expanded", String(open));
});

links.querySelectorAll("a").forEach((a) =>
  a.addEventListener("click", () => {
    links.classList.remove("nav__links--open");
    toggle.classList.remove("nav__toggle--open");
    toggle.setAttribute("aria-expanded", "false");
  })
);

// ===== reveal on scroll =====
const io = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        io.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.12 }
);
document.querySelectorAll(".reveal, .gacha-card, .timeline").forEach((el) => io.observe(el));

// ===== footer year =====
document.getElementById("year").textContent = new Date().getFullYear();

// ============================================================
//  Section titles: type out on scroll (terminal style)
// ============================================================
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const titleIO = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      titleIO.unobserve(el);
      if (reducedMotion) { el.classList.add("is-typed"); return; }
      const span = el.querySelector(".type-title__text");
      const full = span.textContent;
      span.classList.add("is-hidden");
      const typed = document.createElement("span");
      typed.className = "type-title__typed mono";
      const cursor = document.createElement("span");
      cursor.className = "term-cursor";
      el.appendChild(typed);
      el.appendChild(cursor);
      let i = 0;
      const step = () => {
        if (i < full.length) {
          typed.textContent += full.charAt(i);
          i++;
          setTimeout(step, 45 + Math.random() * 30);
        } else {
          setTimeout(() => {
            span.classList.remove("is-hidden");
            typed.remove();
            cursor.remove();
            el.classList.add("is-typed");
          }, 260);
        }
      };
      setTimeout(step, 250);
    });
  },
  { threshold: 0.4 }
);
document.querySelectorAll(".type-title").forEach((el) => titleIO.observe(el));

// ============================================================
//  A. interactive terminal
// ============================================================
const termText = document.getElementById("termText");
const termInput = document.getElementById("termInput");
const termScreen = document.getElementById("termScreen");

const term = {
  help: [
    "commands:",
    "  whoami      — who i am",
    "  skills      — what i work with",
    "  projects    — what i've built",
    "  contact     — how to reach me",
    "  clear       — clear the screen",
  ],
  whoami: [
    "syahmi — cybersecurity intern, mycert malaysia",
    "cs undergraduate (uitm shah alam) - CGPA 3.64",
    "edr threat hunting - soc tooling - web development",
  ],
  skills: [
    "[security]    edr telemetry - threat hunting - wireshark/pcap",
    "              elastic siem (eql) - linux - git",
    "[programming] python (django, drf, fastapi, tensorflow)",
    "              java - c++ - javascript",
    "[web]         html - css - mysql",
  ],
  projects: [
    "1. soc investigation tools   — django/drf cli + web app",
    "   (internal, sanitized)",
    "2. mcp tool orchestration    — ai agents call soc tools",
    "   (internal, sanitized)",
    "3. tomato leaf disease       — tensorflow cnn + fastapi",
    "   (degree project · ml model + backend api)",
    "-> see the projects section below for the full picture",
  ],
  contact: [
    "email     syahmisuroo4@gmail.com",
    "github    github.com/SyahWZ",
    "linkedin  linkedin.com/in/syahmisuroo",
  ],
};

// --- typewriter engine: character-by-character with a blinking cursor ---
const termNode = document.createTextNode("");
const termCursor = document.createElement("span");
termCursor.className = "term-cursor";
termText.appendChild(termCursor);
termText.insertBefore(termNode, termCursor);

function scrollTerm() { termScreen.scrollTop = termScreen.scrollHeight; }

let termBusy = false;
const termQueue = [];

function pumpTerm() {
  if (termBusy || termQueue.length === 0) return;
  termBusy = true;
  const task = termQueue.shift();
  task(() => { termBusy = false; setTimeout(pumpTerm, 90); });
}

function enqueueTerm(fn) { termQueue.push(fn); pumpTerm(); }

// type one string char-by-char. perChar = ms per character.
function typeText(text, perChar, done) {
  let i = 0;
  const step = () => {
    if (i < text.length) {
      termNode.data += text.charAt(i);
      i++;
      scrollTerm();
      const c = text.charAt(i - 1);
      let d = perChar;
      if (c === " ") d *= 2.4;              // pause after words
      if (".:;!?,".includes(c)) d *= 5;     // pause after punctuation
      if (Math.random() < 0.05) d += 55;    // small human stutter
      setTimeout(step, d);
    } else if (done) done();
  };
  step();
}

// type a line, then newline
function typeLine(text, perChar, done) {
  typeText(text, perChar, () => {
    termNode.data += "\n";
    scrollTerm();
    if (done) done();
  });
}

// type several output lines back to back (fast, adaptive speed)
function outputLines(lines, done) {
  let i = 0;
  const next = () => {
    if (i >= lines.length) { if (done) done(); return; }
    const line = lines[i++];
    const speed = Math.max(4, 11 - line.length / 14);
    typeLine(line, speed, next);
  };
  next();
}

// echo a typed command at a human-ish typing speed
function typeCommand(cmd, done) {
  typeLine("$ " + cmd, 26, done);
}

function termRun(raw) {
  const cmd = raw.trim().toLowerCase();
  if (!cmd) return;
  enqueueTerm((done) => {
    if (cmd === "clear") {
      termNode.data = "";
      done();
      return;
    }
    typeCommand(raw.trim(), () => {
      if (cmd in term) outputLines(term[cmd], done);
      else outputLines([cmd + ": command not found — try 'help'"], done);
    });
  });
}

// intro sequence (typed, not revealed)
enqueueTerm((done) => {
  typeCommand("whoami", () => outputLines(term.whoami, done));
});

termInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    const val = termInput.value;
    termInput.value = "";
    termRun(val);
  }
});

// clicking anywhere in the terminal focuses the input
document.getElementById("terminal").addEventListener("click", () => {
  termInput.focus();
});

// ============================================================
//  B. event stream (demo)
// ============================================================
const streamList = document.getElementById("streamList");

const events = [
  ["10.0.4.22", "proc.spawn", "powershell.exe -enc ..."],
  ["10.0.9.17", "net.conn", "443/tcp established"],
  ["10.0.2.31", "file.write", "C:\\Users\\...\\temp.bat"],
  ["10.0.7.8", "token.used", "svc_backup (elevation)"],
  ["10.0.4.22", "proc.spawn", "cmd.exe /c ..."],
  ["10.0.11.5", "dns.lookup", "pastebin[.]com"],
  ["10.0.9.17", "reg.set", "HKLM\\...\\Run"],
  ["10.0.2.31", "net.send", "445/tcp out 1.4MB"],
  ["10.0.7.8", "logon", "id 10 / workstation"],
  ["10.0.4.22", "proc.exit", "rundll32.exe (0)"],
];

function streamTick() {
  const [host, type, detail] = events[Math.floor(Math.random() * events.length)];
  const t = new Date().toTimeString().slice(0, 8);
  const li = document.createElement("li");
  const isAlert = type === "file.write" || type === "reg.set" || type === "dns.lookup";
  li.className = "stream__row" + (isAlert ? " stream__row--alert" : "");
  li.innerHTML =
    "<span class='stream__time'>" + t + "</span>" +
    "<span class='stream__host'>" + host + "</span>" +
    "<span class='stream__type'>" + type + "</span>" +
    "<span class='stream__detail'>" + detail + "</span>";
  streamList.prepend(li);
  while (streamList.children.length > 7) streamList.removeChild(streamList.lastChild);
}

// seed a few rows so it never looks empty, then keep ticking
for (let i = 0; i < 6; i++) streamTick();
setInterval(streamTick, 2400);

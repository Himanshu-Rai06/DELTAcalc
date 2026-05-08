document.addEventListener('DOMContentLoaded', () => {

  /* ===============================
     ELEMENTS
     =============================== */
  const displayMain = document.getElementById("display");
  const displayHist = document.getElementById("historyDisplay");
  const buttons = document.querySelectorAll("button[data-val]");
  const settingsBtn = document.getElementById("settingsBtn");
  const settingsPanel = document.getElementById("settingsPanel");
  const sciToggle = document.getElementById("scientificToggle");
  const soundToggle = document.getElementById("soundToggle");
  const themeDots = document.querySelectorAll(".theme-dot");
  const historyBtn = document.getElementById("historyBtn");
  const historySidebar = document.getElementById("historySidebar");
  const closeHistory = document.getElementById("closeHistory");
  const clearAllBtn = document.getElementById("clearAllBtn");
  const historyList = document.getElementById("historyList");
  const calculator = document.querySelector(".calculator");

  /* ===============================
     STATE
     =============================== */
  let currentInput = "0";
  let shouldResetScreen = false;
  let soundEnabled = true;
  let currentTheme = localStorage.getItem("calcTheme") || "dark";
  let audioUnlocked = false;

  /* ===============================
     SOUND SYSTEM
     =============================== */
  const soundMap = {
    "dark":        "/static/darkAudio.mp3",
    "pastel-blue": "/static/blueAudio.mp3",
    "pastel-pink": "/static/pinkAudio.mp3",
    "grey-white":  "/static/oysterAudio.mp3",
    "sage-green":  "/static/greenAudio.mp3"
  };

  // Unlock audio context on first user interaction (iOS/autoplay policy)
  document.addEventListener("click", () => {
    if (audioUnlocked) return;
    audioUnlocked = true;
    const a = new Audio();
    a.play().catch(() => {});
  }, { once: true });

  function playSound() {
    if (!soundEnabled) return;
    const audio = new Audio(soundMap[currentTheme] || soundMap.dark);
    audio.volume = 0.4;
    audio.play().catch(() => {});
  }

  /* ===============================
     THEME
     =============================== */
  function applyTheme(theme) {
    currentTheme = theme;
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("calcTheme", theme);

    themeDots.forEach(dot =>
      dot.classList.toggle("active", dot.dataset.theme === theme)
    );
  }

  applyTheme(currentTheme);

  /* ===============================
     SOUND SETTING
     =============================== */
  if (localStorage.getItem("calcSound") !== null) {
    soundEnabled = localStorage.getItem("calcSound") === "true";
    soundToggle.checked = soundEnabled;
  }

  soundToggle.onchange = () => {
    soundEnabled = soundToggle.checked;
    localStorage.setItem("calcSound", soundEnabled);
  };

  /* ===============================
     CALCULATOR LOGIC
     =============================== */
  const OPERATORS = ['+', '-', '×', '÷'];

  function clearAll() {
    currentInput = "0";
    displayMain.textContent = "0";
    displayHist.textContent = "\u00A0";
    shouldResetScreen = false;
  }

  // FIX 5: Backspace after a result no longer wipes — it lets you edit the result instead.
  function deleteLast() {
    if (shouldResetScreen) {
      shouldResetScreen = false;
      return;
    }
    currentInput = currentInput.length === 1 ? "0" : currentInput.slice(0, -1);
    displayMain.textContent = currentInput;
  }

  function appendNumberOrOp(val) {
    const lastChar = currentInput.slice(-1);

    if (shouldResetScreen) {
      // FIX 1a: If user continues with an operator after a result, chain the expression.
      // If they type a number/function, start fresh.
      if (OPERATORS.includes(val)) {
        shouldResetScreen = false;
        // fall through — append operator onto the result
      } else {
        currentInput = "";
        shouldResetScreen = false;
        window.getSelection().removeAllRanges();
      }
    } else if (currentInput === "0" && !OPERATORS.includes(val) && val !== ".") {
      // Replace leading zero unless it's an operator or decimal
      currentInput = "";
    }

    // FIX 1b: Prevent stacking operators — replace last operator if new one is typed.
    if (OPERATORS.includes(val) && OPERATORS.includes(lastChar)) {
      currentInput = currentInput.slice(0, -1);
    }

    currentInput += val;
    displayMain.textContent = currentInput;
  }

  // FIX 2: Check res.ok and data.result === 'Error' so server 400s are caught properly.
  async function evaluate() {
    if (!currentInput || currentInput === "0") return;

    try {
      const res = await fetch('/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ expression: currentInput })
      });

      const data = await res.json();

      if (!res.ok || data.result === 'Error') {
        displayMain.textContent = "Error";
        displayHist.textContent = "\u00A0";
        shouldResetScreen = true;
        return;
      }

      displayHist.textContent = currentInput + " =";
      currentInput = data.result;
      displayMain.textContent = currentInput;
      shouldResetScreen = true;
      renderHistory(data.history);

    } catch {
      displayMain.textContent = "Error";
      displayHist.textContent = "\u00A0";
      shouldResetScreen = true;
    }
  }

  /* ===============================
     BUTTON EVENTS
     =============================== */
  buttons.forEach(btn => {
    btn.addEventListener("click", () => {
      playSound();
      const val = btn.dataset.val;

      if (val === "AC")       clearAll();
      else if (val === "DEL") deleteLast();
      else if (val === "=")   evaluate();
      else                    appendNumberOrOp(val);

      // Remove visual focus so Enter key doesn't re-trigger the last button
      btn.blur();
    });
  });

  /* ===============================
     KEYBOARD EVENTS
     =============================== */
  document.addEventListener("keydown", (e) => {
    const key = e.key;

    // --- 1. Ctrl/Cmd + A: select display text ---
    if ((e.ctrlKey || e.metaKey) && key.toLowerCase() === 'a') {
      e.preventDefault();
      const range = document.createRange();
      range.selectNodeContents(displayMain);
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
      shouldResetScreen = true;
      return;
    }

    // Ignore key combos with Ctrl/Meta (e.g. Ctrl+R, Ctrl+C)
    if (e.ctrlKey || e.metaKey) return;

    // --- 2. Key Mapping ---
    let action = null;
    let val    = null;

    if      (key === "Enter")     action = "evaluate";
    else if (key === "Backspace") action = "delete";
    else if (key === "Escape")    action = "clear";

    // FIX 4: Use regex instead of isNaN — prevents " ", "e", "" from matching as numbers
    else if (/^[0-9]$/.test(key) || key === ".") val = key;

    else if (key === "+") val = "+";
    else if (key === "-") val = "-";
    else if (key === "*") val = "×";
    else if (key === "/") { e.preventDefault(); val = "÷"; } // prevent browser quick-find
    else if (key === "^") val = "^";
    else if (key === "%") val = "%";
    else if (key === "(" || key === ")") val = key;

    // FIX 3: Route sci shortcuts through val so sound + visual feedback fires correctly
    else if (key === "s") val = "sin(";
    else if (key === "c") val = "cos(";
    else if (key === "t") val = "tan(";
    else if (key === "l") val = "log(";

    // --- 3. Execute + Sound + Visual ---
    if (action || val !== null) {
      let btnSelector = null;
      if      (val !== null)          btnSelector = `button[data-val="${val}"]`;
      else if (action === "evaluate") btnSelector = 'button[data-val="="]';
      else if (action === "delete")   btnSelector = 'button[data-val="DEL"]';
      else if (action === "clear")    btnSelector = 'button[data-val="AC"]';

      playSound();

      const btn = btnSelector ? document.querySelector(btnSelector) : null;
      if (btn) {
        btn.classList.add("pressed");
        setTimeout(() => btn.classList.remove("pressed"), 150);
      }

      if      (action === "evaluate") evaluate();
      else if (action === "delete")   deleteLast();
      else if (action === "clear")    clearAll();
      else if (val !== null)          appendNumberOrOp(val);
    }
  });

  /* ===============================
     UI CONTROLS
     =============================== */
  settingsBtn.onclick = e => {
    e.stopPropagation();
    settingsPanel.classList.toggle("hidden");
  };

  document.onclick = e => {
    if (!settingsPanel.contains(e.target) && e.target !== settingsBtn) {
      settingsPanel.classList.add("hidden");
    }
  };

  sciToggle.onchange = () => {
    calculator.classList.toggle("expanded", sciToggle.checked);
  };

  themeDots.forEach(dot => {
    dot.onclick = () => applyTheme(dot.dataset.theme);
  });

  /* ===============================
     HISTORY
     =============================== */
  historyBtn.onclick = async () => {
    historySidebar.classList.remove("hidden");
    try {
      const res = await fetch('/history');
      const data = await res.json();
      renderHistory(data.history);
    } catch {
      renderHistory([]);
    }
  };

  closeHistory.onclick = () => historySidebar.classList.add("hidden");

  clearAllBtn.onclick = async () => {
    try {
      const res = await fetch('/history', { method: 'DELETE' });
      const data = await res.json();
      renderHistory(data.history);
    } catch {
      renderHistory([]);
    }
  };

  // FIX 6: Use textContent instead of innerHTML to prevent XSS from stored expressions.
  function renderHistory(history) {
    historyList.innerHTML = "";

    if (!history || !history.length) {
      const empty = document.createElement("div");
      empty.style.cssText = "opacity:.5;text-align:center";
      empty.textContent = "No history";
      historyList.appendChild(empty);
      return;
    }

    history.forEach(item => {
      const div = document.createElement("div");
      div.className = "history-item";

      const expr = document.createElement("span");
      expr.style.opacity = "0.7";
      expr.textContent = item.expression + " =";

      const result = document.createElement("strong");
      result.textContent = item.result;

      div.appendChild(expr);
      div.appendChild(document.createTextNode(" "));
      div.appendChild(result);

      div.onclick = () => {
        currentInput = item.result;
        displayMain.textContent = currentInput;
        historySidebar.classList.add("hidden");
        shouldResetScreen = false;
      };

      historyList.appendChild(div);
    });
  }

});


/* ===============================
   PWA SERVICE WORKER
   =============================== */
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/static/sw.js")
      .then(() => console.log("Service Worker Registered"))
      .catch(err => console.error("SW failed", err));
  });
}

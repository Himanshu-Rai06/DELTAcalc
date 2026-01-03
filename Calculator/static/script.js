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
    "dark": "/static/darkAudio.mp3",
    "pastel-blue": "/static/blueAudio.mp3",
    "pastel-pink": "/static/pinkAudio.mp3",
    "grey-white": "/static/oysterAudio.mp3",
    "sage-green": "/static/greenAudio.mp3"
  };

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
  function clearAll() {
    currentInput = "0";
    displayMain.textContent = "0";
    displayHist.textContent = "\u00A0";
    shouldResetScreen = false;
  }

  function deleteLast() {
    // If we just calculated OR used Ctrl+A, delete clears everything
    if (shouldResetScreen) { 
        clearAll(); 
        return; 
    }
    currentInput = currentInput.length === 1 ? "0" : currentInput.slice(0, -1);
    displayMain.textContent = currentInput;
  }

  function appendNumberOrOp(val) {
    if (currentInput === "0" || shouldResetScreen) {
      currentInput = "";
      shouldResetScreen = false;
      
      // Remove selection if user types a number after Ctrl+A
      window.getSelection().removeAllRanges();
    }
    currentInput += val;
    displayMain.textContent = currentInput;
  }

  async function evaluate() {
    try {
      const res = await fetch('/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ expression: currentInput })
      });
      const data = await res.json();
      displayHist.textContent = currentInput + " =";
      currentInput = data.result;
      displayMain.textContent = currentInput;
      shouldResetScreen = true;
      renderHistory(data.history);
    } catch {
      displayMain.textContent = "Error";
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

      if (val === "AC") clearAll();
      else if (val === "DEL") deleteLast();
      else if (val === "=") evaluate();
      else appendNumberOrOp(val);
      
      // Remove visual focus so Enter key doesn't trigger last button
      btn.blur();
    });
  });

  /* ===============================
     KEYBOARD EVENTS (NEW ADDITION)
     =============================== */
  document.addEventListener("keydown", (e) => {
    const key = e.key;

    // --- 1. Ctrl + A (Select Input) ---
    if ((e.ctrlKey || e.metaKey) && key.toLowerCase() === 'a') {
        e.preventDefault();
        
        // Select the text inside the display div
        const range = document.createRange();
        range.selectNodeContents(displayMain);
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
        
        // Mark flag: next input will overwrite (standard behavior)
        shouldResetScreen = true;
        return;
    }

    // --- 2. Key Mapping ---
    let action = null;
    let val = null;

    if (key === "Enter") action = "evaluate";
    else if (key === "Backspace") action = "delete";
    else if (key === "Escape") action = "clear";
    // Map standard keys
    else if (!isNaN(key) || key === ".") val = key;
    else if (key === "+") val = "+";
    else if (key === "-") val = "-"; // logic handles standard hyphen
    else if (key === "*") val = "×"; // Map to UI symbol
    else if (key === "/") val = "÷"; // Map to UI symbol
    else if (key === "^") val = "^";
    else if (key === 's') appendNumberOrOp('sin(');
    else if (key === 'c') appendNumberOrOp('cos(');
    else if (key === 't') appendNumberOrOp('tan(');
    else if (key === 'l') appendNumberOrOp('log(');
    else if (key === "(" || key === ")") val = key;

    // --- 3. Execution & Sound ---
    if (action || val) {
        // Find corresponding button for visual effect
        let btnSelector;
        if (val) btnSelector = `button[data-val="${val}"]`;
        else if (action === "evaluate") btnSelector = 'button[data-val="="]';
        else if (action === "delete") btnSelector = 'button[data-val="DEL"]';
        else if (action === "clear") btnSelector = 'button[data-val="AC"]';

        const btn = document.querySelector(btnSelector);
        
        // Trigger sound & Visuals
        playSound();
        if (btn) {
            btn.classList.add("pressed"); // Use your existing CSS class if available
            // If you don't have a CSS class for this, the button will just click
            setTimeout(() => btn.classList.remove("pressed"), 150);
        }

        // Trigger Logic
        if (action === "evaluate") evaluate();
        else if (action === "delete") deleteLast();
        else if (action === "clear") clearAll();
        else if (val) appendNumberOrOp(val);
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
    const res = await fetch('/history');
    const data = await res.json();
    renderHistory(data.history);
  };

  closeHistory.onclick = () => historySidebar.classList.add("hidden");

  clearAllBtn.onclick = async () => {
    const res = await fetch('/history', { method: 'DELETE' });
    const data = await res.json();
    renderHistory(data.history);
  };

  function renderHistory(history) {
    historyList.innerHTML = "";
    if (!history || !history.length) {
      historyList.innerHTML = "<div style='opacity:.5;text-align:center'>No history</div>";
      return;
    }
    history.forEach(item => {
      const div = document.createElement("div");
      div.className = "history-item";
      div.innerHTML = `<span style="opacity:0.7">${item.expression} =</span> <strong>${item.result}</strong>`;
      div.onclick = () => {
        currentInput = item.result;
        displayMain.textContent = currentInput;
        historySidebar.classList.add("hidden");
        shouldResetScreen = false; // Reset flag so they can edit the history result
      };
      historyList.appendChild(div);
    });
  }

});


// PWA Service Worker Registration
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/static/sw.js")
      .then(() => console.log("Service Worker Registered"))
      .catch(err => console.error("SW failed", err));
  });
}

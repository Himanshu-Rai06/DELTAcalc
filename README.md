# DeltaCalc

A minimalist scientific calculator built with glassmorphism aesthetics, smooth interactions, and PWA support. Designed to be lightweight, themeable, and installable across desktop and mobile.

**Live demo:** https://calc-ya8t.onrender.com

---

## Features

- Standard and scientific calculator modes
- Five visual themes — Dark, Pastel Blue, Pastel Pink, Grey-White, Sage Green
- Optional button sounds, synced to the active theme
- Persistent calculation history across sessions
- User settings saved via Local Storage
- Installable as a Progressive Web App (PWA) on desktop and mobile
- Glassmorphism UI with subtle animations
- Fully responsive and lightweight

---

## Tech Stack

| Layer      | Technology                        |
|------------|-----------------------------------|
| Frontend   | HTML, CSS (Glassmorphism), JavaScript |
| Backend    | Python (Flask)                    |
| Deployment | Render                            |
| PWA        | Web Manifest + Service Worker     |

---

## Local Setup

**Prerequisites:** Python 3.x, pip, git

```bash
git clone https://github.com/Himanshu-Rai06/DELTAcalc.git
cd DELTAcalc
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Run the app:

```bash
python app.py
```

Then open `http://localhost:5000` in your browser.

---

## Project Structure

```
DELTAcalc/
├── app.py
├── requirements.txt
├── render.yaml
├── static/
│   ├── screenshots/
│   │   ├── desktop.png
│   │   └── mobile.png
│   ├── manifest.json
│   ├── sw.js
│   ├── script.js
│   ├── style.css
│   ├── favicon.png
│   ├── icon-192.png
│   ├── icon-512.png
│   ├── blueAudio.mp3
│   ├── darkAudio.mp3
│   ├── greenAudio.mp3
│   ├── oysterAudio.mp3
│   └── pinkAudio.mp3
├── templates/
│   └── index.html
├── LICENSE
└── README.md
```

---

## Screenshots

<img width="1048" height="868" alt="image" src="https://github.com/user-attachments/assets/7d4ed287-74b2-4354-a29c-43b1e3bf5d4d" />

---
<img width="1069" height="872" alt="image" src="https://github.com/user-attachments/assets/ed476724-5184-4f40-8ea9-3ad1ba42a2f0" />


---

## Contributing

This is a personal learning project, but suggestions and feedback are welcome. Feel free to open an issue or fork the repo.

---

## License

(https://github.com/Himanshu-Rai06/DELTAcalc/blob/main/LICENSE)

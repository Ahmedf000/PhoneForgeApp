# PhoneForge

Offline phone-number formatter built with Electron. Paste any messy number, pick a country, and get a clean **E.164** result (e.g. `+4479460958`). No internet. No data leaves your device.

## Features
- ✂️ Cleans separators, spaces, weird symbols
- 🧠 Handles `(0)` national trunk codes & trims leading zeros safely
- 🌍 Country picker with type-to-search; always returns a full `+<countrycode><number>`
- 🔒 Secure renderer: `contextIsolation`, `sandbox`, `nodeIntegration: false`
- 🖥️ Hardware acceleration disabled by default to avoid GPU glitches

## Run (dev)
```bash
git clone <your-repo-url>
cd PhoneForgeApp
npm install
npm start


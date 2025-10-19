// main.js — GPU HARDENED (CPU-only rendering)
const { app, BrowserWindow } = require('electron');
const path = require('path');

/* ---- Disable all GPU / accelerated paths (do this BEFORE app.whenReady) ---- */
// Electron-level kill switch
app.disableHardwareAcceleration();

// Chromium switches — belt & suspenders
app.commandLine.appendSwitch('disable-gpu');
app.commandLine.appendSwitch('disable-gpu-compositing');
app.commandLine.appendSwitch('disable-accelerated-2d-canvas');
app.commandLine.appendSwitch('disable-software-rasterizer'); // prevent fallbacks that may still poke GPU
// Disable WebGL features explicitly
app.commandLine.appendSwitch('disable-features', [
  'CanvasOopRasterization',
  'Accelerated2dCanvas',
  'UseSkiaRenderer',
  'VaapiVideoDecoder',
  'WebGL',
  'WebGL2'
].join(','));

/* -------------------------------------------------------------------------- */

function createWindow() {
  const win = new BrowserWindow({
    width: 900,
    height: 700,
    useContentSize: true,
    backgroundColor: '#0f1115',
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      // SECURITY
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true,

      // RENDERING SAFETY: keep everything CPU-only
      // (Some flags are Chromium-level above; these help at the renderer side)
      javascript: true,
      images: true,
      // Prevent any GPU/GL contexts
      offscreen: false,            // make sure we're not using offscreen GPU surfaces
      // Note: there isn't a stable boolean "webgl" toggle in current Electron;
      // we already disabled WebGL via command-line switches above.
    },
  });

  win.once('ready-to-show', () => win.show());

  // Load your packaged UI
  win.loadFile(path.join(__dirname, 'app', 'index.html'));

  // Block navigation/popups
  win.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  win.webContents.on('will-navigate', e => e.preventDefault());
}

app.whenReady().then(() => {
  app.setAppUserModelId('com.phoneforge.app');
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Standard quit behavior
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

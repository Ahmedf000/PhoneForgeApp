const { app, BrowserWindow } = require('electron');
const path = require('path');

// Fix rainbow/triangle glitches
app.disableHardwareAcceleration();

function createWindow() {
  const win = new BrowserWindow({
    width: 900,
    height: 700,
    backgroundColor: '#0f1115',
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  win.removeMenu();
  win.once('ready-to-show', () => win.show());
  win.loadFile(path.join(__dirname, 'app', 'index.html'));

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

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

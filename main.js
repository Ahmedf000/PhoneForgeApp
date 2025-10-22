const { app, BrowserWindow } = require('electron');
const path = require('path');

app.disableHardwareAcceleration();


app.commandLine.appendSwitch('disable-gpu');
app.commandLine.appendSwitch('disable-gpu-compositing');
app.commandLine.appendSwitch('disable-accelerated-2d-canvas');
app.commandLine.appendSwitch('disable-software-rasterizer'); 

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

      
      javascript: true,
      images: true,
      offscreen: false,             
    },
  });

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

// Standard quit behavior
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

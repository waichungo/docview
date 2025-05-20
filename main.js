const { app, BrowserWindow } = require('electron');
const path = require('node:path');
const isDev = require('electron-is-dev');
const fs = require('node:fs');

function init() {
  const pdfjsDistPath = path.dirname(require.resolve('pdfjs-dist/package.json'));
  const pdfWorkerPath = path.join(pdfjsDistPath, 'build', 'pdf.worker.mjs');

  fs.cpSync(pdfWorkerPath, './dist/pdf.worker.mjs', { recursive: true });
}
init();
let mainWindow;
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      webSecurity:false
    },
  });

  const startURL = isDev
    ? 'http://localhost:5579'
    : `file://${path.join(__dirname, '../build/index.html')}`;

  mainWindow.webContents.session.webRequest.onBeforeSendHeaders(
    (details, callback) => {
      callback({ requestHeaders: { Origin: '*', ...details.requestHeaders } });
    },
  );

  mainWindow.webContents.session.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        'Access-Control-Allow-Origin': ['*'],
        ...details.responseHeaders,
      },
    });
  });

  mainWindow.loadURL(startURL);

  mainWindow.on('closed', () => (mainWindow = null));
}

app.on('ready', createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});
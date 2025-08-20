var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { app, BrowserWindow } from 'electron';
import path from 'path';
import isDev from 'electron-is-dev';
import { fileURLToPath } from 'url';
import { DBAccess } from './dbmodels/dbmodels.js';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
function start() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield DBAccess.initialize();
        }
        catch (error) {
            console.error(error);
        }
    });
}
let mainWindow = null;
function createWindow() {
    mainWindow = new BrowserWindow({
        autoHideMenuBar: true,
        width: 800,
        height: 600,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: true,
            webSecurity: false,
            contextIsolation: true,
            nodeIntegrationInWorker: true,
        },
    });
    const startURL = isDev
        ? 'http://localhost:5579'
        : `file://${path.join(__dirname, '../build/index.html')}`;
    // const startURL = 'http://localhost:5579'
    mainWindow.webContents.session.webRequest.onBeforeSendHeaders((details, callback) => {
        callback({ requestHeaders: Object.assign({ Origin: '*' }, details.requestHeaders) });
    });
    mainWindow.webContents.session.webRequest.onHeadersReceived((details, callback) => {
        callback({
            responseHeaders: Object.assign({ 'Access-Control-Allow-Origin': ['*'] }, details.responseHeaders),
        });
    });
    mainWindow.loadURL(startURL);
    mainWindow.on('closed', () => (mainWindow = null));
    start();
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
//# sourceMappingURL=main.js.map
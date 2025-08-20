const { contextBridge, ipcRenderer } = require('electron');
const { webUtils } = require('electron'); // Import webUtils
const { pathToFileURL } = require('url');

contextBridge.exposeInMainWorld('electronAPI', {
    getPathForFile: (file) => webUtils.getPathForFile(file),
    sendFileToMain: (filePath) => ipcRenderer.invoke('get-file-path', filePath),
    pathToFileURL: (file) => pathToFileURL(file).href
});
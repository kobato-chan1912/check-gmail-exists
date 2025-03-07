const { app, BrowserWindow, dialog, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const fsPromise = require('fs').promises;
let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 500,
    webPreferences: {
      nodeIntegration: true, // Cho phép sử dụng require trong renderer process
      contextIsolation: false, // Cho phép sử dụng require trong renderer process
      enableRemoteModule: true, // Cho phép sử dụng remote trong renderer process

    }
  });

  mainWindow.loadFile('index.html');

  mainWindow.on('closed', function () {
    mainWindow = null;
  });
}

app.on('ready', createWindow);

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});




app.on('activate', function () {
  if (mainWindow === null) {
    createWindow();
  }
});

ipcMain.handle('dialog:saveFile', async (event, defaultName) => {
  const result = await dialog.showSaveDialog({
    title: 'Save File',
    defaultPath: path.join(app.getPath('documents'), defaultName || 'output.txt'),
    filters: [
      { name: 'Excel Files', extensions: ['txt'] },
    ],
  });

  return result.filePath; // Return the selected file path or undefined if canceled
});

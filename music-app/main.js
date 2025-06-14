const { app, BrowserWindow } = require('electron/main')
const { ipcMain } = require('electron');

const createWindow = () => {
  const win = new BrowserWindow({
    width: 500,
    height: 610,
    resizable: false,
    frame: false,
    transparent: false,
    titleBarStyle: 'hidden',
    maximizable: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    }
  })

  win.loadFile('index.html')
}

app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

ipcMain.on('minimize-window', (event) => {
  const window = BrowserWindow.fromWebContents(event.sender);
  if(window) window.minimize();
})

ipcMain.on('close-window', (event) => {
  const window = BrowserWindow.fromWebContents(event.sender);
  if(window) window.close();
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

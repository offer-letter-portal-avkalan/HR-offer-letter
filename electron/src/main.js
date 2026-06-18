const { app, BrowserWindow, ipcMain, Menu, shell, dialog, globalShortcut, session } = require('electron')
const path = require('path')
const os = require('os')

let isDev = true
let FRONTEND_URL = 'http://localhost:3000'
let mainWindow = null

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    title: 'Offer Letter Portal',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      webSecurity: true,
      spellcheck: false,
    },
  })

  // OS-level protection — on Windows 10+ this makes the window appear
  // black/blank in all screenshot tools that use the WinAPI BitBlt or
  // SetWindowDisplayAffinity path (Snipping Tool, PrintScreen, Xbox Game Bar)
  mainWindow.setContentProtection(true)

  // Remove the menu bar — eliminates Ctrl+P (print), Ctrl+S (save page), etc.
  Menu.setApplicationMenu(null)

  // Show a loading page while the frontend dev server starts
  const loadingPage = 'data:text/html,' + encodeURIComponent(`
    <html><head><style>
      body{font-family:-apple-system,sans-serif;display:flex;align-items:center;
           justify-content:center;height:100vh;margin:0;background:#f8fafc;}
      .box{text-align:center;}
      .spinner{width:40px;height:40px;border:3px solid #e2e8f0;border-top-color:#3b82f6;
               border-radius:50%;animation:spin .8s linear infinite;margin:0 auto 16px;}
      @keyframes spin{to{transform:rotate(360deg);}}
      h2{color:#1e293b;margin:0 0 8px;font-size:18px;}
      p{color:#64748b;margin:0;font-size:14px;}
    </style></head><body>
      <div class="box">
        <div class="spinner"></div>
        <h2>Starting Offer Letter Portal…</h2>
        <p>Waiting for frontend on localhost:3000</p>
      </div>
    </body></html>
  `)

  mainWindow.loadURL(loadingPage)

  // Retry connecting to the frontend every 2 seconds until it responds
  function tryLoadFrontend() {
    if (!mainWindow) return
    mainWindow.loadURL(FRONTEND_URL).catch(() => {
      setTimeout(tryLoadFrontend, 2000)
    })
  }

  mainWindow.webContents.on('did-fail-load', (_e, errorCode) => {
    // -102 = ERR_CONNECTION_REFUSED (server not up yet), -106 = ERR_INTERNET_DISCONNECTED
    if ((errorCode === -102 || errorCode === -106) && isDev) {
      mainWindow.loadURL(loadingPage).then(() => setTimeout(tryLoadFrontend, 2000))
    }
  })

  setTimeout(tryLoadFrontend, 1500)

  // Block DevTools in production; allow in dev only via explicit call below
  mainWindow.webContents.on('devtools-opened', () => {
    if (!isDev) {
      mainWindow.webContents.closeDevTools()
    }
  })

  // Disable right-click context menu (blocks Inspect Element, Save Image As, etc.)
  mainWindow.webContents.on('context-menu', (e) => {
    e.preventDefault()
  })

  mainWindow.on('closed', () => {
    mainWindow = null
  })

  // Signed PDF URLs must open inside Electron, not the system browser,
  // so content protection applies to them too
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    const isStorageUrl =
      url.includes('supabase') ||
      url.includes('/storage/') ||
      url.endsWith('.pdf')

    if (isStorageUrl) {
      // Load inside current window so setContentProtection covers it
      mainWindow.loadURL(url)
      return { action: 'deny' }
    }

    if (url.startsWith('http://') || url.startsWith('https://')) {
      shell.openExternal(url)
    }
    return { action: 'deny' }
  })
}

function registerScreenshotBlocks() {
  // These shortcuts are registered globally — they are intercepted even
  // when the app is not focused on some OS versions
  const shortcuts = [
    'PrintScreen',
    'Control+PrintScreen',
    'Alt+PrintScreen',
    'Shift+PrintScreen',
    'Control+Shift+S',   // Windows Snipping Tool shortcut
    'Control+P',         // Print
    // macOS
    'Command+Shift+3',
    'Command+Shift+4',
    'Command+Shift+5',
    'Command+Control+Shift+3',
    'Command+Control+Shift+4',
    'Command+P',
  ]

  shortcuts.forEach((shortcut) => {
    try {
      globalShortcut.register(shortcut, () => {
        if (mainWindow) {
          dialog.showMessageBox(mainWindow, {
            type: 'warning',
            title: 'Screenshot Blocked',
            message: 'Screenshots and printing are not permitted in this secure viewer.',
            buttons: ['OK'],
          })
        }
      })
    } catch {
      // Some shortcuts may fail on certain OS versions — ignore silently
    }
  })
}

const gotTheLock = app.requestSingleInstanceLock()
if (!gotTheLock) {
  app.quit()
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.focus()
    }
  })

  app.whenReady().then(() => {
    isDev = !app.isPackaged
    FRONTEND_URL = isDev
      ? 'http://localhost:3000'
      : `file://${path.join(__dirname, '../../frontend/dist/index.html')}`

    // Inject secret header into every API request so the backend
    // can reject requests that didn't come from this Electron app.
    session.defaultSession.webRequest.onBeforeSendHeaders((details, callback) => {
      details.requestHeaders['X-Electron-Secret'] = 'avkalan-electron-viewer-2026-secure'
      callback({ requestHeaders: details.requestHeaders })
    })

    createWindow()
    registerScreenshotBlocks()

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })
  })
}

app.on('will-quit', () => {
  globalShortcut.unregisterAll()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

ipcMain.handle('get-platform', () => ({
  platform: process.platform,
  arch: os.arch(),
  version: app.getVersion(),
}))

ipcMain.on('screenshot-attempt-detected', () => {
  if (mainWindow) {
    dialog.showMessageBox(mainWindow, {
      type: 'warning',
      title: 'Security Notice',
      message: 'Screenshots of this content are not allowed.',
      buttons: ['OK'],
    })
  }
})

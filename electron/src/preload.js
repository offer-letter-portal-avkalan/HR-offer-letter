const { contextBridge, ipcRenderer } = require('electron')

// Block screen capture APIs before any page script runs.
// getDisplayMedia is the standard API used by screen recorders and sharing tools.
// We override it here (in the isolated preload context) so the page cannot call it.
window.addEventListener('DOMContentLoaded', () => {
  try {
    if (navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
      Object.defineProperty(navigator.mediaDevices, 'getDisplayMedia', {
        value: () => {
          ipcRenderer.send('screenshot-attempt-detected')
          return Promise.reject(
            new DOMException('Screen capture is disabled in this secure viewer.', 'NotAllowedError')
          )
        },
        writable: false,
        configurable: false,
      })
    }
  } catch {
    // Already non-configurable on some Chromium builds — ignore
  }

  // Block window.print()
  try {
    Object.defineProperty(window, 'print', {
      value: () => {
        ipcRenderer.send('screenshot-attempt-detected')
      },
      writable: false,
      configurable: false,
    })
  } catch {
    window.print = () => {
      ipcRenderer.send('screenshot-attempt-detected')
    }
  }
})

contextBridge.exposeInMainWorld('electronAPI', {
  getPlatform: () => ipcRenderer.invoke('get-platform'),
  reportScreenshotAttempt: () => ipcRenderer.send('screenshot-attempt-detected'),
  isElectron: true,
})

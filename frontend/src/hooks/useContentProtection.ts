import { useEffect } from 'react'

declare global {
  interface Window {
    electronAPI?: {
      isElectron: boolean
      reportScreenshotAttempt: () => void
      getPlatform: () => Promise<{ platform: string; arch: string; version: string }>
    }
  }
}

export function useContentProtection(enabled = true) {
  useEffect(() => {
    if (!enabled) return

    const isElectron = !!window.electronAPI?.isElectron

    // --- Keyboard: block PrintScreen and common screenshot shortcuts ---
    const handleKeyDown = (e: KeyboardEvent) => {
      const isScreenshot =
        e.key === 'PrintScreen' ||
        // macOS: Cmd+Shift+3/4/5
        (e.metaKey && e.shiftKey && ['3', '4', '5'].includes(e.key)) ||
        // Windows Snipping Tool: Win+Shift+S (shows as metaKey+shiftKey+s in Electron)
        (e.metaKey && e.shiftKey && e.key.toLowerCase() === 's') ||
        // Ctrl+Shift+S
        (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 's') ||
        // Ctrl+P / Cmd+P (print)
        ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'p')

      if (isScreenshot) {
        e.preventDefault()
        e.stopPropagation()
        if (isElectron) {
          window.electronAPI?.reportScreenshotAttempt()
        }
      }
    }

    // --- CSS: make content harder to capture ---
    const style = document.createElement('style')
    style.id = '__content-protection__'
    style.textContent = `
      body {
        -webkit-user-select: none !important;
        user-select: none !important;
        -webkit-user-drag: none !important;
      }
      img, canvas, iframe, embed, object {
        -webkit-user-drag: none !important;
        pointer-events: none;
      }
    `
    document.head.appendChild(style)

    // --- Visibility: blur content when window loses focus (screen recorder may hide window) ---
    let blurOverlay: HTMLDivElement | null = null

    const showBlur = () => {
      if (blurOverlay) return
      blurOverlay = document.createElement('div')
      blurOverlay.id = '__protection-overlay__'
      blurOverlay.style.cssText = `
        position: fixed;
        inset: 0;
        z-index: 99999;
        backdrop-filter: blur(20px);
        -webkit-backdrop-filter: blur(20px);
        background: rgba(0,0,0,0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: default;
      `
      blurOverlay.innerHTML = `
        <div style="
          background: white;
          border-radius: 12px;
          padding: 24px 32px;
          text-align: center;
          box-shadow: 0 20px 60px rgba(0,0,0,0.3);
          max-width: 320px;
        ">
          <div style="font-size: 32px; margin-bottom: 8px;">🔒</div>
          <p style="font-weight: 700; font-size: 15px; color: #111; margin: 0 0 6px;">Content Protected</p>
          <p style="font-size: 13px; color: #555; margin: 0;">Click on the window to continue viewing</p>
        </div>
      `
      document.body.appendChild(blurOverlay)
    }

    const hideBlur = () => {
      if (blurOverlay) {
        blurOverlay.remove()
        blurOverlay = null
      }
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        showBlur()
      } else {
        hideBlur()
      }
    }

    const handleWindowBlur = () => {
      // Only blur in Electron — in browser this fires too often (tab switch)
      if (isElectron) showBlur()
    }

    const handleWindowFocus = () => {
      hideBlur()
    }

    // --- Block right-click on sensitive content ---
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault()
    }

    document.addEventListener('keydown', handleKeyDown, { capture: true })
    document.addEventListener('visibilitychange', handleVisibilityChange)
    document.addEventListener('contextmenu', handleContextMenu)
    window.addEventListener('blur', handleWindowBlur)
    window.addEventListener('focus', handleWindowFocus)

    return () => {
      document.removeEventListener('keydown', handleKeyDown, { capture: true })
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      document.removeEventListener('contextmenu', handleContextMenu)
      window.removeEventListener('blur', handleWindowBlur)
      window.removeEventListener('focus', handleWindowFocus)
      document.getElementById('__content-protection__')?.remove()
      document.getElementById('__protection-overlay__')?.remove()
    }
  }, [enabled])
}

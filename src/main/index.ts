import { app, BrowserWindow, ipcMain, dialog, nativeImage } from 'electron'
import { join } from 'path'
import { readFile, writeFile, copyFile } from 'fs/promises'
import { existsSync } from 'fs'

function createWindow(): void {
  const iconPath = resolveIconPath()

  if (process.platform === 'darwin' && iconPath && app.dock) {
    app.dock.setIcon(nativeImage.createFromPath(iconPath))
  }

  const win = new BrowserWindow({
    width: 960,
    height: 720,
    minWidth: 700,
    minHeight: 500,
    icon: iconPath,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    },
    title: 'Xray Routing Editor',
    backgroundColor: '#16181d'
  })

  if (process.env['ELECTRON_RENDERER_URL']) {
    win.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    win.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

function resolveIconPath(): string | undefined {
  const candidate = app.isPackaged
    ? join(process.resourcesPath, 'icon.png')
    : join(__dirname, '../../build/icon.png')

  return existsSync(candidate) ? candidate : undefined
}

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
  app.quit()
})

ipcMain.handle('open-config', async () => {
  const result = await dialog.showOpenDialog({
    title: 'Open Xray Config',
    filters: [
      { name: 'JSON / JSONC', extensions: ['json', 'jsonc'] },
      { name: 'All Files', extensions: ['*'] }
    ],
    properties: ['openFile']
  })
  if (result.canceled || result.filePaths.length === 0) return null
  const filePath = result.filePaths[0]
  const text = await readFile(filePath, 'utf-8')
  return { path: filePath, text }
})

ipcMain.handle(
  'save-config',
  async (_event, { path, text }: { path: string; text: string }) => {
    if (existsSync(path)) {
      await copyFile(path, path + '.bak')
    }
    await writeFile(path, text, 'utf-8')
  }
)

ipcMain.handle('save-config-as', async (_event, { text }: { text: string }) => {
  const result = await dialog.showSaveDialog({
    title: 'Save Xray Config As',
    filters: [
      { name: 'JSON', extensions: ['json'] },
      { name: 'All Files', extensions: ['*'] }
    ]
  })
  if (result.canceled || !result.filePath) return null
  await writeFile(result.filePath, text, 'utf-8')
  return result.filePath
})

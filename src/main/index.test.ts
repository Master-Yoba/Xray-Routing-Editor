const handle = vi.fn()
const showOpenDialog = vi.fn()
const showSaveDialog = vi.fn()
const readFile = vi.fn()
const writeFile = vi.fn()
const copyFile = vi.fn()
const existsSync = vi.fn()
const loadURL = vi.fn()
const loadFile = vi.fn()
const appQuit = vi.fn()

const browserWindowMock = vi.fn().mockImplementation(() => ({
  loadURL,
  loadFile
}))

vi.mock('electron', () => ({
  app: {
    whenReady: () => Promise.resolve(),
    on: vi.fn(),
    quit: appQuit
  },
  BrowserWindow: browserWindowMock,
  ipcMain: {
    handle
  },
  dialog: {
    showOpenDialog,
    showSaveDialog
  }
}))

vi.mock('fs/promises', () => ({
  __esModule: true,
  readFile,
  writeFile,
  copyFile,
  default: {
    readFile,
    writeFile,
    copyFile
  }
}))

vi.mock('fs', () => ({
  __esModule: true,
  existsSync,
  default: {
    existsSync
  }
}))

describe('main process', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
    delete process.env.ELECTRON_RENDERER_URL
  })

  it('registers file handlers and creates a browser window', async () => {
    await import('./index')

    await Promise.resolve()

    expect(browserWindowMock).toHaveBeenCalledTimes(1)
    expect(handle).toHaveBeenCalledWith('open-config', expect.any(Function))
    expect(handle).toHaveBeenCalledWith('save-config', expect.any(Function))
    expect(handle).toHaveBeenCalledWith('save-config-as', expect.any(Function))
    expect(loadFile).toHaveBeenCalled()
  })

  it('opens a config through the dialog handler', async () => {
    showOpenDialog.mockResolvedValue({
      canceled: false,
      filePaths: ['/tmp/example.json']
    })
    readFile.mockResolvedValue('{"routing":{"rules":[]}}')

    await import('./index')

    const openHandler = handle.mock.calls.find((call) => call[0] === 'open-config')?.[1]
    const result = await openHandler()

    expect(showOpenDialog).toHaveBeenCalled()
    expect(readFile).toHaveBeenCalledWith('/tmp/example.json', 'utf-8')
    expect(result).toEqual({
      path: '/tmp/example.json',
      text: '{"routing":{"rules":[]}}'
    })
  })

  it('creates a backup when saving an existing config', async () => {
    existsSync.mockReturnValue(true)

    await import('./index')

    const saveHandler = handle.mock.calls.find((call) => call[0] === 'save-config')?.[1]
    await saveHandler({}, { path: '/tmp/example.json', text: '{"routing":{}}' })

    expect(copyFile).toHaveBeenCalledWith('/tmp/example.json', '/tmp/example.json.bak')
    expect(writeFile).toHaveBeenCalledWith('/tmp/example.json', '{"routing":{}}', 'utf-8')
  })

  it('returns the saved path for save as and writes the file', async () => {
    showSaveDialog.mockResolvedValue({
      canceled: false,
      filePath: '/tmp/copied.json'
    })

    await import('./index')

    const saveAsHandler = handle.mock.calls.find((call) => call[0] === 'save-config-as')?.[1]
    const result = await saveAsHandler({}, { text: '{"routing":{}}' })

    expect(writeFile).toHaveBeenCalledWith('/tmp/copied.json', '{"routing":{}}', 'utf-8')
    expect(result).toBe('/tmp/copied.json')
  })
})

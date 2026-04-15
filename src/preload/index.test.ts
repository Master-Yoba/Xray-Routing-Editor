const exposeInMainWorld = vi.fn()
const invoke = vi.fn()

vi.mock('electron', () => ({
  contextBridge: {
    exposeInMainWorld
  },
  ipcRenderer: {
    invoke
  }
}))

describe('preload bridge', () => {
  beforeEach(() => {
    vi.resetModules()
    exposeInMainWorld.mockReset()
    invoke.mockReset()
  })

  it('exposes the expected API surface and proxies ipc calls', async () => {
    await import('./index')

    expect(exposeInMainWorld).toHaveBeenCalledTimes(1)
    const [name, api] = exposeInMainWorld.mock.calls[0]
    expect(name).toBe('electronAPI')
    expect(Object.keys(api)).toEqual(['openConfig', 'saveConfig', 'saveConfigAs'])

    invoke.mockResolvedValueOnce({ path: '/tmp/example.json', text: '{}' })
    await api.openConfig()
    expect(invoke).toHaveBeenCalledWith('open-config')

    invoke.mockResolvedValueOnce(undefined)
    await api.saveConfig('/tmp/example.json', '{}')
    expect(invoke).toHaveBeenCalledWith('save-config', { path: '/tmp/example.json', text: '{}' })

    invoke.mockResolvedValueOnce('/tmp/copied.json')
    await api.saveConfigAs('{}')
    expect(invoke).toHaveBeenCalledWith('save-config-as', { text: '{}' })
  })
})

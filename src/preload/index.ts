import { contextBridge, ipcRenderer } from 'electron'

export interface ElectronAPI {
  openConfig: () => Promise<{ path: string; text: string } | null>
  saveConfig: (path: string, text: string) => Promise<void>
  saveConfigAs: (text: string) => Promise<string | null>
}

contextBridge.exposeInMainWorld('electronAPI', {
  openConfig: () => ipcRenderer.invoke('open-config'),
  saveConfig: (path: string, text: string) => ipcRenderer.invoke('save-config', { path, text }),
  saveConfigAs: (text: string) => ipcRenderer.invoke('save-config-as', { text })
} satisfies ElectronAPI)

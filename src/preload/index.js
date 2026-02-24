const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  selectDirectory: () =>
    ipcRenderer.invoke('select-directory'),

  cloneProject: (srcDir) =>
    ipcRenderer.invoke('clone-project', srcDir),

  // both srcDir and translatorDir needed by the main handler
  getFileTree: (srcDir, translatorDir) =>
    ipcRenderer.invoke('get-file-tree', srcDir, translatorDir),

  // settings forwarded so main can update concurrency/apiConfig
  translateFile: (filePath, srcDir, translatorDir, settings) =>
    ipcRenderer.invoke('translate-file', filePath, srcDir, translatorDir, settings),

  getFileContent: (filePath) =>
    ipcRenderer.invoke('get-file-content', filePath),

  // destPath, content, srcPath, translatorDir
  saveTranslation: (destPath, content, srcPath, translatorDir) =>
    ipcRenderer.invoke('save-translation', destPath, content, srcPath, translatorDir),

  startBatchTranslate: (srcDir, translatorDir, settings) =>
    ipcRenderer.invoke('start-batch-translate', srcDir, translatorDir, settings),

  onTranslationProgress: (callback) => {
    ipcRenderer.on('translation-progress', (_event, data) => callback(data))
    return () => ipcRenderer.removeAllListeners('translation-progress')
  }
})

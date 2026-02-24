import { ipcMain, dialog } from 'electron'
import { join, relative, dirname, basename } from 'path'
import { existsSync, readFileSync, mkdirSync, writeFileSync } from 'fs'
import { Worker } from 'worker_threads'
import { fileURLToPath } from 'url'
import {
  cloneProject,
  diffScan,
  getFileTree,
  updateFileStatus,
  computeHash
} from './fileManager.js'

const __dirname = dirname(fileURLToPath(import.meta.url))

let concurrency = 3
let apiConfig = {}
let activeWorkers = 0
const queue = []

function runNextFromQueue() {
  while (activeWorkers < concurrency && queue.length > 0) {
    spawnWorker(queue.shift())
  }
}

function spawnWorker({ filePath, srcDir, translatorDir, win }) {
  activeWorkers++
  const relPath = relative(srcDir, filePath)
  const destPath = join(translatorDir, relPath)
  const srcContent = readFileSync(filePath, 'utf8')

  win.webContents.send('translation-progress', { relPath, status: 'translating' })

  // The worker script is an extra entry; electron-vite copies it to out/main/
  const workerPath = join(__dirname, 'translationWorker.js')
  const worker = new Worker(workerPath, {
    workerData: { filePath, srcContent, apiConfig, destPath }
  })

  worker.on('message', (msg) => {
    activeWorkers--
    const status = msg.status === 'done' ? 'translated' : 'error'
    updateFileStatus(translatorDir, relPath, status)
    if (!win.isDestroyed()) {
      win.webContents.send('translation-progress', { relPath, status, error: msg.error })
    }
    runNextFromQueue()
  })

  worker.on('error', (err) => {
    activeWorkers--
    updateFileStatus(translatorDir, relPath, 'error')
    if (!win.isDestroyed()) {
      win.webContents.send('translation-progress', { relPath, status: 'error', error: err.message })
    }
    runNextFromQueue()
  })
}

function enqueue(filePath, srcDir, translatorDir, win, priority = false) {
  const existing = queue.findIndex((t) => t.filePath === filePath)
  if (existing !== -1) {
    if (priority) {
      const [task] = queue.splice(existing, 1)
      queue.unshift(task)
    }
    return
  }
  const task = { filePath, srcDir, translatorDir, win }
  priority ? queue.unshift(task) : queue.push(task)
  runNextFromQueue()
}

export function registerIpcHandlers(win) {
  ipcMain.handle('select-directory', async () => {
    const result = await dialog.showOpenDialog(win, { properties: ['openDirectory'] })
    if (result.canceled) return null
    return result.filePaths[0]
  })

  ipcMain.handle('clone-project', async (_e, srcDir) => {
    try {
      const result = await cloneProject(srcDir)
      diffScan(srcDir, result.translatorDir)
      return { success: true, ...result }
    } catch (err) {
      return { success: false, error: err.message }
    }
  })

  ipcMain.handle('get-file-tree', async (_e, srcDir, translatorDir) => {
    try {
      diffScan(srcDir, translatorDir)
      const tree = getFileTree(srcDir, translatorDir)
      return { success: true, tree }
    } catch (err) {
      return { success: false, error: err.message }
    }
  })

  ipcMain.handle('translate-file', async (_e, filePath, srcDir, translatorDir, settings) => {
    if (settings) { apiConfig = settings; concurrency = settings.concurrency || 3 }
    enqueue(filePath, srcDir, translatorDir, win, true)
    return { success: true }
  })

  ipcMain.handle('get-file-content', async (_e, filePath) => {
    try {
      if (!existsSync(filePath)) return { success: true, content: '' }
      return { success: true, content: readFileSync(filePath, 'utf8') }
    } catch (err) {
      return { success: false, error: err.message }
    }
  })

  ipcMain.handle('save-translation', async (_e, destPath, content, srcPath, translatorDir) => {
    try {
      mkdirSync(dirname(destPath), { recursive: true })
      writeFileSync(destPath, content, 'utf8')
      // Derive relPath relative to translatorDir
      const relPath = relative(translatorDir, destPath)
      const srcHash = existsSync(srcPath) ? computeHash(srcPath) : undefined
      updateFileStatus(translatorDir, relPath, 'translated', srcHash)
      return { success: true }
    } catch (err) {
      return { success: false, error: err.message }
    }
  })

  ipcMain.handle('start-batch-translate', async (_e, srcDir, translatorDir, settings) => {
    if (settings) { apiConfig = settings; concurrency = settings.concurrency || 3 }
    try {
      const tree = getFileTree(srcDir, translatorDir)
      function enqueueTree(nodes) {
        for (const node of nodes) {
          if (node.type === 'file' && node.status !== 'translated') {
            enqueue(join(srcDir, node.relPath), srcDir, translatorDir, win, false)
          } else if (node.type === 'dir' && node.children) {
            enqueueTree(node.children)
          }
        }
      }
      enqueueTree(tree)
      return { success: true }
    } catch (err) {
      return { success: false, error: err.message }
    }
  })
}

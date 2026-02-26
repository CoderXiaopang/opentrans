const { parentPort, workerData } = require('worker_threads')
const fs = require('fs')
const path = require('path')

const DEFAULT_CHUNK_SIZE = 12000 // characters per API call (overridden by apiConfig.chunkSize)

// ─────────────────────────────────────────────
// Step 1: Convert common wiki markup to standard Markdown
// ─────────────────────────────────────────────
function convertWikiToMarkdown(content) {
  // MediaWiki headings: == Heading == → ## Heading (1–6 levels)
  content = content.replace(/^(={1,6})\s*(.+?)\s*\1\s*$/gm, (_, eq, title) => {
    return '#'.repeat(eq.length) + ' ' + title
  })

  // MediaWiki bold/italic (must do ''' before '')
  content = content.replace(/'''(.+?)'''/gs, '**$1**')
  content = content.replace(/''(.+?)''/gs,  '*$1*')

  // MediaWiki internal links: [[Page|Display]] → [Display](Page.md)
  content = content.replace(/\[\[([^\]|]+)\|([^\]]+)\]\]/g, '[$2]($1.md)')
  // [[Page]] → [Page](Page.md)
  content = content.replace(/\[\[([^\]]+)\]\]/g, '[$1]($1.md)')

  // MediaWiki horizontal rule (----) → ---
  content = content.replace(/^-{4,}\s*$/gm, '---')

  // Remove template/transclusion syntax {{...}} (keep content readable)
  content = content.replace(/\{\{[^}]*\}\}/g, '')

  // MediaWiki definition list (;term :definition) — convert to bold + text
  content = content.replace(/^;(.+)$/gm, '**$1**')
  content = content.replace(/^:(.+)$/gm, '  $1')

  return content
}

// ─────────────────────────────────────────────
// Step 2: Split markdown into chunks by heading hierarchy
// ─────────────────────────────────────────────
function splitMarkdownIntoChunks(content, maxSize = DEFAULT_CHUNK_SIZE, level = 1) {
  // Base cases: fits in one chunk, or no more heading levels to try
  if (content.length <= maxSize || level > 6) return [content]

  const lines = content.split('\n')
  const headingRegex = new RegExp(`^#{${level}}\\s`)
  const splitPoints = []

  for (let i = 0; i < lines.length; i++) {
    if (headingRegex.test(lines[i])) splitPoints.push(i)
  }

  // No headings at this level → try the next level
  if (splitPoints.length === 0) {
    return splitMarkdownIntoChunks(content, maxSize, level + 1)
  }

  const rawSections = []

  // Content that appears before the first heading of this level
  if (splitPoints[0] > 0) {
    rawSections.push(lines.slice(0, splitPoints[0]).join('\n'))
  }

  for (let i = 0; i < splitPoints.length; i++) {
    const start = splitPoints[i]
    const end = i + 1 < splitPoints.length ? splitPoints[i + 1] : lines.length
    rawSections.push(lines.slice(start, end).join('\n'))
  }

  // Recursively split any section that is still too large
  const result = []
  for (const section of rawSections) {
    if (!section.trim()) continue
    if (section.length > maxSize) {
      result.push(...splitMarkdownIntoChunks(section, maxSize, level + 1))
    } else {
      result.push(section)
    }
  }
  return result
}

// ─────────────────────────────────────────────
// Step 3: Translate a single chunk via API
// ─────────────────────────────────────────────
async function translateChunk(chunk, apiConfig) {
  const { baseUrl, apiKey, model } = apiConfig
  const url = `${baseUrl.replace(/\/$/, '')}/chat/completions`

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: model || 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are a professional technical translator. Translate the following Markdown document from English to Chinese.
Rules:
- Preserve ALL Markdown syntax (headings, code blocks, links, images, tables, bold, italic, etc.)
- Do NOT translate content inside code blocks (\`\`\` ... \`\`\`) or inline code
- Do NOT translate URLs, file paths, variable names, or code identifiers
- Keep the exact same document structure and formatting
- Output ONLY the translated Markdown, no explanations`
        },
        {
          role: 'user',
          content: chunk
        }
      ],
      temperature: 0.3
    })
  })

  if (!response.ok) {
    const errText = await response.text()
    throw new Error(`API error ${response.status}: ${errText}`)
  }

  const data = await response.json()
  return data.choices[0].message.content
}

// ─────────────────────────────────────────────
// Orchestrator: wiki-convert → chunk → translate → reassemble
// ─────────────────────────────────────────────
async function translateContent(srcContent, apiConfig) {
  // 1. Normalize wiki markup to standard Markdown
  const mdContent = convertWikiToMarkdown(srcContent)

  // 2. Split into chunks that fit within the API context limit
  const chunkSize = apiConfig.chunkSize || DEFAULT_CHUNK_SIZE
  const chunks = splitMarkdownIntoChunks(mdContent, chunkSize)

  // 3. Translate each chunk sequentially (preserve order)
  const translated = []
  for (let i = 0; i < chunks.length; i++) {
    parentPort.postMessage({
      filePath: workerData.filePath,
      status: 'chunk-progress',
      current: i + 1,
      total: chunks.length
    })
    const result = await translateChunk(chunks[i], apiConfig)
    translated.push(result.trimEnd())
  }

  // 4. Reassemble with a single blank line between sections
  return translated.join('\n\n')
}

async function main() {
  const { filePath, srcContent, apiConfig, destPath } = workerData

  try {
    const translated = await translateContent(srcContent, apiConfig)

    fs.mkdirSync(path.dirname(destPath), { recursive: true })
    fs.writeFileSync(destPath, translated, 'utf8')

    parentPort.postMessage({ filePath, status: 'done' })
  } catch (err) {
    parentPort.postMessage({ filePath, status: 'error', error: err.message })
  }
}

main()

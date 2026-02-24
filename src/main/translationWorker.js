const { parentPort, workerData } = require('worker_threads')
const fs = require('fs')
const path = require('path')

async function translateContent(srcContent, apiConfig) {
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
          content: srcContent
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

async function main() {
  const { filePath, srcContent, apiConfig, destPath } = workerData

  try {
    const translated = await translateContent(srcContent, apiConfig)

    // Ensure destination directory exists
    fs.mkdirSync(path.dirname(destPath), { recursive: true })
    fs.writeFileSync(destPath, translated, 'utf8')

    parentPort.postMessage({ filePath, status: 'done' })
  } catch (err) {
    parentPort.postMessage({ filePath, status: 'error', error: err.message })
  }
}

main()

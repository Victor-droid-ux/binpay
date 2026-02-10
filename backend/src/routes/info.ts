import express, { Request, Response } from 'express'
import { promises as fs } from 'fs'
import path from 'path'

const router = express.Router()

const repoRoot = path.resolve(__dirname, '..', '..')

async function readDoc(filename: string) {
  try {
    const p = path.join(repoRoot, filename)
    const content = await fs.readFile(p, 'utf-8')
    return content
  } catch (err) {
    return null
  }
}

router.get('/about', async (req: Request, res: Response) => {
  const readme = await readDoc('README.md')
  if (!readme) return res.status(404).json({ error: 'About content not found' })
  res.json({ markdown: readme })
})

router.get('/help', async (req: Request, res: Response) => {
  // Provide multiple help docs if available
  const files = ['SMS_FEATURE.md', 'DEPLOYMENT.md', 'EMAIL_SETUP.md']
  const results: Record<string, string> = {}
  for (const f of files) {
    const content = await readDoc(f)
    if (content) results[f] = content
  }
  results['contact'] = 'support@binpay.ng'
  res.json({ docs: results })
})

export default router

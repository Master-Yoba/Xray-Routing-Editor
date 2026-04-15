import { _electron as electron, test, expect } from '@playwright/test'
import { existsSync } from 'fs'
import { execFileSync } from 'child_process'
import { join } from 'path'

test('launches the packaged Electron entrypoint', async () => {
  const entry = join(process.cwd(), 'out', 'main', 'index.js')
  const electronBinary = join(process.cwd(), 'node_modules', '.bin', 'electron')
  test.skip(!existsSync(entry), 'Run `npm run build` before executing Playwright Electron tests.')
  test.skip(!canLaunchElectron(electronBinary), 'Electron runtime dependencies are not available on this host.')

  const app = await electron.launch({
    args: ['.'],
    cwd: process.cwd()
  })

  const page = await app.firstWindow()
  await expect(page.getByText('Xray Routing Editor')).toBeVisible()

  await app.close()
})

function canLaunchElectron(binary: string): boolean {
  try {
    execFileSync(binary, ['--version'], {
      stdio: 'ignore'
    })
    return true
  } catch {
    return false
  }
}

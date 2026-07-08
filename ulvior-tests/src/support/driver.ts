// ─── src/support/driver.ts ───────────────────────────────────────────────────
// Selenium WebDriver factory. Chrome is used (auto-managed by chromedriver npm).

import { Builder, WebDriver, Capabilities } from 'selenium-webdriver'
import * as chrome from 'selenium-webdriver/chrome'
import { ENV } from './env'

export async function buildDriver(): Promise<WebDriver> {
  const options = new chrome.Options()

  if (ENV.HEADLESS) {
    options.addArguments('--headless=new')
  }

  options.addArguments(
    '--no-sandbox',
    '--disable-dev-shm-usage',
    '--disable-gpu',
    '--window-size=1440,900',
    '--disable-extensions',
    '--disable-popup-blocking',
    '--disable-infobars',
    '--lang=es-CL',
  )

  // Suppress ChromeDriver logs
  const service = new chrome.ServiceBuilder()

  const driver = await new Builder()
    .forBrowser('chrome')
    .setChromeOptions(options)
    .setChromeService(service)
    .build()

  await driver.manage().setTimeouts({
    implicit: ENV.SELENIUM_TIMEOUT,
    pageLoad: 30000,
    script: 10000,
  })

  return driver
}

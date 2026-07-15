// ─── src/pages/BasePage.ts ───────────────────────────────────────────────────
// Base Selenium Page Object with shared helpers.

import { WebDriver, WebElement, By, until, Key } from 'selenium-webdriver'
import { ENV } from '../support/env'

export class BasePage {
  protected driver: WebDriver
  protected timeout: number

  constructor(driver: WebDriver) {
    this.driver  = driver
    this.timeout = ENV.SELENIUM_TIMEOUT
  }

  async navigate(path = ''): Promise<void> {
    const url = `${ENV.WEB_URL}${path}`
    await this.driver.get(url)
    await this.driver.sleep(800) // let SPA hydrate
  }

  async findElement(locator: By): Promise<WebElement> {
    await this.driver.wait(until.elementLocated(locator), this.timeout)
    return this.driver.findElement(locator)
  }

  async findElements(locator: By): Promise<WebElement[]> {
    await this.driver.wait(until.elementLocated(locator), this.timeout)
    return this.driver.findElements(locator)
  }

  async click(locator: By): Promise<void> {
    const el = await this.findElement(locator)
    await this.driver.wait(until.elementIsVisible(el), this.timeout)
    await el.click()
  }

  async type(locator: By, text: string, clear = true): Promise<void> {
    const el = await this.findElement(locator)
    if (clear) {
      await el.clear()
      await el.sendKeys(Key.CONTROL, 'a')
      await el.sendKeys(Key.DELETE)
    }
    await el.sendKeys(text)
  }

  async getText(locator: By): Promise<string> {
    const el = await this.findElement(locator)
    return el.getText()
  }

  async isVisible(locator: By, timeoutMs = 5000): Promise<boolean> {
    try {
      await this.driver.wait(until.elementLocated(locator), timeoutMs)
      const el = await this.driver.findElement(locator)
      return el.isDisplayed()
    } catch {
      return false
    }
  }

  async waitForUrl(pattern: RegExp, timeoutMs = 10000): Promise<void> {
    await this.driver.wait(async () => {
      const url = await this.driver.getCurrentUrl()
      return pattern.test(url)
    }, timeoutMs, `URL did not match ${pattern} within ${timeoutMs}ms`)
  }

  async getTitle(): Promise<string> {
    return this.driver.getTitle()
  }

  async currentUrl(): Promise<string> {
    return this.driver.getCurrentUrl()
  }

  async scrollTo(locator: By): Promise<void> {
    const el = await this.findElement(locator)
    await this.driver.executeScript('arguments[0].scrollIntoView({behavior:"smooth",block:"center"})', el)
    await this.driver.sleep(300)
  }

  async sleep(ms: number): Promise<void> {
    await this.driver.sleep(ms)
  }
}

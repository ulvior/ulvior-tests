import { By, until } from 'selenium-webdriver'
import { BasePage } from './BasePage'

export class PublicPage extends BasePage {
  async open(path: string): Promise<void> {
    await this.navigate(path)
  }

  async clickVisibleText(text: string): Promise<void> {
    const locator = By.xpath(`//*[self::a or self::button][contains(normalize-space(.), ${xpathLiteral(text)})]`)
    await this.click(locator)
  }

  async hasText(text: string): Promise<boolean> {
    const locator = By.xpath(`//*[contains(normalize-space(.), ${xpathLiteral(text)})]`)
    return this.isVisible(locator)
  }

  async hasButton(text: string): Promise<boolean> {
    const locator = By.xpath(`//button[contains(normalize-space(.), ${xpathLiteral(text)})]`)
    return this.isVisible(locator)
  }

  async waitUntilReady(): Promise<void> {
    await this.driver.wait(until.elementLocated(By.css('body')), this.timeout)
  }
}

function xpathLiteral(value: string): string {
  if (!value.includes("'")) return `'${value}'`
  if (!value.includes('"')) return `"${value}"`
  return `concat('${value.replace(/'/g, "', \"'\", '")}')`
}

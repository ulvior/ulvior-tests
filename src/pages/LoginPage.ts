import { By } from 'selenium-webdriver'
import { BasePage } from './BasePage'

export class LoginPage extends BasePage {
  emailInput = By.css('input[type="email"], input[name="email"]')
  passwordInput = By.css('input[type="password"], input[name="password"]')
  submitButton = By.xpath("//button[contains(normalize-space(.), 'Iniciar sesión')]")

  async open(): Promise<void> {
    await this.navigate('/login')
  }

  async fillEmail(email: string): Promise<void> {
    await this.type(this.emailInput, email)
  }

  async fillPassword(password: string): Promise<void> {
    await this.type(this.passwordInput, password)
  }

  async submit(): Promise<void> {
    await this.click(this.submitButton)
  }
}

// ─── src/support/world.ts ────────────────────────────────────────────────────
// Cucumber World — shared context object available in every step definition.

import { setWorldConstructor, World, IWorldOptions } from '@cucumber/cucumber'
import { WebDriver } from 'selenium-webdriver'
import { ApiClient, ApiEvidence } from '../utils/api-client'
import { ENV } from './env'
import { StepEvidence, ScenarioEvidence } from '../reporters/evidence-store'

export interface CurrentStepInfo {
  text:    string
  keyword: string
}

export class UlviorWorld extends World {
  // Selenium driver (only for UI scenarios)
  driver?: WebDriver

  // HTTP clients
  apiClient: ApiClient
  aiClient:  ApiClient

  // Auth
  token?: string

  // Last API evidence (set by api-client wrappers in steps)
  lastApiEvidence?: ApiEvidence

  // Last HTTP response (raw axios response)
  lastResponse?: any

  // Evidence collected for the current scenario
  currentScenarioEvidence: ScenarioEvidence = {
    scenarioName: '',
    featureName:  '',
    featureFile:  '',
    tags:         [],
    status:       'passed',
    steps:        [],
    startedAt:    new Date().toISOString(),
    finishedAt:   '',
  }

  // Step currently being executed (set by BeforeStep hook)
  currentStep: CurrentStepInfo = { text: '', keyword: '' }
  currentStepStartedAt = 0

  constructor(options: IWorldOptions) {
    super(options)
    this.apiClient = new ApiClient(ENV.API_URL)
    this.aiClient  = new ApiClient(ENV.AI_URL)
  }

  /** Capture a screenshot from the active Selenium driver */
  async captureScreenshot(): Promise<string | undefined> {
    if (!this.driver) return undefined
    try {
      return await this.driver.takeScreenshot() // returns base64 PNG
    } catch {
      return undefined
    }
  }

  /** Record a step's evidence into currentScenarioEvidence */
  recordStep(evidence: StepEvidence) {
    this.currentScenarioEvidence.steps.push(evidence)
  }
}

setWorldConstructor(UlviorWorld)

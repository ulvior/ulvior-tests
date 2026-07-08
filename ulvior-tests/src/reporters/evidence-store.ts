// ─── src/reporters/evidence-store.ts ─────────────────────────────────────────
// Singleton that accumulates evidence (screenshots + API captures) per feature.
// After all scenarios finish, the PDF generator reads from this store.

export interface StepEvidence {
  stepText:    string
  keyword:     string          // Given / When / Then / And / But
  status:      'passed' | 'failed' | 'skipped' | 'pending'
  screenshot?: string          // base64 PNG (UI steps)
  apiEvidence?: {
    method:   string
    url:      string
    headers:  Record<string, string>
    body?:    unknown
    status:   number
    response: unknown
    durationMs: number
  }
  error?: string
  timestamp: string
  durationMs?: number
}

export interface ScenarioEvidence {
  scenarioName: string
  featureName:  string
  featureFile:  string         // e.g. "AuthLogin.feature"
  tags:         string[]
  status:       'passed' | 'failed'
  steps:        StepEvidence[]
  startedAt:    string
  finishedAt:   string
}

class EvidenceStore {
  private scenarios: ScenarioEvidence[] = []

  addScenario(scenario: ScenarioEvidence) {
    this.scenarios.push(scenario)
  }

  /** Returns all scenarios grouped by featureFile */
  byFeature(): Map<string, ScenarioEvidence[]> {
    const map = new Map<string, ScenarioEvidence[]>()
    for (const s of this.scenarios) {
      const key = s.featureFile
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(s)
    }
    return map
  }

  getAll(): ScenarioEvidence[] {
    return this.scenarios
  }

  clear() {
    this.scenarios = []
  }

  load(scenarios: ScenarioEvidence[]) {
    this.scenarios = scenarios
  }
}

export const evidenceStore = new EvidenceStore()

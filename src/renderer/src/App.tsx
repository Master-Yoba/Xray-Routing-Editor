import { useState, useCallback } from 'react'
import type { XrayConfig, RuleObject, ExtractedTags } from './types'
import { parseConfig, extractTags, replaceRules, serializeConfig } from './configIO'
import { Toolbar } from './components/Toolbar'
import { RuleList } from './components/RuleList'
import './App.css'

declare global {
  interface Window {
    electronAPI: {
      openConfig: () => Promise<{ path: string; text: string } | null>
      saveConfig: (path: string, text: string) => Promise<void>
      saveConfigAs: (text: string) => Promise<string | null>
    }
  }
}

function newRule(): RuleObject {
  return { type: 'field', _id: crypto.randomUUID() }
}

function withId(rule: RuleObject): RuleObject {
  return rule._id ? rule : { ...rule, _id: crypto.randomUUID() }
}

export function App() {
  const [configPath, setConfigPath] = useState<string | null>(null)
  const [config, setConfig] = useState<XrayConfig | null>(null)
  const [rules, setRules] = useState<RuleObject[]>([])
  const [tags, setTags] = useState<ExtractedTags>({
    inboundTags: [],
    outboundTags: [],
    balancerTags: [],
    users: []
  })
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [dirty, setDirty] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleOpen = useCallback(async () => {
    try {
      const result = await window.electronAPI.openConfig()
      if (!result) return
      const parsed = parseConfig(result.text)
      const extracted = extractTags(parsed)
      const loadedRules = (parsed.routing?.rules ?? []).map(withId)
      setConfig(parsed)
      setTags(extracted)
      setRules(loadedRules)
      setConfigPath(result.path)
      setDirty(false)
      setExpandedId(null)
      setError(null)
    } catch (e) {
      setError(`Failed to open config: ${String(e)}`)
    }
  }, [])

  const buildJson = useCallback((): string | null => {
    if (!config) return null
    const updated = replaceRules(config, rules)
    return serializeConfig(updated)
  }, [config, rules])

  const handleSave = useCallback(async () => {
    if (!configPath || !config) return
    try {
      const text = buildJson()!
      await window.electronAPI.saveConfig(configPath, text)
      setDirty(false)
      setError(null)
    } catch (e) {
      setError(`Failed to save: ${String(e)}`)
    }
  }, [configPath, config, buildJson])

  const handleSaveAs = useCallback(async () => {
    if (!config) return
    try {
      const text = buildJson()!
      const newPath = await window.electronAPI.saveConfigAs(text)
      if (newPath) {
        setConfigPath(newPath)
        setDirty(false)
        setError(null)
      }
    } catch (e) {
      setError(`Failed to save: ${String(e)}`)
    }
  }, [config, buildJson])

  const handleAddRule = useCallback(() => {
    const rule = newRule()
    setRules((prev) => [...prev, rule])
    setExpandedId(rule._id!)
    setDirty(true)
  }, [])

  const handleRulesChange = useCallback((updated: RuleObject[]) => {
    setRules(updated)
    setDirty(true)
  }, [])

  return (
    <div className="app">
      <Toolbar
        filePath={configPath}
        dirty={dirty}
        hasConfig={config !== null}
        onOpen={handleOpen}
        onSave={handleSave}
        onSaveAs={handleSaveAs}
        onAddRule={handleAddRule}
      />

      {error && (
        <div className="error-banner" onClick={() => setError(null)}>
          <span>⚠ {error}</span>
          <span className="error-close">✕</span>
        </div>
      )}

      {!config ? (
        <div className="welcome">
          <div className="welcome-card">
            <h2>Xray Routing Editor</h2>
            <p>Open an xray-core JSON config file to start editing routing rules.</p>
            <button className="btn btn-accent welcome-btn" onClick={handleOpen}>
              Open Config…
            </button>
          </div>
        </div>
      ) : (
        <div className="content">
          <div className="rules-header">
            <span className="rules-count">
              {rules.length} {rules.length === 1 ? 'rule' : 'rules'}
            </span>
            <span className="rules-hint">Click a rule to expand · Drag ⠿ to reorder</span>
          </div>
          <div className="rules-scroll">
            <RuleList
              rules={rules}
              tags={tags}
              expandedId={expandedId}
              onExpand={setExpandedId}
              onChange={handleRulesChange}
            />
          </div>
        </div>
      )}
    </div>
  )
}

import type { XrayConfig, ExtractedTags, RuleObject } from './types'

/**
 * Strip // line comments, # line comments, and /* block comments from a
 * JSONC string so it can be parsed with JSON.parse.
 */
export function stripJsonComments(jsonc: string): string {
  let out = ''
  let i = 0
  let inString = false

  while (i < jsonc.length) {
    const ch = jsonc[i]
    const next = jsonc[i + 1]

    if (inString) {
      if (ch === '\\' && i + 1 < jsonc.length) {
        out += ch + next
        i += 2
      } else if (ch === '"') {
        inString = false
        out += ch
        i++
      } else {
        out += ch
        i++
      }
    } else {
      if (ch === '"') {
        inString = true
        out += ch
        i++
      } else if (ch === '/' && next === '/') {
        // Skip to end of line
        while (i < jsonc.length && jsonc[i] !== '\n') i++
      } else if (ch === '#') {
        // Skip to end of line
        while (i < jsonc.length && jsonc[i] !== '\n') i++
      } else if (ch === '/' && next === '*') {
        // Skip block comment
        i += 2
        while (i < jsonc.length && !(jsonc[i] === '*' && jsonc[i + 1] === '/')) i++
        i += 2 // consume */
      } else {
        out += ch
        i++
      }
    }
  }

  return out
}

export function parseConfig(text: string): XrayConfig {
  const stripped = stripJsonComments(text)
  return JSON.parse(stripped) as XrayConfig
}

export function extractTags(config: XrayConfig): ExtractedTags {
  const inboundTags: string[] = []
  const outboundTags: string[] = []
  const balancerTags: string[] = []
  const userSet = new Set<string>()

  for (const inbound of config.inbounds ?? []) {
    if (inbound.tag) inboundTags.push(inbound.tag)

    // vless/vmess/trojan style: settings.clients[].email
    for (const client of inbound.settings?.clients ?? []) {
      if (client.email) userSet.add(client.email)
    }
    // socks style: top-level accounts[].user
    for (const acc of inbound.accounts ?? []) {
      if (acc.user) userSet.add(acc.user)
    }
    // socks style: settings.accounts[].user
    for (const acc of inbound.settings?.accounts ?? []) {
      if (acc.user) userSet.add(acc.user)
    }
  }

  for (const outbound of config.outbounds ?? []) {
    if (outbound.tag) outboundTags.push(outbound.tag)
  }

  for (const balancer of config.routing?.balancers ?? []) {
    if (balancer.tag) balancerTags.push(balancer.tag)
  }

  return {
    inboundTags,
    outboundTags,
    balancerTags,
    users: [...userSet]
  }
}

/** Remove empty/undefined fields and the internal _id before saving */
export function stripEmpty(rule: RuleObject): RuleObject {
  const result: Record<string, unknown> = { type: 'field' }

  for (const [key, value] of Object.entries(rule)) {
    if (key === 'type' || key === '_id') continue
    if (value === undefined || value === null || value === '') continue
    if (Array.isArray(value) && value.length === 0) continue
    result[key] = value
  }

  return result as unknown as RuleObject
}

/** Produce a new config object with routing.rules replaced by the edited list */
export function replaceRules(config: XrayConfig, rules: RuleObject[]): XrayConfig {
  return {
    ...config,
    routing: {
      ...config.routing,
      rules: rules.map(stripEmpty)
    }
  }
}

/** Serialize config back to formatted JSON */
export function serializeConfig(config: XrayConfig): string {
  return JSON.stringify(config, null, 2)
}

/** Build a one-line summary for a rule card header */
export function ruleSummary(rule: RuleObject): string {
  const target = rule.outboundTag
    ? `→ ${rule.outboundTag}`
    : rule.balancerTag
      ? `⚖ ${rule.balancerTag}`
      : '(no target)'

  const parts: string[] = []
  if (rule.name) parts.push(`"${rule.name}"`)
  if (rule.domain?.length) parts.push(`domain[${rule.domain.length}]`)
  if (rule.ip?.length) parts.push(`ip[${rule.ip.length}]`)
  if (rule.protocol?.length) parts.push(`proto:${rule.protocol.join(',')}`)
  if (rule.network) parts.push(`net:${rule.network}`)
  if (rule.port) parts.push(`port:${rule.port}`)
  if (rule.inboundTag?.length) parts.push(`inbound:${rule.inboundTag.join(',')}`)
  if (rule.user?.length) parts.push(`user[${rule.user.length}]`)
  if (rule.source?.length) parts.push(`src[${rule.source.length}]`)

  return parts.length > 0 ? `${target}  |  ${parts.join(', ')}` : target
}

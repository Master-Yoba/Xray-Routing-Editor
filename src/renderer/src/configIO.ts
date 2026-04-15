import type { XrayConfig, ExtractedTags, RuleObject } from './types'

// ─── JSONC parsing ────────────────────────────────────────────────────────────

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
        while (i < jsonc.length && jsonc[i] !== '\n') i++
      } else if (ch === '#') {
        while (i < jsonc.length && jsonc[i] !== '\n') i++
      } else if (ch === '/' && next === '*') {
        i += 2
        while (i < jsonc.length && !(jsonc[i] === '*' && jsonc[i + 1] === '/')) i++
        i += 2
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

// ─── JSONC surgical routing replacement ───────────────────────────────────────

/** Find the character span of the value for a top-level key in a JSONC string */
function findTopLevelValueSpan(
  text: string,
  targetKey: string
): { start: number; end: number } | null {
  let i = 0
  let depth = 0

  while (i < text.length) {
    // Skip line comments and block comments when not inside a string
    if (text[i] === '/' && text[i + 1] === '/') {
      while (i < text.length && text[i] !== '\n') i++
      continue
    }
    if (text[i] === '#') {
      while (i < text.length && text[i] !== '\n') i++
      continue
    }
    if (text[i] === '/' && text[i + 1] === '*') {
      i += 2
      while (i < text.length && !(text[i] === '*' && text[i + 1] === '/')) i++
      i += 2
      continue
    }

    const ch = text[i]

    if (ch === '"') {
      if (depth === 1) {
        // Could be a key at the root object level — check for our target
        const pattern = `"${targetKey}"`
        if (text.startsWith(pattern, i)) {
          let j = i + pattern.length
          while (j < text.length && /[ \t\r\n]/.test(text[j])) j++
          if (text[j] === ':') {
            // Found it — skip to value
            j++
            while (j < text.length && /[ \t\r\n]/.test(text[j])) j++
            const valueStart = j
            const valueEnd = findValueEnd(text, j)
            return { start: valueStart, end: valueEnd }
          }
        }
      }
      // Not our target or not at root level — skip this string
      i++
      while (i < text.length) {
        if (text[i] === '\\') { i += 2; continue }
        if (text[i] === '"') { i++; break }
        i++
      }
      continue
    }

    if (ch === '{' || ch === '[') { depth++; i++; continue }
    if (ch === '}' || ch === ']') { depth--; i++; continue }
    i++
  }

  return null
}

/** Find the index one past the end of a JSON/JSONC value starting at `start` */
function findValueEnd(text: string, start: number): number {
  let i = start
  const opener = text[i]

  if (opener !== '{' && opener !== '[') {
    // Primitive — advance past the token
    while (i < text.length && !/[,}\]"\n]/.test(text[i])) i++
    return i
  }

  let depth = 0

  while (i < text.length) {
    // Skip comments
    if (text[i] === '/' && text[i + 1] === '/') {
      while (i < text.length && text[i] !== '\n') i++
      continue
    }
    if (text[i] === '#') {
      while (i < text.length && text[i] !== '\n') i++
      continue
    }
    if (text[i] === '/' && text[i + 1] === '*') {
      i += 2
      while (i < text.length && !(text[i] === '*' && text[i + 1] === '/')) i++
      i += 2
      continue
    }

    const ch = text[i]
    if (ch === '"') {
      i++
      while (i < text.length) {
        if (text[i] === '\\') { i += 2; continue }
        if (text[i] === '"') { i++; break }
        i++
      }
      continue
    }
    if (ch === '{' || ch === '[') { depth++; i++; continue }
    if (ch === '}' || ch === ']') {
      depth--
      i++
      if (depth === 0) return i
      continue
    }
    i++
  }
  return i
}

/**
 * Replace the "routing" value in the original JSONC text with a new object,
 * preserving all comments and formatting outside of the routing section.
 */
export function replaceRoutingInJsonc(originalText: string, newRouting: unknown): string {
  const span = findTopLevelValueSpan(originalText, 'routing')
  if (!span) return originalText

  // Indent to match a 2-space root-level JSON file
  const raw = JSON.stringify(newRouting, null, 2)
  const indented = raw
    .split('\n')
    .map((line, idx) => (idx === 0 ? line : '  ' + line))
    .join('\n')

  return originalText.slice(0, span.start) + indented + originalText.slice(span.end)
}

// ─── Config extraction ────────────────────────────────────────────────────────

export function extractTags(config: XrayConfig): ExtractedTags {
  const inboundTags: string[] = []
  const outboundTags: string[] = []
  const balancerTags: string[] = []
  const outboundProtocols: Record<string, string> = {}
  const userSet = new Set<string>()

  for (const inbound of config.inbounds ?? []) {
    if (inbound.tag) inboundTags.push(inbound.tag)
    for (const client of inbound.settings?.clients ?? []) {
      if (client.email) userSet.add(client.email)
    }
    for (const acc of inbound.accounts ?? []) {
      if (acc.user) userSet.add(acc.user)
    }
    for (const acc of inbound.settings?.accounts ?? []) {
      if (acc.user) userSet.add(acc.user)
    }
  }

  for (const outbound of config.outbounds ?? []) {
    if (outbound.tag) {
      outboundTags.push(outbound.tag)
      if (outbound.protocol) outboundProtocols[outbound.tag] = outbound.protocol as string
    }
  }

  for (const balancer of config.routing?.balancers ?? []) {
    if (balancer.tag) balancerTags.push(balancer.tag)
  }

  return { inboundTags, outboundTags, balancerTags, users: [...userSet], outboundProtocols }
}

// ─── Rule serialization ───────────────────────────────────────────────────────

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

export function replaceRules(config: XrayConfig, rules: RuleObject[]): object {
  return {
    ...config.routing,
    rules: rules.map(stripEmpty)
  }
}

/** Build a one-line summary for a rule card header */
export function ruleSummary(rule: RuleObject): string {
  const target = rule.outboundTag
    ? `→ ${rule.outboundTag}`
    : rule.balancerTag
      ? `⚖ ${rule.balancerTag}`
      : '(no target)'

  const parts: string[] = []
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

// ─── Validation ───────────────────────────────────────────────────────────────

/**
 * Validate an xray port string: comma-separated list of ports (0-65535)
 * or port ranges (N-M where N <= M).
 * Returns an error message, or null if valid.
 */
export function validatePortString(value: string): string | null {
  if (!value.trim()) return null
  const parts = value.split(',').map((p) => p.trim()).filter(Boolean)
  for (const part of parts) {
    const rangeMatch = part.match(/^(\d+)-(\d+)$/)
    if (rangeMatch) {
      const from = parseInt(rangeMatch[1], 10)
      const to = parseInt(rangeMatch[2], 10)
      if (from > 65535 || to > 65535) return `Port out of range: "${part}"`
      if (from > to) return `Invalid range (start > end): "${part}"`
    } else if (/^\d+$/.test(part)) {
      const n = parseInt(part, 10)
      if (n > 65535) return `Port out of range: "${part}"`
    } else {
      return `Invalid port: "${part}"`
    }
  }
  return null
}

/**
 * Validate a list of IP/CIDR entries.
 * Allows geoip: prefixes (xray geo references) and valid IPv4/IPv6 CIDRs.
 * Returns an error message, or null if valid.
 */
export function validateCidrList(entries: string[]): string | null {
  for (const entry of entries) {
    if (entry.startsWith('geoip:')) continue
    if (isValidCidr(entry)) continue
    return `Invalid CIDR: "${entry}"`
  }
  return null
}

function isValidCidr(entry: string): boolean {
  const [addr, prefix] = entry.split('/')

  // IPv4
  const ipv4Parts = addr.split('.')
  if (ipv4Parts.length === 4 && ipv4Parts.every((p) => /^\d+$/.test(p) && parseInt(p, 10) <= 255)) {
    if (prefix === undefined) return true
    const pl = parseInt(prefix, 10)
    return /^\d+$/.test(prefix) && pl >= 0 && pl <= 32
  }

  // IPv6 — allow any colon-containing string with optional /prefix
  if (addr.includes(':')) {
    if (prefix === undefined) return true
    const pl = parseInt(prefix, 10)
    return /^\d+$/.test(prefix) && pl >= 0 && pl <= 128
  }

  return false
}

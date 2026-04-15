import {
  extractTags,
  parseConfig,
  replaceRoutingInJsonc,
  replaceRules,
  ruleSummary,
  stripEmpty,
  stripJsonComments,
  validateCidrList,
  validatePortString
} from './configIO'
import type { RuleObject, XrayConfig } from './types'

describe('configIO', () => {
  it('strips JSONC comments without touching string content', () => {
    const input = `{
  // top-level comment
  "note": "keep // text",
  # hash comment
  "routing": {
    /* block comment */
    "domainStrategy": "IPIfNonMatch"
  }
}`

    const stripped = stripJsonComments(input)

    expect(stripped).not.toContain('// top-level comment')
    expect(stripped).not.toContain('# hash comment')
    expect(stripped).not.toContain('block comment')
    expect(stripped).toContain('"keep // text"')
  })

  it('parses representative Xray config text', () => {
    const parsed = parseConfig(`{
      "inbounds": [{ "tag": "socks-in" }],
      "outbounds": [{ "tag": "direct", "protocol": "freedom" }],
      "routing": { "rules": [{ "type": "field", "outboundTag": "direct" }] }
    }`)

    expect(parsed.inbounds?.[0].tag).toBe('socks-in')
    expect(parsed.routing?.rules?.[0].outboundTag).toBe('direct')
  })

  it('replaces only the top-level routing section and preserves other comments', () => {
    const original = `{
  // preserve before routing
  "log": { "loglevel": "warning" },
  "routing": {
    "domainStrategy": "AsIs",
    "rules": [{ "type": "field", "outboundTag": "block" }]
  },
  // preserve after routing
  "dns": { "servers": ["1.1.1.1"] }
}`

    const updated = replaceRoutingInJsonc(original, {
      domainStrategy: 'IPIfNonMatch',
      rules: [{ type: 'field', outboundTag: 'direct' }]
    })

    expect(updated).toContain('// preserve before routing')
    expect(updated).toContain('// preserve after routing')
    expect(updated).toContain('"log": { "loglevel": "warning" }')
    expect(updated).toContain('"dns": { "servers": ["1.1.1.1"] }')
    expect(updated).toContain('"outboundTag": "direct"')
    expect(updated).not.toContain('"outboundTag": "block"')
  })

  it('extracts tags, balancers, protocols, and users from config', () => {
    const config: XrayConfig = {
      inbounds: [
        {
          tag: 'socks-in',
          settings: {
            clients: [{ email: 'alpha@example.com' }],
            accounts: [{ user: 'beta' }]
          }
        },
        {
          tag: 'http-in',
          accounts: [{ user: 'gamma' }]
        }
      ],
      outbounds: [
        { tag: 'direct', protocol: 'freedom' },
        { tag: 'block', protocol: 'blackhole' }
      ],
      routing: {
        balancers: [{ tag: 'auto-balance' }]
      }
    }

    expect(extractTags(config)).toEqual({
      inboundTags: ['socks-in', 'http-in'],
      outboundTags: ['direct', 'block'],
      balancerTags: ['auto-balance'],
      users: expect.arrayContaining(['alpha@example.com', 'beta', 'gamma']),
      outboundProtocols: {
        direct: 'freedom',
        block: 'blackhole'
      }
    })
  })

  it('strips internal and empty fields before save', () => {
    const rule: RuleObject = {
      type: 'field',
      _id: 'r1',
      outboundTag: 'direct',
      domain: [],
      port: '',
      ruleTag: undefined
    }

    expect(stripEmpty(rule)).toEqual({
      type: 'field',
      outboundTag: 'direct'
    })
  })

  it('replaces rules while preserving other routing properties', () => {
    const config: XrayConfig = {
      routing: {
        domainStrategy: 'AsIs',
        rules: []
      }
    }

    expect(
      replaceRules(config, [{ type: 'field', _id: 'tmp', outboundTag: 'direct' }])
    ).toEqual({
      domainStrategy: 'AsIs',
      rules: [{ type: 'field', outboundTag: 'direct' }]
    })
  })

  it('summarizes rule content for compact display', () => {
    expect(
      ruleSummary({
        type: 'field',
        outboundTag: 'direct',
        domain: ['geosite:private'],
        protocol: ['http', 'tls'],
        port: '443'
      })
    ).toContain('→ direct')
  })

  it('validates port strings and CIDR lists', () => {
    expect(validatePortString('80, 443, 1000-2000')).toBeNull()
    expect(validatePortString('70000')).toContain('Port out of range')
    expect(validatePortString('2000-1000')).toContain('Invalid range')
    expect(validatePortString('abc')).toContain('Invalid port')

    expect(validateCidrList(['192.168.0.0/16', 'geoip:private', '2001:db8::/32'])).toBeNull()
    expect(validateCidrList(['not-a-cidr'])).toBe('Invalid CIDR: "not-a-cidr"')
  })
})

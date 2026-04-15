/** A routing rule entry in xray-core config */
export interface RuleObject {
  type: 'field'
  name?: string
  domainMatcher?: 'hybrid' | 'linear'
  domain?: string[]
  ip?: string[]
  port?: string
  sourcePort?: string
  /** "tcp" | "udp" | "tcp,udp" */
  network?: string
  source?: string[]
  user?: string[]
  inboundTag?: string[]
  /** ["http", "tls", "bittorrent"] */
  protocol?: string[]
  outboundTag?: string
  balancerTag?: string
  ruleTag?: string
  /** Client-side only id for React/dnd-kit keys — stripped before save */
  _id?: string
}

export interface ClientObject {
  id?: string
  email?: string
  [key: string]: unknown
}

export interface AccountObject {
  user?: string
  pass?: string
  [key: string]: unknown
}

export interface InboundSettings {
  clients?: ClientObject[]
  accounts?: AccountObject[]
  [key: string]: unknown
}

export interface InboundObject {
  tag?: string
  protocol?: string
  accounts?: AccountObject[]
  settings?: InboundSettings
  [key: string]: unknown
}

export interface OutboundObject {
  tag?: string
  [key: string]: unknown
}

export interface BalancerObject {
  tag?: string
  [key: string]: unknown
}

export interface RoutingObject {
  domainStrategy?: string
  rules?: RuleObject[]
  balancers?: BalancerObject[]
  [key: string]: unknown
}

export interface XrayConfig {
  inbounds?: InboundObject[]
  outbounds?: OutboundObject[]
  routing?: RoutingObject
  [key: string]: unknown
}

export interface ExtractedTags {
  inboundTags: string[]
  outboundTags: string[]
  balancerTags: string[]
  users: string[]
  /** protocol name keyed by outbound tag, e.g. { "block": "blackhole", "direct": "freedom" } */
  outboundProtocols: Record<string, string>
}

import type { RuleObject, ExtractedTags } from '../types'
import { TagSelect } from '../fields/TagSelect'
import { TagMultiSelect } from '../fields/TagMultiSelect'
import { StringListInput } from '../fields/StringListInput'
import './RuleEditor.css'

const PROTOCOLS = ['http', 'tls', 'bittorrent'] as const
const NETWORKS = ['tcp', 'udp'] as const

interface Props {
  rule: RuleObject
  tags: ExtractedTags
  onChange: (updated: RuleObject) => void
}

export function RuleEditor({ rule, tags, onChange }: Props) {
  const set = <K extends keyof RuleObject>(key: K, value: RuleObject[K]) => {
    onChange({ ...rule, [key]: value })
  }

  const selectedNetworks = (rule.network ?? '').split(',').filter(Boolean)
  const toggleNetwork = (net: string) => {
    const cur = new Set(selectedNetworks)
    if (cur.has(net)) cur.delete(net)
    else cur.add(net)
    const joined = Array.from(cur).join(',')
    set('network', joined || undefined)
  }

  const selectedProtocols = rule.protocol ?? []
  const toggleProtocol = (proto: string) => {
    const cur = new Set(selectedProtocols)
    if (cur.has(proto)) cur.delete(proto)
    else cur.add(proto)
    set('protocol', cur.size ? Array.from(cur) : undefined)
  }

  const setOutbound = (val: string) => {
    onChange({ ...rule, outboundTag: val || undefined, balancerTag: val ? undefined : rule.balancerTag })
  }

  const setBalancer = (val: string) => {
    onChange({ ...rule, balancerTag: val || undefined, outboundTag: val ? undefined : rule.outboundTag })
  }

  return (
    <div className="rule-editor">
      {/* Row 1: name + domainMatcher */}
      <div className="editor-row editor-row-2">
        <div className="field-group">
          <label className="field-label">Name</label>
          <input
            className="text-input"
            value={rule.name ?? ''}
            placeholder="optional label"
            onChange={(e) => set('name', e.target.value || undefined)}
          />
        </div>
        <div className="field-group">
          <label className="field-label">Domain Matcher</label>
          <select
            className="select-input"
            value={rule.domainMatcher ?? ''}
            onChange={(e) =>
              set('domainMatcher', (e.target.value as 'hybrid' | 'linear') || undefined)
            }
          >
            <option value="">— default —</option>
            <option value="hybrid">hybrid</option>
            <option value="linear">linear</option>
          </select>
        </div>
      </div>

      {/* Row 2: target — outboundTag XOR balancerTag */}
      <div className="editor-section-title">Target <span className="muted">(pick one)</span></div>
      <div className="editor-row editor-row-2">
        <TagSelect
          label="Outbound Tag"
          value={rule.outboundTag ?? ''}
          options={tags.outboundTags}
          placeholder="— none —"
          onChange={setOutbound}
        />
        <TagSelect
          label="Balancer Tag"
          value={rule.balancerTag ?? ''}
          options={tags.balancerTags}
          placeholder="— none —"
          onChange={setBalancer}
        />
      </div>

      {/* Row 3: inboundTag + user */}
      <div className="editor-section-title">Match conditions</div>
      <div className="editor-row editor-row-2">
        <TagMultiSelect
          label="Inbound Tag"
          value={rule.inboundTag ?? []}
          options={tags.inboundTags}
          onChange={(v) => set('inboundTag', v.length ? v : undefined)}
        />
        <TagMultiSelect
          label="User"
          value={rule.user ?? []}
          options={tags.users}
          onChange={(v) => set('user', v.length ? v : undefined)}
        />
      </div>

      {/* Row 4: domain + ip */}
      <div className="editor-row editor-row-2">
        <StringListInput
          label="Domain"
          value={rule.domain ?? []}
          placeholder={'domain:example.com\ngeosite:category-ru'}
          onChange={(v) => set('domain', v.length ? v : undefined)}
        />
        <StringListInput
          label="IP"
          value={rule.ip ?? []}
          placeholder={'192.168.0.0/16\ngeoip:private'}
          onChange={(v) => set('ip', v.length ? v : undefined)}
        />
      </div>

      {/* Row 5: network checkboxes + protocol checkboxes */}
      <div className="editor-row editor-row-2">
        <div className="field-group">
          <label className="field-label">Network</label>
          <div className="checkbox-group">
            {NETWORKS.map((net) => (
              <label key={net} className="checkbox-label">
                <input
                  type="checkbox"
                  checked={selectedNetworks.includes(net)}
                  onChange={() => toggleNetwork(net)}
                />
                {net}
              </label>
            ))}
          </div>
        </div>
        <div className="field-group">
          <label className="field-label">Protocol</label>
          <div className="checkbox-group">
            {PROTOCOLS.map((proto) => (
              <label key={proto} className="checkbox-label">
                <input
                  type="checkbox"
                  checked={selectedProtocols.includes(proto)}
                  onChange={() => toggleProtocol(proto)}
                />
                {proto}
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Row 6: port + sourcePort */}
      <div className="editor-row editor-row-2">
        <div className="field-group">
          <label className="field-label">Port</label>
          <input
            className="text-input mono"
            value={rule.port ?? ''}
            placeholder="80, 443, 1000-2000"
            onChange={(e) => set('port', e.target.value || undefined)}
          />
        </div>
        <div className="field-group">
          <label className="field-label">Source Port</label>
          <input
            className="text-input mono"
            value={rule.sourcePort ?? ''}
            placeholder="80, 443, 1000-2000"
            onChange={(e) => set('sourcePort', e.target.value || undefined)}
          />
        </div>
      </div>

      {/* Row 7: source + ruleTag */}
      <div className="editor-row editor-row-2">
        <StringListInput
          label="Source IP"
          value={rule.source ?? []}
          placeholder={'10.0.0.0/8\ngeoip:cn'}
          onChange={(v) => set('source', v.length ? v : undefined)}
        />
        <div className="field-group">
          <label className="field-label">Rule Tag</label>
          <input
            className="text-input"
            value={rule.ruleTag ?? ''}
            placeholder="optional"
            onChange={(e) => set('ruleTag', e.target.value || undefined)}
          />
        </div>
      </div>
    </div>
  )
}

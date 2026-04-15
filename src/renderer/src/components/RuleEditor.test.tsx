import { fireEvent, render, screen } from '@testing-library/react'
import { RuleEditor } from './RuleEditor'
import type { ExtractedTags, RuleObject } from '../types'

const tags: ExtractedTags = {
  inboundTags: ['socks-in'],
  outboundTags: ['direct', 'block'],
  balancerTags: ['auto-balance'],
  users: ['alpha@example.com'],
  outboundProtocols: { direct: 'freedom', block: 'blackhole' }
}

function renderEditor(rule: RuleObject, onChange = vi.fn()) {
  render(<RuleEditor rule={rule} tags={tags} onChange={onChange} />)
  return { onChange }
}

describe('RuleEditor', () => {
  it('shows validation errors for invalid ports and CIDRs', () => {
    renderEditor({
      type: 'field',
      sourcePort: '99999',
      port: 'bad-port',
      ip: ['bad-cidr'],
      source: ['300.1.1.1/24']
    })

    expect(screen.getByText('Port out of range: "99999"')).toBeInTheDocument()
    expect(screen.getByText('Invalid port: "bad-port"')).toBeInTheDocument()
    expect(screen.getByText('Invalid CIDR: "bad-cidr"')).toBeInTheDocument()
    expect(screen.getByText('Invalid CIDR: "300.1.1.1/24"')).toBeInTheDocument()
  })

  it('updates network and protocol checkboxes through onChange', () => {
    const { onChange } = renderEditor({ type: 'field' })

    fireEvent.click(screen.getByLabelText('tcp'))
    fireEvent.click(screen.getByLabelText('http'))

    expect(onChange).toHaveBeenNthCalledWith(1, expect.objectContaining({ network: 'tcp' }))
    expect(onChange).toHaveBeenNthCalledWith(2, expect.objectContaining({ protocol: ['http'] }))
  })

  it('keeps outbound and balancer targets mutually exclusive', () => {
    const { onChange } = renderEditor({
      type: 'field',
      outboundTag: 'direct'
    })

    const balancerTrigger = screen.getAllByRole('button').find((button) =>
      button.textContent?.includes('— none —')
    )
    expect(balancerTrigger).toBeDefined()
    fireEvent.click(balancerTrigger)
    fireEvent.click(screen.getByText('auto-balance'))

    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({
        balancerTag: 'auto-balance',
        outboundTag: undefined
      })
    )
  })
})

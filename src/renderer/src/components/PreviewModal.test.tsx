import { fireEvent, render, screen } from '@testing-library/react'
import { PreviewModal } from './PreviewModal'

describe('PreviewModal', () => {
  it('shows no-change state when content is identical', () => {
    render(<PreviewModal oldContent={'same'} newContent={'same'} onClose={vi.fn()} />)

    expect(screen.getByText('No changes')).toBeInTheDocument()
    expect(screen.getByText('The routing section has no unsaved changes.')).toBeInTheDocument()
  })

  it('renders diff stats for changed content', () => {
    render(<PreviewModal oldContent={'old'} newContent={'new'} onClose={vi.fn()} />)

    expect(screen.getByText('+1')).toBeInTheDocument()
    expect(screen.getByText('−1')).toBeInTheDocument()
  })

  it('closes on escape and backdrop clicks', () => {
    const onClose = vi.fn()
    render(<PreviewModal oldContent={'old'} newContent={'new'} onClose={onClose} />)

    fireEvent.keyDown(document, { key: 'Escape' })
    fireEvent.mouseDown(screen.getByText('Preview Changes — routing section').closest('.modal-backdrop')!)

    expect(onClose).toHaveBeenCalledTimes(2)
  })
})

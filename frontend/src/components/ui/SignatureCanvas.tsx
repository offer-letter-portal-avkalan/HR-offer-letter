import { useRef, useState, type RefObject } from 'react'
import ReactSignatureCanvas from 'react-signature-canvas'
import { Button } from './Button'

interface SignatureCanvasProps {
  onChange: (dataUrl: string | null) => void
}

export function SignaturePad({ onChange }: SignatureCanvasProps) {
  const [mode, setMode] = useState<'draw' | 'type'>('draw')
  const [typedSig, setTypedSig] = useState('')
  const sigRef = useRef<ReactSignatureCanvas>(null) as RefObject<ReactSignatureCanvas>

  const handleClear = () => {
    sigRef.current?.clear()
    onChange(null)
  }

  const handleDrawEnd = () => {
    if (sigRef.current?.isEmpty()) return
    onChange(sigRef.current?.toDataURL('image/png') ?? null)
  }

  const handleTypedChange = (val: string) => {
    setTypedSig(val)
    onChange(val.trim().length >= 3 ? `TYPED:${val.trim()}` : null)
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Button
          size="sm"
          variant={mode === 'draw' ? 'primary' : 'secondary'}
          onClick={() => setMode('draw')}
          type="button"
        >
          Draw
        </Button>
        <Button
          size="sm"
          variant={mode === 'type' ? 'primary' : 'secondary'}
          onClick={() => setMode('type')}
          type="button"
        >
          Type
        </Button>
      </div>

      {mode === 'draw' ? (
        <div className="border-2 border-dashed border-gray-300 rounded-lg overflow-hidden">
          <ReactSignatureCanvas
            ref={sigRef}
            penColor="black"
            canvasProps={{ width: 500, height: 150, className: 'w-full' }}
            onEnd={handleDrawEnd}
          />
          <div className="bg-gray-50 px-3 py-1.5 flex justify-between items-center border-t border-gray-200">
            <span className="text-xs text-gray-400">Sign above</span>
            <Button size="sm" variant="ghost" onClick={handleClear} type="button">
              Clear
            </Button>
          </div>
        </div>
      ) : (
        <div>
          <input
            type="text"
            value={typedSig}
            onChange={(e) => handleTypedChange(e.target.value)}
            placeholder="Type your full name"
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-2xl font-['Brush_Script_MT',cursive] focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-xs text-gray-400 mt-1">Minimum 3 characters required</p>
        </div>
      )}
    </div>
  )
}

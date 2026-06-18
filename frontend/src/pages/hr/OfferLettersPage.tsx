import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { Upload } from 'lucide-react'
import { offerLetterService } from '@/services/offer_letter.service'
import { userService } from '@/services/user.service'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Spinner } from '@/components/ui/Spinner'
import type { User } from '@/types'

export function OfferLettersPage() {
  const qc = useQueryClient()
  const [showUpload, setShowUpload] = useState(false)
  const [selectedCandidate, setSelectedCandidate] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)

  const { data: letters, isLoading } = useQuery({
    queryKey: ['offer-letters'],
    queryFn: () => offerLetterService.getAll(),
  })

  const { data: candidates } = useQuery({
    queryKey: ['candidates'],
    queryFn: () => userService.getCandidates(),
  })

  const getCandidateName = (candidateId: string) => {
    const c = candidates?.find((c: User) => c.id === candidateId)
    return c ? c.full_name : candidateId.slice(0, 8) + '…'
  }

  const getCandidateEmail = (candidateId: string) => {
    const c = candidates?.find((c: User) => c.id === candidateId)
    return c?.email ?? null
  }

  const handleUpload = async () => {
    if (!selectedCandidate || !file) {
      toast.error('Select a candidate and PDF file')
      return
    }
    setUploading(true)
    try {
      await offerLetterService.upload(selectedCandidate, file)
      qc.invalidateQueries({ queryKey: ['offer-letters'] })
      setShowUpload(false)
      setFile(null)
      setSelectedCandidate('')
      toast.success('Offer letter uploaded and watermarked')
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      toast.error(detail || 'Upload failed — check console for details')
      console.error('Upload error:', err)
    } finally {
      setUploading(false)
    }
  }

  const activeCandidates = candidates?.filter((c: User) => c.is_active) ?? []

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Offer Letters</h1>
          <p className="text-gray-500 text-sm mt-1">Upload and manage candidate offer letters</p>
        </div>
        <Button onClick={() => setShowUpload(true)}>
          <Upload size={16} /> Upload Offer Letter
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><Spinner /></div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Filename</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Sent To (Candidate)</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Uploaded</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {letters?.offer_letters.length === 0 && (
                <tr><td colSpan={4} className="text-center py-12 text-gray-400">No offer letters yet</td></tr>
              )}
              {letters?.offer_letters.map((l) => (
                <tr key={l.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{l.original_filename}</td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{getCandidateName(l.candidate_id)}</p>
                    {getCandidateEmail(l.candidate_id) && (
                      <p className="text-xs text-gray-400">{getCandidateEmail(l.candidate_id)}</p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${l.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                      {l.is_active ? 'Active' : 'Superseded'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{new Date(l.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={showUpload} onClose={() => { setShowUpload(false); setFile(null); setSelectedCandidate('') }} title="Upload Offer Letter">
        <div className="space-y-5">

          {/* Step indicator */}
          <div className="flex gap-3">
            <div className={`flex-1 rounded-lg p-3 border-2 transition-colors ${selectedCandidate ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-gray-50'}`}>
              <p className="text-xs font-semibold text-gray-400 mb-0.5">Step 1</p>
              <p className="text-sm font-medium text-gray-700">
                {selectedCandidate
                  ? candidates?.find((c: User) => c.id === selectedCandidate)?.full_name ?? 'Selected'
                  : 'Select Candidate'}
              </p>
            </div>
            <div className={`flex-1 rounded-lg p-3 border-2 transition-colors ${file ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-gray-50'}`}>
              <p className="text-xs font-semibold text-gray-400 mb-0.5">Step 2</p>
              <p className="text-sm font-medium text-gray-700">
                {file ? file.name.slice(0, 20) + (file.name.length > 20 ? '…' : '') : 'Choose PDF'}
              </p>
            </div>
          </div>

          {/* Candidate select */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-gray-700">
              Send offer letter to <span className="text-red-500">*</span>
            </label>
            <select
              className="border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
              value={selectedCandidate}
              onChange={(e) => setSelectedCandidate(e.target.value)}
            >
              <option value="">— Choose a candidate —</option>
              {activeCandidates.map((c: User) => (
                <option key={c.id} value={c.id}>{c.full_name} · {c.email}</option>
              ))}
            </select>
            {activeCandidates.length === 0 && (
              <p className="text-xs text-amber-600">No active candidates yet. Add candidates first.</p>
            )}
          </div>

          {/* File input */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-gray-700">
              Offer Letter PDF <span className="text-red-500">*</span>
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-blue-400 transition-colors">
              <input
                type="file"
                accept="application/pdf"
                id="pdf-upload"
                className="hidden"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
              <label htmlFor="pdf-upload" className="cursor-pointer">
                {file ? (
                  <div>
                    <p className="text-sm font-medium text-blue-600">{file.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{(file.size / 1024 / 1024).toFixed(2)} MB · Click to change</p>
                  </div>
                ) : (
                  <div>
                    <Upload className="mx-auto mb-2 text-gray-400" size={24} />
                    <p className="text-sm text-gray-600">Click to select PDF</p>
                    <p className="text-xs text-gray-400 mt-0.5">Max 50MB · PDF only</p>
                  </div>
                )}
              </label>
            </div>
            <p className="text-xs text-gray-400">The PDF will be automatically watermarked with the candidate's name before storage.</p>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="secondary" onClick={() => { setShowUpload(false); setFile(null); setSelectedCandidate('') }}>
              Cancel
            </Button>
            <Button onClick={handleUpload} loading={uploading} disabled={!selectedCandidate || !file}>
              Upload & Watermark
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

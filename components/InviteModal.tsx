import React, { useState, useEffect } from 'react'

type Props = {
  open: boolean
  onClose: () => void
  onInvite: (email: string, role: string) => void
}

const InviteModal = ({ open, onClose, onInvite }: Props) => {
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('editor')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open) {
      setEmail('')
      setRole('editor')
      setError('')
      setLoading(false)
    }
  }, [open])

  const handleInvite = async () => {
    // Validate email
    if (!email.trim()) {
      setError('Email is required')
      return
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email')
      return
    }

    if (!role) {
      setError('Role is required')
      return
    }

    setError('')
    setLoading(true)

    try {
      await onInvite(email.trim().toLowerCase(), role)
      // Success - modal will close via onClose in parent
    } catch (err) {
      setError('Failed to send invite. Please try again.')
      setLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleInvite()
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-3xl bg-zinc-950 text-white p-6 shadow-[0_25px_80px_rgba(0,0,0,0.5)] border border-white/5 space-y-4">
        <h3 className="text-xl font-semibold">Invite to calendar</h3>
        
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-sm text-red-400">
            {error}
          </div>
        )}

        <div className="space-y-2">
          <label className="text-sm text-zinc-400">Email</label>
          <input
            type="email"
            className="w-full bg-white/5 text-white px-3 py-2 rounded-xl border border-white/10 focus:outline-none focus:border-white/20 transition"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value)
              setError('')
            }}
            onKeyPress={handleKeyPress}
            placeholder="user@example.com"
            disabled={loading}
            autoFocus
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm text-zinc-400">Role</label>
          <select
            className="w-full bg-white/5 text-white px-3 py-2 rounded-xl border border-white/10 focus:outline-none focus:border-white/20 transition"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            disabled={loading}
          >
            <option value="editor" className="bg-zinc-900">Editor (can create & edit)</option>
            <option value="viewer" className="bg-zinc-900">Viewer (read only)</option>
          </select>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 rounded-xl bg-white/5 text-white hover:bg-white/10 transition disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleInvite}
            disabled={loading}
            className="px-4 py-2 rounded-xl bg-white text-black font-semibold hover:shadow-lg hover:shadow-white/20 transition disabled:opacity-50 min-w-[80px]"
          >
            {loading ? 'Sending...' : 'Invite'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default InviteModal
import React, { useEffect, useMemo, useState } from 'react'

type AddEventProps = {
  isOpen: boolean
  onClose: () => void
  onAdd: (payload: { title: string; status: 'Tek' | 'Birlikte'; date: string; time?: string }) => Promise<void> | void
  defaultDate?: string
}

const AddEvent = ({ isOpen, onClose, onAdd, defaultDate }: AddEventProps) => {
  const initialDate = useMemo(() => {
    if (defaultDate) return defaultDate
    return new Date().toISOString().slice(0, 10)
  }, [defaultDate])

  const [title, setTitle] = useState('')
  const [status, setStatus] = useState<'Tek' | 'Birlikte'>('Tek')
  const [date, setDate] = useState(initialDate)
  const [time, setTime] = useState('')

  useEffect(() => {
    if (isOpen) {
      setDate(initialDate)
    }
  }, [initialDate, isOpen])

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    if (!date) return

    const parsedDate = new Date(date)
    if (Number.isNaN(parsedDate.getTime())) return

    const normalizedIso = parsedDate.toISOString().slice(0, 10)
    await onAdd({
      title: title.trim(),
      status,
      date: normalizedIso,
      time: time || undefined,
    })
    setTitle('')
    setTime('')
    setDate(initialDate)
    setStatus('Tek')
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-xl rounded-3xl bg-zinc-950 text-white p-6 shadow-[0_25px_80px_rgba(0,0,0,0.5)] border border-white/5 space-y-5"
      >
        <div className="flex items-start justify-between">
          <div className="space-y-2 flex-1">
            <label className="text-sm text-zinc-400">Title</label>
            <input
              className="w-full bg-white/5 text-white text-lg px-3 py-2 rounded-xl border border-white/10 focus:outline-none focus:border-white/40"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Add a title"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="space-y-2">
            <label className="text-zinc-400">Status</label>
            <select
              className="w-full bg-white/5 text-white px-3 py-2 rounded-xl border border-white/10 focus:outline-none"
              value={status}
              onChange={(e) => setStatus(e.target.value as 'Tek' | 'Birlikte')}
            >
              <option value="Tek" className="text-black">Tek</option>
              <option value="Birlikte" className="text-black">Birlikte</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-zinc-400">Date</label>
            <input
              type="date"
              className="w-full bg-white/5 text-white px-3 py-2 rounded-xl border border-white/10 focus:outline-none"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="space-y-2">
            <label className="text-zinc-400">Time (optional)</label>
            <input
              type="time"
              className="w-full bg-white/5 text-white px-3 py-2 rounded-xl border border-white/10 focus:outline-none"
              value={time}
              onChange={(e) => setTime(e.target.value)}
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white/5 text-white hover:bg-white/10 transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 rounded-xl bg-white text-black font-semibold hover:shadow-lg hover:shadow-white/20 transition"
          >
            Add Event
          </button>
        </div>
      </form>
    </div>
  )
}

export default AddEvent

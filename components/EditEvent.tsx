// components/EditEvent.tsx (create or update)
'use client'

import React, { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import type { EventData } from '@/types/events'

type Props = {
  event: EventData | null
  onClose: () => void
  onSave: (event: EventData) => void
}

const EditEvent = ({ event, onClose, onSave }: Props) => {
  const [title, setTitle] = useState('')
  const [status, setStatus] = useState<'Tek' | 'Birlikte'>('Tek')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')

  useEffect(() => {
    if (event) {
      setTitle(event.title)
      setStatus(event.status)
      setDate(event.date)
      setTime(event.time || '')
    }
  }, [event])

  if (!event) return null

  const handleSave = async () => {
    if (!title.trim()) return

    const updated: EventData = {
      ...event,
      title: title.trim(),
      status,
      date,
      time: time || undefined,
      type: status === 'Birlikte' ? 'collaborative' : 'single'
    }

    await onSave(updated)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">
      <div className="w-full max-w-xl rounded-3xl bg-zinc-950 text-white p-6 shadow-[0_25px_80px_rgba(0,0,0,0.5)] border border-white/5 space-y-5">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold">Edit Event</h3>
          <button onClick={onClose} className="text-zinc-400 hover:text-white">
            <X size={24} />
          </button>
        </div>

        <div className="space-y-2">
          <label className="text-sm text-zinc-400">Title</label>
          <input
            className="w-full bg-white/5 text-white text-lg px-3 py-2 rounded-xl border border-white/10 focus:outline-none focus:border-white/40"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Event title"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm text-zinc-400">Status</label>
            <select
              className="w-full bg-white/5 text-white px-3 py-2 rounded-xl border border-white/10 focus:outline-none"
              value={status}
              onChange={(e) => setStatus(e.target.value as 'Tek' | 'Birlikte')}
            >
              <option value="Tek" className="bg-zinc-900">Tek</option>
              <option value="Birlikte" className="bg-zinc-900">Birlikte</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm text-zinc-400">Date</label>
            <input
              type="date"
              className="w-full bg-white/5 text-white px-3 py-2 rounded-xl border border-white/10 focus:outline-none"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm text-zinc-400">Time (optional)</label>
          <input
            type="time"
            className="w-full bg-white/5 text-white px-3 py-2 rounded-xl border border-white/10 focus:outline-none"
            value={time}
            onChange={(e) => setTime(e.target.value)}
          />
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white/5 text-white hover:bg-white/10 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 rounded-xl bg-white text-black font-semibold hover:shadow-lg hover:shadow-white/20 transition"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  )
}

export default EditEvent
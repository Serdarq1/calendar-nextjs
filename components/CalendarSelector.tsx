'use client'

import React, { useState } from 'react'
import { Calendar, Plus, Users, Edit2, Check, X } from 'lucide-react'

type Calendar = {
  id: string
  name: string
  role: string
}

type Props = {
  calendars: Calendar[]
  activeId: string | null
  onSelect: (id: string) => void
  onCreate: () => void
  onInvite: () => void
  onRename?: (id: string, newName: string) => void
}

const CalendarSelector = ({ calendars, activeId, onSelect, onCreate, onInvite, onRename }: Props) => {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')

  const startEdit = (cal: Calendar) => {
    setEditingId(cal.id)
    setEditName(cal.name)
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditName('')
  }

  const saveEdit = () => {
    if (editingId && editName.trim() && onRename) {
      onRename(editingId, editName.trim())
    }
    setEditingId(null)
    setEditName('')
  }

  return (
    <div className="flex items-center gap-3 overflow-x-auto pb-2">
      {calendars.map((cal) => {
        const isActive = cal.id === activeId
        const isEditing = editingId === cal.id

        return (
          <div
            key={cal.id}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all ${
              isActive
                ? 'bg-white text-black border-white'
                : 'bg-zinc-900 text-white border-zinc-800 hover:border-zinc-700'
            }`}
          >
            {isEditing ? (
              <>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && saveEdit()}
                  className="bg-transparent border-b border-current outline-none w-32"
                  autoFocus
                />
                <button onClick={saveEdit} className="hover:opacity-70">
                  <Check size={16} />
                </button>
                <button onClick={cancelEdit} className="hover:opacity-70">
                  <X size={16} />
                </button>
              </>
            ) : (
              <>
                <button onClick={() => onSelect(cal.id)} className="flex items-center gap-2">
                  <Calendar size={16} />
                  <span className="font-medium">{cal.name}</span>
                </button>
                {(cal.role === 'owner' || cal.role === 'editor') && onRename && (
                  <button
                    onClick={() => startEdit(cal)}
                    className="hover:opacity-70 ml-1"
                  >
                    <Edit2 size={14} />
                  </button>
                )}
              </>
            )}
          </div>
        )
      })}

      <button
        onClick={onCreate}
        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-900 text-white border border-zinc-800 hover:border-zinc-700 transition-all"
      >
        <Plus size={16} />
        <span className="font-medium">New</span>
      </button>

      {activeId && (
        <button
          onClick={onInvite}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-900 text-white border border-zinc-800 hover:border-zinc-700 transition-all"
        >
          <Users size={16} />
          <span className="font-medium">Invite</span>
        </button>
      )}
    </div>
  )
}

export default CalendarSelector
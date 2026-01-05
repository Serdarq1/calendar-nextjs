'use client'

import React, { useState } from 'react'
import { Calendar } from 'lucide-react'
import EditEvent from './EditEvent'
import type { EventData, EventMember } from '@/types/events'
import { useUser } from '@clerk/nextjs'

const formatDateLabel = (isoDate: string) => {
  const d = new Date(isoDate)
  if (Number.isNaN(d.getTime())) return isoDate
  return d.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' })
}

type EventModalProps = {
  selectedDate: string
  events: EventData[]
  onSaveEvent: (event: EventData) => void
}

const getCardColor = (type: string, index: number) => {
  if (type === 'collaborative') return 'bg-blue-400'
  if (type === 'single' && index % 2 === 0) return 'bg-purple-300'
  return 'bg-zinc-800'
}

const getTextColor = (type: string, index: number) => {
  if (type === 'collaborative') return 'text-black'
  if (type === 'single' && index % 2 === 0) return 'text-black'
  return 'text-white'
}

const getStatusBg = (type: string, index: number) => {
  if (type === 'collaborative') return 'bg-white/90 text-black'
  if (type === 'single' && index % 2 === 0) return 'bg-white text-black'
  return 'bg-zinc-700 text-white'
}

const getIconColor = (type: string, index: number) => {
  if (type === 'collaborative') return 'text-black/60'
  if (type === 'single' && index % 2 === 0) return 'text-black/60'
  return 'text-zinc-400'
}

const renderAvatar = (member: EventMember, index: number) => {
  const firstLetter = member.name?.[0]?.toUpperCase() || '?'
  if (member.avatar) {
    return (
      <img
        key={`${member.id || member.name}-${index}`}
        src={member.avatar}
        alt={member.name}
        className="w-9 h-9 rounded-full border border-white/30 bg-white object-cover"
      />
    )
  }
  return (
    <div
      key={`${member.id || member.name}-${index}`}
      className="w-9 h-9 rounded-full bg-gradient-to-br from-red-400 to-orange-500 text-white flex items-center justify-center text-sm font-semibold border border-white/30"
      aria-label={member.name}
    >
      {firstLetter}
    </div>
  )
}

export default function EventModal({ selectedDate, events, onSaveEvent }: EventModalProps) {
  const [selectedEvent, setSelectedEvent] = useState<EventData | null>(null)
  const { user } = useUser()

  const filteredEvents = events.filter((event) => event.date === selectedDate)

  const displayMembers = (event: EventData) => {
    // If event has members data from the backend, use it
    if (event.members && event.members.length > 0) {
      return event.members
    }

    // Otherwise, show the owner
    if (event.owner_id) {
      // If current user is the owner, show their avatar
      if (user && event.owner_id === user.id) {
        return [{
          id: user.id,
          name: user.fullName || user.username || 'You',
          avatar: user.imageUrl || undefined
        }]
      }
      
      // For other users' events, you'd need to fetch their profile
      // For now, show a placeholder
      return [{
        id: event.owner_id,
        name: 'Owner',
        avatar: undefined
      }]
    }

    // Fallback
    return [{
      name: 'Unknown',
      avatar: undefined
    }]
  }

  const handleSave = (updated: EventData) => {
    onSaveEvent(updated)
    setSelectedEvent(updated)
  }

  return (
    <div className="min-h-screen bg-zinc-950 px-6 py-12">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-3xl font-light text-white mb-8">Events</h2>

        {filteredEvents.length === 0 ? (
          <p className="text-zinc-400">No events scheduled for this day.</p>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {filteredEvents.map((event, index) => (
              <button
                key={event.id}
                type="button"
                onClick={() => setSelectedEvent(event)}
                className={`${getCardColor(event.type, index)} rounded-3xl p-6 transition-transform hover:scale-[1.02] text-left w-full`}
              >
                <div className="flex items-center justify-between mb-4">
                  <span className={`${getStatusBg(event.type, index)} px-4 py-1.5 rounded-full text-sm font-medium`}>
                    {event.status}
                  </span>
                </div>

                <h3 className={`${getTextColor(event.type, index)} text-xl font-normal mb-4 leading-relaxed`}>
                  {event.title}
                </h3>

                <div className={`flex items-center gap-2 mb-6 ${getIconColor(event.type, index)}`}>
                  <Calendar size={16} />
                  <span className="text-sm">
                    {formatDateLabel(event.date)}
                    {event.time && ` - ${event.time}`}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center -space-x-2">
                    {displayMembers(event).map((member, i) => renderAvatar(member, i))}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <EditEvent event={selectedEvent} onClose={() => setSelectedEvent(null)} onSave={handleSave} />
    </div>
  )
}
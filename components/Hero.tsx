'use client'

import React from 'react'
import { SignedIn, UserButton, useUser } from '@clerk/nextjs'

type HeroProps = {
  selectedDate: string
  onSelectDate: (date: string) => void
  days: { label: string; iso: string }[]
}

const Hero = ({ selectedDate, onSelectDate, days }: HeroProps) => {
  const { user } = useUser()
  const displayName = user?.firstName || user?.username || 'there'

  return (
    <section className="bg-zinc-900 text-white px-5 py-10 rounded-3xl shadow-[0_25px_80px_rgba(0,0,0,0.45)]">
      <div className="relative mb-10 flex items-center justify-between gap-4">
        <h1 className="text-4xl leading-[1.05] font-semibold tracking-tight pr-6">
          Hey, {displayName}
          <br />
          add new events.
        </h1>
        <SignedIn>
          <div className="flex-shrink-0">
            <UserButton appearance={{ elements: { avatarBox: 'w-12 h-12' } }} />
          </div>
        </SignedIn>
      </div>

      <div className="flex items-center gap-3 overflow-x-scroll no-scrollbar pr-2 pl-1 touch-pan-x">
        {days.map((day) => {
          const active = selectedDate === day.iso
          const dayNum = (() => {
            const d = new Date(day.iso)
            const n = d.getDate()
            return Number.isNaN(n) ? day.iso : n
          })()
          return (
            <button
              type="button"
              onClick={() => onSelectDate(day.iso)}
              key={day.label + day.iso}
              className={`flex flex-col items-center min-w-[64px] px-3 py-3 rounded-2xl transition-colors ${
                active
                  ? 'bg-white text-neutral-900 shadow-lg shadow-black/30'
                  : 'text-neutral-300'
              }`}
            >
              <span className={`text-xs ${active ? 'text-neutral-500' : 'text-neutral-400'}`}>
                {day.label}
              </span>
              <span className="text-lg font-semibold">{dayNum}</span>
            </button>
          )
        })}
      </div>
    </section>
  )
}

export default Hero
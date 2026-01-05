import React from 'react'

type BottomNavProps = {
  onAddClick: () => void
}

const BottomNav = ({ onAddClick }: BottomNavProps) => {
  return (  
    <div className="fixed inset-x-0 bottom-6 flex justify-center pointer-events-none">
      <button
        type="button"
        onClick={onAddClick}
        className="w-16 h-16 rounded-2xl bg-white shadow-[0_16px_40px_rgba(0,0,0,0.4)] flex items-center justify-center pointer-events-auto active:scale-95 transition"
      >
        <svg data-testid="geist-icon" height="22" strokeLinejoin="round" viewBox="0 0 16 16" width="22" style={{ color: "black" }}>
          <path fillRule="evenodd" clipRule="evenodd" d="M 8.75,1 H7.25 V7.25 H1.5 V8.75 H7.25 V15 H8.75 V8.75 H14.5 V7.25 H8.75 V1.75 Z" fill="currentColor"></path>
        </svg>
      </button>
    </div>
  )
}

export default BottomNav

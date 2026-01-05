"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import BottomNav from "@/components/BottomNav";
import Hero from "@/components/Hero";
import EventModal from "@/components/EventModal";
import AddEvent from "@/components/AddEvent";
import { EventData } from "@/types/events";
import { useUser } from "@clerk/nextjs";
import CalendarSelector from "@/components/CalendarSelector";
import InviteModal from "@/components/InviteModal";

type Calendar = { id: string; name: string; role: string };

export default function Home() {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [events, setEvents] = useState<EventData[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const { isSignedIn } = useUser();
  const [calendars, setCalendars] = useState<Calendar[]>([]);
  const [activeCalendarId, setActiveCalendarId] = useState<string | null>(null);
  const [showInvite, setShowInvite] = useState(false);
  const hasCreatedDefaultCalendar = useRef(false);
  const hasSyncedProfile = useRef(false);

const handleSaveEvent = async (updated: EventData) => {
  try {
    const res = await fetch(`/api/events/${updated.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(updated),
    });
    
    if (!res.ok) {
      console.error('Failed to save event')
      return
    }
    
    const data = await res.json();
    const saved: EventData = data.event || updated;
    
    console.log('✅ Event saved:', saved)
    
    setEvents((prev) => prev.map((evt) => (evt.id === saved.id ? saved : evt)));
  } catch (err) {
    console.error("Failed to save event", err);
  }
};

  const handleAddEvent = async (payload: { title: string; status: "Tek" | "Birlikte"; date: string; time?: string }) => {
    if (!activeCalendarId) return;
    try {
      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          ...payload,
          type: payload.status === "Birlikte" ? "collaborative" : "single",
          calendar_id: activeCalendarId,
        }),
      });
      if (!res.ok) return;
      const data = await res.json();
      if (data.event) {
        setEvents((prev) => [...prev, data.event]);
        setSelectedDate(data.event.date);
      }
    } catch (err) {
      console.error("Failed to add event", err);
    }
  };

  const loadCalendars = async () => {
    try {
      const res = await fetch("/api/calendars", { credentials: "include" });
      if (!res.ok) return;
      const data = await res.json();
      if (Array.isArray(data.calendars)) {
        console.log('📅 Loaded calendars:', data.calendars.length)
        setCalendars(data.calendars);
        if (!activeCalendarId && data.calendars.length > 0) {
          setActiveCalendarId(data.calendars[0].id);
        }
        return data.calendars as Calendar[];
      }
    } catch (err) {
      console.error("Failed to fetch calendars", err);
    }
    return [];
  };

  const createDefaultCalendarIfMissing = async () => {
    if (hasCreatedDefaultCalendar.current) {
      console.log('⏭️ Skipping: default calendar already created')
      return;
    }
    
    hasCreatedDefaultCalendar.current = true;
    console.log('🔍 Checking for calendars...')
    
    try {
      const res = await fetch("/api/calendars", { credentials: "include" });
      if (!res.ok) return;
      const data = await res.json();
      
      if (Array.isArray(data.calendars) && data.calendars.length > 0) {
        console.log('✅ User already has calendars:', data.calendars.length)
        return;
      }

      console.log('📝 Creating default calendar...')
      const createRes = await fetch("/api/calendars", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name: "My Calendar" }),
      });
      
      if (!createRes.ok) return;
      const createData = await createRes.json();
      
      if (createData.calendar) {
        console.log('✅ Default calendar created:', createData.calendar.id)
        setCalendars([createData.calendar]);
        setActiveCalendarId(createData.calendar.id);
      }
    } catch (err) {
      console.error("Failed to create default calendar", err);
    }
  };

  // Sync profile once on mount
  useEffect(() => {
    const syncProfile = async () => {
      if (!isSignedIn || hasSyncedProfile.current) return;
      hasSyncedProfile.current = true;
      
      try {
        await fetch("/api/profile", { method: "POST", credentials: "include" });
        console.log('✅ Profile synced')
      } catch (err) {
        console.error("Failed to sync profile", err);
      }
    };
    syncProfile();
  }, [isSignedIn]);

  // Load calendars once, then create default if needed
  useEffect(() => {
    const init = async () => {
      if (!isSignedIn) return;
      
      const cals = await loadCalendars();
      
      // Only create default if no calendars exist
      if (cals.length === 0) {
        await createDefaultCalendarIfMissing();
        await loadCalendars(); // Reload after creating
      }
    };
    init();
  }, [isSignedIn]);

  const handleCreateCalendar = async () => {
    const name = window.prompt("Calendar name", "New Calendar");
    if (!name) return;
    try {
      const res = await fetch("/api/calendars", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name }),
      });
      if (!res.ok) return;
      const data = await res.json();
      if (data.calendar) {
        setCalendars((prev) => [...prev, data.calendar]);
        setActiveCalendarId(data.calendar.id);
      }
    } catch (err) {
      console.error("Failed to create calendar", err);
    }
  };

  const handleInvite = async (email: string, role: string) => {
    if (!activeCalendarId) return;
    try {
      await fetch(`/api/calendars/${activeCalendarId}/invite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, role }),
      });
      console.log('✅ Invite sent to:', email)
    } catch (err) {
      console.error("Invite error", err);
    } finally {
      setShowInvite(false);
    }
  };

  // Add this function in your page.tsx
const handleRenameCalendar = async (id: string, newName: string) => {
  try {
    const res = await fetch(`/api/calendars/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ name: newName })
    })
    
    if (!res.ok) return
    
    setCalendars(prev => 
      prev.map(cal => cal.id === id ? { ...cal, name: newName } : cal)
    )
  } catch (err) {
    console.error('Failed to rename calendar', err)
  }
}
  
  const derivedDays = useMemo(() => {
    const seen = new Map<string, string>();
    const start = new Date();
    for (let i = 0; i < 7; i += 1) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      const iso = d.toISOString().slice(0, 10);
      seen.set(iso, d.toLocaleDateString("en-US", { weekday: "short" }));
    }

    events.forEach((ev) => {
      if (!ev.date) return;
      if (!seen.has(ev.date)) {
        const d = new Date(`${ev.date}T12:00:00`);
        const label = Number.isNaN(d.getTime())
          ? ev.date
          : d.toLocaleDateString("en-US", { weekday: "short" });
        seen.set(ev.date, label);
      }
    });

    return Array.from(seen.entries())
      .sort((a, b) => (a[0] > b[0] ? 1 : -1))
      .map(([iso, label]) => ({ iso, label }));
  }, [events]);

  useEffect(() => {
    if (!isSignedIn || !activeCalendarId) return;
    const loadEvents = async () => {
      try {
        const res = await fetch(`/api/events?calendarId=${activeCalendarId}`, { credentials: "include" });
        if (!res.ok) return;
        const data = await res.json();
        if (Array.isArray(data.events)) {
          setEvents(data.events);
        }
      } catch (err) {
        console.error("Failed to fetch events", err);
      }
    };
    loadEvents();
  }, [activeCalendarId, isSignedIn]);

  useEffect(() => {
    if (!selectedDate && derivedDays.length > 0) {
      setSelectedDate(derivedDays[0].iso);
    } else if (
      selectedDate &&
      derivedDays.length > 0 &&
      !derivedDays.some((d) => d.iso === selectedDate)
    ) {
      setSelectedDate(derivedDays[0].iso);
    }
  }, [derivedDays, selectedDate]);

  const activeDate = selectedDate || derivedDays[0]?.iso || new Date().toISOString().slice(0, 10);

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-neutral-950 px-4 pb-24">
      <div className="max-w-3xl mx-auto space-y-12">
         <CalendarSelector
          calendars={calendars}
          activeId={activeCalendarId}
          onSelect={(id: any) => setActiveCalendarId(id)}
          onCreate={handleCreateCalendar}
          onInvite={() => setShowInvite(true)}
          onRename={handleRenameCalendar}
        />
        <Hero selectedDate={activeDate} onSelectDate={setSelectedDate} days={derivedDays} />
        <EventModal selectedDate={activeDate} events={events} onSaveEvent={handleSaveEvent} />
        <BottomNav onAddClick={() => setShowAdd(true)} />
      </div>

      <AddEvent
        isOpen={showAdd}
        onClose={() => setShowAdd(false)}
        onAdd={handleAddEvent}
        defaultDate={activeDate}
      />

      <InviteModal
        open={showInvite}
        onClose={() => setShowInvite(false)}
        onInvite={handleInvite}
      />
    </main>
  );
}
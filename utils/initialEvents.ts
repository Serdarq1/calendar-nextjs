import { EventData } from '@/types/events'

export const initialEvents: EventData[] = [
  {
    id: '1',
    status: 'Tek',
    title: 'Spor',
    date: '2024-09-12',
    day: 12,
    time: '02:00 PM',
    type: 'single',
    members: [{ name: 'Priya', avatar: 'https://lh3.googleusercontent.com/a/default-user=s64-c' }],
  },
  {
    id: '2',
    status: 'Birlikte',
    title: 'Client presentation and feedback session',
    date: '2024-09-13',
    day: 13,
    time: '10:30 AM',
    type: 'collaborative',
    members: [
      { name: 'Alice', avatar: 'https://lh3.googleusercontent.com/a/default-user=s64-c' },
      { name: 'Bob', avatar: 'https://lh3.googleusercontent.com/a/default-user=s64-c' },
      { name: 'Ekin', avatar: 'https://lh3.googleusercontent.com/a/default-user=s64-c' },
    ],
  },
  {
    id: '3',
    status: 'Birlikte',
    title: 'Ekinle dışarı çıkma',
    date: '2024-09-15',
    day: 15,
    type: 'collaborative',
    members: [
      { name: 'Serdar Akova', avatar: 'https://lh3.googleusercontent.com/a/default-user=s64-c' },
      { name: 'Ekin', avatar: 'https://lh3.googleusercontent.com/a/default-user=s64-c' },
    ],
  },
  {
    id: '4',
    status: 'Tek',
    title: 'Review quarterly marketing metrics',
    date: '2024-09-16',
    day: 16,
    type: 'single',
    members: [{ name: 'Sarah', avatar: 'https://lh3.googleusercontent.com/a/default-user=s64-c' }],
  },
]

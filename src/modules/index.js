// THE ONLY PLACE to register a new section.
// To add one: create a folder in src/modules, then add one line below.
import Today from './today/Today'
import Goals from './goals/Goals'
import Reflect from './reflect/Reflect'
import Settings from './settings/Settings'

export const modules = [
  { id: 'today', label: 'Today', icon: '☀️', component: Today },
  { id: 'goals', label: 'Goals', icon: '🎯', component: Goals },
  { id: 'reflect', label: 'Reflect', icon: '📝', component: Reflect },
  { id: 'settings', label: 'Settings', icon: '⚙️', component: Settings, bottom: true },
]

// THE ONLY PLACE to register a new section.
// To add one: create a folder in src/modules, then add one line below.
// import Today from './today/Today'
// import Goals from './goals/Goals'
// import Reflect from './reflect/Reflect'
import Settings from './settings/Settings'
import Tasks from './tasks/Tasks'
import Reminders from './reminders/Reminders'
import Habits from './habits/Habits'
import Targets from './targets/Targets'
import Notes from './notes/Notes'
import Flashcards from './flashcards/Flashcards'
import News from './news/News'
import Playbook from './playbook/Playbook'
import Plan from './plan/Plan'

export const modules = [
{ id: 'tasks', label: 'Tasks', icon: '✅', component: Tasks, wide: true },
  { id: 'habits', label: 'Habits', icon: '🔥', component: Habits },
  { id: 'reminders', label: 'Reminders', icon: '📌', component: Reminders },
  { id: 'targets', label: 'Targets', icon: '🏆', component: Targets, wide: true },
  { id: 'notes', label: 'Notes', icon: '📓', component: Notes, wide: true, desktopOnly: true },
  { id: 'flashcards', label: 'Flashcards', icon: '🧠', component: Flashcards, wide: true, desktopOnly: true },
  { id: 'news', label: 'News', icon: '📰', component: News, wide: true },
//   { id: 'playbook', label: 'Playbook', icon: '📖', component: Playbook },
  { id: 'plan', label: 'Plan', icon: '🗓️', component: Plan, wide: true },
  // { id: 'today', label: 'Today', icon: '☀️', component: Today },
  // { id: 'goals', label: 'Goals', icon: '🎯', component: Goals },
  // { id: 'reflect', label: 'Reflect', icon: '📝', component: Reflect },
  // { id: 'settings', label: 'Settings', icon: '⚙️', component: Settings, bottom: true },
]
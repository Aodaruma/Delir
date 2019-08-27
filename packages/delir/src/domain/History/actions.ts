import { action, actions } from '@fleur/fleur'

import { Command } from './HistoryStore'

export const HistoryActions = actions('History', {
  pushHistory: action<{ command: Command }>(),
  undoing: action<{}>(),
  redoing: action<{}>(),
})
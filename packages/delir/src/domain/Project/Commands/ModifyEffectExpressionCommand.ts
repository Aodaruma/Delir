import _ from 'lodash'

import * as Delir from '@delirvfx/core'
import { OperationContext } from '@fleur/fleur'
import { Command } from '../../History/HistoryStore'
import { ProjectActions } from '../actions'

export class ModifyEffectExpressionCommand implements Command {
  constructor(
    private targetClipId: string,
    private effectId: string,
    private paramName: string,
    private previousValue: Delir.Values.Expression | null,
    private nextValue: Delir.Values.Expression,
  ) {}

  public undo(context: OperationContext) {
    context.dispatch(ProjectActions.modifyEffectExpression, {
      targetClipId: this.targetClipId,
      targetEffectId: this.effectId,
      paramName: this.paramName,
      expression: this.previousValue,
    })
  }

  public redo(context: OperationContext) {
    context.dispatch(ProjectActions.modifyEffectExpression, {
      targetClipId: this.targetClipId,
      targetEffectId: this.effectId,
      paramName: this.paramName,
      expression: this.nextValue,
    })
  }
}

import * as clamp from 'lodash/clamp'
import {IRenderer} from '../renderer-base'
import Type from '../../../plugin-support/type-descriptor'
import {TypeDescriptor} from '../../../plugin-support/type-descriptor'
import PreRenderingRequest from '../../pipeline/pre-rendering-request'
import RenderingRequest from '../../pipeline/render-request'

import Asset from '../../../project/asset'

interface Param {
    opacity: number
}

export default class AdjustmentRenderer implements IRenderer<Param>
{
    public static get rendererId(): string { return 'adjustment' }

    public static provideAssetAssignMap()
    {
        return {}
    }

    public static provideParameters(): TypeDescriptor
    {
        return Type
            .number('opacity', { label: 'Opacity', defaultValue: 100, animatable: true })
    }

    public async beforeRender(req: PreRenderingRequest<Param>) { return }

    public async render(req: RenderingRequest<Param>)
    {
        req.destCanvas.getContext('2d')!.drawImage(req.srcCanvas!, 0, 0)
    }
}
// @flow
import * as _ from 'lodash'
import * as uuid from 'uuid'

import Clip from './clip'
import { ClipScheme } from './scheme/clip'
import { LayerScheme } from './scheme/layer'

import toJSON from '../helper/toJSON'

export default class Layer
{

    get id(): string { return this._id }

    get name(): string { return (this._config.name as string) }
    set name(name: string) { this._config.name = name }
    public static deserialize(layerJson: LayerScheme)
    {
        const layer = new Layer()

        const config = _.pick(layerJson.config, ['name'])
        const clips = layerJson.clips.map((clipJson: ClipScheme) => Clip.deserialize(clipJson))

        Object.defineProperty(layer, '_id', {value: layerJson.id || uuid.v4()})
        Object.assign(layer._config, config)
        layer.clips = clips

        return layer
    }

    public clips: Clip[] = []

    private _id: string = uuid.v4()

    private _config: {
        name: string | null,
    } = {
        name: null
    }

    constructor()
    {
        Object.seal(this)
    }

    public toPreBSON(): LayerScheme
    {
        return {
            id: this.id,
            config: toJSON(this._config),
            clips: Array.from(this.clips).map(clip => clip.toPreBSON()),
        }
    }

    public toJSON(): LayerScheme
    {
        return {
            id: this.id,
            config: toJSON(this._config),
            clips: Array.from(this.clips).map(clip => clip.toJSON()),
        }
    }
}
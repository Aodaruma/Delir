import Project from '../../project/project'
import Clip from '../../project/clip'
import EffectPluginBase from '../../plugin-support/effect-plugin-base'

import PluginRegistry from '../../plugin-support/plugin-registry'

import * as _ from 'lodash'
import ProgressPromise from '../../helper/progress-promise'
import RenderingRequest from './render-request'
import EntityResolver from './entity-resolver'
import * as ProjectHelper from '../../helper/project-helper'
import {RenderingFailedException} from '../../exceptions/'
import * as RendererFactory from '../renderer'


export default class Pipeline
{
    private _state = {
        frameCursor: 0,
    }

    private _currentRequest: RenderingRequest

    constructor(
        private _project: Project,
        private _pluginRegistry: PluginRegistry,
        private _destinationCanvas: HTMLCanvasElement,
        private _destinationAudioNode: AudioNode
    )
    {

    }

    public reInit()
    {

    }

    public renderFrame(compositionId: string, frame: number)
    {
        return new ProgressPromise<any>(async (resolve, reject, onAbort, notifier) => {
            const request = this._currentRequest ? this._currentRequest : this._initStage(compositionId)
            this._currentRequest = request

            for await (let process of this._setupStage(request)) {

            }
        })
    }

    private _initStage(compositionId: string): RenderingRequest
    {
        if (!this._project) throw new RenderingFailedException('Project must be set before rendering')
        if (!this._pluginRegistry) throw new RenderingFailedException('Plugin registry not set')
        if (!this._destinationCanvas) throw new RenderingFailedException('Destination canvas not set')

        const rootComposition = ProjectHelper.findCompositionById(this._project, compositionId)
        if (!rootComposition) throw new RenderingFailedException('Specified composition not found')

        const resolver = new EntityResolver(this._project, this._pluginRegistry)

        const canvas = document.createElement('canvas') as HTMLCanvasElement
        canvas.width = rootComposition.width
        canvas.height = rootComposition.height

        const compositionDurationTime = rootComposition.durationFrames / rootComposition.framerate
        const bufferSizeBytePerSec = rootComposition.samplingRate *  4 /* bytes */

        const audioContext = new OfflineAudioContext(
            rootComposition.audioChannels,
            Math.ceil(bufferSizeBytePerSec * compositionDurationTime),
            rootComposition.samplingRate
        )
        const audioBuffers = _.times(rootComposition.audioChannels, () => new Float32Array(new ArrayBuffer(bufferSizeBytePerSec)))

        return new RenderingRequest({
            destCanvas: canvas,
            width: rootComposition.width,
            height: rootComposition.height,
            framerate: rootComposition.framerate,
            durationFrames: rootComposition.durationFrames,

            destAudioBuffer: audioBuffers,
            audioContext,
            samplingRate: rootComposition.samplingRate,
            neededSamples: rootComposition.samplingRate,
            audioChannels: rootComposition.audioChannels,

            rootComposition,
            resolver,
        })
    }

    private _setupStage = async function*(this: Pipeline, req: RenderingRequest)
    {
        const clipInstances = []

        for (const layer of req.rootComposition.layers) {
            for (const clip of layer.clips) {
                const instanceSet: any = {}

                const renderers = await this._setupClip(clip, req)
                instanceSet.renderer = renderers.renderer
                instanceSet.effects = renderers.effects

                yield

                clipInstances.push(instanceSet)

            }
        }
    }

    private async _setupClip(clip: Clip, req: RenderingRequest) : Promise<{
        renderer: any,
        effects: {entityId: string, instance: EffectPluginBase}[],
    }>
    {
        const renderer = RendererFactory.create(clip.renderer)
        const effects: {entityId: string, instance: EffectPluginBase}[] = []

        for (const effectConfig of clip.effects) {
            const Effect = req.resolver.resolveEffectPlugin(effectConfig.processor)
            const effector = new Effect()
            effects.push({entityId: effectConfig.id, instance: effector})
        }

        return {renderer, effects}
    }

    private _renderingStage()
    {

    }
}

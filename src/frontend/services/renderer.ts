import * as Delir from 'delir-core'
import { ProjectHelper } from 'delir-core'
import { remote } from 'electron'
import * as _ from 'lodash'
import { dirname, join } from 'path'
import deream from '../../deream'

import { KnownPayload } from '../actions/PayloadTypes'
import dispatcher from '../utils/Flux/Dispatcher'
import * as Platform from '../utils/platform'

import AppActions from '../actions/App'
import {DispatchTypes as EditorStateDispatchTypes } from '../actions/App'
import EditorStateStore from '../stores/EditorStateStore'

let pluginRegistry: Delir.PluginRegistry | null = null
let pluginLoader: Delir.Services.PluginLoader | null = null
let pipeline: Delir.Engine.Pipeline | null = null
let renderState: {currentFrame: number} | null = null

let destCanvas: HTMLCanvasElement
let canvasContext: CanvasRenderingContext2D

let audioContext: AudioContext | null = null
let audioBuffer: AudioBuffer | null = null
let isInRendering = false

const state: {
    project: Delir.Project.Project | null,
    composition: Delir.Project.Composition | null,
} = {
    project: null,
    composition: null,
}

const handlePayload = async (payload: KnownPayload) => {
    switch (payload.type) {
        case EditorStateDispatchTypes.SetActiveProject:
            // renderer.setProject(payload.entity.project)
            pipeline!.project = payload.entity.project
            state.project = payload.entity.project
            break

        case EditorStateDispatchTypes.ChangeActiveComposition: {
            if (!state.project) break
            state.composition = ProjectHelper.findCompositionById(state.project, payload.entity.compositionId)
            // renderer.stop()
            break
        }

        case EditorStateDispatchTypes.StartPreview: {
            if (!state.project || !state.composition) break
            if (!pipeline) break

            const targetComposition = ProjectHelper.findCompositionById(state.project, payload.entity.compositionId)
            if (! targetComposition) break

            if (audioContext) {
                audioContext.close()
            }

            audioContext = new AudioContext()

            audioBuffer = audioContext.createBuffer(
                targetComposition.audioChannels,
                /* length */targetComposition.samplingRate,
                /* sampleRate */targetComposition.samplingRate,
            )

            pipeline.setStreamObserver({
                onFrame: (canvas, status) => {
                    renderState = {currentFrame: status.frame}
                    canvasContext.drawImage(canvas, 0, 0)
                },
                onAudioBuffered: buffers => {
                    for (let idx = 0, l = buffers.length; idx < l; idx++) {
                        audioBuffer.copyToChannel(buffers[idx], idx)
                    }

                    const audioBufferSource = audioContext!.createBufferSource()
                    audioBufferSource.buffer = audioBuffer
                    audioBufferSource.connect(audioContext!.destination)

                    audioBufferSource.start(0, 0, 1)
                    audioBufferSource.stop(audioContext.currentTime + 1)
                    audioBufferSource.onended = () => {
                        audioBufferSource.disconnect(audioContext!.destination)
                    }
                },
            })

            const promise = pipeline.renderSequencial(targetComposition.id, {
                beginFrame: payload.entity.beginFrame,
                loop: true,
            })

            promise.progress(progress => {
                AppActions.updateProcessingState(`Preview: ${progress.state}`)
            })

            promise.catch(e => {
                if (e instanceof Delir.Exceptions.RenderingAbortedException) {
                    AppActions.updateProcessingState('Stop.')
                    return
                }

                console.error(e)
            })

            break
        }

        case EditorStateDispatchTypes.StopPreview: {
            if (pipeline) {
                renderState = null
                pipeline.stopCurrentRendering()
            }
        }

        case EditorStateDispatchTypes.SeekPreviewFrame: {
            const {frame} = payload.entity
            const targetComposition = state.composition!

            pipeline.setStreamObserver({
                onFrame: canvas => canvasContext.drawImage(canvas, 0, 0)
            })

            pipeline!.renderFrame(targetComposition.id, frame)
            .catch(e => console.error(e))

            break
        }

        case EditorStateDispatchTypes.RenderDestinate: {
            const appPath = dirname(remote.app.getPath('exe'))
            const ffmpegBin = __DEV__ ? 'ffmpeg' : require('path').resolve(
                appPath,
                Platform.isMacOS() ? '../Resources/ffmpeg' : './ffmpeg.exe'
            )

            const file = remote.dialog.showSaveDialog(({
                title: 'Destinate',
                buttonLabel: 'Render',
                filters: [
                    {
                        name: 'mp4',
                        extensions: ['mp4']
                    }
                ],
            }))

            if (! file) return
            if (!state.project || !state.composition || !pluginRegistry) return

            // deream() の前に一瞬待たないとフリーズしてしまうので
            // awaitを噛ませてステータスを確実に出す
            await new Promise(resolve => {
                setImmediate(() => {
                    AppActions.autoSaveProject()
                    AppActions.updateProcessingState('Rendering: Initializing')
                    resolve()
                })
            })

            isInRendering = true

            try {
                await deream({
                    project: state.project,
                    rootCompId: state.composition.id,
                    exportPath: file,
                    pluginRegistry,
                    temporaryDir: remote.app.getPath('temp'),
                    ffmpegBin,
                    onProgress: progress => {
                        setTimeout(() => { AppActions.updateProcessingState(progress.state) }, 0)
                    }
                })

                isInRendering = false
            } catch (e) {
                isInRendering = false
                throw e
            }

            break
        }
    }
}

const rendererService = {
    initialize: async () => {
        const userDir = remote.app.getPath('appData')
        pipeline = new Delir.Engine.Pipeline()
        pluginLoader = new Delir.PluginSupport.FSPluginLoader()
        pluginRegistry = pipeline.pluginRegistry

        const loaded = [
            await pluginLoader.loadPackageDir(join(remote.app.getAppPath(), '/plugins')),
            await pluginLoader.loadPackageDir(join(userDir, '/delir/plugins')),
        ]

        const successes = [].concat(...loaded.map<any>(({loaded}) => loaded))
        const fails = [].concat(...loaded.map<any>(({failed}) => failed))

        if (fails.length > 0) {
            const failedPlugins = fails.map((fail: any) => fail.package).join(', ')
            const message = fails.map((fail: any) => fail.reason).join('\n\n')
            AppActions.notify(`${failedPlugins}`, `Failed to load ${fails.length} plugins`, 'error', 5000, message)
        }

        console.log('Plugin loaded', successes, 'Failed:', fails)
        loaded.forEach(({loaded}) => pluginRegistry!.addEntries(loaded))

        dispatcher.register(handlePayload)
    },

    setDestCanvas: (canvas: HTMLCanvasElement) => {
        destCanvas = canvas
        canvasContext = canvas.getContext('2d')!
    },

    get pluginRegistry() {
        return pluginRegistry!
    },

    get renderer(): Delir.Engine.Pipeline {
        return pipeline
    },

    get lastRenderState() {
        return renderState
    },

    get isInRendering()
    {
        return isInRendering
    }
}

if (__DEV__) {
    (window.app = window.app || {}).renderer = rendererService
}
export default rendererService
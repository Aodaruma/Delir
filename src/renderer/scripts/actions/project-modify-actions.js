import _ from 'lodash'
import {Project} from 'delir-core'

import dispatcher from '../dispatcher'
import ActionTypes from '../action-types'

export default {
    //
    // Modify project
    //

    createComposition({name, width, height, framerate, durationFrames})
    {
        const composition = new Project.Composition
        composition.name = name
        composition.width = width
        composition.height = height
        composition.framerate = framerate
        composition.durationFrames = durationFrames

        dispatcher.dispatch({
            type: ActionTypes.CREATE_COMPOSTION,
            payload: {composition},
        })
    },

    createTimelane(compId: string)
    {
        const timelane = new Project.Timelane

        dispatcher.dispatch({
            type: ActionTypes.CREATE_TIMELANE,
            payload: {timelane, targetCompositionId: compId}
        })
    },

    createLayer(
        timelaneId: string,
        layerRendererId: string,
        placedFrame = 0,
        durationFrames = 100
    ) {
        dispatcher.dispatch({
            type: ActionTypes.CREATE_LAYER,
            payload: {
                props: {
                    renderer: layerRendererId,
                    placedFrame: placedFrame,
                    durationFrames: durationFrames,
                },
                targetTimelaneId: timelaneId,
            },
        })
    },

    addAsset({name, mimeType, path})
    {
        const asset = new Project.Asset()
        asset.name = name
        asset.mimeType = mimeType
        asset.path = path

        dispatcher.dispatch({
            type: ActionTypes.ADD_ASSET,
            payload: {asset},
        })
    },


    // TODO: frame position
    moveLayerToTimelane(layerId: string, targetTimelaneId: string)
    {
        dispatcher.dispatch({
            type: ActionTypes.MOVE_LAYER_TO_TIMELINE,
            payload: {layerId, targetTimelaneId},
        })
    },

    modifyComposition(compId: string, props: Object)
    {
        dispatcher.dispatch({
            type: ActionTypes.MODIFY_COMPOSITION,
            payload: {
                targetCompositionId: compId,
                patch: props,
            }
        })
    },

    modifyLayer(layerId: string, props: {[propKey: string]: any}) {
        dispatcher.dispatch({
            type: ActionTypes.MODIFY_LAYER,
            payload: {
                targetLayerId: layerId,
                patch: props,
            }
        })
    },

    removeTimelane()
    {

    },

    removeLayer(layerId: string)
    {
        dispatcher.dispatch({
            type: ActionTypes.REMOVE_LAYER,
            payload: {
                targetLayerId: layerId
            }
        })
    },
}
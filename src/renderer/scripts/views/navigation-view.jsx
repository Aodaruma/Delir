import React, {PropTypes} from 'react'

import EditorStateStore from '../stores/editor-state-store'

import EditorStateActions from '../actions/editor-state-actions'

import Pane from './components/pane'

export default class NavigationView extends React.Component
{
    onTitleDoubleClicked()
    {
        console.log('hi');
    }

    onClickPlay = (action) =>
    {
        EditorStateActions.togglePreview(EditorStateStore.getState().activeComp.id)
    }

    onClickDest = action => {
        const composition = EditorStateStore.getState().activeComp
        composition && EditorStateActions.renderDestinate(composition.id)
    }

    render()
    {
        return (
            <Pane className='view-navigation' resizable={false}>
                <ul className='window-nav'>
                    <li className='window-nav-item window-nav--close'></li>
                    <li className='window-nav-item window-nav--minimize'></li>
                    <li className='window-nav-item window-nav--maximize'></li>
                </ul>
                <ul className='navigation-items'>
                    <li onClick={this.onClickPlay}><i className='fa fa-play' /></li>
                    <li onClick={this.onClickDest}><i className='fa fa-film' /></li>
                </ul>
            </Pane>
        )
    }
}

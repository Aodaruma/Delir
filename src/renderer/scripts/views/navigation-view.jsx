import React, {PropTypes} from 'react'

import Actions from '../actions'

import Pane from './components/pane'

export default class NavigationView extends React.Component
{
    onTitleDoubleClicked()
    {
        console.log('hi');
    }

    onClickPlay = (action) =>
    {
        Actions.previewPlay()
    }

    onClickDest = action => {
        Actions.destinate()
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
                    <li>✨</li>
                    <li>💪</li>
                    <li onClick={this.onClickPlay}>⚡</li>
                    <li onClick={this.onClickDest}>✨</li>
                </ul>
            </Pane>
        )
    }
}

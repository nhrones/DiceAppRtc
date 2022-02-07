
/////////////////////////////////    ViewElements    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\
//                                                                                    \\
//  ViewElements ... a collection of 'View' objects.                                  \\
//  ViewElement objects are used to persist renderable objects to the 'canvas'.       \\
//                                                                                    \\
//  ViewElements are held in an ES6 Map.                                              \\
//  This map maintains a sort-order based on an ViewElements zOrder number.           \\
//  This insures proper rendering order, as well as, ordered 'hit-testing'            \\
//  by using each elements Path2D path.                                               \\
//  We hit-test 'front-to-back' to insure that top-level elements are detected first. \\
//  When an element is added or moved, its zOrder value is mutated to indicate        \\
//  in which order(zOrder) it is rendered in.                                         \\
//                                                                                    \\
//////////////////////////////////////////\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\

import { View } from '../../types.js'
import { ON, Event, Fire } from '../model/events.js'
import { container } from '../../view/container.js'

export const nodes: Set<View> = new Set()
export const activeNodes: Set<View> = new Set()

/** adds a new view element to the nodes and/or activeNodes collections */
export const add = (view: View) => {

    // add all views to nodes colection
    nodes.add(view as View)

    // is this an 'active-view' (has a hovered property?)
    if (!("undefined" === typeof (view["hovered"]))) {
        // add all active-views(views that are clickable) to activeNodes collection
        activeNodes.add(view as View)
    }

    // sends a message to diceGame to build an appropriate viewmodel
    Fire(Event.ViewWasAdded,
        {
            type: view.constructor.name,
            index: view.index,
            name: view.name
        }
    )
}

/** reset the State of the activeNodes set */
const resetState = () => {
    for (const element of activeNodes) {
        element.hovered = false
        element.selected = false
    }
    render()
}

/** called from: this.resetState() */
const render = () => {
    container.clearCanvas()
    for (const element of activeNodes) {
        element.update()
    }
}

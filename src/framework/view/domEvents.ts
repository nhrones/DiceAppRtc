
import { currentPlayer, thisPlayer } from '../../model/players.js'
import * as events from '../model/events.js'
import { container, ctx } from '../../view/container.js'
import * as viewElements from './viewElements.js'
import { View } from '../../types.js';

const {
    Event: _,
    Fire: fireEvent,
} = events

///////////////////////////\\\\\\\\\\\\\\\\\\\\\\\\\\\
//          aliases for faster resolution           \\
//          helps to reduce pressure on GC          \\
///////////////////////////\\\\\\\\\\\\\\\\\\\\\\\\\\\

// values re-used repeatedly in event handlers
let x = 0
let y = 0
let boundingRect: DOMRect | null = null
let hit = false
let node: View | null = null
let hoveredNode: View | null = null

// persistant reference
let canvas: HTMLCanvasElement

const left = 0

///////////////////////////\\\\\\\\\\\\\\\\\\\\\\\\\\\
//              initialize environment              \\
///////////////////////////\\\\\\\\\\\\\\\\\\\\\\\\\\\

/**
 * Initializes an environment for custom canvas mouse/touch event handlers.
 * 
 * Registers local handler functions for:     
 *      canvas.mousedown + canvas.touchstart => handleClickOrTouch()    
 *      canvas.mousemove => handleMouseMove     
 */
export function initHandlers(): void {

    // setup local context from our host Container
    canvas = container.canvas

    ////////////////////////////////\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\
    //                         bind events                        \\
    //  we use these events to decouple the View from the Model   \\
    ////////////////////////////////\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\

    /*  Mouse Buttons i.e. const buttonPressed = e.button
        0: Main button pressed, usually the left button or the un-initialized state
        1: Auxiliary button pressed, usually the wheel button or the middle button (if present)
        2: Secondary button pressed, usually the right button
        3: Fourth button, typically the Browser Back button
        4: Fifth button, typically the Browser Forward button
    */

    // register a handler for our canvas' mousedown event
    canvas.addEventListener('mousedown', (e: MouseEvent) => {
        e.preventDefault()
        if (e.button === left) handleClickOrTouch(e.pageX, e.pageY)
    }, false)

    // register a handler for our canvas' mousemove event
    canvas.addEventListener('mousemove', (e: MouseEvent) => {
        e.preventDefault()
        if (container.hasVisiblePopup === false) {
            handleMouseMove(e)
        }
    })
}

///////////////////////////\\\\\\\\\\\\\\\\\\\\\\\\\\\
//                  local functions                 \\
///////////////////////////\\\\\\\\\\\\\\\\\\\\\\\\\\\

/** 
 * Handles canvas mouse-move event.     
 * Provides logic to emulate 'onmouseenter', and        
 * 'onmouseleave' DOM events on our virtual elements.    
 * Uses the canvasContexts 'isPointInPath' method for hit-testing.    
 * @param(MouseEvent) evt - from canvas.mousemove event  
 */
function handleMouseMove(evt: MouseEvent,) {

    boundingRect = canvas.getBoundingClientRect()
    x = evt.clientX - boundingRect.x
    y = evt.clientY - boundingRect.y
    node = null

    // test for hovered
    for (const element of viewElements.activeNodes) {
        if (ctx.isPointInPath(element.path, x, y)) {
            // going from bottom to top, top-most object wins
            node = element
        }
    }

    // did we get a hover? 
    if (node !== null) {
        if (node !== hoveredNode) {
            clearHovered()
            node.hovered = true
            node.update()
            hoveredNode = node
        }
    } else { // no id was hit
        if (hoveredNode !== null) {
            clearHovered()
            hoveredNode = null
        }
    }
}

/** 
 * Handles both, canvas-mouse-Click and canvas-Touch events.    
 * Uses the canvasContexts 'isPointInPath' method for hit-testing.     
 * If a hit is detected, calls the elements touched() method.    
 * The elements touched() method will then broadcast an 'event' to all subscribers.   
 * 
 * @param(number) mX - an adjusted horizontal position of this event
 * @param(number) mY - an adjusted vertical position of this event
 */
function handleClickOrTouch(mX: number, mY: number) {
    hit = false
    // reject all local events when not our turn
    if (currentPlayer.id === thisPlayer.id) {
        x = mX - canvas.offsetLeft
        y = mY - canvas.offsetTop
        for (const element of viewElements.activeNodes) {
            if (!hit) {
                if (ctx.isPointInPath(element.path, x, y)) {
                    element.touched()
                    hit = true
                }
            }
        }
    }
}

/** clear last hovered object */
function clearHovered() {
    if (hoveredNode !== null) {
        hoveredNode.hovered = false
        hoveredNode.update()
    }
}

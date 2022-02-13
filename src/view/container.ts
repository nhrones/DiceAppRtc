
import { player, label, popup, button, die, score } from '../framework/view/viewFactory.js'
import { initHandlers } from '../framework/view/domEvents.js'
import { compileUI } from '../framework/compiler/compiler.js'

//TODO set this from Deno.env
/**
 * DEV environment constant
 * @constant number 
 *  1 = true = compile and save to localStorage;
 *  0 = false = compile only if localStorage not found
 */
const DEV = 0

///////////////////////////\\\\\\\\\\\\\\\\\\\\\\\\\\\
//         exported for faster resolution           \\
///////////////////////////\\\\\\\\\\\\\\\\\\\\\\\\\\\

export let ctx: CanvasRenderingContext2D
export let container: Container

/** 
 * This class produces a singleton Container object named (_instance).    
 * This _instance object is exported as 'container' to the app.    
 *     
 * Container is our top level View object.    
 * It's responsible for instantiating all virtual view elements, and        
 * for conducting all virtual UI events using a domEventHandler object.
 */
export class Container {

    color: string
    textColor: string
    hasVisiblePopup = false
    canvas: HTMLCanvasElement
    x: number
    y: number

    /** 
     * a private instance of the Container class.
     * Exposed only by the Container.init() method
     */
    private static _instance: Container

    /** 
     * Container singleton initialization.
     * Called from DOMContentLoaded event handler (app.js)
     * @param canvas {HTMLCanvasElement} Canvas dependency injection
     * @param color {string} the background color of the canvas
     */
    static init(canvas: HTMLCanvasElement, color: string) {

        if (!Container._instance) {
            Container._instance = new Container(canvas, color)
            container = Container._instance
        }

        // We initialize our canvas event handers   
        // located in the 'domEvents' module.   
        // This module handles all DOM events for our canvas.    
        // These methods discriminate which ActiveView(virtual-element)    
        // have been touched, clicked or hovered over. 
        initHandlers()
    }

    /** 
     * private Container constructor for singleton instance 
     */
    private constructor(canvas: HTMLCanvasElement, color: string) {

        this.color = color
        this.textColor = 'black'
        this.canvas = canvas
        this.x = parseInt(this.canvas.style.left)
        this.y = parseInt(this.canvas.style.top)

        ctx = this.initCanvasContext(canvas, color)!
    }
    
    /** 
     * Build all virtual UI elements from ElementDescriptors    
     * Normal operation will pull the collection of descriptors    
     * from localStorage.  
     * 
     * In DEV mode, or if no store is found, we compile the descriptor     
     * objects collection by examining the index.html and all stylesheets     
     * in the document. 
     *    
     * The compile operation will store the collection in localStorage with    
     * the name 'elementDescriptors'.
     * 
     * Once we have elementDescriptors parsed as 'nodes', we proceed    
     * to hydrate each as an active viewElement object, and place each    
     * in this containers 'viewElements' collection.
     * 
     * Each viewElement contains a Path2D object. This path is used to     
     * render and and 'hit-test' the vitual UI element in the main canvas     
     * mouseEvents (SEE: /framework/view/domEventHandlers.ts).
     */
    hydrateUI() {
        
        // if not in developer mode, gets the nodes from the store
        // otherwise, nodes = null forces a recompile of elements from html
        let nodes = (DEV === 0) ? null : JSON.parse(localStorage.getItem('elementDescriptors'));
        // if developer mode or not in store, rebuild the UI-elementDescriptors
        if (nodes === null) {
            compileUI() // rebuild the UI-elementDescriptors collection
            nodes = JSON.parse(localStorage.getItem('elementDescriptors'));
        }
        
        // loop over all the elementDescriptors and hydrate each to a viewElement
        for (const node of nodes) {
                // hydrate the node 
                switch (node.kind) {
                    case "label":
                        label(node)
                        break;
                    case "popup":
                        popup(node)
                        break;
                    case "button":
                        button(node)
                        break;
                    case "die":
                        die(node)
                        break;
                    case "score":
                        score(node)
                        break;
                    case "player":
                        player(node)
                        break;
                    default:
                        break;
                }
            
        }
        // destroy the evidence <hee hee>
        const surface = document.getElementById("surface").parentElement!
        surface.parentElement.removeChild(surface)
    }

    /** 
     * Initialize and return a canvasContext2D object for this HTMLCanvasElement
     * @param canvas {HTMLCanvasElement} the canvas element
     * @param color {string} an initial color for both stroke and fill styles
     */
    initCanvasContext(canvas: HTMLCanvasElement, color: string) {
        const ctx = canvas.getContext('2d')
        if (ctx) {
            ctx.lineWidth = 1
            ctx.strokeStyle = color
            ctx.fillStyle = color
            ctx.font = "16px Tahoma, Verdana, sans-serif";
            ctx.textAlign = 'center'
            ctx.shadowBlur = 10
            ctx.shadowOffsetX = 3
            ctx.shadowOffsetY = 3
            ctx.fillRect(0, 0, canvas.width, canvas.height)
        }
        return ctx
    }

    /** 
     * Clears the canvas to its background color 
     * */
    clearCanvas(buffer?: any) {
        if (buffer) {
            const _a: number = 0 //CAN-DO-- fill with buffer
        } else {
            ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
            return this
        }
    }

    /** 
     * Adjusts the Position of the canvas 
     * */
    setPosition(x: number, y: number) {
        this.x = x
        this.canvas.style.left = x + 'px'
        this.y = y
        this.canvas.style.top = y + 'px'
        return this
    }
}
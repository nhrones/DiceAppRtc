import {} from '../framework/model/events.js'
import { Geometry, View } from '../types.js'
import { container, ctx } from './container.js'
import { onEvent } from '../framework/comms/signaling.js'
import { when, Event, Fire } from '../framework/model/events.js'

let left = 1
let top = 1

/** 
 * A virtual Popup view class 
 */
export default class Popup implements View {

    id: number = 0 // assigned by activeViews.add() 
    index: number = -1
    activeView = true
    zOrder: number = 100 // assigned by activeViews.add()
    name: string = ""
    enabled: boolean = true
    hovered: boolean = false
    selected: boolean = false
    path: Path2D
    shownPath: Path2D
    hiddenPath: Path2D
    geometry: Geometry
    color: string = "black"
    text: string = ""
    visible: boolean = true
    buffer: ImageData | null = null

    /** 
     * constructor that instantiates a new vitual Popup view 
     */
    constructor(geometry: Geometry, path: Path2D) {

        this.enabled = true
        this.color = 'white'

        this.shownPath = path
        this.hiddenPath = new Path2D()
        this.hiddenPath.rect(1, 1, 1, 1)

        this.geometry = geometry
        this.path = this.hiddenPath


        ////////////////////////////////\\\\\\\\\\\\\\\\\\\\\\\\\\\\
        //                         bind events                    \\
        ////////////////////////////////\\\\\\\\\\\\\\\\\\\\\\\\\\\\

        // Our model broadcasts this ShowPopup event at the end of a game
        when(Event.ShowPopup, (message: string) => {
            this.show(message)
        })

        // Other web-peers may broadcast a ShowPopup event at the end of a game
        onEvent('ShowPopup', (message: string ) => {
            this.show(message)
        })

        when(Event.HidePopup, () => {
            this.hide()
        })
    }

    /** 
     * show the virtual Popup view 
     */
    show(msg: string) {
        this.text = msg
        left = this.geometry.left
        top = this.geometry.top
        this.path = this.shownPath
        this.visible = true
        this.saveScreenToBuffer()
        container.hasVisiblePopup = true
        this.render()
    }

    /** 
     * hide the virtual Popup view 
     */
    hide() {
        if (this.visible) {
            left = 1
            top = 1
            this.path = this.hiddenPath
            this.restoreScreenFromBuffer()
            this.visible = false
            container.hasVisiblePopup = false
        }
    }

    /** 
     * takes a snapshot of our current canvas bitmap 
     */
    saveScreenToBuffer() {
        this.buffer = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height)
    }

    /** 
     * paint the canvas with our current snapshot 
     */
    restoreScreenFromBuffer() {
        if (this.buffer) {
            return ctx.putImageData(this.buffer, 0, 0)
        }
    }

    /** 
     * called by the view container when this element has been touched 
     */
    touched() {
        this.hide()
        Fire(Event.PopupResetGame, {})
    }

    update() {
        if (this.visible) this.render()
    }

    /** 
     * render this virtual Popup view 
     */
    render() {
        ctx.save()
        ctx.shadowColor = '#404040'
        ctx.shadowBlur = 45
        ctx.shadowOffsetX = 5
        ctx.shadowOffsetY = 5
        ctx.fillStyle = container.color
        ctx.fill(this.path)
        ctx.shadowBlur = 0
        ctx.shadowOffsetX = 0
        ctx.shadowOffsetY = 0
        ctx.lineWidth = 1
        ctx.strokeStyle = container.textColor
        ctx.stroke(this.path)
        ctx.strokeText(this.text, left + 150, top + 100)
        ctx.restore()
        this.visible = true
    }

}

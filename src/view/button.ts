
import { ON, Event, Fire }  from '../framework/model/events.js'
import { Geometry, View } from '../types.js'
import { container, ctx } from './container.js'
import Label from './label.js'

/** 
 * A virtual Button view class 
 */
export default class Button implements View {

    id: number = 0 // assigned by activeViews.add() 
    activeView = true
    index: number = -1
    zOrder: number = 0 // assigned by activeViews.add()
    name: string = ''
    enabled: boolean = true
    hovered: boolean = false
    selected: boolean = false
    path: Path2D
    geometry: Geometry
    color: string
    textColor: string
    textLabel: Label
    text: string = ""

    /** 
     * constructor that instantiates a new vitual Button view 
     */
    constructor(name: string, text: string, geometry: Geometry, path: Path2D) {

        this.name = name
        this.zOrder = 0
        this.geometry = geometry
        this.color = container.textColor
        this.textColor = container.color
        this.enabled = true

        this.textLabel = new Label(
            -1, this.name + 'Label', text, {
                left: geometry.left + 68,
                top: geometry.top + 30,
                width: geometry.width - 25,
                height: 40
            }, 'blue', true)

        this.path = path
        this.render()

        ////////////////////////////////\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\
        //                         bind events                      \\
        ////////////////////////////////\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\

        // the viewModel will emit this event whenever it needs to update this view
        ON(Event.UpdateButton + this.name,
                (data: { text: string , color: string, enabled: boolean }) => {
                this.enabled = data.enabled
                this.color = data.color //_background
                this.text = data.text
                this.render()
            })
    }

    /** 
     * called by the view container when this element has been touched 
     */
    touched() {
        if (this.enabled) {
            Fire(Event.ButtonTouched + this.name, {})
        }
    }

    /** 
     * updates and renders the Button view 
     */
    update() {
        this.render()
    }

    /** 
     * render this Buttons shape (path) onto the canvas 
     */
    render() {
        ctx.save()
        ctx.lineWidth = 2
        ctx.strokeStyle = (this.hovered) ? 'orange' : 'black'
        ctx.stroke(this.path)
        ctx.restore()
        ctx.fillStyle = this.color
        ctx.fill(this.path)
        ctx.fillStyle = container.color
        ctx.restore()
        this.textLabel.fillColor = this.color
        this.textLabel.fontColor = this.textColor
        this.textLabel.text = this.text
        this.textLabel.render()
    }
}

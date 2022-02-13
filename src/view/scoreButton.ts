
import { Geometry, View } from '../types.js'
import { container, ctx } from './container.js'
import Label from './label.js'

import {  
    ON, 
    Event,  
    Fire 
} from '../framework/model/events.js'

/** 
 * A virtual ScoreButton view class 
 */
export default class ScoreButton implements View {

    id: number = 0 // assigned by activeViews.add()    
    zOrder: number = 0 // assigned by activeViews.add()
    name: string
    index: number
    activeView = true
    enabled: boolean = true
    hovered: boolean = false
    selected: boolean = false
    path: Path2D = new Path2D()
    geometry: Geometry
    text: string
    color: string = 'black'
    isLeftHanded: boolean
    scoreText: string = ''
    available: boolean = false
    tooltip: string = ""
    
    upperText: string = ""
    lowerText: string = ""
    upperName: Label | null = null
    lowerName: Label | null = null
    scoreBox: Label | null = null

    /** 
     * Creates an instance of a virtual ScoreButton.
     * @param {number} index
     * @param {string} name
     * @param {iGeometry} geometry
     * @param {boolean} isLeftHanded
     * @param {string} text
     */
    constructor(index: number, name: string, geometry: Geometry,
        isLeftHanded: boolean, text: string) {

        this.index = index
        this.name = name
        this.text = ''
        this.tooltip = `${name} available`
        this.enabled = true
        this.hovered = false
        this.selected = false
        this.geometry = geometry
        this.isLeftHanded = isLeftHanded
        this.upperText = text.split(' ')[0]
        this.lowerText = text.split(' ')[1] || ''

        ////////////////////////////////\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\
        //                         bind events                       \\
        ////////////////////////////////\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\

        ON(Event.UpdateScoreElement + this.index,
            (data: {
                renderAll: boolean,
                color: string,
                valueString: string,
                available: boolean
            }
            ) => {
                if (data.renderAll) {
                    this.color = data.color
                    this.render()
                }
                this.available = data.available
                this.scoreText = data.valueString
                this.renderScore(data.valueString, data.available)
            })
    }

    /** 
     * called by the view container when this element has been touched 
     */
    touched() {
        Fire(Event.ScoreButtonTouched + this.index, {})
    }

    update() {
        Fire(Event.UpdateTooltip + this.index, {hovered: this.hovered})
        this.render()
        this.renderScore(this.scoreText, this.available)
    }

    /** 
     * render this vitual ScoreButtons shape (path) onto the canvas 
     */
    render() {
        ctx.save()
        ctx.lineWidth = 5
        ctx.strokeStyle = (this.hovered) ? 'orange' : this.color
        ctx.stroke(this.path)
        ctx.restore()

        ctx.fillStyle = this.color
        ctx.fill(this.path)
        if (this.upperName) {
            this.upperName.fillColor = this.color
            this.upperName.fontColor = container.color
            this.upperName.text = this.upperText
            this.upperName.render()
        }
        if (this.lowerName) {
            this.lowerName.fillColor = this.color
            this.lowerName.fontColor = container.color
            this.lowerName.text = this.lowerText
            this.lowerName.render()
        }
    }

    /** 
     * renders the score value inside the vitual ScoreButton view 
     */
    renderScore(scoretext: string, available: boolean) {
        let scoreBoxColor = (available) ? 'blue' : this.color
        if (scoretext === '') {
            scoreBoxColor = this.color
        }
        if (this.scoreBox) {
            this.scoreBox.fontColor = container.color
            this.scoreBox.fillColor = scoreBoxColor
            this.scoreBox.text = scoretext
            this.scoreBox.render()
        }
    }
}


import { ON, Event, Fire } from '../framework/model/events.js'
import { Geometry, View } from '../types.js'
import { ctx } from './container.js'

/** 
 * a class that creates instances of virtual Die    
 *  elements that are to be rendered to a canvas
 */
export default class Die implements View {

    id: number = 0 // assigned by activeViews.add()    
    index: number = 0
    activeView = true
    zOrder: number = 0 // assigned by activeViews.add()
    name: string
    enabled: boolean = true
    hovered: boolean = false
    selected: boolean = false
    path: Path2D
    geometry: Geometry

    color: string
    frozen: boolean = false
    value: number = 0
    static frozenFaces: ImageData[]
    static faces: ImageData[]

    constructor(index: number, name: string, geometry: Geometry, path: Path2D) {

        this.index = index
        this.name = name
        this.enabled = true
        this.geometry = geometry
        this.color = 'transparent'

        this.path = path
        this.render({ value: 0, frozen: false })

        ////////////////////////////////\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\
        //                         bind events                       \\
        ////////////////////////////////\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\

        ON(Event.UpdateDie + this.index, (state: {frozen: boolean, value: number}) => {
                this.frozen = state.frozen
                this.value = state.value
                this.render(state)
            })
    }

    touched() {
        // inform Dice with index data
        Fire(Event.DieTouched,{ index: this.index.toString() })
    }

    update() {
        this.render({ frozen: this.frozen, value: this.value })
    }

    render(state: { frozen: boolean, value: number }) {

        const image = (state.frozen) ? Die.frozenFaces[state.value] : Die.faces[state.value]
        ctx.putImageData(image, this.geometry.left, this.geometry.top)

        ctx.save()
        ctx.lineWidth = 2
        ctx.strokeStyle = (this.hovered) ? 'orange' : 'white'
        ctx.stroke(this.path)
        ctx.restore()

    }
}

/** 
 * A set of Die face images 
 */
Die.faces = [
    new ImageData(1, 1),
    new ImageData(1, 1),
    new ImageData(1, 1),
    new ImageData(1, 1),
    new ImageData(1, 1),
    new ImageData(1, 1)
]

/** 
 * A set of frozen Die face images 
 */
Die.frozenFaces = [
    new ImageData(1, 1),
    new ImageData(1, 1),
    new ImageData(1, 1),
    new ImageData(1, 1),
    new ImageData(1, 1),
    new ImageData(1, 1)
]

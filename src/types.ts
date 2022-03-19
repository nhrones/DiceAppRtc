
/** 
 * ScoringMessage type 
 */
export type ScoringMessage = { 
    index: number,
    owner: number, 
    value: number 
}

export type signalData = Object | string[] | string

export type Die = {
    value: number
    frozen: boolean
}

/** 
 * View interface 
 */
export interface View {
    activeView: boolean
    index: number
    zOrder: number
    name: string
    geometry: Geometry
    enabled: boolean
    hovered: boolean
    selected: boolean
    path: Path2D

    update(): void
    render(state?: any): void
    /** called by the view container when this element has been touched */
    touched(): void
}

/** 
 * a type used to contain the values required    
 * to build (hydrate) an `ActiveView` object 
 */
export type ElementDescriptor = {
    kind: string
    id: string
    idx: number | null
    pathGeometry: Geometry
    renderAttributes: RenderAttributes
}

/** 
 * A type used to contain a set of optional rendering attributes.   
 * These are used to configure a rendering context   
 * strokeColor, fillColor, fontColor, fontSize, borderWidth, text
 */
export type RenderAttributes = {
    strokeColor?: string
    color?: string
    fontColor?: string
    fontSize?: string
    borderWidth?: number
    text?: string
    isLeft?: boolean
}

/** 
 * A type that prescribes the geometry used   
 * to locate and size a Path2D object.      
 * (used to render and hit-test a unique shape on a canvas)
 */
export type Geometry = {
    left: number
    top: number
    width: number
    height: number
    radius?: number
}

/** 
 * A type that describes a Player object. 
 */
export type Player = {
    id: string
    idx: number
    playerName: string
    color: string
    score: number
    lastScore: string
}

/** 
 * A type that describes the state of a label object. 
 */
export const LabelState = {
    Normal: 0,
    Hovered: 1,
    HoveredOwned: 2,
    Reset: 3 
}

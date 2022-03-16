

export const ICEconfiguration = {
    iceServers: [{
        urls: [
            "stun:stun1.l.google.com:19302",
            "stun:stun2.l.google.com:19302"
        ]
    }]
}

/** 
 * signal event message list 
 */
 export enum sigMessage {
    RegisterPlayer = 0, // signaling: 86, players: 33
    RemovePlayer = 1,   // players: 76, server::signaler: 80
    ResetGame = 2,      // diceGame: 72, 78
    ResetTurn = 3,      // diceGame: 66, scoreElement: 66
    ShowPopup = 4,      // diceGame: 195, popup : 66
    UpdateRoll = 5,     // rollButton: 17, 22
    UpdateScore = 6,    // webRTC: 160, scoreElement: 64
    UpdateDie = 7,      // dice: 65, 71
    UpdatePlayers = 8,  // players: 41, 45
    SetID = 9,          // app: 22
    GameFull = 10,      // app: 29
}

/** 
 * WebRTC signal eventlist 
 */
 export enum rtcMessage {
    Bye = 11,
    RtcOffer = 12,
    RtcAnswer = 13,
    candidate = 14,
    invitation = 15
}

/** 
 * SignalingMessage type 
 */
export type SignalingMessage = { 
    topic: sigMessage | rtcMessage, 
    data: RTCSessionDescriptionInit | RTCIceCandidateInit | object | string[] | string, 
}

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

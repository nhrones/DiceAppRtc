
/*signal event message list 
    RegisterPlayer  signaling: 86, players: 33
    RemovePlayer    players: 76, server::signaler: 80
    ResetGame       diceGame: 72, 78
    ResetTurn       diceGame: 66, scoreElement: 66
    ShowPopup       diceGame: 195, popup : 66
    UpdateRoll      rollButton: 17, 22
    UpdateScore     webRTC: 160, scoreElement: 64
    UpdateDie       dice: 65, 71
    UpdatePlayers   players: 41, 45
    SetID           app: 22
    GameFull        app: 29
*/

/** 
 * SignalingMessage type 
 */
 export type SignalingMessage = { 
    event:  string, 
    data: RTCSessionDescriptionInit | RTCIceCandidateInit | object | string[] | string, 
}

/**
 * SSE ReadyState
 */
 export const SSE = {
    CONNECTING: 0,
        OPEN: 1,
    CLOSED: 2
}
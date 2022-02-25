import { Event, Fire } from '../model/events.js'
import * as webRTC from './webRTC.js'
import { DEBUG, SignalingMessage } from '../../types.js'

/** 
 * Each Map-entry holds an array of callback functions mapped to a topic ID 
 */
const subscriptions = new Map<number, Function[]>()

/**
 * array of scoring transactions
 */
const transactions: SignalingMessage[] = []

/** 
 * this clients WebSocket connection to the server 
 */
export let socket: WebSocket | null = null

/** 
 * Initializes this websocket service event listeners 
 */
export const initialize = (serverURL: string) => {
    if (DEBUG) console.log('initializing socket at: ', serverURL)
    // if we've already initialized just return
    if (socket) { return }

    // close the socket when the window closes
    //window.onbeforeunload = () => {
    window.addEventListener('beforeunload', () => {
        if (socket) {
            // disable onclose handler first
            socket.onclose = function () { };
            socket.close(1001, 'Client tab closed!')
        }
    })

    // instantiate a new WebSocket listener
    socket = new WebSocket(serverURL)

    socket.onopen = () => {
        if (DEBUG) console.log('signaling.socket.opened!');
        webRTC.initialize()
        webRTC.start()
    }

    // handle the socket close event
    socket.onclose = (ev: CloseEvent) => {
        const { code, reason, wasClean } = ev;
        if (DEBUG) { console.log(`Peer was closed! code: ${code}, reason: ${reason} wasClean? ${wasClean}`); }
    }

    socket.addEventListener('error', (err) => {
        if (DEBUG) console.error('Socket.error!', err);
        Fire(Event.ShowPopup, { message: `Game Full! Please close tab!` })
    })

    if (DEBUG) console.log(`connected to: ${serverURL}`)

    // set up a `message` event handler for this connection
    socket.addEventListener('message', (msg: MessageEvent) => {
        if (DEBUG) console.info('socket recieved message.data: ', msg.data)
        const payload = JSON.parse(msg.data)
        const topic = payload[0]
        if (DEBUG) console.info('socket recieved topic: ', message[topic])
        dispatch(topic, payload[1])
    })
}

/**
 * disconnect
 */
export const disconnect = () => {
    console.log('Disconnecting socket')
    socket.close(1000, 'WebRtc connected! No longer needed!')
}

/** 
 * Notify any listening peers ... we're registering as a new player    
 * called from app.ts line# 15 
 */
export const registerPlayer = (id: string, name: string, table: number, seat: number) => {
    // At this point, we don't know our peer.
    // Since we're registering, we'll expect to recieve a 'PlayerUpdate' response
    //TODO send direct and unconditional to the signal-server
    socket.send(JSON.stringify([message.RegisterPlayer, { id: id, name: name, table: table, seat: seat }]))
    //sendSignal(message.RegisterPlayer, { id: id, name: name, table: table, seat: seat })
}

/** 
 * Dispatches a message event to all registered listeners with optional data     
 * Called from both `socket.onmessage` and from WebRTC.`dataChannel.onmessage`. 	  
 * @example dispatch( message.ResetTurn, {currentPlayerIndex: 1} )    
 * @param(string) topic - the topic of interest
 * @param(string | object) - data - optional data to report to subscribers
 */
export const dispatch = (topic: message, data: string | string[] | object) => {
    if (subscriptions.has(topic)) {
        const subs = subscriptions.get(topic)!
        if (subs) {
            for (const callback of subs) {
                callback(data != undefined ? data : {})
            }
        }
    }
}

/**
 *  registers a callback function to be executed when a topic is published
 *	@example onSignalRecieved(message.ResetTurn, this.resetTurn)
 *	@param(string) topic - the topic of interest
 *	@param(function) listener - a callback function
 */
export const onSignalRecieved = (topic: number, listener: Function) => {
    if (!subscriptions.has(topic)) {
        subscriptions.set(topic, [])
    }
    const callbacks = subscriptions.get(topic)!
    callbacks.push(listener)
}

/**
 *  sends a message to the server to be broadcast to subscribers
 *	@param(string) topic - the topic of interest
 *	@param(object) data - the data object to send
 */
export const sendSignal = (
    topic: message | webRTC.message,
    data: RTCSessionDescriptionInit | RTCIceCandidateInit | object | string) => {
    const msg = JSON.stringify([topic, data])
    if (webRTC.dataChannel && webRTC.dataChannel.readyState === 'open') {
        if (DEBUG) console.log('DataChannel >> :', msg)
        webRTC.dataChannel.send(msg)
    } else if (socket.readyState === WebSocket.OPEN) {
        //todo don't send unnessary messages if 
        // only one player (solitare)
        if (DEBUG) console.log('socket >> :', msg)
        socket.send(msg)
    } else {
        console.error('No place to send:', msg)
    }
}

/** 
 * signal event message list 
 */
export enum message {
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
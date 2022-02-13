 
import { Event, Fire } from './events.js'
import * as webRTC from './webRTC.js'
import { DEBUG, SignallingMessage } from '../../types.js'

/** 
 * Each Map-entry holds an array of callback functions mapped to a topic name 
 */
const subscriptions = new Map<number, Function[]>()

/**
 * array of scoring transactions
 */
const transactions: SignallingMessage[] = []

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
    window.onbeforeunload = () => {
        if (socket) {
            // disable onclose handler first
            socket.onclose = function () { };
            socket.close()
        }
    };

    // instantiate a new WebSocket listener
    socket = new WebSocket(serverURL)

    socket.onopen = () => {
        if (DEBUG) console.log('signalling.socket.opened!');
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
 * Notify the server ... we're registering as a new player    
 * called from app.ts line# 15 
 * */
export const registerPlayer = (id: string, name: string) => {
    // At this point, we don't know our peer.
    // Since we're registering, we wait for a 'PlayerUpdate' response
    // from the  player that currently has 'focus'
    sendSignal(message.RegisterPlayer,[id, name])
}

/** 
 * Dispatches a message event to all registered listeners with optional data     
 * Called from both `socket.onmessage` and from WebRTC.`dataChannel.onmessage`. 	  
 * @example dispatch( "GameOver", winner )    
 * @param topic {string} the topic of interest
 * @param data {string | object} optional data to report to subscribers
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
 *	@param topic {string} the topic of interest
 *	@param listener {function} a callback function
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
 *	@param {string} topic - the topic of interest
 *	@param {object} data - the data object to send
 */
 export const sendSignal = (topic: message, data: RTCSessionDescriptionInit | RTCIceCandidateInit | object | string) => {   
    const msg = JSON.stringify( [ topic, data ] )
    if (webRTC.dataChannel && webRTC.dataChannel.readyState === 'open') {
        if (DEBUG) console.log('broadcast on DataChannel:', msg)
        webRTC.dataChannel.send(msg)
    } else if (socket) {
        if (DEBUG) console.log('broadcast on WebSocket:', msg)
        socket.send(msg)
    } else {
        if (DEBUG) console.error('No place to send:', msg)
    }
}

/** 
 * signal event message list 
 */
export enum message {
    
    /* game events */
    RegisterPlayer, // socket.js:69
    RemovePlayer, // players.js:
    ResetGame, // diceGame.js:30
    ResetTurn, // diceGame.js:24
    ShowPopup, // popup.js:30
    UpdateRoll, // rollButton.js:13
    UpdateScore, // scoreElement.js:31
    UpdateDie, // dice.js:32
    UpdatePlayers, // players.js:17
    SetID, // app.js:5
    GameFull, // app.js 29
    
    /* WebRTC events*/
    Bye,
    RtcOffer,
    RtcAnswer,
    candidate,
    invitation
}
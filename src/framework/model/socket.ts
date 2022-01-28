
import * as main from './webRTC.js'
import { DEBUG, callbackFunc, SignallingMessage } from '../../types.js'
import * as events from '../model/events.js'
 
const {
    topic: _,
    broadcast: fireEvent,
} = events

/** Each Map-entry holds an array of callback functions mapped to a topic name */
const subscriptions = new Map<string, callbackFunc[]>()

/** this clients WebSocket connection to the server */
export let socket: WebSocket | null = null

/** Initializes this websocket service event listeners */
export const initialize = (serverURL: string) => {

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
        main.initialize()
        main.start()
    }

    // handle the socket close event
    socket.onclose = (ev: CloseEvent) => {
        const { code, reason, wasClean } = ev;
        if (DEBUG) { console.log(`Peer was closed! code: ${code}, reason: ${reason} wasClean? ${wasClean}`); }
    }

    socket.addEventListener('error', (err) => {
        if (DEBUG) console.error('Socket.error!', err);
        fireEvent(_.ShowPopup, { message: `Game Full! Please close tab!` })
    })

    if (DEBUG) console.log(`connected to: ${serverURL}`)

    // set up a `message` event handler for this connection
    socket.addEventListener('message', (message: MessageEvent) => {
        const { topic, data } = JSON.parse(message.data)
        dispatch(topic, data)
    })
}

/** Notify the server ... we're registering as a new player    
 * called from app.ts line# 15 
 * */
export const registerPlayer = (id: string, name: string) => {
    // At this point, we don't know our peer.
    // Since we're registering, we wait for a 'PlayerUpdate' response
    // from the  player that currently has 'focus'
    broadcast(
        {
            topic: topic.RegisterPlayer,
            data: { id: id, name: name }
        }
    )
}

/** Dispatches an event topic message to all registered listeners with optional data    
 *	
 *@example WSC.dispatch( "GameOver", winner )    
 *@param topic {string} the topic of interest
 *@param data {string | object} optional data to report to subscribers
 */
export const dispatch = (topic: string, data: string | object) => {
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
 *  registers a callback function to be executed 'when' a topic is published
 *	@example Socket.when("GameOver", Game.resetGame)
 *	@param topic {string} the topic of interest
 *	@param listener {function} a callback function
 */
export const when = (topic: string, listener: callbackFunc) => {
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
export const broadcast = (message: SignallingMessage) => {
    const msg = JSON.stringify(message)
    if (main.dataChannel && main.dataChannel.readyState === 'open') {
        console.log('broadcast on DataChannel:', msg)
        main.dataChannel.send(msg)
    } else if (socket) {
        console.log('broadcast on WebSocket:', msg)
        socket.send(msg)
    } else {
        console.error('No place to send:', msg)
    }
}

/** exported socket event topics list */
export const topic = {

    /* game events */
    RegisterPlayer: 'RegisterPlayer', // socket.js:69
    RemovePlayer: 'RemovePlayer', // players.js:
    ResetGame: 'ResetGame', // diceGame.js:30
    ResetTurn: 'ResetTurn', // diceGame.js:24
    ShowPopup: 'ShowPopup', // popup.js:30
    UpdateRoll: 'UpdateRoll', // rollButton.js:13
    UpdateScore: 'UpdateScore', // scoreElement.js:31
    UpdateDie: 'UpdateDie', // dice.js:32
    UpdatePlayers: 'UpdatePlayers', // players.js:17
    SetID: "SetID", // app.js:5
    GameFull: "GameFull", // app.js 29

    /* WebRTC events*/
    bye: 'bye',
    RtcOffer: 'RtcOffer',
    RtcAnswer: 'RtcAnswer',
    candidate: 'candidate',
    connectOffer: 'connectOffer'
}

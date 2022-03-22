
import {
    initPeers, 
    Emoji, 
    callee, 
    registerPeer
} from './peers.js'

import * as webRTC from './webRTC.js'

const DEBUG = true

 // set the correct url for our signal-service
const host = window.location.hostname
const SignalServerURL = 'https://rtc-signal-server.deno.dev'
export const serviceURL = (host === '127.0.0.1' || host === 'localhost')
    ? 'http://localhost:8000'
    : SignalServerURL
console.log('serviceURL', serviceURL)


/**  Each Map-entry holds an array of callback functions mapped to an Event name */
const subscriptions = new Map<number | string, Function[]>()

/** sse - Server Sent Events listener    
 * An EventSource instance opens a persistent     
 * connection to an HTTP server, which sends events     
 * in text/event-stream format. The connection remains     
 * open until closed by calling EventSource.close(). */
export let sse: EventSource


/** Initializes this signal service event listeners */
export const initialize = (name: string, id: string, emoji = Emoji[0]) => {
    
    // if we've already initialized just return
    if (sse) { return }
    
    // setup peers
    initPeers(id, name)
    
    // close the sse when the window closes
    window.addEventListener('beforeunload', () => {
        if (sse.readyState === SSE.OPEN) {
            const sigMsg = JSON.stringify({
                    from: callee.id,
                    event: 'close',
                    data: callee.id + ' window was closed!',
                    id: 0
                })
            fetch(serviceURL, {
                method: "POST",
                body: sigMsg
            })
        }
    })

    sse = new EventSource(serviceURL + '/listen/' + id)

    sse.onopen = () => {
        if (DEBUG) console.log('Sse.onOpen! >>>  webRTC.start()');
        webRTC.initialize()
    }

    // this is most always peer-count exceeded!
    sse.onerror = (err) => {
        if (DEBUG) console.error('sse.error!', err);
        dispatch('ShowPopup', `Seats Full! Please close tab!`)
    }

    sse.onmessage = (msg: MessageEvent) => {
        if (DEBUG) console.log('<<<<  signaler got  <<<<  ', msg.data)
        const msgObject = JSON.parse(msg.data)
        if (DEBUG) console.info('      parsed data = ', msgObject)
        const event = msgObject.event
        if (DEBUG) console.info('               event: ', event)
        dispatch(event, msgObject.data)
    }

    // SetID-Event listener. 
    // On connect, the signal-service will send our new ID.
    sse.addEventListener('SetID', (ev: MessageEvent) => {
        const msgObject = JSON.parse(ev.data)
        const { data } = msgObject
        registerPeer( data.id, callee.name )
        // dispatch this event to any subscribers     
        dispatch('SetID', { id: data.id, name: callee.name })
        webRTC.start()
    })
}

/** report the current `readyState` of the connection */
export const getState = (msg: string) => {
    if (sse.readyState === SSE.CONNECTING) console.log(msg + ' - ' + 'SSE-State - connecting')
    if (sse.readyState === SSE.OPEN) console.log(msg + ' - ' + 'SSE-State - open')
    if (sse.readyState === SSE.CLOSED) console.log(msg + ' - ' + 'SSE-State - closed')
}

/** disconnect - Stop the event stream from the client, 
 * we simply invoked the close() method of the eventSource object. 
 * Closing the event stream on the client doesn't automatically 
 * closes the connection on the server side. Unfortunately, 
 * the server will continue to send events to the client. 
 * To avoid this, we'll need to add an event handler for 
 * the close event on the server. */
export const disconnect = () => {
    // closes the connection from the client side
    sse.close()
    getState('Disconnecting streamedEvents!')
}

/** Dispatch a message event to all registered listeners with optional data      	  
 * @example dispatch('ResetTurn', {currentPeerIndex: 1} )    
 * @param event (string) - the event of interest
 * @param data (string | string[] | object) - optional data to report to subscribers
 */
export const dispatch = (event: string, data: string | string[] | object) => {
    if (subscriptions.has(event)) {
        const subs = subscriptions.get(event)!
        if (subs) {
            for (const callback of subs) {
                callback(data != undefined ? data : {})
            }
        }
    }
}

/** registers a callback function to be executed when a event is published
 *	@example onEvent('ResetTurn', this.resetTurn)
 *	@param event (string) - the event of interest
 *	@param listener (function) - a callback function */
export const onEvent = (event: number | string, listener: Function) => {
    if (!subscriptions.has(event)) { subscriptions.set(event, []) }
    const callbacks = subscriptions.get(event)!
    callbacks.push(listener)
}

/** Sends a message to the signal service to be broadcast to peers
 *	@param msg (SignalingMessage) - contains both `event` and `data` */
export const signal = (msg: SignalingMessage) => {
    if (sse.readyState === SSE.OPEN) {
        const sigMsg = JSON.stringify({ from: callee.id, event: msg.event, data: msg.data })
        if (DEBUG) console.log('>>>>  sig-server  >>>> :', sigMsg)
        fetch(serviceURL, {
            method: "POST",
            body: sigMsg
        })
    } else {
        if (DEBUG) {
            console.error('No place to send the message:', msg.event)
        }
    }
}

/** SSE ReadyState */
export const SSE = {
    CONNECTING: 0,
    OPEN: 1,
    CLOSED: 2
}

/** SignalingMessage type */
export type SignalingMessage = {
    event: string,
    data: RTCSessionDescriptionInit | RTCIceCandidateInit | object | string[] | string,
}
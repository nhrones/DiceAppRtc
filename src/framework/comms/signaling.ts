import { SignalingMessage, sigMessage, rtcMessage } from '../../types.js'
import { Event, Fire } from '../model/events.js'
import * as webRTC from './webRTC.js'
import { DEBUG, SSEReadyState } from '../../constants.js'
import * as Players from '../../model/players.js'
import { game } from '../../model/diceGame.js';


export let thisID = 'Player1'



/** 
 * Each Map-entry holds an array of callback functions mapped to a topic ID 
 */
const subscriptions = new Map<number, Function[]>()

/** 
 * this clients WebSocket connection to the server 
 */
export let sse: EventSource


/** 
 * Initializes this websocket service event listeners 
 */
export const initialize = (name: string, id: string) => {
    // if we've already initialized just return
    if (sse) { return }

    // close the sse when the window closes
    window.addEventListener('beforeunload', () => {
        disconnect()
    })

    /** 
     * instantiate a new SSE listener
     * An EventSource instance opens a persistent 
     * connection to an HTTP server, which sends events 
     * in text/event-stream format. The connection remains 
     * open until closed by calling EventSource.close().
     * 
     * The Fetch API offers a concrete instance of a 
     * ReadableStream through the body property of 
     * a Response object.
    */
    sse = new EventSource('http://localhost:8000/listen/' + id)

    sse.onopen = () => {
        if (DEBUG) console.log('Sse.onOpen! >>>  webRTC.start()');
        webRTC.initialize()
    }

    sse.onerror = (err) => {
        if (DEBUG) console.error('sse.error!', err);
        Fire(Event.ShowPopup, { message: `Game Full! Please close tab!` })
    }

    // set up a `message` event handler for this connection
    sse.onmessage = (msg: MessageEvent) => {
        if (DEBUG) console.log('>>>>>>>  signaler recieved  >>>>>>>>  ', msg.data)
        const msgObject = JSON.parse(msg.data)
        if (DEBUG) console.info('      parsed data = ', msgObject)
        const topic = msgObject.topic
        let topicName = (topic > 10) ? rtcMessage[topic] : sigMessage[topic]
        if (DEBUG) console.info('               topic: ', topicName) // show the topic name
        dispatch(topic, msgObject.data)
    }

    // dedicated listener for the SetID event
    //Once we connect with the server, it will send our new peer 'ID'
    sse.addEventListener('SetID', (ev: MessageEvent) => {
        const msgObject = JSON.parse(ev.data)
        const { data } = msgObject
        dispatch(msgObject.topic, msgObject.data)
        console.log('on.SetID - data type = ' + (typeof data) + ' id ' + data.id)
        thisID = data.id
        Players.thisPlayer.id = data.id
        Players.thisPlayer.playerName = name

        console.info('Players.thisPlayer:', Players.thisPlayer)
        Players.setThisPlayer(Players.thisPlayer)
        Players.setCurrentPlayer(Players.thisPlayer)
        // now that we have a unique ID, 
        // we'll register our self with all other peers
        registerPlayer(data.id, name)
        Players.addPlayer(data.id, name)
        webRTC.start()
        if (game) { game.resetGame() }
    })
    
    sse.addEventListener('GameIsFull', (ev: MessageEvent) => {
        const msg = `Sorry! This game is full!
    Please close the tab/window! 
    Try again in a minute or two!`
        if (DEBUG) console.log(msg)
        alert(msg);
    
        // close this tab/window
        self.opener = self;
        self.close();
    })

}

/**
 * SSE ReadyState
 */
export const state = {
    connecting: 0,
    open: 1,
    closed: 2
}

export const getState = (msg: string) => {
    if (sse.readyState === state.connecting) console.log(msg + ' - ' + 'SSE-State - connecting')
    if (sse.readyState === state.open) console.log(msg + ' - ' + 'SSE-State - open')
    if (sse.readyState === state.closed) console.log(msg + ' - ' + 'SSE-State - closed')
}

/**
 * disconnect
 * To stop the event stream from the client, we simply 
 * invoked the close() method of the eventSource object. 
 * Closing the event stream on the client doesn't automatically 
 * closes the connection on the server side. Unfortunately, 
 * the server will continue to send events to the client. 
 * To avoid this, we'll need to add an event handler for 
 * the close event on the server.
 */
export const disconnect = () => {
    // closes the connection from the client side
    sse.close()
    getState('Disconnecting streamedEvents!')
}

/** 
 * Notify any listening peers ... we're registering as a new player    
 * called from app.ts line# 15 
 */
export const registerPlayer = (id: string, name: string) => {
    // At this point, we don't know our peer.
    // Since we're registering, we'll expect to recieve a 'PlayerUpdate' response
    const regObj = {
        from: id,
        topic: sigMessage.RegisterPlayer,
        data: { id: id, name: name }
    }
    const msg = JSON.stringify(regObj)
    console.log('Step-6 - POST registeringPlayer >>> ', msg)
    fetch("http://localhost:8000/send", {
        method: "POST",
        body: msg
    })
}

/** 
 * Dispatches a message event to all registered listeners with optional data     
 * Called from both `socket.onmessage` and from WebRTC.`dataChannel.onmessage`. 	  
 * @example dispatch( message.ResetTurn, {currentPlayerIndex: 1} )    
 * @param topic (message) - the topic of interest
 * @param data (string | string[] | object) - optional data to report to subscribers
 */
export const dispatch = (topic: sigMessage, data: string | string[] | object) => {
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
 *	@param topic (string) - the topic of interest
 *	@param listener (function) - a callback function
 */
export const onSignalRecieved = (topic: number, listener: Function) => {
    if (!subscriptions.has(topic)) {
        subscriptions.set(topic, [])
    }
    const callbacks = subscriptions.get(topic)!
    callbacks.push(listener)
}

/**
 *  Sends a message to either the signally service 
 *  or, to the DataChannel to be broadcast to peers
 *	@param msg (SignalingMessage) - both `topic` and `data`
  */
export const sendSignal = (msg: SignalingMessage) => {
    if (webRTC.dataChannel && webRTC.dataChannel.readyState === 'open') {
        //TODO Why are we using an array here??
        // just use a SignalingMessage object {topic,data}
        const webRTCmsg = JSON.stringify(msg)
        if (DEBUG) console.info('Sending to DataChannel >> :', webRTCmsg)
        webRTC.dataChannel.send(webRTCmsg)
    } else if (sse.readyState === SSEReadyState.OPEN) {
        // only send WebRtc negotiation messages as we're still alone
        //if (msg.topic > 7) {
        const sigMsg = JSON.stringify({ from: thisID, topic: msg.topic, data: msg.data })
        if (DEBUG) console.log('Sending to sig-server >>> :', sigMsg)
        fetch("http://localhost:8000/send", {
            method: "POST",
            body: sigMsg
        })
        //}
    } else {
        console.error('No place to send the message:', msg.topic)
    }
}


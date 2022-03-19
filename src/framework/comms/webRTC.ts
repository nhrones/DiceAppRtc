
import { ReadyState } from './RTClib.js'
import { SignalingMessage } from './SIGlib.js'
import { dispatch, onEvent, sendSSEmessage } from './signaling.js'
import { DEBUG } from '../../constants.js'
import { Event, Fire } from '../model/events.js'
import { players, removePlayer } from '../../model/players.js'


/** 
 * The RTCDataChannel API enables peer-to-peer exchange of data 
 */
export let peerConnection: RTCPeerConnection;
export let dataChannel: RTCDataChannel;
export let RTCopen = false

/**
 * initialize a WebRtc signaling session
 */
export const initialize = () => {

    // handle a Session-Description-Offer 
    // param {RTCSessionDescriptionInit} offer - {event: string, sdp: string}
    onEvent('RtcOffer', async (offer: RTCSessionDescriptionInit) => {
        //todo move external
        console.info('offer: ', offer)
        if (peerConnection) {
            if (DEBUG) console.error('existing peerconnection');
            return;
        }
        createPeerConnection(false);
        await peerConnection.setRemoteDescription(offer);
        const answer = await peerConnection.createAnswer();
        sendSSEmessage({event: 'RtcAnswer', data:{ type: 'answer', sdp: answer.sdp }});

        // Note that RTCPeerConnection won't start gathering 
        // candidates until setLocalDescription() is called.
        await peerConnection.setLocalDescription(answer);
    })

    // handle a Session-Description-Answer 
    // @param(RTCSessionDescriptionInit) answer - {type: string, sdp: string}
    onEvent('RtcAnswer', async (answer: RTCSessionDescriptionInit) => {
        if (!peerConnection) {
            if (DEBUG) console.error('no peerconnection');
            return;
        }
        await peerConnection.setRemoteDescription(answer);
    })

    // handle ICE-Candidate
    // param(RTCIceCandidateInit) candidate - RTCIceCandidateInit
    onEvent('candidate', async (candidate: RTCIceCandidateInit) => {
        if (!peerConnection) {
            if (DEBUG) console.error('no peerconnection');
            return;
        }
        if (!candidate.candidate) {
            await peerConnection.addIceCandidate(null);
        } else {
            await peerConnection.addIceCandidate(candidate);
        }
    })

    onEvent('Bye', () => {
        if (peerConnection) {
            peerConnection.close();
            peerConnection = null
        }
    })

    // A peer is offering to connect
    onEvent('invitation', (_data: any) => {
        // I'll initiate an RTC-connection 
        // unless I'm engaged already.
        if (peerConnection) {
            if (DEBUG) console.log(`Already connected with Player2, ignoring 'connectOffer'!`);
            return;
        }
        if (DEBUG) console.log(`player2 has sent me a 'connectOffer'!  I'm making the RTC-connection!`);
        // start the RTC-connection
        makeConnection();
    })
}

/** 
 * Start the peerConnection process by signaling an invitation 
 */
export const start = () => {
    // restart the signaler then wait for an `accept invitation`
    sendSSEmessage({event: 'invitation', data: {}});
} 

/** 
 * Resets the peerConnection and dataChannel, and calls 'start()' 
 */
const reset = (msg: string) => {
    dataChannel = null
    peerConnection = null
    start()
    removePlayer([...players][1].id)
    Fire(Event.ShowPopup, { message: msg })
}

/** 
 * creates a peer connection 
 * @param(boolean) isOfferer - are we making the offer?     
 *   true when called by makeConnection() - we are sending an offer    
 *   false when called from signaler.when('RtcOffer') - someone else sent us an offer
 */
function createPeerConnection(isOfferer: boolean) {
    if (DEBUG) console.log('Starting WebRTC as', isOfferer ? 'Offerer' : 'Offeree');
    peerConnection = new RTCPeerConnection({
        iceServers: [{
            urls: [
                "stun:stun1.l.google.com:19302",
                "stun:stun2.l.google.com:19302"
            ]
        }]
    });

    // local ICE layer passes candidates to us for delivery 
    // to the remote peer over the signaling channel
    peerConnection.onicecandidate = (event: RTCPeerConnectionIceEvent) => {
        const init: RTCIceCandidateInit = {
            candidate: null,
            sdpMid: "",
            sdpMLineIndex: 0
        };
        if (event.candidate) {
            init.candidate = event.candidate.candidate;
            init.sdpMid = event.candidate.sdpMid;
            init.sdpMLineIndex = event.candidate.sdpMLineIndex;
        }
        // sent over the signaler to the remote peer.
        sendSSEmessage({event: 'candidate', data: init});
    };

    // creating data channel 
    if (isOfferer) {
        if (DEBUG) console.log('Offerer -> creating dataChannel!');
        // createDataChannel is a factory method on the RTCPeerConnection object
        dataChannel = peerConnection.createDataChannel('chat');
        setupDataChannel();
    } else {
        // If peer is not the offerer, wait for 
        // the offerer to pass us a DataChannel
        peerConnection.ondatachannel = (event) => {
            if (DEBUG) console.log('peerConnection.ondatachannel -> creating dataChannel!');
            dataChannel = event.channel;
            setupDataChannel();
        }
    }
}

// Hook up data channel event handlers
function setupDataChannel() {
    checkDataChannelState();
    dataChannel.onopen = checkDataChannelState;
    dataChannel.onclose = checkDataChannelState;
    
    // NOTE: dataChannel and signaler both call signaler.dispatch
    // as game-state events can come from either
    dataChannel.onmessage = (ev: MessageEvent<any>) => { 
        const msg = JSON.parse(ev.data)
        const {event, data} = msg
        if (DEBUG) console.info('DataChannel recieved event: ', event)
        dispatch(event, data)
    }
}

function checkDataChannelState() {
    if (dataChannel.readyState === ReadyState.open) {
        if (RTCopen === false) {
            RTCopen = true
            updateUI({ content: `Player1 is now connected to Player2`, clearContent: true });
        }
    } else if (dataChannel.readyState === ReadyState.closed) {
        if (RTCopen === true) {
            RTCopen = false
            // reset everything and restart
            reset('Player2 has disconnected!')
        }
    }
}

export async function makeConnection() {
    createPeerConnection(true);
    const offer = await peerConnection.createOffer();
    sendSSEmessage({event: 'RtcOffer', data: { type: 'offer', sdp: offer.sdp }});
    // Note that RTCPeerConnection won't start gathering 
    // candidates until setLocalDescription() is called.
    await peerConnection.setLocalDescription(offer);
}

// Finaly ... tell them your listening/waiting
updateUI({ content: `Player1 is waiting for a connection from: ${location.origin}` });

//todo do-UI, use popup?
function updateUI(msg: { content: string, clearContent?: boolean }) {
    if (DEBUG) console.log(msg.content)
}


/**
 *  Send an RtcDataChannel message to the peer
 *	@param msg (SignalingMessage) - both `event` and `data`
  */
 export const sendSignal = (msg: SignalingMessage) => {
    if (dataChannel && dataChannel.readyState === 'open') {
        const jsonMsg = JSON.stringify(msg)
        if (DEBUG) console.info('Sending to DataChannel >> :', jsonMsg)
        dataChannel.send(jsonMsg)
    } else {
        console.error('No place to send the message:', msg.event)
    }
}
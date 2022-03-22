
import { 
    Peer, 
    callee, 
    caller, 
    setCaller
}  from './peers.js'

import { 
    dispatch, 
    onEvent, 
    signal, 
    SignalingMessage  
} from './signaling.js'

const DEBUG = true

///////////////////////////////////////////////////////////////////
// The RTCDataChannel API enables peer-to-peer exchange of data  //
///////////////////////////////////////////////////////////////////

export let peerConnection: RTCPeerConnection;
export let dataChannel: RTCDataChannel;
export let RTCopen = false

/** initialize a WebRtc signaling session */
export const initialize = () => {

    // handle a Session-Description-Offer 
    onEvent('RtcOffer', async (data: {from: Peer, data: RTCSessionDescriptionInit}) => {
        // a callee sent us an offer, lets set the caller
        setCaller( data.from)
        if (peerConnection) {
            if (DEBUG) console.error('existing peerconnection');
            return;
        }
        createPeerConnection(false);
        await peerConnection.setRemoteDescription(data.data);
        const answer = await peerConnection.createAnswer();
        signal({event: 'RtcAnswer', data:{ type: 'answer', sdp: answer.sdp }});

        // Note: the RTCPeerConnection won't start gathering 
        // candidates until setLocalDescription() is called.
        await peerConnection.setLocalDescription(answer);
    })

    // handle a Session-Description-Answer 
    onEvent('RtcAnswer', async (answer: RTCSessionDescriptionInit) => {
        if (!peerConnection) {
            if (DEBUG) console.error('no peerconnection');
            return;
        }
        await peerConnection.setRemoteDescription(answer);
    })

    // handle ICE-Candidate
    onEvent('candidate', async (candidate: RTCIceCandidateInit) => {
        if (!peerConnection) {
            if (DEBUG) console.error('no peerconnection');
            return;
        }
        console.log('handling candidate!')
        if (!candidate.candidate) {
            await peerConnection.addIceCandidate(null);
        } else {
            await peerConnection.addIceCandidate(candidate);
        }
    })

    onEvent('close', () => {
        if (peerConnection) {
            peerConnection.close();
            peerConnection = null
        }
    })

    // A peer is offering to connect
    onEvent('invitation', (data: any) => {
        // I'll initiate an RTC-connection unless I'm engaged already.
        if (peerConnection) {
            if (DEBUG) console.log(`Already connected, ignoring this 'invitation'!`);
            return;
        }
        // we got an invitation from a caller-peer
        setCaller(data)
        if (DEBUG) console.log(`A peer named ${data.name} has sent me an 'invitation'!  I'll make a  WebRTC-connection!`);
        // start the RTC-connection
        makeConnection();
    })
    
    // Finaly ... tell them your listening/waiting
    dispatch('UpdateUI', `⌛  ${callee.name} is waiting for a connection\n from: ${location.origin}`)
}

/** Start the peerConnection process by signaling an invitation */
export const start = () => {
    // invite any peer, then wait for an `accept` message
    console.info('inviting from start - callee:', callee)
    signal({event: 'invitation', data: callee});
} 

/** Resets the peerConnection and dataChannel, and calls 'start()' */
function reset (msg: string) {
    dataChannel = null
    peerConnection = null
    start()
    dispatch('ShowPopup', msg)
}

/** creates a new peer connection 
 * @param(boolean) isOfferor - are we making the offer?     
 *   true when called by makeConnection() - we are sending an offer    
 *   false when called from signaler.when('RtcOffer') - someone else sent us an offer */
function createPeerConnection(isOfferor: boolean) {
    if (DEBUG) console.log('Starting WebRTC as', isOfferor ? 'Offeror' : 'Offeree');
    peerConnection = new RTCPeerConnection({
        iceServers: [{urls: ["stun:stun1.l.google.com:19302","stun:stun2.l.google.com:19302"]}]
    });

    // local ICE layer passes `candidates` to us for delivery 
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
        // signal the remote peer.
        signal({event: 'candidate', data: init});
    };

    // creating data channel 
    if (isOfferor) {
        if (DEBUG) console.log('Offeror -> creating dataChannel!');
        // createDataChannel is a factory method on the RTCPeerConnection object
        dataChannel = peerConnection.createDataChannel('chat');
        setupDataChannel();
    } else {
        // If this peer is not the `offeror`, wait for 
        // the offeror to pass us a DataChannel
        peerConnection.ondatachannel = (event) => {
            if (DEBUG) console.log('peerConnection.ondatachannel -> creating dataChannel!');
            dataChannel = event.channel;
            setupDataChannel();
        }
    }
}

/** Hook up data channel event handlers */ 
function setupDataChannel() {
    //checkDataChannelState();
    dataChannel.onopen = checkDataChannelState;
    dataChannel.onclose = checkDataChannelState;
    
    // dataChannel and signaler both call signaler.dispatch
    // as game-state events can come from either
    dataChannel.onmessage = (ev: MessageEvent<any>) => { 
        const msg = JSON.parse(ev.data)
        const {event, data} = msg
        if (DEBUG) console.info('<<<<  DataChannel got  <<<<  ', event)
        dispatch(event, data)
    }
}

/** check the state of the DataChannel */
function checkDataChannelState() {
    if (dataChannel.readyState === ReadyState.open) {
        if (RTCopen === false) {
            RTCopen = true
            console.info('&&&&&&&&&&&&&&&&&&&&&&&&&&&&&caller:',caller)
            dispatch('UpdateUI', `${callee.name} is now connected to ${caller.name}`);
        }
    } else if (dataChannel.readyState === ReadyState.closed) {
        if (RTCopen === true) {
            RTCopen = false
            dispatch('PeerDisconnected', `${caller.name} has disconnected!`) 
            reset(`${caller.name} has disconnected!`)
        }
    }
}

export async function makeConnection() {
    createPeerConnection(true);
    const offer = await peerConnection.createOffer();
    signal({event:'RtcOffer', data: {from: callee, data:{ type: 'offer', sdp: offer.sdp }}});
    // Note that RTCPeerConnection won't start gathering 
    // candidates until setLocalDescription() is called.
    await peerConnection.setLocalDescription(offer);
}

/**
 *  Send an RtcDataChannel message to the peer
 *	@param msg (SignalingMessage) - both `event` and `data`
  */
 export const sendSignal = (msg: SignalingMessage) => {
    if (dataChannel && dataChannel.readyState === 'open') {
        const jsonMsg = JSON.stringify(msg)
        if (DEBUG) console.info('>>>>  DataChannel  >>>> :', jsonMsg)
        dataChannel.send(jsonMsg)
    } else {
        if (DEBUG) console.log('No place to send the message:', msg.event)
    }
}

export const ReadyState = {
    closed: 'closed',
    closing: 'closing',
    connecting: 'connecting',
    open: 'open',
}

import * as socket from './socket.js'
import { DEBUG } from '../../types.js'
import { dispatch } from './socket.js'

export let peerConnection: RTCPeerConnection;

/** The RTCDataChannel API enables peer-to-peer exchange of data */
export let dataChannel: RTCDataChannel;

export const initialize = () => {

    // handle a Session-Description-Offer 
    // @param {RTCSessionDescriptionInit} offer - {topic: string, sdp: string}
    socket.when('RtcOffer', async (offer: RTCSessionDescriptionInit) => {
        if (peerConnection) {
            if (DEBUG) console.error('existing peerconnection');
            return;
        }
        createPeerConnection(false);
        await peerConnection.setRemoteDescription(offer);
        const answer = await peerConnection.createAnswer();
        socket.broadcast({ topic: 'RtcAnswer', data: { type: 'answer', sdp: answer.sdp } });

        // Note that RTCPeerConnection won't start gathering 
        // candidates until setLocalDescription() is called.
        await peerConnection.setLocalDescription(answer);
    })

    // handle a Session-Description-Answer 
    // @param {RTCSessionDescriptionInit} answer - {type: string, sdp: string}
    socket.when('RtcAnswer', async (answer: RTCSessionDescriptionInit) => {
        if (!peerConnection) {
            if (DEBUG) console.error('no peerconnection');
            return;
        }
        await peerConnection.setRemoteDescription(answer);
    })

    // handle ICE-Candidate
    // @param {RTCIceCandidateInit} candidate - RTCIceCandidateInit
    socket.when('candidate', async (candidate: RTCIceCandidateInit) => {
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

    socket.when('bye', () => {
        if (peerConnection) {
            peerConnection.close();
            peerConnection = null
        }
    })

    // A peer is offering to connect
    socket.when('connectOffer', (_data: any) => {
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
/** Start the peerConnection process by signalling an invitation */
export const start = () => {
    socket.broadcast({ topic: 'connectOffer', data: {} });
}

/** Resets the peerConnection and dataChannel, then calls 'start()' */
const reset = () => {
    dataChannel = null
    peerConnection = null
    start()
}

/** creates a peer connection 
 * @param {boolean} - isOfferer - we're making the offer     
 *   true when called by makeConnection() - we are sending an offer    
 *   false when called from signaller.when('RtcOffer') - someone else sent us an offer
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
        // sent over the signaller to the remote peer.
        socket.broadcast({ topic: 'candidate', data: init });
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
    dataChannel.addEventListener("message", (event: { data: string }) => {
        const {topic, data} = JSON.parse(event.data)
        dispatch(topic, data)
    })
}

function checkDataChannelState() {
    if (dataChannel.readyState === 'open') {
        updateUI({ content: `Player1 is now connected to Player2`, clearContent: true });
    } else if (dataChannel.readyState === 'closed') {
        updateUI({
            content: `Player2 was disconnected! 
Waiting for new offer on: ${location.origin}`, clearContent: true
        });
        // reset everything and restart
        reset()
    }
}

export async function makeConnection() {
    createPeerConnection(true);
    const offer = await peerConnection.createOffer();
    socket.broadcast({ topic: 'RtcOffer', data: { type: 'offer', sdp: offer.sdp } });
    // Note that RTCPeerConnection won't start gathering 
    // candidates until setLocalDescription() is called.
    await peerConnection.setLocalDescription(offer);
}


// Finaly ... tell them your listening/waiting
updateUI({ content: `Player1 is waiting for a connection from: ${location.origin}` });

//todo do-UI, use popup?
function updateUI(msg: { content: string, clearContent?: boolean }) {
    console.log(msg.content)
}
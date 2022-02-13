
import { DiceGame, game } from './model/diceGame.js';
import { Container, container } from './view/container.js'
import * as socket from './framework/model/signalling.js';
import * as Players from './model/players.js';
import { DEBUG } from './types.js'

const { onSignalRecieved, registerPlayer, message } = socket

const proto = (window.location.protocol === 'http:') ? 'ws://' : 'wss://';
const serverURL = `${proto}${window.location.host}:8000`
const thisHost = window.location.host
if (thisHost === 'localhost' || thisHost === '127.0.0.1') {
    socket.initialize(serverURL)
} else {
    socket.initialize('wss://rtc-signal-server.deno.dev')
}


// Once we connect with the server, it will return its 
// request.headers('sec-websocket-key') as our new peer 'ID'
onSignalRecieved(message.SetID, (data:{id: string, role: number}) => {
    console.info('message.SetID: data = ', data)
    //     const name = prompt(`
    // Please enter your name or just
    // press enter to accept 'Player'`, "Player") || 'Player';
    let name = 'Player'+ data.role

    // fixes audio warnings
    const hiddenButton = document.getElementById('hidden-button')
    hiddenButton.hidden = true;
    hiddenButton.addEventListener('click', function () {
        if (DEBUG) console.log('hiddenButton was clicked')
    }, false);
    hiddenButton.click();

    Players.thisPlayer.id = data.id
    Players.thisPlayer.playerName =  name
    Players.setThisPlayer(Players.thisPlayer)
    Players.setCurrentPlayer(Players.thisPlayer)
    // now that we have a unique ID, 
    // we'll register our self with all other peers
    registerPlayer(data.id, name)
    Players.addPlayer(data.id, name)
    if (game) { game.resetGame() }
})

// sorry game full
onSignalRecieved(message.GameFull, () => {
    const msg = `Sorry, This game is already full!
This tab/window will automatically close!`
    if (DEBUG) console.log(msg)
    alert(msg);

    // close this tab/window
    self.opener = self;
    self.close();
})

// wait for it ...
self.addEventListener('DOMContentLoaded', () => {
    // navigator.serviceWorker.register('./sw.js').then((registration) => {
    //     console.log('ServiceWorker registration successful with scope: ', registration.scope);
    // }, (err) => {
    //     console.log('ServiceWorker registration failed: ', err);
    // });
    // instantiate our view container
    Container.init(document.getElementById('canvas') as HTMLCanvasElement, 'snow')

    // build the main view-model
    DiceGame.init();

    // reify the UI from element-descriptors  
    container.hydrateUI()

})
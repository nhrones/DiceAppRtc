
import { DiceGame, game } from './model/diceGame.js';
import { Container, container } from './view/container.js'
import * as socket from './framework/comms/signalling.js';
import * as Players from './model/players.js';
import * as gameState from './gameState.js'

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


// Once we connect with the server, it will return our new peer 'ID'
onSignalRecieved(message.SetID, (data: { id: string, table: number, seat: number}) => {
    console.info('--------------------------------message.SetID: data = ', data)
    //     const name = prompt(`
    // Please enter your name or just
    // press enter to accept 'Player'`, "Player") || 'Player';
    let name = 'Player'+ data.seat
    gameState.manageState('connect', data.id, name, data.table, data.seat)
    console.log('Game state:', gameState.toString())
    Players.thisPlayer.id = data.id
    Players.thisPlayer.playerName =  name
    Players.setThisPlayer(Players.thisPlayer)
    Players.setCurrentPlayer(Players.thisPlayer)
    // now that we have a unique ID, 
    // we'll register our self with all other peers
    registerPlayer(data.id, name, data.table, data.seat)
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
    // instantiate our view container
    Container.init(document.getElementById('canvas') as HTMLCanvasElement, 'snow')

    // build the main view-model
    DiceGame.init();

    // reify the UI from element-descriptors  
    container.hydrateUI()

})
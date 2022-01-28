
import { DiceGame, game } from './model/diceGame.js';
import { Container, container } from './view/container.js'
import  * as socket  from './framework/model/socket.js';
import * as Players from './model/players.js';

const proto = (window.location.protocol === 'http:') ? 'ws://': 'wss://';
export const serverURL = `${proto}${window.location.host}:8000`
socket.initialize('wss://dice-socket-server.deno.dev')//serverURL)

// Once we connect with the server, it will return its 
// request.headers('sec-websocket-key') as a new client 'ID'
socket.when(socket.topic.SetID, (data: { id: string }) => {
//     const name = prompt(`
// Please enter your name or just
// press enter to accept 'Player'`, "Player") || 'Player';
const name = 'Player'
        
    // fixes audio warnings
    const hiddenButton = document.getElementById('hidden-button')
    hiddenButton.hidden = true;
    hiddenButton.addEventListener('click', function () {
        console.log('hiddenButton was clicked')
    }, false);
    hiddenButton.click();
    
    Players.thisPlayer.id = data.id
    Players.thisPlayer.playerName = (name === 'Player') ? 'Player1' : name
    Players.setThisPlayer(Players.thisPlayer)
    Players.setCurrentPlayer(Players.thisPlayer)
    // now that we have a unique ID, 
    // we'll register our self with all other peers
    socket.registerPlayer(data.id, name)
    Players.addPlayer(data.id, name)
    game.resetGame()
}) 

// issue a new client 'ID'
socket.when(socket.topic.GameFull, () => {
    const msg = `Sorry, This game is already full!
This tab/window will automatically close!`
    console.log(msg)
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
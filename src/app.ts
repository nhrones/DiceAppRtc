import { Event, Fire } from './framework/model/events.js'
import { DiceGame } from './model/diceGame.js';
import { Container, container } from './view/container.js'
import * as signaler from './framework/comms/signaling.js';
import { LogLevel, debug, error} from './constants.js'


let name = prompt("What's your name?", "Bill") || 'Nick';
let t = Date.now().toString()
export let myID = name + '-' + t.substring(t.length-3)
signaler.initialize(name, myID)

// sorry game full from us!
signaler.onEvent('ShowPopup', (msg: string) => {
    console.info('************** ShowPopup-msg', msg)
    Fire(Event.ShowPopup, msg )
})

// show UI updates from WebRTC
signaler.onEvent('UpdateUI', (content: unknown) => {
    console.info('UpdateUI: ', content)
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

import { onEvent } from '../framework/comms/signaling.js'
import { sendSignal } from '../framework/comms/webRTC.js'
import { when, Event, Fire } from '../framework/model/events.js'
import * as dice from './dice.js'

const kind = 'rollbutton'
export const state = { text: '', color: '', enabled: true }

/** 
 *  RollButton viewModel initialization    
 *  Called from DiceGame ctor
*/
export const init = () => {
    // when this instance rolls dice
    when(`${Event.ButtonTouched}${kind}`, () => {
        dice.roll(null)
        sendSignal({event: 'UpdateRoll', data: dice.toString()})
        updateRollState()
    })

    // when oponents rolled the dice
    onEvent('UpdateRoll', (diceArray: string) => {
        dice.roll(JSON.parse(diceArray))
        updateRollState()
    })

}

/** 
 * state management for the roll button 
 */
const updateRollState = () => {
    switch (dice.rollCount) {
        case 1:
            state.text = 'Roll Again'
            break
        case 2:
            state.text = 'Last Roll'
            break
        case 3:
            state.enabled = false
            state.text = 'Select Score'
            break
        default:
            state.text = 'Roll Dice'
            dice.setRollCount(0)
    }
    update()
}

/** 
 * fires an update event with the current state 
 */
export const update = () => {
    Fire(Event.UpdateButton + kind, state)
}


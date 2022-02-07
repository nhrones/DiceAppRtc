
import { ON, Event, Fire } from '../framework/model/events.js'
import * as dice from './dice.js'
import {
    onSocketRecieved,
    message,
    socketSend
} from '../framework/model/socket.js'

const kind = 'rollbutton'
export const state = { text: '', color: '', enabled: true }

/** RollButton viewModel initialization
 *  Called from DiceGame ctor
*/
export const init = () => {
    // when this instance rolls dice
    ON(`${Event.ButtonTouched}${kind}`, () => {
        dice.roll(null)
        socketSend(message.UpdateRoll,
            {dice: dice.toString()}
        )
        updateRollState()
    })

    // when oponents rolled the dice
    onSocketRecieved(message.UpdateRoll, (data: { dice: string }) => {
        dice.roll(JSON.parse(data.dice))
        updateRollState()
    })

}

/** state management for the roll button */
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

/** fires an update event with the current state */
export const update = () => {
    Fire(Event.UpdateButton + kind, state)
}



import * as events from '../framework/model/events.js'
import { thisPlayer, } from './players.js'
import * as dice from './dice.js'
import * as socket from '../framework/model/socket.js'

const {  
    topic: _ ,
    broadcast: fireEvent,
} = events

const kind = 'rollbutton'
export const state = { text: '', color: '', enabled: true }

/** RollButton viewModel initialization
 *  Called from DiceGame ctor
*/
export const init = () => {
    // when this instance rolls dice
    events.when(`${_.ButtonTouched}${kind}`, () => {
        dice.roll(null)
        socket.broadcast( {topic: socket.topic.UpdateRoll,
            data:{ id: thisPlayer.id, dice: dice.toString() }}
        )
        updateRollState()
    })

    // when oponents rolled the dice
    socket.when(socket.topic.UpdateRoll, (data: { id: string, dice: string }) => {
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
    fireEvent(_.UpdateButton + kind, state)
}


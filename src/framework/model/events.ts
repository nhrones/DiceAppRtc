
import { callbackFunc } from '../../types.js'

const topicSubscriptions: Map<string, callbackFunc[]> = new Map()

/** registers a callback function to be executed when a topic is published
 *	e.g.: Events.when(topic.GameOver, Game.resetGame)
 *   .. returns an object containing a 'remove' function
 *	@param topic {string} the topic of interest
 *	@param callback {function} a callback function
 *	@returns remove {object} returns an object containing a 'remove' function
 */
export const when = (topic: string, callback: callbackFunc): { remove: any } => {
    return _registerListener(topic, callback)
}

/** _registerListener
 *	private internal function ...
 *  registers a callback function to be executed when a topic is published
 *	@param topic {string} the topic of interest
 *	@param callback {function} a callback function
 *	@param once {boolean} if true ... fire once then unregister
 *	@return remove {object} returns an object containing a 'remove' function
 */
const _registerListener = (topic: string, callback: callbackFunc) => {

    if (!topicSubscriptions.has(topic)) {
        topicSubscriptions.set(topic, [])
    }
    const subscriptions = topicSubscriptions.get(topic)!

    const index = subscriptions.length

    subscriptions.push(callback)


    // return an anonomous object with a 'remove' function
    return {
        remove: () => {
            delete subscriptions[index]
            if (subscriptions.length < 1) {
                topicSubscriptions.delete(topic)
            }
        }
    }
}

/** broadcasts a topic with optional data
 *	e.g.: Events.broadcast("GameOver", winner)
 *	@param {string} topic - the topic of interest
 *	@param {object} data - optional data to report to subscribers
 */
export const broadcast = (topic: string, data: {}) => {   //string | object) {
    if (topicSubscriptions.has(topic)) {
        _dispatch(topicSubscriptions.get(topic)!, data)
    }
}

/** private method _dispatch ... executes all registered callback functions */
const _dispatch = (subscriptions: Function[], data: string | object) => {
    if (subscriptions) {
        for (const callback of subscriptions) {
            callback((data != undefined) ? data : {})
        }
    }
}

/** removes all registered topics and all of their listeners */
const reset = () => {
    topicSubscriptions.clear()
}

/** removes a topic and all of its listeners
 * @param {string} topic
 */
const removeTopic = (topic: string) => {
    topicSubscriptions.delete(topic)
}

/** exported event topics list */
export const topic = {
    ButtonTouched: 'ButtonTouched',
    CancelEdits: 'CancelEdits',
    DieTouched: 'DieTouched',
    HidePopup: 'HidePopup',
    PlayerNameUpdate: 'PlayerNameUpdate',
    PopupResetGame: 'PopupResetGame',
    ScoreButtonTouched: 'ScoreButtonTouched',
    ScoreElementResetTurn: 'ScoreElementResetTurn',
    ShowPopup: 'ShowPopup',
    UpdateButton: 'UpdateButton',
    UpdateDie: 'UpdateDie',
    UpdateLabel: 'UpdateLabel',
    UpdateScoreElement: 'UpdateScoreElement',
    UpdateTooltip: 'UpdateTooltip',
    ViewWasAdded: 'ViewWasAdded'
}

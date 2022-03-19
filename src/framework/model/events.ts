
const eventSubscriptions: Map<string, Function[]> = new Map()

/**
 *  registers a callback function to be executed when an event is fired
 *	@example ON(Event.GameOver, Game.resetGame)
 *   .. returns an object containing a 'remove' function
 *	@param(string) event - the event of interest
 *	@param(function) callback - a callback function
 *	@returns(object) returns an object containing a 'remove' function
 */
export const when = (event: string, callback: Function): { remove: any } => {
    return _registerListener(event, callback)
}

/** 
 *  _registerListener
 *	private internal function ...
 *  registers a callback function to be executed when a event is published
 *	@param (string) event - the event of interest
 *	@param (function) callback - a callback function
 *	@return (object) returns an object containing a 'remove' function
 */
const _registerListener = (event: string, callback: Function) => {

    if (!eventSubscriptions.has(event)) {
        eventSubscriptions.set(event, [])
    }
    const subscriptions = eventSubscriptions.get(event)!
    const index = subscriptions.length
    subscriptions.push(callback)

    // return an anonomous object with a 'remove' function
    return {
        remove: () => {
            delete subscriptions[index]
            if (subscriptions.length < 1) {
                eventSubscriptions.delete(event)
            }
        }
    }
}

/** 
 *  fires an event for a event with optional data
 *	@example Fire(Event.UpdateDie, value)
 *	@param(string) event - the event of interest
 *	@param(object) data - optional data to report to subscribers
 */
export const Fire = (event: string, data: {}) => {
    if (eventSubscriptions.has(event)) {
        dispatch(eventSubscriptions.get(event)!, data)
    }
}

/** 
 *   dispatch ... executes all registered callback functions 
 */
const dispatch = (subscriptions: Function[], data: string | object) => {
    if (subscriptions) {
        for (const callback of subscriptions) {
            callback((data != undefined) ? data : {})
        }
    }
}

/** exported Event names list */
export const Event = {
    ButtonTouched: 'ButtonTouched',
    DieTouched: 'DieTouched',
    HidePopup: 'HidePopup',
    PeerDisconnected: 'PeerDisconnected',
    PeerInitialize: 'PeerInitialize',
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

export const emptyString = ''
type action = 'connect' | 'disconnect'
export let id = emptyString
export let seat1 = {id: emptyString, table: 0, name: 'Player1'} // callee
export let seat2 = {id: emptyString, table: 0, name: 'Player2'} // caller

export const gameFull = () => seat1.id !== emptyString && seat2.id !== emptyString

export const manageState = (action: action, id: string, name: string, table: number, seat: number) => {
    
    if (action === 'connect') {
        if (seat1.id === emptyString) {
            seat1.id = id
            seat1.name = name
        } else if (seat2.id === emptyString) {
            seat2.id = id
            seat2.name = name
        }
    } 
    else if (action === 'disconnect') {
        if (seat1.id === id) {
            seat1.id = emptyString
            seat1.name = emptyString
        } else if (seat2.id === id) {
            seat2.id = emptyString
            seat2.name = emptyString
        }
    }
}

export const toString = () => {
    return `Seat1: ${seat1} Seat2: ${seat2}`
}

export const emptyString = ''

type Seat = { id: string, name: string, table: number }

class GameState {
    
    seat1: Seat
    seat2: Seat
    
    constructor() {
        this.seat1 = { id: emptyString, table: 0, name: 'Player1' } // callee
        this.seat2 = { id: emptyString, table: 0, name: 'Player2' } // caller
    }

    gameIsFull() {
        return (this.seat1.id !== emptyString && this.seat2.id !== emptyString)
    }

    connect(id: string, name: string, table: number, seat: number) {
        if (this.seat1.id.length === 0) {
            this.seat1.id = id
            this.seat1.name = name
        } else if (this.seat2.id.length === 0) {
            this.seat2.id = id
            this.seat2.name = name
        } else {
            alert('oppps! Game was full!')
        }
    }

    disconnect(id: string, name: string, table: number, seat: number) {
        if (this.seat1.id === id) {
            this.seat1.id = emptyString
            this.seat1.name = emptyString
        } else if (this.seat2.id === id) {
            this.seat2.id = emptyString
            this.seat2.name = emptyString
        } else {
            alert('oppps! ID not found when disconnect was called!')
        }
    }

    toString () {
        return `Seat1: ${JSON.stringify(this.seat1)} Seat2: ${JSON.stringify(this.seat2)}`
    }
}

export const gameState = new GameState()
import { sigMessage } from '../framework/comms/SIGlib.js'
import { onSignalRecieved, sendSSEmessage } from '../framework/comms/signaling.js'
import { Event, Fire } from '../framework/model/events.js'
import { Player } from '../types.js'
import { DEBUG } from '../constants.js'
import { DiceGame } from './diceGame.js'

const MAXPLAYERS = 2

let game: DiceGame;
let thisColor: string = 'snow';
export const players: Set<Player> = new Set();
export const getCount =() => {
    return players.size;
}
export const init = (thisgame: DiceGame, color: string) => {
    game = thisgame
    thisColor = color
    
    // player 'state' objects 
    players.clear()

    thisPlayer = {
        id: "",
        idx: 0,
        playerName: '',
        color: 'brown',
        score: 0,
        lastScore: ''
    }
 
    //HACK Can only be Player2 as Player1 is set internally onSetID in app.ts
    onSignalRecieved(sigMessage.RegisterPlayer, (player: {id: string, name: string}) => {
        if (DEBUG) console.info('@@@@@@@@@@@@@@@@@@@@@@@Players Got RegisterPlayer: @@@@@@@@@@@@@@@@@', (typeof player))
        console.log('playerid: ', player.id)
        const {id, name} = player
        if (DEBUG) console.log(`Players.RegisterPlayer ${id}  ${name}`)
        addPlayer(id, name);
        setCurrentPlayer([...players][0]);
        game.resetGame();
        sendSSEmessage({topic: sigMessage.UpdatePlayers, data: Array.from(players.values())})
    })

    // will only come from focused-player (currentPlayer)
    onSignalRecieved(sigMessage.UpdatePlayers, (playersArray: Player[]) => {
        // clear the players set
        players.clear()

        // clear the view
        resetScoreLabels()

        // refresh the state and the view
        playersArray.forEach((newPlayer, index) => {
            players.add({
                id: newPlayer.id,
                idx: index,
                playerName: newPlayer.playerName,
                color: newPlayer.color,
                score: 0,
                lastScore: ""
            })

            // needed to refresh name and title
            if (thisPlayer.id === newPlayer.id) {
                setThisPlayer(newPlayer)
            }
            updatePlayer(newPlayer.idx, newPlayer.color, newPlayer.playerName)
        })
        setCurrentPlayer([...players][0])
        game.resetGame()
    })

    //
    //  sent from server on socket.close()
    //
    onSignalRecieved(sigMessage.RemovePlayer, (id: string) => {
        removePlayer(id)
        game.resetGame()
    })
}

/** 
 * resets all players labels 
 */
export const resetScoreLabels = () => {
    for (let i = 0; i < MAXPLAYERS; i++) {
        updatePlayer(i, thisColor, '')
    }
}

/** 
 * reset players state to initial game state 
 */
export const resetPlayers = () => {
    for (const player of players) {
        player.score = 0
        updatePlayer(player.idx, player.color, player.playerName)
    }
}

/** 
 * add a score value for this player 
 */
export const addScore = (player: Player, value: number) => {
    player.score += value
    const text = (player.score === 0) ? player.playerName : `${player.playerName} = ${player.score}`
    updatePlayer(player.idx, player.color, text)
}

/** 
 * broadcast an update message to the view element 
 */
const updatePlayer = (index: number, color: string, text: string) => {
    Fire(`${Event.UpdateLabel}player${index}`,
        {
            color: thisColor,
            textColor: color, text: text
        }
    )
}

/** 
 * add a new player,  
 * broadcasts `UpdatePlayers` (will ResetGame) 
 * @param(string) id - the id of the new player
 */
export const addPlayer = (id: string, playerName: string) => {
    if (DEBUG) console.log('add player ', id + '  ' + playerName)
    if (playerName === 'Player') {
        const num = players.size + 1
        playerName = 'Player' + num;
    }
    if (thisPlayer.id === "") {
        thisPlayer.id = id
        thisPlayer.playerName = playerName
        players.add(thisPlayer)
    } else {
        if (DEBUG) console.log(`Players adding, id:${id} name: ${playerName}`)
        players.add(
            {
                id: id,
                idx: players.size,
                playerName: playerName,
                color: playerColors[players.size],
                score: 0,
                lastScore: ''
            }
        )
    }
    if (DEBUG) console.info(' added player', Array.from(players.values()))

}

/** 
 * removes a Player    
 * called when the players webSocket has closed    
 * @param(string) id - the id of the player to be removed
 */
export const removePlayer = (id: string) => {
    const p = getById(id)
    if(p === null) return
    if (DEBUG) console.info(' removing player', p)
    players.delete(p)
    refreshPlayerColors();
    setThisPlayer([...players][0])
    setCurrentPlayer([...players][0])
}

const getById = (id: string): Player | null => {
    for (const player of players) {
        if (player.id === id) {
            return player
        }
    }
    return null
}

export const getNextPlayer = (player: Player) => {
    let next = player.idx + 1
    if (next === players.size) {
        next = 0
    }
    return [...players][next]
}

/** 
 * reassigns index and unique color for each active player 
 */
const refreshPlayerColors = () => {
    let i = 0
    for (const player of players) {
        player.idx = i;
        player.color = playerColors[i]
        i++
    }
}


/** 
 * an array of player colors 
 */
const playerColors = ["Brown", "Green", "RoyalBlue", "Red"]


export const setThisPlayer = (player: Player) => {
    if (DEBUG) console.log(`Step-4 - Players.setThisPlayer: ${player.playerName}`)
    const favicon = document.getElementById("favicon") as HTMLLinkElement
    thisPlayer = player
    document.title = thisPlayer.playerName
    favicon.href = `./icons/${player.idx}.png`;
}

export let thisPlayer: Player = {
    id: "0",
    idx: 0,
    playerName: 'Player1',
    color: 'brown',
    score: 0,
    lastScore: ''
}

export let currentPlayer: Player = {
    id: "0",
    idx: 0,
    playerName: "Player1",
    color: 'brown',
    score: 0,
    lastScore: ''
}

export const setCurrentPlayer = (player: Player) => {

    if (DEBUG) console.log(`Step-5 - Players.settingCurrentPlayer: ${player.playerName}`)
    currentPlayer = player
}

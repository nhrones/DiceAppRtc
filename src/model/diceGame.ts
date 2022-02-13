
import { onSignalRecieved, message, sendSignal } from '../framework/model/signalling.js';
import { ON, Event, Fire } from '../framework/model/events.js'
import * as Players from '../model/players.js'
import { Player } from '../types.js'
import * as PlaySound from '../framework/model/sounds.js'
import * as dice from './dice.js'
import * as Possible from './possible.js'
import ScoreElement from './scoreElement.js'
import * as rollButton from './rollButton.js'


///////////////////////////\\\\\\\\\\\\\\\\\\\\\\\\\\\
//         local const for faster resolution        \\
///////////////////////////\\\\\\\\\\\\\\\\\\\\\\\\\\\

const snowColor = 'snow'
const grayColor = 'gray'

///////////////////////////\\\\\\\\\\\\\\\\\\\\\\\\\\\
//      exported aliases for faster resolution      \\
///////////////////////////\\\\\\\\\\\\\\\\\\\\\\\\\\\

export let game: DiceGame

/** the main view-model for the dice game */
export class DiceGame {

    //playerManager: Players
    players: Set<Player>
    scoreItems: ScoreElement[]
    leftBonus: number
    fiveOkindBonus: number
    leftTotal: number
    rightTotal: number

    /** DiceGame private instance, exposed by init() */
    private static _instance: DiceGame

    /** singleton initialization */
    static init() {
        if (!DiceGame._instance) {
            DiceGame._instance = new DiceGame()
            game = DiceGame._instance
        }
    }

    /** private singleton constructor, called from init() */
    private constructor() {

        //this.playerManager = Players.init()//new Players(this, snowColor)
        Players.init(this, snowColor) //new Players(this, snowColor)
        this.players = Players.players //this.playerManager.players;
        this.scoreItems = []
        this.leftBonus = 0
        this.fiveOkindBonus = 0
        this.leftTotal = 0
        this.rightTotal = 0
        dice.init()
        rollButton.init()

        ///////////////////////////////\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\
        //                       bind events                          \\
        ///////////////////////////////\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\

        onSignalRecieved(message.ResetTurn, (_data: {}) => {
            if (!this.isGameComplete()) {
                this.resetTurn()
            }
        })

        onSignalRecieved(message.ResetGame, (data: {}) => {
            this.resetGame()
        })


        ON(Event.PopupResetGame, () => {
            sendSignal(message.ResetGame, {})
            this.resetGame()
        })

        ON(Event.ScoreElementResetTurn, () => {           
            if (this.isGameComplete()) {
                this.clearPossibleScores()
                this.setLeftScores()
                this.setRightScores()
                this.showFinalScore(this.getWinner())
            } else {
                this.resetTurn()
            }
        })

        ON(Event.ViewWasAdded, (view: { type: string, index: number, name: string }) => {
            if (view.type === 'ScoreButton') {
                this.scoreItems.push(new ScoreElement(view.index, view.name))
            }
        })
    }

    /** check score total and determin the winner of this game */
    getWinner() {
        if (this.players.size === 1) {
            return this.getPlayer(0)
        }
        let thisWinner = this.getPlayer(0)
        let highscore = 0
        for (const player of this.players) {
            if (player.score > highscore) {
                highscore = player.score
                thisWinner = player
            }
        }
        return thisWinner
    }

    /** clear all scoreElements possible score value */
    clearPossibleScores() {
        for (const scoreItem of this.scoreItems) {
            scoreItem.clearPossible()
        }
    }

    /** evaluates the dice and then sets a possible score value for each scoreelements */
    evaluatePossibleScores() {
        for (const scoreItem of this.scoreItems) {
            scoreItem.setPossible()
        }
    }

    /** 
     * resets the turn by resetting values and state 
     */
    resetTurn() {
        Players.setCurrentPlayer(Players.getNextPlayer(Players.currentPlayer))
        PlaySound.enabled(Players.currentPlayer.id === Players.thisPlayer.id)
        rollButton.state.color = Players.currentPlayer.color
        rollButton.state.enabled = true
        rollButton.state.text = 'Roll Dice'
        rollButton.update()
        dice.resetTurn()
        this.clearPossibleScores()
        this.setLeftScores()
        this.setRightScores()
    }

    /** 
     * resets game state to start a new game 
     */
    resetGame() {
        document.title = Players.thisPlayer.playerName
        Fire(Event.HidePopup, {})
        Players.setCurrentPlayer(this.getPlayer(0))
        dice.resetGame()
        for (const scoreItem of this.scoreItems) {
            scoreItem.reset()
        }
        // clear the view
        Players.resetScoreLabels()
        this.leftBonus = 0
        this.fiveOkindBonus = 0
        this.leftTotal = 0
        this.rightTotal = 0
        Fire(Event.UpdateLabel + 'leftscore',
            { state: 0, color: 'gray', textColor: snowColor, text: '^ total = 0' }
        )
        Players.resetPlayers()
        rollButton.state.color = 'brown'
        rollButton.state.text = 'Roll Dice'
        rollButton.state.enabled = true
        rollButton.update()
    }
 
    /** 
     * show a popup with winner and final score 
     */
    showFinalScore(winner: any) {
        let winMsg
        if (winner.id !== Players.thisPlayer.id) {
            PlaySound.Nooo()
            winMsg = winner.playerName + ' wins!'
        }
        else {
            PlaySound.Woohoo()
            winMsg = 'You won!'
        }
        rollButton.state.color = 'black'
        rollButton.state.text = winMsg
        rollButton.update()
        Fire( Event.UpdateLabel + 'infolabel',
            { state: 0, color: 'snow', textColor: 'black', text: winMsg + ' ' + winner.score }
        )
        Fire(Event.ShowPopup,
            {message: winMsg + ' ' + winner.score }
        )
        sendSignal(message.ShowPopup,
            {message: winner.playerName + ' wins!' + ' ' + winner.score }
        )
    }

    /** 
     * check all scoreElements to see if game is complete 
     */
    isGameComplete() {
        let result = true
        for (const scoreItem of this.scoreItems) {
            if (!scoreItem.owned) {
                result = false
            }
        }
        return result
    }

    /** 
     * sum and show left scoreElements total value 
     */
    setLeftScores() {
        this.leftTotal = 0
        for (const player of this.players) {
            player.score = 0
        }
        let val
        for (let i = 0; i < 6; i++) {
            val = this.scoreItems[i].finalValue
            if (val > 0) {
                this.leftTotal += val
                const owner = this.scoreItems[i].owner
                if (owner) {
                    Players.addScore(owner, val)
                    if (this.scoreItems[i].hasFiveOfaKind && (dice.fiveOfaKindCount > 1)) {
                        Players.addScore(owner, 100)
                    }
                }
            }
        }
        if (this.leftTotal > 62) {
            let bonusWinner = this.getPlayer(0)
            let highleft = 0
            for (const player of this.players) {
                if (player.score > highleft) {
                    highleft = player.score
                    bonusWinner = player
                }
            }

            Players.addScore(bonusWinner, 35)
            Fire( Event.UpdateLabel + 'leftscore',
                {
                    state: 0,
                    color: bonusWinner.color,
                    textColor: snowColor,
                    text: `^ total = ${this.leftTotal.toString()} + 35`
                }
            )
        }
        else {
            Fire( Event.UpdateLabel + 'leftscore',
                {
                    state: 0,
                    color: grayColor,
                    textColor: snowColor,
                    text: '^ total = ' + this.leftTotal.toString()
                }
            )
        }
        if (this.leftTotal === 0) {
            Fire( Event.UpdateLabel + 'leftscore',
                {
                    state: 0,
                    color: grayColor,
                    textColor: snowColor,
                    text: '^ total = 0'
                }
            )
        }
    }

    /** 
     * sum the values of the right scoreElements 
     */
    setRightScores() {
        let val
        const len = this.scoreItems.length
        for (let i = 6; i < len; i++) {
            val = this.scoreItems[i].finalValue
            if (val > 0) {
                const owner = this.scoreItems[i].owner
                if (owner) {
                    Players.addScore(owner, val)
                    if (this.scoreItems[i].hasFiveOfaKind
                        && (dice.fiveOfaKindCount > 1)
                        && (i !== Possible.FiveOfaKindIndex)
                    ) {
                        Players.addScore(owner, 100)
                    }
                }
            }
        }
    }

    getPlayer(index: number) {
        for (const player of this.players) {
            if (player.idx === index) {
                return player
            }
        }
        return [...this.players][index];
    }
}

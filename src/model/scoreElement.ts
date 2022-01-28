
import { Player } from '../types.js'
import * as events from '../framework/model/events.js'
import { currentPlayer, thisPlayer } from './players.js'
import * as PlaySound from '../framework/model/sounds.js'
import * as dice from './dice.js'
import * as Possible from './possible.js'
import  * as socket  from '../framework/model/socket.js'

const {  
    topic: _ ,
    broadcast: fireEvent,
} = events

const SmallStraight = 8
const LargeStraight = 9
const FullHouse = 10

///////////////////////////\\\\\\\\\\\\\\\\\\\\\\\\\\\
//       local constants for faster resolution      \\
///////////////////////////\\\\\\\\\\\\\\\\\\\\\\\\\\\

const emptyString: string = ''
const black = 'black'
const infolabel = 'infolabel'
const snow = 'snow'

/** ScoreElement viewModel class */
export default class ScoreElement {

    available: boolean
    owned: boolean
    index: number
    name: string
    owner: Player | null = null
    finalValue: number
    possibleValue: number
    scoringDieset: number[]
    scoringDiesetSum: number
    hasFiveOfaKind: boolean = false

    /** constructor ... called from DiceGame.buildScoreItems()
     * @param dice {Dice} Dice dependency injection
     * @param index {number} index of this instance
     * @param name {string} the name of this instance
     */
    constructor(index: number, name: string) {

        this.available = false
        this.owned = false
        this.index = index
        this.name = name
        this.finalValue = 0
        this.possibleValue = 0
        this.scoringDieset = [0, 0, 0, 0, 0]

        ///////////////////////////////////////////////    
        //               bind events                 //
        /////////////////////////////////////////////// 
        // when I select a score
        events.when(`${_.ScoreButtonTouched}${this.index}`, () => {
            // notify all other players
            socket.broadcast({topic: `${socket.topic.UpdateScore}${this.index}`,
                data: { id: thisPlayer.id, scoreNumber: this.index }}
            )
            if (this.clicked()) {
                socket.broadcast( {topic: socket.topic.ResetTurn, data:{}})
                fireEvent(_.ScoreElementResetTurn, {})
            }
        })

        // when other players select a score
        socket.when(`${socket.topic.UpdateScore}${this.index}`, (_data: {}) => {
            this.clicked()
        })

        events.when(_.UpdateTooltip + this.index, (data: { hovered: boolean }) => {

            let msg = ''
            let thisState = 0

            /* state
                0 = 'normal'
                1 = 'hovered' (not owned)
                2 = 'hovered' (has owner)
                3 = 'reset' from hovered 
            */

            if (data.hovered) {
                if (this.owned) {
                    thisState = 2 // hovered (has owner)
                    msg = `${thisPlayer.playerName} owns ${this.name} with ${this.scoringDieset.toString()}`
                } else { // hovered not owned
                    thisState = 1 // hovered (not owned)
                    msg = `${this.name}`
                }
            } else { // not hovered
                thisState = 3 // reset (not hovered)
                msg = ''
            }

            fireEvent(_.UpdateLabel + infolabel,
                {
                    state: thisState,
                    color: snow,
                    textColor: black,
                    text: msg
                });
        })
    }

    /** broadcasts a message used to update the bottom infolabel element */
    updateInfo(text: string) {
        fireEvent(_.UpdateLabel + infolabel,
            { state: 0, color: snow, textColor: black, text: text }
        )
    }

    /** sets a flag to indicate this score is owned by the current player */
    setOwned(value: boolean) {
        this.owned = value
        if (this.owned) {
            this.owner = currentPlayer
            this.updateScoreElement(this.owner.color, this.possibleValue.toString())
        }
        else {
            this.owner = null
            this.updateScoreElement(black, emptyString)
        }
    }

    /** fires event used to update the score value */
    renderValue(value: string) {
        fireEvent(_.UpdateScoreElement + this.index,
            {
                renderAll: false,
                color: '',
                valueString: value,
                available: this.available
            }
        )
    }

    /**  broadcasts a message used to update the score view element */
    updateScoreElement(color: string | null, value: string) {
        fireEvent(_.UpdateScoreElement + this.index,
            {
                renderAll: true,
                color: color,
                valueString: value,
                available: this.available
            }
        )
    }

    /** sets a flag that determins if this scoreElement is available   
     * to be selected by the current player */
    setAvailable(value: boolean) {
        this.available = value
        if (this.available) {
            if (this.possibleValue > 0) {
                this.renderValue(this.possibleValue.toString())
            }
        }
        else {
            if (this.owned) {
                this.renderValue(this.possibleValue.toString())
            }
            this.renderValue(this.possibleValue.toString())
        }
    }

    /** the clicked event handler for this scoreElement.    
     * returns true if the click caused this score to be    
     * taken by the current player  */
    clicked() {

        // if game has not started ... just return
        if (dice.toString() === '[0,0,0,0,0]') return false

        // if it's available
        let scoreTaken = false

        // and it's not taken yet
        if (!this.owned) {
            if (this.possibleValue === 0) {
                currentPlayer.lastScore = `sacrificed ${this.name} ${dice.toString()}`
                this.updateInfo(`${currentPlayer.playerName} ${currentPlayer.lastScore}`)
            } else {
                const wasItYou = currentPlayer.id === thisPlayer.id
                const wasTaken = (wasItYou) ? 'choose' : 'took'
                currentPlayer.lastScore = `${wasTaken} ${this.name} ${dice.toString()}`
                this.updateInfo(`${(wasItYou) ? 'You' : currentPlayer.playerName} ${currentPlayer.lastScore}`)
            }
            if (this.index === Possible.FiveOfaKindIndex) {
                if (dice.isFiveOfaKind) {
                    dice.setfiveOfaKindBonusAllowed(true)
                    PlaySound.Heehee()
                }
                else {
                    dice.setfiveOfaKindWasSacrificed(true)
                    PlaySound.Dohh()
                }
            }
            this.setValue()
            scoreTaken = true

        } // it's been taken
        else if (this.available) {
            currentPlayer.lastScore = `stole ${this.name} ${dice.toString()} was: ${this.scoringDieset.toString()}`;
            this.updateInfo(`${currentPlayer.playerName} ${currentPlayer.lastScore}`)
            this.setOwned(false)
            PlaySound.Heehee()
            this.setValue()
            scoreTaken = true
        }
        return scoreTaken
    }

    /** sets the value of this scoreElement after taken by a player */
    setValue() {
        this.setOwned(true)
        const thisValue = this.possibleValue
        this.finalValue = thisValue
        this.scoringDiesetSum = 0
        // DO NOT use for/of here! needs index
        this.scoringDieset.forEach((_die: number, index: number) => {
            this.scoringDieset[index] = dice.die[index].value
            this.scoringDiesetSum += dice.die[index].value
        })
        if (dice.isFiveOfaKind) {
            if (dice.fiveOfaKindBonusAllowed) {
                dice.setfiveOfaKindCount( dice.fiveOfaKindCount + 1)
                if (this.index !== Possible.FiveOfaKindIndex) {
                    this.finalValue += 100
                }
                this.hasFiveOfaKind = true
                PlaySound.Heehee()
            }
            else {
                this.hasFiveOfaKind = false
                PlaySound.Cluck()
            }
        }
        else {
            this.hasFiveOfaKind = false
            if (thisValue === 0) {
                PlaySound.Dohh()
            }
            else {
                PlaySound.Cluck()
            }
        }
    }

    // evaluates and displays a possible value for this scoreElement
    setPossible() {
        this.possibleValue = Possible.evaluate(this.index)
        if (!this.owned) {
            if (this.possibleValue === 0) {
                this.renderValue(emptyString)
            }
            else {
                this.renderValue(this.possibleValue.toString())
            }
            this.setAvailable(true)
        }
        else if (currentPlayer !== this.owner) {
            if (this.possibleValue > this.finalValue) {
                if (!this.hasFiveOfaKind) {
                    this.setAvailable(true)
                    this.renderValue(this.possibleValue.toString())
                }
            } else if ( // less than current value
                (this.index === SmallStraight || this.index === LargeStraight) &&
                (this.possibleValue === this.finalValue) &&
                (this.possibleValue > 0) &&
                (this.scoringDiesetSum < dice.sum)) {
                this.setAvailable(true)
                this.renderValue(this.possibleValue.toString())
            } else if (
                (this.index === FullHouse) &&
                (this.possibleValue === this.finalValue) &&
                (this.scoringDiesetSum < dice.sum)
            ) {
                this.setAvailable(true)
                this.renderValue(this.possibleValue.toString())
            }
        }
    }


    /** resets this scoreElement */
    reset() {
        this.setOwned(false)
        this.finalValue = 0
        this.possibleValue = 0
        this.updateScoreElement(black, emptyString)
        this.hasFiveOfaKind = false
    }

    /** clears the possible value for this scoreElement */
    clearPossible() {
        this.possibleValue = 0
        this.setAvailable(false)
        if (!this.owned) {
            this.finalValue = 0
            this.renderValue(emptyString)
        }
        else {
            this.renderValue(this.finalValue.toString())
        }
    }
}

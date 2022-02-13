

import * as dice from './dice.js'
import * as evaluator from './diceEvaluator.js'

const ThreeOfaKind: number = 6
const FourOfaKind: number = 7
const SmallStraight: number = 8
const LargeStraight: number = 9
const House: number = 10
const FiveOfaKind: number = 11
const Chance: number = 12

/** A module that evaluates a possible score for 
 * each ScoreElement based on the current values 
 * of the dice set 
 */

/** the index value of the Five of a kind scoreElement */
export const FiveOfaKindIndex: number = FiveOfaKind

/** 
 * evaluates the possible value of a scoreElement 
 * @param(number) elementID - the id of the scoreElement being evaluated
 * @returns(number) - the value this element would score with current dice values
 */
export const evaluate = (elementID: number) => {
    if (elementID < 6) {
        // element ids are zero-based, so 'ones'->'sixes' are id 0-5 
        // we'll add one to the id to get the die value we want to evaluate for
        return evaluateNumber(elementID + 1)
    } else {
        // element ids greater than 5 have unique poker scoring values  
        return evaluateCommon(elementID)
    }
}

/** 
 * evaluate for common poker scores 
 * @param(number) element - the id of the scoreElement being evaluated
 * @returns(number) - the value this element would score with current dice values
 */
const evaluateCommon = (element: number) => {
    if (element === FiveOfaKind) {
        return (evaluator.hasFiveOfaKind) ? 50 : 0
    }
    else if (element === SmallStraight) {
        return (evaluator.hasSmallStr) ? 30 : 0
    }
    else if (element === LargeStraight) {
        return (evaluator.hasLargeStr) ? 40 : 0
    }
    else if (element === House) {
        return (evaluator.hasFullHouse) ? 25 : 0
    }
    else if (element === FourOfaKind) {
        return (evaluator.hasQuads || evaluator.hasFiveOfaKind) ?
            evaluator.sumOfAllDie : 0
    }
    else if (element === ThreeOfaKind) {
        return (evaluator.hasTrips || evaluator.hasQuads || evaluator.hasFiveOfaKind) ?
            evaluator.sumOfAllDie : 0
    }
    else if (element === Chance) {
        return evaluator.sumOfAllDie
    }
    else {
        return 0
    }
}

/** 
 * evaluates for the number of dice with this face value 
 * @param(number) thisNumber - the number to evaluate for
 */
const evaluateNumber = (target: number) => {
    let hits = 0
    //const target = thisNumber + 1
    for (let i = 0; i < 5; i++) {
        const val = (dice.die[i]).value
        if (val === target) {
            hits += 1
        }
    }
    return target * hits
}

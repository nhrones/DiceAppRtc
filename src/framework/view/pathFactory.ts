
import { Geometry } from '../../types.js'
import Die from '../../view/die.js'

/** returns a Path2D object used to render a custom Right-Score */
export function buildRightScore(geometry: Geometry) {
    const { left, right, top, bottom, width, height, radius } = getPathGeometry(geometry)
    const halfWidth = left + (width * 0.3)
    const halfHeight = top + (height * 0.5) + 5
    const p = new Path2D()
    p.moveTo(halfWidth + radius, top)
    p.arcTo(right, top, right, top + radius, radius)
    p.arcTo(right, bottom, right - radius, bottom, radius)
    p.arcTo(left, bottom, left, bottom - radius, radius)
    p.arcTo(left, halfHeight, left + radius, halfHeight, radius)
    p.arcTo(halfWidth, halfHeight, halfWidth, halfHeight - radius, radius)
    p.arcTo(halfWidth, top, halfWidth + radius, top, radius)
    return p
}

/** returns a Path2D object used to render a custom Left-Score */
export function buildLeftScore(geometry: Geometry) {
    const { left, right, top, bottom, width, height, radius } = getPathGeometry(geometry)
    const halfWidth = left + (width * 0.7)
    const halfHeight = top + (height * 0.5) - 5
    const p = new Path2D()
    p.moveTo(left + radius, top)
    p.arcTo(right, top, right, top + radius, radius)
    p.arcTo(right, halfHeight, right - radius, halfHeight, radius)
    p.arcTo(halfWidth, halfHeight, halfWidth, halfHeight + radius, radius)
    p.arcTo(halfWidth, bottom, halfWidth - radius, bottom, radius)
    p.arcTo(left, bottom, left, bottom - radius, radius)
    p.arcTo(left, top, left + radius, top, radius)
    return p
}

/** returns a Path2D object used to render a custom Rounded-Rectangle */
export function buildRoundedRectangle(geometry: Geometry) {
    const { left, right, top, bottom, radius } = getPathGeometry(geometry)
    const path = new Path2D
    path.moveTo(left + radius, top)
    path.arcTo(right, top, right, top + radius, radius) // top
    path.arcTo(right, bottom, right - radius, bottom, radius) // right
    path.arcTo(left, bottom, left, bottom - radius, radius) // bottom
    path.arcTo(left, top, left + radius, top, radius) // left
    return path
}

/** adds calculated 'right and 'bottom' properties to an IGeometry */
const getPathGeometry = (geometry: Geometry) => {
    const { left, top, width, height, radius } = geometry
    return {
        left: left,
        right: left + width,
        top: top,
        bottom: top + height,
        width: width,
        height: height,
        radius: radius || 10
    }
}


/////////////////////////////////\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\
//                                                              \\
//             Build Pre-Rendered Die Face Images               \\
//                                                              \\
/////////////////////////////////\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\


const ctx = document.createElement('canvas').getContext('2d')!
let size = 0

/** A die-face factory that renders and persists dice face images */
export const dieBuilder = {
    buildDieFaces: (dieSize: number, color: string) => {
        size = dieSize
        ctx.canvas.width = size
        ctx.canvas.height = size
        ctx.fillStyle = color
        ctx.fillRect(0, 0, size, size)
        for (let i = 0; i < 7; i++) {
            Die.faces[i] = dieBuilder.drawDie(false, i, color)
            Die.frozenFaces[i] = dieBuilder.drawDie(true, i, color)
        }
    },

    drawDie: (frozen: boolean, value: number, color: string) => {
        ctx.fillStyle = color
        ctx.fillRect(0, 0, size, size)
        ctx.save()
        if (frozen) {
            ctx.strokeStyle = 'silver'
            ctx.fillStyle = 'WhiteSmoke'
        }
        else {
            ctx.strokeStyle = 'black'
            ctx.fillStyle = 'white'
        }
        dieBuilder.drawDieFace()
        dieBuilder.drawGlare()
        ctx.fillStyle = (frozen) ? 'silver' : 'black'
        dieBuilder.drawDots(value)
        ctx.restore()
        return ctx.getImageData(0, 0, size, size)
    },

    drawDieFace: () => {
        const radius = size / 5
        ctx.beginPath()
        ctx.moveTo(radius, 0)
        ctx.arcTo(size, 0, size, size, radius)
        ctx.arcTo(size, size, 0, size, radius)
        ctx.arcTo(0, size, 0, 0, radius)
        ctx.arcTo(0, 0, radius, 0, radius)
        ctx.closePath()
        ctx.fill()
        ctx.lineWidth = 3
        ctx.stroke()
        ctx.lineWidth = 1
    },

    drawGlare: () => {
        const offset = 5
        const bottomLeftX = offset
        const bottomLeftY = size - offset
        const bottomRightX = size - offset
        const bottomRightY = size - offset
        const quarter = size * 0.25
        const threeQuarter = quarter * 3
        ctx.fillStyle = 'rgba(200, 200, 200, 0.4)'
        ctx.beginPath()
        ctx.moveTo(bottomLeftX, bottomLeftY)
        ctx.lineTo(bottomRightX, bottomRightY)
        ctx.bezierCurveTo(quarter, threeQuarter, quarter, threeQuarter, offset, offset)
        ctx.closePath()
        ctx.fill()
        ctx.save()
    },

    drawDots: (dieValue: number) => {
        const quarter = size / 4
        const center = quarter * 2
        const middle = quarter * 2
        const left = quarter
        const top = quarter
        const right = quarter * 3
        const bottom = quarter * 3
        const dotSize = size / 12
        const doDot = dieBuilder.drawDot
        if (dieValue === 1) {
            doDot(middle, center, dotSize)
        }
        else if (dieValue === 2) {
            doDot(top, left, dotSize)
            doDot(bottom, right, dotSize)
        }
        else if (dieValue === 3) {
            dieBuilder.drawDot(top, left, dotSize)
            dieBuilder.drawDot(middle, center, dotSize)
            dieBuilder.drawDot(bottom, right, dotSize)
        }
        else if (dieValue === 4) {
            dieBuilder.drawDot(top, left, dotSize)
            dieBuilder.drawDot(top, right, dotSize)
            dieBuilder.drawDot(bottom, left, dotSize)
            dieBuilder.drawDot(bottom, right, dotSize)
        }
        else if (dieValue === 5) {
            dieBuilder.drawDot(top, left, dotSize)
            dieBuilder.drawDot(top, right, dotSize)
            dieBuilder.drawDot(middle, center, dotSize)
            dieBuilder.drawDot(bottom, left, dotSize)
            dieBuilder.drawDot(bottom, right, dotSize)
        }
        else if (dieValue === 6) {
            dieBuilder.drawDot(top, left, dotSize)
            dieBuilder.drawDot(top, right, dotSize)
            dieBuilder.drawDot(middle, left, dotSize)
            dieBuilder.drawDot(middle, right, dotSize)
            dieBuilder.drawDot(bottom, left, dotSize)
            dieBuilder.drawDot(bottom, right, dotSize)
        }
    },

    drawDot: (y: number, x: number, dotSize: number) => {
        ctx.beginPath()
        ctx.arc(x, y, dotSize, 0, Math.PI * 2, true)
        ctx.closePath()
        ctx.fill()
    }

}

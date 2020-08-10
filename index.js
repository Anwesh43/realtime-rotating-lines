const w = window.innerWidth
const h = window.innerHeight
const scGap = 0.02
const strokeFactor= 90
const sizeFactor = 2.9
const rot = Math.PI / 2
const hFactor = 3

class DrawingUtil {

    static drawLine(context : CanvasRenderingContext2D, x1 : number, y1 : number, x2 : number, y2 : number) {
        context.beginPath()
        context.moveTo(x1, y1)
        context.lineTo(x2, y2)
        context.stroke()
    }
}

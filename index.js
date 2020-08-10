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

class State {

    scale = 0
    dir = 0
    prevScale = 0

    update(cb) {
        this.scale += scGap * this.dir
        if (Math.abs(this.scale - this.prevScale) > 1) {
            this.scale = this.prevScale + this.dir
            this.dir = 0
            this.prevScale = this.scale
            cb()
        }
    }

    startUpdating(cb) {
        if (this.dir == 0) {
            this.dir = 1 - 2 * this.prevScale
            cb()
        }
    }
}

class RotatingLine {

    x
    y
    constructor(x, y) {
        this.x = x
        this.y = y
    }

    draw(context) {
        const sf = Math.sin(this.state.scale * Math.PI)
        const size = Math.min(w, h) / sizeFactor
        context.lineWidth = Math.min(w, h) / strokeFactor
        context.strokeStyle = 'indigo'
        const yh = h / hFactor
        context.save()
        context.translate(this.x, this.y - yh * sf)
        context.rotate(rot * sf)
        DrawingUtil.drawLine(context, -size * sf , 0, size * sf, 0)
        context.restore()
    }

    update(cb) {
        this.state.update(cb)
    }

    startUpdating(cb) {
        this.state.startUpdating(cb)
    }
}

class RotatingLineContainer {

    rotatingLines = []

    draw(context) {
        this.rotatingLines.forEach((rl) => {
            rl.draw(context)
        })
    }

    update(cb) {
        this.rotatingLines.forEach((rl, i) => {
            rl.update(() => {
                this.rotatingLines.splice(0, 1)
                if (this.rotatingLines.length == 0) {
                    cb()
                }
            })
        })
    }

    startUpdating(cb) {
        this.rotatingLines.forEach((rl) => {
            rl.startUpdating(() => {
              if (this.rotatingLines.length == 1) {
                  cb()
              }
            })
        })
    }
}

class Animator {
    animated = false
    interval

    start(cb) {
        if (!this.animated) {
            this.animated = true
            this.interval = setInterval(cb, 20)
        }
    }

    stop() {
        if (this.animated) {
            this.animated = false
            clearInterval(this.interval)
        }
    }
}

class Renderer {

    animator = new Animator()
    rlc  = new RotatingLineContainer()

    render(context) {
        this.rlc.draw(context)
    }

    handleTap(x, y, cb) {
        this.rlc.startUpdating(() => {
            this.animator.start(() => {
                cb()
                this.rlc.update(() => {
                    this.animator.stop()
                    cb()
                })
            })
        })
    }
}

class Stage {

    canvas = document.createElement('canvas')
    context
    renderer = new Renderer()
    initCanvas() {
        this.canvas.width = w
        this.canvas.height = h
        this.context = this.canvas.getContext('2d')
        document.body.appendChild(this.canvas)
    }

    render() {
        this.renderer.render(context)
    }

    handleTap() {
        this.canvas.onmousedown = (e) => {
            const {offsetX, offsetY} = e
            this.render.handleTap(offsetX, offsetY, () => {
                this.render()
            })
        }

    }
}

const w = window.innerWidth
const h = window.innerHeight
const scGap = 0.02
const strokeFactor= 90
const sizeFactor = 5
const rot = Math.PI
const hFactor = 1.8

class ScaleUtil {
    static maxScale(scale, i, n) {
        return Math.max(0, scale - i / n)
    }

    static divideScale(scale, i, n) {
        return Math.min(1 / n, ScaleUtil.maxScale(scale, i, n)) * n
    }

    static sinify(scale) {
        return Math.sin(scale * Math.PI)
    }
}

class DrawingUtil {

    static drawLine(context , x1, y1, x2, y2) {
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
    color
    state = new State()
    constructor(x, y, color) {
        this.x = x
        this.y = y
        this.color = color
    }

    draw(context) {
        const sf = ScaleUtil.sinify(this.state.scale)
        const sf1 = ScaleUtil.divideScale(sf, 0, 2)
        const sf2 = ScaleUtil.divideScale(sf, 1, 2)
        const size = Math.min(w, h) / sizeFactor
        context.lineWidth = Math.min(w, h) / strokeFactor
        context.strokeStyle = this.color
        context.lineCap = 'round'
        const yh = h / hFactor
        context.save()
        context.translate(this.x, this.y - yh * sf2)
        context.rotate(rot * sf2)
        DrawingUtil.drawLine(context, -size * sf1 , 0, size * sf1, 0)
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
    color

    constructor(color) {
        this.color = color
    }

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
                    console.log("stopped")
                    cb()
                }
            })
        })
    }

    startUpdating(cb) {
        this.rotatingLines.forEach((rl) => {
            rl.startUpdating(() => {
              if (this.rotatingLines.length == 1) {
                  console.log("started")
                  cb()
              }
            })
        })
    }

    push(x, y) {
        const rl = new RotatingLine(x, y, this.color)
        this.rotatingLines.push(rl)
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
    animatorServer = new Animator()
    rlc = new RotatingLineContainer('indigo')
    rls = new RotatingLineContainer('#f44336')

    render(context) {
        this.rlc.draw(context)
        this.rls.draw(context)
    }

    handleNewRL(x, y, rlc, animator, cb) {

      rlc.push(x, y)
      rlc.startUpdating(() => {
          animator.start(() => {
              cb()
              rlc.update(() => {
                  animator.stop()
                  cb()
              })
          })
      })
    }

    handleTap(x, y, cb) {
        this.handleNewRL(x, y, this.rlc, this.animator, cb)
    }

    handleSocket(x, y, cb) {
        this.handleNewRL(x, y, this.rls, this.animatorServer, cb)
    }
}

class Stage {

    canvas = document.createElement('canvas')
    context
    renderer = new Renderer()
    socket
    initCanvas() {
        this.canvas.width = w
        this.canvas.height = h
        this.context = this.canvas.getContext('2d')
        document.body.appendChild(this.canvas)
    }

    render() {
        this.context.fillStyle = '#BDBDBD'
        this.context.fillRect(0, 0, w, h)
        this.renderer.render(this.context)
    }

    handleTap() {
        this.canvas.onmousedown = (e) => {
            const {offsetX, offsetY} = e

            this.socket.emit('newRect', {offsetX, offsetY})
            this.renderer.handleTap(offsetX, offsetY, () => {
                this.render()
            })
        }
    }

    handleSocket() {
        this.socket = io.connect('http://localhost:8000/rl')
        this.socket.on('newServerRect', (data) => {
            console.log("new server rect")
            const {offsetX, offsetY} = data
            this.renderer.handleSocket(offsetX, offsetY, () => {
                this.render()
            })
        })
    }

    static init() {
        const stage = new Stage()
        stage.initCanvas()
        stage.render()
        stage.handleTap()
        stage.handleSocket()
    }
}

const {createServer} = require('http')
const socketIo = require('socket.io')
const express = require('express')
const path = require('path')
const app = express()
app.use(express.static(path.join(__dirname, '')))
const server = createServer(app)
const io = socketIo(server)
const sockets = []
io.of('/rl').on('connection', (socket) => {
    sockets.push(socket)
    socket.on('newRect', (data) => {
        console.log("new Rotating Line",data)
        sockets.filter(sc => sc !== socket).forEach((sc) => {
            sc.emit('newServerRect', data)
        })
    })
})
server.listen(8000, () => {
    console.log("listening in port 8000")
})

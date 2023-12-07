const app = require('express')()
const htpp = require('http').createServer(app);
const io = require('socket.io')(htpp)
const url = require('url');
const bodyParser = require('body-parse');
const { response } = require('express');

app.use(bodyParser());

let clientResponseRef = null;
app.get('/*', (req, res) => {
    const pathname = url.parse(req.url).pathname;

    const obj = {
        pathname: pathname,
        method: 'get',
        params: req.query,
    };

    io.emit('page-request');
    clientResponseRef = res;
});

app.post('/*', (req, res) => {
    const pathname = url.parse(req.url).pathname;

    const obj = {
        pathname: pathname,
        method: 'post',
        params: req.body,
    };

    io.emit('page-request', obj);
    clientResponseRef = res;
});

io.on('connection', (socket) => {
    console.log('a node connected');
    socket.on('page-response', (res) => {
        clientResponseRef.send(res)
    })
});

var server_port = process.env.PORT || 3000;
htpp.listen(server_port, () => {
    console.log('listening on: ' + server_port);
});
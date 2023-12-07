const socketServerUrl = '';
const hostToLive = 'mylocal';

const socket = require('socket.io-client')(socketServerUrl);
const superagent = require('superagent');

socket.on('connect', () => {
    console.log('connected');
});

socket.on('disconnect', () => {
    console.log('connection lost');
});

socket.on('page-request', (data) => {
    const pathname = data.pathname;
    const method = data.method;
    const params = data.params;

    const localhostUrl = hostToLive + path;

    if(method == 'get') excuteGet(localhostUrl, params);
    else if(method == 'post') excutePost(localhostUrl, params);
})

const excuteGet = (url, params) => {
    superagent.get(url)
    .query(params)
    .end((err, res) => {
        if(err)
            console.log(err);
        else
            socket.emit('page-response', res.text);
    });
}

const excutePost = (url, params) => {
    superagent.post(url)
    .query(params)
    .end((err, res) => {
        if(err)
            console.log(err);
        else
            socket.emit('page-response', res.text);
    });
}

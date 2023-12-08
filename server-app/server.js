const { randomUUID } = require('crypto');
const express = require('express');
const app = express();
app.use(express.json());


const htpp = require('http');
const server = htpp.createServer(app);
const socket = require('socket.io');
io = socket(server);

const multer = require("multer");
const upload = multer({
    dest: "C:/Users/Mio/Downloads/Programs",
  });

require('dotenv').config();
const cloudinary = require('cloudinary').v2;
cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.API_KEY,
    api_secret: process.env.API_SECRET,
    secure: true,
})

const clientResponseRefs = new Map();

app.use('*', upload.single('file') , async (req, res) => {
    const _id = randomUUID();

    forwadrReq = {
        path: req.baseUrl,
        method: req.method,
        headers: req.headers,
        body: req.body,
        args: req.query,
        cookies: req.cookies,
        _id
    }

    file = req.file;
    console.log(file);
    if(file) {
        const {secure_url} = await cloudinary.uploader.upload(file.path);
        forwadrReq.body['image_url'] = secure_url;
        forwadrReq.headers['Content-Type'] = 'application/json';
    }
    delete forwadrReq.headers['content-length'];

    io.emit('forward-request', forwadrReq);
    clientResponseRefs.set(_id, res);
    setTimeout(() => {
        if(clientResponseRefs.has(_id)) {
            clientResponseRefs.get(_id).status(500).json({
                'message': 'something went wrong',
                'status code': '500',
            });
            clientResponseRefs.delete(_id);
        }
    }, 20000);
})

io.on('connection', (socket) => {
    console.log('a node connected');
    socket.on('forward-response', (res) => {
        if(clientResponseRefs.has(res._id)) {
            clientResponseRefs.get(res._id).status(res.statusCode).json(res.data);
            clientResponseRefs.delete(res._id);
        }
    })
});

var server_port = process.env.PORT || 3000;
server.listen(server_port, () => {
    console.log('listening on: ' + server_port);
});
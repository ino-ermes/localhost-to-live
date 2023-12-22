const { randomUUID } = require('crypto');
const express = require('express');
const app = express();
app.use(express.json());

const cors = require('cors');
app.use(cors());


const htpp = require('http');
const server = htpp.createServer(app);
const socket = require('socket.io');
io = socket(server);

const multer = require("multer");
const { unlinkSync } = require('fs');
const upload = multer({
    dest: "./tmp",
});

require('dotenv').config();
const cloudinary = require('cloudinary').v2;
cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.API_KEY,
    api_secret: process.env.API_SECRET,
    secure: true,
})

const sharp = require('sharp');

const clientResponseRefs = new Map();

app.use('*', upload.single('image'), async (req, res) => {
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

    image = req.image;
    if (image) {
        const resizedImageBuffer = await sharp(image.buffer)
            .resize(600, 600)
            .toFormat('jpg')
            .jpeg({ quality: 90 })
            .toBuffer();

        const uploadResponse = await cloudinary.uploader.upload(
            `data:image/jpg;base64,${resizedImageBuffer.toString('base64')}`,
            { resource_type: 'image' }
        );

        const imageUrl600x600 = uploadResponse.secure_url;
        const imageUrl150x150 = cloudinary.url(uploadResponse.public_id, {
            transformation: [{ width: 150, height: 150, crop: 'fill' }]
        });

        unlinkSync(image.path);
        forwadrReq.headers['Content-Type'] = 'application/json';
        forwadrReq.body['img_url'] = imageUrl600x600;
        forwadrReq.body['thumb_img_url'] = imageUrl150x150;
    }
    delete forwadrReq.headers['content-length'];

    io.emit('forward-request', forwadrReq);
    clientResponseRefs.set(_id, res);
})

io.on('connection', (socket) => {
    console.log('a node connected');
    socket.on('forward-response', (res) => {
        if (clientResponseRefs.has(res._id)) {
            clientResponseRefs.get(res._id).status(res.statusCode).json(res.data);
            clientResponseRefs.delete(res._id);
        }
    })
});

var server_port = process.env.PORT || 3000;
server.listen(server_port, () => {
    console.log('listening on: ' + server_port);
});
const net = require('net')
const crypto = require('crypto');
const { time } = require('console');
// let sockets = []
let sockets = {}
const server = net.createServer({
    allowHalfOpen: false,
    pauseOnConnect: false
}, (socket) => {
    // 'connection' listener.
    // console.log(socket)
    console.log('client connected', new Date().toUTCString());


    // socket.setEncoding('utf8') // do not use this

    let body = []
    socket.once('data', (buffer1) => {
        buffer1 = buffer1.toString()
        console.log('-------', buffer1, '-------');

        // get Sec-WebSocket-Key
        // v1

        function parseHeader(str) {
            let arr = str.split('\r\n').filter(el => el) // remove '' in the array
            arr.shift()
            let headers = {}
            // console.log("arr", arr)
            arr.forEach(item => {
                let [name, value] = item.split(':')
                name = name.replace(/^\s|\s+$/g, '').toLowerCase()
                value = value.replace(/^\s|\s+$/g, '')
                headers[name] = value
            });
            return headers
        }

        // console.log(arr)
        // let SecWebSocketkeyString = arr.find((k) => k.match('Sec-WebSocket-Key:*'))
        // let key = SecWebSocketkeyString.split('Sec-WebSocket-Key: ')[1]
        // console.log(key)
        // v2

        const headers = parseHeader(buffer1)
        console.log("-----", headers, "-----")

        if (headers['upgrade'] !== 'websocket') {
            console.log("not WebSocket connection")
            socket.end()
        } else if (headers['sec-websocket-version'] !== '13') {
            console.log("not version 13, compatibility isue")
            socket.end()
        } else {


            let key = headers['sec-websocket-key']

            let str = '',
                buffer = null,
                encodedHash = '',
                keyString = '',
                magicString = '';
            keyString = key
            magicString = '258EAFA5-E914-47DA-95CA-C5AB0DC85B11'
            str = `${keyString}${magicString}`
            buffer = crypto.createHash('sha1').update(str).digest('sha1')
            encodedHash = buffer.toString('base64')

            // body.push(d)
            // body = Buffer.concat(body).toString()
            // console.log('-------', body);

            // socket.write('helloa\r\n');
            // socket.pipe(socket);

            // socket.write('HTTP/1.1 101 Switching Protocols')
            // socket.write('Upgrade: websocket')
            // socket.write('Connection: Upgrade')
            // socket.write('Sec-WebSocket-Accept: ' + key)

            let header = 'HTTP/1.1 101 Switching Protocols\r\n'
                + 'Connection: Upgrade\r\n'
                + 'Upgrade: websocket\r\n'
                + 'Sec-WebSocket-Accept: ' + encodedHash
                + '\r\n\r\n'

            // console.log(header)

            // socket.pipe(socket);
            socket.write(header)

            // socket.end(header)

            // socket.end('', 'utf8', () => {
            //     console.log('client disconnected', new Date().toUTCString());
            //     console.log("socket.bytesRead", socket.bytesRead)
            //     console.log("socket.bytesWritten", socket.bytesWritten)
            //     // console.log("socket.bufferSize", socket.bufferSize)
            //     // console.log("socket.writableLength ", socket.writableLength)
            // });

            const platform = headers['client']
            // console.log('platform', platform)

            // server.getConnections((err, count) => {
            //     console.log(err, count)
            // })

            socket.on('data', (buffer) => {
                // console.log('-------', buffer, '-------');
                if (platform === 'node') {
                    console.log("platform === 'node'")
                    // sockets.push({platform: 'node', socket: socket})
                    sockets.node = socket
                    const data = buffer.toString()
                    socket.write(data)
                    let parsedData = JSON.parse(data)
                    if (parsedData.code === 573) {
                        sockets.web.write(encodeWsFrame({ payloadData: parsedData.msg }))
                    }
                    
                } else {
                    console.log("platform === 'web'")
                    // sockets.push({platform: 'web', socket: socket})
                    sockets.web = socket
                    const data = decodeWsFrame(buffer)
                    // console.log('-------', data, '-------');
                    console.log(data.payloadData && data.payloadData.toString())
                    if (data.opcode === 8) {
                        socket.end()
                    } else {
                        socket.write(encodeWsFrame({ payloadData: `server received：${data.payloadData ? data.payloadData.toString() : ''}` }))
                        // setInterval(function () {
                        //     socket.write(encodeWsFrame({ payloadData: new Date().toUTCString() }))
                        // }, 3000)
                    }
                }

            })
        }


    });
    socket.on('timeout', () => {
        console.log('-------', 'timeout')
    })
    socket.on('ready', () => {
        console.log('-------', 'ready')
    })
    socket.on('drain', () => {
        console.log('-------', 'drain')
    })
    socket.on('error', (e) => {
        console.log('-------error', e);
    });
    socket.on('end', () => {
        // console.log('socket on end', new Date().toUTCString());
    });
    socket.on('close', (hadError) => {
        console.log('-------', 'close', hadError);
    });



}).on('error', (err) => {
    // Handle errors here.
    throw err;
});

// Grab an arbitrary unused port.
//   server.listen(() => {
//     console.log('opened server on', server.address());
//   });



server.on('connection', (netSocket) => {
    // console.log("------------", 'connection', netSocket)
})

server.on('listening', () => {
    // console.log("------------", 'listening')
})


server.on('data', () => {
    console.log('data')
})
server.on('end', () => {
    console.log('end')
})

server.listen(8081, () => {
    console.log('opened server on', server.address());
});
// server.listen(8081, 'localhost', 1, () => {
//     console.log('opened server on', server.address());
// });



function decodeWsFrame(data) {
    let start = 0;
    let frame = {
        isFinal: (data[start] & 0x80) === 0x80,
        opcode: data[start++] & 0xF,
        masked: (data[start] & 0x80) === 0x80,
        payloadLen: data[start++] & 0x7F,
        maskingKey: '',
        payloadData: null
    };

    if (frame.payloadLen === 126) {
        frame.payloadLen = (data[start++] << 8) + data[start++];
    } else if (frame.payloadLen === 127) {
        frame.payloadLen = 0;
        for (let i = 7; i >= 0; --i) {
            frame.payloadLen += (data[start++] << (i * 8));
        }
    }

    if (frame.payloadLen) {
        if (frame.masked) {
            const maskingKey = [
                data[start++],
                data[start++],
                data[start++],
                data[start++]
            ];

            frame.maskingKey = maskingKey;

            frame.payloadData = data
                .slice(start, start + frame.payloadLen)
                .map((byte, idx) => byte ^ maskingKey[idx % 4]);
        } else {
            frame.payloadData = data.slice(start, start + frame.payloadLen);
        }
    }

    // console.dir(frame)
    return frame;
}


function encodeWsFrame(data) {
    const isFinal = data.isFinal !== undefined ? data.isFinal : true,
        opcode = data.opcode !== undefined ? data.opcode : 1,
        payloadData = data.payloadData ? Buffer.from(data.payloadData) : null,
        payloadLen = payloadData ? payloadData.length : 0;

    let frame = [];

    if (isFinal) frame.push((1 << 7) + opcode);
    else frame.push(opcode);

    if (payloadLen < 126) {
        frame.push(payloadLen);
    } else if (payloadLen < 65536) {
        frame.push(126, payloadLen >> 8, payloadLen & 0xFF);
    } else {
        frame.push(127);
        for (let i = 7; i >= 0; --i) {
            frame.push((payloadLen & (0xFF << (i * 8))) >> (i * 8));
        }
    }

    frame = payloadData ? Buffer.concat([Buffer.from(frame), payloadData]) : Buffer.from(frame);

    // console.dir(decodeWsFrame(frame));
    return frame;
}

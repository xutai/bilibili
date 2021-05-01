// 引入http模块
const http = require('http')
const https = require('https')
// 引入Path模块，因为要通过路径来读取Html等文件
const path = require('path')
// 引入FileSystem，因为要用读文件，比如html
const fs = require('fs')
// 引入queryString模块，为了处理url上的query，把每个Key-value对拿出来
const querystring = require('querystring')
const static = require('./static')

// incomingMessage和serverResponse作为参数传入回调函数
const server = http.createServer((req, res) => {
    //console.log(req)
    //console.log(res)
    // 引入url模块，是为了处理url，比如?name=xxx在url上的话，下面这个判断就不准确了
    // 具体看HTTP - message.url
    const url = require('url').parse(req.url)
    const dir = __dirname

    static(req,'js', url.pathname, res)
    static(req,'css', url.pathname, res)


    if (req.url === '/favicon.ico') {

        const newPath = path.resolve(dir, 'favicon.ico')
        fs.readFile(newPath, (err, data) => {
            if (err) throw err
            res.end(data)
        })
    }
    else if ((req.url === '/') || (url.pathname === '/bilibili')) {
        fs.readFile(path.resolve(__dirname, 'bilibili.html'), (err, data) => {
            if (err) throw err
            res.end(data)
        })
    } else if (url.pathname === '/bilibiliurl') {

        
        const query = querystring.parse(url.query, '&', '=', {
            decodeURIComponent: querystring.unescape(),
            maxKeys: 1000
        })
        console.log("query", query)
        const aid = query.aid
        const p = query.p

        const req1 = https.get(`https://api.bilibili.com/x/web-interface/view?aid=${aid}`, (res1) => {
            // console.log(res1.statusCode)
            console.log("res1.headers:", res1.headers)

            let body1 = []
            res1.on('data', (d) => {
                body1.push(d)
            })

            res1.on('end', () => {

                body1 = Buffer.concat(body1).toString()

                // console.log(typeof d)   -- object
                // process.stdout.write(d);
                // 将buffer进行字符串编码改成utf-8

                data1 = body1
                // data1 = d.toString('utf-8')

                //  console.log(data)
                // 拿到了第一个url数据
                console.log("data1:", data1)

                data1json = JSON.parse(data1)
                console.log("data1json:", data1json)

                // const aid = data1json.data.aid
                // get cid

                let cid, page, vname
                page = p
                if (!p) {
                    cid = data1json.data.cid
                    vname = data1json.data.title
                } else {
                    cid = data1json.data.pages[page - 1].cid
                    vname = data1json.data.pages[page - 1].part
                }

                console.log("aid=", aid)
                console.log("cid=", cid)
                console.log("page=", page)

                // ["高清 1080P60","高清 720P60","高清 1080P","高清 720P","清晰 480P","流畅 360P"]
                // [116,74,80,64,32,16]
                // "flv_p60,flv720_p60,flv,flv720,flv480,mp4"


                // 第二个https请求api
                // SESSDATA应该在chrome, Application,  Cookies, https://bilibili.com, SESSDATA
                // SESSDATA = 66a87465%2C1583914439%2C94b12721
                const qn = 116
                // should be quality
                const url = `https://api.bilibili.com/x/player/playurl?avid=${aid}&cid=${cid}&qn=${qn}&otype=json`
                const options = {
                    hostname: 'api.bilibili.com',
                    headers: {
                        cookie: 'SESSDATA=66a87465%2C1583914439%2C94b12721'
                    }
                    //    agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/79.0.3945.130 Safari/537.36'
                }
                options.agent = new https.Agent(options)

                console.log("options.agent:", options.agent)

                const req2 = https.get(url, options, (res2) => {

                    let body2 = []
                    res2.on('data', (d) => {

                        body2.push(d)

                    })

                    res2.on('end', () => {

                        body2 = Buffer.concat(body2).toString()

                        //data2 = d.toString('utf-8')
                        data2 = body2
                        console.log("data2 or body = ", body2)


                        console.log('data2:', data2)
                        data2json = JSON.parse(data2)
                        console.log("data2json:", data2json)
                        const durl = data2json.data.durl[0].url
                        //const backup_url = data2json.data.durl[0].backup_url[0]
                        console.log("durl:", durl)

                        const format = data2json.data.format
                        const quality = data2json.data.quality

                        //   const parseURL = new URL(durl)
                        //   console.log("parseURL.href", parseURL.href)

                        // 后端下载视频
                        if (!durl.includes('https')) {
                            durlfix = durl.replace('http', "https")
                        } else {
                            durlfix = durl
                        }

                        console.log('durlfix:', durlfix)

                        const options1 = {
                            headers: {
                                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.13; rv:56.0) Gecko/20100101 Firefox/56.0',
                                'Accept': '*/*',
                                'Accept-Language': 'en-US,en;q=0.5',
                                'Accept-Encoding': 'gzip, deflate, br',
                                'Range': 'bytes=0-',
                                'Referer': `https://www.bilibili.com/video/av${aid}/`,
                                'Origin': 'https://www.bilibili.com',
                                'Connection': 'keep-alive'
                            }
                        }
                        vname = vname.replace('：', '')
                        vname = vname.replace(':', '')

                        const video = fs.createWriteStream(`${vname}.flv`)
                        const req3 = https.get(durlfix, options1, (res3) => {
                            res.end(`File "${vname}.flv" is downloading! aid=${aid}, cid=${cid}, quality=${quality}, format=${format}`)
                            res3.pipe(video)
                            // Readable Streams, Class: stream.Readable
                            let totalchunk1 = 0
                            let cal1
                            // maybe duplicatd?  vs readable
                            res3.on('data', (chunk) => {
                                totalchunk1 += chunk.length
                                cal1 = totalchunk1 / (1024 * 1024)
                                cal1 = Math.floor(cal1)
                                // console.log(`ondata - Received ${chunk.length} bytes of data`)
                                console.log(`onreadable - totally received ${cal1} mega byte of data`)
                            })

                            let totalchunk2 = 0
                            let cal2
                            res3.on('readable', () => {

                                let chunk
                                while (null !== (chunk = res3.read())) {
                                    // console.log(typeof chunk) object
                                    //  console.log(chunk.length)
                                    totalchunk2 += chunk.length
                                    // bite, byte, kilobyte, megabyte, gigabyte
                                    cal2 = totalchunk2 / (1024 * 1024)
                                    //  console.log("totalchunk2=", totalchunk2)
                                    //  console.log("cal2=", cal2)
                                    cal2 = Math.floor(cal2)
                                    //console.log("cal2=", cal2)
                                    // console.log(`Received ${chunk.length} bytes of data`)
                                    console.log(`onreadable - totally received ${cal2} mega byte of data`)
                                }

                            })
                            res3.on('end', () => {
                                console.log('The file is downloaded?')
                                // res.end(`bilibiliURL("${durl}")`)
                                //  res.end(`bilibiliURL('{"name":"zero"}')`)
                            })
                            res3.on('error', () => {
                                console.log('the file is not downloaded?')
                            })

                        }).on('error', (e) => {
                            console.error(e)
                        })
                        req3.end()
                    })
                })
                    .on('error', (e) => {
                        console.error(e)
                    })

                req2.end()
                console.log('res1 is end!!!')
            })
        })
            .on('error', (e) => {
                console.error(e)
            })

        req1.end()
    } else if (url.pathname === '/bilibilitest') {
        const options10 = {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.13; rv:56.0) Gecko/20100101 Firefox/56.0',
                'Accept': '*/*',
                'Accept-Language': 'en-US,en;q=0.5',
                'Accept-Encoding': 'gzip, deflate, br',
                'Range': 'bytes=0-',
                'Referer': 'http://www.bilibili.com/video/av46174956/',
                'Origin': 'https://www.bilibili.com',
                'Connection': 'keep-alive'
            }
        }
        const url10 = "https://upos-sz-mirrorhw.bilivideo.com/upgcxcode/05/64/107366405/107366405-1-112.flv?e=ig8euxZM2rNcNbhgnwUVhwdlhzN37WdVhoNvNC8BqJIzNbfqXBvEqxTEto8BTrNvN0GvT90W5JZMkX_YN0MvXg8gNEV4NC8xNEV4N03eN0B5tZlqNxTEto8BTrNvNeZVuJ10Kj_g2UB02J0mN0B5tZlqNCNEto8BTrNvNC7MTX502C8f2jmMQJ6mqF2fka1mqx6gqj0eN0B599M=&uipk=5&nbs=1&deadline=1582041284&gen=playurl&os=hwbv&oi=1881164611&trid=10c5bdace1424cf1bc857270f1a7362au&platform=pc&upsig=ca96d082a1a3b46112d0be50773ac4eb&uparams=e,uipk,nbs,deadline,gen,os,oi,trid,platform&mid=350687968"
        const video = fs.createWriteStream(`${vname}.flv`)
        const req10 = https.get(url10, options10, (res10) => {
            res10.pipe(video)
            res10.on('end', () => {
                console.log('end')
                res.end('end')
            })
        })

    }


})



server.on('checkContinue', (req, res) => {
    console.log('checkContinue')
})

server.on('checkExpectation', (req, res) => {
    console.log('checkExpectation')
})

server.on('clientError', (err, socket) => {
    console.log('clientError')
})

server.on('close', () => {
    console.log('close')
})

server.on('connect', (req, socket, head) => {
    console.log('connect')
})

server.on('connection', (socket) => {
    console.log('connection')
})

server.on('request', (req, res) => {
    console.log('request')
})

server.on('upgrade', (req, socket, head) => {
    console.log('upgrade')
})

console.log("server.listening:", server.listening)



const port = 8080




// 监听某个端口
// ip省略的话应该是127.0.0.1即本机
server.listen(port)

console.log("server.maxHeadersCount:", server.maxHeadersCount)
console.log("server.headersTimeout:", server.headersTimeout)
console.log("server.timeout:", server.timeout)
console.log("server.keepAliveTimeout:", server.keepAliveTimeout)
console.log("server.listening:", server.listening)


console.log(`server is running on http://localhost:${port}`)
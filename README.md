# bilibili

## 项目描述
下载bilibili的视频

## 技术栈
node.js开发






## 手机端通过缓存下载
缓存下载 ，[b站上下的视频都在手机哪个文件夹里](https://zhidao.baidu.com/question/693770421388682884.html)？，就是在 Android - data - tv.danmaku.bili - download里面， 不过音频是audio.m4s, 视频是video.m4s;

in my computer, connect it to my phone, then search this

`This PC\MI 8\Internal shared storage\Android\data\tv.danmaku.bili\download`

                
将视频和音频合在一起,pr不支持m4s,格式工厂也不支持。试试把m4s，视频的改成mp4(pr),flv和acc, mp3, wav(pr)。发现格式工厂不知都怎么把视频和音频合并，那用pr,用mp4和wav的。


        
refer to: [哔哩哔哩视频下载请求头的分析及伪造](https://www.jianshu.com/p/bde71597a318)



        
[V2EX - 哔哩哔哩的视频全部升级成 BV 号了](https://www.v2ex.com/t/655367?p=1)，我看到他们聊到使用“window.aid”获取aid

现在aid不能直接看了，每个aid都要f12,console里面拿，要使用`window.aid`
        
```
刺客信条起源第10部分 英文字幕 Assassins Creed Origins Part 10 English Subtitle
url: https://www.bilibili.com/video/av61744932/
aid: 61744932  60698326
api1: https://api.bilibili.com/x/web-interface/view?aid=60698326

avid = aid, cid = 107366405(api1)
api2: https://api.bilibili.com/x/player/playurl?avid=60698326&cid=105640636&qn=74&otype=json


https://www.bilibili.com/video/av88447271?p=97
页数p



my analysis:

get cid: 
https://api.bilibili.com/x/player/pagelist?aid=606983262&jsonp=jsonp

https://api.bilibili.com/x/web-interface/view?aid=606983262&cid=105640636




### reference
- Nodejs教程20：WebSocket之二：用原生实现WebSocket应用 https://blog.csdn.net/chencl1986/article/details/88411056
- 原生模块打造一个简单的 WebSocket 服务器 https://zhuanlan.zhihu.com/p/26407649
- Writing WebSocket servers https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API/Writing_WebSocket_servers
- Writing WebSocket client applications https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API/Writing_WebSocket_client_applications
- Writing a WebSocket server in Java Introduction https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API/Writing_a_WebSocket_server_in_Java
- Writing WebSocket servers https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API/Writing_WebSocket_servers
- The WebSocket API (WebSockets) https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API
- WebSocket https://developer.mozilla.org/en-US/docs/Web/API/WebSocket
- net https://nodejs.org/dist/latest-v14.x/docs/api/net.html
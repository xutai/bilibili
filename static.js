
/* test
const url = 'js/home.js'

module.exports = {
    url
}
*/


/*
思路：
static(文件夹名)
读取文件夹里面的每一个文件，然后套一下模式
*/

/*
else if (url.pathname === '/css/home.css') {
        fs.readFile(path.resolve(__dirname, 'css/home.css'), (err, data) => {
            if (err) throw err
            res.end(data)
        })
    } else if (url.pathname === '/js/home.js') {
        fs.readFile(path.resolve(__dirname, 'js/home.js'), (err, data) => {
            if (err) throw err
            res.end(data)
        })
    }
    */

const fs = require('fs')
const path = require('path')
module.exports = (folder, pathname, res) => {

    if (pathname.indexOf('/' + folder) === 0) {
        console.log('0')

        // console.log("__dirname: ", __dirname)
        //  console.log(path.relative(__dirname, '../js'))
        //  console.log(path.parse(__dirname))
        //  console.log(path.dirname(__dirname))
        const pathObj = path.parse(__dirname)
    //    console.log(pathObj.dir)
        const thePath = path.resolve(pathObj.dir, folder)
        console.log(thePath, pathname)

      //  console.log(pathname)

      // const filePath = path.relative(pathObj.dir, pathname)
      console.log(path.parse(pathname))
      const filePath = path.resolve(pathObj.dir,  '.' + pathname )
      console.log(filePath)

      fs.readFile(filePath, (err, data) => {
        if (err) throw err
        console.log(data)
        res.end(data)
    })


    } else {
        console.log('1')
    }

    /*
    fs.readFile(thePath, (err, data) => {
        if (err) throw err
       
        console.log(data)
    })
    */
}
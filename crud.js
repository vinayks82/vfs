let fs = require('fs')
let express = require('express')
let morgan = require('morgan')
let trycatch = require('trycatch')
let bodyParser = require('simple-bodyparser')
let path = require('path')
let mime = require('mime-types')
let rimraf = require('rimraf')
let mkdirp = require('mkdirp')
let archiver = require('archiver')
let nssocket = require('nssocket');
let DIRNAME = '/Users/ssahu6/my_stuff/training/nodejs/week-2/watch_dir/'
let zipFileName = 'vfs_demo.zip'

function HTTPServer(dir) {

    DIRNAME = dir
    console.log('Client dir: '+dir)
    const NODE_ENV = process.env.NODE_ENV
    const PORT = process.env.PORT || 8000

    let app = express()
    if( NODE_ENV === 'development') {
        app.use(morgan('dev'))
    }

    app.listen(PORT, () => console.log(`listening @http://127.0.0.1:${PORT}`))

    app.head('*', setFileMeta, sendHeaders)
    app.get('*', read)
    app.put('*', setFileMeta, setDirDetails, create)
    app.post('*', setFileMeta, update)
    app.delete('*', setFileMeta, remove)

}
    
function read(req, res) {

    console.log('dirPath: '+DIRNAME)
    let archive = archiver('zip')
    res.attachment('downloadArchive.zip');
    archive.pipe(res);
    archive.directory(DIRNAME)
    archive.finalize()
}

function create(req, res) {
    console.log('Creating file: '+req.filePath);
    mkdirp(req.dirPath, ()=> {
        if(!req.isDir) {
            req.pipe(fs.createWriteStream(req.filePath))
        }
    })
}

function update(req, res) {
    if(!req.stat) {
        res.send(405, 'File does not exist')
        return
    }
    console.log('Updating file: '+req.filePath);
    fs.truncate(req.filePath, 0, (err)=>{
        if(!err){
            req.pipe(fs.createWriteStream(req.filePath))
            res.end()
        }else {
            console.log(err)
        }
    })
}

function remove(req, res) {
    console.log('Deleting File : '+req.filePath)
    if(req.stat && req.stat.isDirectory()) {
        rimraf(req.filePath, ()=>res.end())
    } else {
        fs.unlink(req.filePath, ()=>res.end())
    }
}

function setFileMeta(req, res, next) {
    req.filePath = path.resolve(path.join(DIRNAME, req.url))
    console.log(req.filePath)
    if(req.filePath.indexOf(DIRNAME) !== 0){
        res.send(400, 'INvalid path')
        return
    }
    fs.stat(req.filePath, (err, stat)=>{
        if(err)
            req.stat = null
        else
            req.stat = stat
        next()
    })
}

function setDirDetails(req, res, next) {
    req.filePath = path.resolve(path.join(DIRNAME, req.url))
    if(req.stat) {
        res.send(405, 'File exists')
        return
    }

    let filePath = req.filePath
    let endsWithSlash = filePath.charAt(filePath.length - 1) === path.sep
    let hasExt = path.extname(filePath) !== ''
    let isDir = endsWithSlash || !hasExt
    req.dirPath = isDir ? filePath : path.dirname(filePath)
    next()
}

function sendHeaders(req, res, next) {
    console.log(req.filePath)
    fs.stat(req.filePath, (err, stat)=>{
        if(stat.isDirectory()) {
            fs.readdir(req.filePath, (err, files)=>{
                console.log('inside readdir: ' + files)
                res.body = JSON.stringify(files)    
                res.setHeader('Content-Length', res.body.length)
                res.setHeader('Content-Type', 'application/json')
                next()
            })
        } else {
            res.setHeader('Content-Length', stat.size)
            let contentType = mime.contentType(path.extname(req.filePath))
            res.setHeader('Content-Type', contentType)
            next()
        }
        
    })
}

module.exports = HTTPServer

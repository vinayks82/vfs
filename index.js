let FTPServer = require('./server')
let argv = require('yargs').argv
let dir = argv.dir

const ROOT_DIR = dir || process.cwd()

FTPServer(ROOT_DIR)

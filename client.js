#!/usr/bin/env node --use_strict --harmony
let HTTPServer = require('./crud')
let request = require('request')
let fs = require('fs')
var path = require('path');
var mime = require('mime');
let unzip = require('unzip')
let argv = require('yargs').argv
let dir = argv.dir
let zipFileName = 'vfs_demo.zip'

let options = {
    url: 'http://127.0.0.1:8000/',
   headers: {'Accept': 'application/x-gtar'}
}

let nssocket = require('nssocket');
function ftpClient(dir) {

	//first step: download the zip 
	let r = request(options.url)
	r.on('response',  function (res) {
		let filename = path.resolve(path.join(__dirname, zipFileName))
  		res.pipe(fs.createWriteStream(filename))

  		//extract the zip
  		// extract doesn't work in strict mode.
  		//fs.createReadStream(filename).pipe(unzip.Extract({ path: dir }));
	})
    let outbound = new nssocket.NsSocket();
    outbound.data('VFS_Server', function (data) {

    //process the changes.
 	if(data.EVENT === 'ADD' || data.EVENT === 'ADD_DIR'){
 		let str = new Buffer(data.body, 'utf8')
 		request.put({
 			url: options.url+data.PATH,
 			body: str
 		})
 		
 	} else if( data.EVENT === 'UPDATE') {
 		let str = new Buffer(data.body, 'utf8')
 		request.post({
 			  url: options.url+data.PATH,
			  body: str
 		})
 	} else if( data.EVENT === 'DELETE' || data.EVENT === 'DELETE_DIR') {
 		request.del(options.url+data.PATH)
 	} else {
 		//no op.
 	}
    outbound.send('VFS_Client', 'hello from client');
    });

    outbound.connect(8001);
}

ftpClient(dir)
HTTPServer(dir)
// let data = request(options, 'http://dev.walmart.com:8000');
// let extract = tar.extract()
// extract.on('entry', function(header, data, callback){
// });


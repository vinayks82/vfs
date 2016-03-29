#!/usr/bin/env node --use_strict --harmony
let nssocket = require('nssocket');
let chokidar = require('chokidar');
let fs = require('fs')

function FTPServer(dir){
	console.log('Monitorning on: ' + dir)
	let watcher = chokidar.watch(dir, {
	  ignored: /(node_modules|\.git)/,
	  persistent: true
	});


	let server = nssocket.createServer(function (socket) {
		console.log('FTP server connected....')
		socket.send('VFS_Server', 'hello from server')

		watcher
		  .on('add', path=> {
		  	//socket.send('VFS_Server', {EVENT:'ADD', PATH: path})
		  	fs.readFile(path, (err,data)=>{
		  		let relPath = (((path.split(dir))[1]).split('/'))[1]
		  		socket.send('VFS_Server', {EVENT:'ADD', PATH: relPath, body: data})
		  	})
		  })
		  .on('change', path => {
		  	//socket.send('VFS_Server', {EVENT:'UPDATE', PATH: path}))
		  	fs.readFile(path, (err,data)=>{
		  		let relPath = (((path.split(dir))[1]).split('/'))[1]
		  		socket.send('VFS_Server', {EVENT:'UPDATE', PATH:relPath, body: data})
		  	})
		  })
		  .on('unlink', path => {
	  		let relPath = (((path.split(dir))[1]).split('/'))[1]
		  	socket.send('VFS_Server', {EVENT:'DELETE', PATH: relPath})
		  })
		  .on('addDir', path => {
	  		let relPath = (((path.split(dir))[1]).split('/'))[1]
		  	socket.send('VFS_Server', {EVENT:'ADD_DIR', PATH: relPath})
		  })
		  .on('unlinkDir', path => {
	  		let relPath = (((path.split(dir))[1]).split('/'))[1]
		  	socket.send('VFS_Server', {EVENT:'DELETE_DIR', PATH: relPath})
		  })
	})

	server.listen(8001, () => {
		console.log('FTP server started..')
	});
}

module.exports = FTPServer
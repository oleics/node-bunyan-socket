
module.exports = create

var fs = require('fs')
  , net = require('net')
  , Stream = require('stream').Stream
  , log = require('./client')('bunyan-server')

function create(options, cb) {
  
  if(options instanceof Function) {
    cb = options
    options = null
  }
  cb = cb || function(){}
  
  options = options || {}
  
  options.input = options.input || {}
  options.input.port = options.input.port || 7000
  options.input.host = options.input.host || false
  
  options.output = options.output || {}
  options.output.port = options.output.port || 7001
  options.output.host = options.output.host || false

  // all-in, all-out stream
  var bridge = new Stream()
  bridge.readable = false
  bridge.writable = true
  bridge.write = function(d) {
    this.emit('data', d)
  }
  bridge.end = function() {
    log.debug('bridge end')
    bridge.writable = false
    this.emit('end')
  }
  bridge.destroy = function() {
  }
  bridge.setMaxListeners(1)
  
  // pipe the bridge
  if(options.streamTo) {
    bridge.setMaxListeners(bridge._maxListeners+2)
    bridge.pipe(options.streamTo)
  }

  // input server
  createInputServer(bridge, options.input, function(err, input) {
    if(err) return cb(err)
    log.info('listening for input on:', input.address())
    
    // output server
    createOutputServer(bridge, options.output, function(err, output) {
      if(err) return cb(err)
      log.info('listening for output on:', output.address())
      cb(null, input, output)
    })
  })
  
}

function printListeners(o) {
  console.log('_maxListeners', o._maxListeners)
  Object.keys(o._events).forEach(function(k) {
    console.log(k, o._events[k].length)
  })
}

function createInputServer(pipeTarget, options, cb) {
  var server = createServer(options)
  
  server
    .on('error', cb)
    .on('listening', function() {
      this.removeListener('error', cb)
      cb(null, server)
    })
    .on('connection', function(conn) {
      log.debug('input conn from:', conn.remotePort, conn.remoteAddress)
      
      conn.on('close', function() {
        log.debug('input conn closed', conn.remotePort, conn.remoteAddress)
        pipeTarget.setMaxListeners(pipeTarget._maxListeners-1)
      })
      
      conn.pipe(pipeTarget)
      pipeTarget.setMaxListeners(pipeTarget._maxListeners+1)
    })
}

function createOutputServer(pipeSource, options, cb) {
  var server = createServer(options)
  
  server
    .on('error', cb)
    .on('listening', function() {
      this.removeListener('error', cb)
      cb(null, server)
    })
    .on('connection', function(conn) {
      log.debug('output conn from:', conn.remotePort, conn.remoteAddress)
      
      conn.on('close', function() {
        log.debug('output conn closed:', conn.remotePort, conn.remoteAddress)
        pipeSource.setMaxListeners(pipeSource._maxListeners-2)
      })
      
      pipeSource.setMaxListeners(pipeSource._maxListeners+2)
      pipeSource.pipe(conn)
    })
}

function createServer(options) {
  var server = net.createServer()
  if(options.port && options.host) {
    server.listen(options.port, options.host)
  } else if(options.port) {
    server.listen(options.port)
  } else {
    server.listen()
  }
  return server
}
/* 
function ConnectionManager() {
  if(!(this instanceof ConnectionManager)) return new ConnectionManager()
  
  this.connections = []
}

ConnectionManager.prototype.add = function(conn) {
  var self = this
  if(self.connections.indexOf(conn) === -1) {
    self.connections.push(conn)
    conn.on('close', function() {
      self.remove(conn)
    })
  }
  return self
}

ConnectionManager.prototype.remove = function(conn) {
  var index = this.connections.indexOf(conn)
  if(index !== -1) {
    this.connections.splice(index, 1)
  } else {
    console.warn('Could not remove connection', conn)
  }
  return this
}
 */
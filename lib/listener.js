
module.exports = create

var Lazy = require('lazy')
  , net = require('net')
  , Stream = require('stream').Stream
  , stream = new Stream()

stream.writable = true
stream.write = function(d) {
  this.emit('data', d)
}
stream.destroy = function() {
}

function create(port, host) {
  port = port || 7001
  if(!isNaN(port)) {
    host = null
  } else {
    host = host || 'localhost'
  }
  connect(port, host)
  return stream
}

function connect(port, host) {
  var conn
  if(port && host) {
    conn = net.connect(port, host)
  } else {
    conn = net.connect(port)
  }

  function onError(err) {
    if(err.code === 'ECONNREFUSED') {
      connect(port, host)
      return 
    }
    stream.emit('error', err)
  }

  function onClose(had_error) {
    if(!had_error) {
      stream.emit('close')
      connect(port, host)
    }
  }

  function onConnect() {
    stream.emit('connection', this)
    Lazy(this)
      .lines
      .map(String)
      .forEach(function(d) {
        stream.emit('data', d)
      })
    // this.pipe(stream)
  }
  
  conn
    .on('error', onError)
    .on('close', onClose)
    .on('connect', onConnect)
}

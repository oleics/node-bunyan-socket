
module.exports = create

var net = require('net')
  , Stream = require('stream').Stream
  , Logger = require('bunyan')

function create(name, port, host) {
  var bufStream = createBufferStream(10000)
    , logger = createLogger(name, bufStream)
  
  // create the connection
  port = port || 7000
  if(!isNaN(port)) {
    host = null
  } else {
    host = host || 'localhost'
  }
  connect(bufStream, port, host)
  
  return logger
}

function connect(pipeSource, port, host) {
  var conn
  if(port && host) {
    conn = net.connect(port, host)
  } else {
    conn = net.connect(port)
  }
  
  conn
    .on('error', function(err) {
      pipeSource.pause()
      if(err.code === 'ECONNREFUSED'/*  || err.code === 'EADDRNOTAVAIL' */) {
        connect(pipeSource, port, host)
      } else {
        throw err
      }
    })
    .on('timeout', function() {
      pipeSource.pause()
    })
    .on('close', function(had_error) {
      pipeSource.pause()

      if(!had_error) {
        connect(pipeSource, port, host)
      }
    })
    .on('connect', function() {
      pipeSource.pipe(conn)
      pipeSource.resume()
    })
}

// Creates a new logger
function createLogger(name, stream) {
  var logger = new Logger({
    name: name
    , streams: [
        {
          stream: stream
          , level: 'trace'
        }
      ]
    , serializers: {
        req: Logger.stdSerializers.req
        , res: Logger.stdSerializers.res
      }
  })
  return logger
}

// Creates a buffered stream
function createBufferStream(bufferMax) {
  var s = new Stream()
  s.readable = true
  s.writable = true
  s.paused = true
  s.buffer = []
  s.bufferMax = bufferMax || 10000
  s.pause = function() {
    this.paused = true
  }
  s.resume = function() {
    this.paused = false
    while(this.buffer.length) {
      this.emit('data', this.buffer.shift())
    }
  }
  s.write = function(d) {
    if(this.paused) {
      this.buffer.push(d)
      while(this.buffer.length > s.bufferMax) {
        this.buffer.shift()
      }
    } else {
      while(this.buffer.length) {
        this.emit('data', this.buffer.shift())
      }
      this.emit('data', d)
    }
  }
  s.end = function() {
    s.writable = false
    this.emit('end')
  }
  s.destroy = function() {
  }
  return s
}

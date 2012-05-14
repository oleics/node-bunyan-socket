
Bunyan Socket
=============

Bundle up all of your [bunyan](https://github.com/trentm/node-bunyan) log messages by streaming them to one bunyan-server.

Installation
------------

``npm install -g bunyan-socket``

Usage Examples
--------------

### Start the server

``bunyan-server``

### Create a logger

Make sure to install bunyan-socket via npm inside your project-  
directory:
```sh
cd path/to/your/project
npm install bunyan-socket
```

Then, in your app.js:

```js
var log = require('bunyan-socket')('OnePartOfMyApp')

// log is an instance of a bunyan-logger
log.info('hello!') // log-message goes to the bunyan-server
```

And in - for example - in boom.js:

```js
var log = require('bunyan-socket')('AnotherPartOfMyApp')
log.info('hello!')

var sublog = log.child({component: 'SubPart'})
sublog.debug(process)
```

Everything you log will go now to the bunyan-server.

The messages will be buffered if the server is temporarily down.

### Listen to the bunyan-server

Read the logs of all our process as a real-time-stream:

``bunyan-listener``

For all you humans with nice colors:

``bunyan-listener | bunyan``

#### Programmatically listen to the bunyan-server

```js
var listener = require('bunyan-socket/listener')(port, host)

listener
  .on('connection', function(conn) {
    log.info('connection', conn.remoteAddress, conn.remotePort, conn.address())
  })
  .on('close', function(conn) {
    log.info('close')
  })
  .on('data', function(d) {
    process.stdout.write(d.toString())
  })
```

MIT License
-----------

Copyright (c) 2012 Oliver Leics <oliver.leics@gmail.com>

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

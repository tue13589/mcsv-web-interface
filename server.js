const express = require('express');
const app = express();

require('dotenv').config();

const path = require('path');
const fs = require('fs')

var pidusage = require('pidusage')

var expressWs = require('express-ws')(app);

var chproc = require('child_process');

app.get('/clust/:id/shell', function (req, res) {
    // read spigot.html and replace /:id/ snippet with id
    var id = req.params.id;
    // if /src/:id/ does not exist, send 400 cluster not found
    if (!fs.existsSync(__dirname + '/src/' + id)) {
        res.status(400).send('Cluster not found');
        return;
    }
    var html = fs.readFileSync(__dirname + '/spigot.html', 'utf8');
    html = html.replace(/:id/g, id);
    res.send(html);
})
let dir = __dirname + '/';

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/list.html');
})

app.get('/api/clust', (req, res) => {
    // get folders in /src/, then send back list, id: {status: task[cluster:id] }
    var list = fs.readdirSync(__dirname + '/src/');
    var ret = {};
    for (var i = 0; i < list.length; i++) {
        var id = '' + list[i];
        ret[id] = { status: task["cluster:"+id] != undefined};
    }
    res.send(ret);
})

let task = {}

function spawn(id) {
    task[id] = chproc.spawn('java', ['-jar', 'server.jar', 'nogui'], { cwd: __dirname + '/src/' + id.split('cluster:')[1] + '/' });
}

app.ws('/mon', function (ws, req) {
    const id = "cluster:" + req.query.id
    // loop every 1 second
    setInterval(function () {
        if (task[id] == undefined) return
        pidusage(task[id].pid, function (err, stats) {
            ws.send(JSON.stringify(stats));
        });
    }, 1000);
})

// app.ws('/std', function (ws, req) {
//     global.listen = () => {
//         ws.on('message', (msg) => {
//             // write to buffer
//             task[id].stdin.write(msg);
//         });
//         task[id].stdout.on('data', (data) => {
//             ws.send(data.toString());
//         }
//         );
//         task[id].stderr.on('data', (data) => {
//             ws.send(data.toString());
//         }
//         );
//         task[id].on('exit', (code) => {
//             ws.send('exit\r\s');
//         });
//         task[id].on('error', (err) => {
//             ws.send('error' + err + '\r\s');
//         })
//     }
// })

app.ws('/std', function (ws, req) {
    const id = "cluster:" + req.query.id
    ws.on('message', (msg) => {
        task[id].stdin.write(msg);
    });
    global.bws = ws
})

app.ws('/act', function (ws, req) {
    const id = "cluster:" + req.query.id
    ws.on('message', function (msg) {
        switch (msg) {
            case 'start':
                if (true) {
                    spawn('' + id);
                    ws.send('\rServer started');
                    task[id].on('exit', function (code) {
                        global.bws.send('[Java Daemon] Process exited with code ' + code + '');
                    })
                    task[id].on('error', function (err) {
                        global.bws.send('[Java Daemon] Process died: ' + err);
                    })
                    // global.listen();
                    // task[id] on stdout and stderr, foreach line, write to lbuffer and send lbuffer to /std
                    task[id].stdout.on('data', (data) => {
                        let lbuffer = ''
                        let lines = data.toString().split('\n');
                        lines.forEach(line => {
                            lbuffer += line + '\r\n';
                            global.bws.send(lbuffer);
                            lbuffer = '';
                        });
                    });
                }
                break;
            case 'stop':
                if (task[id] != undefined) {
                    global.bws.send('[Java Daemon] Stopping process...');
                    task[id].stdin.write('stop\r\s');
                    task[id] = undefined;
                }
                break;
            case 'force':
                if (task[id] != undefined) {
                    global.bws.send('[Java Daemon] Killing process...');
                    task[id].kill()
                    task[id] = undefined;
                }
                break
            case 'restart':
                global.bws.send('[Java Daemon] Restarting process...');
                if (task[id] != undefined) {
                    task[id].kill();
                    task[id] = undefined;
                }
                spawn()
                global.listen();
                break;
        }
    })
})

app.listen(3000, function () {
    console.log('listening on 3000');
})

app.use(express.static('./'));
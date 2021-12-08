// Custom theme to match style of xterm.js logo
var baseTheme = {
    foreground: '#F8F8F8',
    background: '#2D2E2C',
    selection: '#5DA5D533',
    black: '#1E1E1D',
    brightBlack: '#262625',
    red: '#CE5C5C',
    brightRed: '#FF7272',
    green: '#5BCC5B',
    brightGreen: '#72FF72',
    yellow: '#CCCC5B',
    brightYellow: '#FFFF72',
    blue: '#5D5DD3',
    brightBlue: '#7279FF',
    magenta: '#BC5ED1',
    brightMagenta: '#E572FF',
    cyan: '#5DA5D5',
    brightCyan: '#72F0FF',
    white: '#F8F8F8',
    brightWhite: '#FFFFFF'
};
// vscode-snazzy https://github.com/Tyriar/vscode-snazzy
var otherTheme = {
    foreground: '#eff0eb',
    background: '#282a36',
    selection: '#97979b33',
    black: '#282a36',
    brightBlack: '#686868',
    red: '#ff5c57',
    brightRed: '#ff5c57',
    green: '#5af78e',
    brightGreen: '#5af78e',
    yellow: '#f3f99d',
    brightYellow: '#f3f99d',
    blue: '#57c7ff',
    brightBlue: '#57c7ff',
    magenta: '#ff6ac1',
    brightMagenta: '#ff6ac1',
    cyan: '#9aedfe',
    brightCyan: '#9aedfe',
    white: '#f1f1f0',
    brightWhite: '#eff0eb'
};
var isBaseTheme = true;

var term = new window.Terminal({
    fontFamily: '"Cascadia Code", Menlo, monospace',
    theme: otherTheme,
    cursorBlink: false,
    scrollback: 2048,
});
term.open(document.querySelector('#terminal'));

var isWebglEnabled = false;
try {
    const webgl = new WebglAddon.WebglAddon();
    term.loadAddon(webgl);
    isWebglEnabled = true;
} catch (e) {
    console.warn('WebGL addon threw an exception during load', e);
}

// Cancel wheel events from scrolling the page if the terminal has scrollback
document.querySelector('.xterm').addEventListener('wheel', e => {
    if (term.buffer.active.baseY > 0) {
        e.preventDefault();
    }
});

function runFakeTerminal() {
    if (term._initialized) {
        return;
    }

    term._initialized = true;

    term.prompt = () => {
        term.write();
    };

    // TODO: Use a nicer default font
    term.writeln([
        ' ======= ',
        '  XTERM ',
        ' ======= '
    ].join('\n\r'));

    // term.writeln('Below is a simple emulated backend, try running `help`.');
    //prompt(term);

    term.onData(e => {
        // console.log(ulit(e))
        switch (e) {
            case '\u0003': // Ctrl+C
                term.write('^C');
                break;
            case '\r': // Enter
                // console.log('Send CMD ' + command);
                socket.send(command + "\r")
                term.write('\x1b[2K\r')
                command = '';
                break;
            case '\u007F': // Backspace (DEL)
                // Do not delete the prompt
                if (true) {
                    term.write('\b \b');
                    if (command.length > 0) {
                        command = command.substr(0, command.length - 1);
                    }
                }
                break;
            default: // Print all other characters for demo
                command += e;
                // console.log(command);
                term.write(e);
        }
    });

    // Create a very simple link provider which hardcodes links for certain lines
    term.registerLinkProvider({
        provideLinks(bufferLineNumber, callback) {
            switch (bufferLineNumber) {
                case 2:
                    callback([]);
                    return;
                case 8:
                    callback([]);
                    return;
                case 14:
                    callback([]);
                    return;
            }
            callback(undefined);
        }
    });
}

let dir = ''

var command = '';

runFakeTerminal();

const socket = new WebSocket('ws://localhost:3000/std?id=' + id);
socket.addEventListener('open', function (event) {
});
socket.addEventListener('message', function (event) {
    term.write(event.data);
});

const act = new WebSocket('ws://localhost:3000/act?id=' + id)
act.addEventListener('message', function (event) {
    //console.log(event.data);
})
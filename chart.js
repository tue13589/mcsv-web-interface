const mon = new WebSocket('ws://localhost:3000/mon?id=' + id);
/*
Schema
  // => {
  //   cpu: 10.0,            // percentage (from 0 to 100*vcore)
  //   memory: 357306368,    // bytes
  //   ppid: 312,            // PPID
  //   pid: 727,             // PID
  //   ctime: 867000,        // ms user + system time
  //   elapsed: 6650000,     // ms since the start of the process
  //   timestamp: 864000000  // ms since epoch
  // }
Start 2 chart with cpu and memory
*/

function hex(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

mon.onopen = () => {
    mon.send('start');
}
const cpuChart = new Chart(document.getElementById('cpu-chart'), {
    type: 'line',
    data: {
        labels: [],
        datasets: [{
            label: 'CPU',
            data: [],
            backgroundColor: 'rgba(255, 99, 132, 0.2)',
            borderColor: 'rgba(255, 99, 132, 1)',
            cubicInterpolationMode: 'monotone',
            borderWidth: 1
        }]
    },
    options: {
        scales: {
            yAxes: [{
                ticks: {
                    beginAtZero: true
                }
            }]
        }
    }
});
const memoryChart = new Chart(document.getElementById('memory-chart'), {
    type: 'line',
    data: {
        labels: [],
        datasets: [{
            label: 'Memory',
            data: [],
            backgroundColor: 'rgba(255, 99, 132, 0.2)',
            borderColor: 'rgba(255, 99, 132, 1)',
            cubicInterpolationMode: 'monotone',
            borderWidth: 1
        }]
    },
    options: {
        scales: {
            yAxes: [{
                ticks: {
                    beginAtZero: true
                }
            }]
        }
    }
});
let max = 10
mon.onmessage = (msg) => {
    const data = JSON.parse(msg.data);
    const cpu = data.cpu;
    const memory = data.memory;
    const timestamp = data.timestamp;
    //delete last item if over 100
    if (cpuChart.data.labels.length > max) {
        cpuChart.data.labels.shift();
        cpuChart.data.datasets[0].data.shift();
    }
    cpuChart.data.labels.push('');
    cpuChart.data.datasets[0].data.push(cpu / 100);
    if (memoryChart.data.labels.length > max) {
        memoryChart.data.labels.shift();
        memoryChart.data.datasets[0].data.shift();
    }
    memoryChart.data.labels.push('');
    memoryChart.data.datasets[0].data.push(memory/1024/1024);
    cpuChart.update();
    memoryChart.update();
}
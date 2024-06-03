const { app, BrowserWindow, ipcMain } = require('electron');
const url = require("url");
const path = require("path");
const dgram = require('dgram');

let mainWindow;
let udpClient;
let clientPort = 0; // Default port
let clientHost = '127.0.0.1'; // Default host

function createWindow() {
  mainWindow = new BrowserWindow({
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  mainWindow.loadURL(
    url.format({
      pathname: path.join(__dirname, `dist/archat-client/browser/index.html`),
      protocol: "file:",
      slashes: true
    })
  );

  // Open the DevTools.
  mainWindow.webContents.openDevTools();

  mainWindow.on('closed', function () {
    mainWindow = null;
  });
}

app.on('ready', createWindow);

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', function () {
  if (mainWindow === null) createWindow();
});

// Initialize UDP client
function initializeUdpClient() {
  if (udpClient) {
    udpClient.close();
  }
  udpClient = dgram.createSocket('udp4');
  udpClient.bind(clientPort, () => {
    console.log(`Client bound to ${udpClient.address().port}:${clientPort}`);
  });

  //clientPort = udpClient.address().port;

  udpClient.on('message', (msg, rinfo) => {
    console.log(`Server got: ${msg} from ${rinfo.address}:${rinfo.port}`);
    mainWindow.webContents.send('udp-message', msg.toString());
  });
}

// Set up IPC to change UDP client configuration
ipcMain.on('configure-udp-client', (event) => {
  clientPort = udpClient.address().port
  initializeUdpClient();
});

ipcMain.on('send-udp-message', (event, message, port, host) => {
  udpClient.send(message, port, host, (err) => {
    if (err) {
      console.error('UDP message send error:', err);
    } else {
      console.log('UDP message sent:', message);
    }
  });
});

// Initialize client on start
initializeUdpClient();

// Import required modules from Electron
const { app, BrowserWindow, ipcMain } = require('electron');
// Import modules for handling URLs and file paths
const url = require("url");
const path = require("path");
// Import the dgram module for UDP communication
const dgram = require('dgram');

let mainWindow; // Variable to store the main application window
let udpClient; // Variable to store the UDP client instance
let clientPort = 0; // Default port for the UDP client (random on start)
let clientHost = '127.0.0.1'; // Default host for the UDP client

// Function to create the main application window
function createWindow() {
  mainWindow = new BrowserWindow({
    webPreferences: {
      nodeIntegration: true, // Allow Node.js integration
      contextIsolation: false // Disable context isolation
    }
  });

  // Load the HTML file into the window
  mainWindow.loadURL(
    url.format({
      pathname: path.join(__dirname, `dist/archat-client/browser/index.html`),
      protocol: "file:", // Load file from local file system
      slashes: true // Add slashes to the URL
    })
  );

  // Open the Developer Tools for debugging
  mainWindow.webContents.openDevTools();

  // Handle window close event
  mainWindow.on('closed', function () {
    mainWindow = null; // Dereference the window object
  });
}

// Event listener for when the Electron app is ready to create windows
app.on('ready', createWindow);

// Event listener for when all windows are closed
app.on('window-all-closed', function () {
  // On macOS, apps usually stay open until the user explicitly quits
  if (process.platform !== 'darwin') app.quit();
});

// Event listener for when the app is activated (macOS specific)
app.on('activate', function () {
  if (mainWindow === null) createWindow(); // Recreate the window if it was closed
});

// Function to initialize the UDP client
function initializeUdpClient() {
  if (udpClient) {
    udpClient.close(); // Close existing UDP client if any
  }
  udpClient = dgram.createSocket('udp4'); // Create a new UDP client using IPv4
  udpClient.bind(clientPort, () => {
    console.log(`Client bound to ${udpClient.address().port}:${clientPort}`);
  });

  // Event listener for receiving UDP messages
  udpClient.on('message', (msg, rinfo) => {
    console.log(`Server got: ${msg} from ${rinfo.address}:${rinfo.port}`);
    mainWindow.webContents.send('udp-message', msg.toString()); // Send the received message to the renderer process
  });
}

// IPC listener for configuring the UDP client
ipcMain.on('configure-udp-client', (event) => {
  clientPort = udpClient.address().port // Save befor random generated port of udp
  initializeUdpClient(); // Reinitialize the UDP client
});

// IPC listener for sending UDP messages
ipcMain.on('send-udp-message', (event, message, port, host) => {
  udpClient.send(message, port, host, (err) => {
    if (err) {
      console.error('UDP message send error:', err); // Log error if message sending fails
    } else {
      console.log('UDP message sent:', message); // Log success message
    }
  });
});

// Initialize the UDP client when the app starts
initializeUdpClient();

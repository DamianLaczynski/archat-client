const PROXY_CONFIG = [
  {
    context: [
      "/wsapi"
    ],
    target: "ws://localhost:8080",
    secure: false, 
  }
]

module.exports = PROXY_CONFIG;

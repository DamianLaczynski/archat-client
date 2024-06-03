const PROXY_CONFIG = [
  {
    context: [
      "/wsapi"
    ],
    target: "ws://krzyzanowski.dev:8080",
  }
]

module.exports = PROXY_CONFIG;

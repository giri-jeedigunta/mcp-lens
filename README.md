# MCP Lens

**MCP Lens** is an interactive Visual Studio Code extension for exploring both global and local Model Context Protocol (MCP) servers effortlessly.

[![Version](https://img.shields.io/badge/version-0.0.1-blue.svg)](https://github.com/giri-jeedigunta/mcp-lens)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

## Features

- 🌍 **Global & Local MCP Discovery**: Automatically detects MCP configurations from global VS Code settings and local workspace `.vscode/mcp.json` files
- 🎴 **Card-Based UI**: Beautiful card layout showing MCPs with status indicators, descriptions, and tool counts at a glance
- 🔍 **Interactive Explorer**: Browse MCPs in a dedicated activity bar view with expandable cards
- 📊 **Detailed MCP Information**: Click to expand any MCP card to view:
  - Real-time status (Running ●, Stopped ○, Error ✕)
  - Configuration (command, arguments, environment variables)
  - Available tools with count and details
  - Control buttons (Start, Stop, Restart)
- ⚡ **MCP Control**: Start, stop, and restart MCP servers directly from the UI
  - Inline action buttons on status items
  - Context menu options on MCP cards
  - Real-time process management
- 🎯 **Smart Filtering**: Filter view to show:
  - Both Global and Local MCPs
  - Global MCPs only
  - Local MCPs only
- 🔧 **MCP Inspector Integration**: Open MCPs directly with `npx mcp-inspector` for deeper analysis
- 📁 **Manual File Location**: Fallback option to manually locate MCP configuration files
- 🎨 **Modern UI**: Clean card-based interface with color-coded status indicators and rich tooltips

## Installation

### From VSIX (Development)

1. Clone the repository
2. Install dependencies: `npm install`
3. Compile the extension: `npm run compile`
4. Press `F5` to open a new VS Code window with the extension loaded

### From VS Code Marketplace (Coming Soon)

Search for "MCP Lens" in the VS Code Extensions marketplace.

## Usage

### Opening MCP Explorer

1. Click the MCP Lens icon in the Activity Bar (left sidebar)
2. The extension will automatically scan for:
   - **Global MCPs**: From your VS Code user settings
     - macOS: `~/Library/Application Support/Code/User/mcp.json`
     - Windows: `%APPDATA%\Code\User\mcp.json`
     - Linux: `~/.config/Code/User/mcp.json`
   - **Local MCPs**: From `.vscode/mcp.json` in your workspace

### Viewing MCP Details

- Click on any MCP item to open a detailed view showing:
  - Configuration details
  - Available tools (if detected)
  - Environment variables
  - Status information

### Filtering MCPs

Use the toolbar buttons to filter the view:
- **Show Both**: Display both global and local MCPs
- **Show Global Only**: Display only global MCPs
- **Show Local Only**: Display only local MCPs

### Using MCP Inspector

Right-click on any MCP and select "Open with MCP Inspector" to launch the MCP inspector tool for in-depth analysis.

### Manual File Location

If the extension cannot find your MCP configuration files:
1. Click the "Locate MCP File" button in the toolbar
2. Browse to your MCP JSON file
3. Select whether it's a Global or Local MCP file

## MCP Configuration Format

MCP configuration files follow this structure:

```json
{
  "mcpServers": {
    "server-name": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-name"],
      "env": {
        "API_KEY": "your-key"
      },
      "disabled": false,
      "alwaysAllow": ["tool1", "tool2"]
    }
  }
}
```

See the `examples/` directory for sample configurations.

## Requirements

- Visual Studio Code 1.106.1 or higher
- Node.js (for running MCP servers)

## Extension Commands

This extension contributes the following commands:

- `MCP Lens: Refresh MCP List` - Refresh the MCP explorer view
- `MCP Lens: Show Both Global and Local MCPs` - Display all MCPs
- `MCP Lens: Show Global MCPs Only` - Filter to global MCPs
- `MCP Lens: Show Local MCPs Only` - Filter to local MCPs
- `MCP Lens: Open MCP Details` - Open detailed view for selected MCP
- `MCP Lens: Open with MCP Inspector` - Launch MCP inspector
- `MCP Lens: Locate MCP File` - Manually locate MCP configuration file

## Known Issues

- Tool information is not automatically populated (requires manual inspection)
- Status detection is basic (requires MCP server to be running)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Author

**Giri Jeedigunta**
- Email: giri.jeedigunta@gmail.com
- GitHub: [@giri-jeedigunta](https://github.com/giri-jeedigunta)

## Acknowledgments

- Built with the [VS Code Extension API](https://code.visualstudio.com/api)
- Inspired by the Model Context Protocol specification
- UI design inspired by various VS Code extensions

---

**Enjoy exploring your MCPs with MCP Lens!** 🚀

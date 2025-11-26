# 📦 Repository Moved

This repository has been moved to the MCP Lens organization for better open-source collaboration and maintenance.

## 🔗 New Location

**Please visit the new repository:**

### [https://github.com/mcp-lens/mcp-lens](https://github.com/mcp-lens/mcp-lens)

---

## 📌 What This Means

- ✅ All code, issues, and development have moved to the new organization
- ✅ The extension continues to be actively maintained and improved
- ✅ Better structure for community contributions and open-source collaboration
- ✅ Same great features, now with a dedicated organization

## 🚀 Get the Extension

Install **MCP Lens** from the [VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=mcp-lens.mcp-lens)

---

**Thank you for your interest in MCP Lens!**

Please update your bookmarks and stars to the new repository location.

- **Global**: `~/Library/Application Support/Code/User/mcp.json` (macOS)
- **Workspace**: `mcp.json` in your project root (recommended for project-specific servers)

### Configuration Format

```json
{
  "mcpServers": {
    "server-name": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-name"],
      "env": {
        "API_KEY": "your-api-key"
      }
    }
  }
}
```

**Learn More**:
- [VS Code MCP Documentation](https://code.visualstudio.com/api/extension-guides/ai/mcp)
- [MCP Configuration Format](https://code.visualstudio.com/docs/copilot/customization/mcp-servers#_configuration-format)
- [Model Context Protocol Specification](https://modelcontextprotocol.io)

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

## Inspiration

MCP Lens draws inspiration from excellent tools like [Cline](https://github.com/cline/cline) and other AI-powered development extensions, focusing on making MCP server management accessible and elegant.

## Development

### Building from Source

```bash
# Clone the repository
git clone https://github.com/giri-jeedigunta/mcp-lens.git
cd mcp-lens

# Install dependencies
npm install

# Compile TypeScript
npm run compile

# Run in development mode
npm run watch

# Press F5 in VS Code to launch extension host
```

## Contributing

Contributions are welcome! Please see our [Contributing Guidelines](CONTRIBUTING.md) and [Code of Conduct](CODE_OF_CONDUCT.md).

**Quick Start:**
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT License - see the [LICENSE](LICENSE) file for details.

## Author

**Giri Jeedigunta**
- GitHub: [@giri-jeedigunta](https://github.com/giri-jeedigunta)
- Email: giri.jeedigunta@gmail.com

---

**Enjoy seamless MCP management with MCP Lens!** 🚀

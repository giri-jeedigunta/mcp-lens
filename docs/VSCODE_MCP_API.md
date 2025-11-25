# VSCode MCP Discovery API Reference

This document provides a comprehensive guide to using VSCode's built-in MCP (Model Context Protocol) discovery tools in your custom extension.

## Overview

VSCode provides native APIs for discovering and managing MCP servers through the `lm` namespace. Instead of manually parsing `mcp.json` files, you can use these official APIs to get MCP server definitions.

## Key API: `lm.registerMcpServerDefinitionProvider`

The primary API for MCP discovery is `lm.registerMcpServerDefinitionProvider`, which allows you to register a provider that returns MCP server definitions.

### API Signature

```typescript
namespace lm {
  /**
   * Registers a provider that publishes Model Context Protocol servers for the editor to
   * consume. This allows MCP servers to be dynamically provided to the editor in
   * addition to those the user creates in their configuration files.
   * 
   * Before calling this method, extensions must register the `contributes.mcpServerDefinitionProviders`
   * extension point with the corresponding {@link id}, for example:
   * 
   * ```json
   * "contributes": {
   *   "mcpServerDefinitionProviders": [
   *     {
   *       "id": "cool-cloud-registry.mcp-servers",
   *       "label": "Cool Cloud Registry"
   *     }
   *   ]
   * }
   * ```
   */
  function registerMcpServerDefinitionProvider(
    id: string, 
    provider: McpServerDefinitionProvider
  ): Disposable;
}
```

## MCP Server Definition Types

VSCode provides TypeScript types for MCP server definitions:

### `McpServerDefinition`

Union type representing different MCP server types:

```typescript
type McpServerDefinition = 
  | McpStdioServerDefinition 
  | McpHttpServerDefinition;
```

### `McpStdioServerDefinition`

For MCP servers that run as local processes using stdin/stdout:

```typescript
class McpStdioServerDefinition {
  constructor(
    label: string,
    command: string,
    args?: string[],
    env?: Record<string, string | number>,
    version?: string
  );

  label: string;
  command: string;
  args: string[];
  cwd?: Uri;
  env: Record<string, string | number>;
  version?: string;
}
```

### `McpHttpServerDefinition`

For MCP servers available via HTTP/Streamable HTTP transport:

```typescript
class McpHttpServerDefinition {
  constructor(
    label: string,
    uri: Uri,
    headers?: Record<string, string>,
    version?: string
  );

  label: string;
  uri: Uri;
  headers: Record<string, string>;
  version?: string;
}
```

## McpServerDefinitionProvider Interface

The provider interface you need to implement:

```typescript
interface McpServerDefinitionProvider<T extends McpServerDefinition = McpServerDefinition> {
  /**
   * Optional event fired to signal that the set of available servers has changed.
   */
  readonly onDidChangeMcpServerDefinitions?: Event<void>;

  /**
   * Provides available MCP servers. The editor will call this method eagerly
   * to ensure the availability of servers for the language model.
   * Extensions should not take actions which would require user interaction, 
   * such as authentication.
   */
  provideMcpServerDefinitions(
    token: CancellationToken
  ): ProviderResult<T[]>;

  /**
   * This function will be called when the editor needs to start a MCP server.
   * At this point, the extension may take any actions which may require user
   * interaction, such as authentication.
   */
  resolveMcpServerDefinition?(
    server: T,
    token: CancellationToken
  ): ProviderResult<T>;
}
```

## Implementation Example

Here's how to use the VSCode MCP API in your extension:

### 1. Register in package.json

```json
{
  "contributes": {
    "mcpServerDefinitionProviders": [
      {
        "id": "myextension.mcp-servers",
        "label": "My Extension MCP Servers"
      }
    ]
  }
}
```

### 2. Implement the Provider

```typescript
import * as vscode from 'vscode';

class MyMcpServerProvider implements vscode.McpServerDefinitionProvider {
  private _onDidChange = new vscode.EventEmitter<void>();
  readonly onDidChangeMcpServerDefinitions = this._onDidChange.event;

  async provideMcpServerDefinitions(
    token: vscode.CancellationToken
  ): Promise<vscode.McpServerDefinition[]> {
    // Read from global mcp.json
    const globalConfig = await this.readGlobalMcpConfig();
    
    // Read from workspace .vscode/mcp.json
    const localConfig = await this.readLocalMcpConfig();
    
    // Convert to VSCode MCP definitions
    const servers: vscode.McpServerDefinition[] = [];
    
    // Add stdio servers
    for (const [name, config] of Object.entries(globalConfig.servers || {})) {
      if (config.command) {
        servers.push(new vscode.McpStdioServerDefinition(
          name,
          config.command,
          config.args,
          config.env,
          config.version
        ));
      }
    }
    
    return servers;
  }

  async resolveMcpServerDefinition(
    server: vscode.McpServerDefinition,
    token: vscode.CancellationToken
  ): Promise<vscode.McpServerDefinition> {
    // Handle authentication, prompts, or other user interactions here
    return server;
  }

  private async readGlobalMcpConfig() {
    const configPath = this.getGlobalMcpPath();
    // Read and parse the file
    return {};
  }

  private async readLocalMcpConfig() {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (!workspaceFolder) return {};
    
    const configPath = vscode.Uri.joinPath(
      workspaceFolder.uri, 
      '.vscode', 
      'mcp.json'
    );
    // Read and parse the file
    return {};
  }

  private getGlobalMcpPath(): vscode.Uri {
    const platform = process.platform;
    let configPath: string;
    
    if (platform === 'win32') {
      configPath = path.join(
        process.env.APPDATA || '',
        'Code',
        'User',
        'mcp.json'
      );
    } else if (platform === 'darwin') {
      configPath = path.join(
        process.env.HOME || '',
        'Library',
        'Application Support',
        'Code',
        'User',
        'mcp.json'
      );
    } else {
      configPath = path.join(
        process.env.HOME || '',
        '.config',
        'Code',
        'User',
        'mcp.json'
      );
    }
    
    return vscode.Uri.file(configPath);
  }

  // Method to trigger refresh
  refresh(): void {
    this._onDidChange.fire();
  }
}
```

### 3. Register in Extension Activation

```typescript
export function activate(context: vscode.ExtensionContext) {
  const provider = new MyMcpServerProvider();
  
  // Register the provider
  const disposable = vscode.lm.registerMcpServerDefinitionProvider(
    'myextension.mcp-servers',
    provider
  );
  
  context.subscriptions.push(disposable);
  
  // Register refresh command
  context.subscriptions.push(
    vscode.commands.registerCommand('myextension.refreshMcp', () => {
      provider.refresh();
    })
  );
}
```

## Reading MCP Configuration Files

While VSCode provides the provider API, you still need to read the `mcp.json` files yourself. Here's the correct schema:

### MCP Configuration Schema

```typescript
interface MCPConfig {
  /** Server transport type */
  type: 'stdio' | 'socket' | 'ipc';
  
  /** Command to execute (for stdio) */
  command?: string;
  
  /** Arguments for the command */
  args?: string[];
  
  /** Environment variables */
  env?: Record<string, string | number>;
  
  /** Server version */
  version?: string;
  
  /** Gallery information */
  gallery?: {
    id: string;
    version: string;
  };
  
  /** Input prompts for the user */
  inputs?: Array<{
    id: string;
    type: string;
    description: string;
    default?: string;
  }>;
  
  /** Pre/post commands */
  commands?: Array<{
    type: 'pre' | 'post';
    command: string;
  }>;
}

interface MCPFile {
  /** The main servers object */
  servers: Record<string, MCPConfig>;
  
  /** Optional inputs array */
  inputs?: Array<{
    id: string;
    type: string;
    description: string;
    default?: string;
  }>;
}
```

### Example mcp.json

```json
{
  "servers": {
    "my-mcp-server": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem"],
      "env": {
        "ALLOWED_PATHS": "/Users/me/projects"
      },
      "version": "1.0.0"
    }
  }
}
```

## File System Utilities

Helper functions to read MCP files:

```typescript
import * as vscode from 'vscode';
import * as path from 'path';

async function readMcpFile(uri: vscode.Uri): Promise<MCPFile | null> {
  try {
    const fileContent = await vscode.workspace.fs.readFile(uri);
    const text = Buffer.from(fileContent).toString('utf8');
    return JSON.parse(text) as MCPFile;
  } catch (error) {
    console.error(`Failed to read MCP file: ${uri.fsPath}`, error);
    return null;
  }
}

function getGlobalMcpPaths(): vscode.Uri[] {
  const platform = process.platform;
  const paths: string[] = [];
  
  if (platform === 'win32') {
    paths.push(
      path.join(process.env.APPDATA || '', 'Code', 'User', 'mcp.json')
    );
  } else if (platform === 'darwin') {
    paths.push(
      path.join(process.env.HOME || '', 'Library', 'Application Support', 'Code', 'User', 'mcp.json')
    );
  } else {
    paths.push(
      path.join(process.env.HOME || '', '.config', 'Code', 'User', 'mcp.json')
    );
  }
  
  return paths.map(p => vscode.Uri.file(p));
}

function getLocalMcpPath(workspaceFolder: vscode.WorkspaceFolder): vscode.Uri {
  return vscode.Uri.joinPath(workspaceFolder.uri, '.vscode', 'mcp.json');
}
```

## Benefits of Using VSCode's MCP API

1. **Official Support**: Uses the official VSCode API rather than custom parsing
2. **Consistency**: Your extension behaves like other MCP-aware extensions
3. **Future-Proof**: Automatically supports new MCP features added to VSCode
4. **Integration**: Your servers appear in VSCode's native MCP UI
5. **Event-Driven**: Can notify VSCode when servers change via events

## Limitations

- You still need to manually read and parse `mcp.json` files
- The provider API is for **publishing** servers, not discovering existing ones
- VSCode doesn't expose an API to query existing MCP servers from config files

## Alternative: Direct File Reading

If you only need to **discover** existing MCP servers (not publish new ones), you may prefer to:

1. Directly read `mcp.json` files using `vscode.workspace.fs`
2. Parse them with the correct schema (shown above)
3. Display them in your own tree view or UI

This is what the current `mcp-lens` extension does, and it's a valid approach for a discovery/inspection tool.

## Conclusion

For your use case (discovering and displaying MCP servers), the current approach of directly reading `mcp.json` files is appropriate. The `registerMcpServerDefinitionProvider` API is more suitable when you want to:

- **Dynamically provide** MCP servers to VSCode
- Fetch servers from remote registries
- Require user authentication before starting servers
- Add servers that aren't defined in `mcp.json` files

The key insight from the API docs is the **correct schema format**: the file uses `"servers"` as the top-level key (not `"mcpServers"`), and each server config should have a `"type"` field.

## References

- [VSCode Extension API - lm namespace](https://code.visualstudio.com/api/references/vscode-api#lm)
- [Model Context Protocol Specification](https://github.com/modelcontextprotocol/typescript-sdk)
- [VSCode MCP Integration](https://code.visualstudio.com/)

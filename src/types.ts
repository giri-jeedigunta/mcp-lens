/**
 * Type definitions for MCP Lens extension
 * 
 * @author Giri Jeedigunta <giri.jeedigunta@gmail.com>
 */

/**
 * Represents a parameter for an MCP tool
 */
export interface MCPToolParameter {
	name: string;
	type: string;
	description?: string;
	required?: boolean;
	default?: unknown;
}

/**
 * Represents a tool available in an MCP
 */
export interface MCPTool {
	name: string;
	description?: string;
	parameters?: MCPToolParameter[];
	inputSchema?: Record<string, unknown>;
}

/**
 * Represents the configuration for a single MCP server
 */
export interface MCPConfig {
	/** Communication type: stdio, socket, or ipc */
	type: 'stdio' | 'socket' | 'ipc';
	/** Command to start the MCP server */
	command: string;
	/** Arguments for the command */
	args?: string[];
	/** Environment variables */
	env?: Record<string, string>;
	/** MCP server version */
	version?: string;
	/** Whether server is in gallery/marketplace */
	gallery?: boolean;
	/** Whether server is disabled */
	disabled?: boolean;
	/** Tools that don't require permission */
	alwaysAllow?: string[];
}

/**
 * Input definition for MCP servers
 */
export interface MCPInput {
	name: string;
	type: string;
	default?: unknown;
	description?: string;
}

/**
 * Command definition for MCP servers
 */
export interface MCPCommand {
	name: string;
	args?: string[];
	description?: string;
}

/**
 * Represents the structure of an MCP JSON file (VSCode format)
 */
export interface MCPFile {
	/** Map of server name to configuration */
	servers: Record<string, MCPConfig>;
	/** Optional inputs configuration */
	inputs?: MCPInput[];
	/** Optional commands configuration */
	commands?: MCPCommand[];
}

/**
 * Represents an MCP item with runtime information
 */
export interface MCPItem {
	name: string;
	config: MCPConfig;
	isGlobal: boolean;
	tools?: MCPTool[];
	status?: 'running' | 'stopped' | 'error' | 'unknown';
	log?: string;
	author?: string;
	mode?: string;
	description?: string;
	toolCount?: number;
}

/**
 * Filter options for MCP view
 */
export type MCPFilter = 'both' | 'global' | 'local';

/**
 * Tree item types for card-based UI
 */
export type TreeItemType = 'section' | 'mcp-card' | 'mcp-detail' | 'tools-list' | 'tool-item' | 'separator';

/**
 * OS-specific paths configuration
 */
export interface OSPaths {
	globalMCPPath: string;
	localMCPPath: string;
}

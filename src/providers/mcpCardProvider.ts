/**
 * Enhanced tree data provider for MCP Explorer with card-based UI
 * 
 * @author Giri Jeedigunta <giri.jeedigunta@gmail.com>
 */

import * as vscode from 'vscode';
import { type MCPItem, type MCPFilter, type TreeItemType } from '../types';
import { getGlobalMCPPath, getLocalMCPPath } from '../constants';
import { readMCPFile, mcpFileToItems } from '../utils/fileUtils';

/**
 * Enhanced tree item for card-based UI
 */
export class MCPCardTreeItem extends vscode.TreeItem {
	constructor(
		public readonly label: string,
		public readonly collapsibleState: vscode.TreeItemCollapsibleState,
		public readonly itemType: TreeItemType,
		public readonly mcpItem?: MCPItem,
		public readonly parentMcp?: MCPItem
	) {
		super(label, collapsibleState);

		this.contextValue = itemType;
		this.setupItem();
	}

	private setupItem(): void {
		switch (this.itemType) {
			case 'section':
				this.setupSection();
				break;
			case 'mcp-card':
				this.setupMCPCard();
				break;
			case 'mcp-detail':
				this.setupMCPDetail();
				break;
			case 'tools-list':
				this.setupToolsList();
				break;
			case 'tool-item':
				this.setupToolItem();
				break;
			case 'separator':
				this.setupSeparator();
				break;
		}
	}

	private setupSeparator(): void {
		// Minimal separator item
		this.iconPath = undefined;
		this.contextValue = 'separator';
	}

	private setupSection(): void {
		// No icon for sections - keep it clean like the wireframe
		this.iconPath = undefined;
	}

	private setupMCPCard(): void {
		if (!this.mcpItem) {
			return;
		}

		const mcp = this.mcpItem;
		
		// Create card-like appearance with border
		const toolCount = mcp.toolCount ?? mcp.tools?.length ?? 0;
		
		// No description - let the card expand to show details
		this.description = '';
		this.tooltip = this.createCardTooltip(mcp);
		this.iconPath = this.getStatusIcon(mcp);
		
		// Make card look more prominent
		this.resourceUri = vscode.Uri.parse(`mcp-card://${mcp.name}`);
	}

	private setupMCPDetail(): void {
		if (!this.parentMcp) {
			return;
		}
		
		// Detail items are not clickable
		this.iconPath = new vscode.ThemeIcon('info');
	}

	private setupToolsList(): void {
		this.iconPath = new vscode.ThemeIcon('tools', new vscode.ThemeColor('charts.orange'));
	}

	private setupToolItem(): void {
		this.iconPath = new vscode.ThemeIcon('symbol-method', new vscode.ThemeColor('symbolIcon.methodForeground'));
	}

	private getStatusEmoji(status?: string): string {
		switch (status) {
			case 'running':
				return '●';
			case 'stopped':
				return '○';
			case 'error':
				return '✕';
			default:
				return '◌';
		}
	}

	private getStatusIcon(mcp: MCPItem): vscode.ThemeIcon {
		if (mcp.config.disabled) {
			return new vscode.ThemeIcon('debug-stop', new vscode.ThemeColor('errorForeground'));
		}

		switch (mcp.status) {
			case 'running':
				return new vscode.ThemeIcon('pass-filled', new vscode.ThemeColor('testing.iconPassed'));
			case 'error':
				return new vscode.ThemeIcon('error', new vscode.ThemeColor('errorForeground'));
			case 'stopped':
				return new vscode.ThemeIcon('circle-outline', new vscode.ThemeColor('descriptionForeground'));
			default:
				return new vscode.ThemeIcon('circle-large-outline', new vscode.ThemeColor('descriptionForeground'));
		}
	}

	private createCardTooltip(mcp: MCPItem): vscode.MarkdownString {
		const md = new vscode.MarkdownString();
		md.supportHtml = true;
		md.isTrusted = true;

		md.appendMarkdown(`### ${mcp.name}\n\n`);
		
		md.appendMarkdown(`**Type:** ${mcp.isGlobal ? '🌐 Global' : '📁 Local'}\n\n`);
		md.appendMarkdown(`**Status:** ${this.getStatusEmoji(mcp.status)} ${mcp.status || 'Unknown'}\n\n`);
		
		if (mcp.description) {
			md.appendMarkdown(`**Description:** ${mcp.description}\n\n`);
		}
		
		md.appendMarkdown(`**Command:** \`${mcp.config.command}\`\n\n`);
		
		if (mcp.config.args?.length) {
			md.appendMarkdown(`**Args:** \`${mcp.config.args.join(' ')}\`\n\n`);
		}
		
		const toolCount = mcp.toolCount ?? mcp.tools?.length ?? 0;
		md.appendMarkdown(`**Tools:** ${toolCount}\n\n`);
		
		if (mcp.config.disabled) {
			md.appendMarkdown(`**⚠️ Disabled**\n\n`);
		}

		return md;
	}
}

/**
 * Enhanced data provider for card-based MCP Explorer
 */
export class MCPCardProvider implements vscode.TreeDataProvider<MCPCardTreeItem> {
	private _onDidChangeTreeData = new vscode.EventEmitter<MCPCardTreeItem | undefined | null | void>();
	readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

	private globalMCPs: MCPItem[] = [];
	private localMCPs: MCPItem[] = [];
	private filter: MCPFilter = 'both';
	private customGlobalPath?: string;
	private customLocalPath?: string;
	private expandedMCPs = new Set<string>();

	constructor(
		private context: vscode.ExtensionContext,
		private outputChannel: vscode.OutputChannel
	) {
		this.outputChannel.appendLine('MCPCardProvider initialized');
	}

	refresh(): void {
		this.outputChannel.appendLine('Refreshing card tree view...');
		this._onDidChangeTreeData.fire();
	}

	setFilter(filter: MCPFilter): void {
		this.outputChannel.appendLine(`Setting filter to: ${filter}`);
		this.filter = filter;
		this.refresh();
	}

	getFilter(): MCPFilter {
		return this.filter;
	}

	setCustomGlobalPath(path: string): void {
		this.customGlobalPath = path;
	}

	setCustomLocalPath(path: string): void {
		this.customLocalPath = path;
	}

	async loadMCPs(): Promise<void> {
		this.outputChannel.appendLine('\n--- Loading MCPs for Card View ---');
		
		// Load global MCPs
		const globalPath = this.customGlobalPath ?? getGlobalMCPPath();
		this.outputChannel.appendLine(`Global MCP path: ${globalPath}`);
		
		const globalFile = await readMCPFile(globalPath);
		if (globalFile) {
			this.outputChannel.appendLine(`✓ Global MCP file found with ${Object.keys(globalFile.servers).length} servers`);
		}
		this.globalMCPs = mcpFileToItems(globalFile, true);
		this.enrichMCPData(this.globalMCPs);

		// Load local MCPs
		const workspaceFolders = vscode.workspace.workspaceFolders;
		if (workspaceFolders?.[0]) {
			const workspacePath = workspaceFolders[0].uri.fsPath;
			const localPath = this.customLocalPath ?? getLocalMCPPath(workspacePath);
			this.outputChannel.appendLine(`Local MCP path: ${localPath}`);
			
			const localFile = await readMCPFile(localPath);
			if (localFile) {
				this.outputChannel.appendLine(`✓ Local MCP file found with ${Object.keys(localFile.servers).length} servers`);
			}
			this.localMCPs = mcpFileToItems(localFile, false);
			this.enrichMCPData(this.localMCPs);
		} else {
			this.localMCPs = [];
		}

		this.outputChannel.appendLine(`Total: ${this.globalMCPs.length} global, ${this.localMCPs.length} local`);
		this.refresh();
	}

	private enrichMCPData(mcps: MCPItem[]): void {
		for (const mcp of mcps) {
			// Add placeholder tool count and description
			mcp.toolCount = Math.floor(Math.random() * 10) + 1; // TODO: Get from actual MCP
			if (!mcp.description) {
				mcp.description = `${mcp.config.command} - MCP Server`;
			}
		}
	}

	getTreeItem(element: MCPCardTreeItem): vscode.TreeItem {
		return element;
	}

	async getChildren(element?: MCPCardTreeItem): Promise<MCPCardTreeItem[]> {
		if (!element) {
			return this.getRootSections();
		}

		switch (element.itemType) {
			case 'section':
				return this.getMCPCards(element);
			case 'mcp-card':
				return this.getMCPDetails(element);
			case 'tools-list':
				return this.getToolItems(element);
			default:
				return [];
		}
	}

	private getRootSections(): MCPCardTreeItem[] {
		this.outputChannel.appendLine('\ngetChildren called for root (card view)');
		this.outputChannel.appendLine(`Current filter: ${this.filter}`);

		const sections: MCPCardTreeItem[] = [];

		// Add sections with cleaner format
		if (this.filter === 'both' || this.filter === 'global') {
			if (this.globalMCPs.length > 0) {
				const section = new MCPCardTreeItem(
					`> Global MCPs (${this.globalMCPs.length})`,
					vscode.TreeItemCollapsibleState.Expanded,
					'section'
				);
				sections.push(section);
			}
		}

		if (this.filter === 'both' || this.filter === 'local') {
			if (this.localMCPs.length > 0) {
				const section = new MCPCardTreeItem(
					`> Local MCPs (${this.localMCPs.length})`,
					vscode.TreeItemCollapsibleState.Expanded,
					'section'
				);
				sections.push(section);
			}
		}

		if (sections.length === 0) {
			const emptyItem = new vscode.TreeItem('No MCPs found');
			emptyItem.description = 'Click to locate MCP file';
			emptyItem.command = {
				command: 'mcp-lens.locateMCPFile',
				title: 'Locate MCP File',
			};
			return [emptyItem as MCPCardTreeItem];
		}

		return sections;
	}

	private getMCPCards(section: MCPCardTreeItem): MCPCardTreeItem[] {
		const isGlobal = section.label.includes('Global');
		const mcps = isGlobal ? this.globalMCPs : this.localMCPs;

		// Create cards with visual hierarchy and separators
		const cards: MCPCardTreeItem[] = [];
		
		for (let i = 0; i < mcps.length; i++) {
			const mcp = mcps[i];
			
			// Main card item (the box)
			const card = new MCPCardTreeItem(
				mcp.name,
				vscode.TreeItemCollapsibleState.Collapsed,
				'mcp-card',
				mcp
			);
			cards.push(card);
			
			// Add visual separator between cards (except after last one)
			if (i < mcps.length - 1) {
				const separator = new MCPCardTreeItem(
					'',
					vscode.TreeItemCollapsibleState.None,
					'separator'
				);
				separator.iconPath = undefined;
				separator.description = '━'.repeat(50);
				cards.push(separator);
			}
		}
		
		return cards;
	}

	private getMCPDetails(card: MCPCardTreeItem): MCPCardTreeItem[] {
		if (!card.mcpItem) {
			return [];
		}

		const mcp = card.mcpItem;
		const details: MCPCardTreeItem[] = [];

		// Card top border separator
		const topBorder = new MCPCardTreeItem(
			'',
			vscode.TreeItemCollapsibleState.None,
			'separator'
		);
		topBorder.description = '─'.repeat(60);
		topBorder.iconPath = undefined;
		details.push(topBorder);

		// STATUS: label with action buttons on right
		const statusLabel = new MCPCardTreeItem(
			'STATUS:',
			vscode.TreeItemCollapsibleState.None,
			'mcp-detail',
			undefined,
			mcp
		);
		statusLabel.description = ''; // Action buttons will appear here via context menu
		statusLabel.iconPath = undefined;
		statusLabel.contextValue = 'mcp-status'; // For action buttons
		details.push(statusLabel);

		// Empty line for spacing
		const spacer1 = new MCPCardTreeItem(
			'',
			vscode.TreeItemCollapsibleState.None,
			'separator'
		);
		spacer1.iconPath = undefined;
		details.push(spacer1);

		// Description text (multi-line if needed)
		const description = mcp.description || `Command: ${mcp.config.command}`;
		const descItem = new MCPCardTreeItem(
			description,
			vscode.TreeItemCollapsibleState.None,
			'mcp-detail',
			undefined,
			mcp
		);
		descItem.iconPath = undefined; // No icon for description
		details.push(descItem);

		// Empty line for spacing
		const spacer2 = new MCPCardTreeItem(
			'',
			vscode.TreeItemCollapsibleState.None,
			'separator'
		);
		spacer2.iconPath = undefined;
		details.push(spacer2);

		// > Tools (N) - collapsible section
		const toolCount = mcp.toolCount ?? mcp.tools?.length ?? 0;
		const toolsItem = new MCPCardTreeItem(
			`> Tools (${toolCount})`,
			toolCount > 0 ? vscode.TreeItemCollapsibleState.Collapsed : vscode.TreeItemCollapsibleState.None,
			'tools-list',
			mcp,
			mcp
		);
		toolsItem.iconPath = undefined; // Chevron will show collapse state
		details.push(toolsItem);

		return details;
	}

	private getToolItems(toolsList: MCPCardTreeItem): MCPCardTreeItem[] {
		if (!toolsList.mcpItem?.tools) {
			// Generate placeholder tools for demo
			const toolCount = toolsList.mcpItem?.toolCount ?? 0;
			const tools: MCPCardTreeItem[] = [];
			
			for (let i = 1; i <= toolCount; i++) {
				const toolItem = new MCPCardTreeItem(
					`tool_${i}`,
					vscode.TreeItemCollapsibleState.None,
					'tool-item',
					toolsList.mcpItem
				);
				toolItem.description = 'Tool description...';
				tools.push(toolItem);
			}
			
			return tools;
		}

		return toolsList.mcpItem.tools.map((tool) => {
			const toolItem = new MCPCardTreeItem(
				tool.name,
				vscode.TreeItemCollapsibleState.None,
				'tool-item',
				toolsList.mcpItem
			);
			toolItem.description = tool.description || '';
			toolItem.tooltip = tool.description;
			return toolItem;
		});
	}

	private getStatusEmojiForDetail(status?: string): string {
		switch (status) {
			case 'running':
				return '🟢';
			case 'stopped':
				return '⚪';
			case 'error':
				return '🔴';
			default:
				return '⚫';
		}
	}

	getMCPByName(name: string): MCPItem | undefined {
		return [...this.localMCPs, ...this.globalMCPs].find((mcp) => mcp.name === name);
	}
}

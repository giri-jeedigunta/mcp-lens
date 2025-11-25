/**
 * MCP Lens Extension
 * An interactive VSCode tool for exploring both global and local MCPs effortlessly.
 * 
 * @author Giri Jeedigunta <giri.jeedigunta@gmail.com>
 */

import * as vscode from 'vscode';
import { MCPCardProvider, MCPCardTreeItem } from './providers/mcpCardProvider';
import { MCPDetailsProvider } from './providers/mcpDetailsProvider';
import { COMMANDS, VIEWS } from './constants';
import { startMCPServer, stopMCPServer, restartMCPServer, stopAllMCPs } from './utils/mcpControl';

/**
 * Activate the extension
 * 
 * @param {vscode.ExtensionContext} context - The extension context
 */
export function activate(context: vscode.ExtensionContext): void {
	const outputChannel = vscode.window.createOutputChannel('MCP Lens');
	outputChannel.show();
	outputChannel.appendLine('='.repeat(80));
	outputChannel.appendLine('MCP Lens Extension Activated!');
	outputChannel.appendLine('='.repeat(80));
	console.log('MCP Lens extension is now active!');

	// Create the MCP card provider
	outputChannel.appendLine('Creating MCP Card Provider...');
	const mcpCardProvider = new MCPCardProvider(context, outputChannel);

	// Register the tree view
	const treeView = vscode.window.createTreeView(VIEWS.MCP_EXPLORER, {
		treeDataProvider: mcpCardProvider,
		showCollapseAll: true,
	});

	// Add file decorations to make cards look like boxes
	const cardDecoration = vscode.window.createTextEditorDecorationType({
		border: '1px solid',
		borderRadius: '4px',
	});

	// Register file decoration provider for visual card appearance
	const decorationProvider = vscode.window.registerFileDecorationProvider({
		provideFileDecoration(uri: vscode.Uri): vscode.FileDecoration | undefined {
			if (uri.scheme === 'mcp-card') {
				return {
					badge: '▪',
					tooltip: 'MCP Server Card',
				};
			}
			return undefined;
		},
	});

	// Register refresh command
	const refreshCommand = vscode.commands.registerCommand(COMMANDS.REFRESH, async () => {
		outputChannel.appendLine('\n--- Refresh Command Triggered ---');
		await mcpCardProvider.loadMCPs();
		vscode.window.showInformationMessage('MCP list refreshed');
	});

	// Register filter commands
	const filterBothCommand = vscode.commands.registerCommand(COMMANDS.FILTER_BOTH, () => {
		outputChannel.appendLine('\nFilter changed to: BOTH');
		mcpCardProvider.setFilter('both');
		vscode.window.showInformationMessage('Showing both Global and Local MCPs');
	});

	const filterGlobalCommand = vscode.commands.registerCommand(COMMANDS.FILTER_GLOBAL, () => {
		outputChannel.appendLine('\nFilter changed to: GLOBAL');
		mcpCardProvider.setFilter('global');
		vscode.window.showInformationMessage('Showing Global MCPs only');
	});

	const filterLocalCommand = vscode.commands.registerCommand(COMMANDS.FILTER_LOCAL, () => {
		outputChannel.appendLine('\nFilter changed to: LOCAL');
		mcpCardProvider.setFilter('local');
		vscode.window.showInformationMessage('Showing Local MCPs only');
	});

	// Register open MCP details command
	const openDetailsCommand = vscode.commands.registerCommand(
		COMMANDS.OPEN_MCP_DETAILS,
		(item: any) => {
			if (item?.mcpItem) {
				MCPDetailsProvider.show(context, item.mcpItem);
			}
		}
	);

	// Register open with inspector command
	const openInspectorCommand = vscode.commands.registerCommand(
		COMMANDS.OPEN_WITH_INSPECTOR,
		async (item: any) => {
			const mcpName = item?.mcpItem?.name;
			if (!mcpName) {
				return;
			}

			try {
				// Open terminal and run mcp-inspector
				const terminal = vscode.window.createTerminal('MCP Inspector');
				terminal.show();
				terminal.sendText(`npx mcp-inspector`);
				vscode.window.showInformationMessage(`Opening MCP Inspector for ${mcpName}`);
			} catch (error) {
				vscode.window.showErrorMessage(`Failed to open MCP Inspector: ${error}`);
			}
		}
	);

	// Register locate MCP file command
	const locateMCPFileCommand = vscode.commands.registerCommand(
		COMMANDS.LOCATE_MCP_FILE,
		async () => {
			outputChannel.appendLine('\n--- Locate MCP File Command Triggered ---');
			const options: vscode.OpenDialogOptions = {
				canSelectFiles: true,
				canSelectFolders: false,
				canSelectMany: false,
				filters: {
					'JSON files': ['json'],
					'All files': ['*'],
				},
				title: 'Locate MCP Configuration File',
			};

			const fileUri = await vscode.window.showOpenDialog(options);
			if (fileUri?.[0]) {
				outputChannel.appendLine(`Selected file: ${fileUri[0].fsPath}`);

				const selected = await vscode.window.showQuickPick(
					['Global MCP', 'Local MCP'],
					{
						placeHolder: 'Is this a global or local MCP file?',
					}
				);

				if (selected) {
					const isGlobal = selected === 'Global MCP';
					outputChannel.appendLine(`File type selected: ${selected}`);
					if (isGlobal) {
						mcpCardProvider.setCustomGlobalPath(fileUri[0].fsPath);
						outputChannel.appendLine(`Set custom global path: ${fileUri[0].fsPath}`);
					} else {
						mcpCardProvider.setCustomLocalPath(fileUri[0].fsPath);
						outputChannel.appendLine(`Set custom local path: ${fileUri[0].fsPath}`);
					}
					await mcpCardProvider.loadMCPs();
					vscode.window.showInformationMessage(
						`${selected} file located: ${fileUri[0].fsPath}`
					);
				}
			}
		}
	);

	// Register MCP control commands
	const startMCPCommand = vscode.commands.registerCommand(
		COMMANDS.START_MCP,
		async (item: MCPCardTreeItem) => {
			const mcp = item?.parentMcp ?? item?.mcpItem;
			if (mcp) {
				const success = await startMCPServer(mcp, outputChannel);
				if (success) {
					mcpCardProvider.refresh();
				}
			}
		}
	);

	const stopMCPCommand = vscode.commands.registerCommand(
		COMMANDS.STOP_MCP,
		async (item: MCPCardTreeItem) => {
			const mcp = item?.parentMcp ?? item?.mcpItem;
			if (mcp) {
				const success = await stopMCPServer(mcp, outputChannel);
				if (success) {
					mcpCardProvider.refresh();
				}
			}
		}
	);

	const restartMCPCommand = vscode.commands.registerCommand(
		COMMANDS.RESTART_MCP,
		async (item: MCPCardTreeItem) => {
			const mcp = item?.parentMcp ?? item?.mcpItem;
			if (mcp) {
				const success = await restartMCPServer(mcp, outputChannel);
				if (success) {
					mcpCardProvider.refresh();
				}
			}
		}
	);

	// Register tree view click handler
	treeView.onDidChangeSelection((e) => {
		const selected = e.selection[0] as MCPCardTreeItem;
		if (selected?.mcpItem && selected.itemType === 'mcp-card') {
			vscode.commands.executeCommand(COMMANDS.OPEN_MCP_DETAILS, selected);
		}
	});

	// Add all commands to subscriptions
	context.subscriptions.push(
		treeView,
		decorationProvider,
		refreshCommand,
		filterBothCommand,
		filterGlobalCommand,
		filterLocalCommand,
		openDetailsCommand,
		openInspectorCommand,
		locateMCPFileCommand,
		startMCPCommand,
		stopMCPCommand,
		restartMCPCommand
	);

	// Initial load
	outputChannel.appendLine('\n--- Initial MCP Load ---');
	mcpCardProvider.loadMCPs().then(() => {
		outputChannel.appendLine('Initial load completed');
	}).catch((err: unknown) => {
		outputChannel.appendLine(`Initial load error: ${err}`);
	});
}

/**
 * Deactivate the extension
 */
export function deactivate(): void {
	// Stop all running MCPs
	const outputChannel = vscode.window.createOutputChannel('MCP Lens');
	stopAllMCPs(outputChannel);
}

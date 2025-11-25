/**
 * MCP Lens Extension
 * An interactive VSCode tool for exploring both global and local MCPs effortlessly.
 * 
 * @author Giri Jeedigunta <giri.jeedigunta@gmail.com>
 */

import * as vscode from 'vscode';
import { MCPDataProvider } from './providers/mcpDataProvider';
import { MCPDetailsProvider } from './providers/mcpDetailsProvider';
import { COMMANDS, VIEWS } from './constants';
import { type MCPFilter } from './types';

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

	// Create the MCP data provider
	outputChannel.appendLine('Creating MCP Data Provider...');
	const mcpDataProvider = new MCPDataProvider(context, outputChannel);

	// Register the tree view
	const treeView = vscode.window.createTreeView(VIEWS.MCP_EXPLORER, {
		treeDataProvider: mcpDataProvider,
		showCollapseAll: true,
	});

	// Register refresh command
	const refreshCommand = vscode.commands.registerCommand(COMMANDS.REFRESH, async () => {
		outputChannel.appendLine('\n--- Refresh Command Triggered ---');
		await mcpDataProvider.loadMCPs();
		vscode.window.showInformationMessage('MCP list refreshed');
	});

	// Register filter commands
	const filterBothCommand = vscode.commands.registerCommand(COMMANDS.FILTER_BOTH, () => {
		outputChannel.appendLine('\nFilter changed to: BOTH');
		mcpDataProvider.setFilter('both');
		vscode.window.showInformationMessage('Showing both Global and Local MCPs');
	});

	const filterGlobalCommand = vscode.commands.registerCommand(COMMANDS.FILTER_GLOBAL, () => {
		outputChannel.appendLine('\nFilter changed to: GLOBAL');
		mcpDataProvider.setFilter('global');
		vscode.window.showInformationMessage('Showing Global MCPs only');
	});

	const filterLocalCommand = vscode.commands.registerCommand(COMMANDS.FILTER_LOCAL, () => {
		outputChannel.appendLine('\nFilter changed to: LOCAL');
		mcpDataProvider.setFilter('local');
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
						mcpDataProvider.setCustomGlobalPath(fileUri[0].fsPath);
						outputChannel.appendLine(`Set custom global path: ${fileUri[0].fsPath}`);
					} else {
						mcpDataProvider.setCustomLocalPath(fileUri[0].fsPath);
						outputChannel.appendLine(`Set custom local path: ${fileUri[0].fsPath}`);
					}
					await mcpDataProvider.loadMCPs();
					vscode.window.showInformationMessage(
						`${selected} file located: ${fileUri[0].fsPath}`
					);
				}
			}
		}
	);

	// Register tree view click handler
	treeView.onDidChangeSelection((e) => {
		if (e.selection.length > 0 && e.selection[0].mcpItem) {
			vscode.commands.executeCommand(COMMANDS.OPEN_MCP_DETAILS, e.selection[0]);
		}
	});

	// Add all commands to subscriptions
	context.subscriptions.push(
		treeView,
		refreshCommand,
		filterBothCommand,
		filterGlobalCommand,
		filterLocalCommand,
		openDetailsCommand,
		openInspectorCommand,
		locateMCPFileCommand
	);

	// Initial load
	outputChannel.appendLine('\n--- Initial MCP Load ---');
	mcpDataProvider.loadMCPs().then(() => {
		outputChannel.appendLine('Initial load completed');
	}).catch(err => {
		outputChannel.appendLine(`Initial load error: ${err}`);
	});
}

/**
 * Deactivate the extension
 */
export function deactivate(): void {
	// Cleanup if needed
}

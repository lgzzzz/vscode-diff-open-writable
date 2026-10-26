'use strict';

const vscode = require('vscode');

/**
 * Resolve the target resource for the active editor.
 *
 * For a diff editor this is the "modified" side, which is the same resource
 * that VS Code passes to the editor title action:
 * `EditorResourceAccessor.getOriginalUri(activeEditor, { supportSideBySide: PRIMARY })`
 * resolves a diff input to its modified resource.
 *
 * For a read-only editor (for example the `git:` document that the built-in
 * `git.openFile` opens from a keybinding) this is the document resource itself;
 * `git.openFile` converts a `git:` URI into the corresponding workspace file.
 *
 * @returns {vscode.Uri | undefined}
 */
function resolveTargetUri() {
	const input = vscode.window.tabGroups.activeTabGroup.activeTab?.input;

	if (input instanceof vscode.TabInputTextDiff) {
		return input.modified;
	}

	// Multi-file diff editors do not expose a stable tab input API. Fall back to
	// the focused side of the diff; `git.openFile` converts a `git:` URI into the
	// corresponding workspace file.
	return vscode.window.activeTextEditor?.document.uri;
}

/**
 * Open a file from the current diff in writable form.
 *
 * A keybinding cannot supply command arguments, so calling `git.openFile`
 * directly makes it take its no-argument fallback, which ends up opening the
 * read-only `git:` document of the diff. Passing the diff's modified resource
 * explicitly makes it take the same code path as the editor title button.
 */
async function openFileFromDiff() {
	const uri = resolveTargetUri();

	if (!uri) {
		return;
	}

	try {
		await vscode.commands.executeCommand('git.openFile', uri);
		return;
	} catch {
		// The built-in Git extension is not available; open the file directly.
	}

	if (uri.scheme === 'git') {
		try {
			const params = JSON.parse(uri.query);
			if (!params || typeof params.path !== 'string') {
				return;
			}
			await vscode.commands.executeCommand('vscode.open', vscode.Uri.file(params.path), {
				preview: false,
				viewColumn: vscode.ViewColumn.Active
			});
		} catch {
			return;
		}
	} else if (uri.scheme === 'file') {
		await vscode.commands.executeCommand('vscode.open', uri, {
			preview: false,
			viewColumn: vscode.ViewColumn.Active
		});
	}
}

function activate(context) {
	context.subscriptions.push(
		vscode.commands.registerCommand('diffOpenWritable.openFile', openFileFromDiff)
	);
}

module.exports = { activate };

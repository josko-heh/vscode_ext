import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {

	/* <uri as unique file identifier, middle position>; 
	object for keeping track of which file has "\\end{verbatim}\n\\begin{verbatim}" in the middle*/
	let middles = new Map<vscode.Uri,vscode.Position>(); 

	context.subscriptions.push(
		vscode.commands.registerCommand("latex-ext.VerbatimSurround", async () => {
			let editor = vscode.window.activeTextEditor;
			
			if (editor){
				/* initializing before cursorBottom and cursorTop are called
				   editor.selection.active.line = acutal_selected_line - 1 */
				let middle = new vscode.Position(editor.selection.active.line + 1, editor.selection.active.character);


				await vscode.commands.executeCommand("cursorBottom");
				await editor.insertSnippet(new vscode.SnippetString("\n\\end{verbatim}"));
				await vscode.commands.executeCommand("cursorTop");
				await editor.insertSnippet(new vscode.SnippetString("\\begin{verbatim}\n"));

				let numLines = editor.document.lineCount;

				if (numLines > 42) {
					editor.edit(editBuilder => editBuilder.insert(middle, "\\end{verbatim}\n\\begin{verbatim}"))
						  .then(() => middles.set(editor!.document.uri, middle), 
							   err => vscode.window.showErrorMessage(err));
				}
			}	
		})
	);

	
	context.subscriptions.push(
		vscode.commands.registerCommand("latex-ext.RemoveVerbatimSurround", async () => {
			await vscode.window.activeTextEditor?.edit(editBuilder => {
				// delete "\begin{verbatim}""
				let start = new vscode.Position(0,0);
				let end = new vscode.Position(1,0);
				editBuilder.delete(new vscode.Selection(start, end));
				
				// delete "\end{verbatim}"
				let editor = vscode.window.activeTextEditor;
				if (editor) {
					let numLines = editor.document.lineCount;

					start = new vscode.Position(numLines-1, 0);
					end = new vscode.Position(numLines-1, 14)
					editBuilder.delete(new vscode.Selection(start, end));
				}

				let middle: vscode.Position | undefined;
				// delete "\\end{verbatim}\n\\begin{verbatim}" in the middle if it exist
				if (editor && middles.has(editor.document.uri)) {
					middle = middles.get(editor.document.uri)

					end = new vscode.Position(middle!.line + 1, 16)
					editBuilder.delete(new vscode.Selection(middle!, end));

					middles.delete(editor.document.uri);
				}
			});

			// Delete blank line at the end of file. Previously "\end{verbatim}" was there.
			await vscode.commands.executeCommand("cursorBottom");
			await vscode.commands.executeCommand("deleteLeft")
		})
	);
}

export function deactivate() {}

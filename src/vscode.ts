import * as vscode from "vscode"

import { debouncedSendCursorPos } from "./sender"
import { getLastCursorPos, setLastCursorPos } from "./state"
import { CursorPos } from "./types"
import { WebSocketHandler } from "./ws"

export const getVSCodePosition = (): CursorPos => {
  const editor = vscode.window.activeTextEditor
  if (editor == null) {
    throw new Error("No active text editor")
  }

  const filePath = editor.document.uri.fsPath
  const position = editor.selection.active

  return {
    col: position.character + 1,
    line: position.line + 1,
    path: filePath,
  }
}

export const cursorPosToVSCodeCursorPos = (cursorPos: CursorPos) => {
  return {
    col: cursorPos.col - 1,
    line: cursorPos.line - 1,
  }
}

export const setVSCodePosition = ({ editor, position }: { editor: vscode.TextEditor; position: CursorPos }) => {
  const newCursorPos = {
    col: position.col,
    line: position.line,
    path: position.path,
  }

  const lastCursorPos = getLastCursorPos()
  if (
    lastCursorPos != null &&
    lastCursorPos.path === position.path &&
    lastCursorPos.line === position.line &&
    lastCursorPos.col === position.col
  ) {
    return
  }

  setLastCursorPos(newCursorPos)

  const vscodeCursorPos = cursorPosToVSCodeCursorPos(newCursorPos)
  const vscodePos = new vscode.Position(vscodeCursorPos.line, vscodeCursorPos.col)
  const newSelection = new vscode.Selection(vscodePos, vscodePos)
  editor.selection = newSelection
  editor.revealRange(newSelection)
}

export const sendCursorPos = ({
  event,
  wsHandler,
}: {
  event: vscode.TextEditorSelectionChangeEvent
  wsHandler: WebSocketHandler
}) => {
  const document = event.textEditor.document
  const selection = event.selections[0]
  const isEmpty = selection.isEmpty
  const isFocused = vscode.window.state.focused && vscode.window.activeTextEditor === event.textEditor

  if (!isFocused) {
    return
  }

  if (isEmpty) {
    const vscodePosition = getVSCodePosition()
    debouncedSendCursorPos(document, vscodePosition, wsHandler)
  } else {
    // TODO: Implement selection handling
    // const selectionPos: SelectionPos = {
    //   type: "SelectionPos",
    //   startCol: selection.start.character,
    //   startLine: selection.start.line,
    //   endCol: selection.end.character,
    //   endLine: selection.end.line,
    //   path: document.uri.fsPath,
    // };
    //
    // wsHandler.sendMessage(selectionPos);
  }
}

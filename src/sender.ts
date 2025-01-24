import debounce from "debounce"
import * as vscode from "vscode"

import { getLastCursorPos, setLastCursorPos } from "./state"
import { CursorPos, CursorPosProtocol } from "./types"
import { WebSocketHandler } from "./ws"

export const debouncedSendCursorPos = debounce(
  (document: vscode.TextDocument, cursorPosition: CursorPos, wsHandler: WebSocketHandler) => {
    const lastCursorPosition = getLastCursorPos()
    if (
      lastCursorPosition &&
      lastCursorPosition.path === cursorPosition.path &&
      lastCursorPosition.line === cursorPosition.line &&
      lastCursorPosition.col === cursorPosition.col
    ) {
      return
    }

    setLastCursorPos(cursorPosition)

    const cursorPos: CursorPosProtocol = {
      col: cursorPosition.col,
      line: cursorPosition.line,
      path: document.uri.fsPath,
      paused: wsHandler.isPaused,
      sender: "vscode",
      type: "CursorPos",
    }
    wsHandler.sendMessage(cursorPos)
  },
  50,
)

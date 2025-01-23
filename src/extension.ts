import * as vscode from "vscode"

import { sendCursorPos } from "./vscode"
import { WebSocketHandler } from "./websocket-handler"

let wsHandler: WebSocketHandler

export const activate = (context: vscode.ExtensionContext) => {
  const outputChannel = vscode.window.createOutputChannel("vscode-resonator")
  wsHandler = new WebSocketHandler(outputChannel)

  const connectCommand = vscode.commands.registerCommand("vscode-resonator.connect", async () => {
    await wsHandler.connect()
  })
  const disconnectCommand = vscode.commands.registerCommand("vscode-resonator.disconnect", () => {
    wsHandler.disconnect()
  })
  const showOutputChannelCommand = vscode.commands.registerCommand("vscode-resonator.showOutputChannel", () => {
    outputChannel.show()
  })

  context.subscriptions.push(connectCommand, disconnectCommand, showOutputChannelCommand)

  vscode.window.onDidChangeTextEditorSelection((event) => {
    sendCursorPos({ event, wsHandler })
  })
}

export const deactivate = () => {
  wsHandler.disconnect()
}

import * as vscode from "vscode"

import { getAutoConnect, setAutoConnect } from "./state"
import { getResonatorDefaultPort } from "./utils"
import { sendCursorPos } from "./vscode"
import { WebSocketHandler } from "./ws"

let wsHandler: WebSocketHandler

const setResonatorButtonProps = (button: vscode.StatusBarItem, connected: boolean, paused: boolean = false) => {
  if (connected) {
    button.text = paused ? "Paused Resonator" : "Connected Resonator"
    button.tooltip = paused ? "Resume Resonator" : "Disconnect from Resonator"
    button.command = "vscode-resonator.manualDisconnect"
  } else {
    button.text = "Disconnected Resonator"
    button.tooltip = "Connect to Resonator"
    button.command = "vscode-resonator.manualConnect"
  }
}

export const activate = async (context: vscode.ExtensionContext) => {
  const defaultPort = getResonatorDefaultPort()
  const outputChannel = vscode.window.createOutputChannel("vscode-resonator")
  wsHandler = new WebSocketHandler(outputChannel)

  const connectCommand = vscode.commands.registerCommand("vscode-resonator.connect", async () => {
    await wsHandler.connect({ port: defaultPort, showPortInput: true })
  })
  const manualConnectCommand = vscode.commands.registerCommand("vscode-resonator.manualConnect", async () => {
    await wsHandler.connect({ port: defaultPort, showPortInput: true })
    setAutoConnect(true)
  })
  const disconnectCommand = vscode.commands.registerCommand("vscode-resonator.disconnect", () => {
    wsHandler.disconnect()
  })
  const manualDisconnectCommand = vscode.commands.registerCommand("vscode-resonator.manualDisconnect", () => {
    wsHandler.disconnect()
    setAutoConnect(false)
  })
  const showOutputChannelCommand = vscode.commands.registerCommand("vscode-resonator.showOutputChannel", () => {
    outputChannel.show()
  })

  context.subscriptions.push(
    connectCommand,
    disconnectCommand,
    showOutputChannelCommand,
    manualConnectCommand,
    manualDisconnectCommand,
  )

  vscode.window.onDidChangeTextEditorSelection((event) => {
    sendCursorPos({ event, wsHandler })
  })

  vscode.window.onDidChangeActiveTextEditor(async () => {
    if (getAutoConnect() && !wsHandler.isConnected) {
      await wsHandler.connect({ port: defaultPort })
    }
  })

  const resonatorButton = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 1000)
  setResonatorButtonProps(resonatorButton, wsHandler.isConnected)
  resonatorButton.show()

  wsHandler.onConnectionStatusChange((connected: boolean) => {
    setResonatorButtonProps(resonatorButton, connected)
  })

  wsHandler.onPausedChange((paused: boolean) => {
    setResonatorButtonProps(resonatorButton, wsHandler.isConnected, paused)
  })

  await wsHandler.connect({ port: defaultPort })
}

export const deactivate = () => {
  wsHandler.disconnect()
}

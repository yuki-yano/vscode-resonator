import * as vscode from "vscode"
import { WebSocket, MessageEvent as WsMessageEvent } from "ws"

import type { CursorPos, MessageProtocol, TextContentProtocol } from "./types"

import { setVSCodePosition } from "./vscode"

export class WebSocketHandler {
  public isConnected = false
  public isPaused = false
  private connectionStatusListeners: ((isConnected: boolean) => void)[] = []
  private outputChannel: vscode.OutputChannel
  private pausedListeners: ((paused: boolean) => void)[] = []
  private socket: undefined | WebSocket

  constructor(outputChannel: vscode.OutputChannel) {
    this.outputChannel = outputChannel
  }

  public async connect({ port, showPortInput = false }: { port: number; showPortInput?: boolean }) {
    const socketPort = showPortInput
      ? await vscode.window.showInputBox({
          placeHolder: port.toString(),
          prompt: "Enter the port number to connect to",
          value: port.toString(),
        })
      : port.toString()

    if (socketPort == null || Number.isNaN(Number(socketPort))) {
      return
    }

    this.socket = new WebSocket(`ws://localhost:${socketPort}`)

    this.socket.addEventListener("message", this.handleMessage.bind(this))
    this.socket.on("open", () => {
      this.isConnected = true
      this.notifyConnectionStatus(true)
      this.outputChannel.appendLine("Connected to the resonator server")
    })
    this.socket.on("message", (message) => {
      this.outputChannel.appendLine(`Received message: ${message}`)
    })
    this.socket.on("error", (error) => {
      this.outputChannel.appendLine(`Error: ${error}`)
      this.isConnected = false
      this.notifyConnectionStatus(false)
    })
    this.socket.on("close", () => {
      this.outputChannel.appendLine("Disconnected from the resonator server")
      this.isConnected = false
      this.notifyConnectionStatus(false)
    })
  }

  public disconnect() {
    this.socket?.close()
    this.socket = undefined
    this.isConnected = false
    this.notifyConnectionStatus(false)
  }

  public onConnectionStatusChange(listener: (isConnected: boolean) => void) {
    this.connectionStatusListeners.push(listener)
  }

  public onPausedChange(listener: (paused: boolean) => void) {
    this.pausedListeners.push(listener)
  }

  public sendMessage(message: MessageProtocol): void {
    if (this.socket?.readyState !== WebSocket.OPEN) {
      vscode.window.showErrorMessage(`Not connected, status: ${this.socket?.readyState}`)
      this.socket?.close()
      this.socket = undefined
      return
    }

    this.socket.send(JSON.stringify(message))
  }

  private async handleCursorPos(cursorPos: CursorPos, editor: vscode.TextEditor) {
    const document = await vscode.workspace.openTextDocument(cursorPos.path)
    await vscode.window.showTextDocument(document)

    setVSCodePosition({ editor, position: cursorPos })
  }

  private async handleMessage(event: WsMessageEvent) {
    const message = JSON.parse(event.data as string) as MessageProtocol
    this.outputChannel.appendLine(`Received message: ${message}`)

    if (message.paused !== this.isPaused) {
      this.isPaused = message.paused
      this.notifyPaused(this.isPaused)
    }
    if (message.paused) {
      return
    }

    if (vscode.window.state.focused) {
      return
    }

    const editor = vscode.window.activeTextEditor
    if (editor == null) {
      return
    }

    switch (message.type) {
      case "CursorPos":
        await this.handleCursorPos(message, editor)
        break
      case "SelectionPos":
        // editor.selection = new vscode.Selection(message.startLine, message.startCol, message.endLine, message.endCol)
        break
      case "TextContent":
        vscode.window.showInformationMessage(
          `CursorPos: ${message.sender} ${message.path} ${message.line} ${message.col} ${message.text}`,
        )
        this.handleTextContent(message, editor)
        break
    }
  }

  private handleTextContent(message: TextContentProtocol, editor: vscode.TextEditor) {
    vscode.window.showInformationMessage(
      `Handling TextContent: ${message.sender} ${message.path} ${message.line} ${message.col} ${message.text}`,
    )
    vscode.window.showInformationMessage(editor.document.uri.fsPath)
    if (message.path !== editor.document.uri.fsPath) {
      return
    }

    // ファイル全体を書き換えてからカーソル移動
    editor.edit((editBuilder) => {
      editBuilder.replace(new vscode.Range(0, 0, editor.document.lineCount, 0), message.text)
    })

    const position: CursorPos = {
      col: message.col,
      line: message.line,
      path: message.path,
    }
    setVSCodePosition({ editor, position })
  }

  private notifyConnectionStatus(isConnected: boolean) {
    this.connectionStatusListeners.forEach((listener) => listener(isConnected))
  }

  private notifyPaused(paused: boolean) {
    this.pausedListeners.forEach((listener) => listener(paused))
  }
}

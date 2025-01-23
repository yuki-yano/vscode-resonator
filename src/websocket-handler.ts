import * as vscode from "vscode"
import { WebSocket, MessageEvent as WsMessageEvent } from "ws"

import type { CursorPos, MessageProtocol, TextContentProtocol } from "./types"

import { getResonatorDefaultPort } from "./utils"
import { setVSCodePosition } from "./vscode"

export class WebSocketHandler {
  private outputChannel: vscode.OutputChannel
  private socket: undefined | WebSocket

  constructor(outputChannel: vscode.OutputChannel) {
    this.outputChannel = outputChannel
  }

  public async connect() {
    const defaultPort = getResonatorDefaultPort()
    const socketPort = await vscode.window.showInputBox({
      placeHolder: defaultPort.toString(),
      prompt: "Enter the port number to connect to",
      value: defaultPort.toString(),
    })

    if (socketPort == null || Number.isNaN(Number(socketPort))) {
      return
    }

    this.socket = new WebSocket(`ws://localhost:${socketPort}`)

    this.socket.addEventListener("message", this.handleMessage.bind(this))

    this.socket.on("open", () => {
      this.outputChannel.appendLine("Connected to the resonator server")
      vscode.window.showInformationMessage("Connected to the resonator server")
    })
    this.socket.on("message", (message) => {
      this.outputChannel.appendLine(`Received message: ${message}`)
    })
    this.socket.on("error", (error) => {
      this.outputChannel.appendLine(`Error: ${error}`)
    })
    this.socket.on("close", () => {
      this.outputChannel.appendLine("Disconnected from the resonator server")
      vscode.window.showInformationMessage("Disconnected from the resonator server")
    })
  }

  public disconnect() {
    this.socket?.close()
    this.socket = undefined
    vscode.window.showInformationMessage("Disconnected from the resonator server")
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
    this.outputChannel.appendLine(`Handling CursorPos: ${cursorPos.path} ${cursorPos.line} ${cursorPos.col}`)

    const document = await vscode.workspace.openTextDocument(cursorPos.path)
    await vscode.window.showTextDocument(document)

    setVSCodePosition({ editor, position: cursorPos })
  }

  private async handleMessage(event: WsMessageEvent) {
    const message = JSON.parse(event.data as string) as MessageProtocol
    this.outputChannel.appendLine(`Received message: ${message}`)

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
}

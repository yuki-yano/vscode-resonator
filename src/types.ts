export type CursorPos = {
  col: number
  line: number
  path: string
}

export type CursorPosProtocol = {
  col: number
  line: number
  path: string
  paused: boolean
  sender: "vim" | "vscode"
  type: "CursorPos"
}

export type ExecuteCommandProtocol = {
  args: Array<string>
  command: string
  paused: boolean
  sender: "vim" | "vscode"
  type: "ExecuteCommand"
}

export type MessageProtocol = CursorPosProtocol | ExecuteCommandProtocol | SelectionPosProtocol | TextContentProtocol

export type SelectionPosProtocol = {
  endCol: number
  endLine: number
  path: string
  paused: boolean
  sender: "vim" | "vscode"
  startCol: number
  startLine: number
  type: "SelectionPos"
}

export type TextContentProtocol = {
  col: number
  line: number
  path: string
  paused: boolean
  sender: "vim" | "vscode"
  text: string
  type: "TextContent"
}

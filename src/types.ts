export type CursorPos = {
  col: number
  line: number
  path: string
}

export type CursorPosProtocol = {
  col: number
  line: number
  path: string
  sender: "vim" | "vscode"
  type: "CursorPos"
}


export type MessageProtocol = CursorPosProtocol | SelectionPosProtocol | TextContentProtocol

export type SelectionPosProtocol = {
  endCol: number
  endLine: number
  path: string
  sender: "vim" | "vscode"
  startCol: number
  startLine: number
  type: "SelectionPos"
}

export type TextContentProtocol = {
  col: number
  line: number
  path: string
  sender: "vim" | "vscode"
  text: string
  type: "TextContent"
}

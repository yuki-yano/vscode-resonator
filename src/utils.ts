import * as vscode from "vscode"

export const getResonatorDefaultPort = () => {
  const cwd = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath
  if (cwd == null) {
    throw new Error("No workspace folder")
  }

  let hash = 0
  for (let i = 0; i < cwd.length; i++) {
    hash = (hash << 5) - hash + cwd.charCodeAt(i)
    hash = hash & hash
  }
  return (Math.abs(hash) % 40000) + 20000
}

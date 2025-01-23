import { CursorPos } from "./types"

export let lastCursorPos: CursorPos | undefined

export const setLastCursorPos = (pos: CursorPos) => {
  lastCursorPos = pos
}

export const getLastCursorPos = () => {
  return lastCursorPos
}

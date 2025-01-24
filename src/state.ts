import { CursorPos } from "./types"

export let lastCursorPos: CursorPos | undefined
export const setLastCursorPos = (pos: CursorPos) => {
  lastCursorPos = pos
}
export const getLastCursorPos = () => {
  return lastCursorPos
}

let paused = false
export const setPaused = (_paused: boolean) => {
  paused = _paused
}
export const getPaused = () => {
  return paused
}

let autoConnect = true
export const setAutoConnect = (_autoConnect: boolean) => {
  autoConnect = _autoConnect
}
export const getAutoConnect = () => {
  return autoConnect
}

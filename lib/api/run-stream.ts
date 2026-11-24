/**
 * Following an Agent run over server-sent events (backend docs/agent-platform.md): read the
 * stream a send or a report opened, and if it drops before the run ends, pick up from the last
 * event with GET .../runs/:id/events?after=. Closing a stream never stops the run.
 */

export interface SseMessage {
  id: string
  event: string
  data: string
}

/** The events of an SSE body, in order. Comments (keep-alives) are skipped. */
export async function* readSse(body: ReadableStream<Uint8Array>): AsyncGenerator<SseMessage> {
  const reader = body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  try {
    while (true) {
      const { value, done } = await reader.read()
      buffer += decoder.decode(value, { stream: !done }).replace(/\r\n?/g, '\n')
      let end = buffer.indexOf('\n\n')
      while (end >= 0) {
        const message = parseBlock(buffer.slice(0, end))
        buffer = buffer.slice(end + 2)
        if (message) yield message
        end = buffer.indexOf('\n\n')
      }
      if (done) break
    }
    const last = parseBlock(buffer)
    if (last) yield last
  } finally {
    reader.releaseLock()
  }
}

function parseBlock(block: string): SseMessage | null {
  let id = ''
  let event = 'message'
  const data: string[] = []
  for (const line of block.split('\n')) {
    if (!line || line.startsWith(':')) continue
    const colon = line.indexOf(':')
    const field = colon < 0 ? line : line.slice(0, colon)
    const value = colon < 0 ? '' : line.slice(colon + 1).replace(/^ /, '')
    if (field === 'id') id = value
    else if (field === 'event') event = value
    else if (field === 'data') data.push(value)
  }
  return data.length ? { id, event, data: data.join('\n') } : null
}

/** A run's last event: after it the server closes the stream. */
export const ENDING_EVENTS = ['run.completed', 'run.failed', 'run.canceled']

export interface FollowOptions {
  /** Every event, data parsed. */
  onMessage: (message: { id: string; type: string; data: unknown }) => void
  /** The stream of a run from an event on, e.g. GET .../runs/:id/events?after=. */
  reopen: (runId: string, after: string) => Promise<Response>
  /** How many times a dropped stream is reopened before giving up. */
  retries?: number
  /** Waits before reopening; tests make it instant. */
  wait?: (attempt: number) => Promise<void>
}

/** Thrown when the stream dropped and could not be picked up again. */
export class StreamLostError extends Error {
  constructor() {
    super('The connection to the AI analyst was lost')
    this.name = 'StreamLostError'
  }
}

const pause = (attempt: number) => new Promise<void>((resolve) => setTimeout(resolve, Math.min(8000, 1000 * attempt)))

/**
 * Reads a run's stream until its last event. The run id comes with its first event
 * (`run.created`); without it a dropped stream cannot be picked up.
 */
export async function followRun(first: Response, options: FollowOptions): Promise<void> {
  const { onMessage, reopen, retries = 5, wait = pause } = options
  let runId = ''
  let after = ''
  let response = first
  let failures = 0
  while (true) {
    let ended = false
    let progressed = false
    try {
      if (!response.body) throw new StreamLostError()
      for await (const message of readSse(response.body)) {
        if (message.id) after = message.id
        let data: unknown = null
        try {
          data = JSON.parse(message.data)
        } catch {
          continue
        }
        if (message.event === 'run.created' && typeof (data as { run_id?: unknown })?.run_id === 'string') runId = (data as { run_id: string }).run_id
        progressed = true
        onMessage({ id: message.id, type: message.event, data })
        if (ENDING_EVENTS.includes(message.event)) ended = true
      }
    } catch {
      // A dropped connection: reopened below.
    }
    if (ended) return
    if (!runId) throw new StreamLostError()
    failures = progressed ? 1 : failures + 1
    if (failures > retries) throw new StreamLostError()
    await wait(failures)
    try {
      response = await reopen(runId, after)
    } catch {
      response = new Response(null)
    }
  }
}

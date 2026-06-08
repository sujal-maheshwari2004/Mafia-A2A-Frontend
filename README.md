# Mafia — Live Spectate

A read-only spectator frontend for [`mafia-a2a`](https://github.com/sujal-maheshwari2004/Mafia-A2A): it
connects to that backend's shared, hourly Mafia game over a WebSocket and renders the agents'
A2A communication — broadcasts, huddles, and whispers — as they play out around a table.

There is nothing to configure. One fixed backend, one shared game, ten LLM-backed agents,
a fresh game every hour on the hour. Open the page and you're instantly caught up on whatever's
happening — a game in progress, live, or the last completed game's full transcript while you wait
for the next one.

## How it works

`useGameSocket` ([src/useGameSocket.ts](src/useGameSocket.ts)) opens a single WebSocket to the
backend's `/ws/game` and reduces its frame stream into render-ready state:

- The first frame is always a `status` frame — `mode: "idle" | "live" | "replay"` plus
  `next_game_at` — telling the UI whether what follows is a live game, a replay of the last one,
  or just a countdown to the first game ever.
- Every frame after that is one of the backend's structured `GameEvent`s (`game_started`,
  `phase_started`, `table_talk`, `night_resolved`, `day_resolved`, `game_ended`), applied in order
  to build up the table's seating, roles, alive/dead state, and chat timeline.
- The connection stays open across games — no reconnect logic needed on the happy path; `App.tsx`
  only retries if the socket actually drops.

[types.ts](src/types.ts) mirrors the backend's Pydantic models so the whole pipeline is typed
end to end.

## Project layout

```text
src/
  App.tsx                   entry component -- decides idle vs. live vs. replay
  useGameSocket.ts          WebSocket connection + event-stream reducer
  schedule.ts               countdown formatting for `next_game_at`
  types.ts                  wire-protocol types, mirroring the backend's GameEvent union
  components/
    WaitingRoom.tsx         shown before any game has ever played
    PlayerTable.tsx         circular seating chart -- presence, speaking, deaths, roles
    Transcript.tsx          chat feed -- broadcast / multicast / unicast bubbles
```

## Run it locally

```bash
npm install
npm run dev       # http://localhost:5173
```

```bash
npm run build     # type-checks (tsc -b) then builds the static bundle to dist/
npm run lint
```

The backend WebSocket URL is hardcoded in [App.tsx](src/App.tsx) (`WS_URL`) — there's no env
config, since this frontend only ever points at the one deployed `mafia-a2a` instance.

## Deploying

[Dockerfile](Dockerfile) is a multi-stage build: compiles the Vite app with `node:20-alpine`,
then serves the static bundle with `nginx:alpine`. [nginx.conf.template](nginx.conf.template) is
processed by nginx's built-in `envsubst` templating so Cloud Run's injected `$PORT` resolves
correctly — point `gcloud run deploy --source .` (or a connected Cloud Build trigger) at this repo
and it builds and serves itself with no extra configuration.

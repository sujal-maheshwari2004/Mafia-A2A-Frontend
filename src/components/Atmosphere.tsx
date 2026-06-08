interface Props {
  /** 0 (no one's died yet) to 1 (the floor's slick with it) -- how far the room has soured. */
  bloodLevel: number
}

/**
 * The room itself, behind everything else: a back booth at the Hog's Head
 * well past closing, candles guttering against the draught, rain working
 * steadily at the windows -- and, as the night wears on and the chairs empty
 * out, a slow red wash that creeps in from the edges and pools toward the table.
 *
 * Fixed and pointer-events-none so it never competes with the table for
 * interaction; everything else renders on top of it, relatively positioned.
 */
export function Atmosphere({ bloodLevel }: Props) {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden>
      <div className="atmosphere-vignette absolute inset-0" />

      <div
        className="atmosphere-candle absolute -left-[12%] top-[10%] h-72 w-72 rounded-full sm:h-96 sm:w-96"
        style={{ background: 'radial-gradient(circle, rgba(232,163,61,0.32), transparent 70%)' }}
      />
      <div
        className="atmosphere-candle atmosphere-candle--two absolute -right-[10%] top-[42%] h-80 w-80 rounded-full sm:h-[26rem] sm:w-[26rem]"
        style={{ background: 'radial-gradient(circle, rgba(201,132,42,0.26), transparent 70%)' }}
      />

      <div className="atmosphere-rain absolute -inset-x-[12%] -inset-y-[18%]" />

      <div className="atmosphere-blood absolute inset-0" style={{ opacity: 0.07 + bloodLevel * 0.62 }} />
    </div>
  )
}

const s = strudel()
s.setcps(0.55)

// Chord progression
const chords = s.chord("<Am7 Dm9 G7 Cmaj7>/4").dict("ireal")

s.stack(
  // Pads
  chords.offset(-1).voicing()
    .s("gm_pad_poly")
    .room(0.6)
    .delay(0.2)
    .gain(0.6),

  // Flute melody
  s.n("[0 ~ 2 4] ~ <5 7 9>")
    .set(chords)
    .mode("dorian")
    .voicing()
    .s("gm_pan_flute")
    .room(0.7)
    .delay("<0 .125 .25>")
    .gain(0.7)
    .rarely(s.ply ? s.ply("2") : (() => {}))
    .slow(2),

  // Subtle percussion
  s.stack(
    s("bd").struct("<[x~ x] x>").gain(0.5),
    s("rim:<2 3>").mask("<0 1 1 0>/16").gain(0.3),
    s("shaker:<1 2>").mask("1*4").gain(0.25)
  )
  .bank("crate")
  .delay(0.05),

  // Flute echoes
  s.n("<0!2 3 5>")
    .set(chords)
    .mode("aeolian")
    .voicing()
    .s("gm_pan_flute")
    .slow(3)
    .room(0.6)
    .lpf(800)
    .delay(0.3)
    .gain(0.5)
)
.segment(4)
.chunk(4, s.fast ? s.fast(2) : (() => {}))
.fm(s.sine ? s.sine.range(2,8).slow(6) : (() => {}))
.reverb(0.6)
.late("[0 .01]*2")
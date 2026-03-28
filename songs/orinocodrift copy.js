setcps(0.5) // 🌊 slow flowing tempo

const chords = chord("<Cmaj7 Am9 Fmaj7 G6>/4").dict("ireal")

stack(
  // 🫧 Pad layer – mist and movement
  chords.offset(-1).voicing()
    .s("gm_pad_choir")
    .room(0.7)
    .delay(0.3)
    .gain(0.5)
    .lpf(1000),

  // ✨ Bell melody – floating arpeggios
  n("0 ~ 4 ~ 7 ~").set(chords)
    .mode("major")
    .voicing()
    .s("gm_music_box")
    .room(0.8)
    .delay("<0 .125>")
    .slow(3)
    .gain(0.3),

  // 🌬️ Bottle-blow echo – drifting accents
  n("<0 2 5>").set(chords)
    .mode("lydian")
    .voicing()
    .s("gm_bottle_blow")
    .room(0.9)
    .delay("<.25 .5>")
    .gain(0.4)
    .slow(4)
    .rarely(() => ply("2")),

  // 🥁 Subtle rhythm – soft and sparse
  stack(
    s("bd").struct("x ~ x").gain(0.3),
    s("hh").struct("~ x ~ x").gain(0.2),
    s("rd:<2>*2").mask("1*4").gain(0.15)
  )
  .bank("crate")
  .delay(0.05)
)
.chunk(4, fast(2))
.late("[0 .01]*2")
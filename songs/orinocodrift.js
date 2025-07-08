import { strudel } from "@strudel/web"
const s = strudel()

s.setcps(0.5) // slow flowing pace

// Gentle major 7th pad progression
const chords = s.chord("<Cmaj7 Am9 Fmaj7 G6>/4").dict("ireal")

s.stack(
  // 🕊️ Pad layer: the misty breeze
  chords.offset(-1).voicing()
    .s("gm_pad_choir")
    .room(0.7)
    .delay(0.3)
    .gain(0.5)
    .lpf(1000),

  // ✨ Bell sparkle
  s.n("0 ~ 4 ~ 7 ~").set(chords)
    .mode("major")
    .voicing()
    .s("gm_music_box")
    .room(0.8)
    .delay("<0 .125>")
    .slow(3)
    .gain(0.3),

  // 🌊 Ambient bottle flute echoes
  s.n("<0 2 5>").set(chords)
    .mode("lydian")
    .voicing()
    .s("gm_bottle_blow")
    .room(0.9)
    .delay("<.25 .5>")
    .gain(0.4)
    .slow(4)
    .rarely(s.ply?.("2") ?? (() => {})),

  // 🫧 Subtle rhythmic bed
  s.stack(
    s("bd").struct("x ~ x").gain(0.3),
    s("hh").struct("~ x ~ x").gain(0.2),
    s("rd:<2>*2").mask("1*4").gain(0.15)
  )
  .bank("crate")
  .delay(0.05)
)
.chunk(4, s.fast?.(2) ?? (() => {}))
.reverb(0.6)
.late("[0 .01]*2")
// Bell-forward starter template.
// Try changing the note patterns before you touch the effects.

setcps(0.38)

stack(
  n("<0 4 5 7>")
    .scale("C4:major")
    .s("sine")
    .attack(0.04)
    .decay(1)
    .sustain(0)
    .release(0.12)
    .room(0.44)
    .gain(0.18)
    .slow(4),

  n("[0 ~ 2 4] <5 7>")
    .scale("E5:minor")
    .s("triangle")
    .lpf(1600)
    .attack(0.01)
    .decay(0.24)
    .sustain(0)
    .release(0.06)
    .delay("<0 .25>")
    .room(0.42)
    .gain(0.26)
    .slow(4),

  n("~ <7 9> ~ <11>")
    .scale("C6:major")
    .s("sawtooth")
    .lpf(1200)
    .attack(0.01)
    .decay(0.18)
    .sustain(0)
    .release(0.05)
    .room(0.4)
    .gain(0.12)
    .slow(8)
)
.room(0.32)
.rsize(2)

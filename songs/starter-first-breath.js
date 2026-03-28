// Safe starter template:
// 1. Change the scale names first.
// 2. Then try editing the lead notes.
// 3. Keep the final stack(...) expression in place.

setcps(0.5)

stack(
  n("<0 3 5 6>")
    .scale("A3:minor")
    .s("sawtooth")
    .lpf(900)
    .lpq(3)
    .attack(0.02)
    .decay(0.75)
    .sustain(0)
    .release(0.08)
    .room(0.38)
    .gain(0.28)
    .slow(2),

  n("[0 2 4 ~] ~ <5 7>")
    .scale("A4:dorian")
    .s("triangle")
    .lpf(1600)
    .resonance(6)
    .attack(0.01)
    .decay(0.28)
    .sustain(0)
    .release(0.08)
    .room(0.26)
    .delay("<0 .125>")
    .gain(0.34)
    .slow(2),

  s("bd")
    .struct("x ~ ~ x")
    .bank("crate")
    .gain(0.24)
    .delay(0.04)
)
.room(0.28)
.rsize(2)

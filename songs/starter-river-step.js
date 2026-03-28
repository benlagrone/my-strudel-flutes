// Slightly more rhythmic starter template.
// Good for experimenting with bass movement and gentle percussion.

setcps(0.62)

stack(
  n("<0 2 4 5>")
    .scale("D4:minor")
    .s("sawtooth")
    .lpf(1100)
    .lpq(2.5)
    .attack(0.02)
    .decay(0.5)
    .sustain(0)
    .release(0.06)
    .room(0.34)
    .gain(0.2)
    .slow(2),

  n("[0 2 4 7] [2 4 7 9]")
    .scale("D5:dorian")
    .s("triangle")
    .attack(0.01)
    .decay(0.18)
    .sustain(0)
    .release(0.05)
    .delay("<0 .125>")
    .room(0.38)
    .gain(0.24)
    .fast(2),

  n("0 ~ 0 2")
    .scale("D2:minor")
    .s("square")
    .lpf(800)
    .attack(0.01)
    .decay(0.22)
    .sustain(0)
    .release(0.05)
    .gain(0.16)
    .slow(2),

  stack(
    s("bd").struct("x ~ x ~").gain(0.32),
    s("hh").struct("~ x ~ x").gain(0.1),
    s("rim").struct("~ ~ x ~").gain(0.08)
  )
    .bank("crate")
)
.room(0.28)

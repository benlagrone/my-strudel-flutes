setcps(0.28)

stack(
  n("<0 3 5 7>")
    .scale("A3:minor")
    .s("sawtooth")
    .lpf(700)
    .lpq(4)
    .attack(0.04)
    .decay(1.2)
    .sustain(0)
    .release(0.16)
    .room(0.46)
    .gain(0.14)
    .slow(6),

  n("[0 ~ ~ 2] <4 5>")
    .scale("A4:minor")
    .s("triangle")
    .lpf(1200)
    .attack(0.01)
    .decay(0.22)
    .sustain(0)
    .release(0.06)
    .room(0.44)
    .delay("<0 .5>")
    .gain(0.16)
    .slow(8),

  n("~ <7 ~ 9>")
    .scale("C6:major")
    .s("sine")
    .attack(0.01)
    .decay(0.1)
    .sustain(0)
    .release(0.04)
    .room(0.48)
    .gain(0.08)
    .slow(16),

  stack(
    s("bd").struct("x ~ ~ x").gain(0.12),
    s("hh").struct("~ x ~ ~").gain(0.08)
  )
    .bank("crate")
    .delay(0.06)
)
.room(0.36)
.rsize(3.5)

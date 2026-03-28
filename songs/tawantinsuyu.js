setcps(0.5)

stack(
  n("<0 3 5 6>")
    .scale("A3:minor")
    .s("sawtooth")
    .lpf(900)
    .lpq(3)
    .attack(0.02)
    .decay(0.72)
    .sustain(0)
    .release(0.08)
    .room(0.36)
    .gain(0.28)
    .slow(2),

  n("[0 2 4 ~] ~ <5 7>")
    .scale("A4:dorian")
    .s("triangle")
    .lpf(1500)
    .attack(0.01)
    .decay(0.26)
    .sustain(0)
    .release(0.06)
    .room(0.4)
    .delay("<0 .125>")
    .gain(0.3)
    .slow(2),

  stack(
    s("bd").struct("x ~ ~ x").gain(0.26),
    s("hh").struct("~ x ~ x").gain(0.1)
  )
    .bank("crate")
    .delay(0.04),

  n("~ <7 9> ~ <11>")
    .scale("C6:major")
    .s("sine")
    .attack(0.01)
    .decay(0.14)
    .sustain(0)
    .release(0.04)
    .room(0.42)
    .gain(0.14)
    .slow(4)
)
.room(0.3)
.rsize(2.5)

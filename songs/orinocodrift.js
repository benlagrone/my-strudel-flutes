setcps(0.46)

stack(
  n("<0 4 5 7>")
    .scale("C4:major")
    .s("sawtooth")
    .lpf(1000)
    .lpq(3)
    .attack(0.02)
    .decay(0.58)
    .sustain(0)
    .release(0.08)
    .room(0.36)
    .gain(0.2)
    .slow(2),

  n("[0 2 4 ~] ~ [5 7]")
    .scale("C5:lydian")
    .s("triangle")
    .lpf(1400)
    .attack(0.01)
    .decay(0.24)
    .sustain(0)
    .release(0.06)
    .room(0.4)
    .delay("<0 .125>")
    .gain(0.24)
    .slow(2),

  n("0 ~ 0 2")
    .scale("C2:major")
    .s("sine")
    .lpf(700)
    .attack(0.01)
    .decay(0.26)
    .sustain(0)
    .release(0.06)
    .gain(0.12)
    .slow(2),

  stack(
    s("bd").struct("x ~ ~ x").gain(0.2),
    s("hh").struct("~ x ~ x").gain(0.08)
  )
    .bank("crate")
)
.room(0.3)
.rsize(2.2)

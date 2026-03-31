setcps(0.34)

stack(
  n("<0 3 5 7>")
    .scale("A3:minor")
    .s("sawtooth")
    .lpf(850)
    .lpq(3)
    .attack(0.03)
    .decay(1)
    .sustain(0)
    .release(0.12)
    .room(0.42)
    .gain(0.16)
    .slow(4),

  n("[0 ~ 2 4] ~ <5 7>")
    .scale("A4:minor")
    .s("triangle")
    .lpf(1300)
    .attack(0.01)
    .decay(0.28)
    .sustain(0)
    .release(0.06)
    .room(0.44)
    .delay("<0 .25>")
    .gain(0.22)
    .slow(4),

  n("~ <7 9> ~ <11>")
    .scale("C6:major")
    .s("sine")
    .attack(0.01)
    .decay(0.12)
    .sustain(0)
    .release(0.04)
    .room(0.46)
    .gain(0.12)
    .slow(8),

  stack(
    s("bd").struct("x ~ ~ ~").gain(0.1),
    s("hh").struct("~ ~ x ~").gain(0.06)
  )
    .bank("crate")
    .slow(2)
)
.room(0.34)
.rsize(3)

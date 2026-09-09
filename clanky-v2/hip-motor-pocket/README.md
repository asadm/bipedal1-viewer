# Motor pocket comparison

`hip_motor_pocket.py` compares the original Pi reservation with a 90° rotated,
translated reservation of the same dimensions and volume. Both X2216 short
motor pockets fit nominally in the unchanged body cavity with the rotated Pi:
94 checks pass. The original Pi layout has five overlapping pairs.

This is the earlier motor-only allocation comparison. The motor cylinders touch
the nominal inner side walls; the supplied 41 mm cross mounts do not fit the
smaller mounting reservations. No reduction or functional mounting is included.
`allocations.step` contains reserved volumes, not a complete drive.

Continue from [the stock gear layout](../hip-gear-layout/README.md), which moves
the motors inward and includes the axial space occupied by real gears and
proposed shaft supports. Neither study has changed the main assembly exports.

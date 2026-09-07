# Slim wheel motors for a 20 km/h design target

Research checked September 6, 2026. These are candidates, not substitutions in
the current CAD, bill of materials or driving simulation.

Follow-up selection: **SunnySky V2806 650KV**, $28.99 each, Ø35 × 18 mm,
47 g, with a proposed 5:1 reduction. See [wheel-upgrade.md](wheel-upgrade.md)
for the preferred next prototype motor and the full cost/validation caveats.

At a 100 mm tire diameter, 20 km/h = 5.556 m/s requires **1,061 wheel rpm**.
The selected Waveshare 42:1 gearmotor provides only 240 rpm no-load at 12 V.
The current 11.1 V plant has a calculated unloaded ceiling of 1.162 m/s.
Weight reduction alone cannot bridge this gearing/speed gap.

Mondo currently advertises Beni at up to 17.9 mph (28.8 km/h), with a 1.75 kg
mass. Its public page does not specify wheel motor model, winding, controller,
gear ratio or test conditions. The local teardown references expose hip/knee
motors; they do not identify the wheel motor. A compact outer-rotor brushless
wheel drive remains an inference, not an identification.

Source: https://mondorobotics.com/

## Candidates

| Motor | Bare motor envelope / mass | Listed price each | Assessment |
|---|---|---|---|
| RCTimer 5010-14, 360 KV | Ø50 × 26 mm, 92 g | $15.99 | Low-cost prototype candidate with approximately 3:1 reduction on 11.1 V. The ideal Kv-derived unloaded wheel speed is 25.1 km/h; this is not a loaded performance prediction. |
| CubeMars GL40 KV210 | GL40 body Ø46.5 × 21.5 mm, 107 g | $72.99 without encoder | Plausible direct-drive candidate: published 0.25 N·m at 2,100 rpm at 16 V. Rated motor speed exceeds the 1,061 rpm target, but actual wheel torque, cooling and vehicle stability need validation. |

RCTimer source:
https://rctimer.com/rctimer-5010-360kv-multicopter-brushless-motor-p0233.html

CubeMars source:
https://www.cubemars.com/product/gl40-kv210-gimbal-motor.html

CubeMars family drawing and specifications:
https://www.cubemars.com/images/file/20230703/1688352405877552.pdf

The earlier GL40 **KV70** suggestion is unsuitable for this speed target at its
16 V rating: its documented no-load speed is 1,015 rpm and rated-load speed is
430 rpm. The KV210 winding is materially different. Manufacturer prose lists
0.73 N·m peak while the KV210 table lists 0.75 N·m; resolve this before using a
precise peak limit. A peak number is not a continuous enclosed torque rating.

The earlier 4:1 RCTimer ratio on 11.1 V yields only 18.8 km/h even in the ideal
unloaded calculation. A 3:1 starting ratio leaves some speed headroom for 20
km/h. RCTimer supplies propeller test data, not a sealed wheel motor's torque,
phase-current and temperature curves. Do not turn its propeller DC input-current
figures into an assumed FOC phase-current rating.

## Remaining design requirements

- Both alternatives need rotor sensing and bidirectional current-controlled FOC
  for stationary balance and reversal; ordinary sensorless propeller control is
  not a qualified solution.
- Support wheel landing loads through a separate hub/bearing load path.
- Bare motor thickness excludes the hub, encoder, bearings, mounts, seals and
  any reduction stage. Neither envelope establishes a finished slim wheel pod.
- At 20 km/h, 0.25 N·m at a wheel is 27.8 W mechanical output. Torque reserve at
  speed, acceleration, braking and heat rejection matter as well as no-load rpm.
- Higher speed needs steering/terrain/contact experiments, measured motor and
  tire models, and realistic sensing. The present low-speed simulation cannot
  validate a 20 km/h vehicle.

Using RCTimer motors changes the prior motors-plus-springs estimate from $74.52
to $86.52 before the new reductions, encoders and wheel controllers. The GL40
pair changes that subtotal to $200.52 before controllers and mounting hardware.
The existing $75 motor/spring selection remains unchanged.

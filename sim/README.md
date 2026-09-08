# Simulation and transfer plan

This is the **concept-01 height-only plant**. The [enclosed jumping revision](../jump-upgrade.md) requires a different third actuator, elastic transmission and landing model. The current yoke servo must not be used to claim jumping performance.

`build_model.py` generates `clanky.xml` directly from the CAD parameters. `verify.py` checks the wheel and shock geometry at all 27 corner combinations and runs a ten-second passive dynamics smoke test. `plant.py` approximates wheel torque-speed saturation and lag, and rate-limits the shared yoke command. These are an initial plant, not a trained or validated balance controller.

Run `.venv-sim/bin/python design/sim/verify.py` from the project root. The model is compatible with MuJoCo 3.3.7 and has a `nominal` keyframe. Load that keyframe in a MuJoCo viewer to inspect it; it will fall without a balance controller. Use `Plant.step()` before each physics step when evaluating controllers so they cannot bypass its speed/torque and yoke-speed limits. Raw MJCF motors alone do not model voltage saturation.

## Interface

| Channel | Simulator interface | Hardware expectation |
| --- | --- | --- |
| Left/right wheel action | Signed PWM input to `Plant.step`; torque applied to each wheel joint | Bidirectional bridge, current limit, synchronized command timing |
| Shared height action | Target yoke displacement in metres, relative to middle height | Screw motor with measured position or encoder + homing |
| Body motion | Gyroscope and accelerometer sensors | Calibrated IMU; attitude estimator required |
| Wheel state | Joint angle/speed | Encoder counts, direction and velocity filtering; model motor-side backlash |
| Passive suspension state | Arm joint angle/speed | Two magnetic angle sensors; differentiated/filtered speed |
| Height state | Slide position/speed | Homed screw displacement or direct yoke sensor |
| Training-only values | Root world pose, exact contacts and velocities | Do not expose directly to the deployed policy |

Coordinates: X forward, Y left, Z up. Both wheel joint axes point along +Y. Verify electrical encoder and command signs on the restrained hardware; motor assemblies on opposite sides do not imply equal wiring signs. CAD uses millimetres; MuJoCo uses metres, kilograms, seconds and newtons.

The current two wheel actuators are bounded to 0.6 N·m in the simulator, a **provisional short-duration value**. The simple DC approximation uses manufacturer no-load/stall endpoints. Published current/torque points do not fit a single ideal model consistently, so current and temperature are deliberately not claimed to be simulated. Add identified electrical and thermal dynamics before testing aggressive operation.

Zero PWM in this approximation means zero applied terminal voltage with dynamic braking, rather than an electrically open/coasting motor. Match the bridge's actual zero-command behavior. The common-height position actuator is a force-limited servo approximation; it does not yet simulate the screw's motor current, friction, self-locking or thrust-bearing compliance.

## Identify before training for transfer

1. Weigh chassis, battery, wheel/carrier and yoke groups. Measure the assembled center of mass at low/middle/high height. Estimate inertias from the actual CAD/material distribution or a pendulum test.
2. Log PWM, battery voltage, current, encoder position and wheel speed in both directions at several loads. Identify deadband, backlash, Coulomb/viscous friction, torque-speed response, delay and heating. Check an unloaded reversal before any balance test.
3. On one corner, measure force versus wheel displacement at each height. Fit spring preload/rate and motion-dependent stiction. Record a free decay to estimate damping, then repeat at different speeds and temperatures. Verify the bought shock does not bottom or top out early.
4. Measure tire rolling radius, compliance, slip and friction on the actual intended surfaces. Flat cylinder contacts are only a first approximation to rubber tread on gravel/grass.
5. Identify IMU bias/noise, estimator latency, encoder quantization, passive-angle noise, command hold time, driver current limits, voltage sag and reset behavior. Log all channels with one time base.

`Plant(randomize=True)` currently randomizes motor torque/speed scale, voltage and lag only. It does **not** implement full domain randomization, backlash, sensor delay, battery sag or terrain variation. Add those after obtaining measurements, and choose ranges from measured variation rather than arbitrary wide distributions. Start with ±10–20% mass/spring/motor variation only as an exploratory prior, not evidence of robustness.

## Control and transfer sequence

First establish a conventional balance baseline with common height fixed and the real suspension left free. Include suspension angles and their rates: the wheel-drive torque acts on the sprung arms. If adequate balance cannot be obtained within useful travel and motor thermal limits, revise leverage/damping or revisit the linkage before training around a poor mechanism.

Then evaluate height transitions, low-speed driving and differential steering. Train a residual or direct policy only once the calibrated simulated plant reproduces recorded hardware trajectories sufficiently well. Use the same observation scaling, estimator, command cadence and action limits in both paths. Do not give the policy ideal torque commands if hardware only provides PWM without torque/current control.

Use held-out tests for low battery, payload/center-of-mass changes, one-wheel bumps, tire slip, temperature, delay and saturation. A controller that survives only nominal flat-ground runs has not established outdoor capability. Transfer through a restrained test fixture and low-energy trials before testing full range. Jumping is outside this plant's validated purpose and is not implemented by the slow height screw.

# MuJoCo driving baseline — existing Waveshare wheel motors

The current drivetrain was tested with the existing 2.10 kg concept-06 plant,
100 mm wheels, 11.1 V supply, 240 rpm at 12 V motor envelope and ±0.45 N·m wheel
torque cap. No CAD or motor substitution was made for this experiment.

Open `http://192.168.86.226:8765/viewer/streamlined.html?run=drive`.
The viewer replays saved MuJoCo body poses at selectable playback speed; it is
not an animation that prescribes vehicle translation. It includes actual and
commanded forward speed, wheel torque, timeline, orbit camera and braking.

## Results

| Command | Assumed opposing resistance | Mean cruise speed | Outcome |
|---|---:|---:|---|
| 0.80 m/s | 0 N | 0.794 m/s / 2.86 km/h | Tracks, balances and stops |
| 1.05 m/s | 0 N | 1.042 m/s / 3.75 km/h | Highest passing command in this sweep |
| 1.10 m/s | 0 N | No completed cruise window | Loses balance while accelerating |
| 0.80 m/s | 1 N | 0.762 m/s / 2.74 km/h | Remains upright and stops; fails tracking tolerance |

At 11.1 V the ideal unloaded wheel-speed ceiling is 1.162 m/s. The 1.10 m/s
failure is a limit of this controller, acceleration profile and assumed plant,
not a determination of the exact maximum achievable with every controller.
Forward body speed briefly exceeds the unloaded rolling-speed calculation in
the failing run because the robot is falling. That is not successful driving.

All cases use one height-scheduled LQR, with moving position/velocity references
and pendulum-model acceleration feedforward. The reference ramps at 0.30 m/s²,
holds its command for six seconds, brakes, and settles for four seconds. Cruise
statistics exclude the first second of the hold. Tracking passes if the maximum
absolute error over the remaining five seconds stays below 0.05 m/s. Stopping
passes if speed stays below 0.05 m/s during the last second. Body clearance,
lean, roll, spring compression, hip endstops, linkage closure, motor envelopes
and solver warnings are also checked.

The 19-case sweep has **9 passing and 10 failing cases**. It intentionally
includes excessive speed commands. All six 1–2 N resistance cases remain upright
and stop but fail the strict tracking tolerance. A 2 N, 150 ms pulse also fails
that tolerance during the disturbance while subsequently recovering. These
forces are explicit sensitivity inputs, not calibrated grass/gravel surfaces.
At 0.8 m/s, 9.6 V, 12 V and 2.4 kg individual variations pass. Halving the
timestep from 0.25 ms to 0.125 ms changes mean cruise speed by 0.000013 m/s.

Source script: `driving.py`. Full results: `output/driving/sweep.json`.
Four replay folders: `cruise`, `limit`, `overlimit`, `resistance`.
Browser checks passed all four cases, physics/enclosure display, timeline stage
selection and the existing height/jump UI, with zero JavaScript runtime errors.

## Reproduce

From the repository root:

```sh
.venv-sim/bin/python design/concept06/driving.py --speed .8 --save cruise
.venv-sim/bin/python design/concept06/driving.py --suite
.venv-sim/bin/python design/concept06/driving.py --record-examples
```

This is an ideal-state simulation. Assembly mass and inertia, gearbox friction,
backlash, sensor noise/latency, motor thermal limits and tire/terrain behavior
are unmeasured. The new exterior is drawn on the original simplified dynamics
and collision model. The results do not validate high-speed, off-road or
hardware performance. The proposed brushless upgrade has not been simulated.

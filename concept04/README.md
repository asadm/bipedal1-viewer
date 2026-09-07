# Independent-leg jumping robot — concept 04

This is the current **four-motor development design**: one wheel motor and one leg-extension motor per side. [Open the interactive CAD and MuJoCo replay](http://127.0.0.1:8765/viewer/fourbar.html). Use **Leg sliders** to inspect each side independently, **Cutaway** to expose the drives, and **Jump → Apex** to inspect the airborne pose.

**Higher jump study:** the same hardware model with deeper crouch, a 2.6 N·m requested hip push for 54 ms and increased hip damping reaches **71.9 mm wheel clearance / 41.9 mm COM rise**. Select **Higher** in the viewer or [open it directly](http://127.0.0.1:8765/viewer/fourbar.html?jump=higher). The nominal run passes, but four of twelve sensitivity/timestep cases fail the leg travel-limit check; this is an experimental profile. Half timestep gives 71.4 mm. Peak compression is 18.23 mm and combined hip copper loss is 207.7 J over five seconds, about twice the reference run. [Report](output/higher/report.json), [sensitivity](output/higher/sensitivity.json). The [25 cm sizing study](../concept05-study/README.md) investigates the mechanical changes required for Beni-like advertised height.

The selected motor and spring models are concrete. The assembly remains a packaging study, **not a final functional print release**. The nominal physics test passes; two of eleven sensitivity cases fail. Mechanical interference, mounting, torque transmission, sealing and strength have not been qualified. No physical robot has been tested.

## What changed

The earlier three-motor shared drive is replaced with two independent leg drives. Each leg has a closed four-bar linkage: a driven crank, a passive guide and an extended lower coupler. The knee follows the linkage and has no separate motor. Each knee has one stock compression spring acting between the upper and lower members. There is no slow screw actuator, spring latch or additional jump motor.

The inspiration is the **original research Ascento**, whose optimized linkage approximates vertical wheel travel, independent hip drives set the two leg heights, and parallel springs assist the motors. Its paper also demonstrates jumping and recovery from some falls. Our dimensions, commodity brushed motors and compression-spring implementation differ substantially. Ascento used ANYdrive hip actuators, direct-drive Maxon wheel motors and SLS PA12 structure; its hardware performance cannot be assumed for inexpensive geared motors and A1-mini FDM parts. [Original Ascento paper](https://arxiv.org/html/2005.11435v1)

Beni's teardown references appear to show independently powered hip and knee joints per leg, in addition to each wheel motor: approximately six locomotion actuators. That would allow fore/aft wheel placement as well as extension. The motor inventory is inferred from [IMG_3970](../../ref/IMG_3970.jpeg), not a published manufacturer BOM. There is no evidence here that Beni derives from Ascento. Extra pose freedom is a plausible engineering reason for the added joints; Mondo's precise design rationale is not established. Our four-motor design provides independent height, not all of Beni's apparent articulation.

## Selected motors and springs

Prices checked 6 September 2026. The agreed ceiling applies to **motors and springs only**. It excludes gears, shafts, bearings, drivers, sensors, tires, battery, wiring, prints, tax and shipping.

| Component | Qty | Each | Subtotal |
| --- | ---: | ---: | ---: |
| [Mabuchi RS-550PC-7527, Kysan 1112389](https://www.kysanelectronics.com/Products/SubClass.php?recordID=281) | 2 | $12.50 | $25.00 |
| [Waveshare DCGM-3865-12V-EN-240RPM, SKU 22346](https://www.waveshare.com/product/robotics/motors-servos/motors/dcgm-3865-12v-en-240rpm.htm) | 2 | $9.99 | $19.98 |
| [MISUMI SWF10-50 compression spring](https://us.misumi-ec.com/vona2/detail/110100185510/?HissuCode=SWF10-50) | 2 | $2.18 | $4.36 |
| **Total** | | | **$49.34** |

**Hip/jump drive:** the exact RS-550 winding is specified, not an arbitrary motor bearing the same case-size name. Its 12 V sheet gives 18,200 rpm no-load, 0.421 N·m stall torque and 70 A stall current. Stall is not a continuous rating. The proposed reduction is 16:1, using two 12:48 spur stages. A purchased gearbox and metal pinion SKUs are not selected. The simulation assumes 80% transmission efficiency, rotor inertia of 1e-5 kg·m², a 35 A limit per hip and an 11.1 V supply. The motor has advanced CCW brush timing; reverse performance needs measurement. [Manufacturer-authored motor sheet](https://www.electan.com/datasheets/mov555.pdf)

**Wheels:** the selected Waveshare motor is a 12 V, 240 rpm, 42:1 metal gearmotor with encoder, nominal mass 167 g and 6 mm shaft. Its published rated point is about 0.392 N·m at 125 rpm. The CAD uses the vendor's STEP envelope. Backlash, reversal response and radial impact support remain unmeasured. The current wiki specifies 13 PPR before reduction; verify the supplied encoder revision. [Official specifications and CAD downloads](https://www.waveshare.com/wiki/DCGM-3865-12V-EN-240RPM)

**Spring:** SWF10-50 is 50 mm free length, 10 mm nominal OD, 5 mm nominal ID and **3.9 N/mm ±10%**. Use 20 mm compression as the design ceiling; the catalog's maximum is 25 mm. Catalog cycle guidance does not establish robot landing life. The spring is softer than the previous SWF12-50 selection, reducing holding current in this geometry. Both seats must swivel and retain/guide the spring without coil bind. The viewer shows illustrative guides; these parts and their mounts are not detailed in the exported CAD. [MISUMI dimensional/rate catalog](https://uk.misumi-ec.com/pdf/fa/2014/P2_0365-0366_F37_EN.pdf)

## Geometry and print size

| Dimension | Current value |
| --- | ---: |
| Crank A–C | 60.420 mm |
| Passive guide B–D | 88.115 mm |
| Lower coupler C–D | 18.839 mm |
| Knee to wheel C–E | 90.000 mm |
| Fixed B relative to hip A, x/z | 19.592 / 45.000 mm |
| Commanded hip range | 0.7–1.2 rad |
| Wheel vertical travel | 50.227 mm |
| Wheel fore/aft excursion over that range | 0.131 mm |
| Tires, nominal envelope | 100 × 30 mm |
| Track between wheel centers | 150 mm |
| CAD bounds near ride pose | approximately 174 × 180 × 215 mm |
| Compact / extended top height, nominal level pose | approximately 180 / 230 mm |
| Assumed total mass | 2.40 kg, not weighed |

The 14 current rigid printed shapes comprise two body halves, six linkage members, two rims and four large gears. Every shape is a valid single solid with each bounding-box dimension under **170 mm**, leaving margin within the A1 mini's 180 mm build volume. The largest body half is about 160 × 66 × 96 mm. This checks geometric print size; it does not validate support removal, print orientation, strength or assembly. Further mounts, spring seats, covers and retainers will change the final part count. [CAD manifest](output/cad/manifest.json)

The clamshell is 2.8 mm nominal wall thickness with integrated bolt bosses. Metal pins and shafts are allocated, but their retention, bearing support and positive torque connections are unfinished. Some member/case clearances and gear/case clearance need correction; no complete interference-free motion sweep is claimed. Purchased tires and supported wheel hubs still need selection. The outer shape is enclosed in appearance; this does not establish a dirt/water seal or outdoor impact durability.

Files: [assembly STEP](output/cad/beni_four_motor_concept04.step), [CadQuery source](cad.py), [geometry](geometry.json), [STLs and manifest](output/cad/), [browser kinematics](kinematics.mjs).

## How the jump works

1. Both hip motors retract the legs and compress the springs.
2. Both motors apply a short extension command. Motor work and spring release push the wheels against the ground, accelerating the body upward.
3. Once both wheels leave the ground, the legs retract for clearance. Wheel torque helps control pitch in flight.
4. At landing, the springs and controlled hip motion absorb energy while wheel balancing resumes. The legs return to the normal standing position to reduce holding loss.

The springs act in parallel with the leg drive. They provide useful compliance only when the transmission and controller permit joint movement; a locked hip does not give an independently moving suspension leg. The spring damping value in the model is an assumption, not a selected damper specification.

## Recorded physics results

These values come from a free-body MuJoCo rollout with ground contact, closed-link constraints, motor torque-speed/current limits and reflected rotor inertia. The root pose is initialized once and then evolves under dynamics. The web UI overlays the CAD on recorded rigid-body poses; it does not invent the airborne trajectory. The native viewer replays the same state record and is not a live policy controller.

| Nominal 5 s jump run | Measured in simulation |
| --- | ---: |
| First-flight wheel clearance | **47.89 mm** |
| COM rise after takeoff threshold | **22.68 mm** |
| First-flight duration | 165.5 ms |
| Maximum body pitch magnitude | 1.40° |
| Peak spring compression | 14.20 mm |
| Peak current per hip | 35 A |
| Peak wheel torque | 0.302 N·m |
| Maximum loop closure error | 0.0138 mm |
| Body/link ground contact | none in simplified collision model |
| Final pitch / forward speed | −1.00° / −0.012 m/s |
| Hip winding loss, combined over 5 s | 104.8 J |

Takeoff is detected when both wheel contacts are absent and both clearances exceed 2 mm. Wheel clearance includes leg retraction and is **not** the same measurement as ballistic COM rise. COM rise is measured from the sampled takeoff threshold, not extrapolated to exact contact separation. [Full nominal report](output/report.json)

The separate 15 mm step test starts with one wheel on a higher surface, with that terrain height supplied to the controller. Both wheels remain supported and maximum body roll is approximately 0.0061°. This is a stationary unequal-height balance test, not autonomous step detection or climbing. Combined hip winding loss is about 97 J over 5 s, roughly 19 W average; prolonged uneven stance needs thermal testing. [Uneven-terrain report](output/uneven/report.json)

The unchanged jump controller was checked against eleven individual parameter cases. **Nine passed; two failed:**

- Mass −10%: 54.11 mm clearance, but the hip reaches the travel-limit rejection threshold. This is not an accepted improved jump.
- Rotor inertia ×2: 36.32 mm clearance, below the 40 mm acceptance target.
- Nominal, mass +10%, spring rate ±10%, zero branch damping, 65% gearbox efficiency, 10.5 V supply, 50% reverse-torque factor and tire friction 0.4 passed these checks individually.

These are not combined uncertainties or a statistical reliability test. Successful scalar variations do not validate backlash, sensor delay, battery sag, tires, collisions or controller transfer. Failures are preserved in [sensitivity.json](output/sensitivity.json), with earlier development trials in [development_sweep.json](output/development_sweep.json).

## Sim2real and the next physical gate

The plant exposes four motor actions: left wheel, right wheel, left hip and right hip. The underlying MuJoCo hip controls are output torques; the Python `Motor` wrapper applies the proposed motor's current/voltage limits and must remain in a training environment. Directly writing unrestricted hip torques into XML controls would bypass those limits. The model includes IMU sensors and named encoder joints.

The current demonstration controller uses perfect state, including COM position and world velocity. It is not a deployable policy and no learned controller or sim2real transfer is claimed. A hardware observation interface should use IMU angular velocity and acceleration, wheel encoder positions/velocities and absolute hip output angles; a state estimator must replace simulator-only quantities. Absolute hip sensing, homing and electrical drivers remain unselected.

Before hardware release, build **one complete leg/drive module** with restrained testing. Measure motor current/torque and reverse performance, output backlash/friction, effective rotor inertia, spring force/length, print deflection and wheel impacts. Qualify supported wheel bearings, gear teeth, shaft couplings, spring guides, fasteners and end stops. The assumed hip drivers must support 35 A each briefly, and the battery must handle the combined pulse without excessive sag; no chosen driver/battery yet establishes that capability. Structural and thermal qualification are separate from a successful dynamics rollout.

Feed the measured ranges into domain randomization for mass/COM/inertia, spring rate, damping, friction, gearbox loss/backlash, supply voltage, sensor noise and delay. Establish restrained balancing before changing height, then test low-energy hops and progressively harder landings. The original [transfer plan](../sim/README.md) remains useful process guidance, but its earlier three-actuator plant is superseded by this model.

## Reproduce

Run from the workspace root:

```sh
.venv-sim/bin/python design/concept04/trial.py --save
.venv-sim/bin/python design/concept04/sensitivity.py
.venv-sim/bin/python design/concept04/verify.py
node design/concept04/verify.mjs
.venv/bin/python design/concept04/cad.py
python3 design/viewer/serve.py
.venv-sim/bin/mjpython design/concept04/replay.py
```

The kinematics checks compare 121 independent left/right poses against the MuJoCo tree and spring sites, 101 poses against the browser linkage solver, and 25 independent browser pose pairs. All pass to numerical precision; these tests do not check solid-part interference.

For the unequal-height case, import `parameters` and `run` from `design/concept04`, set `p['left_terrain_m']=0.015`, then call `run(p, jump=False, save=True, name='uneven')`. Native replay accepts `--uneven`. Space pauses, R restarts, S changes speed, arrow keys step, and the mouse orbits. Installed environments use MuJoCo 3.3.7 and CadQuery 2.6.1.

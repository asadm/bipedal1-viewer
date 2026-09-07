# Concept 05: longer travel, four motors

[Open the new design and jump viewer](http://127.0.0.1:8765/viewer/longstroke.html) · [Open the height sliders](http://127.0.0.1:8765/viewer/longstroke.html?mode=pose) · [Assembly STEP](output/cad/beni_concept05_long_stroke.step)

This version implements the longer linkage, two independent 24:1 hip drives, SWF12-50 springs and enclosed wheel-motor housings. The nominal MuJoCo run achieves **68.9 mm clearance under both wheels**, lands, and recovers over an eight-second record. **The 250 mm jump target has not been reached.** Three of twelve uncertainty/timestep cases fail. This is development CAD and simulation, not a validated print-and-build robot.

## Inspect and replay

- **Jump replay:** play, pause, scrub, choose playback speed, or jump to Crouch / Takeoff / Apex / Land / Settle. The full recovery is retained.
- **Inspect travel:** move the common extension slider or enable independent left/right sliders. Compact / Ride / Extended / Split presets are available.
- **Cycle travel:** prescribed motion for inspecting the mechanism, not a simulated jump.
- **Compare:** show concept 04 beside concept 05 at the same fraction of their respective travel ranges.
- **Enclosed / Cutaway / Physics:** view the CAD exterior, internal drive, or simplified MuJoCo geometry at the same pose. Drag to orbit; scroll to zoom.

The new viewer loads its own CAD and simulation record. It does not relabel the earlier 72 mm replay as a result for this mechanism.

## Mechanism and package

| Item | Concept 05 |
| --- | --- |
| Locomotion motors | 2 wheel motors + 2 independent hip motors |
| Linkage per leg | Driven crank, passive guide, extended lower coupler; no knee motor |
| Vertical wheel travel | 99.81 mm |
| Fore/aft wheel excursion | 6.04 mm |
| Hip sweep for CAD inspection | 0.35–1.50 rad |
| Crank / guide / coupler / knee-to-wheel | 64.482 / 83.502 / 28.224 / 119.119 mm |
| Hip reduction | 24:1, two stages: 12:48 and 12:72, module 1 |
| Spring seats | 43 mm back from knee on crank, 25 mm along lower link |
| Maximum geometric spring compression | 18.53 mm; 20 mm chosen design limit |
| Compact CAD bounds | Approximately 212 × 180 × 180 mm |
| Extended CAD bounds | Approximately 159 × 180 × 280 mm |
| Printed pieces | 16, largest exported axis 169.54 mm |
| Tire envelope | 100 × 30 mm, tread illustrative; tire SKU unselected |

The motor housings integrate into the two lower links. Two removable rear lids provide motor insertion access, increasing the earlier 14-piece count to 16. Moving the wheel motors 6 mm inward clears their broad gearboxes from the tires while keeping the 180 mm overall width. Motor/housing solid overlap is zero in both local CAD checks. That is a limited component check, not a complete assembly interference sweep.

All printed solids are valid, connected, and fit a conservative 170 mm box without needing diagonal placement in the final layout. [CAD manifest and print dimensions](output/cad/manifest.json), [STL files and meshes](output/cad/). Print orientation, supports, fastening, shaft clamps, bearing retention, gear durability, sealing, cooling and strength still need work. The complete solid printed volume is approximately 514 cm³; this is not a slicer-derived finished mass. Springs and guide hardware in the web view are illustrative and are not detailed spring assemblies in the STEP.

## Selected parts and budget scope

| Component | Quantity | Part | Prior unit price |
| --- | ---: | --- | ---: |
| Hip motor | 2 | Mabuchi RS-550PC-7527 / Kysan 1112389 | $12.50 |
| Wheel motor | 2 | Waveshare DCGM-3865-12V-EN-240RPM / SKU 22346 | $9.99 |
| Spring | 2 | MISUMI SWF12-50 | $2.28 |
| Motors + springs subtotal | | | **$49.54** |

These are previously checked price estimates, not a new quotation. Transmission hardware, drivers, battery, electronics, bearings, tires, fasteners, printing, tax and shipping are additional. The 24:1 gearbox is custom development geometry; its metal pinions and torque interfaces are not yet selected or qualified.

The SWF12-50 is a 50 mm free-length, 12 mm OD, 6.5 mm nominal ID spring with nominal rate 5.5 N/mm and ±10% rate tolerance. The chosen 20 mm compression limit is below the catalog maximum of 25 mm. A retained spring guide must accommodate the unloaded gap when seat separation exceeds 50 mm; the spring cannot pull the leg together. [MISUMI catalog](https://uk.misumi-ec.com/pdf/fa/2014/P2_0365-0366_F37_EN.pdf), [spring purchase page](https://us.misumi-ec.com/vona2/detail/110100185510/?HissuCode=SWF12-50).

The hip motor is modeled from its 12 V, 18,200 rpm no-load and 0.421 N·m / 70 A stall points. Its advanced commutation means reverse performance is uncertain. [Motor supplier](https://www.kysanelectronics.com/Products/SubClass.php?recordID=281), [manufacturer datasheet](https://www.electan.com/datasheets/mov555.pdf).

The wheel motor uses the manufacturer's 240 rpm no-load, 0.392 N·m at 125 rpm rated and approximately 0.834 N·m stall figures. Its official STEP is included in the CAD. [Waveshare product](https://www.waveshare.com/product/robotics/motors-servos/motors/dcgm-3865-12v-en-240rpm.htm), [documentation](https://www.waveshare.com/wiki/DCGM-3865-12V-EN-240RPM).

## Measured simulation result

| Quantity | Nominal run |
| --- | ---: |
| Minimum clearance of the two wheels at first-flight apex | 68.93 mm |
| First flight duration | 216.75 ms |
| COM rise after takeoff detection | 43.38 mm |
| Peak body pitch during complete run | 20.50° |
| Final pitch after 8 s | −1.18° |
| Final forward speed | −0.062 m/s |
| Final wheel contact | Both wheels |
| Peak spring compression | 13.77 mm |
| Peak modeled hip current | 35 A per motor |
| Hip range during complete run | 0.455–1.243 rad |
| Maximum linkage closure error | 0.0254 mm |
| Body-to-ground contacts | None in nominal run |
| Modeled combined hip copper loss over 8 s | 158 J |

[Nominal report](output/jump/report.json), [recorded trajectory](output/jump/trajectory.json), [MuJoCo plant](output/jump/plant.xml), [complete parameters](output/jump/parameters.json).

The replay uses a free-floating rigid-body model, gravity, four motor commands, closed-loop linkage constraints and real contact dynamics. Body motion is not animated by a height script. The browser CAD follows recorded body poses. The slider mode is explicitly separate prescribed kinematics.

The 2.4 kg mass assumption is retained from concept 04. No result was obtained by silently reducing mass to the aspirational 1.75–2 kg target. The revised lower-link inertial allocation includes extra housing mass. Motor rotor inertia (1e−5 kg·m²), 80% drive efficiency, 11.1 V supply, 35 A per-hip current limit, reverse torque factor, friction and branch damping are assumptions, not measurements. The 24:1 drive reflects 2.25 times the rotor inertia of the former 16:1 drive.

## What fails, and what comes next

Nine of twelve nominal/uncertainty/timestep cases pass the existing jump, landing, travel, spring and recovery checks. **Spring rate +10%, zero assumed branch damping, and tire friction 0.4 fail through body contact and loss of recovery.** Halving the timestep gives 69.03 mm and passes. [Full uncertainty results](output/jump/sensitivity.json).

The earlier concept-04 experimental run reached 71.9 mm. The new travel and stronger drive do not yet improve that measured result. Aggressive launch settings in this geometry caused overextension or poor recovery. The selected replay demonstrates a smaller controlled jump in the nominal model; it is not a 25 cm performance claim or a robust outdoor policy.

Important model limits: internal assembly self-collision is disabled, the collision model is simplified, and the controller reads perfect state. Driver/battery delivery, thermal duty, detailed mounting, gearbox losses/inertia, backlash, landing strength, seals and real tire behavior remain unqualified. Nothing here establishes that the printed robot is unbreakable or ready for sim2real deployment.

The [historical energy/geometry study](sizing-notes.md) explains the approximate 8–11 J mechanical-input scenarios behind the 250 mm target. More travel alone is insufficient: drive inertia, useful push work, tucking, landing control and mass must be optimized together. Next engineering gates are a complete interference/mounting design, a single-leg test rig to measure the motor/gear/spring system, and simulation with measured parameters, sensor noise, delay, backlash and randomized terrain before policy transfer.

## Weight versus drive experiment

The user asked whether to increase motor power. A bounded comparison retains the accepted controller and timing, except for the explicitly stronger push command. These runs do not replace the viewer's accepted nominal record.

| Change from nominal | Wheel clearance | Current checks |
| --- | ---: | --- |
| Nominal: 2.4 kg, 24:1, 35 A, 3.9 N·m push request | 68.93 mm | Pass |
| Mass reduced to 2.0 kg | 67.26 mm | Pass |
| Current limit 45 A, same push command | 69.67 mm | Pass |
| Current limit 45 A, push request increased to 5.0 N·m | 91.93 mm | Fails: body contact and recovery |
| Assumed rotor inertia halved, same commands | 99.96 mm | Fails: body contact and recovery |
| Reduction changed to 20:1, same commands | 69.13 mm | Pass |
| Reduction changed to 16:1, same commands | 63.35 mm | Pass |

[Full experiment inputs and results](output/drive_diagnostic.json). Reproduce with `.venv-sim/bin/python design/concept05-study/drive_diagnostic.py`. Ratios and rotor inertias in this table are hypothetical dynamics variants, not additional CAD releases or measured motor properties. Every variant would need its own controller optimization before comparing achievable maximum jump heights. In particular, the mass result does not imply that lighter robots inherently jump lower.

The 24:1 reduction increases reflected motor inertia by 2.25× relative to 16:1. Near the end of the nominal push, each hip reaches approximately 20 rad/s. With the assumed rotor inertia, both rotors then store about 2.3 J, compared with approximately 4.0 J positive hip work during the 60 ms push (estimated from the 5 ms recorded samples). Braking and recoil timing therefore matter alongside peak torque. Higher current with an unchanged torque request barely helps; commanding more torque lifts the robot further but loses the accepted landing. The 35/45 A limits are simulation assumptions, not qualified motor, battery or driver ratings.

The next step is coordinated takeoff, braking and landing optimization for the drive candidates, followed by measurement on the single-leg rig. A larger motor or higher current alone is not demonstrated to meet the 250 mm requirement.

## Beni reference comparison

[Updated teardown analysis](../../research/beni-jump-from-references.md) explains the visible brushless hip and knee drives, belt stage, spring assistance and metal load path. Beni is not established to share this design’s motor characteristics or reduction. The analysis also records the sizing and selection gates for the 250 mm target.

## Reproduce

From the workspace root, using the existing environments:

```sh
# Regenerate the accepted record and its uncertainty/timestep checks.
.venv-sim/bin/python design/concept05-study/validate.py

# Export CAD/STEP/STL using that record's parameters.
.venv/bin/python design/concept05-study/cad.py

# Check 121 independent MuJoCo poses and 101 browser reference angles.
.venv-sim/bin/python design/concept05-study/verify.py
node design/concept05-study/verify.mjs

# Serve only the design directory on localhost.
python3 design/viewer/serve.py

# Optional native MuJoCo replay, including all eight seconds of recovery.
.venv-sim/bin/mjpython design/concept05-study/replay.py
```

Controller exploration is retained in `tune.py`, `recovery_search.py` and their output reports, including failures. `size_jump.py` reproduces the original energy/geometry sizing. The final browser and MuJoCo kinematic checks agree to numerical precision; they do not qualify solid-part interference or material strength.

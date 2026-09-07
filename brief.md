# Beni-sized three-motor prototype: design brief

Status: requirements revised on 6 September 2026 for jumping and a finished enclosure. [Concept 02](concept02/README.md) now provides enclosed appearance/packaging CAD with provisional drive volumes and an internal-mechanism illustration. See [the enclosed jumping revision](jump-upgrade.md). The existing MuJoCo scaffold still implements concept-01 slow height adjustment; hardware is not fabricated or qualified.

## Accepted direction

The user chose to proceed without independent powered left/right height adjustment for now. Retain two independent wheel drives, one common height actuator, and independent passive spring-and-damper suspension. The robot should remain approximately Beni-sized and support outdoor driving.

Subsequent user requirements: mostly 3D-printed structure, fewer separate parts, inexpensive commonly manufactured motors, every printed part fitting a Bambu A1 mini, durability under rough use, and provision for sim2real. The current CAD uses seven structural prints plus two small TPU stop sleeves; all fit within a conservative 170 × 170 × 180 mm printing envelope. Durability remains a test requirement, not a claim that the prototype is unbreakable.

Jumping is now required. Replace the slow screw-based height architecture with a shared rotary height/jump drive and separate elastic branches. Use 5–10 cm hops as a working development target pending the user's target; this is not a promised obstacle clearance. The exact motor, reduction, spring arrangement and landing travel remain to be designed. Prove balancing before physical jump trials, while designing for launch and landing loads from the outset.

The exterior must look like a finished product: rounded structural shells, covered arms and drive, concealed wiring, protected sensors, recessed service screws and replaceable lower impact protection. Aim for two principal body shells with integrated features; the final internal part count depends on the jump mechanism. Every new printed part must meet the same A1 mini constraint. See [the enclosure and mechanism decisions](jump-upgrade.md).

## Working dimensions

These are editable starting targets and concept-01 dimensions, not finalized requirements or measurements of Beni. The jumping revision may need more push and landing travel within the size constraint. The source investigation is [the research report](../research/beni-minimal-actuation.md).

| Parameter | Initial value | Status |
| --- | ---: | --- |
| Compact overall length | 215 mm reference; current layout about 158 mm | Current body is shorter, within the Beni envelope |
| Compact overall width | 180 mm | Beni-envelope reference |
| Compact overall height | 180 mm | Beni-envelope reference; posture needs definition |
| All-up design mass | 2.0 kg | Calculation assumption; aim to reduce toward Beni's published mass |
| Wheel outer diameter | 100 mm | Candidate |
| Tire width | 30 mm | Candidate |
| Wheel center spacing | 150 mm | Candidate |
| Common height adjustment | 35 mm | Candidate |
| Bump travel from the loaded position | 20 mm per side | Target at every allowed height |
| Droop travel from the loaded position | 10 mm per side | Target at every allowed height |
| Initial development speed | 1 m/s maximum | Proposed initial test envelope |

Three immediate constraints follow:

1. A 150 mm track with 30 mm-wide tires occupies 180 mm overall and leaves **120 mm between the tire inner faces**, before hub, bearing, suspension, frame, and running clearances. This is not 120 mm of free electronics space.
2. A near-vertical suspension path needs approximately **65 mm of total relative wheel/body travel** to retain 35 mm height adjustment plus 20 mm bump and 10 mm droop. Exact linkage travel and shock stroke depend on geometry.
3. At 100 mm tire diameter, 1 m/s corresponds to about **191 rpm at the wheel under load**. Motor choice must allow both this speed and balance torque margin.

## First CAD deliverable scope

The parametric assembly, five pose STEP files, individual fit-prototype STLs, geometry audit and simulation scaffold are now provided. Exact hardware retention and a functional print release remain subsequent work. The following describes the requested layout scope.

Create a parametric mechanism layout: side and front views, a simple three-dimensional package, and a pose sweep. Use dimensions and joint locations that can be changed from a small parameter list.

Model these items as simplified but dimensionally meaningful parts:

- Both tires and wheel/hub assemblies.
- Wheel drive envelopes, including connectors and shafts.
- A provisional battery and electronics volume, with mass estimates.
- Chassis datum and a provisional center of mass.
- Suspension pivots, arms or links, and separate left/right wheel carriers.
- Realistic shock compressed and extended lengths, once a candidate is identified.
- The shared upper shock-support mechanism and its actuator envelope.
- Travel stops, a passive parking contact, and essential running clearances.

The first layout must show where the body goes when the wheels move, how drive torque reacts into the chassis, and how either suspension can move while the shared adjuster is held. A visual animation by itself does not establish these force paths or balancing stability.

### Mechanisms to compare in the initial sketch

Begin with a trailing arm per wheel and a common adjustable pair of upper shock mounts. It has few joints, but its axle follows an arc and drive torque can deflect the suspension. Quantify both effects.

Compare with a compact four-bar only if axle excursion, torque coupling, shock leverage, or packaging makes the trailing arm unsuitable. Prefer the simplest mechanism that meets the measured constraints, rather than committing to a linkage because it looks like Beni.

Do not put a rigid shared shaft between the wheel carriers. The common linkage should move the suspension setting; the springs and dampers must retain separate wheel motion.

### Pose sweep

Check at least low, middle, and high ride-height settings. At each setting, check each suspension at droop, loaded position, and full bump. The full independent left/right combination gives 27 configurations, supplemented by a continuous sweep where collisions or linkage singularities could occur between samples.

Report:

- Wheel and body positions, including axle fore/aft movement.
- Available bump and droop travel.
- Shock eye-to-eye length, stroke use, and local motion ratio.
- Tire, motor, linkage, battery, and chassis interference.
- Lowest chassis clearance with the tire on the ground.
- Actuator force and speed estimates using the actual linkage geometry.
- Mechanical stops, bearing supports, and force paths.

## Original concept-01 development sequence

This sequence records the height-only prototype plan. The current [jumping revision sequence](jump-upgrade.md#cad-and-sim2real-sequence) supersedes its optional-jump stage and adds jump-drive selection before final CAD detailing.

1. **Component shortlist and packaging loop.** Identify two or three wheel-drive candidates, suitable tires/rims, shocks, and a battery. Import manufacturer geometry or verified dimensions and revise the layout. Record mass, shaft support, torque-speed behavior, encoder support, and driver requirements. No final mounts should depend on invented product dimensions.
2. **One suspension-corner prototype.** Make one wheel carrier, arm/link set, pivots, and adjustable shock mount. Use a representative load to measure sag, stiction, travel, and leverage. Apply wheel torque to examine suspension deflection. Use printed test parts and purchased hardware if that fabrication route is practical for the user.
3. **Two-wheel balance chassis.** Assemble both sides with height adjustment initially fixed. Use a restrained test fixture to establish balance control and check drive backlash and tire compliance. Account for the moving suspension geometry in the model.
4. **Shared height actuation.** Add motor 3 and the common mounting mechanism. Verify height changes under load, retained independent travel, adjuster holding behavior, and response to asymmetric bumps. Tune balance control across height.
5. **Structural and outdoor iteration.** Replace weak test features, protect electronics and transmissions from dirt, secure the battery, and add service access. Test representative grass, gravel, and small obstacles at progressively higher speeds.
6. **Optional jump study.** Revisit actuator power, extension geometry, spring energy, flight control, and landing loads after the drive/suspension baseline is demonstrated. Preserve the three-motor preference, but evaluate the actual mechanism cost of doing so.

## CAD authoring choice

The first geometry can be drafted before committing to a CAD package. Select a parametric solid-model workflow for the dimensioned parts and assembly.

- An existing CAD tool the user knows is the best place for a manually editable native model, if available.
- CadQuery is a candidate for code-authored parametric models in this workspace, with STEP geometry for interchange and STL or 3MF for printing. The Python source remains the editable parametric master; STEP exchange does not preserve the original feature history. [CadQuery documentation](https://cadquery.readthedocs.io/en/latest/index.html), [format limitations](https://github.com/CadQuery/cadquery/blob/master/doc/importexport.rst)
- FreeCAD is a candidate for a graphical parametric solid-model workflow. [Official feature overview](https://www.freecad.org/features.php)

The selected authoring workflow is CadQuery 2.6.1 in the project's `.venv`, with Blender for actual CAD-mesh renders. MuJoCo 3.3.7 is installed separately in `.venv-sim`. Python source and editable dimensions are the parametric master; STEP is the interchange format.

## Open choices

- Final jump height/obstacle target and jump repetition rate.
- Exact filament brand and actual bearing/hole fit from A1 mini coupons.
- Existing motors, batteries, shocks, or wheels to reuse.
- Final ground-clearance requirement and representative obstacle sizes.
- Whether 180 mm overall width is strict or a small increase is acceptable if commodity drive packaging needs it.

Proceed with the dimensional baseline while these remain open; do not treat them as approval to enlarge the robot or buy components.

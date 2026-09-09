# Sourced 16:1 hip drive layout — unfinished gearbox

Local viewer: http://localhost:8765/viewer/v2.html?study=drive&view=cutaway

The drive uses two 4:1 stages, with a 15T pinion driving a 60T gear and a
coaxial 20T pinion driving an 80T hip gear. Shaft centres are 30 and 40 mm. The
motor axis is X/Z = −60/34 mm; the intermediate axis is −37.3423/14.3371 mm.
Supplier STEP files retain their hubs, mounting holes and included set screws.
Tooth phase and backlash have not been set or verified; viewer rotation follows
ideal 16:1 kinematics only.

This reorders the same purchased gears. The earlier 80T intermediate layout
intersected the fixed hip spindle and rotating thigh neck; those failures are
retained in `../hip-output/rejected-20-80-15-60/`. The new arrangement leaves
3.7 mm nominal radial space between the 60T tip sweep and Ø23 thigh neck.
The output gear is larger. The new left enclosing case and bearing supports
are in the Output joint view.

| Part per hip | Supplier SKU | Listed mass | Displayed price |
|---|---|---:|---:|
| Aluminum 80T gear | [2302-0014-0080](https://www.gobilda.com/2302-series-aluminum-mod-0-8-hub-mount-gear-14mm-bore-80-tooth/) | 25 g | $13.79 |
| Aluminum 60T gear | [2302-0014-0060](https://www.gobilda.com/2302-series-aluminum-mod-0-8-hub-mount-gear-14mm-bore-60-tooth/) | 14 g | $11.39 |
| Steel 20T, 6 mm D-bore | [2303-1006-0020](https://www.servocity.com/2303-series-steel-mod-0-8-pinion-gear-6mm-d-bore-20-tooth/) | 15 g | $10.59 |
| Steel 15T, 6 mm D-bore | [2303-1006-0015](https://www.servocity.com/2303-series-steel-mod-0-8-pinion-gear-6mm-d-bore-15-tooth/) | 9.1 g | $9.99 |

The four gears total **63.1 g and $45.76 per hip**. Adding the previously sourced
$24.99 X2216 short motor gives **$70.75 before bearings, shafts, hubs, mounting,
encoders, drivers, taxes and shipping**. This is not a complete actuator quote.
Pages and CAD were archived on 2026-09-09 UTC in
`hardware-references/hip-gears/`; no purchase was made. No allowable torque or
fatigue rating has been established for these gears under the proposed duty.

## Packaging evidence

The previous battery/controller positions produce 11 overlapping drive/bay
pairs. A central battery and rear controller compartment pass all **114 nominal
electronics checks** in `layout-screen.json`. The camera reservation is
unchanged. The Pi reservation is 78 × 104 × 32 mm, centred at X/Y/Z −6/0/49.5 mm;
the battery remains 76 × 42 × 32 mm. The controller reservation changes from
70 × 42 × 24 to 32 × 92 × 24 mm, retaining volume but changing aspect ratio.
Actual controllers must be selected and arranged to fit it.

The drive **does intersect the original body shells**. The report records these
intersections; it does not declare an enclosure pass for that body. The separate
Output joint study now models the left side case and fixed-spindle supports.
Motor mounts, encoder access,
compound hub, output coupling, shaft retention, bearing seats, tool access and
wire bends are unfinished. A final print count is not available.

`motion-screen.json` sweeps gear rotation envelopes and support reservations
through 405 hip positions against the moving legs. The revised left leg, old
right leg and mirrored revised-right candidate all clear the reordered drive.
Large-gear envelopes retain their bores and recessed faces. The outer
intermediate bearing sits in the recess of the flipped 60T gear, keeping it
inside Y63.5 mm; the folding spring guide begins at Y65 mm.
Static shell/mount conflicts are outside that moving-leg test and remain open.
Finite mesh clearance is not a tolerance, deflection or strength result.

## Motor sizing

`motor-screen.json` assumes both legs have the revised spring and the sourced
gears. It includes catalog-mass-normalized CAD gear inertia, assumed rotor
inertia, two stage efficiencies totaling 80%, and guide-friction sensitivity
0…0.4. Integrated motor work closes the prescribed energy balance.

For a prescribed **250 mm ballistic COM rise**, peak current is about 23.73 A
at a 2.2 kg mass allowance, 28.59 A at 2.64 kg, and 33.01 A at 3 kg. The last
case exceeds the optimistic 32 A screening ceiling. Both 11.1 and 9.6 V cases
were checked. The peak occurs after spring assistance has ended, so the guide
friction sensitivity changes energy use without changing these peak currents.

This is one-dimensional sizing, not a free-body jump simulation. The supplier's
propeller-cooled current figure does not qualify a sealed motor. Body rotation,
contact dynamics, link/hub/shaft inertia, impacts, actual electronics, thermal
behavior and the final mass remain unresolved. The 250 mm wheel-clearance
requirement and stable landing are not demonstrated.

## Viewer and rebuild

The viewer mirrors the revised left leg to form a right candidate. Its old inner
spindle plates and rear attachment hardware are omitted because replacements
are unfinished. The transparent body is the existing reference shell. Amber
drive solids are allocations; the four gears on each side use supplier CAD.
Use Cutaway for the whole robot, Packaging for the electronics reservations,
or Focus on hip drive for the transmission. Individual leg sliders also turn
the corresponding gears at the ideal ratios. No V2 dynamics replay is claimed.

```sh
.venv/bin/python design/clanky-v2/hip_stock_gears.py
.venv/bin/python design/clanky-v2/hip_gear_layout.py
.venv/bin/python design/clanky-v2/hip_stock_drive_screen.py
env OPENBLAS_NUM_THREADS=1 uv run --no-project --python /usr/local/bin/python3.11 \
  --with trimesh --with python-fcl --with rtree python design/clanky-v2/check_hip_gear_motion.py
```

`layout.step` contains the body shell, allocations and drive layout without
legs. Main V2 assembly exports and the earlier R2 jump evidence are unchanged.

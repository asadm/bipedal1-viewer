# Round wheel-drive packaging study

Open `/viewer/wheelpods.html` on the existing port-8765 server. Height sliders,
independent legs and comparison with the old wheel boxes work in kinematic mode.
Select **Cutaway**, **Focus wheel**, then **Turn gears** to inspect the drive.
The tire and rim become transparent so the reduction is visible.

Each previous Waveshare wheel gearbox is replaced in this CAD variant by the
selected SunnySky V2806 650KV motor envelope and a proposed 5:1 metal spur pair.
The motor and reduction share one rounded pod integrated with the lower link.
An inboard motor-mount/service lid closes it. There is no separate box above the
wheel. The main pod is 38.5 mm thick versus 49 mm for the previous box, a 21%
reduction; the bearing boss extends farther into the rim cavity. Wheel diameter,
tire width and track remain unchanged at 100 mm, 30 mm and 150 mm respectively.

## Drive arrangement

- Motor body: manufacturer nominal Ø35 × 18 mm, 47 g. Modeled appearance is
  representative, not a vendor STEP file.
- Proposed metal adapter: motor rotor flange to a 4 mm pinion shaft. The motor
  has a short shaft; it is not modeled as an off-the-shelf long-shaft gearmotor.
- Proposed gears: 20T and 100T, module 0.5, 20° pressure angle, 5 mm face and
  30 mm centres. A supplier-compatible pair, backlash, retention and rating
  remain to be selected. The tooth profiles demonstrate layout and motion.
- An 8 mm axle runs through two 688 bearing envelopes, 8 × 16 × 5 mm, so the
  motor bearings do not directly support the wheel. Fits, loads and positive
  wheel/gear torque connections still need detailing.
- Three M3 closure positions use integral ears outside the gear/motor envelopes.
  Lid mounting holes use an allocated motor pattern; the exact 650KV revision
  must be checked before manufacturing the mount.

The number of printed pieces remains 18: 16 rigid and two TPU. Each replaces an
existing part; no separate cosmetic wheel cover was added. The lower pod STLs
are oriented diagonally to fit the conservative 170 mm envelope within an A1
mini's 180 mm build volume. These are envelopes, not sliced plate counts or a
manufacturing release.

`wheelpods.py` checks six motor/gear-to-housing combinations and 39 checks of
pod-to-body, pod-to-thigh and pod-to-tire interference at 13 hip angles. Both
pod hands have static checks; motion checks use the symmetric left side.
Fastener and cable assemblies, complete internal dynamics, deflection, gear
meshing over a revolution and continuous collision sweeps are not qualified.
The manifest records the measured results and print envelopes.

The generated revision passes all 45 sampled packaging checks. Minimum measured
pod-to-ground clearance is 20.81 mm, and the largest exported print axis is
166.00 mm. Static overlap checks allow nominal surface contact; they do not
establish manufacturing clearances or fit tolerances.

The wheel-pod model keeps the original passive knee guide. See
`internal-guide.md` for the reference observations and a compact internal-guide
feasibility calculation; that mechanism has not yet replaced the original CAD.

## Cost and validation

The motor pair costs $57.98 at the previously checked $28.99 each, adding $38 to
the old bare motor pair. The four-motor/two-spring subtotal is $112.52. This
excludes the additional FOC controllers, encoders, gears, bearings and adapters.
See `wheel-upgrade.md` for sources and the complete limitations.

There is no 20 km/h or jump claim for this assembly. Existing MuJoCo replays use
the previous wheel drive and simplified body. New mass/inertia, torque/current
behavior, low-speed control, thermal limits and drivetrain losses must be
measured or bounded, then incorporated into the simulator.

Build: `.venv/bin/python design/concept06/wheelpods.py`.
Outputs: `output/wheelpods/parts.json`, `manifest.json`, print STLs and
`beni_slim_wheelpods.step`.

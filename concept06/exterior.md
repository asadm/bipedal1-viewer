# Slim bending legs — concept 06 exterior

[Open the design](http://192.168.86.226:8765/viewer/streamlined.html), or [use localhost](http://127.0.0.1:8765/viewer/streamlined.html). It opens at 35 mm extension. Use **Compact**, **Extended**, independent height sliders, **Compare the wide thighs**, or **Cutaway**. **Jump replay** shows the original concept-06 drivetrain recording with the revised exterior attached.

The Beni reference photos show a tapered outer thigh shielding a spring assembly on its rear/inboard side: see `ref/beni-camera-robot-4.webp`, `ref/IMG_3966.jpeg`, `ref/IMG_3970.jpeg` and `ref/IMG_3973.jpeg`. The previous broad cover enveloped our passive guide link's entire sweep, making a large paddle. This revision separates that sweep from the spring pocket so the visible arm follows the hip-to-knee load path.

## Architecture retained

Keep rotating hip drives, bending knees, two independent height channels, spring assistance and two wheel drives. The user rejected the telescoping rack-leg alternative. This is still the four-motor concept-06 linkage; it does not reproduce Beni's independently powered knee mechanism. Link lengths, spring-seat distances, transmission ratio and ideal compression curve remain unchanged.

There are **18 printed pieces: 16 rigid and two TPU**, with no additional cosmetic panels, motors or linkages. The rejected rack study's 10–12-piece target does not apply. Reductions must preserve assembly access and demonstrate load paths and motion clearance.

## Slimmer spring packaging

- Each thigh is **one structural print**, combining a tapered outer arm, recessed spring pocket, hip neck, spring seat and knee support. There is no separate decorative arm laid over the mechanism.
- The complete thigh side envelope shrinks from **148.7 × 93.9 mm to 119.4 × 57.5 mm**. Its projected convex profile area is **46.5% smaller**. This is a profile measurement, not a drag claim.
- The two thighs and their inner lids use approximately **43.6% less nominal solid CAD volume** than the previous wide set. Sliced mass, strength and assembled inertia have not been established.
- The selected SWF12-50 springs remain at **Y = ±78.5 mm**, behind the outer thigh faces at ±89 mm. The recessed pocket shields them from the outside. Cutaway reveals the actual modeled spring; the renderer does not switch the spring off to fake enclosure.
- The passive guide links run at **Y = ±65 mm**, with their 6 mm thickness occupying 62–68 mm on each side. They move outside the spring pocket, inboard of its lid. They are visible structural links, finished in dark graphite, rather than hidden inside the old broad paddle.
- Each compact TPU lid sits at **|Y| = 70–72 mm** and has **one curved spring-post slit**, replacing three long wiping slits. The 2 mm rim carries a proposed 0.6 mm membrane with a 0.7 mm slit. Hip and knee bosses pass through clearance holes.
- The coupler/guide pin now ends at **|Y| = 69.5 mm**, clear of the lid. The guide moved 1 mm outward from the original bare concept-06 CAD, rather than the previous enclosure's 2.5 mm offset. Pin retention still needs detailing.
- A rounded spring-seat buttress replaces the lower link's projecting rectangular brace, which clashed with the reduced pocket. The seat center and spring force geometry are unchanged. The shorter brace and its metal load interfaces need structural qualification.
- An integral 10.5 mm-radius hip neck shields the shaft gap and clears the guide. The knee support remains inboard of the spring, connected to the outer arm by an upper web. Hip shafts end at ±89 mm and knee pins at ±72 mm.

The lower tapered body, flush visor, integrated shin faces, wheel-motor housings and 20:1 gearing are retained. The main body uses two prints. The existing lower drive deck retains its shifted motors, battery and electronics allocations.

[Purchasing and plate estimate](fabrication-count.md): approximately 40–45 major purchased components/assemblies plus fastening and wiring. The 18 prints fit **six plates in the rectangular-envelope layout**, down from seven for the wide version because both TPU lids now share a plate. Budget seven or eight jobs until actual orientations, supports, brims and filament choices are sliced. This is not a proven minimum.

The selected four motors and two springs retain the approximately $74.52 component subtotal; no procurement change is required for this packaging revision. That subtotal is not the cost of the entire robot.

## Geometric checks

`output/exterior/manifest.json` records valid CAD solids, single connected printed pieces, dimensions and static component-to-body-shell checks. All printed envelopes fit the conservative **170 mm axis limit** inside the A1 mini's 180 mm build volume; the largest remains 169.54 mm. STEP and individual STLs are exported under `output/exterior/`.

`output/exterior/motion-clearance.json` now includes **119 sampled checks**: at 13 hip angles, the conservative guide and mid-spring envelopes, actual lower-link CAD including its seat buttress, shortened coupler pin, and spring post are checked against the thigh and rigid lid frame as applicable. Both added shin faces are also checked against the vendor wheel-motor STEP. The mirrored right side uses the same construction. These checks pass. The separate 101-angle planar thigh/tire test gives a minimum **14.82 mm** margin to a 50.2 mm-radius tire envelope.

The narrower design initially clashed with the old rectangular seat brace and long coupler pin. The reshaped buttress, revised guide plane and shortened pin address those specific clashes. Testing only the spring centerline would have missed them.

The flexible membrane is excluded from rigid collision checks because it is intended to deflect around the moving post. Its undeformed CAD surface is shown in the viewer. End seats, retention hardware, all joint interfaces, tolerances and every possible assembly collision are not covered by these tests. No physical membrane, sealing or landing-load test has been performed.

## Simulation and build limits

The approximately **178 mm jump** belongs to the original drivetrain simulation at an assumed 2.10 kg. The viewer attaches these shapes to its recorded body motion. The revised exterior, shifted components, mass/inertia distribution, membrane forces and body contacts have **not** been re-simulated. The original 250 mm target remains unmet.

The shape is more compact, but aerodynamic drag is unmeasured. This is not a dustproof, waterproof or unbreakable product. The structural arms, seat bosses, knee webs, shaft connections, bearings and fasteners still require load and fatigue checks, dimensional tolerances and an assembly design. STL envelope fit is not proof of print orientation or strength. A single real leg with its selected spring and pins is the next useful fit-and-load prototype.

## Reproduction

```sh
.venv/bin/python design/concept06/exterior.py
.venv/bin/python design/concept06/verify_exterior.py
python3 design/concept06/pack_exterior.py
python3 design/viewer/serve.py --host 0.0.0.0 --port 8765
```

- `exterior.py`: body, tapered structural thighs, recessed spring pockets, compact lids and lower-link seat relief.
- `verify_exterior.py`: scoped clearance checks against exported CAD.
- `pack_exterior.py`: six-plate envelope plan with bounds and spacing checks.
- `output/exterior/`: active meshes, STEP, STLs and check reports.
- `output/exterior-wide/`: previous broad-thigh meshes/metadata used by the comparison toggle.

The original CAD, dynamics and viewer remain available at `output/cad/`, `output/jump/` and `viewer/brushless.html`. The old `viewer/simplify.html` address redirects to this bending-leg viewer; the rack study remains rejected.

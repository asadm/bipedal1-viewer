# Output joint inspection study

Local viewer: http://localhost:8765/viewer/v2.html?study=output

The latest left 80T output gear bolts to a flange integrated into the thigh print.
The model includes four M4 screw/nut envelopes and four 4 × 6 × 4 mm aluminum
spacers, an inner F688 bearing moved 18 mm inward, a longer fixed spindle, a
relocated keyed mounting plate, and the left gear case with an opening for the
thigh neck. Both intermediate bearing supports are integral to the body prints;
the internal support stays with the lower tray above the main shell seam.
The right output joint retains the preceding drive reservations.

`hip_output.py` builds these components from the aligned spring study and the
supplier's unmodified 80T gear CAD. Each newly exported part is asserted to be
one valid CAD solid. `manifest.json` binds the inputs and mesh export by SHA-256.
`parts-local.step` contains component-local coordinates, not an assembled pose.
The viewer applies the assembly kinematics to those coordinates.

The current joint and left case pass a 405-pose mesh sweep followed by 987 exact
material checks. `contact-classification.json` records the nominal interfaces;
no positive material overlap is accepted as a mating exemption. Gear-tooth
engagement is explicitly excluded: the pinion's full tip envelope overlaps the
output teeth by design, and actual meshing phase/backlash is unverified.
The checker reports contacts involving changed output/body parts; it is not a
whole-robot or bilateral drive qualification.

The previous 20→80 / 15→60 gear sequence intersected the hip spindle, neck and
spacer. Screw heads also clipped the local cup during folding. The rejected
reports are preserved under `rejected-20-80-15-60/`; their source CAD is retained
in commits `735e23c` and `32841a0`. The current 15→60 / 20→80 arrangement uses
the same purchases, a larger output cup, and clearance for the full screw sweep.

Assembly access, fastener loads and dynamics remain unverified. Motor and
compound torque connections, bilateral adoption, case closure, bearing/shaft
retention and manufacturing tolerances remain open. The M4 screws/nuts and
custom spindle/plate are dimensional models; their grades, locking, tolerances
and sourcing are unfinished. The outer intermediate bearing pocket opens inward;
its axial retention and shoulder/race geometry need detailed qualification.

The three changed prints have unrotated CAD bounds below 180 mm on each axis.
That is a bounding-box observation, not a slicing or strength result.

The viewer provides a joint close-up, complete cutaway, body envelope,
electronics packaging, four poses and synchronized/independent leg sliders.
All movement is prescribed kinematics. V2 jump and other dynamic skills remain
unverified; the separate R2 replay link retains its original geometry and evidence.

Rebuild the current gear layout, then `hip_output.py`. Run `check_hip_output.py`
with trimesh/FCL, then `check_hip_output_exact.py` and `classify_hip_output.py`
in the CadQuery environment. All reports bind their inputs by SHA-256.

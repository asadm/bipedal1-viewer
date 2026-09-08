# Current Clanky display CAD

The homepage uses these detailed meshes for Enclosed and Cutaway views. Physics
uses the compiled collision hulls in `../programmed-jump/geometry.json`.
Both follow the same recorded body transforms; there is one physical design.

Regenerate from the repository root with the CadQuery environment:

```sh
.venv/bin/python design/concept06/export_viewer_cad.py
node --test tests/test_viewer_cad.mjs tests/test_skill_recordings.mjs
```

The exporter reconstructs the frozen assembly used for the current plant's mass
and contact export. It verifies source checksums and compares all 117 solid
volumes, centers of mass and body assignments against
`docs/results/wide-recovery-cad.json`. This export matches those values exactly.
Meshes are in millimeters in each MuJoCo body's local coordinate frame.
The manifest binds the mesh file to the model and plant fingerprints used by
all fourteen homepage recordings.

Display poses interpolate between recorded body transforms for smooth playback;
telemetry and validation use the unchanged original samples. The camera follows
horizontal travel and keeps its height fixed so the jump is visible in the frame.

Springs are drawn procedurally at the simulated pin coordinates. The coil has a
50 mm free length, with 14 mm allocated to end fittings, and becomes unloaded
when the pins separate beyond 64 mm. Coils and tire tread are illustrative;
end fittings, fasteners, sealing and strength remain unqualified. Rendering
material names are palette categories, not a manufacturing specification.

Manual travel holds the chassis level and uses the CAD's bounded stance angle
range. Its height range therefore differs from the archived balance-pitched
stance heights. These prescribed poses are not dynamics or learned behavior.

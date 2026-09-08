# Clanky motion viewer

Open `/` or `/viewer/` when running `python3 design/viewer/serve.py --host 0.0.0.0`.
Both route to `skills.html`, as does the published site's main page. The viewer
starts and loops the **programmed jump** automatically.

One dropdown contains 14 recordings for the same 2.45 kg, four-motor recovery
revision (`wide_current`): learned balance, driving/turning, height control and
push recovery; programmed jump/landing and nine programmed get-up starts.
Recordings are selected by model hash, so original-design policies cannot appear
as a second candidate. Their archived files remain available for research.

Drag to orbit, scroll to zoom, or select 3D, Side, Front and Fit. Playback controls
include pause, restart, speed, timeline, looping, peak jump and stable finish.
Results and evidence links are collapsed by default. URL parameters `demo` and
`policy` still select matching recordings; absent, unknown and old-model IDs fall
back to the programmed jump.

The same compiled MuJoCo exterior hulls render every motion. This is the
simulation geometry; it does not show internal gears or springs. No new physics
runs in the browser. The learned badge requires a passing report with matching
policy/model identity; programmed assets retain their checksums and diagnostic
classification. Selected get-ups do not qualify recovery from arbitrary falls.

The earlier CAD studies remain in `validation.html`, `internal.html`,
`streamlined.html`, `brushless.html` and the other historical pages. Their pose
sliders and cutaways describe those archived designs. They are not alternative
models in the main motion viewer.

Three.js 0.180.0 and OrbitControls are vendored under `vendor/` with their MIT
license. Runtime assets load from the same server. Verify the motion inventory
and evidence gates with `node --test tests/test_skill_recordings.mjs` and package
Pages with `python3 scripts/build_pages.py` after staging new assets.

# Clanky motion viewer

Open `/` or `/viewer/` when running `python3 design/viewer/serve.py --host 0.0.0.0`.
Both route to `skills.html`, as does the published site's main page. The viewer
starts and loops the **programmed jump** automatically.

The pages also support plain HTTP LAN and Tailscale IP URLs. `sha256.mjs` uses
native Web Crypto on secure origins and a SHA-256 fallback when `crypto.subtle`
is unavailable, including iOS over HTTP. Asset integrity checks stay enabled.
`node --test tests/test_viewer_sha256.mjs` checks padding boundaries, typed-array
offsets and the real CAD asset against Node's independent implementation.

For the latest mechanical design, open `http://localhost:8765/viewer/v2.html`.
The motion and wheel pages link to it directly. V2 now opens the whole robot in
Exterior view with the latest left output joint and body-case overlay, playing
its first **programmed V2 jump experiment**. The motion dropdown also offers
programmed balance and Manual. Cutaway, Packaging and Focus on output joint
expose the internals; Physics shows the compiled native collision shapes.
Manual retains Fold/Crouch/Ride/Extend and both/left/right sliders. View and motion
selection are retained in the URL, for example `v2.html?view=cutaway&motion=manual`.
The earlier body, spring and gear layouts remain under explicit `study=body`,
`study=spring` and `study=drive` links; `study=output` still opens the latest overlay.
The left hip is more detailed than the right. V2 replay poses come from recorded
MuJoCo generalized coordinates through native forward kinematics, without a
viewer ground lift. CAD and collision shapes follow the same transforms. The
nominal jump now clears 264.31/264.25 mm at the two physics timesteps, with a
settled landing over the final two seconds of each eight-second trial. COM rise
is about 195 mm; the leg tuck supplies the additional wheel clearance. Four of
ten sensitivity cases pass; ±20% mass changes and a 9.6 V supply fail landing
and/or height checks. This remains an experimental controller on an unqualified
plant. No learned or arbitrary-fall recovery result is implied. The R2 link
retains its original robot and evidence. The first 81 mm V2 replay is archived
at commit `6d3f645`.

Generate these recordings with `native_viewer_trials.py` and export them with
`export_native_replay.py`, using `.venv-sim/bin/python` under `design/clanky-v2/`.
`native_jump_validation.py deeper-tuck-3` runs the fixed ten-case sensitivity
grid; `native_viewer_trials.py --from-validation` reuses its matching nominal
recordings without retesting them. `native/selected-jump.json` selects the profile.
The viewer checks the recording against current CAD and model hashes. A missing
or stale replay leaves manual CAD inspection available.

The newest actuator study is visible at
`http://localhost:8765/viewer/v2-actuator.html`, linked from V2 and the motion page.
It compares the current stock-gear layout with all 31 solids from the archived
RS05 supplier STEP, at equal millimetre scale. Both / Current / RS05, orbit,
Output face and Side controls inspect the assemblies. The spindle-conflict toggle
highlights the three source solids intersected by the existing 8 mm fixed shaft.
The custom case and detailed output joint are omitted to expose the gear train.
This does not replace the robot's drive or claim an assembled integrated option.
Export its hash-bound supplier mesh with
`.venv/bin/python design/clanky-v2/export_actuator_viewer.py`.

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

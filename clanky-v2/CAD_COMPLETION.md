# CAD completion and next skills

Requested 2026-09-09: finish the CAD and viewer, then investigate flips,
one-wheel balance and steeper/rougher slopes. Keep learned recovery deferred.
Keep 120 mm wheels and four motors unless a measured limitation justifies a change.

The last simulated plant and its evidence remain immutable. New detail work is
in `detail_model.py` and `detail/`. It must receive new mass, contact and motion
checks before inheriting any of the previous plant's results.

Completion gates, in order:

1. Bilateral output supports; integral case closure; complete motor, compound
   and output torque paths; assembly access and axial retention.
2. Camera/Pi/battery/controller retention, cooling access and protected fixed
   harness routes, followed by constant-length flex-loop/pinch checks.
3. Joint and spring retention, print fits, complete purchasing/print plan and
   load calculations. Physical print/material/thermal qualification is separate.
   The user's tolerance check exposed nominal 0.02 mm diametral bearing-seat
   gaps that are not calibrated printer fits. `print-fit/` now has separate
   rigid/TPU samples, a process-record template and an illustrative stack audit.
   Measure samples in the final material/orientation, apply per-interface
   compensation, and recheck walls, alignment and complete assemblies before
   calling the robot print-ready. No compensation is currently applied.
4. Exact-solid and sampled-motion checks for the complete new assembly, updated
   native mass/inertia/contact plant, then repeat jump, recovery and driving.
5. Viewer shows the revised CAD and source-matched recordings, with clear labels
   for manual poses, programmed control and learned control.
6. Bounded native feasibility experiments: takeoff angular momentum/landing for
   flips; enter/hold/exit and disturbances on either wheel; uphill/downhill and
   cross-slope traction, tracking and stopping on more difficult terrain.

Do not call a static one-wheel pose a balancing skill or an animated rotation a
flip result. Do not transfer the old jump/recovery pass labels to edited CAD.
Preserve failed studies, change the cause, and cap each subsequent search.

Latest checkpoint:

- Input pinion orientation, tooth phase and two-stage spacing corrected. All
  109 changed meshes pass topology; 222/232 exact contact checks clear across
  370 sampled poses. Six cooler-allocation and four supplier-thread overlaps
  remain unresolved. A separate 146-case exact gear cycle passes at nominal
  spacing; measured backlash/runout and print fits remain open.
- `detail-native/` now supplies the new 2.608 kg mass and explicit rotating
  drivetrain. Implementation checks pass; nominal standing balance and jump
  both pass at 250/125 µs. Jump clearance is 264.18/265.42 mm with settled landing.
  Recovery and learned driving/terrain have not transferred to this revision.
- Default viewer jump/balance and Physics use this new CAD. Older motions retain
  their preceding model. Print calibration samples remain available locally.
- A bounded one-wheel study found static candidates but all six local-feedback
  holds failed with saturation and tipping/body contact. Stop that controller
  setup; no learned/entry/exit result follows. Before retrying, improve loaded
  equilibrium and finite-amplitude prediction. Learned fall recovery stays deferred.
- Aerial flip authority is now demonstrated in the nominal plant: 361.40/361.93°
  with wheels-first contact at 250/125 µs. The short screen stops at contact and
  does not prove landing. A second full-turn tuck contacts the body. All twelve
  complete landing-controller attempts fail: early extension/braking reduces
  rotation and causes body strikes. Stop that pattern. A later trajectory/policy
  must optimize the complete launch and settled landing. Harder slopes and
  transfer of learned terrain control to the detailed plant remain next.

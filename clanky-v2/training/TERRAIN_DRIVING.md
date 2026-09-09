# Terrain driving on the 120 mm V2

One capped supervised adaptation improves the learned policy from **2/13 to
5/13 courses passing at both physics timesteps**. The new actor is an
experimental terrain option; it does not replace the earlier flat-driving
actor. Wheels, four motors, springs, mass and all drive limits are unchanged.

## Results

Each course is tested at 0.25 and 0.125 ms, with the same nominal starting
pose and a smooth 0.4 m/s drive/stop command. The requested distance is 2.8 m
within 14 s. The actor runs at 100 Hz; native motor control stays at 500 Hz.

| Course | Original driving actor | Programmed teacher | Terrain-trained actor |
|---|---|---|---|
| Flat | Pass | Pass | Pass |
| 8 mm bumps | Pass | Pass | Pass |
| 10 mm rounded stones | Short of distance | Short of distance | Short of distance |
| 20 mm rounded stones | Body-contact abort while tipping | Distance/exposure fail | Cap-contact abort while upright |
| 30 mm rounded stones | Body-contact abort while tipping | Stalls | Stalls |
| ±5° longitudinal grades | Distance fail | Stalls | Stalls |
| ±10° longitudinal grades | Falls | Stalls | Stalls |
| +5° / −5° cross slopes | Distance/stop fail | Pass | Pass |
| +10° cross slope | Stalls | Pass | Pass |
| −10° cross slope | Stalls | Pass | Overshoots distance |

These classifications agree at both timesteps. Overall results are 4/26,
12/26 and 10/26 rollouts passing, respectively. The original runner records generic “fall” terminations in
8/26 cases and the terrain actor in 2/26. That label includes any body touch;
it does not by itself prove a physical fall. The terrain actor’s two 20 mm
stone aborts occur while upright. The [contact follow-up](TERRAIN_CONTACT.md)
continues those trajectories: the robot stays upright but still fails the route.
Avoiding a fall does not count as traversing the course. Some longitudinal slopes that the old actor crossed
with a distance error now stall: this is not an improvement in every task.

The terrain actor touches all ten 10 mm stones but stops around 2.615 m,
missing the fixed ±0.15 m distance tolerance. Its −10° cross-slope run reaches
about 2.972 m, also outside that tolerance. These gates were not relaxed.
On 20 mm stones it reaches about 1.39–1.40 m before the encoder-cap
contact triggers the abort. Full CAD/heightfield triangle checks now confirm
a real cap contact at these states. It is not proof of tipping or hardware
impossibility, and does not justify larger wheels. The continued trajectories
show stopping/drifting problems and significant simulated contact force.

The flat-driving regression remains **20/24 overall, 10/12 paired starts**.
All 24 runs meet the speed and yaw tracking windows and avoid falls/native
failures. However, both runs of random start 88311 now stop with only about
1.966 s continuously settled versus the required 2 s; the old actor passed
that stopping gate. The existing early 8° roll failures at starts 88309 and
88311 remain. Keep the original flat-driving actor for its existing mode.

## Training and evidence

`terrain-demonstrations-01` contains 32 programmed-reference episodes: flat,
8 mm bumps, 10/20 mm stones, ±5° longitudinal and ±5° cross slopes. Terrain
seeds are 740–743, starting rotations vary by up to 0.045 rad per rotation-vector
component, initial velocities vary, and cruise speeds are 0.35/0.4/0.45 m/s.
The first 24 episodes train; the last eight validate. Terrain samples after
a body strike are excluded from fitting; full failed recordings are retained.
The teacher passes 18/32 complete route checks and falls once. Its incomplete
routes also provide balance/control labels, not successful traversal examples.

The fit mixes these examples with the previous 32 flat command demonstrations,
with equal terrain/flat sampling weight. It uses **73,696 training samples**
and **24,800 whole-episode validation samples**, 2,500 Adam updates, batch 512,
and learning rate 0.0002. Update 2300 has the lowest combined validation loss
and is the single saved actor. There is no RL update, DAgger repeat or automatic
extension. The initialization preserves the original actor's function under
new normalization (checked to 1.79e-7); NumPy/Torch export differs by at most
2.39e-7 in the recorded check.

Actor inputs remain gyro, projected gravity, hip positions/velocities, wheel
velocities and requested forward speed/yaw rate. Other input slots have zero
first-layer weights. The teacher uses privileged motion information to make
labels; it never intervenes in learned rollouts. No terrain map, navigation
correction, pose reset or external force is applied during a rollout.

Actor: `evidence/terrain-clone-01/actor.npz`

SHA-256: `a129c86958311c97d491ad2420183e5afe2de5905dd7505c9c97a0dcacf27159`

The terrain screen uses seed 731, known from earlier development but not used
in this fit. It is one course realization with one nominal start per course,
not fresh terrain/start randomization or off-road qualification. The ±10° cross
slopes were not in the terrain training demonstrations.

Evidence directories retain full compressed recordings, fixed plans, policy and
source hashes, surfaces and remote/local recording audits:

- `evidence/terrain-driving-screen-01`: original actor, 26 cases.
- `evidence/terrain-teacher-screen-01`: programmed reference, 26 cases.
- `evidence/terrain-demonstrations-01`: 32 terrain demonstrations.
- `evidence/terrain-clone-01/evaluation`: adapted actor, 26 cases.
- `evidence/terrain-clone-01/flat-regression`: 24 existing driving cases.
- `evidence/terrain-transfer-01.json`: verified original remote-file inventory.

The baseline runner's fixed `scope` string says “without terrain training.”
That phrase describes only `terrain-driving-screen-01`; it is stale in the
adapted actor's `evaluation/summary.json`. The policy hash and fit manifest
above identify its actual training. The original hashed report is preserved.
Use `terrain_experiment.py` with an explicit scoped plan for future studies.

## Geometry, checks and viewer

The original plane is replaced by a heightfield, retaining its contact
properties and the robot's exact compiled meshes, mass/inertia, actuator and
linkage parameters. Thirteen frozen surfaces pass 1,664 independent vertical
ray comparisons, plus a static elevated tire-contact probe. Additional training
surfaces also pass ray comparisons before collection. There is no hidden
support plane. Surface files freeze float32 elevations across platforms.

Recording audits reconstruct every command, used sensor input, actor/teacher
action, initial state and saved body kinematics; check linkage/gear constraints;
and recompute route, exposure and stopping gates. Continuous motor/contact and
standing guards rely on the hashed runner. The ARM MuJoCo ray routine can return
the heightfield base at an exact triangle seam on the flat starting patch.
The local auditor tests that exact point by triangular interpolation and rays
1 nm off the seam, preserving all robot poses, surfaces and historical source.
These are recording audits, not independent dynamics integrations.

The local viewer's **Learned terrain · +10° cross slope** shows the complete
14 s recorded route, exact terrain and unchanged CAD transforms. Displacement
is 2.850/2.851 m, lateral deviation below 104 mm, and final continuous balance
over 4.02 s at both timesteps. The replay uses the 0.25 ms recording. Exterior,
Cutaway and Physics remain available; the programmed jump stays the default.
The sampled exterior interference check covers the concave printed shells and
actual CAD tires along this replay. It does not validate internal mechanisms,
continuous clearance, manufacturing tolerances or printed strength.

http://100.97.184.4:8765/viewer/v2.html?motion=learned-terrain&v=terrain-driving-1

## Next decision

This fit is closed; more unchanged cloning is not the next step. The reference
itself misses the stone and longitudinal-slope route targets. Investigate
trajectory/heading tracking with an explicitly declared odometry layer, and
use the completed 20 mm contact audit when considering mechanical clearance.
Fresh starting poses, friction/mass/sensor variation and flat-stop regression
need evaluation before promoting the terrain actor. Tires remain rigid;
one-piece TPU compliance, loose stones, soil and physical tests remain open.

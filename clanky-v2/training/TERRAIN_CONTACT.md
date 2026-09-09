# Stone contacts and continuation diagnosis

The terrain-trained actor's 20 mm stone failures were **contact-triggered
aborts while upright**, not demonstrated falls. `NativeEnv` labels either a
body touch or body tilt past 60° as `fall`. The original strict route results
remain failures; the terminology in the terrain report is corrected.

## Full CAD contact check

`audit_learned_terrain_contact.py` compares complete CAD triangle surfaces with
all overlapping triangles of the exact collision heightfield at each saved
body-contact state and the preceding 100 ms. It verifies CAD-source identity
and compiled proxy placement to better than 10 nm. These queries do not use
nearest vertices alone, which can miss a triangle-face contact.

The 20 mm encoder-cap contacts are real in both the original and adapted
actor's recordings. In the adapted actor they occur at 6.67/6.72 s with body
upright cosine 0.993/0.992 and COM lean only 0.27/0.72°. The cap/terrain triangle
surfaces intersect. They should not be removed as false collisions.

The original actor's 30 mm shin-case contact is different: its actual CAD
surface remains 10.09/10.67 mm from the terrain at the first saved contact.
The single convex hull spans an empty area of the case. These poses are already
strongly tipped (roughly 44° COM lean). This false contact is a simulation-shape
issue, not evidence that the actual case is obstructed at that pose. It does
not invalidate the different, previously confirmed real shin contact in the
older programmed 30 mm trajectory.

Evidence: `checks/learned-terrain-contact/summary.json`. These are saved-pose
geometry checks, not continuous clearance, material deformation or strength
qualification.

## Bounded continuation

`terrain_contact_continuation.py` runs eight cases: original/adapted actors,
20/30 mm stones, and both physics timesteps. Only the generic contact abort
is allowed through. Native electrical/mechanism limits, course boundaries and
body tilt past 60° still stop the run. There is no new policy, pose correction,
external force or recovery-controller intervention.

Every original recording prefix matches **exactly** in time, qpos, qvel,
observation, action and command. Thus no preceding control or state change
explains the differences after the old stopping point. All eight cases retain
valid native mechanism/electrical guards, and **none passes the route**, even
when a body touch is allowed in a separate diagnostic score.

| Actor / stones | 0.25 ms result | 0.125 ms result |
|---|---|---|
| Original / 20 mm | Tips past 60°, 0.761 m | Tips past 60°, 0.761 m |
| Original / 30 mm | Tips past 60°, 0.606 m | Tips past 60°, 0.606 m |
| Adapted / 20 mm | Stays upright, stops around 1.325 m | Stays upright, drifts out of bounds at 2.224 m |
| Adapted / 30 mm | Stalls around 0.594 m | Stalls around 0.703 m |

The adapted 20 mm runs retain cap contacts for 0.5005/0.1343 s, with peak
individual contact-normal forces of 56.6/74.3 N. These rigid-contact peaks are
not converged structural loads or a safe-contact qualification. Continuing
past the touch does not establish a usable rough-ground skill. Both cases
contact only two stones in each lane, below the existing exposure requirement.

Evidence: `evidence/terrain-contact-continuation-01/`, including fixed plan,
full NPZ trajectories, source identities, remote/local audits and verified
transfer inventory. The audits reconstruct sensor/action/state records and
route/tip/settling gates. Continuous force/contact/exposure metrics rely on the
hashed runner; no second independent integration is claimed.

This diagnostic is closed. Do not fix these trials by disabling the cap's
contacts, relaxing the route gate or repeating the same fit. Higher rough-ground
posture and explicit path/heading control are possible future changes. The
remaining recovery return-to-back failures take priority next. No tire,
manufactured part, motor, policy or viewer mode changed in this study.

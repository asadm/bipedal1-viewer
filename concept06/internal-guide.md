# Can the passive knee guide go inside the thigh?

**Superseded preliminary study.** The whole-guide clearance check later found
that this first compact geometry intersects the hip shaft. See
`internal-knee.md` and `/viewer/knee.html` for the revised angled-lever proposal
and the additional clearance/load screening.

The reference `ref/IMG_3974.jpeg` shows an internal lever. The adjoining teardown
images `IMG_3970.jpeg` and `IMG_3973.jpeg` describe a second brushless motor
powering the knee. They support an internal knee transmission, but do not
establish that Beni uses our passive four-bar mechanism. The exact transmission
and actuator count need a complete diagram to confirm.

Our guide is a structural constraint: it links a fixed body pivot to the short
lever behind the knee. Deleting it would leave the knee uncontrolled. Moving
the existing 83.5 mm guide sideways into the thigh does not conceal its side
profile: its fixed body pivot sits about 50.4 mm from the hip centre.

## A compact four-motor alternative

`internal-guide-study.py` evaluates a smaller four-bar using the same 64.48 mm
thigh crank and 119.12 mm lower leg. The fixed pivot moves to (6.81, 13.50) mm
relative to the hip; the guide becomes 70.19 mm and the knee lever 8.47 mm.
No extra motor or moving link is needed in this planar arrangement.

An 8 mm wide straight guide fits within the existing convex thigh side profile
throughout all 101 sampled poses. Its endpoint discs have 3.88 mm clearance
inside the hip outline and 2.53 mm inside the knee outline. Convexity establishes
the intervening bar's planar fit. This does not establish clearance to the
spring, hip shaft, bearings or enclosure in the lateral direction.

The tradeoffs are substantial:

- Geometric vertical travel changes from 99.81 to 115.16 mm. Wheel position
  differs by up to 19.56 mm at the same hip angle; existing CAD poses and control
  gains cannot be reused without updating the model.
- For the same applied knee torque, calculated guide tension/compression rises
  by as much as 4.34 times. The smallest effective knee moment arm is 3.79 mm.
  Thin printed links and closely spaced knee pins cannot be assumed adequate.
- With existing spring-seat offsets, the minimum seat distance is 27.49 mm:
  22.51 mm compression of the 50 mm spring. That is below the prior 25 mm catalog
  maximum but exceeds our conservative 20 mm design limit. Stops, geometry or
  spring attachment must change before using the entire travel range.

This is a viable direction for a detailed mechanism study, not a replacement
assembly. The viewer still has the original guide and anchors. Before replacing
them, size the knee bell crank and bearings for landing loads, arrange separate
lateral planes for spring and guide, add suitable stops, and rerun CAD collision
checks and MuJoCo with the changed geometry.

Run: `.venv-sim/bin/python design/concept06/internal-guide-study.py`.
Results: `output/internal-guide/feasibility.json`.

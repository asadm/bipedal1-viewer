> Historical sizing proposal, before the concept-05 CAD and dynamics runs. See README.md for current results.

# Reaching 25 cm — sizing study

Target: **250 mm minimum clearance under both wheels**, with controlled takeoff, landing and recovery. Beni advertises 10 inches but its launch announcement does not define the measurement convention. [Mondo announcement](https://www.linkedin.com/posts/mondo-robotics_beni-is-live-on-kickstarter-httpslnkdin-activity-7480633949405421569-316k)

No 25 cm jump is demonstrated here. This is an energy and kinematic study. The latest accepted nominal concept-04 simulation achieves **71.9 mm wheel clearance / 41.9 mm ballistic COM rise**. Four of twelve parameter/timestep cases fail its travel-limit checks. [Recorded higher jump](http://127.0.0.1:8765/viewer/fourbar.html?jump=higher), [report](../concept04/output/higher/report.json), [uncertainty results](../concept04/output/higher/sensitivity.json).

## Preferred direction

Retain four independently controlled motors and investigate a longer-stroke, spring-assisted leg before adding a latch. Target 1.75–2.0 kg, approximately 100 mm wheel travel, a wider powered hip sweep and a transmission designed for both spring loading and fast extension. The RS-550 remains a candidate, not a confirmed motor for the 25 cm requirement. Stronger springs, reduction ratio, motor inertia, current, battery voltage and thermal duty must be evaluated together.

The existing RS-550/16:1 drive is modeled at approximately 2.61 N·m per hip with 35 A motor current and 80% transmission efficiency. Keeping that optimistic torque throughout both hips' present 0.5 rad stroke supplies at most about 2.61 J of joint work. A 1.15 rad sweep could supply about 5.99 J at that same torque. These are work bounds, not delivered jump energy: torque-speed limits, rotational kinetic energy, braking and losses reduce the result. [Motor specification](https://www.electan.com/datasheets/mov555.pdf)

The SWF10-50 pair stores at most 1.56 J at the chosen 20 mm design compression. Springs alone cannot supply the required energy. Increasing stiffness also increases the torque required to crouch; the existing drive cannot simply be fitted with much stiffer springs. [Spring catalog](https://uk.misumi-ec.com/pdf/fa/2014/P2_0365-0366_F37_EN.pdf)

## Energy target

For a 2.0 kg robot, a 20 cm ballistic COM rise requires 1.98 m/s vertical takeoff velocity and 3.92 J translational takeoff energy. Including 100 mm of COM rise during the ground push requires at least 5.89 J, before mechanical losses and residual rotational energy. An illustrative 65% conversion scenario gives 9.06 J input from joint work and spring release. At 1.75 kg this scenario gives 7.92 J; at 2.4 kg it gives 10.87 J.

A 25 cm ballistic COM rise is a more demanding target than 25 cm wheel clearance with tucked legs: at 2 kg it requires 2.21 m/s takeoff velocity, 4.91 J airborne translation energy and 10.56 J mechanical input in the same 100 mm / 65% scenario. The approximate **8–11 J** sizing target for a lighter design is a scenario, not a verified efficiency or guarantee. The simultaneous COM and wheel trajectories must establish how much clearance leg tucking actually contributes.

## Preliminary linkage

The numerical geometry study finds:

| Parameter | Candidate |
| --- | ---: |
| Crank | 64.482 mm |
| Passive guide | 83.502 mm |
| Lower coupler segment | 28.224 mm |
| Knee-to-wheel member | 119.119 mm |
| Body guide pin relative to hip, x/z | 22.693 / 45.000 mm |
| Hip sweep | 0.35–1.50 rad, approximately 66° |
| Wheel travel | 99.81 mm |
| Fore/aft wheel excursion | 6.04 mm |
| Wheel drop below hip, low/high | 74.92 / 174.73 mm |

The longest lower-member outline would be approximately 167.3 mm with the earlier 10 mm end radii, within the conservative A1-mini envelope. It still needs mounts, bearings and a solid-part clearance sweep. Using the earlier body and wheel heights gives roughly 180 mm compact / 280 mm extended overall height; the full package has not been modeled. The greater fore/aft motion couples leg extension to pitch and must be handled by the controller.

With provisional spring seats 43 mm back along the upper link and 25 mm along the lower link, maximum compression is approximately 18.53 mm. A quasi-static calculation for 2 kg estimates maximum crouching torque per hip as:

| Spring rate per side | Maximum spring pair energy | Estimated crouch torque per hip |
| --- | ---: | ---: |
| 3.9 N/mm | 1.34 J | 1.99 N·m |
| 5.5 N/mm | 1.89 J | 3.37 N·m |
| 7.5 N/mm | 2.57 J | 5.09 N·m |
| 10 N/mm | 3.43 J | 7.25 N·m |

Only the first row lies below the present approximately 2.61 N·m motor model without changing leverage or reduction. This calculation approximates support mass as 1.8 kg and ignores friction/acceleration. A larger reduction supplies more output torque but increases reflected motor inertia quadratically, so it cannot be selected from static torque alone. A shaped spring lever/cam or different spring attachment may improve this tradeoff and needs its own load/clearance analysis.

A concrete first candidate for dynamics testing is the same RS-550 winding, approximately **24:1 reduction**, and **SWF12-50 (5.5 N/mm)** springs with this longer linkage. At the same modeled 35 A limit, the optimistic output torque rises to 3.91 N·m, above the estimated 3.37 N·m crouch requirement. Maximum joint work over 1.15 rad would be 8.99 J for both hips, plus up to 1.89 J spring energy at these seat locations. However, the reflected rotor inertia becomes **2.25 times** that of the 16:1 drive. Whether enough of this energy reaches the body's vertical motion must be established by dynamics; these work bounds do not demonstrate a 25 cm jump. The previously checked $2.28 spring price would put motors plus springs at $49.54, excluding the transmission and electrical system; this is a prior-price estimate, not a verified budget for a qualified 25 cm design.

## Alternative when cheap motors dominate the decision

A motor could slowly charge a larger spring store and then release it through a latch. That permits a low-power motor to accumulate energy over multiple turns and release it rapidly. It introduces latches/cams, spring guides, motor decoupling or a carefully modeled backdrive path, synchronized release and re-engagement for landing. Independent height still has to work outside the jump cycle. A pair storing 10 J over 40 mm compression would require approximately 6.25 N/mm per spring and 250 N peak load per spring. These are sizing values, not selected parts or a packaged mechanism. [Primary research on accumulating spring energy over multiple motor turns](https://www.nature.com/articles/s41586-022-04606-3)

This alternative preserves inexpensive motor options at the cost of more mechanisms, wear and hybrid control states. It is less aligned with the requested low part count and straightforward sim2real model, so it is a fallback if a simple actively driven leg cannot meet the budget and jump target together.

## Next design gate

Run the new linkage through a motor-constrained dynamics optimization: size spring attachments and rate, transmission ratio and current, then optimize takeoff and landing while rejecting coil bind, joint stops and body collisions. Establish a mass budget from actual CAD and parts; do not obtain a jump merely by lowering simulated mass. Then detail and build one complete leg module for current/torque, spring, gearbox, inertia and landing tests before freezing the enclosure.

The final load path needs supported metal shafts, bearings and durable transmission interfaces. Printed shell/links remain possible, but the present fit-prototype STLs are not qualified for 25 cm landings. The existing **$49.34 motors-and-springs subtotal is not confirmed for this redesign**; transmission, drivers, battery and other hardware were always separate.

Reproduce the energy and linkage calculations with `.venv-sim/bin/python design/concept05-study/size_jump.py`. [Machine-readable sizing](sizing.json).

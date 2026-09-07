# Enclosed, jumping revision: design direction

6 September 2026. **Jumping is now required**, together with a finished, enclosed appearance similar to Beni. The previous open, screw-driven concept remains a useful geometry reference. [Enclosed concept-02 CAD](concept02/README.md) now shows the exterior and component reservations; [an interactive internal-drive sketch](http://127.0.0.1:8765/viewer/drive.html) explains the proposed force path. A fitted jump transmission and controller have not yet been built or validated.

## Proposed architecture

Retain two independent wheel motors and one common height/jump motor. Replace the N20 motor, M6 screw, guide rods and moving shock yoke with a **closed-loop rotary drive, reduction and a common driven member**. Couple that member to each arm through its own metal spring and damper arrangement. The two arms must retain independent passive motion.

The functional force path is:

```text
                          enclosed body
                                │
                  motor 3 + encoder + reduction
                                │
                     common driven member
                      ╱                 ╲
           left elastic coupling    right elastic coupling
                   │                       │
             left wheel arm          right wheel arm
                   │                       │
             wheel motor 1           wheel motor 2
```

This is a force-path proposal, not a dimensioned transmission. A candidate embodiment is two coaxial spring couplings between a driven shaft and separately bearing-supported arms. Each coupling needs restoring torque in both directions, controlled preload, damping and adequate angular travel. Opposed compression springs or a bidirectional torsion-spring arrangement are candidates; their fatigue life and packaging are unresolved. A single compression-only spring cannot positively retract a wheel after takeoff. A rigid shaft connecting the arms would remove the independent suspension.

During driving the common motor sets the mean leg position while the two elastic branches absorb unequal bumps. During a jump it crouches, applies extension torque, retracts the wheels in flight, and yields under controlled torque on landing. An ordinary spring in parallel with a locked arm does not provide this passive suspension. The springs reduce some drive effort but do not make the peak force or energy disappear.

An actively controlled, spring-assisted jump is an established approach in wheeled robots. Ascento uses four actuators, separate leg drives, spring assistance and a leg trajectory optimized around its center of mass. That supports the general approach; it does not validate this smaller shared-drive proposal. [Ascento paper](https://arxiv.org/html/2005.11435v1)

## Initial performance screen

Use **5–10 cm hops on level ground** as the working development target until the user specifies otherwise. For calculation, distinguish the center of mass rising 100 mm above its takeoff position from both tires clearing a 100 mm obstacle. Wheel retraction, body pitch and approach speed determine the latter.

At the current assumed 2.0 kg mass and 35 mm ground push stroke, the ideal 100 mm COM rise requires approximately:

- 1.40 m/s vertical takeoff velocity and a 50 ms push.
- 2.65 J mechanical work, including lifting through the push stroke.
- 76 N combined ground force and 106 W peak mechanical output for the assumed constant-acceleration push.
- 5.35 N·m combined equivalent arm torque at 189 rpm at takeoff. Peak torque elsewhere along this ideal stroke is about 5.68 N·m.

These are linkage-load estimates, **not a motor rating or proof of a jump**. Motor, spring and transmission motions must be solved together. Gear inertia, leg/wheel motion, battery sag, losses and damping all matter. A 50 mm push reduces the ideal peak power to about 82 W, but requires a new travel envelope. [Reproducible calculations and assumptions](jump/sizing.md), [editable targets](jump/targets.json)

The current short RC-shock arrangement also needs revision: a simple acceleration-load screen already calls for compression below its candidate minimum length. Landing from a 100 mm COM fall with only 20 mm deceleration travel produces about **118 N average total ground force**, before impact peaks or an unequal landing. Explore 30–40 mm useful landing travel, progressively rising spring/stop force and controlled damping. This must fit alongside ride-height travel, not consume it unknowingly.

## Motor and mechanism choice

Keep the current commodity 25 mm geared wheel-motor family as a cost baseline while checking reversal backlash, landing loads and available balance torque. The jump drive requires a different performance class. Do not replace all three motors with expensive robot joints just to improve the appearance.

| Route for motor 3 | Assessment |
| --- | --- |
| N20 and lead screw | Height-only reference; unsuitable for the required launch speed. |
| Typical 37D 12 V gearmotor | The documented Pololu family delivers around 6–12 W maximum output depending on gearing. Too little for the illustrated direct-powered push; a gearbox cannot multiply power. |
| Small brushless motor, encoder, current-controlled driver and reduction | Preferred architecture for investigation. Exact winding, reduction, inertia and simultaneous torque/speed capability must be selected together. An ordinary aircraft ESC is not automatically suitable for controlled zero-speed torque and reversal. |
| RS-550 power-tool motor and reduction | Potential cost alternative. Exact winding, gearbox, mass, current and sensing still need selection; “550” alone is not a specification. |
| Slow motor charging a spring, with cam/latch release | Useful if minimum motor cost becomes dominant. Requires release/reset sequencing and wear surfaces; arbitrary height, wheel retraction and controlled landing become harder. A separately powered latch adds a fourth actuator. |

[Pololu 37D manufacturer performance table](https://www.pololu.com/category/271/12v-37d-metal-gearmotors), [Mabuchi product families](https://www.mabuchi-motor.com/product/)

For scale, DJI's documented M3508 geared brushless motor is 42 mm diameter, 98 mm long and 365 g. It is a useful integrated-drive benchmark, but its mass and 24 V supply affect the whole package. It is **not a selected part or a verified budget solution**. The smaller M2006 is 90 g, with a published operating point of 1 N·m at 416 rpm; that alone does not satisfy the 100 mm hop load, irrespective of adding reduction. [M3508 manufacturer](https://www.robomaster.com/en-US/products/components/detail/1278), [M2006 manufacturer](https://www.robomaster.com/en-US/products/components/detail/1277)

No jump motor is purchase-ready yet. Selection requires a measured or credible torque-speed/current curve, reduction life under reversal and landing, package clearance, supply compatibility, encoder access and a costed driver. Do not accept stall torque and no-load speed as one simultaneous operating point.

## Enclosure and finish

The outside should read as a small consumer robot, with a few broad surfaces and deliberate joints. Use the rounded body, covered limb roots and restrained white/dark color scheme in the [Beni reference](../ref/camera-robot-4k-beni-mondo-robotics-designboom-1.jpg) as the design language.

- **Two principal body-shell pieces:** a rounded front/top/side shell and a rear service closure. Integrate structural ribs, bearing supports, wiring guides and electronics mounts where the load analysis permits. Replace the open side plates rather than permanently stacking a cosmetic case over them.
- **Covered arms:** rounded hollow arm bodies with protected cable routes, overlapping pivot shields and replaceable wear contacts. Retain metal pins, bearings and highly loaded transmission surfaces. Access closures may add parts where assembly requires them.
- **Clean wheels:** purchased compliant tread, recessed hub hardware and a simple flush outer face. Tire clearance must include full bump, droop, steering-induced body lean and dirt clearance.
- **A dark lower impact zone:** replaceable TPU belly/corner bumpers, with a rigid structure behind them. Keep sensor windows flush and protected. Keep the head/face fixed to preserve the motor count.
- **Service from the rear or underside:** recessed screws, captive metal nuts/inserts and repeatable alignment. Printed snap fits should not be the only joint holding the body together under a landing.
- **Enclose the drive and electronics:** strain-relieved wiring, overlapping seams, a gasket provision at service joints and a considered motor/driver heat path. Moving-joint protection and drainage still need designing; enclosure alone establishes no water/dust rating.

Every printed component retains the A1 mini constraint: 180 × 180 × 180 mm maximum build volume, with a preferred 170 mm XY envelope. Choose each shell split around its **actual printing orientation**. Large rounds, uniform visible texture and intentional seams help an FDM part look finished; a molded-smooth finish requires finishing work. There is no promise of invisible layer lines or literal unbreakability. [Bambu A1 mini specifications](https://us.store.bambulab.com/products/a1-mini)

The target is approximately Beni's envelope, with the existing 180 mm width and compact height retained unless packaging proves a change necessary. Enclosure, springs and a stronger drive add mass: recalculate jump loads after weighing the proposed BOM. The former seven-structural-print count is a result for concept 01, not a substantiated count for this new mechanism.

## CAD and sim2real sequence

1. Solve the shared rotary drive and both elastic branches, including positive wheel retraction, force versus travel and holding losses. Select the motor/reduction/current controller against the complete trajectory.
2. Package real component dimensions with a rounded shell and covered arms. Verify printer orientation, assembly access and the complete asymmetric suspension sweep. Place battery and motor masses to keep the takeoff force near the center of mass; compare a guided linkage if the simple arm path produces excessive pitch.
3. Replace the screw actuator in MuJoCo with the rotary drive, reflected inertia, two measured elastic branches, damping, friction, stops and current/voltage limits. Expose motor and arm angles, wheel encoders and IMU to the policy. Do not train against ideal instantaneous height changes.
4. Build one enclosed corner/drive test unit, measure spring hysteresis, backlash, torque response and impact behavior, then calibrate simulation. Establish restrained balancing before small jumps and uneven landings.

The original CAD, fit STLs and MuJoCo model still describe **concept 01: slow height adjustment**. Concept 02 separately supplies enclosed appearance/packaging CAD and a 50 mm prescribed pose range. Its internal-drive sketch uses illustrative gears and bidirectional torsion springs; the total reduction, spring geometry, damping, strength and fit are unresolved. Neither viewer demonstrates a physical jump.

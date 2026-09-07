# Current-assembly validation: hardware release fails

[Open the current MuJoCo jump](http://127.0.0.1:8765/viewer/validation.html)
or [use the LAN viewer](http://192.168.86.226:8765/viewer/validation.html).
The animation now follows the internal-knee plant's recorded dynamics. It is
not the earlier exposed-linkage jump dressed in the new exterior.

The design can jump and recover in the nominal rigid-body simulation, but it
**does not pass validation for a powered physical prototype**. The review found
missing positive torque connections, an undersized carrier, inadequate margin
in the printed hip gearing, a delayed-control overtravel failure and unfinished
seals. No hardware tests have been performed. Those are failures or open release
requirements, not qualifications supplied by a successful animation.

## What was actually tested

The plant uses the current 15.16 mm angled knee levers, 65.59 mm passive guides,
independent closed linkages, SWF12-50 spring geometry and 5:1 V2806 wheel drives.
CAD solids supply volume, center of mass and inertia, with explicit density and
bought-part mass assumptions. Rotating output gears and shafts are assigned to
their physical moving bodies. Rotor and intermediate spin use additional
reflected armature approximations; rotor gyroscopic coupling is not identified.

Ground contacts use convex hulls of the actual exterior meshes and cylindrical
tires. They capture the outside silhouette against a flat plane, but do not model
internal self-contact, print deflection, tire carcass compliance or detailed
interaction with irregular terrain. Springs are force-producing tendons, and
all four motor torques are limited by current and voltage. The current-loop lag
is an assumption, not a measured winding/FOC model. The V2806 model starts from
the manufacturer's 650 KV, 227 mΩ and 0.4 A no-load data. Its propeller-cooled
rating does not establish enclosed duty. [SunnySky specifications](https://sunnyskyusa.com/products/sunnysky-v2806-motor).

The mass estimate is **2.391 kg**, versus the old 2.10 kg assumption. This includes
638 g of fully dense printed CAD, solid tire envelopes at 181 g each, the solid
steel wheel-gear allocations at 125 g each, and explicit battery/electronics/
missing-hardware allowances. It is not a sliced or weighed assembly. The heavy
wheel gear and tire allocations are significant opportunities for later mass
reduction; substituting a lighter actual part requires updating the model.
[Mass and inertia breakdown](output/internal-validation/mass-properties.json).

Independent checks cover 121 left/right pose pairs. Wheel position, spring length
and loop closure agree with analytical geometry to numerical precision. Reloading
80 recorded states reproduces the exported body positions and spring compression.
A fit to free-flight COM motion gives −9.812 m/s² vertical acceleration with
0.025 mm maximum fit residual. Halving the simulation timestep changes nominal
jump clearance by 1.23 mm and peak guide load by about 1.5%.
[Plant checks](output/internal-validation/plant-verification.json),
[replay checks](output/internal-validation/replay-verification.json).

## Dynamics results

| Test | Result |
|---|---|
| Nominal jump, current assembly | **121.8 mm** clearance under both wheels; **83.0 mm** COM rise; 278 ms airborne |
| Nominal landing/recovery | Both wheels regain contact, no body-ground contact, spring compression 16.38 mm, final speed −0.030 m/s |
| Settled body orientation | **−8.65° pitch**; COM lean only 0.11°. It balances, but does not meet the retained ±5° body-level criterion |
| Main campaign | **20/21** pass the dynamics criteria excluding body level; **all 21 fail full acceptance** because of body level |
| 5 ms delayed/noisy estimated state | **Fails travel limit:** hip reaches 1.591 rad; checked CAD range ends at 1.50 rad |
| Combined adverse case | 76.7 mm jump; passes those dynamics criteria, still fails body level |
| 250 mm drop with 5° initial roll | Rigid-body recovery passes excluding body level; guide force reaches **1.223 kN** |
| 250 mm jump target | **Not achieved** |

The 21 cases include nominal jump, standing, a 20 mm one-wheel platform, mass
−10%/+20%, spring rate ±10%, reduced voltage, hip and wheel efficiency, reduced
current limits, motor constant and resistance changes, lower tire friction,
half timestep, softer contacts, delayed/noisy state, a combined adverse case
and two drops. The delayed case uses 5 ms delay and 0.2° RMS orientation noise;
contact events remain exact. The same gains/trajectory are used throughout,
with feedforward derived from the estimated CAD gravitational and spring energy.
The body-level failure has not been removed to make the campaign pass.
[Complete campaign](output/internal-validation/suite.json).

Two gentler follow-up trajectories still exceeded the hip range with delayed
state. A shorter launch—crouch 0.45 rad, extend 1.05 rad, retract 0.50 rad,
95 ms pulse—stays within range in its **two tested cases**: 43.3 mm nominal jump
and 50.7 mm with delayed/noisy state. The 21-case campaign has **not** been repeated
for this shorter trajectory, so it is a promising control change, not a validated
replacement operating envelope. [Watch the shorter launch](http://127.0.0.1:8765/viewer/validation.html?case=short_launch_nominal),
[two-case report](output/internal-validation/short-launch-study.json).

## Driving results

| Command and modeled resistance | Mean cruise speed | Result |
|---|---:|---|
| 0.8 m/s, no added resistance | 0.794 m/s | Tracking and stopping pass |
| 2.0 m/s, no added resistance | 1.992 m/s | Tracking and stopping pass |
| 20 km/h, no added resistance | 19.97 km/h | Tracking and stopping pass in this idealized model |
| 2.0 m/s, 2 N added resistance | 1.978 m/s | Maximum tracking-error criterion fails; stopping still passes |

These are short, flat-ground, perfect-state experiments. There is no aerodynamic
or motor-temperature model. The 20 km/h result establishes feasibility under the
stated assumptions, not a hardware rating or an off-road speed. The resistance
case uses an explicit opposing force; it is not a calibrated grass/gravel model.
[Driving replays](http://127.0.0.1:8765/viewer/validation.html?run=drive),
[driving reports](output/internal-validation/driving/suite.json).

## Structural review

Loads below come from the rigid-body simulations, not measured impacts. Simple
beam, pin and Lewis gear calculations are screening tools; they are not FEA or
fatigue ratings. The reference steel yield is 355 MPa and the provisional static
design factor is 2. Actual metal grades, fabrication and heat treatment remain
unspecified. [SSAB material reference](https://www.ssab.com/en/brands-and-products/ssab-domex/product-offer/355mc).

| Item | Finding | Disposition |
|---|---|---|
| Hip shaft → thigh | Round 8 mm shaft in an 8.2 mm round bore; no key, clamp or positive torque fastener | **Fail:** the drawing has no defined torque-transmission capacity |
| 7 mm carrier post | Nominal bending stress ≈320 MPa, yield factor ≈1.11; drop-case bending ≈508 MPa. Offset torsion can increase these demands | **Fail** against the factor-2 screen; redesign support/post and mounting |
| 60T printed hip output gear | Lewis nominal root stress ≈56 MPa at the recorded peak torque; ≈84 MPa with an assumed 1.5 load factor | **Fail** the provisional PETG screen; choose rated gearing or redesign and qualify the tooth/hub system |
| 4 mm steel guide | Net-section stress ≈49 MPa nominal / 78 MPa worst drop; nominal axial deflection ≈0.008 mm | Passes this simple static section screen only; eyes, fatigue and alignment remain unqualified |
| 6 mm knee guide pin | Simple bending estimate ≈99 MPa nominal / 157 MPa worst drop | Preliminary section margin exists for assumed 355 MPa steel; grade, fits and retention remain unqualified |
| Knee bushing / printed seat | Nominal projected pressure ≈27 MPa in the 8 × 4 mm bushing interface; printed-seat support also needs checking | Unqualified: supplier PV/pressure rating, print bearing/creep strength and alignment are missing |
| Gear/shaft/rim and knee connections | D-flat and round-bore envelopes do not complete hub strength or axial retention | Unqualified; metal load spreaders, positive torque connections and retainers need drawings |
| Spring and guide-pin retention | Spring unloads above free length; final captive rod/seats and pin retainers are absent | Unqualified; finish retention before a powered test |

For the carrier, the same simplified combined-load screen suggests roughly a
9.1 mm post for the nominal case or 10.6 mm for the worst tested drop. These are
sizing estimates, not ready-to-apply shaft dimensions: larger stock or a supported
bridge changes packaging, attachment and stress concentration and must be checked
again in CAD. The current 7 mm post has not been silently replaced in the viewer.

The gear screen uses PETG HF coupon values as a reference (34 ±4 MPa XY tensile,
23 ±4 MPa Z tensile), with a conservative 15 MPa provisional allowable. These are
not gear fatigue properties. Root fillets, print orientation, creep, temperature,
wear and actual mesh contact need a proper rating or test. [Manufacturer TDS, hosted copy](https://c.cdnmp.net/712781591/content/Bambulab_PETG_HF_Technical_Data_Sheet.pdf),
[KHK gear-rating guidance](https://khkgears.net/pdf/spur-tech.pdf).

The motor simulation also assumes a regulated bidirectional supply. Nominal
launch asks for roughly **63 A peak total bus current**, and braking briefly
returns roughly **331 W** to the modeled bus. The battery, FOC current conventions,
charge acceptance/overvoltage handling and enclosed temperature rise are not
qualified. Electrical energy/loss calculations cannot establish a continuous
current rating. [Nominal electrical and load report](output/internal-validation/jump/report.json).

## Sealing review

The enclosure **fails a CAD sealing review**: the body split has a nominal
0.4 mm gap, the hip overlap has 0.2 mm radial clearance, the knee opening has
0.4 mm radial clearance, and the spring wiper is a 0.7 mm slit in a thin membrane.
There is no complete gasket/rotary-seal/cable-gland scheme. These are open paths,
not evidence of dust or rain exclusion. No spray, dust or physical ingress test
has been performed and no IP rating is assigned.

Preserve the outer silhouette, but add captured perimeter seals, supported moving
seals or labyrinths, overlapping spring wipers and sealed cable routes. Then test
actual printed coupons and assembled closures through repeated travel and controlled
water/dust exposure. [Machine-readable structural and sealing review](output/internal-validation/structure-and-sealing.json).

## Required next design work

1. Finish positive metal hip/knee/wheel torque connections and axial/spring retention.
2. Strengthen the hip carrier and replace or qualify the printed hip transmission.
3. Reduce wheel/gear mass where actual common parts allow it; reposition components
   to improve the body equilibrium if the level-body requirement is retained.
4. Resolve launch overtravel under delay, then rerun the entire uncertainty campaign.
5. Complete the seal geometry and perform a single-leg bench test before a whole-robot jump.

For that bench test, measure masses, clearances, backlash, torque/current and
temperature using the actual prints and bought components. Apply measured loads
through the actual wheel/bearing/carrier path and inspect for permanent deformation.
The simulated drop peaks are inputs to test planning, not a prescribed proof-load
certification. Fatigue, impact variability and material coupons must establish the
eventual proof loads and duty cycle.

## Reproduce

```sh
.venv/bin/python design/concept06/internal_mass.py
.venv-sim/bin/python design/concept06/validate_internal.py
.venv-sim/bin/python design/concept06/validate_internal.py --short-launch
.venv-sim/bin/python design/concept06/validate_internal_driving.py
.venv-sim/bin/python design/concept06/check_internal_structure.py
.venv-sim/bin/python design/concept06/verify_internal_recordings.py
```

The earlier jump regression still reproduces 177.585 mm in its **old** model;
it is kept separate from these results. The campaign includes source hashes and
snapshots of its model/controller files. All computed results above remain
conditional on the stated assumptions and do not replace hardware qualification.

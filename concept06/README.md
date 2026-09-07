# Concept 06 — brushless, spring-assisted independent legs

[Current internal-knee validation](validation.md): 121.8 mm nominal simulated jump; a delayed-state travel failure and structural/sealing failures prevent hardware release. [Open its replay](http://127.0.0.1:8765/viewer/validation.html).

Latest packaging: [full robot with enclosed passive knee links](http://127.0.0.1:8765/viewer/internal.html), with [design notes](internal-full.md). This uses revised linkage geometry and round V2806 wheel drives; the MuJoCo results below belong to the earlier drivetrain.

[Open the design and recorded jump](http://127.0.0.1:8765/viewer/brushless.html). On this network: [192.168.86.226:8765](http://192.168.86.226:8765/viewer/brushless.html). The server now defaults to `0.0.0.0` and serves only `design/`.

The nominal free-floating MuJoCo simulation achieves **177.6 mm clearance under both wheels**, lands, and recovers. The previous concept achieved 68.9 mm. **250 mm remains unmet.** This is a development design, not a hardware-demonstrated jump or a manufacturing release.

## What changed

- Two SunnySky X2216 V3 **880KV long-shaft** brushless hip motors replace the RS-550s. Four motors total; each knee remains passive.
- 20:1 reduction: 12:48 followed by 12:60. The two large gears per side remain printed concepts; pinions, shafts, bearings and torque interfaces need metal.
- The 99.8 mm independent leg travel, SWF12-50 springs, enclosed wheel motors and nominal 100 × 30 mm tires remain.
- Accelerating extension is specified in **vertical wheel travel**, then converted to hip angle and speed. Current/voltage limits constrain the actual motion.
- A ten-height LQR schedule controls ground balance using an approximate wheeled-pendulum model. A launch wheel-torque bias reduces takeoff rotation. Flight uses leg retraction and wheel attitude control. On descent, the legs prepare for touchdown; measured contact switches to softer landing gains before returning to ride height.
- No passive branch damper is assumed. Landing damping is commanded through the hip motors. Real friction remains unmeasured.
- Mass is **2.10 kg assumed**: 2.40 kg baseline − 0.375 kg motor savings + 0.075 kg allowance for changed drives/encoders. This is not a measured assembly mass.

## Ascento: the useful precedent

The [original Ascento paper](https://arxiv.org/html/2005.11435v1) describes two hip and two wheel motors, a three-bar leg mechanism with nearly vertical wheel motion through the body centre of mass, and parallel torsion springs. Its 10.4 kg prototype uses 40 Nm peak hip actuators and 3.5 Nm peak wheel drives, with 350 mm leg-height range and a reported 0.4 m maximum jump. Balance gains are scheduled at ten leg heights. Its jump sequence combines retraction, synchronized extension, flight retraction and compliant landing with contact detection. Its structural printing process was PA12 SLS.

We adopt those mechanism and control principles, using our own geometry, controller and motor model. Our compression springs, geared hobby motors, smaller stroke, weak geared wheel drives and FDM parts are materially different. Our geometry's wheel path has about 6 mm of fore/aft variation; it is not perfectly vertical through the moving system COM. An Ascento result does not validate this robot or its A1-mini prints.

## Selected motors and springs: $75 ceiling

| Part | Quantity | Each | Subtotal | Evidence |
|---|---:|---:|---:|---|
| SunnySky X2216 V3 880KV **long shaft**, SS-XV3-X2216-L-880-V3 | 2 | $24.99 | $49.98 | [Manufacturer product](https://sunnyskyusa.com/products/sunnysky-x2216-v3-brushless-motors-long-shaft-version); official variant JSON saved under `sources/`, available when checked September 6, 2026 |
| Waveshare DCGM-3865-12V-EN-240RPM, SKU 22346 | 2 | $9.99 | $19.98 | [Manufacturer product](https://www.waveshare.com/product/robotics/motors-servos/motors/dcgm-3865-12v-en-240rpm.htm), [specifications](https://www.waveshare.com/wiki/DCGM-3865-12V-EN-240RPM) |
| MISUMI SWF12-50 compression spring | 2 | $2.28 estimated | $4.56 estimated | [Configured part](https://us.misumi-ec.com/vona2/detail/110100185510/?HissuCode=SWF12-50), [manufacturer catalogue](https://uk.misumi-ec.com/pdf/fa/2014/P2_0365-0366_F37_EN.pdf) |
| **Motors + springs** | | | **$74.52 estimated** | **$0.48 margin. Spring checkout price has not been reconfirmed.** |

This is the agreed motors-and-springs subtotal. It excludes encoders, FOC drivers, battery, wheel drivers, transmission hardware, tires, printing, tax and delivery. No order was placed. The long-shaft version costs the same as the short-shaft version and exposes a 3.175 mm shaft for the motor pinion, avoiding a separate rotor-flange adapter. Do not substitute the older non-V3 X2216: its specifications differ.

The V3 880KV manufacturer specification gives 27.7 mm diameter, 34 mm body length, 67.5 g, 89 mΩ resistance, 0.5 A no-load current at 10 V and 32 A/30 s with propeller cooling. The spring is 50 mm free length, 12 mm OD, nominal 5.5 N/mm ±10%; our design limit remains 20 mm compression, below the catalogue maximum of 25 mm.

**The driver cost matters.** An ordinary sensorless RC speed controller is insufficient for loaded, stationary joint torque and controlled reversal. Each hip needs rotor sensing and bidirectional current-controlled FOC. The [ST B-G431B-ESC1](https://www.st.com/en/evaluation-tools/b-g431b-esc1.html) is a possible development platform with sensor connections and a stated 40 A peak tested with forced airflow; the [ST store](https://estore.st.com/en/products/evaluation-tools/product-evaluation-tools/mcu-mpu-eval-tools/stm32-mcu-mpu-eval-tools/stm32-discovery-kits/b-g431b-esc1.html) lists about $39 per board at quantity two. That is roughly $78 for the pair, separately, before encoders and integration. It is not a qualified sealed-joint drive selection.

## Recorded result and validation

The viewer uses `output/jump/trajectory.json`: real recorded body transforms from the four-actuator MuJoCo plant. The interface's height sliders and Cycle travel mode are explicitly kinematic.

| Nominal metric | Result |
|---|---:|
| First-flight minimum-wheel clearance | 177.585 mm |
| COM rise after detected takeoff | 130.822 mm |
| Takeoff / first landing | 1.389 / 1.73525 s |
| Flight duration | 346.25 ms |
| Maximum absolute pitch over eight seconds | 11.283° |
| Final pitch / forward speed | −2.098° / −0.0267 m/s |
| Both wheels in contact at end | Yes |
| Body-ground contact | None |
| Actual hip angle range | 0.4021–1.3664 rad |
| Maximum spring compression | 16.134 mm |
| Peak hip current, DC-equivalent model | 32 A per motor |
| Maximum closure error | 0.0834 mm |
| Peak combined hip mechanical output power | 414.6 W |
| Peak combined hip DC-bus current estimate | 63.7 A |
| Hip copper loss / net electrical input, full 8 s | 44.8 J / 53.1 J |

The 9 Nm `push` value in the controller is a requested-torque ceiling, **not achieved motor torque**. The electrical envelope limits positive output to roughly 5.5 Nm per hip at low speed, falling with speed/voltage. The launch wheel bias is also clipped by each wheel motor's 0.45 Nm and speed envelope.

**All 14 nominal/individual-variation checks pass**: nominal, mass ±10%, spring rate ±10%, added branch damping, 65% gear efficiency, twice rotor inertia, 10.5 V supply, −20% motor constant, twice resistance, 24 A current limit, friction 0.4, and half timestep. Clearances span **137.6–177.6 mm**. Half timestep gives 176.1 mm. These are individual changes, not a combined worst-case test or success-rate claim.

The feasibility checks require >40 mm jump, landing, no body collision, spring compression <19.5 mm, closure <0.1 mm, no hip end stop, small final pitch/roll/speed and no solver/motor-envelope warnings. `target_250mm_reached` is separately **false**. Passing feasibility is not passing the 250 mm requirement.

The Python/MuJoCo geometry check covers 121 independent leg-pose pairs; the JavaScript check compares 101 Python reference angles and 25 independent pose pairs. Errors are at numerical precision. CAD checks validate solids, connected prints and 170 mm axis envelopes; they do not prove strength or complete assembly clearance.

## Model and build limits

The BLDC model is DC-equivalent: reciprocal Kv is used for both torque and back-EMF constants, with current/voltage limits, winding loss, electrical lag, directional transmission loss and reflected inertia. Vendor battery-current, phase-current and resistance conventions are not sufficient to identify a FOC motor model. The uncertainty checks bound some consequences but cannot replace torque, resistance and back-EMF measurements.

Rotor inertia is an estimate of 4×10⁻⁶ kg m², approximately a 21 g thin ring at 13.8 mm radius; it is not published manufacturer data. The 20:1 reduction reflects this as 0.0016 kg m² at each hip, plus a 0.00008 kg m² gearbox allowance. The simulated rotors briefly store about 2.43 J combined, so arbitrarily deleting rotor inertia would substantially exaggerate jump performance.

The supply is a prescribed loaded voltage, not a battery impedance model. A real 3S battery and wiring must deliver approximately 64 A peak for the hips plus wheel/electronics demand and accept regenerated energy. The 68 × 34 × 26 mm battery volume is an allocation, not a selected or tested battery. FOC boards, cooling, encoder mounting and wiring still need packaging.

Internal self-collision, gearbox backlash, sensor noise, control latency, thermal duty, waterproofing, fatigue and printed tooth strength are not qualified. The 16 printed concepts fit A1-mini-size envelopes, but spring retainers/guides, bearing carriers, shaft torque connections, fastener capture, motor retention and seals are not a complete build release. The 100 mm tire is a geometry/physics allocation, not a purchased tire selection. No claim of unbreakability or off-road jump reliability is made.

## Next hardware gate and route to 250 mm

1. Build one instrumented hip/leg assembly, with metal torque interfaces and spring retention. Measure current-to-torque, rotor inertia, loaded voltage, backdrive loss, backlash and spring force versus angle.
2. Reconcile the mass/COM ledger with slicer output and weighed motors, tire assemblies, battery and electronics. Recalculate gear/shaft/bearing and landing loads before releasing structural prints.
3. Feed measurements into this MuJoCo plant. Add actual controller sampling, encoder/IMU noise, latency, battery impedance and backlash before RL or policy transfer; randomize measured uncertainties.
4. Test restrained takeoff/landing and balance, then progressively higher jumps. The simulation shows why coordinated launch and landing are useful, but does not establish hardware performance.

At present the 250 mm objective is short by about 72 mm. A simple energy calculation gives about 1.49 J extra COM energy at 2.1 kg for another 72 mm, but this is only an orientation/tuck-preserving estimate, not a guarantee of extra wheel clearance. Taller jumps also need low launch angular momentum, sufficient stroke and a landing the wheel drives can recover from. Raising current alone is not a validated solution; the selected motor is already at its published 32 A/30 s current figure, under very different cooling conditions.

## Reproduce

From the workspace root:

```sh
.venv-sim/bin/python design/concept06/validate.py
.venv-sim/bin/python design/concept06/verify.py
node design/concept06/verify.mjs
.venv/bin/python design/concept06/cad.py
python3 design/viewer/serve.py --host 0.0.0.0 --port 8765
```

Native MuJoCo playback:

```sh
.venv-sim/bin/mjpython design/concept06/replay.py
```

Space pauses, R restarts, S changes speed, arrows step. Both native and browser viewers replay recorded physics; they are not running a live robot policy. Earlier search outputs are diagnostics from controller development, sometimes with different parameter assumptions, and are not accepted results. `validate.py` regenerates the selected final run with the current documented plant and controller.

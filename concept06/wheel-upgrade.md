# Preferred next wheel motor: SunnySky V2806 650KV

Selected for the next prototype investigation after the user reopened wheel
motor selection for a modest price increase, faster travel and slimmer pods.
The separate `wheelpods.py` CAD variant now explores its packaging; the original
CAD and MuJoCo baseline remain available for comparison.

**Part:** SunnySky V2806 650KV, SKU `SS-V2806-650`, two units.
**Price:** $28.99 each, $57.98 pair, before shipping and tax.
**Manufacturer stock:** the 650KV variant was available when checked September
6, 2026. The 400KV variant is a different winding and is not this selection.

Purchase: https://sunnyskyusa.com/products/sunnysky-v2806-motor?variant=45703574095

## Why this one

- Manufacturer envelope is **Ø35 × 18 mm body**, **47 g per motor**. This offers
  substantially more packaging space than the 50 × 26 mm, 92 g RCTimer 5010.
- Documented 650KV winding resistance is 227 mΩ, with 0.4 A no-load current at
  10 V. These give a more useful starting point for modeling than an unspecified
  winding. Their electrical conventions still need measurement/calibration.
- Manufacturer describes EZO bearings and dynamic balancing. These are supplier
  claims, not independent durability evidence for wheel impacts.
- A nominal **5:1 reduction** on 11.1 V gives an ideal unloaded wheel speed of
  **1,443 rpm / 27.2 km/h** on 100 mm tires. At the 20 km/h design target the
  motor turns about **5,305 rpm**. Loaded speed is not established by Kv alone.

The preliminary torque sizing uses Kt = 60/(2π×650) = 0.01469 N·m/A and an
assumed 80% transmission efficiency. That gives 0.05876 N·m wheel torque per
equivalent ampere before no-load losses. About 8.1 A equivalent motor current
would reproduce the existing 0.45 N·m short-duration wheel torque cap. The
manufacturer's 16 A / 180 s propeller-cooled specification is **not** an enclosed
continuous-current rating. No phase/DC current convention has been qualified.

## Cost and assembly implications

Replacing the two $9.99 Waveshare gearmotors adds **$38 to bare motor costs**.
The motor-plus-spring subtotal becomes **$112.52**, up from $74.52.

This is not the complete upgrade cost. The brushed motor drivers must be replaced
by two rotor-sensed, current-controlled FOC drives; encoders, reduction parts,
bearings and adapters are additional. An ST B-G431B-ESC1 development board is a
documented integration option; a distributor currently lists $39.91 each, or
$79.82 for two, before encoders or gearing. Reusing the same board family as the
hip drives would simplify firmware but still requires two additional channels.
Board choice, firmware, connector/sealing details and current limits remain open.

The motor body is 18 mm long; the **finished wheel drive is thicker** because it
also needs bearings, reduction and a cover. A bought metal spur reduction inside
a printed structural pod is the preferred packaging study. Gear ratio is a
design target; a compatible purchased gear pair has not been selected. Motor
shaft projection, pinion retention and hub dimensions must be checked against a
drawing or sample before generating final mounts. Wheel landing loads need their
own bearing load path.

## Acceptance before a design release

Bench-measure winding constants, low-speed reversals, torque/current, loaded
speed, enclosed temperature rise and wheel-bearing loads. Incorporate actual
motor/transmission mass and inertia into MuJoCo, then test acceleration, stopping
and disturbances with realistic sensing. A smooth-ground 20 km/h target is not
an off-road speed rating. No purchase has been made. `viewer/wheelpods.html`
shows the round-motor packaging study; `viewer/streamlined.html` retains the
Waveshare baseline and its original driving/jump recordings.

Sources:

- Manufacturer specifications: https://sunnyskyusa.com/products/sunnysky-v2806-motor
- Manufacturer variant/availability: https://sunnyskyusa.com/products/sunnysky-v2806-motor.js
- Driver documentation: https://www.st.com/en/evaluation-tools/b-g431b-esc1.html
- Driver distributor price: https://www.digikey.com/en/products/detail/stmicroelectronics/B-G431B-ESC1/10321670

# V2 wheel drive: package the complete drive before selecting it

The next detailed layout will use the **existing V2806 motor and 5:1 reduction**,
with the motor offset beside the wheel axis. The V3508 direct-drive candidate
has not been adopted. This keeps four locomotion motors; the comparison does
not establish any need for six.

These files are engineering studies. The main V2 CAD still needs its complete
drivetrain, and its 250 mm jump / recovery / speed / one-wheel / off-road targets
remain open. Nothing here replaces the R2 wheel's separate verified replay.

## Why direct drive was not selected

The [SunnySky V3508](https://sunnyskyusa.com/products/sunnysky-v3508-motor) looked
attractive because it could remove the wheel reduction and output coupling.
The [manufacturer-authored drawing](https://www.minircflying.com/images/V3508KV580.pdf)
provided the missing details: a 41.8 ×20 mm motor body, 4 mm shaft, 5.4 mm rear
and 2.1 mm front shaft projections, four front M3 holes on a 12 mm circle with
2.6 mm thread depth, and a 19/25 mm rear mounting pattern with 3 mm thread depth.
The drawing must still be checked against the purchased revision.

`direct-wheel/module.step` includes the dimensioned motor envelope and mounts,
a 3 mm aluminum mounting plate, a one-piece TPU tire and its fastening. Four
[Harwin R30-6200314](https://www.harwin.com/products/R30-6200314) compression
limiters keep the screws from continuing to crush the TPU. Two normal 0.5 mm
washers per front M3 ×6 screw avoid bottoming in the shallow rotor threads.
The stated tolerance screen gives 1.68–2.32 mm engagement and at least 0.28 mm
remaining thread depth. One washer can bottom the screw. This does not qualify
preload, usable full threads, loosening, pull-through or hub creep.

The module has **34 valid connected CAD solids**, including deliberately
labeled sensor and enclosure allocations. Its nominal solid-intersection check
finds no overlapping volume. Those solids are **not 34 purchase items**: the
motor is drawn as several pieces but bought as one; the PCB is still proposed.
The module is not an assembled, load-qualified wheel drive.

`check_direct_wheel.py` checks six lateral placements over the full sampled
V2 leg branch, with filled tire/fastener rotation envelopes and conservative
full-length spring envelopes. The 180 mm layout collides with the thigh. The
200 mm layout still hits the rear encoder-cover allowance. At 204 mm, that
allowance reaches the thigh-lid plane and the conservative mesh test reports
contact. **208 mm is the first tested width that clears the retained CAD**, with
2 mm minimum clearance. It is not a proof of the minimum width or of all direct
drive topologies being impossible. The full shin/support/fastening is not yet
included, and could require more space.

## Torque, heating and price

`wheel_drive_screen.py` uses the existing simulation's provisional DC-equivalent
Kv/Kt/resistance convention. It does not treat a propeller-cooled current datum
as a qualified sealed-motor duty rating.

| Screening quantity, per motor | V2806 650KV, 5:1 | V3508 580KV, direct |
| --- | ---: | ---: |
| Published bare motor price, checked 2026-09-08 | $28.99 | $42.99 |
| Published nominal motor mass | 47 g | 97 g |
| Screening current ceiling | 8 A simulation setting | 25 A/30s published datum |
| Ideal peak wheel torque under that convention | 0.470 Nm | 0.412 Nm |
| Current at 0.1 Nm wheel torque | 1.70 A | 6.07 A |
| Estimated I²R at 0.1 Nm wheel torque | 0.66 W | 4.61 W |
| Estimated I²R at 0.4 Nm wheel torque | 10.52 W | 73.78 W |

Sources: [V2806](https://sunnyskyusa.com/products/sunnysky-v2806-motor),
[V3508](https://sunnyskyusa.com/products/sunnysky-v3508-motor); dated variant
prices are retained in `motor-prices.json`. The direct motor adds **$28 and
100 g per pair before subtracting removed gears and adding mounts, sensing and
driver requirements**. This is not the complete BOM difference.

For a 2.2 kg allowance, Crr=0.03 and CdA=0.03 m², the screen gives 0.036 Nm per
wheel on flat ground at 20 km/h and 0.132 Nm on a 10° grade at 1 m/s. Direct-drive
winding loss for the grade is about 8.1 W per motor, versus 1.15 W geared,
before controller/iron/friction losses. Flat high-speed driving alone therefore
misses the more demanding thermal case. These resistance, drag and mass values
need identification on the actual robot; no continuous thermal pass is claimed.

A quasi-static 30 mm step needs about 0.561 Nm per wheel when each supports half
the 2.2 kg weight. Neither screening torque ceiling establishes that maneuver.
Leg unloading or a hop may change it; actual terrain dynamics are still needed.

## Offset geared layout and one-piece rear relief

`geared_wheel_screen.py` rotates the motor position around the wheel in 15°
increments, keeping the 30 mm center distance of the 20:100 module-0.5 gears.
The route selected for **further detailing** puts the motor at **X=0, Z=+30 mm**
relative to the wheel axis in the shin frame. It moves the motor away from the
folding thigh while retaining the original wheel diameter, tread width and track.
This is an allocation using the current 35 ×18 mm V2806 envelope; its exact
mount/shaft revision and encoder must still be confirmed.

The final allocation moves the drive 0.3 mm outward to give the large gear face
1.5 mm clearance to the thigh lid. A 2 mm pinion cover, with 0.5 mm gear-face
clearance, hits the unmodified tire. A **40.5 mm-radius recess in the rear 4 mm
of the tire** provides space for it. It leaves the wheel's outside at
**120 ×20 mm**, track at **160 mm** and overall width at **180 mm**. The final
screen compares the covered drive against both tire profiles and retains the
failed unrelieved case.

`geared_wheel_relief.py` reads the screened recess dimensions and exports a
single connected solid, with STL flat on the XY plane for a **120 ×120 ×20 mm**
print envelope. It removes material from the back without adding a rim, insert
print or second tire print. Reduced rear web support remains a strength and
deflection concern to test; geometric clearance is not a TPU durability result.

The remaining work is to fit **actual gear hubs, two shaft bearings, rotor/pinion
attachment and a positive wheel torque coupling**, then turn the cover allowance
into the integrated structural shin. A gear-face-only space pass must not be
called a finished gearbox. The entire assembly then needs CAD mass/inertia,
landing/load calculations and native V2 motion validation.

## Evidence and reproduction

- `direct-wheel/manifest.json`, `interfaces.json`, `fit-screen.json`: dimensioned
  direct-drive CAD, fastener stack and retained-leg interference results.
- `wheel-drive-screen.json`: electrical/load comparison and explicit assumptions.
- `geared-wheel-screen.json`: angle search, cover comparison and nearest parts.
- `geared-wheel-relief.*`: connected-print clearance prototype; not a released wheel.
- `hardware-references/drivetrain-sources.json`: drawing, bearing and spacer sources.

The replacement-bearing photo is marked **EZO 694Z**, whereas its seller title
says NMB. [EZO's catalog](https://www.ezo-brg.co.jp/english/product/result.php?page=4&product_category=1)
lists 694ZZ as 4 ×11 ×4 mm with 959 N dynamic rating. That is a lead for inspection,
not confirmation of the installed bearing arrangement or a motor radial-load
rating. Shaft/bearing spacing, static capacity, bell strength and retention
remain unqualified. No separate bearing was added merely because the motor
looked small.

```sh
python3 design/clanky-v2/wheel_drive_screen.py
.venv/bin/python design/clanky-v2/direct_wheel_module.py
env OPENBLAS_NUM_THREADS=1 uv run --no-project --python /usr/local/bin/python3.11 \
  --with trimesh --with python-fcl --with rtree \
  python design/clanky-v2/check_direct_wheel.py
env OPENBLAS_NUM_THREADS=1 uv run --no-project --python /usr/local/bin/python3.11 \
  --with trimesh --with python-fcl --with rtree \
  python design/clanky-v2/geared_wheel_screen.py
.venv/bin/python design/clanky-v2/geared_wheel_relief.py
uv run --no-project --python /usr/local/bin/python3.11 --with pytest \
  python -m pytest -q tests/test_v2_wheel_drive.py
```

No training was restarted, no parts ordered and no viewer published.

## Detailed geared module follow-up

The face-only allocation above is now followed by
[a detailed component assembly](geared-wheel/README.md), with sourced gear hubs,
flanged shaft bearings, a positive wheel torque plate, motor mounting hardware
and an integrated shin/case. Its rear tire relief is now 7.5 mm deep; the earlier
4 mm relief files remain the historical space study. The new component viewer is
http://localhost:8765/viewer/v2-wheel.html . Nominal part, rotation and sampled
rear-insertion checks pass. Full robot integration, actual component masses,
manufacturing tolerances, printing support and dynamics remain open.

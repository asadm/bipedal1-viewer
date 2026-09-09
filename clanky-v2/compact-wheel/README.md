# Smaller wheel-drive package: screened, not adopted

Checked 2026-09-09. Four motors, existing linkage and 120 mm wheels retained
for this study. No main CAD, native model, replay or motor purchase was changed.

## Sourced alternatives

The [SunnySky USA V2806 listing](https://sunnyskyusa.com/products/sunnysky-v2806-motor)
offers both 400KV and 650KV versions at $28.99 each. Its product API reported
both available when archived. The listed legacy bodies are 35 × 18 mm and
47 g; winding resistance is 610 mΩ for 400KV and 227 mΩ for 650KV.

There is a material revision conflict. The manufacturer's 2023-10-23
[400KV specification, hosted by Akizuki](https://akizukidenshi.com/goodsaffix/V2806-KV400%20SpecificationV1%2020231023.pdf)
gives a 19 ± 0.1 mm motor height, 28.1 ± 0.1 mm overall height, up to 55 g,
and 640 ± 5 mΩ. Its rear feature also differs from the older 5.4 mm shaft
projection in our CAD. The stock description does **not** establish which
revision would ship. This study uses the modeled legacy package and does
not certify the revised motor or its adapter/encoder interface.

A [Belting Online SS05/60B gear](https://www.beltingonline.com/product/ss05-60b/)
with the existing 20T pinion gives 3:1 at 20 mm centres, compared with the
current 5:1 at 30 mm. The supplier lists a 31 mm outside diameter, 20 mm hub,
8 mm overall width and 4 mm tooth face. Its 5 mm stock bore needs reaming to
the current 6 mm shaft; the cross-pin also needs shortening for the smaller
hub. The listed £11.36 ex-VAT price and 3–4 week lead time exclude rework,
shipping and tax. The table was inspected via web; direct HTML archival
download returned HTTP 403, which is recorded in `motor-sizing.json`.

The [RCTimer GBM5208-75T 80KV](https://rctimer.com/rctimer-gimbal-motor-gbm5208-75t-p0448.html)
is $39.99, 63 × 24 mm, 189 g and 15 Ω. Its roughly 20 km/h theoretical
no-load speed at 11.1 V is misleading for this application: our simple
electrical calculation leaves only about 0.00038 Nm at 20 km/h. Even its
idealized stall torque is only 0.088 Nm. It is not selected as a direct wheel
drive for the current battery and required skills.

The source JSON, PDF and gimbal listing are archived under
`../hardware-references/compact-wheel/`. URLs, source hashes, assumptions,
revision differences and calculations are in `motor-sizing.json`.

## Torque and heat tradeoff

`compact_wheel_sizing.py` uses the existing native plant's DC-equivalent
KV/resistance convention, an 8 A experimental ceiling, and 80% gear efficiency.
At 11.1 V, 400KV with 3:1 gives an estimated 0.458 Nm low-speed torque versus
0.470 Nm for the original drive. However, at the same 0.15 Nm output point,
modeled copper loss rises from **1.48 W to 4.18 W**. At an equal copper-loss
budget its available wheel force is much lower. These are sizing estimates;
they do not establish driver phase-current limits, enclosed-motor temperature,
continuous torque, measured loaded speed or actual battery behavior.

## Full joint-range screen and exact confirmation

`screen_compact_wheel.py` compares 60/64/70/80/100T driven gears with the
existing 20T pinion: centre distances 20/21/22.5/25/30 mm. Nine offset angles
per size give **45 packages at 205 hip positions** across the complete
existing −2.8 to 1.08 rad range, including the named poses. The motor,
encoder, mounting hardware and adapter keep their existing dimensions.
Motor case/bosses, hip gear phases and free-length springs use envelopes.

Only the unchanged 30 mm, 0° package clears every sample. Some smaller
packages clear fold, crouch, ride and extension individually, yet collide
with the thigh deeper in the joint path. The screen excludes a rebuilt
shin and output-gear interfaces, so it is a rejection tool, not a completed
replacement module. No joint range is restricted to make it pass.

`check_compact_wheel_exact.py` confirms the 20 mm, 0° failure at hip −0.8 rad
against freshly generated thigh/body solids. The modeled rotor overlaps
the thigh by **247.7 mm³**, the stator by **128.1 mm³**, and the encoder cover
by **196.1 mm³**. All eight corresponding tests of the existing 30 mm package
are clear. The conflict therefore extends into the motor envelope; deleting
cosmetic plastic would not solve it.

These results do not show that four actuators are insufficient. They reject
this packaging change around the retained leg. The next comparison is the
[140/150 mm one-piece wheel study](../large-wheel/README.md), which preserves
the current drive and does not add bought parts.

## Reproduce

```text
.venv-sim/bin/python design/clanky-v2/compact_wheel_sizing.py
PYTHONPATH=src .venv-sim/bin/python design/clanky-v2/screen_compact_wheel.py
.venv/bin/python design/clanky-v2/check_compact_wheel_exact.py
```

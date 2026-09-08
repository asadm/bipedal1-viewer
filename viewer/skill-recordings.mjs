// Catalog classification is kept separate from rendering so a programmed demo
// can never acquire the learned-policy qualification badge.
export function programmedEntries(catalog, skill) {
  const jump = skill === 'jump';
  if (!['jump', 'recovery'].includes(skill) ||
      catalog.kind !== (jump ? 'programmed-jump-development' : 'programmed-development') ||
      catalog.learned_policy !== false || catalog.hardware_release !== false ||
      (!jump && catalog.recovery_validated !== false) || !catalog.geometry_sha256 ||
      catalog.replays.some(row => !row.replay_sha256)) {
    throw Error('Unexpected programmed replay classification');
  }
  return catalog.replays.map(row => ({
    ...row, id: `programmed-${skill}-${row.id ?? row.family}`,
    type: 'programmed', skill, directory: jump ? '../programmed-jump/' : '../recovery/',
    label: jump ? 'Jump & land · wider candidate' : `Get up · ${row.label.toLowerCase()} · wider candidate`,
    replay: row.file, evaluation: 'catalog.json', geometry: catalog.geometry,
    geometry_sha256: catalog.geometry_sha256, mass_kg: catalog.mass_kg,
    model_sha256: catalog.model_sha256 ?? catalog.provenance.model_sha256,
    catalog,
  }));
}

export function validateRecording(entry, record) {
  if (!record.frames?.length || record.frames.some((frame, i, frames) =>
    !Number.isFinite(frame.t) || (i > 0 && frame.t < frames[i - 1].t) || !frame.bodies?.chassis)) {
    throw Error('Recording has missing or invalid frames');
  }
  if (entry.type === 'learned') {
    if (!record.report?.simulation_skill_pass || !entry.policy_sha256 ||
        record.report.policy_sha256 !== entry.policy_sha256 ||
        record.report.model_sha256 !== entry.model_sha256) {
      throw Error('Recording does not match the evaluated policy');
    }
  } else if (entry.type === 'programmed') {
    if (record.source_sha256 !== entry.source_sha256 ||
        record.half_step_source_sha256 !== entry.half_step_source_sha256 ||
        (record.id ?? record.family) !== (entry.family ?? 'jump') ||
        !record.metrics?.checks || !Object.values(record.metrics.checks).every(value => value === true) ||
        entry.stable_hold_s < 2 || entry.half_step_stable_hold_s < 2) {
      throw Error('Programmed recording does not match its diagnostic evidence');
    }
  } else throw Error('Unknown recording classification');
}

export function programmedDetail(entry, record) {
  if (entry.skill === 'jump') {
    return `${record.metrics.max_both_wheel_clearance_mm.toFixed(0)} mm wheel clearance · stable landing. ${entry.catalog.diagnostic_passed}/${entry.catalog.diagnostic_cases} nominal-start checks passed; randomized jump qualification is still pending.`;
  }
  const probes = entry.catalog.sensitivity?.map(probe => probe.summary[entry.family]) ?? [];
  const passed = probes.reduce((sum, row) => sum + row.stable_finishes, 0);
  const cases = probes.reduce((sum, row) => sum + row.cases, 0);
  return `Starts already fallen. A sequence selected for this exact pose gets back onto the wheels; stable finish checked at two timesteps.${cases ? ` Nearby starts: ${passed}/${cases} succeeded.` : ''} Recovery from arbitrary falls remains unvalidated.`;
}

export function programmedPhase(frame, record, skill) {
  if (skill === 'recovery') return frame.stable ? 'Balanced on wheels'
    : frame.t === 0 ? 'Fallen start'
      : frame.t >= record.metrics.capture_time_s ? 'Balance feedback' : 'Programmed get-up';
  return {balance: 'Balancing', crouch: 'Crouching', load: 'Loading springs',
    push: 'Pushing off', flight: 'In flight', prepare_landing: 'Preparing to land',
    landing: 'Landing', extension_brake: 'Braking leg extension'}[frame.phase] ?? frame.phase;
}

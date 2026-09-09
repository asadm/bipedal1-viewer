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
    label: jump ? 'Jump & land' : `Get up · ${row.label.toLowerCase()}`,
    replay: row.file, evaluation: 'catalog.json', geometry: catalog.geometry,
    geometry_sha256: catalog.geometry_sha256, mass_kg: catalog.mass_kg,
    model_sha256: catalog.model_sha256 ?? catalog.provenance.model_sha256,
    catalog,
  }));
}

// Select by physical identity, never by a cosmetic label or list position.
// Old-design policies remain archived without appearing as a second robot.
export function mainRecordings(catalog, jumpCatalog, recoveryCatalog, terrainCatalog = null) {
  if (catalog.schema_version !== 1) throw Error('Unsupported policy catalog version');
  const demos = [...programmedEntries(jumpCatalog, 'jump'), ...programmedEntries(recoveryCatalog, 'recovery')];
  const model = jumpCatalog.model_sha256;
  if (!model || demos.some(entry => entry.model_sha256 !== model)) throw Error('Demonstrations use different robot models');
  const labels = {balance: 'Balance', drive: 'Drive & turn', height: 'Change height', push: 'Recover from a push'};
  const policies = catalog.policies.filter(entry => entry.model_sha256 === model).map(entry => ({
    ...entry, type: 'learned', directory: '../learned/', label: labels[entry.skill] ?? entry.label,
  }));
  const development = terrainCatalog ? terrainEntries(terrainCatalog, model) : [];
  return {policies, demos, development, recordings: [...demos, ...policies, ...development]};
}

export function terrainEntries(catalog, model) {
  if (catalog.kind !== 'terrain-development' || catalog.qualification !== false ||
      catalog.hardware_release !== false || catalog.model_sha256 !== model ||
      !catalog.policy_sha256 || !catalog.replays?.length ||
      catalog.replays.some(row => !row.replay_sha256 || !row.terrain_sha256)) {
    throw Error('Unexpected terrain replay classification');
  }
  return catalog.replays.map(row => ({...row, type: 'development', skill: row.motion,
    directory: '../terrain/', replay: row.file, evaluation: catalog.evaluation,
    policy_sha256: catalog.policy_sha256, model_sha256: model, catalog}));
}

export function initialRecordingId(recordings, requested) {
  const selected = recordings.find(entry => entry.id === requested)
    ?? recordings.find(entry => entry.id === 'programmed-jump-jump');
  if (!selected) throw Error('Default jump recording is missing');
  return selected.id;
}

export function validateRecording(entry, record) {
  if (!record.frames?.length || record.frames.some((frame, i, frames) =>
    !Number.isFinite(frame.t) || (i > 0 && frame.t < frames[i - 1].t) || !frame.bodies?.chassis)) {
    throw Error('Recording has missing or invalid frames');
  }
  if (entry.type === 'learned') {
    if (record.report?.terrain || entry.catalog?.qualification === false ||
        !record.report?.simulation_skill_pass || !entry.policy_sha256 ||
        record.report.policy_sha256 !== entry.policy_sha256 ||
        record.report.model_sha256 !== entry.model_sha256) {
      throw Error('Recording does not match the evaluated policy');
    }
  } else if (entry.type === 'development') {
    if (entry.catalog.qualification !== false || !record.terrain_geometry?.length ||
        record.report?.terrain?.sha256 !== entry.terrain_sha256 ||
        record.report.policy_sha256 !== entry.policy_sha256 ||
        record.report.model_sha256 !== entry.model_sha256 ||
        record.report.terrain_motion !== entry.motion ||
        record.report.terrain.loose_stones !== false) {
      throw Error('Terrain recording does not match its development evidence');
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

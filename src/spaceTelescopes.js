/**
 * Space telescopes, for notes/space-telescopes.html.
 *
 * For each band of the shared atmosphere chart (src/atmosphereWindows.js),
 * where a telescope for it can work, and which way the trade-off between
 * a ground (or mountain-top) telescope and a space telescope tips: +1 when
 * only space will do (0.9 for ultraviolet, as the near ultraviolet reaches
 * the ground), -1 when the ground is the clear choice, 0 when each
 * has real advantages. Also two example orbits for an orbital observing
 * platform, the far one compared with the Moon's distance from the data
 * sheet (src/specData.js).
 */
(function () {
  const isNode = typeof require !== 'undefined' && typeof module !== 'undefined';
  const AtmosphereWindows = isNode ? require('./atmosphereWindows') : window.AtmosphereWindows;
  const SpecData = isNode ? require('./specData') : window.SpecData;

  const VERDICTS = {
    'Gamma ray': { tilt: 1, where: 'space only', reason: 'Gamma rays are absorbed high in the atmosphere, so only a detector in space can catch them.' },
    'X-ray': { tilt: 1, where: 'space only', reason: 'X-rays are absorbed high in the atmosphere, far above any mountain, so only a telescope in space can see them.' },
    Ultraviolet: { tilt: 0.9, where: 'space for almost all of it', reason: 'Most ultraviolet is absorbed high in the atmosphere, far above any mountain; only the near ultraviolet, down to about 300 nm, reaches the ground. So an ultraviolet telescope has to be in space.' },
    Infrared: { tilt: 0.5, where: 'a high, dry mountain for some; space for the rest', reason: 'A high, dry mountain gets some infrared, but a space telescope gets all of it; the mountain can have a bigger telescope that can be repaired.' },
    Optical: { tilt: 0, where: 'the ground or space', reason: 'Visible light reaches the ground, where telescopes can be bigger, cheaper and repaired; in space, images are sharper with no turbulence or weather.' },
    Radio: { tilt: -1, where: 'the ground', reason: 'Radio waves reach the ground, and radio dishes need to be huge, so they are built on the ground.' },
  };

  /** Where a telescope for this band (a name from AtmosphereWindows.BANDS) can work. */
  function verdict(bandName) {
    const band = AtmosphereWindows.BANDS.find((b) => b.name === bandName);
    if (!band) throw new Error(`No band called ${bandName}`);
    return { band: band.name, category: band.category, ...VERDICTS[band.name] };
  }

  /** The bands that never reach the ground: only a space telescope can see them. */
  function spaceOnlyBands() {
    return AtmosphereWindows.BANDS.filter((b) => b.category === 'blocked').map((b) => b.name);
  }

  /** Two example orbits for an orbital observing platform. */
  const ORBITS = {
    low: { id: 'low', name: 'Low Earth orbit', heightKm: 540, periodMinutes: 95 },
    far: { id: 'far', name: 'Far from Earth', distanceKm: 1.5e6 },
  };

  /** How many times the Moon's distance (data sheet figure) the far orbit is. */
  function farOrbitInMoonDistances() {
    return ORBITS.far.distanceKm / SpecData.CONSTANTS.meanEarthMoonDistanceKm;
  }

  const api = { VERDICTS, ORBITS, verdict, spaceOnlyBands, farOrbitInMoonDistances };
  if (isNode && module.exports) {
    module.exports = api;
  } else {
    window.SpaceTelescopes = api;
  }
})();

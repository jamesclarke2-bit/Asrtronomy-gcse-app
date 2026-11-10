# Syllabus Coverage Review

One row per point in the Edexcel GCSE Astronomy (1AS0) specification, Topics 1–12, built straight from src/specPoints.js, src/curriculum.js, src/pages.js and the site's own practice questions — regenerate with `npm run generate-syllabus-review` whenever those change (see test/syllabusReview.test.js's "docs/syllabus-review.md stays fresh" check). The same data, rendered live, is also at notes/syllabus-review.html.

## Summary by topic

| Topic | Name | Points | Covered | Not built | Flagged thin |
|---|---|---|---|---|---|
| 1 | Planet Earth | 8 | 7 | 1 | 4 |
| 2 | The lunar disc | 8 | 8 | 0 | 0 |
| 3 | The Earth-Moon-Sun system | 10 | 10 | 0 | 0 |
| 4 | Time and the Earth-Moon-Sun cycles | 21 | 19 | 2 | 11 |
| 5 | Solar System observation | 8 | 8 | 0 | 1 |
| 6 | Celestial observation | 21 | 21 | 0 | 8 |
| 7 | Early models of the Solar System | 9 | 9 | 0 | 0 |
| 8 | Planetary motion and gravity | 9 | 9 | 0 | 3 |
| 9 | Exploring the Moon | 5 | 5 | 0 | 0 |
| 10 | Solar astronomy | 12 | 12 | 0 | 0 |
| 11 | Exploring the Solar System | 30 | 25 | 5 | 0 |
| 12 | Formation of planetary systems | 14 | 5 | 9 | 1 |
| **Total** | | **155** | **138** | **17** | **28** |

## Methodology

- **Depth** is the spec's own `know` / `understand` / `be able to` tag for that point.
- **Page(s)** lists every page whose curriculum subtopic(s) declare that point's code; *not built* means none do.
- **Questions** is the number of practice questions anywhere on the site tagging a covering subtopic, only counted for a covered `be able to` point — shown as "–" for every other depth, and for a point that isn't built yet (there's no page to carry a question in the first place).
- **Thin coverage** flags a covered point, automatically and conservatively, three ways (never a judgement call — that's what the blank Teacher's verdict column is for):
  1. an `understand` point where none of its covering pages are on src/pages.js's DIAGRAM_FIRST_PAGES (pages *verified* to open with a diagram, not every page that happens to have one);
  2. a `be able to` point with fewer than 2 practice questions site-wide;
  3. a point covered by exactly one page, and that page is on src/pages.js's TAP_REVEAL_HEAVY_PAGES (over a third of its <main> content lives inside a tap-to-reveal panel rather than always-visible prose).

## Topic 1: Planet Earth

| Code | Depth | Spec point | Page(s) | Questions | Thin coverage | Teacher's verdict |
|---|---|---|---|---|---|---|
| 1.1 | know | Earth is an oblate spheroid | [Earth: Structure, Atmosphere and Motion](../notes/earth-structure.html) | – | ⚠ covered only on a page where tap-to-reveal content outweighs visible prose | |
| 1.2 | be able to | use Earth's mean diameter (13,000 km) | [Measuring the Sky](../notes/measuring-the-sky.html)<br>[Earth: Structure, Atmosphere and Motion](../notes/earth-structure.html) | 9 |  | |
| 1.3 | understand | Earth's internal divisions (crust, mantle, outer core, inner core) | [Earth: Structure, Atmosphere and Motion](../notes/earth-structure.html) | – | ⚠ covered only on a page where tap-to-reveal content outweighs visible prose | |
| 1.4 | be able to | use latitude and longitude | [Earth: Structure, Atmosphere and Motion](../notes/earth-structure.html) | 14 | ⚠ covered only on a page where tap-to-reveal content outweighs visible prose | |
| 1.5 | be able to | use surface divisions as reference points (equator, tropics, polar circles, prime meridian, poles) | [Earth: Structure, Atmosphere and Motion](../notes/earth-structure.html) | 14 | ⚠ covered only on a page where tap-to-reveal content outweighs visible prose | |
| 1.6a | understand | atmosphere effects on observation: sky colour | *not built* | – |  | |
| 1.6b | understand | atmosphere effects on observation: skyglow | [Observing Techniques](../notes/observing-techniques.html) | – |  | |
| 1.6c | understand | atmosphere effects on observation: twinkling | [The Naked-Eye Sky](../notes/naked-eye-sky.html) | – |  | |

## Topic 2: The lunar disc

| Code | Depth | Spec point | Page(s) | Questions | Thin coverage | Teacher's verdict |
|---|---|---|---|---|---|---|
| 2.1 | know | shape of the Moon | [The Moon: Structure, Surface and Origin](../notes/moon-structure.html) | – |  | |
| 2.2 | be able to | use the Moon's mean diameter (3,500 km) | [The Moon: Structure, Surface and Origin](../notes/moon-structure.html) | 2 |  | |
| 2.3 | be able to | recognise craters, maria, terrae, mountains, valleys | [The Moon: Structure, Surface and Origin](../notes/moon-structure.html) | 2 |  | |
| 2.4 | understand | structure and origin of those features | [The Moon: Structure, Surface and Origin](../notes/moon-structure.html) | – |  | |
| 2.5 | be able to | identify the seven named lunar features | [The Moon: Structure, Surface and Origin](../notes/moon-structure.html) | 7 |  | |
| 2.6 | be able to | use the Moon's rotation and orbital periods | [The Moon: Structure, Surface and Origin](../notes/moon-structure.html) | 2 |  | |
| 2.7 | understand | the synchronous nature of the Moon's orbit | [The Moon: Structure, Surface and Origin](../notes/moon-structure.html) | – |  | |
| 2.8 | understand | causes of libration and its effect on visibility | [The Moon: Structure, Surface and Origin](../notes/moon-structure.html) | – |  | |

## Topic 3: The Earth-Moon-Sun system

| Code | Depth | Spec point | Page(s) | Questions | Thin coverage | Teacher's verdict |
|---|---|---|---|---|---|---|
| 3.1 | be able to | use relative sizes of Earth, Moon and Sun | [Measuring the Sky](../notes/measuring-the-sky.html)<br>[Earth: Structure, Atmosphere and Motion](../notes/earth-structure.html) | 9 |  | |
| 3.2 | be able to | use relative distances between them | [Measuring the Sky](../notes/measuring-the-sky.html)<br>[Earth: Structure, Atmosphere and Motion](../notes/earth-structure.html) | 9 |  | |
| 3.3 | understand | how Eratosthenes and Aristarchus found sizes and distances | [Measuring the Sky](../notes/measuring-the-sky.html) | – |  | |
| 3.4 | be able to | use the Sun's mean diameter (1.4 x 10^6 km) | [Measuring the Sky](../notes/measuring-the-sky.html)<br>[Earth: Structure, Atmosphere and Motion](../notes/earth-structure.html) | 9 |  | |
| 3.5 | understand | Sun and Moon effects in spring and neap tides | [Tides](../notes/tides.html) | – |  | |
| 3.6 | understand | precession's effect on the appearance of Sun, Moon and stars, and archaeoastronomy | [The Ecliptic and the Zodiac](../notes/ecliptic-zodiac.html)<br>[Measuring the Sky](../notes/measuring-the-sky.html)<br>[Archaeoastronomy: Precession and Monuments](../notes/archaeoastronomy.html)<br>[Moon Phases](../sims/moon-phases.html) | – |  | |
| 3.7 | be able to | use data on the rate of precession | [The Ecliptic and the Zodiac](../notes/ecliptic-zodiac.html)<br>[Measuring the Sky](../notes/measuring-the-sky.html)<br>[Archaeoastronomy: Precession and Monuments](../notes/archaeoastronomy.html) | 6 |  | |
| 3.8 | understand | appearance of the Sun in solar eclipses, including umbral contacts | [Eclipses](../sims/eclipses.html) | – |  | |
| 3.9 | understand | appearance of the Moon in lunar eclipses, including umbral contacts | [Eclipses](../sims/eclipses.html) | – |  | |
| 3.10 | understand | causes of solar and lunar eclipses | [Moon Phases](../sims/moon-phases.html)<br>[Eclipses](../sims/eclipses.html) | – |  | |

## Topic 4: Time and the Earth-Moon-Sun cycles

| Code | Depth | Spec point | Page(s) | Questions | Thin coverage | Teacher's verdict |
|---|---|---|---|---|---|---|
| 4.1 | understand | sidereal vs synodic days | [Star Coordinates](../sims/coordinates.html) | – | ⚠ understand point, no page covering it is a verified diagram-first page | |
| 4.2 | understand | the Sun's role in apparent solar time (AST) | [Sun Path Simulator](../sims/sun-path.html)<br>[Equation of Time](../sims/equation-of-time.html) | – | ⚠ understand point, no page covering it is a verified diagram-first page | |
| 4.3 | understand | the Mean Sun, mean solar time (MST) and local mean time (LMT) | [Sun Path Simulator](../sims/sun-path.html)<br>[Equation of Time](../sims/equation-of-time.html) | – | ⚠ understand point, no page covering it is a verified diagram-first page | |
| 4.4 | be able to | use Equation of Time = AST - MST | [Sun Path Simulator](../sims/sun-path.html)<br>[Equation of Time](../sims/equation-of-time.html) | 10 |  | |
| 4.5 | understand | annual variation of the Equation of Time | [Sun Path Simulator](../sims/sun-path.html)<br>[Equation of Time](../sims/equation-of-time.html) | – | ⚠ understand point, no page covering it is a verified diagram-first page | |
| 4.6 | understand | causes of that variation | [Sun Path Simulator](../sims/sun-path.html)<br>[Equation of Time](../sims/equation-of-time.html) | – | ⚠ understand point, no page covering it is a verified diagram-first page | |
| 4.7 | understand | finding local noon with shadows and a shadow stick | [Shadows and Sundials](../sims/shadows-and-sundials.html) | – |  | |
| 4.8 | understand | structure and use of sundials | [Shadows and Sundials](../sims/shadows-and-sundials.html) | – |  | |
| 4.9 | understand | the lunar phase cycle | [Moon Phases](../sims/moon-phases.html) | – | ⚠ understand point, no page covering it is a verified diagram-first page | |
| 4.10 | understand | sidereal vs synodic months | [Sidereal vs Synodic Month](../sims/sidereal-vs-synodic.html) | – |  | |
| 4.11 | understand | annual variation in sunrise and sunset times | [Sun Path Simulator](../sims/sun-path.html)<br>[Equation of Time](../sims/equation-of-time.html) | – | ⚠ understand point, no page covering it is a verified diagram-first page | |
| 4.12 | understand | significance of equinoxes and solstices | [Sun Path Simulator](../sims/sun-path.html)<br>[Observing the Sun](../sims/sun-declination.html)<br>[Earth: Structure, Atmosphere and Motion](../notes/earth-structure.html) | – |  | |
| 4.13 | understand | variation in the Sun's apparent motion through the year | [Sun Path Simulator](../sims/sun-path.html)<br>[Observing the Sun](../sims/sun-declination.html)<br>[Earth: Structure, Atmosphere and Motion](../notes/earth-structure.html) | – |  | |
| 4.14 | understand | relationship between sidereal and synodic time | [Star Coordinates](../sims/coordinates.html) | – | ⚠ understand point, no page covering it is a verified diagram-first page | |
| 4.15 | understand | difference in local time at different longitudes | [Sun Path Simulator](../sims/sun-path.html)<br>[Equation of Time](../sims/equation-of-time.html) | – | ⚠ understand point, no page covering it is a verified diagram-first page | |
| 4.16 | understand | the use of time zones | [Sun Path Simulator](../sims/sun-path.html)<br>[Equation of Time](../sims/equation-of-time.html) | – | ⚠ understand point, no page covering it is a verified diagram-first page | |
| 4.17 | be able to | use time-zone data | [Sun Path Simulator](../sims/sun-path.html)<br>[Equation of Time](../sims/equation-of-time.html) | 10 |  | |
| 4.18 | know | mean time on the prime meridian is GMT, the same as UT | [Sun Path Simulator](../sims/sun-path.html)<br>[Equation of Time](../sims/equation-of-time.html) | – |  | |
| 4.19 | be able to | use shadow-stick data and the Equation of Time to find longitude | [Shadows and Sundials](../sims/shadows-and-sundials.html) | 1 | ⚠ be able to point, only 1 practice question site-wide | |
| 4.20 | understand | astronomical methods of finding longitude, including lunar distance | *not built* | – |  | |
| 4.21 | understand | the horological method (Harrison's marine chronometer) | *not built* | – |  | |

## Topic 5: Solar System observation

| Code | Depth | Spec point | Page(s) | Questions | Thin coverage | Teacher's verdict |
|---|---|---|---|---|---|---|
| 5.1 | understand | pinhole projection to observe the Sun safely | [Observing the Sun](../sims/sun-declination.html) | – |  | |
| 5.2 | understand | the Sun's annual path is the ecliptic | [The Ecliptic and the Zodiac](../notes/ecliptic-zodiac.html)<br>[Retrograde Motion and Planetary Alignments](../sims/solar-system-observation.html) | – |  | |
| 5.3 | understand | changing positions of planets in the night sky | [Retrograde Motion and Planetary Alignments](../sims/solar-system-observation.html) | – |  | |
| 5.4 | understand | planetary motion lies within the zodiacal band | [The Ecliptic and the Zodiac](../notes/ecliptic-zodiac.html)<br>[Retrograde Motion and Planetary Alignments](../sims/solar-system-observation.html) | – |  | |
| 5.5 | understand | retrograde motion of planets | [Retrograde Motion and Planetary Alignments](../sims/solar-system-observation.html) | – |  | |
| 5.6 | understand | First Point of Aries and First Point of Libra | [Star Coordinates](../sims/coordinates.html) | – | ⚠ understand point, no page covering it is a verified diagram-first page | |
| 5.7 | understand | meteors and meteor showers, including finding the radiant | [Observing Techniques](../notes/observing-techniques.html) | – |  | |
| 5.8 | understand | conjunction (superior and inferior), opposition, elongation, transit, occultation | [Retrograde Motion and Planetary Alignments](../sims/solar-system-observation.html) | – |  | |

## Topic 6: Celestial observation

| Code | Depth | Spec point | Page(s) | Questions | Thin coverage | Teacher's verdict |
|---|---|---|---|---|---|---|
| 6.1 | be able to | recognise naked-eye phenomena (Sun, Moon, stars including double stars, clusters, galaxies and nebulae, planets, comets, meteors, aurorae, supernovae, satellites, aircraft) | [The Naked-Eye Sky](../notes/naked-eye-sky.html) | 27 |  | |
| 6.2 | be able to | recognise and draw seven constellations/asterisms (Cassiopeia, Cygnus, Orion, Plough, Southern Cross, Summer Triangle, Square of Pegasus) | [The Naked-Eye Sky](../notes/naked-eye-sky.html) | 8 |  | |
| 6.3 | understand | asterisms as pointers (Arcturus and Polaris from the Plough; Sirius, Aldebaran and the Pleiades from Orion's Belt; Fomalhaut and Andromeda from the Square of Pegasus) | [The Naked-Eye Sky](../notes/naked-eye-sky.html) | – |  | |
| 6.4 | understand | why names differ among cultures | [Observing Techniques](../notes/observing-techniques.html) | – |  | |
| 6.5 | be able to | use star charts, planispheres and apps | [Observing Techniques](../notes/observing-techniques.html) | 0 | ⚠ be able to point, only 0 practice questions site-wide | |
| 6.6 | understand | causes and effects of light pollution | [Observing Techniques](../notes/observing-techniques.html) | – |  | |
| 6.7 | understand | celestial sphere, celestial poles, celestial equator | [Sun Path Simulator](../sims/sun-path.html) | – | ⚠ understand point, no page covering it is a verified diagram-first page | |
| 6.8 | understand | the equatorial coordinate system (RA and declination) | [Sun Path Simulator](../sims/sun-path.html) | – | ⚠ understand point, no page covering it is a verified diagram-first page | |
| 6.9 | understand | the horizon coordinate system (altitude and azimuth) | [Sun Path Simulator](../sims/sun-path.html) | – | ⚠ understand point, no page covering it is a verified diagram-first page | |
| 6.10 | understand | how latitude links equatorial and horizon coordinates at the meridian | [Star Coordinates](../sims/coordinates.html)<br>[Observing the Sun](../sims/sun-declination.html) | – |  | |
| 6.11 | understand | how the meridian defines local sidereal time and hour angle | [Star Coordinates](../sims/coordinates.html) | – | ⚠ understand point, no page covering it is a verified diagram-first page | |
| 6.12 | be able to | use coordinates to find the best time or object to observe | [Star Coordinates](../sims/coordinates.html) | 2 |  | |
| 6.13 | understand | cardinal points, culmination, meridian, zenith, circumpolarity | [Sun Path Simulator](../sims/sun-path.html) | – | ⚠ understand point, no page covering it is a verified diagram-first page | |
| 6.14 | understand | diurnal motion due to Earth's rotation | [Star Coordinates](../sims/coordinates.html) | – | ⚠ understand point, no page covering it is a verified diagram-first page | |
| 6.15 | be able to | use declination to decide whether a star is circumpolar | [Star Coordinates](../sims/coordinates.html) | 3 |  | |
| 6.16 | understand | apparent motion of circumpolar stars, upper and lower transit | [Star Coordinates](../sims/coordinates.html) | – | ⚠ understand point, no page covering it is a verified diagram-first page | |
| 6.17 | be able to | use rising and setting times to predict position | [Star Coordinates](../sims/coordinates.html) | 3 |  | |
| 6.18 | be able to | find latitude using Polaris | [Star Coordinates](../sims/coordinates.html) | 5 |  | |
| 6.19 | understand | dark adaptation and averted vision | [Observing Techniques](../notes/observing-techniques.html) | – |  | |
| 6.20 | understand | factors affecting visibility (rising and setting, seeing, weather, landscape) | [Observing Techniques](../notes/observing-techniques.html) | – |  | |
| 6.21 | understand | the naked-eye appearance of the Milky Way | [The Naked-Eye Sky](../notes/naked-eye-sky.html) | – |  | |

## Topic 7: Early models of the Solar System

| Code | Depth | Spec point | Page(s) | Questions | Thin coverage | Teacher's verdict |
|---|---|---|---|---|---|---|
| 7.1a | understand | ancient civilisations used observations of solar and lunar cycles for agriculture | [Archaeoastronomy: Precession and Monuments](../notes/archaeoastronomy.html)<br>[Moon Phases](../sims/moon-phases.html) | – |  | |
| 7.1b | understand | ancient civilisations used observations of solar and lunar cycles for religion | [Archaeoastronomy: Precession and Monuments](../notes/archaeoastronomy.html)<br>[Moon Phases](../sims/moon-phases.html) | – |  | |
| 7.1c | understand | ancient civilisations used observations of solar and lunar cycles for time and calendars | [Archaeoastronomy: Precession and Monuments](../notes/archaeoastronomy.html)<br>[Moon Phases](../sims/moon-phases.html) | – |  | |
| 7.1d | understand | ancient civilisations used observations of solar and lunar cycles for aligning monuments | [Archaeoastronomy: Precession and Monuments](../notes/archaeoastronomy.html)<br>[Moon Phases](../sims/moon-phases.html) | – |  | |
| 7.2 | understand | monuments' present alignments differ from the original because of precession | [Archaeoastronomy: Precession and Monuments](../notes/archaeoastronomy.html)<br>[Moon Phases](../sims/moon-phases.html) | – |  | |
| 7.3 | understand | early geocentric models | [From Earth-Centred to Sun-Centred](../notes/geocentric-to-heliocentric.html) | – |  | |
| 7.4 | understand | the advantage of epicycles (Ptolemy) | [From Earth-Centred to Sun-Centred](../notes/geocentric-to-heliocentric.html) | – |  | |
| 7.5 | be able to | use information about the scale of the Solar System | [The Scale of the Solar System](../notes/scale-of-the-solar-system.html) | 4 |  | |
| 7.6 | be able to | use the astronomical unit (1 AU = 1.5 x 10^8 km), light year and parsec | [The Scale of the Solar System](../notes/scale-of-the-solar-system.html) | 2 |  | |

## Topic 8: Planetary motion and gravity

| Code | Depth | Spec point | Page(s) | Questions | Thin coverage | Teacher's verdict |
|---|---|---|---|---|---|---|
| 8.1 | understand | Brahe's observational work in the move from geocentric to heliocentric models | [From Earth-Centred to Sun-Centred](../notes/geocentric-to-heliocentric.html) | – |  | |
| 8.2 | understand | the mathematical modelling of Copernicus and Kepler in that move | [From Earth-Centred to Sun-Centred](../notes/geocentric-to-heliocentric.html) | – |  | |
| 8.3 | understand | gravity creating stable elliptical orbits | [Orbits and Gravity](../sims/orbits-gravity.html) | – |  | |
| 8.4 | understand | Kepler's laws | [Kepler's Laws of Planetary Motion](../sims/kepler.html) | – | ⚠ understand point, no page covering it is a verified diagram-first page | |
| 8.5 | understand | aphelion, perihelion, apogee and perigee | [Kepler's Laws of Planetary Motion](../sims/kepler.html) | – | ⚠ understand point, no page covering it is a verified diagram-first page | |
| 8.6 | be able to | use Kepler's third law (T squared over r cubed is constant) | [Kepler's Laws of Planetary Motion](../sims/kepler.html) | 2 |  | |
| 8.7 | understand | the constant depends inversely on the mass of the central body | [Kepler's Laws of Planetary Motion](../sims/kepler.html) | – | ⚠ understand point, no page covering it is a verified diagram-first page | |
| 8.8 | know | Newton explained Kepler's laws with his law of universal gravitation | [Orbits and Gravity](../sims/orbits-gravity.html) | – |  | |
| 8.9 | understand | gravitational force is proportional to the product of the masses and inversely proportional to the square of the separation | [Orbits and Gravity](../sims/orbits-gravity.html) | – |  | |

## Topic 9: Exploring the Moon

| Code | Depth | Spec point | Page(s) | Questions | Thin coverage | Teacher's verdict |
|---|---|---|---|---|---|---|
| 9.1 | understand | the Moon's internal divisions compared with Earth's | [The Moon: Structure, Surface and Origin](../notes/moon-structure.html) | – |  | |
| 9.2 | understand | differences in appearance between near and far sides | [The Moon: Structure, Surface and Origin](../notes/moon-structure.html) | – |  | |
| 9.3 | understand | how far-side information was gathered | [The Moon: Structure, Surface and Origin](../notes/moon-structure.html) | – |  | |
| 9.4 | understand | reaching the Moon needs escape velocity, only possible with rockets | [The Moon: Structure, Surface and Origin](../notes/moon-structure.html) | – |  | |
| 9.5 | understand | Giant Impact Hypothesis and alternatives (Capture, Co-accretion) | [The Moon: Structure, Surface and Origin](../notes/moon-structure.html) | – |  | |

## Topic 10: Solar astronomy

| Code | Depth | Spec point | Page(s) | Questions | Thin coverage | Teacher's verdict |
|---|---|---|---|---|---|---|
| 10.1 | understand | safe Sun observation (telescopic projection, H-alpha filter) | [Observing the Sun](../sims/sun-declination.html) | – |  | |
| 10.2 | know | location and relative temperatures of the Sun's internal divisions | [The Sun: Structure and Features](../notes/sun-features.html) | – |  | |
| 10.3 | understand | role of those divisions in energy production and transfer | [The Sun: Structure and Features](../notes/sun-features.html) | – |  | |
| 10.4 | understand | the proton-proton cycle | [The Sun: Structure and Features](../notes/sun-features.html) | – |  | |
| 10.5 | know | location, temperature and density of the chromosphere and corona | [The Sun: Structure and Features](../notes/sun-features.html) | – |  | |
| 10.6 | understand | structure, origin and evolution of sunspots | [Sunspot Rotation](../sims/sunspot-rotation.html)<br>[The Sun: Structure and Features](../notes/sun-features.html) | – |  | |
| 10.7 | be able to | use sunspot data to find the mean solar rotation period | [Sunspot Rotation](../sims/sunspot-rotation.html)<br>[The Sun: Structure and Features](../notes/sun-features.html) | 11 |  | |
| 10.8 | be able to | use sunspot data on the solar cycle | [Sunspot Rotation](../sims/sunspot-rotation.html)<br>[The Sun: Structure and Features](../notes/sun-features.html) | 11 |  | |
| 10.9 | understand | the Sun's appearance across the electromagnetic spectrum | [Observing the Sun](../sims/sun-declination.html) | – |  | |
| 10.10 | understand | nature, composition and origin of the solar wind | [The Sun: Structure and Features](../notes/sun-features.html) | – |  | |
| 10.11 | understand | effects of the solar wind (aurorae, comet tails, geomagnetic storms, satellites, aircraft, manned missions) | [The Sun: Structure and Features](../notes/sun-features.html) | – |  | |
| 10.12 | know | shape and position of the magnetosphere, including Van Allen belts | [The Sun: Structure and Features](../notes/sun-features.html) | – |  | |

## Topic 11: Exploring the Solar System

| Code | Depth | Spec point | Page(s) | Questions | Thin coverage | Teacher's verdict |
|---|---|---|---|---|---|---|
| 11.1 | be able to | use data on the names and relative locations of planets, dwarf planets and small Solar System objects | [Bodies of the Solar System](../notes/solar-system-bodies.html) | 2 |  | |
| 11.2 | understand | comet structure (nucleus, coma, tails) | [Bodies of the Solar System](../notes/solar-system-bodies.html) | – |  | |
| 11.3 | understand | short-period comet orbits and their origin in the Kuiper Belt | [Bodies of the Solar System](../notes/solar-system-bodies.html) | – |  | |
| 11.4 | understand | long-period comet orbits and their origin in the Oort Cloud | [Bodies of the Solar System](../notes/solar-system-bodies.html) | – |  | |
| 11.5 | understand | location and nature of the Kuiper Belt, Oort Cloud and heliosphere | [Bodies of the Solar System](../notes/solar-system-bodies.html) | – |  | |
| 11.6 | understand | planets' principal characteristics (relative size, relative mass, surface temperature, atmospheric composition, satellites, rings) | [Bodies of the Solar System](../notes/solar-system-bodies.html) | – |  | |
| 11.7 | understand | main theories for the formation and position of the gas giants | [Bodies of the Solar System](../notes/solar-system-bodies.html) | – |  | |
| 11.8 | be able to | use information about the size of the Solar System | [The Scale of the Solar System](../notes/scale-of-the-solar-system.html) | 4 |  | |
| 11.9 | be able to | use the AU, light year and parsec | [The Scale of the Solar System](../notes/scale-of-the-solar-system.html) | 2 |  | |
| 11.10 | understand | origin and structure of meteoroids and meteorites | [Bodies of the Solar System](../notes/solar-system-bodies.html) | – |  | |
| 11.11 | know | most bodies orbit in or near the ecliptic plane | [The Ecliptic and the Zodiac](../notes/ecliptic-zodiac.html)<br>[Bodies of the Solar System](../notes/solar-system-bodies.html) | – |  | |
| 11.12 | understand | transits of Venus (Halley) used to find the AU | [Bodies of the Solar System](../notes/solar-system-bodies.html) | – |  | |
| 11.13 | understand | main theories for the origin of water on Earth | [Bodies of the Solar System](../notes/solar-system-bodies.html) | – |  | |
| 11.14 | know | the eye is limited by its small aperture and poor low-light sensitivity | [Telescopes: Magnification, Light Grasp and Resolution](../notes/telescopes.html) | – |  | |
| 11.15 | understand | the objective captures and focuses light, and the eyepiece magnifies the image | [Telescopes: Magnification, Light Grasp and Resolution](../notes/telescopes.html) | – |  | |
| 11.16 | know | convex lenses and concave mirrors collect and focus light | [Telescopes: Magnification, Light Grasp and Resolution](../notes/telescopes.html) | – |  | |
| 11.17 | understand | simple telescopes combine an objective with an eyepiece | [Telescopes: Magnification, Light Grasp and Resolution](../notes/telescopes.html) | – |  | |
| 11.18 | understand | basic design of Galilean, Keplerian, Newtonian and Cassegrain telescopes (no detailed ray diagrams) | [Telescopes: Magnification, Light Grasp and Resolution](../notes/telescopes.html) | – |  | |
| 11.19 | understand | light grasp is proportional to the area of the objective, so the square of its diameter | [Telescopes: Magnification, Light Grasp and Resolution](../notes/telescopes.html) | – |  | |
| 11.20 | know | aperture is related to the diameter of the objective | [Telescopes: Magnification, Light Grasp and Resolution](../notes/telescopes.html) | – |  | |
| 11.21 | know | field of view is the circle of sky seen through the eyepiece, in degrees or arcminutes | [Telescopes: Magnification, Light Grasp and Resolution](../notes/telescopes.html) | – |  | |
| 11.22 | understand | resolution depends on the objective's diameter and is reduced at a longer observing wavelength | [Telescopes: Magnification, Light Grasp and Resolution](../notes/telescopes.html) | – |  | |
| 11.23 | be able to | use magnification = focal length of objective / focal length of eyepiece | [Telescopes: Magnification, Light Grasp and Resolution](../notes/telescopes.html) | 6 |  | |
| 11.24 | understand | Galileo's early telescopic observations and the Sun-centred model | [From Earth-Centred to Sun-Centred](../notes/geocentric-to-heliocentric.html) | – |  | |
| 11.25 | understand | advantages of reflectors over refractors (chromatic aberration, very long focal lengths, large apertures, multiple mirrors) | [Telescopes: Magnification, Light Grasp and Resolution](../notes/telescopes.html) | – |  | |
| 11.26 | understand | advantages and disadvantages of fly-by, orbiter, impactor and lander probes | *not built* | – |  | |
| 11.27 | know | an example of each (New Horizons; Juno or Dawn; Deep Impact; Philae) with target and major discoveries | *not built* | – |  | |
| 11.28 | understand | a probe must reach escape velocity, which needs rockets | *not built* | – |  | |
| 11.29 | understand | advantages and disadvantages of manned missions | *not built* | – |  | |
| 11.30 | understand | main features of the Apollo programme | *not built* | – |  | |

## Topic 12: Formation of planetary systems

| Code | Depth | Spec point | Page(s) | Questions | Thin coverage | Teacher's verdict |
|---|---|---|---|---|---|---|
| 12.1a | be able to | identify gravity's operation in the Solar System: regular motion caused by gravity | *not built* | – |  | |
| 12.1b | be able to | identify gravity's operation in the Solar System: tidal forces (ring systems, asteroid belts, internal heating) | [Bodies of the Solar System](../notes/solar-system-bodies.html) | 0 | ⚠ be able to point, only 0 practice questions site-wide | |
| 12.1c | be able to | identify gravity's operation in the Solar System: multi-body interactions (shifting orbits, chaos, resonances, Lagrange points) | *not built* | – |  | |
| 12.1d | be able to | identify gravity's operation in the Solar System: collisions (impact craters, changes to orbits and tilts) | [The Moon: Structure, Surface and Origin](../notes/moon-structure.html) | 2 |  | |
| 12.1e | be able to | identify gravity's operation in the Solar System: the solar wind's effects (on comets, planetary atmospheres and the heliosphere) | [The Sun: Structure and Features](../notes/sun-features.html) | 2 |  | |
| 12.2a | be able to | identify interactions in forming planets and moons: the Roche limit | *not built* | – |  | |
| 12.2b | be able to | identify interactions in forming planets and moons: round or irregular shape | *not built* | – |  | |
| 12.2c | be able to | identify interactions in forming planets and moons: holding an atmosphere | *not built* | – |  | |
| 12.3 | understand | main theories for the formation of gas giants | [Bodies of the Solar System](../notes/solar-system-bodies.html) | – |  | |
| 12.4 | understand | exoplanet detection methods (transit, astrometry, radial velocity) | *not built* | – |  | |
| 12.5 | understand | the requirements for life, and life on Titan, Europa, Enceladus and outside the Solar System | [Bodies of the Solar System](../notes/solar-system-bodies.html) | – |  | |
| 12.6 | understand | Goldilocks (habitable) zones | *not built* | – |  | |
| 12.7 | understand | the Drake equation | *not built* | – |  | |
| 12.8 | understand | SETI by radio, and the benefits and dangers of finding extraterrestrial life | *not built* | – |  | |

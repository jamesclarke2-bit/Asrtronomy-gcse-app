/**
 * Ptolemy's epicycle-on-deferent model: a planet rides on a small circle
 * (the epicycle) whose own centre rides on a larger circle (the deferent)
 * around a fixed Earth at the origin. With deferent radius A and angular
 * speed alpha, and epicycle radius B and angular speed beta, the planet's
 * position is the classic epitrochoid:
 *
 *   x(t) = A*cos(alpha*t) + B*cos(beta*t)
 *   y(t) = A*sin(alpha*t) + B*sin(beta*t)
 *
 * Writing z(t) = x(t) + i*y(t) and theta(t) = arg(z(t)), the geocentric
 * angular velocity is dtheta/dt = Im(conj(z)*dz/dt) / |z|^2. The
 * denominator |z|^2 is always positive (z never reaches the origin while
 * A != B), so the sign of dtheta/dt matches the sign of the numerator,
 * which works out to:
 *
 *   A^2*alpha + B^2*beta + A*B*(alpha + beta)*cos((beta - alpha)*t)
 *
 * That numerator is smallest when cos(...) = -1, where it equals
 * (A - B)*(A*alpha - B*beta). So retrograde motion (a negative angular
 * velocity) occurs somewhere in the cycle if and only if that product is
 * negative — in the realistic case B < A, exactly when B*beta > A*alpha:
 * the epicycle's own (radius x angular speed) outruns the deferent's.
 */
(function () {
  function position(t, deferentRadius, deferentAngularSpeed, epicycleRadius, epicycleAngularSpeed) {
    const deferentAngle = deferentAngularSpeed * t;
    const epicycleAngle = epicycleAngularSpeed * t;
    return {
      x: deferentRadius * Math.cos(deferentAngle) + epicycleRadius * Math.cos(epicycleAngle),
      y: deferentRadius * Math.sin(deferentAngle) + epicycleRadius * Math.sin(epicycleAngle),
    };
  }

  function deferentCentre(t, deferentRadius, deferentAngularSpeed) {
    return {
      x: deferentRadius * Math.cos(deferentAngularSpeed * t),
      y: deferentRadius * Math.sin(deferentAngularSpeed * t),
    };
  }

  // Sign matches the geocentric angular velocity dtheta/dt: positive means
  // the planet's angle as seen from Earth is increasing (prograde);
  // negative means it's momentarily retrograde.
  function angularVelocityNumerator(t, deferentRadius, deferentAngularSpeed, epicycleRadius, epicycleAngularSpeed) {
    const A = deferentRadius;
    const alpha = deferentAngularSpeed;
    const B = epicycleRadius;
    const beta = epicycleAngularSpeed;
    return A * A * alpha + B * B * beta + A * B * (alpha + beta) * Math.cos((beta - alpha) * t);
  }

  // True iff the geocentric angular velocity goes negative somewhere in
  // the cycle, i.e. the traced path shows a retrograde loop.
  function showsRetrograde(deferentRadius, deferentAngularSpeed, epicycleRadius, epicycleAngularSpeed) {
    const A = deferentRadius;
    const alpha = deferentAngularSpeed;
    const B = epicycleRadius;
    const beta = epicycleAngularSpeed;
    return (A - B) * (A * alpha - B * beta) < 0;
  }

  // The epicycle radius (for a fixed deferent radius and both angular
  // speeds) at which the loop switches on: B*beta = A*alpha. Only
  // meaningful for the realistic B < A regime.
  function retrogradeThreshold(deferentRadius, deferentAngularSpeed, epicycleAngularSpeed) {
    return (deferentRadius * deferentAngularSpeed) / epicycleAngularSpeed;
  }

  const api = { position, deferentCentre, angularVelocityNumerator, showsRetrograde, retrogradeThreshold };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  } else if (typeof window !== 'undefined') {
    window.EpicycleModel = api;
  }
})();

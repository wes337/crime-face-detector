export const getTopCrime = (results) => {
  const index = Number(results.label);
  const crimes = Object.keys(results.confidencesByLabel);
  return crimes[index];
};

export const getSecondaryCrimes = (results) => {
  const crimes = Object.keys(results.confidencesByLabel);

  const topCrime = getTopCrime(results);

  const secondaryCrimes = [];

  crimes.forEach((crime) => {
    if (results.confidencesByLabel[crime] > 0 && crime !== topCrime) {
      secondaryCrimes.push(crime);
    }
  });

  return secondaryCrimes;
};

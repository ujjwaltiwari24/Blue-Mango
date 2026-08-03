export function generateRandomUsername() {
  const number = Math.floor(
    1000000 + Math.random() * 9000000
  );

  return `mango-${number}`;
}
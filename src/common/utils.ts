// TODO: Move this function to a helper function files
export function swapValues(
  arr: number[],
  index1: number,
  index2: number
): void {
  const temp = arr[index1];
  arr[index1] = arr[index2];
  arr[index2] = temp;
}

// This is a replacement for the function Phaser.Math.Between
export function between(a: number, b: number): number {
  return Math.floor(Math.random() * (b - a + 1)) + a;
}

// TODO: verify that this generate different hashs
export function generateSessionHash() {
  const now = new Date().getTime();
  const random = Math.random() * 10000000000000000;
  const combined = `${now}-${random}`;
  const hash = combined.split("").reduce((hash, char) => {
    const chr = (hash << 5) - hash + char.charCodeAt(0);
    return chr & chr;
  }, 0);

  return hash < 0 ? -hash : hash;
}

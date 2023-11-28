// TODO: Move this function to a helper function files
export function swapValues(
  arr: number[],
  index1: number,
  index2: number,
): void {
  const temp = arr[index1];
  arr[index1] = arr[index2];
  arr[index2] = temp;
}

// This is a replacement for the function Phaser.Math.Between
export function between(a: number, b: number): number {
  return Math.floor(Math.random() * (b - a + 1)) + a;
}

/**
 * The number of glasses after the Owner presses glass `pressed` (1-based):
 * pressing a glass fills every glass up to it, and pressing the last filled
 * glass again takes that one away, so a mistaken tap is undone in place.
 */
export function glassesAfterPress(current: number, pressed: number): number {
  return current === pressed ? pressed - 1 : pressed;
}

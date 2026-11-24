/** A remembered paste target is not a visible selection until keyboard navigation starts. */
export function isKeyboardSelectedItem(
  itemId: number,
  selectedItemId: number | null,
  isKeyboardMode: boolean
): boolean {
  return isKeyboardMode && selectedItemId !== null && itemId === selectedItemId;
}

/** A row stays visibly active while its ··· menu is open or it is selected. */
export function isItemInteractionActive(isKeyboardSelected: boolean): boolean {
  return isKeyboardSelected;
}

/**
 * After a search the first result is what Enter pastes, and it shows as
 * selected. It stands in only until the arrow keys or the mouse pick a row,
 * and only once the list has caught up with what was typed, so Enter never
 * pastes a row the user hasn't seen highlighted.
 */
export function searchTopHitId(state: {
  searchFocused: boolean;
  search: string;
  /** The visible list was built from the current search text. */
  listIsCurrent: boolean;
  isComposing: boolean;
  isKeyboardMode: boolean;
  firstItemId: number | null;
}): number | null {
  if (!state.searchFocused || state.isComposing || state.isKeyboardMode) return null;
  if (state.search.trim() === "" || !state.listIsCurrent) return null;
  return state.firstItemId;
}

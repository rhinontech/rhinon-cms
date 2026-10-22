/**
 * Scrolls `el` into view inside its nearest scrollable ancestor only.
 *
 * Element.scrollIntoView also scrolls every scrollable ancestor — including the
 * customer's own page (and the admin around the preview), so a new message
 * would yank the host page down. This moves the chat's message list and
 * nothing else.
 */
export function scrollWithin(el: HTMLElement | null | undefined, behavior: ScrollBehavior = 'smooth') {
  if (!el) return;
  let parent = el.parentElement;
  while (parent) {
    const { overflowY } = getComputedStyle(parent);
    if ((overflowY === 'auto' || overflowY === 'scroll') && parent.scrollHeight > parent.clientHeight) break;
    parent = parent.parentElement;
  }
  if (!parent) return;
  const top = el.offsetTop - parent.offsetTop + el.offsetHeight - parent.clientHeight;
  parent.scrollTo({ top: Math.max(top, parent.scrollHeight - parent.clientHeight), behavior });
}

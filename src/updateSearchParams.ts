export function setSearchParam(searchParam: string, value: string) {
  const url = new URL(window.location.href); // Get the current URL
  const params = url.searchParams;
  params.set(searchParam, value);
  window.history.replaceState({}, "", url.toString());
  return value;
}

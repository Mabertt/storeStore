const localHosts = new Set(["localhost", "127.0.0.1", "[::1]"]);

if (
  window.location.port === "5500" &&
  localHosts.has(window.location.hostname)
) {
  const appUrl = new URL(window.location.href);
  appUrl.port = "3000";
  window.location.replace(appUrl.href);
}

(() => {
  if ("scrollRestoration" in history) {
    history.scrollRestoration = "manual";
  }

  const currentUrl = new URL(window.location.href);
  const isHomePage =
    currentUrl.pathname.endsWith("/") ||
    currentUrl.pathname.endsWith("/index.html");

  if (!isHomePage) return;

  const cameFromThisSite = (() => {
    if (!document.referrer) return false;

    try {
      const referrerUrl = new URL(document.referrer);

      if (currentUrl.protocol === "file:") {
        const currentDirectory = currentUrl.pathname.slice(
          0,
          currentUrl.pathname.lastIndexOf("/")
        );
        const referrerDirectory = referrerUrl.pathname.slice(
          0,
          referrerUrl.pathname.lastIndexOf("/")
        );

        return (
          referrerUrl.protocol === "file:" &&
          referrerDirectory === currentDirectory
        );
      }

      return referrerUrl.origin === currentUrl.origin;
    } catch {
      return false;
    }
  })();

  // Keep intentional in-site anchor links, but external entries always show the hero.
  if (currentUrl.hash && cameFromThisSite) return;

  if (currentUrl.hash) {
    try {
      history.replaceState(
        null,
        "",
        `${currentUrl.pathname}${currentUrl.search}`
      );
    } catch {
      // Some local file previews do not allow history URL updates.
    }
  }

  const showHero = () => window.scrollTo({ top: 0, left: 0, behavior: "auto" });

  if (document.readyState === "loading") {
    document.addEventListener(
      "DOMContentLoaded",
      () => requestAnimationFrame(showHero),
      { once: true }
    );
  } else {
    requestAnimationFrame(showHero);
  }

  window.addEventListener("pageshow", showHero);
})();

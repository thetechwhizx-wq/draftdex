/**
 * URL Hash Router
 * Gives every screen its own URL and supports browser back/forward and refresh restoration.
 */

export class Router {
  constructor(routes = {}) {
    this.routes = routes;
    this.currentRoute = '';
    this.params = {};
    this.onRouteChanged = null;

    if (typeof window !== 'undefined') {
      window.addEventListener('hashchange', () => this.handleHashChange());
    }
  }

  /**
   * Set callback for route change
   */
  setRouteHandler(handler) {
    this.onRouteChanged = handler;
  }

  /**
   * Get current parsed route info.
   */
  getCurrentRoute() {
    return this.parseHash();
  }

  /**
   * Parse hash string into route and params.
   * e.g. '#/auction/POKE01' -> { name: 'auction', param: 'POKE01' }
   */
  parseHash(hash = (typeof window !== 'undefined' ? window.location.hash : '')) {
    const clean = hash.replace(/^#\/?/, '').trim();
    if (!clean || clean === 'home') {
      return { screen: 'home', param: null, path: '#/home' };
    }
    const parts = clean.split('/');
    const screen = parts[0] || 'home';
    const param = parts[1] || null;
    return { screen, param, path: `#/${clean}` };
  }

  /**
   * Navigate to a target hash path.
   * @param {string} path e.g. '#/setup' or '#/auction/POKE01'
   */
  navigate(path) {
    if (typeof window !== 'undefined') {
      const targetHash = path.startsWith('#') ? path : `#/${path}`;
      if (window.location.hash === targetHash) {
        this.handleHashChange();
      } else {
        window.location.hash = targetHash;
      }
    }
  }

  /**
   * Handle internal or external hash change.
   */
  handleHashChange() {
    const routeInfo = this.parseHash();
    this.currentRoute = routeInfo.path;
    if (this.onRouteChanged) {
      this.onRouteChanged(routeInfo);
    }
  }

  /**
   * Initialize router on load.
   */
  init() {
    this.handleHashChange();
  }
}

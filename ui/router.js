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
   * Parse hash string into route and params.
   * e.g. '#/auction/POKE01' -> { name: 'auction', param: 'POKE01' }
   */
  parseHash(hash = (typeof window !== 'undefined' ? window.location.hash : '')) {
    const clean = hash.replace(/^#\/?/, '').trim();
    if (!clean || clean === 'home') {
      return { screen: 'home', param: null, params: { room: null }, path: '#/home' };
    }
    const parts = clean.split('/');
    const screen = parts[0] || 'home';
    const param = parts[1] || null;
    return { screen, param, params: { room: param }, path: `#/${clean}` };
  }

  /**
   * Current route info: { screen, param, path, raw }.
   * `raw` is the full hash (e.g. '#/auction/POKE01') used for saving and restoring.
   */
  getCurrentRoute() {
    const info = this.parseHash();
    return { ...info, raw: info.path };
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

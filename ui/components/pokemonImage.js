/**
 * ui/components/pokemonImage.js
 * Phase 2: Image component with loading shimmer, fallback placeholder.
 *
 * Usage:
 *   import { pokemonImg, pokemonArtwork, pokemonFront, pokemonBack, pokemonIcon } from '../components/pokemonImage.js';
 *
 *   // Returns an <img> element with shimmer and fallback behaviour
 *   container.appendChild(pokemonArtwork(pokemon));
 *
 * No bare <img> tags should be used anywhere in the UI — use these helpers.
 */

/**
 * Type-colour map for the fallback placeholder background.
 * Matches Tailwind token colours in theme.
 */
const TYPE_COLORS = {
  normal:   '#A8A878',
  fire:     '#F08030',
  water:    '#6890F0',
  electric: '#F8D030',
  grass:    '#78C850',
  ice:      '#98D8D8',
  fighting: '#C03028',
  poison:   '#A040A0',
  ground:   '#E0C068',
  flying:   '#A890F0',
  psychic:  '#F85888',
  bug:      '#A8B820',
  rock:     '#B8A038',
  ghost:    '#705898',
  dragon:   '#7038F8',
  dark:     '#705848',
  steel:    '#B8B8D0',
  fairy:    '#EE99AC'
};

/**
 * Create a Pokémon image element with shimmer loading and type-coloured fallback.
 *
 * @param {object} options
 * @param {string} options.src - Image source URL
 * @param {string} options.alt - Alt text (usually Pokémon name)
 * @param {string[]} [options.types] - Pokémon types for fallback colour
 * @param {string} [options.className] - Additional CSS classes
 * @param {string} [options.wrapperClass] - Wrapper div classes
 * @param {string} [options.size] - 'card' | 'battle' | 'icon' | 'thumb'
 * @returns {HTMLElement} Wrapper element containing the image
 */
export function pokemonImg({ src, alt, types = [], className = '', wrapperClass = '', size = 'card' }) {
  const wrapper = document.createElement('div');
  wrapper.className = `pokemon-img-wrapper pokemon-img-${size} ${wrapperClass}`.trim();
  wrapper.setAttribute('data-pokemon-img', '1');

  // Shimmer overlay (shown while loading)
  const shimmer = document.createElement('div');
  shimmer.className = 'pokemon-img-shimmer';
  shimmer.setAttribute('aria-hidden', 'true');

  // The actual image
  const img = document.createElement('img');
  img.src = src;
  img.alt = alt;
  img.className = `pokemon-img pokemon-img-photo ${className}`.trim();
  img.setAttribute('loading', 'lazy');
  img.setAttribute('decoding', 'async');

  // Placeholder (shown if image fails)
  const placeholder = document.createElement('div');
  placeholder.className = 'pokemon-img-placeholder';
  placeholder.setAttribute('aria-hidden', 'true');
  const primaryType = types[0] || 'normal';
  const color = TYPE_COLORS[primaryType] || '#A8A878';
  placeholder.style.background = `linear-gradient(135deg, ${color}aa, ${color}66)`;

  const placeholderName = document.createElement('span');
  placeholderName.className = 'pokemon-img-placeholder-name';
  placeholderName.textContent = alt;
  placeholder.appendChild(placeholderName);

  // Type chips in placeholder
  for (const type of types.slice(0, 2)) {
    const chip = document.createElement('span');
    chip.className = `pokemon-img-placeholder-type type-${type}`;
    chip.textContent = type;
    placeholder.appendChild(chip);
  }

  placeholder.style.display = 'none';

  // Event handlers
  img.addEventListener('load', () => {
    shimmer.style.display = 'none';
    img.classList.add('pokemon-img-loaded');
  });

  img.addEventListener('error', () => {
    shimmer.style.display = 'none';
    img.style.display = 'none';
    placeholder.style.display = '';
  });

  wrapper.appendChild(shimmer);
  wrapper.appendChild(img);
  wrapper.appendChild(placeholder);

  return wrapper;
}

/**
 * Official artwork (card art) for a Pokémon.
 * @param {object} pokemon - Pokémon data object with id, name, types
 * @param {object} [opts]  - Extra options (className, wrapperClass)
 */
export function pokemonArtwork(pokemon, opts = {}) {
  return pokemonImg({
    src: `./assets/sprites/artwork/${pokemon.id}.png`,
    alt: pokemon.name,
    types: pokemon.types || [],
    size: 'card',
    ...opts
  });
}

/**
 * Battle front sprite for a Pokémon.
 * @param {object} pokemon
 * @param {object} [opts]
 */
export function pokemonFront(pokemon, opts = {}) {
  return pokemonImg({
    src: `./assets/sprites/front/${pokemon.id}.png`,
    alt: pokemon.name,
    types: pokemon.types || [],
    size: 'battle',
    ...opts
  });
}

/**
 * Battle back sprite for a Pokémon.
 * @param {object} pokemon
 * @param {object} [opts]
 */
export function pokemonBack(pokemon, opts = {}) {
  return pokemonImg({
    src: `./assets/sprites/back/${pokemon.id}.png`,
    alt: `${pokemon.name} (back)`,
    types: pokemon.types || [],
    size: 'battle',
    ...opts
  });
}

/**
 * Small icon for a Pokémon (party list, bench, etc).
 * @param {object} pokemon
 * @param {object} [opts]
 */
export function pokemonIcon(pokemon, opts = {}) {
  return pokemonImg({
    src: `./assets/sprites/icon/${pokemon.id}.png`,
    alt: pokemon.name,
    types: pokemon.types || [],
    size: 'icon',
    ...opts
  });
}

/**
 * Trainer avatar placeholder (for lobby/battle trainer displays).
 * @param {string} name - Trainer name
 * @param {string} [colorClass] - Tailwind bg class or hex color
 */
export function trainerAvatar(name, colorClass = '#2563eb') {
  const wrapper = document.createElement('div');
  wrapper.className = 'trainer-avatar';
  wrapper.style.background = colorClass;
  wrapper.textContent = name ? name.slice(0, 1).toUpperCase() : '?';
  wrapper.setAttribute('aria-label', `${name} trainer avatar`);
  return wrapper;
}

/**
 * Pokéball icon (local SVG, no hotlinks).
 * @param {object} [opts]
 * @param {string} [opts.className]
 * @param {string} [opts.size] - px size (default '24')
 */
export function pokeballIcon({ className = '', size = '24' } = {}) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('width', size);
  svg.setAttribute('height', size);
  svg.setAttribute('class', `pokeball-icon ${className}`.trim());
  svg.setAttribute('aria-hidden', 'true');
  svg.innerHTML = `
    <circle cx="12" cy="12" r="11" fill="#f8f8f8" stroke="#333" stroke-width="1.5"/>
    <path d="M1 12h22" stroke="#333" stroke-width="1.5"/>
    <path d="M2 7a11 11 0 0 1 20 0" fill="#e63946"/>
    <circle cx="12" cy="12" r="3.5" fill="#f8f8f8" stroke="#333" stroke-width="1.5"/>
    <circle cx="12" cy="12" r="1.5" fill="#333"/>
  `;
  return svg;
}

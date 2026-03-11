/**
 * FERMENT - InlineEditor Framework
 * Provides edit mode state management, field wrappers, and localStorage persistence.
 *
 * Architecture:
 * - Edits are stored as overlays in localStorage keyed by entity type + id
 * - Original JSON data is never modified
 * - At render time, overlays are merged on top of original data
 * - Each field can be individually reset to original
 */

const FermentEdits = {
  STORAGE_KEY: 'ferment_edits',

  _getAll() {
    try {
      return JSON.parse(localStorage.getItem(this.STORAGE_KEY) || '{}');
    } catch { return {}; }
  },

  _saveAll(data) {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
  },

  /**
   * Get edits for a specific entity (recipe or wiki article)
   * @param {string} type - 'recipe' or 'wiki'
   * @param {string} id - entity id/slug
   * @returns {Object} field overrides
   */
  get(type, id) {
    const all = this._getAll();
    return (all[type] && all[type][id]) || {};
  },

  /**
   * Save a field edit
   * @param {string} type - 'recipe' or 'wiki'
   * @param {string} id - entity id/slug
   * @param {string} field - dot-notated field path (e.g. 'name', 'ingredients.0.name')
   * @param {*} value - new value
   */
  set(type, id, field, value) {
    const all = this._getAll();
    if (!all[type]) all[type] = {};
    if (!all[type][id]) all[type][id] = {};
    all[type][id][field] = { value, editedAt: new Date().toISOString() };
    this._saveAll(all);
  },

  /**
   * Reset a single field to original
   */
  resetField(type, id, field) {
    const all = this._getAll();
    if (all[type] && all[type][id]) {
      delete all[type][id][field];
      if (Object.keys(all[type][id]).length === 0) delete all[type][id];
      this._saveAll(all);
    }
  },

  /**
   * Reset all edits for an entity
   */
  resetAll(type, id) {
    const all = this._getAll();
    if (all[type]) {
      delete all[type][id];
      this._saveAll(all);
    }
  },

  /**
   * Check if a field has been edited
   */
  isEdited(type, id, field) {
    const edits = this.get(type, id);
    return field in edits;
  },

  /**
   * Get the edited value for a field, or the original if not edited
   */
  getValue(type, id, field, original) {
    const edits = this.get(type, id);
    if (field in edits) return edits[field].value;
    return original;
  },

  /**
   * Check if any edits exist for an entity
   */
  hasEdits(type, id) {
    const edits = this.get(type, id);
    return Object.keys(edits).length > 0;
  },

  /**
   * Get count of edited fields
   */
  editCount(type, id) {
    return Object.keys(this.get(type, id)).length;
  },
};

/**
 * Editable field wrapper component
 * Wraps any field with click-to-edit, visual indicators, and reset capability
 */
const EditableFieldComponent = {
  name: 'editable-field',

  props: {
    editing: { type: Boolean, default: false },
    edited: { type: Boolean, default: false },
    label: { type: String, default: '' },
    fieldType: { type: String, default: 'text' }, // text, textarea, number, select, list, media, tags
  },

  emits: ['edit', 'reset'],

  template: `
    <div :class="['editable-field group relative', editing ? '' : 'cursor-pointer', edited ? 'editable-field--edited' : '']">
      <!-- Edit indicator -->
      <div v-if="edited && !editing" class="absolute -left-3 top-0 bottom-0 w-1 rounded-full bg-accent-brine/50"></div>

      <!-- Field label (when editing) -->
      <div v-if="editing && label" class="flex items-center justify-between mb-1.5">
        <label class="text-xs font-medium text-text-muted uppercase tracking-wider">{{ label }}</label>
        <div class="flex items-center gap-1">
          <button v-if="edited" @click.stop="$emit('reset')"
            class="text-xs text-accent-ferment hover:text-accent-ferment/80 transition-colors px-1.5 py-0.5 rounded">
            Reset
          </button>
        </div>
      </div>

      <!-- Content slot -->
      <div @click="!editing ? $emit('edit') : null"
        :class="[!editing ? 'hover:bg-accent-brine/5 rounded-lg transition-colors -mx-2 px-2 -my-1 py-1' : '']">
        <slot></slot>
      </div>

      <!-- Hover hint (when not editing) -->
      <div v-if="!editing" class="opacity-0 group-hover:opacity-100 absolute -right-2 top-0 transition-opacity">
        <span class="text-xs text-text-muted bg-bg-secondary dark:bg-dark-secondary px-1.5 py-0.5 rounded">Edit</span>
      </div>
    </div>
  `
};

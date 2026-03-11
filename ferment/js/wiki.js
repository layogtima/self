/**
 * FERMENT - Wiki Loader
 * Loads wiki articles from individual JSON files in data/wiki/
 */

const FermentWiki = {
  _articles: [],
  _loaded: false,

  async load() {
    if (this._loaded) return this._articles;

    try {
      const res = await fetch('data/wiki/manifest.json');
      if (!res.ok) throw new Error('Wiki manifest not found');
      const manifest = await res.json();

      const results = await Promise.allSettled(
        manifest.articles.map(entry =>
          fetch(`data/wiki/${entry.file}`)
            .then(r => { if (!r.ok) throw new Error(r.status); return r.json(); })
        )
      );

      this._articles = results
        .filter(r => r.status === 'fulfilled')
        .map(r => r.value);

      this._loaded = true;
      console.log(`[FERMENT] Loaded ${this._articles.length} wiki articles`);
    } catch (e) {
      console.warn('[FERMENT] Wiki load failed:', e.message);
    }

    return this._articles;
  },

  getAll() {
    return this._articles;
  },

  getById(id) {
    return this._articles.find(a => a.id === id) || null;
  },

  getBySlug(slug) {
    return this._articles.find(a => a.slug === slug) || null;
  },

  getByTag(tag) {
    return this._articles.filter(a => (a.tags || []).includes(tag));
  },

  getAllTags() {
    const tags = new Set();
    this._articles.forEach(a => (a.tags || []).forEach(t => tags.add(t)));
    return [...tags].sort();
  },

  /**
   * Search articles by query string (title, subtitle, section content)
   */
  search(query) {
    if (!query || !query.trim()) return this._articles;
    const q = query.toLowerCase().trim();
    return this._articles.filter(a => {
      if (a.title.toLowerCase().includes(q)) return true;
      if (a.subtitle && a.subtitle.toLowerCase().includes(q)) return true;
      if ((a.tags || []).some(t => t.toLowerCase().includes(q))) return true;
      // Search section content
      return (a.sections || []).some(s =>
        s.content && s.content.toLowerCase().includes(q)
      );
    });
  },

  /**
   * Search for glossary terms across all articles (for quick glossary lookup)
   */
  searchGlossary(query) {
    if (!query || !query.trim()) return [];
    const q = query.toLowerCase().trim();
    const results = [];
    this._articles.forEach(article => {
      (article.sections || []).forEach(section => {
        if (section.type === 'heading' && section.level === 3) {
          if (section.content.toLowerCase().includes(q)) {
            // Find the next paragraph section for the definition
            const idx = article.sections.indexOf(section);
            const nextParagraph = article.sections.slice(idx + 1).find(s => s.type === 'paragraph');
            results.push({
              term: section.content,
              definition: nextParagraph ? nextParagraph.content.slice(0, 200) : '',
              articleId: article.id,
              articleTitle: article.title
            });
          }
        }
      });
    });
    return results;
  }
};

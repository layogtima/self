/* THE FERMENT ALCHEMIST — Level & Chapter Progression */

window.GameLevels = {
  chapters: [
    {
      id: 1,
      title: 'The Salt Path',
      subtitle: 'Where all fermentation begins',
      icon: '🧂',
      description: 'Learn the foundations: dry salting and brine submersion. Master the simplest and most ancient preservation techniques.',
      region: 'Global',
      levels: [1, 2, 3, 4, 5, 6],
      unlockRequirement: null,  // Always available
      techniques: ['dry-salt', 'brine-submerge'],
      color: '#8EAE68',
    },
    {
      id: 2,
      title: 'Living Cultures',
      subtitle: 'The world of microbes',
      icon: '🫧',
      description: 'Discover dairy cultures, wild starters, and the importance of temperature control.',
      region: 'Central & South Asia',
      levels: [7, 8, 9, 10, 11, 12],
      unlockRequirement: { chapter: 1, minStars: 8 },
      techniques: ['culture-inoculate', 'sugar-ferment'],
      color: '#C4A35A',
    },
    {
      id: 3,
      title: 'The Spice Route',
      subtitle: 'Pastes, sauces & condiments',
      icon: '🌶️',
      description: 'Master paste fermentation, complex spice blending, and the art of kimchi and hot sauce.',
      region: 'Korea & South Asia',
      levels: [13, 14, 15, 16, 17, 18],
      unlockRequirement: { chapter: 2, minStars: 8 },
      techniques: ['paste-ferment'],
      color: '#D4553A',
    },
    {
      id: 4,
      title: 'The Brewmaster',
      subtitle: 'Fizz, bubbles & living drinks',
      icon: '🍵',
      description: 'Brew tepache, kombucha, kvass, and ginger ale. Master sugar fermentation and carbonation.',
      region: 'Global',
      levels: [19, 20, 21, 22, 23, 24],
      unlockRequirement: { chapter: 3, minStars: 8 },
      techniques: ['sugar-ferment', 'scoby-brew'],
      color: '#4A7B8F',
    },
    {
      id: 5,
      title: "The Alchemist's Table",
      subtitle: 'Mastery & creation',
      icon: '🔮',
      description: 'Koji cultivation, miso, fusion ferments, and the final master challenge.',
      region: 'Japan & Beyond',
      levels: [25, 26, 27, 28, 29, 30],
      unlockRequirement: { chapter: 4, minStars: 8 },
      techniques: ['koji-cultivation', 'mixed-ferment'],
      color: '#6B3A5C',
    },
  ],

  getChapter(id) {
    return this.chapters.find(c => c.id === id);
  },

  isChapterUnlocked(chapterId, storyProgress) {
    const chapter = this.getChapter(chapterId);
    if (!chapter || !chapter.unlockRequirement) return true;

    const req = chapter.unlockRequirement;
    const prevChapterLevels = this.getChapter(req.chapter)?.levels || [];
    let totalStars = 0;

    for (const levelNum of prevChapterLevels) {
      const key = `${req.chapter}-${levelNum}`;
      const levelData = storyProgress.levels[key];
      if (levelData && levelData.stars) totalStars += levelData.stars;
    }

    return totalStars >= req.minStars;
  },

  isLevelUnlocked(levelNum, storyProgress) {
    // Level 1 is always unlocked
    if (levelNum === 1) return true;

    // Find which chapter this level belongs to
    const chapter = this.chapters.find(c => c.levels.includes(levelNum));
    if (!chapter) return false;

    // Check if the chapter is unlocked
    if (!this.isChapterUnlocked(chapter.id, storyProgress)) return false;

    // First level of each chapter is unlocked if chapter is unlocked
    if (chapter.levels[0] === levelNum) return true;

    // Otherwise, previous level must be completed with at least B grade
    const prevLevel = levelNum - 1;
    const prevChapter = this.chapters.find(c => c.levels.includes(prevLevel));
    if (!prevChapter) return false;

    const prevKey = `${prevChapter.id}-${prevLevel}`;
    const prevData = storyProgress.levels[prevKey];
    return prevData && prevData.completed;
  },

  getLevelStars(score) {
    if (score >= 95) return 3;
    if (score >= 85) return 2;
    if (score >= 70) return 1;
    return 0;
  },

  getGradeForScore(score) {
    if (score >= 95) return 'S';
    if (score >= 85) return 'A';
    if (score >= 70) return 'B';
    if (score >= 55) return 'C';
    if (score >= 40) return 'D';
    return 'F';
  }
};

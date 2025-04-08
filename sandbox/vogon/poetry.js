/**
 * Vogon Poetry Generator Module
 * The third worst poetry in the universe
 */

const VogonPoetryGenerator = {
    adjectives: [
        'putrid', 'vile', 'malodorous', 'gurgling', 'oozing', 'fetid', 'stagnant',
        'bureaucratic', 'procedural', 'regulatory', 'administrative', 'tedious',
        'mind-numbing', 'soul-crushing', 'excruciating', 'painful', 'torturous',
        'suffocating', 'nauseating', 'revolting', 'repugnant', 'ghastly'
    ],

    nouns: [
        'form', 'procedure', 'regulation', 'bylaw', 'statute', 'protocol', 'directive',
        'memorandum', 'decree', 'mandate', 'edict', 'proclamation', 'ordinance',
        'bureaucracy', 'administration', 'paperwork', 'documentation', 'red tape',
        'swamp', 'mire', 'bog', 'quagmire', 'cesspool', 'sewage', 'sludge',
        'plurdled gabbleblotchits', 'lurgid bee', 'Axlotl', 'Spam', 'Fnurgling',
        'Vogon'
    ],

    verbs: [
        'regulate', 'administrate', 'bureaucratize', 'proceduralize', 'standardize',
        'formalize', 'systematize', 'institutionalize', 'officiate', 'legislate',
        'gurgle', 'ooze', 'fester', 'putrefy', 'decompose', 'stagnate', 'decay',
        'writhe', 'contort', 'twist', 'squirm', 'wriggle', 'convulse', 'thrash',
        'fnord', 'fnurgle', 'voongle', 'splorge', 'groink', 'ploosh', 'splurt'
    ],

    adverbs: [
        'tediously', 'laboriously', 'painstakingly', 'meticulously', 'scrupulously',
        'assiduously', 'diligently', 'sedulously', 'fastidiously', 'conscientiously',
        'hideously', 'grotesquely', 'abhorrently', 'repulsively', 'revoltingly',
        'nauseatingly', 'sickeningly', 'disgustingly', 'repugnantly', 'loathsomely',
        'fnordishly', 'voonglingly', 'splorgingly', 'groinkingly', 'plooshingly'
    ],

    starters: [
        'Oh', 'Behold', 'Regard', 'Witness', 'Observe', 'Consider', 'Contemplate',
        'Ponder', 'Meditate on', 'Reflect upon', 'Ruminate on', 'Cogitate on',
        'Deliberate on', 'Muse on', 'Brood over', 'Dwell on', 'Agonize over',
        'Aaaarggghhh', 'Groop', 'Fredded', 'Vordle', 'Gruntbuggly', 'Mraaaaaaaa',
        'Grumbly'
    ],

    transitionPhrases: [
        'while', 'as', 'whilst', 'during which time', 'meanwhile', 'concurrently',
        'simultaneously', 'in tandem with', 'in conjunction with', 'in parallel with',
        'alongside', 'beside', 'together with', 'coupled with', 'paired with',
        'matched with', 'joined with', 'united with', 'fused with', 'merged with',
        'before', 'after', 'beyond the', 'beneath the', 'despite the', 'in spite of the'
    ],

    endings: [
        'according to procedure 7531-B.', 'as stipulated in form 28B/6.',
        'per regulation 42-Z subsection XI paragraph 7.', 'in triplicate!',
        'with copies submitted to all relevant departments.', 'pending approval.',
        'in accordance with bylaw 9754.3 section 12.', 'for immediate processing.',
        'subject to administrative review.', 'void where prohibited by statute.',
        'as required by interdepartmental memo A978-Q.', 'awaiting verification.',
        'Harrrumph!', 'Gashee!', 'Slurrp!', 'Groop!', 'Aargh!', 'Fnarg!', 'Bleargh!',
        'See?', 'I told you so.', 'No exceptions.', 'No appeals shall be considered.'
    ],

    randomElement(array) {
        return array[Math.floor(Math.random() * array.length)];
    },

    generateVogonLine() {
        const pattern = Math.floor(Math.random() * 5);

        switch (pattern) {
            case 0:
                return `${this.randomElement(this.starters)}, the ${this.randomElement(this.adjectives)} ${this.randomElement(this.nouns)} ${this.randomElement(this.verbs)}s ${this.randomElement(this.adverbs)}`;

            case 1:
                return `${this.randomElement(this.adjectives)} ${this.randomElement(this.nouns)}s ${this.randomElement(this.adverbs)} ${this.randomElement(this.verbs)} the ${this.randomElement(this.adjectives)} ${this.randomElement(this.nouns)}`;

            case 2:
                return `${this.randomElement(this.starters)}, ${this.randomElement(this.adverbs)} ${this.randomElement(this.verbs)}ing ${this.randomElement(this.nouns)}s ${this.randomElement(this.transitionPhrases)} ${this.randomElement(this.adjectives)} ${this.randomElement(this.nouns)}s`;

            case 3:
                return `The ${this.randomElement(this.nouns)} ${this.randomElement(this.verbs)}s ${this.randomElement(this.adverbs)}, ${this.randomElement(this.transitionPhrases)} ${this.randomElement(this.adjectives)} ${this.randomElement(this.nouns)}s`;

            case 4:
                return `${this.randomElement(this.adjectives)}, ${this.randomElement(this.adjectives)} ${this.randomElement(this.nouns)}s ${this.randomElement(this.verbs)} ${this.randomElement(this.adverbs)} ${this.randomElement(this.endings)}`;
        }
    },

    generateVogonPoem(lines = 4) {
        let poem = [];

        for (let i = 0; i < lines; i++) {
            poem.push(this.generateVogonLine());
        }

        // Add a dramatic ending
        poem.push(this.randomElement(this.endings));

        return poem.join('\n');
    },

    generateVogonPoemWithTitle() {
        const title = `"${this.randomElement(this.adjectives).toUpperCase()} ${this.randomElement(this.nouns).toUpperCase()} ${this.randomElement(this.verbs).toUpperCase()}INGS"`;
        const author = `By Prostetnic Vogon ${this.randomElement(['Jeltz', 'Kwaltz', 'Blort', 'Splurg', 'Grunthos', 'Stroog', 'Zarniwoop', 'Vroomfondel'])}`;
        const poem = this.generateVogonPoem(Math.floor(Math.random() * 3) + 3);

        return {
            title: title,
            author: author,
            poem: poem
        };
    }
};
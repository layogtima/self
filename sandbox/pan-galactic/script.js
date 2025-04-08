// PAN-GALACTIC GARGLE TRADING
// A Hitchhiker's Guide to the Galaxy Trading Game

// Game Data
const gameData = {
    // Locations
    locations: {
        earth: {
            id: "earth",
            name: "Earth",
            description: "Your home planet, soon to be demolished to make way for a hyperspace bypass. Better leave quickly.",
            guideEntry: "Mostly harmless. Though this entry has recently been updated to 'Mostly harmless, currently being demolished.'",
            marketModifiers: {
                "towel": 0.8,
                "guide": 0.9,
                "nutrimatic_drink": 1.0,
                "babel_fish": 3.0
            },
            availableItems: ["towel", "guide", "nutrimatic_drink"],
            travelCosts: {
                "vogon_fleet": 50,
                "betelgeuse": 300
            },
            travelTime: {
                "vogon_fleet": 1,
                "betelgeuse": 2
            },
            requiredItems: null,
            events: ["earth_destruction"]
        },
        vogon_fleet: {
            id: "vogon_fleet",
            name: "Vogon Constructor Fleet",
            description: "A massive yellow fleet of rectangular vessels. The bureaucratic center of galactic demolition.",
            guideEntry: "The Vogon Constructor Fleet is widely regarded as the most unpleasant experience one can have without actually dying. The poetry is worse.",
            marketModifiers: {
                "towel": 1.2,
                "guide": 1.5,
                "nutrimatic_drink": 1.3,
                "babel_fish": 0.5,
                "vogon_poetry": 0.3
            },
            availableItems: ["babel_fish", "vogon_poetry", "nutrimatic_drink"],
            travelCosts: {
                "earth": 50,
                "betelgeuse": 200,
                "ursa_minor": 400
            },
            travelTime: {
                "earth": 1,
                "betelgeuse": 1,
                "ursa_minor": 2
            },
            requiredItems: null,
            events: ["poetry_reading", "tax_audit"]
        },
        betelgeuse: {
            id: "betelgeuse",
            name: "Betelgeuse Trading Platform",
            description: "A bustling commercial hub where anything can be bought or sold—emphasis on anything.",
            guideEntry: "The Betelgeuse Trading Platform was built from the recycled remains of a Golgafrinchan ark. Steer clear of anyone trying to sell you a slightly used telephone sanitizer.",
            marketModifiers: {
                "towel": 1.0,
                "guide": 1.0,
                "nutrimatic_drink": 0.9,
                "babel_fish": 1.1,
                "vogon_poetry": 1.0,
                "pan_galactic_gargle_blaster": 0.7,
                "genuine_people_personality": 1.2,
                "infinite_improbability_drive_parts": 1.5,
                "jynnan_tonnyx": 0.8
            },
            availableItems: ["towel", "guide", "nutrimatic_drink", "babel_fish", "vogon_poetry", "pan_galactic_gargle_blaster", "jynnan_tonnyx", "genuine_people_personality"],
            travelCosts: {
                "vogon_fleet": 200,
                "ursa_minor": 150,
                "traal": 350,
                "deep_thought": 500
            },
            travelTime: {
                "vogon_fleet": 1,
                "ursa_minor": 1,
                "traal": 2,
                "deep_thought": 3
            },
            requiredItems: null,
            events: ["market_crash", "guide_update", "babel_fish_shortage"]
        },
        ursa_minor: {
            id: "ursa_minor",
            name: "Ursa Minor Beta",
            description: "Home of the Hitchhiker's Guide to the Galaxy headquarters, and quite lovely beaches.",
            guideEntry: "Ursa Minor Beta is a wonderfully sunny world where the good-natured inhabitants spend most of their time sunbathing and updating The Guide.",
            marketModifiers: {
                "towel": 1.1,
                "guide": 0.5,
                "nutrimatic_drink": 1.1,
                "babel_fish": 0.9,
                "vogon_poetry": 2.0,
                "pan_galactic_gargle_blaster": 1.2,
                "genuine_people_personality": 0.8,
                "jynnan_tonnyx": 1.1
            },
            availableItems: ["towel", "guide", "nutrimatic_drink", "jynnan_tonnyx", "pan_galactic_gargle_blaster"],
            travelCosts: {
                "vogon_fleet": 400,
                "betelgeuse": 150,
                "damogran": 300,
                "milliways": 800
            },
            travelTime: {
                "vogon_fleet": 2,
                "betelgeuse": 1,
                "damogran": 2,
                "milliways": 4
            },
            requiredItems: null,
            events: ["guide_update", "beach_party"]
        },
        deep_thought: {
            id: "deep_thought",
            name: "Deep Thought Computer World",
            description: "Home to the second greatest computer in all of time and space.",
            guideEntry: "Deep Thought was tasked with finding the Answer to the Ultimate Question of Life, the Universe, and Everything. It spent 7.5 million years calculating before arriving at the famous answer: 42.",
            marketModifiers: {
                "towel": 1.2,
                "guide": 0.8,
                "nutrimatic_drink": 1.2,
                "babel_fish": 1.5,
                "vogon_poetry": 1.8,
                "pan_galactic_gargle_blaster": 1.6,
                "genuine_people_personality": 0.6,
                "infinite_improbability_drive_parts": 0.7
            },
            availableItems: ["guide", "nutrimatic_drink", "genuine_people_personality", "infinite_improbability_drive_parts"],
            travelCosts: {
                "betelgeuse": 500,
                "traal": 400,
                "milliways": 600
            },
            travelTime: {
                "betelgeuse": 3,
                "traal": 2,
                "milliways": 3
            },
            requiredItems: null,
            events: ["ultimate_answer", "computational_error"]
        },
        traal: {
            id: "traal",
            name: "Traal",
            description: "Home of the legendary Ravenous Bugblatter Beast, this planet is best visited with a towel.",
            guideEntry: "The Ravenous Bugblatter Beast of Traal is so mind-bogglingly stupid that it thinks if you can't see it, it can't see you. Therefore, wrapping a towel around your head is crucial when visiting.",
            marketModifiers: {
                "towel": 0.5,
                "guide": 1.4,
                "nutrimatic_drink": 1.5,
                "babel_fish": 1.4,
                "vogon_poetry": 1.5,
                "pan_galactic_gargle_blaster": 1.4,
                "genuine_people_personality": 1.8,
                "infinite_improbability_drive_parts": 1.6,
                "jynnan_tonnyx": 1.3,
                "algolian_zylatburger": 0.7
            },
            availableItems: ["towel", "nutrimatic_drink", "algolian_zylatburger"],
            travelCosts: {
                "betelgeuse": 350,
                "deep_thought": 400,
                "damogran": 450
            },
            travelTime: {
                "betelgeuse": 2,
                "deep_thought": 2,
                "damogran": 2
            },
            requiredItems: {
                "towel": 1
            },
            events: ["bugblatter_attack", "towel_day"]
        },
        damogran: {
            id: "damogran",
            name: "Damogran",
            description: "A tropical paradise and home to the Heart of Gold ship, equipped with the Infinite Improbability Drive.",
            guideEntry: "Damogran is a remote world rarely visited due to the expense involved in getting there. This makes it ideal for top-secret government projects like the Heart of Gold.",
            marketModifiers: {
                "towel": 1.3,
                "guide": 1.2,
                "nutrimatic_drink": 0.9,
                "babel_fish": 1.3,
                "vogon_poetry": 1.9,
                "pan_galactic_gargle_blaster": 1.1,
                "genuine_people_personality": 0.9,
                "infinite_improbability_drive_parts": 0.5,
                "jynnan_tonnyx": 1.0,
                "algolian_zylatburger": 1.2
            },
            availableItems: ["towel", "nutrimatic_drink", "infinite_improbability_drive_parts"],
            travelCosts: {
                "ursa_minor": 300,
                "traal": 450,
                "milliways": 500
            },
            travelTime: {
                "ursa_minor": 2,
                "traal": 2,
                "milliways": 3
            },
            requiredItems: null,
            events: ["heart_of_gold_visit", "improbability_cascade"]
        },
        milliways: {
            id: "milliways",
            name: "Milliways",
            description: "The Restaurant at the End of the Universe, where patrons enjoy watching the destruction of the cosmos over dinner.",
            guideEntry: "Milliways, the Restaurant at the End of the Universe, offers diners the opportunity to view a Gnab Gib—the opposite of a Big Bang—as they enjoy their meal. The food is, quite literally, to die for.",
            marketModifiers: {
                "towel": 1.5,
                "guide": 1.3,
                "nutrimatic_drink": 0.3,
                "babel_fish": 1.7,
                "vogon_poetry": 2.5,
                "pan_galactic_gargle_blaster": 0.5,
                "genuine_people_personality": 1.3,
                "infinite_improbability_drive_parts": 2.0,
                "jynnan_tonnyx": 0.6,
                "algolian_zylatburger": 0.4
            },
            availableItems: ["towel", "guide", "nutrimatic_drink", "pan_galactic_gargle_blaster", "jynnan_tonnyx", "algolian_zylatburger"],
            travelCosts: {
                "ursa_minor": 800,
                "deep_thought": 600,
                "damogran": 500,
                "magrathea": 1000
            },
            travelTime: {
                "ursa_minor": 4,
                "deep_thought": 3,
                "damogran": 3,
                "magrathea": 5
            },
            requiredItems: null,
            events: ["restaurant_reservation", "end_of_universe"]
        },
        magrathea: {
            id: "magrathea",
            name: "Magrathea",
            description: "The legendary planet of planet-builders, thought lost in the mists of time and improbability.",
            guideEntry: "Magrathea is a myth, a fairy story, the stuff of childhood dreams. In ancient times, its engineers designed custom-made luxury planets for the galaxy's wealthiest citizens. Or so the legend goes.",
            marketModifiers: {
                "towel": 2.0,
                "guide": 2.0,
                "nutrimatic_drink": 2.0,
                "babel_fish": 2.0,
                "vogon_poetry": 3.0,
                "pan_galactic_gargle_blaster": 2.0,
                "genuine_people_personality": 1.0,
                "infinite_improbability_drive_parts": 1.0,
                "jynnan_tonnyx": 2.0,
                "algolian_zylatburger": 2.0
            },
            availableItems: ["towel", "guide", "nutrimatic_drink", "babel_fish", "vogon_poetry", "pan_galactic_gargle_blaster", "genuine_people_personality", "infinite_improbability_drive_parts", "jynnan_tonnyx", "algolian_zylatburger"],
            travelCosts: {
                "milliways": 1000
            },
            travelTime: {
                "milliways": 5
            },
            requiredItems: {
                "infinite_improbability_drive_parts": 5,
                "babel_fish": 1
            },
            events: ["planet_construction", "white_mice_encounter"]
        }
    },

    // Items
    items: {
        towel: {
            id: "towel",
            name: "Towel",
            description: "The most massively useful thing an interstellar hitchhiker can have.",
            icon: "fa-bath",
            baseValue: 20,
            volatility: 0.1,
            weight: 1,
            perishable: false,
            usable: true,
            use: function (game) {
                game.addMessage("You wrap your towel around your head, feeling immensely more secure.");
                game.player.towelUsed = true;
                return true;
            },
            specialEffects: {
                "traal_reputation": 0.2
            }
        },
        guide: {
            id: "guide",
            name: "Digital Copy of the Guide",
            description: "The standard repository of all knowledge and wisdom in the galaxy.",
            icon: "fa-tablet",
            baseValue: 100,
            volatility: 0.2,
            weight: 0.5,
            perishable: false,
            usable: true,
            use: function (game) {
                game.addMessage("You consult the Guide for market information. It says: 'Buy low, sell high, and never underestimate the power of a good bath towel.'");
                game.showEventModal("Guide Consultation", "fa-tablet",
                    "The Guide's vast database whirs into action, presenting you with the following advice on current market conditions:",
                    ["Pan Galactic Gargle Blasters are selling well in Milliways",
                        "Babel Fish prices are unusually low in the Vogon Constructor Fleet",
                        "Betelgeuse traders are looking for Infinite Improbability Drive Parts"]);
                return true;
            },
            specialEffects: {
                "market_knowledge": 0.1
            }
        },
        nutrimatic_drink: {
            id: "nutrimatic_drink",
            name: "Nutrimatic Drink",
            description: "A liquid that is almost, but not quite, entirely unlike tea.",
            icon: "fa-mug-hot",
            baseValue: 5,
            volatility: 0.2,
            weight: 0.5,
            perishable: true,
            perishTime: 5,
            usable: true,
            use: function (game) {
                game.addMessage("You drink the nutrimatic liquid. It's almost, but not quite, entirely unlike tea. Refreshing enough though.");
                return false; // Consumed on use
            },
            specialEffects: {}
        },
        babel_fish: {
            id: "babel_fish",
            name: "Babel Fish",
            description: "A small, yellow, leech-like fish that translates any language when placed in the ear.",
            icon: "fa-fish",
            baseValue: 200,
            volatility: 0.4,
            weight: 0.1,
            perishable: false,
            usable: true,
            use: function (game) {
                if (!game.player.babelFishUsed) {
                    game.addMessage("You place the babel fish in your ear. Suddenly, you can understand all alien languages!");
                    game.player.babelFishUsed = true;
                    // Improve all species reputation slightly
                    for (const species in game.player.reputation) {
                        game.player.reputation[species] += 0.1;
                        if (game.player.reputation[species] > 1) game.player.reputation[species] = 1;
                    }
                    return true; // Keep in inventory after use
                } else {
                    game.addMessage("You already have a babel fish in your ear.");
                    return true;
                }
            },
            specialEffects: {
                "all_reputation": 0.1
            }
        },
        vogon_poetry: {
            id: "vogon_poetry",
            name: "Vogon Poetry Book",
            description: "The third worst poetry in the Universe. Handle with extreme caution.",
            icon: "fa-book",
            baseValue: 30,
            volatility: 0.3,
            weight: 1,
            perishable: false,
            usable: true,
            use: function (game) {
                game.addMessage("You read a line of Vogon poetry. Your brain feels like it's been smashed in by a slice of lemon wrapped around a large gold brick.");
                game.showEventModal("Vogon Poetry Session", "fa-book",
                    "As you recite the first stanza, nearby aliens flee in terror. The poem goes:",
                    ["Oh freddled gruntbuggly",
                        "Thy micturations are to me",
                        "As plurdled gabbleblotchits on a lurgid bee.",
                        "...you decide to stop before anyone gets hurt."]);
                return true;
            },
            specialEffects: {
                "vogon_reputation": 0.2
            }
        },
        pan_galactic_gargle_blaster: {
            id: "pan_galactic_gargle_blaster",
            name: "Pan Galactic Gargle Blaster",
            description: "The alcoholic equivalent of a mugging; expensive and bad for the head.",
            icon: "fa-cocktail",
            baseValue: 150,
            volatility: 0.5,
            weight: 0.5,
            perishable: true,
            perishTime: 10,
            usable: true,
            use: function (game) {
                game.addMessage("You drink the Pan Galactic Gargle Blaster. It feels like having your brains smashed out by a slice of lemon wrapped around a large gold brick.");
                game.showEventModal("Gargle Blaster Effect", "fa-cocktail",
                    "The effects of the Pan Galactic Gargle Blaster wash over you. Through the haze, you hear someone mention something important:",
                    ["Something about Magrathea",
                        "Something about infinite improbability",
                        "Something about 42",
                        "You'll probably forget this by morning."]);
                return false; // Consumed on use
            },
            specialEffects: {
                "dentrassi_reputation": 0.2
            }
        },
        genuine_people_personality: {
            id: "genuine_people_personality",
            name: "Genuine People Personality",
            description: "A Sirius Cybernetics Corporation module to make robots unbearably perky.",
            icon: "fa-robot",
            baseValue: 80,
            volatility: 0.2,
            weight: 0.2,
            perishable: false,
            usable: false,
            specialEffects: {}
        },
        infinite_improbability_drive_parts: {
            id: "infinite_improbability_drive_parts",
            name: "Infinite Improbability Drive Parts",
            description: "Components for a drive that passes through every point in the Universe simultaneously.",
            icon: "fa-cogs",
            baseValue: 300,
            volatility: 0.3,
            weight: 2,
            perishable: false,
            usable: false,
            specialEffects: {}
        },
        jynnan_tonnyx: {
            id: "jynnan_tonnyx",
            name: "Jynnan Tonnyx",
            description: "A less potent version of the Pan Galactic Gargle Blaster, but still quite impressive.",
            icon: "fa-glass-martini-alt",
            baseValue: 50,
            volatility: 0.3,
            weight: 0.5,
            perishable: true,
            perishTime: 8,
            usable: true,
            use: function (game) {
                game.addMessage("You drink the Jynnan Tonnyx. It's pleasantly invigorating, unlike its more potent cousin.");
                return false; // Consumed on use
            },
            specialEffects: {}
        },
        algolian_zylatburger: {
            id: "algolian_zylatburger",
            name: "Algolian Zylatburger",
            description: "A culinary delicacy that tastes like Perfectly Normal Beast on a bun.",
            icon: "fa-hamburger",
            baseValue: 40,
            volatility: 0.2,
            weight: 0.7,
            perishable: true,
            perishTime: 3,
            usable: true,
            use: function (game) {
                game.addMessage("You eat the Algolian Zylatburger. Delicious, but you can't help feeling that this beast was a bit too normal.");
                return false; // Consumed on use
            },
            specialEffects: {}
        }
    },

    // Random Events
    events: {
        earth_destruction: {
            name: "Earth Destruction",
            icon: "fa-bomb",
            description: "The Vogon Constructor Fleet has arrived and is beginning demolition of Earth. The hyperspatial express route must be built!",
            effects: [
                "You must leave immediately",
                "All Earth belongings have been vaporized",
                "Fortunately, you brought your towel"
            ],
            execute: function (game) {
                game.player.mustLeave = true;
                game.addMessage("WARNING: Earth is being demolished. You must leave on the next turn!", "warning");
            }
        },
        poetry_reading: {
            name: "Vogon Poetry Reading",
            icon: "fa-book",
            description: "You've been captured and forced to listen to a Vogon poetry reading. It's as pleasant as having your brains smashed out with a slice of lemon wrapped around a large gold brick.",
            effects: [
                "Lose 50 Altairian Dollars for medical treatment",
                "Lose 1 turn recovering from the trauma"
            ],
            execute: function (game) {
                game.player.credits -= 50;
                if (game.player.credits < 0) game.player.credits = 0;
                game.player.skipTurns = 1;
                game.addMessage("You suffered through Vogon poetry. Your brain needs time to recover.", "danger");
            }
        },
        tax_audit: {
            name: "Galactic Tax Audit",
            icon: "fa-file-invoice",
            description: "The Vogon bureaucracy has selected you for a random tax audit. They're very thorough and very, very slow.",
            effects: [
                "Lose 10% of your credits to 'processing fees'",
                "Lose 1 turn dealing with paperwork"
            ],
            execute: function (game) {
                const taxAmount = Math.round(game.player.credits * 0.1);
                game.player.credits -= taxAmount;
                game.player.skipTurns = 1;
                game.addMessage(`You've been audited by Vogon tax collectors. They took ${taxAmount} Altairian Dollars.`, "danger");
            }
        },
        market_crash: {
            name: "Market Crash",
            icon: "fa-chart-line",
            description: "The galactic stock market has crashed! Prices are fluctuating wildly and traders are panicking.",
            effects: [
                "All commodity prices are highly volatile",
                "Some rare buying opportunities may emerge"
            ],
            execute: function (game) {
                game.marketCrashActive = 10; // Effects last for 10 turns
                game.addMessage("A galactic market crash has occurred! Prices will be volatile for several turns.", "warning");
            }
        },
        guide_update: {
            name: "Hitchhiker's Guide Update",
            icon: "fa-tablet",
            description: "Your copy of the Hitchhiker's Guide has received a significant update with new market information.",
            effects: [
                "You gain insight on current market conditions",
                "+10% to all trading profits for the next 3 turns"
            ],
            execute: function (game) {
                game.player.tradingBonus = 0.1; // 10% bonus
                game.player.tradingBonusTurns = 3;
                game.addMessage("Your Guide has updated with new market information! Trading bonus active for 3 turns.", "success");
            }
        },
        babel_fish_shortage: {
            name: "Babel Fish Shortage",
            icon: "fa-fish",
            description: "A galaxy-wide shortage of Babel Fish has occurred due to overfishing in the Barnard's Star system.",
            effects: [
                "Babel Fish prices have tripled everywhere",
                "Limited stock available"
            ],
            execute: function (game) {
                game.babelFishShortageActive = 5; // Effects last for 5 turns
                game.addMessage("There's a Babel Fish shortage! Prices have skyrocketed.", "warning");
            }
        },
        beach_party: {
            name: "Beach Party on Ursa Minor Beta",
            icon: "fa-umbrella-beach",
            description: "The perpetually sunny beaches of Ursa Minor Beta are hosting the galaxy's biggest party. Everyone who's anyone is attending.",
            effects: [
                "Meet influential traders",
                "+0.1 reputation with all species",
                "Free drinks!"
            ],
            execute: function (game) {
                for (const species in game.player.reputation) {
                    game.player.reputation[species] += 0.1;
                    if (game.player.reputation[species] > 1) game.player.reputation[species] = 1;
                }
                game.addToInventory("jynnan_tonnyx", 2);
                game.addMessage("You attended a fantastic beach party and made some connections!", "success");
            }
        },
        ultimate_answer: {
            name: "Ultimate Answer Revealed",
            icon: "fa-square-root-alt",
            description: "Deep Thought is giving a rare public lecture on the Answer to the Ultimate Question of Life, the Universe, and Everything.",
            effects: [
                "The Answer is 42",
                "But what was the Question?",
                "Gain a unique trading opportunity"
            ],
            execute: function (game) {
                game.player.hasUltimateAnswer = true;
                game.addToInventory("towel", 1); // Everyone gets a commemorative towel
                game.addMessage("You attended Deep Thought's lecture. The Answer is 42, but what was the Question?", "success");
            }
        },
        computational_error: {
            name: "Computational Error",
            icon: "fa-exclamation-triangle",
            description: "Deep Thought's child computers are experiencing technical difficulties, causing errors in financial systems across the galaxy.",
            effects: [
                "Random price changes",
                "Banking systems temporarily down",
                "Cannot sell items for 1 turn"
            ],
            execute: function (game) {
                game.player.cannotSell = 1; // Cannot sell for 1 turn
                game.addMessage("Banking systems are down due to a computational error! Can't sell items until systems are back online.", "danger");
            }
        },
        bugblatter_attack: {
            name: "Ravenous Bugblatter Beast Attack",
            icon: "fa-dragon",
            description: "A Ravenous Bugblatter Beast of Traal is rampaging through the area! These creatures are incredibly stupid but incredibly dangerous.",
            effects: [
                "Lose random inventory items unless you have a towel",
                "If you have a towel, you can wrap it around your head so the beast thinks it can't see you"
            ],
            execute: function (game) {
                if (game.player.towelUsed || game.hasItemInInventory("towel")) {
                    game.addMessage("The Ravenous Bugblatter Beast can't see you because you wrapped your towel around your head. (Or it thinks it can't. It's not very bright.)", "success");
                    if (!game.player.towelUsed && game.hasItemInInventory("towel")) {
                        game.player.towelUsed = true;
                        game.addMessage("You used your towel to hide from the Bugblatter Beast!", "success");
                    }
                } else {
                    // Lose a random item if you have any
                    if (game.player.inventory.length > 0) {
                        const randomIndex = Math.floor(Math.random() * game.player.inventory.length);
                        const lostItem = game.player.inventory[randomIndex];
                        game.player.inventory.splice(randomIndex, 1);
                        game.addMessage(`The Ravenous Bugblatter Beast stole your ${gameData.items[lostItem.itemId].name}!`, "danger");
                    } else {
                        game.addMessage("The Ravenous Bugblatter Beast tried to eat you, but found you unappetizing and wandered off.", "warning");
                    }
                }
            }
        },
        towel_day: {
            name: "Galactic Towel Day",
            icon: "fa-bath",
            description: "It's Towel Day across the galaxy! Everyone is celebrating by carrying towels and trading them as a sign of hitchhiker solidarity.",
            effects: [
                "Towel prices are at premium rates",
                "Free commemorative towel",
                "Special towel-related trading opportunities"
            ],
            execute: function (game) {
                game.towelDayActive = 3; // Effects last for 3 turns
                game.addToInventory("towel", 1); // Everyone gets a commemorative towel
                game.addMessage("Happy Towel Day! You received a commemorative towel.", "success");
            }
        },
        heart_of_gold_visit: {
            name: "Heart of Gold Docking",
            icon: "fa-rocket",
            description: "The legendary starship Heart of Gold, powered by the Infinite Improbability Drive, has docked nearby! Its crew is trading exotic items.",
            effects: [
                "Special items available for purchase",
                "Chance to acquire Infinite Improbability Drive Parts",
                "Zaphod Beeblebrox is offering autographs for just 50 Altairian Dollars"
            ],
            execute: function (game) {
                game.addToInventory("infinite_improbability_drive_parts", 1);
                game.heartOfGoldActive = true;
                game.addMessage("The Heart of Gold has docked! You received an Infinite Improbability Drive Part as a souvenir.", "success");
            }
        },
        improbability_cascade: {
            name: "Infinite Improbability Cascade",
            icon: "fa-random",
            description: "A nearby test of an Infinite Improbability Drive has caused a reality cascade! Extremely unlikely events are temporarily very likely.",
            effects: [
                "Random teleportation possible",
                "Items might transform into other items",
                "Extremely volatile market prices"
            ],
            execute: function (game) {
                // 50% chance of teleporting to a random location
                if (Math.random() < 0.5) {
                    const locations = Object.keys(gameData.locations);
                    const randomLocation = locations[Math.floor(Math.random() * locations.length)];
                    if (randomLocation !== game.player.location) {
                        game.player.location = randomLocation;
                        game.addMessage(`The improbability cascade has teleported you to ${gameData.locations[randomLocation].name}!`, "warning");
                    }
                }

                // 50% chance of transforming a random item
                if (game.player.inventory.length > 0 && Math.random() < 0.5) {
                    const randomIndex = Math.floor(Math.random() * game.player.inventory.length);
                    const oldItem = game.player.inventory[randomIndex];

                    // Get a random new item
                    const itemIds = Object.keys(gameData.items);
                    const newItemId = itemIds[Math.floor(Math.random() * itemIds.length)];

                    game.player.inventory[randomIndex] = {
                        itemId: newItemId,
                        quantity: oldItem.quantity
                    };

                    game.addMessage(`Your ${gameData.items[oldItem.itemId].name} has improbably transformed into ${gameData.items[newItemId].name}!`, "warning");
                }

                game.improbabilityCascadeActive = 3; // Effects last for 3 turns
            }
        },
        restaurant_reservation: {
            name: "Reservation at Milliways",
            icon: "fa-utensils",
            description: "You've won a free dinner reservation at Milliways, the Restaurant at the End of the Universe! Time travel is included.",
            effects: [
                "Meet diners from various time periods",
                "Gain market insights from the future",
                "All-you-can-eat buffet (gains 3 Algolian Zylatburgers)"
            ],
            execute: function (game) {
                game.addToInventory("algolian_zylatburger", 3);
                game.milliwaysInsight = true;
                game.addMessage("You enjoyed a meal at the Restaurant at the End of the Universe and brought back some leftovers!", "success");
            }
        },
        end_of_universe: {
            name: "End of the Universe Show",
            icon: "fa-meteor",
            description: "You've arrived just in time for the big End of the Universe show at Milliways! The ultimate dinner theater experience.",
            effects: [
                "Profound existential insights",
                "Spectacular view",
                "Complementary Pan Galactic Gargle Blaster"
            ],
            execute: function (game) {
                game.addToInventory("pan_galactic_gargle_blaster", 1);
                game.player.hasSeenEndOfUniverse = true;
                game.addMessage("You witnessed the End of the Universe! It was spectacular, and you got a free drink.", "success");
            }
        },
        planet_construction: {
            name: "Planet Construction Tour",
            icon: "fa-globe",
            description: "The Magratheans are offering a rare tour of their planet construction facilities. Few outsiders ever get this opportunity.",
            effects: [
                "Learn about custom planet design",
                "Increase reputation with Magratheans",
                "Opportunity to place an order (if you have 1,000,000 Altairian Dollars)"
            ],
            execute: function (game) {
                game.player.reputation.magratheans = Math.min(1, game.player.reputation.magratheans + 0.3);
                game.magratheaTourComplete = true;

                if (game.player.credits >= 1000000) {
                    game.canOrderEarth = true;
                    game.addMessage("The Magratheans are impressed with your wealth and are willing to build you a new Earth!", "success");
                } else {
                    game.addMessage("You took the Magrathean planet construction tour. If only you had 1,000,000 Altairian Dollars to place an order...", "info");
                }
            }
        },
        white_mice_encounter: {
            name: "Meeting with White Mice",
            icon: "fa-question",
            description: "Two white mice want to speak with you. They seem unusually intelligent and are offering a substantial reward for your brain.",
            effects: [
                "They claim to be the most intelligent species on Earth",
                "They're offering 1,000,000 Altairian Dollars for your brain",
                "Something about an Ultimate Question..."
            ],
            execute: function (game) {
                game.whiteMouseOffer = true;
                game.addMessage("Two white mice have offered to buy your brain for 1,000,000 Altairian Dollars. This seems suspicious.", "warning");

                // Create a choice for the player
                game.showEventModal("White Mice Proposal", "fa-question",
                    "The white mice explain that they've been looking for the Ultimate Question to the Ultimate Answer of Life, the Universe, and Everything. They believe your brain might hold the key.",
                    ["They're offering 1,000,000 Altairian Dollars for your brain",
                        "This would, unfortunately, be fatal for you",
                        "But you'd technically win the game",
                        "What do you do?"]);

                // We'll handle the choice in the main game logic
            }
        }
    },

    // Species
    species: {
        humans: {
            name: "Humans",
            description: "Mostly harmless. Notable for thinking digital watches are a neat idea."
        },
        vogons: {
            name: "Vogons",
            description: "Bureaucratic, officious, and callous. Notable for their poetry, which is the third worst in the universe."
        },
        betelgeusians: {
            name: "Betelgeusians",
            description: "Traders from Betelgeuse. Have an extra arm, which is useful for counting money."
        },
        dentrassi: {
            name: "Dentrassi",
            description: "Cooks who work on Vogon ships. Known for their hospitality and love of Pan Galactic Gargle Blasters."
        },
        magratheans: {
            name: "Magratheans",
            description: "Planet designers from the ancient times of prosperity. Recently returned from economic hibernation."
        }
    }
};

// Game State
const gameState = {
    player: {
        credits: 1000,
        location: "earth",
        inventory: [],
        reputation: {
            humans: 1.0,
            vogons: 0.2,
            betelgeusians: 0.5,
            dentrassi: 0.5,
            magratheans: 0.0
        },
        visitedLocations: ["earth"],
        turnCount: 1,
        skipTurns: 0,
        mustLeave: false,
        towelUsed: false,
        babelFishUsed: false,
        tradingBonus: 0,
        tradingBonusTurns: 0,
        cannotSell: 0,
        hasUltimateAnswer: false,
        hasSeenEndOfUniverse: false
    },
    marketCrashActive: 0,
    babelFishShortageActive: 0,
    towelDayActive: 0,
    improbabilityCascadeActive: 0,
    heartOfGoldActive: false,
    milliwaysInsight: false,
    magratheaTourComplete: false,
    canOrderEarth: false,
    whiteMouseOffer: false,
    gameCompleted: false,
    messages: []
};

// Game controller
const game = {
    // Initialize the game
    init: function () {
        this.setupEventListeners();
        this.resetGame();
    },

    // Reset game to starting state
    resetGame: function () {
        // Clone the initial game state
        this.player = JSON.parse(JSON.stringify(gameState.player));
        this.marketCrashActive = gameState.marketCrashActive;
        this.babelFishShortageActive = gameState.babelFishShortageActive;
        this.towelDayActive = gameState.towelDayActive;
        this.improbabilityCascadeActive = gameState.improbabilityCascadeActive;
        this.heartOfGoldActive = gameState.heartOfGoldActive;
        this.milliwaysInsight = gameState.milliwaysInsight;
        this.magratheaTourComplete = gameState.magratheaTourComplete;
        this.canOrderEarth = gameState.canOrderEarth;
        this.whiteMouseOffer = gameState.whiteMouseOffer;
        this.gameCompleted = gameState.gameCompleted;
        this.messages = [];

        // Add starting items
        this.addToInventory("towel", 1);
        this.addToInventory("guide", 1);

        // Add initial message
        this.addMessage("Welcome to Pan-Galactic Gargle Trading. Don't Panic!");
    },

    // Setup event listeners
    setupEventListeners: function () {
        // Start screen buttons
        document.getElementById('start-new-game').addEventListener('click', () => {
            this.showScreen('game-screen');
            this.resetGame();
            this.updateUI();
        });

        document.getElementById('game-instructions').addEventListener('click', () => {
            this.showScreen('instructions-screen');
        });

        document.getElementById('back-to-start').addEventListener('click', () => {
            this.showScreen('start-screen');
        });

        // Tab navigation
        document.querySelectorAll('.tab').forEach(tab => {
            tab.addEventListener('click', () => {
                // Remove active class from all tabs
                document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
                document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));

                // Add active class to clicked tab
                tab.classList.add('active');

                // Show corresponding tab content
                const tabId = tab.getAttribute('data-tab');
                document.getElementById(tabId).classList.add('active');
            });
        });

        // Modal buttons
        document.getElementById('cancel-trade').addEventListener('click', () => {
            document.getElementById('trade-modal').style.display = 'none';
        });

        document.getElementById('confirm-trade').addEventListener('click', () => {
            this.completeTrade();
        });

        document.getElementById('acknowledge-event').addEventListener('click', () => {
            document.getElementById('event-modal').style.display = 'none';
        });

        // Trade quantity controls
        document.getElementById('decrease-quantity').addEventListener('click', () => {
            const input = document.getElementById('trade-quantity-input');
            const value = parseInt(input.value);
            if (value > 1) input.value = value - 1;
            this.updateTradeTotal();
        });

        document.getElementById('increase-quantity').addEventListener('click', () => {
            const input = document.getElementById('trade-quantity-input');
            const value = parseInt(input.value);
            input.value = value + 1;
            this.updateTradeTotal();
        });

        document.getElementById('trade-quantity-input').addEventListener('change', () => {
            this.updateTradeTotal();
        });

        // Improbability Drive button
        document.getElementById('improbability-drive').addEventListener('click', () => {
            if (this.hasItemInInventory("infinite_improbability_drive_parts", 1)) {
                this.activateImprobabilityDrive();
            }
        });
    },

    // Show a specific screen
    showScreen: function (screenId) {
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        document.getElementById(screenId).classList.add('active');
    },

    // Add a message to the terminal
    addMessage: function (message, type = "info") {
        const messageElement = document.createElement('div');
        messageElement.className = `message message-${type}`;
        messageElement.textContent = message;

        const terminal = document.getElementById('terminal-messages');
        terminal.insertBefore(messageElement, terminal.firstChild);

        // Keep only the latest 20 messages
        this.messages.unshift({ text: message, type: type });
        if (this.messages.length > 20) this.messages.pop();
    },

    // Update all UI elements
    updateUI: function () {
        this.updateLocationInfo();
        this.updatePlayerInfo();
        this.updateMarket();
        this.updateInventory();
        this.updateTravelOptions();
        this.updateMessages();
    },

    // Update location information
    updateLocationInfo: function () {
        const location = gameData.locations[this.player.location];
        document.getElementById('current-location').textContent = location.name;
        document.getElementById('location-name').textContent = location.name;
        document.getElementById('location-description').textContent = location.description;

        // Update reputation bars
        const reputationBars = document.querySelector('.reputation-bars');
        reputationBars.innerHTML = '';

        for (const species in this.player.reputation) {
            const speciesData = gameData.species[species];
            const reputationValue = this.player.reputation[species];

            const barContainer = document.createElement('div');
            barContainer.className = 'reputation-bar';

            const label = document.createElement('div');
            label.className = 'reputation-bar-label';
            label.textContent = speciesData.name;

            const barOuter = document.createElement('div');
            barOuter.className = 'reputation-bar-outer';

            const barInner = document.createElement('div');
            barInner.className = 'reputation-bar-inner';
            barInner.style.width = `${reputationValue * 100}%`;

            barOuter.appendChild(barInner);
            barContainer.appendChild(label);
            barContainer.appendChild(barOuter);
            reputationBars.appendChild(barContainer);
        }

        // Check if Improbability Drive is available
        const improbabilityDriveButton = document.getElementById('improbability-drive');
        if (this.hasItemInInventory("infinite_improbability_drive_parts", 1)) {
            improbabilityDriveButton.disabled = false;
        } else {
            improbabilityDriveButton.disabled = true;
        }
    },

    // Update player information
    updatePlayerInfo: function () {
        document.getElementById('player-credits').textContent = this.player.credits;
        document.getElementById('turn-count').textContent = this.player.turnCount;
    },

    // Update market information
    updateMarket: function () {
        const location = gameData.locations[this.player.location];
        const marketTable = document.getElementById('market-items');
        marketTable.innerHTML = '';

        const availableItems = location.availableItems || [];

        for (const itemId of availableItems) {
            const item = gameData.items[itemId];
            const row = document.createElement('tr');

            // Item name with icon
            const nameCell = document.createElement('td');
            nameCell.innerHTML = `<i class="fas ${item.icon}"></i> ${item.name}`;

            // Buy price
            const buyPrice = this.calculatePrice(item, location, true);
            const buyCell = document.createElement('td');
            buyCell.textContent = `${buyPrice} ⓐ`;

            // Sell price
            const sellPrice = this.calculatePrice(item, location, false);
            const sellCell = document.createElement('td');
            sellCell.textContent = `${sellPrice} ⓐ`;

            // Action buttons
            const actionCell = document.createElement('td');

            // Buy button
            const buyButton = document.createElement('button');
            buyButton.className = 'buy-button';
            buyButton.innerHTML = '<i class="fas fa-shopping-cart"></i> Buy';
            buyButton.addEventListener('click', () => {
                this.openBuyModal(itemId, buyPrice);
            });

            // Sell button
            const sellButton = document.createElement('button');
            sellButton.className = 'sell-button';
            sellButton.innerHTML = '<i class="fas fa-dollar-sign"></i> Sell';
            sellButton.addEventListener('click', () => {
                this.openSellModal(itemId, sellPrice);
            });

            // Only enable sell if player has the item
            if (!this.hasItemInInventory(itemId) || this.player.cannotSell > 0) {
                sellButton.disabled = true;
            }

            actionCell.appendChild(buyButton);
            actionCell.appendChild(document.createTextNode(' '));
            actionCell.appendChild(sellButton);

            row.appendChild(nameCell);
            row.appendChild(buyCell);
            row.appendChild(sellCell);
            row.appendChild(actionCell);

            marketTable.appendChild(row);
        }
    },

    // Update inventory information
    updateInventory: function () {
        const inventoryTable = document.getElementById('inventory-items');
        inventoryTable.innerHTML = '';

        for (const inventoryItem of this.player.inventory) {
            const itemId = inventoryItem.itemId;
            const quantity = inventoryItem.quantity;
            const item = gameData.items[itemId];

            const row = document.createElement('tr');

            // Item name with icon
            const nameCell = document.createElement('td');
            nameCell.innerHTML = `<i class="fas ${item.icon}"></i> ${item.name}`;

            // Quantity
            const quantityCell = document.createElement('td');
            quantityCell.textContent = quantity;

            // Value (at current location)
            const location = gameData.locations[this.player.location];
            const sellPrice = this.calculatePrice(item, location, false);
            const valueCell = document.createElement('td');
            valueCell.textContent = `${sellPrice * quantity} ⓐ`;

            // Action buttons
            const actionCell = document.createElement('td');

            // Sell button
            const sellButton = document.createElement('button');
            sellButton.className = 'sell-button';
            sellButton.innerHTML = '<i class="fas fa-dollar-sign"></i> Sell';
            sellButton.addEventListener('click', () => {
                this.openSellModal(itemId, sellPrice);
            });

            if (this.player.cannotSell > 0) {
                sellButton.disabled = true;
            }

            actionCell.appendChild(sellButton);

            // Use button (if item is usable)
            if (item.usable) {
                const useButton = document.createElement('button');
                useButton.className = 'use-button';
                useButton.innerHTML = '<i class="fas fa-hand-paper"></i> Use';
                useButton.addEventListener('click', () => {
                    this.useItem(itemId);
                });

                actionCell.appendChild(document.createTextNode(' '));
                actionCell.appendChild(useButton);
            }

            row.appendChild(nameCell);
            row.appendChild(quantityCell);
            row.appendChild(valueCell);
            row.appendChild(actionCell);

            inventoryTable.appendChild(row);
        }

        // If inventory is empty, show a message
        if (this.player.inventory.length === 0) {
            const row = document.createElement('tr');
            const cell = document.createElement('td');
            cell.colSpan = 4;
            cell.textContent = "Your inventory is empty. Buy some items to get started!";
            cell.style.textAlign = "center";
            row.appendChild(cell);
            inventoryTable.appendChild(row);
        }
    },

    // Update travel options
    updateTravelOptions: function () {
        const location = gameData.locations[this.player.location];
        const travelContainer = document.getElementById('travel-destinations');
        travelContainer.innerHTML = '';

        if (!location.travelCosts) return;

        for (const destinationId in location.travelCosts) {
            const destination = gameData.locations[destinationId];
            const cost = location.travelCosts[destinationId];
            const travelTime = location.travelTime[destinationId];

            const travelOption = document.createElement('div');
            travelOption.className = 'travel-option';

            // If player doesn't have enough credits, disable option
            if (this.player.credits < cost) {
                travelOption.classList.add('disabled');
            }

            // If destination requires items the player doesn't have, disable option
            let requirementsMet = true;
            let requirementsText = '';

            if (destination.requiredItems) {
                for (const requiredItemId in destination.requiredItems) {
                    const requiredQuantity = destination.requiredItems[requiredItemId];
                    if (!this.hasItemInInventory(requiredItemId, requiredQuantity)) {
                        requirementsMet = false;
                        requirementsText += `<div class="travel-requirement">Requires: ${requiredQuantity} ${gameData.items[requiredItemId].name}</div>`;
                    }
                }

                if (!requirementsMet) {
                    travelOption.classList.add('disabled');
                }
            }

            // Special case: Magrathea is hidden until certain conditions are met
            if (destinationId === 'magrathea' && !this.canTravelToMagrathea()) {
                continue; // Skip this destination
            }

            const nameElement = document.createElement('div');
            nameElement.className = 'travel-option-name';
            nameElement.innerHTML = `<i class="fas fa-rocket"></i> ${destination.name}`;

            const costElement = document.createElement('div');
            costElement.className = 'travel-option-cost';
            costElement.innerHTML = `<i class="fas fa-money-bill-wave"></i> ${cost} Altairian Dollars`;

            const timeElement = document.createElement('div');
            timeElement.className = 'travel-option-time';
            timeElement.innerHTML = `<i class="fas fa-hourglass-half"></i> ${travelTime} Day${travelTime !== 1 ? 's' : ''}`;

            travelOption.appendChild(nameElement);
            travelOption.appendChild(costElement);
            travelOption.appendChild(timeElement);

            if (requirementsText) {
                travelOption.innerHTML += requirementsText;
            }

            // Add click event only if requirements are met and player has enough credits
            if (requirementsMet && this.player.credits >= cost) {
                travelOption.addEventListener('click', () => {
                    this.travel(destinationId);
                });
            }

            travelContainer.appendChild(travelOption);
        }
    },

    // Update terminal messages
    updateMessages: function () {
        const messagesContainer = document.getElementById('terminal-messages');
        messagesContainer.innerHTML = '';

        for (const message of this.messages) {
            const messageElement = document.createElement('div');
            messageElement.className = `message message-${message.type}`;
            messageElement.textContent = message.text;
            messagesContainer.appendChild(messageElement);
        }
    },

    // Calculate price for an item at a location
    calculatePrice: function (item, location, isBuying) {
        const basePrice = item.baseValue;
        const locationModifier = location.marketModifiers[item.id] || 1.0;
        const volatility = item.volatility;

        // Seed random based on turn count, location and item for consistent prices
        const seed = this.player.turnCount + location.id.charCodeAt(0) + item.id.charCodeAt(0);
        const random = this.seededRandom(seed);

        // Calculate market fluctuation
        let fluctuation = 1 + (random * volatility * 2 - volatility);

        // Apply market crash modifier if active
        if (this.marketCrashActive > 0) {
            fluctuation *= 0.7 + Math.random() * 0.6; // 0.7 to 1.3 multiplier
        }

        // Apply Babel Fish shortage modifier
        if (this.babelFishShortageActive > 0 && item.id === 'babel_fish') {
            fluctuation *= 3; // Triple the price
        }

        // Apply Towel Day modifier
        if (this.towelDayActive > 0 && item.id === 'towel') {
            fluctuation *= 2; // Double the price
        }

        // Apply improbability cascade modifier
        if (this.improbabilityCascadeActive > 0) {
            fluctuation *= 0.5 + Math.random() * 1.5; // 0.5 to 2.0 multiplier
        }

        // Apply reputation modifier
        let reputationModifier = 1.0;
        for (const species in this.player.reputation) {
            // Only apply if item has a special effect for this species
            if (item.specialEffects && item.specialEffects[`${species}_reputation`]) {
                const repEffect = this.player.reputation[species] - 0.5; // -0.5 to 0.5
                reputationModifier -= repEffect * 0.2; // Up to 10% discount
            }
        }

        // Apply trading bonus if active
        if (this.player.tradingBonusTurns > 0 && !isBuying) {
            reputationModifier -= this.player.tradingBonus; // Apply sale bonus
        }

        // Apply buying/selling spread
        const buyingModifier = isBuying ? 1.1 : 0.9; // 10% markup when buying, 10% markdown when selling

        // Calculate final price
        let finalPrice = basePrice * locationModifier * fluctuation * reputationModifier * buyingModifier;

        // Round to nearest whole number
        return Math.round(finalPrice);
    },

    // Seeded random number generator
    seededRandom: function (seed) {
        const x = Math.sin(seed) * 10000;
        return x - Math.floor(x);
    },

    // Travel to a new location
    travel: function (destinationId) {
        const currentLocation = gameData.locations[this.player.location];
        const cost = currentLocation.travelCosts[destinationId];
        const travelTime = currentLocation.travelTime[destinationId];

        // Check if player has enough credits
        if (this.player.credits < cost) {
            this.addMessage(`You don't have enough credits to travel to ${gameData.locations[destinationId].name}.`, "danger");
            return;
        }

        // Deduct cost
        this.player.credits -= cost;

        // Update location
        this.player.location = destinationId;

        // Add to visited locations if first time
        if (!this.player.visitedLocations.includes(destinationId)) {
            this.player.visitedLocations.push(destinationId);
        }

        // Advance time
        for (let i = 0; i < travelTime; i++) {
            this.advanceTurn(false); // Don't trigger events during travel
        }

        // Show arrival message
        this.addMessage(`You have arrived at ${gameData.locations[destinationId].name}.`, "success");

        // Special case for Earth destruction
        if (this.player.mustLeave && this.player.location !== 'earth') {
            this.player.mustLeave = false;
            this.addMessage("You escaped Earth just before its destruction. Good timing!", "success");
        }

        // Check for random event
        this.checkForRandomEvent();

        // Update UI
        this.updateUI();
    },

    // Advance to the next turn
    advanceTurn: function (checkForEvents = true) {
        // Increment turn counter
        this.player.turnCount++;

        // Check if player must leave Earth
        if (this.player.mustLeave && this.player.location === 'earth') {
            this.addMessage("Earth has been destroyed! Game over.", "danger");
            this.gameOver(false);
            return;
        }

        // Reduce active effects counters
        if (this.marketCrashActive > 0) this.marketCrashActive--;
        if (this.babelFishShortageActive > 0) this.babelFishShortageActive--;
        if (this.towelDayActive > 0) this.towelDayActive--;
        if (this.improbabilityCascadeActive > 0) this.improbabilityCascadeActive--;
        if (this.player.tradingBonusTurns > 0) this.player.tradingBonusTurns--;
        if (this.player.cannotSell > 0) this.player.cannotSell--;

        // Process perishable items
        this.processPerishableItems();

        // Check for random event
        if (checkForEvents) {
            this.checkForRandomEvent();
        }

        // Check win condition
        this.checkWinCondition();

        // Update UI
        this.updateUI();
    },

    // Process perishable items
    processPerishableItems: function () {
        // Make a copy of the inventory to avoid issues with splicing during iteration
        const inventory = [...this.player.inventory];

        for (let i = 0; i < inventory.length; i++) {
            const inventoryItem = inventory[i];
            const item = gameData.items[inventoryItem.itemId];

            if (item.perishable) {
                // Find the actual item in the player's inventory
                const actualItemIndex = this.player.inventory.findIndex(
                    item => item.itemId === inventoryItem.itemId
                );

                if (actualItemIndex !== -1) {
                    // Remove one unit of the perishable item
                    this.player.inventory[actualItemIndex].quantity--;

                    // If quantity is now 0, remove the item from inventory
                    if (this.player.inventory[actualItemIndex].quantity <= 0) {
                        this.player.inventory.splice(actualItemIndex, 1);
                    }

                    this.addMessage(`Your ${item.name} has perished.`, "warning");
                }
            }
        }
    },

    // Check for random event
    checkForRandomEvent: function () {
        const location = gameData.locations[this.player.location];

        // No events if there are none defined for this location
        if (!location.events || location.events.length === 0) return;

        // 30% chance of an event
        if (Math.random() < 0.3) {
            // Select a random event from the location's event list
            const eventId = location.events[Math.floor(Math.random() * location.events.length)];
            const event = gameData.events[eventId];

            // Execute the event
            event.execute(this);

            // Show event modal
            this.showEventModal(event.name, event.icon, event.description, event.effects);
        }
    },

    // Show event modal
    showEventModal: function (title, icon, description, effects) {
        document.getElementById('event-modal-title').textContent = title;
        document.getElementById('event-icon').innerHTML = `<i class="fas ${icon}"></i>`;
        document.getElementById('event-description').textContent = description;

        const effectsContainer = document.getElementById('event-effects');
        effectsContainer.innerHTML = '';

        for (const effect of effects) {
            const effectElement = document.createElement('div');
            effectElement.textContent = effect;
            effectsContainer.appendChild(effectElement);
        }

        document.getElementById('event-modal').style.display = 'flex';
    },

    // Open buy modal
    openBuyModal: function (itemId, price) {
        const item = gameData.items[itemId];

        document.getElementById('trade-modal-title').textContent = `Buy ${item.name}`;
        document.getElementById('trade-item-name').textContent = item.name;
        document.getElementById('trade-item-description').textContent = item.description;

        // Reset quantity
        document.getElementById('trade-quantity-input').value = 1;

        // Calculate maximum affordable quantity
        const maxQuantity = Math.floor(this.player.credits / price);
        document.getElementById('trade-quantity-input').max = maxQuantity;

        // Update total
        this.currentTradeItemId = itemId;
        this.currentTradePrice = price;
        this.currentTradeIsBuying = true;
        this.updateTradeTotal();

        document.getElementById('trade-modal').style.display = 'flex';
    },

    // Open sell modal
    openSellModal: function (itemId, price) {
        const item = gameData.items[itemId];
        const inventory = this.player.inventory.find(i => i.itemId === itemId);

        if (!inventory) return;

        document.getElementById('trade-modal-title').textContent = `Sell ${item.name}`;
        document.getElementById('trade-item-name').textContent = item.name;
        document.getElementById('trade-item-description').textContent = item.description;

        // Reset quantity
        document.getElementById('trade-quantity-input').value = 1;
        document.getElementById('trade-quantity-input').max = inventory.quantity;

        // Update total
        this.currentTradeItemId = itemId;
        this.currentTradePrice = price;
        this.currentTradeIsBuying = false;
        this.updateTradeTotal();

        document.getElementById('trade-modal').style.display = 'flex';
    },

    // Update trade total in modal
    updateTradeTotal: function () {
        const quantity = parseInt(document.getElementById('trade-quantity-input').value);
        const total = quantity * this.currentTradePrice;

        document.getElementById('trade-total-cost').textContent = total;
    },

    // Complete trade
    completeTrade: function () {
        const quantity = parseInt(document.getElementById('trade-quantity-input').value);
        const totalCost = quantity * this.currentTradePrice;
        const item = gameData.items[this.currentTradeItemId];

        if (this.currentTradeIsBuying) {
            // Buying
            if (this.player.credits < totalCost) {
                this.addMessage(`You don't have enough credits to buy ${quantity} ${item.name}.`, "danger");
                return;
            }

            // Deduct credits
            this.player.credits -= totalCost;

            // Add item to inventory
            this.addToInventory(this.currentTradeItemId, quantity);

            this.addMessage(`You bought ${quantity} ${item.name} for ${totalCost} Altairian Dollars.`, "success");
        } else {
            // Selling
            // Check if player has enough of the item
            if (!this.hasItemInInventory(this.currentTradeItemId, quantity)) {
                this.addMessage(`You don't have enough ${item.name} to sell.`, "danger");
                return;
            }

            // Add credits
            this.player.credits += totalCost;

            // Remove item from inventory
            this.removeFromInventory(this.currentTradeItemId, quantity);

            this.addMessage(`You sold ${quantity} ${item.name} for ${totalCost} Altairian Dollars.`, "success");

            // If selling to Magratheans, improve reputation
            if (this.player.location === 'magrathea') {
                this.player.reputation.magratheans = Math.min(1, this.player.reputation.magratheans + 0.05);
            }
        }

        // Close modal
        document.getElementById('trade-modal').style.display = 'none';

        // Update UI
        this.updateUI();

        // Advance turn after trading
        this.advanceTurn();
    },

    // Add item to inventory
    addToInventory: function (itemId, quantity) {
        const existingItem = this.player.inventory.find(i => i.itemId === itemId);

        if (existingItem) {
            existingItem.quantity += quantity;
        } else {
            this.player.inventory.push({
                itemId: itemId,
                quantity: quantity
            });
        }
    },

    // Remove item from inventory
    removeFromInventory: function (itemId, quantity) {
        const itemIndex = this.player.inventory.findIndex(i => i.itemId === itemId);

        if (itemIndex === -1) return false;

        this.player.inventory[itemIndex].quantity -= quantity;

        if (this.player.inventory[itemIndex].quantity <= 0) {
            this.player.inventory.splice(itemIndex, 1);
        }

        return true;
    },

    // Check if player has an item in inventory
    hasItemInInventory: function (itemId, quantity = 1) {
        const item = this.player.inventory.find(i => i.itemId === itemId);
        return item && item.quantity >= quantity;
    },

    // Use an item
    useItem: function (itemId) {
        const item = gameData.items[itemId];

        if (!item.usable) {
            this.addMessage(`${item.name} cannot be used.`, "warning");
            return;
        }

        // Call the item's use function
        const keepItem = item.use(this);

        // If the item should be consumed, remove it from inventory
        if (!keepItem) {
            this.removeFromInventory(itemId, 1);
        }

        // Update UI
        this.updateUI();
    },

    // Activate Infinite Improbability Drive
    activateImprobabilityDrive: function () {
        // Check if player has the drive parts
        if (!this.hasItemInInventory("infinite_improbability_drive_parts", 1)) {
            this.addMessage("You need Infinite Improbability Drive Parts to activate the drive.", "danger");
            return;
        }

        this.addMessage("You activate the Infinite Improbability Drive! Reality fluctuates wildly around you...", "warning");

        // 50% chance of teleporting to a random location
        if (Math.random() < 0.5) {
            // Get all accessible locations except current one
            const locations = Object.keys(gameData.locations).filter(
                id => id !== this.player.location &&
                    (!gameData.locations[id].requiredItems || this.canTravelToLocation(id))
            );

            // If no other locations are accessible, stay put
            if (locations.length === 0) {
                this.addMessage("The drive whirs and clicks, but you remain where you are.", "warning");
                return;
            }

            // Select a random location
            const randomLocation = locations[Math.floor(Math.random() * locations.length)];

            // Special case: small chance to access Magrathea even if normally inaccessible
            if (Math.random() < 0.1 && !locations.includes('magrathea')) {
                this.addMessage("The Infinite Improbability Drive has done something highly improbable: it's taken you to Magrathea!", "success");
                this.player.location = 'magrathea';
            } else {
                this.addMessage(`The Infinite Improbability Drive has teleported you to ${gameData.locations[randomLocation].name}!`, "success");
                this.player.location = randomLocation;
            }
        } else {
            // Otherwise, trigger a random event
            this.addMessage("The drive activates but fizzles out. Something strange happens instead...", "warning");

            // Get all possible events
            const events = Object.keys(gameData.events);
            const randomEvent = events[Math.floor(Math.random() * events.length)];

            // Execute the event
            gameData.events[randomEvent].execute(this);

            // Show event modal
            const event = gameData.events[randomEvent];
            this.showEventModal(
                event.name,
                event.icon,
                "The Infinite Improbability Drive caused: " + event.description,
                event.effects
            );
        }

        // Consume one drive part
        this.removeFromInventory("infinite_improbability_drive_parts", 1);

        // Update UI
        this.updateUI();

        // Advance turn
        this.advanceTurn();
    },

    // Check if player can travel to Magrathea
    canTravelToMagrathea: function () {
        // Need 5 Infinite Improbability Drive Parts and a Babel Fish
        return this.hasItemInInventory("infinite_improbability_drive_parts", 5) &&
            this.hasItemInInventory("babel_fish", 1);
    },

    // Check if player can travel to a specific location
    canTravelToLocation: function (locationId) {
        const location = gameData.locations[locationId];

        // If no requirements, always accessible
        if (!location.requiredItems) return true;

        // Check each required item
        for (const itemId in location.requiredItems) {
            const requiredQuantity = location.requiredItems[itemId];
            if (!this.hasItemInInventory(itemId, requiredQuantity)) {
                return false;
            }
        }

        return true;
    },

    // Check win condition
    checkWinCondition: function () {
        // Win if player has 1,000,000 credits and is at Magrathea
        if (this.player.credits >= 1000000 && this.player.location === 'magrathea' && !this.gameCompleted) {
            this.addMessage("Congratulations! You've accumulated 1,000,000 Altairian Dollars and reached Magrathea!", "success");
            this.addMessage("The Magratheans agree to build you a new Earth, custom designed to your specifications.", "success");
            this.gameOver(true);
        }

        // Alternate win: Accept white mice offer
        if (this.whiteMouseOffer && this.player.location === 'magrathea' && !this.gameCompleted) {
            // This is handled elsewhere when player chooses
        }
    },

    // Game over
    gameOver: function (victory) {
        this.gameCompleted = true;

        if (victory) {
            this.showEventModal("Victory!", "fa-trophy",
                "You've won the game! The Magratheans have agreed to build you a new Earth, custom designed to your specifications.",
                ["You've accumulated 1,000,000 Altairian Dollars",
                    "You've reached Magrathea",
                    "Your new Earth will be ready in just 10 million years",
                    "Don't forget your towel!"]
            );
        } else {
            this.showEventModal("Game Over", "fa-skull",
                "Your journey has come to an unfortunate end.",
                ["Earth has been destroyed",
                    "You failed to escape in time",
                    "So long, and thanks for all the fish!"]
            );
        }
    }
};

// Initialize game when document is ready
document.addEventListener('DOMContentLoaded', function () {
    game.init();
});
# Mixamo shopping list — park crowd

Free Adobe login at https://www.mixamo.com. Two folders here:

- `characters/` — models, downloaded **With Skin**
- `anims/` — motions, downloaded **WITHOUT Skin**

When done: tell Claude, who runs `scripts/mixamo2glb.py` (Blender headless)
to convert everything and wire it into the game.

## Download settings

**Characters** (Characters tab → pick → DOWNLOAD):
- Format: **FBX Binary**
- Pose: **T-pose**
- → save into `characters/`

**Animations** (any character selected → search motion → DOWNLOAD):
- Format: **FBX Binary**
- Skin: **Without Skin**  ← important, keeps files tiny
- Frames per Second: 30 · Keyframe Reduction: none
- **☑ In Place** for every *walking/running/skipping* clip ← critical
- → save into `anims/`
- Motion *Packs* (bundle downloads) are great — grab the whole pack.

Filenames don't matter much — the converter maps by keywords — but keeping
Mixamo's default names helps.

## Characters (~10)

Guests: Remy · Michelle · Sophie · Brian · Megan · Leonard · Amy · Louise
Staff-ish: Aj or Malcolm (plain shirts, we tint as staff)
Mascots: Mousey and/or Ty (the cartoon ones — costumed-mascot energy)

## Animations (~25)

Locomotion (☑ In Place!):
- Walking · Happy Walk · Tired Walk · Running · Skipping

Idle / queueing:
- Standing Idle · Happy Idle · Bored · Looking Around · Texting · Checking Watch

Food:
- Eating · Drinking · Sitting Idle · Sitting Down · Stand Up

Joy:
- Cheering · Clapping · Excited (or Jump for Joy) · Waving · Laughing · Sad Idle

Personnel:
- Sweeping (or Mopping) · Kneeling + any "Repairing/Working" hit
- Standing Greeting · one Dance **Pack** (House/Samba/Hip-Hop) · Quick Formal Bow

"""Mixamo FBX -> glb batch converter (Blender headless).

    /Applications/Blender.app/Contents/MacOS/Blender --background \
        --factory-startup --python scripts/mixamo2glb.py -- \
        [--src assets-src/mixamo] [--out public/assets]

- assets-src/mixamo/characters/*.fbx  ->  public/assets/characters/<name>.glb
    (skinned model, T-pose; per-file)
- assets-src/mixamo/anims/*.fbx       ->  public/assets/anims/mixamo-library.glb
    (ONE armature carrying every clip, meshes stripped — tiny. Clips are
    renamed to canonical state names via KEYWORD_MAP, matched against the
    source filename. Because all Mixamo rigs share bone names, these clips
    play on any Mixamo character at runtime.)

Mixamo quirks handled: each anim FBX contains an armature (often named
"Armature") whose action is the clip; filenames like "Happy Walk.fbx" carry
the real name. In-place should be baked at download time (checkbox).
"""

import argparse
import os
import re
import sys

import bpy

# canonical state name -> filename keywords (first match wins, checked in order)
KEYWORD_MAP = [
    ("walk.happy", ["happy walk", "happy-walk", "happywalk"]),
    ("walk.tired", ["tired walk", "tired-walk", "sad walk", "tiredwalk"]),
    ("walk", ["walking", "walk"]),
    ("run", ["running", "run", "jog"]),
    ("skip", ["skipping", "skip"]),
    ("idle.happy", ["happy idle", "happy-idle", "happyidle"]),
    ("idle.bored", ["bored", "impatient"]),
    ("idle.lookaround", ["looking around", "look around", "lookaround"]),
    ("idle.phone", ["texting", "phone"]),
    ("idle.watch", ["watch"]),
    ("idle", ["standing idle", "idle", "breathing", "stand"]),
    ("eat", ["eating", "eat"]),
    ("drink", ["drinking", "drink"]),
    ("sit.down", ["sitting down", "sit down", "sit-to", "sitdown"]),
    ("stand.up", ["stand up", "standing up", "standup", "getting up"]),
    ("sit", ["sitting", "sit", "seated"]),
    ("cheer", ["cheering", "cheer"]),
    ("clap", ["clapping", "clap", "applau"]),
    ("excited", ["excited", "jump for joy", "joy"]),
    ("wave", ["waving", "wave"]),
    ("laugh", ["laughing", "laugh"]),
    ("sad", ["sad", "defeated", "disappointed"]),
    ("sweep", ["sweep", "mop", "clean"]),
    ("fix", ["fixing", "repair", "kneel", "screw", "work"]),
    ("serve", ["greeting", "handing", "give", "serve"]),
    ("guard", ["guard", "security"]),
    ("bow", ["bow"]),
    ("dance", ["dance", "dancing", "samba", "hip hop", "hiphop", "house"]),
]


def canonical_name(filename, used):
    base = os.path.splitext(os.path.basename(filename))[0].lower()
    base = re.sub(r"[_\-]+", " ", base)
    for canon, keys in KEYWORD_MAP:
        if any(k in base for k in keys):
            name = canon
            n = 2
            while name in used:  # dance -> dance.2, dance.3 (packs)
                name = f"{canon}.{n}"
                n += 1
            return name
    # unknown clip: keep a slugged filename so nothing is silently lost
    slug = re.sub(r"[^a-z0-9]+", ".", base).strip(".")
    return f"x.{slug}"


def reset_scene():
    bpy.ops.wm.read_factory_settings(use_empty=True)


def import_fbx(path):
    bpy.ops.import_scene.fbx(filepath=path, ignore_leaf_bones=True)


def export_glb(path, use_selection=False):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    props = bpy.ops.export_scene.gltf.get_rna_type().properties.keys()
    kwargs = dict(filepath=path, export_format="GLB", export_yup=True,
                  export_animations=True, export_skins=True)
    if "use_selection" in props and use_selection:
        kwargs["use_selection"] = True
    bpy.ops.export_scene.gltf(**{k: v for k, v in kwargs.items() if k in props})


def convert_characters(src_dir, out_dir):
    files = sorted(f for f in os.listdir(src_dir) if f.lower().endswith(".fbx")) if os.path.isdir(src_dir) else []
    for f in files:
        reset_scene()
        import_fbx(os.path.join(src_dir, f))
        name = re.sub(r"[^a-z0-9]+", "-", os.path.splitext(f)[0].lower()).strip("-")
        out = os.path.join(out_dir, "characters", f"{name}.glb")
        export_glb(out)
        print(f"[char] {f} -> {out}")
    return len(files)


def convert_anims(src_dir, out_dir):
    files = sorted(f for f in os.listdir(src_dir) if f.lower().endswith(".fbx")) if os.path.isdir(src_dir) else []
    if not files:
        return 0
    reset_scene()
    used = set()
    keeper = None  # the one armature we keep; all actions retarget onto it

    for f in files:
        before = set(bpy.data.objects)
        import_fbx(os.path.join(src_dir, f))
        new_objs = [o for o in bpy.data.objects if o not in before]
        arm = next((o for o in new_objs if o.type == "ARMATURE"), None)

        # name every action that arrived with this file
        new_actions = [a for a in bpy.data.actions if a.users and not a.get("wv_named")]
        for a in new_actions:
            canon = canonical_name(f, used)
            used.add(canon)
            a.name = canon
            a["wv_named"] = True
            a.use_fake_user = True  # survive object deletion
            print(f"[anim] {f} -> clip '{canon}'")

        if keeper is None and arm is not None:
            keeper = arm
            # strip any meshes that came with it
            for o in new_objs:
                if o is not arm:
                    bpy.data.objects.remove(o, do_unlink=True)
        else:
            for o in new_objs:
                bpy.data.objects.remove(o, do_unlink=True)

    # NLA-stash every action on the keeper so the glTF exporter writes all clips
    if keeper is not None:
        keeper.animation_data_create()
        for a in bpy.data.actions:
            if a.get("wv_named"):
                track = keeper.animation_data.nla_tracks.new()
                track.name = a.name
                track.strips.new(a.name, 0, a)

    out = os.path.join(out_dir, "anims", "mixamo-library.glb")
    export_glb(out)
    print(f"[anim] library ({len(used)} clips) -> {out}")
    return len(files)


def main():
    argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    ap = argparse.ArgumentParser()
    ap.add_argument("--src", default="assets-src/mixamo")
    ap.add_argument("--out", default="public/assets")
    args = ap.parse_args(argv)

    n_char = convert_characters(os.path.join(args.src, "characters"), args.out)
    n_anim = convert_anims(os.path.join(args.src, "anims"), args.out)
    print(f"[done] {n_char} characters, {n_anim} animation files")


main()

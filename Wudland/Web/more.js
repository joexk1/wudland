'use strict';
// More of everything: a full wardrobe (outfits, things on your back, round your neck, on your face and in your hand),
// a hatful of new hats, potions and curios that do things, cottage furniture, and a second menagerie of beasts.
// Everything here plugs into wares.js (ITEMS, BEASTS, MERCHANTS, ECON) and render.js (hat, person, face) through small hooks.

/* ---------- new hats: drawn by HAT_MORE below ---------- */
const P5 = (pal, rows) => ({ pal, icon: rows });
Object.assign(ITEMS, {
  hat_top: { name: "Gentleman's Topper", kind: 'hat', hat: 'tophat', value: 70, rarity: 1, desc: 'Adds a foot of height and two feet of dignity.', look: { hatColor: [40, 36, 44], hatBand: [170, 50, 60] }, ...P5({ a: [40, 36, 44], b: [170, 50, 60] }, ['.aaa.', '.aaa.', '.bbb.', '.aaa.', 'aaaaa']) },
  hat_tricorn: { name: 'Corsair Tricorn', kind: 'hat', hat: 'tricorn', value: 85, rarity: 2, desc: 'Smells faintly of rum and the sea, which is odd, inland.', look: { hatColor: [44, 40, 50], hatBand: [236, 196, 90] }, ...P5({ a: [44, 40, 50], b: [236, 196, 90], c: [250, 250, 240] }, ['.....', 'a.c.a', 'aaaaa', 'bbbbb', '.....']) },
  hat_witch: { name: "Witch's Hat", kind: 'hat', hat: 'witch', value: 75, rarity: 2, desc: 'Comes with a faint cackle. Free of charge.', look: { hatColor: [44, 36, 56], hatBand: [140, 80, 170] }, ...P5({ a: [44, 36, 56], b: [140, 80, 170], c: [236, 196, 90] }, ['....a', '...a.', '..aa.', '.bcb.', 'aaaaa']) },
  hat_jester: { name: "Jester's Cap", kind: 'hat', hat: 'jester', value: 40, rarity: 1, desc: 'Jingles when you nod. You will nod more.', look: { hatColor: [200, 60, 60], hatBand: [236, 196, 70] }, ...P5({ a: [200, 60, 60], b: [236, 196, 70], c: [250, 220, 120] }, ['c...c', 'a...b', '.a.b.', '.aab.', 'aabbb']) },
  hat_chef: { name: "Baker's Toque", kind: 'hat', hat: 'chef', value: 22, rarity: 0, desc: 'Puffed with flour and ambition.', look: { hatColor: [246, 244, 238] }, ...P5({ a: [246, 244, 238], b: [210, 206, 196] }, ['.aaa.', 'aaaaa', 'aaaaa', '.bbb.', '.aaa.']) },
  hat_flowers: { name: 'Flower Crown', kind: 'hat', hat: 'flowers', value: 18, rarity: 0, desc: 'Daisies, poppies and one confused bee.', ...P5({ a: [240, 120, 150], b: [250, 220, 90], c: [250, 250, 250], d: [100, 160, 80] }, ['.....', '.....', 'acbca', 'ddddd', '.....']) },
  hat_viking: { name: 'Horned Helm', kind: 'hat', hat: 'viking', value: 95, rarity: 2, desc: 'Historically dubious. Spiritually correct.', look: { hatColor: [160, 164, 172] }, ...P5({ a: [160, 164, 172], b: [236, 226, 200] }, ['b...b', 'b...b', '.aaa.', 'aaaaa', 'a...a']) },
  hat_bunny: { name: 'Bunny Ears', kind: 'hat', hat: 'bunny', value: 20, rarity: 0, desc: 'They flop when you are sad. Never be sad.', ...P5({ a: [246, 244, 244], b: [240, 170, 180] }, ['a...a', 'ab.ba', 'ab.ba', 'a...a', '.....']) },
  hat_frog: { name: 'Frog Hood', kind: 'hat', hat: 'frog', value: 35, rarity: 1, desc: 'Ribbit, in a hood.', look: { hideHair: true }, ...P5({ a: [100, 170, 80], b: [250, 250, 240], c: [30, 30, 30] }, ['bc.cb', 'aaaaa', 'aaaaa', 'a...a', '.....']) },
  hat_party: { name: 'Party Hat', kind: 'hat', hat: 'party', value: 12, rarity: 0, desc: 'It is always somebody\'s birthday.', ...P5({ a: [90, 140, 220], b: [240, 120, 150], c: [250, 220, 90] }, ['..c..', '..a..', '.bab.', '.aba.', 'babab']) },
  hat_shroom: { name: 'Toadstool Cap', kind: 'hat', hat: 'toadstool', value: 30, rarity: 1, desc: 'Grown, not sewn. Water occasionally.', ...P5({ a: [210, 60, 60], b: [250, 246, 236] }, ['.....', '.aba.', 'aaaba', 'babaa', '.....']) },
  hat_bandana: { name: "Bandit's Bandana", kind: 'hat', hat: 'bandana', value: 14, rarity: 0, desc: 'For looking roguish while doing errands.', look: { hatColor: [190, 50, 50] }, ...P5({ a: [190, 50, 50], b: [250, 240, 230] }, ['.....', '.aaa.', 'abaab', 'aaaa.', '....a']) },
  hat_robin: { name: "Archer's Cap", kind: 'hat', hat: 'robin', value: 45, rarity: 1, desc: 'Robs from the rich. Gives to the cap.', look: { hatColor: [70, 120, 60] }, ...P5({ a: [70, 120, 60], b: [200, 60, 50] }, ['...b.', '..b..', '.aaa.', 'aaaaa', '.....']) },
  hat_pumpkin: { name: 'Pumpkin Head', kind: 'hat', hat: 'pumpkin', value: 66, rarity: 2, desc: 'A whole lantern-pumpkin. It grins for you.', look: { hideHair: true, noFace: true }, ...P5({ a: [230, 120, 40], b: [90, 120, 50], c: [255, 220, 90] }, ['..b..', '.aaa.', 'acaca', 'aaaaa', '.ccc.']) },
  hat_cat: { name: 'Cat Ears', kind: 'hat', hat: 'cat', value: 24, rarity: 0, desc: 'Purring not included. Practise.', look: { hatColor: [60, 50, 50] }, ...P5({ a: [60, 50, 50], b: [240, 170, 180] }, ['a...a', 'aa.aa', 'ab.ba', '.....', '.....']) },
  hat_star: { name: 'Crown of Stars', kind: 'hat', hat: 'stars', value: 420, rarity: 4, desc: 'Seven little stars that orbit your head. Fell from the Celestial Whale.', ...P5({ a: [255, 240, 150], b: [180, 200, 255] }, ['a.b.a', '.....', 'b...b', '.....', 'a.b.a']) },
});

/* ---------- the wardrobe: kind 'wear', and a slot ---------- */
const SLOTS = ['outfit', 'back', 'neck', 'face', 'hand'];
const SLOT_NAMES = { outfit: 'Outfits', back: 'On your back', neck: 'Round your neck', face: 'On your face', hand: 'In your hand' };
const W = (slot, name, value, rarity, desc, look, pal, icon) => ({ name, kind: 'wear', slot, value, rarity, desc, look, pal, icon });
Object.assign(ITEMS, {
  // outfits (they replace the tunic from the Mirror)
  o_mail: W('outfit', 'Chainmail Hauberk', 110, 2, 'Clinks when you walk. Very reassuring.', { shirt: [150, 156, 166], stripe: [118, 122, 134], sleeve: [140, 146, 156], legs: [96, 98, 110], belt: [90, 60, 40], shoes: [80, 84, 92] }, { a: [150, 156, 166], b: [118, 122, 134], c: [90, 60, 40] }, ['.aaa.', 'ababa', 'aaaaa', 'ccccc', 'a...a']),
  o_royal: W('outfit', 'Royal Doublet', 160, 3, 'Crimson velvet, gold braid. Kneeling optional.', { shirt: [160, 40, 56], stripe: [236, 196, 90], sleeve: [160, 40, 56], legs: [240, 236, 226], belt: [236, 196, 90], shoes: [60, 40, 40] }, { a: [160, 40, 56], b: [236, 196, 90], c: [240, 236, 226] }, ['.aaa.', 'abab.', 'aaaaa', 'bbbbb', 'c...c']),
  o_wizard: W('outfit', 'Starry Robe', 140, 2, 'Embroidered with constellations that rearrange themselves.', { robe: true, shirt: [70, 52, 128], hem: [236, 196, 90], sleeve: [70, 52, 128], belt: [236, 196, 90] }, { a: [70, 52, 128], b: [236, 196, 90] }, ['.aaa.', 'aabaa', 'aaaaa', 'aabaa', 'bbbbb']),
  o_monk: W('outfit', "Monk's Habit", 30, 0, 'Brother Tobias swears it is comfy. It is.', { robe: true, shirt: [130, 98, 66], hem: [110, 82, 56], sleeve: [130, 98, 66], belt: [210, 190, 140] }, { a: [130, 98, 66], b: [210, 190, 140] }, ['.aaa.', 'aaaaa', 'bbbbb', 'aaaaa', 'aaaaa']),
  o_ranger: W('outfit', "Ranger's Leathers", 60, 1, 'Moss-stained and fit for long walks.', { shirt: [120, 86, 54], sleeve: [70, 112, 62], legs: [84, 72, 52], belt: [60, 40, 30], shoes: [70, 50, 36] }, { a: [120, 86, 54], b: [70, 112, 62], c: [60, 40, 30] }, ['.aaa.', 'baaab', 'baaab', 'ccccc', '.a.a.']),
  o_motley: W('outfit', "Bard's Motley", 45, 1, 'Half yellow, half red, wholly loud.', { shirt: [236, 190, 60], stripe: [200, 60, 60], sleeve: [200, 60, 60], legs: [70, 90, 160] }, { a: [236, 190, 60], b: [200, 60, 60], c: [70, 90, 160] }, ['.aab.', 'aabbb', 'aabbb', 'aabbb', 'c...c']),
  o_pjs: W('outfit', 'Striped Pyjamas', 16, 0, 'For the bravest of lie-ins.', { shirt: [176, 196, 240], stripe: [246, 246, 252], sleeve: [176, 196, 240], legs: [176, 196, 240], shoes: [200, 160, 170] }, { a: [176, 196, 240], b: [246, 246, 252] }, ['.aaa.', 'bbbbb', 'aaaaa', 'bbbbb', 'a...a']),
  o_smith: W('outfit', "Smith's Apron", 26, 0, 'Scorched in all the right places.', { shirt: [160, 130, 110], sleeve: [160, 130, 110], apron: [74, 54, 44], legs: [80, 70, 64] }, { a: [160, 130, 110], b: [74, 54, 44] }, ['.aaa.', 'abbba', 'abbba', '.bbb.', '.b.b.']),
  o_harvest: W('outfit', 'Harvest Suit', 55, 1, 'Orange and black for the turning of the year.', { shirt: [230, 120, 40], stripe: [60, 40, 40], sleeve: [60, 40, 40], legs: [60, 40, 40] }, { a: [230, 120, 40], b: [60, 40, 40] }, ['.aaa.', 'babab', 'aaaaa', 'bbbbb', 'b...b']),
  o_frost: W('outfit', 'Frost Gown', 190, 3, 'Woven from the first snow. Never melts, never itches.', { robe: true, shirt: [200, 230, 250], hem: [250, 252, 255], sleeve: [200, 230, 250] }, { a: [200, 230, 250], b: [250, 252, 255] }, ['.aaa.', 'aabaa', 'aaaaa', 'aaaaa', 'bbbbb']),
  o_corsair: W('outfit', 'Corsair Coat', 90, 2, 'Long, dark, with far too many buttons.', { shirt: [40, 44, 66], stripe: [40, 44, 66], sleeve: [40, 44, 66], belt: [200, 60, 50], legs: [226, 216, 196], shoes: [40, 36, 36] }, { a: [40, 44, 66], b: [200, 60, 50], c: [226, 216, 196] }, ['.aaa.', 'aacaa', 'aacaa', 'bbbbb', 'c...c']),
  o_gold: W('outfit', 'Golden Plate', 480, 4, 'Armour fit for the hero of a song. Shines even at night.', { shirt: [240, 200, 80], stripe: [210, 166, 60], sleeve: [236, 196, 80], legs: [220, 180, 70], belt: [170, 50, 60], shoes: [210, 170, 60], glint: true }, { a: [240, 200, 80], b: [210, 166, 60], c: [170, 50, 60] }, ['.aaa.', 'ababa', 'aaaaa', 'ccccc', 'a...a']),
  o_ghost: W('outfit', 'Spectral Shroud', 240, 3, 'Borrowed from the Pale Knight. He was very polite about it.', { robe: true, shirt: [214, 226, 246], hem: [170, 190, 230], sleeve: [214, 226, 246], haunt: true }, { a: [214, 226, 246], b: [170, 190, 230] }, ['.aaa.', 'aaaaa', 'aaaaa', 'aaaaa', 'b.b.b']),
  // on your back
  b_fae: W('back', 'Fae Wings', 220, 3, 'Gossamer and glimmering. They flutter on their own.', { back: 'fae', cape: null }, { a: [190, 236, 255], b: [250, 250, 255] }, ['a...a', 'aa.aa', 'ababa', '.a.a.', 'a...a']),
  b_bat: W('back', 'Bat Wings', 80, 1, 'Leathery, a little dramatic. Perfect for autumn.', { back: 'bat', cape: null }, { a: [60, 44, 70], b: [100, 70, 110] }, ['a...a', 'aa.aa', 'ababa', 'a.b.a', '.....']),
  b_angel: W('back', 'Seraph Wings', 520, 4, 'Soft as clouds. Brother Tobias went quiet when he saw them.', { back: 'angel', cape: null }, { a: [250, 250, 252], b: [220, 226, 240] }, ['aa.aa', 'aabaa', 'ababa', 'aa.aa', 'a...a']),
  b_dragon: W('back', 'Dragon Wings', 300, 3, 'Grown from a scale you found in a storm. Warm.', { back: 'dragon', cape: null }, { a: [70, 150, 100], b: [40, 100, 70] }, ['b...b', 'ab.ba', 'aabaa', 'a.b.a', '.....']),
  b_pack: W('back', "Adventurer's Pack", 28, 0, 'Bedroll, tinderbox, half a sandwich.', { back: 'pack' }, { a: [140, 96, 60], b: [226, 210, 180] }, ['.bbb.', '.aaa.', 'aaaaa', 'aaaaa', '.aaa.']),
  b_quiver: W('back', 'Quiver of Arrows', 36, 1, 'Goose-feather fletching, of course.', { back: 'quiver' }, { a: [120, 80, 50], b: [240, 240, 236] }, ['b.b..', '.b.b.', '..aa.', '..aa.', '..aa.']),
  b_shield: W('back', 'Kite Shield', 65, 1, 'Red and gold, with a lantern on it.', { back: 'shield' }, { a: [180, 50, 50], b: [236, 196, 90] }, ['aabaa', 'abbba', 'aabaa', '.aba.', '..a..']),
  b_lute: W('back', 'Travelling Lute', 50, 1, 'For singing on the road. Fennick approves.', { back: 'lute' }, { a: [190, 130, 70], b: [90, 60, 40] }, ['....b', '...b.', '.ab..', 'aaa..', '.a...']),
  b_starcloak: W('back', 'Starry Cloak', 260, 3, 'A cloak cut from a clear night. Stars twinkle in it.', { back: 'stars', cape: [30, 34, 76] }, { a: [30, 34, 76], b: [255, 240, 160] }, ['aaaaa', 'abaaa', 'aaaba', 'baaaa', 'aaaba']),
  b_shell: W('back', 'Snail Shell', 40, 1, 'The Mossback Snail outgrew it. You did not.', { back: 'shell', cape: null }, { a: [160, 116, 80], b: [110, 160, 80] }, ['.bb..', '.aaa.', 'aa.aa', 'aaaaa', '.aaa.']),
  // round your neck
  n_scarf: W('neck', 'Woolly Scarf', 14, 0, 'Knitted by Hilda in front of the fire.', { neck: 'scarf', neckColor: [200, 60, 60] }, { a: [200, 60, 60], b: [246, 240, 230] }, ['.....', 'ababa', '....a', '....b', '....a']),
  n_amulet: W('neck', 'Moon Amulet', 130, 2, 'Glows brighter the darker it gets.', { neck: 'amulet' }, { a: [200, 180, 120], b: [200, 220, 255] }, ['a...a', '.a.a.', '..a..', '.bbb.', '..b..']),
  n_ruff: W('neck', 'Lace Ruff', 34, 1, 'Very fashionable, three hundred years ago.', { neck: 'ruff' }, { a: [250, 250, 246], b: [220, 220, 214] }, ['.....', 'ababa', 'babab', '.....', '.....']),
  n_bell: W('neck', 'Cow Bell', 8, 0, 'You will never sneak anywhere again.', { neck: 'bell' }, { a: [236, 196, 90], b: [140, 60, 50] }, ['bbbbb', '..a..', '.aaa.', '.aaa.', 'aaaaa']),
  n_medal: W('neck', "Hero's Medal", 210, 3, 'For services to Wudland. What services? Shh.', { neck: 'medal' }, { a: [60, 80, 160], b: [236, 196, 90] }, ['a...a', '.a.a.', '..b..', '.bbb.', '..b..']),
  n_daisy: W('neck', 'Daisy Chain', 6, 0, 'Wren made it. Wear it with pride.', { neck: 'daisy' }, { a: [250, 250, 250], b: [250, 220, 90], c: [100, 160, 80] }, ['.....', 'acaca', 'c...c', 'ab.ba', '.cac.']),
  // on your face
  e_specs: W('face', 'Round Spectacles', 30, 1, 'Gearwin ground the lenses himself. Mostly flat.', { specs: 'round' }, { a: [90, 70, 50], b: [200, 230, 250] }, ['.....', 'aa.aa', 'babab', 'aa.aa', '.....']),
  e_monocle: W('face', 'Monocle', 55, 1, 'Raise one eyebrow at all times.', { specs: 'mono' }, { a: [236, 196, 90], b: [200, 230, 250] }, ['.aaa.', 'abbba', 'abbba', '.aaa.', '...a.']),
  e_shades: W('face', 'Smoked Glasses', 42, 1, 'Too cool for the tavern.', { shades: true }, { a: [40, 36, 40] }, ['.....', 'aaaaa', 'aa.aa', '.....', '.....']),
  e_stache: W('face', 'Magnificent Moustache', 25, 0, 'Waxed to perfection. Twirl it.', { stache: [70, 46, 36] }, { a: [70, 46, 36] }, ['.....', '.....', 'aa.aa', 'aaaaa', 'a...a']),
  e_patch: W('face', 'Eyepatch', 20, 0, 'Arr. Both eyes are fine, it is a look.', { patch: true }, { a: [30, 30, 30] }, ['a....', '.a...', '..aa.', '..aa.', '.....']),
  e_beard: W('face', "Sage's Beard", 150, 2, 'A long white beard. Instant wisdom (cosmetic).', { beard: [236, 236, 240] }, { a: [236, 236, 240] }, ['.....', 'a...a', 'aaaaa', '.aaa.', '..a..']),
  // in your hand
  h_sword: W('hand', 'Arming Sword', 120, 2, 'Sir Clank forged it. It has never hurt anyone.', { hand: 'sword' }, { a: [200, 206, 216], b: [236, 196, 90], c: [90, 60, 40] }, ['....a', '...a.', 'b.a..', '.c...', 'c.b..']),
  h_staff: W('hand', 'Crystal Staff', 170, 3, 'An oak staff topped with a humming crystal.', { hand: 'staff' }, { a: [120, 84, 50], b: [140, 220, 255] }, ['..b..', '.bbb.', '..a..', '..a..', '..a..']),
  h_torch: W('hand', 'Torch', 10, 0, 'Pitch, rag and stick. Lights the way.', { hand: 'torch' }, { a: [110, 76, 46], b: [250, 150, 50], c: [255, 230, 120] }, ['..c..', '.bcb.', '..a..', '..a..', '..a..']),
  h_rose: W('hand', 'Single Rose', 12, 0, 'For somebody special. Or yourself.', { hand: 'rose' }, { a: [200, 40, 60], b: [80, 140, 70] }, ['.aa..', 'aaa..', '.ab..', '..b..', '..b..']),
  h_rod: W('hand', 'Fishing Rod', 32, 0, 'Bram swears the pond has a whopper in it.', { hand: 'rod' }, { a: [150, 110, 70], b: [230, 230, 240] }, ['....a', '...ab', '..a.b', '.a..b', 'a...b']),
  h_balloon: W('hand', 'Red Balloon', 9, 0, 'It tugs gently upward. Hold tight.', { hand: 'balloon' }, { a: [220, 50, 60], b: [255, 160, 160], c: [200, 200, 200] }, ['.aaa.', 'abaaa', '.aaa.', '..c..', '..c..']),
  h_mug: W('hand', 'Tankard', 15, 0, 'Bottomless? No. But Mags keeps it full.', { hand: 'mug' }, { a: [150, 110, 70], b: [250, 246, 236] }, ['.bbb.', '.aaaa', '.aa.a', '.aaaa', '.aaa.']),
  h_book: W('hand', 'Pocket Grimoire', 95, 2, 'Its pages turn themselves when nobody watches.', { hand: 'book' }, { a: [100, 60, 140], b: [236, 196, 90] }, ['.....', 'aaaa.', 'abba.', 'aaaa.', '.....']),
  h_wand: W('hand', 'Star Wand', 200, 3, 'Leaves a trail of sparkles everywhere you go.', { hand: 'wand' }, { a: [60, 50, 60], b: [255, 230, 120] }, ['..b.b', '...b.', '..a.b', '.a...', 'a....']),
  h_umbrella: W('hand', 'Patchwork Umbrella', 26, 0, 'Seven colours of rain-proof patches.', { hand: 'umbrella' }, { a: [200, 70, 70], b: [240, 200, 80], c: [80, 130, 200], d: [90, 70, 60] }, ['.abc.', 'abcab', '..d..', '..d..', '.dd..']),
  h_net: W('hand', 'Butterfly Net', 18, 0, 'For catching nothing in particular.', { hand: 'net' }, { a: [150, 110, 70], b: [240, 240, 236] }, ['.bbb.', 'b...b', '.bbb.', '..a..', '..a..']),
  h_spirit: W('hand', 'Spirit Lantern', 160, 3, "A Will-o'-Lantern's little cousin, kept in a jar.", { hand: 'spirit' }, { a: [60, 50, 50], b: [150, 240, 200] }, ['..a..', '.aaa.', '.bbb.', '.bbb.', '.aaa.']),
});

/* ---------- potions, treats and curios that do things ---------- */
Object.assign(ITEMS, {
  cocoa: { name: 'Spiced Cocoa', kind: 'drink', value: 9, rarity: 0, desc: 'Cinnamon, honey and a marshmallow raft.', pal: { a: [236, 230, 214], b: [120, 76, 50], c: [250, 250, 250] }, icon: ['.c.c.', 'aaaa.', 'abbaa', 'abba.', '.aa..'] },
  p_shrink: { name: 'Shrinking Draught', kind: 'drink', value: 30, rarity: 1, desc: 'One sip and the world gets very big for a minute.', pal: { a: [200, 220, 230], b: [120, 200, 120] }, icon: ['..a..', '.aaa.', 'abbba', 'abbba', '.aaa.'] },
  p_grow: { name: "Giant's Brew", kind: 'drink', value: 34, rarity: 1, desc: 'Tastes of thunder. You will feel tall.', pal: { a: [200, 220, 230], b: [220, 90, 70] }, icon: ['..a..', '.aaa.', 'abbba', 'abbba', '.aaa.'] },
  p_float: { name: 'Feather Tonic', kind: 'drink', value: 40, rarity: 2, desc: 'You float a little off the ground. Mind the doorframes.', pal: { a: [200, 220, 230], b: [200, 220, 255], c: [250, 250, 255] }, icon: ['..c..', '.aaa.', 'abbba', 'abbba', '.aaa.'] },
  p_speed: { name: 'Quicksilver', kind: 'drink', value: 28, rarity: 1, desc: 'Your boots get ideas. Very fast ideas.', pal: { a: [200, 220, 230], b: [200, 204, 214], c: [250, 250, 255] }, icon: ['..a..', '.aaa.', 'abcba', 'abbba', '.aaa.'] },
  p_prism: { name: 'Prism Potion', kind: 'drink', value: 60, rarity: 2, desc: 'Leave a rainbow wherever you walk.', pal: { a: [200, 220, 230], b: [230, 90, 80], c: [240, 200, 80], d: [100, 180, 230] }, icon: ['..a..', '.aaa.', 'abcda', 'adbca', '.aaa.'] },
  p_ghost: { name: 'Ghostly Gin', kind: 'drink', value: 50, rarity: 2, desc: 'For a little while, you are see-through. Spooky.', pal: { a: [200, 220, 230], b: [200, 220, 250] }, icon: ['..a..', '.a.a.', 'ab.ba', 'abbba', '.aaa.'] },
  cake: { name: 'Honey Cake', kind: 'food', value: 8, rarity: 0, desc: 'Sticky, golden, gone in two bites.', pal: { a: [220, 170, 90], b: [250, 220, 120], c: [200, 60, 60] }, icon: ['..c..', '.bbb.', 'aaaaa', 'bbbbb', 'aaaaa'] },
  tart: { name: 'Berry Tart', kind: 'food', value: 7, rarity: 0, desc: 'Brambles from behind the mill.', pal: { a: [200, 150, 90], b: [120, 50, 110] }, icon: ['.....', '.bbb.', 'abbba', 'aaaaa', '.....'] },
  stew: { name: 'Mushroom Stew', kind: 'food', value: 10, rarity: 0, desc: 'Hearty and brown and wonderful.', pal: { a: [120, 90, 70], b: [170, 120, 70], c: [236, 226, 200] }, icon: ['.c.c.', '.....', 'abbba', 'aaaaa', '.aaa.'] },
  pear: { name: 'Golden Pear', kind: 'food', value: 3, rarity: 0, desc: 'Ripe and dripping.', pal: { a: [220, 200, 80], b: [100, 70, 40] }, icon: ['..b..', '..a..', '.aaa.', 'aaaaa', '.aaa.'] },
  cookie: { name: 'Star Cookie', kind: 'food', value: 12, rarity: 1, desc: 'Baked by moonlight. Your cheeks glow.', pal: { a: [230, 190, 110], b: [255, 240, 150] }, icon: ['..a..', '.aba.', 'abbba', '.aba.', 'a...a'] },
  shell: { name: 'Spiral Shell', kind: 'trinket', value: 5, rarity: 0, desc: 'You can hear a very small sea in it.', pal: { a: [240, 210, 190], b: [200, 150, 140] }, icon: ['.aaa.', 'abbba', 'ab.ba', 'abba.', '.aa..'], ground: [240, 210, 190] },
  pinecone: { name: 'Perfect Pinecone', kind: 'trinket', value: 2, rarity: 0, desc: 'Absolutely symmetrical. Wren is jealous.', pal: { a: [140, 90, 50], b: [100, 66, 40] }, icon: ['..a..', '.aba.', 'ababa', '.aba.', '..a..'], ground: [140, 90, 50] },
  dice: { name: 'Bone Dice', kind: 'trinket', value: 9, rarity: 1, desc: 'Always rolls a six. Suspicious.', pal: { a: [240, 234, 220], b: [40, 30, 30] }, icon: ['aaa..', 'aba..', 'aaaaa', '..aba', '..aaa'], ground: [240, 234, 220] },
  clover: { name: 'Four-Leaf Clover', kind: 'magic', value: 22, rarity: 1, desc: 'Hold it up for luck: rarer treasures turn up for a while.', pal: { a: [90, 170, 80], b: [60, 120, 50] }, icon: ['.a.a.', 'aaaaa', '.aba.', 'aaaaa', '..b..'], ground: [90, 170, 80] },
  firework: { name: 'Gnome Rocket', kind: 'curio', value: 16, rarity: 1, desc: 'Light the fuse, stand back, say ooh.', pal: { a: [200, 60, 60], b: [250, 250, 240], c: [100, 80, 60] }, icon: ['..b..', '.aaa.', '.aba.', '.aaa.', '..c..'] },
  snowglobe: { name: 'Snow Globe', kind: 'curio', value: 48, rarity: 2, desc: 'Shake it and it snows. Really snows.', pal: { a: [200, 230, 250], b: [250, 250, 255], c: [140, 90, 60] }, icon: ['.aaa.', 'ababa', 'aabaa', '.aaa.', 'ccccc'] },
  musicbox: { name: 'Music Box', kind: 'curio', value: 64, rarity: 2, desc: 'Plays a tune nobody has written yet.', pal: { a: [150, 100, 60], b: [236, 196, 90] }, icon: ['.....', 'aaaaa', 'abbba', 'aaaaa', 'a...a'] },
  map: { name: 'Treasure Map', kind: 'curio', value: 35, rarity: 1, desc: 'X marks a spot. Use it to reveal treasure nearby.', pal: { a: [236, 216, 170], b: [200, 50, 50], c: [150, 120, 80] }, icon: ['aaaaa', 'acaca', 'aabaa', 'acaca', 'aaaaa'], ground: [236, 216, 170] },
  pearl: { name: 'Black Pearl', kind: 'gem', value: 90, rarity: 2, desc: 'Found in a puddle, of all places.', pal: { a: [60, 60, 80], b: [180, 180, 220] }, icon: ['.....', '.aaa.', 'abaaa', 'aaaaa', '.aaa.'], ground: [80, 80, 100] },
  emerald: { name: 'Forest Emerald', kind: 'gem', value: 140, rarity: 3, desc: 'Green as the deep wood. Hums near the stag.', pal: { a: [60, 180, 110], b: [180, 250, 200] }, icon: ['.aaa.', 'abaaa', 'aaaaa', '.aaa.', '..a..'], ground: [60, 180, 110], glow: true },
  meteor: { name: 'Fallen Star', kind: 'magic', value: 600, rarity: 4, desc: 'It fell on a clear night and is still a little bit alive.', pal: { a: [255, 240, 150], b: [255, 255, 255], c: [180, 200, 255] }, icon: ['c...c', '.aba.', 'abbba', '.aba.', 'c...c'], ground: [255, 240, 150], glow: true },
});

/* ---------- cottage furniture ---------- */
Object.assign(ITEMS, {
  f_fishbowl: { name: 'Fishbowl', kind: 'furniture', value: 40, rarity: 1, desc: 'One goldfish, named Sir Bubbles.', pal: { a: [190, 230, 250], b: [240, 140, 50], c: [140, 90, 60] }, icon: ['.....', '.aaa.', 'abaaa', 'aaaaa', '.ccc.'] },
  f_crystal: { name: 'Crystal Ball', kind: 'furniture', value: 120, rarity: 3, desc: 'Shows the future. Mostly the weather.', pal: { a: [190, 160, 250], b: [250, 240, 255], c: [90, 60, 40] }, icon: ['.aaa.', 'abaaa', 'aaaaa', '.aaa.', 'ccccc'] },
  f_tapestry: { name: 'Dragon Tapestry', kind: 'furniture', value: 95, rarity: 2, desc: 'A green dragon, a brave knight, a very surprised sheep.', pal: { a: [60, 70, 120], b: [80, 170, 100], c: [236, 196, 90] }, icon: ['ccccc', 'aabaa', 'abbba', 'aabaa', 'c.c.c'] },
  f_candles: { name: 'Candelabra', kind: 'furniture', value: 46, rarity: 1, desc: 'Five candles. Cosy at any hour.', pal: { a: [236, 196, 90], b: [250, 246, 230], c: [255, 200, 90] }, icon: ['c.c.c', 'b.b.b', 'aaaaa', '..a..', '.aaa.'] },
  f_throne: { name: 'Little Throne', kind: 'furniture', value: 280, rarity: 3, desc: 'For ruling the cottage. Cushion included.', pal: { a: [236, 196, 90], b: [170, 40, 60] }, icon: ['a.a.a', 'aaaaa', 'abbba', 'aaaaa', 'a...a'] },
  f_mushlamp: { name: 'Mushroom Lamp', kind: 'furniture', value: 38, rarity: 1, desc: 'Hilda grew it. It glows softly all night.', pal: { a: [120, 230, 200], b: [236, 226, 200] }, icon: ['.aaa.', 'aaaaa', '..b..', '..b..', '.bbb.'] },
  f_teaset: { name: 'Tea Set', kind: 'furniture', value: 30, rarity: 0, desc: 'Floral porcelain. One cup chipped, lovingly.', pal: { a: [246, 244, 240], b: [200, 100, 140] }, icon: ['.....', '.aa..', 'abaa.', 'aaaa.', '.....'] },
  f_harp: { name: 'Golden Harp', kind: 'furniture', value: 150, rarity: 3, desc: 'Plays itself when the wind is right.', pal: { a: [236, 196, 90], b: [250, 250, 230] }, icon: ['aaa..', 'a.ba.', 'a.b.a', 'a.b.a', 'aaaaa'] },
  f_stars: { name: 'Star Mobile', kind: 'furniture', value: 55, rarity: 1, desc: 'Paper stars that turn slowly over the room.', pal: { a: [150, 110, 70], b: [255, 230, 120] }, icon: ['aaaaa', '.a.a.', 'b.a.b', '..b..', '.....'] },
  f_bunting: { name: 'Festival Bunting', kind: 'furniture', value: 15, rarity: 0, desc: 'Every day can be a fete.', pal: { a: [200, 60, 60], b: [240, 200, 80], c: [80, 130, 200] }, icon: ['.....', 'abcab', 'abcab', '.b.a.', '.....'] },
  f_cage: { name: 'Songbird Cage', kind: 'furniture', value: 44, rarity: 1, desc: 'The door is always open. The bird stays for the company.', pal: { a: [236, 196, 90], b: [250, 200, 60] }, icon: ['..a..', '.aaa.', 'a.b.a', 'a...a', 'aaaaa'] },
});
for (const [id, it] of Object.entries(ITEMS)) it.id = id;

/* ---------- who sells all this ---------- */
const STOCK_MORE = {
  odette: ['hat_top', 'hat_tricorn', 'hat_witch', 'o_royal', 'o_corsair', 'b_pack', 'b_starcloak', 'n_ruff', 'e_monocle', 'h_umbrella', 'h_book', 'f_crystal', 'f_tapestry', 'f_candles', 'f_throne', 'f_stars', 'f_cage', 'snowglobe', 'musicbox', 'map', 'b_angel', 'hat_star'],
  mags: ['cocoa', 'cake', 'stew', 'tart', 'h_mug', 'hat_chef', 'o_smith'],
  hilda: ['p_shrink', 'p_grow', 'p_float', 'p_speed', 'p_prism', 'p_ghost', 'hat_shroom', 'hat_flowers', 'n_daisy', 'n_scarf', 'f_mushlamp', 'f_teaset', 'clover', 'cookie'],
  gearwin: ['e_specs', 'e_monocle', 'firework', 'musicbox', 'snowglobe', 'f_fishbowl', 'f_cage', 'h_staff', 'e_shades'],
  bram: ['pear', 'h_rose', 'h_rod', 'n_bell', 'hat_pumpkin', 'o_pjs', 'h_net', 'o_harvest', 'hat_bandana'],
  clank: ['hat_viking', 'h_sword', 'b_shield', 'o_mail', 'o_gold', 'b_quiver', 'o_ranger', 'h_torch'],
  tobias: ['o_monk', 'n_amulet', 'h_staff', 'e_beard', 'b_angel', 'o_wizard', 'n_medal', 'cookie'],
  wren: ['hat_bunny', 'hat_frog', 'hat_cat', 'hat_party', 'h_balloon', 'h_net', 'n_daisy', 'pinecone', 'shell', 'firework', 'hat_robin'],
  fennick: ['hat_jester', 'o_motley', 'b_lute', 'n_ruff', 'h_rose', 'f_harp', 'f_bunting', 'e_stache'],
};
for (const [m, ids] of Object.entries(STOCK_MORE)) if (MERCHANTS[m]) { MERCHANTS[m].sells.push(...ids); MERCHANTS[m].slots += 3; }
// who buys the new kinds
Object.assign(MERCHANTS.odette.buys, { wear: .5, furniture: .45 });
Object.assign(MERCHANTS.clank.buys, { wear: .45 });
Object.assign(MERCHANTS.fennick.buys, { wear: .4, curio: .5 });
Object.assign(MERCHANTS.hilda.buys, { drink: .5 });
// a few things only turn up in the grass, at the right time
function moreFinds(t, m) {
  t.push(['shell', 4], ['pinecone', 5], ['dice', 1.2], ['map', .7], ['clover', m.luck ? 3 : .8], ['pear', 2]);
  if (m.wet) t.push(['pearl', .5], ['e_patch', .4]);
  if (m.night) t.push(['meteor', m.clear ? .05 : 0], ['h_spirit', .12]);
  if (m.season === 'autumn') t.push(['b_bat', m.night ? .5 : .1], ['hat_pumpkin', .25], ['o_harvest', .2]);
  if (m.season === 'autumn' && m.night) t.push(['o_ghost', .06]);
  if (m.snow || m.season === 'winter') t.push(['o_frost', .08], ['n_scarf', .8]);
  if (m.storm) t.push(['b_dragon', .1]);
  if (m.clear && !m.night) t.push(['b_fae', .05], ['emerald', .15], ['hat_flowers', .6]);
  if (m.luck) for (const row of t) if (ITEMS[row[0]]?.rarity >= 2) row[1] *= 3;
}

/* ---------- getting dressed ---------- */
ECON.worn = ECON.worn || {};
function dressed(base) {
  const l = { ...base };
  const hatItem = Object.values(ITEMS).find(i => i.kind === 'hat' && i.hat === l.hat);
  if (hatItem?.look) Object.assign(l, hatItem.look);
  for (const s of SLOTS) {
    const id = ECON.worn[s];
    if (id && ITEMS[id] && ECON.inv[id] > 0) Object.assign(l, ITEMS[id].look);
    else delete ECON.worn[s];
  }
  l.gear = !!(l.back || l.neck || l.hand);
  if (FX.scaleNow && Math.abs(FX.scaleNow - 1) > .01) l.scale = FX.scaleNow;
  return l;
}
function redress() { if (G?.player) G.player.look = dressed({ ...PLAYER_LOOK, ...(G.baseLook || BOOT_AVATAR()) }); }
function BOOT_AVATAR() { return (window.WUD_BOOT || {}).avatar || {}; }
function wear(slot, id) {
  if (!SLOTS.includes(slot)) return;
  if (!id || ECON.worn[slot] === id) delete ECON.worn[slot];
  else if (ITEMS[id]?.slot === slot && ECON.inv[id] > 0) ECON.worn[slot] = id;
  else return;
  redress();
  const p = G.player;
  burst(p.x, p.y, 1.2, id ? RARITY_COLOR[ITEMS[id]?.rarity || 0] : [220, 210, 190], 8);
  BR({ type: 'sfx', name: 'open' }); BR({ type: 'haptic', style: 'soft' });
  econChanged({ worn: slot, id: ECON.worn[slot] || null });
}

/* ---------- potions and curios ---------- */
Object.assign(FX, { scale: 0, scaleTo: 1, scaleNow: 1, float: 0, speed: 0, prism: 0, ghost: 0, snow: 0, luck: 0, music: 0, rockets: 0 });
const USE_MORE = {
  cocoa: () => drinkFx('cocoa', () => { burstHearts(G.player.x, G.player.y, 1.9); FX.glow = 8; }, 'Warm all the way to your toes.'),
  p_shrink: () => drinkFx('p_shrink', () => { FX.scale = 60; FX.scaleTo = .55; }, 'Whoa. Everything is enormous.'),
  p_grow: () => drinkFx('p_grow', () => { FX.scale = 60; FX.scaleTo = 1.45; }, 'You tower over the cobbles. Mind your head.'),
  p_float: () => drinkFx('p_float', () => { FX.float = 45; }, 'Your feet leave the ground. Wheee.'),
  p_speed: () => drinkFx('p_speed', () => { FX.speed = 40; }, 'Your boots are going places. Fast.'),
  p_prism: () => drinkFx('p_prism', () => { FX.prism = 60; }, 'Rainbows trail behind you.'),
  p_ghost: () => drinkFx('p_ghost', () => { FX.ghost = 40; }, 'You go all see-through. Boo.'),
  cookie: () => eatFx('cookie', () => { FX.glow = 25; }, 'Your cheeks glow like little moons.'),
  clover: () => { FX.luck = 600; FX.glow = 6; burst(G.player.x, G.player.y, 1.4, [90, 200, 90], 14); BR({ type: 'sfx', name: 'spell' }); return econChanged({ used: 'clover', line: 'You feel lucky. Rare things will turn up for a while.' }); },
  firework: () => { if (!take('firework')) return; FX.rockets = 3.2; BR({ type: 'sfx', name: 'spell' }); BR({ type: 'haptic', style: 'rigid' }); return econChanged({ used: 'firework', line: 'Ooooh. Aaaah.' }); },
  snowglobe: () => { FX.snow = 30; BR({ type: 'sfx', name: 'chime' }); return econChanged({ used: 'snowglobe', line: 'A tiny blizzard, just for you.' }); },
  musicbox: () => { FX.music = 12; BR({ type: 'sfx', name: 'spell' }); return econChanged({ used: 'musicbox', line: 'A tinkling tune. Even the beasts stop to listen.' }); },
  map: () => {
    if (G.scene.id !== 'village') return econChanged({ error: 'Take it outside to read it.' });
    if (!take('map')) return;
    const p = G.player, pool = ['coin', 'ruby', 'amber', 'moonstone', 'pearl', 'emerald', 'key', 'rainbow'];
    const pt = randomSpot(G.scene, 2, 7) || { x: p.x + 2, y: p.y + 1 };
    FINDS.push({ id: pool[Math.random() * pool.length | 0], x: pt.x, y: pt.y, t: 0, marked: true });
    burst(pt.x, pt.y, .3, [200, 50, 50], 16); showLabel('X marks the spot', pt.x, pt.y, 1.2);
    BR({ type: 'sfx', name: 'page' });
    return econChanged({ used: 'map', line: 'X marks the spot, close by. Go and dig.' });
  },
  meteor: () => { FX.glow = 40; FX.float = 10; burst(G.player.x, G.player.y, 1.4, [255, 240, 160], 30); BR({ type: 'sfx', name: 'spell' }); return econChanged({ used: 'meteor', line: 'It pulses in your hands, warm and bright. Keep it forever.' }); },
};
function drinkFx(id, f, line) { if (!take(id)) return; f(); burst(G.player.x, G.player.y, 1.8, ITEMS[id].pal.b || [250, 230, 160], 10); BR({ type: 'sfx', name: 'hic' }); econChanged({ used: id, line }); }
function eatFx(id, f, line) { if (!take(id)) return; f(); burstHearts(G.player.x, G.player.y, 1.9); BR({ type: 'sfx', name: 'chime' }); econChanged({ used: id, line }); }

const PRISM = [[230, 90, 80], [240, 160, 70], [240, 220, 90], [110, 200, 110], [100, 170, 240], [170, 120, 230]];
function stepMore(dt) {
  const p = G.player, sid = G.scene.id;
  for (const k of ['scale', 'float', 'speed', 'prism', 'ghost', 'snow', 'luck', 'music', 'rockets']) FX[k] = Math.max(0, FX[k] - dt);
  const want = FX.scale > 0 ? FX.scaleTo : 1;
  const was = FX.scaleNow; FX.scaleNow += (want - FX.scaleNow) * Math.min(1, dt * 3);
  if (Math.abs(was - FX.scaleNow) > .001 || (Math.abs(FX.scaleNow - 1) > .01) !== !!p.look.scale) { p.look.scale = Math.abs(FX.scaleNow - 1) > .01 ? FX.scaleNow : undefined; }
  p.lift = FX.float > 0 ? .5 + Math.sin(G.time * 2) * .12 : Math.max(0, (p.lift || 0) - dt * 2);
  p.ghost = FX.ghost > 0 || !!p.look.haunt;
  if (FX.prism > 0 && p.moving > .2 && Math.random() < dt * 30) { const c = PRISM[(G.time * 8 | 0) % 6]; emit({ scene: sid, x: p.x + (Math.random() - .5) * .3, y: p.y + (Math.random() - .5) * .3, z: .1 + (p.lift || 0), vx: 0, vy: 0, vz: .25, life: 1.4, c: rgb(...c), glow: 1, over: true }); }
  if (FX.speed > 0 && p.moving > .2 && Math.random() < dt * 20) emit({ scene: sid, x: p.x, y: p.y, z: .1, vx: -Math.cos(p.yaw) * .8, vy: -Math.sin(p.yaw) * .8, vz: .2, life: .4, c: rgb(220, 226, 240), over: true });
  if (FX.snow > 0) for (let k = 0; k < 2; k++) if (Math.random() < dt * 30) emit({ scene: sid, x: p.x + (Math.random() - .5) * 5, y: p.y + (Math.random() - .5) * 5, z: 3.5, vx: (Math.random() - .5) * .3, vy: (Math.random() - .5) * .3, vz: -.8, life: 4, c: rgb(250, 250, 255), over: true });
  if (FX.music > 0 && Math.random() < dt * 3) emit({ scene: sid, x: p.x + (Math.random() - .5) * .6, y: p.y + (Math.random() - .5) * .6, z: 2, vx: (Math.random() - .5) * .3, vy: (Math.random() - .5) * .3, vz: .5, life: 1.6, c: rgb(...PRISM[Math.random() * 6 | 0]), over: true, size: 2 });
  if (FX.music > 0 && Math.random() < dt * 2.2) BR({ type: 'sfx', name: Math.random() < .5 ? 'chime' : 'bell' });
  if (FX.rockets > 0 && Math.random() < dt * 2.5) {
    const c = PRISM[Math.random() * 6 | 0], x = p.x + (Math.random() - .5) * 4, y = p.y + (Math.random() - .5) * 4, z = 4 + Math.random() * 2;
    for (let k = 0; k < 26; k++) { const a = k / 26 * 6.283, b = (Math.random() - .5) * 2; emit({ scene: sid, x, y, z, vx: Math.cos(a) * 2.2, vy: Math.sin(a) * 2.2, vz: b * 2, g: 2, life: 1.2, c: rgb(...c), glow: 1, over: true }); }
    BR({ type: 'sfx', name: 'tap' });
  }
  // what you wear can sparkle too
  const l = p.look;
  if (l.glint && Math.random() < dt * 4) emit({ scene: sid, x: p.x + (Math.random() - .5) * .5, y: p.y + (Math.random() - .5) * .5, z: .5 + Math.random() * 1.2 + (p.lift || 0), vx: 0, vy: 0, vz: .2, life: .4, c: rgb(255, 250, 200), glow: 1, over: true });
  if (l.hand === 'wand' && p.moving > .2 && Math.random() < dt * 18 && G.heldTip) emit({ scene: sid, x: G.heldTip[0], y: G.heldTip[1], z: G.heldTip[2], vx: 0, vy: 0, vz: -.2, life: .9, c: rgb(...(Math.random() < .5 ? [255, 236, 140] : [200, 210, 255])), glow: 1, over: true });
  if (l.hand === 'torch' && G.heldTip && Math.random() < dt * 14) emit({ scene: sid, x: G.heldTip[0], y: G.heldTip[1], z: G.heldTip[2] + .05, vx: (Math.random() - .5) * .2, vy: (Math.random() - .5) * .2, vz: .9, life: .45, c: rgb(255, 170 + Math.random() * 60 | 0, 70), glow: 1, over: true });
  if (l.hat === 'stars' && Math.random() < dt * 3 && G.playerHead) emit({ scene: sid, x: G.playerHead[0], y: G.playerHead[1], z: G.playerHead[2] + .6, vx: (Math.random() - .5) * .4, vy: (Math.random() - .5) * .4, vz: .3, life: .8, c: rgb(255, 240, 160), glow: 1, over: true });
  if (l.back === 'fae' && Math.random() < dt * 5) emit({ scene: sid, x: p.x - Math.cos(p.yaw) * .3, y: p.y - Math.sin(p.yaw) * .3, z: 1.2 + (p.lift || 0), vx: 0, vy: 0, vz: -.3, life: .9, c: rgb(200, 240, 255), glow: 1, over: true });
  if (l.haunt && Math.random() < dt * 6) emit({ scene: sid, x: p.x + (Math.random() - .5) * .6, y: p.y + (Math.random() - .5) * .6, z: Math.random() * .4, vx: 0, vy: 0, vz: .4, life: 1, c: rgb(200, 220, 255), glow: 1, over: true });
}
const speedBoost = () => FX.speed > 0 ? 1.8 : 1;

/* ---------- hats ---------- */
const HAT_MORE = {
  tophat(o) {
    const { at, add, C, k } = o, col = o.look.hatColor || [40, 36, 44];
    ring(o, .38, .19, .085, col, .32);
    add(at(0, .24), at(.01, .72), .24 * k, .23 * k, C(col));
    add(at(0, .3), at(0, .36), .25 * k, .25 * k, C(o.look.hatBand || [170, 50, 60]));
    add(at(.01, .72), at(.01, .74), .23 * k, .2 * k, C(col.map(c => c + 14)));
  },
  tricorn(o) {
    const { head, add, C, k, fx, fy, at } = o, col = o.look.hatColor || [44, 40, 50], trim = o.look.hatBand || [236, 196, 90], f0 = Math.atan2(fy, fx);
    for (let a = 0; a < 6.283; a += .22) {
      const lift = Math.pow(Math.max(0, Math.cos(3 * (a - f0))), 3) * .2, r = .4 + lift * .2;
      const p = [head[0] + Math.cos(a) * r * k, head[1] + Math.sin(a) * r * k, head[2] + (.18 + lift) * k];
      add(p, p, .08 * k, .08 * k, C(lift > .08 ? trim : col));
    }
    add(at(0, .24), at(0, .4), .26 * k, .2 * k, C(col));
    add(at(-.26, .34), at(-.26, .34), .05 * k, .05 * k, C([250, 250, 240]));
  },
  witch(o) {
    const { at, add, C, k } = o, col = o.look.hatColor || [44, 36, 56];
    ring(o, .46, .17, .09, col, .26);
    add(at(0, .22), at(.04, .62), .27 * k, .12 * k, C(col));
    add(at(.04, .62), at(.3, .86), .12 * k, .03 * k, C(col));
    add(at(0, .28), at(0, .32), .27 * k, .26 * k, C(o.look.hatBand || [140, 80, 170]));
    add(at(-.26, .3), at(-.26, .3), .06 * k, .06 * k, C([236, 196, 90]));
  },
  jester(o) {
    const { at, add, C, k, S } = o, a = o.look.hatColor || [200, 60, 60], b = o.look.hatBand || [236, 196, 70];
    add(at(0, .18), at(0, .26), .31 * k, .28 * k, C(a));
    for (const s of [-1, 1]) {
      const c = s < 0 ? a : b, m = S(.06, s * .44, .58), tip = S(.18, s * .56, .34);
      add(S(0, s * .14, .34), m, .11 * k, .07 * k, C(c)); add(m, tip, .07 * k, .04 * k, C(c));
      add(tip, tip, .065 * k, .065 * k, C([250, 220, 120]));
    }
  },
  chef(o) {
    const { at, add, C, k } = o, w = o.look.hatColor || [246, 244, 238];
    add(at(0, .18), at(0, .32), .3 * k, .3 * k, C(w));
    add(at(0, .52), at(0, .52), .3 * k, .3 * k, C(w));
    for (let q = 0; q < 4; q++) { const a = q * 1.57 + .5; add([...at(0, .5)].map((v, i) => i === 0 ? v + Math.cos(a) * .2 * k : i === 1 ? v + Math.sin(a) * .2 * k : v), [...at(0, .5)].map((v, i) => i === 0 ? v + Math.cos(a) * .2 * k : i === 1 ? v + Math.sin(a) * .2 * k : v), .17 * k, .17 * k, C(w)); }
  },
  flowers(o) {
    const { head, add, C, k } = o, cols = [[240, 120, 150], [250, 220, 90], [250, 250, 250], [140, 170, 250], [240, 150, 80]];
    for (let q = 0; q < 14; q++) {
      const a = q / 14 * 6.283, p = [head[0] + Math.cos(a) * .3 * k, head[1] + Math.sin(a) * .3 * k, head[2] + .22 * k];
      add(p, p, (q % 2 ? .05 : .075) * k, (q % 2 ? .05 : .075) * k, C(q % 2 ? [100, 160, 80] : cols[(q / 2 | 0) % cols.length]));
    }
  },
  viking(o) {
    const { at, add, C, k, S } = o, steel = o.look.hatColor || [160, 164, 172];
    add(at(.02, .1), at(.02, .2), .35 * k, .3 * k, C(steel));
    ring(o, .34, .04, .065, [120, 90, 60], .32);
    add(S(-.3, 0, .1), S(-.36, 0, -.08), .045 * k, .035 * k, C(steel.map(c => c - 40)));
    for (const s of [-1, 1]) { const m = S(0, s * .48, .34); add(S(0, s * .3, .2), m, .075 * k, .05 * k, C([236, 226, 200])); add(m, S(-.06, s * .52, .6), .05 * k, .02 * k, C([236, 226, 200])); }
  },
  bunny(o) {
    const { add, C, k, S, t } = o, flop = Math.sin(t * 2) * .04;
    for (const s of [-1, 1]) { add(S(.05, s * .13, .28), S(.12 + flop, s * .2, .78), .075 * k, .06 * k, C([246, 244, 244])); add(S(-.0, s * .13, .34), S(.07 + flop, s * .19, .72), .035 * k, .03 * k, C([240, 170, 180])); }
  },
  frog(o) {
    const { at, add, C, k, S } = o, g = [100, 170, 80];
    add(at(.05, .05), at(.05, .05), .37 * k, .37 * k, C(g));
    for (const s of [-1, 1]) { add(S(-.06, s * .17, .34), S(-.06, s * .17, .34), .11 * k, .11 * k, C(g)); add(S(-.14, s * .17, .36), S(-.14, s * .17, .36), .065 * k, .065 * k, C([250, 250, 240])); add(S(-.2, s * .17, .37), S(-.2, s * .17, .37), .03 * k, .03 * k, C([30, 30, 30])); }
  },
  party(o) {
    const { at, add, k, C } = o;
    add(at(0, .25), at(.02, .78), .2 * k, .02 * k, z => Math.floor(z * 14) % 2 ? [90, 140, 220] : [240, 120, 150]);
    add(at(.02, .8), at(.02, .8), .07 * k, .07 * k, C([250, 220, 90]));
  },
  toadstool(o) {
    const { at, add, C, k, head } = o;
    add(at(0, .22), at(0, .4), .34 * k, .16 * k, C([210, 60, 60]));
    ring(o, .32, .2, .07, [210, 60, 60], .35);
    for (let q = 0; q < 7; q++) { const a = q / 7 * 6.283, r = q % 2 ? .3 : .17, p = [head[0] + Math.cos(a) * r * k, head[1] + Math.sin(a) * r * k, head[2] + (q % 2 ? .27 : .4) * k]; add(p, p, .045 * k, .045 * k, C([250, 246, 236])); }
  },
  bandana(o) {
    const { at, add, C, k } = o, col = o.look.hatColor || [190, 50, 50];
    add(at(.02, .12), at(.02, .12), .34 * k, .34 * k, (z, t) => (Math.floor(z * 30) % 3 === 0 ? [250, 240, 230] : col));
    add(at(.32, .04), at(.44, -.06), .07 * k, .045 * k, C(col)); add(at(.32, .04), at(.42, .1), .06 * k, .04 * k, C(col));
  },
  robin(o) {
    const { at, add, C, k } = o, col = o.look.hatColor || [70, 120, 60];
    add(at(.06, .18), at(.32, .36), .3 * k, .07 * k, C(col));
    add(at(-.2, .18), at(-.32, .2), .1 * k, .06 * k, C(col));
    add(at(.0, .3), at(.34, .74), .045 * k, .02 * k, C([200, 60, 50]));
  },
  pumpkin(o) {
    const { at, add, C, k, S, t } = o;
    add(at(0, .04), at(0, .04), .43 * k, .43 * k, (z, u) => [230, 120, 40]);
    add(at(0, .44), at(.04, .56), .05 * k, .035 * k, C([90, 120, 50]));
    const flick = Math.sin(t * 11) > -.5 ? rgb(255, 220, 90) : rgb(255, 170, 60);
    if (o.fx + o.fy > -.4) {
      for (const s of [-1, 1]) { plotGlow(...S(-.42, s * .14, .1), flick); plotGlow(...S(-.42, s * .14, .04), flick); }
      for (let q = -2; q <= 2; q++) plotGlow(...S(-.42, q * .07, -.12 + Math.abs(q) * .03), flick);
    }
  },
  cat(o) {
    const { add, C, k, S } = o, col = o.look.hatColor || [60, 50, 50];
    for (const s of [-1, 1]) { add(S(.02, s * .2, .26), S(.04, s * .25, .52), .09 * k, .02 * k, C(col)); add(S(-.02, s * .2, .3), S(-.01, s * .24, .46), .04 * k, .015 * k, C([240, 170, 180])); }
  },
  stars(o) {
    const { head, k, t } = o;
    for (let q = 0; q < 7; q++) {
      const a = q / 7 * 6.283 + t * .9;
      sphereGlow(head[0] + Math.cos(a) * .42 * k, head[1] + Math.sin(a) * .42 * k, head[2] + (.32 + Math.sin(t * 2 + q) * .06) * k, .055 * k, q % 2 ? [255, 240, 150] : [190, 210, 255]);
    }
  },
};
function ring(o, r, z, rad, col, step = .3) {
  const { head, add, C, k } = o;
  for (let a = 0; a < 6.283; a += step) { const p = [head[0] + Math.cos(a) * r * k, head[1] + Math.sin(a) * r * k, head[2] + z * k]; add(p, p, rad * k, rad * k, C(col)); }
}

/* ---------- worn gear: drawn by person() when look.gear ---------- */
function gear(look, g) {
  const { P, A, add, k, fx, fy, sx, sy, shZ, hip, head, handR, t, mv } = g, C = c => () => c;
  // on your back
  const flap = Math.sin(t * (mv > .2 ? 14 : 5));
  const wing = (s, span, up, col, r0, r1, seg = 3) => {
    const root = P(-.22, s * .1, shZ - .08);
    for (let q = 0; q < seg; q++) {
      const u = (q + 1) / seg, tip = P(-.32 - u * .12, s * (.15 + span * (.75 + flap * .25) * u), shZ - .1 + up * u - q * .12);
      A(root, tip, r0, r1, C(q % 2 ? col.map(c => Math.min(255, c + 22)) : col));
    }
  };
  switch (look.back) {
    case 'fae': for (const s of [-1, 1]) { const col = [190, 236, 255]; wing(s, .6, .5, col, .06, .1, 2); wing(s, .42, -.05, [220, 246, 255], .05, .08, 2); for (let q = 0; q < 3; q++) plotGlow(...P(-.36, s * (.3 + q * .14) * (.75 + flap * .25), shZ + .2 - q * .08), rgb(250, 250, 255)); } break;
    case 'bat': for (const s of [-1, 1]) wing(s, .7, .25, [60, 44, 70], .04, .09, 4); break;
    case 'angel': for (const s of [-1, 1]) wing(s, .75, .45, [250, 250, 252], .07, .12, 5); break;
    case 'dragon': for (const s of [-1, 1]) wing(s, .85, .35, [70, 150, 100], .05, .11, 4); break;
    case 'pack':
      A(P(-.26, 0, hip + .14), P(-.27, 0, shZ - .08), .2, .19, C([140, 96, 60]));
      A(P(-.3, -.22, shZ), P(-.3, .22, shZ), .09, .09, C([226, 210, 180]));
      A(P(-.38, 0, hip + .25), P(-.38, 0, hip + .3), .09, .08, C([110, 74, 46])); break;
    case 'quiver':
      A(P(-.24, .14, hip + .05), P(-.28, -.12, shZ + .2), .09, .085, C([120, 80, 50]));
      for (let q = 0; q < 3; q++) A(P(-.29, -.12 + q * .06, shZ + .22), P(-.31, -.16 + q * .06, shZ + .42), .04, .03, C([240, 240, 236])); break;
    case 'shield':
      A(P(-.27, 0, hip + .02), P(-.27, 0, shZ + .02), .14, .27, C([180, 50, 50]));
      A(P(-.33, 0, hip + .1), P(-.33, 0, shZ), .04, .04, C([236, 196, 90])); A(P(-.33, -.17, shZ - .12), P(-.33, .17, shZ - .12), .04, .04, C([236, 196, 90])); break;
    case 'lute':
      A(P(-.27, .12, hip + .05), P(-.28, .05, hip + .25), .18, .15, C([190, 130, 70]));
      A(P(-.28, .03, hip + .3), P(-.3, -.18, shZ + .4), .035, .03, C([90, 60, 40])); break;
    case 'stars': for (let q = 0; q < 6; q++) { const tw = Math.sin(t * 3 + q * 2.1) > .2; if (tw) plotGlow(...P(-.32, ((q * 37) % 7 / 7 - .5) * .4, hip - .05 + (q * 53 % 9) / 9 * (shZ - hip)), rgb(255, 240, 160)); } break;
    case 'shell':
      A(P(-.36, 0, shZ - .22), P(-.36, 0, shZ - .22), .3, .3, (z) => Math.floor(z * 10) % 2 ? [160, 116, 80] : [130, 92, 62]);
      A(P(-.36, 0, shZ + .1), P(-.36, 0, shZ + .1), .08, .08, C([110, 160, 80])); break;
  }
  // round your neck
  const nz = shZ + .03;
  switch (look.neck) {
    case 'scarf': { const c1 = look.neckColor || [200, 60, 60], c2 = [246, 240, 230];
      A(P(0, -.19, nz), P(0, .19, nz), .13, .13, z => Math.floor(z * 25) % 2 ? c1 : c2);
      A(P(.18, .12, nz - .02), P(.24, .16, nz - .36 - mv * .02), .07, .06, z => Math.floor(z * 25) % 2 ? c1 : c2); break; }
    case 'amulet': for (let q = 0; q <= 4; q++) { const u = q / 4 - .5; A(P(.2 - Math.abs(u) * .1, u * .3, nz - .05 - (.25 - u * u) * .4), P(.2 - Math.abs(u) * .1, u * .3, nz - .05 - (.25 - u * u) * .4), .02, .02, C([200, 180, 120])); }
      sphereGlow(...P(.27, 0, nz - .2), .045 * k, G.night > .3 ? [210, 230, 255] : [170, 190, 230]); break;
    case 'ruff': for (let q = 0; q < 10; q++) { const a = q / 10 * 6.283, p = P(Math.cos(a) * .2, Math.sin(a) * .2, nz + .02); A(p, p, .08, .08, C(q % 2 ? [250, 250, 246] : [226, 226, 220])); } break;
    case 'bell': A(P(.24, 0, nz), P(.24, 0, nz), .04, .04, C([140, 60, 50])); A(P(.28, 0, nz - .1), P(.29, 0, nz - .18), .05, .08, C([236, 196, 90])); break;
    case 'medal': A(P(.22, -.06, nz), P(.26, 0, nz - .16), .03, .03, C([60, 80, 160])); A(P(.22, .06, nz), P(.26, 0, nz - .16), .03, .03, C([60, 80, 160])); sphereGlow(...P(.28, 0, nz - .22), .055 * k, [250, 210, 90]); break;
    case 'daisy': for (let q = 0; q < 10; q++) { const a = q / 10 * 6.283, p = P(Math.cos(a) * .22, Math.sin(a) * .22, nz - .02); A(p, p, .045, .045, C(q % 2 ? [100, 160, 80] : [250, 250, 250])); } break;
  }
  // in your hand
  G.heldTip = null;
  if (!look.hand || !handR) return;
  const h = handR, up = (a, b, z) => [h[0] + fx * a * k + sx * b * k, h[1] + fy * a * k + sy * b * k, h[2] + z * k];
  const hz = (z) => [h[0], h[1], h[2] + z * k];
  switch (look.hand) {
    case 'sword': {
      const tip = up(.2, 0, .8); add(up(.02, 0, .08), tip, .045 * k, .02 * k, C([206, 212, 222]));
      add(up(.02, -.12, .07), up(.02, .12, .07), .03 * k, .03 * k, C([236, 196, 90])); add(up(0, 0, -.06), up(0, 0, -.06), .04 * k, .04 * k, C([236, 196, 90]));
      if (Math.sin(t * 2) > .96) plotGlow(...tip, rgb(255, 255, 255)); G.heldTip = tip; break; }
    case 'staff': { const top = hz(.85); add(hz(-.55), top, .035 * k, .035 * k, C([120, 84, 50])); sphereGlow(top[0], top[1], top[2] + .1 * k, (.08 + Math.sin(t * 4) * .01) * k, [140, 220, 255]); G.heldTip = top; break; }
    case 'torch': { const top = hz(.38); add(hz(-.12), top, .03 * k, .04 * k, C([110, 76, 46])); sphereGlow(top[0], top[1], top[2] + .06 * k, (.07 + Math.random() * .02) * k, [255, 180, 70]); G.heldTip = top; break; }
    case 'rose': { const top = up(.06, 0, .32); add(hz(0), top, .015 * k, .015 * k, C([80, 140, 70])); add(top, top, .065 * k, .065 * k, C([200, 40, 60])); break; }
    case 'rod': { const tip = up(.9, 0, .7); add(hz(0), tip, .025 * k, .012 * k, C([150, 110, 70])); for (let q = 1; q < 6; q++) plotGlow(tip[0], tip[1], tip[2] - q * .14 * k, rgb(230, 230, 240)); break; }
    case 'balloon': { const bob = Math.sin(t * 1.7) * .05, b = up(-.1, .1, 1.15 + bob); for (let q = 1; q < 8; q++) { const u = q / 8; plotGlow(h[0] + (b[0] - h[0]) * u, h[1] + (b[1] - h[1]) * u, h[2] + (b[2] - .2 * k - h[2]) * u, rgb(220, 220, 220)); }
      add(b, [b[0], b[1], b[2] + .04 * k], .2 * k, .19 * k, C([220, 50, 60])); add(up(-.16, .05, 1.24 + bob), up(-.16, .05, 1.24 + bob), .05 * k, .05 * k, C([255, 160, 160])); break; }
    case 'mug': add(hz(.02), hz(.18), .08 * k, .08 * k, C([150, 110, 70])); add(hz(.2), hz(.2), .075 * k, .075 * k, C([250, 246, 236])); break;
    case 'book': add(up(.06, -.06, .05), up(.06, .06, .05), .1 * k, .1 * k, C([100, 60, 140])); add(up(.1, 0, .05), up(.1, 0, .05), .05 * k, .05 * k, C([236, 196, 90])); break;
    case 'wand': { const tip = up(.18, 0, .32); add(hz(0), tip, .018 * k, .014 * k, C([60, 50, 60])); sphereGlow(tip[0], tip[1], tip[2], .045 * k, [255, 236, 140]); G.heldTip = tip; break; }
    case 'umbrella': { const top = hz(1.05); add(hz(-.05), top, .02 * k, .02 * k, C([90, 70, 60]));
      const cols = [[200, 70, 70], [240, 200, 80], [80, 130, 200], [110, 180, 110]];
      for (let q = 0; q < 12; q++) { const a = q / 12 * 6.283; for (const r of [.18, .34, .48]) { const p = [top[0] + Math.cos(a) * r * k, top[1] + Math.sin(a) * r * k, top[2] - r * r * .7 * k]; add(p, p, .09 * k, .09 * k, C(cols[(q / 3 | 0) % 4])); } }
      add([top[0], top[1], top[2] + .04 * k], [top[0], top[1], top[2] + .1 * k], .03 * k, .02 * k, C([90, 70, 60])); break; }
    case 'net': { const tip = up(.3, 0, .7); add(hz(0), tip, .02 * k, .02 * k, C([150, 110, 70])); for (let q = 0; q < 10; q++) { const a = q / 10 * 6.283; plotGlow(tip[0] + Math.cos(a) * .15 * k, tip[1] + Math.sin(a) * .15 * k, tip[2] + .1 * k, rgb(240, 240, 236)); } break; }
    case 'spirit': { const top = hz(-.05); add(hz(.05), hz(.12), .02 * k, .02 * k, C([60, 50, 50])); add(hz(-.02), hz(-.02), .08 * k, .05 * k, C([60, 50, 50])); sphereGlow(top[0], top[1], top[2] - .12 * k, (.08 + Math.sin(t * 6) * .012) * k, [150, 240, 200]); break; }
  }
}

/* ---------- face gear: pixels round the eyes (called from face()) ---------- */
function faceGear(look, side, ix, iy, d, mouth) {
  const FRAME = rgb(90, 70, 50), GOLD = rgb(236, 196, 90), PATCH = rgb(26, 24, 26);
  if (look.specs === 'round') { dot(ix - 1, iy, FRAME, d); dot(ix + 1, iy, FRAME, d); dot(ix, iy - 1, FRAME, d); dot(ix, iy + 1, FRAME, d); }
  if (look.specs === 'mono' && side > 0) { dot(ix - 1, iy, GOLD, d); dot(ix + 1, iy, GOLD, d); dot(ix, iy - 1, GOLD, d); dot(ix, iy + 1, GOLD, d); dot(ix + 1, iy + 2, GOLD, d); dot(ix + 1, iy + 3, GOLD, d); }
  if (look.patch && side < 0) { dot(ix, iy, PATCH, d); dot(ix + 1, iy, PATCH, d); dot(ix, iy + 1, PATCH, d); dot(ix + 1, iy + 1, PATCH, d); dot(ix + 2, iy - 1, PATCH, d); dot(ix + 3, iy - 2, PATCH, d); dot(ix - 1, iy - 1, PATCH, d); }
  if (look.stache && side > 0 && mouth) { const c = rgb(...look.stache), [mx, my, md] = mouth; for (const o of [-2, -1, 0, 1, 2]) dot(mx + o, my - (Math.abs(o) === 2 ? 0 : 1), c, md); dot(mx - 3, my + 1, c, md); dot(mx + 3, my + 1, c, md); }
}

/* ---------- cottage furniture ---------- */
function placeMoreFurniture(sc, has) {
  const C = c => () => c;
  if (has('f_fishbowl')) {
    cylinder(3.55, .75, 0, .6, .12, solid(PAL.woodDark), -Math.PI, Math.PI);
    box(3.3, .5, .6, 3.8, 1, .66, PAL.wood, .4);
    sphere(3.55, .75, .88, .24, [180, 220, 240], 'gloss');
    EMIT = 1; sphere(3.6, .78, .85, .06, [240, 140, 50], 'solid'); EMIT = 0;
    sc.obst.push({ cx: 3.55, cy: .75, r: .35 });
  }
  if (has('f_crystal')) {
    cylinder(2.25, .55, 0, .55, .14, solid([90, 60, 40]), -Math.PI, Math.PI);
    EMIT = 1; sphere(2.25, .55, .78, .2, [190, 160, 250], 'gloss'); EMIT = 0;
    addLight(sc, 2.25, .55, .8, 1.6, .45, .3);
    sc.obst.push({ cx: 2.25, cy: .55, r: .3 });
  }
  if (has('f_tapestry')) {
    quad([-3.97, -2.85, .9], [0, .85, 0], [0, 0, 1.4], (s, t, o) => {
      o.flat = true; const u = s / .85, v = t / 1.4;
      o.c = [60, 70, 120];
      if (u < .06 || u > .94 || v > .94) o.c = [236, 196, 90];
      else if (Math.hypot((u - .5) * 1.4, v - .55) < .22) o.c = [80, 170, 100];
      else if (Math.hypot((u - .3) * 1.4, v - .72) < .08) o.c = [80, 170, 100];
      else if (v < .2 && (u * 10 | 0) % 2) o.c = [170, 50, 60];
      if (v < .04 && (u * 14 | 0) % 2) o.c = [236, 196, 90];
    }, false, [1, 0, 0]);
  }
  if (has('f_candles')) {
    cylinder(.95, -2.65, 0, .9, .04, solid([236, 196, 90]), -Math.PI, Math.PI);
    cylinder(.95, -2.65, 0, .06, .18, solid([236, 196, 90]), -Math.PI, Math.PI);
    for (const dx of [-.22, -.11, 0, .11, .22]) { const z = .95 + (dx ? 0 : .12); capsule([.95 + dx, -2.65, .9], [.95 + dx, -2.65, z], .025, .025, C([236, 196, 90]), 'solid'); capsule([.95 + dx, -2.65, z], [.95 + dx, -2.65, z + .14], .03, .03, C([250, 246, 230]), 'solid'); sc.fires.push({ x: .95 + dx, y: -2.65, z: z + .2, kind: 'candle' }); }
    addLight(sc, .95, -2.65, 1.2, 2, .55, .2);
    sc.obst.push({ cx: .95, cy: -2.65, r: .25 });
  }
  if (has('f_throne')) {
    box(-3.85, 2.2, 0, -3.25, 2.85, .5, [236, 196, 90], .3);
    box(-3.8, 2.25, .5, -3.3, 2.8, .58, [170, 40, 60], .4);
    box(-3.95, 2.2, .5, -3.82, 2.85, 1.7, [236, 196, 90], .3);
    for (const y of [2.25, 2.53, 2.8]) sphere(-3.88, y, 1.78, .07, [236, 196, 90], 'gloss');
    box(-3.85, 2.2, .5, -3.3, 2.28, .8, [236, 196, 90], .3); box(-3.85, 2.77, .5, -3.3, 2.85, .8, [236, 196, 90], .3);
    sc.obst.push({ x0: -4, y0: 2.1, x1: -3.2, y1: 2.95 });
  }
  if (has('f_mushlamp')) {
    capsule([-3.6, -2.6, 0], [-3.6, -2.6, .55], .06, .05, C([236, 226, 200]), 'solid');
    EMIT = 1; capsule([-3.6, -2.6, .6], [-3.6, -2.6, .66], .26, .12, C([120, 230, 200]), 'solid'); EMIT = 0;
    addLight(sc, -3.6, -2.6, .7, 1.8, .5, .1);
    sc.obst.push({ cx: -3.6, cy: -2.6, r: .25 });
  }
  if (has('f_teaset')) {
    sphere(-.75, -2.25, .95, .08, [246, 244, 240], 'gloss');
    capsule([-.65, -2.25, .97], [-.58, -2.25, 1.02], .02, .015, C([246, 244, 240]), 'solid');
    for (const [x, y] of [[-.45, -2.15], [-.42, -2.4]]) cylinder(x, y, .89, .95, .045, solid([246, 244, 240]), -Math.PI, Math.PI);
    plot(-.75, -2.18, .95, rgb(200, 100, 140)); plot(-.8, -2.22, .97, rgb(200, 100, 140));
  }
  if (has('f_harp')) {
    capsule([.35, 2.7, .05], [.35, 2.7, 1.3], .05, .04, C([236, 196, 90]), 'solid');
    capsule([.35, 2.7, 1.3], [.35, 2.25, 1.0], .045, .04, C([236, 196, 90]), 'solid');
    capsule([.35, 2.25, 1.0], [.35, 2.3, .15], .06, .05, C([236, 196, 90]), 'solid');
    for (let q = 1; q < 6; q++) { const y = 2.7 - q * .075; for (let z = .2; z < 1.2 - q * .04; z += .06) plot(.35, y, z, rgb(250, 250, 230)); }
    sc.obst.push({ cx: .35, cy: 2.5, r: .35 });
  }
  if (has('f_stars')) {
    capsule([-.6, .2, 2.9], [-.6, .2, 2.5], .015, .015, C([150, 110, 70]), 'solid');
    capsule([-1.1, .2, 2.5], [-.1, .2, 2.5], .02, .02, C([150, 110, 70]), 'solid');
    sc.mobile = { x: -.6, y: .2, z: 2.5 };
  }
  if (has('f_bunting')) {
    for (let q = 0; q < 11; q++) {
      const x = -3.6 + q * .65, sag = Math.sin(q / 10 * Math.PI) * .25, col = [[200, 60, 60], [240, 200, 80], [80, 130, 200]][q % 3];
      quad([x, -2.95, 2.55 - sag], [.4, 0, 0], [.2, 0, -.35], (s, t, o) => { o.c = col; o.flat = true; }, true, [0, 1, 0]);
    }
  }
  if (has('f_cage')) {
    capsule([3.7, -.1, 2.9], [3.7, -.1, 2.2], .015, .015, C([236, 196, 90]), 'solid');
    for (let q = 0; q < 10; q++) { const a = q / 10 * 6.283; capsule([3.7 + Math.cos(a) * .22, -.1 + Math.sin(a) * .22, 1.55], [3.7 + Math.cos(a) * .12, -.1 + Math.sin(a) * .12, 2.15], .012, .012, C([236, 196, 90]), 'solid'); }
    disc(3.7, -.1, 1.55, .24, (s, t, o) => { o.c = [236, 196, 90]; o.flat = true; });
    sc.bird = { x: 3.7, y: -.1, z: 1.72 };
  }
}
function drawRoomExtras() {
  const sc = G.scene;
  if (sc.mobile) {
    const { x, y, z } = sc.mobile;
    for (let q = 0; q < 5; q++) { const a = q / 5 * 6.283 + G.time * .4, px = x + Math.cos(a) * .55, py = y + Math.sin(a) * .55, pz = z - .3 - (q % 2) * .15; plotGlow(px, py, pz + .15, rgb(150, 110, 70)); sphereGlow(px, py, pz, .06, q % 2 ? [255, 230, 120] : [200, 210, 255]); }
  }
  if (sc.bird) {
    const { x, y, z } = sc.bird, hop = Math.abs(Math.sin(G.time * 3)) > .9 ? .05 : 0;
    dynamicAdd([x, y, z + hop], [x + .05, y, z + .06 + hop], .07, .06, () => [250, 200, 60]);
    plotGlow(x + .1, y + .02, z + .09 + hop, rgb(240, 130, 40));
    if (Math.random() < .004) BR({ type: 'sfx', name: 'chime' });
  }
}

/* ---------- a second menagerie ---------- */
Object.assign(BEASTS, {
  crab: { name: 'Moss Crab', rarity: 0, when: m => m.wet || m.grey, speed: .7, lore: 'Walks sideways out of principle.' },
  candle: { name: 'Candle Sprite', rarity: 0, when: m => m.night > .3, speed: .6, hop: true, lore: 'A walking flame. Very worried about the rain.' },
  bee: { name: 'Bumble Knight', rarity: 0, when: m => !m.night && !m.wet && m.season !== 'winter', fly: 1, speed: 1.2, lore: 'A bee with a tiny lance, sworn to defend the flowers.' },
  squirrel: { name: 'Acorn Thief', rarity: 0, when: m => !m.night && (m.season === 'autumn' || m.season === 'spring'), speed: 2.2, hop: true, lore: 'Has stolen every acorn in Wudland twice.' },
  owl: { name: 'Spectacled Owl', rarity: 1, when: m => m.night > .4, fly: 1.8, speed: .8, lore: 'Reads over your shoulder. Disapproves of your handwriting.' },
  bat: { name: 'Velvet Bat', rarity: 1, when: m => m.night > .3 && (m.season === 'autumn' || m.grey), fly: 2, speed: 1.6, lore: 'Upside-down is its right way up.' },
  slime: { name: 'Jelly Slime', rarity: 1, when: m => m.wet, speed: .7, hop: true, lore: 'Wobbles. Tastes of gooseberry, apparently.' },
  cat: { name: 'Shadow Cat', rarity: 1, when: m => m.night > .5, speed: 1, lore: 'Only its eyes are certain. The rest is opinion.' },
  golem: { name: 'Pebble Golem', rarity: 2, when: m => m.grey || m.season === 'autumn', speed: .4, size: 1.6, lore: 'Made of river stones. Takes a hundred years to finish a sentence.' },
  penguin: { name: 'Snow Penguin', rarity: 2, when: m => m.snow || m.season === 'winter', speed: .7, lore: 'Got lost on the way to somewhere colder. Not bothered.' },
  jelly: { name: 'Sky Jelly', rarity: 2, when: m => (m.grey || m.wet) && m.night > .3, fly: 2.2, speed: .35, lore: 'Drifts through fog, glowing like a lamp in a bath.' },
  kraken: { name: 'Puddle Kraken', rarity: 3, when: m => m.wet, speed: .5, lore: 'Lives in a puddle no deeper than a thimble. Big ideas.' },
  griffin: { name: 'Griffin Chick', rarity: 3, when: m => m.clear && !m.night, fly: 1.2, speed: 1.4, lore: 'Half eagle, half lion, all fluff. Will grow into its beak.' },
  phoenix: { name: 'Phoenix Chick', rarity: 4, when: m => (m.clear || m.season === 'summer') && !m.wet, fly: 1.6, speed: 1.2, lore: 'Bursts into flame when happy. Bursts into flame a lot.' },
  unicorn: { name: 'Pocket Unicorn', rarity: 4, when: m => !m.night && (m.clear || m.wet), speed: 1.1, lore: 'Knee-high, rainbow-maned, absolutely convinced it is a war horse.' },
});
Object.assign(BEAST_ICONS, {
  crab: [{ a: [120, 150, 90], b: [200, 100, 70], c: [30, 30, 30] }, ['c.....c.', 'b.....b.', '.b.aa.b.', '..aaaa..', '.baaaab.', 'b.b..b.b']],
  candle: [{ a: [250, 246, 230], b: [255, 180, 70], c: [255, 240, 150], d: [40, 30, 30] }, ['..c...', '.bcb..', '..b...', '.aaaa.', '.daad.', '.aaaa.', '.a..a.']],
  bee: [{ a: [250, 200, 60], b: [40, 34, 34], c: [220, 236, 255], d: [200, 200, 210] }, ['.cc.....', 'cccc....', '.ababa.d', 'babab.d.', '.ababd..', '........']],
  squirrel: [{ a: [190, 100, 50], b: [240, 220, 190], c: [30, 30, 30] }, ['aa......', 'aaa..a..', '.aa.aca.', '.aaaaab.', '..aaab..', '..a.a...']],
  owl: [{ a: [150, 110, 80], b: [236, 220, 190], c: [40, 30, 30], d: [236, 196, 90] }, ['a....a.', 'aaaaaa.', 'dbcdbc.', 'aaddaa.', 'abbbba.', '.abba..', '.d..d..']],
  bat: [{ a: [70, 50, 80], b: [240, 130, 150] }, ['a.....a', 'aa.a.aa', 'aaaaaaa', 'a.aba.a', '...a...']],
  slime: [{ a: [120, 220, 120], b: [200, 255, 200], c: [30, 60, 30] }, ['..aa...', '.abaa..', 'aaaaaa.', 'acaaca.', 'aaaaaa.', '.aaaa..']],
  cat: [{ a: [40, 36, 50], b: [250, 220, 90] }, ['a.a.....', 'aaa.....', 'bab....a', 'aaa...a.', '.aaaaaa.', '.a.a.a..']],
  golem: [{ a: [150, 146, 136], b: [110, 106, 100], c: [120, 230, 200], d: [100, 160, 80] }, ['..dd....', '.aaaa...', '.acac...', 'baaaab..', 'b.aa.b..', '.a..a...']],
  penguin: [{ a: [40, 44, 60], b: [246, 246, 250], c: [250, 160, 50] }, ['..aa..', '.abba.', '.bbcc.', 'abbba.', 'abbba.', '.c..c.']],
  jelly: [{ a: [210, 160, 240], b: [250, 220, 255], c: [180, 140, 230] }, ['.aaaa.', 'abaaba', 'aaaaaa', 'c.c.c.', '.c.c.c', 'c...c.']],
  kraken: [{ a: [180, 80, 140], b: [100, 140, 200], c: [250, 250, 250], d: [30, 30, 30] }, ['..aa....', '.acda...', 'a.aa.a..', 'a.a..a..', 'bbbbbbb.']],
  griffin: [{ a: [236, 210, 150], b: [250, 250, 240], c: [250, 180, 50], d: [30, 30, 30] }, ['.bb.....', 'bdbc....', '.bb..aa.', '.bbaaaa.', '..aaaaa.', '..a..a..']],
  phoenix: [{ a: [250, 120, 40], b: [255, 220, 90], c: [255, 255, 200], d: [30, 30, 30] }, ['..b.b...', '.aab....', 'adaa..b.', '.aaaaab.', '..aaab..', '...bb...']],
  unicorn: [{ a: [250, 250, 252], b: [240, 120, 160], c: [250, 220, 90], d: [120, 180, 240], e: [30, 30, 30] }, ['c.......', '.c.b....', '.aab....', 'aeadb...', '..aaaaa.', '..aaaaad', '..a...a.']],
});
const BEAST_DRAW = {
  crab(o) { const { c, add, glow, C, P, t } = o, scut = Math.sin(t * 9) * .04 * c.moving;
    add(P(0, scut, .12), P(0, scut, .14), .16, .13, C([120, 150, 90]));
    for (const s of [-1, 1]) { for (let q = 0; q < 3; q++) add(P(-.08 + q * .08, s * .14 + scut, .1), P(-.1 + q * .08, s * .26 + scut, 0), .025, .02, C([200, 100, 70])); add(P(.14, s * .14 + scut, .14), P(.24, s * .16 + scut, .2), .05, .06, C([200, 100, 70])); glow(...P(.12, s * .05 + scut, .28), rgb(20, 20, 20)); }
    add(P(-.02, scut, .26), P(-.02, scut, .26), .06, .06, C([90, 160, 70])); },
  candle(o) { const { c, add, sglow, C, P, hop, t, face, fx, fy, sx, sy } = o;
    add(P(0, 0, hop + .02), P(0, 0, hop + .3), .11, .1, C([250, 246, 230]));
    sglow(c.x, c.y, hop + .42 + Math.sin(t * 13) * .02, .06, Math.sin(t * 11) > 0 ? [255, 200, 90] : [255, 160, 60]);
    face(P(0, 0, hop + .2), fx, fy, sx, sy, .4, {}, { t }); },
  bee(o) { const { c, add, glow, C, P, t } = o, z = c.z, fl = Math.sin(t * 40) > 0;
    add(P(.1, 0, z), P(-.12, 0, z), .1, .09, (zz, u) => Math.floor(u * 4) % 2 ? [40, 34, 34] : [250, 200, 60]);
    for (const s of [-1, 1]) glow(...P(0, s * (fl ? .12 : .08), z + .12), rgb(220, 236, 255));
    add(P(.12, .06, z - .02), P(.36, .06, z + .04), .015, .01, C([200, 200, 210])); glow(...P(.17, 0, z + .03), rgb(20, 20, 20)); },
  squirrel(o) { const { add, glow, C, P, hop } = o, z = hop, fur = [190, 100, 50];
    add(P(0, 0, z + .12), P(.06, 0, z + .24), .1, .08, C(fur)); add(P(.12, 0, z + .32), P(.12, 0, z + .32), .08, .08, C(fur));
    add(P(-.1, 0, z + .12), P(-.22, 0, z + .4), .07, .1, C([210, 120, 60])); add(P(-.22, 0, z + .4), P(-.1, 0, z + .5), .1, .06, C([210, 120, 60]));
    glow(...P(.19, .04, z + .35), rgb(20, 20, 20)); add(P(.14, 0, z + .18), P(.14, 0, z + .18), .045, .045, C([150, 100, 50])); },
  owl(o) { const { c, add, glow, C, P, t } = o, z = c.z, fl = Math.sin(t * 10) * .2;
    add(P(0, 0, z), P(0, 0, z + .22), .15, .14, C([150, 110, 80])); add(P(.08, 0, z + .05), P(.08, 0, z + .15), .1, .08, C([236, 220, 190]));
    for (const s of [-1, 1]) { add(P(-.02, s * .14, z + .14), P(-.06, s * (.3 + fl), z + .02), .06, .03, C([130, 94, 66])); add(P(.12, s * .07, z + .28), P(.12, s * .07, z + .28), .05, .05, C([236, 196, 90])); glow(...P(.17, s * .07, z + .28), rgb(20, 20, 20)); add(P(0, s * .1, z + .36), P(-.02, s * .12, z + .44), .03, .015, C([150, 110, 80])); }
    glow(...P(.17, 0, z + .22), rgb(236, 160, 60)); },
  bat(o) { const { c, add, glow, C, P, t } = o, z = c.z, fl = Math.sin(t * 22);
    add(P(0, 0, z), P(0, 0, z + .12), .08, .08, C([70, 50, 80]));
    for (const s of [-1, 1]) { add(P(0, s * .06, z + .06), P(-.04, s * .3, z + .1 + fl * .12), .04, .02, C([90, 64, 100])); add(P(-.04, s * .3, z + .1 + fl * .12), P(-.02, s * .42, z - .02 + fl * .08), .03, .015, C([90, 64, 100])); add(P(0, s * .05, z + .18), P(0, s * .06, z + .24), .025, .01, C([70, 50, 80])); glow(...P(.08, s * .035, z + .12), rgb(240, 130, 150)); } },
  slime(o) { const { c, add, glow, C, P, hop, t } = o, sq = 1 + Math.sin(t * 6) * .1;
    add(P(0, 0, hop + .1 / sq), P(0, 0, hop + .2 * sq), .2 * sq, .15, C([120, 220, 120])); glow(...P(-.05, -.08, hop + .33 * sq), rgb(220, 255, 220));
    for (const s of [-1, 1]) glow(...P(.17, s * .07, hop + .2), rgb(30, 60, 30)); },
  cat(o) { const { c, add, glow, C, P, t } = o, dark = [40, 36, 50], st = Math.sin(c.walk) * .07 * c.moving;
    for (const [a, s] of [[.12, -1], [.12, 1], [-.12, -1], [-.12, 1]]) add(P(a + st * s, s * .06, 0), P(a, s * .06, .16), .035, .03, C(dark));
    add(P(.12, 0, .22), P(-.14, 0, .22), .09, .09, C(dark)); const h = P(.22, 0, .34); add(h, h, .09, .09, C(dark));
    for (const s of [-1, 1]) { add(P(.2, s * .06, .4), P(.2, s * .07, .5), .035, .01, C(dark)); glow(...P(.3, s * .04, .36), Math.sin(t * .7) > -.95 ? rgb(250, 220, 90) : rgb(40, 36, 50)); }
    add(P(-.18, 0, .24), P(-.3, Math.sin(t * 2) * .08, .46), .025, .02, C(dark)); },
  golem(o) { const { c, add, glow, C, P, t } = o, st = Math.sin(c.walk) * .06 * c.moving;
    for (const s of [-1, 1]) add(P(st * s, s * .1, 0), P(0, s * .1, .14), .07, .07, C([110, 106, 100]));
    add(P(0, 0, .3), P(0, 0, .3), .2, .2, C([150, 146, 136])); add(P(.02, 0, .55), P(.02, 0, .55), .12, .12, C([160, 156, 146]));
    for (const s of [-1, 1]) { add(P(0, s * .24, .34), P(.04, s * .27, .14), .06, .07, C([130, 126, 118])); glow(...P(.13, s * .05, .57), rgb(120, 230, 200)); }
    add(P(.02, 0, .66), P(.02, .04, .7), .05, .03, C([100, 160, 80])); },
  penguin(o) { const { c, add, glow, C, P, t } = o, wob = Math.sin(c.walk * 1.2) * .05 * c.moving;
    add(P(0, wob, .06), P(0, wob, .34), .14, .11, C([40, 44, 60])); add(P(.06, wob, .08), P(.06, wob, .3), .1, .08, C([246, 246, 250]));
    for (const s of [-1, 1]) { add(P(0, s * .13 + wob, .26), P(0, s * .18 + wob, .12), .035, .025, C([40, 44, 60])); add(P(.06, s * .06, 0), P(.12, s * .06, 0), .035, .03, C([250, 160, 50])); glow(...P(.11, s * .04 + wob, .38), rgb(20, 20, 20)); }
    add(P(.13, wob, .34), P(.2, wob, .33), .025, .015, C([250, 160, 50])); },
  jelly(o) { const { c, add, glow, sglow, C, P, t } = o, z = c.z, pulse = 1 + Math.sin(t * 2.5) * .12;
    sglow(c.x, c.y, z + .1, .16 * pulse, [210, 160, 240]);
    for (let q = 0; q < 6; q++) { const a = q / 6 * 6.283; for (let u = 1; u < 5; u++) glow(c.x + Math.cos(a) * .08 + Math.sin(t * 3 + u + q) * .03, c.y + Math.sin(a) * .08, z - u * .08, u % 2 ? rgb(230, 190, 250) : rgb(180, 140, 230)); } },
  kraken(o) { const { c, add, glow, C, P, t } = o;
    for (let q = 0; q < 10; q++) { const a = q / 10 * 6.283; glow(c.x + Math.cos(a) * .3, c.y + Math.sin(a) * .3, .01, rgb(100, 140, 200)); }
    add([c.x, c.y, .05], [c.x, c.y, .32 + Math.sin(t * 2) * .03], .14, .11, C([180, 80, 140]));
    for (let q = 0; q < 4; q++) { const a = q / 4 * 6.283 + t * .5, w = Math.sin(t * 3 + q); const b = [c.x + Math.cos(a) * .22, c.y + Math.sin(a) * .22, .02]; add(b, [b[0] + Math.cos(a) * .08, b[1] + Math.sin(a) * .08, .25 + w * .08], .05, .025, C([200, 100, 160])); }
    for (const s of [-1, 1]) { add(P(.1, s * .06, .3), P(.1, s * .06, .3), .045, .045, C([250, 250, 250])); glow(...P(.14, s * .06, .3), rgb(20, 20, 20)); } },
  griffin(o) { const { c, add, glow, C, P, t } = o, z = c.z, fl = Math.sin(t * 12) * .15;
    add(P(-.05, 0, z), P(-.22, 0, z - .02), .12, .1, C([236, 210, 150])); add(P(.1, 0, z + .1), P(.1, 0, z + .1), .1, .1, C([250, 250, 240]));
    add(P(.2, 0, z + .08), P(.26, 0, z + .04), .04, .02, C([250, 180, 50])); glow(...P(.18, .05, z + .14), rgb(20, 20, 20));
    for (const s of [-1, 1]) add(P(0, s * .1, z + .08), P(-.1, s * .34, z + .2 + fl), .05, .03, C([250, 250, 240]));
    add(P(-.28, 0, z), P(-.4, 0, z + .12), .02, .015, C([236, 210, 150])); glow(...P(-.42, 0, z + .14), rgb(200, 160, 100)); },
  phoenix(o) { const { c, add, glow, sglow, C, P, t } = o, z = c.z, fl = Math.sin(t * 12) * .15;
    add(P(0, 0, z), P(-.15, 0, z + .02), .1, .08, C([250, 120, 40])); add(P(.12, 0, z + .1), P(.12, 0, z + .1), .08, .08, C([250, 140, 50]));
    glow(...P(.18, .04, z + .12), rgb(20, 20, 20)); add(P(.18, 0, z + .08), P(.24, 0, z + .06), .025, .015, C([255, 220, 90]));
    for (const s of [-1, 1]) add(P(0, s * .08, z + .05), P(-.1, s * .32, z + .18 + fl), .045, .02, C([255, 180, 60]));
    sglow(...P(-.2, 0, z + .04), .05, [255, 220, 90]);
    if (Math.random() < .35) emit({ scene: G.scene.id, x: c.x, y: c.y, z: z * 1.5, vx: (Math.random() - .5) * .4, vy: (Math.random() - .5) * .4, vz: -.3, life: .7, c: rgb(255, 150 + Math.random() * 90 | 0, 60), glow: 1, over: true }); },
  unicorn(o) { const { c, add, glow, C, P, t } = o, white = [250, 250, 252], st = Math.sin(c.walk) * .08 * c.moving;
    for (const [a, s] of [[.13, -1], [.13, 1], [-.13, -1], [-.13, 1]]) add(P(a + st * s, s * .07, 0), P(a, s * .07, .2), .035, .03, C(white));
    add(P(.14, 0, .28), P(-.15, 0, .27), .12, .11, C(white)); const h = P(.26, 0, .44); add(P(.18, 0, .32), h, .07, .07, C(white)); add(h, P(.34, 0, .42), .07, .055, C(white));
    add(P(.28, 0, .52), P(.36, 0, .7), .025, .008, C([250, 220, 90])); glow(...P(.3, .05, .47), rgb(20, 20, 20));
    const mane = [[240, 120, 160], [250, 200, 90], [120, 200, 240], [180, 140, 240]];
    for (let q = 0; q < 4; q++) add(P(.2 - q * .06, 0, .54 - q * .05), P(.18 - q * .06, 0, .5 - q * .05), .04, .03, C(mane[q]));
    for (let q = 0; q < 4; q++) add(P(-.24 - q * .04, 0, .3 - q * .05), P(-.24 - q * .04, 0, .3 - q * .05), .04, .04, C(mane[q]));
    if (c.moving > .3 && Math.random() < .3) emit({ scene: G.scene.id, x: c.x, y: c.y, z: .1, vx: 0, vy: 0, vz: .3, life: 1, c: rgb(...mane[Math.random() * 4 | 0]), glow: 1, over: true }); },
};

const MORE_API = {
  wear(slot, id) { wear(slot, id || null); },
  slots() { return SLOTS; },
};
Object.assign(WARES_API, MORE_API);

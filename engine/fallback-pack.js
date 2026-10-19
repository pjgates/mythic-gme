/**
 * Non-infringing placeholder word lists written for this repository: generic English verbs, nouns, adverbs,
 * adjectives and place words. They are not the Mythic GME Meaning Tables; owners of the book import their own
 * pack (ticket 06), and until then the drawer says the fallback is in use.
 */
export const FALLBACK_PACK_ID = 'fallback';
const ACTION_VERBS = [
    'Abandon', 'Accept', 'Advance', 'Agree', 'Answer', 'Arrive', 'Ask', 'Attack', 'Avoid', 'Bargain',
    'Begin', 'Bend', 'Block', 'Borrow', 'Break', 'Build', 'Burn', 'Bury', 'Call', 'Carry',
    'Chase', 'Choose', 'Climb', 'Close', 'Command', 'Conceal', 'Confess', 'Continue', 'Create', 'Cross',
    'Decide', 'Defend', 'Delay', 'Deliver', 'Demand', 'Deny', 'Destroy', 'Discover', 'Doubt', 'Dream',
    'Enter', 'Escape', 'Examine', 'Exchange', 'Explain', 'Explore', 'Fail', 'Fall', 'Fear', 'Fight',
    'Find', 'Finish', 'Flee', 'Follow', 'Forget', 'Forgive', 'Gather', 'Give', 'Greet', 'Grow',
    'Guard', 'Guess', 'Hide', 'Hold', 'Hunt', 'Hurry', 'Ignore', 'Imagine', 'Improve', 'Invite',
    'Join', 'Judge', 'Jump', 'Keep', 'Kneel', 'Lead', 'Learn', 'Leave', 'Lift', 'Listen',
    'Lose', 'Mark', 'Measure', 'Meet', 'Mend', 'Mock', 'Move', 'Negotiate', 'Notice', 'Obey',
    'Offer', 'Open', 'Order', 'Pay', 'Persuade', 'Plan', 'Pray', 'Promise', 'Protect', 'Pull',
];
const ACTION_OBJECTS = [
    'Advantage', 'Alliance', 'Ambition', 'Ancestor', 'Anger', 'Animal', 'Answer', 'Army', 'Battle', 'Beauty',
    'Belief', 'Blood', 'Bond', 'Border', 'Bridge', 'Burden', 'Chance', 'Change', 'Child', 'Choice',
    'Comfort', 'Contract', 'Courage', 'Crime', 'Crowd', 'Curse', 'Danger', 'Darkness', 'Death', 'Debt',
    'Desire', 'Disease', 'Disguise', 'Doubt', 'Dream', 'Duty', 'Enemy', 'Escape', 'Evidence', 'Failure',
    'Faith', 'Family', 'Fear', 'Fire', 'Food', 'Fortune', 'Freedom', 'Friend', 'Future', 'Garden',
    'Gift', 'Goal', 'Gold', 'Grief', 'Guilt', 'Harvest', 'Health', 'Hero', 'History', 'Home',
    'Honour', 'Hope', 'Hunger', 'Idea', 'Innocence', 'Instinct', 'Journey', 'Joy', 'Justice', 'Key',
    'Knowledge', 'Land', 'Law', 'Leader', 'Legend', 'Letter', 'Lie', 'Light', 'Love', 'Loyalty',
    'Luck', 'Machine', 'Magic', 'Map', 'Market', 'Memory', 'Message', 'Mirror', 'Money', 'Mountain',
    'Music', 'Mystery', 'Nature', 'Need', 'News', 'Night', 'Oath', 'Obstacle', 'Ocean', 'Treasure',
];
const DESCRIPTION_ADVERBS = [
    'Abruptly', 'Absently', 'Angrily', 'Awkwardly', 'Barely', 'Bitterly', 'Blindly', 'Bluntly', 'Briefly', 'Brightly',
    'Briskly', 'Brutally', 'Casually', 'Clumsily', 'Coldly', 'Constantly', 'Coyly', 'Cruelly', 'Darkly', 'Deeply',
    'Desperately', 'Directly', 'Distantly', 'Doubtfully', 'Dully', 'Eagerly', 'Early', 'Easily', 'Endlessly', 'Evenly',
    'Faintly', 'Falsely', 'Firmly', 'Fondly', 'Formally', 'Frankly', 'Gradually', 'Gravely', 'Greedily', 'Grimly',
    'Harshly', 'Heavily', 'Hollowly', 'Honestly', 'Hungrily', 'Idly', 'Instantly', 'Jealously', 'Keenly', 'Lately',
    'Lavishly', 'Lightly', 'Loudly', 'Madly', 'Meekly', 'Mildly', 'Narrowly', 'Nearly', 'Nervously', 'Nobly',
    'Numbly', 'Openly', 'Painfully', 'Partly', 'Patiently', 'Plainly', 'Poorly', 'Proudly', 'Purely', 'Quickly',
    'Quietly', 'Randomly', 'Rapidly', 'Rarely', 'Readily', 'Recklessly', 'Richly', 'Rigidly', 'Sadly', 'Secretly',
    'Sharply', 'Shyly', 'Silently', 'Simply', 'Slowly', 'Smoothly', 'Softly', 'Solemnly', 'Sorely', 'Sternly',
    'Stiffly', 'Strangely', 'Suddenly', 'Sweetly', 'Tightly', 'Truly', 'Urgently', 'Vaguely', 'Warmly', 'Wearily',
];
const DESCRIPTION_ADJECTIVES = [
    'Ancient', 'Angry', 'Awkward', 'Bare', 'Bitter', 'Blind', 'Bold', 'Brave', 'Brief', 'Brittle',
    'Busy', 'Calm', 'Careful', 'Cheap', 'Clever', 'Close', 'Cloudy', 'Coarse', 'Crooked', 'Crowded',
    'Cruel', 'Curious', 'Deep', 'Delicate', 'Dense', 'Distant', 'Dusty', 'Eager', 'Early', 'Eerie',
    'Elegant', 'Endless', 'Faint', 'Fair', 'Fierce', 'Final', 'Firm', 'Flat', 'Foreign', 'Forgotten',
    'Fragile', 'Frozen', 'Gentle', 'Gloomy', 'Golden', 'Greedy', 'Grim', 'Guilty', 'Hidden', 'High',
    'Hollow', 'Honest', 'Hungry', 'Idle', 'Innocent', 'Jagged', 'Keen', 'Late', 'Lazy', 'Loud',
    'Low', 'Loyal', 'Narrow', 'Noble', 'Noisy', 'Open', 'Pure', 'Quick', 'Quiet', 'Reckless',
    'Rigid', 'Sacred', 'Secret', 'Shallow', 'Sharp', 'Shy', 'Silent', 'Sleepy', 'Slow', 'Sour',
    'Steady', 'Steep', 'Stern', 'Stiff', 'Still', 'Strange', 'Sudden', 'Sweet', 'Swift', 'Tall',
    'Tense', 'Thin', 'Tired', 'Twisted', 'Vast', 'Vivid', 'Wet', 'Wild', 'Wise', 'Worn',
];
const LOCATIONS = [
    'Abbey', 'Alley', 'Arena', 'Attic', 'Bakery', 'Barn', 'Bathhouse', 'Battlefield', 'Beach', 'Bridge',
    'Camp', 'Canal', 'Canyon', 'Castle', 'Cave', 'Cellar', 'Cemetery', 'Chapel', 'Cliff', 'Cottage',
    'Courtyard', 'Crossroads', 'Desert', 'Dock', 'Dungeon', 'Farm', 'Ferry', 'Field', 'Forest', 'Fort',
    'Fountain', 'Garden', 'Gate', 'Glacier', 'Granary', 'Grove', 'Harbour', 'Hill', 'Hut', 'Inn',
    'Island', 'Jungle', 'Kitchen', 'Laboratory', 'Lake', 'Library', 'Lighthouse', 'Marsh', 'Market', 'Meadow',
    'Mill', 'Mine', 'Monastery', 'Mountain', 'Observatory', 'Orchard', 'Palace', 'Pass', 'Pier', 'Plaza',
    'Pond', 'Prison', 'Quarry', 'Reef', 'River', 'Road', 'Ruin', 'School', 'Sewer', 'Shipwreck',
    'Shop', 'Shrine', 'Square', 'Stable', 'Stairway', 'Stream', 'Street', 'Swamp', 'Tavern', 'Temple',
    'Tent', 'Theatre', 'Tomb', 'Tower', 'Trail', 'Treehouse', 'Tunnel', 'Valley', 'Vault', 'Village',
    'Vineyard', 'Volcano', 'Wall', 'Warehouse', 'Waterfall', 'Well', 'Wharf', 'Windmill', 'Woods', 'Workshop',
];
export const FALLBACK_PACK = {
    version: 1,
    id: FALLBACK_PACK_ID,
    label: 'Fallback (non-infringing placeholder)',
    actions: { action1: ACTION_VERBS, action2: ACTION_OBJECTS },
    descriptions: { description1: DESCRIPTION_ADVERBS, description2: DESCRIPTION_ADJECTIVES },
    elements: { locations: { label: 'Locations', entries: LOCATIONS } },
};

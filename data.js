export const TRAINING = [
  {
    key: "upperA", tag: "MON", short: "UPPER A", name: "Upper Body A", focus: "PUSH & LAT FOCUS",
    exercises: [
      { id: "bench", name: "Barbell Bench Press", equipment: "barbell", weight: 20, sets: 3, min: 6, max: 8, inc: 2.5, rest: 120, cues: "Retract shoulder blades, touch chest, press from mid-chest to lock-out." },
      { id: "row", name: "Barbell Bent-Over Row", equipment: "barbell", weight: 20, sets: 3, min: 6, max: 8, inc: 2.5, rest: 120, cues: "Hinged at hips, flat back, pull to waist, squeeze shoulder blades." },
      { id: "pulldown", name: "Lat Pulldown", equipment: "machine", weight: 25, sets: 3, min: 8, max: 10, inc: 2.5, rest: 90, cues: "Sit upright, pull bar to upper chest, squeeze shoulder blades." },
      { id: "incdb", name: "Incline Dumbbell Press", equipment: "dumbbell", weight: 10, sets: 3, min: 8, max: 10, inc: 2, rest: 90, cues: "Incline bench ~30 deg, tuck elbows, press upward and slightly inward." },
      { id: "superset", name: "Superset: Tri & Lateral", equipment: "dumbbell", weight: 10, sets: 3, min: 12, max: 15, inc: 1, rest: 60, cues: "5A OH Tri Ext (3x12-15) + 5B DB Lateral Raise (4x12-15)." },
      { id: "cablecr", name: "Cable Crunch", equipment: "machine", weight: 15, sets: 3, min: 10, max: 15, inc: 2.5, rest: 60, cues: "Kneeling, hold rope by ears, crunch downward using abs." }
    ]
  },
  {
    key: "lowerA", tag: "TUE", short: "LOWER A", name: "Lower Body A", focus: "QUADS & STABILITY",
    exercises: [
      { id: "squat", name: "Barbell Squat", equipment: "barbell", weight: 30, sets: 3, min: 6, max: 8, inc: 5, rest: 120, cues: "Keep chest up, brace core, squat deep until thighs are parallel." },
      { id: "legpress", name: "Leg Press", equipment: "machine", weight: 40, sets: 3, min: 8, max: 10, inc: 10, rest: 90, cues: "Feet shoulder-width, push through heels without locking knees." },
      { id: "legcurlA", name: "Lying Leg Curl", equipment: "machine", weight: 15, sets: 3, min: 10, max: 12, inc: 2.5, rest: 90, cues: "Curl pad toward glutes, squeeze hamstrings." },
      { id: "lunge", name: "Walking DB Lunges", equipment: "dumbbell", weight: 8, sets: 3, min: 10, max: 12, inc: 2, rest: 90, cues: "Per leg. Keep torso upright, lower back knee just above floor." },
      { id: "calfA", name: "Standing Calf Raise", equipment: "machine", weight: 20, sets: 4, min: 12, max: 15, inc: 5, rest: 60, cues: "Balls of feet on block, lower heels for full stretch, raise high." },
      { id: "plank", name: "Core Stability Block", equipment: "bodyweight", weight: 0, sets: 3, min: 30, max: 60, inc: 0, rest: 60, cues: "Plank 30-60s / Side Plank 20-30s. Squeeze glutes, keep hips high." }
    ]
  },
  {
    key: "recoveryA", tag: "WED", short: "RECOV", name: "Active Recovery", focus: "MOBILITY & RECON", recovery: true,
    exercises: [
      { id: "walkA", name: "Light Walk", equipment: "bodyweight", weight: 0, sets: 1, min: 30, max: 45, inc: 0, rest: 0, cues: "30-45 MIN. Brisk pace, outdoor track or treadmill." },
      { id: "mobility", name: "Dynamic Mobility", equipment: "bodyweight", weight: 0, sets: 1, min: 15, max: 20, inc: 0, rest: 0, cues: "15-20 MIN. Dynamic lunge stretches with torso rotation." },
      { id: "foam", name: "Foam Rolling", equipment: "bodyweight", weight: 0, sets: 1, min: 10, max: 15, inc: 0, rest: 0, cues: "Roll quads, hamstrings, and calves. Focus on trigger points." },
      { id: "hydration", name: "Hydration", equipment: "bodyweight", weight: 0, sets: 1, min: 3, max: 4, inc: 0, rest: 0, cues: "Consume 3-4 liters of water, rehydrate the system." },
      { id: "stretchA", name: "Stretching & Breathing", equipment: "bodyweight", weight: 0, sets: 1, min: 10, max: 15, inc: 0, rest: 0, cues: "Seated hamstring stretch, deep diaphragmatic breathing." }
    ]
  },
  {
    key: "upperB", tag: "THU", short: "UPPER B", name: "Upper Body B", focus: "VERTICAL & ARMS",
    exercises: [
      { id: "ohp", name: "Barbell Overhead Press", equipment: "barbell", weight: 20, sets: 3, min: 6, max: 8, inc: 2.5, rest: 120, cues: "Brace core, press straight up, push head through at lockout." },
      { id: "pulldown", name: "Lat Pulldown", equipment: "machine", weight: 25, sets: 3, min: 8, max: 10, inc: 2.5, rest: 90, cues: "Sit upright, pull bar to upper chest, squeeze shoulder blades." },
      { id: "dips", name: "Dips (Chest/Triceps)", equipment: "bodyweight", weight: 0, sets: 3, min: 8, max: 10, inc: 2.5, rest: 90, cues: "Lean forward for chest, upright for triceps. Lower until parallel." },
      { id: "facepull", name: "Face Pulls (Cables)", equipment: "machine", weight: 10, sets: 3, min: 12, max: 15, inc: 2.5, rest: 60, cues: "Pull towards face, externally rotate shoulders, squeeze rear delts." },
      { id: "latraise", name: "DB Lateral Raise", equipment: "dumbbell", weight: 4, sets: 4, min: 12, max: 15, inc: 1, rest: 60, cues: "Raise DBs to shoulder height, slight elbow bend, lead with elbows." },
      { id: "curl", name: "DB Bicep Curls", equipment: "dumbbell", weight: 6, sets: 3, min: 10, max: 12, inc: 1, rest: 60, cues: "Keep elbows locked at sides, curl to shoulder, controlled lowering." }
    ]
  },
  {
    key: "lowerB", tag: "FRI", short: "LOWER B", name: "Lower Body B", focus: "HINGE & POSTERIOR CHAIN",
    exercises: [
      { id: "rdl", name: "Romanian Deadlift", equipment: "barbell", weight: 30, sets: 3, min: 6, max: 8, inc: 5, rest: 120, cues: "Hinge at hips, keep back straight, slight knee bend, feel hamstring stretch." },
      { id: "bss", name: "Bulgarian Split Squat", equipment: "dumbbell", weight: 8, sets: 3, min: 8, max: 10, inc: 2, rest: 90, cues: "Rear foot elevated on bench, lower hips straight down, front knee over ankle." },
      { id: "legext", name: "Leg Extensions", equipment: "machine", weight: 20, sets: 3, min: 12, max: 15, inc: 2.5, rest: 60, cues: "Control movement, fully extend legs, squeeze quads at top, lower slowly." },
      { id: "legcurlB", name: "Seated Leg Curls", equipment: "machine", weight: 20, sets: 3, min: 10, max: 12, inc: 2.5, rest: 60, cues: "Adjust pad, secure lap, curl legs back, squeeze hamstrings, control weight." },
      { id: "calfB", name: "Seated Calf Raises", equipment: "machine", weight: 20, sets: 3, min: 12, max: 15, inc: 5, rest: 60, cues: "Balls of feet on platform, lower heels for full stretch, raise high on toes." },
      { id: "hlr", name: "Hanging Knee Raise", equipment: "bodyweight", weight: 0, sets: 3, min: 10, max: 15, inc: 0, rest: 60, cues: "Hang from bar, keep upper body still, raise knees to chest." }
    ]
  },
  {
    key: "recoveryB", tag: "SAT/SUN", short: "RECOV", name: "Recovery & Prep", focus: "SYSTEM RESET & MEAL PREP", recovery: true,
    exercises: [
      { id: "walkB", name: "Recovery Walk", equipment: "bodyweight", weight: 0, sets: 1, min: 30, max: 45, inc: 0, rest: 0, cues: "30-45 MIN WALK. Brisk, conversational pace." },
      { id: "stretchB", name: "Light Stretching", equipment: "bodyweight", weight: 0, sets: 1, min: 10, max: 15, inc: 0, rest: 0, cues: "Focus on major muscle groups, hold stretches for 30s." },
      { id: "mealprep", name: "Meal Prep", equipment: "bodyweight", weight: 0, sets: 1, min: 1, max: 1, inc: 0, rest: 0, cues: "Cook proteins, prep vegetables, portion meals for the week." }
    ]
  }
];

export const STAPLES = [
  { name: "Omena (Silver Fish)", p: 45, cal: 290 },
  { name: "3 Eggs", p: 18, cal: 210 },
  { name: "Githeri", p: 20, cal: 340 },
  { name: "Ndengu (Green Gram)", p: 18, cal: 260 },
  { name: "Groundnuts", p: 8, cal: 170 },
  { name: "Ugali & Greens", p: 6, cal: 380 }
];

export const MEAL_PLAN = {
  mon: {
    label: "MONDAY", focus: "UPPER A",
    meals: [
      { time: "08:00", name: "Heavy Breakfast", desc: "1 packet Indomie + 2 eggs + 1 large mug milky tea + 1 slice bread.", p: 26, cal: 520 },
      { time: "16:45", name: "Pre-Workout Snack", desc: "1–2 ripe bananas + 1 packet roasted groundnuts (njugu). (EAT ON CAMPUS)", p: 8, cal: 220 },
      { time: "20:15", name: "Heavy Supper", desc: "Generous white ugali + stewed/fried omena (~130–140g) + sukuma wiki.", p: 68, cal: 880 }
    ], totalP: 102, totalCal: 1620
  },
  tue: {
    label: "TUESDAY", focus: "LOWER A",
    meals: [
      { time: "07:30", name: "Heavy Breakfast", desc: "2 cups cooked rice (or Indomie) + 1.5 cups stewed ndengu/beans + milky chai.", p: 36, cal: 680 },
      { time: "16:45", name: "Pre-Workout Snack", desc: "1 ripe banana + 1 packet roasted njugu.", p: 8, cal: 220 },
      { time: "20:15", name: "Heavy Supper", desc: "White Ugali + 3 scrambled eggs with tomatoes/onions + sukuma wiki.", p: 26, cal: 680 },
      { time: "22:00", name: "Bedtime Recovery", desc: "1 packet (500ml) fresh milk or leftover njugu.", p: 16, cal: 300 }
    ], totalP: 106, totalCal: 1880
  },
  wed: {
    label: "WEDNESDAY", focus: "RECOVERY",
    meals: [
      { time: "08:30", name: "Heavy Breakfast", desc: "3 eggs + 2 slices bread + milky chai.", p: 28, cal: 450 },
      { time: "16:45", name: "Snack", desc: "Banana + groundnuts.", p: 8, cal: 220 },
      { time: "20:00", name: "Heavy Supper", desc: "Ugali + Stewed Ndengu + greens.", p: 68, cal: 850 }
    ], totalP: 104, totalCal: 1520
  },
  thu: {
    label: "THURSDAY", focus: "UPPER B",
    meals: [
      { time: "07:30", name: "Heavy Breakfast", desc: "2 cups rice + 1.5 cups ndengu + milky chai.", p: 36, cal: 680 },
      { time: "16:45", name: "Pre-Workout Snack", desc: "1 banana + 1 packet njugu + black tea/coffee.", p: 8, cal: 220 },
      { time: "20:15", name: "Heavy Supper", desc: "Ugali + Eggs + Sukuma wiki.", p: 46, cal: 750 },
      { time: "22:00", name: "Bedtime Recovery", desc: "1 glass fresh milk.", p: 16, cal: 300 }
    ], totalP: 106, totalCal: 1950
  },
  fri: {
    label: "FRIDAY", focus: "LOWER B",
    meals: [
      { time: "08:00", name: "Heavy Breakfast", desc: "Indomie + 2 eggs + milky chai + bread.", p: 26, cal: 520 },
      { time: "16:45", name: "Pre-Workout Snack", desc: "2 bananas + njugu.", p: 8, cal: 220 },
      { time: "20:15", name: "Heavy Supper", desc: "Large Ugali + Fried/Stewed Omena + Sukuma wiki.", p: 68, cal: 880 }
    ], totalP: 102, totalCal: 1620
  },
  sat: {
    label: "SATURDAY", focus: "PREP",
    meals: [
      { time: "09:00", name: "Heavy Breakfast", desc: "3 eggs + 2 bread slices + milky chai.", p: 28, cal: 450 },
      { time: "16:30", name: "Snack", desc: "Banana + njugu.", p: 8, cal: 220 },
      { time: "20:00", name: "Heavy Supper", desc: "Spaghetti + Boiled/Fried Eggs + tomato sauce.", p: 21, cal: 580 },
      { time: "22:00", name: "Bedtime Recovery", desc: "1 glass fresh milk.", p: 16, cal: 300 }
    ], totalP: 73, totalCal: 1550
  },
  sun: {
    label: "SUNDAY", focus: "PREP",
    meals: [
      { time: "09:00", name: "Heavy Breakfast", desc: "Rice + Ndengu + milky chai.", p: 36, cal: 680 },
      { time: "16:30", name: "Snack", desc: "Banana + njugu.", p: 8, cal: 220 },
      { time: "20:00", name: "Heavy Supper", desc: "Ugali + Omena + Greens.", p: 68, cal: 880 }
    ], totalP: 112, totalCal: 1780
  }
};

export const MILESTONES = [
  { k: "w0", label: "WEEK 0", sub: "BASELINE" },
  { k: "w2", label: "WEEK 2", sub: "CHECKPOINT" },
  { k: "w4", label: "WEEK 4", sub: "MID-PHASE" },
  { k: "w6", label: "WEEK 6", sub: "CHECKPOINT" },
  { k: "w8", label: "WEEK 8", sub: "FINAL" }
];

export const POSES = ["front", "side", "back", "chest", "biceps", "triceps", "abs", "legs_front", "legs_back"];
export const formatPose = (p) => p.replace("_", " ").toUpperCase();
export const PLATES = [25, 20, 15, 10, 5, 2.5, 1.25];
export const BAR_WEIGHT = 20;

export const BLUEPRINTS = [
  { key: "mon", label: "Monday: Upper A", src: "/images/mon.jpg" },
  { key: "tue", label: "Tuesday: Lower A", src: "/images/tue.jpg" },
  { key: "wed", label: "Wednesday: Recovery", src: "/images/wed.jpg" },
  { key: "thu", label: "Thursday: Upper B", src: "/images/thu.jpg" },
  { key: "fri", label: "Friday: Lower B", src: "/images/fri.jpg" },
  { key: "weekend", label: "Sat & Sun: Recovery & Prep", src: "/images/weekend.jpg" },
  { key: "overview", label: "The Complete Operator Split", src: "/images/overview.jpg", full: true }
];
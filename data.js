export const TRAINING = [
  {
    key: "upperA", tag: "MON", short: "UPPER A", name: "Upper Body A", focus: "PUSH & LAT FOCUS",
    exercises: [
      { id: "bench", name: "Barbell Bench Press", equipment: "barbell", weight: 37.5, sets: 4, min: 6, max: 8, inc: 2.5, rest: 150, cues: "Pinch shoulder blades down and back. Lower 2 sec to lower sternum, 0.5-sec pause, explode up.", alternates: [{ id: "db_bench", name: "DB Bench Press", equipment: "dumbbell" }] },
      { id: "row", name: "Barbell Bent-Over Row", equipment: "barbell", weight: 40, sets: 4, min: 6, max: 8, inc: 2.5, rest: 120, cues: "Hinge at hips, flat back, pull bar to lower waist, squeeze shoulder blades 1 sec.", alternates: [{ id: "db_row", name: "DB Row", equipment: "dumbbell" }] },
      { id: "pulldown", name: "Lat Pulldown", equipment: "machine", weight: 40, sets: 3, min: 8, max: 10, inc: 2.5, rest: 90, cues: "Sit tall, pull bar to upper chest, drive elbows down toward hips.", alternates: [{ id: "pullup", name: "Pull-ups", equipment: "bodyweight" }] },
      { id: "incdb", name: "Incline DB Press (30°)", equipment: "dumbbell", weight: 12, sets: 4, min: 8, max: 10, inc: 2, rest: 120, cues: "Low incline (~30°). Tuck elbows at 45°, squeeze inner elbows together at the top." },
      { id: "cablefly", name: "Cable Fly (Low-to-High)", equipment: "machine", weight: 10, sets: 3, min: 12, max: 15, inc: 2.5, rest: 90, cues: "Slight bend in elbows; scoop hands upward and squeeze upper/inner chest hard." },
      { id: "supersetA", name: "Superset: Tri & Side Delts", equipment: "dumbbell", weight: 15, sets: 3, min: 10, max: 15, inc: 1, rest: 90, cues: "5A Overhead Tri Ext (15kg): Flare rope overhead. 5B DB Lat Raise (5kg): Lead with elbows." },
      { id: "curl", name: "DB Bicep Curls", equipment: "dumbbell", weight: 8, sets: 4, min: 10, max: 12, inc: 1, rest: 90, cues: "Lock elbows at ribs; full stretch at bottom, 2-sec controlled lowering." },
      { id: "cablecr", name: "Cable Crunch", equipment: "machine", weight: 15, sets: 3, min: 10, max: 15, inc: 2.5, rest: 60, cues: "Hold rope by ears, round spine downward to crunch ribs to pelvis." }
    ]
  },
  {
    key: "lowerA", tag: "TUE", short: "LOWER A", name: "Lower Body A", focus: "QUADS & STABILITY",
    exercises: [
      { id: "squat", name: "Barbell Squat", equipment: "barbell", weight: 40, sets: 4, min: 6, max: 8, inc: 5, rest: 150, cues: "Brace core tight, squat to parallel or deeper, drive up through mid-foot.", alternates: [{ id: "goblet_squat", name: "Goblet Squat", equipment: "dumbbell" }] },
      { id: "legpress", name: "Leg Press", equipment: "machine", weight: 70, sets: 4, min: 8, max: 10, inc: 10, rest: 120, cues: "Feet shoulder-width mid-platform; lower deep, press without locking knees at top.", alternates: [{ id: "bss", name: "Bulgarian Split Squat", equipment: "dumbbell" }] },
      { id: "legcurlA", name: "Lying Leg Curl", equipment: "machine", weight: 30, sets: 3, min: 10, max: 12, inc: 2.5, rest: 90, cues: "Keep hips pressed into pad, squeeze hamstrings at peak, lower slowly." },
      { id: "lunge", name: "Walking DB Lunges", equipment: "dumbbell", weight: 8, sets: 3, min: 10, max: 12, inc: 2, rest: 90, cues: "Per leg. Torso upright, long stride, tap back knee lightly to floor." },
      { id: "calfA", name: "Standing Calf Raise", equipment: "machine", weight: 40, sets: 4, min: 12, max: 15, inc: 5, rest: 60, cues: "2-second dead pause at bottom stretch on every rep; push high onto big toes." },
      { id: "hlr", name: "Hanging Knee Raise", equipment: "bodyweight", weight: 0, sets: 3, min: 10, max: 15, inc: 0, rest: 60, cues: "Curl pelvis upward toward chest; no swinging momentum." },
      { id: "plank", name: "Core Stability Block", equipment: "bodyweight", weight: 0, sets: 3, min: 30, max: 60, inc: 0, rest: 45, cues: "Front plank 45-60s + side planks 20-30s; squeeze glutes and brace abs rigid." }
    ]
  },
  {
    key: "recoveryA", tag: "WED", short: "RECOV", name: "Active Recovery", focus: "MOBILITY & RECON", recovery: true,
    exercises: [
      { id: "walkA", name: "Light Walk", equipment: "bodyweight", weight: 0, sets: 1, min: 30, max: 45, inc: 0, rest: 0, cues: "30-45 MIN. Brisk conversational pace outdoors or treadmill." },
      { id: "mobility", name: "Mobility & Foam Rolling", equipment: "bodyweight", weight: 0, sets: 1, min: 15, max: 20, inc: 0, rest: 0, cues: "15-20 MIN. Dynamic hip/thoracic openers + rolling quads, hamstrings, calves." },
      { id: "nutrition", name: "Nutrition & Hydration", equipment: "bodyweight", weight: 0, sets: 1, min: 3, max: 4, inc: 0, rest: 0, cues: "Hit 3-4 liters of water and 120-130g protein to fuel Thursday's session." }
    ]
  },
  {
    key: "upperB", tag: "THU", short: "UPPER B", name: "Upper Body B", focus: "VERTICAL & ARMS",
    exercises: [
      { id: "ohp", name: "Barbell Overhead Press", equipment: "barbell", weight: 25, sets: 4, min: 6, max: 8, inc: 2.5, rest: 150, cues: "Squeeze glutes and abs tight, press straight vertical, push head through at lockout.", alternates: [{ id: "db_ohp", name: "DB Overhead Press", equipment: "dumbbell" }] },
      { id: "pulldownB", name: "Lat Pulldown", equipment: "machine", weight: 40, sets: 3, min: 8, max: 10, inc: 2.5, rest: 90, cues: "Pull bar smoothly to upper chest, pause 1 sec at bottom contraction." },
      { id: "rowB", name: "Barbell / Chest-Supported Row", equipment: "barbell", weight: 25, sets: 3, min: 8, max: 10, inc: 2.5, rest: 90, cues: "Pull elbows back toward hips, pause 1 sec at squeeze." },
      { id: "incdb", name: "Incline DB Press (30°) (Replaces Dips)", equipment: "dumbbell", weight: 10, sets: 3, min: 8, max: 10, inc: 2, rest: 120, cues: "Secondary weekly chest builder. Pin shoulder blades into bench, deep stretch at bottom." },
      { id: "pushdown", name: "Cable Rope Triceps Pushdown", equipment: "machine", weight: 15, sets: 3, min: 10, max: 12, inc: 2.5, rest: 90, cues: "Pin elbows tightly to sides; spread rope apart at lockout for lateral tricep width." },
      { id: "latraise", name: "DB Lateral Raise", equipment: "dumbbell", weight: 5, sets: 3, min: 12, max: 15, inc: 1, rest: 60, cues: "Strict control; raise to shoulder height leading with elbows." },
      { id: "curlB", name: "DB Bicep Curls (or Incline DB Curl)", equipment: "dumbbell", weight: 6, sets: 3, min: 10, max: 12, inc: 1, rest: 90, cues: "Zero torso swing; strict 2-second lowering phase." },
      { id: "hammer", name: "Hammer Curls", equipment: "dumbbell", weight: 8, sets: 3, min: 10, max: 12, inc: 1, rest: 90, cues: "Neutral grip (thumbs up) to thicken the brachialis and push biceps higher." },
      { id: "facepull", name: "Face Pulls (Cables)", equipment: "machine", weight: 10, sets: 3, min: 15, max: 20, inc: 2.5, rest: 60, cues: "Pull rope to eye level, externally rotate hands backward to hit rear delts." }
    ]
  },
  {
    key: "lowerB", tag: "FRI", short: "LOWER B", name: "Lower Body B", focus: "HINGE & POSTERIOR CHAIN",
    exercises: [
      { id: "rdl", name: "Romanian Deadlift (RDL)", equipment: "barbell", weight: 60, sets: 4, min: 6, max: 8, inc: 5, rest: 150, cues: "Push hips back into wall behind you, slight knee bend, keep bar gliding along shins.", alternates: [{ id: "db_rdl", name: "DB Romanian Deadlift", equipment: "dumbbell" }] },
      { id: "bss", name: "Bulgarian Split Squat", equipment: "dumbbell", weight: 12, sets: 3, min: 8, max: 10, inc: 2, rest: 90, cues: "Lean torso forward 15° to load the front glute; lower straight down under control." },
      { id: "legext", name: "Leg Extensions", equipment: "machine", weight: 45, sets: 3, min: 12, max: 15, inc: 2.5, rest: 90, cues: "Full knee extension, 1-sec hard quad squeeze at top, 3-sec slow lowering." },
      { id: "legcurlB", name: "Seated Leg Curls", equipment: "machine", weight: 20, sets: 4, min: 10, max: 12, inc: 2.5, rest: 90, cues: "Lock lap pad tight, curl heels back smoothly, control the return." },
      { id: "calfB", name: "Seated Calf Raises", equipment: "machine", weight: 50, sets: 4, min: 12, max: 15, inc: 5, rest: 60, cues: "Full ankle stretch at bottom (2-sec pause), push high onto balls of feet." },
      { id: "hlr", name: "Hanging Knee Raise", equipment: "bodyweight", weight: 0, sets: 3, min: 10, max: 15, inc: 0, rest: 60, cues: "You hit 15 reps across all sets—slow the tempo (3 sec down) or hold a light DB between feet." },
      { id: "cablecr", name: "Cable Crunch", equipment: "machine", weight: 15, sets: 3, min: 12, max: 15, inc: 2.5, rest: 60, cues: "Curl sternum down toward hips; do not sit back onto your heels." }
      // Note: Rear Delt Fly removed from Friday as per blueprint
    ]
  },
  {
    key: "recoveryB", tag: "SAT", short: "REST", name: "Recovery & Prep", focus: "SYSTEM RESET", recovery: true,
    exercises: [
      { id: "walkB", name: "Recovery Walk", equipment: "bodyweight", weight: 0, sets: 1, min: 30, max: 45, inc: 0, rest: 0, cues: "30-45 minute brisk recovery walk." },
      { id: "stretchB", name: "Light Stretching", equipment: "bodyweight", weight: 0, sets: 1, min: 10, max: 15, inc: 0, rest: 0, cues: "10-15 minutes light full-body stretching." },
      { id: "sleep", name: "Sleep & Refuel", equipment: "bodyweight", weight: 0, sets: 1, min: 1, max: 1, inc: 0, rest: 0, cues: "7.5–9 hours of sleep per night. Prep your beans, omena, and complex carbs." }
    ]
  },
  {
    key: "recoveryC", tag: "SUN", short: "REST", name: "Recovery & Prep", focus: "SYSTEM RESET", recovery: true,
    exercises: [
      { id: "walkC", name: "Recovery Walk", equipment: "bodyweight", weight: 0, sets: 1, min: 30, max: 45, inc: 0, rest: 0, cues: "30-45 minute brisk recovery walk." },
      { id: "stretchC", name: "Light Stretching", equipment: "bodyweight", weight: 0, sets: 1, min: 10, max: 15, inc: 0, rest: 0, cues: "10-15 minutes light full-body stretching." },
      { id: "sleepC", name: "Sleep & Refuel", equipment: "bodyweight", weight: 0, sets: 1, min: 1, max: 1, inc: 0, rest: 0, cues: "7.5–9 hours of sleep per night. Prep your meals for Monday." }
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
    prep: "Boil beans (KES 40) for tomorrow's lunch.",
    meals: [
      { time: "6:00am", name: "Breakfast", desc: "2 cups thick milk uji with sugar, 4 biscuits", p: 15, cal: 400 },
      { time: "10:00am", name: "Snack", desc: "1 glass of milk, 4 biscuits", p: 10, cal: 350 },
      { time: "1:00pm", name: "Lunch (Cold)", desc: "Cold stir-fried spaghetti with omena", p: 25, cal: 500 },
      { time: "6:30pm", name: "Pre-Workout", desc: "1 pack indomie with a handful of omena (half the sachet)", p: 20, cal: 450 },
      { time: "8:40pm", name: "Supper", desc: "Family supper, big portion: 2 cups ugali, your share of the eggs (about 2), greens", p: 18, cal: 550 },
      { time: "Bed", name: "Recovery", desc: "1 glass of milk", p: 8, cal: 150 }
    ], totalP: 96, totalCal: 2400
  },
  tue: {
    label: "TUESDAY", focus: "LOWER A",
    prep: "Dry-fry a big handful of omena with onion for tomorrow's lunch.",
    meals: [
      { time: "6:00am", name: "Breakfast", desc: "2 cups thick milk uji with sugar, 4 biscuits", p: 15, cal: 400 },
      { time: "10:00am", name: "Snack", desc: "1 glass of milk, 4 biscuits", p: 10, cal: 350 },
      { time: "1:00pm", name: "Lunch (Cold)", desc: "Cold beans (boiled Monday evening) in a container, 4 biscuits", p: 20, cal: 450 },
      { time: "6:30pm", name: "Pre-Workout", desc: "1 pack indomie with a handful of omena (half the sachet)", p: 20, cal: 450 },
      { time: "8:40pm", name: "Supper", desc: "Family supper, big portion: 2.5 cups rice with beans", p: 22, cal: 650 },
      { time: "Bed", name: "Recovery", desc: "1 glass of milk", p: 8, cal: 150 }
    ], totalP: 95, totalCal: 2450
  },
  wed: {
    label: "WEDNESDAY", focus: "REST DAY",
    prep: "Boil green grams (KES 40) for tomorrow's lunch.",
    meals: [
      { time: "6:00am", name: "Breakfast", desc: "2 cups thick milk uji with sugar, 3 biscuits", p: 14, cal: 350 },
      { time: "10:00am", name: "Snack", desc: "1 glass of milk, 3 biscuits", p: 9, cal: 300 },
      { time: "1:00pm", name: "Lunch (Cold)", desc: "Dry-fried omena, 6 biscuits, a packet of milk", p: 30, cal: 550 },
      { time: "6:30pm", name: "Snack", desc: "Tea with milk, 3 biscuits", p: 5, cal: 200 },
      { time: "8:30pm", name: "Supper", desc: "Spaghetti with your share of the eggs (about 2), plus extra spaghetti", p: 18, cal: 600 },
      { time: "Bed", name: "Recovery", desc: "1 glass of milk", p: 8, cal: 150 }
    ], totalP: 84, totalCal: 2150
  },
  thu: {
    label: "THURSDAY", focus: "UPPER B",
    prep: "Stir-fry spaghetti with omena for tomorrow's lunch.",
    meals: [
      { time: "6:00am", name: "Breakfast", desc: "2 cups thick milk uji with sugar, 4 biscuits", p: 15, cal: 400 },
      { time: "10:00am", name: "Snack", desc: "1 glass of milk, 4 biscuits", p: 10, cal: 350 },
      { time: "1:00pm", name: "Lunch (Cold)", desc: "Cold green grams (boiled Wednesday evening), 4 biscuits", p: 18, cal: 450 },
      { time: "6:30pm", name: "Pre-Workout", desc: "1 pack indomie with a handful of omena (half the sachet)", p: 20, cal: 450 },
      { time: "8:40pm", name: "Supper", desc: "Family supper, big portion: 2.5 cups rice with green grams", p: 22, cal: 650 },
      { time: "Bed", name: "Recovery", desc: "1 glass of milk", p: 8, cal: 150 }
    ], totalP: 93, totalCal: 2450
  },
  fri: {
    label: "FRIDAY", focus: "LOWER B",
    prep: "Nothing, the weekend lets you cook.",
    meals: [
      { time: "6:00am", name: "Breakfast", desc: "2 cups thick milk uji with sugar, 4 biscuits", p: 15, cal: 400 },
      { time: "10:00am", name: "Snack", desc: "1 glass of milk, 4 biscuits", p: 10, cal: 350 },
      { time: "1:00pm", name: "Lunch (Cold)", desc: "Cold stir-fried spaghetti with omena", p: 25, cal: 500 },
      { time: "6:30pm", name: "Pre-Workout", desc: "1 pack indomie with a handful of omena (half the sachet)", p: 20, cal: 450 },
      { time: "8:40pm", name: "Supper", desc: "Family supper, big portion: 2 cups ugali with omena and greens, plus a cup of beans or green grams if any", p: 28, cal: 650 },
      { time: "Bed", name: "Recovery", desc: "1 glass of milk", p: 8, cal: 150 }
    ], totalP: 106, totalCal: 2500
  },
  sat: {
    label: "SATURDAY", focus: "REST DAY",
    prep: "No prep needed tonight.",
    meals: [
      { time: "8:00am", name: "Breakfast", desc: "2 cups milk uji with sugar, 3 biscuits", p: 14, cal: 350 },
      { time: "11:00am", name: "Snack", desc: "1 glass of milk, 3 biscuits", p: 9, cal: 300 },
      { time: "1:00pm", name: "Lunch", desc: "2 cups rice with green grams or beans and a handful of fried omena", p: 35, cal: 700 },
      { time: "4:00pm", name: "Snack", desc: "Tea with milk, 3 biscuits", p: 5, cal: 200 },
      { time: "7:30pm", name: "Supper", desc: "Family supper, normal portion", p: 20, cal: 500 },
      { time: "Bed", name: "Recovery", desc: "1 glass of milk", p: 8, cal: 150 }
    ], totalP: 91, totalCal: 2200
  },
  sun: {
    label: "SUNDAY", focus: "REST DAY",
    prep: "Stir-fry spaghetti with omena for Monday's lunch.",
    meals: [
      { time: "8:00am", name: "Breakfast", desc: "2 cups milk uji with sugar, 3 biscuits", p: 14, cal: 350 },
      { time: "11:00am", name: "Snack", desc: "1 glass of milk, 3 biscuits", p: 9, cal: 300 },
      { time: "1:00pm", name: "Lunch", desc: "2 cups ugali with omena and greens", p: 25, cal: 550 },
      { time: "4:00pm", name: "Snack", desc: "Tea with milk, 3 biscuits", p: 5, cal: 200 },
      { time: "7:30pm", name: "Supper", desc: "Family supper, normal portion", p: 20, cal: 500 },
      { time: "Bed", name: "Recovery", desc: "1 glass of milk", p: 8, cal: 150 }
    ], totalP: 81, totalCal: 2050
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
export const BAR_WEIGHT = 0;

export const BLUEPRINTS = [
  { key: "mon", label: "Monday: Upper A", src: "/images/mon.jpg" },
  { key: "tue", label: "Tuesday: Lower A", src: "/images/tue.jpg" },
  { key: "wed", label: "Wednesday: Recovery", src: "/images/wed.jpg" },
  { key: "thu", label: "Thursday: Upper B", src: "/images/thu.jpg" },
  { key: "fri", label: "Friday: Lower B", src: "/images/fri.jpg" },
  { key: "weekend", label: "Sat & Sun: Recovery & Prep", src: "/images/weekend.jpg" },
  { key: "overview", label: "The Complete Operator Split", src: "/images/overview.jpg", full: true }
];
export const QUICK_STASH = [
  { name: "1 Egg", p: 6, cal: 75 },
  { name: "2 Eggs", p: 12, cal: 150 },
  { name: "Milk (Glass)", p: 8, cal: 150 },
  { name: "Groundnuts", p: 8, cal: 160 },
  { name: "Omena (Plate)", p: 45, cal: 350 },
  { name: "Ndengu (Cup)", p: 18, cal: 230 }
];

export const GROCERY_LIST = [
  { name: "Eggs (Tray)", qty: "1 Tray (~30 pcs)", checked: false },
  { name: "Omena (Silver Fish)", qty: "1.2 kg", checked: false },
  { name: "Ndengu (Green Grams)", qty: "1 kg", checked: false },
  { name: "Beans (Maharagwe)", qty: "1 kg", checked: false },
  { name: "Milk / Mala", qty: "3-4 Litres", checked: false },
  { name: "Indomie (Packets)", qty: "4-5 packs", checked: false },
  { name: "Maize Flour (Unga)", qty: "2 kg", checked: false },
  { name: "Spaghetti", qty: "2 packs", checked: false },
  { name: "Biscuits", qty: "2 packs", checked: false },
  { name: "Sukuma Wiki / Greens", qty: "Fresh (Daily)", checked: false },
  { name: "Cooking Oil", qty: "1 Litre", checked: false }
];
export const TRAINING = [
  {
    key: "upperA", tag: "MON", short: "UPPER A", name: "Upper Body A", focus: "PUSH & LAT FOCUS",
    exercises: [
      { id: "bench", name: "Barbell Bench Press", equipment: "barbell", weight: 20, sets: 3, min: 6, max: 8, inc: 2.5, rest: 120, cues: "Retract shoulder blades, touch chest, press from mid-chest to lock-out." },
      { id: "row", name: "Barbell Bent-Over Row", equipment: "barbell", weight: 20, sets: 3, min: 6, max: 8, inc: 2.5, rest: 120, cues: "Hinged at hips, flat back, pull to waist, squeeze shoulder blades." },
      { id: "pulldown", name: "Lat Pulldown", equipment: "machine", weight: 25, sets: 3, min: 8, max: 10, inc: 2.5, rest: 90, cues: "Sit upright, pull bar to upper chest, squeeze shoulder blades at the bottom." },
      { id: "incdb", name: "Incline Dumbbell Press", equipment: "dumbbell", weight: 10, sets: 3, min: 8, max: 10, inc: 2, rest: 90, cues: "Incline bench (~30 deg), tuck elbows, press upward and slightly inward. Keep core braced." },
      { id: "supersetA", name: "Superset: Tri & Side Delts", equipment: "dumbbell", weight: 10, sets: 3, min: 10, max: 15, inc: 1, rest: 60, cues: "5A Overhead Triceps Ext (3x10-15) + 5B DB Lateral Raise (3x10-15). Control descent." },
      { id: "cablecr", name: "Cable Crunch", equipment: "machine", weight: 15, sets: 3, min: 10, max: 15, inc: 2.5, rest: 60, cues: "Kneeling, hold rope by ears, crunch downward using abs, squeeze at bottom. Do not sit back on heels." }
    ]
  },
  {
    key: "lowerA", tag: "TUE", short: "LOWER A", name: "Lower Body A", focus: "QUADS & STABILITY",
    exercises: [
      { id: "squat", name: "Barbell Squat", equipment: "barbell", weight: 30, sets: 3, min: 6, max: 8, inc: 5, rest: 120, cues: "Use a rack with safety pins. Keep chest up, brace core, squat deep until thighs are parallel." },
      { id: "legpress", name: "Leg Press", equipment: "machine", weight: 40, sets: 3, min: 8, max: 10, inc: 10, rest: 90, cues: "Place feet shoulder-width on platform, lower slowly, push through heels without locking knees." },
      { id: "legcurlA", name: "Lying Leg Curl", equipment: "machine", weight: 15, sets: 3, min: 10, max: 12, inc: 2.5, rest: 90, cues: "Lie flat on pad, grasp handles, curl pad toward glutes, squeeze hamstrings." },
      { id: "lunge", name: "Walking DB Lunges", equipment: "dumbbell", weight: 8, sets: 3, min: 10, max: 12, inc: 2, rest: 90, cues: "Per leg. Keep torso upright, take a long stride, lower back knee just above floor, alternate." },
      { id: "calfA", name: "Standing Calf Raise", equipment: "machine", weight: 20, sets: 4, min: 12, max: 15, inc: 5, rest: 60, cues: "Balls of feet on block, lower heels for full stretch, raise up high on toes, pause." },
      { id: "plank", name: "Core Stability Block", equipment: "bodyweight", weight: 0, sets: 3, min: 30, max: 60, inc: 0, rest: 60, cues: "Plank 30-60s / Side Plank 20-30s. Squeeze glutes, don't sag, keep hips high. Focus on rigid torso hold." }
    ]
  },
  {
    key: "recoveryA", tag: "WED", short: "RECOV", name: "Active Recovery", focus: "MOBILITY & RECON", recovery: true,
    exercises: [
      { id: "walkA", name: "Light Walk", equipment: "bodyweight", weight: 0, sets: 1, min: 30, max: 45, inc: 0, rest: 0, cues: "30-45 MIN. Brisk pace, outdoor track or treadmill, focus on circulation and system flushing." },
      { id: "mobility", name: "Dynamic Mobility", equipment: "bodyweight", weight: 0, sets: 1, min: 15, max: 20, inc: 0, rest: 0, cues: "15-20 MIN. Perform dynamic lunge stretches with torso rotation. Focus on opening hips and reach up." },
      { id: "foam", name: "Foam Rolling", equipment: "bodyweight", weight: 0, sets: 1, min: 10, max: 15, inc: 0, rest: 0, cues: "10-15 MIN. Roll quads, hamstrings, and calves on a foam roller. Focus on trigger points." },
      { id: "hydration", name: "Hydration", equipment: "bodyweight", weight: 0, sets: 1, min: 3, max: 4, inc: 0, rest: 0, cues: "Consume 3-4 liters of water, rehydrate the system." },
      { id: "stretchA", name: "Stretching & Breathing", equipment: "bodyweight", weight: 0, sets: 1, min: 10, max: 15, inc: 0, rest: 0, cues: "10-15 MIN. Static holds like a seated hamstring stretch, focus on deep diaphragmatic breathing to down-regulate." }
    ]
  },
  {
    key: "upperB", tag: "THU", short: "UPPER B", name: "Upper Body B", focus: "VERTICAL & ARMS",
    exercises: [
      { id: "ohp", name: "Barbell Overhead Press", equipment: "barbell", weight: 20, sets: 3, min: 6, max: 8, inc: 2.5, rest: 120, cues: "Brace core, press straight up, push head through at lockout." },
      { id: "pulldownB", name: "Lat Pulldown", equipment: "machine", weight: 25, sets: 3, min: 8, max: 10, inc: 2.5, rest: 90, cues: "Sit upright, pull bar to upper chest, squeeze shoulder blades at the bottom." },
      { id: "dips", name: "Dips (Chest/Triceps)", equipment: "bodyweight", weight: 0, sets: 3, min: 8, max: 10, inc: 2.5, rest: 90, cues: "Lean forward for chest, upright for triceps, lower until upper arms are parallel." },
      { id: "facepull", name: "Face Pulls (Cables)", equipment: "machine", weight: 8, sets: 3, min: 12, max: 15, inc: 2.5, rest: 60, cues: "Use rope attachment, pull towards face, externally rotate shoulders, squeeze rear delts." },
      { id: "latraise", name: "DB Lateral Raise", equipment: "dumbbell", weight: 4, sets: 4, min: 12, max: 15, inc: 1, rest: 60, cues: "Raise DBs to shoulder height, slight elbow bend, lead with elbows." },
      { id: "curl", name: "DB Bicep Curls", equipment: "dumbbell", weight: 6, sets: 3, min: 10, max: 12, inc: 1, rest: 60, cues: "Keep elbows locked at sides, curl to shoulder, squeeze bicep, controlled lowering." }
    ]
  },
  {
    key: "lowerB", tag: "FRI", short: "LOWER B", name: "Lower Body B", focus: "HINGE & POSTERIOR CHAIN",
    exercises: [
      { id: "rdl", name: "Romanian Deadlift", equipment: "barbell", weight: 30, sets: 3, min: 6, max: 8, inc: 5, rest: 120, cues: "Hinge at hips, keep back straight, slight knee bend, feel hamstring stretch." },
      { id: "bss", name: "Bulgarian Split Squat", equipment: "dumbbell", weight: 8, sets: 3, min: 8, max: 10, inc: 2, rest: 90, cues: "Rear foot elevated on bench, lower hips straight down, front knee over ankle." },
      { id: "legext", name: "Leg Extensions", equipment: "machine", weight: 25, sets: 3, min: 12, max: 15, inc: 2.5, rest: 60, cues: "Control movement, fully extend legs, squeeze quads at top, lower slowly." },
      { id: "legcurlB", name: "Seated Leg Curls", equipment: "machine", weight: 20, sets: 3, min: 10, max: 12, inc: 2.5, rest: 60, cues: "Adjust pad, secure lap, curl legs back, squeeze hamstrings, control weight." },
      { id: "calfB", name: "Seated Calf Raises", equipment: "machine", weight: 20, sets: 3, min: 12, max: 15, inc: 5, rest: 60, cues: "Balls of feet on platform, lower heels for full stretch, raise high on toes." },
      { id: "hlr", name: "Hanging Knee Raise", equipment: "bodyweight", weight: 0, sets: 3, min: 10, max: 15, inc: 0, rest: 60, cues: "Hang from bar, keep upper body still, raise knees to chest, control descent." }
    ]
  },
  {
    key: "recoveryB", tag: "SAT", short: "REST", name: "Recovery & Prep", focus: "SYSTEM RESET", recovery: true,
    exercises: [
      { id: "walkB", name: "Recovery Walk", equipment: "bodyweight", weight: 0, sets: 1, min: 30, max: 45, inc: 0, rest: 0, cues: "Brisk, conversational pace, outdoor track or neighborhood, focus on circulation." },
      { id: "stretchB", name: "Light Stretching", equipment: "bodyweight", weight: 0, sets: 1, min: 10, max: 15, inc: 0, rest: 0, cues: "Focus on major muscle groups, hold stretches for 30s, breathe deeply." },
      { id: "mealprep", name: "Meal Prep", equipment: "bodyweight", weight: 0, sets: 1, min: 1, max: 1, inc: 0, rest: 0, cues: "Cook proteins, prep vegetables, portion meals for the week. Stay organized." }
    ]
  },
  {
    key: "recoveryC", tag: "SUN", short: "REST", name: "Recovery & Prep", focus: "SYSTEM RESET", recovery: true,
    exercises: [
      { id: "walkC", name: "Recovery Walk", equipment: "bodyweight", weight: 0, sets: 1, min: 30, max: 45, inc: 0, rest: 0, cues: "Brisk, conversational pace, outdoor track or neighborhood, focus on circulation." },
      { id: "stretchC", name: "Light Stretching", equipment: "bodyweight", weight: 0, sets: 1, min: 10, max: 15, inc: 0, rest: 0, cues: "Focus on major muscle groups, hold stretches for 30s, breathe deeply." },
      { id: "mealprepC", name: "Meal Prep", equipment: "bodyweight", weight: 0, sets: 1, min: 1, max: 1, inc: 0, rest: 0, cues: "Cook proteins, prep vegetables, portion meals for the week. Stay organized." }
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
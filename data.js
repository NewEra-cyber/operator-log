export const TRAINING = [
  {
    key: "upperA", tag: "MON", short: "UPPER A", name: "Upper Body A", focus: "PUSH & LAT FOCUS",
    exercises: [
      { id: "bench", name: "Bench Press", equipment: "barbell", weight: 30, sets: 4, min: 6, max: 8, inc: 2.5, rest: 150, cues: "2 sec down, brief pause on the chest, push up hard, shoulder blades pinched." },
      { id: "row", name: "Chest-Supported DB Row", equipment: "dumbbell", weight: 12, sets: 3, min: 8, max: 10, inc: 2, rest: 120, cues: "Chest on the pad, elbows to hips, squeeze 1 sec." },
      { id: "incdb", name: "Incline DB Press (30°)", equipment: "dumbbell", weight: 10, sets: 3, min: 8, max: 10, inc: 2, rest: 120, cues: "Deep stretch at the bottom, elbows at 45-60°." },
      { id: "pulldown", name: "Lat Pulldown", equipment: "machine", weight: 35, sets: 3, min: 10, max: 12, inc: 2.5, rest: 90, cues: "Pull to the upper chest, drive the elbows down, don't lean back." },
      { id: "supersetA", name: "Superset: Curl & OH Triceps", equipment: "dumbbell", weight: 6, sets: 3, min: 10, max: 12, inc: 1, rest: 90, cues: "5A Incline DB Curl: Arms hang fully. 5B OH Tri Ext: Stay upright, full extension." },
      { id: "latraise", name: "Lateral Raise", equipment: "dumbbell", weight: 4, sets: 3, min: 12, max: 15, inc: 1, rest: 60, cues: "Lead with the elbows, no swinging." }
    ]
  },
  {
    key: "lowerA", tag: "TUE", short: "LOWER A", name: "Lower Body A", focus: "QUADS & STABILITY",
    exercises: [
      { id: "squat", name: "Back Squat", equipment: "barbell", weight: 40, sets: 3, min: 6, max: 8, inc: 5, rest: 180, cues: "Keep chest up, brace core, squat deep until thighs are parallel." },
      { id: "rdl", name: "Romanian Deadlift", equipment: "barbell", weight: 30, sets: 3, min: 8, max: 10, inc: 5, rest: 120, cues: "Hinge at hips, keep back straight, slight knee bend, feel hamstring stretch." },
      { id: "legpress", name: "Leg Press", equipment: "machine", weight: 60, sets: 3, min: 10, max: 12, inc: 10, rest: 120, cues: "Feet shoulder-width, push through heels without locking knees." },
      { id: "legcurlA", name: "Leg Curl", equipment: "machine", weight: 20, sets: 3, min: 10, max: 12, inc: 2.5, rest: 90, cues: "Curl pad toward glutes, squeeze hamstrings." },
      { id: "calfA", name: "Standing Calf Raise", equipment: "machine", weight: 30, sets: 4, min: 10, max: 12, inc: 5, rest: 60, cues: "Pause 2 sec at the bottom of every rep." },
      { id: "hlr", name: "Hanging Knee Raise", equipment: "bodyweight", weight: 0, sets: 2, min: 12, max: 15, inc: 0, rest: 60, cues: "Hang from bar, keep upper body still, raise knees to chest." }
    ]
  },
  {
    key: "recoveryA", tag: "WED", short: "RECOV", name: "Active Recovery", focus: "MOBILITY & RECON", recovery: true,
    exercises: [
      { id: "walkA", name: "Walk", equipment: "bodyweight", weight: 0, sets: 1, min: 20, max: 30, inc: 0, rest: 0, cues: "20-30 MIN. Brisk pace, outdoor track or treadmill." },
      { id: "stretchA", name: "Stretch", equipment: "bodyweight", weight: 0, sets: 1, min: 5, max: 10, inc: 0, rest: 0, cues: "Quads, hamstrings, and calves. Take it easy, legs will be sore." },
      { id: "hydration", name: "Hydration", equipment: "bodyweight", weight: 0, sets: 1, min: 3, max: 3, inc: 0, rest: 0, cues: "Drink about 3 litres of water." }
    ]
  },
  {
    key: "upperB", tag: "THU", short: "UPPER B", name: "Upper Body B", focus: "VERTICAL & ARMS",
    exercises: [
      { id: "ohp", name: "Overhead Press", equipment: "barbell", weight: 20, sets: 3, min: 6, max: 8, inc: 2.5, rest: 150, cues: "Press standing with abs and glutes tight. Don't arch your back." },
      { id: "dbrow", name: "Single-arm DB Row", equipment: "dumbbell", weight: 14, sets: 3, min: 8, max: 10, inc: 2, rest: 120, cues: "Pull the DB row toward your hip." },
      { id: "pulldownB", name: "Close-grip Pulldown / Chin-up", equipment: "machine", weight: 35, sets: 3, min: 8, max: 10, inc: 2.5, rest: 90, cues: "Drive elbows down, pull chest to bar." },
      { id: "fly", name: "Incline Fly", equipment: "dumbbell", weight: 6, sets: 3, min: 10, max: 12, inc: 2, rest: 90, cues: "Slight bend in elbows, deep stretch at bottom." },
      { id: "supersetB", name: "Superset: Pushdown & Hammer", equipment: "machine", weight: 20, sets: 3, min: 10, max: 12, inc: 2.5, rest: 90, cues: "5A Triceps pushdown. 5B Hammer curl." },
      { id: "facepull", name: "Face Pull", equipment: "machine", weight: 15, sets: 3, min: 15, max: 20, inc: 2.5, rest: 60, cues: "Pull to eye level and rotate hands back." }
    ]
  },
  {
    key: "lowerB", tag: "FRI", short: "LOWER B", name: "Lower Body B", focus: "HINGE & POSTERIOR CHAIN",
    exercises: [
      { id: "hipthrust", name: "Hip Thrust", equipment: "barbell", weight: 40, sets: 4, min: 8, max: 10, inc: 5, rest: 150, cues: "Squeeze 1 sec at the top of the movement." },
      { id: "bss", name: "Bulgarian Split Squat", equipment: "dumbbell", weight: 8, sets: 3, min: 8, max: 10, inc: 2, rest: 90, cues: "Rear foot elevated, lean slightly forward." },
      { id: "legext", name: "Leg Extension", equipment: "machine", weight: 25, sets: 3, min: 12, max: 15, inc: 2.5, rest: 90, cues: "Control movement, squeeze quads at top." },
      { id: "legcurlB", name: "Seated Leg Curl", equipment: "machine", weight: 20, sets: 3, min: 10, max: 12, inc: 2.5, rest: 90, cues: "Curl legs back, squeeze hamstrings, control weight." },
      { id: "calfB", name: "Seated Calf Raise", equipment: "machine", weight: 20, sets: 4, min: 12, max: 15, inc: 5, rest: 60, cues: "Pause 2 sec at the bottom of each rep." },
      { id: "cablecr", name: "Cable Crunch or Plank", equipment: "machine", weight: 15, sets: 2, min: 12, max: 15, inc: 0, rest: 60, cues: "Moderate stack, or 45 sec plank." }
    ]
  },
  {
    key: "recoveryB", tag: "SAT", short: "REST", name: "Rest Day", focus: "SYSTEM RESET", recovery: true,
    exercises: [
      { id: "weighin", name: "Weigh-in", equipment: "bodyweight", weight: 0, sets: 1, min: 1, max: 1, inc: 0, rest: 0, cues: "Weigh yourself after the toilet and before eating. Write it down." },
      { id: "photos", name: "Progress Photos", equipment: "bodyweight", weight: 0, sets: 1, min: 1, max: 1, inc: 0, rest: 0, cues: "Shirtless, front, side, and back. Same spot, same light." }
    ]
  },
  {
    key: "recoveryC", tag: "SUN", short: "REST", name: "Rest Day", focus: "SYSTEM RESET", recovery: true,
    exercises: [
      { id: "sleep", name: "Sleep Well", equipment: "bodyweight", weight: 0, sets: 1, min: 1, max: 1, inc: 0, rest: 0, cues: "No lifting. Sleep well, Monday is a heavy upper day." }
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
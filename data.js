export const TRAINING = [
  {
    key: "upperA", tag: "MON", short: "UPPER A", name: "Upper Body A", focus: "HEAVY CHEST & BACK",
    exercises: [
      { id: "bench", name: "Barbell Bench Press", equipment: "barbell", weight: 37.5, sets: 4, min: 6, max: 8, inc: 2.5, rest: 150, cues: "Pinch shoulder blades down and back. Lower 2 sec to lower sternum, 0.5-sec pause, explode up. Elbows tucked ~45°.", alternates: [{ id: "db_bench", name: "DB Bench Press", equipment: "dumbbell" }] },
      { id: "row", name: "Barbell Bent-Over Row", equipment: "barbell", weight: 40, sets: 4, min: 6, max: 8, inc: 2.5, rest: 120, cues: "Hinge at hips, flat back, pull bar to lower waist, squeeze shoulder blades 1 sec.", alternates: [{ id: "db_row", name: "DB Row", equipment: "dumbbell" }] },
      { id: "pulldown", name: "Lat Pulldown", equipment: "machine", weight: 40, sets: 3, min: 8, max: 10, inc: 2.5, rest: 90, cues: "Grip slightly wider than shoulders. Pull bar smoothly to upper collarbone by driving elbows down toward hips.", alternates: [{ id: "pullup", name: "Pull-ups", equipment: "bodyweight" }] },
      { id: "incdb", name: "Incline DB Press (30°)", equipment: "dumbbell", weight: 12, sets: 4, min: 8, max: 10, inc: 2, rest: 120, cues: "Bench at low 30°. Keep upper back pinned, elbows at 45°. Lower deep for a stretch, press up squeezing inner elbows." },
      { id: "incfly", name: "Incline DB Flyes (30°)", equipment: "dumbbell", weight: 6, sets: 3, min: 12, max: 15, inc: 1, rest: 90, cues: "Palms facing each other, soft elbow bend. Open wide for a deep stretch, then sweep inner elbows together without clanking." },
      { id: "supersetA", name: "Superset: Tri Ext & Lat Raise", equipment: "dumbbell", weight: 15, sets: 3, min: 10, max: 15, inc: 1, rest: 90, cues: "6A Overhead Rope Tri Ext: Flare rope at lockout. 6B DB Lat Raise: Lead with elbows, pinkies slightly higher than thumbs." },
      { id: "curl", name: "DB Bicep Curls", equipment: "dumbbell", weight: 8, sets: 4, min: 10, max: 12, inc: 1, rest: 90, cues: "Elbows pinned to ribs. Curl up, squeeze, lower for a strict 2-second count to full extension." },
      { id: "declinecr", name: "Weighted Decline Sit-Ups", equipment: "bodyweight", weight: 20, sets: 3, min: 10, max: 15, inc: 2.5, rest: 60, cues: "Hold 20kg weight at collarbone. Curl ribcage toward pelvis, stop 2/3 up, uncurl down over 2-3 sec without resting shoulders." }
    ]
  },
  {
    key: "lowerA", tag: "TUE", short: "LOWER A", name: "Lower Body A", focus: "QUADS & CORE",
    exercises: [
      { id: "squat", name: "Barbell Back Squat", equipment: "barbell", weight: 40, sets: 4, min: 6, max: 8, inc: 5, rest: 150, cues: "Brace core rigid, sit down between heels to parallel or below, drive up through mid-foot keeping chest proud.", alternates: [{ id: "goblet_squat", name: "Goblet Squat", equipment: "dumbbell" }] },
      { id: "legpress", name: "Leg Press", equipment: "machine", weight: 70, sets: 4, min: 8, max: 10, inc: 10, rest: 120, cues: "Feet shoulder-width center. Lower smooth to 90° without lower back curling. Press through heels, stop short of locking knees.", alternates: [{ id: "bss", name: "Bulgarian Split Squat", equipment: "dumbbell" }] },
      { id: "legcurlA", name: "Lying Leg Curl", equipment: "machine", weight: 30, sets: 3, min: 10, max: 12, inc: 2.5, rest: 90, cues: "Knees aligned with pivot, hips pressed down. Curl smoothly to glutes, hold 1 sec, lower over 2 sec." },
      { id: "lunge", name: "Walking DB Lunges", equipment: "dumbbell", weight: 8, sets: 3, min: 10, max: 12, inc: 2, rest: 90, cues: "Per leg. Torso upright, long stride, back knee hovers 1-2 inches off floor. Push through front heel." },
      { id: "calfA", name: "Standing Calf Raise", equipment: "machine", weight: 40, sets: 4, min: 12, max: 15, inc: 5, rest: 60, cues: "Balls of feet on edge. Lower heels deep, dead pause 2 sec, drive high onto toes, squeeze 1 sec." },
      { id: "hlr", name: "Hanging Knee Raise", equipment: "bodyweight", weight: 0, sets: 3, min: 10, max: 15, inc: 0, rest: 60, cues: "Shoulders engaged. Curl pelvis up to bring knees to chest, lower legs slowly over 2-3 sec." },
      { id: "plank", name: "Core Stability Block", equipment: "bodyweight", weight: 0, sets: 3, min: 30, max: 60, inc: 0, rest: 45, cues: "Front plank 45-60s (squeeze glutes, pull elbows to toes) + 20-30s side planks with hips high." }
    ]
  },
  {
    key: "recoveryA", tag: "WED", short: "RECOV", name: "Active Recovery", focus: "MOBILITY & RECON", recovery: true,
    exercises: [
      { id: "walkA", name: "Light Walk", equipment: "bodyweight", weight: 0, sets: 1, min: 30, max: 45, inc: 0, rest: 0, cues: "Brisk, conversational pace to circulate blood and flush leg soreness." },
      { id: "mobility", name: "Dynamic Mobility & Foam Rolling", equipment: "bodyweight", weight: 0, sets: 1, min: 15, max: 20, inc: 0, rest: 0, cues: "Hip flexor lunges with torso twists, seated hamstring stretches, roll quads/calves/upper back." },
      { id: "nutrition", name: "Nutrition & Hydration", equipment: "bodyweight", weight: 0, sets: 1, min: 3, max: 4, inc: 0, rest: 0, cues: "Hit 3-4 liters of water and 120-130g protein to maximize recovery for Thursday." }
    ]
  },
  {
    key: "upperB", tag: "THU", short: "UPPER B", name: "Upper Body B", focus: "VERTICAL & ARMS",
    exercises: [
      { id: "ohp", name: "Barbell Overhead Press", equipment: "barbell", weight: 25, sets: 4, min: 6, max: 8, inc: 2.5, rest: 150, cues: "Squeeze glutes/abs hard. Press vertical past face, push head through window at lockout.", alternates: [{ id: "db_ohp", name: "DB Overhead Press", equipment: "dumbbell" }] },
      { id: "pulldownB", name: "Lat Pulldown", equipment: "machine", weight: 40, sets: 3, min: 8, max: 10, inc: 2.5, rest: 90, cues: "Neutral or overhand grip. Pull to upper chest, hold 1 sec squeeze, control bar back to full stretch." },
      { id: "incdbB", name: "Incline DB Press (30°)", equipment: "dumbbell", weight: 10, sets: 3, min: 8, max: 10, inc: 2, rest: 120, cues: "Shoulder blades pinched into bench. Lower for deep clavicular stretch, press up/inward without locking abruptly." },
      { id: "rowB", name: "Chest-Supported Row", equipment: "machine", weight: 25, sets: 3, min: 8, max: 10, inc: 2.5, rest: 90, cues: "Chest locked on pad, pull elbows to hip pockets to target lower lats, squeeze 1 sec." },
      { id: "pushdown", name: "Cable Rope Triceps Pushdown", equipment: "machine", weight: 15, sets: 3, min: 10, max: 12, inc: 2.5, rest: 90, cues: "Slight forward lean, pin upper arms to ribs. Push down, split rope ends outward at lockout." },
      { id: "latraiseB", name: "DB Lateral Raise", equipment: "dumbbell", weight: 5, sets: 3, min: 12, max: 15, inc: 1, rest: 60, cues: "Strict form, raise out to shoulder level leading with elbows, pause, lower for 2 sec." },
      { id: "curlB", name: "DB Bicep Curls", equipment: "dumbbell", weight: 6, sets: 3, min: 10, max: 12, inc: 1, rest: 90, cues: "Upper arms motionless at sides. Curl up, supinate (pinkies up), lower to full extension." },
      { id: "hammer", name: "Hammer Curls", equipment: "dumbbell", weight: 8, sets: 3, min: 10, max: 12, inc: 1, rest: 90, cues: "Neutral grip (like holding a hammer). Squeeze brachialis and forearms at the top." },
      { id: "facepull", name: "Face Pulls (Cables)", equipment: "machine", weight: 10, sets: 3, min: 15, max: 20, inc: 2.5, rest: 60, cues: "Cable at eye height. Pull center of rope to forehead, externally rotate hands back, squeeze rear delts." }
    ]
  },
  {
    key: "lowerB", tag: "FRI", short: "LOWER B", name: "Lower Body B", focus: "HINGE & POSTERIOR",
    exercises: [
      { id: "rdl", name: "Romanian Deadlift (RDL)", equipment: "barbell", weight: 60, sets: 4, min: 6, max: 8, inc: 5, rest: 150, cues: "Slight locked knee bend. Push hips straight back, bar skims thighs/shins. Drive hips forward to stand.", alternates: [{ id: "db_rdl", name: "DB Romanian Deadlift", equipment: "dumbbell" }] },
      { id: "bss", name: "Bulgarian Split Squat", equipment: "dumbbell", weight: 12, sets: 3, min: 8, max: 10, inc: 2, rest: 90, cues: "Back foot on bench. Lean torso forward 15° to load glutes. Lower hips straight down, drive up through front heel." },
      { id: "legext", name: "Leg Extensions", equipment: "machine", weight: 45, sets: 3, min: 12, max: 15, inc: 2.5, rest: 90, cues: "Knees align with pivot. Full extension, 1-sec hard quad squeeze, lower over 3 sec." },
      { id: "legcurlB", name: "Seated Leg Curls", equipment: "machine", weight: 20, sets: 4, min: 10, max: 12, inc: 2.5, rest: 90, cues: "Lock thigh pad tight. Curl heels back underneath, squeeze 1 sec, return under control." },
      { id: "calfB", name: "Seated Calf Raises", equipment: "machine", weight: 50, sets: 4, min: 12, max: 15, inc: 5, rest: 60, cues: "Knee pad secured. Drop heels into deep stretch, 2-sec pause, push high onto toes, hold 1 sec." },
      { id: "hlrB", name: "Hanging Knee Raise", equipment: "bodyweight", weight: 2, sets: 3, min: 10, max: 15, inc: 2, rest: 60, cues: "Hold 2-4kg DB between feet OR use strict 3-sec lowering phase. Curl pelvis to ribs." },
      { id: "declinecrB", name: "Weighted Decline Sit-Ups", equipment: "bodyweight", weight: 20, sets: 3, min: 12, max: 15, inc: 2.5, rest: 60, cues: "Hold 20kg at collarbone. Curl 2/3 up with rounded spine, lower slowly 2-3 sec without resting." }
    ]
  },
  {
    key: "recoveryB", tag: "SAT", short: "REST", name: "Full Recovery", focus: "SYSTEM RESET", recovery: true,
    exercises: [
      { id: "walkB", name: "Recovery Walk", equipment: "bodyweight", weight: 0, sets: 1, min: 30, max: 45, inc: 0, rest: 0, cues: "Brisk 30-45 min walk." },
      { id: "stretchB", name: "Light Static Stretching", equipment: "bodyweight", weight: 0, sets: 1, min: 10, max: 15, inc: 0, rest: 0, cues: "Chest doorway stretch, hip flexors, hamstrings, lats. 10-15 mins total." },
      { id: "mealprep", name: "Meal Prep", equipment: "bodyweight", weight: 0, sets: 1, min: 1, max: 1, inc: 0, rest: 0, cues: "Boil beans, prep omena and carbs (rice, ugali, potatoes), restock milk/eggs." }
    ]
  },
  {
    key: "recoveryC", tag: "SUN", short: "REST", name: "Full Recovery", focus: "SYSTEM RESET", recovery: true,
    exercises: [
      { id: "walkC", name: "Recovery Walk", equipment: "bodyweight", weight: 0, sets: 1, min: 30, max: 45, inc: 0, rest: 0, cues: "Brisk 30-45 min walk." },
      { id: "stretchC", name: "Light Static Stretching", equipment: "bodyweight", weight: 0, sets: 1, min: 10, max: 15, inc: 0, rest: 0, cues: "Chest doorway stretch, hip flexors, hamstrings, lats. 10-15 mins total." },
      { id: "sleepC", name: "Sleep & Fuel", equipment: "bodyweight", weight: 0, sets: 1, min: 1, max: 1, inc: 0, rest: 0, cues: "7.5-9 hours sleep. Start Monday fully fueled." }
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
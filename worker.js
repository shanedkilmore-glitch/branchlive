/**
 * Branch Live Portal — Cloudflare Worker (D1)
 * Clean rebuild — all API endpoints, email, onboarding, D1 schema
 *
 * D1 binding: env.DB (database_id: cbe33e38-6532-4c58-9749-352a5a473019)
 * Auth: token-based (Bearer token stored in sessions table)
 * Password hashing: SHA-256 via Web Crypto
 * Email: Resend (env.RESEND_API_KEY or fallback)
 */

// ═══════════════════════════════════════════════════════════════════════
// INDUSTRY TEMPLATES (69 industries)
// ═══════════════════════════════════════════════════════════════════════

const INDUSTRY_TEMPLATES = {
  // ── Trades: Full calendar + estimates ──
  landscaping: {
    steps: [1, 2, 3, 4, 5, 6],
    labels: ['Business', 'Services', 'Hours', 'Voice', 'Files', 'Review'],
    features: ['calendar', 'estimates', 'site-visits'],
    skipAppointments: false, skipHours: false, skipFiles: false,
    emmaRole: `You are the AI receptionist for a landscaping business.`,
    emmaDuties: `1. Offer to schedule on-site estimates for lawn care, landscape design, hardscape, irrigation, and seasonal cleanup
2. Ask about property size, desired services, and preferred timing
3. Flag urgent calls (fallen trees, flooding) for immediate follow-up
4. Note that scheduling is weather-dependent`,
  },
  masonry: {
    steps: [1, 2, 3, 4, 5, 6],
    labels: ['Business', 'Services', 'Hours', 'Voice', 'Files', 'Review'],
    features: ['calendar', 'estimates', 'site-visits'],
    skipAppointments: false, skipHours: false, skipFiles: false,
    emmaRole: `You are the AI receptionist for a masonry and hardscape business.`,
    emmaDuties: `1. Offer to schedule site visits for paver patios, retaining walls, walkways, driveways, and stone veneer
2. Ask about project scope, materials, and timeline
3. Note that masonry work is weather-dependent
4. Collect contact info for estimates and follow-ups`,
  },
  'general-contracting': {
    steps: [1, 2, 3, 4, 5, 6],
    labels: ['Business', 'Services', 'Hours', 'Voice', 'Files', 'Review'],
    features: ['calendar', 'estimates', 'site-visits'],
    skipAppointments: false, skipHours: false, skipFiles: false,
    emmaRole: `You are the AI receptionist for a general contracting business.`,
    emmaDuties: `1. Offer to schedule consultations for remodels, additions, roofing, siding, decks, and basements
2. Ask about project type, timeline, and budget range
3. Flag urgent structural issues for immediate follow-up
4. Collect contact details for estimate scheduling`,
  },
  hvac: {
    steps: [1, 2, 3, 4, 5, 6],
    labels: ['Business', 'Services', 'Hours', 'Voice', 'Files', 'Review'],
    features: ['calendar', 'emergency', 'parts-lookup'],
    skipAppointments: false, skipHours: false, skipFiles: false,
    emmaRole: `You are the AI receptionist for an HVAC business.`,
    emmaDuties: `1. TRIAGE FIRST: "Is this an emergency?" (no heat/AC, gas smell, water leak)
2. Emergencies: flag as urgent, offer immediate dispatch
3. Non-emergencies: schedule service calls at next available slot
4. Ask: equipment type, age, symptoms, home size
5. Common services: AC install, furnace repair, heat pump, duct cleaning, maintenance plans`,
  },
  plumbing: {
    steps: [1, 2, 3, 4, 5, 6],
    labels: ['Business', 'Services', 'Hours', 'Voice', 'Files', 'Review'],
    features: ['calendar', 'emergency', 'parts-lookup'],
    skipAppointments: false, skipHours: false, skipFiles: false,
    emmaRole: `You are the AI receptionist for a plumbing business.`,
    emmaDuties: `1. TRIAGE FIRST: "Is this an emergency?" (burst pipe, flooding, sewage backup, no water)
2. Emergencies: flag as urgent, offer immediate dispatch
3. Non-emergencies: schedule service calls
4. Ask: fixture type, symptoms, whether water is shut off
5. Common services: drain cleaning, water heater repair, pipe replacement, leak detection`,
  },
  electrical: {
    steps: [1, 2, 3, 4, 5, 6],
    labels: ['Business', 'Services', 'Hours', 'Voice', 'Files', 'Review'],
    features: ['calendar', 'emergency', 'parts-lookup'],
    skipAppointments: false, skipHours: false, skipFiles: false,
    emmaRole: `You are the AI receptionist for an electrical business.`,
    emmaDuties: `1. TRIAGE FIRST: "Is this an emergency?" (sparks, burning smell, power out, exposed wires)
2. Emergencies: flag as urgent, offer immediate dispatch
3. Non-emergencies: schedule service calls
4. Ask: electrical issue, panel size, home age
5. Common services: panel upgrades, wiring, lighting, generator install, troubleshooting`,
  },
  roofing: {
    steps: [1, 2, 3, 4, 5, 6],
    labels: ['Business', 'Services', 'Hours', 'Voice', 'Files', 'Review'],
    features: ['calendar', 'emergency', 'estimates'],
    skipAppointments: false, skipHours: false, skipFiles: false,
    emmaRole: `You are the AI receptionist for a roofing business.`,
    emmaDuties: `1. TRIAGE FIRST: "Is this an emergency?" (active leak, storm damage, collapsed section)
2. Emergencies: flag as urgent, offer emergency tarping and immediate inspection
3. Non-emergencies: schedule roof inspections and estimates
4. Ask: roof age, type (shingle/metal/flat/tile), visible damage, home height
5. Common services: roof repair, full replacement, storm damage, gutter replacement, skylight install`,
  },
  pest_control: {
    steps: [1, 2, 3, 4, 5, 6],
    labels: ['Business', 'Services', 'Hours', 'Voice', 'Files', 'Review'],
    features: ['calendar', 'estimates'],
    skipAppointments: false, skipHours: false, skipFiles: false,
    emmaRole: `You are the AI receptionist for a pest control business.`,
    emmaDuties: `1. Ask what type of pest: ants, roaches, termites, bed bugs, rodents, mosquitoes, wildlife, etc.
2. Schedule inspections and treatments — ask about property size and infestation severity
3. Offer recurring maintenance plans for ongoing protection
4. Flag urgent calls (swarms, bed bugs, venomous pests) for priority scheduling
5. Common services: general pest, termite treatment, bed bug heat, rodent exclusion, mosquito control`,
  },
  cleaning_residential: {
    steps: [1, 2, 3, 4, 5, 6],
    labels: ['Business', 'Services', 'Hours', 'Voice', 'Files', 'Review'],
    features: ['calendar'],
    skipAppointments: false, skipHours: false, skipFiles: false,
    emmaRole: `You are the AI receptionist for a residential cleaning business.`,
    emmaDuties: `1. Ask about cleaning needs: recurring (weekly/biweekly/monthly), deep clean, move-in/move-out, or post-construction
2. Collect: home size (sq ft or bed/bath count), preferred days, any special instructions (pets, allergies)
3. Schedule cleanings and offer recurring service plans
4. Common services: standard cleaning, deep cleaning, move-in/out, Airbnb turnover, organizing`,
  },
  cleaning_commercial: {
    steps: [1, 2, 3, 4, 5, 6],
    labels: ['Business', 'Services', 'Hours', 'Voice', 'Files', 'Review'],
    features: ['calendar', 'estimates'],
    skipAppointments: false, skipHours: false, skipFiles: false,
    emmaRole: `You are the AI receptionist for a commercial cleaning business.`,
    emmaDuties: `1. Ask about facility type: office, retail, medical, industrial, school, church, gym
2. Collect: square footage, cleaning frequency (daily/weekly), after-hours access needs
3. Offer to schedule a walkthrough for an accurate quote
4. Common services: janitorial, floor care, window cleaning, disinfection, trash removal, supply restocking`,
  },
  painting: {
    steps: [1, 2, 3, 4, 5, 6],
    labels: ['Business', 'Services', 'Hours', 'Voice', 'Files', 'Review'],
    features: ['calendar', 'estimates', 'site-visits'],
    skipAppointments: false, skipHours: false, skipFiles: false,
    emmaRole: `You are the AI receptionist for a painting business.`,
    emmaDuties: `1. Offer to schedule on-site estimates for interior painting, exterior painting, or both
2. Ask about: project scope (whole house, rooms, trim), surface types, current condition
3. Note that exterior work is weather-dependent
4. Common services: interior painting, exterior painting, cabinet refinishing, deck staining, drywall repair, wallpaper removal`,
  },
  concrete: {
    steps: [1, 2, 3, 4, 5, 6],
    labels: ['Business', 'Services', 'Hours', 'Voice', 'Files', 'Review'],
    features: ['calendar', 'estimates', 'site-visits'],
    skipAppointments: false, skipHours: false, skipFiles: false,
    emmaRole: `You are the AI receptionist for a concrete business.`,
    emmaDuties: `1. Offer to schedule site visits for concrete work: driveways, patios, foundations, slabs, walkways, stamped concrete
2. Ask about project type, approximate square footage, and timeline
3. Note that concrete work is weather and temperature-dependent
4. Collect contact info for estimates and scheduling`,
  },
  fencing_deck: {
    steps: [1, 2, 3, 4, 5, 6],
    labels: ['Business', 'Services', 'Hours', 'Voice', 'Files', 'Review'],
    features: ['calendar', 'estimates', 'site-visits'],
    skipAppointments: false, skipHours: false, skipFiles: false,
    emmaRole: `You are the AI receptionist for a fencing and decking business.`,
    emmaDuties: `1. Offer to schedule on-site estimates for fence installation, deck building, or both
2. Ask about: project type, material preference (wood, vinyl, composite, aluminum, chain-link), linear footage or deck size
3. Note that installation may be weather-dependent
4. Common services: privacy fence, deck construction, railing, pergola, gate installation, fence repair`,
  },
  handyman: {
    steps: [1, 2, 3, 4, 5, 6],
    labels: ['Business', 'Services', 'Hours', 'Voice', 'Files', 'Review'],
    features: ['calendar', 'estimates'],
    skipAppointments: false, skipHours: false, skipFiles: false,
    emmaRole: `You are the AI receptionist for a handyman business.`,
    emmaDuties: `1. Ask what needs fixing: drywall repair, fixture replacement, furniture assembly, painting, minor plumbing/electrical, etc.
2. Schedule service calls — ask about urgency and preferred timing
3. Common services: repairs, assembly, mounting, painting touch-ups, caulking, weatherstripping, home maintenance`,
  },
  locksmith: {
    steps: [1, 2, 3, 4, 5, 6],
    labels: ['Business', 'Services', 'Hours', 'Voice', 'Files', 'Review'],
    features: ['calendar', 'emergency'],
    skipAppointments: false, skipHours: false, skipFiles: false,
    emmaRole: `You are the AI receptionist for a locksmith business.`,
    emmaDuties: `1. TRIAGE FIRST: "Is this an emergency?" (locked out of home/car/business, broken key in lock, break-in damage)
2. Emergencies: flag as urgent, dispatch immediately
3. Non-emergencies: schedule re-keying, lock installation, or security upgrades
4. Ask: location, lock type, vehicle make/model (if automotive), whether customer is in a safe location
5. Common services: lockout assistance, re-keying, lock repair, safe opening, access control, key duplication`,
  },
  appliance_repair: {
    steps: [1, 2, 3, 4, 5, 6],
    labels: ['Business', 'Services', 'Hours', 'Voice', 'Files', 'Review'],
    features: ['calendar'],
    skipAppointments: false, skipHours: false, skipFiles: false,
    emmaRole: `You are the AI receptionist for an appliance repair business.`,
    emmaDuties: `1. Ask which appliance needs repair: refrigerator, washer, dryer, dishwasher, oven, microwave, etc.
2. Collect: brand, model number, age, and specific symptoms
3. Schedule service calls and note if the issue is urgent (no refrigerator, water leak)
4. Common services: refrigerator repair, washer/dryer repair, dishwasher service, oven/range fix, ice maker repair`,
  },
  moving: {
    steps: [1, 2, 3, 4, 5, 6],
    labels: ['Business', 'Services', 'Hours', 'Voice', 'Files', 'Review'],
    features: ['calendar', 'dispatch'],
    skipAppointments: false, skipHours: false, skipFiles: false,
    emmaRole: `You are the AI receptionist for a moving company.`,
    emmaDuties: `1. Ask about move type: local or long-distance, residential or commercial
2. Collect: current address, destination, preferred date, home size (bedrooms or sq ft), special items (piano, safe, fragile)
3. Provide estimates based on distance and volume
4. Schedule in-home estimates for larger moves
5. Common services: local moving, long-distance, packing/unpacking, storage, piano moving, commercial relocation`,
  },
  tree_service: {
    steps: [1, 2, 3, 4, 5, 6],
    labels: ['Business', 'Services', 'Hours', 'Voice', 'Files', 'Review'],
    features: ['calendar', 'emergency', 'estimates'],
    skipAppointments: false, skipHours: false, skipFiles: false,
    emmaRole: `You are the AI receptionist for a tree service business.`,
    emmaDuties: `1. TRIAGE FIRST: "Is this an emergency?" (fallen tree on house/car/power lines, dangerous leaning tree, storm damage)
2. Emergencies: flag as urgent, dispatch crew immediately; advise caller to stay clear
3. Non-emergencies: schedule estimates for tree removal, trimming, pruning, or stump grinding
4. Ask: tree size, location, proximity to structures or power lines
5. Common services: tree removal, emergency storm cleanup, trimming/pruning, stump grinding, cabling/bracing`,
  },
  pool_service: {
    steps: [1, 2, 3, 4, 5, 6],
    labels: ['Business', 'Services', 'Hours', 'Voice', 'Files', 'Review'],
    features: ['calendar'],
    skipAppointments: false, skipHours: false, skipFiles: false,
    emmaRole: `You are the AI receptionist for a pool service business.`,
    emmaDuties: `1. Ask about service needs: weekly maintenance, chemical-only, opening/closing, repair, or new installation
2. Collect: pool type (in-ground/above-ground), size, current condition, and season
3. Schedule recurring maintenance routes or one-time service calls
4. Common services: weekly cleaning, chemical balancing, equipment repair, pool opening/closing, leak detection, acid wash`,
  },
  septic_waste: {
    steps: [1, 2, 3, 4, 5, 6],
    labels: ['Business', 'Services', 'Hours', 'Voice', 'Files', 'Review'],
    features: ['calendar', 'emergency'],
    skipAppointments: false, skipHours: false, skipFiles: false,
    emmaRole: `You are the AI receptionist for a septic and waste services business.`,
    emmaDuties: `1. TRIAGE FIRST: "Is this an emergency?" (sewage backup into home, overflowing tank, strong odor inside house)
2. Emergencies: flag as urgent, dispatch immediately
3. Non-emergencies: schedule pumping, inspection, or maintenance
4. Ask: last pump date, tank size if known, number of occupants, warning signs observed
5. Common services: septic pumping, inspection, drain field repair, grease trap cleaning, portable toilet rental`,
  },
  pressure_washing: {
    steps: [1, 2, 3, 4, 5, 6],
    labels: ['Business', 'Services', 'Hours', 'Voice', 'Files', 'Review'],
    features: ['calendar', 'estimates'],
    skipAppointments: false, skipHours: false, skipFiles: false,
    emmaRole: `You are the AI receptionist for a pressure washing business.`,
    emmaDuties: `1. Ask what needs cleaning: house exterior/siding, driveway, deck, patio, fence, roof, or commercial building
2. Schedule estimates and service — ask about square footage and surface type
3. Note that work is weather-dependent
4. Common services: house washing, driveway cleaning, deck restoration, roof cleaning, graffiti removal, commercial flatwork`,
  },
  window_cleaning: {
    steps: [1, 2, 3, 4, 5, 6],
    labels: ['Business', 'Services', 'Hours', 'Voice', 'Files', 'Review'],
    features: ['calendar'],
    skipAppointments: false, skipHours: false, skipFiles: false,
    emmaRole: `You are the AI receptionist for a window cleaning business.`,
    emmaDuties: `1. Ask about the property: residential or commercial, number of windows, number of stories
2. Schedule service — ask about frequency (one-time or recurring)
3. Common services: interior/exterior window cleaning, screen cleaning, track cleaning, skylight cleaning, solar panel cleaning`,
  },
  carpet_cleaning: {
    steps: [1, 2, 3, 4, 5, 6],
    labels: ['Business', 'Services', 'Hours', 'Voice', 'Files', 'Review'],
    features: ['calendar'],
    skipAppointments: false, skipHours: false, skipFiles: false,
    emmaRole: `You are the AI receptionist for a carpet cleaning business.`,
    emmaDuties: `1. Ask about cleaning needs: carpets, upholstery, rugs, tile/grout, or pet odor treatment
2. Collect: approximate square footage or number of rooms, carpet type, stain concerns
3. Schedule service and offer recurring maintenance plans
4. Common services: steam cleaning, stain removal, upholstery cleaning, area rug cleaning, pet odor treatment, tile and grout`,
  },
  flooring: {
    steps: [1, 2, 3, 4, 5, 6],
    labels: ['Business', 'Services', 'Hours', 'Voice', 'Files', 'Review'],
    features: ['calendar', 'estimates', 'site-visits'],
    skipAppointments: false, skipHours: false, skipFiles: false,
    emmaRole: `You are the AI receptionist for a flooring business.`,
    emmaDuties: `1. Offer to schedule on-site measurements and estimates for flooring installation
2. Ask about: flooring type (hardwood, LVP, tile, carpet, laminate), approximate square footage, rooms
3. Discuss material preferences, budget range, and timeline
4. Common services: hardwood install/refinish, LVP/laminate, tile installation, carpet, subfloor repair, removal of old flooring`,
  },
  drywall_insulation: {
    steps: [1, 2, 3, 4, 5, 6],
    labels: ['Business', 'Services', 'Hours', 'Voice', 'Files', 'Review'],
    features: ['calendar', 'estimates'],
    skipAppointments: false, skipHours: false, skipFiles: false,
    emmaRole: `You are the AI receptionist for a drywall and insulation business.`,
    emmaDuties: `1. Ask about project type: new construction, remodel, repair, or insulation upgrade
2. Schedule estimates — ask about square footage, room count, and current condition
3. Common services: drywall hanging/finishing, texture matching, insulation install, soundproofing, spray foam, blown-in insulation`,
  },
  welding: {
    steps: [1, 2, 3, 4, 5, 6],
    labels: ['Business', 'Services', 'Hours', 'Voice', 'Files', 'Review'],
    features: ['calendar', 'estimates'],
    skipAppointments: false, skipHours: false, skipFiles: false,
    emmaRole: `You are the AI receptionist for a welding and fabrication business.`,
    emmaDuties: `1. Ask about the project: repair, custom fabrication, structural welding, or mobile/on-site welding
2. Collect: material type (steel, aluminum, stainless), project description, and timeline
3. Schedule estimates — note if it's urgent (broken equipment, structural failure)
4. Common services: custom fabrication, mobile welding, structural welding, gate/railing repair, trailer repair, pipe welding`,
  },
  excavation: {
    steps: [1, 2, 3, 4, 5, 6],
    labels: ['Business', 'Services', 'Hours', 'Voice', 'Files', 'Review'],
    features: ['calendar', 'estimates', 'site-visits'],
    skipAppointments: false, skipHours: false, skipFiles: false,
    emmaRole: `You are the AI receptionist for an excavation business.`,
    emmaDuties: `1. Offer to schedule site visits for excavation projects
2. Ask about: project type (foundation, grading, trenching, demolition, land clearing), property size, and timeline
3. Note that work is weather and ground-condition dependent
4. Flag urgent calls (washouts, collapsed trenches, emergency access) for immediate follow-up
5. Common services: site prep, grading, trenching, land clearing, demolition, drainage, septic installation`,
  },
  surveying: {
    steps: [1, 2, 3, 4, 5, 6],
    labels: ['Business', 'Services', 'Hours', 'Voice', 'Files', 'Review'],
    features: ['calendar', 'estimates'],
    skipAppointments: false, skipHours: false, skipFiles: false,
    emmaRole: `You are the AI receptionist for a land surveying business.`,
    emmaDuties: `1. Ask about survey type: boundary survey, topographic survey, construction staking, ALTA survey, or subdivision plat
2. Collect: property address, parcel size, reason for survey (purchase, fence, addition, dispute)
3. Schedule field work — note that surveys are weather and foliage-dependent
4. Common services: boundary marking, topographic mapping, construction layout, elevation certificates, floodplain determination`,
  },
  // ── Retail / Supply: Inventory focus ──
  'retail-supply': {
    steps: [1, 2, 4, 5, 6],
    labels: ['Business', 'Services', 'Voice', 'Inventory & Files', 'Review'],
    features: ['inventory', 'csv', 'product-catalog'],
    skipAppointments: true, skipHours: true, skipFiles: false,
    emmaRole: `You are the AI receptionist for a retail supply business.`,
    emmaDuties: `1. Answer inventory questions: "Do you have X in stock? How much is Y?"
2. Check your knowledge base for pricing and availability
3. Take orders and arrange pickup or delivery
4. For bulk/custom orders: take detailed notes for team follow-up
5. Common inquiries: material delivery, bulk orders, tool rental, estimates, will-call pickup`,
  },
  // ── Auto / Fleet: Dispatch + emergency ──
  auto_repair: {
    steps: [1, 2, 7, 4, 6],
    labels: ['Business', 'Services', 'Dispatch', 'Voice', 'Review'],
    features: ['dispatch', 'emergency', 'calendar'],
    skipAppointments: false, skipHours: true, skipFiles: true,
    emmaRole: `You are the AI receptionist for an auto repair shop.`,
    emmaDuties: `1. TRIAGE FIRST: "Is the vehicle driveable? Is this an emergency?" (stranded, check engine, no-start, brake failure)
2. Emergencies: flag as urgent, arrange tow-in or immediate service
3. Ask: vehicle year/make/model, symptoms, when the issue started
4. Schedule drop-offs or service appointments at next available bay
5. Common services: diagnostics, brake repair, engine work, transmission, AC, oil change, state inspection`,
  },
  auto_body: {
    steps: [1, 2, 7, 4, 6],
    labels: ['Business', 'Services', 'Dispatch', 'Voice', 'Review'],
    features: ['dispatch', 'calendar', 'estimates'],
    skipAppointments: false, skipHours: true, skipFiles: true,
    emmaRole: `You are the AI receptionist for an auto body shop.`,
    emmaDuties: `1. Ask: "Was there an accident? Is the vehicle driveable? Is insurance involved?"
2. If not driveable: arrange tow/dispatch to bring the vehicle in
3. Collect: vehicle year/make/model, damage description, insurance info (claim #, adjuster)
4. Schedule estimates and repair drop-offs
5. Common services: collision repair, dent removal, paint matching, frame straightening, bumper repair, glass replacement`,
  },
  tire_shop: {
    steps: [1, 2, 4, 5, 6],
    labels: ['Business', 'Services', 'Voice', 'Inventory & Files', 'Review'],
    features: ['calendar', 'inventory'],
    skipAppointments: false, skipHours: true, skipFiles: false,
    emmaRole: `You are the AI receptionist for a tire shop.`,
    emmaDuties: `1. Ask: "What size tire do you need? What vehicle is it for?"
2. Check inventory for tire availability and pricing
3. Schedule installation appointments
4. Common services: tire sales, mounting/balancing, rotation, alignment, flat repair, seasonal changeover`,
  },
  diesel_mechanic: {
    steps: [1, 2, 7, 4, 6],
    labels: ['Business', 'Services', 'Dispatch', 'Voice', 'Review'],
    features: ['dispatch', 'emergency', 'calendar'],
    skipAppointments: false, skipHours: true, skipFiles: true,
    emmaRole: `You are the AI receptionist for a diesel mechanic shop.`,
    emmaDuties: `1. TRIAGE FIRST: "Is this an emergency? Is the truck/equipment down and affecting operations?"
2. Emergencies: flag as urgent, arrange mobile service or priority bay
3. Ask: vehicle/equipment type, engine make/model, symptoms, fleet size if commercial
4. Schedule service — ask about PM (preventive maintenance) needs
5. Common services: engine repair/rebuild, DPF cleaning, PM service, mobile repair, DOT inspection, fleet maintenance`,
  },
  // ── Tow Truck: Dispatch focus ──
  tow_truck: {
    steps: [1, 2, 4, 6],
    labels: ['Business', 'Dispatch Setup', 'Voice', 'Review'],
    features: ['dispatch', 'emergency'],
    skipAppointments: true, skipHours: true, skipFiles: true,
    emmaRole: `You are the AI dispatcher for a towing company.`,
    emmaDuties: `1. IMMEDIATELY ask: "Where are you located? What's wrong with your vehicle?"
2. Collect FAST: location (cross streets or address), vehicle make/model/color, issue (dead battery, accident, lockout, breakdown), and callback number
3. If injuries: advise caller to call 911 first
4. Flag ALL calls as urgent — dispatch the nearest available truck
5. Do NOT book appointments — this is a dispatch operation`,
  },
  // ── Real Estate: Listing focus ──
  real_estate: {
    steps: [1, 2, 4, 6],
    labels: ['Business', 'Services', 'Voice', 'Review'],
    features: ['listings', 'showings'],
    skipAppointments: true, skipHours: true, skipFiles: true,
    emmaRole: `You are the AI receptionist for a real estate agency.`,
    emmaDuties: `1. Ask: "Which property are you interested in?" or "Are you looking to buy or sell?"
2. For buyers: schedule showings, ask about budget, preferred areas, property type
3. For sellers: offer to schedule a market analysis
4. Collect: name, phone, email, preferred showing times
5. Answer basic listing questions from your knowledge base`,
  },
  // ── Personal Services: Appointment calendar ──
  salon_barber: {
    steps: [1, 2, 3, 4, 6],
    labels: ['Business', 'Services', 'Hours', 'Voice', 'Review'],
    features: ['calendar'],
    skipAppointments: false, skipHours: false, skipFiles: true,
    emmaRole: `You are the AI receptionist for a salon or barbershop.`,
    emmaDuties: `1. Ask what service they want: haircut, color, highlights, blowout, beard trim, extensions, etc.
2. Offer to book appointments — ask about preferred stylist/barber, date, and time
3. Mention pricing for common services from your knowledge base
4. Common services: women's cut, men's cut, color/highlights, balayage, blowout, beard trim, waxing, treatments`,
  },
  dog_grooming: {
    steps: [1, 2, 3, 4, 6],
    labels: ['Business', 'Services', 'Hours', 'Voice', 'Review'],
    features: ['calendar'],
    skipAppointments: false, skipHours: false, skipFiles: true,
    emmaRole: `You are the AI receptionist for a dog grooming business.`,
    emmaDuties: `1. Ask about the dog: breed, size/weight, age, temperament, and last groom date
2. Offer grooming packages: bath & brush, full groom, nail trim, teeth cleaning, de-shedding
3. Schedule appointments — ask about preferred date/time and any special needs (matted coat, anxiety, medical)
4. Common services: bath & dry, haircut/style, nail trim, ear cleaning, teeth brushing, de-shedding treatment`,
  },
  pet_care: {
    steps: [1, 2, 3, 4, 6],
    labels: ['Business', 'Services', 'Hours', 'Voice', 'Review'],
    features: ['calendar'],
    skipAppointments: false, skipHours: false, skipFiles: true,
    emmaRole: `You are the AI receptionist for a pet care business.`,
    emmaDuties: `1. Ask about service: dog walking, pet sitting, boarding, daycare, drop-in visits, or training
2. Collect: pet type/breed, age, temperament, special needs or medications, preferred schedule
3. Schedule meet-and-greets for new clients
4. Common services: dog walking, overnight sitting, boarding, daycare, drop-in visits, training, pet taxi`,
  },
  massage_therapy: {
    steps: [1, 2, 3, 4, 6],
    labels: ['Business', 'Services', 'Hours', 'Voice', 'Review'],
    features: ['calendar'],
    skipAppointments: false, skipHours: false, skipFiles: true,
    emmaRole: `You are the AI receptionist for a massage therapy practice.`,
    emmaDuties: `1. Ask about massage type: Swedish, deep tissue, sports, prenatal, hot stone, etc.
2. Schedule appointments — ask about preferred duration (60/90/120 min), therapist preference, and any health concerns
3. Mention first-time client intake process
4. Common services: therapeutic massage, deep tissue, sports massage, prenatal, couples massage, chair massage`,
  },
  nail_salon: {
    steps: [1, 2, 3, 4, 6],
    labels: ['Business', 'Services', 'Hours', 'Voice', 'Review'],
    features: ['calendar'],
    skipAppointments: false, skipHours: false, skipFiles: true,
    emmaRole: `You are the AI receptionist for a nail salon.`,
    emmaDuties: `1. Ask what service: manicure, pedicure, gel, acrylic, dip powder, nail art, etc.
2. Schedule appointments — ask about preferred technician and time
3. Mention pricing and any current specials
4. Common services: classic manicure, gel manicure, spa pedicure, acrylic full set, dip powder, nail art, paraffin treatment`,
  },
  tattoo_shop: {
    steps: [1, 2, 3, 4, 6],
    labels: ['Business', 'Services', 'Hours', 'Voice', 'Review'],
    features: ['calendar'],
    skipAppointments: false, skipHours: false, skipFiles: true,
    emmaRole: `You are the AI receptionist for a tattoo and piercing studio.`,
    emmaDuties: `1. Ask what they're looking for: custom tattoo, flash tattoo, piercing, or consultation
2. For tattoos: note size, placement, style (traditional, realism, blackwork, etc.), and whether they have reference images
3. Schedule consultations and appointments — mention deposit policy
4. Common services: custom tattoos, flash tattoos, piercing, tattoo removal referrals, touch-ups`,
  },
  photography: {
    steps: [1, 2, 3, 4, 6],
    labels: ['Business', 'Services', 'Hours', 'Voice', 'Review'],
    features: ['calendar'],
    skipAppointments: false, skipHours: false, skipFiles: true,
    emmaRole: `You are the AI receptionist for a photography business.`,
    emmaDuties: `1. Ask about session type: wedding, family, newborn, senior portraits, headshots, real estate, commercial, event
2. Collect: preferred date, location, number of people, and any special requests
3. Schedule sessions — mention packages, turnaround time, and deposit policy
4. Common services: wedding photography, portrait sessions, event coverage, commercial/product, real estate, drone/aerial`,
  },
  event_planning: {
    steps: [1, 2, 3, 4, 6],
    labels: ['Business', 'Services', 'Hours', 'Voice', 'Review'],
    features: ['calendar'],
    skipAppointments: false, skipHours: false, skipFiles: true,
    emmaRole: `You are the AI receptionist for an event planning business.`,
    emmaDuties: `1. Ask about event type: wedding, corporate, birthday, baby shower, gala, nonprofit fundraiser, etc.
2. Collect: event date, guest count, venue status (booked or searching), budget range, and service needs (full planning or day-of coordination)
3. Schedule consultations to discuss vision and packages
4. Common services: full-service planning, day-of coordination, vendor sourcing, design/styling, budget management`,
  },
  catering: {
    steps: [1, 2, 3, 4, 6],
    labels: ['Business', 'Services', 'Hours', 'Voice', 'Review'],
    features: ['calendar'],
    skipAppointments: false, skipHours: false, skipFiles: true,
    emmaRole: `You are the AI receptionist for a catering business.`,
    emmaDuties: `1. Ask about event type: wedding, corporate lunch, party, gala, drop-off, or full-service
2. Collect: event date, guest count, service style (buffet, plated, stations, family-style), dietary restrictions
3. Schedule tastings and provide menu/pricing information
4. Common services: wedding catering, corporate events, private parties, drop-off meals, bartending service, rental coordination`,
  },
  personal_training: {
    steps: [1, 2, 3, 4, 6],
    labels: ['Business', 'Services', 'Hours', 'Voice', 'Review'],
    features: ['calendar'],
    skipAppointments: false, skipHours: false, skipFiles: true,
    emmaRole: `You are the AI receptionist for a personal training business.`,
    emmaDuties: `1. Ask about fitness goals: weight loss, muscle building, sports performance, rehab, general health
2. Discuss training format: 1-on-1, small group, online coaching, in-home, or at a gym
3. Schedule consultations and sessions — ask about preferred times and frequency
4. Common services: one-on-one training, group sessions, online coaching, nutrition guidance, fitness assessments`,
  },
  yoga_studio: {
    steps: [1, 2, 3, 4, 6],
    labels: ['Business', 'Services', 'Hours', 'Voice', 'Review'],
    features: ['calendar'],
    skipAppointments: false, skipHours: false, skipFiles: true,
    emmaRole: `You are the AI receptionist for a yoga studio.`,
    emmaDuties: `1. Ask if they're new to yoga and what they're looking for: Vinyasa, Hatha, Yin, Hot Yoga, Restorative, etc.
2. Share class schedule and help book a spot — mention drop-in rates, class packs, and membership options
3. For new students: explain what to bring and arrive 15 min early
4. Common services: group classes, private sessions, workshops, teacher training, meditation, retreats`,
  },
  tutoring: {
    steps: [1, 2, 3, 4, 6],
    labels: ['Business', 'Services', 'Hours', 'Voice', 'Review'],
    features: ['calendar'],
    skipAppointments: false, skipHours: false, skipFiles: true,
    emmaRole: `You are the AI receptionist for a tutoring business.`,
    emmaDuties: `1. Ask about the student: grade level, subject, specific challenges, and goals (test prep, grade improvement, enrichment)
2. Schedule sessions — ask about preferred format (in-person or online), frequency, and availability
3. Match student with appropriate tutor based on subject and level
4. Common subjects: math, science, English, SAT/ACT prep, foreign language, special education, study skills`,
  },
  // ── Professional Services ──
  chiropractor: {
    steps: [1, 2, 3, 4, 5, 6],
    labels: ['Business', 'Services', 'Hours', 'Voice', 'Files', 'Review'],
    features: ['calendar'],
    skipAppointments: false, skipHours: false, skipFiles: false,
    emmaRole: `You are the AI receptionist for a chiropractic practice.`,
    emmaDuties: `1. Ask if they're a new or existing patient
2. For new patients: schedule initial consultation and exam — explain what to bring (ID, insurance, any imaging)
3. Ask about: pain location (back, neck, shoulder, headache), injury or gradual onset, and insurance
4. Schedule adjustments and follow-ups
5. Common services: spinal adjustment, decompression, sports chiropractic, injury rehab, posture correction, X-ray`,
  },
  physical_therapy: {
    steps: [1, 2, 3, 4, 5, 6],
    labels: ['Business', 'Services', 'Hours', 'Voice', 'Files', 'Review'],
    features: ['calendar'],
    skipAppointments: false, skipHours: false, skipFiles: false,
    emmaRole: `You are the AI receptionist for a physical therapy practice.`,
    emmaDuties: `1. Ask if they have a referral/prescription and what they're being seen for (post-surgery, injury, chronic pain, sports rehab)
2. Verify insurance and schedule initial evaluation
3. Schedule ongoing therapy sessions — 2-3x/week is typical
4. Common services: orthopedic PT, sports rehab, post-surgical rehab, manual therapy, dry needling, vestibular therapy`,
  },
  dentist: {
    steps: [1, 2, 3, 4, 5, 6],
    labels: ['Business', 'Services', 'Hours', 'Voice', 'Files', 'Review'],
    features: ['calendar'],
    skipAppointments: false, skipHours: false, skipFiles: false,
    emmaRole: `You are the AI receptionist for a dental practice.`,
    emmaDuties: `1. Ask if they're a new or existing patient and the reason for their visit: routine cleaning, tooth pain, cosmetic consult, emergency
2. For tooth pain/emergencies: triage and offer soonest available appointment
3. Verify insurance and schedule at appropriate interval
4. Common services: cleaning/exam, fillings, crowns, root canals, whitening, Invisalign, extractions, implants`,
  },
  optometrist: {
    steps: [1, 2, 3, 4, 5, 6],
    labels: ['Business', 'Services', 'Hours', 'Voice', 'Files', 'Review'],
    features: ['calendar'],
    skipAppointments: false, skipHours: false, skipFiles: false,
    emmaRole: `You are the AI receptionist for an optometry practice.`,
    emmaDuties: `1. Ask about visit type: routine eye exam, contact lens fitting, medical issue (red eye, flashes, floaters, vision change), or glasses adjustment
2. Verify vision insurance and schedule accordingly
3. For medical/urgent issues: prioritize same-day or next-day availability
4. Common services: comprehensive eye exam, contact lens exam, glaucoma screening, diabetic eye exam, glasses/contact dispensing`,
  },
  lawyer: {
    steps: [1, 2, 3, 4, 5, 6],
    labels: ['Business', 'Services', 'Hours', 'Voice', 'Files', 'Review'],
    features: ['calendar'],
    skipAppointments: false, skipHours: false, skipFiles: false,
    emmaRole: `You are the AI receptionist for a law firm.`,
    emmaDuties: `1. Ask about legal matter: family law, criminal defense, personal injury, estate planning, business, real estate, immigration, etc.
2. Screen for conflicts: ask name of opposing party/counsel
3. Schedule consultations — mention consultation fee if applicable
4. NEVER give legal advice — only schedule and collect basic info
5. Common practice areas: divorce/custody, DUI/defense, wills/trusts, incorporation, contracts, personal injury`,
  },
  accountant: {
    steps: [1, 2, 3, 4, 5, 6],
    labels: ['Business', 'Services', 'Hours', 'Voice', 'Files', 'Review'],
    features: ['calendar'],
    skipAppointments: false, skipHours: false, skipFiles: false,
    emmaRole: `You are the AI receptionist for an accounting firm.`,
    emmaDuties: `1. Ask about needs: tax preparation (personal/business), bookkeeping, payroll, audit representation, business advisory
2. For tax work: ask if they're a new or returning client and note the tax year(s) needed
3. Schedule consultations and drop-offs — seasonal availability may be tight
4. Common services: tax prep, bookkeeping, payroll, CFO advisory, audit support, entity formation`,
  },
  insurance_agent: {
    steps: [1, 2, 3, 4, 5, 6],
    labels: ['Business', 'Services', 'Hours', 'Voice', 'Files', 'Review'],
    features: ['calendar'],
    skipAppointments: false, skipHours: false, skipFiles: false,
    emmaRole: `You are the AI receptionist for an insurance agency.`,
    emmaDuties: `1. Ask what type of insurance they need: auto, home, life, business, health, renters, etc.
2. For quotes: collect basic info (name, vehicle/dwelling details, desired coverage) and schedule a call with an agent
3. For existing clients: handle policy questions, update info, or file claims
4. Common products: auto, homeowners, life, commercial, umbrella, bonds, flood insurance`,
  },
  real_estate_appraiser: {
    steps: [1, 2, 3, 4, 5, 6],
    labels: ['Business', 'Services', 'Hours', 'Voice', 'Files', 'Review'],
    features: ['calendar'],
    skipAppointments: false, skipHours: false, skipFiles: false,
    emmaRole: `You are the AI receptionist for a real estate appraisal business.`,
    emmaDuties: `1. Ask about appraisal purpose: purchase, refinance, estate, divorce, tax appeal, PMI removal
2. Collect: property address, property type, approximate size, and lender/client name
3. Schedule inspection appointments — note any access instructions
4. Common services: residential appraisal, commercial appraisal, FHA/VA appraisal, desk review, tax assessment appeal`,
  },
  architect: {
    steps: [1, 2, 3, 4, 5, 6],
    labels: ['Business', 'Services', 'Hours', 'Voice', 'Files', 'Review'],
    features: ['calendar'],
    skipAppointments: false, skipHours: false, skipFiles: false,
    emmaRole: `You are the AI receptionist for an architecture firm.`,
    emmaDuties: `1. Ask about project type: new construction, addition, remodel, commercial, residential, or feasibility study
2. Collect: project scope, approximate budget, timeline, and whether they own the property
3. Schedule initial consultations to discuss vision and services
4. Common services: architectural design, permit drawings, 3D rendering, master planning, interior design coordination`,
  },
  notary: {
    steps: [1, 2, 3, 4, 5, 6],
    labels: ['Business', 'Services', 'Hours', 'Voice', 'Files', 'Review'],
    features: ['calendar'],
    skipAppointments: false, skipHours: false, skipFiles: false,
    emmaRole: `You are the AI receptionist for a notary public business.`,
    emmaDuties: `1. Ask what needs notarization: real estate docs, power of attorney, wills, affidavits, loan documents, etc.
2. Confirm: do they need mobile notary (you go to them) or will they come to your office?
3. Remind them to bring valid photo ID and DO NOT sign documents before meeting
4. Schedule appointments — note document type and number of signatures needed
5. Common services: general notary, mobile notary, loan signing, apostille, I-9 verification, remote online notary`,
  },
  // ── Home Services ──
  lawn_care: {
    steps: [1, 2, 3, 4, 5, 6],
    labels: ['Business', 'Services', 'Hours', 'Voice', 'Files', 'Review'],
    features: ['calendar', 'estimates'],
    skipAppointments: false, skipHours: false, skipFiles: false,
    emmaRole: `You are the AI receptionist for a lawn care business.`,
    emmaDuties: `1. Ask about service needs: weekly mowing, fertilization, weed control, aeration, overseeding, leaf removal, or full maintenance
2. Collect: property size (acreage or sq ft), current condition, and service frequency
3. Schedule estimates and recurring service routes
4. Note that mowing and treatments are weather and season-dependent
5. Common services: mowing, fertilization, weed control, aeration, mulching, leaf cleanup, seasonal yard cleanup`,
  },
  junk_removal: {
    steps: [1, 2, 3, 4, 5, 6],
    labels: ['Business', 'Services', 'Hours', 'Voice', 'Files', 'Review'],
    features: ['calendar', 'dispatch'],
    skipAppointments: false, skipHours: false, skipFiles: false,
    emmaRole: `You are the AI receptionist for a junk removal business.`,
    emmaDuties: `1. Ask what needs removed: furniture, appliances, construction debris, yard waste, estate cleanout, hoarding, etc.
2. Estimate volume: truckload, half-load, or individual items — ask about size and quantity
3. Schedule pickup — offer same-day or next-day when available
4. Note any items needing special handling (chemicals, refrigerants, tires)
5. Common services: furniture removal, appliance haul-away, estate cleanouts, construction debris, foreclosure cleanouts`,
  },
  garage_door: {
    steps: [1, 2, 3, 4, 5, 6],
    labels: ['Business', 'Services', 'Hours', 'Voice', 'Files', 'Review'],
    features: ['calendar', 'emergency'],
    skipAppointments: false, skipHours: false, skipFiles: false,
    emmaRole: `You are the AI receptionist for a garage door business.`,
    emmaDuties: `1. TRIAGE FIRST: "Is this an emergency?" (door stuck open/closed, spring broken, door off track, vehicle trapped inside/outside)
2. Emergencies: flag as urgent, dispatch technician — advise caller not to force the door
3. Non-emergencies: schedule repair or new installation estimates
4. Ask: door type, age, opener brand, and symptoms
5. Common services: spring replacement, opener repair, cable replacement, new door install, track repair, remote programming`,
  },
  gutter_cleaning: {
    steps: [1, 2, 3, 4, 5, 6],
    labels: ['Business', 'Services', 'Hours', 'Voice', 'Files', 'Review'],
    features: ['calendar', 'estimates'],
    skipAppointments: false, skipHours: false, skipFiles: false,
    emmaRole: `You are the AI receptionist for a gutter cleaning business.`,
    emmaDuties: `1. Ask about the property: home height (single story, 2-story, 3+), linear feet of gutters, and last cleaning date
2. Schedule service — mention seasonal maintenance plans
3. Note that work may be weather-dependent and safety-dependent for steep roofs
4. Common services: gutter cleaning, downspout clearing, gutter guard installation, minor repair, exterior window cleaning add-on`,
  },
  chimney_sweep: {
    steps: [1, 2, 3, 4, 5, 6],
    labels: ['Business', 'Services', 'Hours', 'Voice', 'Files', 'Review'],
    features: ['calendar'],
    skipAppointments: false, skipHours: false, skipFiles: false,
    emmaRole: `You are the AI receptionist for a chimney sweep business.`,
    emmaDuties: `1. Ask about service: chimney sweep/inspection, repair, cap installation, or animal removal
2. Collect: fireplace type (wood-burning, gas, pellet), last sweep date, and any issues (smoke backup, odor, animals)
3. Schedule appointments — note that inspections are recommended annually
4. Common services: chimney sweeping, Level 1/2 inspection, cap/damper install, masonry repair, liner installation, dryer vent cleaning`,
  },
  water_damage: {
    steps: [1, 2, 3, 4, 5, 6],
    labels: ['Business', 'Services', 'Hours', 'Voice', 'Files', 'Review'],
    features: ['calendar', 'emergency'],
    skipAppointments: false, skipHours: false, skipFiles: false,
    emmaRole: `You are the AI receptionist for a water damage restoration business.`,
    emmaDuties: `1. TRIAGE FIRST: "Is water actively coming in right now?" — if yes, flag as emergency, dispatch immediately; advise caller to shut off water if safe
2. Ask about: water source (clean/rain, grey, or sewage), affected areas and materials, how long water has been present
3. Emergencies: 24/7 dispatch for extraction and drying
4. Non-emergencies: schedule inspection for mold or lingering moisture
5. Common services: water extraction, structural drying, mold remediation, sewage cleanup, fire/smoke restoration, insurance claim assistance`,
  },
  mold_remediation: {
    steps: [1, 2, 3, 4, 5, 6],
    labels: ['Business', 'Services', 'Hours', 'Voice', 'Files', 'Review'],
    features: ['calendar'],
    skipAppointments: false, skipHours: false, skipFiles: false,
    emmaRole: `You are the AI receptionist for a mold remediation business.`,
    emmaDuties: `1. Ask about the mold situation: where is it visible, approximate area size, any known water source, and health symptoms occupants are experiencing
2. Schedule inspections and testing — note if it's urgent (large area, health concerns, real estate transaction)
3. Common services: mold inspection, air quality testing, containment and removal, sanitization, moisture source correction, clearance testing`,
  },
  solar_install: {
    steps: [1, 2, 3, 4, 5, 6],
    labels: ['Business', 'Services', 'Hours', 'Voice', 'Files', 'Review'],
    features: ['calendar', 'estimates', 'site-visits'],
    skipAppointments: false, skipHours: false, skipFiles: false,
    emmaRole: `You are the AI receptionist for a solar installation business.`,
    emmaDuties: `1. Ask about interest: residential or commercial solar, battery storage, or both
2. Collect: property address, roof age/condition, average electric bill, and whether they own the home
3. Schedule site assessments for roof evaluation and system design
4. Mention financing options, tax credits, and net metering availability
5. Common services: solar panel installation, battery backup, system monitoring, maintenance, roof evaluation`,
  },
  // ── Medical / Health ──
  medical_clinic: {
    steps: [1, 2, 3, 4, 5, 6],
    labels: ['Business', 'Services', 'Hours', 'Voice', 'Files', 'Review'],
    features: ['calendar'],
    skipAppointments: false, skipHours: false, skipFiles: false,
    emmaRole: `You are the AI receptionist for a medical clinic.`,
    emmaDuties: `1. Ask if they're a new or existing patient and the reason for visit
2. Verify insurance and schedule appointments — collect: name, DOB, preferred provider, and brief reason for visit
3. For urgent symptoms (chest pain, difficulty breathing, severe bleeding): advise caller to call 911 or go to ER immediately
4. NEVER provide medical advice — only schedule and collect intake info
5. Common services: primary care, annual physical, sick visit, vaccinations, lab work, chronic disease management`,
  },
  urgent_care: {
    steps: [1, 2, 3, 4, 5, 6],
    labels: ['Business', 'Services', 'Hours', 'Voice', 'Files', 'Review'],
    features: ['calendar', 'emergency'],
    skipAppointments: false, skipHours: false, skipFiles: false,
    emmaRole: `You are the AI receptionist for an urgent care clinic.`,
    emmaDuties: `1. TRIAGE: Ask what symptoms they're experiencing and determine urgency
2. For life-threatening emergencies (chest pain, stroke symptoms, severe bleeding, difficulty breathing): advise caller to call 911 immediately — do not wait
3. For urgent but non-life-threatening issues: provide current wait time, offer to hold their spot, give directions
4. Collect: name, DOB, insurance, and brief symptom description
5. NEVER provide medical advice — only triage for urgency and direct to appropriate care
6. Common visits: flu/cold, sprains/fractures, cuts/lacerations, infections, X-rays, lab tests, COVID/flu/strep testing`,
  },
  veterinary: {
    steps: [1, 2, 3, 4, 5, 6],
    labels: ['Business', 'Services', 'Hours', 'Voice', 'Files', 'Review'],
    features: ['calendar', 'emergency'],
    skipAppointments: false, skipHours: false, skipFiles: false,
    emmaRole: `You are the AI receptionist for a veterinary clinic.`,
    emmaDuties: `1. Ask about the pet: species, breed, age, and what's going on
2. TRIAGE for emergencies: difficulty breathing, unable to urinate, seizures, bloating, poisoning, trauma, labor issues — flag as urgent, get pet seen immediately; provide nearest emergency vet if after hours
3. For routine care: schedule wellness exams, vaccinations, dental cleanings, etc.
4. Collect: client name, pet name, and brief reason for visit
5. Common services: wellness exams, vaccinations, dental care, surgery, diagnostics, boarding, grooming`,
  },
  // ── Other: Generic fallback ──
  other: {
    steps: [1, 2, 3, 4, 5, 6],
    labels: ['Business', 'Services', 'Hours', 'Voice', 'Files', 'Review'],
    features: ['calendar', 'estimates'],
    skipAppointments: false, skipHours: false, skipFiles: false,
    emmaRole: null,
    emmaDuties: null,
  },
};

function getTemplateForIndustry(industry) {
  return INDUSTRY_TEMPLATES[industry] || INDUSTRY_TEMPLATES['other'];
}

// ═══════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    },
  });
}

function apiError(msg, status = 400) {
  return json({ ok: false, error: msg }, status);
}

function corsPreflight() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
      'Access-Control-Max-Age': '86400',
    },
  });
}

function nowISO() {
  return new Date().toISOString();
}

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function daysFromNow(n) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString();
}

function escapeHtml(str) {
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function formatTime12h(time) {
  const parts = time.split(':');
  const h = parseInt(parts[0], 10);
  const m = parts[1] || '00';
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12}:${m.padStart(2, '0')} ${ampm}`;
}

// ═══════════════════════════════════════════════════════════════════════
// EMAIL (Resend)
// ═══════════════════════════════════════════════════════════════════════

async function sendEmail(env, { to, subject, html }) {
  const RESEND_KEY = env.RESEND_API_KEY;
  if (!RESEND_KEY) return false;
  try {
    const resp = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'Branch Live <hello@branchlive.com>',
        to,
        subject,
        html
      })
    });
    console.log('Resend:', resp.status, await resp.text());
    return resp.ok;
  } catch (e) {
    console.error('Resend error:', e.message);
    return false;
  }
}

function emailShell(content) {
  return `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background-color:#06060c;font-family:'Inter',-apple-system,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#06060c;padding:40px 0;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background-color:#0e0e18;border-radius:12px;border:1px solid #1e293b;">
<tr><td style="padding:32px 40px;">
<div style="text-align:center;margin-bottom:24px;">
<span style="color:#8b5cf6;font-size:24px;font-weight:700;">⚡ Branch Live</span>
</div>
${content}
</td></tr>
<tr><td style="padding:20px 40px;border-top:1px solid #1e293b;text-align:center;">
<p style="color:#475569;font-size:12px;margin:0;line-height:1.6;">
Need help? Call Emma at <span style="color:#8b5cf6;">(717) 432-1061</span><br>
&copy; 2026 Branch Live. All rights reserved.
</p>
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}

function welcomeEmailContent(name) {
  const safeName = escapeHtml(name);
  return `
<h1 style="color:#f1f5f9;font-size:22px;font-weight:700;margin:0 0 12px;text-align:center;">Welcome to Branch Live, ${safeName}!</h1>
<p style="color:#94a3b8;font-size:15px;line-height:1.6;margin:0 0 20px;text-align:center;">
Your AI receptionist is ready to answer calls 24/7.
</p>
<div style="background-color:#1a1a2e;border-radius:8px;padding:20px;margin-bottom:20px;">
<p style="color:#f1f5f9;font-size:14px;font-weight:600;margin:0 0 12px;">🎉 Your Trial Includes:</p>
<ul style="color:#94a3b8;font-size:14px;line-height:1.8;margin:0;padding-left:20px;">
<li>30 days of unlimited AI call answering</li>
<li>Smart lead capture &amp; job details</li>
<li>Appointment scheduling</li>
<li>Full dashboard access</li>
</ul>
</div>
<div style="text-align:center;margin-bottom:8px;">
<a href="https://branchlive.com/onboarding" style="display:inline-block;background-color:#8b5cf6;color:#fff;text-decoration:none;padding:14px 36px;border-radius:8px;font-weight:600;font-size:15px;">Set Up Your AI Receptionist →</a>
</div>
<p style="color:#475569;font-size:13px;text-align:center;margin:16px 0 0;">
Questions? Call Emma anytime at <span style="color:#8b5cf6;">(717) 432-1061</span>
</p>`;
}

function appointmentConfirmEmailContent(title, date, time, customerName, customerPhone) {
  const formattedDate = new Date(date + 'T' + (time || '00:00')).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const displayTime = time ? formatTime12h(time) : 'TBD';
  let customerRows = '';
  if (customerName) customerRows += `<tr><td style="padding:8px 0;color:#94a3b8;font-size:14px;">👤 Customer</td><td style="padding:8px 0;color:#f1f5f9;font-size:14px;font-weight:500;text-align:right;">${escapeHtml(customerName)}</td></tr>`;
  if (customerPhone) customerRows += `<tr><td style="padding:8px 0;color:#94a3b8;font-size:14px;">📞 Phone</td><td style="padding:8px 0;color:#f1f5f9;font-size:14px;font-weight:500;text-align:right;">${escapeHtml(customerPhone)}</td></tr>`;
  return `
<h1 style="color:#f1f5f9;font-size:20px;font-weight:700;margin:0 0 8px;text-align:center;">Appointment Confirmed</h1>
<p style="color:#8b5cf6;font-size:16px;font-weight:600;text-align:center;margin:0 0 20px;">${escapeHtml(title)}</p>
<div style="background-color:#1a1a2e;border-radius:8px;padding:20px;margin-bottom:20px;">
<table width="100%" cellpadding="0" cellspacing="0">
<tr><td style="padding:8px 0;color:#94a3b8;font-size:14px;">📅 Date</td><td style="padding:8px 0;color:#f1f5f9;font-size:14px;font-weight:500;text-align:right;">${formattedDate}</td></tr>
<tr><td style="padding:8px 0;color:#94a3b8;font-size:14px;">⏰ Time</td><td style="padding:8px 0;color:#f1f5f9;font-size:14px;font-weight:500;text-align:right;">${displayTime}</td></tr>
${customerRows}
</table>
</div>
<div style="text-align:center;">
<a href="https://branchlive.com/dashboard" style="display:inline-block;background-color:#8b5cf6;color:#fff;text-decoration:none;padding:12px 32px;border-radius:8px;font-weight:600;font-size:14px;">View in Dashboard →</a>
</div>`;
}

function passwordResetEmailContent(name, resetLink) {
  return `
<h1 style="color:#f1f5f9;font-size:20px;font-weight:700;margin:0 0 12px;text-align:center;">Reset Your Password</h1>
<p style="color:#94a3b8;font-size:15px;line-height:1.6;margin:0 0 20px;text-align:center;">
Hi ${escapeHtml(name || 'there')}, we received a request to reset your Branch Live password.
</p>
<div style="text-align:center;margin-bottom:20px;">
<a href="${resetLink}" style="display:inline-block;background-color:#8b5cf6;color:#fff;text-decoration:none;padding:14px 36px;border-radius:8px;font-weight:600;font-size:15px;">Reset Password →</a>
</div>
<p style="color:#475569;font-size:13px;text-align:center;margin:0;line-height:1.6;">
This link expires in 1 hour.<br>
If you didn't request this, you can safely ignore this email.
</p>`;
}

function leadNotificationEmailContent(callerName, callerPhone, callerEmail, jobDetails, urgency) {
  let rows = '';
  if (callerPhone) rows += `<tr><td style="padding:8px 0;color:#94a3b8;font-size:14px;">📞 Phone</td><td style="padding:8px 0;color:#f1f5f9;font-size:14px;font-weight:500;text-align:right;">${escapeHtml(callerPhone)}</td></tr>`;
  if (callerEmail) rows += `<tr><td style="padding:8px 0;color:#94a3b8;font-size:14px;">✉️ Email</td><td style="padding:8px 0;color:#f1f5f9;font-size:14px;font-weight:500;text-align:right;">${escapeHtml(callerEmail)}</td></tr>`;
  if (jobDetails) rows += `<tr><td style="padding:8px 0;color:#94a3b8;font-size:14px;vertical-align:top;">📋 Details</td><td style="padding:8px 0;color:#f1f5f9;font-size:14px;font-weight:500;text-align:right;">${escapeHtml(jobDetails)}</td></tr>`;
  if (urgency) {
    const urgColor = urgency === 'high' ? '#ef4444' : urgency === 'medium' ? '#f59e0b' : '#00d4aa';
    rows += `<tr><td style="padding:8px 0;color:#94a3b8;font-size:14px;">⚠️ Urgency</td><td style="padding:8px 0;color:${urgColor};font-size:14px;font-weight:600;text-align:right;text-transform:capitalize;">${escapeHtml(urgency)}</td></tr>`;
  }
  return `
<h1 style="color:#f1f5f9;font-size:20px;font-weight:700;margin:0 0 8px;text-align:center;">🔔 New Lead</h1>
<p style="color:#8b5cf6;font-size:16px;font-weight:600;text-align:center;margin:0 0 20px;">${escapeHtml(callerName || 'Unknown Caller')}</p>
<div style="background-color:#1a1a2e;border-radius:8px;padding:20px;margin-bottom:20px;">
<table width="100%" cellpadding="0" cellspacing="0">
${rows}
</table>
</div>
<div style="text-align:center;">
<a href="https://branchlive.com/dashboard" style="display:inline-block;background-color:#8b5cf6;color:#fff;text-decoration:none;padding:12px 32px;border-radius:8px;font-weight:600;font-size:14px;">View in Dashboard →</a>
</div>`;
}

// ═══════════════════════════════════════════════════════════════════════
// PASSWORD HASHING (SHA-256 via Web Crypto)
// ═══════════════════════════════════════════════════════════════════════

async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

async function checkPassword(password, storedHash) {
  const computed = await hashPassword(password);
  return computed === storedHash;
}

// ═══════════════════════════════════════════════════════════════════════
// AUTH
// ═══════════════════════════════════════════════════════════════════════

async function getUserId(request, env) {
  const auth = request.headers.get('Authorization');
  if (!auth || !auth.startsWith('Bearer ')) return null;
  const token = auth.slice(7).trim();
  if (!token) return null;
  try {
    const row = await env.DB.prepare(
      'SELECT user_id FROM sessions WHERE token = ?'
    ).bind(token).first();
    return row ? row.user_id : null;
  } catch (e) {
    console.error('Auth error:', e);
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════════════
// DATABASE INIT + DEMO DATA
// ═══════════════════════════════════════════════════════════════════════

let dbInitDone = false;

const DEMO_PW_HASH = 'd3ad9315b7be5dd53b31a273b3b3aba5defe700808305aa16a3062b76658a791';

async function initDB(env) {
  if (dbInitDone) return;
  try {
    await env.DB.batch([
      env.DB.prepare(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE,
        password_hash TEXT,
        name TEXT,
        company TEXT,
        phone TEXT,
        created_at TEXT
      )`),
      env.DB.prepare(`CREATE TABLE IF NOT EXISTS sessions (
        token TEXT PRIMARY KEY,
        user_id INTEGER,
        created_at TEXT
      )`),
      env.DB.prepare(`CREATE TABLE IF NOT EXISTS leads (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        caller_name TEXT,
        caller_phone TEXT,
        caller_email TEXT,
        job_details TEXT,
        urgency TEXT,
        status TEXT DEFAULT 'new',
        transcript TEXT,
        created_at TEXT,
        updated_at TEXT
      )`),
      env.DB.prepare(`CREATE TABLE IF NOT EXISTS call_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        lead_id INTEGER,
        caller_phone TEXT,
        duration_sec INTEGER,
        summary TEXT,
        transcript TEXT,
        created_at TEXT
      )`),
      env.DB.prepare(`CREATE TABLE IF NOT EXISTS settings (
        user_id INTEGER PRIMARY KEY,
        business_name TEXT,
        forwarding_number TEXT,
        welcome_message TEXT,
        working_hours TEXT,
        industry TEXT,
        service_area TEXT,
        service_description TEXT,
        notify_sms INTEGER DEFAULT 0,
        notify_email INTEGER DEFAULT 0,
        notify_urgent_only INTEGER DEFAULT 0,
        google_calendar_api_key TEXT DEFAULT '',
        google_calendar_id TEXT DEFAULT '',
        buffer_min INTEGER DEFAULT 30,
        sms_consent INTEGER DEFAULT 0
      )`),
      env.DB.prepare(`CREATE TABLE IF NOT EXISTS knowledge (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        category TEXT,
        item TEXT,
        price REAL,
        notes TEXT
      )`),
      env.DB.prepare(`CREATE TABLE IF NOT EXISTS subscriptions (
        user_id INTEGER PRIMARY KEY,
        stripe_customer_id TEXT,
        plan TEXT DEFAULT 'free',
        status TEXT DEFAULT 'trial',
        trial_start TEXT,
        trial_end TEXT,
        created_at TEXT
      )`),
      env.DB.prepare(`CREATE TABLE IF NOT EXISTS appointments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        title TEXT,
        customer_name TEXT,
        customer_phone TEXT,
        date TEXT,
        time TEXT,
        duration_min INTEGER DEFAULT 60,
        status TEXT DEFAULT 'confirmed',
        notes TEXT,
        google_event_id TEXT,
        created_at TEXT,
        appointment_type_id INTEGER,
        buffer_enabled INTEGER DEFAULT 0,
        buffer_min INTEGER DEFAULT 30
      )`),
      env.DB.prepare(`CREATE TABLE IF NOT EXISTS password_resets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        token TEXT UNIQUE,
        expires_at TEXT,
        used INTEGER DEFAULT 0,
        created_at TEXT
      )`),
      env.DB.prepare(`CREATE TABLE IF NOT EXISTS appointment_types (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        name TEXT,
        duration_min INTEGER DEFAULT 60,
        color TEXT DEFAULT '#8b5cf6'
      )`),
      env.DB.prepare(`CREATE TABLE IF NOT EXISTS blocked_time (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        date TEXT,
        start_time TEXT,
        end_time TEXT,
        label TEXT
      )`),
      env.DB.prepare(`CREATE TABLE IF NOT EXISTS onboarding_data (
        user_id INTEGER PRIMARY KEY,
        step1_data TEXT,
        step2_data TEXT,
        step3_data TEXT,
        step4_data TEXT,
        step5_data TEXT,
        step6_data TEXT,
        step7_data TEXT,
        step8_data TEXT,
        completed_steps TEXT,
        ai_prompt TEXT,
        completed_at TEXT,
        updated_at TEXT
      )`),
    ]);

    // Migration: add buffer columns if missing (idempotent — safe to run on existing DBs)
    try { await env.DB.prepare('ALTER TABLE appointments ADD COLUMN buffer_enabled INTEGER DEFAULT 0').run(); } catch(e) {}
    try { await env.DB.prepare('ALTER TABLE appointments ADD COLUMN buffer_min INTEGER DEFAULT 30').run(); } catch(e) {}
    // Migration: add sms_consent column (Twilio A2P verification)
    try { await env.DB.prepare('ALTER TABLE settings ADD COLUMN sms_consent INTEGER DEFAULT 0').run(); } catch(e) {}

    // Seed demo data if empty
    const userCount = await env.DB.prepare(
      'SELECT COUNT(*) as cnt FROM users'
    ).first();
    if (userCount && userCount.cnt === 0) {
      await seedDemoData(env);
    }

    // Ensure demo password is correct (idempotent)
    await env.DB.prepare(
      'UPDATE users SET password_hash = ? WHERE email = ?'
    ).bind(DEMO_PW_HASH, 'demo@branchlive.com').run();

    dbInitDone = true;
  } catch (e) {
    console.error('DB init error:', e);
  }
}

async function seedDemoData(env) {
  const now = nowISO();
  const trialEnd = daysFromNow(30);

  // Clean up any prior demo data (idempotent re-seed)
  const tables = ['call_logs', 'knowledge', 'subscriptions', 'appointments', 'appointment_types', 'leads', 'settings', 'sessions', 'users'];
  for (const table of tables) {
    try {
      await env.DB.prepare(`DELETE FROM ${table} WHERE user_id = 1`).run();
    } catch (e) {
      // If no user_id column, try id-based cleanup
      try { await env.DB.prepare(`DELETE FROM ${table} WHERE id > 0`).run(); } catch (e2) {}
    }
  }

  // Demo user
  await env.DB.prepare(
    'INSERT INTO users VALUES(NULL, ?, ?, ?, ?, ?, ?)'
  ).bind('demo@branchlive.com', DEMO_PW_HASH, 'Demo User', 'Demo Contracting', '(717) 555-0100', now).run();

  // Demo leads
  const leads = [
    ['John Smith', '(717) 555-1234', 'caller@example.com', 'Need patio pavers installed', 'high'],
    ['Sarah Jones', '(717) 555-5678', 'caller@example.com', 'Retaining wall collapsing — immediate', 'urgent'],
    ['Mike Wilson', '(717) 555-9012', 'caller@example.com', 'Quote for driveway resealing', 'medium'],
  ];
  for (const [name, phone, email, job, urgency] of leads) {
    await env.DB.prepare(
      'INSERT INTO leads VALUES(NULL, 1, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    ).bind(name, phone, email, job, urgency, 'new', '', now, now).run();
  }

  // Demo call logs
  const seededTranscript = `Emma: Hi, this is Emma from Demo Contracting. Am I speaking with Alex?
Alex: Yes, this is Alex. I was hoping to get a quote for a patio.
Emma: Great, I can definitely help with that! What kind of patio are you thinking about — pavers, stamped concrete, or something else?
Alex: I was thinking pavers. Something that'll last, you know?
Emma: Pavers are an excellent choice. We use Unilock and Techo-Bloc — both come with lifetime structural warranties. About how big an area are we talking?
Alex: My backyard is maybe 20 by 30 feet. I'd want most of it covered.
Emma: So roughly 600 square feet. For a standard paver patio with excavation, base prep, and polymeric sand, you'd be looking at roughly $9,000 to $14,000 depending on the paver line and any extras like a fire pit or seating wall.
Alex: That's actually less than I was afraid of. What's the timeline look like?
Emma: We are currently scheduling about 3 weeks out. The install itself usually takes 4-5 days. I can book you a free on-site estimate for this Thursday or Friday if that works?
Alex: Thursday morning works for me.
Emma: Perfect. I've got you down for Thursday at 9 AM. Our estimator will come out, take measurements, and walk you through paver options. You'll get a firm quote within 24 hours.
Alex: Sounds great. Thanks Emma!
Emma: You're welcome, Alex! We'll see you Thursday. Have a great day!`;

  const calls = [
    ['(717) 555-1234', 45, 'Booked patio estimate for Thursday'],
    ['(717) 555-5678', 90, 'Discussed retaining wall emergency'],
    ['(717) 555-9012', 30, 'Provided pricing for driveway'],
  ];
  const callTranscripts = [seededTranscript, '', ''];
  for (let i = 0; i < calls.length; i++) {
    const [phone, dur, summary] = calls[i];
    await env.DB.prepare(
      'INSERT INTO call_logs VALUES(NULL, 1, NULL, ?, ?, ?, ?, ?)'
    ).bind(phone, dur, summary, callTranscripts[i], now).run();
  }

  // Demo settings
  await env.DB.prepare(
    'INSERT INTO settings VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
  ).bind(1, 'Demo Contracting', '(717) 555-0100', 'Hi, thanks for calling Demo Contracting!', 'Mon-Fri 7am-5pm', 'Hardscape & Masonry', 'Central PA', 'Patio pavers, retaining walls, driveways, walkways', 1, 1, 0, '', '', 30, 0).run();

  // Demo knowledge
  const knowledgeItems = [
    ['Pavers', 'Cambridge Cobble', 12.5, 'per sq ft installed'],
    ['Pavers', 'Techo-Bloc Blu 60', 14.75, 'per sq ft installed'],
    ['Walls', 'Celtik Wall Block', 18.0, 'per sq ft face'],
    ['Services', 'Paver Patio Install', 2500, 'starting price — 200 sq ft'],
    ['Services', 'Retaining Wall', 3500, 'starting price — 30 ft'],
    ['Services', 'Sealing', 0.85, 'per sq ft'],
  ];
  for (const [cat, item, price, notes] of knowledgeItems) {
    await env.DB.prepare('INSERT INTO knowledge VALUES(NULL, 1, ?, ?, ?, ?)')
      .bind(cat, item, price, notes).run();
  }

  // Demo subscription
  await env.DB.prepare('INSERT INTO subscriptions VALUES(?, NULL, ?, ?, ?, ?, ?)')
    .bind(1, 'free', 'trial', now, trialEnd, now).run();

  // Demo appointments
  await env.DB.prepare(
    'INSERT INTO appointments VALUES(NULL, 1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
  ).bind('Site Visit - Patio Estimate', 'John Smith', '(717) 555-1234', '2026-06-28', '10:00', 60, 'confirmed', 'Bring paver samples', '', now, null).run();
  await env.DB.prepare(
    'INSERT INTO appointments VALUES(NULL, 1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
  ).bind('Retaining Wall Consult', 'Sarah Jones', '(717) 555-5678', '2026-06-29', '14:00', 90, 'confirmed', 'Emergency follow-up', '', now, null).run();

  // Demo appointment types
  const types = [
    ['Estimate', 60, '#8b5cf6'],
    ['Repair', 30, '#00d4aa'],
    ['Emergency', 90, '#ef4444'],
  ];
  for (const [name, dur, color] of types) {
    await env.DB.prepare('INSERT INTO appointment_types VALUES(NULL, 1, ?, ?, ?)')
      .bind(name, dur, color).run();
  }
}

// ═══════════════════════════════════════════════════════════════════════
// AUTH ENDPOINTS
// ═══════════════════════════════════════════════════════════════════════

async function handleLogin(request, env) {
  try {
    const body = await request.json();
    const email = (body.email || '').trim().toLowerCase();
    const password = body.password || '';
    if (!email || !password) return apiError('Email and password are required');

    const row = await env.DB.prepare(
      'SELECT * FROM users WHERE email = ?'
    ).bind(email).first();

    if (!row) return apiError('Invalid credentials', 401);

    const pwValid = await checkPassword(password, row.password_hash);
    if (!pwValid) return apiError('Invalid credentials', 401);

    // Create session token
    const token = crypto.randomUUID();
    await env.DB.prepare(
      'INSERT INTO sessions VALUES(?, ?, ?)'
    ).bind(token, row.id, nowISO()).run();

    return json({
      ok: true,
      name: row.name,
      company: row.company,
      token,
    });
  } catch (e) {
    console.error('Login error:', e);
    return apiError('Login failed. Please try again.', 500);
  }
}

async function handleMe(request, env, uid) {
  try {
    const row = await env.DB.prepare(
      'SELECT * FROM users WHERE id = ?'
    ).bind(uid).first();
    if (!row) return apiError('User not found', 401);
    return json({
      ok: true,
      name: row.name,
      company: row.company,
      email: row.email,
    });
  } catch (e) {
    console.error('Me error:', e);
    return apiError('Could not load profile', 500);
  }
}

async function handleSignup(request, env) {
  try {
    const body = await request.json();
    const email = (body.email || '').trim().toLowerCase();
    const password = body.password || '';
    const name = (body.name || '').trim();
    const company = (body.company || '').trim();
    const phone = (body.phone || '').trim();
    const smsConsent = body.sms_consent ? 1 : 0;

    if (!email || !email.includes('@')) return apiError('Valid email is required');
    if (password.length < 6) return apiError('Password must be at least 6 characters');
    if (!name) return apiError('Your name is required');
    if (!company) return apiError('Company name is required');

    const existing = await env.DB.prepare(
      'SELECT id FROM users WHERE email = ?'
    ).bind(email).first();
    if (existing) return apiError('An account with this email already exists', 409);

    const pwHash = await hashPassword(password);
    const now = nowISO();
    const trialEnd = daysFromNow(30);

    const result = await env.DB.prepare(
      'INSERT INTO users VALUES(NULL, ?, ?, ?, ?, ?, ?)'
    ).bind(email, pwHash, name, company, phone, now).run();

    let userId = result.meta ? result.meta.last_row_id : null;
    if (!userId) {
      const userRow = await env.DB.prepare(
        'SELECT id FROM users WHERE email = ?'
      ).bind(email).first();
      userId = userRow ? userRow.id : 1;
    }

    await env.DB.prepare(
      'INSERT INTO subscriptions VALUES(?, NULL, ?, ?, ?, ?, ?)'
    ).bind(userId, 'free', 'trial', now, trialEnd, now).run();

    await env.DB.prepare(
      'INSERT INTO settings VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    ).bind(userId, company, phone, `Hi, thanks for calling ${company}!`, 'Mon-Fri 7am-5pm', '', '', '', 1, 1, 0, '', '', 30, smsConsent).run();

    // Create session
    const token = crypto.randomUUID();
    await env.DB.prepare(
      'INSERT INTO sessions VALUES(?, ?, ?)'
    ).bind(token, userId, now).run();

    // Welcome email
    await sendEmail(env, {
      to: email,
      subject: `Welcome to Branch Live, ${name}!`,
      html: emailShell(welcomeEmailContent(name))
    });

    return json({
      ok: true,
      name,
      company,
      trial_end: trialEnd.slice(0, 10),
      token,
    });
  } catch (e) {
    console.error('Signup error:', e);
    return apiError('Could not create account. Please try again.', 500);
  }
}

// POST /api/reset-password — if body has only email → generate token; if body has token+password → confirm reset
async function handleResetPassword(request, env) {
  try {
    const body = await request.json();
    if (!body) return apiError('Request body is required');

    if (body.token) {
      return handleResetPasswordConfirm(env, body);
    }

    // Generate reset token
    const email = body.email ? body.email.trim().toLowerCase() : '';
    if (!email) return apiError('Email is required');

    const user = await env.DB.prepare(
      'SELECT id, name FROM users WHERE email = ?'
    ).bind(email).first();

    if (!user) {
      return json({
        ok: true,
        message: 'If that email is registered, a reset link has been sent.',
      });
    }

    // Expire old tokens
    await env.DB.prepare(
      'UPDATE password_resets SET used = 1 WHERE user_id = ? AND used = 0'
    ).bind(user.id).run();

    // Generate token
    const tokenBytes = new Uint8Array(32);
    crypto.getRandomValues(tokenBytes);
    const token = btoa(String.fromCharCode(...tokenBytes))
      .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

    const expiresAt = new Date(Date.now() + 3600000).toISOString();
    const now = nowISO();

    await env.DB.prepare(
      'INSERT INTO password_resets VALUES(NULL, ?, ?, ?, 0, ?)'
    ).bind(user.id, token, expiresAt, now).run();

    await sendEmail(env, {
      to: email,
      subject: 'Reset Your Branch Live Password',
      html: emailShell(passwordResetEmailContent(user.name,
        `https://branchlive.com/reset-password?token=${token}`))
    });

    return json({
      ok: true,
      message: 'If that email is registered, a reset link has been sent.',
      reset_token: token,
    });
  } catch (e) {
    console.error('Reset password error:', e);
    return apiError('Could not process request. Please try again.', 500);
  }
}

async function handleResetPasswordConfirm(env, body) {
  try {
    const token = (body.token || '').trim();
    const newPassword = body.password || '';

    if (!token) return apiError('Reset token is required');
    if (newPassword.length < 6) return apiError('Password must be at least 6 characters');

    const row = await env.DB.prepare(
      'SELECT id, user_id, expires_at, used FROM password_resets WHERE token = ?'
    ).bind(token).first();

    if (!row) return apiError('Invalid or expired reset link.', 400);
    if (row.used) return apiError('This reset link has already been used.', 400);

    const expiresAt = new Date(row.expires_at);
    if (expiresAt < new Date()) {
      return apiError('This reset link has expired. Please request a new one.', 400);
    }

    const pwHash = await hashPassword(newPassword);
    await env.DB.prepare(
      'UPDATE users SET password_hash = ? WHERE id = ?'
    ).bind(pwHash, row.user_id).run();

    await env.DB.prepare(
      'UPDATE password_resets SET used = 1 WHERE id = ?'
    ).bind(row.id).run();

    return json({ ok: true, message: 'Password has been reset. You may now log in.' });
  } catch (e) {
    console.error('Reset password confirm error:', e);
    return apiError('Could not reset password. Please try again.', 500);
  }
}

// ═══════════════════════════════════════════════════════════════════════
// LEADS ENDPOINTS
// ═══════════════════════════════════════════════════════════════════════

async function handleLeads(request, env, uid) {
  try {
    const { results } = await env.DB.prepare(
      'SELECT * FROM leads WHERE user_id = ? ORDER BY created_at DESC LIMIT 50'
    ).bind(uid).all();

    return json(results.map((r) => ({
      id: r.id,
      caller_name: r.caller_name,
      caller_phone: r.caller_phone,
      caller_email: r.caller_email,
      job_details: r.job_details,
      urgency: r.urgency,
      status: r.status,
      transcript: r.transcript,
      created_at: r.created_at,
      updated_at: r.updated_at,
    })));
  } catch (e) {
    console.error('Leads error:', e);
    return apiError('Could not load leads', 500);
  }
}

async function handleCreateLead(request, env, uid) {
  try {
    const body = await request.json();
    const now = nowISO();
    const callerName = body.caller_name || '';
    const callerPhone = body.caller_phone || '';
    const callerEmail = body.caller_email || '';
    const jobDetails = body.job_details || '';
    const urgency = body.urgency || 'medium';

    await env.DB.prepare(
      'INSERT INTO leads VALUES(NULL, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    ).bind(uid, callerName, callerPhone, callerEmail, jobDetails, urgency, 'new', '', now, now).run();

    // Send lead notification email
    const owner = await env.DB.prepare(
      'SELECT email FROM users WHERE id = ?'
    ).bind(uid).first();
    if (owner) {
      await sendEmail(env, {
        to: owner.email,
        subject: `New Lead — ${callerName || 'Unknown Caller'}`,
        html: emailShell(leadNotificationEmailContent(callerName, callerPhone, callerEmail, jobDetails, urgency))
      });
    }

    const newAppt = await env.DB.prepare(
        'SELECT id FROM appointments WHERE user_id = ? AND date = ? AND time = ? ORDER BY id DESC LIMIT 1'
      ).bind(uid, body.date, body.time).first();
      return json({ ok: true, id: newAppt ? newAppt.id : null, _debug: bufDebug });
  } catch (e) {
    console.error('Create lead error:', e);
    return apiError('Could not create lead', 500);
  }
}


async function handleLeadDelete(request, env, uid, leadId) {
  try {
    await env.DB.prepare('DELETE FROM leads WHERE id = ? AND user_id = ?').bind(leadId, uid).run();
    return json({ ok: true });
  } catch (e) {
    return apiError('Could not delete lead', 500);
  }
}
async function handleUpdateLead(request, env, leadId, uid) {
  try {
    const body = await request.json();
    if (!body || !body.status) return apiError('Status is required');

    await env.DB.prepare(
      'UPDATE leads SET status = ?, updated_at = ? WHERE id = ? AND user_id = ?'
    ).bind(body.status, nowISO(), leadId, uid).run();

    return json({ ok: true });
  } catch (e) {
    console.error('Update lead error:', e);
    return apiError('Could not update lead', 500);
  }
}

async function handleGetLead(request, env, uid, leadId) {
  try {
    const lead = await env.DB.prepare(
      'SELECT * FROM leads WHERE id = ? AND user_id = ?'
    ).bind(leadId, uid).first();
    if (!lead) return apiError('Lead not found', 404);
    // Also get related call logs
    const calls = await env.DB.prepare(
      'SELECT * FROM call_logs WHERE lead_id = ? ORDER BY created_at DESC'
    ).bind(leadId).all();
    lead.calls = calls.results || [];
    return json(lead);
  } catch (e) {
    console.error('Get lead error:', e);
    return apiError('Could not load lead', 500);
  }
}

// ═══════════════════════════════════════════════════════════════════════
// CALL LOGS
// ═══════════════════════════════════════════════════════════════════════

async function handleCallLogs(request, env, uid) {
  try {
    const { results } = await env.DB.prepare(
      'SELECT * FROM call_logs WHERE user_id = ? ORDER BY created_at DESC LIMIT 50'
    ).bind(uid).all();

    return json(results.map((r) => ({
      id: r.id,
      lead_id: r.lead_id,
      caller_phone: r.caller_phone,
      duration_sec: r.duration_sec,
      summary: r.summary,
      transcript: r.transcript,
      created_at: r.created_at,
    })));
  } catch (e) {
    console.error('Call logs error:', e);
    return apiError('Could not load call logs', 500);
  }
}

// ═══════════════════════════════════════════════════════════════════════
// CALENDAR ENDPOINTS
// ═══════════════════════════════════════════════════════════════════════

async function handleCalendar(request, env, uid) {
  try {
    const url = new URL(request.url);
    const from = url.searchParams.get('from') || todayStr();
    const to = url.searchParams.get('to') || (() => {
      const d = new Date(); d.setDate(d.getDate() + 30);
      return d.toISOString().slice(0, 10);
    })();

    const { results } = await env.DB.prepare(
      `SELECT a.*, t.color
       FROM appointments a
       LEFT JOIN appointment_types t ON a.appointment_type_id = t.id
       WHERE a.user_id = ? AND a.status != 'cancelled' AND a.date BETWEEN ? AND ?
       ORDER BY a.date, a.time`
    ).bind(uid, from, to).all();

    return json(results.map((r) => ({
      id: r.id,
      title: r.title,
      customer_name: r.customer_name,
      customer_phone: r.customer_phone,
      date: r.date,
      time: r.time,
      duration_min: r.duration_min,
      status: r.status,
      notes: r.notes,
      google_event_id: r.google_event_id,
      appointment_type_id: r.appointment_type_id,
      color: r.color || null,
    })));
  } catch (e) {
    console.error('Calendar error:', e);
    return apiError('Could not load calendar', 500);
  }
}

async function handleCalendarAdd(request, env, uid) {
  try {
    const body = await request.json();
    if (!body.date || !body.time || !body.title) {
      return apiError('Date, time, and title are required');
    }

    await env.DB.prepare(
      'INSERT INTO appointments VALUES(NULL, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    ).bind(
      uid, body.title,
      body.customer_name || '', body.customer_phone || '',
      body.date, body.time,
      body.duration_min || 60, body.status || 'confirmed',
      body.notes || '', body.google_event_id || '',
      nowISO(), body.appointment_type_id || null,
      body.buffer_enabled ? 1 : 0,
      body.buffer_min || 30
    ).run();

    // Notify business owner
    const owner = await env.DB.prepare(
      'SELECT email FROM users WHERE id = ?'
    ).bind(uid).first();
    if (owner) {
      await sendEmail(env, {
        to: owner.email,
        subject: `Appointment Confirmed — ${body.title}`,
        html: emailShell(appointmentConfirmEmailContent(
          body.title, body.date, body.time,
          body.customer_name || '', body.customer_phone || ''
        ))
      });
    }

    // Send SMS reminder to customer if requested
    if (body.send_sms_reminder && body.customer_phone) {
      const smsDate = new Date(body.date + 'T' + (body.time || '00:00')).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
      const smsTime = formatTime12h(body.time || 'TBD');
      const smsMsg = `📅 Appointment Confirmed: ${body.title} on ${smsDate} at ${smsTime}. Branch Live — Reply STOP to opt out.`;
      await sendSms(env, { to: body.customer_phone, body: smsMsg });
    }

    // Send email confirmation to customer if requested
    if (body.send_email_reminder && body.customer_email) {
      await sendEmail(env, {
        to: body.customer_email,
        subject: `Appointment Confirmed — ${body.title}`,
        html: emailShell(appointmentConfirmEmailContent(
          body.title, body.date, body.time,
          body.customer_name || '', body.customer_phone || ''
        ))
      });
    }

    // Create buffer blocked time if enabled
    const bufDebug = {enabled: body.buffer_enabled, min: body.buffer_min, time: body.time, dur: body.duration_min}; 
    if (body.buffer_enabled) {
      const bufferMin = body.buffer_min || 30;
      const timeParts = (body.time || '0:00').split(':');
      const dur = body.duration_min || 60;
      const startTotalMin = parseInt(timeParts[0]) * 60 + parseInt(timeParts[1]);
      const endTotalMin = startTotalMin + dur;
      const bufEndTotalMin = endTotalMin + bufferMin;
      const endH = Math.floor(endTotalMin % 1440 / 60);
      const endM = endTotalMin % 60;
      const bufEndH = Math.floor(bufEndTotalMin % 1440 / 60);
      const bufEndM = bufEndTotalMin % 60;
      const endTime = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
      const bufEndTime = `${String(bufEndH).padStart(2, '0')}:${String(bufEndM).padStart(2, '0')}`;
      try {
        await env.DB.prepare(
          'INSERT INTO blocked_time VALUES(NULL, ?, ?, ?, ?, ?)'
        ).bind(uid, body.date, endTime, bufEndTime, 'Buffer').run();
        bufDebug.buffer_created = true;
      } catch(e) {
        bufDebug.buffer_error = e.message;
      }
    }

    // Return the new appointment ID
    const newAppt = await env.DB.prepare(
      'SELECT id FROM appointments WHERE user_id = ? ORDER BY id DESC LIMIT 1'
    ).bind(uid).first();
    return json({ ok: true, id: newAppt ? newAppt.id : null, _debug: bufDebug });
  } catch (e) {
    console.error('Calendar add error:', e);
    return apiError('Could not create appointment', 500);
  }
}



async function handleCalendarGet(request, env, uid, apptId) {
  try {
    const appt = await env.DB.prepare(
      'SELECT * FROM appointments WHERE id = ? AND user_id = ?'
    ).bind(apptId, uid).first();
    if (!appt) return apiError('Appointment not found', 404);
    return json(appt);
  } catch (e) {
    console.error('Get appointment error:', e);
    return apiError('Could not load appointment', 500);
  }
}

async function handleCalendarUpdate(request, env, uid, apptId) {
  try {
    const body = await request.json();
    const fields = [];
    const values = [];
    const allowed = ['title','customer_name','customer_phone','date','time','duration_min','notes','status','appointment_type_id','buffer_enabled','buffer_min'];
    for (const f of allowed) {
      if (body[f] !== undefined) { fields.push(f + ' = ?'); values.push(body[f]); }
    }
    if (fields.length === 0) return apiError('No fields to update');
    values.push(apptId, uid);
    await env.DB.prepare(
      'UPDATE appointments SET ' + fields.join(', ') + ' WHERE id = ? AND user_id = ?'
    ).bind(...values).run();

    // BUGFIX: handle buffer recreation on edit — delete old buffer, create new if enabled
    const appt = await env.DB.prepare(
      'SELECT date, time, duration_min FROM appointments WHERE id = ? AND user_id = ?'
    ).bind(apptId, uid).first();
    if (appt) {
      // Compute OLD buffer start time = this appointment's end time BEFORE the update
      const oldTimeParts = (appt.time || '0:00').split(':');
      const oldStartMin = parseInt(oldTimeParts[0]) * 60 + parseInt(oldTimeParts[1]);
      const oldEndMin = oldStartMin + (appt.duration_min || 60);
      const oldEndH = Math.floor(oldEndMin / 60);
      const oldEndM = oldEndMin % 60;
      const oldEndTime = `${String(oldEndH).padStart(2, '0')}:${String(oldEndM).padStart(2, '0')}`;

      // Delete only THIS appointment's old buffer entry (by matching start_time = old end time)
      await env.DB.prepare(
        'DELETE FROM blocked_time WHERE user_id = ? AND date = ? AND start_time = ? AND label = ?'
      ).bind(uid, appt.date, oldEndTime, 'Buffer').run();

      // Create new buffer if enabled
      if (body.buffer_enabled) {
        const bufferMin = body.buffer_min || 30;
        const updatedTime = body.time || appt.time;
        const updatedDur = body.duration_min || appt.duration_min || 60;
        const updatedDate = body.date || appt.date;
        const timeParts = (updatedTime || '0:00').split(':');
        const startTotalMin = parseInt(timeParts[0]) * 60 + parseInt(timeParts[1]);
        const endTotalMin = startTotalMin + updatedDur;
        const bufEndTotalMin = endTotalMin + bufferMin;
        const endH = Math.floor(endTotalMin % 1440 / 60);
        const endM = endTotalMin % 60;
        const bufEndH = Math.floor(bufEndTotalMin % 1440 / 60);
        const bufEndM = bufEndTotalMin % 60;
        const endTime = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
        const bufEndTime = `${String(bufEndH).padStart(2, '0')}:${String(bufEndM).padStart(2, '0')}`;
        await env.DB.prepare(
          'INSERT INTO blocked_time VALUES(NULL, ?, ?, ?, ?, ?)'
        ).bind(uid, updatedDate, endTime, bufEndTime, 'Buffer').run();
      }

      // Send SMS reminder if requested (re-send on edit)
      if (body.send_sms_reminder && body.customer_phone) {
        const smsDate = new Date(appt.date + 'T' + (body.time || appt.time || '00:00')).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
        const smsTime = formatTime12h(body.time || appt.time || 'TBD');
        const smsMsg = `📅 Appointment Updated: ${body.title || appt.title || 'Appointment'} on ${smsDate} at ${smsTime}. Branch Live — Reply STOP to opt out.`;
        await sendSms(env, { to: body.customer_phone, body: smsMsg });
      }
      // Send email confirmation if requested
      if (body.send_email_reminder && body.customer_email) {
        await sendEmail(env, {
          to: body.customer_email,
          subject: `Appointment Updated — ${body.title || appt.title || 'Appointment'}`,
          html: emailShell(appointmentConfirmEmailContent(
            body.title || appt.title, appt.date, body.time || appt.time,
            body.customer_name || '', body.customer_phone || ''
          ))
        });
      }
    }

    return json({ ok: true });
  } catch (e) {
    console.error('Update appointment error:', e);
    return apiError('Could not update appointment', 500);
  }
}


async function handleCalendarBufferCleanup(request, env, uid, apptId) {
  try {
    // Find the appointment to get its date/time
    const appt = await env.DB.prepare(
      'SELECT * FROM appointments WHERE id = ? AND user_id = ?'
    ).bind(apptId, uid).first();
    if (!appt) return apiError('Not found', 404);
    
    // Delete all blocked_time entries that overlap with this appointment's buffer
    // (same date, time between appt end and appt end + buffer)
    const endHour = parseInt(appt.time.split(':')[0]);
    const endMin = parseInt(appt.time.split(':')[1]) + (appt.duration_min || 60);
    const endTime = String(Math.floor(endMin/60)+endHour).padStart(2,'0')+':'+String(endMin%60).padStart(2,'0');
    
    await env.DB.prepare(
      'DELETE FROM blocked_time WHERE user_id = ? AND date = ? AND start_time >= ? AND label = ?'
    ).bind(uid, appt.date, appt.time, 'Buffer').run();
    
    return json({ ok: true });
  } catch (e) {
    return apiError('Cleanup failed', 500);
  }
}

async function handleCalendarDelete(request, env, apptId, uid) {
  try {
    // Fetch appointment to compute buffer cleanup
    const appt = await env.DB.prepare(
      'SELECT * FROM appointments WHERE id = ? AND user_id = ?'
    ).bind(apptId, uid).first();

    if (appt && appt.buffer_enabled) {
      // Compute buffer start time = appointment end time
      const timeParts = (appt.time || '0:00').split(':');
      const startMin = parseInt(timeParts[0]) * 60 + parseInt(timeParts[1]);
      const endMin = startMin + (appt.duration_min || 60);
      const endH = Math.floor(endMin / 60);
      const endM = endMin % 60;
      const endTime = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;

      // Delete buffer blocked_time matching this appointment's end time
      await env.DB.prepare(
        'DELETE FROM blocked_time WHERE user_id = ? AND date = ? AND start_time = ? AND label = ?'
      ).bind(uid, appt.date, endTime, 'Buffer').run();
    }

    await env.DB.prepare(
      'DELETE FROM appointments WHERE id = ? AND user_id = ?'
    ).bind(apptId, uid).run();
    return json({ ok: true });
  } catch (e) {
    console.error('Calendar delete error:', e);
    return apiError('Could not delete appointment', 500);
  }
}

async function handleCalendarSlots(request, env, uid) {
  try {
    const url = new URL(request.url);
    const date = url.searchParams.get('date') || todayStr();

    let whText = 'Mon-Fri 7am-5pm';
    let bufferMin = 30;
    try {
      const settings = await env.DB.prepare(
        'SELECT working_hours, buffer_min FROM settings WHERE user_id = ?'
      ).bind(uid).first();
      if (settings) {
        whText = settings.working_hours || whText;
        bufferMin = (settings.buffer_min != null) ? settings.buffer_min : 30;
      }
    } catch(e) {
      // Column may not exist yet — use defaults
      console.error('Settings query failed (may be missing column):', e.message);
    }
    let whStart = 7, whEnd = 17;
    const whMatch = whText.match(/(\d+)\s*(am|pm)?\s*[–\-]\s*(\d+)\s*(am|pm)?/i);
    if (whMatch) {
      whStart = parseInt(whMatch[1]);
      whEnd = parseInt(whMatch[3]);
      // Convert to 24-hour: if end has "pm" suffix and is < 12, add 12
      if (whMatch[4] && whMatch[4].toLowerCase() === 'pm' && whEnd < 12) whEnd += 12;
      if (whMatch[2] && whMatch[2].toLowerCase() === 'pm' && whStart < 12) whStart += 12;
      // Fallback: if end <= start and looks like PM (e.g. "7am-5pm" gives 7 and 5)
      if (whEnd <= whStart) whEnd += 12;
    }

    const { results: apps } = await env.DB.prepare(
      `SELECT a.*, t.color
       FROM appointments a
       LEFT JOIN appointment_types t ON a.appointment_type_id = t.id
       WHERE a.user_id = ? AND a.status != 'cancelled' AND a.date = ?
       ORDER BY a.time`
    ).bind(uid, date).all();

    const { results: blocks } = await env.DB.prepare(
      'SELECT * FROM blocked_time WHERE user_id = ? AND date = ?'
    ).bind(uid, date).all();

    const bookedMap = {};
    const blockedMap = {};

    for (const a of apps) {
      const timeParts = (a.time || '0:00').split(':');
      const h = parseInt(timeParts[0]) || 0;
      const dur = a.duration_min || 60;

      for (let offset = 0; offset < dur; offset += 30) {
        const bh = h + Math.floor(offset / 60);
        const bm = (offset % 60);
        const key = `${bh}:${String(bm).padStart(2, '0')}`;
        bookedMap[key] = { id: a.id, title: a.title, customer: a.customer_name, color: a.color || null };
      }
    }

    for (const b of blocks) {
      const sParts = (b.start_time || '0:00').split(':');
      const eParts = (b.end_time || `${parseInt(sParts[0]) + 1}:00`).split(':');
      const startMin = parseInt(sParts[0]) * 60 + parseInt(sParts[1]);
      const endMin = parseInt(eParts[0]) * 60 + parseInt(eParts[1]);
      for (let m = startMin; m < endMin; m += 30) {
        const h = Math.floor(m / 60);
        const min = m % 60;
        const key = `${h}:${String(min).padStart(2, '0')}`;
        blockedMap[key] = { id: b.id, label: b.label };
      }
    }

    const slots = [];
    // Always show 6 AM – 8 PM for a wider calendar view
    for (let h = 6; h < 21; h++) {
      for (const min of [0, 30]) {
        const key = `${h}:${String(min).padStart(2, '0')}`;
        if (blockedMap[key]) {
          slots.push({ time: key, available: false, blocked: true, label: blockedMap[key].label, block_id: blockedMap[key].id });
        } else if (bookedMap[key]) {
          const b = bookedMap[key];
          slots.push({ time: key, available: false, blocked: false, appointment: b.title, customer: b.customer, color: b.color, appointment_id: b.id });
        } else {
          slots.push({ time: key, available: true, blocked: false, label: null });
        }
      }
    }

    return json({ date, working_hours: `${whStart}:00-${whEnd}:00`, buffer_min: bufferMin, slots });
  } catch (e) {
    console.error('Slots error:', e);
    return apiError('Could not load slots', 500);
  }
}

async function handleBufferDeleteByTime(request, env, uid) {
  try {
    const body = await request.json();
    if (!body.date || !body.time) return apiError('Date and time required');
    await env.DB.prepare(
      "DELETE FROM blocked_time WHERE user_id = ? AND date = ? AND start_time = ? AND label = 'Buffer'"
    ).bind(uid, body.date, body.time).run();
    return json({ ok: true });
  } catch(e) { console.error('Buffer delete error:', e); return apiError('Could not delete buffer', 500); }
}

async function handleCalendarBlock(request, env, uid) {
  try {
    const body = await request.json();
    if (!body.date || !body.start_time) return apiError('Date and start_time are required');

    await env.DB.prepare(
      'INSERT INTO blocked_time VALUES(NULL, ?, ?, ?, ?, ?)'
    ).bind(uid, body.date, body.start_time, body.end_time || '', body.label || 'Blocked').run();

    return json({ ok: true });
  } catch (e) {
    console.error('Block error:', e);
    return apiError('Could not block time', 500);
  }
}

async function handleCalendarBlockDelete(request, env, blockId, uid) {
  try {
    await env.DB.prepare(
      'DELETE FROM blocked_time WHERE id = ? AND user_id = ?'
    ).bind(blockId, uid).run();
    return json({ ok: true });
  } catch (e) {
    console.error('Block delete error:', e);
    return apiError('Could not remove block', 500);
  }
}

// ═══════════════════════════════════════════════════════════════════════
// APPOINTMENT TYPES & SETTINGS
// ═══════════════════════════════════════════════════════════════════════

async function handleAppointmentTypes(request, env, uid) {
  try {
    const { results } = await env.DB.prepare(
      'SELECT * FROM appointment_types WHERE user_id = ? ORDER BY name'
    ).bind(uid).all();

    return json(results.map((r) => ({
      id: r.id, name: r.name, duration_min: r.duration_min, color: r.color,
    })));
  } catch (e) {
    console.error('Types error:', e);
    return apiError('Could not load types', 500);
  }
}

async function handleAppointmentTypeAdd(request, env, uid) {
  try {
    const body = await request.json();
    if (!body.name) return apiError('Type name is required');
    await env.DB.prepare(
      'INSERT INTO appointment_types VALUES(NULL, ?, ?, ?, ?)'
    ).bind(uid, body.name, body.duration_min || 60, body.color || '#8b5cf6').run();
    return json({ ok: true });
  } catch(e) { console.error('Type add:', e); return apiError('Could not add type', 500); }
}
async function handleAppointmentTypeUpdate(request, env, uid, typeId) {
  try {
    const body = await request.json();
    const fields = []; const values = [];
    if (body.name !== undefined) { fields.push('name = ?'); values.push(body.name); }
    if (body.duration_min !== undefined) { fields.push('duration_min = ?'); values.push(body.duration_min); }
    if (body.color !== undefined) { fields.push('color = ?'); values.push(body.color); }
    if (fields.length === 0) return apiError('No fields to update');
    values.push(typeId, uid);
    await env.DB.prepare(
      'UPDATE appointment_types SET ' + fields.join(', ') + ' WHERE id = ? AND user_id = ?'
    ).bind(...values).run();
    return json({ ok: true });
  } catch(e) { console.error('Type update:', e); return apiError('Could not update type', 500); }
}
async function handleAppointmentTypeDelete(request, env, uid, typeId) {
  try {
    await env.DB.prepare(
      'DELETE FROM appointment_types WHERE id = ? AND user_id = ?'
    ).bind(typeId, uid).run();
    return json({ ok: true });
  } catch(e) { console.error('Type delete:', e); return apiError('Could not delete type', 500); }
}

async function handleSettings(request, env, uid) {
  try {
    if (request.method === 'POST') {
      const body = await request.json();
      if (!body) return apiError('Request body is required');

      await env.DB.prepare(
        `INSERT OR REPLACE INTO settings VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).bind(
        uid,
        body.business_name || '', body.forwarding_number || '',
        body.welcome_message || '', body.working_hours || '',
        body.industry || '', body.service_area || '', body.service_description || '',
        body.notify_sms ? 1 : 0, body.notify_email ? 1 : 0, body.notify_urgent_only ? 1 : 0,
        body.google_calendar_api_key || '', body.google_calendar_id || '',
        body.buffer_min != null ? parseInt(body.buffer_min) : 30,
        body.week_start_day != null ? parseInt(body.week_start_day) : 0,
        body.default_duration_min != null ? parseInt(body.default_duration_min) : 60
      ).run();
      return json({ ok: true });
    }

    const row = await env.DB.prepare(
      'SELECT * FROM settings WHERE user_id = ?'
    ).bind(uid).first();

    if (!row) return json({});

    return json({
      business_name: row.business_name,
      forwarding_number: row.forwarding_number,
      welcome_message: row.welcome_message,
      working_hours: row.working_hours,
      industry: row.industry,
      service_area: row.service_area,
      service_description: row.service_description,
      notify_sms: !!row.notify_sms,
      notify_email: !!row.notify_email,
      notify_urgent_only: !!row.notify_urgent_only,
      google_calendar_api_key: row.google_calendar_api_key || '',
      google_calendar_id: row.google_calendar_id || '',
      buffer_min: row.buffer_min != null ? row.buffer_min : 30,
      week_start_day: row.week_start_day != null ? row.week_start_day : 0,
      default_duration_min: row.default_duration_min != null ? row.default_duration_min : 60,
    });
  } catch (e) {
    console.error('Settings error:', e);
    return apiError('Could not load settings', 500);
  }
}

// ═══════════════════════════════════════════════════════════════════════
// KNOWLEDGE BASE ENDPOINTS
// ═══════════════════════════════════════════════════════════════════════

async function handleKnowledge(request, env, uid) {
  try {
    const { results } = await env.DB.prepare(
      'SELECT * FROM knowledge WHERE user_id = ? ORDER BY category, item'
    ).bind(uid).all();

    return json(results.map((r) => ({
      id: r.id,
      category: r.category,
      item: r.item,
      price: r.price,
      notes: r.notes,
    })));
  } catch (e) {
    console.error('Knowledge error:', e);
    return apiError('Could not load knowledge base', 500);
  }
}

async function handleKnowledgeAdd(request, env, uid) {
  try {
    const body = await request.json();
    if (!body.item) return apiError('Item name is required');

    await env.DB.prepare(
      'INSERT INTO knowledge VALUES(NULL, ?, ?, ?, ?, ?)'
    ).bind(uid, body.category || '', body.item, body.price || 0, body.notes || '').run();

    return json({ ok: true });
  } catch (e) {
    console.error('Knowledge add error:', e);
    return apiError('Could not add knowledge item', 500);
  }
}

async function handleKnowledgeDelete(request, env, itemId, uid) {
  try {
    await env.DB.prepare(
      'DELETE FROM knowledge WHERE id = ? AND user_id = ?'
    ).bind(itemId, uid).run();
    return json({ ok: true });
  } catch (e) {
    console.error('Knowledge delete error:', e);
    return apiError('Could not delete knowledge item', 500);
  }
}

async function handleKnowledgeUpload(request, env, uid) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    if (!file) return apiError('No file uploaded');

    const text = await file.text();
    const lines = text.split('\n').filter(l => l.trim());
    if (lines.length < 2) return apiError('CSV must have a header row and at least one data row');

    // Parse header, strip BOM
    const header = lines[0].replace(/^\uFEFF/, '').split(',').map(h => h.trim().toLowerCase());
    const catIdx = header.indexOf('category');
    const itemIdx = header.indexOf('item');
    const priceIdx = header.indexOf('price');
    const notesIdx = header.indexOf('notes');

    if (itemIdx === -1) return apiError('CSV must have an "Item" column');

    let count = 0;
    const stmt = env.DB.prepare(
      'INSERT INTO knowledge VALUES(NULL, ?, ?, ?, ?, ?)'
    );

    const batch = [];
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(',').map(c => c.trim().replace(/^"|"$/g, ''));
      const category = catIdx >= 0 ? (cols[catIdx] || '') : '';
      const item = cols[itemIdx] || '';
      const price = priceIdx >= 0 ? parseFloat(cols[priceIdx]) || 0 : 0;
      const notes = notesIdx >= 0 ? (cols[notesIdx] || '') : '';
      if (item) {
        batch.push(stmt.bind(uid, category, item, price, notes));
        count++;
      }
    }

    if (batch.length > 0) {
      await env.DB.batch(batch);
    }

    return json({ ok: true, count });
  } catch (e) {
    console.error('Knowledge upload error:', e);
    return apiError('Could not process CSV upload', 500);
  }
}

// ═══════════════════════════════════════════════════════════════════════
// LEADS EXPORT
// ═══════════════════════════════════════════════════════════════════════

async function handleLeadsExport(request, env, uid) {
  try {
    const { results } = await env.DB.prepare(
      'SELECT * FROM leads WHERE user_id = ? ORDER BY created_at DESC'
    ).bind(uid).all();

    const header = 'Name,Phone,Email,Job Details,Urgency,Status,Created\n';
    const rows = results.map(l =>
      `"${(l.caller_name || '').replace(/"/g, '""')}","${(l.caller_phone || '').replace(/"/g, '""')}","${(l.caller_email || '').replace(/"/g, '""')}","${(l.job_details || '').replace(/"/g, '""')}","${l.urgency || ''}","${l.status || ''}","${l.created_at || ''}"`
    ).join('\n');

    return new Response(header + rows, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="leads.csv"',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (e) {
    console.error('Leads export error:', e);
    return apiError('Could not export leads', 500);
  }
}

// ═══════════════════════════════════════════════════════════════════════
// LOGOUT
// ═══════════════════════════════════════════════════════════════════════

async function handleLogout(request, env, uid) {
  try {
    const auth = request.headers.get('Authorization');
    if (auth && auth.startsWith('Bearer ')) {
      const token = auth.slice(7).trim();
      await env.DB.prepare('DELETE FROM sessions WHERE token = ?')
        .bind(token).run();
    }
    return json({ ok: true });
  } catch (e) {
    console.error('Logout error:', e);
    return apiError('Could not log out', 500);
  }
}

// ═══════════════════════════════════════════════════════════════════════
// EMAIL SEND
// ═══════════════════════════════════════════════════════════════════════

async function handleEmailSend(request, env, uid) {
  try {
    const body = await request.json();
    if (!body.to || !body.subject || !body.body) {
      return apiError('To, subject, and body are required');
    }

    const sent = await sendEmail(env, {
      to: body.to,
      subject: body.subject,
      html: emailShell(`<p style="color:#f1f5f9;font-size:15px;line-height:1.6;white-space:pre-wrap;">${escapeHtml(body.body)}</p>`)
    });

    if (sent) {
      return json({ ok: true });
    } else {
      return apiError('Email could not be sent. Please try again.', 500);
    }
  } catch (e) {
    console.error('Email send error:', e);
    return apiError('Could not send email', 500);
  }
}

// ═══════════════════════════════════════════════════════════════════════
// SMS (Twilio)
// ═══════════════════════════════════════════════════════════════════════

async function sendSms(env, { to, body }) {
  const accountSid = env.TWILIO_ACCOUNT_SID;
  const authToken = env.TWILIO_AUTH_TOKEN;
  const from = env.TWILIO_PHONE_NUMBER;
  if (!accountSid || !authToken || !from) {
    console.log('Twilio not configured — silent skip');
    return false;
  }
  try {
    const resp = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      {
        method: 'POST',
        headers: {
          'Authorization': 'Basic ' + btoa(`${accountSid}:${authToken}`),
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({ To: to, From: from, Body: body }).toString()
      }
    );
    const data = await resp.json();
    console.log('Twilio:', resp.status, data.sid || data.message);
    return resp.ok;
  } catch (e) {
    console.error('Twilio error:', e.message);
    return false;
  }
}

async function handleSendSms(request, env, uid) {
  try {
    const body = await request.json();
    if (!body.to || !body.message) {
      return apiError('"to" and "message" are required');
    }
    const sent = await sendSms(env, { to: body.to, body: body.message });
    if (sent) {
      return json({ ok: true });
    } else {
      return apiError('SMS could not be sent. Check Twilio configuration.', 500);
    }
  } catch (e) {
    console.error('SMS send error:', e);
    return apiError('Could not send SMS', 500);
  }
}

// ═══════════════════════════════════════════════════════════════════════
// CALENDAR SYNC (stub — full Google Calendar sync is a future feature)
// ═══════════════════════════════════════════════════════════════════════

async function handleCalendarSync(request, env, uid) {
  try {
    const settings = await env.DB.prepare(
      'SELECT google_calendar_api_key, google_calendar_id FROM settings WHERE user_id = ?'
    ).bind(uid).first();

    if (!settings || !settings.google_calendar_api_key) {
      return apiError('Google Calendar API key not configured. Add it in Settings.', 400);
    }

    // For now, return success — full two-way sync is a future feature
    return json({ ok: true, message: 'Calendar sync initiated. Full sync coming soon.' });
  } catch (e) {
    console.error('Calendar sync error:', e);
    return apiError('Could not sync calendar', 500);
  }
}

// ═══════════════════════════════════════════════════════════════════════
// ONBOARDING ENDPOINTS
// ═══════════════════════════════════════════════════════════════════════

async function handleOnboardingTemplate(request, env, uid) {
  const url = new URL(request.url);
  const industry = url.searchParams.get('industry') || 'other';
  const template = getTemplateForIndustry(industry);
  return json({ ok: true, template });
}

async function handleOnboardingStep(request, env, uid) {
  try {
    const body = await request.json();
    const step = body.step;
    const data = body.data || {};

    if (!step || step < 1 || step > 8) return apiError('Invalid step number');

    const stepCol = 'step' + step + '_data';
    const now = nowISO();
    const dataJson = JSON.stringify(data);

    const existing = await env.DB.prepare(
      'SELECT user_id, completed_steps FROM onboarding_data WHERE user_id = ?'
    ).bind(uid).first();

    let currentSteps = [];
    if (existing && existing.completed_steps) {
      try { currentSteps = JSON.parse(existing.completed_steps); } catch (e) {}
    }
    if (!currentSteps.includes(step)) {
      currentSteps.push(step);
      currentSteps.sort((a, b) => a - b);
    }

    if (existing) {
      await env.DB.prepare(
        `UPDATE onboarding_data SET ${stepCol} = ?, completed_steps = ?, updated_at = ? WHERE user_id = ?`
      ).bind(dataJson, JSON.stringify(currentSteps), now, uid).run();
    } else {
      await env.DB.prepare(
        `INSERT INTO onboarding_data (user_id, ${stepCol}, completed_steps, updated_at) VALUES (?, ?, ?, ?)`
      ).bind(uid, dataJson, JSON.stringify(currentSteps), now).run();
    }

    return json({ ok: true, step, completed_steps: currentSteps });
  } catch (e) {
    console.error('Onboarding step error:', e);
    return apiError('Could not save step data', 500);
  }
}

async function handleOnboardingStatus(request, env, uid) {
  try {
    const row = await env.DB.prepare(
      'SELECT * FROM onboarding_data WHERE user_id = ?'
    ).bind(uid).first();

    if (!row) {
      return json({ ok: true, data: {}, completed_steps: [], completed: false });
    }

    const merged = {};
    for (let i = 1; i <= 8; i++) {
      const col = 'step' + i + '_data';
      if (row[col]) {
        try { Object.assign(merged, JSON.parse(row[col])); } catch (e) {}
      }
    }

    let completedSteps = [];
    if (row.completed_steps) {
      try { completedSteps = JSON.parse(row.completed_steps); } catch (e) {}
    }

    return json({
      ok: true,
      data: merged,
      completed_steps: completedSteps,
      completed: !!row.completed_at,
      ai_prompt: row.ai_prompt || null,
    });
  } catch (e) {
    console.error('Onboarding status error:', e);
    return apiError('Could not load onboarding status', 500);
  }
}

async function handleOnboardingComplete(request, env, uid) {
  try {
    const body = await request.json();
    const onboardingData = body.onboarding_data || {};

    const row = await env.DB.prepare(
      'SELECT * FROM onboarding_data WHERE user_id = ?'
    ).bind(uid).first();

    const allData = {};
    if (row) {
      for (let i = 1; i <= 8; i++) {
        const col = 'step' + i + '_data';
        if (row[col]) {
          try { Object.assign(allData, JSON.parse(row[col])); } catch (e) {}
        }
      }
    }
    Object.assign(allData, onboardingData);

    const aiPrompt = generateEmmaPrompt(allData);

    // Update settings with onboarding data
    const updates = [];
    const values = [];

    if (allData.business_name) { updates.push('business_name = ?'); values.push(allData.business_name); }
    if (allData.industry) { updates.push('industry = ?'); values.push(allData.industry); }
    if (allData.phone) { updates.push('forwarding_number = ?'); values.push(allData.phone); }

    if (allData.working_hours) {
      const wh = allData.working_hours;
      const parts = [];
      const dn = { mon: 'Mon', tue: 'Tue', wed: 'Wed', thu: 'Thu', fri: 'Fri', sat: 'Sat', sun: 'Sun' };
      for (const [day, info] of Object.entries(wh)) {
        if (info && info.enabled) parts.push(`${dn[day] || day} ${info.start}–${info.end}`);
      }
      updates.push('working_hours = ?');
      values.push(parts.join(', ') || 'Mon-Fri 7am-5pm');
    }

    if (allData.business_name) {
      updates.push('welcome_message = ?');
      values.push(`Hi, thanks for calling ${allData.business_name}! How can I help you today?`);
    }

    const allServices = [...(allData.services || []), ...(allData.custom_services || [])];
    if (allServices.length > 0) {
      updates.push('service_description = ?');
      values.push(allServices.join(', '));
    }

    if (updates.length > 0) {
      values.push(uid);
      await env.DB.prepare(
        `UPDATE settings SET ${updates.join(', ')} WHERE user_id = ?`
      ).bind(...values).run();
    }

    // Mark onboarding complete
    const now = nowISO();
    const allSteps = [1, 2, 3, 4, 5, 6, 7, 8];
    await env.DB.prepare(
      `UPDATE onboarding_data SET completed_steps = ?, ai_prompt = ?, completed_at = ?, updated_at = ? WHERE user_id = ?`
    ).bind(JSON.stringify(allSteps), aiPrompt, now, now, uid).run();

    return json({ ok: true, message: 'Onboarding complete! Emma is ready.', ai_prompt: aiPrompt });
  } catch (e) {
    console.error('Onboarding complete error:', e);
    return apiError('Could not complete onboarding', 500);
  }
}

function generateEmmaPrompt(data) {
  const name = data.business_name || '[Business Name]';
  const industry = data.industry || 'other';
  const services = [...(data.services || []), ...(data.custom_services || [])];
  const apptTypes = [...(data.appointment_types || []), ...(data.custom_appt_types || [])];
  const voice = data.voice || 'female';
  const tone = data.tone || 'professional';
  const template = getTemplateForIndustry(industry);

  const industryDisplayNames = {
    landscaping: 'landscaping', masonry: 'masonry and hardscape', hvac: 'HVAC',
    plumbing: 'plumbing', electrical: 'electrical', 'general-contracting': 'general contracting',
    'retail-supply': 'retail and supply', tow_truck: 'towing and roadside assistance',
    real_estate: 'real estate', other: 'construction and trades',
  };
  const industryName = industryDisplayNames[industry] || 'construction and trades';

  const toneMap = {
    professional: 'professional, courteous, and knowledgeable',
    friendly: 'warm, friendly, and approachable',
    casual: 'relaxed, down-to-earth, and conversational',
    urgent: 'direct, efficient, and action-oriented',
  };
  const toneDesc = toneMap[tone] || toneMap.professional;

  const servicesList = services.length > 0
    ? services.map(s => `  - ${s}`).join('\n')
    : '  - (General services)';

  const apptsList = apptTypes.length > 0
    ? apptTypes.map(a => `  - ${a}`).join('\n')
    : '  - Estimate / Quote\n  - Site Visit';

  let hoursText = 'Monday through Friday, 7 AM to 5 PM';
  if (data.working_hours) {
    const wh = data.working_hours;
    const parts = [];
    const dn = { mon: 'Monday', tue: 'Tuesday', wed: 'Wednesday', thu: 'Thursday', fri: 'Friday', sat: 'Saturday', sun: 'Sunday' };
    for (const [day, info] of Object.entries(wh)) {
      if (info && info.enabled) parts.push(`${dn[day] || day} ${info.start} to ${info.end}`);
    }
    if (parts.length > 0) hoursText = parts.join('; ');
  }

  const emmaRole = template.emmaRole || `You are Emma, the AI receptionist for ${name}, a ${industryName} business.`;
  const emmaDuties = template.emmaDuties || `1. Greet callers warmly and professionally
2. Understand what services they need
3. Provide basic pricing information if available
4. Book appointments when customers want to schedule
5. Collect caller's name, phone number, email, and job details
6. Flag urgent requests for immediate follow-up
7. Let callers know someone will get back to them if you cannot answer their question`;

  let featureSections = '';
  if (template.features) {
    if (template.features.includes('emergency')) featureSections += `\nEMERGENCY TRIAGE:\nYou are trained to identify emergencies. Ask the caller directly: "Is this an emergency?" For emergencies, flag the lead as urgent and route for immediate dispatch.`;
    if (template.features.includes('inventory')) featureSections += `\nINVENTORY & PRICING:\nYou have access to the business inventory and pricing. Answer product questions from your knowledge base directly.`;
    if (template.features.includes('dispatch')) featureSections += `\nDISPATCH MODE:\nDo NOT book appointments. Collect location, vehicle details, and issue FAST. Every call is urgent.`;
    if (template.features.includes('listings')) featureSections += `\nPROPERTY LISTINGS:\nCallers may ask about properties. Reference your knowledge base. Offer to schedule showings.`;
  }

  return `${emmaRole}

ABOUT THE BUSINESS:
${name} provides:
${servicesList}

${template.skipAppointments ? '' : `APPOINTMENT TYPES:\n${apptsList}\n`}HOURS: ${hoursText}

VOICE & TONE:
${voice} voice. Tone: ${toneDesc}.${featureSections}

YOUR ROLE:
${emmaDuties}

YOU DO NOT:
- Make promises about exact pricing or availability
- Commit to specific dates/times without confirmation
- Handle complaints — take notes and escalate
- Give legal or technical advice
- Accept payments

Always be helpful, honest, and efficient. If you don't know something, say so and offer to have a team member follow up.`;
}

// ═══════════════════════════════════════════════════════════════════════
// AI CHAT SUPPORT ENDPOINT
// ═══════════════════════════════════════════════════════════════════════

async function handleChat(request, env, uid) {
  try {
    const body = await request.json();
    const userMessage = (body.message || '').trim();
    if (!userMessage) return apiError('Message is required');

    // Fetch user's business context
    const settings = await env.DB.prepare(
      'SELECT business_name, industry, working_hours, service_area, service_description FROM settings WHERE user_id = ?'
    ).bind(uid).first();

    const user = await env.DB.prepare(
      'SELECT name, company FROM users WHERE id = ?'
    ).bind(uid).first();

    const businessName = (settings && settings.business_name) || (user && user.company) || 'your business';
    const industry = (settings && settings.industry) || 'contracting';
    const workingHours = (settings && settings.working_hours) || 'Mon-Fri 7am-5pm';
    const serviceArea = (settings && settings.service_area) || '';
    const serviceDesc = (settings && settings.service_description) || '';

    const systemPrompt = `You are Emma AI, the official support assistant for Branch Live — an AI receptionist service for contractors and local service businesses ($29.95/mo with a 30-day free trial, no credit card required to start).

You are helping a Branch Live customer named ${user ? user.name : 'there'} from "${businessName}". Their industry is "${industry}", they serve "${serviceArea}", their working hours are "${workingHours}", and their services include: "${serviceDesc}".

ABOUT BRANCH LIVE:
- Branch Live provides an AI receptionist named Emma that answers phone calls 24/7 for contractors, tradespeople, and service businesses.
- Emma captures leads, books appointments, answers pricing questions from your knowledge base, and handles common caller questions.
- Plans start at $29.95/month after a 30-day free trial. No credit card required to start.
- Support email: hello@branchlive.com — Support phone: (872) 829-1192
- The dashboard is at branchlive.com/dashboard — it shows leads, call logs, calendar, knowledge base, settings, and more.

HOW TO USE BRANCH LIVE:

ONBOARDING / SETUP:
- After signing up, complete the onboarding wizard to configure Emma for your business.
- Steps include: Business info, industry selection, service area, working hours, voice settings, and file uploads.
- Different industries get tailored templates — Emma's behavior adapts (e.g., HVAC gets emergency triage, retail gets inventory focus).
- You can restart onboarding anytime from Settings if you need to change your configuration.

DASHBOARD OVERVIEW:
- The Overview tab shows calls today, leads today, appointments, and conversion rate.
- Recent leads appear below with urgency badges (urgent=red, high=amber, medium=purple, new=green).
- Tabs: Overview, Leads, Call Logs, Knowledge Base, Calendar, Settings.

LEADS:
- Emma captures leads when callers describe what they need.
- Each lead has a name, phone, email, job details, urgency, and status (new, contacted, scheduled, closed).
- Click any lead to see full details, call history, transcript, and an AI-generated email draft.
- You can mark leads as contacted or export to CSV.

CALL LOGS:
- Shows every call Emma handled: caller phone, duration, and summary.
- Desktop: table view. Mobile: card view.

KNOWLEDGE BASE:
- This is what Emma knows about your business — she references this when callers ask about pricing, services, or products.
- Add items with Category, Item, Price, and Notes.
- You can upload a CSV spreadsheet to bulk-add items.
- Emma uses this to answer questions like "How much for a paver patio?" with real pricing.

CALENDAR:
- View appointments by week (swipeable day strip) or month (grid view).
- Tap any day to see time slots from 7 AM to 5 PM.
- Green "+" in empty slots to book, or tap the floating "+" button.
- Appointment types: Estimate, Repair, Emergency (customizable in Settings).
- You can block time (lunch, meetings, personal).
- Desktop: month grid + day view side by side.
- Mobile: week strip + collapsible month + day view.

EMMA — THE AI RECEPTIONIST:
- Emma answers your business phone line 24/7 using AI voice.
- She follows a custom prompt based on your industry and onboarding answers.
- Emma can: greet callers, describe your services, provide pricing from your knowledge base, book appointments, capture lead details, and flag urgent calls.
- You can forward calls to your personal number if Emma can't handle something.
- Emma never accepts payments or gives legal/medical advice.

SETTINGS:
- Business Name, Forwarding Number, Industry, Service Area, Working Hours.
- Welcome Message — what Emma says when answering.
- Service Description — brief summary Emma uses to describe your business.
- Notification Preferences: SMS alerts, email alerts, urgent-only toggle.
- Google Calendar integration: API key + Calendar ID for two-way sync.
- Log Out button at the bottom.

BILLING:
- $19/mo Base plan (Branch Live Pro) or started at $29.95/mo.
- Add-ons: Email Autoresponder (+$20/mo), Custom Web Page (+$10/mo), Google Profile Monitor (+$15/mo).
- Payment method management, invoices.
- 30-day free trial with no credit card to start.

DESIGN / VISUAL STYLE:
- Dark theme throughout: background #06060c, panels #0e0e18, accent purple #8b5cf6, accent teal #00d4aa.
- Inter font, rounded cards with subtle borders (#1e293b).
- Mobile-first responsive design with bottom tab bar on phones, sidebar on desktop.

HOW TO RESPOND:
- Be warm, helpful, and conversational — like a support rep who genuinely wants to help.
- Give specific, actionable steps. Reference the actual UI elements (tab names, buttons, etc.).
- If you don't know something specific about their account (like their exact password or billing status), tell them where to find it in the dashboard or suggest contacting hello@branchlive.com.
- Keep answers concise but complete. Use bullet points for steps when appropriate.
- If they mention an error, bug, or technical issue, suggest they email hello@branchlive.com with details.
- Never make up features that don't exist. Stick to what's described here.`;

    const apiKey = env.OPENROUTER_API_KEY;
    if (!apiKey) {
      // Fallback response when no API key configured
      return json({
        ok: true,
        reply: `Thanks for reaching out! I'm here to help with Branch Live. Here are some things I can assist with:\n\n• Setting up your AI receptionist Emma\n• Managing leads and appointments\n• Configuring your knowledge base with pricing\n• Understanding your dashboard and features\n• General questions about Branch Live ($29.95/mo, 30-day free trial)\n\nFor immediate support, email hello@branchlive.com or call (872) 829-1192.\n\nWhat would you like help with?`
      });
    }

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://branchlive.com',
        'X-Title': 'Branch Live Support Chat'
      },
      body: JSON.stringify({
        model: 'qwen/qwen3.5-flash-02-23',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage }
        ],
        max_tokens: 800,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      console.error('OpenRouter error:', response.status, await response.text());
      return json({
        ok: true,
        reply: `Sorry, I'm having trouble connecting to my AI brain right now. Here's what I can tell you:\n\n• Branch Live is $29.95/mo with a 30-day free trial\n• Emma handles calls, captures leads, and books appointments 24/7\n• Your dashboard is at branchlive.com/dashboard\n• Support: hello@branchlive.com or (872) 829-1192\n\nPlease try again in a moment, or email us for immediate help!`
      });
    }

    const data = await response.json();
    const reply = data.choices && data.choices[0] && data.choices[0].message
      ? data.choices[0].message.content
      : "I'm sorry, I couldn't generate a response. Please try again or email hello@branchlive.com for help.";

    return json({ ok: true, reply });

  } catch (e) {
    console.error('Chat error:', e);
    return json({
      ok: true,
      reply: `Sorry, something went wrong on my end. Here's a quick summary:\n\n• Branch Live is an AI receptionist for contractors — $29.95/mo, 30-day free trial\n• Emma answers calls 24/7, captures leads, and books appointments\n• Access your dashboard at branchlive.com/dashboard\n• Support: hello@branchlive.com or (872) 829-1192\n\nWhat specific question can I help with?`
    });
  }
}

// ═══════════════════════════════════════════════════════════════════════
// MAIN ROUTER
// ═══════════════════════════════════════════════════════════════════════

export default {
  async fetch(request, env, ctx) {
    if (request.method === 'OPTIONS') {
      return corsPreflight();
    }

    await initDB(env);

    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    // ── Page redirects ──
    if (path === '/' || path === '/dashboard') {
      return Response.redirect('https://branchlive.com/dashboard' + (url.search || ''), 302);
    }
    if (path === '/signup') {
      return Response.redirect('https://branchlive.com/signup', 302);
    }
    if (path === '/reset-password') {
      return Response.redirect('https://branchlive.com/reset-password', 302);
    }

    // ── Email diagnostic ──
    if (path === '/api/email-test' && method === 'GET') {
      const testResult = await sendEmail(env, {
        to: 'demo@branchlive.com',
        subject: 'Email Test — Branch Live',
        html: emailShell('<p style="color:#f1f5f9;text-align:center;">Test email from Branch Live worker.</p>')
      });
      return json({ ok: testResult, message: testResult ? 'Email sent' : 'Email failed' });
    }

    try {
      // ── Public routes ──
      if (path === '/api/login' && method === 'POST') {
        return handleLogin(request, env);
      }
      if (path === '/api/signup' && method === 'POST') {
        return handleSignup(request, env);
      }
      if (path === '/api/reset-password' && method === 'POST') {
        const clone = request.clone();
        const body = await clone.json().catch(() => ({}));
        if (body.token) {
          return handleResetPasswordConfirm(env, body);
        }
        return handleResetPassword(request, env);
      }

      // ── Auth-required routes ──
      const uid = await getUserId(request, env);
      if (!uid) {
        return apiError('Not logged in', 401);
      }

      if (path === '/api/me' && method === 'GET') {
        return handleMe(request, env, uid);
      }

      // Leads
      if (path === '/api/leads' && method === 'GET') {
        return handleLeads(request, env, uid);
      }
      if (path === '/api/leads' && method === 'POST') {
        return handleCreateLead(request, env, uid);
      }
      const leadsMatch = path.match(/^\/api\/leads\/(\d+)$/);
      if (leadsMatch && method === 'GET') {
        return handleGetLead(request, env, uid, parseInt(leadsMatch[1]));
      }
      if (leadsMatch && method === 'DELETE') {
        return handleLeadDelete(request, env, uid, parseInt(leadsMatch[1]));
      }
      if (leadsMatch && method === 'PATCH') {
        return handleUpdateLead(request, env, parseInt(leadsMatch[1]), uid);
      }

      // Call logs
      if (path === '/api/call-logs' && method === 'GET') {
        return handleCallLogs(request, env, uid);
      }

      // Knowledge
      if (path === '/api/knowledge' && method === 'GET') {
        return handleKnowledge(request, env, uid);
      }
      if (path === '/api/knowledge/add' && method === 'POST') {
        return handleKnowledgeAdd(request, env, uid);
      }
      const kbMatch = path.match(/^\/api\/knowledge\/(\d+)$/);
      if (kbMatch && method === 'DELETE') {
        return handleKnowledgeDelete(request, env, parseInt(kbMatch[1]), uid);
      }
      if (path === '/api/knowledge/upload' && method === 'POST') {
        return handleKnowledgeUpload(request, env, uid);
      }

      // Leads export
      if (path === '/api/leads/export' && method === 'GET') {
        return handleLeadsExport(request, env, uid);
      }

      // Logout
      if (path === '/api/logout' && (method === 'GET' || method === 'POST' || method === 'DELETE')) {
        return handleLogout(request, env, uid);
      }

      // Email send
      if (path === '/api/email/send' && method === 'POST') {
        return handleEmailSend(request, env, uid);
      }

      // SMS send (via Twilio)
      if (path === '/api/send-sms' && method === 'POST') {
        return handleSendSms(request, env, uid);
      }

      // Calendar sync
      if (path === '/api/calendar/sync' && (method === 'GET' || method === 'POST')) {
        return handleCalendarSync(request, env, uid);
      }

      // Calendar
      if (path === '/api/calendar' && method === 'GET') {
        return handleCalendar(request, env, uid);
      }
      if (path === '/api/calendar/add' && method === 'POST') {
        return handleCalendarAdd(request, env, uid);
      }
      const calDelMatch = path.match(/^\/api\/calendar\/(\d+)$/);
      if (calDelMatch && method === 'GET') {
        return handleCalendarGet(request, env, uid, parseInt(calDelMatch[1]));
      }
      if (calDelMatch && method === 'PATCH') {
        return handleCalendarUpdate(request, env, uid, parseInt(calDelMatch[1]));
      }
      if (path.match(/^\/api\/calendar\/buffer-by-appt\/(\d+)$/) && method === 'DELETE') {
        const m = path.match(/^\/api\/calendar\/buffer-by-appt\/(\d+)$/);
        return handleCalendarBufferCleanup(request, env, uid, parseInt(m[1]));
      }
      if (calDelMatch && method === 'DELETE') {
        return handleCalendarDelete(request, env, parseInt(calDelMatch[1]), uid);
      }
      if (path === '/api/calendar/slots' && method === 'GET') {
        return handleCalendarSlots(request, env, uid);
      }
      if (path === '/api/calendar/block-by-buffer' && method === 'DELETE') {
        return handleBufferDeleteByTime(request, env, uid);
      }
      if (path === '/api/calendar/block' && method === 'POST') {
        return handleCalendarBlock(request, env, uid);
      }
      const blockDelMatch = path.match(/^\/api\/calendar\/block\/(\d+)$/);
      if (blockDelMatch && method === 'DELETE') {
        return handleCalendarBlockDelete(request, env, parseInt(blockDelMatch[1]), uid);
      }

      // Appointment types
      if (path === '/api/appointment-types' && method === 'GET') {
        return handleAppointmentTypes(request, env, uid);
      }
      if (path === '/api/appointment-types/add' && method === 'POST') {
        return handleAppointmentTypeAdd(request, env, uid);
      }
      const apptTypeMatch = path.match(/^\/api\/appointment-types\/(\d+)$/);
      if (apptTypeMatch && method === 'PATCH') {
        return handleAppointmentTypeUpdate(request, env, uid, parseInt(apptTypeMatch[1]));
      }
      if (apptTypeMatch && method === 'DELETE') {
        return handleAppointmentTypeDelete(request, env, uid, parseInt(apptTypeMatch[1]));
      }

      // Settings
      if (path === '/api/settings' && (method === 'GET' || method === 'POST')) {
        return handleSettings(request, env, uid);
      }

      // Onboarding
      if (path === '/api/onboarding/template' && method === 'GET') {
        return handleOnboardingTemplate(request, env, uid);
      }
      if (path === '/api/onboarding/step' && method === 'POST') {
        return handleOnboardingStep(request, env, uid);
      }
      if (path === '/api/onboarding/status' && method === 'GET') {
        return handleOnboardingStatus(request, env, uid);
      }
      if (path === '/api/onboarding/complete' && method === 'POST') {
        return handleOnboardingComplete(request, env, uid);
      }

      // AI Chat
      if (path === '/api/chat' && method === 'POST') {
        return handleChat(request, env, uid);
      }

      // Fallback
      return apiError('Not found', 404);

    } catch (e) {
      console.error('Unhandled error:', e);
      return apiError('Internal server error', 500);
    }
  },
};

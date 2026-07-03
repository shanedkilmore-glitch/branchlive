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

// Clock display honoring the account's time_format setting.
//   12h mode: 0→12 AM, 1-11→AM, 12→12 PM, 13-23→1-11 PM
//   24h mode: 00:00-23:00 as-is
// `format` is the settings.time_format value ('12h' default, else '24h').
// Accepts an "HH:MM" string (appointment/call times) or a Date for raw
// timestamps (created_at). Unknown/empty input falls back to fallback.
function formatHour(timeStr, format, fallback = 'TBD') {
  const is24 = String(format).toLowerCase() === '24h';
  // Normalize a Date or ISO/DB timestamp into [hour, minute].
  let h, m;
  if (timeStr instanceof Date) {
    if (isNaN(timeStr.getTime())) return fallback;
    h = timeStr.getHours(); m = timeStr.getMinutes();
  } else if (typeof timeStr === 'string' && timeStr.trim()) {
    const s = timeStr.trim();
    // "HH:MM" appointment time
    const hm = s.match(/^(\d{1,2}):(\d{2})/);
    if (hm) {
      h = parseInt(hm[1], 10); m = parseInt(hm[2], 10);
    } else {
      // ISO/DB timestamp like "2024-01-02 03:04:05" — parse the clock part.
      const d = new Date(s.endsWith('Z') ? s : s.replace(' ', 'T') + 'Z');
      if (isNaN(d.getTime())) return fallback;
      h = d.getUTCHours(); m = d.getUTCMinutes();
    }
  } else {
    return fallback;
  }
  if (!Number.isFinite(h) || !Number.isFinite(m)) return fallback;
  if (is24) return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return m === 0 ? `${h12} ${ampm}` : `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
}

// ═══════════════════════════════════════════════════════════════════════
// STRIPE ADD-ON BILLING
// ═══════════════════════════════════════════════════════════════════════
// Single source of truth for the five subscription add-ons. Each maps to a
// settings column (the enabled flag), a base monthly price, and — when
// configured — a Stripe Price ID. Price IDs come from env (set with
// `wrangler secret put` / vars). Everything degrades gracefully when keys
// are absent: toggles flip locally, webhooks/checkout no-op with a clear
// message, and the app keeps working.
const ADDONS = {
  website: { column: 'addon_website', label: 'Website Builder',  icon: '📱', price: 9.95, priceId: null },
  reviews: { column: 'addon_reviews', label: 'Review Monitoring', icon: '⭐', price: 9.95, priceId: null },
  social:  { column: 'addon_social',  label: 'Social Media',     icon: '📣', price: 9.95, priceId: null },
  blog:    { column: 'addon_blog',    label: 'AI Blog Posts',    icon: '✍️', price: 14.95, priceId: null },
  email:   { column: 'addon_email',   label: 'Email Autoresponder', icon: '✉️', price: 9.95, priceId: null },
};

// Resolve the addon config with env-injected Stripe Price IDs (if present).
// Returns a fresh object each call so callers can safely mutate.
function getAddons(env) {
  const out = {};
  for (const [key, def] of Object.entries(ADDONS)) {
    out[key] = { ...def, priceId: env[`STRIPE_PRICE_${key.toUpperCase()}`] || null };
  }
  return out;
}

// Build the { feature -> true/false } map for a settings row, used for
// feature gating across the app. A feature is "on" if its column is truthy.
function userHasFeature(settings, feature) {
  if (!settings) return false;
  const def = ADDONS[feature];
  if (!def) return false;
  return !!settings[def.column];
}

// Return the enabled-addon map { addonKey: boolean } for a settings row.
function addonFlagsFromSettings(settings) {
  const out = {};
  for (const [key, def] of Object.entries(ADDONS)) {
    out[key] = !!(settings && settings[def.column]);
  }
  return out;
}

// Stripe is configured only when a secret key is present. Used to decide
// whether to attempt real API calls vs. local-only behavior.
function stripeConfigured(env) {
  return !!(env.STRIPE_SECRET_KEY);
}

// Thin wrapper around the Stripe REST API. Always returns an object shaped
// { ok, data?, error?, status? } and never throws — callers branch on .ok.
// Authorization uses Stripe's "Bearer <secret_key>" scheme.
async function stripeRequest(env, path, opts = {}) {
  if (!stripeConfigured(env)) {
    return { ok: false, error: 'Stripe not configured', status: 0 };
  }
  try {
    const res = await fetch(`https://api.stripe.com${path}`, {
      method: opts.method || 'GET',
      headers: {
        'Authorization': `Bearer ${env.STRIPE_SECRET_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: opts.form || undefined,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { ok: false, error: data.error?.message || `Stripe error ${res.status}`, status: res.status, data };
    }
    return { ok: true, data, status: res.status };
  } catch (e) {
    console.error('Stripe request failed:', e);
    return { ok: false, error: String(e && e.message || e), status: 0 };
  }
}

// Encode an object as application/x-www-form-urlencoded for Stripe.
function stripeEncode(obj) {
  const parts = [];
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined || v === null) continue;
    if (Array.isArray(v)) {
      v.forEach((item) => parts.push(`${encodeURIComponent(k)}[]=${encodeURIComponent(item)}`));
    } else if (typeof v === 'object') {
      for (const [sk, sv] of Object.entries(v)) {
        parts.push(`${encodeURIComponent(k)}[${sk}]=${encodeURIComponent(sv)}`);
      }
    } else {
      parts.push(`${encodeURIComponent(k)}=${encodeURIComponent(v)}`);
    }
  }
  return parts.join('&');
}

// Verify a Stripe webhook signature using the Stripe-specified scheme:
//   HMAC-SHA256 of "<timestamp>.<rawBody>" compared to the "v1=" signature.
// Raw body is required (not JSON) — the webhook handler passes request bytes.
// Returns { ok: boolean, error?: string }.
async function verifyStripeSignature(rawBody, sigHeader, secret) {
  if (!secret) return { ok: false, error: 'Webhook secret not configured' };
  if (!sigHeader) return { ok: false, error: 'Missing Stripe-Signature header' };
  const parts = {};
  sigHeader.split(',').forEach((kv) => {
    const eq = kv.indexOf('=');
    if (eq > 0) parts[kv.slice(0, eq).trim()] = kv.slice(eq + 1).trim();
  });
  const ts = parts.t;
  const sig = parts.v1;
  if (!ts || !sig) return { ok: false, error: 'Malformed Stripe-Signature' };

  // Reject replay: signature older than 5 minutes is stale.
  const ageMs = Math.abs(Date.now() - parseInt(ts, 10) * 1000);
  if (ageMs > 5 * 60 * 1000) return { ok: false, error: 'Stale timestamp' };

  const payload = new TextEncoder().encode(`${ts}.${rawBody}`);
  const key = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  const mac = new Uint8Array(await crypto.subtle.sign('HMAC', key, payload));
  // Constant-time hex compare.
  let macHex = '';
  for (const b of mac) macHex += b.toString(16).padStart(2, '0');
  if (macHex.length !== sig.length) return { ok: false, error: 'Signature mismatch' };
  let diff = 0;
  for (let i = 0; i < macHex.length; i++) diff |= macHex.charCodeAt(i) ^ sig.charCodeAt(i);
  return diff === 0 ? { ok: true } : { ok: false, error: 'Signature mismatch' };
}

// Encode the raw body to a hex SHA-256 idempotency key. Used for webhook
// dedupe so a retried Stripe event is only applied once.
async function sha256Hex(text) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  const bytes = new Uint8Array(buf);
  let hex = '';
  for (const b of bytes) hex += b.toString(16).padStart(2, '0');
  return hex;
}

// ═══════════════════════════════════════════════════════════════════════
// EMAIL (Resend)
// ═══════════════════════════════════════════════════════════════════════

// Returns { ok: boolean, error?: string, id?: string } so callers can surface
// the real Resend API response. Stays backward-compatible: fire-and-forget
// callers that only `await` it (or check truthiness) are unaffected — a result
// object is always truthy, and callers reading `.ok` get an explicit boolean.
async function sendEmail(env, { to, subject, html, uid }) {
  // Try Gmail API first if user has connected their Gmail
  if (uid) {
    const gmailResult = await sendViaGmail(env, uid, { to, subject, html });
    if (gmailResult.ok) return gmailResult;
  }

  // Fall back to Resend
  const RESEND_KEY = env.RESEND_API_KEY;
  if (!RESEND_KEY) return { ok: false, error: 'RESEND_API_KEY not configured' };
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
    const respText = await resp.text();
    let parsed = null;
    try { parsed = JSON.parse(respText); } catch (e) {}
    console.log('Resend:', resp.status, respText);
    if (resp.ok) {
      return { ok: true, id: (parsed && parsed.id) || null };
    }
    // Surface the actual reason Resend rejected the send.
    const error = (parsed && (parsed.message || parsed.error || parsed.name))
      ? `Resend said: ${parsed.message || parsed.error || parsed.name} (HTTP ${resp.status})`
      : `Resend rejected with HTTP ${resp.status}: ${respText.slice(0, 200)}`;
    return { ok: false, error };
  } catch (e) {
    console.error('Resend error:', e.message);
    return { ok: false, error: `Network/fetch error: ${e.message}` };
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

// Onboarding welcome email (sent when a business completes Stripe checkout).
// Includes the dashboard link, Emma's phone-number setup instructions, and a
// 3-step "next steps" checklist. Rendered inside the shared emailShell().
function onboardingWelcomeEmailContent(name, dashboardUrl, siteSlug) {
  const safeName = escapeHtml(name || 'there');
  const safeUrl = escapeHtml(dashboardUrl || 'https://branchlive.com/dashboard');
  const siteLine = siteSlug
    ? `<p style="color:#475569;font-size:13px;margin:8px 0 0;">Your preview site: <span style="color:#8b5cf6;">https://branchlive.com/s/${escapeHtml(siteSlug)}</span> (live once you hit Publish)</p>`
    : '';
  return `
<h1 style="color:#f1f5f9;font-size:22px;font-weight:700;margin:0 0 12px;text-align:center;">Welcome to Branch Live, ${safeName}!</h1>
<p style="color:#94a3b8;font-size:15px;line-height:1.6;margin:0 0 24px;text-align:center;">
Your account is set up and Emma, your AI receptionist, is ready to answer calls 24/7.
</p>
<div style="text-align:center;margin:0 0 24px;">
<a href="${safeUrl}" style="display:inline-block;background-color:#8b5cf6;color:#fff;text-decoration:none;padding:14px 36px;border-radius:8px;font-weight:600;font-size:15px;">Go to your dashboard &rarr;</a>
</div>
${siteLine}
<div style="background-color:#1a1a2e;border-radius:8px;padding:20px 24px;margin-bottom:20px;">
<p style="color:#f1f5f9;font-size:14px;font-weight:600;margin:0 0 12px;">&#128222; Connect your phone number to Emma</p>
<p style="color:#94a3b8;font-size:14px;line-height:1.6;margin:0;">
Forward your business line to Emma at <span style="color:#00d4aa;font-weight:600;">(717) 432-1061</span> so she picks up every call, captures the lead, and texts you the details. Need a brand-new number instead? Reply to this email and we'll provision one for you.
</p>
</div>
<div style="background-color:#1a1a2e;border-radius:8px;padding:20px 24px;margin-bottom:20px;">
<p style="color:#f1f5f9;font-size:14px;font-weight:600;margin:0 0 12px;">&#9989; Your next steps</p>
<ol style="color:#94a3b8;font-size:14px;line-height:1.9;margin:0;padding-left:20px;">
<li><span style="color:#f1f5f9;">Add your services &amp; pricing</span> &mdash; tell Emma what you offer so she quotes the right info.</li>
<li><span style="color:#f1f5f9;">Upload photos &amp; your logo</span> &mdash; your website builder pulls these in automatically.</li>
<li><span style="color:#f1f5f9;">Publish your site</span> &mdash; one click in the dashboard and it's live.</li>
</ol>
</div>
<p style="color:#475569;font-size:13px;text-align:center;margin:16px 0 0;">
Questions? Call us anytime at <span style="color:#8b5cf6;">(717) 432-1061</span>
</p>`;
}

// Trial &rarr; active confirmation email, sent when a Stripe subscription flips
// to active (the trial has ended and they're now a paying customer). Rendered
// inside the shared emailShell().
function trialActiveEmailContent(name, dashboardUrl) {
  const safeName = escapeHtml(name || 'there');
  const safeUrl = escapeHtml(dashboardUrl || 'https://branchlive.com/dashboard');
  return `
<h1 style="color:#f1f5f9;font-size:22px;font-weight:700;margin:0 0 12px;text-align:center;">Your trial is now active, ${safeName}!</h1>
<p style="color:#94a3b8;font-size:15px;line-height:1.6;margin:0 0 20px;text-align:center;">
Emma is fully live &mdash; all your leads, settings, calendar, and photos carried over. Nothing was reset.
</p>
<div style="background-color:#1a1a2e;border-radius:8px;padding:20px;margin-bottom:20px;">
<p style="color:#00d4aa;font-size:14px;font-weight:600;margin:0 0 8px;">&#10003; All set</p>
<ul style="color:#94a3b8;font-size:14px;line-height:1.8;margin:0;padding-left:20px;">
<li>Call answering is uninterrupted</li>
<li>Your add-ons from checkout are enabled</li>
<li>Billing renews automatically each month</li>
</ul>
</div>
<div style="text-align:center;margin-bottom:8px;">
<a href="${safeUrl}" style="display:inline-block;background-color:#00d4aa;color:#06060c;text-decoration:none;padding:14px 36px;border-radius:8px;font-weight:700;font-size:15px;">Open your dashboard &rarr;</a>
</div>
<p style="color:#475569;font-size:13px;text-align:center;margin:16px 0 0;">
Questions? Call us anytime at <span style="color:#8b5cf6;">(717) 432-1061</span>
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

// ── Customer-facing autoresponder templates ──
// These are sent TO the customer (lead), not the business owner. Variables are
// resolved from the owner's settings + the lead/appointment rows.

function leadFollowupEmailContent(businessName, customerName, jobDetails, phone) {
  const name = customerName ? escapeHtml(customerName).split(' ')[0] : 'there';
  const callLine = phone
    ? `<p style="color:#94a3b8;font-size:14px;text-align:center;margin:8px 0 0;">Prefer to talk? Call us at <span style="color:#8b5cf6;">${escapeHtml(phone)}</span></p>`
    : '';
  const jobLine = jobDetails
    ? `<div style="background-color:#1a1a2e;border-radius:8px;padding:16px;margin:0 0 20px;"><p style="color:#94a3b8;font-size:13px;margin:0 0 4px;">Regarding:</p><p style="color:#f1f5f9;font-size:14px;margin:0;">${escapeHtml(jobDetails)}</p></div>`
    : '';
  return `
<h1 style="color:#f1f5f9;font-size:20px;font-weight:700;margin:0 0 8px;text-align:center;">Thanks for calling, ${name}!</h1>
<p style="color:#94a3b8;font-size:15px;line-height:1.6;margin:0 0 20px;text-align:center;">
We received your inquiry with <strong style="color:#f1f5f9;">${escapeHtml(businessName || 'us')}</strong> and wanted to follow up right away.
</p>
${jobLine}
<p style="color:#94a3b8;font-size:15px;line-height:1.6;margin:0 0 20px;text-align:center;">
We're reviewing your request and will be in touch shortly to get things scheduled.
</p>
<div style="text-align:center;margin-bottom:8px;">
<a href="https://branchlive.com/dashboard" style="display:inline-block;background-color:#8b5cf6;color:#fff;text-decoration:none;padding:12px 32px;border-radius:8px;font-weight:600;font-size:14px;">Book Your Appointment →</a>
</div>
${callLine}`;
}

function customerAppointmentConfirmContent(businessName, title, date, time, customerName) {
  const formattedDate = new Date(date + 'T' + (time || '00:00')).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const displayTime = time ? formatTime12h(time) : 'TBD';
  const greeting = customerName ? `Hi ${escapeHtml(customerName).split(' ')[0]},` : 'Hi there,';
  return `
<h1 style="color:#f1f5f9;font-size:20px;font-weight:700;margin:0 0 8px;text-align:center;">Your Appointment is Confirmed</h1>
<p style="color:#94a3b8;font-size:15px;line-height:1.6;margin:0 0 20px;text-align:center;">${greeting} we've got you on the calendar with ${escapeHtml(businessName || 'us')}.</p>
<div style="background-color:#1a1a2e;border-radius:8px;padding:20px;margin-bottom:20px;">
<table width="100%" cellpadding="0" cellspacing="0">
<tr><td style="padding:8px 0;color:#94a3b8;font-size:14px;">📋 Service</td><td style="padding:8px 0;color:#f1f5f9;font-size:14px;font-weight:500;text-align:right;">${escapeHtml(title)}</td></tr>
<tr><td style="padding:8px 0;color:#94a3b8;font-size:14px;">📅 Date</td><td style="padding:8px 0;color:#f1f5f9;font-size:14px;font-weight:500;text-align:right;">${formattedDate}</td></tr>
<tr><td style="padding:8px 0;color:#94a3b8;font-size:14px;">⏰ Time</td><td style="padding:8px 0;color:#f1f5f9;font-size:14px;font-weight:500;text-align:right;">${displayTime}</td></tr>
</table>
</div>
<p style="color:#475569;font-size:13px;text-align:center;margin:0;line-height:1.6;">Need to reschedule? Just reply to this email and we'll take care of it.</p>`;
}

function missedCallEmailContent(businessName, customerName, phone) {
  const name = customerName ? escapeHtml(customerName).split(' ')[0] : 'there';
  const callLine = phone
    ? `<a href="tel:${escapeHtml(phone.replace(/[^0-9+]/g, ''))}" style="display:inline-block;background-color:#8b5cf6;color:#fff;text-decoration:none;padding:12px 32px;border-radius:8px;font-weight:600;font-size:14px;">📞 Call Us Back: ${escapeHtml(phone)}</a>`
    : `<a href="https://branchlive.com/dashboard" style="display:inline-block;background-color:#8b5cf6;color:#fff;text-decoration:none;padding:12px 32px;border-radius:8px;font-weight:600;font-size:14px;">Get In Touch →</a>`;
  return `
<h1 style="color:#f1f5f9;font-size:20px;font-weight:700;margin:0 0 8px;text-align:center;">Sorry We Missed You!</h1>
<p style="color:#94a3b8;font-size:15px;line-height:1.6;margin:0 0 20px;text-align:center;">
Hi ${name}, we noticed we missed your call to <strong style="color:#f1f5f9;">${escapeHtml(businessName || 'us')}</strong>. We'd love to help — here's the easiest way to reach us.
</p>
<div style="text-align:center;">${callLine}</div>
<p style="color:#94a3b8;font-size:15px;line-height:1.6;margin:20px 0 0;text-align:center;">Or book a time that works for you and we'll call you back.</p>`;
}

// Send a customer-facing autoresponder email AND log it to email_log. Returns
// { ok, resendId }. ctx = { uid, leadId?, appointmentId?, template }.
// Uses the object-returning sendEmail().
async function sendAutoEmail(env, { to, subject, html, uid, leadId, appointmentId, template }) {
  const res = await sendEmail(env, { to, subject, html });
  const ok = !!(res && res.ok);
  const resendId = (res && res.id) || null;
  try {
    await env.DB.prepare(
      'INSERT INTO email_log (user_id, lead_id, appointment_id, to_email, template, status, resend_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    ).bind(uid || null, leadId || null, appointmentId || null, to, template, ok ? 'sent' : 'failed', resendId, nowISO()).run();
  } catch (e) {
    console.error('email_log insert error:', e.message);
  }
  return { ok, resendId };
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

// ── Website builder slug helpers ──
// Slugify a business name into a URL-safe base, lowercase, ascii only.
// e.g. "O'Brien & Sons Plumbing, LLC" → "obrien-sons-plumbing-llc"
function siteSlugify(name) {
  return String(name || '')
    .normalize('NFKD').replace(/[\u0300-\u036f]/g, '') // strip accents
    .toLowerCase()
    .replace(/['']/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50) || 'site';
}

// Generate a unique slug, appending -2, -3, … on collisions.
async function siteUniqueSlug(env, name) {
  const base = siteSlugify(name);
  let candidate = base;
  let n = 1;
  for (;;) {
    const row = await env.DB.prepare('SELECT slug FROM sites WHERE slug = ?').bind(candidate).first();
    if (!row) return candidate;
    n += 1;
    candidate = `${base}-${n}`;
    if (n > 999) return `${base}-${Date.now().toString(36)}`;
  }
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
        sms_consent INTEGER DEFAULT 0,
        time_format TEXT DEFAULT '12h'
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
      // Job photos — before/during/after. `data` holds a base64 data URI for now (R2 later).
      env.DB.prepare(`CREATE TABLE IF NOT EXISTS photos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        lead_id INTEGER,
        appointment_id INTEGER,
        user_id INTEGER,
        data TEXT,
        caption TEXT,
        type TEXT,
        created_at TEXT DEFAULT (datetime('now'))
      )`),
      // Public auto-generated websites — one row per business. Served at /s/{slug}.
      env.DB.prepare(`CREATE TABLE IF NOT EXISTS sites (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        slug TEXT UNIQUE,
        subdomain TEXT,
        custom_domain TEXT,
        published INTEGER DEFAULT 0,
        theme TEXT DEFAULT 'modern',
        created_at TEXT DEFAULT (datetime('now'))
      )`),
      // Outbound autoresponder log — one row per transactional email sent.
      env.DB.prepare(`CREATE TABLE IF NOT EXISTS email_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        lead_id INTEGER,
        appointment_id INTEGER,
        to_email TEXT,
        template TEXT,
        status TEXT,
        resend_id TEXT,
        created_at TEXT DEFAULT (datetime('now'))
      )`),
      // Affiliate program — reps earn a monthly commission on referrals.
      env.DB.prepare(`CREATE TABLE IF NOT EXISTS affiliate (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        code TEXT UNIQUE,
        name TEXT,
        commission_rate REAL DEFAULT 0.20,
        created_at TEXT DEFAULT (datetime('now'))
      )`),
      // Links a referred customer to the affiliate whose code they signed up with.
      env.DB.prepare(`CREATE TABLE IF NOT EXISTS referrals (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        affiliate_code TEXT,
        referred_user_id INTEGER,
        created_at TEXT DEFAULT (datetime('now'))
      )`),
      // ── Cold outreach pipeline ──
      // Prospects pulled from Apollo (Phase 1) and texted via TextMagic (Phase 2).
      // The funnel is tracked by status: new → contacted → demo → signed-up.
      // phone is normalized to E.164 and is the dedupe key (UNIQUE-ish: deduped
      // in code so re-running a search doesn't double-insert).
      env.DB.prepare(`CREATE TABLE IF NOT EXISTS outreach_prospects (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        company TEXT,
        phone TEXT,
        email TEXT,
        industry TEXT,
        location TEXT,
        status TEXT DEFAULT 'new',
        source TEXT DEFAULT 'apollo',
        contacted_at TEXT,
        demo_at TEXT,
        signedup_at TEXT,
        created_at TEXT DEFAULT (datetime('now'))
      )`),
      // Admin support tickets — submitted from /p/admin/support. Emailed to the
      // admin via Resend + auto-responder to the submitter. status drives the
      // ticket list badges.
      env.DB.prepare(`CREATE TABLE IF NOT EXISTS support_tickets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        name TEXT,
        email TEXT,
        message TEXT,
        status TEXT DEFAULT 'open',
        created_at TEXT DEFAULT (datetime('now'))
      )`),
      // Blog posts — content marketing + SEO. Rendered at /blog and /blog/:slug.
      // status: 'draft' (admin only) or 'published' (public). content is markdown
      // (converted to HTML server-side); excerpt auto-derives if blank.
      env.DB.prepare(`CREATE TABLE IF NOT EXISTS blog_posts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        slug TEXT UNIQUE NOT NULL,
        content TEXT,
        excerpt TEXT,
        status TEXT DEFAULT 'draft',
        published_at TEXT,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now'))
      )`),
      // Per-business AI blog posts — the $14.95/mo add-on. One row per post,
      // keyed by user_id so each business's blog is independent. Rendered at
      // /s/{slug}/blog. status is always 'published' for auto-generated posts.
      env.DB.prepare(`CREATE TABLE IF NOT EXISTS business_blog_posts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        title TEXT,
        slug TEXT,
        content TEXT,
        status TEXT DEFAULT 'published',
        published_at TEXT,
        created_at TEXT DEFAULT (datetime('now'))
      )`),
      // Index the per-user listing query (newest published first).
      env.DB.prepare(`CREATE INDEX IF NOT EXISTS idx_cblog_user ON business_blog_posts(user_id, published_at DESC)`),
    ]);

    // Migration: add buffer columns if missing (idempotent — safe to run on existing DBs)
    try { await env.DB.prepare('ALTER TABLE appointments ADD COLUMN buffer_enabled INTEGER DEFAULT 0').run(); } catch(e) {}
    try { await env.DB.prepare('ALTER TABLE appointments ADD COLUMN buffer_min INTEGER DEFAULT 30').run(); } catch(e) {}
    // Migration: add sms_consent column (Twilio A2P verification)
    try { await env.DB.prepare('ALTER TABLE settings ADD COLUMN sms_consent INTEGER DEFAULT 0').run(); } catch(e) {}
    // Migration: ensure subscriptions has the stripe_customer_id column (older
    // deployed tables predate it). Idempotent — safe on already-migrated DBs.
    try { await env.DB.prepare('ALTER TABLE subscriptions ADD COLUMN stripe_customer_id TEXT').run(); } catch(e) {}
    // Migration: calendar-pref columns that handleSettings already references
    // (week_start_day / default_duration_min). Adding them idempotently so the
    // 16-value positional settings INSERT also works on fresh databases.
    try { await env.DB.prepare('ALTER TABLE settings ADD COLUMN week_start_day INTEGER DEFAULT 0').run(); } catch(e) {}
    try { await env.DB.prepare('ALTER TABLE settings ADD COLUMN default_duration_min INTEGER DEFAULT 60').run(); } catch(e) {}
    // Migration: Stripe add-on billing columns on settings.
    //   stripe_*  → link this account to its Stripe Customer/Subscription
    //   addon_*   → per-feature enabled flag (1/0), one per add-on
    // Idempotent — ALTER errors are swallowed once the column exists.
    try { await env.DB.prepare("ALTER TABLE settings ADD COLUMN stripe_subscription_id TEXT").run(); } catch(e) {}
    try { await env.DB.prepare("ALTER TABLE settings ADD COLUMN stripe_customer_id TEXT").run(); } catch(e) {}
    try { await env.DB.prepare("ALTER TABLE settings ADD COLUMN stripe_plan TEXT DEFAULT 'base'").run(); } catch(e) {}
    try { await env.DB.prepare('ALTER TABLE settings ADD COLUMN addon_website INTEGER DEFAULT 0').run(); } catch(e) {}
    try { await env.DB.prepare('ALTER TABLE settings ADD COLUMN addon_reviews INTEGER DEFAULT 0').run(); } catch(e) {}
    try { await env.DB.prepare('ALTER TABLE settings ADD COLUMN addon_social INTEGER DEFAULT 0').run(); } catch(e) {}
    try { await env.DB.prepare('ALTER TABLE settings ADD COLUMN addon_blog INTEGER DEFAULT 0').run(); } catch(e) {}
    try { await env.DB.prepare('ALTER TABLE settings ADD COLUMN addon_email INTEGER DEFAULT 0').run(); } catch(e) {}
    // Migration: Vapi AI voice integration (replaces Twilio voice). One
    // assistant + one provisioned phone number per business.
    //   vapi_assistant_id     → id of the Vapi Assistant created for Emma
    //   vapi_phone_number     → E.164 number Vapi provisioned (display + outbound from)
    //   vapi_phone_number_id  → id of that Vapi phone-number resource
    try { await env.DB.prepare('ALTER TABLE settings ADD COLUMN vapi_assistant_id TEXT').run(); } catch(e) {}
    try { await env.DB.prepare('ALTER TABLE settings ADD COLUMN vapi_phone_number TEXT').run(); } catch(e) {}
    try { await env.DB.prepare('ALTER TABLE settings ADD COLUMN vapi_phone_number_id TEXT').run(); } catch(e) {}
    // Migration: per-account clock format. '12h' (default, US businesses) or
    // '24h'. Idempotent — ALTER errors are swallowed once the column exists.
    try { await env.DB.prepare("ALTER TABLE settings ADD COLUMN time_format TEXT DEFAULT '12h'").run(); } catch(e) {}
    try { await env.DB.prepare("ALTER TABLE settings ADD COLUMN gmail_email TEXT DEFAULT ''").run(); } catch(e) {}
    try { await env.DB.prepare("ALTER TABLE settings ADD COLUMN gmail_refresh_token TEXT DEFAULT ''").run(); } catch(e) {}

    // Migration: Website Builder builder config on `sites`. The original
    // `sites` table only had theme/published/custom_domain; the multi-template
    // builder adds per-site personalization columns. All optional + idempotent
    // (ALTER errors are swallowed once the column exists). Existing rows keep
    // working — null config falls back to { template: theme||'modern', default
    // accent, all sections on } in normalizeSiteConfig().
    //   config    → JSON blob: full builder snapshot (template/accent/headline/sections)
    //   headline  → optional custom hero headline override (null = auto from business_name)
    //   accent    → hex accent color (default #d4a574 amber)
    //   sections  → JSON: which page sections are enabled {hero,services,about,...}
    try { await env.DB.prepare('ALTER TABLE sites ADD COLUMN config TEXT').run(); } catch(e) {}
    try { await env.DB.prepare('ALTER TABLE sites ADD COLUMN headline TEXT').run(); } catch(e) {}
    try { await env.DB.prepare("ALTER TABLE sites ADD COLUMN accent TEXT DEFAULT '#d4a574'").run(); } catch(e) {}
    try { await env.DB.prepare('ALTER TABLE sites ADD COLUMN sections TEXT').run(); } catch(e) {}

    // Migration: social profile links on settings, surfaced on the public site's
    // social section. Optional + idempotent (ALTER errors are swallowed once the
    // column exists). Empty string = link hidden; no social section renders.
    try { await env.DB.prepare("ALTER TABLE settings ADD COLUMN instagram_url TEXT DEFAULT ''").run(); } catch(e) {}
    try { await env.DB.prepare("ALTER TABLE settings ADD COLUMN facebook_url TEXT DEFAULT ''").run(); } catch(e) {}

    // Migration: Google Place ID for the Review Monitoring add-on. Set by the
    // business in Settings; used by syncReviews() to pull Google reviews.
    // Idempotent — ALTER errors are swallowed once the column exists.
    try { await env.DB.prepare("ALTER TABLE settings ADD COLUMN google_place_id TEXT DEFAULT ''").run(); } catch(e) {}

    // Migration: Social Media add-on publishing tokens. Both optional — the
    // system stays in draft-only mode without them. Idempotent.
    try { await env.DB.prepare("ALTER TABLE settings ADD COLUMN facebook_page_token TEXT DEFAULT ''").run(); } catch(e) {}
    try { await env.DB.prepare("ALTER TABLE settings ADD COLUMN instagram_business_id TEXT DEFAULT ''").run(); } catch(e) {}

    // Migration: per-account IANA timezone (e.g. America/New_York for ET). New
    // tenants are provisioned with 'America/New_York' (ET); existing rows pick
    // up the column default. Idempotent — ALTER errors are swallowed once the
    // column exists.
    try { await env.DB.prepare("ALTER TABLE settings ADD COLUMN timezone TEXT DEFAULT 'America/New_York'").run(); } catch(e) {}

    // Migration: onboarding completion flag. 0 = wizard not finished, 1 = done.
    // Drives the first-login wizard trigger in handleOverviewHtmx: when it's
    // not 1 AND the account has no knowledge items OR no working hours, the
    // overview redirects to /p/onboarding. Idempotent.
    try { await env.DB.prepare("ALTER TABLE settings ADD COLUMN onboarding_complete INTEGER DEFAULT 0").run(); } catch(e) {}

    // Migration: social_posts queue. One row per drafted or published post,
    // keyed by user_id so each business's queue is independent. Idempotent.
    try {
      await env.DB.batch([
        env.DB.prepare(`CREATE TABLE IF NOT EXISTS social_posts (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          platform TEXT NOT NULL DEFAULT 'facebook',
          content TEXT NOT NULL,
          image_url TEXT,
          source_type TEXT,
          source_id INTEGER,
          status TEXT NOT NULL DEFAULT 'draft',
          platform_post_id TEXT,
          published_at TEXT,
          created_at TEXT DEFAULT (datetime('now'))
        )`),
        env.DB.prepare(`CREATE INDEX IF NOT EXISTS idx_sp_user ON social_posts(user_id, created_at DESC)`),
      ]);
    } catch(e) { console.error('social_posts table migration error:', e); }

    // Migration: cached Google reviews for the Review Monitoring add-on. One row
    // per review, keyed by user_id so each business's reviews are independent.
    // google_review_id is a synthetic dedupe key (author|time) — the legacy
    // Places API doesn't return a stable per-review id.
    try {
      await env.DB.batch([
        env.DB.prepare(`CREATE TABLE IF NOT EXISTS reviews (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          author_name TEXT NOT NULL,
          rating INTEGER NOT NULL DEFAULT 5,
          text TEXT NOT NULL,
          google_review_id TEXT,
          profile_photo_url TEXT,
          reviewed_at TEXT,
          created_at TEXT DEFAULT (datetime('now')),
          UNIQUE(user_id, google_review_id)
        )`),
        env.DB.prepare(`CREATE INDEX IF NOT EXISTS idx_reviews_user ON reviews(user_id, reviewed_at DESC)`),
      ]);
    } catch(e) { console.error('reviews table migration error:', e); }

    // Multi-user roles & permissions. A user can belong to one or more
    // businesses; business_id is the owning account's user_id. role is one of
    // 'admin' | 'manager' | 'employee'. team_invites tracks outstanding email
    // invitations (?invite=TOKEN links resolve against it on signup).
    try {
      await env.DB.batch([
        env.DB.prepare(`CREATE TABLE IF NOT EXISTS user_roles (
          user_id INTEGER NOT NULL,
          business_id INTEGER NOT NULL,
          role TEXT NOT NULL DEFAULT 'employee',
          invited_by INTEGER,
          created_at TEXT DEFAULT (datetime('now')),
          PRIMARY KEY (user_id, business_id)
        )`),
        env.DB.prepare(`CREATE INDEX IF NOT EXISTS idx_user_roles_bid ON user_roles(business_id)`),
        env.DB.prepare(`CREATE TABLE IF NOT EXISTS team_invites (
          token TEXT PRIMARY KEY,
          business_id INTEGER NOT NULL,
          email TEXT NOT NULL,
          role TEXT NOT NULL DEFAULT 'employee',
          invited_by INTEGER,
          created_at TEXT DEFAULT (datetime('now')),
          status TEXT DEFAULT 'pending'
        )`),
      ]);
    } catch(e) { console.error('user_roles table migration error:', e); }

    // Every account owner is an admin of their own business (idempotent
    // backfill). This guarantees legacy owners + the demo account keep full
    // access the moment the table exists — nothing is ever locked out.
    try {
      await env.DB.prepare(
        `INSERT OR IGNORE INTO user_roles (user_id, business_id, role)
         SELECT id, id, 'admin' FROM users
         WHERE id NOT IN (SELECT user_id FROM user_roles WHERE user_id = business_id)`
      ).run();
    } catch(e) { console.error('user_roles owner backfill error:', e); }

    // Seed demo data if empty
    const userCount = await env.DB.prepare(
      'SELECT COUNT(*) as cnt FROM users'
    ).first();
    if (userCount && userCount.cnt === 0) {
      await seedDemoData(env);
    }

    // Reseed demo data when seed version changes (increment to force refresh).
    // v3+ uses the richer Home & Beauty seedRiverside() dataset; below v3 the
    // original seedDemoData() runs. Each path writes seed_version on success.
    const SEED_VERSION = 4;
    try {
      await env.DB.prepare('ALTER TABLE settings ADD COLUMN seed_version INTEGER DEFAULT 1').run();
    } catch(e) {}
    const seedVer = await env.DB.prepare('SELECT seed_version FROM settings WHERE user_id = 1').first();
    if (!seedVer || seedVer.seed_version < SEED_VERSION) {
      await seedRiverside(env);
      // seed_version lives on the settings row seedRiverside just created.
      await env.DB.prepare('UPDATE settings SET seed_version = ? WHERE user_id = 1').bind(SEED_VERSION).run();
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
  const tables = ['call_logs', 'knowledge', 'subscriptions', 'appointments', 'appointment_types', 'leads', 'settings', 'sessions', 'users', 'user_roles', 'team_invites'];
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
    'INSERT INTO users (email, password_hash, name, company, phone, created_at) VALUES (?, ?, ?, ?, ?, ?)'
  ).bind('demo@branchlive.com', DEMO_PW_HASH, 'Demo User', 'Riverside Services', '(717) 555-0100', now).run();

  // Team members (uid 2-4) for multi-user testing
  const teamSalt = crypto.randomUUID();
  const teamPw = await sha256Hex('password123' + teamSalt);
  await env.DB.prepare(
    'INSERT INTO users (email, password_hash, name, company, phone, created_at) VALUES (?, ?, ?, ?, ?, ?)'
  ).bind('mike@demo.com', teamPw + ':' + teamSalt, 'Mike Torres', 'Riverside Services', '(717) 555-0201', now).run();
  await env.DB.prepare(
    'INSERT INTO users (email, password_hash, name, company, phone, created_at) VALUES (?, ?, ?, ?, ?, ?)'
  ).bind('lisa@demo.com', teamPw + ':' + teamSalt, 'Lisa Chen', 'Riverside Services', '(717) 555-0202', now).run();
  await env.DB.prepare(
    'INSERT INTO users (email, password_hash, name, company, phone, created_at) VALUES (?, ?, ?, ?, ?, ?)'
  ).bind('tom@demo.com', teamPw + ':' + teamSalt, 'Tom Vega', 'Riverside Services', '(717) 555-0203', now).run();

  // Team roles — Mike=manager, Lisa=employee, Tom=employee
  for (const [uid, role] of [[2, 'manager'], [3, 'employee'], [4, 'employee']]) {
    try {
      await env.DB.prepare('INSERT OR IGNORE INTO user_roles (user_id, business_id, role, created_at) VALUES (?, 1, ?, ?)').bind(uid, role, now).run();
    } catch (e) {}
  }

  // Demo leads — 8 realistic leads
  const leads = [
    ['John Smith', '(717) 555-1234', 'john.smith@email.com', 'Need patio pavers installed — 20x30 area, wants Unilock', 'high', 'new'],
    ['Sarah Jones', '(717) 555-5678', 'sjones@email.com', 'Retaining wall collapsing behind garage — needs immediate fix', 'urgent', 'new'],
    ['Mike Wilson', '(717) 555-9012', 'mwilson@email.com', 'Quote for driveway resealing and extension', 'medium', 'new'],
    ['Rachel Green', '(717) 555-3456', 'rgreen@email.com', 'French drain installation — basement flooding', 'urgent', 'contacted'],
    ['David Kim', '(717) 555-7890', 'dkim@email.com', 'Outdoor kitchen with built-in grill and fire pit', 'high', 'new'],
    ['Amanda Cross', '(717) 555-2345', 'across@email.com', 'Walkway replacement — flagstone to front door', 'medium', 'contacted'],
    ['James O\'Brien', '(717) 555-6789', 'jobrien@email.com', 'Pool deck pavers — 500 sq ft', 'low', 'new'],
    ['Patricia Wells', '(717) 555-0123', 'pwells@email.com', 'Brick mailbox and garden border', 'low', 'new'],
  ];
  for (const [name, phone, email, job, urgency, status] of leads) {
    await env.DB.prepare(
      'INSERT INTO leads VALUES(NULL, 1, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    ).bind(name, phone, email, job, urgency, status, '', now, now).run();
  }

  // Demo call logs
  const seededTranscript = `Emma: Hi, this is Emma from Riverside Services. Am I speaking with Alex?
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
    ['(717) 555-5678', 90, 'Discussed retaining wall emergency — wall leaning 15 degrees'],
    ['(717) 555-9012', 30, 'Provided pricing for driveway resealing — $1,200-$1,800'],
    ['(717) 555-3456', 120, 'French drain emergency — basement flooding, scheduled priority install'],
    ['(717) 555-7890', 60, 'Outdoor kitchen design consultation — liked fire pit concept'],
    ['(717) 555-2345', 25, 'Flagstone walkway quote — approved, scheduled for next week'],
    ['(717) 555-6789', 20, 'Pool deck measurement booked — travertine selected'],
    ['(717) 555-0123', 15, 'Garden border estimate — simple job, quick turnaround'],
  ];
  const callTranscripts = [seededTranscript, '', '', '', '', '', '', ''];
  for (let i = 0; i < calls.length; i++) {
    const [phone, dur, summary] = calls[i];
    await env.DB.prepare(
      'INSERT INTO call_logs VALUES(NULL, 1, NULL, ?, ?, ?, ?, ?)'
    ).bind(phone, dur, summary, callTranscripts[i], now).run();
  }

  // Demo settings
  await env.DB.prepare(
    'INSERT INTO settings (user_id, business_name, forwarding_number, welcome_message, working_hours, industry, service_area, service_description, notify_sms, notify_email, notify_urgent_only, google_calendar_api_key, google_calendar_id, buffer_min, sms_consent) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
  ).bind(1, 'Riverside Services', '(717) 555-0100', 'Hi, thanks for calling Riverside! How can we help?', 'Mon-Fri 8am-6pm', 'Home & Beauty Services', 'Lancaster, York, Harrisburg PA', 'Hair styling, manicures, real estate, home cleaning, hardscape, photography — we connect you with local professionals', 1, 1, 0, '', '', 30, 0).run();

  // Demo knowledge — diverse industries showcase
  const knowledgeItems = [
    // Salon & Beauty
    ['Services', 'Women\'s Haircut & Style', 65, 'includes wash, cut, blowout'],
    ['Services', 'Men\'s Cut', 35, 'clipper or scissor cut'],
    ['Services', 'Full Balayage', 225, 'hand-painted highlights, 2-3 hours'],
    ['Services', 'Gel Manicure', 45, 'soak-off gel, 30+ colors'],
    ['Services', 'Pedicure — Deluxe', 65, 'soak, exfoliate, massage, polish'],
    // Real Estate
    ['Services', 'Buyer Consultation', 0, 'free — assess needs, preview listings'],
    ['Services', 'Home Staging — Basic', 750, 'furniture placement + decor, up to 3 rooms'],
    ['Services', 'Listing Photography', 350, 'professional photos + drone shots'],
    ['Services', 'Open House', 150, '3-hour open house with signage'],
    // Cleaning & Home Services
    ['Services', 'Deep Clean — Full Home', 350, 'up to 2,000 sq ft, all rooms'],
    ['Services', 'Move-Out Clean', 275, 'empty home, appliances included'],
    ['Services', 'Recurring Clean — Weekly', 120, 'per visit, maintenance clean'],
    // Hardscape & Masonry (core market)
    ['Services', 'Paver Patio Install', 2500, 'starting price — up to 200 sq ft'],
    ['Services', 'Retaining Wall', 3500, 'starting price — up to 30 ft x 3 ft'],
    ['Services', 'Driveway — Pavers', 8000, 'starting price — 2-car, Cambridge'],
    // Photography
    ['Services', 'Portrait Session', 250, '1-hour, 2 outfits, 20 edited images'],
    ['Services', 'Event Photography', 500, 'per hour, 50+ edited images'],
    ['Services', 'Real Estate Photos', 200, 'interior + exterior + drone'],
    // General (applies to all)
    ['Services', 'Consultation', 0, 'free — 30 min, phone or in-person'],
    ['Services', 'Rush/Expedited Service', 50, 'add-on — moves you to front of schedule'],
  ];
  for (const [cat, item, price, notes] of knowledgeItems) {
    await env.DB.prepare('INSERT INTO knowledge (user_id, category, item, price, notes) VALUES (1, ?, ?, ?, ?)')
      .bind(cat, item, price, notes).run();
  }

  // Demo subscription
  await env.DB.prepare('INSERT INTO subscriptions (user_id, plan, status, trial_start, trial_end, created_at) VALUES (?, ?, ?, ?, ?, ?)')
    .bind(1, 'free', 'trial', now, trialEnd, now).run();

  // Demo appointments — spread across July 2026
  const appointments = [
    ['Site Visit - Patio Estimate', 'John Smith', '(717) 555-1234', '2026-07-01', '10:00', 60, 'confirmed', 'Bring Cambridge Cobble and Blu 60 samples'],
    ['Retaining Wall Consult', 'Sarah Jones', '(717) 555-5678', '2026-07-01', '14:00', 90, 'confirmed', 'Emergency — wall is leaning 15 degrees'],
    ['Pool Deck Measure', 'James O\'Brien', '(717) 555-6789', '2026-07-02', '09:00', 45, 'confirmed', 'Measure for travertine pavers'],
    ['Driveway Estimate', 'Mike Wilson', '(717) 555-9012', '2026-07-03', '11:00', 60, 'pending', 'Resealing + extension quote'],
    ['French Drain Install', 'Rachel Green', '(717) 555-3456', '2026-07-06', '08:00', 240, 'confirmed', 'Basement flooding — priority job'],
    ['Walkway Start', 'Amanda Cross', '(717) 555-2345', '2026-07-07', '07:00', 480, 'confirmed', 'Flagstone walkway — 40 linear feet'],
    ['Outdoor Kitchen Consult', 'David Kim', '(717) 555-7890', '2026-07-08', '13:00', 90, 'pending', 'Built-in grill, fire pit, seating wall'],
    ['Garden Border', 'Patricia Wells', '(717) 555-0123', '2026-07-10', '10:00', 30, 'pending', 'Brick border — 60 ft'],
  ];
  for (const [title, name, phone, date, time, dur, status, notes] of appointments) {
    await env.DB.prepare(
      'INSERT INTO appointments VALUES(NULL, 1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    ).bind(title, name, phone, date, time, dur, status, notes, '', now, null).run();
  }

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
// seedRiverside() — rich Home & Beauty demo dataset.
// Runs when seed_version < 3 (see initDB). Replaces the thinner seedDemoData
// content for demo@branchlive.com so the dashboard looks like an active
// business: ~40 leads spread over April–June, 15 appointments (past +
// upcoming this week), 25 call logs with short transcripts and lead links,
// and 12 knowledge items across hair, nails, beauty, and home cleaning.
// ═══════════════════════════════════════════════════════════════════════
async function seedRiverside(env) {
  const now = nowISO();
  const today = todayStr();
  const trialEnd = daysFromNow(30);

  // ── Idempotent cleanup of prior demo data (same scope as seedDemoData) ──
  const tables = ['call_logs', 'knowledge', 'subscriptions', 'appointments', 'appointment_types', 'leads', 'settings', 'sessions', 'users', 'user_roles', 'team_invites'];
  for (const table of tables) {
    try {
      await env.DB.prepare(`DELETE FROM ${table} WHERE user_id = 1`).run();
    } catch (e) {
      try { await env.DB.prepare(`DELETE FROM ${table} WHERE id > 0`).run(); } catch (e2) {}
    }
  }

  // ── Demo user (uid=1) ──
  // Pin id=1 explicitly: a reseed runs against a populated DB where
  // AUTOINCREMENT would otherwise hand back a higher id (e.g. 1048), leaving
  // every later user_id=1 insert orphaned from the logged-in owner. The
  // DELETE above frees ids 1-4, so re-inserting at fixed ids is safe.
  await env.DB.prepare(
    'INSERT INTO users (id, email, password_hash, name, company, phone, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).bind(1, 'demo@branchlive.com', DEMO_PW_HASH, 'Demo User', 'Riverside Services', '(717) 555-0100', now).run();

  // ── Team members (uid 2-4) for multi-user testing ──
  const teamSalt = crypto.randomUUID();
  const teamPw = await sha256Hex('password123' + teamSalt);
  const teamRows = [
    [2, 'mike@demo.com', 'Mike Torres', '(717) 555-0201'],
    [3, 'lisa@demo.com', 'Lisa Chen', '(717) 555-0202'],
    [4, 'tom@demo.com', 'Tom Vega', '(717) 555-0203'],
  ];
  for (const [tid, email, name, phone] of teamRows) {
    await env.DB.prepare(
      'INSERT INTO users (id, email, password_hash, name, company, phone, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).bind(tid, email, teamPw + ':' + teamSalt, name, 'Riverside Services', phone, now).run();
  }
  // Owner role row first (resolveContext needs user_id=1/business_id=1), then team.
  for (const [uid, role] of [[1, 'admin'], [2, 'manager'], [3, 'employee'], [4, 'employee']]) {
    try {
      await env.DB.prepare('INSERT OR IGNORE INTO user_roles (user_id, business_id, role, created_at) VALUES (?, 1, ?, ?)').bind(uid, role, now).run();
    } catch (e) {}
  }

  // ── Settings — Home & Beauty ──
  await env.DB.prepare(
    'INSERT INTO settings (user_id, business_name, forwarding_number, welcome_message, working_hours, industry, service_area, service_description, notify_sms, notify_email, notify_urgent_only, google_calendar_api_key, google_calendar_id, buffer_min, sms_consent) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
  ).bind(1, 'Riverside Services', '(717) 555-0100', 'Hi, thanks for calling Riverside Services! How can we help you today?', 'Mon-Sat 9am-7pm', 'Home & Beauty Services', 'Lancaster, York, Harrisburg PA', 'Hair styling, manicures, beauty treatments, and home cleaning — full-service salon and home care for central PA', 1, 1, 0, '', '', 30, 0).run();

  // ── Knowledge base — 12 items across hair, nails, beauty, home cleaning ──
  const knowledgeItems = [
    ['Hair', "Women's Haircut & Style", 65, 'wash, cut, blowout — 60 min'],
    ['Hair', 'Full Balayage', 225, 'hand-painted highlights, 2-3 hours'],
    ['Hair', 'Color Touch-Up', 85, 'root color, single process'],
    ['Nails', 'Gel Manicure', 45, 'soak-off gel, 30+ colors — 45 min'],
    ['Nails', 'Deluxe Pedicure', 65, 'soak, exfoliate, massage, polish'],
    ['Beauty', 'Signature Facial', 95, 'deep cleanse, extractions, mask — 60 min'],
    ['Beauty', 'Classic Lash Set', 130, 'full set, natural look — 90 min'],
    ['Beauty', 'Brow Wax & Shape', 25, 'wax + tweeze, brow mapping'],
    ['Home Cleaning', 'Deep Clean — Full Home', 350, 'up to 2,000 sq ft, all rooms'],
    ['Home Cleaning', 'Move-Out Clean', 275, 'empty home, appliances included'],
    ['Home Cleaning', 'Recurring Clean — Weekly', 120, 'per visit, maintenance clean'],
    ['Home Cleaning', 'Carpet Shampoo', 165, 'up to 3 rooms, hot-water extraction'],
  ];
  for (const [cat, item, price, notes] of knowledgeItems) {
    await env.DB.prepare('INSERT INTO knowledge (user_id, category, item, price, notes) VALUES (1, ?, ?, ?, ?)')
      .bind(cat, item, price, notes).run();
  }

  // ── Leads — ~40 across April–June 2026 ──
  // [name, phone, email, job_details, urgency, status, createdISO]
  // Status funnel: mostly new/contacted, fewer booked/closed — looks active.
  // Dates span 2026-04-01 .. 2026-06-30 at varied times.
  const leads = [
    ['Maria Gonzalez', '(215) 555-0142', 'maria.gonzalez@email.com', 'Wants balayage for a wedding in July — full head, going lighter', 'high', 'booked', '2026-04-02T14:22:00.000Z'],
    ['James Thompson', '(610) 555-0198', 'jthompson@email.com', 'Men\u2019s haircut, walk-in friendly? First-time customer', 'low', 'closed', '2026-04-03T09:10:00.000Z'],
    ['Ashanti Williams', '(267) 555-0177', 'ashanti.w@email.com', 'Gel manicure + deluxe pedicure combo for vacation next week', 'medium', 'contacted', '2026-04-05T11:45:00.000Z'],
    ['Priya Patel', '(484) 555-0123', 'priya.patel@email.com', 'Deep clean for 4-bedroom home before family visit', 'high', 'booked', '2026-04-07T15:30:00.000Z'],
    ['Robert Nguyen', '(412) 555-0166', 'rnguyen@email.com', 'Carpet shampoo — three rooms, pet stains, hasn\u2019t been done in years', 'medium', 'contacted', '2026-04-08T10:05:00.000Z'],
    ['Emily Carter', '(717) 555-0189', 'emily.carter@email.com', 'Signature facial — skin feeling dull, wants extractions', 'low', 'new', '2026-04-10T13:15:00.000Z'],
    ['DeShawn Jackson', '(732) 555-0144', 'djackson88@email.com', 'Move-out clean for apartment, needs it done by end of month', 'urgent', 'booked', '2026-04-11T16:40:00.000Z'],
    ['Mei Lin', '(570) 555-0131', 'mei.lin@email.com', 'Classic lash set — never had them, wants natural look', 'medium', 'contacted', '2026-04-12T09:55:00.000Z'],
    ['Christopher Brown', '(302) 555-0185', 'cbrown.c@email.com', 'Recurring weekly cleaning, 2-bed townhouse, ongoing', 'medium', 'booked', '2026-04-14T14:00:00.000Z'],
    ['Sofia Rossi', '(856) 555-0112', 'sofia.rossi@email.com', 'Color touch-up, roots showing, dark blonde to match', 'low', 'closed', '2026-04-15T11:20:00.000Z'],
    ['Marcus Reed', '(215) 555-0167', 'mreed.phl@email.com', 'Brow wax and shape — getting married, wants them cleaned up', 'medium', 'closed', '2026-04-17T15:50:00.000Z'],
    ['Aaliyah Foster', '(410) 555-0139', 'aaliyah.f@email.com', 'Women\u2019s haircut and style, curly hair, wants someone experienced', 'low', 'new', '2026-04-18T10:30:00.000Z'],
    ['Hiroshi Tanaka', '(717) 555-0158', 'h.tanaka@email.com', 'Deep clean — selling house, open house scheduled', 'high', 'booked', '2026-04-19T13:45:00.000Z'],
    ['Brianna Cole', '(484) 555-0124', 'brianna.cole@email.com', 'Gel manicure, spring colors, bring a friend too', 'low', 'new', '2026-04-21T09:00:00.000Z'],
    ['Eduardo Ramirez', '(610) 555-0193', 'eduardo.r@email.com', 'Carpet shampoo for office waiting room, 2 areas', 'medium', 'contacted', '2026-04-22T14:25:00.000Z'],
    ['Grace Kim', '(267) 555-0118', 'grace.kim@email.com', 'Balayage touch-up, last done 4 months ago, maintenance', 'low', 'contacted', '2026-04-23T16:10:00.000Z'],
    ['Tyrone Brooks', '(412) 555-0175', 'tbrooks.pgh@email.com', 'Move-out clean, 1-bed apartment, empty next week', 'high', 'booked', '2026-04-24T10:40:00.000Z'],
    ['Nadia Hassan', '(717) 555-0192', 'nadia.h@email.com', 'Deluxe pedicure, diabetic, needs gentle care', 'medium', 'new', '2026-04-25T15:00:00.000Z'],
    ['Vincent Russo', '(570) 555-0147', 'v.russo@email.com', 'Men\u2019s haircut plus beard trim, regular customer', 'low', 'closed', '2026-04-27T09:35:00.000Z'],
    ['Olivia Bennett', '(732) 555-0129', 'olivia.b@email.com', 'Lash set refill — had classic set, 2 weeks out', 'low', 'new', '2026-04-28T11:50:00.000Z'],
    ['Demetrius Walker', '(302) 555-0186', 'dwalker.de@email.com', 'Recurring biweekly cleaning, 3-bed house with pets', 'medium', 'contacted', '2026-04-29T14:05:00.000Z'],
    ['Lucia Ferreira', '(856) 555-0108', 'lucia.f@email.com', 'Signature facial + brow wax, prepping for photoshoot', 'medium', 'booked', '2026-05-01T10:15:00.000Z'],
    ['Adam Schmidt', '(717) 555-0164', 'adam.schmidt@email.com', 'Deep clean after kitchen renovation, dust everywhere', 'urgent', 'booked', '2026-05-02T13:30:00.000Z'],
    ['Jasmine Hughes', '(410) 555-0151', 'jasmine.h@email.com', 'Full balayage going from brown to copper, big change', 'high', 'contacted', '2026-05-04T09:20:00.000Z'],
    ['Ravi Kapoor', '(484) 555-0117', 'ravi.k@email.com', 'Carpet shampoo + move-out clean bundle, leaving lease', 'high', 'booked', '2026-05-05T15:45:00.000Z'],
    ['Chloe Anderson', '(215) 555-0133', 'chloe.a@email.com', 'Gel manicure with nail art, graduation next weekend', 'medium', 'new', '2026-05-06T11:10:00.000Z'],
    ['Malik Johnson', '(610) 555-0148', 'malik.j@email.com', 'Men\u2019s cut, skin fade, every 3 weeks regular', 'low', 'closed', '2026-05-07T09:45:00.000Z'],
    ['Ingrid Svensson', '(717) 555-0181', 'ingrid.s@email.com', 'Color touch-up plus gloss treatment, graying at roots', 'low', 'contacted', '2026-05-08T14:30:00.000Z'],
    ['Terrence Davis', '(267) 555-0159', 'terrence.d@email.com', 'Deep clean for elderly mother\u2019s home, monthly basis', 'high', 'booked', '2026-05-10T10:00:00.000Z'],
    ['Yuki Watanabe', '(570) 555-0125', 'yuki.w@email.com', 'Classic lash set, monolid eyes, wants advice on style', 'low', 'new', '2026-05-11T15:20:00.000Z'],
    ['Brittany Owens', '(412) 555-0136', 'brittany.o@email.com', 'Deluxe pedicure + gel manicure, bridal party of 4', 'urgent', 'contacted', '2026-05-13T09:15:00.000Z'],
    ['Kwame Mensah', '(732) 555-0190', 'kwame.m@email.com', 'Recurring weekly clean, just moved to area, large home', 'medium', 'new', '2026-05-14T13:55:00.000Z'],
    ['Sienna Walsh', '(302) 555-0127', 'sienna.w@email.com', 'Balayage and Women\u2019s cut together, full transformation', 'medium', 'contacted', '2026-05-16T10:25:00.000Z'],
    ['Andre Dubois', '(856) 555-0149', 'andre.d@email.com', 'Move-out clean + carpet shampoo, selling the house', 'high', 'booked', '2026-05-17T14:40:00.000Z'],
    ['Rosa Delgado', '(717) 555-0119', 'rosa.d@email.com', 'Facial for sensitive skin, rosacea, needs gentle products', 'low', 'new', '2026-05-19T11:30:00.000Z'],
    ['Nathan Brooks', '(484) 555-0152', 'nathan.b@email.com', 'Brow wax, thick brows, wants them shaped not thinned', 'low', 'new', '2026-05-20T15:10:00.000Z'],
    ['Imani Sutton', '(410) 555-0163', 'imani.s@email.com', 'Full balayage, natural hair, wants blonde highlights', 'high', 'contacted', '2026-05-22T09:40:00.000Z'],
    ['Dmitri Volkov', '(215) 555-0140', 'dmitri.v@email.com', 'Men\u2019s cut, beard sculpting, has a wedding to attend', 'low', 'new', '2026-05-23T13:05:00.000Z'],
    ['Asha Patel', '(717) 555-0155', 'asha.patel@email.com', 'Deep clean before baby arrives, nesting, due in 3 weeks', 'urgent', 'booked', '2026-05-25T10:35:00.000Z'],
    ['Marcus Holloway', '(610) 555-0191', 'm.holloway@email.com', 'Carpet shampoo for finished basement, recent water damage', 'high', 'contacted', '2026-06-02T14:15:00.000Z'],
    ['Elena Petrova', '(267) 555-0146', 'elena.p@email.com', 'Lash refill plus new brow wax, regular every 3 weeks', 'low', 'new', '2026-06-05T09:50:00.000Z'],
    ['Cameron Doyle', '(570) 555-0172', 'cameron.d@email.com', 'Color touch-up, covering gray, every 5 weeks', 'low', 'new', '2026-06-09T11:25:00.000Z'],
    ['Felicia Sutton', '(732) 555-0183', 'felicia.s@email.com', 'Gel manicure, chipped after a week, wants redo', 'low', 'new', '2026-06-12T15:40:00.000Z'],
    ['Omar Haddad', '(302) 555-0134', 'omar.h@email.com', 'Recurring clean for airbnb turnover between guests', 'medium', 'contacted', '2026-06-15T10:20:00.000Z'],
    ['Zoe Mitchell', '(856) 555-0109', 'zoe.mitchell@email.com', 'Deluxe pedicure, on her feet all day as a nurse', 'low', 'new', '2026-06-18T13:30:00.000Z'],
    ['Tobias Frank', '(484) 555-0168', 'tobias.f@email.com', 'Move-out clean, military relocation, tight deadline', 'urgent', 'new', '2026-06-22T09:05:00.000Z'],
    ['Kiara Boucher', '(717) 555-0176', 'kiara.b@email.com', 'Signature facial, acne-prone, wants a series of treatments', 'medium', 'contacted', '2026-06-25T14:50:00.000Z'],
    ['Andre Wallace', '(410) 555-0121', 'andre.w@email.com', 'Men\u2019s cut, son also needs one, two appointments', 'low', 'new', '2026-06-27T10:45:00.000Z'],
    ['Priya Sharma', '(215) 555-0157', 'priya.sharma@email.com', 'Balayage and brow wax, holiday party coming up', 'medium', 'new', '2026-06-29T11:15:00.000Z'],
  ];
  // Insert leads and remember a phone → leadId map for linking calls/appts.
  const phoneToLeadId = {};
  for (const [name, phone, email, job, urgency, status, created] of leads) {
    const res = await env.DB.prepare(
      'INSERT INTO leads (user_id, caller_name, caller_phone, caller_email, job_details, urgency, status, transcript, created_at, updated_at) VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    ).bind(name, phone, email, job, urgency, status, '', created, created).run();
    if (res.meta && res.meta.last_row_id) phoneToLeadId[phone] = res.meta.last_row_id;
  }

  // ── Appointments — past completed + upcoming this week ──
  // Upcoming dates are computed relative to deploy time so /p/overview
  // ("Upcoming appts", date >= today) and /p/calendar stay populated.
  // pastISO/backdate helpers let completed appts sit in April–June.
  function dateOffsetISO(days) {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d.toISOString().slice(0, 10);
  }
  // [title, name, phone, dateStr, time, dur, status, notes]
  const appointments = [
    // Past completed (April–June 2026)
    ['Balayage Appointment', 'Maria Gonzalez', '(215) 555-0142', '2026-04-10', '11:00', 180, 'confirmed', 'Full balayage going lighter — wedding prep'],
    ['Deep Clean', 'Priya Patel', '(484) 555-0123', '2026-04-12', '09:00', 240, 'confirmed', '4-bedroom, before family visit'],
    ['Move-Out Clean', 'DeShawn Jackson', '(732) 555-0144', '2026-04-15', '10:00', 300, 'confirmed', 'Apartment, end-of-month deadline'],
    ['Recurring Clean', 'Christopher Brown', '(302) 555-0185', '2026-04-18', '13:00', 120, 'confirmed', 'Weekly — 2-bed townhouse'],
    ['Men\u2019s Haircut', 'James Thompson', '(610) 555-0198', '2026-04-05', '14:00', 30, 'completed', 'Walk-in, first-time customer'],
    ['Color Touch-Up', 'Sofia Rossi', '(856) 555-0112', '2026-04-20', '15:00', 90, 'completed', 'Roots, dark blonde'],
    ['Deep Clean', 'Hiroshi Tanaka', '(717) 555-0158', '2026-04-26', '08:00', 360, 'confirmed', 'Pre-sale, open house coming'],
    ['Carpet Shampoo', 'Robert Nguyen', '(412) 555-0166', '2026-05-03', '10:00', 150, 'completed', 'Three rooms, pet stains'],
    ['Lash Set', 'Mei Lin', '(570) 555-0131', '2026-05-09', '12:00', 90, 'completed', 'Classic set, natural look'],
    // Upcoming this week (relative to deploy date)
    ['Gel Mani & Pedi', 'Ashanti Williams', '(267) 555-0177', dateOffsetISO(1), '11:00', 90, 'confirmed', 'Vacation combo'],
    ['Signature Facial', 'Lucia Ferreira', '(856) 555-0108', dateOffsetISO(2), '14:00', 60, 'confirmed', 'Pre-photoshoot, plus brow wax'],
    ['Deep Clean', 'Adam Schmidt', '(717) 555-0164', dateOffsetISO(3), '09:00', 360, 'confirmed', 'Post-renovation dust'],
    ['Lash Refill', 'Olivia Bennett', '(732) 555-0129', dateOffsetISO(4), '13:00', 60, 'pending', '2-week refill, classic set'],
    ['Carpet + Move-Out', 'Ravi Kapoor', '(484) 555-0117', dateOffsetISO(5), '10:00', 240, 'confirmed', 'Bundle — leaving lease'],
    ['Deep Clean', 'Asha Patel', '(717) 555-0155', dateOffsetISO(6), '09:00', 300, 'confirmed', 'Nesting — baby due in 3 weeks'],
  ];
  for (const [title, name, phone, date, time, dur, status, notes] of appointments) {
    await env.DB.prepare(
      'INSERT INTO appointments (user_id, title, customer_name, customer_phone, date, time, duration_min, status, notes, google_event_id, created_at, appointment_type_id, buffer_enabled, buffer_min) VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    ).bind(title, name, phone, date, time, dur, status, notes, '', now, null, 0, 30).run();
  }

  // ── Call logs — ~25 with short transcripts and lead links ──
  // Backdated across April–June; first two carry full transcripts (the kind
  // Emma records), the rest have short transcripts or summaries. lead_id is
  // set when the caller phone matches a seeded lead so /p/calls links them.
  const calls = [
    ['(215) 555-0142', 312, '2026-04-02T14:22:00.000Z',
      'Emma: Hi, thanks for calling Riverside Services! This is Emma — how can I help?\nCaller: Hi, I\u2019m calling about getting balayage done. I have a wedding in July.\nEmma: Congratulations! Balayage is one of our specialties. Are you looking to go lighter, or more of a subtle change?\nCaller: Definitely lighter. I\u2019m a natural dark brown.\nEmma: Perfect. A full balayage runs $225 and takes about 2-3 hours. I can book you a consultation this week — does Thursday at 11 work?\nCaller: Thursday at 11 is great.\nEmma: Wonderful, you\u2019re booked. We\u2019ll see you Thursday!',
      'Booked full balayage for wedding — Thursday 11am'],
    ['(484) 555-0123', 248, '2026-04-07T15:30:00.000Z',
      'Emma: Riverside Services, this is Emma!\nCaller: Hi, I need a deep clean for my home before family visits.\nEmma: I can help with that! How many bedrooms, and roughly how large is the home?\nCaller: Four bedrooms, about 2,200 square feet.\nEmma: Our deep clean for up to 2,000 square feet is $350. We can add a little for the extra space. Would Saturday morning work?\nCaller: Saturday is perfect.\nEmma: You\u2019re on the schedule for Saturday at 9am!',
      'Booked deep clean 4BR — Saturday 9am'],
    ['(610) 555-0198', 95, '2026-04-03T09:10:00.000Z',
      'Caller wanted a men\u2019s haircut, walk-in. Confirmed $35, told him to come by anytime. First-time customer.',
      'Men\u2019s cut inquiry — walk-in, $35'],
    ['(267) 555-0177', 142, '2026-04-05T11:45:00.000Z',
      'Gel mani + deluxe pedi combo for vacation. Quoted $110 for both, she wants to book next week.',
      'Gel mani + pedi combo quote — vacation'],
    ['(412) 555-0166', 188, '2026-04-08T10:05:00.000Z',
      'Carpet shampoo, three rooms, heavy pet stains. Quoted $165, recommended hot-water extraction. Booking pending.',
      'Carpet shampoo 3 rooms — pet stains'],
    ['(717) 555-0189', 67, '2026-04-10T13:15:00.000Z',
      'Signature facial inquiry. Described 60-min service for $95, sent her info on the products we use.',
      'Facial inquiry — info sent'],
    ['(732) 555-0144', 215, '2026-04-11T16:40:00.000Z',
      'Move-out clean, apartment, end of month deadline. Quoted $275, booked for the 15th.',
      'Booked move-out clean — apt, 15th'],
    ['(570) 555-0131', 156, '2026-04-12T09:55:00.000Z',
      'First-time lash client, wanted natural classic set. Booked consultation, $130 for full set.',
      'Lash set consult booked — $130'],
    ['(302) 555-0185', 174, '2026-04-14T14:00:00.000Z',
      'Recurring weekly clean, 2-bed townhouse. Set up $120/week, starts this Friday.',
      'Recurring weekly clean — starts Friday'],
    ['(856) 555-0112', 89, '2026-04-15T11:20:00.000Z',
      'Color touch-up, roots showing, dark blonde. Booked for $85, Saturday 3pm.',
      'Booked color touch-up — Sat 3pm'],
    ['(215) 555-0167', 103, '2026-04-17T15:50:00.000Z',
      'Brow wax and shape before wedding. $25, quick appointment, done same day.',
      'Brow wax — done same day'],
    ['(410) 555-0139', 78, '2026-04-18T10:30:00.000Z',
      'Women\u2019s haircut inquiry, curly hair. Matched her with our curl specialist, $65.',
      'Curly cut inquiry — specialist match'],
    ['(717) 555-0158', 231, '2026-04-19T13:45:00.000Z',
      'Deep clean before listing house. Quoted $350 + extras, booked for the 26th.',
      'Booked pre-sale deep clean — 26th'],
    ['(484) 555-0124', 64, '2026-04-21T09:00:00.000Z',
      'Gel manicure, spring colors, asked about bringing a friend. Booked two spots.',
      'Gel mani — booked two spots'],
    ['(610) 555-0193', 137, '2026-04-22T14:25:00.000Z',
      'Carpet shampoo for office waiting room, two areas. Commercial quote, following up.',
      'Commercial carpet quote — follow up'],
    ['(267) 555-0118', 91, '2026-04-23T16:10:00.000Z',
      'Balayage touch-up, 4 months since last. Maintenance appointment, $180.',
      'Balayage maintenance — $180'],
    ['(412) 555-0175', 198, '2026-04-24T10:40:00.000Z',
      'Move-out clean, 1-bed apartment, emptying next week. Booked $275.',
      'Booked move-out 1BR — $275'],
    ['(570) 555-0147', 52, '2026-04-27T09:35:00.000Z',
      'Regular customer, men\u2019s cut plus beard trim. $50 total, every 3 weeks.',
      'Regular — cut + beard $50'],
    ['(732) 555-0129', 84, '2026-04-28T11:50:00.000Z',
      'Lash refill, classic set, 2 weeks out. Booked refill for $65.',
      'Lash refill booked — $65'],
    ['(856) 555-0108', 167, '2026-05-01T10:15:00.000Z',
      'Facial + brow wax for photoshoot. Booked both back-to-back, $120 total.',
      'Booked facial + brow — photoshoot'],
    ['(717) 555-0164', 254, '2026-05-02T13:30:00.000Z',
      'Post-renovation deep clean, dust everywhere. Big job, quoted $450, booked Saturday.',
      'Booked post-reno deep clean — Sat'],
    ['(410) 555-0151', 112, '2026-05-04T09:20:00.000Z',
      'Full balayage brown to copper. Consultation first, then booked full service.',
      'Balayage consult — copper change'],
    ['(484) 555-0117', 203, '2026-05-05T15:45:00.000Z',
      'Carpet + move-out bundle. Combined quote $440, leaving lease end of month.',
      'Bundle booked — carpet + move-out'],
    ['(215) 555-0133', 76, '2026-05-06T11:10:00.000Z',
      'Gel mani with nail art, graduation next weekend. Booked, choosing designs in person.',
      'Gel mani + nail art — grad'],
    ['(717) 555-0155', 219, '2026-05-25T10:35:00.000Z',
      'Deep clean before baby, nesting, due in 3 weeks. Booked, allergy-safe products.',
      'Booked nesting deep clean — allergy-safe'],
  ];
  for (const [phone, dur, created, transcript, summary] of calls) {
    const leadId = phoneToLeadId[phone] || null;
    await env.DB.prepare(
      'INSERT INTO call_logs (user_id, lead_id, caller_phone, duration_sec, summary, transcript, created_at) VALUES (1, ?, ?, ?, ?, ?, ?)'
    ).bind(leadId, phone, dur, summary, transcript, created).run();
  }

  // ── Subscription ──
  await env.DB.prepare('INSERT INTO subscriptions (user_id, plan, status, trial_start, trial_end, created_at) VALUES (?, ?, ?, ?, ?, ?)')
    .bind(1, 'free', 'trial', now, trialEnd, now).run();

  // ── Appointment types ──
  const types = [
    ['Salon Service', 60, '#8b5cf6'],
    ['Cleaning', 180, '#00d4aa'],
    ['Consultation', 30, '#f59e0b'],
  ];
  for (const [name, dur, color] of types) {
    await env.DB.prepare('INSERT INTO appointment_types (user_id, name, duration_min, color) VALUES (1, ?, ?, ?)')
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

    // Create session token. Explicit columns — the sessions table may have an
    // extra expires_at column on already-deployed DBs, which would break a
    // positional VALUES(...) insert.
    const token = crypto.randomUUID();
    await env.DB.prepare(
      'INSERT INTO sessions (token, user_id, created_at) VALUES (?, ?, ?)'
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

// ═══════════════════════════════════════════════════════════════════════
// HTMX / SERVER-RENDERED LOGIN PAGE
// GET  /login-htmx         → renders a self-contained login form (simpleShell)
// POST /login-htmx         → validates credentials (same path as /api/login),
//                            creates a session, sets an HttpOnly bl_session
//                            cookie, and 302-redirects to ?next= (default
//                            /p/gallery). On failure it re-renders the form
//                            with an inline error — no client JS required.
// GET  /logout-htmx        → clears the cookie and shows a logged-out page.
// The cookie mirrors the Bearer token from /api/login (sessions table), so a
// session created here also works for the JSON API and vice-versa.
// ═══════════════════════════════════════════════════════════════════════

const SESSION_COOKIE = 'bl_session';

// Resolve a user id from the bl_session cookie (if present + valid). Used by
// HTMX pages that aren't behind the Bearer-token auth gate. Returns null when
// there's no cookie or the token has been deleted.
async function getUidFromSessionCookie(request, env) {
  const cookie = request.headers.get('Cookie') || '';
  const m = cookie.match(/(?:^|;\s*)bl_session=([^;]+)/);
  if (!m) return null;
  try {
    const row = await env.DB.prepare(
      'SELECT user_id FROM sessions WHERE token = ?'
    ).bind(m[1]).first();
    return row ? row.user_id : null;
  } catch (e) {
    console.error('Session cookie lookup error:', e);
    return null;
  }
}

// Resolve the logged-in user's clock format ('12h' or '24h'). Defaults to
// '12h' when the row is missing or the column is unset — US businesses are
// the primary audience, so 12-hour with AM/PM is the safe default.
async function getTimeFormat(env, uid) {
  try {
    const row = await env.DB.prepare(
      'SELECT time_format FROM settings WHERE user_id = ?'
    ).bind(uid).first();
    const f = row && row.time_format;
    return String(f).toLowerCase() === '24h' ? '24h' : '12h';
  } catch (e) {
    return '12h';
  }
}

function loginHtmxBody({ error, next }) {
  const nextInput = next ? `<input type="hidden" name="next" value="${String(next).replace(/"/g, '&quot;')}">` : '';
  const errBox = error
    ? `<div style="background:rgba(248,113,113,.12);border:1px solid rgba(248,113,113,.4);color:var(--danger);padding:12px 16px;border-radius:10px;margin-bottom:18px;font-size:.9em">${String(error).replace(/[<>&]/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c]))}</div>`
    : '';
  return `<div style="min-height:100vh;display:flex;align-items:center;justify-content:center;padding:40px 20px">
  <div style="width:100%;max-width:400px">
    <div style="text-align:center;margin-bottom:30px">
      <svg width="46" height="46" viewBox="0 0 40 40" fill="none" style="margin-bottom:18px" aria-hidden="true">
        <g><rect x="4" y="16" width="3" height="8" rx="1.5" fill="#d4a574"/><rect x="11" y="10" width="3" height="20" rx="1.5" fill="#d4a574" opacity=".55"/><rect x="18" y="4" width="3" height="32" rx="1.5" fill="#d4a574"/><rect x="25" y="10" width="3" height="20" rx="1.5" fill="#d4a574" opacity=".55"/><rect x="32" y="16" width="3" height="8" rx="1.5" fill="#d4a574"/></g>
      </svg>
      <span class="eyebrow" style="display:block;margin-bottom:10px">Client Portal</span>
      <h1 style="font-size:2rem;margin-bottom:8px">Welcome <em>back</em></h1>
      <p class="sub">Sign in to your dashboard</p>
    </div>
    ${errBox}
    <form method="POST" action="/login-htmx" style="display:flex;flex-direction:column;gap:14px">
      ${nextInput}
      <div>
        <label style="display:block;font-size:.78rem;font-family:var(--font-mono);letter-spacing:.04em;color:var(--text-muted);margin-bottom:7px;text-transform:uppercase">Email</label>
        <input type="email" name="email" required autofocus placeholder="you@example.com" style="width:100%;box-sizing:border-box">
      </div>
      <div>
        <label style="display:block;font-size:.78rem;font-family:var(--font-mono);letter-spacing:.04em;color:var(--text-muted);margin-bottom:7px;text-transform:uppercase">Password</label>
        <input type="password" name="password" required placeholder="••••••••" style="width:100%;box-sizing:border-box">
      </div>
      <label style="display:flex;align-items:flex-start;gap:9px;font-size:.8em;color:var(--text-muted);line-height:1.5;padding:11px 13px;background:var(--bg-elev);border:1px solid var(--border);border-radius:10px;cursor:pointer;margin-top:2px">
        <input type="checkbox" name="sms_consent" value="1" required style="width:18px;height:18px;min-width:18px;margin-top:2px;accent-color:var(--accent-amber);cursor:pointer;flex-shrink:0">
        <span>📱 I agree to receive SMS messages from Branch Live about my account, appointments, and leads. Reply STOP to unsubscribe. <a href="/terms/" style="color:var(--accent-amber);font-weight:500">Terms</a> · <a href="/privacy/" style="color:var(--accent-amber);font-weight:500">Privacy</a></span>
      </label>
      <button type="submit" class="btn-amber" style="margin-top:6px;justify-content:center;padding:13px">Sign In →</button>
    </form>
    <p style="color:var(--text-faint);font-size:.85em;text-align:center;margin-top:24px">
      Demo: <code style="color:var(--accent-amber)">demo@branchlive.com</code> / <code style="color:var(--accent-amber)">demo123</code>
    </p>
  </div>
</div>`;
}

async function handleLoginHtmx(request, env) {
  const url = new URL(request.url);
  const nextRaw = url.searchParams.get('next') || '/p/overview';
  // Guard: reject external URLs (open-redirect). Allow same-origin relative paths only.
  const next = nextRaw.startsWith('/') && !nextRaw.startsWith('//') ? nextRaw : '/p/overview';

  // GET: render the form. If already logged in, skip straight to next.
  if (request.method === 'GET') {
    const uid = await getUidFromSessionCookie(request, env);
    if (uid) {
      return new Response(null, { status: 302, headers: { Location: next } });
    }
    return new Response(simpleShell('Sign In', loginHtmxBody({ error: null, next })), {
      headers: { 'Content-Type': 'text/html' },
    });
  }

  // POST: parse form-encoded body, validate, create session, set cookie.
  let email = '', password = '', postedNext = next, smsConsent = false;
  try {
    const form = await request.formData();
    email = (form.get('email') || '').trim().toLowerCase();
    password = form.get('password') || '';
    smsConsent = String(form.get('sms_consent') || '') === '1';
    const n = form.get('next');
    if (typeof n === 'string' && n.startsWith('/') && !n.startsWith('//')) postedNext = n;
  } catch (e) {
    return new Response(simpleShell('Sign In', loginHtmxBody({ error: 'Invalid form submission.', next })), {
      headers: { 'Content-Type': 'text/html' }, status: 400,
    });
  }

  if (!email || !password) {
    return new Response(simpleShell('Sign In', loginHtmxBody({ error: 'Email and password are required.', next })), {
      headers: { 'Content-Type': 'text/html' },
    });
  }

  // SMS consent gate (Twilio A2P 10DLC compliance — must be explicit).
  if (!smsConsent) {
    return new Response(simpleShell('Sign In', loginHtmxBody({ error: 'Please agree to receive SMS messages to continue.', next })), {
      headers: { 'Content-Type': 'text/html' },
    });
  }

  try {
    const row = await env.DB.prepare('SELECT * FROM users WHERE email = ?').bind(email).first();
    const valid = row && await checkPassword(password, row.password_hash);
    if (!row || !valid) {
      return new Response(simpleShell('Sign In', loginHtmxBody({ error: 'Invalid email or password.', next })), {
        headers: { 'Content-Type': 'text/html' }, status: 401,
      });
    }
    // Same session model as /api/login — this token works for the JSON API too.
    const token = crypto.randomUUID();
    await env.DB.prepare(
      'INSERT INTO sessions (token, user_id, created_at) VALUES (?, ?, ?)'
    ).bind(token, row.id, nowISO()).run();

    // Set the cookie and redirect. Secure when served over HTTPS.
    const isHttps = url.protocol === 'https:';
    const cookie = `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax${isHttps ? '; Secure' : ''}; Max-Age=2592000`;
    return new Response(null, {
      status: 302,
      headers: {
        Location: postedNext,
        'Set-Cookie': cookie,
      },
    });
  } catch (e) {
    console.error('HTMX login error:', e);
    return new Response(simpleShell('Sign In', loginHtmxBody({ error: 'Sign-in failed. Please try again.', next })), {
      headers: { 'Content-Type': 'text/html' }, status: 500,
    });
  }
}

// GET /logout-htmx — clear the session cookie and show a logged-out page.
async function handleLogoutHtmx(request, env) {
  const cookie = `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
  const body = `<div style="min-height:100vh;display:flex;align-items:center;justify-content:center;padding:40px 20px">
  <div style="text-align:center;max-width:380px">
    <div style="font-size:3rem;margin-bottom:16px">👋</div>
    <span class="eyebrow" style="display:block;margin-bottom:10px">Signed out</span>
    <h1 style="font-size:2rem;margin-bottom:10px">See you <em>soon</em></h1>
    <p class="sub" style="margin:0 0 26px">You have been logged out.</p>
    <a class="btn btn-amber" href="/login-htmx">Sign in again</a>
  </div>
</div>`;
  return new Response(simpleShell('Signed Out', body), {
    headers: { 'Content-Type': 'text/html', 'Set-Cookie': cookie },
  });
}

// ═══════════════════════════════════════════════════════════════════════
// HTMX SETTINGS PAGE
// GET  /settings-htmx  → resolves the user via the bl_session cookie (NOT a
//                        hardcoded uid), redirects to /login-htmx if absent,
//                        and renders THAT user's settings. So logging in as a
//                        real user shows their data, not the demo's.
// POST /settings-htmx  → updates the safe form fields only (same explicit-column
//                        UPSERT as /api/settings, so billing/addon/sms_consent
//                        columns are preserved). Re-renders the page.
// ═══════════════════════════════════════════════════════════════════════

// Shared left sidebar nav for HTMX dashboard pages. `active` marks the
// current page so it gets the warm-amber pill + active-rail indicator.
// Each handler wraps its body: <div class="app">{sidebarNav}<div class="content">…</div></div>.
// Nav items keyed by their `key`. Each {href,label,icon}; icons inherit color
// (currentColor) so they recolor with .nav-link state. Looked up by NAV_GROUPS.
const NAV_ITEMS = {
  overview: { key:'overview', href: '/p/overview',    label: 'Overview',  icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/></svg>' },
  leads:    { key:'leads',    href: '/p/leads',       label: 'Leads',     icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>' },
  calls:    { key:'calls',    href: '/p/calls',       label: 'Calls',     icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/></svg>' },
  calendar: { key:'calendar', href: '/p/calendar',    label: 'Calendar',  icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>' },
  knowledge:{ key:'knowledge',href: '/p/knowledge',   label: 'Knowledge', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>' },
  gallery:  { key:'gallery',  href: '/p/gallery',     label: 'Gallery',   icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>' },
  analytics:{ key:'analytics',href: '/p/analytics',   label: 'Analytics', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="4" y1="20" x2="4" y2="12"/><line x1="10" y1="20" x2="10" y2="4"/><line x1="16" y1="20" x2="16" y2="14"/><line x1="22" y1="20" x2="22" y2="8"/></svg>' },
  website:  { key:'website',  href: '/p/website',     label: 'Website',    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>' },
  blog:     { key:'blog',     href: '/p/blog',        label: 'Blog',      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="13" y2="17"/></svg>' },
  social:   { key:'social',   href: '/p/social',      label: 'Social',    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 11l18-8-8 18-2-7-8-3z"/></svg>' },
  billing:  { key:'billing',  href: '/p/billing',     label: 'Billing',   icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>' },
  team:     { key:'team',     href: '/p/team',        label: 'Team',       icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>' },
  settings: { key:'settings', href: '/settings-htmx', label: 'Settings',  icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>' },
};

// Sidebar section groups, in display order. Each group's keys index NAV_ITEMS.
// The role filter (minRoleFor, applied in sidebarNav) drops items a user can't
// access, and any group left empty is omitted entirely.
const NAV_GROUPS = [
  { name: 'Main',     keys: ['overview','calendar','knowledge','gallery'] },
  { name: 'Business', keys: ['leads','calls','analytics'] },
  { name: 'Growth',   keys: ['website','blog','social'] },
  { name: 'Account',  keys: ['billing','team','settings'] },
];

// Urgency badge — used across Leads list + detail. Monotone amber palette:
// the dot + label are constant; the tonal background conveys severity
// (urgent=brightest amber, low=dimmest). Falls back gracefully for unknowns.
function urgencyBadge(u) {
  const v = String(u || '').toLowerCase();
  const map = {
    urgent: { cls: 'urg-urgent', label: 'Urgent' },
    high:   { cls: 'urg-high',   label: 'High' },
    medium: { cls: 'urg-med',    label: 'Medium' },
    low:    { cls: 'urg-low',    label: 'Low' },
  };
  const m = map[v] || { cls: 'urg-low', label: v || '—' };
  return `<span class="urg-badge ${m.cls}"><span class="urg-dot">●</span> ${m.label}</span>`;
}

// Status pill — new / contacted / scheduled / booked / closed.
function statusPill(s) {
  const v = String(s || 'new').toLowerCase();
  const map = {
    new:       'pill-new',
    contacted: 'pill-contacted',
    scheduled: 'pill-scheduled',
    booked:    'pill-booked',
    closed:    'pill-closed',
  };
  return `<span class="status-pill ${map[v] || 'pill-new'}">${htmxEsc(v)}</span>`;
}

function brandMark() {
  return `<a class="brand" href="/p/overview" aria-label="Branch Live home">
    <svg width="34" viewBox="0 0 40 40" fill="none" aria-hidden="true">
      <g class="wm"><rect x="4" y="16" width="3" height="8" rx="1.5" fill="#d4a574"/><rect x="11" y="10" width="3" height="20" rx="1.5" fill="#d4a574" opacity=".55"/><rect x="18" y="4" width="3" height="32" rx="1.5" fill="#d4a574"/><rect x="25" y="10" width="3" height="20" rx="1.5" fill="#d4a574" opacity=".55"/><rect x="32" y="16" width="3" height="8" rx="1.5" fill="#d4a574"/></g>
    </svg>
    <span><span class="nm">branch</span><span class="lv"> live</span></span>
  </a>`;
}

// Fixed left sidebar nav. Named sidebarNav() for backward-compat with the
// page handlers that already call it — they interpolate the returned string,
// so the signature (active, isAdmin, ctx) is unchanged. Layout: brand +
// collapse toggle at top · optional business switcher · 4 grouped link
// sections · sign-out pinned to the bottom. ctx (optional, {role, businesses})
// filters links by role: employees don't see Settings/Billing/Team; managers
// don't see Settings/Billing. When ctx is absent (admin console, settings
// page) every nav item is shown, preserving prior behavior.
function sidebarNav(active, isAdmin, ctx) {
  const role = (ctx && ctx.role) || 'admin';
  const minRoleFor = {
    settings: 'admin', billing: 'admin', team: 'manager',
    leads: 'manager', calls: 'manager', website: 'manager',
    analytics: 'manager', outreach: 'manager', blog: 'manager', social: 'manager',
  };
  // Render a single nav link, applying the role gate + active state.
  const linkHtml = key => {
    const it = NAV_ITEMS[key];
    if (!it) return '';
    const min = minRoleFor[key];
    if (min && !roleMeets(role, min)) return '';
    const cls = key === active ? 'nav-link active' : 'nav-link';
    return `<a class="${cls}" href="${it.href}" title="${htmxEsc(it.label)}">${it.icon}<span class="nav-label">${it.label}</span></a>`;
  };
  // Build each group; drop a group entirely if all its links are filtered out.
  const groupsHtml = NAV_GROUPS.map(g => {
    const links = g.keys.map(linkHtml).join('');
    if (!links) return '';
    return `<div class="nav-group"><h4 class="nav-group-h">${g.name}</h4>${links}</div>`;
  }).join('');
  // Business switcher — only when the user belongs to more than one business.
  // ctx.businesses is an array of { business_id, role, business_name }.
  const businesses = (ctx && Array.isArray(ctx.businesses)) ? ctx.businesses : [];
  const switcher = businesses.length > 1
    ? `<div class="sidebar-switcher">${businessSwitcherMarkup(ctx.bid, businesses)}</div>`
    : '';
  return `<aside class="sidebar" id="bl-sidebar">
  <div class="sidebar-head">
    ${brandMark()}
    <button class="sidebar-toggle" id="bl-sidebar-toggle" aria-label="Collapse sidebar"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg></button>
  </div>
  ${switcher}
  <nav class="sidebar-nav">${groupsHtml}</nav>
  <div class="sidebar-foot">
    <a class="nav-link" href="/logout-htmx"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg><span class="nav-label">Sign out</span></a>
  </div>
</aside>
<button class="sidebar-mobile-toggle" id="bl-sidebar-mobile" aria-label="Open menu"><span></span><span></span><span></span></button>
<div class="sidebar-backdrop" id="bl-sidebar-backdrop"></div>
<script>
// Sidebar behavior: collapse-to-icons (desktop, persisted) + slide-out drawer
// (mobile). No fade/scroll logic — the old topnav-overflow code is gone.
(function(){
  var sb=document.getElementById('bl-sidebar');if(!sb)return;
  var desktopToggle=document.getElementById('bl-sidebar-toggle');
  var mobileBtn=document.getElementById('bl-sidebar-mobile');
  var backdrop=document.getElementById('bl-sidebar-backdrop');
  var MQ=window.matchMedia('(max-width:920px)');
  // Restore persisted collapse state on desktop only.
  function isMobile(){return MQ.matches;}
  try{if(!isMobile()&&localStorage.getItem('bl-sidebar-collapsed')==='1')sb.classList.add('collapsed');}catch(e){}
  function syncMargin(){document.body.classList.toggle('sb-collapsed',sb.classList.contains('collapsed')&&!isMobile());}
  syncMargin();
  // Desktop: toggle icon-only collapse + persist.
  if(desktopToggle)desktopToggle.addEventListener('click',function(){
    if(isMobile())return;
    sb.classList.toggle('collapsed');
    try{localStorage.setItem('bl-sidebar-collapsed',sb.classList.contains('collapsed')?'1':'0');}catch(e){}
    syncMargin();
  });
  // Mobile: open/close the slide-out drawer.
  function openDrawer(){sb.classList.add('open');document.body.classList.add('sb-drawer-open');if(backdrop)backdrop.classList.add('show');}
  function closeDrawer(){sb.classList.remove('open');document.body.classList.remove('sb-drawer-open');if(backdrop)backdrop.classList.remove('show');}
  if(mobileBtn)mobileBtn.addEventListener('click',function(){if(!isMobile())return;sb.classList.contains('open')?closeDrawer():openDrawer();});
  if(backdrop)backdrop.addEventListener('click',closeDrawer);
  document.addEventListener('keydown',function(e){if(e.key==='Escape'&&sb.classList.contains('open'))closeDrawer();});
  // A nav tap in the drawer navigates (full page load) so it closes itself;
  // also react to viewport changes resetting mobile state.
  MQ.addEventListener&&MQ.addEventListener('change',function(){if(!isMobile()){closeDrawer();}syncMargin();});
  window.addEventListener('resize',syncMargin);
})();
</script>`;
}

// Multi-account switcher dropdown. activeBid is the current business; picking
// another POSTs to /api/team/switch which sets bl_business_id and reloads.
function businessSwitcherMarkup(activeBid, businesses) {
  const current = businesses.find(b => String(b.business_id) === String(activeBid)) || businesses[0];
  const curName = htmxEsc(current && current.business_name || 'Business');
  const opts = businesses.map(b => {
    const isCur = String(b.business_id) === String(current.business_id);
    return `<button type="button" class="sw-item${isCur ? ' active' : ''}" onclick="switchBusiness(${parseInt(b.business_id,10)})">${isCur ? '<span class=\"sw-dot\">●</span>' : '<span class=\"sw-arrow\">→</span>'}<span>${htmxEsc(b.business_name || ('Account ' + b.business_id))}</span>${b.role ? '<span class=\"sw-role\">' + htmxEsc(b.role) + '</span>' : ''}</button>`;
  }).join('');
  return `<div class="biz-switcher">
    <button type="button" class="sw-trigger" onclick="event.stopPropagation();document.getElementById('sw-menu').classList.toggle('open')">
      <span class="sw-ico">🏢</span><span class="sw-cur">${curName}</span><span class="sw-caret">▾</span>
    </button>
    <div class="sw-menu" id="sw-menu">${opts}</div>
  </div>`;
}

// ═══════════════════════════════════════════════════════════════════════
// ADMIN DASHBOARD (/p/admin/*) — helpers + layout
// Visible only to user ID 1. Same amber-monotone shell as the rest of the
// HTMX dashboard, plus a dedicated sub-nav (Overview | Accounts | Outreach |
// Support | Analytics). Revenue is derived locally from the known price
// points (base $29.95 + $9.95/add-on) — no live Stripe calls per page load.
// ═══════════════════════════════════════════════════════════════════════

// Base monthly plan price. Mirrors AFFILIATE_PLAN_PRICE / the billing page.
const ADMIN_BASE_PRICE = 29.95;
const ADMIN_ADDON_PRICE = 9.95;

// Admin sub-nav. Rendered under the topbar on every /p/admin page.
function adminNav(active) {
  const items = [
    { key: 'overview',  href: '/p/admin',             label: 'Overview' },
    { key: 'accounts',  href: '/p/admin/accounts',    label: 'Accounts' },
    { key: 'outreach',  href: '/p/admin/outreach',    label: 'Outreach' },
    { key: 'support',   href: '/p/admin/support',     label: 'Support' },
    { key: 'analytics', href: '/p/admin/analytics',   label: 'Analytics' },
    { key: 'blog',      href: '/p/admin/blog',        label: 'Blog' },
    { key: 'cblogs',    href: '/p/admin/cblogs',      label: 'Business Blogs' },
    { key: 'sites',     href: '/p/admin/sites',       label: 'Sites' },
  ];
  const links = items.map(it =>
    `<a class="${it.key === active ? 'active' : ''}" href="${it.href}">${it.label}</a>`
  ).join('');
  return `<nav class="admin-subnav">${links}</nav>`;
}

// Wrap an admin page body in the full shell: topbar (admin-highlighted) +
// admin sub-nav + content. Mirrors how the other HTMX handlers compose
// sidebarNav + content inside simpleShell.
function adminShell(active, title, body) {
  const html = `<div class="app">${sidebarNav('admin', true)}${adminNav(active)}<div class="content">${body}</div></div>`;
  return simpleShell(title, html);
}

// Admin gate. Returns a 403 Response when the caller isn't user ID 1, else
// null. Every admin handler starts with: const denied = requireAdmin(uid);
function requireAdmin(uid) {
  if (uid === 1) return null;
  return new Response(
    simpleShell('Access denied', '<div class="app"><div class="content"><span class="eyebrow">Restricted</span><h1>Access denied</h1><p class="sub">This area is limited to administrators.</p><p style="margin-top:24px"><a class="btn btn-ghost btn-sm" href="/p/overview">← Back to dashboard</a></p></div></div>'),
    { status: 403, headers: { 'Content-Type': 'text/html' } }
  );
}

// ═══════════════════════════════════════════════════════════════════════
// MULTI-USER ROLES & PERMISSIONS
// Distinct from requireAdmin() above (platform admin = uid === 1 /p/admin/*).
// These govern per-business role access for the /p/* dashboard family.
// business_id always equals the owning account's user_id.
// ═══════════════════════════════════════════════════════════════════════

const ROLE_LEVEL = { admin: 3, manager: 2, employee: 1 };
const VALID_ROLES = ['admin', 'manager', 'employee'];

// Minimum role required to view each /p/* page. Routes not listed are open.
const ROUTE_MIN_ROLE = {
  '/p/settings':  'admin',
  '/p/billing':   'admin',
  '/p/leads':     'manager',
  '/p/calls':     'manager',
  '/p/website':   'manager',
  '/p/analytics': 'manager',
  '/p/outreach':  'manager',
  '/p/blog':      'manager',
  '/p/social':    'manager',
  '/p/team':      'manager',
  '/p/calendar':  'employee',
  '/p/knowledge': 'employee',
  '/p/gallery':   'employee',
  '/p/overview':  'employee',
};

// Pages where the 'employee' role is view-only (banner + locked inputs).
const VIEW_ONLY_FOR_EMPLOYEE = new Set([
  '/p/calendar', '/p/knowledge', '/p/gallery',
]);

// True when the user's role meets or exceeds the minimum.
function roleMeets(userRole, minRole) {
  return (ROLE_LEVEL[userRole] || 0) >= (ROLE_LEVEL[minRole] || 0);
}

// Resolve the effective business + role for a logged-in uid. Honors the
// bl_business_id switcher cookie when the user belongs to that business;
// otherwise falls back to their own business. A user with no user_roles row
// at all (legacy, pre-migration) is treated as an admin of their own business
// so existing single-user accounts are unaffected.
async function resolveContext(request, env, uid) {
  const cookie = request.headers.get('Cookie') || '';
  const m = cookie.match(/(?:^|;\s*)bl_business_id=(\d+)/);
  let activeBid = m ? parseInt(m[1], 10) : uid;
  let roleRow = await env.DB.prepare(
    'SELECT role FROM user_roles WHERE user_id = ? AND business_id = ?'
  ).bind(uid, activeBid).first();
  // Not a member of the switched business (or no switch) → own business.
  if (!roleRow) {
    activeBid = uid;
    roleRow = await env.DB.prepare(
      'SELECT role FROM user_roles WHERE user_id = ? AND business_id = ?'
    ).bind(uid, uid).first();
  }
  const role = (roleRow && roleRow.role) || 'admin';
  return { uid, bid: activeBid, role };
}

// Fetch all businesses a user belongs to, with the business display name.
// Used by the top-nav switcher + team page. Returns [{ business_id, role,
// business_name }]. Joins settings on the owner's user_id for the name.
async function userBusinesses(env, uid) {
  const { results } = await env.DB.prepare(
    `SELECT ur.business_id, ur.role,
       COALESCE(s.business_name, u.name, u.email) AS business_name
     FROM user_roles ur
     LEFT JOIN users u ON u.id = ur.business_id
     LEFT JOIN settings s ON s.user_id = ur.business_id
     WHERE ur.user_id = ?
     ORDER BY (ur.business_id = ?) DESC, ur.business_id ASC`
  ).bind(uid, uid).all();
  return results || [];
}

// Standard admin 500 page (keeps the shell so the nav still renders).
function adminErrorPage(active, msg) {
  return new Response(
    adminShell(active, 'Error', `<h1>⚠️ Error</h1><p style="color:#f85149">${htmxEsc(msg || 'Could not load this page.')}</p>`),
    { status: 500, headers: { 'Content-Type': 'text/html' } }
  );
}

// Format a number as USD. 1234.5 → "$1,234.50".
function fmtMoney(n) {
  const v = Number(n) || 0;
  return '$' + v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// Monthly recurring revenue for one account, derived locally.
//   base ($29.95) applies when the subscription is active/paid (not trialing).
//   each enabled add-on adds $9.95.
// settings = the settings row (with addon_* columns); sub = subscriptions row.
function mrrForAccount(settings, sub) {
  const status = (sub && sub.status) || 'trial';
  const plan = (settings && settings.stripe_plan) || 'base';
  // Count as paying when status is active OR the plan was upgraded to paid.
  const paying = status === 'active' || plan === 'paid';
  let total = paying ? ADMIN_BASE_PRICE : 0;
  if (settings) {
    for (const def of Object.values(ADDONS)) {
      if (settings[def.column]) total += ADMIN_ADDON_PRICE;
    }
  }
  return total;
}

// Count enabled add-ons on a settings row (for tables/analytics).
function countAddons(settings) {
  if (!settings) return 0;
  let n = 0;
  for (const def of Object.values(ADDONS)) if (settings[def.column]) n++;
  return n;
}

// Build an absolute redirect Response for a relative path. The Workers
// runtime's Response.redirect() requires an absolute URL (it throws on
// relative ones), so we resolve against the request origin. status defaults
// to 302; pass 303 for post-submit redirects.
function adminRedirect(request, relPath, status = 302) {
  const origin = new URL(request.url).origin;
  return Response.redirect(origin + relPath, status);
}


// Convenience wrapper: layouts a page inside the sidebar shell.


// Escape for HTML attributes/text. Inline because HTMX pages render their own
// document and don't share the esc() used by the public-site renderer.
function htmxEsc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function settingsHtmxBody({ row, user, saved, outreach }) {
  const s = row || {};
  // ⓘ help icon next to a card/field heading. A crisp amber SVG circle with an
  // "i" inside (replaces the blurry "ⓘ" text glyph). Click (desktop) or tap
  // (mobile) toggles a popover positioned under the icon; click-away or Escape
  // dismisses it. The popover element + listeners are injected once below.
  const tipIcon = '<svg class="s-tip-svg" width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true"><circle cx="9" cy="9" r="8" stroke="#d4a574" stroke-width="1.5"/><text x="9" y="12.5" text-anchor="middle" font-size="11" font-weight="700" fill="#d4a574" font-family="Inter Tight, sans-serif">i</text></svg>';
  const tip = (msg) => `<span class="s-tip" tabindex="0" role="button" aria-label="More info" data-tip="${htmxEsc(msg)}">${tipIcon}</span>`;
  const tipStyles = `<style>
.s-tip{display:inline-flex;align-items:center;justify-content:center;width:18px;height:18px;cursor:help;margin-left:7px;vertical-align:middle;opacity:.7;transition:opacity .2s ease,background-color .2s ease;border-radius:50%;outline:none;-webkit-tap-highlight-color:transparent}
.s-tip:hover,.s-tip:focus{opacity:1;background:rgba(212,165,116,.12)}
.s-tip-svg{display:block;pointer-events:none}
.s-tip-pop{position:absolute;background:var(--bg-elev,#13131f);border:1px solid var(--border-soft,#2e2618);border-radius:10px;padding:11px 14px;font-size:.82rem;line-height:1.5;color:var(--text-muted);max-width:260px;box-shadow:0 12px 32px -10px rgba(0,0,0,.7);z-index:60;opacity:0;transform:translateY(4px);transition:opacity .18s ease,transform .18s ease;pointer-events:none}
.s-tip-pop.show{opacity:1;transform:translateY(0);pointer-events:auto}
.s-tip-pop::after{content:"";position:absolute;top:-5px;left:var(--arrow-x,14px);width:8px;height:8px;background:var(--bg-elev,#13131f);border-left:1px solid var(--border-soft,#2e2618);border-top:1px solid var(--border-soft,#2e2618);transform:rotate(45deg)}
</style>`;
  const savedBox = saved
    ? `<div style="background:rgba(52,211,153,.12);border:1px solid rgba(52,211,153,.35);color:var(--success);padding:12px 16px;border-radius:10px;margin-bottom:18px;font-size:.9em">✓ Settings saved.</div>`
    : '';
  // Cold outreach integration status (Apollo + TextMagic). Shown only when the
  // caller passes the readiness flags; degrades to nothing otherwise.
  const o = outreach || {};
  if (o.shown) {
    const dot = (on) => on ? '🟢' : '⚪';
    o.card = `<div class="card" style="margin-bottom:20px">
  <strong style="font-size:1.05rem">📣 Cold outreach</strong>
  <div style="margin-top:8px;font-size:.9em;color:var(--text-muted)">
    ${dot(o.apollo)} Apollo prospect search ${o.apollo ? '<strong style="color:var(--accent-amber)">connected</strong>' : 'not configured'}<br>
    ${dot(o.textMagic)} TextMagic SMS blast ${o.textMagic ? '<strong style="color:var(--accent-amber)">connected</strong>' : 'not configured'}
  </div>
  <div style="margin-top:12px"><a class="btn btn-sm" href="/p/outreach">Search for prospects →</a></div>
</div>`;
  }
  const vapiStatus = s.vapi_phone_number
    ? `🟢 Emma is live — <strong class="mono" style="color:var(--accent-amber)">${htmxEsc(s.vapi_phone_number)}</strong>`
    : '⚪ Phone not set up';
  const who = user ? `<p class="sub" style="margin-bottom:0">Signed in as <strong style="color:var(--text-primary)">${htmxEsc(user.email)}</strong></p>` : '';
  const field = (label, inner) => `<div style="margin-bottom:14px"><label style="display:block;font-size:.78rem;font-family:var(--font-mono);letter-spacing:.04em;color:var(--text-muted);margin-bottom:7px;text-transform:uppercase">${label}</label>${inner}</div>`;
  const text = (name, val, ph = '') => `<input type="text" name="${name}" value="${htmxEsc(val)}" placeholder="${htmxEsc(ph)}" style="width:100%;box-sizing:border-box">`;
  // Interactive Vapi toggle. ON → POST /api/vapi/provision-htmx (buys a number);
  // OFF → confirm() then POST /api/vapi/deprovision-htmx (releases it). The
  // endpoints authenticate via the bl_session cookie (same-site), so fetch
  // runs with credentials included and no Bearer token is needed.
  const vapiOn = !!s.vapi_phone_number;
  const vapiCard = `<div class="card glow" style="margin-bottom:20px">
    <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap">
      <div>
        <strong style="font-size:1.05rem">📞 Emma AI Voice (Vapi)</strong>${tip("Emma is your AI receptionist. Provision a phone line and she answers calls 24/7, books appointments, and captures leads.")}
        <div id="vapi-status" style="margin-top:6px;font-size:.9em;color:var(--text-muted)">${vapiStatus}</div>
      </div>
      <div style="display:flex;gap:8px;align-items:center">
        <button id="vapi-on-btn" class="btn btn-success btn-sm" style="${vapiOn ? 'display:none' : ''}" onclick="vapiToggle(true)">Enable Emma</button>
        <button id="vapi-off-btn" class="btn btn-ghost btn-sm" style="${vapiOn ? '' : 'display:none'};color:var(--danger);border-color:rgba(248,113,113,.4)" onclick="vapiToggle(false)">Release number</button>
        <span id="vapi-spinner" style="display:none;color:var(--text-muted);font-size:.85em">⏳ Working…</span>
      </div>
    </div>
    <p style="color:var(--text-faint);font-size:.82em;margin:12px 0 0">${vapiOn ? 'Releasing the number is irreversible — a re-enable provisions a new number.' : 'Provisioning buys a US number and connects it to Emma.'}</p>
  </div>`;
  // Gmail Email-Sending card. On load it fetches /api/gmail/status-htmx
  // (cookie-authed) and renders either a "Connect Gmail" button (opens the
  // OAuth flow in a new tab) or the connected address + Disconnect button.
  // Disconnect POSTs to /api/gmail/disconnect-htmx then re-renders the card.
  const gmailCard = `<div class="card glow" style="margin-bottom:20px">
    <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap">
      <div>
        <strong style="font-size:1.05rem">📧 Email Sending</strong>${tip("Connect your Gmail account to send follow-ups, confirmations, and replies from your business email address. If not connected, emails send from hello@branchlive.com.")}
        <div id="gmail-status" style="margin-top:6px;font-size:.9em;color:var(--text-muted)">⏳ Checking Gmail…</div>
      </div>
      <div id="gmail-actions" style="display:flex;gap:8px;align-items:center"></div>
    </div>
    <p style="color:var(--text-faint);font-size:.82em;margin:12px 0 0">Connect Gmail to send follow-ups from your business address. Not connected? Emails send from hello@branchlive.com.</p>
  </div>`;
  // Google Calendar two-way sync status. Connected when a calendar ID is set;
  // the API key gates whether appointments actually push to the user's calendar.
  const gcalConnected = !!(s.google_calendar_id && s.google_calendar_api_key);
  const gcalStatus = gcalConnected
    ? `🟢 Synced — <strong class="mono" style="color:var(--accent-amber)">${htmxEsc(s.google_calendar_id)}</strong>`
    : '⚪ Not connected';
  const gcalCard = `<div class="card glow" style="margin-bottom:20px">
    <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap">
      <div>
        <strong style="font-size:1.05rem">📅 Google Calendar</strong>${tip("Two-way sync between Branch Live appointments and your Google Calendar. Enter your Calendar ID + API key below to publish Emma's bookings to your calendar.")}
        <div style="margin-top:6px;font-size:.9em;color:var(--text-muted)">${gcalStatus}</div>
      </div>
    </div>
    <p style="color:var(--text-faint);font-size:.82em;margin:12px 0 0">Connect Google Calendar so appointments Emma books appear on your calendar automatically.</p>
  </div>`;
  return `<div class="app">${sidebarNav('settings')}<div class="content" style="max-width:680px">
  ${tipStyles}
  <span class="eyebrow">Settings</span>
  <h1>⚙️ Settings</h1>
  ${who}
  ${savedBox}
  ${vapiCard}
  ${gmailCard}
  ${gcalCard}
  ${o.card || ''}
  <script>
  function vapiSetBusy(busy){
    document.getElementById('vapi-spinner').style.display=busy?'':'none';
    document.getElementById('vapi-on-btn').disabled=busy;
    document.getElementById('vapi-off-btn').disabled=busy;
  }
  function vapiRender(state){
    var st=document.getElementById('vapi-status');
    var onBtn=document.getElementById('vapi-on-btn');
    var offBtn=document.getElementById('vapi-off-btn');
    if(state.number){
      st.innerHTML='🟢 Emma is live — <strong class="mono" style="color:var(--accent-amber)">'+state.number+'</strong>';
      onBtn.style.display='none'; offBtn.style.display='';
    }else{
      st.innerHTML='⚪ Phone not set up';
      onBtn.style.display=''; offBtn.style.display='none';
    }
  }
  async function vapiToggle(enable){
    if(enable){
      if(!confirm('Provision a phone number for Emma now?'))return;
    }else{
      if(!confirm('Release Emma\u2019s phone number? This is irreversible and the number will be lost.'))return;
    }
    vapiSetBusy(true);
    var status=document.getElementById('vapi-status');
    status.style.opacity='0.6';
    try{
      var url=enable?'/api/vapi/provision-htmx':'/api/vapi/deprovision-htmx';
      var r=await fetch(url,{method:'POST',credentials:'same-origin'});
      var d=await r.json();
      if(d.ok){
        vapiRender({number:enable?(d.phone_number||''):''});
      }else{
        status.style.opacity='1';
        alert('✗ '+(d.error||'Action failed'));
      }
    }catch(e){
      status.style.opacity='1';
      alert('✗ Connection error');
    }finally{
      status.style.opacity='1';
      vapiSetBusy(false);
    }
  }
  // Gmail Email-Sending card. Fetches connection status on load; Connect opens
  // the OAuth flow in a new tab; Disconnect POSTs the cookie-authed endpoint.
  function gmailRender(state){
    var st=document.getElementById('gmail-status');
    var act=document.getElementById('gmail-actions');
    if(state.connected){
      st.innerHTML='✅ Connected as <strong class="mono" style="color:var(--accent-amber)">'+(state.email||'Gmail')+'</strong>';
      act.innerHTML='<button class="btn btn-ghost btn-sm" style="color:var(--danger);border-color:rgba(248,113,113,.4)" onclick="gmailDisconnect()">Disconnect</button>';
    }else{
      st.innerHTML='⚪ Not connected — emails send from hello@branchlive.com';
      act.innerHTML='<a class="btn btn-sm" href="/api/gmail/auth-htmx" target="_blank" rel="noopener">🔗 Connect Gmail</a>';
    }
  }
  async function gmailDisconnect(){
    if(!confirm('Disconnect Gmail? Emails will send from hello@branchlive.com again.'))return;
    try{
      var r=await fetch('/api/gmail/disconnect-htmx',{method:'POST',credentials:'same-origin'});
      var d=await r.json();
      if(d.ok){gmailRender({connected:false});}
      else{alert('✗ '+(d.error||'Could not disconnect'));}
    }catch(e){alert('✗ Connection error');}
  }
  // Load the current Gmail status for the signed-in user on page load.
  (async function(){
    try{
      var r=await fetch('/api/gmail/status-htmx',{credentials:'same-origin'});
      var d=await r.json();
      gmailRender({connected:!!d.connected,email:d.email||''});
    }catch(e){
      var st=document.getElementById('gmail-status');
      if(st)st.textContent='⚪ Could not check Gmail status.';
    }
  })();
  // ⓘ help-icon popovers. One shared popover element is repositioned under
  // whichever .s-tip was clicked/tapped. Works for mouse, touch, and keyboard
  // (Enter/Space when the icon has focus). Tapping the same icon again, tapping
  // anywhere else, or pressing Escape dismisses it.
  (function(){
    var pop=document.createElement('div');
    pop.className='s-tip-pop';
    pop.setAttribute('role','tooltip');
    document.body.appendChild(pop);
    var active=null;
    function showFor(icon){
      pop.textContent=icon.getAttribute('data-tip')||'';
      // Measure first (hidden), then clamp inside the viewport so the popover
      // never spills off the right edge on mobile.
      var pw=Math.min(260,pop.offsetWidth||260);
      var r=icon.getBoundingClientRect();
      var left=Math.max(8,Math.min(r.left+r.width/2-pw/2, window.innerWidth-pw-8));
      pop.style.left=left+'px';
      pop.style.top=(r.bottom+window.scrollY+8)+'px';
      // Move the little arrow to sit under the icon's center.
      var arrowX=Math.max(14,Math.min(pw-14, r.left+r.width/2-left));
      pop.style.setProperty('--arrow-x',arrowX+'px');
      pop.classList.add('show');
      active=icon;
    }
    function hide(){pop.classList.remove('show');active=null;}
    function toggle(icon){
      if(active===icon){hide();}else{showFor(icon);}
    }
    // Single document-level handler covers real mouse clicks and mobile taps
    // (a tap is a click on touch devices). closest() walks up from the actual
    // target, so clicks on the <svg>/<text> inside the icon still resolve.
    document.addEventListener('click',function(e){
      var icon=e.target.closest&&e.target.closest('.s-tip');
      if(icon){toggle(icon);return;}
      if(!pop.contains(e.target))hide();
    });
    // Keyboard: Enter/Space opens when an icon is focused; Escape closes.
    document.addEventListener('keydown',function(e){
      if(e.key==='Escape'){hide();return;}
      if((e.key==='Enter'||e.key===' ')&&document.activeElement&&document.activeElement.classList&&document.activeElement.classList.contains('s-tip')){
        e.preventDefault();toggle(document.activeElement);
      }
    });
    window.addEventListener('scroll',hide,{passive:true});
    window.addEventListener('resize',hide,{passive:true});
  })();
  </script>
  <form method="POST" action="/settings-htmx">
    <div class="card">
      <h3 style="margin-top:0">Business profile${tip("The basics Emma uses when she answers calls and when customers book — your name, what you do, where you work, and how to reach you.")}</h3>
      ${field('Business name', text('business_name', s.business_name, 'Acme Plumbing'))}
      ${field('Industry', text('industry', s.industry, 'Plumbing'))}
      ${field('Service area', text('service_area', s.service_area, 'Lancaster, PA'))}
      ${field('Forwarding number', text('forwarding_number', s.forwarding_number, '+1 (717) 555-0100'))}
      ${field('Service description', `<textarea name="service_description" rows="3" style="width:100%;box-sizing:border-box" placeholder="Brief description of services">${htmxEsc(s.service_description)}</textarea>`)}
      ${field('Welcome message', `<textarea name="welcome_message" rows="2" style="width:100%;box-sizing:border-box" placeholder="Thanks for calling…">${htmxEsc(s.welcome_message)}</textarea>`)}
      ${field('Working hours', text('working_hours', s.working_hours, 'Mon–Fri 8am–6pm'))}
      <div style="display:flex;gap:16px;flex-wrap:wrap">
        ${field('Instagram URL', text('instagram_url', s.instagram_url, 'https://instagram.com/yourbusiness'))}
        ${field('Facebook URL', text('facebook_url', s.facebook_url, 'https://facebook.com/yourbusiness'))}
      </div>
      <div style="margin-top:14px;padding-top:14px;border-top:1px solid var(--border)">
        <div style="font-size:.78rem;font-family:var(--font-mono);letter-spacing:.04em;color:var(--text-muted);margin-bottom:10px;text-transform:uppercase">Social auto-posting</div>
        ${field('Facebook Page Token', `<input type="text" name="facebook_page_token" value="${htmxEsc(s.facebook_page_token)}" placeholder="EAA..." style="width:100%;box-sizing:border-box">`)}
        <p style="color:var(--text-faint);font-size:.78em;margin:-4px 0 12px">Used to auto-publish posts. <a href="https://developers.facebook.com/docs/pages/access-tokens" target="_blank" rel="noopener" style="color:var(--accent)">Get one →</a> Leave blank to use draft-only mode.</p>
        ${field('Instagram Business Account ID', `<input type="text" name="instagram_business_id" value="${htmxEsc(s.instagram_business_id)}" placeholder="1789..." style="width:100%;box-sizing:border-box">`)}
        <p style="color:var(--text-faint);font-size:.78em;margin:-4px 0 0">Required only for Instagram publishing (needs a Business Account linked to your Facebook Page).</p>
      </div>
      <div style="margin-top:14px">
        <label style="display:block;font-size:.78rem;font-family:var(--font-mono);letter-spacing:.04em;color:var(--text-muted);margin-bottom:7px;text-transform:uppercase">Google Place ID <span class="gpid-tip" style="text-transform:none;font-weight:400;letter-spacing:0;font-size:1em;color:var(--text-faint)">Find yours at <a href="https://developers.google.com/maps/documentation/places/web-service/place-id" target="_blank" rel="noopener" style="color:var(--accent)">Google's Place ID Finder</a></span></label>
        <input type="text" name="google_place_id" value="${htmxEsc(s.google_place_id)}" placeholder="ChIJ..." style="width:100%;box-sizing:border-box">
        <p style="color:var(--text-faint);font-size:.78em;margin:6px 0 0">Used by the Review Monitoring add-on to pull your live Google reviews.</p>
      </div>
    </div>
    <div class="card" style="margin-top:16px">
      <h3 style="margin-top:0">Notifications${tip("Choose how Emma alerts you about new leads. SMS alerts text you the moment a call comes in; urgent-only limits texts to high-priority jobs.")}</h3>
      ${check('notify_email', 'Email me new leads', !!s.notify_email)}
      ${check('notify_sms', 'Text me new leads', !!s.notify_sms)}
      ${check('notify_urgent_only', 'Only notify for urgent leads', !!s.notify_urgent_only)}
      ${check('sms_consent', '📱 SMS appointment reminders', !!s.sms_consent)}
      <p style="color:var(--text-faint);font-size:.8em;margin:8px 0 0">SMS reminders require carrier approval (A2P 10DLC). Toggles locally until Twilio is live.</p>
    </div>
    <div class="card" style="margin-top:16px">
      <h3 style="margin-top:0">Scheduling${tip("Buffer adds extra time after each appointment so you're not rushing between jobs (e.g., 30 minutes for travel). Default duration is how long a typical booking lasts.")}</h3>
      <div style="display:flex;gap:16px;flex-wrap:wrap">
        ${field('Buffer (min)', `<input type="number" name="buffer_min" value="${htmxEsc(s.buffer_min != null ? s.buffer_min : 30)}" style="width:140px">`)}
        ${field('Default duration (min)', `<input type="number" name="default_duration_min" value="${htmxEsc(s.default_duration_min != null ? s.default_duration_min : 60)}" style="width:140px">`)}
      </div>
      ${field('Time format', (() => {
        const tf = String(s.time_format).toLowerCase() === '24h' ? '24h' : '12h';
        return `<select name="time_format" style="width:100%;max-width:240px">
          <option value="12h" ${tf === '12h' ? 'selected' : ''}>12-hour (11 AM)</option>
          <option value="24h" ${tf === '24h' ? 'selected' : ''}>24-hour (11:00)</option>
        </select>`;
      })())}
    </div>
    <div style="margin-top:22px;display:flex;gap:10px">
      <button type="submit" class="btn-amber">💾 Save settings</button>
      <a class="btn btn-ghost" href="/settings-htmx">Cancel</a>
    </div>
  </form>
</div></div>`;
}

// helper used inside settingsHtmxBody's template (checkbox row)
function check(name, label, checked) {
  return `<label style="display:flex;align-items:center;gap:11px;padding:9px 0;cursor:pointer;font-size:.95em;color:var(--text-primary)"><input type="checkbox" name="${name}" ${checked ? 'checked' : ''} style="width:18px;height:18px;accent-color:var(--accent-amber);cursor:pointer"> ${htmxEsc(label)}</label>`;
}

// ═══════════════════════════════════════════════════════════════════════
// COOKIE-AUTH POST HELPERS for the HTMX dashboard.
// The dashboard pages are cookie-authenticated (bl_session), but the JSON
// API under /api/* is Bearer-only. These -htmx POST endpoints resolve the
// user from the session cookie and reuse the same DB writes as the API,
// so dashboard forms/toggles work without a client-side token.
// All return JSON for the inline JS to read.
// ═══════════════════════════════════════════════════════════════════════

// POST /p/leads/:id — update a lead's status. Form-encoded (status=...).
async function handleLeadStatusHtmx(request, env, uid, leadId) {
  try {
    const form = await request.formData();
    const status = String(form.get('status') || 'new').toLowerCase();
    const allowed = ['new', 'contacted', 'scheduled', 'booked', 'closed'];
    if (!allowed.includes(status)) return json({ ok: false, error: 'Invalid status' });
    const res = await env.DB.prepare(
      'UPDATE leads SET status = ?, updated_at = ? WHERE id = ? AND user_id = ?'
    ).bind(status, nowISO(), leadId, uid).run();
    if (!res.meta || res.meta.changes === 0) return new Response('Lead not found', { status: 404 });
    return Response.redirect('/p/leads/' + leadId, 302);
  } catch (e) {
    console.error('Lead status htmx error:', e);
    return json({ ok: false, error: 'Could not update lead' });
  }
}

// POST /api/leads/:id/followup-email-htmx — send the lead_followup template
// to the lead's email. Cookie-authed wrapper around the same sendAutoEmail
// core used by handleEmailsSendTemplate (which is Bearer-only). Returns
// { ok, error? } for the inline button JS on /p/leads/:id.
async function handleLeadFollowupEmailHtmx(request, env, uid, leadId) {
  try {
    const lead = await env.DB.prepare('SELECT * FROM leads WHERE id = ? AND user_id = ?').bind(leadId, uid).first();
    if (!lead) return json({ ok: false, error: 'Lead not found' });
    if (!lead.caller_email) return json({ ok: false, error: 'This lead has no email address' });
    const settings = await env.DB.prepare('SELECT business_name, forwarding_number FROM settings WHERE user_id = ?').bind(uid).first();
    const businessName = (settings && settings.business_name) || '';
    const phone = (settings && settings.forwarding_number) || '';
    // An optional custom message (e.g. the edited AI draft) may be POSTed as
    // JSON { message } or form-encoded. If absent, fall back to the template.
    let customMessage = '';
    try {
      const ct = (request.headers.get('Content-Type') || '').toLowerCase();
      if (ct.includes('application/json')) {
        const body = await request.json();
        if (body && typeof body.message === 'string') customMessage = body.message.trim();
      }
    } catch (e) { /* no/invalid body — use template */ }
    let html;
    if (customMessage) {
      // Render the edited draft as simple paragraphs inside the shell.
      const paras = escapeHtml(customMessage).split(/\n{2,}/).map(p =>
        `<p style="color:#f1f5f9;font-size:15px;line-height:1.7;margin:0 0 16px;text-align:left;white-space:pre-wrap;">${p}</p>`
      ).join('');
      html = emailShell(paras);
    } else {
      html = emailShell(leadFollowupEmailContent(businessName, lead.caller_name, lead.job_details, phone));
    }
    const res = await sendAutoEmail(env, {
      to: lead.caller_email,
      subject: `Thanks for calling ${businessName || 'us'}`,
      html,
      uid, leadId, template: 'lead_followup',
    });
    if (!res.ok) return json({ ok: false, error: 'Email could not be sent' });
    return json({ ok: true });
  } catch (e) {
    console.error('Lead followup email htmx error:', e);
    return json({ ok: false, error: 'Could not send email' });
  }
}

// POST /api/leads/:id/email-draft-htmx — cookie-authed AI draft generator for
// the HTMX lead detail page. Resolves the lead + its transcript server-side
// (the page can't send a Bearer token), then runs the shared AI core. Returns
// { ok, draft?, error? }. Uses the lead transcript, falling back to the
// longest call-log transcript/summary if the lead row has none.
async function handleLeadEmailDraftHtmx(request, env, uid, leadId) {
  try {
    const lead = await env.DB.prepare('SELECT * FROM leads WHERE id = ? AND user_id = ?').bind(leadId, uid).first();
    if (!lead) return json({ ok: false, error: 'Lead not found' });
    // Gather the best transcript: lead.transcript first, else the longest
    // related call log transcript/summary.
    let transcript = (lead.transcript || '').trim();
    if (!transcript) {
      const calls = (await env.DB.prepare(
        'SELECT transcript, summary FROM call_logs WHERE user_id = ? AND (lead_id = ? OR caller_phone = ?) ORDER BY created_at DESC LIMIT 20'
      ).bind(uid, leadId, lead.caller_phone || '').all()).results || [];
      let best = '';
      for (const c of calls) {
        const t = ((c.transcript || '').trim()) || ((c.summary || '').trim());
        if (t && t.length > best.length) best = t;
      }
      transcript = best;
    }
    const settings = await env.DB.prepare('SELECT business_name FROM settings WHERE user_id = ?').bind(uid).first();
    const company = (settings && settings.business_name) || '';
    const result = await generateEmailDraftCore(env, uid, transcript, company, lead.caller_name);
    return json(result);
  } catch (e) {
    console.error('Lead email draft htmx error:', e);
    return json({ ok: false, error: 'Could not generate draft' });
  }
}

// POST /api/leads/:id/followup-sms-htmx — send a follow-up text to the
// lead's phone. Cookie-authed wrapper around the Twilio sendSms core. Same
// { ok, error? } contract as the email button. Silently no-ops (returns a
// clear error) when Twilio isn't configured — matching sendSms' behavior.
async function handleLeadFollowupSmsHtmx(request, env, uid, leadId) {
  try {
    const lead = await env.DB.prepare('SELECT * FROM leads WHERE id = ? AND user_id = ?').bind(leadId, uid).first();
    if (!lead) return json({ ok: false, error: 'Lead not found' });
    if (!lead.caller_phone) return json({ ok: false, error: 'This lead has no phone number' });
    const settings = await env.DB.prepare('SELECT business_name, forwarding_number FROM settings WHERE user_id = ?').bind(uid).first();
    const businessName = (settings && settings.business_name) || '';
    const firstName = (lead.caller_name || '').split(' ')[0];
    const nameLine = firstName ? `Hi ${firstName}, ` : 'Hi, ';
    const msg = `${nameLine}thanks for calling ${businessName || 'us'}! We received your inquiry and will be in touch shortly to get things scheduled. Reply STOP to opt out.`;
    const sent = await sendSms(env, { to: lead.caller_phone, body: msg });
    if (!sent) return json({ ok: false, error: 'SMS could not be sent. Check Twilio configuration.' });
    return json({ ok: true });
  } catch (e) {
    console.error('Lead followup sms htmx error:', e);
    return json({ ok: false, error: 'Could not send SMS' });
  }
}

// POST /api/knowledge/add-htmx — add a single knowledge item (JSON body).
async function handleKnowledgeAddHtmx(request, env, uid) {
  try {
    const body = await request.json();
    if (!body.item) return json({ ok: false, error: 'Item name is required' });
    await env.DB.prepare(
      'INSERT INTO knowledge (user_id, category, item, price, notes) VALUES (?, ?, ?, ?, ?)'
    ).bind(uid, body.category || '', body.item, body.price || 0, body.notes || '').run();
    return json({ ok: true });
  } catch (e) {
    console.error('Knowledge add htmx error:', e);
    return json({ ok: false, error: 'Could not add knowledge item' });
  }
}

// POST /api/knowledge/upload-htmx — CSV bulk import. Accepts either an
// uploaded .csv file OR a Google Sheets URL (form field "sheet") which is
// converted to a CSV export URL and fetched server-side. Mirrors
// handleKnowledgeUpload but resolves uid from the cookie.
async function handleKnowledgeUploadHtmx(request, env, uid) {
  try {
    let csvText = '';
    let count = 0;
    const formData = await request.formData();
    const file = formData.get('file');
    const sheetUrl = (formData.get('sheet') || '').trim();
    if (file) {
      csvText = await file.text();
    } else if (sheetUrl) {
      const csvUrl = sheetsUrlToCsv(sheetUrl);
      if (!csvUrl) return json({ ok: false, error: 'That doesn\'t look like a Google Sheets URL' });
      const r = await fetch(csvUrl, { redirect: 'follow' });
      if (!r.ok) return json({ ok: false, error: 'Could not fetch that sheet — make sure it\'s shared as "Anyone with the link"' });
      csvText = await r.text();
      // A private sheet returns an HTML login page; guard against importing HTML.
      if (/^\s*<!doctype html|<html/i.test(csvText)) {
        return json({ ok: false, error: 'Sheet isn\'t public — set sharing to "Anyone with the link can view"' });
      }
    } else {
      return json({ ok: false, error: 'Upload a CSV file or paste a Google Sheets URL' });
    }

    const parsed = parseKnowledgeCsv(csvText, env, uid);
    if (parsed.error) return json({ ok: false, error: parsed.error });
    if (parsed.batch.length) { await env.DB.batch(parsed.batch); count = parsed.batch.length; }
    return json({ ok: true, count });
  } catch (e) {
    console.error('Knowledge upload htmx error:', e);
    return json({ ok: false, error: 'Could not import CSV' });
  }
}

// Parse a CSV document into knowledge rows. Shared by the file upload and the
// Google Sheets import paths. Requires an "item" column; category/price/notes
// are optional. Returns { rows, count } on success or { error } on failure.
function parseKnowledgeCsv(text, env, uid) {
  const lines = text.split(/\r?\n/).filter(l => l.trim());
  if (lines.length < 2) return { error: 'CSV must have a header row and at least one data row' };
  const header = lines[0].replace(/^\uFEFF/, '').split(',').map(h => h.trim().toLowerCase());
  const catIdx = header.indexOf('category');
  const itemIdx = header.indexOf('item');
  const priceIdx = header.indexOf('price');
  const notesIdx = header.indexOf('notes');
  if (itemIdx === -1) return { error: 'CSV must have an "Item" column' };
  const batch = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',').map(c => c.trim().replace(/^"|"$/g, ''));
    const item = cols[itemIdx] || '';
    if (!item) continue;
    batch.push(env.DB.prepare(
      'INSERT INTO knowledge (user_id, category, item, price, notes) VALUES (?, ?, ?, ?, ?)'
    ).bind(
      uid,
      catIdx >= 0 ? (cols[catIdx] || '') : '',
      item,
      priceIdx >= 0 ? (parseFloat(cols[priceIdx]) || 0) : 0,
      notesIdx >= 0 ? (cols[notesIdx] || '') : ''
    ));
  }
  return { batch };
}

// POST /api/knowledge/update-htmx — edit one knowledge item (JSON body).
// Updates only the safe columns, scoped to the cookie user. 404s if the item
// belongs to someone else (no rows touched).
async function handleKnowledgeUpdateHtmx(request, env, uid) {
  try {
    const body = await request.json();
    const id = parseInt(body.id, 10);
    if (!id) return json({ ok: false, error: 'Item id is required' });
    if (!body.item) return json({ ok: false, error: 'Item name is required' });
    const res = await env.DB.prepare(
      'UPDATE knowledge SET category = ?, item = ?, price = ?, notes = ? WHERE id = ? AND user_id = ?'
    ).bind(body.category || '', body.item, parseFloat(body.price) || 0, body.notes || '', id, uid).run();
    if (!res.meta || res.meta.changes === 0) return json({ ok: false, error: 'Item not found' });
    return json({ ok: true });
  } catch (e) {
    console.error('Knowledge update htmx error:', e);
    return json({ ok: false, error: 'Could not update knowledge item' });
  }
}

// POST /api/knowledge/delete-htmx — remove one knowledge item (JSON body).
// Cookie-authed mirror of handleKnowledgeDelete.
async function handleKnowledgeDeleteHtmx(request, env, uid) {
  try {
    const body = await request.json();
    const id = parseInt(body.id, 10);
    if (!id) return json({ ok: false, error: 'Item id is required' });
    const res = await env.DB.prepare(
      'DELETE FROM knowledge WHERE id = ? AND user_id = ?'
    ).bind(id, uid).run();
    if (!res.meta || res.meta.changes === 0) return json({ ok: false, error: 'Item not found' });
    return json({ ok: true });
  } catch (e) {
    console.error('Knowledge delete htmx error:', e);
    return json({ ok: false, error: 'Could not delete knowledge item' });
  }
}

// Convert a Google Sheets sharing/edit URL into a CSV export URL, or return
// null if it isn't a Sheets URL. Handles:
//   /spreadsheets/d/<ID>/edit...        → /export?format=csv
//   /spreadsheets/d/<ID>/gviz/tq...     → /export?format=csv
// Publicly-shared (anyone-with-link) sheets export without auth.
function sheetsUrlToCsv(url) {
  const m = String(url || '').match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (!m) return null;
  const gidMatch = String(url).match(/[#?&]gid=([0-9]+)/);
  const gid = gidMatch ? gidMatch[1] : '0';
  return `https://docs.google.com/spreadsheets/d/${m[1]}/export?format=csv&gid=${gid}`;
}

// POST /api/settings/addon-htmx — flip a single addon_* column (JSON body).
// Body: { addon_<name>: 1|0 }. Whitelisted to addon_* columns only, so
// stripe_*/sms_consent are never touched.
async function handleSettingsAddonHtmx(request, env, uid) {
  try {
    const body = await request.json();
    const allowed = Object.values(ADDONS).map(a => a.column);
    const entries = Object.entries(body).filter(([k]) => allowed.includes(k));
    if (!entries.length) return json({ ok: false, error: 'No add-on specified' });
    const cols = entries.map(([k]) => k);
    const vals = entries.map(([, v]) => (v ? 1 : 0));
    // Ensure a settings row exists, then update only the requested columns.
    await env.DB.prepare(
      `INSERT INTO settings (user_id, ${cols.join(', ')}) VALUES (?, ${cols.map(() => '?').join(', ')})
       ON CONFLICT(user_id) DO UPDATE SET ${cols.map(c => `${c} = excluded.${c}`).join(', ')}`
    ).bind(uid, ...vals).run();
    return json({ ok: true });
  } catch (e) {
    console.error('Settings addon htmx error:', e);
    return json({ ok: false, error: 'Could not update add-on' });
  }
}


async function handleSettingsHtmx(request, env) {
  // Resolve the user from the session cookie — never a hardcoded uid.
  const uid = await getUidFromSessionCookie(request, env);
  if (!uid) {
    // Not logged in: bounce to the HTMX login, return here after sign-in.
    return new Response(null, { status: 302, headers: { Location: '/login-htmx?next=/settings-htmx' } });
  }

  // Outreach integration status (Apollo + TextMagic key presence). Drives the
  // status card on the settings page; both keys are wrangler secrets.
  const outreach = {
    shown: true,
    apollo: !!env.APOLLO_API_KEY,
    textMagic: !!(env.TEXTMAGIC_USERNAME && env.TEXTMAGIC_API_KEY),
  };

  // POST: persist the safe form fields. Explicit-column UPSERT so the
  // billing columns (stripe_*, addon_*) are never clobbered. sms_consent is
  // owned by this form now (the SMS appointment reminders toggle).
  if (request.method === 'POST') {
    let form;
    try {
      form = await request.formData();
    } catch (e) {
      return new Response(simpleShell('Settings', settingsHtmxBody({ row: {}, user: null, saved: false })), {
        headers: { 'Content-Type': 'text/html' }, status: 400,
      });
    }
    const g = k => (typeof form.get(k) === 'string' ? form.get(k).trim() : '');
    const num = (k, dflt) => {
      const n = parseInt(g(k), 10);
      return Number.isFinite(n) ? n : dflt;
    };
    try {
      await env.DB.prepare(
        `INSERT INTO settings (
          user_id, business_name, forwarding_number, welcome_message,
          working_hours, industry, service_area, service_description,
          notify_sms, notify_email, notify_urgent_only,
          google_calendar_api_key, google_calendar_id,
          buffer_min, week_start_day, default_duration_min, time_format,
          sms_consent, instagram_url, facebook_url, google_place_id,
          facebook_page_token, instagram_business_id
        ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
        ON CONFLICT(user_id) DO UPDATE SET
          business_name = excluded.business_name,
          forwarding_number = excluded.forwarding_number,
          welcome_message = excluded.welcome_message,
          working_hours = excluded.working_hours,
          industry = excluded.industry,
          service_area = excluded.service_area,
          service_description = excluded.service_description,
          notify_sms = excluded.notify_sms,
          notify_email = excluded.notify_email,
          notify_urgent_only = excluded.notify_urgent_only,
          google_calendar_api_key = excluded.google_calendar_api_key,
          google_calendar_id = excluded.google_calendar_id,
          buffer_min = excluded.buffer_min,
          week_start_day = excluded.week_start_day,
          default_duration_min = excluded.default_duration_min,
          time_format = excluded.time_format,
          sms_consent = excluded.sms_consent,
          instagram_url = excluded.instagram_url,
          facebook_url = excluded.facebook_url,
          google_place_id = excluded.google_place_id,
          facebook_page_token = excluded.facebook_page_token,
          instagram_business_id = excluded.instagram_business_id`
      ).bind(
        uid,
        g('business_name'), g('forwarding_number'),
        g('welcome_message'), g('working_hours'),
        g('industry'), g('service_area'), g('service_description'),
        form.get('notify_sms') ? 1 : 0, form.get('notify_email') ? 1 : 0, form.get('notify_urgent_only') ? 1 : 0,
        g('google_calendar_api_key'), g('google_calendar_id'),
        num('buffer_min', 30), num('week_start_day', 0), num('default_duration_min', 60),
        (g('time_format') === '24h' ? '24h' : '12h'),
        form.get('sms_consent') ? 1 : 0,
        g('instagram_url'), g('facebook_url'),
        g('google_place_id'),
        g('facebook_page_token'), g('instagram_business_id')
      ).run();
    } catch (e) {
      console.error('HTMX settings save error:', e);
      const user = await env.DB.prepare('SELECT email FROM users WHERE id = ?').bind(uid).first();
      const row = await env.DB.prepare('SELECT * FROM settings WHERE user_id = ?').bind(uid).first();
      return new Response(simpleShell('Settings', settingsHtmxBody({ row, user, saved: false, outreach })), {
        headers: { 'Content-Type': 'text/html' }, status: 500,
      });
    }
  }

  // GET (and after a successful POST): render the logged-in user's data.
  try {
    const user = await env.DB.prepare('SELECT email FROM users WHERE id = ?').bind(uid).first();
    const row = await env.DB.prepare('SELECT * FROM settings WHERE user_id = ?').bind(uid).first();
    return new Response(simpleShell('Settings', settingsHtmxBody({ row, user, saved: request.method === 'POST', outreach })), {
      headers: { 'Content-Type': 'text/html' },
    });
  } catch (e) {
    console.error('HTMX settings render error:', e);
    return new Response(simpleShell('Settings', '<h1>⚠️ Error</h1><p style="color:#f85149">Could not load settings.</p>'), {
      headers: { 'Content-Type': 'text/html' }, status: 500,
    });
  }
}

async function handleMe(request, env, uid) {
  try {
    const row = await env.DB.prepare(
      'SELECT * FROM users WHERE id = ?'
    ).bind(uid).first();
    if (!row) return apiError('User not found', 401);
    // Surface billing/add-on status so the frontend can gate features.
    const settings = await env.DB.prepare(
      'SELECT stripe_plan, addon_website, addon_reviews, addon_social, addon_blog, addon_email FROM settings WHERE user_id = ?'
    ).bind(uid).first();
    return json({
      ok: true,
      name: row.name,
      company: row.company,
      email: row.email,
      plan: (settings && settings.stripe_plan) || 'base',
      addons: addonFlagsFromSettings(settings),
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
    let company = (body.company || '').trim();
    const phone = (body.phone || '').trim();
    const smsConsent = body.sms_consent ? 1 : 0;
    const inviteToken = (body.invite || '').trim();

    // Team invite: if a ?invite=TOKEN is present, look it up. When valid + the
    // email matches, we pre-fill the company from the inviting business and
    // attach the membership after the account is created. This does not change
    // the auth/session flow — it only seeds the user_roles row.
    let invite = null;
    if (inviteToken) {
      invite = await env.DB.prepare(
        `SELECT ti.business_id, ti.email, ti.role, ti.status,
                s.business_name
         FROM team_invites ti
         LEFT JOIN settings s ON s.user_id = ti.business_id
         WHERE ti.token = ?`
      ).bind(inviteToken).first();
      // Only honor a pending invite addressed to this email.
      if (invite && invite.status === 'pending' && invite.email === email && !company) {
        company = (invite.business_name || '').trim();
      }
    }

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
      'INSERT INTO users (email, password_hash, name, company, phone, created_at) VALUES (?, ?, ?, ?, ?, ?)'
    ).bind(email, pwHash, name, company, phone, now).run();

    let userId = result.meta ? result.meta.last_row_id : null;
    if (!userId) {
      const userRow = await env.DB.prepare(
        'SELECT id FROM users WHERE email = ?'
      ).bind(email).first();
      userId = userRow ? userRow.id : 1;
    }

    await env.DB.prepare(
      'INSERT INTO subscriptions (user_id, plan, status, trial_start, trial_end, created_at) VALUES (?, ?, ?, ?, ?, ?)'
    ).bind(userId, 'free', 'trial', now, trialEnd, now).run();

    await env.DB.prepare(
      'INSERT INTO settings (user_id, business_name, forwarding_number, welcome_message, working_hours, industry, service_area, service_description, notify_sms, notify_email, notify_urgent_only, google_calendar_api_key, google_calendar_id, buffer_min, sms_consent) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    ).bind(userId, company, phone, `Hi, thanks for calling ${company}!`, 'Mon-Fri 7am-5pm', '', '', '', 1, 1, 0, '', '', 30, smsConsent).run();

    // Create session
    const token = crypto.randomUUID();
    await env.DB.prepare(
      'INSERT INTO sessions (token, user_id, created_at) VALUES (?, ?, ?)'
    ).bind(token, userId, now).run();

    // Welcome email
    await sendEmail(env, {
      to: email,
      subject: `Welcome to Branch Live, ${name}!`,
      html: emailShell(welcomeEmailContent(name))
    });

    // Team invite acceptance — attach the new user to the inviting business
    // with their assigned role and mark the invite accepted. Wrapped so a
    // problem here never blocks account creation. They keep their own business
    // too (via the initDB owner backfill), so both show in their switcher.
    if (invite && invite.status === 'pending' && invite.email === email) {
      try {
        await env.DB.prepare(
          'INSERT OR IGNORE INTO user_roles (user_id, business_id, role, invited_by, created_at) VALUES (?, ?, ?, ?, ?)'
        ).bind(userId, invite.business_id, invite.role || 'employee', null, now).run();
        await env.DB.prepare(
          'UPDATE team_invites SET status = ? WHERE token = ?'
        ).bind('accepted', inviteToken).run();
      } catch (e) {
        console.error('Invite acceptance error:', e.message);
      }
    }

    // Affiliate attribution — if the signup included a valid ?ref=CODE (passed
    // through as body.ref by the signup form), record the referral. Wrapped so
    // an attribution problem never blocks account creation.
    let referredBy = null;
    const refCode = (body.ref || '').trim();
    if (refCode) {
      try {
        const aff = await env.DB.prepare(
          'SELECT code, name FROM affiliate WHERE lower(code) = lower(?)'
        ).bind(refCode).first();
        if (aff) {
          await env.DB.prepare(
            'INSERT INTO referrals (affiliate_code, referred_user_id, created_at) VALUES (?, ?, ?)'
          ).bind(aff.code, userId, now).run();
          referredBy = aff.name || aff.code;
        }
      } catch (e) {
        console.error('Affiliate attribution error:', e.message);
      }
    }

    // Phase 3 conversion: if this signup's phone matches a prospect we texted,
    // advance them to 'signed-up'. Best-effort, never blocks account creation.
    if (phone) await markProspectSignedUpIfTexted(env, phone);

    return json({
      ok: true,
      name,
      company,
      trial_end: trialEnd.slice(0, 10),
      token,
      referred_by: referredBy,
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

    // Auto-send a customer-facing follow-up when the new lead has an email.
    // Failures are logged but never break lead creation.
    if (callerEmail) {
      try {
        const settings = await env.DB.prepare('SELECT business_name, forwarding_number FROM settings WHERE user_id = ?').bind(uid).first();
        const newLead = await env.DB.prepare('SELECT id FROM leads WHERE user_id = ? ORDER BY id DESC LIMIT 1').bind(uid).first();
        await sendAutoEmail(env, {
          to: callerEmail,
          subject: `Thanks for calling ${(settings && settings.business_name) || 'us'}`,
          html: emailShell(leadFollowupEmailContent(
            (settings && settings.business_name) || '', callerName, jobDetails,
            (settings && settings.forwarding_number) || ''
          )),
          uid, leadId: newLead ? newLead.id : null, template: 'lead_followup',
        });
      } catch (e) {
        console.error('Lead follow-up auto-send error:', e.message);
      }
    }

    // Return the id of the lead we just created. (Previously this referenced an
    // undefined `bufDebug` and queried appointments by body.date/body.time,
    // which threw a ReferenceError and made every lead-create return an error
    // even though the row saved successfully.)
    const newLeadRow = await env.DB.prepare(
      'SELECT id FROM leads WHERE user_id = ? ORDER BY id DESC LIMIT 1'
    ).bind(uid).first();
    return json({ ok: true, id: newLeadRow ? newLeadRow.id : null });
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
    const updates = [];
    const values = [];
    if (body.status) { updates.push('status = ?'); values.push(body.status); }
    if (body.caller_email !== undefined) { updates.push('caller_email = ?'); values.push(body.caller_email); }
    if (updates.length === 0) return apiError('Nothing to update');
    updates.push('updated_at = ?'); values.push(nowISO());
    values.push(leadId, uid);
    await env.DB.prepare(
      `UPDATE leads SET ${updates.join(', ')} WHERE id = ? AND user_id = ?`
    ).bind(...values).run();
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

    // Explicit column list — the live appointments table has extra columns
    // (buffer_enabled, buffer_min, employee_id) added by migrations, which would
    // break a positional VALUES(...) insert.
    await env.DB.prepare(
      'INSERT INTO appointments (user_id, title, customer_name, customer_phone, date, time, duration_min, status, notes, google_event_id, created_at, appointment_type_id, buffer_enabled, buffer_min) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
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

    // Resolve the new appointment id + a customer email. Appointments store no
    // email column, so we look one up from a matching lead (by name), or accept
    // body.customer_email from the caller.
    const apptIdRow = await env.DB.prepare(
      'SELECT id FROM appointments WHERE user_id = ? ORDER BY id DESC LIMIT 1'
    ).bind(uid).first();
    const newApptId = apptIdRow ? apptIdRow.id : null;
    let customerEmailForAppt = (body.customer_email && String(body.customer_email)) || '';
    if (!customerEmailForAppt && body.customer_name) {
      const leadMatch = await env.DB.prepare(
        "SELECT caller_email FROM leads WHERE user_id = ? AND lower(caller_name) = lower(?) AND caller_email != '' ORDER BY id DESC LIMIT 1"
      ).bind(uid, body.customer_name).first();
      if (leadMatch) customerEmailForAppt = leadMatch.caller_email;
    }
    // Auto-send a customer-facing confirmation when we have an email address.
    // Skip when the caller explicitly opted into send_email_reminder — that
    // path sends its own confirmation below, so we avoid a duplicate send.
    if (customerEmailForAppt && !body.send_email_reminder) {
      try {
        const settings = await env.DB.prepare('SELECT business_name FROM settings WHERE user_id = ?').bind(uid).first();
        await sendAutoEmail(env, {
          to: customerEmailForAppt,
          subject: `Your appointment is confirmed — ${body.title}`,
          html: emailShell(customerAppointmentConfirmContent(
            (settings && settings.business_name) || '', body.title, body.date, body.time, body.customer_name || ''
          )),
          uid, appointmentId: newApptId, template: 'appointment_confirm',
        });
      } catch (e) {
        console.error('Appointment confirm auto-send error:', e.message);
      }
    }

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

      // Explicit-column UPSERT. Unlike the old positional INSERT OR REPLACE,
      // this preserves billing columns (stripe_*, addon_*, sms_consent) that
      // are NOT part of this form — toggling a setting no longer wipes them.
      await env.DB.prepare(
        `INSERT INTO settings (
          user_id, business_name, forwarding_number, welcome_message,
          working_hours, industry, service_area, service_description,
          notify_sms, notify_email, notify_urgent_only,
          google_calendar_api_key, google_calendar_id,
          buffer_min, week_start_day, default_duration_min
        ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
        ON CONFLICT(user_id) DO UPDATE SET
          business_name = excluded.business_name,
          forwarding_number = excluded.forwarding_number,
          welcome_message = excluded.welcome_message,
          working_hours = excluded.working_hours,
          industry = excluded.industry,
          service_area = excluded.service_area,
          service_description = excluded.service_description,
          notify_sms = excluded.notify_sms,
          notify_email = excluded.notify_email,
          notify_urgent_only = excluded.notify_urgent_only,
          google_calendar_api_key = excluded.google_calendar_api_key,
          google_calendar_id = excluded.google_calendar_id,
          buffer_min = excluded.buffer_min,
          week_start_day = excluded.week_start_day,
          default_duration_min = excluded.default_duration_min`
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

    if (!row) return json({ addons: addonFlagsFromSettings(null), vapi_phone_number: null, vapi_phone_number_id: null, vapi_assistant_id: null });

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
      // Billing / add-on state surfaced to the frontend.
      stripe_customer_id: row.stripe_customer_id || null,
      stripe_subscription_id: row.stripe_subscription_id || null,
      stripe_plan: row.stripe_plan || 'base',
      addons: addonFlagsFromSettings(row),
      // Vapi AI voice status — whether Emma has a live number/assistant yet.
      vapi_phone_number: row.vapi_phone_number || null,
      vapi_phone_number_id: row.vapi_phone_number_id || null,
      vapi_assistant_id: row.vapi_assistant_id || null,
    });
  } catch (e) {
    console.error('Settings error:', e);
    return apiError('Could not load settings', 500);
  }
}

// ── Stripe add-on toggle ──────────────────────────────────────────────
// POST /api/settings/addon  body: { addon, enabled }
//  - Persists the enabled flag on the settings row immediately (local UX),
//    then best-effort syncs to Stripe: adding the Price as a SubscriptionItem
//    when enabling, removing it when disabling. If Stripe is unconfigured the
//    flag still flips and we return a clear message. Returns { ok, message }.
async function handleAddonToggle(request, env, uid) {
  try {
    const body = await request.json().catch(() => ({}));
    const addonKey = String(body.addon || '').toLowerCase();
    const enabled = !!body.enabled;
    const addons = getAddons(env);
    const def = addons[addonKey];
    if (!def) return apiError(`Unknown add-on: ${body.addon}`);

    const settings = await env.DB.prepare(
      'SELECT * FROM settings WHERE user_id = ?'
    ).bind(uid).first();

    // Ensure a settings row exists before we update it.
    if (!settings) {
      await env.DB.prepare(
        'INSERT INTO settings (user_id, stripe_plan) VALUES (?, ?) ' +
        'ON CONFLICT(user_id) DO NOTHING'
      ).bind(uid, 'base').run();
    }

    // 1) Flip the local flag first so the UI is responsive even if Stripe
    //    is slow or unconfigured.
    await env.DB.prepare(
      `UPDATE settings SET ${def.column} = ? WHERE user_id = ?`
    ).bind(enabled ? 1 : 0, uid).run();

    let message;
    if (!stripeConfigured(env)) {
      // No Stripe keys — feature toggles locally only. The flag is already set.
      message = enabled
        ? `${def.label} enabled (local only — Stripe not configured).`
        : `${def.label} disabled (local only — Stripe not configured).`;
    } else if (!def.priceId) {
      // Keys exist but this add-on's Price ID wasn't set in env. Don't fail the
      // toggle — just inform. STRIPE_PRICE_<KEY> needs to be added.
      message = enabled
        ? `${def.label} enabled. Add STRIPE_PRICE_${addonKey.toUpperCase()} to sync billing.`
        : `${def.label} disabled. Add STRIPE_PRICE_${addonKey.toUpperCase()} to sync billing.`;
    } else {
      // 2) Sync to Stripe. We look up the customer/subscription; if missing we
      //    can't attach items yet (the user must complete Checkout first), so
      //    we report that the change will apply on next checkout/subscription.
      const custId = settings && settings.stripe_customer_id;
      const subId = settings && settings.stripe_subscription_id;
      if (!custId || !subId) {
        message = enabled
          ? `${def.label} enabled. You'll be billed when your subscription starts.`
          : `${def.label} disabled.`;
      } else {
        message = await syncAddonToStripe(env, subId, def, enabled);
      }
    }

    // Return the freshly computed addon map so the UI can reconcile.
    const updated = await env.DB.prepare(
      'SELECT * FROM settings WHERE user_id = ?'
    ).bind(uid).first();
    return json({
      ok: true,
      message,
      addons: addonFlagsFromSettings(updated),
    });
  } catch (e) {
    console.error('Addon toggle error:', e);
    return apiError('Could not update add-on', 500);
  }
}

// Apply an add-on enable/disable to an existing Stripe Subscription.
// - enable  → add a SubscriptionItem with this Price (prorated).
// - disable → remove the matching SubscriptionItem.
// Returns a human-readable message. Never throws.
async function syncAddonToStripe(env, subscriptionId, def, enabled) {
  const sub = await stripeRequest(env, `/v1/subscriptions/${subscriptionId}`, { method: 'GET' });
  if (!sub.ok) {
    return enabled
      ? `${def.label} enabled locally. Stripe sync will retry later.`
      : `${def.label} disabled locally. Stripe sync will retry later.`;
  }
  const items = (sub.data.items && sub.data.items.data) || [];

  if (enabled) {
    // Already on this subscription? Nothing to do.
    const existing = items.find((it) => it.price && it.price.id === def.priceId);
    if (existing) return `${def.label} is already on your plan.`;
    const added = await stripeRequest(env, `/v1/subscription_items`, {
      method: 'POST',
      form: stripeEncode({
        subscription: subscriptionId,
        price: def.priceId,
        quantity: 1,
      }),
    });
    return added.ok
      ? `${def.label} added to your plan — $${def.price.toFixed(2)}/mo (prorated).`
      : `${def.label} enabled locally. Stripe update failed: ${added.error}`;
  } else {
    const target = items.find((it) => it.price && it.price.id === def.priceId);
    if (!target) return `${def.label} removed.`;
    const removed = await stripeRequest(env, `/v1/subscription_items/${target.id}`, {
      method: 'DELETE',
    });
    return removed.ok
      ? `${def.label} removed from your plan.`
      : `${def.label} disabled locally. Stripe update failed: ${removed.error}`;
  }
}

// ── Stripe Checkout ──────────────────────────────────────────────────
// POST /api/stripe/checkout  body: { plan?, addons?: string[] }
// Creates a Stripe Checkout Session (mode=subscription) for the base plan
// plus any requested add-on Prices, and returns the URL to redirect to.
// Falls back gracefully if Stripe isn't configured.
async function handleStripeCheckout(request, env, uid) {
  try {
    if (!stripeConfigured(env)) {
      return json({
        ok: false,
        error: 'Stripe is not configured yet. Add STRIPE_SECRET_KEY to enable checkout.',
      });
    }

    const body = await request.json().catch(() => ({}));
    const addons = getAddons(env);

    // Resolve the user row (need email + name) and the settings row (customer id).
    const user = await env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(uid).first();
    if (!user) return apiError('User not found', 401);
    const settings = await env.DB.prepare('SELECT * FROM settings WHERE user_id = ?').bind(uid).first();

    // Base plan Price. Default to STRIPE_PRICE_BASE if set; otherwise the
    // session is add-ons only.
    const basePriceId = env.STRIPE_PRICE_BASE || null;
    const requestedAddons = Array.isArray(body.addons) ? body.addons : [];
    const lineItems = [];
    if (basePriceId) {
      lineItems.push({ price: basePriceId, quantity: 1 });
    }
    for (const key of requestedAddons) {
      const def = addons[String(key).toLowerCase()];
      if (def && def.priceId) lineItems.push({ price: def.priceId, quantity: 1 });
    }
    if (lineItems.length === 0) {
      return apiError('No billable items. Set STRIPE_PRICE_BASE and/or add-on price IDs.');
    }

    // Reuse the Stripe Customer if we already have one, else create it now so
    // the webhook can tie the checkout back to this account.
    let customerId = settings && settings.stripe_customer_id;
    if (!customerId) {
      const created = await stripeRequest(env, '/v1/customers', {
        method: 'POST',
        form: stripeEncode({
          email: user.email,
          name: user.company || user.name || '',
          metadata: { branchlive_user_id: String(uid) },
        }),
      });
      if (!created.ok) return apiError(created.error || 'Could not create Stripe customer', 502);
      customerId = created.data.id;
      await env.DB.prepare(
        'UPDATE settings SET stripe_customer_id = ? WHERE user_id = ?'
      ).bind(customerId, uid).run();
    }

    const origin = request.headers.get('Origin') || 'https://branchlive.com';
    const session = await stripeRequest(env, '/v1/checkout/sessions', {
      method: 'POST',
      form: stripeEncode({
        customer: customerId,
        mode: 'subscription',
        'line_items': lineItems,
        success_url: `${origin}/dashboard?checkout=success`,
        cancel_url: `${origin}/dashboard?checkout=cancelled`,
        metadata: { branchlive_user_id: String(uid) },
      }),
    });
    if (!session.ok) return apiError(session.error || 'Could not create Checkout Session', 502);

    return json({ ok: true, url: session.data.url, id: session.data.id });
  } catch (e) {
    console.error('Stripe checkout error:', e);
    return apiError('Could not start checkout', 500);
  }
}

// ── Tenant provisioning on checkout ───────────────────────────────────
// Called from the checkout.session.completed webhook branch AFTER the Stripe
// Customer/Subscription ids have already been recorded on settings. Creates
// the full tenant footprint (site, settings defaults, referral code, welcome
// email) and flips the subscription to active. Idempotent and best-effort:
// every step is isolated in its own try/catch so one failure never blocks the
// others, and Stripe retries are safe (existing rows/sent emails are skipped).
// `sessionData` is the Stripe checkout.session object (used for the email
// fallback). Returns { created, skipped } for diagnostics.
async function provisionTenantOnCheckout(env, uid, sessionData) {
  const created = { site: false, settings: false, referral: false, subscription: false, email: false };
  const skipped = {};
  if (!uid) return { created, skipped: { reason: 'no uid' } };

  // Load context — bail only if the account itself doesn't exist (we can't
  // provision without it). Everything else degrades gracefully.
  let user, settings;
  try {
    user = await env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(uid).first();
    settings = await env.DB.prepare('SELECT * FROM settings WHERE user_id = ?').bind(uid).first();
  } catch (e) {
    console.error('provisionTenant(load) error:', e.message);
    return { created, skipped: { reason: 'load failed' } };
  }
  if (!user) return { created, skipped: { reason: 'no user row' } };

  const businessName = (settings && settings.business_name) || user.company || user.name || '';
  const seedName = businessName || user.name || 'affiliate';
  // Prefer the account email; fall back to whatever email Stripe collected at
  // checkout (covers cases where they paid with a different address).
  const email = user.email ||
    (sessionData && sessionData.customer_details && sessionData.customer_details.email) || '';
  const dashboardUrl = 'https://branchlive.com/dashboard';

  // 1) Sites row — slugify the business name, leave unpublished (published=0)
  //    until the owner chooses to publish. Skip if one already exists (retry).
  let siteSlug = null;
  try {
    const existingSite = await env.DB.prepare('SELECT slug FROM sites WHERE user_id = ?').bind(uid).first();
    if (existingSite) {
      siteSlug = existingSite.slug;
      skipped.site = 'exists';
    } else {
      siteSlug = await siteUniqueSlug(env, businessName);
      await env.DB.prepare(
        'INSERT INTO sites (user_id, slug, published, theme) VALUES (?, ?, 0, ?)'
      ).bind(uid, siteSlug, 'modern').run();
      created.site = true;
    }
  } catch (e) {
    console.error('provisionTenant(site) error:', e.message);
  }

  // 2) Settings defaults — ensure a row exists, then set timezone=ET and all
  //    add-ons OFF. Does NOT touch the stripe_* columns (those were just
  //    written by the webhook's UPSERT). The guard INSERT mirrors the one used
  //    by handleSettingsAddonHtmx so we never collide with a concurrent insert.
  try {
    await env.DB.prepare(
      'INSERT INTO settings (user_id, stripe_plan) VALUES (?, ?) ON CONFLICT(user_id) DO NOTHING'
    ).bind(uid, 'base').run();
    await env.DB.prepare(
      `UPDATE settings SET
         timezone = 'America/New_York',
         addon_website = 0, addon_reviews = 0, addon_social = 0,
         addon_blog = 0, addon_email = 0
       WHERE user_id = ?`
    ).bind(uid).run();
    created.settings = true;
  } catch (e) {
    console.error('provisionTenant(settings) error:', e.message);
  }

  // 3) Referral code — reuse the affiliate program so the new tenant can share
  //    /signup?ref=CODE immediately. Skip if they already have an affiliate row.
  try {
    const existingAff = await env.DB.prepare('SELECT id, code FROM affiliate WHERE user_id = ?').bind(uid).first();
    if (existingAff) {
      skipped.referral = 'exists';
    } else {
      const code = await affiliateUniqueCode(env, seedName);
      await env.DB.prepare(
        'INSERT INTO affiliate (user_id, code, name, commission_rate) VALUES (?, ?, ?, 0.20)'
      ).bind(uid, code, seedName).run();
      created.referral = true;
    }
  } catch (e) {
    console.error('provisionTenant(referral) error:', e.message);
  }

  // 4) Trial -> active. checkout.session.completed means they paid, so flip
  //    the subscription row to active (it was seeded 'trial' at signup). No
  //    data is reset — leads, settings, calendar, photos all carry over.
  try {
    await env.DB.prepare(
      'UPDATE subscriptions SET status = ?, plan = ? WHERE user_id = ?'
    ).bind('active', 'base', uid).run();
    created.subscription = true;
  } catch (e) {
    console.error('provisionTenant(subscription) error:', e.message);
  }

  // 5) Welcome email — dedupe against email_log so a Stripe retry never sends
  //    a second welcome. sendAutoEmail logs the send (success OR failure) to
  //    email_log, satisfying the "if email fails, log it" requirement.
  try {
    const alreadySent = await env.DB.prepare(
      'SELECT id FROM email_log WHERE user_id = ? AND template = ? LIMIT 1'
    ).bind(uid, 'welcome_checkout').first();
    if (alreadySent) {
      skipped.email = 'already sent';
    } else if (email) {
      await sendAutoEmail(env, {
        to: email,
        subject: "Welcome to Branch Live — here's what's next",
        html: emailShell(onboardingWelcomeEmailContent(user.name || user.company, dashboardUrl, siteSlug)),
        uid,
        template: 'welcome_checkout',
      });
      created.email = true;
    } else {
      skipped.email = 'no email';
    }
  } catch (e) {
    console.error('provisionTenant(email) error:', e.message);
  }

  return { created, skipped };
}

// ── Stripe Webhook ───────────────────────────────────────────────────
// POST /api/stripe/webhook  (PUBLIC — no Bearer auth; verified by signature)
// Verifies the Stripe-Signature header, then reconciles the relevant events
// (checkout completed, subscription updated/deleted) into the settings table.
// Always returns 200 to Stripe for a verified event (so it stops retrying),
// even if our DB update is best-effort.
async function handleStripeWebhook(request, env) {
  try {
    const rawBody = await request.text();
    const sig = request.headers.get('Stripe-Signature') || '';
    const verified = await verifyStripeSignature(rawBody, sig, env.STRIPE_WEBHOOK_SECRET);
    if (!verified.ok) {
      // 400 tells Stripe this delivery was bad; it will not retry on 4xx.
      return json({ ok: false, error: verified.error }, 400);
    }

    let event;
    try {
      event = JSON.parse(rawBody);
    } catch (e) {
      return json({ ok: false, error: 'Invalid JSON payload' }, 400);
    }

    const type = event.type;
    const data = event.data && event.data.object;

    // Resolve the local user from the Stripe Customer id or metadata.
    async function resolveUserId(obj) {
      const custId = obj && (obj.customer || (obj.customer_details && obj.customer_details.customer));
      if (custId) {
        const row = await env.DB.prepare(
          'SELECT user_id FROM settings WHERE stripe_customer_id = ?'
        ).bind(custId).first();
        if (row) return row.user_id;
      }
      const metaId = obj && obj.metadata && (obj.metadata.branchlive_user_id || obj.metadata.userId);
      if (metaId) {
        const row = await env.DB.prepare(
          'SELECT user_id FROM settings WHERE user_id = ?'
        ).bind(parseInt(metaId, 10)).first();
        if (row) return row.user_id;
      }
      return null;
    }

    if (type === 'checkout.session.completed') {
      const uid = await resolveUserId(data);
      if (uid) {
        await env.DB.prepare(
          `INSERT INTO settings (user_id, stripe_customer_id, stripe_subscription_id, stripe_plan)
           VALUES (?, ?, ?, ?)
           ON CONFLICT(user_id) DO UPDATE SET
             stripe_customer_id = COALESCE(excluded.stripe_customer_id, settings.stripe_customer_id),
             stripe_subscription_id = COALESCE(excluded.stripe_subscription_id, settings.stripe_subscription_id),
             stripe_plan = 'base'`
        ).bind(uid, data.customer || null, data.subscription || null, 'base').run();
        // Provision the full tenant (site, settings defaults, referral code,
        // welcome email) and convert trial -> active. Idempotent + best-effort:
        // each internal step is isolated, and it never throws to the caller, so
        // a provisioning failure can't block the 200 ack to Stripe.
        await provisionTenantOnCheckout(env, uid, data);
      }
      // Phase 3 conversion: a checkout-collected phone that matches a texted
      // prospect means they signed up. Best-effort fallback (catches cases where
      // the signup-form phone differed from the checkout phone).
      const ckPhone = data && data.customer_details && data.customer_details.phone;
      if (ckPhone) await markProspectSignedUpIfTexted(env, ckPhone);
    } else if (type === 'customer.subscription.updated') {
      const uid = await resolveUserId(data);
      if (uid) {
        // syncAddonsFromSubscription flips the addon_* flags to match the
        // active prices — this is what "enable add-ons selected during checkout"
        // relies on for the trial -> active transition.
        await syncAddonsFromSubscription(env, uid, data);
        await env.DB.prepare(
          'UPDATE settings SET stripe_subscription_id = ? WHERE user_id = ?'
        ).bind(data.id || null, uid).run();
        // When the subscription flips to active (trial ended, now paying), mark
        // it active locally and send the confirmation email. Deduped against
        // email_log so a Stripe retry never sends it twice.
        if (data && data.status === 'active') {
          try {
            await env.DB.prepare(
              'UPDATE subscriptions SET status = ?, plan = ? WHERE user_id = ?'
            ).bind('active', 'base', uid).run();
          } catch (e) {
            console.error('Subscription status update error:', e.message);
          }
          try {
            const alreadySent = await env.DB.prepare(
              'SELECT id FROM email_log WHERE user_id = ? AND template = ? LIMIT 1'
            ).bind(uid, 'trial_active').first();
            if (!alreadySent) {
              const u = await env.DB.prepare('SELECT email, name, company FROM users WHERE id = ?').bind(uid).first();
              const email = u && u.email;
              if (email) {
                await sendAutoEmail(env, {
                  to: email,
                  subject: 'Your Branch Live trial is now active',
                  html: emailShell(trialActiveEmailContent((u && (u.name || u.company)) || 'there', 'https://branchlive.com/dashboard')),
                  uid,
                  template: 'trial_active',
                });
              }
            }
          } catch (e) {
            console.error('Trial-active email error:', e.message);
          }
        }
      }
    } else if (type === 'customer.subscription.deleted') {
      const uid = await resolveUserId(data);
      if (uid) {
        // Subscription gone → revoke all add-ons and clear the link.
        await env.DB.prepare(
          `UPDATE settings SET
             addon_website = 0, addon_reviews = 0, addon_social = 0,
             addon_blog = 0, addon_email = 0,
             stripe_subscription_id = NULL WHERE user_id = ?`
        ).bind(uid).run();
      }
    }
    // Unhandled event types are acknowledged so Stripe stops retrying.
    return json({ ok: true, received: type });
  } catch (e) {
    console.error('Stripe webhook error:', e);
    return json({ ok: false, error: 'Webhook handler failed' }, 500);
  }
}

// Reconcile a Stripe Subscription's items into our addon_* flags by matching
// each item's Price id to the configured add-on price id. Best-effort: if a
// price isn't mapped we simply skip it.
async function syncAddonsFromSubscription(env, uid, subscription) {
  const items = (subscription && subscription.items && subscription.items.data) || [];
  const addons = getAddons(env);
  const activePriceIds = new Set();
  for (const it of items) {
    if (it && it.price && it.price.id) activePriceIds.add(it.price.id);
  }
  const updates = {};
  for (const [key, def] of Object.entries(addons)) {
    updates[def.column] = def.priceId && activePriceIds.has(def.priceId) ? 1 : 0;
  }
  await env.DB.prepare(
    `UPDATE settings SET
       addon_website = ?, addon_reviews = ?, addon_social = ?,
       addon_blog = ?, addon_email = ? WHERE user_id = ?`
  ).bind(
    updates.addon_website, updates.addon_reviews, updates.addon_social,
    updates.addon_blog, updates.addon_email, uid
  ).run();
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
      'INSERT INTO knowledge (user_id, category, item, price, notes) VALUES (?, ?, ?, ?, ?)'
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
      'INSERT INTO knowledge (user_id, category, item, price, notes) VALUES (?, ?, ?, ?, ?)'
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
// JOB PHOTOS (before / during / after)
// ═══════════════════════════════════════════════════════════════════════

const PHOTO_TYPES = new Set(['before', 'during', 'after']);
const PHOTO_MAX_BYTES = 300 * 1024;

async function handlePhotoUpload(request, env, uid) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    if (!file || typeof file.arrayBuffer !== 'function') {
      return apiError('No file uploaded');
    }
    const bytes = await file.arrayBuffer();
    if (bytes.byteLength > PHOTO_MAX_BYTES) {
      return apiError('Image too large (max ~300KB). Try a smaller photo.');
    }
    const rawType = String(formData.get('type') || 'during').toLowerCase().trim();
    const type = PHOTO_TYPES.has(rawType) ? rawType : 'during';
    const leadId = parseInt(formData.get('lead_id'), 10) || null;
    const apptId = parseInt(formData.get('appointment_id'), 10) || null;
    const caption = String(formData.get('caption') || '').slice(0, 280);
    const mime = (file.type && file.type.startsWith('image/')) ? file.type : 'image/jpeg';
    const u8 = new Uint8Array(bytes);
    let bin = '';
    for (let i = 0; i < u8.length; i += 0x8000) {
      bin += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000));
    }
    const dataUri = `data:${mime};base64,${btoa(bin)}`;
    const result = await env.DB.prepare(
      'INSERT INTO photos (lead_id, appointment_id, user_id, data, caption, type, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).bind(leadId, apptId, uid, dataUri, caption, type, nowISO()).run();
    return json({ ok: true, id: result.meta && result.meta.last_row_id });
  } catch (e) {
    console.error('Photo upload error:', e);
    return apiError('Could not upload photo', 500);
  }
}

async function handlePhotosList(request, env, uid) {
  try {
    const url = new URL(request.url);
    const leadId = url.searchParams.get('lead_id');
    const apptId = url.searchParams.get('appointment_id');
    let sql = 'SELECT id, lead_id, appointment_id, caption, type, created_at, data FROM photos WHERE user_id = ?';
    const binds = [uid];
    if (leadId) { sql += ' AND lead_id = ?'; binds.push(parseInt(leadId, 10)); }
    if (apptId) { sql += ' AND appointment_id = ?'; binds.push(parseInt(apptId, 10)); }
    sql += ' ORDER BY created_at DESC';
    const { results } = await env.DB.prepare(sql).bind(...binds).all();
    return json((results || []).map(p => ({
      id: p.id, lead_id: p.lead_id, appointment_id: p.appointment_id,
      caption: p.caption, type: p.type, created_at: p.created_at, data: p.data,
    })));
  } catch (e) {
    console.error('Photos list error:', e);
    return apiError('Could not load photos', 500);
  }
}

// ── Cookie-authed photo handlers for the website builder ──
// The builder page (/p/website) is cookie-authed (no Bearer token available
// client-side), so upload/tag/delete go through these -htmx wrappers. They
// share the base64 + INSERT logic with handlePhotoUpload but resolve the user
// from the session cookie. Keep base64 data URIs (no external storage Phase 3).
async function handlePhotoUploadHtmx(request, env, uid) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    if (!file || typeof file.arrayBuffer !== 'function') {
      return json({ ok: false, error: 'No file uploaded' });
    }
    const bytes = await file.arrayBuffer();
    if (bytes.byteLength > PHOTO_MAX_BYTES) {
      return json({ ok: false, error: 'Image too large (max ~300KB). Try a smaller photo.' });
    }
    const rawType = String(formData.get('type') || 'after').toLowerCase().trim();
    const type = PHOTO_TYPES.has(rawType) ? rawType : 'after';
    const caption = String(formData.get('caption') || '').slice(0, 280);
    const mime = (file.type && file.type.startsWith('image/')) ? file.type : 'image/jpeg';
    const u8 = new Uint8Array(bytes);
    let bin = '';
    for (let i = 0; i < u8.length; i += 0x8000) {
      bin += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000));
    }
    const dataUri = `data:${mime};base64,${btoa(bin)}`;
    const result = await env.DB.prepare(
      'INSERT INTO photos (lead_id, appointment_id, user_id, data, caption, type, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).bind(null, null, uid, dataUri, caption, type, nowISO()).run();
    return json({ ok: true, id: result.meta && result.meta.last_row_id });
  } catch (e) {
    console.error('Photo upload htmx error:', e);
    return json({ ok: false, error: 'Could not upload photo' });
  }
}

// Change a photo's tag (before/after/during). Owns the row by user_id so a
// user can't retag another business's photo.
async function handlePhotoTagHtmx(request, env, uid, body) {
  try {
    const id = parseInt(body && body.id, 10);
    const rawType = String((body && body.type) || '').toLowerCase().trim();
    const type = PHOTO_TYPES.has(rawType) ? rawType : 'after';
    if (!id) return json({ ok: false, error: 'Invalid photo' });
    const r = await env.DB.prepare('UPDATE photos SET type = ? WHERE id = ? AND user_id = ?').bind(type, id, uid).run();
    return json({ ok: (r.meta && r.meta.changes > 0) });
  } catch (e) {
    console.error('Photo tag htmx error:', e);
    return json({ ok: false, error: 'Could not update tag' });
  }
}

// Delete a photo. Owns the row by user_id.
async function handlePhotoDeleteHtmx(request, env, uid, body) {
  try {
    const id = parseInt(body && body.id, 10);
    if (!id) return json({ ok: false, error: 'Invalid photo' });
    const r = await env.DB.prepare('DELETE FROM photos WHERE id = ? AND user_id = ?').bind(id, uid).run();
    return json({ ok: (r.meta && r.meta.changes > 0) });
  } catch (e) {
    console.error('Photo delete htmx error:', e);
    return json({ ok: false, error: 'Could not remove photo' });
  }
}

// ═══════════════════════════════════════════════════════════════════════
// PUBLIC WEBSITES (/s/{slug}) — auto-built from settings + knowledge base
// ═══════════════════════════════════════════════════════════════════════

async function handleSitesPublish(request, env, uid) {
  try {
    const body = await request.json().catch(() => ({}));
    const settings = await env.DB.prepare('SELECT business_name FROM settings WHERE user_id = ?').bind(uid).first();
    const businessName = (settings && settings.business_name) || '';
    let site = await env.DB.prepare('SELECT * FROM sites WHERE user_id = ?').bind(uid).first();
    if (!site) {
      const slug = await siteUniqueSlug(env, businessName);
      await env.DB.prepare('INSERT INTO sites (user_id, slug, published, theme) VALUES (?, ?, 1, ?)').bind(uid, slug, 'modern').run();
      site = await env.DB.prepare('SELECT * FROM sites WHERE user_id = ?').bind(uid).first();
    } else if (!site.slug) {
      const slug = await siteUniqueSlug(env, businessName);
      await env.DB.prepare('UPDATE sites SET slug = ?, published = 1 WHERE id = ?').bind(slug, site.id).run();
      site = await env.DB.prepare('SELECT * FROM sites WHERE id = ?').bind(site.id).first();
    } else {
      const publish = body.published === false ? 0 : 1;
      await env.DB.prepare('UPDATE sites SET published = ? WHERE id = ?').bind(publish, site.id).run();
      site.published = publish;
    }
    const origin = new URL(request.url).origin;
    return json({ ok: true, slug: site.slug, published: site.published ? true : false, url: `${origin}/s/${site.slug}` });
  } catch (e) {
    console.error('Sites publish error:', e);
    return apiError('Could not publish site', 500);
  }
}

async function handleSitesStatus(request, env, uid) {
  try {
    const site = await env.DB.prepare('SELECT * FROM sites WHERE user_id = ?').bind(uid).first();
    if (!site) return json(null);
    const origin = new URL(request.url).origin;
    const cfg = normalizeSiteConfig(site, {});
    const settings = await env.DB.prepare('SELECT addon_website FROM settings WHERE user_id = ?').bind(uid).first();
    return json({
      slug: site.slug, subdomain: site.subdomain, custom_domain: site.custom_domain,
      published: site.published ? true : false, theme: site.theme,
      url: site.slug ? `${origin}/s/${site.slug}` : null,
      template: cfg.template, accent: cfg.accent, headline: cfg.headline,
      sections: cfg.sections,
      addonWebsite: !!(settings && settings.addon_website),
    });
  } catch (e) {
    console.error('Sites status error:', e);
    return apiError('Could not load site', 500);
  }
}

// POST /api/sites/config — persist builder personalization (template, accent,
// headline, section toggles). Validates template against the whitelist and
// coerces accent through normalizeAccent so no raw CSS can be stored. The
// `theme` column is mirrored so legacy lookups keep working. Requires a site
// row; publish flow creates one if missing.
async function handleSitesConfig(request, env, uid) {
  try {
    const body = await request.json().catch(() => ({}));
    const settings = await env.DB.prepare('SELECT business_name FROM settings WHERE user_id = ?').bind(uid).first();
    const businessName = (settings && settings.business_name) || '';
    let site = await env.DB.prepare('SELECT * FROM sites WHERE user_id = ?').bind(uid).first();
    if (!site) {
      const slug = await siteUniqueSlug(env, businessName);
      await env.DB.prepare('INSERT INTO sites (user_id, slug, published, theme) VALUES (?, ?, 0, ?)').bind(uid, slug, 'modern').run();
      site = await env.DB.prepare('SELECT * FROM sites WHERE user_id = ?').bind(uid).first();
    }
    if (!site.slug) {
      const slug = await siteUniqueSlug(env, businessName);
      await env.DB.prepare('UPDATE sites SET slug = ? WHERE id = ?').bind(slug, site.id).run();
      site = await env.DB.prepare('SELECT * FROM sites WHERE id = ?').bind(site.id).first();
    }
    // Validate + coerce inputs.
    const template = SITE_TEMPLATES.includes(body.template) ? body.template : 'modern';
    const accent = normalizeAccent(body.accent);
    const headline = (body.headline == null || body.headline === '') ? null : String(body.headline).slice(0, 140);
    const sections = {};
    for (const k of SITE_SECTIONS) sections[k] = true;
    if (body.sections && typeof body.sections === 'object') {
      for (const k of SITE_SECTIONS) if (typeof body.sections[k] === 'boolean') sections[k] = body.sections[k];
    }
    const configBlob = JSON.stringify({ template, accent, headline, sections });
    await env.DB.prepare(
      'UPDATE sites SET config = ?, headline = ?, accent = ?, sections = ?, theme = ? WHERE id = ?'
    ).bind(configBlob, headline, accent, JSON.stringify(sections), template, site.id).run();
    return json({ ok: true, template, accent, headline, sections });
  } catch (e) {
    console.error('Sites config error:', e);
    return apiError('Could not save site configuration', 500);
  }
}

// ── Website Builder: template engine ──────────────────────────────────
// The five published templates. Each is a render function (data, cfg) =>
// full HTML document. `cfg` is already normalized by normalizeSiteConfig().
// `data` is the normalized payload from buildSiteData(). Every template
// honors the same config knobs (accent CSS var, section toggles, headline)
// and shares the SEO head from seoHead() so they're consistent.
const SITE_TEMPLATES = ['modern', 'warmcraft', 'boldimpact', 'softelegance', 'minimalgrid'];

// Friendly metadata for the builder UI's template picker.
const SITE_TEMPLATE_META = {
  modern:      { label: 'Modern Clean',  blurb: 'White space, bold typography, hero image.', best: 'Professional services, real estate' },
  warmcraft:   { label: 'Warm Craft',    blurb: 'Earth tones, texture, before/after focus.', best: 'Remodeling, masonry, hardscape' },
  boldimpact:  { label: 'Bold Impact',   blurb: 'Dark bg, high contrast, big statements.',  best: 'HVAC, plumbing, emergency services' },
  softelegance:{ label: 'Soft Elegance', blurb: 'Light, feminine, curved edges.',           best: 'Salons, estheticians, boutiques' },
  minimalgrid: { label: 'Minimal Grid',  blurb: 'Photo-forward, gallery-driven.',           best: 'Photographers, landscapers, designers' },
};

// The section toggle keys a business can flip on/off in the builder. Order
// here is the order shown in the builder UI. `always` sections (hero, footer)
// are not toggleable.
const SITE_SECTIONS = ['services', 'about', 'gallery', 'reviews', 'blog', 'booking', 'contact', 'serviceArea', 'social'];

// Default accent palette offered in the builder. Amber is the brand default;
// the rest are curated to read well across all five templates.
const SITE_ACCENTS = ['#d4a574', '#8b5cf6', '#00d4aa', '#3b82f6', '#ef4444', '#0d1117'];

// Normalize hex-ish color → #rrggbb. Falls back to amber. Used for both the
// stored accent and live-preview query overrides so a malformed value can
// never inject CSS/attributes.
function normalizeAccent(raw) {
  const v = String(raw || '').trim();
  if (/^#[0-9a-fA-F]{6}$/.test(v)) return v.toLowerCase();
  if (/^#[0-9a-fA-F]{3}$/.test(v)) return ('#' + v.slice(1).split('').map(c => c + c).join('')).toLowerCase();
  return '#d4a574';
}

// Coerce a raw site row + optional query overrides into a clean config. This
// is the single source of truth for "what does this site look like": old rows
// (null config) collapse to modern + all-sections-on, so the migration is a
// no-op for existing published sites. Never throws.
function normalizeSiteConfig(site, query) {
  const q = query || {};
  let cfg = {};
  try { cfg = site && site.config ? JSON.parse(site.config) : {}; } catch (e) { cfg = {}; }
  let sections = {};
  try { sections = site && site.sections ? JSON.parse(site.sections) : {}; } catch (e) { sections = {}; }
  // template: explicit query > stored config > legacy `theme` column > modern.
  // NOTE: URLSearchParams.get() returns null for absent params, so we treat
  // null the same as "not provided" everywhere below — otherwise an unset
  // ?headline= would clobber the stored headline with null.
  const storedTpl = cfg.template || (site && site.theme) || 'modern';
  const template = SITE_TEMPLATES.includes(q.template) ? q.template
    : SITE_TEMPLATES.includes(storedTpl) ? storedTpl : 'modern';
  // accent: query > config > column > amber.
  const accent = normalizeAccent(q.accent || cfg.accent || (site && site.accent) || '#d4a574');
  // headline: query > config > column > null (null ⇒ derive from business name).
  const headlineRaw = q.headline != null ? q.headline
    : (cfg.headline !== undefined ? cfg.headline : (site && site.headline));
  const headline = headlineRaw == null || headlineRaw === '' ? null : String(headlineRaw).slice(0, 140);
  // sections: start from defaults (all on), overlay stored, overlay query.
  const sec = {};
  for (const k of SITE_SECTIONS) sec[k] = true;
  for (const k of Object.keys(sections || {})) if (SITE_SECTIONS.includes(k)) sec[k] = !!sections[k];
  if (q.sections) {
    // ?sections=off,hero=on turns everything off then enables listed keys.
    const parts = String(q.sections).split(',');
    if (parts.includes('off')) for (const k of SITE_SECTIONS) sec[k] = false;
    for (const p of parts) {
      const [key, val] = p.split('=');
      if (SITE_SECTIONS.includes(key)) sec[key] = val !== '0' && val !== 'false' && val !== 'off';
    }
  }
  return { template, accent, headline, sections: sec };
}

// ── Review Monitoring (Google Places API) ──────────────────────────────
// fetchGoogleReviews pulls live reviews from the legacy Google Places Details
// API (maps.googleapis.com/.../place/details/json). Gracefully degrades: when
// GOOGLE_PLACES_API_KEY isn't set it returns an empty array + no error, so the
// Review Monitoring add-on still works with manually-seeded rows. Caps at 5
// reviews per fetch. Never throws — callers (sync, buildSiteData) can await it
// unconditionally.
//
// Response shape (legacy API):
//   result.reviews[] = { author_name, rating, text, time, profile_photo_url }
async function fetchGoogleReviews(env, placeId) {
  const key = env.GOOGLE_PLACES_API_KEY;
  if (!key || !placeId) return [];
  try {
    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${encodeURIComponent(placeId)}&fields=reviews&key=${encodeURIComponent(key)}`;
    const resp = await fetch(url);
    if (!resp.ok) {
      console.log('Google Places API HTTP error:', resp.status);
      return [];
    }
    const data = await resp.json();
    // Legacy API surfaces API/key errors as { status: 'INVALID_REQUEST' | ... }
    // with no result.reviews. Treat anything without a reviews array as empty.
    const raw = (data && data.result && Array.isArray(data.result.reviews))
      ? data.result.reviews
      : [];
    // Normalize + cap at 5 newest reviews.
    return raw.slice(0, 5).map(r => ({
      author_name: r.author_name || 'Anonymous',
      rating: Number.isFinite(r.rating) ? r.rating : 5,
      text: r.text || '',
      time: r.time || null,
      profile_photo_url: r.profile_photo_url || '',
    }));
  } catch (e) {
    console.error('fetchGoogleReviews error:', e);
    return [];
  }
}

// syncReviews pulls fresh Google reviews for one business and inserts any that
// aren't already cached. Dedupes by the synthetic google_review_id
// (author|time — the legacy API has no stable per-review id). Returns a small
// status object for the sync button/UI. Never throws.
async function syncReviews(env, uid) {
  const settings = await env.DB.prepare(
    'SELECT google_place_id FROM settings WHERE user_id = ?'
  ).bind(uid).first();
  if (!settings || !settings.google_place_id) {
    return { synced: 0, message: 'No Google Place ID set — add one in Settings.' };
  }

  const reviews = await fetchGoogleReviews(env, settings.google_place_id);
  let synced = 0;

  for (const r of reviews) {
    const gid = r.author_name + '|' + (r.time || '');
    // Dedupe by google_review_id (UNIQUE on the table backs this up, but we
    // check first so we can count "new" inserts accurately).
    const existing = await env.DB.prepare(
      'SELECT id FROM reviews WHERE user_id = ? AND google_review_id = ?'
    ).bind(uid, gid).first();
    if (existing) continue;

    try {
      await env.DB.prepare(
        'INSERT INTO reviews (user_id, author_name, rating, text, google_review_id, profile_photo_url, reviewed_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
      ).bind(
        uid,
        r.author_name,
        r.rating,
        r.text,
        gid,
        r.profile_photo_url || '',
        r.time ? new Date(r.time * 1000).toISOString() : null
      ).run();
      synced++;
    } catch (e) {
      // UNIQUE collision or other constraint — skip; not fatal.
      console.log('syncReviews insert skipped:', e.message);
    }
  }

  if (!reviews.length) {
    return { synced: 0, message: 'No reviews found on Google yet (or API key not set).' };
  }
  return { synced, message: synced ? `Synced ${synced} new review${synced === 1 ? '' : 's'}.` : 'All reviews already up to date.' };
}

// POST /api/reviews/sync — cookie-authed (the builder button has no Bearer
// token). Requires the Review Monitoring add-on (addon_reviews) to be active.
// Calls syncReviews() and returns a small status object for the button label.
async function handleReviewsSyncHtmx(request, env, uid) {
  try {
    const settings = await env.DB.prepare(
      'SELECT addon_reviews, google_place_id FROM settings WHERE user_id = ?'
    ).bind(uid).first();
    if (!settings || !settings.addon_reviews) {
      return json({ ok: false, synced: 0, message: 'Enable the Review Monitoring add-on first.' });
    }
    const result = await syncReviews(env, uid);
    return json({ ok: true, synced: result.synced, message: result.message });
  } catch (e) {
    console.error('Reviews sync error:', e);
    return json({ ok: false, synced: 0, message: 'Sync failed — please try again.' });
  }
}

// POST /api/cron/reviews-sync — bulk sync every business with the Review
// Monitoring add-on on AND a Google Place ID set. Intended for an external
// cron service (no auth beyond an optional shared secret). One failure never
// aborts the batch; returns a per-account summary.
async function handleReviewsSyncCron(request, env) {
  const secret = request.headers.get('x-cron-secret');
  if (env.CRON_SECRET && secret !== env.CRON_SECRET) {
    return json({ ok: false, error: 'Unauthorized' }, 401);
  }
  try {
    const { results } = await env.DB.prepare(
      'SELECT user_id FROM settings WHERE addon_reviews = 1 AND google_place_id IS NOT NULL AND google_place_id != ""'
    ).all();
    const accounts = results || [];
    const summary = [];
    let totalSynced = 0;
    for (const acct of accounts) {
      try {
        const r = await syncReviews(env, acct.user_id);
        totalSynced += r.synced;
        summary.push({ user_id: acct.user_id, synced: r.synced });
      } catch (e) {
        summary.push({ user_id: acct.user_id, synced: 0, error: String(e.message || e) });
      }
    }
    return json({ ok: true, accounts: accounts.length, synced: totalSynced, summary });
  } catch (e) {
    console.error('Reviews cron error:', e);
    return json({ ok: false, error: 'Cron sync failed' }, 500);
  }
}

// One batched loader for everything a public site needs. Pulls settings,
// services/pricing (knowledge), appointment types, the 12 newest gallery
// photos (before/after/during), and — only when the AI Blog add-on is on —
// the 3 latest posts. Returns a normalized object; never throws.
// One batched loader for everything a public site needs. Pulls settings,
// services/pricing (knowledge), appointment types, the 12 newest gallery
// photos (before/after/during), and — only when the AI Blog add-on is on —
// the 3 latest posts. Returns a normalized object; never throws.
//
// opts.previewAddons = { reviews, blog, social } — when a section's add-on
// isn't purchased but the owner is previewing it (toggled ON in the builder),
// inject SAMPLE data + flag data.previewing.<key> so templates append a lock
// overlay. Sample data is obviously-generic (sampleReviews/sampleBlogPosts).
async function buildSiteData(env, uid, opts) {
  const previewAddons = (opts && opts.previewAddons) || {};
  const [settings, kb, apptTypes, photos, posts, revRows] = await Promise.all([
    env.DB.prepare('SELECT * FROM settings WHERE user_id = ?').bind(uid).first(),
    env.DB.prepare('SELECT category, item, price, notes FROM knowledge WHERE user_id = ? ORDER BY category, item LIMIT 60').bind(uid).all(),
    env.DB.prepare('SELECT name, duration_min FROM appointment_types WHERE user_id = ? ORDER BY name').bind(uid).all(),
    env.DB.prepare('SELECT id, data, caption, type FROM photos WHERE user_id = ? ORDER BY created_at DESC LIMIT 12').bind(uid).all(),
    env.DB.prepare('SELECT title, slug, content, published_at FROM business_blog_posts WHERE user_id = ? AND status = ? ORDER BY published_at DESC LIMIT 3').bind(uid, 'published').all(),
    env.DB.prepare('SELECT author_name, rating, text, profile_photo_url, reviewed_at FROM reviews WHERE user_id = ? ORDER BY rating DESC, reviewed_at DESC LIMIT 5').bind(uid).all(),
  ]);
  const s = settings || {};
  const kbRows = kb.results || [];
  const byCat = {};
  for (const k of kbRows) {
    const cat = k.category || 'Services';
    if (!byCat[cat]) byCat[cat] = [];
    byCat[cat].push(k);
  }
  const photoRows = (photos.results || []).filter(p => p && p.data);
  // Parse working_hours JSON if present → array of {day, hours}.
  let hours = [];
  try { hours = s.working_hours ? JSON.parse(s.working_hours) : []; } catch (e) { hours = []; }
  if (!Array.isArray(hours)) hours = [];

  const name = s.business_name || 'Our Business';
  const industry = s.industry || '';

  // Add-on ownership flags drive real-vs-sample data.
  const hasReviewsAddon = !!(s.addon_reviews);
  const hasBlogAddon = !!(s.addon_blog);
  const hasSocialAddon = !!(s.addon_social);

  // Reviews: real cached rows when the add-on is active (synced from Google via
  // syncReviews). When previewing without the add-on, inject samples.
  const previewing = {};
  let reviews = [];
  if (hasReviewsAddon) {
    reviews = (revRows.results || []).map(r => ({
      author: r.author_name,
      rating: r.rating,
      text: r.text,
      photo: r.profile_photo_url,
      date: r.reviewed_at,
    }));
  } else if (previewAddons.reviews) {
    reviews = sampleReviews(name);
    previewing.reviews = true;
  }

  // Blog: real posts when the add-on is active; samples when previewing.
  let blogPosts = hasBlogAddon ? (posts.results || []) : [];
  let hasBlog = hasBlogAddon;
  if (!hasBlogAddon && previewAddons.blog) {
    blogPosts = sampleBlogPosts(name, industry);
    hasBlog = true;
    previewing.blog = true;
  }

  // Social: real URLs always (they're free settings fields). When the social
  // add-on isn't purchased but previewing, swap in sample links so the section
  // shows something + the lock overlay.
  let instagram = s.instagram_url || '';
  let facebook = s.facebook_url || '';
  if (!hasSocialAddon && previewAddons.social) {
    const sample = sampleSocialLinks();
    instagram = sample.instagram;
    facebook = sample.facebook;
    previewing.social = true;
  }

  return {
    settings: s,
    name,
    industry,
    area: s.service_area || '',
    desc: s.service_description || '',
    welcome: s.welcome_message || '',
    phone: s.forwarding_number || '',
    email: s.gmail_email || '',
    instagram,
    facebook,
    hours,
    servicesByCat: byCat,
    hasServices: kbRows.length > 0,
    apptTypes: apptTypes.results || [],
    photos: photoRows,
    posts: blogPosts,
    hasBlog,
    reviews,
    previewing,
  };
}

// Shared SEO head: title, meta description, LocalBusiness JSON-LD, Open
// Graph tags, canonical. Every template calls this so SEO is consistent
// regardless of which template is chosen. `url` is the absolute public URL.
function seoHead(data, cfg, url) {
  const esc = htmxEsc;
  // Title follows the spec exactly: "{Business} — {Industry} in {Area}".
  const industryTag = data.industry ? ` — ${data.industry}` : '';
  const areaTag = data.area ? ` in ${data.area}` : '';
  const title = `${data.name}${industryTag}${areaTag}`.slice(0, 70);
  const description = (data.desc || data.welcome || data.industry || data.name).slice(0, 155);
  const phoneDigits = (data.phone || '').replace(/[^0-9+]/g, '');
  const ld = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: data.name,
    description: data.desc || data.industry || undefined,
    telephone: data.phone || undefined,
    email: data.email || undefined,
    areaServed: data.area || undefined,
    url: url || undefined,
  };
  if (data.hours && data.hours.length) {
    ld.openingHoursSpecification = data.hours.map(h => ({ dayOfWeek: h.day, opens: (h.hours || '').split('-')[0] || undefined, closes: (h.hours || '').split('-')[1] || undefined }));
  }
  // Strip undefined keys for clean JSON-LD.
  const clean = JSON.parse(JSON.stringify(ld));
  return `<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${esc(url)}">
<meta property="og:type" content="website">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${esc(url)}">
<meta property="og:site_name" content="${esc(data.name)}">
<meta name="twitter:card" content="summary_large_image">
<script type="application/ld+json">${esc(JSON.stringify(clean))}</script>`;
}

// ── Add-on preview/teaser sample data ─────────────────────────────────
// When a business toggles a section ON but hasn't purchased the add-on, the
// public preview shows SAMPLE data (clearly labeled "Preview") + a lock
// overlay CTA. These generators return generic, obviously-sample items —
// never impersonate real reviews or real blog posts. `stars` is included so
// a template can render star ratings later; authors are common first-name +
// initial pairs so they read as plausible-but-generic.
function sampleReviews(businessName) {
  return [
    { text: 'Absolutely fantastic work. Showed up on time and the quality was outstanding.', author: 'Sarah M.', stars: 5 },
    { text: 'Best in the area, hands down. Will definitely call again for our next project.', author: 'Mike T.', stars: 5 },
    { text: 'Professional, clean, and fair pricing. Exactly what you want in a service business.', author: 'Jennifer R.', stars: 5 },
  ];
}

function sampleBlogPosts(businessName, industry) {
  const ind = industry || 'Property';
  return [
    { title: `5 Signs Your ${ind} Needs Professional Attention`, slug: 'preview-1', published_at: new Date().toISOString() },
    { title: `How to Choose the Right ${industry || 'Service'} Provider in Your Area`, slug: 'preview-2', published_at: new Date().toISOString() },
    { title: `The Complete Guide to ${industry || 'Home'} Maintenance This Season`, slug: 'preview-3', published_at: new Date().toISOString() },
  ];
}

function sampleSocialLinks() {
  return { instagram: 'https://instagram.com/yourbusiness', facebook: 'https://facebook.com/yourbusiness' };
}

// Lock overlay — a banner (NOT a blocking overlay) placed at the bottom of a
// previewed section. Sits below the preview content so the sample is visible
// behind/above it. The unlock button calls unlockAddon() which hits the
// cookie-authed add-on toggle (the preview page is owner-only + cookie-authed).
// `addonKey` maps to ADDONS (reviews/blog/social); label + price from ADDONS.
function lockOverlay(addonKey) {
  const def = ADDONS[addonKey];
  if (!def) return '';
  const price = Number(def.price).toFixed(2);
  return `<div class="lock-overlay">
    <span class="lock-badge">🔒 Preview</span>
    <p class="lock-msg">This is sample ${htmxEsc(def.label.toLowerCase())}. Unlock real ${htmxEsc(def.label)} for your site.</p>
    <button class="lock-btn" onclick="unlockAddon('${htmxEsc(addonKey)}')">Unlock ${htmxEsc(def.label)} — $${price}/mo</button>
  </div>`;
}

// Inline unlockAddon() — appended once per public site page when ANY section
// is previewing. Uses the cookie-authed unlock wrapper (the preview page is
// owner-only + cookie-authed, no Bearer token available) which calls the full
// Stripe-syncing add-on toggle. On success reloads to show real data; on
// failure (e.g. no payment method) sends the owner to billing.
const SITE_UNLOCK_SCRIPT = `<script>(function(){
  if(window.__unlockAddon)return;window.__unlockAddon=true;
  window.unlockAddon=function(key){
    if(!confirm('Add '+key+' add-on to your plan? You can manage it anytime in billing.'))return;
    fetch('/api/addon/unlock-htmx',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({addon:key,enabled:true})})
      .then(function(r){return r.json()})
      .then(function(d){ if(d.ok){alert((d.message||'Add-on enabled!')+' Reloading…');location.reload();} else { try{window.parent.location.href='/p/billing';}catch(e){window.location.href='/p/billing';} } })
      .catch(function(){ try{window.parent.location.href='/p/billing';}catch(e){window.location.href='/p/billing';} });
  };
})();</script>`;

// Lock overlay CSS — injected once per page (before </style>) when any section
// is previewing. The overlay is a banner at the bottom of the section, not a
// blocking layer, so the sample content stays visible above it.
const LOCK_OVERLAY_CSS = `.lock-overlay{margin-top:22px;padding:18px 20px;background:linear-gradient(135deg,rgba(212,165,116,.08),rgba(212,165,116,.15));border:1px dashed var(--accent,#d4a574);border-radius:10px;text-align:center}.lock-badge{display:inline-block;background:var(--accent,#d4a574);color:#fff;padding:3px 10px;border-radius:4px;font-size:.72em;font-weight:700;text-transform:uppercase;letter-spacing:.06em;margin-bottom:8px}.lock-msg{margin:6px 0 12px;font-size:.9em;opacity:.85}.lock-btn{display:inline-block;background:var(--accent,#d4a574);color:#fff;border:0;padding:10px 20px;border-radius:8px;font-weight:700;font-size:.92em;cursor:pointer;transition:transform .15s,opacity .2s}.lock-btn:hover{transform:translateY(-2px);opacity:.92}`;

// Shared helpers reused by every template. Kept tiny so each template can
// compose its own layout without duplicating the data shaping.
function siteSharedHtml(data, cfg) {
  const esc = htmxEsc;
  const telHref = data.phone
    ? `<a class="s-btn s-btn-call" href="tel:${esc(data.phone.replace(/[^0-9+]/g, ''))}">📞 Call ${esc(data.phone)}</a>` : '';
  const bookUrl = 'https://branchlive-portal.shane-f58.workers.dev/dashboard';
  const bookBtn = `<a class="s-btn s-btn-book" href="${bookUrl}">📅 Book Appointment</a>`;
  const heroHeadline = cfg.headline || data.name;
  const heroSub = [data.industry, data.area ? '📍 ' + data.area : ''].filter(Boolean).join(' · ');
  // Services markup (shared shape; templates wrap it differently).
  const servicesInner = Object.keys(data.servicesByCat).length
    ? Object.entries(data.servicesByCat).map(([cat, items]) =>
        `<div class="s-svc-group"><h3>${esc(cat)}</h3><div class="s-svc-list">${items.map(it =>
          `<div class="s-svc-item"><div><span class="s-svc-name">${esc(it.item)}</span>${it.notes ? `<span class="s-svc-note">${esc(it.notes)}</span>` : ''}</div>${it.price != null ? `<span class="s-svc-price">$${Number(it.price).toFixed(2)}</span>` : ''}</div>`).join('')}</div></div>`).join('')
    : (data.desc ? `<p class="s-lede">${esc(data.desc)}</p>` : '');
  const apptChips = data.apptTypes.length
    ? `<div class="s-chips">${data.apptTypes.map(t => `<span class="s-chip">${esc(t.name)}${t.duration_min ? ' · ' + t.duration_min + 'min' : ''}</span>`).join('')}</div>` : '';
  const galleryHtml = data.photos.length
    ? `<div class="s-gallery">${data.photos.map(p => `<figure class="s-gal-item"><img src="${esc(p.data)}" alt="${esc(p.caption || (p.type || 'photo'))}" loading="lazy"><figcaption>${esc((p.type || '').toUpperCase())}${p.caption ? ' · ' + esc(p.caption) : ''}</figcaption></figure>`).join('')}</div>` : '';
  const blogHtml = data.hasBlog && data.posts.length
    ? `<p class="s-lede" style="margin:0 0 16px">Helpful ${esc(data.industry || 'service')} articles, updated regularly.</p><div class="s-chips">${data.posts.map(p => {
        // Sample (preview) posts aren't real pages — render as non-clickable
        // chips so a click doesn't 404. Real posts link to /s/{slug}/blog/{post}.
        return data.previewing && data.previewing.blog
          ? `<span class="s-chip">${esc(p.title)} →</span>`
          : `<a class="s-chip" href="/s/${esc(cfg._slug)}/blog/${esc(p.slug)}">${esc(p.title)} →</a>`;
      }).join('')}</div>` : '';
  const hoursHtml = data.hours.length
    ? `<dl class="s-hours">${data.hours.map(h => `<div><dt>${esc(h.day || '')}</dt><dd>${esc(h.hours || 'Closed')}</dd></div>`).join('')}</dl>` : '';
  // Booking section body: appointment-type chips + call/book buttons. Reuses
  // apptChips/telHref/bookBtn so it's consistent with the hero. Templates wrap
  // this in their own section + heading.
  const bookingInner = `${apptChips ? `<div style="margin-bottom:18px">${apptChips}</div>` : ''}<div class="s-ctas">${telHref}${bookBtn}</div>`;
  // Service area: prominent display of data.area, split into chips if it's a
  // comma-separated list of cities. Empty when no area set.
  const areaCities = (data.area || '').split(',').map(c => c.trim()).filter(Boolean);
  const serviceAreaHtml = areaCities.length
    ? (areaCities.length > 1
        ? `<p class="s-lede" style="margin:0 0 14px">Proudly serving:</p><div class="s-chips">${areaCities.map(c => `<span class="s-chip">📍 ${esc(c)}</span>`).join('')}</div>`
        : `<p class="s-lede" style="margin:0">📍 ${esc(areaCities[0])}</p>`)
    : '';
  // Social links: render only the ones with a non-empty URL. Templates gate the
  // whole section on s('social'); this helper just returns the inner links (or
  // '' if neither is set, so an empty section collapses). Sample (preview)
  // links are non-clickable spans so a click doesn't open a fake profile.
  const previewingSocial = !!(data.previewing && data.previewing.social);
  const socials = [];
  if (data.instagram) socials.push(previewingSocial
    ? `<span class="s-chip">📸 Instagram</span>`
    : `<a class="s-chip" href="${esc(data.instagram)}" target="_blank" rel="noopener">📸 Instagram</a>`);
  if (data.facebook) socials.push(previewingSocial
    ? `<span class="s-chip">👍 Facebook</span>`
    : `<a class="s-chip" href="${esc(data.facebook)}" target="_blank" rel="noopener">👍 Facebook</a>`);
  const socialLinksHtml = socials.length ? `<div class="s-chips">${socials.join('')}</div>` : '';
  // Reviews: render real/sample rows when present; "coming soon" placeholder
  // when the section is on but empty AND not previewing (previewing injects
  // samples so this branch only hits for real add-on owners with no reviews yet).
  const reviewsHtml = data.reviews && data.reviews.length
    ? data.reviews.map(r => `<blockquote class="s-review"><p>“${esc(r.text || '')}”</p>${r.author ? `<cite>— ${esc(r.author)}</cite>` : ''}</blockquote>`).join('')
    : '<p class="s-placeholder">Reviews coming soon — check back!</p>';
  return { esc, telHref, bookBtn, bookUrl, heroHeadline, heroSub, servicesInner, apptChips, galleryHtml, blogHtml, hoursHtml, bookingInner, serviceAreaHtml, socialLinksHtml, reviewsHtml, previewing: data.previewing || {} };
}

// ── Template: Modern Clean ──
// White space, bold typography, gradient hero. The spiritual successor to
// the original single template — same audience (professional services).
function tplModern(data, cfg) {
  const h = siteSharedHtml(data, cfg);
  const s = (k) => cfg.sections[k];
  const servicesSection = s('services') && (h.servicesInner || h.apptChips)
    ? `<section class="s-sec"><div class="s-wrap"><div class="s-kicker">What we do</div><h2>Services & Pricing</h2>${h.servicesInner}${h.apptChips}</div></section>` : '';
  const aboutSection = s('about') && (data.desc || data.welcome)
    ? `<section class="s-sec s-about"><div class="s-wrap"><div class="s-kicker">About</div><h2>About ${h.esc(data.name)}</h2>${data.desc ? `<p>${h.esc(data.desc)}</p>` : ''}${data.welcome ? `<p class="s-quote">“${h.esc(data.welcome)}”</p>` : ''}</div></section>` : '';
  const gallerySection = s('gallery') && h.galleryHtml
    ? `<section class="s-sec"><div class="s-wrap"><div class="s-kicker">Our work</div><h2>Gallery</h2>${h.galleryHtml}</div></section>` : '';
  const serviceAreaSection = s('serviceArea') && h.serviceAreaHtml
    ? `<section class="s-sec"><div class="s-wrap"><div class="s-kicker">Where we work</div><h2>Areas we serve</h2>${h.serviceAreaHtml}</div></section>` : '';
  const reviewsSection = s('reviews')
    ? `<section class="s-sec"><div class="s-wrap"><div class="s-kicker">Reviews</div><h2>What clients say</h2>${h.reviewsHtml}${h.previewing.reviews ? lockOverlay('reviews') : ''}</div></section>` : '';
  const bookingSection = s('booking')
    ? `<section class="s-sec s-cta"><div class="s-wrap"><div class="s-kicker">Book</div><h2>Ready to book?</h2><p class="s-lede" style="margin:8px 0 18px">Pick a time that works for you.</p>${h.bookingInner}</div></section>` : '';
  const blogSection = s('blog') && h.blogHtml
    ? `<section class="s-sec"><div class="s-wrap"><div class="s-kicker">From the blog</div><h2>Tips & Insights</h2>${h.blogHtml}${h.previewing.blog ? lockOverlay('blog') : ''}</div></section>` : '';
  const socialSection = s('social') && h.socialLinksHtml
    ? `<section class="s-sec"><div class="s-wrap"><div class="s-kicker">Stay in touch</div><h2>Follow us</h2>${h.socialLinksHtml}${h.previewing.social ? lockOverlay('social') : ''}</div></section>` : '';
  const contactSection = s('contact')
    ? `<section class="s-sec s-cta"><div class="s-wrap"><div class="s-kicker">Get in touch</div><h2>Ready to get started?</h2><p class="s-lede" style="margin:10px auto 24px">Book online in under a minute, or give us a call.</p><div class="s-ctas">${h.telHref}${h.bookBtn}</div></div></section>` : '';
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">${seoHead(data, cfg, cfg._url)}<style>:root{--accent:${cfg.accent}}*{margin:0;padding:0;box-sizing:border-box}body{font-family:system-ui,-apple-system,'Segoe UI',sans-serif;color:#1a1a2e;background:#fff;line-height:1.6}.s-wrap{max-width:880px;margin:0 auto;padding:0 24px}.s-hero{background:linear-gradient(135deg,var(--accent),var(--accent));color:#fff;padding:80px 0 64px;text-align:center}.s-hero h1{font-size:2.6em;font-weight:800;letter-spacing:-.02em}.s-hero .s-sub{color:rgba(255,255,255,.85);margin-top:10px;font-size:1.05em}.s-ctas{margin-top:28px;display:flex;gap:12px;justify-content:center;flex-wrap:wrap}.s-btn{display:inline-block;padding:13px 26px;border-radius:10px;font-weight:700;text-decoration:none;font-size:1em;transition:transform .15s,box-shadow .15s}.s-btn:hover{transform:translateY(-2px)}.s-btn-call{background:#fff;color:var(--accent);box-shadow:0 6px 20px rgba(0,0,0,.18)}.s-btn-book{background:rgba(255,255,255,.16);color:#fff;border:2px solid rgba(255,255,255,.7)}.s-sec{padding:56px 0;border-bottom:1px solid #eee}.s-sec h2{font-size:1.7em;font-weight:700;margin-bottom:8px}.s-kicker{color:var(--accent);font-weight:600;text-transform:uppercase;font-size:.78em;letter-spacing:.08em;margin-bottom:6px}.s-lede{color:#555;font-size:1.08em;max-width:620px}.s-svc-group{margin-top:22px}.s-svc-group h3{font-size:1.1em;border-bottom:2px solid #f0f0f0;padding-bottom:6px;margin-bottom:10px}.s-svc-item{display:flex;justify-content:space-between;gap:16px;padding:9px 0;border-bottom:1px dashed #eee}.s-svc-name{font-weight:600}.s-svc-note{display:block;color:#888;font-size:.85em;font-weight:400}.s-svc-price{color:var(--accent);font-weight:700;white-space:nowrap}.s-chips{display:flex;gap:8px;flex-wrap:wrap;margin-top:16px}.s-chip{background:color-mix(in srgb,var(--accent) 12%,#fff);color:var(--accent);padding:6px 14px;border-radius:999px;font-size:.85em;font-weight:600;text-decoration:none}.s-gallery{display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:14px;margin-top:18px}.s-gal-item{margin:0}.s-gal-item img{width:100%;height:180px;object-fit:cover;border-radius:10px;display:block}.s-gal-item figcaption{font-size:.75em;color:#888;margin-top:4px;text-transform:uppercase;letter-spacing:.04em}.s-quote{color:#777;font-style:italic;margin-top:8px}.s-review{margin:14px 0;padding-left:16px;border-left:3px solid color-mix(in srgb,var(--accent) 30%,#fff)}.s-review cite{display:block;margin-top:4px;color:#888;font-size:.85em;font-style:normal}.s-placeholder{color:#999;font-style:italic}.s-cta{text-align:center;border-bottom:none}.s-cta .s-btn-book{background:var(--accent);color:#fff;border-color:var(--accent)}footer{padding:32px 0;text-align:center;color:#999;font-size:.85em}footer a{color:var(--accent);text-decoration:none}@media(max-width:600px){.s-hero h1{font-size:2em}.s-svc-item{flex-direction:column;gap:2px}.s-svc-price{align-self:flex-end}}</style></head><body><header class="s-hero"><div class="s-wrap"><h1>${h.esc(h.heroHeadline)}</h1>${h.heroSub ? `<div class="s-sub">${h.esc(h.heroSub)}</div>` : ''}<div class="s-ctas">${h.telHref}${h.bookBtn}</div></div></header><main class="s-wrap">${servicesSection}${aboutSection}${gallerySection}${serviceAreaSection}${reviewsSection}${bookingSection}${blogSection}${socialSection}${contactSection}</main><footer>© ${new Date().getFullYear()} ${h.esc(data.name)} · Powered by <a href="https://branchlive.com">Branch Live</a></footer></body></html>`;
}

// ── Template: Warm Craft ──
// Earth tones, serif headlines, texture. Before/after gallery forward.
function tplWarmCraft(data, cfg) {
  const h = siteSharedHtml(data, cfg);
  const s = (k) => cfg.sections[k];
  const servicesSection = s('services') && (h.servicesInner || h.apptChips)
    ? `<section class="wc-sec"><div class="wc-wrap"><span class="wc-kicker">What we do</span><h2>Services</h2>${h.servicesInner}${h.apptChips}</div></section>` : '';
  const aboutSection = s('about') && (data.desc || data.welcome)
    ? `<section class="wc-sec wc-about"><div class="wc-wrap"><span class="wc-kicker">Our story</span><h2>Built on craft</h2>${data.desc ? `<p>${h.esc(data.desc)}</p>` : ''}${data.welcome ? `<blockquote>“${h.esc(data.welcome)}”</blockquote>` : ''}</div></section>` : '';
  const gallerySection = s('gallery') && h.galleryHtml
    ? `<section class="wc-sec"><div class="wc-wrap"><span class="wc-kicker">Before & after</span><h2>Our work</h2>${h.galleryHtml}</div></section>` : '';
  const serviceAreaSection = s('serviceArea') && h.serviceAreaHtml
    ? `<section class="wc-sec"><div class="wc-wrap"><span class="wc-kicker">Where we work</span><h2>Where we work</h2>${h.serviceAreaHtml}</div></section>` : '';
  const reviewsSection = s('reviews')
    ? `<section class="wc-sec"><div class="wc-wrap"><span class="wc-kicker">Reviews</span><h2>Kind words</h2>${h.reviewsHtml}${h.previewing.reviews ? lockOverlay('reviews') : ''}</div></section>` : '';
  const bookingSection = s('booking')
    ? `<section class="wc-sec wc-cta"><div class="wc-wrap"><span class="wc-kicker">Visit</span><h2>Schedule a visit</h2><div class="wc-ctas" style="margin-top:18px">${h.bookingInner}</div></div></section>` : '';
  const blogSection = s('blog') && h.blogHtml
    ? `<section class="wc-sec"><div class="wc-wrap"><span class="wc-kicker">Journal</span><h2>Notes & tips</h2>${h.blogHtml}${h.previewing.blog ? lockOverlay('blog') : ''}</div></section>` : '';
  const socialSection = s('social') && h.socialLinksHtml
    ? `<section class="wc-sec"><div class="wc-wrap"><span class="wc-kicker">Stay in touch</span><h2>Connect</h2>${h.socialLinksHtml}${h.previewing.social ? lockOverlay('social') : ''}</div></section>` : '';
  const contactSection = s('contact')
    ? `<section class="wc-sec wc-cta"><div class="wc-wrap"><h2>Let's build something</h2><div class="wc-ctas">${h.telHref}${h.bookBtn}</div></div></section>` : '';
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">${seoHead(data, cfg, cfg._url)}<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,700&display=swap" rel="stylesheet"><style>:root{--accent:${cfg.accent}}*{margin:0;padding:0;box-sizing:border-box}body{font-family:Georgia,'Times New Roman',serif;color:#3a2f25;background:#f5efe6;line-height:1.7}.wc-wrap{max-width:880px;margin:0 auto;padding:0 24px}.wc-hero{background:#2e2620;background-image:radial-gradient(circle at 20% 30%,rgba(212,165,116,.18),transparent 60%);color:#f5efe6;padding:88px 0 72px;text-align:center}.wc-hero h1{font-family:'Fraunces',serif;font-size:2.8em;font-weight:700;letter-spacing:-.01em}.wc-hero .wc-sub{color:#d4a574;margin-top:12px;font-size:1.1em;font-style:italic}.wc-ctas{margin-top:30px;display:flex;gap:12px;justify-content:center;flex-wrap:wrap}.wc-btn{display:inline-block;padding:13px 26px;border-radius:6px;font-weight:700;text-decoration:none;font-family:Georgia,serif;transition:transform .15s}.wc-btn:hover{transform:translateY(-2px)}.s-btn-call,.wc .s-btn-call{background:#d4a574;color:#2e2620}.s-btn-book,.wc .s-btn-book{background:transparent;color:#f5efe6;border:2px solid #d4a574}.wc-sec{padding:60px 0;border-bottom:1px solid rgba(58,47,37,.12)}.wc-kicker{color:var(--accent);text-transform:uppercase;letter-spacing:.12em;font-size:.74em;font-family:Georgia,serif;font-style:italic}.wc-sec h2{font-family:'Fraunces',serif;font-size:1.9em;margin:6px 0 16px;color:#2e2620}.s-lede,.wc p{color:#5a4a3a}.wc blockquote{font-style:italic;color:#6b5a47;border-left:3px solid var(--accent);padding-left:16px;margin-top:16px}.s-svc-group{margin-top:18px}.s-svc-group h3{font-family:'Fraunces',serif;color:#2e2620;border-bottom:1px solid rgba(58,47,37,.18);padding-bottom:6px;margin-bottom:8px}.s-svc-item{display:flex;justify-content:space-between;gap:16px;padding:8px 0;border-bottom:1px dotted rgba(58,47,37,.2)}.s-svc-name{font-weight:700;color:#3a2f25}.s-svc-note{display:block;color:#7a6a55;font-size:.85em;font-weight:400}.s-svc-price{color:var(--accent);font-weight:700;white-space:nowrap}.s-chips{display:flex;gap:8px;flex-wrap:wrap;margin-top:14px}.s-chip{background:rgba(212,165,116,.18);color:#6b4f2a;padding:6px 14px;border-radius:4px;font-size:.85em;text-decoration:none}.s-gallery{display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:14px;margin-top:18px}.s-gal-item{margin:0}.s-gal-item img{width:100%;height:180px;object-fit:cover;border-radius:6px;display:block;filter:saturate(.95)}.s-gal-item figcaption{font-size:.72em;color:#7a6a55;margin-top:5px;text-transform:uppercase;letter-spacing:.06em}.s-review{margin:14px 0;padding-left:16px;border-left:3px solid rgba(212,165,116,.4)}.s-review cite{display:block;margin-top:4px;color:#7a6a55;font-size:.85em;font-style:normal}.s-placeholder{color:#8a7a65;font-style:italic}.wc-cta{text-align:center;background:#ede4d4}.wc-cta .s-btn-book{background:var(--accent);color:#2e2620;border-color:var(--accent)}footer{padding:30px 0;text-align:center;color:#8a7a65;font-size:.85em;font-family:Georgia,serif}footer a{color:var(--accent)}@media(max-width:600px){.wc-hero h1{font-size:2.1em}.s-svc-item{flex-direction:column;gap:2px}}</style></head><body><header class="wc-hero"><div class="wc-wrap"><h1>${h.esc(h.heroHeadline)}</h1>${h.heroSub ? `<div class="wc-sub">${h.esc(h.heroSub)}</div>` : ''}<div class="wc-ctas">${h.telHref}${h.bookBtn}</div></div></header><main>${servicesSection}${aboutSection}${gallerySection}${serviceAreaSection}${reviewsSection}${bookingSection}${blogSection}${socialSection}${contactSection}</main><footer>© ${new Date().getFullYear()} ${h.esc(data.name)} · Powered by <a href="https://branchlive.com">Branch Live</a></footer></body></html>`;
}

// ── Template: Bold Impact ──
// Dark background, high contrast, huge statements. Emergency-services feel.
function tplBoldImpact(data, cfg) {
  const h = siteSharedHtml(data, cfg);
  const s = (k) => cfg.sections[k];
  const servicesSection = s('services') && (h.servicesInner || h.apptChips)
    ? `<section class="bi-sec"><div class="bi-wrap"><h2>Services</h2>${h.servicesInner}${h.apptChips}</div></section>` : '';
  const aboutSection = s('about') && (data.desc || data.welcome)
    ? `<section class="bi-sec"><div class="bi-wrap"><h2>Who we are</h2>${data.desc ? `<p>${h.esc(data.desc)}</p>` : ''}${data.welcome ? `<p class="bi-quote">“${h.esc(data.welcome)}”</p>` : ''}</div></section>` : '';
  const gallerySection = s('gallery') && h.galleryHtml
    ? `<section class="bi-sec"><div class="bi-wrap"><h2>Recent work</h2>${h.galleryHtml}</div></section>` : '';
  const serviceAreaSection = s('serviceArea') && h.serviceAreaHtml
    ? `<section class="bi-sec"><div class="bi-wrap"><h2>SERVICE AREA</h2>${h.serviceAreaHtml}</div></section>` : '';
  const reviewsSection = s('reviews')
    ? `<section class="bi-sec"><div class="bi-wrap"><h2>REVIEWS</h2>${h.reviewsHtml}${h.previewing.reviews ? lockOverlay('reviews') : ''}</div></section>` : '';
  const bookingSection = s('booking')
    ? `<section class="bi-sec bi-cta"><div class="bi-wrap"><h2>BOOK NOW</h2><div class="bi-ctas" style="justify-content:flex-start;margin-top:20px">${h.bookingInner}</div></div></section>` : '';
  const blogSection = s('blog') && h.blogHtml
    ? `<section class="bi-sec"><div class="bi-wrap"><h2>Latest</h2>${h.blogHtml}${h.previewing.blog ? lockOverlay('blog') : ''}</div></section>` : '';
  const socialSection = s('social') && h.socialLinksHtml
    ? `<section class="bi-sec"><div class="bi-wrap"><h2>FOLLOW</h2>${h.socialLinksHtml}${h.previewing.social ? lockOverlay('social') : ''}</div></section>` : '';
  const contactSection = s('contact')
    ? `<section class="bi-sec bi-cta"><div class="bi-wrap"><h2>Get it done.</h2><div class="bi-ctas">${h.telHref}${h.bookBtn}</div></div></section>` : '';
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">${seoHead(data, cfg, cfg._url)}<style>:root{--accent:${cfg.accent}}*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Arial Black','Helvetica Neue',Arial,sans-serif;color:#f5f5f5;background:#0d0d0d;line-height:1.5}.bi-wrap{max-width:1000px;margin:0 auto;padding:0 28px}.bi-hero{min-height:62vh;display:flex;align-items:center;background:#0d0d0d;background-image:linear-gradient(115deg,rgba(0,0,0,.85),rgba(0,0,0,.55)),radial-gradient(circle at 80% 20%,var(--accent),transparent 45%)}.bi-hero h1{font-size:4em;font-weight:900;line-height:1;text-transform:uppercase;letter-spacing:-.02em}.bi-hero .bi-sub{color:var(--accent);margin-top:16px;font-size:1.2em;font-weight:700;text-transform:uppercase;letter-spacing:.05em}.bi-ctas{margin-top:32px;display:flex;gap:14px;flex-wrap:wrap}.bi-btn{display:inline-block;padding:16px 30px;border-radius:0;font-weight:900;text-decoration:none;text-transform:uppercase;letter-spacing:.05em;font-size:1em;transition:transform .15s}.bi-btn:hover{transform:translateY(-3px)}.s-btn-call{background:var(--accent);color:#0d0d0d}.s-btn-book{background:transparent;color:#fff;border:3px solid #fff}.bi-sec{padding:64px 0;border-top:3px solid var(--accent)}.bi-sec h2{font-size:2.4em;text-transform:uppercase;letter-spacing:-.01em;margin-bottom:18px;color:#fff}.bi-sec p,.s-lede{color:#bbb;font-family:Arial,Helvetica,sans-serif;font-weight:400;line-height:1.7}.bi-quote{color:var(--accent);font-style:italic;margin-top:12px}.s-svc-group{margin-top:18px}.s-svc-group h3{text-transform:uppercase;color:var(--accent);border-bottom:1px solid #333;padding-bottom:6px;margin-bottom:8px;letter-spacing:.03em}.s-svc-item{display:flex;justify-content:space-between;gap:16px;padding:10px 0;border-bottom:1px solid #222;font-family:Arial,Helvetica,sans-serif}.s-svc-name{font-weight:700;color:#eee}.s-svc-note{display:block;color:#888;font-size:.85em;font-weight:400}.s-svc-price{color:var(--accent);font-weight:900;white-space:nowrap}.s-chips{display:flex;gap:8px;flex-wrap:wrap;margin-top:14px}.s-chip{background:var(--accent);color:#0d0d0d;padding:6px 14px;font-size:.8em;font-weight:900;text-transform:uppercase;text-decoration:none}.s-gallery{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:12px;margin-top:18px}.s-gal-item{margin:0}.s-gal-item img{width:100%;height:200px;object-fit:cover;display:block;filter:contrast(1.08) saturate(.9)}.s-gal-item figcaption{font-size:.7em;color:var(--accent);margin-top:5px;text-transform:uppercase;letter-spacing:.08em;font-weight:700}.s-review{margin:16px 0;padding-left:16px;border-left:4px solid var(--accent);font-family:Arial,Helvetica,sans-serif}.s-review p{color:#ddd;font-style:italic}.s-review cite{display:block;margin-top:6px;color:var(--accent);font-size:.8em;text-transform:uppercase;letter-spacing:.06em;font-style:normal;font-weight:900}.s-placeholder{color:#666;font-style:italic;font-family:Arial,Helvetica,sans-serif}.bi-cta{text-align:center;background:#111}.bi-cta .s-btn-book{background:var(--accent);color:#0d0d0d;border-color:var(--accent)}footer{padding:28px 0;text-align:center;color:#555;font-size:.8em;font-family:Arial,Helvetica,sans-serif;text-transform:uppercase;letter-spacing:.08em}footer a{color:var(--accent)}@media(max-width:600px){.bi-hero h1{font-size:2.4em}.s-svc-item{flex-direction:column;gap:2px}}</style></head><body><header class="bi-hero"><div class="bi-wrap"><h1>${h.esc(h.heroHeadline)}</h1>${h.heroSub ? `<div class="bi-sub">${h.esc(h.heroSub)}</div>` : ''}<div class="bi-ctas">${h.telHref}${h.bookBtn}</div></div></header><main>${servicesSection}${aboutSection}${gallerySection}${serviceAreaSection}${reviewsSection}${bookingSection}${blogSection}${socialSection}${contactSection}</main><footer>© ${new Date().getFullYear()} ${h.esc(data.name)} · Powered by Branch Live</footer></body></html>`;
}

// ── Template: Soft Elegance ──
// Light, feminine, curved edges, soft serif. Salons / boutiques.
function tplSoftElegance(data, cfg) {
  const h = siteSharedHtml(data, cfg);
  const s = (k) => cfg.sections[k];
  const servicesSection = s('services') && (h.servicesInner || h.apptChips)
    ? `<section class="se-sec"><div class="se-wrap"><span class="se-kicker">Menu</span><h2>Services</h2>${h.servicesInner}${h.apptChips}</div></section>` : '';
  const aboutSection = s('about') && (data.desc || data.welcome)
    ? `<section class="se-sec se-about"><div class="se-wrap"><span class="se-kicker">About</span><h2>Welcome, darling</h2>${data.desc ? `<p>${h.esc(data.desc)}</p>` : ''}${data.welcome ? `<p class="se-quote">“${h.esc(data.welcome)}”</p>` : ''}</div></section>` : '';
  const gallerySection = s('gallery') && h.galleryHtml
    ? `<section class="se-sec"><div class="se-wrap"><span class="se-kicker">Gallery</span><h2>A little look</h2>${h.galleryHtml}</div></section>` : '';
  const serviceAreaSection = s('serviceArea') && h.serviceAreaHtml
    ? `<section class="se-sec"><div class="se-wrap"><span class="se-kicker">Where to find us</span><h2>Serving</h2>${h.serviceAreaHtml}</div></section>` : '';
  const reviewsSection = s('reviews')
    ? `<section class="se-sec"><div class="se-wrap"><span class="se-kicker">Love notes</span><h2>Kind words</h2>${h.reviewsHtml}${h.previewing.reviews ? lockOverlay('reviews') : ''}</div></section>` : '';
  const bookingSection = s('booking')
    ? `<section class="se-sec se-cta"><div class="se-wrap"><span class="se-kicker">Reserve</span><h2>Book your visit</h2><div class="se-ctas" style="margin-top:18px">${h.bookingInner}</div></div></section>` : '';
  const blogSection = s('blog') && h.blogHtml
    ? `<section class="se-sec"><div class="se-wrap"><span class="se-kicker">Journal</span><h2>Read more</h2>${h.blogHtml}${h.previewing.blog ? lockOverlay('blog') : ''}</div></section>` : '';
  const socialSection = s('social') && h.socialLinksHtml
    ? `<section class="se-sec"><div class="se-wrap"><span class="se-kicker">Stay in touch</span><h2>Find us online</h2>${h.socialLinksHtml}${h.previewing.social ? lockOverlay('social') : ''}</div></section>` : '';
  const contactSection = s('contact')
    ? `<section class="se-sec se-cta"><div class="se-wrap"><h2>Book your visit</h2><div class="se-ctas">${h.telHref}${h.bookBtn}</div></div></section>` : '';
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">${seoHead(data, cfg, cfg._url)}<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600&family=Quicksand:wght@400;500;600&display=swap" rel="stylesheet"><style>:root{--accent:${cfg.accent}}*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Quicksand',sans-serif;color:#5a5050;background:#fdfaf7;line-height:1.8}.se-wrap{max-width:840px;margin:0 auto;padding:0 24px}.se-hero{background:linear-gradient(160deg,#fff,var(--accent)22);color:#5a5050;padding:90px 0 70px;text-align:center;border-radius:0 0 50% 50%/60px}.se-hero h1{font-family:'Cormorant Garamond',serif;font-size:3em;font-weight:600;letter-spacing:.01em}.se-hero .se-sub{color:var(--accent);margin-top:12px;font-size:1.15em}.se-ctas{margin-top:30px;display:flex;gap:14px;justify-content:center;flex-wrap:wrap}.se-btn{display:inline-block;padding:14px 32px;border-radius:999px;font-weight:600;text-decoration:none;font-size:1em;transition:transform .2s,box-shadow .2s}.se-btn:hover{transform:translateY(-2px);box-shadow:0 8px 22px rgba(0,0,0,.08)}.s-btn-call{background:var(--accent);color:#fff}.s-btn-book{background:#fff;color:var(--accent);border:2px solid var(--accent)}.se-sec{padding:64px 0}.se-kicker{color:var(--accent);text-transform:lowercase;letter-spacing:.18em;font-size:.82em;font-family:'Cormorant Garamond',serif;font-style:italic}.se-sec h2{font-family:'Cormorant Garamond',serif;font-size:2.1em;margin:6px 0 18px;color:#5a5050;font-weight:600}.s-lede,.se p{color:#7a7070}.se-quote{font-family:'Cormorant Garamond',serif;font-style:italic;color:var(--accent);font-size:1.15em;margin-top:14px}.s-svc-group{margin-top:18px}.s-svc-group h3{font-family:'Cormorant Garamond',serif;color:#5a5050;border-bottom:1px solid #ece4dc;padding-bottom:6px;margin-bottom:8px;font-size:1.25em}.s-svc-item{display:flex;justify-content:space-between;gap:16px;padding:9px 0;border-bottom:1px dotted #ece4dc}.s-svc-name{font-weight:600;color:#5a5050}.s-svc-note{display:block;color:#a89a8a;font-size:.85em;font-weight:400}.s-svc-price{color:var(--accent);font-weight:600;white-space:nowrap}.s-chips{display:flex;gap:8px;flex-wrap:wrap;margin-top:14px}.s-chip{background:var(--accent)1a;color:var(--accent);padding:6px 16px;border-radius:999px;font-size:.82em;font-weight:500;text-decoration:none}.s-gallery{display:grid;grid-template-columns:repeat(auto-fill,minmax(170px,1fr));gap:14px;margin-top:18px}.s-gal-item{margin:0}.s-gal-item img{width:100%;height:170px;object-fit:cover;border-radius:18px;display:block}.s-gal-item figcaption{font-size:.72em;color:#a89a8a;margin-top:5px;text-align:center}.s-review{margin:16px 0;padding:14px 18px;background:#fff;border-radius:18px;box-shadow:0 2px 12px rgba(0,0,0,.04)}.s-review p{font-family:'Cormorant Garamond',serif;font-style:italic;font-size:1.1em;color:#6a6060}.s-review cite{display:block;margin-top:6px;color:var(--accent);font-size:.85em;font-style:normal}.s-placeholder{color:#a89a8a;font-style:italic;font-family:'Cormorant Garamond',serif}.se-cta{text-align:center;background:var(--accent)10;border-radius:40px;margin:20px auto;max-width:760px}.se-cta .s-btn-book{background:var(--accent);color:#fff;border-color:var(--accent)}footer{padding:30px 0;text-align:center;color:#a89a8a;font-size:.82em}footer a{color:var(--accent)}@media(max-width:600px){.se-hero h1{font-size:2.2em}.s-svc-item{flex-direction:column;gap:2px}}</style></head><body><header class="se-hero"><div class="se-wrap"><h1>${h.esc(h.heroHeadline)}</h1>${h.heroSub ? `<div class="se-sub">${h.esc(h.heroSub)}</div>` : ''}<div class="se-ctas">${h.telHref}${h.bookBtn}</div></div></header><main>${servicesSection}${aboutSection}${gallerySection}${serviceAreaSection}${reviewsSection}${bookingSection}${blogSection}${socialSection}${contactSection}</main><footer>© ${new Date().getFullYear()} ${h.esc(data.name)} · Powered by <a href="https://branchlive.com">Branch Live</a></footer></body></html>`;
}

// ── Template: Minimal Grid ──
// Photo-forward, gallery-driven, type-led. Photographers / designers.
function tplMinimalGrid(data, cfg) {
  const h = siteSharedHtml(data, cfg);
  const s = (k) => cfg.sections[k];
  const servicesSection = s('services') && (h.servicesInner || h.apptChips)
    ? `<section class="mg-sec"><div class="mg-wrap"><h2>Services</h2>${h.servicesInner}${h.apptChips}</div></section>` : '';
  const aboutSection = s('about') && (data.desc || data.welcome)
    ? `<section class="mg-sec"><div class="mg-wrap"><h2>About</h2>${data.desc ? `<p>${h.esc(data.desc)}</p>` : ''}</div></section>` : '';
  // Gallery is the hero of this template — always large when photos exist.
  const gallerySection = s('gallery') && h.galleryHtml
    ? `<section class="mg-sec mg-gallery-sec"><div class="mg-wrap mg-wrap-wide"><h2>Selected work</h2>${h.galleryHtml}</div></section>` : '';
  const serviceAreaSection = s('serviceArea') && h.serviceAreaHtml
    ? `<section class="mg-sec"><div class="mg-wrap"><h2>Service area</h2>${h.serviceAreaHtml}</div></section>` : '';
  const reviewsSection = s('reviews')
    ? `<section class="mg-sec"><div class="mg-wrap"><h2>Reviews</h2>${h.reviewsHtml}${h.previewing.reviews ? lockOverlay('reviews') : ''}</div></section>` : '';
  const bookingSection = s('booking')
    ? `<section class="mg-sec mg-cta"><div class="mg-wrap"><h2>Book</h2><div class="mg-ctas" style="justify-content:flex-start;margin-top:0">${h.bookingInner}</div></div></section>` : '';
  const blogSection = s('blog') && h.blogHtml
    ? `<section class="mg-sec"><div class="mg-wrap"><h2>Journal</h2>${h.blogHtml}${h.previewing.blog ? lockOverlay('blog') : ''}</div></section>` : '';
  const socialSection = s('social') && h.socialLinksHtml
    ? `<section class="mg-sec"><div class="mg-wrap"><h2>Social</h2>${h.socialLinksHtml}${h.previewing.social ? lockOverlay('social') : ''}</div></section>` : '';
  const contactSection = s('contact')
    ? `<section class="mg-sec mg-cta"><div class="mg-wrap"><h2>Contact</h2><div class="mg-ctas">${h.telHref}${h.bookBtn}</div></div></section>` : '';
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">${seoHead(data, cfg, cfg._url)}<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;700&display=swap" rel="stylesheet"><style>:root{--accent:${cfg.accent}}*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Inter',sans-serif;color:#111;background:#fafafa;line-height:1.6;font-weight:400}.mg-wrap{max-width:960px;margin:0 auto;padding:0 28px}.mg-wrap-wide{max-width:1200px}.mg-hero{padding:80px 0 48px;text-align:center;border-bottom:1px solid #eee}.mg-hero h1{font-size:3.2em;font-weight:700;letter-spacing:-.03em}.mg-hero .mg-sub{color:#999;margin-top:10px;font-size:1em;text-transform:uppercase;letter-spacing:.15em;font-weight:500}.mg-ctas{margin-top:30px;display:flex;gap:14px;justify-content:center;flex-wrap:wrap}.mg-btn{display:inline-block;padding:14px 30px;font-weight:500;text-decoration:none;font-size:.92em;transition:opacity .2s;border-radius:0}.mg-btn:hover{opacity:.7}.s-btn-call{background:#111;color:#fff}.s-btn-book{background:transparent;color:#111;border:1px solid #111}.mg-sec{padding:72px 0;border-bottom:1px solid #eee}.mg-sec h2{font-size:1.5em;font-weight:700;letter-spacing:-.02em;margin-bottom:24px;text-transform:uppercase}.s-lede,.mg p{color:#555;max-width:620px}.s-svc-group{margin-top:16px}.s-svc-group h3{font-size:.8em;text-transform:uppercase;letter-spacing:.12em;color:#999;border-bottom:1px solid #eee;padding-bottom:6px;margin-bottom:8px;font-weight:700}.s-svc-item{display:flex;justify-content:space-between;gap:16px;padding:9px 0;border-bottom:1px solid #f4f4f4}.s-svc-name{font-weight:500;color:#222}.s-svc-note{display:block;color:#999;font-size:.85em;font-weight:400}.s-svc-price{color:#111;font-weight:700;white-space:nowrap}.s-chips{display:flex;gap:8px;flex-wrap:wrap;margin-top:14px}.s-chip{background:#f0f0f0;color:#333;padding:6px 14px;font-size:.8em;font-weight:500;text-decoration:none}.mg-gallery-sec .s-gallery{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:4px;margin-top:0}.s-gal-item{margin:0}.s-gal-item img{width:100%;height:300px;object-fit:cover;display:block;filter:contrast(1.02)}.s-gal-item figcaption{font-size:.7em;color:#999;margin-top:5px;text-transform:uppercase;letter-spacing:.1em}.s-review{margin:18px 0;padding-left:16px;border-left:2px solid #111}.s-review p{color:#333;font-style:italic}.s-review cite{display:block;margin-top:6px;color:#999;font-size:.8em;font-style:normal;text-transform:uppercase;letter-spacing:.08em}.s-placeholder{color:#999;font-style:italic}.mg-cta{text-align:center}.mg-cta .s-btn-book{background:var(--accent);color:#fff;border-color:var(--accent)}footer{padding:30px 0;text-align:center;color:#999;font-size:.8em;text-transform:uppercase;letter-spacing:.1em}footer a{color:#111}@media(max-width:600px){.mg-hero h1{font-size:2.2em}.s-svc-item{flex-direction:column;gap:2px}.mg-gallery-sec .s-gallery{grid-template-columns:repeat(auto-fill,minmax(150px,1fr))}.mg-gallery-sec .s-gal-item img{height:180px}}</style></head><body><header class="mg-hero"><div class="mg-wrap"><h1>${h.esc(h.heroHeadline)}</h1>${h.heroSub ? `<div class="mg-sub">${h.esc(h.heroSub)}</div>` : ''}<div class="mg-ctas">${h.telHref}${h.bookBtn}</div></div></header><main>${servicesSection}${aboutSection}${gallerySection}${serviceAreaSection}${reviewsSection}${bookingSection}${blogSection}${socialSection}${contactSection}</main><footer>© ${new Date().getFullYear()} ${h.esc(data.name)} · Powered by Branch Live</footer></body></html>`;
}

// Dispatch: normalize config → pick template renderer. `_url` and `_slug` are
// injected so templates/SEO can build absolute + relative links. Never throws;
// unknown template falls back to modern. When any section is previewing an
// unpurchased add-on, inject the lock-overlay CSS (before </style>) and the
// unlockAddon() script (before </body>) once per page.
function renderSite(site, data, cfg, url) {
  const c = { ...cfg, _url: url || '', _slug: (site && site.slug) || '' };
  const fn = {
    modern: tplModern, warmcraft: tplWarmCraft, boldimpact: tplBoldImpact,
    softelegance: tplSoftElegance, minimalgrid: tplMinimalGrid,
  }[c.template] || tplModern;
  let html = fn(data, c);
  const pv = (data && data.previewing) || {};
  if (pv.reviews || pv.blog || pv.social) {
    html = html.replace('</style>', LOCK_OVERLAY_CSS + '</style>')
      .replace('</body>', SITE_UNLOCK_SCRIPT + '</body>');
  }
  return html;
}

// Standalone "site not published" page (404). Kept dark-on-brand so it reads
// as a Branch Live page, not the business's half-built site.
function siteNotFoundShell() {
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Site not found — Branch Live</title><style>body{font-family:system-ui,sans-serif;background:#0d1117;color:#e6edf3;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;text-align:center}.box{max-width:420px;padding:32px}a{color:#d4a574}</style></head><body><div class="box"><div style="font-size:3em;margin-bottom:12px">🌐</div><h1>Site not published</h1><p style="color:#8b949e;margin-top:8px">This page isn't live yet. If you're the owner, publish it from your Branch Live dashboard.</p><p style="margin-top:20px"><a href="https://branchlive.com/dashboard">← Back to Branch Live</a></p></div></body></html>`;
}

async function handlePublicSite(request, env, slug) {
  try {
    const url = new URL(request.url);
    const isPreview = url.searchParams.get('preview') === '1';
    // Preview mode: the owner (resolved via session cookie) can view an
    // unpublished site. Anonymous visitors only ever see published rows.
    let ownerUid = null;
    if (isPreview) ownerUid = await getUidFromSessionCookie(request, env);
    const site = isPreview
      ? await env.DB.prepare('SELECT * FROM sites WHERE slug = ?').bind(slug).first()
      : await env.DB.prepare('SELECT * FROM sites WHERE slug = ? AND published = 1').bind(slug).first();
    if (!site || (isPreview && ownerUid && site.user_id !== ownerUid)) {
      return new Response(siteNotFoundShell(), { status: 404, headers: { 'Content-Type': 'text/html' } });
    }
    const uid = site.user_id;
    // Live-preview query overrides: ?template=&accent=&headline=&sections=.
    const query = {
      template: url.searchParams.get('template'),
      accent: url.searchParams.get('accent'),
      headline: url.searchParams.get('headline'),
      sections: url.searchParams.get('sections'),
    };
    const cfg = normalizeSiteConfig(site, query);
    // Add-on previews (?previewReviews=1&previewBlog=1&previewSocial=1) only
    // apply in owner preview mode — an anonymous visitor must never see sample
    // reviews/posts/social links on a live site. ownerUid is set above only
    // when ?preview=1 + a valid owner session cookie resolves to this site.
    const isOwnerPreview = isPreview && ownerUid && site.user_id === ownerUid;
    const previewAddons = isOwnerPreview ? {
      reviews: url.searchParams.get('previewReviews') === '1',
      blog: url.searchParams.get('previewBlog') === '1',
      social: url.searchParams.get('previewSocial') === '1',
    } : {};
    const data = await buildSiteData(env, uid, { previewAddons });
    const origin = url.origin;
    const publicUrl = `${origin}/s/${slug}`;
    const html = renderSite(site, data, cfg, publicUrl);
    return new Response(html, { headers: { 'Content-Type': 'text/html' } });
  } catch (e) {
    console.error('Public site error:', e);
    return new Response('<!DOCTYPE html><html><body><h1>Something went wrong</h1></body></html>', { status: 500, headers: { 'Content-Type': 'text/html' } });
  }
}

// ═══════════════════════════════════════════════════════════════════════
// WEBSITE BUILDER — /p/website (the live-preview builder) + /p/admin/sites
// (admin overview of every published business site).
// ═══════════════════════════════════════════════════════════════════════

// The builder page. A two-pane layout: left = controls (template picker,
// accent, headline, section toggles, mobile/desktop), right = a live <iframe>
// pointed at /s/{slug}?preview=1&template=…&accent=… so every control change
// re-renders the owner's actual site instantly. Preview always works (even
// without the add-on); Publish is gated behind addon_website.
async function handleWebsiteBuilderHtmx(request, env, uid, ctx) {
  try {
    const [site, settings, photosRow] = await Promise.all([
      env.DB.prepare('SELECT * FROM sites WHERE user_id = ?').bind(uid).first(),
      env.DB.prepare('SELECT business_name, addon_website, addon_reviews, addon_blog, addon_social FROM settings WHERE user_id = ?').bind(uid).first(),
      env.DB.prepare('SELECT id, data, caption, type FROM photos WHERE user_id = ? ORDER BY created_at DESC LIMIT 24').bind(uid).all(),
    ]);
    const cfg = normalizeSiteConfig(site || {}, {});
    const businessName = (settings && settings.business_name) || 'your business';
    const hasAddon = !!(settings && settings.addon_website);
    const slug = (site && site.slug) || '';
    const published = !!(site && site.published);
    const origin = new URL(request.url).origin;
    const previewUrl = slug ? `${origin}/s/${slug}?preview=1` : '';
    const photos = (photosRow.results || []).filter(p => p && p.data);
    // Add-on ownership drives which sections get sample previews in the iframe.
    // A section toggled ON whose add-on isn't purchased → preview param sent so
    // the iframe shows sample data + a lock overlay.
    const ownedAddons = {
      reviews: !!(settings && settings.addon_reviews),
      blog: !!(settings && settings.addon_blog),
      social: !!(settings && settings.addon_social),
    };

    // Template picker cards.
    const tplCards = SITE_TEMPLATES.map(t => {
      const meta = SITE_TEMPLATE_META[t];
      const sel = t === cfg.template;
      return `<button type="button" class="wb-tpl ${sel ? 'sel' : ''}" data-tpl="${htmxEsc(t)}" onclick="wbPickTpl('${htmxEsc(t)}')">
        <span class="wb-tpl-swatch wb-swatch-${htmxEsc(t)}"></span>
        <span class="wb-tpl-name">${htmxEsc(meta.label)}</span>
        <span class="wb-tpl-best">${htmxEsc(meta.best)}</span>
      </button>`;
    }).join('');

    // Accent swatches.
    const accentSwatches = SITE_ACCENTS.map(c =>
      `<button type="button" class="wb-accent ${c === cfg.accent ? 'sel' : ''}" style="background:${htmxEsc(c)}" data-accent="${htmxEsc(c)}" onclick="wbPickAccent('${htmxEsc(c)}')" aria-label="${htmxEsc(c)}"></button>`
    ).join('');

    // Section toggles.
    const sectionLabels = {
      services: 'Services & pricing', about: 'About / story', gallery: 'Before & after gallery',
      reviews: 'Customer reviews', blog: 'Latest blog posts', booking: 'Booking CTA',
      contact: 'Contact', serviceArea: 'Service area', social: 'Social links',
    };
    const sectionToggles = SITE_SECTIONS.map(k =>
      `<label class="wb-toggle"><input type="checkbox" data-sec="${htmxEsc(k)}" ${cfg.sections[k] ? 'checked' : ''} onchange="wbRefresh()"> <span>${htmxEsc(sectionLabels[k] || k)}</span></label>`
    ).join('');

    // Photos — existing thumbnails (with remove + tag) + an upload control.
    // These populate the gallery section on the live site. Stored as base64
    // data URIs in the photos table (no external storage for Phase 3).
    const photoThumbs = photos.map(p => `<div class="wb-photo" data-id="${p.id}">
      <img src="${htmxEsc(p.data)}" alt="${htmxEsc(p.caption || p.type || 'photo')}">
      <select class="wb-photo-tag" onchange="wbPhotoTag(${p.id}, this.value)">${['after', 'before', 'during'].map(t => `<option value="${t}" ${p.type === t ? 'selected' : ''}>${t[0].toUpperCase() + t.slice(1)}</option>`).join('')}</select>
      <button type="button" class="wb-photo-rm" onclick="wbPhotoRm(${p.id}, this)" title="Remove">✕</button>
    </div>`).join('');
    const photosBlock = `<h3 style="margin-top:24px">Photos <span style="text-transform:none;font-weight:400;color:var(--text-faint)">(${photos.length})</span></h3>
    <div class="wb-photos" id="wb-photos">${photoThumbs}</div>
    <div class="wb-upload">
      <label class="wb-upload-btn">＋ Add photo<input type="file" accept="image/*" id="wb-file" onchange="wbPhotoAdd()" hidden></label>
      <select id="wb-newtag">${['after', 'before', 'during'].map(t => `<option value="${t}">${t[0].toUpperCase() + t.slice(1)}</option>`).join('')}</select>
      <span id="wb-up-status" class="wb-up-status"></span>
    </div>
    <p style="color:var(--text-faint);font-size:.76em;margin:8px 0 0">Photos show in the Gallery section. Max ~300KB each.</p>`;

    // Reviews sync control — only shown when the Review Monitoring add-on is
    // active. Pulls fresh Google reviews (needs a Place ID in Settings) and
    // caches them in the reviews table for the public site to render.
    const reviewsBlock = ownedAddons.reviews ? `
    <h3 style="margin-top:24px">Reviews <span style="text-transform:none;font-weight:400;color:var(--text-faint)">(Google)</span></h3>
    <p style="font-size:.85em;color:var(--text-muted);margin-bottom:8px">
      Pulls your latest Google reviews automatically.
      <a href="/settings-htmx" style="color:var(--accent)">Set your Google Place ID in Settings →</a>
    </p>
    <button class="btn btn-ghost btn-sm" onclick="wbSyncReviews(event)">🔄 Sync reviews now</button>
    <span id="wb-rev-status" style="font-size:.82em;margin-left:10px;color:var(--text-muted)"></span>` : '';

    const addonBanner = hasAddon ? '' :
      `<div class="wb-banner"><strong>Website Builder add-on ($9.95/mo)</strong> — preview is free. <a href="/p/billing">Enable it to publish →</a></div>`;

    const publishBtn = hasAddon
      ? `<button class="btn btn-amber" id="wb-publish" onclick="wbPublish(${published ? 'false' : 'true'})">${published ? '⏸ Unpublish' : '🚀 Publish site'}</button>`
      : `<button class="btn btn-ghost" disabled title="Enable the Website Builder add-on to publish">🚀 Publish site</button>`;

    const body = `<div class="app">${sidebarNav('website', undefined, ctx)}<div class="content wb-content">
<span class="eyebrow">Website</span>
<h1>Your live site</h1>
<p class="sub">Pick a template, customize in real-time, publish in minutes. Everything pulls from your settings automatically${slug ? '' : ' — save a business name in Settings first'}.</p>
${addonBanner}
<div class="wb-grid">
  <div class="wb-controls card">
    <h3>Template</h3>
    <div class="wb-tpls">${tplCards}</div>
    <h3 style="margin-top:24px">Accent color</h3>
    <div class="wb-accents">${accentSwatches}</div>
    <h3 style="margin-top:24px">Headline</h3>
    <input type="text" id="wb-headline" class="wb-input" placeholder="(defaults to “${htmxEsc(businessName)}”)" value="${cfg.headline ? htmxEsc(cfg.headline) : ''}" oninput="wbRefreshDebounced()">
    <h3 style="margin-top:24px">Sections</h3>
    <div class="wb-toggles">${sectionToggles}</div>
    ${photosBlock}
    ${reviewsBlock}
    <div class="wb-actions">
      <button class="btn btn-ghost btn-sm" onclick="wbSave()">💾 Save</button>
      ${publishBtn}
    </div>
    ${published ? `<p class="wb-live"><span class="badge badge-new">Live</span> <a href="/s/${htmxEsc(slug)}" target="_blank">${htmxEsc(origin)}/s/${htmxEsc(slug)}</a></p>` : (slug ? `<p class="wb-live"><span class="badge">Preview only</span></p>` : '')}
  </div>
  <div class="wb-preview card">
    <div class="wb-preview-bar">
      <button class="wb-dev ${''}" onclick="wbDevice('desktop')" data-d="desktop">🖥 Desktop</button>
      <button class="wb-dev" onclick="wbDevice('mobile')" data-d="mobile">📱 Mobile</button>
    </div>
    <div class="wb-frame-wrap" id="wb-frame-wrap">
      ${previewUrl ? `<iframe id="wb-frame" src="${htmxEsc(previewUrl)}" loading="lazy"></iframe>` : '<div class="empty-state"><div class="empty-icon">🌐</div><div class="empty-title">No site yet</div><div class="empty-msg">Add your business name in Settings, then it builds itself.</div></div>'}
    </div>
  </div>
</div>
</div></div>
<style>
.wb-content{max-width:1240px}
.wb-banner{background:rgba(212,165,116,.1);border:1px solid var(--border-soft);color:var(--cream-dim);padding:12px 16px;border-radius:10px;margin:14px 0 20px;font-size:.9em}
.wb-banner a{color:var(--accent)}
.wb-grid{display:grid;grid-template-columns:360px 1fr;gap:20px;margin-top:20px;align-items:start}
@media(max-width:980px){.wb-grid{grid-template-columns:1fr}}
.wb-controls{padding:22px}
.wb-controls h3{font-size:.82em;text-transform:uppercase;letter-spacing:.06em;color:var(--text-muted);margin-bottom:12px}
.wb-tpls{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.wb-tpl{display:flex;flex-direction:column;align-items:flex-start;gap:4px;text-align:left;background:var(--bg-elev);border:1px solid var(--border);border-radius:10px;padding:12px;cursor:pointer;transition:border-color .2s,transform .1s}
.wb-tpl:hover{transform:translateY(-1px)}
.wb-tpl.sel{border-color:var(--accent);box-shadow:0 0 0 1px var(--accent) inset}
.wb-tpl-swatch{width:100%;height:34px;border-radius:6px;margin-bottom:2px}
.wb-swatch-modern{background:linear-gradient(135deg,#8b5cf6,#6366f1)}
.wb-swatch-warmcraft{background:linear-gradient(135deg,#2e2620,#d4a574)}
.wb-swatch-boldimpact{background:linear-gradient(135deg,#0d0d0d,#ef4444)}
.wb-swatch-softelegance{background:linear-gradient(135deg,#fdfaf7,#e8b4c8)}
.wb-swatch-minimalgrid{background:linear-gradient(135deg,#fafafa,#111)}
.wb-tpl-name{font-weight:600;font-size:.9em;color:var(--cream)}
.wb-tpl-best{font-size:.72em;color:var(--text-faint);line-height:1.3}
.wb-accents{display:flex;gap:8px;flex-wrap:wrap}
.wb-accent{width:30px;height:30px;border-radius:50%;border:2px solid transparent;cursor:pointer;transition:transform .1s}
.wb-accent.sel{border-color:var(--cream);box-shadow:0 0 0 2px var(--accent)}
.wb-accent:hover{transform:scale(1.1)}
.wb-input{width:100%;background:var(--bg-elev);border:1px solid var(--border);color:var(--cream);padding:10px 12px;border-radius:8px;font-family:inherit;font-size:.92em}
.wb-input:focus{outline:none;border-color:var(--accent)}
.wb-toggles{display:flex;flex-direction:column;gap:6px}
.wb-toggle{display:flex;align-items:center;gap:8px;font-size:.9em;color:var(--cream-dim);cursor:pointer;padding:3px 0}
.wb-toggle input{accent-color:var(--accent)}
.wb-actions{display:flex;gap:10px;margin-top:24px;flex-wrap:wrap}
.wb-live{margin-top:14px;font-size:.85em;color:var(--text-muted);display:flex;align-items:center;gap:8px;word-break:break-all}
.wb-live a{color:var(--accent)}
.wb-preview{padding:0;overflow:hidden;min-height:520px;display:flex;flex-direction:column}
.wb-preview-bar{display:flex;gap:4px;padding:8px;border-bottom:1px solid var(--border);background:var(--bg-elev)}
.wb-dev{background:transparent;border:1px solid transparent;color:var(--text-muted);padding:6px 12px;border-radius:6px;font-size:.82em;cursor:pointer}
.wb-dev.active{background:var(--bg-primary);color:var(--cream);border-color:var(--border)}
.wb-frame-wrap{flex:1;background:#fff;display:flex;justify-content:center;align-items:flex-start;padding:0;overflow:auto}
.wb-frame-wrap.mobile{padding:14px;background:var(--bg-elev)}
#wb-frame{width:100%;height:640px;border:0;background:#fff}
.wb-frame-wrap.mobile #wb-frame{width:390px;height:680px;border-radius:24px;box-shadow:0 8px 40px rgba(0,0,0,.4);border:8px solid #111}
.wb-photos{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:10px}
.wb-photo{position:relative;border-radius:8px;overflow:hidden;border:1px solid var(--border);background:var(--bg-elev)}
.wb-photo img{width:100%;height:64px;object-fit:cover;display:block}
.wb-photo-tag{position:absolute;bottom:3px;left:3px;background:rgba(10,10,18,.85);color:var(--cream);border:0;border-radius:4px;font-size:.62em;padding:1px 3px}
.wb-photo-rm{position:absolute;top:3px;right:3px;background:rgba(220,38,38,.9);color:#fff;border:0;border-radius:50%;width:16px;height:16px;font-size:.7em;line-height:1;cursor:pointer;padding:0}
.wb-photo-rm:hover{background:#dc2626}
.wb-upload{display:flex;align-items:center;gap:10px;flex-wrap:wrap}
.wb-upload-btn{display:inline-block;background:var(--bg-elev);border:1px dashed var(--border-soft);color:var(--cream-dim);padding:8px 14px;border-radius:8px;font-size:.85em;cursor:pointer;transition:border-color .2s}
.wb-upload-btn:hover{border-color:var(--accent);color:var(--accent)}
.wb-upload select{background:var(--bg-elev);border:1px solid var(--border);color:var(--cream);border-radius:6px;padding:6px 8px;font-size:.82em}
.wb-up-status{font-size:.78em;color:var(--text-muted)}
</style>
<script>
(function(){
  var SLUG=${JSON.stringify(slug)};
  var ORIGIN=${JSON.stringify(origin)};
  var PUBLISHED=${JSON.stringify(published)};
  var HASADDON=${JSON.stringify(hasAddon)};
  // Add-on ownership: when a section is toggled ON but its add-on isn't
  // purchased, we send a preview* param so the iframe shows sample data + a
  // lock overlay instead of hiding the section.
  var OWNED=${JSON.stringify(ownedAddons)};
  var frame=document.getElementById('wb-frame');
  var frameWrap=document.getElementById('wb-frame-wrap');
  var debounceT;
  function sectionOn(key){ var cb=document.querySelector('.wb-toggle input[data-sec="'+key+'"]'); return cb&&cb.checked; }
  function buildPreviewQs(){
    if(!SLUG)return '';
    var p=new URLSearchParams();
    p.set('preview','1');
    var sel=document.querySelector('.wb-tpl.sel'); if(sel)p.set('template',sel.dataset.tpl);
    var ac=document.querySelector('.wb-accent.sel'); if(ac)p.set('accent',ac.dataset.accent);
    var hl=document.getElementById('wb-headline'); if(hl&&hl.value)p.set('headline',hl.value);
    var on=[],off=[];
    document.querySelectorAll('.wb-toggle input').forEach(function(cb){ (cb.checked?on:off).push(cb.dataset.sec); });
    if(on.length)p.set('sections',on.join(','));
    // Preview sample data for add-ons the business doesn't own yet.
    if(sectionOn('reviews')&&!OWNED.reviews)p.set('previewReviews','1');
    if(sectionOn('blog')&&!OWNED.blog)p.set('previewBlog','1');
    if(sectionOn('social')&&!OWNED.social)p.set('previewSocial','1');
    return '?'+p.toString();
  }
  function refresh(){ if(frame) frame.src=ORIGIN+'/s/'+SLUG+buildPreviewQs(); }
  window.wbRefresh=refresh;
  window.wbRefreshDebounced=function(){ clearTimeout(debounceT); debounceT=setTimeout(refresh,350); };
  window.wbPickTpl=function(t){ document.querySelectorAll('.wb-tpl').forEach(function(b){b.classList.toggle('sel',b.dataset.tpl===t);}); refresh(); };
  window.wbPickAccent=function(c){ document.querySelectorAll('.wb-accent').forEach(function(b){b.classList.toggle('sel',b.dataset.accent===c);}); refresh(); };
  window.wbDevice=function(d){ document.querySelectorAll('.wb-dev').forEach(function(b){b.classList.toggle('active',b.dataset.d===d);}); if(frameWrap)frameWrap.classList.toggle('mobile',d==='mobile'); };
  // default device active
  document.querySelector('.wb-dev[data-d="desktop"]').classList.add('active');
  window.wbSave=function(){
    var payload={template:(document.querySelector('.wb-tpl.sel')||{}).dataset.tpl||'modern', accent:(document.querySelector('.wb-accent.sel')||{}).dataset.accent||'#d4a574', headline:(document.getElementById('wb-headline')||{}).value||null, sections:{}};
    document.querySelectorAll('.wb-toggle input').forEach(function(cb){ payload.sections[cb.dataset.sec]=cb.checked; });
    fetch('/api/sites/config',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)}).then(function(r){return r.json()}).then(function(d){ wbToast(d.ok?'Saved ✓':('Error: '+(d.error||''))); }).catch(function(){ wbToast('Save failed'); });
  };
  window.wbPublish=function(makeLive){
    if(!HASADDON){ wbToast('Enable the Website Builder add-on first.'); return; }
    fetch('/api/sites/publish',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({published:makeLive})}).then(function(r){return r.json()}).then(function(d){ if(d.ok){ wbToast(makeLive?'Published 🚀':'Unpublished'); setTimeout(function(){location.reload();},800);} else wbToast('Error: '+(d.error||'')); }).catch(function(){ wbToast('Publish failed'); });
  };
  function wbToast(msg){ var t=document.createElement('div'); t.textContent=msg; t.style.cssText='position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:var(--accent);color:#1a1a2e;padding:10px 20px;border-radius:8px;font-weight:600;z-index:200;box-shadow:0 8px 24px rgba(0,0,0,.4)'; document.body.appendChild(t); setTimeout(function(){t.remove();},1800); }
  window.wbToast=wbToast;
  // Photos — upload / retag / remove. The builder is cookie-authed (no Bearer
  // token available client-side), so these hit the -htmx wrappers which resolve
  // the user from the session cookie.
  window.wbPhotoAdd=function(){
    var f=document.getElementById('wb-file'); if(!f||!f.files||!f.files[0])return;
    var fd=new FormData(); fd.append('file',f.files[0]); fd.append('type',(document.getElementById('wb-newtag')||{}).value||'after');
    var st=document.getElementById('wb-up-status'); if(st)st.textContent='Uploading…';
    fetch('/api/photos/upload-htmx',{method:'POST',body:fd}).then(function(r){return r.json()}).then(function(d){
      if(st)st.textContent='';
      if(d.ok){ wbToast('Photo added ✓'); setTimeout(function(){location.reload();},500); }
      else wbToast('Error: '+(d.error||'upload failed'));
      f.value='';
    }).catch(function(){ if(st)st.textContent=''; wbToast('Upload failed'); f.value=''; });
  };
  window.wbPhotoTag=function(id,tag){
    fetch('/api/photos/tag-htmx',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:id,type:tag})}).then(function(r){return r.json()}).then(function(d){ if(!d.ok)wbToast('Could not update tag'); else refresh(); });
  };
  window.wbPhotoRm=function(id,btn){
    if(!confirm('Remove this photo from your gallery?'))return;
    fetch('/api/photos/delete-htmx',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:id})}).then(function(r){return r.json()}).then(function(d){
      if(d.ok){ var ph=btn.closest('.wb-photo'); if(ph)ph.remove(); wbToast('Removed'); refresh(); }
      else wbToast('Could not remove: '+(d.error||''));
    }).catch(function(){ wbToast('Remove failed'); });
  };
  // Review sync — pulls fresh Google reviews (cookie-authed, no Bearer). The
  // button's onclick passes the event so we can grab the clicked element.
  window.wbSyncReviews=function(ev){
    var btn=ev&&ev.target?ev.target:document.querySelector('[onclick^="wbSyncReviews"]');
    var st=document.getElementById('wb-rev-status');
    if(btn){btn.disabled=true;btn.textContent='Syncing…';}
    if(st)st.textContent='';
    fetch('/api/reviews/sync',{method:'POST'}).then(function(r){return r.json()}).then(function(d){
      if(btn){btn.disabled=false;btn.textContent='🔄 Sync reviews now';}
      if(st)st.textContent=d.message||(d.ok?'Done':'Failed');
      // Refresh the iframe so newly-synced reviews render in the preview.
      if(d.ok)refresh();
    }).catch(function(){
      if(btn){btn.disabled=false;btn.textContent='🔄 Sync reviews now';}
      if(st)st.textContent='Sync failed';
    });
  };
})();
</script>`;

    return new Response(simpleShell('Website Builder', body), { headers: { 'Content-Type': 'text/html' } });
  } catch (e) {
    console.error('Website builder htmx error:', e);
    return new Response(simpleShell('Error', '<h1>⚠️ Error</h1><p style="color:#f85149">Could not load the website builder.</p>'), { headers: { 'Content-Type': 'text/html' }, status: 500 });
  }
}

// Admin overview of every business site. Lists slug, template, published
// state, custom-domain status, and live/preview links. Admin-only (uid===1).
async function handleAdminSites(request, env, pUid) {
  const denied = requireAdmin(pUid);
  if (denied) return denied;
  try {
    const origin = new URL(request.url).origin;
    const { results } = await env.DB.prepare(
      `SELECT s.id, s.user_id, s.slug, s.theme, s.published, s.custom_domain, s.config,
              COALESCE(st.business_name,('user '||s.user_id)) AS business_name
       FROM sites s LEFT JOIN settings st ON st.user_id = s.user_id
       ORDER BY s.created_at DESC`
    ).all();
    const rows = (results || []).map(s => {
      const cfg = normalizeSiteConfig(s, {});
      const meta = SITE_TEMPLATE_META[cfg.template] || { label: cfg.template };
      const liveHref = s.slug ? `${origin}/s/${htmxEsc(s.slug)}` : '';
      return `<tr>
        <td><strong>${htmxEsc(s.business_name)}</strong><br><span style="color:var(--text-faint);font-size:.78em">user ${s.user_id}</span></td>
        <td>${s.slug ? `<a href="${htmxEsc(liveHref)}" target="_blank">/s/${htmxEsc(s.slug)}</a>` : '<span style="color:var(--text-faint)">—</span>'}</td>
        <td><span class="chip">${htmxEsc(meta.label)}</span></td>
        <td>${s.published ? '<span class="badge badge-new">Live</span>' : '<span class="badge">Draft</span>'}</td>
        <td>${s.custom_domain ? htmxEsc(s.custom_domain) : '<span style="color:var(--text-faint)">—</span>'}</td>
      </tr>`;
    }).join('');
    const body = `<div class="app">${sidebarNav('admin', true)}${adminNav('sites')}<div class="content">
<span class="eyebrow">Admin</span>
<h1>Business websites</h1>
<p class="sub">Every auto-generated site across Branch Live.</p>
<table>
  <thead><tr><th>Business</th><th>URL</th><th>Template</th><th>Status</th><th>Custom domain</th></tr></thead>
  <tbody>${rows || '<tr><td colspan="5" style="color:var(--text-muted);text-align:center;padding:30px">No sites yet.</td></tr>'}</tbody>
</table>
</div></div>`;
    return new Response(simpleShell('Business Websites · Admin', body), { headers: { 'Content-Type': 'text/html' } });
  } catch (e) {
    console.error('Admin sites error:', e);
    return new Response(adminShell('sites', 'Error', '<h1>⚠️ Error</h1><p style="color:#f85149">Could not load business websites.</p>'), { headers: { 'Content-Type': 'text/html' }, status: 500 });
  }
}

// Sitemap of all published business sites. Linked from the landing footer /
// submitted to search engines. Plain XML, no shell.
async function handleSitesSitemap(request, env) {
  try {
    const origin = new URL(request.url).origin;
    const { results } = await env.DB.prepare(
      "SELECT slug FROM sites WHERE published = 1 AND slug IS NOT NULL ORDER BY created_at DESC"
    ).all();
    const today = new Date().toISOString().slice(0, 10);
    const urls = (results || []).map(s =>
      `  <url>\n    <loc>${htmxEsc(origin)}/s/${htmxEsc(s.slug)}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.8</priority>\n  </url>`
    ).join('\n');
    const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>`;
    return new Response(xml, { headers: { 'Content-Type': 'application/xml' } });
  } catch (e) {
    console.error('Sites sitemap error:', e);
    return new Response('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>', { status: 500, headers: { 'Content-Type': 'application/xml' } });
  }
}

// ═══════════════════════════════════════════════════════════════════════
// COLD OUTREACH PIPELINE — Apollo prospect search → TextMagic SMS blast →
// conversion tracking. Degrades gracefully when API keys are missing.
// Secrets: APOLLO_API_KEY, TEXTMAGIC_USERNAME, TEXTMAGIC_API_KEY (wrangler
// secret put). Phase 3 auto-flips prospect status as they progress through
// the funnel (demo = called Emma, signed-up = paid via Stripe).
// ═══════════════════════════════════════════════════════════════════════

// Normalize any US phone-ish string to E.164 (+1NPANXXXXXX). Apollo returns
// mixed formats; Vapi/TextMagic/Stripe all use E.164, so this is the dedupe +
// match key across the whole funnel. Never throws; bad input → ''.
function normalizePhoneE164(raw) {
  const digits = String(raw || '').replace(/[^0-9]/g, '');
  if (digits.length === 11 && digits[0] === '1') return '+' + digits;
  if (digits.length === 10) return '+1' + digits;
  return digits.length > 6 ? '+' + digits : '';
}

// Map a friendly industry label (plumbing/HVAC/roofing) to the title + NAICS
// industry filter Apollo expects. Businesss run the company, so we target
// owner/operator titles. Kept conservative to stay relevant.
const OUTREACH_INDUSTRIES = {
  plumbing:  { label: 'Plumbing',           titles: ['Owner', 'Founder', 'CEO', 'President', 'Plumber'], industries: ['Construction'] },
  hvac:      { label: 'HVAC',               titles: ['Owner', 'Founder', 'CEO', 'President'],            industries: ['Construction'] },
  roofing:   { label: 'Roofing',            titles: ['Owner', 'Founder', 'CEO', 'President'],            industries: ['Construction'] },
  electrical:{ label: 'Electrical',         titles: ['Owner', 'Founder', 'CEO', 'President', 'Electrician'], industries: ['Construction'] },
  landscaping:{ label: 'Landscaping',       titles: ['Owner', 'Founder', 'CEO', 'President'],            industries: ['Construction'] },
  cleaning:  { label: 'Cleaning',           titles: ['Owner', 'Founder', 'CEO', 'President'],            industries: ['Facilities Services'] },
};

// The pre-written outreach template. {name} is replaced with the prospect's
// first name (or "there"). Compliant: sender identity, no SHAFT content, and
// the inbound demo number doubles as the opt-out contact. Kept under 160 chars
// so it lands as a single SMS segment.
const OUTREACH_TEMPLATE = 'Hi {name}, this is Emma from Branch Live. I\'m an AI that answers phones 24/7 for local businesses. Call me for a 30-second demo: (872) 829-1192. $29.95/mo. 30 days free.';

// Only blast during US business hours (ET) per A2P/CTIA guidance. Quiet hours
// outside Mon–Sat 9am–8pm ET; Sundays off. Returns true if it's OK to send now.
function withinSmsWindow(date = new Date()) {
  // ET is UTC-5 (standard) / UTC-4 (daylight). Compute via offset to avoid TZ
  // libs: the US Eastern offset is -5 in winter, -4 in summer.
  const utc = date.getUTCMinutes() + date.getUTCHours() * 60;
  const etOffset = isDST(date) ? -4 : -5;
  let etHour = Math.floor(((utc + etOffset * 60) % 1440) + 1440) % 1440;
  const dow = new Date(date.getTime() + etOffset * 3600000).getUTCDay(); // 0=Sun
  if (dow === 0) return false; // Sunday
  const start = 9 * 60, end = 20 * 60; // 9am–8pm ET
  return etHour >= start && etHour < end;
}
// Rough US DST detector (second Sunday of March → first Sunday of November).
function isDST(date) {
  const m = date.getUTCMonth();
  const d = date.getUTCDate();
  if (m < 2 || m > 10) return false;
  if (m > 2 && m < 10) return true;
  if (m === 2) return d >= 14;            // past 2nd week of March → likely DST
  return d < 7;                            // before 2nd week of Nov → likely DST
}

// ── Apollo prospect search ──
// Never throws. Returns { ok, added?, total?, error? }. Dedupes against the
// existing prospect table by normalized phone (and ignores numbers Apollo hid).
async function searchApolloProspects(env, { industry, location, limit }) {
  if (!env.APOLLO_API_KEY) {
    return { ok: false, error: 'Apollo API key not configured. Add it with: npx wrangler secret put APOLLO_API_KEY' };
  }
  const ind = OUTREACH_INDUSTRIES[(industry || '').toLowerCase()];
  if (!ind) {
    return { ok: false, error: 'Unknown industry. Pick one of: ' + Object.keys(OUTREACH_INDUSTRIES).join(', ') };
  }
  const perPage = Math.min(Math.max(parseInt(limit, 10) || 25, 1), 100);
  let resp;
  try {
    resp = await fetch('https://api.apollo.io/v1/mixed_people/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
        'X-Api-Key': env.APOLLO_API_KEY,
      },
      body: JSON.stringify({
        api_key: env.APOLLO_API_KEY, // Apollo accepts key in body too; harmless.
        page: 1,
        per_page: perPage,
        person_titles: ind.titles,
        person_locations: location ? [location] : ['United States'],
        organization_industries: ind.industries,
        contact_emails: true,
      }),
    });
  } catch (e) {
    return { ok: false, error: 'Apollo request failed: ' + (e.message || e) };
  }
  if (!resp.ok) {
    let detail = '';
    try { detail = ' — ' + (await resp.text()).slice(0, 300); } catch (e) {}
    return { ok: false, error: `Apollo returned HTTP ${resp.status}${detail}` };
  }
  let data;
  try { data = await resp.json(); } catch (e) {
    return { ok: false, error: 'Apollo returned a non-JSON response' };
  }
  const people = (data && data.people) || [];

  // Load existing normalized phones once so we dedupe within this batch + DB.
  const existing = await env.DB.prepare(
    'SELECT phone FROM outreach_prospects WHERE phone IS NOT NULL AND phone != \'\''
  ).all();
  const seen = new Set((existing.results || []).map(r => r.phone).filter(Boolean));

  let added = 0, skipped = 0;
  const now = nowISO();
  for (const p of people) {
    const rawPhone = (p.phone_numbers && p.phone_numbers[0] && (p.phone_numbers[0].sanitized_number || p.phone_numbers[0].number)) || p.phone || '';
    const phone = normalizePhoneE164(rawPhone);
    if (!phone || seen.has(phone)) { skipped++; continue; }
    const name = p.name || [p.first_name, p.last_name].filter(Boolean).join(' ') || '';
    const company = (p.organization && (p.organization.name)) || p.company || '';
    const email = p.email || '';
    await env.DB.prepare(
      `INSERT INTO outreach_prospects (name, company, phone, email, industry, location, status, source, created_at)
       VALUES (?, ?, ?, ?, ?, ?, 'new', 'apollo', ?)`
    ).bind(name, company, phone, email, ind.label, location || 'United States', now).run();
    seen.add(phone);
    added++;
  }
  return { ok: true, added, skipped, searched: people.length };
}

// POST /api/outreach/search (admin only) — body: { industry, location, limit }
async function handleOutreachSearch(request, env, uid) {
  if (uid !== 1) return apiError('Admin access required', 403);
  try {
    const body = await request.json().catch(() => ({}));
    const result = await searchApolloProspects(env, {
      industry: body.industry,
      location: body.location,
      limit: body.limit,
    });
    if (!result.ok) return apiError(result.error, 400);
    return json({ ok: true, ...result });
  } catch (e) {
    console.error('Outreach search error:', e);
    return apiError('Could not search for prospects', 500);
  }
}

// ── TextMagic SMS blast ──
// Sends to status='new' prospects (capped at maxCount), during business hours
// only. Flips each successful send to status='contacted'. Returns a per-number
// result list so the dashboard can show exactly what happened.
async function sendTextMagicSms(env, { to, text }) {
  const user = env.TEXTMAGIC_USERNAME;
  const key = env.TEXTMAGIC_API_KEY;
  if (!user || !key) return { ok: false, error: 'TextMagic not configured' };
  try {
    const resp = await fetch('https://rest.textmagic.com/api/v2/messages', {
      method: 'POST',
      headers: {
        'X-TM-Username': user,
        'X-TM-Key': key,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ phones: to, text }),
    });
    const txt = await resp.text();
    let parsed = null; try { parsed = JSON.parse(txt); } catch (e) {}
    if (!resp.ok) {
      const msg = (parsed && (parsed.message || parsed.error)) || ('HTTP ' + resp.status);
      return { ok: false, error: msg };
    }
    return { ok: true, id: parsed && parsed.id };
  } catch (e) {
    return { ok: false, error: 'TextMagic request failed: ' + (e.message || e) };
  }
}

// POST /api/outreach/text-blast (admin only) — body: { template?, max_count? }
async function handleOutreachTextBlast(request, env, uid) {
  if (uid !== 1) return apiError('Admin access required', 403);
  try {
    const body = await request.json().catch(() => ({}));
    const template = body.template || OUTREACH_TEMPLATE;
    const maxCount = Math.min(Math.max(parseInt(body.max_count, 10) || 50, 1), 500);

    if (!env.TEXTMAGIC_USERNAME || !env.TEXTMAGIC_API_KEY) {
      return apiError('TextMagic API key not configured. Add it with: npx wrangler secret put TEXTMAGIC_API_KEY (and TEXTMAGIC_USERNAME).');
    }
    // A2P compliance — refuse to send outside the US business-hours window.
    if (!withinSmsWindow()) {
      return apiError('Outside the allowed send window. SMS only sends Mon–Sat 9am–8pm US Eastern (A2P compliance). Try again during business hours.');
    }

    const { results } = await env.DB.prepare(
      `SELECT id, name, phone FROM outreach_prospects
       WHERE status = 'new' AND phone IS NOT NULL AND phone != ''
       ORDER BY created_at ASC LIMIT ?`
    ).bind(maxCount).all();
    const prospects = results || [];
    if (!prospects.length) {
      return json({ ok: true, sent: 0, message: 'No new prospects to text. Run a search first.' });
    }

    const sent = [];
    const failed = [];
    const now = nowISO();
    for (const p of prospects) {
      const first = (p.name || '').split(/\s+/)[0] || 'there';
      const text = template.replace(/\{name\}/g, first);
      const r = await sendTextMagicSms(env, { to: p.phone, text });
      if (r.ok) {
        await env.DB.prepare(
          'UPDATE outreach_prospects SET status = ?, contacted_at = ? WHERE id = ?'
        ).bind('contacted', now, p.id).run();
        sent.push(p.phone);
      } else {
        failed.push({ phone: p.phone, error: r.error });
      }
    }
    return json({ ok: true, sent: sent.length, failed });
  } catch (e) {
    console.error('Outreach text-blast error:', e);
    return apiError('Could not send text blast', 500);
  }
}

// ── Conversion hooks (called from Vapi webhook + Stripe webhook) ──

// Phase 3a: a texted prospect called Emma. Match by normalized caller phone;
// if found and still 'contacted', advance to 'demo'. Best-effort, never throws.
async function markProspectDemoIfTexted(env, callerPhone) {
  try {
    const phone = normalizePhoneE164(callerPhone);
    if (!phone) return;
    await env.DB.prepare(
      `UPDATE outreach_prospects SET status = 'demo', demo_at = datetime('now')
       WHERE phone = ? AND status = 'contacted'`
    ).bind(phone).run();
  } catch (e) {
    console.error('markProspectDemo error:', e.message);
  }
}

// Phase 3b: a prospect signed up (created a Branch Live account). Match by the
// signup phone against texted prospects. Advances 'demo' or 'contacted' →
// 'signed-up'. Best-effort, never throws.
async function markProspectSignedUpIfTexted(env, signupPhone) {
  try {
    const phone = normalizePhoneE164(signupPhone);
    if (!phone) return;
    await env.DB.prepare(
      `UPDATE outreach_prospects SET status = 'signed-up', signedup_at = datetime('now')
       WHERE phone = ? AND status IN ('contacted', 'demo')`
    ).bind(phone).run();
  } catch (e) {
    console.error('markProspectSignedUp error:', e.message);
  }
}

// ── Outreach dashboard (/p/outreach) ──
// Funnel stats (searched → contacted → demo → signed-up), the prospect table,
// a search form (industry/location), and the text-blast button. Degrades to a
// setup prompt when the API keys aren't configured yet.
async function handleOutreachHtmx(request, env, uid, ctx) {
  try {
    // Admin-only page
    if (uid !== 1) return new Response(simpleShell('Access denied', '<div class="app"><div class="content"><h1>Access denied</h1><p>This page is restricted to administrators.</p></div></div>'), { status: 403, headers: { 'Content-Type': 'text/html' } });
    const apolloReady = !!env.APOLLO_API_KEY;
    const textMagicReady = !!(env.TEXTMAGIC_USERNAME && env.TEXTMAGIC_API_KEY);

    // Funnel counts
    const funnel = await env.DB.prepare(
      `SELECT
         COUNT(*) AS total,
         SUM(CASE WHEN status IN ('contacted','demo','signed-up') THEN 1 ELSE 0 END) AS contacted,
         SUM(CASE WHEN status IN ('demo','signed-up') THEN 1 ELSE 0 END) AS demo,
         SUM(CASE WHEN status = 'signed-up' THEN 1 ELSE 0 END) AS signed_up,
         SUM(CASE WHEN status = 'new' THEN 1 ELSE 0 END) AS fresh
       FROM outreach_prospects`
    ).first() || {};
    const convRate = funnel.contacted > 0
      ? Math.round((funnel.signed_up / funnel.contacted) * 100)
      : 0;

    // Recent prospects (latest 60)
    const { results } = await env.DB.prepare(
      `SELECT name, company, phone, email, industry, location, status, created_at, contacted_at
       FROM outreach_prospects ORDER BY created_at DESC LIMIT 60`
    ).all();
    const prospects = results || [];

    const industryOpts = Object.entries(OUTREACH_INDUSTRIES)
      .map(([k, v]) => `<option value="${k}">${v.label}</option>`).join('');

    // Search card — disabled with a setup hint when Apollo isn't configured.
    const searchCard = apolloReady ? `<div class="card glow" style="margin-top:24px">
      <h3 style="margin-top:0">🔎 Find prospects (Apollo)</h3>
      <div style="display:flex;gap:12px;flex-wrap:wrap;align-items:end">
        <div style="flex:1;min-width:160px">
          <label style="display:block;font-size:.74rem;font-family:var(--font-mono);color:var(--text-muted);margin-bottom:6px;text-transform:uppercase">Industry</label>
          <select id="ot-industry" style="width:100%;box-sizing:border-box">${industryOpts}</select>
        </div>
        <div style="flex:1;min-width:160px">
          <label style="display:block;font-size:.74rem;font-family:var(--font-mono);color:var(--text-muted);margin-bottom:6px;text-transform:uppercase">Location</label>
          <input id="ot-location" type="text" placeholder="e.g. Texas, Chicago, United States" value="United States" style="width:100%;box-sizing:border-box">
        </div>
        <div style="min-width:90px">
          <label style="display:block;font-size:.74rem;font-family:var(--font-mono);color:var(--text-muted);margin-bottom:6px;text-transform:uppercase">Limit</label>
          <input id="ot-limit" type="number" value="25" min="1" max="100" style="width:100%;box-sizing:border-box">
        </div>
        <button id="ot-search-btn" class="btn" onclick="otSearch()">Search</button>
      </div>
      <div id="ot-search-fb" style="margin-top:12px;font-size:.88rem;min-height:1.2em;font-family:var(--font-mono)"></div>
    </div>` : `<div class="card" style="margin-top:24px;border-color:rgba(212,165,116,.4)">
      <h3 style="margin-top:0">🔎 Find prospects (Apollo)</h3>
      <p style="color:var(--text-muted);font-size:.92rem">Apollo isn't connected yet. Add your key to start pulling business prospects:</p>
      <pre style="background:var(--bg-primary);border:1px solid var(--border);border-radius:10px;padding:12px;margin-top:10px;overflow-x:auto;font-family:var(--font-mono);font-size:.82rem;color:var(--accent-amber)">npx wrangler secret put APOLLO_API_KEY</pre>
    </div>`;

    // Blast card — disabled when TextMagic isn't configured or no fresh leads.
    const canBlast = textMagicReady && (funnel.fresh > 0);
    const blastCard = textMagicReady ? `<div class="card glow" style="margin-top:20px">
      <h3 style="margin-top:0">📣 Text blast (TextMagic)</h3>
      <p style="color:var(--text-muted);font-size:.9rem;margin-bottom:14px">${funnel.fresh || 0} new prospect${(funnel.fresh || 0) === 1 ? '' : 's'} waiting. Sends the demo invite, then marks them contacted. Only sends Mon–Sat 9am–8pm US Eastern.</p>
      <div style="display:flex;gap:12px;align-items:end;flex-wrap:wrap">
        <div style="min-width:90px">
          <label style="display:block;font-size:.74rem;font-family:var(--font-mono);color:var(--text-muted);margin-bottom:6px;text-transform:uppercase">Max count</label>
          <input id="ot-blast-count" type="number" value="50" min="1" max="500" style="width:100%;box-sizing:border-box">
        </div>
        <button id="ot-blast-btn" class="btn" ${canBlast ? '' : 'disabled style="opacity:.5;cursor:not-allowed"'} onclick="otBlast()">Send blast</button>
      </div>
      <div id="ot-blast-fb" style="margin-top:12px;font-size:.88rem;min-height:1.2em;font-family:var(--font-mono)"></div>
    </div>` : `<div class="card" style="margin-top:20px;border-color:rgba(212,165,116,.4)">
      <h3 style="margin-top:0">📣 Text blast (TextMagic)</h3>
      <p style="color:var(--text-muted);font-size:.92rem">TextMagic isn't connected yet. Add your credentials to start blasting:</p>
      <pre style="background:var(--bg-primary);border:1px solid var(--border);border-radius:10px;padding:12px;margin-top:10px;overflow-x:auto;font-family:var(--font-mono);font-size:.82rem;color:var(--accent-amber)">npx wrangler secret put TEXTMAGIC_USERNAME
npx wrangler secret put TEXTMAGIC_API_KEY</pre>
    </div>`;

    const pillCls = { new: 'pill-new', contacted: 'pill-contacted', demo: 'pill-booked', 'signed-up': 'pill-booked' };
    const rows = prospects.length ? prospects.map(p => {
      const dispName = htmxEsc(p.name || '—');
      const dispPhone = htmxEsc(p.phone || '—');
      return `<tr>
        <td>${dispName}${p.company ? `<div style="color:var(--text-muted);font-size:.82rem">${htmxEsc(p.company)}</div>` : ''}</td>
        <td class="mono">${dispPhone}</td>
        <td>${htmxEsc(p.industry || '—')}</td>
        <td style="color:var(--text-muted)">${htmxEsc(p.location || '—')}</td>
        <td><span class="status-pill ${pillCls[p.status] || 'pill-new'}">${htmxEsc(p.status)}</span></td>
      </tr>`;
    }).join('') : `<tr><td colspan="5" style="text-align:center;color:var(--text-faint);padding:40px">No prospects yet — run a search above.</td></tr>`;

    const convNote = (funnel.contacted || 0) > 0
      ? `<p class="sub" style="margin-top:14px;font-size:.9rem">${convRate}% conversion (signed up ÷ contacted).</p>`
      : '';

    const body = `<div class="app">${sidebarNav('outreach', undefined, ctx)}<div class="content" style="max-width:1100px">
  ${outreachContentInner({ funnel, convRate, convNote, searchCard, blastCard, rows })}
</div></div>`;
    return new Response(simpleShell('Outreach', body), { headers: { 'Content-Type': 'text/html' } });
  } catch (e) {
    console.error('Outreach dashboard error:', e);
    return new Response(simpleShell('Error', '<h1>⚠️ Error</h1><p style="color:#f85149">Could not load the outreach dashboard.</p>'), { headers: { 'Content-Type': 'text/html' }, status: 500 });
  }
}

// Outreach page inner content — the funnel stats, search/blast cards, prospect
// table, and client-side JS. Shared by /p/outreach (its own sidebar shell) and
// /p/admin/outreach (wrapped in the admin shell) so the two render identical
// content without duplicating markup. Takes the pre-computed pieces so callers
// reuse the queries they've already run.
function outreachContentInner({ funnel, convRate, convNote, searchCard, blastCard, rows }) {
  return `<span class="eyebrow">Cold outreach</span>
  <h1>Find &amp; <em>convert</em> businesses</h1>
  <p class="sub">Pull prospects from Apollo, text them a demo invite, and watch them funnel through to signup.</p>
  <div class="grid2">
    <div class="stat-card"><div class="stat-num">${funnel.total || 0}</div><div class="stat-lab">Searched</div></div>
    <div class="stat-card"><div class="stat-num">${funnel.contacted || 0}</div><div class="stat-lab">Contacted</div></div>
    <div class="stat-card"><div class="stat-num purple">${funnel.demo || 0}</div><div class="stat-lab">Called Emma</div></div>
    <div class="stat-card"><div class="stat-num green">${funnel.signed_up || 0}</div><div class="stat-lab">Signed Up</div></div>
  </div>
  ${convNote}
  ${searchCard}
  ${blastCard}
  <h3>Recent prospects</h3>
  <table>
    <thead><tr><th>Name</th><th>Phone</th><th>Industry</th><th>Location</th><th>Status</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>
  <script>
  function otFb(id,msg,ok){var el=document.getElementById(id);el.textContent=msg;el.style.color=ok?'var(--accent-amber)':'var(--danger)';}
  async function otSearch(){
    var btn=document.getElementById('ot-search-btn');btn.disabled=true;otFb('ot-search-fb','Searching…',true);
    try{
      var r=await fetch('/api/outreach/search',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({
        industry:document.getElementById('ot-industry').value,
        location:document.getElementById('ot-location').value||'United States',
        limit:parseInt(document.getElementById('ot-limit').value,10)||25
      })});
      var d=await r.json();
      if(d.ok){otFb('ot-search-fb','✓ Added '+d.added+' new prospect'+(d.added===1?'':'s')+(d.skipped?(' · '+d.skipped+' duplicate'):'')+'. Reload to view.',true);setTimeout(function(){location.reload();},1500);}
      else{otFb('ot-search-fb','✗ '+(d.error||'Search failed'),false);}
    }catch(e){otFb('ot-search-fb','✗ Connection error',false);}btn.disabled=false;
  }
  async function otBlast(){
    if(!confirm('Send the demo-invite text now? This texts every new prospect up to your max count.'))return;
    var btn=document.getElementById('ot-blast-btn');btn.disabled=true;otFb('ot-blast-fb','Sending…',true);
    try{
      var r=await fetch('/api/outreach/text-blast',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({
        max_count:parseInt(document.getElementById('ot-blast-count').value,10)||50
      })});
      var d=await r.json();
      if(d.ok){var msg='✓ Sent '+d.sent+' text'+(d.sent===1?'':'s')+(d.failed&&d.failed.length?(' · '+d.failed.length+' failed'):'')+'.';otFb('ot-blast-fb',msg,true);setTimeout(function(){location.reload();},1500);}
      else{otFb('ot-blast-fb','✗ '+(d.error||'Blast failed'),false);}
    }catch(e){otFb('ot-blast-fb','✗ Connection error',false);}btn.disabled=false;
  }
  </script>`;
}

// /p/admin/outreach — the outreach content rendered INSIDE the admin shell, so
// the admin sub-nav (Overview | Accounts | Outreach | Support | Analytics)
// stays visible. Same data + cards as /p/outreach (via outreachContentInner),
// just wrapped in adminShell('outreach', ...) instead of its own sidebar nav.
async function handleAdminOutreachHtmx(request, env, uid) {
  const denied = requireAdmin(uid);
  if (denied) return denied;
  try {
    const apolloReady = !!env.APOLLO_API_KEY;
    const textMagicReady = !!(env.TEXTMAGIC_USERNAME && env.TEXTMAGIC_API_KEY);

    const funnel = await env.DB.prepare(
      `SELECT
         COUNT(*) AS total,
         SUM(CASE WHEN status IN ('contacted','demo','signed-up') THEN 1 ELSE 0 END) AS contacted,
         SUM(CASE WHEN status IN ('demo','signed-up') THEN 1 ELSE 0 END) AS demo,
         SUM(CASE WHEN status = 'signed-up' THEN 1 ELSE 0 END) AS signed_up,
         SUM(CASE WHEN status = 'new' THEN 1 ELSE 0 END) AS fresh
       FROM outreach_prospects`
    ).first() || {};
    const convRate = funnel.contacted > 0
      ? Math.round((funnel.signed_up / funnel.contacted) * 100)
      : 0;

    const { results } = await env.DB.prepare(
      `SELECT name, company, phone, email, industry, location, status, created_at, contacted_at
       FROM outreach_prospects ORDER BY created_at DESC LIMIT 60`
    ).all();
    const prospects = results || [];

    const industryOpts = Object.entries(OUTREACH_INDUSTRIES)
      .map(([k, v]) => `<option value="${k}">${v.label}</option>`).join('');

    // Search card (mirrors /p/outreach — disabled prompt when Apollo is off).
    const searchCard = apolloReady ? `<div class="card glow" style="margin-top:24px">
      <h3 style="margin-top:0">🔎 Find prospects (Apollo)</h3>
      <div style="display:flex;gap:12px;flex-wrap:wrap;align-items:end">
        <div style="flex:1;min-width:160px">
          <label style="display:block;font-size:.74rem;font-family:var(--font-mono);color:var(--text-muted);margin-bottom:6px;text-transform:uppercase">Industry</label>
          <select id="ot-industry" style="width:100%;box-sizing:border-box">${industryOpts}</select>
        </div>
        <div style="flex:1;min-width:160px">
          <label style="display:block;font-size:.74rem;font-family:var(--font-mono);color:var(--text-muted);margin-bottom:6px;text-transform:uppercase">Location</label>
          <input id="ot-location" type="text" placeholder="e.g. Texas, Chicago, United States" value="United States" style="width:100%;box-sizing:border-box">
        </div>
        <div style="min-width:90px">
          <label style="display:block;font-size:.74rem;font-family:var(--font-mono);color:var(--text-muted);margin-bottom:6px;text-transform:uppercase">Limit</label>
          <input id="ot-limit" type="number" value="25" min="1" max="100" style="width:100%;box-sizing:border-box">
        </div>
        <button id="ot-search-btn" class="btn" onclick="otSearch()">Search</button>
      </div>
      <div id="ot-search-fb" style="margin-top:12px;font-size:.88rem;min-height:1.2em;font-family:var(--font-mono)"></div>
    </div>` : `<div class="card" style="margin-top:24px;border-color:rgba(212,165,116,.4)">
      <h3 style="margin-top:0">🔎 Find prospects (Apollo)</h3>
      <p style="color:var(--text-muted);font-size:.92rem">Apollo isn't connected yet. Add your key to start pulling business prospects:</p>
      <pre style="background:var(--bg-primary);border:1px solid var(--border);border-radius:10px;padding:12px;margin-top:10px;overflow-x:auto;font-family:var(--font-mono);font-size:.82rem;color:var(--accent-amber)">npx wrangler secret put APOLLO_API_KEY</pre>
    </div>`;

    // Blast card (mirrors /p/outreach — disabled prompt when TextMagic is off).
    const canBlast = textMagicReady && (funnel.fresh > 0);
    const blastCard = textMagicReady ? `<div class="card glow" style="margin-top:20px">
      <h3 style="margin-top:0">📣 Text blast (TextMagic)</h3>
      <p style="color:var(--text-muted);font-size:.9rem;margin-bottom:14px">${funnel.fresh || 0} new prospect${(funnel.fresh || 0) === 1 ? '' : 's'} waiting. Sends the demo invite, then marks them contacted. Only sends Mon–Sat 9am–8pm US Eastern.</p>
      <div style="display:flex;gap:12px;align-items:end;flex-wrap:wrap">
        <div style="min-width:90px">
          <label style="display:block;font-size:.74rem;font-family:var(--font-mono);color:var(--text-muted);margin-bottom:6px;text-transform:uppercase">Max count</label>
          <input id="ot-blast-count" type="number" value="50" min="1" max="500" style="width:100%;box-sizing:border-box">
        </div>
        <button id="ot-blast-btn" class="btn" ${canBlast ? '' : 'disabled style="opacity:.5;cursor:not-allowed"'} onclick="otBlast()">Send blast</button>
      </div>
      <div id="ot-blast-fb" style="margin-top:12px;font-size:.88rem;min-height:1.2em;font-family:var(--font-mono)"></div>
    </div>` : `<div class="card" style="margin-top:20px;border-color:rgba(212,165,116,.4)">
      <h3 style="margin-top:0">📣 Text blast (TextMagic)</h3>
      <p style="color:var(--text-muted);font-size:.92rem">TextMagic isn't connected yet. Add your credentials to start blasting:</p>
      <pre style="background:var(--bg-primary);border:1px solid var(--border);border-radius:10px;padding:12px;margin-top:10px;overflow-x:auto;font-family:var(--font-mono);font-size:.82rem;color:var(--accent-amber)">npx wrangler secret put TEXTMAGIC_USERNAME
npx wrangler secret put TEXTMAGIC_API_KEY</pre>
    </div>`;

    const pillCls = { new: 'pill-new', contacted: 'pill-contacted', demo: 'pill-booked', 'signed-up': 'pill-booked' };
    const rows = prospects.length ? prospects.map(p => {
      const dispName = htmxEsc(p.name || '—');
      const dispPhone = htmxEsc(p.phone || '—');
      return `<tr>
        <td>${dispName}${p.company ? `<div style="color:var(--text-muted);font-size:.82rem">${htmxEsc(p.company)}</div>` : ''}</td>
        <td class="mono">${dispPhone}</td>
        <td>${htmxEsc(p.industry || '—')}</td>
        <td style="color:var(--text-muted)">${htmxEsc(p.location || '—')}</td>
        <td><span class="status-pill ${pillCls[p.status] || 'pill-new'}">${htmxEsc(p.status)}</span></td>
      </tr>`;
    }).join('') : `<tr><td colspan="5" style="text-align:center;color:var(--text-faint);padding:40px">No prospects yet — run a search above.</td></tr>`;

    const convNote = (funnel.contacted || 0) > 0
      ? `<p class="sub" style="margin-top:14px;font-size:.9rem">${convRate}% conversion (signed up ÷ contacted).</p>`
      : '';

    const content = outreachContentInner({ funnel, convRate, convNote, searchCard, blastCard, rows });
    return new Response(adminShell('outreach', 'Admin · Outreach', content), { headers: { 'Content-Type': 'text/html' } });
  } catch (e) {
    console.error('Admin outreach error:', e);
    return adminErrorPage('outreach', 'Could not load the outreach dashboard.');
  }
}

// Self-contained dark page shell for standalone HTML pages (gallery, affiliate
// dashboard). This baseline has no shared htmxShell, so pages render their own
// full document to stay independent.
function simpleShell(title, body) {
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title} — Branch Live</title>
<link rel="icon" type="image/svg+xml" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='6' fill='%230e0e18'/%3E%3Cg fill='%23d4a574'%3E%3Crect x='5' y='14' width='2' height='4' rx='1'/%3E%3Crect x='9' y='10' width='2' height='12' rx='1'/%3E%3Crect x='13' y='6' width='2' height='20' rx='1'/%3E%3Crect x='17' y='10' width='2' height='12' rx='1'/%3E%3Crect x='21' y='14' width='2' height='4' rx='1'/%3E%3C/g%3E%3C/svg%3E">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,500;0,9..144,600;1,9..144,400;1,9..144,500&family=Inter+Tight:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
<style>
*{margin:0;padding:0;box-sizing:border-box}
*,*::before,*::after{box-sizing:border-box}
:root{
  --bg-primary:#0a0a12;--bg-card:#0e0e18;--bg-elev:#13131f;
  --text-primary:#f1ead9;--text-muted:#a89a82;--text-faint:#6b6354;
  --cream:#f1ead9;--cream-dim:#cdc3ad;
  --accent:#d4a574;--accent-bright:#e8c9a0;--accent-deep:#b88a5a;
  --border:#211c14;--border-soft:#2e2618;
  --font-sans:'Inter Tight',system-ui,-apple-system,sans-serif;
  --font-serif:'Fraunces',Georgia,'Times New Roman',serif;
  --font-mono:'JetBrains Mono',ui-monospace,'SFMono-Regular',monospace;
}
/* Legacy alias hooks — pages still reference these names. All resolve to the
   monotone amber/cream system so no colored accents leak through. */
:root{--accent-amber:var(--accent);--accent-primary:var(--accent);--accent-secondary:var(--accent);--danger:var(--accent);--success:var(--accent);--text-faint:var(--text-faint)}
html{scroll-behavior:smooth;-webkit-font-smoothing:antialiased;text-rendering:optimizeLegibility}
body{font-family:var(--font-sans);background:var(--bg-primary);color:var(--text-primary);line-height:1.6;font-size:16px;min-height:100vh;font-feature-settings:"ss01","cv11"}
a{color:var(--accent);text-decoration:none;transition:color .3s ease}
a:hover{color:var(--accent-bright)}

/* Film grain */
.grain{position:fixed;inset:0;pointer-events:none;z-index:1;opacity:.04;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3'/%3E%3CfeColorMatrix values='0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 1 0'/%3E/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")}

/* Layout: fixed left sidebar + content fills the remaining width.
   The sidebar is position:fixed; .content offsets by its width via body class. */
.app{display:flex;flex-direction:column;min-height:100vh;position:relative;z-index:2}
.brand{display:flex;align-items:center;gap:10px;flex-shrink:0}
.brand .wm{color:var(--accent)}
.brand .nm{font-weight:700;font-size:1.05rem;letter-spacing:-.02em;color:var(--cream)}
.brand .lv{font-family:var(--font-serif);font-style:italic;color:var(--accent);font-weight:500}

/* Sidebar — fixed 230px column, dark bg, right border. Collapses to 64px
   (icon-only) on desktop via .collapsed (persisted in localStorage). On
   mobile it becomes an off-canvas drawer (transform). */
.sidebar{position:fixed;top:0;left:0;bottom:0;width:230px;background:#0a0a14;border-right:1px solid var(--border);display:flex;flex-direction:column;z-index:50;transition:width .2s cubic-bezier(.2,.7,.2,1),transform .25s ease}
.sidebar.collapsed{width:64px}
.sidebar-head{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:18px 18px 14px;flex-shrink:0}
.sidebar-head .brand svg{flex-shrink:0}
.sidebar-toggle{flex-shrink:0;width:30px;height:30px;display:inline-flex;align-items:center;justify-content:center;border:1px solid var(--border);border-radius:8px;background:transparent;color:var(--text-muted);cursor:pointer;padding:0;transition:color .2s ease,border-color .2s ease}
.sidebar-toggle svg{width:16px;height:16px}
.sidebar-toggle:hover{color:var(--accent);border-color:var(--border-soft)}
.sidebar.collapsed .sidebar-toggle svg{transform:rotate(180deg)}
.sidebar-switcher{padding:0 14px 10px;flex-shrink:0}
.sidebar-nav{flex:1;overflow-y:auto;overflow-x:hidden;padding:6px 10px}
/* Custom scrollbar (subtle, amber-tinted). */
.sidebar-nav::-webkit-scrollbar{width:6px}
.sidebar-nav::-webkit-scrollbar-thumb{background:var(--border-soft);border-radius:3px}
.nav-group{margin-bottom:10px}
.nav-group-h{font-family:var(--font-mono);font-size:.62rem;letter-spacing:.16em;text-transform:uppercase;color:var(--text-faint);font-weight:500;padding:12px 12px 5px;margin:0}
.nav-link{display:flex;align-items:center;gap:11px;padding:9px 12px;border-radius:8px;color:var(--text-muted);font-size:.86rem;font-weight:500;text-decoration:none;border-left:3px solid transparent;white-space:nowrap;transition:color .2s ease,background-color .2s ease,border-color .2s ease}
.nav-link svg{width:18px;height:18px;flex-shrink:0;opacity:.85}
.nav-link .nav-label{overflow:hidden;text-overflow:ellipsis}
.nav-link:hover{color:var(--cream);background:rgba(255,255,255,.04);text-decoration:none}
.nav-link.active{color:var(--accent);background:rgba(212,165,116,.10);border-left-color:var(--accent)}
.nav-link.active svg{opacity:1}
.sidebar-foot{padding:10px;border-top:1px solid var(--border);flex-shrink:0}
.sidebar-foot .nav-link{color:var(--text-faint)}
.sidebar-foot .nav-link:hover{color:var(--accent)}
/* Collapsed state: hide labels/headers/wordmark/switcher text, center icons. */
.sidebar.collapsed .brand span,.sidebar.collapsed .nav-label,.sidebar.collapsed .nav-group-h,.sidebar.collapsed .sw-cur,.sidebar.collapsed .sw-caret{display:none}
.sidebar.collapsed .nav-link{justify-content:center;padding:9px 0;border-left:none}
.sidebar.collapsed .sidebar-head{padding:18px 0 14px;justify-content:center}
.sidebar.collapsed .sidebar-switcher{display:none}

/* Mobile drawer toggle + backdrop (hidden on desktop). */
.sidebar-mobile-toggle{display:none;position:fixed;top:14px;left:14px;z-index:51;flex-direction:column;justify-content:center;gap:5px;width:38px;height:38px;border:1px solid var(--border);border-radius:8px;background:var(--bg-card);cursor:pointer;padding:0;align-items:center}
.sidebar-mobile-toggle span{display:block;width:18px;height:2px;background:var(--cream);border-radius:2px}
.sidebar-backdrop{position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:49;opacity:0;pointer-events:none;transition:opacity .25s ease}
.sidebar-backdrop.show{opacity:1;pointer-events:auto}

/* Content — offset by the sidebar width on desktop; full-width on mobile.
   body.sb-collapsed is toggled by the sidebar JS to shrink the margin. */
.content{flex:1;width:100%;max-width:1100px;margin-inline:auto;padding:56px 32px;animation:fadeUp .6s cubic-bezier(.2,.7,.2,1)}
@media(min-width:921px){.content{margin-left:230px}body.sb-collapsed .content{margin-left:64px}}
@keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}

/* Typography */
h1{font-family:var(--font-serif);font-weight:400;font-size:2.4rem;letter-spacing:-.025em;line-height:1;margin-bottom:10px}
h1 em{font-style:italic;color:var(--accent-amber);font-weight:500}
h3{font-family:var(--font-mono);font-size:.7rem;letter-spacing:.18em;text-transform:uppercase;color:var(--text-faint);font-weight:500;margin:32px 0 14px;display:flex;align-items:center;gap:10px}
h3::after{content:"";flex:1;height:1px;background:linear-gradient(to right,var(--border),transparent)}
p.sub{color:var(--text-muted);margin-bottom:0}

/* Eyebrow */
.eyebrow{font-family:var(--font-mono);font-size:.7rem;letter-spacing:.18em;text-transform:uppercase;color:var(--accent-amber);font-weight:500;margin-bottom:14px;display:block}

/* Cards — warm dark background with subtle amber-tinted border, hover lift */
.card{background:var(--bg-card);border:1px solid var(--border);border-radius:14px;padding:22px;position:relative;transition:transform .3s cubic-bezier(.2,.7,.2,1),border-color .3s ease,box-shadow .3s ease}
.card:hover{transform:translateY(-3px);border-color:var(--border-soft);box-shadow:0 12px 40px -16px rgba(0,0,0,.7)}
.card.glow{background:var(--bg-card);border:1px solid transparent;background-clip:padding-box}
.card.glow::before{content:"";position:absolute;inset:0;border-radius:14px;padding:1px;background:linear-gradient(135deg,rgba(212,165,116,.55),transparent 45%,rgba(212,165,116,.25));-webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);-webkit-mask-composite:xor;mask-composite:exclude;pointer-events:none}

/* Stat grid — cream/off-white serif numbers (monotone, no colored gradients) */
.grid2{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:18px}
.stat-card{text-align:center;padding:28px 20px}
.stat-num{font-family:var(--font-serif);font-size:2.8rem;font-weight:500;line-height:1;color:var(--cream);letter-spacing:-.02em}
/* Tone classes collapse to cream — monotone warm palette. */
.stat-num.purple,.stat-num.green,.stat-num.blue{color:var(--cream)}
.stat-lab{font-family:var(--font-mono);font-size:.62rem;letter-spacing:.18em;text-transform:uppercase;color:var(--text-muted);margin-top:10px;font-weight:500}

/* Tables — warm borders, subdued cream headers, mono numbers */
table{width:100%;border-collapse:collapse;margin-top:14px;border:1px solid var(--border);border-radius:12px;overflow:hidden}
thead th{background:rgba(241,234,217,.04);color:var(--cream-dim);font-family:var(--font-mono);font-weight:500;text-transform:uppercase;font-size:.68rem;letter-spacing:.12em;text-align:left;padding:13px 16px;border-bottom:1px solid var(--border)}
tbody td{padding:13px 16px;border-bottom:1px solid var(--border);font-size:.92rem;color:var(--text-primary)}
tbody tr:last-child td{border-bottom:none}
tbody tr{transition:background-color .2s ease}
tbody tr:hover{background:rgba(241,234,217,.025)}
table.no-header td{font-family:var(--font-mono);font-feature-settings:"tnum"}
table.no-header td:first-child{color:var(--text-muted)}

/* Inputs — warm focus ring */
input,textarea,select{font-family:inherit;background:var(--bg-primary);border:1px solid var(--border);border-radius:10px;padding:11px 13px;color:var(--text-primary);font-size:.95em;transition:border-color .2s ease,box-shadow .2s ease}
input:focus,textarea:focus,select:focus{outline:none;border-color:var(--accent-amber);box-shadow:0 0 0 3px rgba(212,165,116,.14)}
input::placeholder,textarea::placeholder{color:var(--text-faint)}
textarea{resize:vertical}

/* Buttons — amber gradient primary or ghost. Default = amber CTA. */
button,.btn{display:inline-flex;align-items:center;gap:8px;cursor:pointer;border-radius:9999px;padding:11px 22px;font-size:.9em;font-weight:600;text-decoration:none;border:none;font-family:inherit;color:#1a1205;background:linear-gradient(135deg,var(--accent),var(--accent-deep));transition:transform .2s cubic-bezier(.2,.7,.2,1),box-shadow .2s ease,filter .2s ease}
button:hover,.btn:hover{transform:translateY(-1px);box-shadow:0 8px 24px -6px rgba(212,165,116,.45);color:#1a1205;filter:brightness(1.05)}
button:active,.btn:active{transform:translateY(0)}
.btn-amber{background:linear-gradient(135deg,var(--accent-bright),var(--accent));color:#1a1205}
.btn-amber:hover{box-shadow:0 8px 24px -6px rgba(212,165,116,.5);color:#1a1205}
.btn-ghost{background:transparent;border:1px solid var(--border);color:var(--cream-dim)}
.btn-ghost:hover{background:var(--bg-card);color:var(--cream);border-color:var(--border-soft);box-shadow:none}
.btn-sm{padding:7px 15px;font-size:.8em}
.btn-success{background:linear-gradient(135deg,var(--accent-bright),var(--accent-deep));color:#1a1205}
.btn-success:hover{box-shadow:0 8px 24px -6px rgba(212,165,116,.5);color:#1a1205}

/* Badges — tonal amber only */
.badge{display:inline-block;padding:3px 10px;border-radius:9999px;font-size:.72em;font-weight:600;font-family:var(--font-mono);letter-spacing:.02em}
.badge-booked{background:rgba(212,165,116,.14);color:var(--accent);border:1px solid rgba(212,165,116,.3)}
.badge-new{background:rgba(212,165,116,.14);color:var(--accent);border:1px solid rgba(212,165,116,.3)}

/* Empty state */
.empty-state{text-align:center;padding:56px 20px;color:var(--text-muted)}
.empty-state .empty-icon{font-size:2.6em;margin-bottom:14px}
.empty-state .empty-title{color:var(--text-primary);font-family:var(--font-serif);font-size:1.25rem;font-weight:500;margin-bottom:8px}
.empty-state .empty-msg{font-size:.92em;max-width:380px;margin:0 auto;line-height:1.6}

code,.mono{font-family:var(--font-mono);font-feature-settings:"tnum"}

/* Mobile (≤920px) — sidebar becomes an off-canvas drawer; a top-left toggle
   button reveals it and a backdrop dismisses it. Content goes full-width. */
@media (max-width:920px){
  .sidebar{transform:translateX(-100%);box-shadow:0 0 40px rgba(0,0,0,.6)}
  .sidebar.open{transform:none}
  /* Re-expand even if .collapsed was persisted for desktop. */
  .sidebar.collapsed{width:230px}
  .sidebar.collapsed .brand span,.sidebar.collapsed .nav-label,.sidebar.collapsed .nav-group-h,.sidebar.collapsed .sw-cur,.sidebar.collapsed .sw-caret{display:inline}
  .sidebar.collapsed .nav-link{justify-content:flex-start;padding:9px 12px;border-left:3px solid transparent}
  .sidebar.collapsed .sidebar-head{justify-content:space-between;padding:18px 18px 14px}
  .sidebar.collapsed .sidebar-switcher{display:block}
  .sidebar-mobile-toggle{display:flex}
  .sidebar-toggle{display:none}
  .content{margin-left:0!important;padding:64px 18px 32px}
}

/* Urgency badges + status pills — tonal amber shades only (no red/green/blue) */
.urg-badge{display:inline-flex;align-items:center;gap:5px;padding:3px 10px;border-radius:9999px;font-size:.74em;font-weight:600;font-family:var(--font-mono);border:1px solid transparent;white-space:nowrap;color:var(--accent)}
.urg-badge .urg-dot{font-size:.7em;line-height:1}
/* Functional hierarchy via amber opacity: urgent=brightest, low=dimmest */
.urg-urgent{background:rgba(212,165,116,.22);border-color:rgba(212,165,116,.5);color:var(--accent-bright)}
.urg-high{background:rgba(212,165,116,.16);border-color:rgba(212,165,116,.4);color:var(--accent)}
.urg-med{background:rgba(212,165,116,.10);border-color:rgba(212,165,116,.28);color:var(--accent)}
.urg-low{background:rgba(212,165,116,.06);border-color:rgba(212,165,116,.2);color:var(--cream-dim)}
.status-pill{display:inline-block;padding:3px 10px;border-radius:9999px;font-size:.72em;font-weight:600;text-transform:capitalize;border:1px solid transparent;color:var(--cream-dim)}
.pill-new{background:rgba(212,165,116,.14);color:var(--accent);border-color:rgba(212,165,116,.3)}
.pill-contacted{background:rgba(241,234,217,.06);color:var(--cream-dim);border-color:var(--border-soft)}
.pill-scheduled{background:rgba(241,234,217,.06);color:var(--cream-dim);border-color:var(--border-soft)}
.pill-booked{background:rgba(212,165,116,.14);color:var(--accent);border-color:rgba(212,165,116,.3)}
.pill-closed{background:rgba(241,234,217,.04);color:var(--text-faint);border-color:var(--border)}

/* Toolbar (search + actions) */
.toolbar{display:flex;gap:12px;align-items:center;flex-wrap:wrap;margin:18px 0 22px}
.toolbar .search{flex:1;min-width:220px;position:relative}
.toolbar .search input{width:100%;padding-left:38px}
.toolbar .search svg{position:absolute;left:13px;top:50%;transform:translateY(-50%);width:16px;height:16px;color:var(--text-faint);pointer-events:none}

/* Lead row — clickable card row */
.lead-row{display:flex;align-items:center;gap:16px;padding:16px 18px;border:1px solid var(--border);border-radius:12px;margin-bottom:10px;background:linear-gradient(180deg,var(--bg-card),var(--bg-elev));text-decoration:none;color:inherit;transition:transform .25s cubic-bezier(.2,.7,.2,1),border-color .25s ease,box-shadow .25s ease}
.lead-row:hover{transform:translateY(-2px);border-color:oklch(0.30 0.008 280);box-shadow:0 10px 30px -12px rgba(0,0,0,.55);text-decoration:none;color:inherit}
.lead-row .avatar{width:42px;height:42px;border-radius:50%;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-family:var(--font-serif);font-weight:500;font-size:1.1rem;color:#1a1205;background:linear-gradient(135deg,var(--accent-amber),#e8c9a0)}
.lead-row .meta{flex:1;min-width:0}
.lead-row .name{font-weight:600;color:var(--text-primary);font-size:.98rem}
.lead-row .job{color:var(--text-muted);font-size:.85rem;margin-top:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.lead-row .right{display:flex;align-items:center;gap:10px;flex-shrink:0}

/* Detail layout */
.detail-grid{display:grid;grid-template-columns:1fr 320px;gap:20px}
@media (max-width:900px){.detail-grid{grid-template-columns:1fr}}
.kv{display:flex;justify-content:space-between;gap:16px;padding:11px 0;border-bottom:1px solid var(--border);font-size:.92rem}
.kv:last-child{border-bottom:none}
.kv .k{color:var(--text-muted)}
.kv .v{color:var(--text-primary);font-weight:500;text-align:right}
.back-link{display:inline-flex;align-items:center;gap:7px;color:var(--text-muted);font-size:.88rem;margin-bottom:18px;transition:color .3s ease}
.back-link:hover{color:var(--accent-amber)}
.transcript{font-family:var(--font-mono);font-size:.82rem;line-height:1.7;color:var(--text-muted);white-space:pre-wrap;background:var(--bg-primary);border:1px solid var(--border);border-radius:10px;padding:16px;max-height:400px;overflow-y:auto}

/* Transcript expand/collapse (calls page). The whole summary <tr> is
   clickable; the transcript + linked-lead block live in the body row. */
.call-row{cursor:pointer}
.call-row .chevron{transition:transform .3s ease}
.call-row.open .chevron{transform:rotate(180deg)}
.call-row:hover td{background:var(--bg-elev)}
.call-transcript{display:none}
.call-row-body.open .call-transcript{display:block}
/* Linked-lead context shown above the transcript when a call expands */
.call-lead{border-bottom:1px solid var(--border-soft);padding:12px 16px;display:flex;flex-direction:column;gap:6px}
.call-lead .cl-line{font-size:.9rem;color:var(--cream-dim)}
.call-lead .cl-k{display:inline-block;min-width:110px;color:var(--text-muted);font-family:var(--font-mono);font-size:.74rem;text-transform:uppercase;letter-spacing:.04em}
.call-lead .cl-appt{color:var(--cream)}
.call-lead .cl-muted{color:var(--text-muted)}
.call-lead .cl-link{color:var(--accent-amber);font-size:.85rem;font-weight:600;text-decoration:none;margin-top:2px}
.call-lead .cl-link:hover{text-decoration:underline}
.call-lead .status-pill{margin-left:6px;vertical-align:middle}

/* Calendar */
.cal-toolbar{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:18px;flex-wrap:wrap}
.cal-nav{display:flex;align-items:center;gap:14px}
.cal-nav button{padding:8px 14px}
.cal-month{font-family:var(--font-serif);font-size:1.5rem;font-weight:500;letter-spacing:-.02em;min-width:200px;text-align:center}
.cal-grid{display:grid;grid-template-columns:repeat(7,1fr);gap:6px}
.cal-dow{font-family:var(--font-mono);font-size:.66rem;letter-spacing:.1em;text-transform:uppercase;color:var(--text-faint);text-align:center;padding:6px 0}
.cal-cell{aspect-ratio:1;border:1px solid var(--border);border-radius:10px;padding:7px 8px;background:var(--bg-card);position:relative;transition:border-color .2s ease,background-color .2s ease;font-size:.85rem}
.cal-cell.empty{background:transparent;border-color:transparent}
.cal-cell.today{border-color:var(--accent-amber);box-shadow:inset 0 0 0 1px var(--accent-amber)}
.cal-cell.has-appt{cursor:pointer}
.cal-cell.has-appt:hover{border-color:oklch(0.30 0.008 280);background:var(--bg-elev)}
.cal-cell.selected{background:rgba(212,165,116,.14);border-color:var(--accent-amber)}
.cal-cell .day-num{font-weight:600;color:var(--text-primary)}
.cal-cell.muted .day-num{color:var(--text-faint)}
.cal-cell .dots{display:flex;gap:3px;margin-top:5px;flex-wrap:wrap}
.cal-dot{width:6px;height:6px;border-radius:50%;background:var(--accent)}
.cal-dot.purple{background:var(--accent)}
.cal-dot.green{background:var(--accent-deep)}
.day-appts{margin-top:8px}
.day-appt{display:flex;gap:14px;align-items:center;padding:13px 16px;border:1px solid var(--border);border-radius:10px;margin-bottom:8px;background:var(--bg-card)}
.day-appt .time{font-family:var(--font-mono);font-weight:600;color:var(--accent-amber);min-width:70px}
.day-appt .ttl{color:var(--text-primary);font-weight:500}
.day-appt .cust{color:var(--text-muted);font-size:.85rem}
/* Cards are anchor links now — pointer + hover affordance to match
   .cal-cell.has-appt so it's obvious they open a detail page. */
.day-appt{cursor:pointer;text-decoration:none;color:inherit;transition:border-color .2s ease,background .2s ease}
.day-appt:hover{border-color:oklch(0.30 0.008 280);background:var(--bg-elev)}

/* Lead detail — wider, left-justified call list (replaces the cramped
   .day-appt rows when call history moved under Job details for breathing room). */
.lead-call-list{list-style:none;margin:8px 0 0;padding:0}
.lead-call-item{padding:14px 0;border-bottom:1px solid var(--border)}
.lead-call-item:last-child{border-bottom:none;padding-bottom:0}
.lci-summary{color:var(--text-primary);font-weight:500;line-height:1.5}
.lci-meta{color:var(--text-muted);font-size:.85rem;margin-top:4px}
.lci-meta .dot{opacity:.5;margin:0 6px}
.lead-action-fb{font-size:.85rem;min-height:1.1em;font-family:var(--font-mono)}

/* Add-on toggle cards (billing) */
.addon-card{display:flex;align-items:center;justify-content:space-between;gap:16px;padding:18px 20px;border:1px solid var(--border);border-radius:12px;margin-bottom:10px;background:var(--bg-card);transition:border-color .2s ease}
.addon-card.on{border-color:rgba(212,165,116,.4);background:linear-gradient(180deg,rgba(212,165,116,.06),var(--bg-card))}
.addon-card .ai{font-size:1.5rem}
.addon-card .at{font-weight:600}
.addon-card .ad{color:var(--text-muted);font-size:.85rem;margin-top:2px}
.addon-card .ap{font-family:var(--font-mono);color:var(--accent-amber);font-weight:600}
.switch{position:relative;width:46px;height:26px;flex-shrink:0;cursor:pointer}
.switch input{opacity:0;width:0;height:0}
.switch .track{position:absolute;inset:0;background:var(--border);border-radius:9999px;transition:background-color .25s ease}
.switch .track::before{content:"";position:absolute;left:3px;top:3px;width:20px;height:20px;border-radius:50%;background:var(--text-muted);transition:transform .25s cubic-bezier(.2,.7,.2,1),background-color .25s ease}
.switch input:checked + .track{background:rgba(212,165,116,.5)}
.switch input:checked + .track::before{transform:translateX(20px);background:var(--accent-amber)}

/* Pagination */
.pager{display:flex;align-items:center;justify-content:center;gap:8px;margin-top:24px}
.pager button,.pager span{min-width:38px;height:38px;border-radius:10px;border:1px solid var(--border);background:var(--bg-card);color:var(--text-muted);font-family:var(--font-mono);font-size:.85rem;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all .2s ease}
.pager button:hover{border-color:var(--accent-amber);color:var(--accent-amber)}
.pager .current{background:rgba(212,165,116,.14);border-color:var(--accent-amber);color:var(--accent-amber)}
.pager span{cursor:default;border-color:transparent}

/* Knowledge base — card layout (mobile-first) with a dense table on desktop.
   Cards are the default; the table swaps in at ≥900px. Both views share one
   JS editing model (kEdit/kDelete/pagination) keyed off kc-/kt- ID prefixes. */
.k-toolbar{display:flex;align-items:stretch;gap:8px;margin:18px 0 22px}
.k-toolbar .search{flex:1;min-width:0;position:relative}
.k-toolbar .search input{width:100%;height:100%;padding-left:38px}
.k-toolbar .search svg{position:absolute;left:13px;top:50%;transform:translateY(-50%);width:16px;height:16px;color:var(--text-faint);pointer-events:none}
.k-toolbar .btn,.k-toolbar label.btn{height:auto;padding:11px 18px;white-space:nowrap;text-align:center;justify-content:center}
@media (max-width:680px){
  .k-toolbar{display:grid;grid-template-columns:1fr 1fr;gap:8px}
  .k-toolbar .search{grid-column:1/-1}
  .k-toolbar .search input{height:auto}
}
/* Card grid (mobile + default). */
.k-grid{display:grid;grid-template-columns:1fr;gap:12px;margin-top:8px}
.k-item{background:var(--bg-card);border:1px solid rgba(212,165,116,.22);border-radius:14px;padding:16px 18px;transition:border-color .2s ease,transform .2s ease}
.k-item:hover{border-color:rgba(212,165,116,.45);transform:translateY(-1px)}
.k-item .ki-cat{display:inline-block;font-family:var(--font-mono);font-size:.66rem;letter-spacing:.1em;text-transform:uppercase;color:var(--accent-amber);background:rgba(212,165,116,.1);padding:2px 9px;border-radius:9999px;margin-bottom:8px}
.k-item .ki-main{display:flex;align-items:baseline;justify-content:space-between;gap:12px}
.k-item .ki-name{font-weight:600;color:var(--text-primary);font-size:1rem;line-height:1.35}
.k-item .ki-price{font-family:var(--font-mono);font-weight:600;color:var(--accent-amber);white-space:nowrap}
.k-item .ki-notes{color:var(--text-muted);font-size:.85rem;line-height:1.5;margin-top:8px}
.k-item .ki-actions{display:flex;gap:8px;margin-top:12px}
.k-card-edit{background:var(--bg-card);border:1px solid rgba(212,165,116,.45);border-radius:14px;padding:16px 18px}
.k-edit-form{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:8px;align-items:end}
.k-edit-form input{background:var(--bg-primary);border:1px solid var(--border);border-radius:8px;padding:9px 11px;color:var(--cream);font-family:var(--font-sans);font-size:.9rem;width:100%;box-sizing:border-box}
.k-edit-form input:focus{outline:none;border-color:var(--accent-amber)}
.k-edit-msg{grid-column:1/-1;font-size:.82rem}
/* Desktop table (≥900px): hide the card grid, show the dense table. */
.k-table-wrap{display:none;margin-top:14px}
@media (min-width:900px){
  .k-grid{display:none}
  .k-table-wrap{display:block}
}
/* Table-specific row affordances (desktop only). */
.kt-row td{cursor:default}
.k-table-wrap .k-icon-btn{background:transparent;border:1px solid var(--border);color:var(--text-muted);border-radius:8px;width:32px;height:32px;cursor:pointer;font-size:.95rem;line-height:1;margin-inline:2px;transition:all .15s ease}
.k-table-wrap .k-icon-btn:hover{border-color:var(--accent-amber);color:var(--accent-amber);background:var(--bg-card)}
.k-table-wrap .k-icon-btn.k-del:hover{border-color:var(--danger);color:var(--danger)}
.k-table-wrap .k-actions{white-space:nowrap;text-align:right}
.kt-edit-row td{background:var(--bg-elev);border-bottom:1px solid var(--border-soft)!important}

/* Inline note card */
.note-box{background:var(--bg-primary);border:1px solid var(--border);border-radius:10px;padding:14px;font-size:.9rem;color:var(--text-muted)}

/* Admin sub-nav — pill row under the topbar. Amber-monotone, scoped to /p/admin. */
.admin-subnav{display:flex;gap:4px;padding:0 32px;max-width:1200px;margin:0 auto;flex-wrap:wrap;border-bottom:1px solid var(--border);background:rgba(10,10,18,.6)}
.admin-subnav a{padding:10px 14px;font-size:.84rem;color:var(--text-muted);font-weight:500;border-bottom:2px solid transparent;transition:color .25s ease,border-color .25s ease;text-decoration:none}
.admin-subnav a:hover{color:var(--cream);text-decoration:none}
.admin-subnav a.active{color:var(--accent);border-bottom-color:var(--accent)}

/* Revenue / adoption bar chart — pure CSS, monotone amber. */
.rev-chart{display:flex;align-items:flex-end;gap:14px;height:180px;padding:18px 4px 0;border-bottom:1px solid var(--border)}
.rev-bar-col{flex:1;display:flex;flex-direction:column;align-items:center;gap:8px;height:100%;justify-content:flex-end;min-width:0}
.rev-bar{width:100%;max-width:46px;background:linear-gradient(to top,var(--accent-deep),var(--accent));border-radius:6px 6px 0 0;min-height:3px;transition:height .4s cubic-bezier(.2,.7,.2,1);position:relative}
.rev-bar.muted{background:linear-gradient(to top,#3a3225,#4a4030)}
.rev-bar-val{position:absolute;top:-20px;left:50%;transform:translateX(-50%);font-family:var(--font-mono);font-size:.66rem;color:var(--text-muted);white-space:nowrap}
.rev-bar-lab{font-family:var(--font-mono);font-size:.64rem;color:var(--text-faint);text-transform:uppercase;letter-spacing:.06em}

/* Activity feed — vertical timeline. */
.feed{list-style:none;margin-top:6px}
.feed li{position:relative;padding:10px 0 10px 26px;border-bottom:1px solid var(--border);font-size:.9rem;color:var(--text-muted)}
.feed li:last-child{border-bottom:none}
.feed li::before{content:"";position:absolute;left:6px;top:14px;width:7px;height:7px;border-radius:50%;background:var(--accent);box-shadow:0 0 0 3px rgba(212,165,116,.15)}
.feed li strong{color:var(--cream);font-weight:600}
.feed .feed-time{display:block;font-family:var(--font-mono);font-size:.66rem;color:var(--text-faint);margin-top:2px}

/* Adoption meter — horizontal bar per feature. */
.adopt-row{display:grid;grid-template-columns:140px 1fr 60px;align-items:center;gap:14px;padding:9px 0}
.adopt-track{height:10px;background:var(--bg-primary);border:1px solid var(--border);border-radius:999px;overflow:hidden}
.adopt-fill{height:100%;background:linear-gradient(to right,var(--accent-deep),var(--accent));border-radius:999px;transition:width .4s cubic-bezier(.2,.7,.2,1)}
.adopt-num{font-family:var(--font-mono);font-size:.78rem;color:var(--cream);text-align:right}

/* ── Business analytics (/p/analytics) — CSS-only bars + feed ── */
.ax-stat-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:18px}
.ax-stat{text-align:center;padding:28px 20px;background:var(--bg-card);border:1px solid var(--border);border-radius:14px;transition:transform .3s cubic-bezier(.2,.7,.2,1),border-color .3s ease}
.ax-stat:hover{transform:translateY(-3px);border-color:var(--border-soft)}
.ax-chart{background:var(--bg-card);border:1px solid var(--border);border-radius:14px;padding:22px;display:flex;flex-direction:column;gap:14px}
.ax-row{display:grid;grid-template-columns:74px 1fr 44px;align-items:center;gap:14px}
.ax-month{font-family:var(--font-mono);font-size:.72rem;color:var(--text-muted);text-transform:uppercase;letter-spacing:.04em}
.ax-track{height:26px;background:var(--bg-primary);border:1px solid var(--border);border-radius:999px;overflow:hidden}
.ax-fill{display:block;height:100%;background:linear-gradient(to right,var(--accent-deep),var(--accent));border-radius:999px;transition:width .5s cubic-bezier(.2,.7,.2,1)}
.ax-val{font-family:var(--font-mono);font-size:.82rem;color:var(--cream);text-align:right}
.ax-note{background:rgba(212,165,116,.1);border:1px solid rgba(212,165,116,.32);color:var(--accent-amber);padding:10px 14px;border-radius:10px;margin-bottom:16px;font-size:.88em}
.ax-rev-line{display:flex;justify-content:space-between;align-items:baseline;padding:9px 0;border-bottom:1px solid var(--border);font-size:.95rem;color:var(--text-muted)}
.ax-rev-line strong{color:var(--cream);font-family:var(--font-mono)}
.ax-rev-total{border-bottom:none;border-top:1px solid var(--border-soft);margin-top:6px;padding-top:14px}
.ax-rev-total strong{color:var(--accent-amber);font-size:1.15rem}
.ax-rev-detail{margin-top:14px;color:var(--text-muted);font-size:.82rem;line-height:1.7}
.ax-feed{background:var(--bg-card);border:1px solid var(--border);border-radius:14px;overflow:hidden}
.ax-feed-row{display:flex;align-items:center;gap:14px;padding:13px 18px;border-bottom:1px solid var(--border);font-size:.92rem}
.ax-feed-row:last-child{border-bottom:none}
.ax-feed-icon{font-size:1.1rem;flex-shrink:0;width:24px;text-align:center}
.ax-feed-main{flex:1;min-width:0;display:flex;flex-direction:column;gap:2px}
.ax-feed-name{color:var(--cream);font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.ax-feed-type{font-family:var(--font-mono);font-size:.66rem;color:var(--text-muted);text-transform:uppercase;letter-spacing:.04em}
.ax-feed-ts{font-family:var(--font-mono);font-size:.7rem;color:var(--text-faint);flex-shrink:0}
.ax-empty{text-align:center;padding:36px 20px;color:var(--text-muted);font-size:.9rem}
@media(max-width:780px){.ax-stat-grid{grid-template-columns:repeat(2,1fr)}}

/* Multi-account business switcher (top nav). */
.biz-switcher{position:relative}
.sw-trigger{display:flex;align-items:center;gap:8px;padding:7px 12px;border:1px solid var(--border);border-radius:9px;background:var(--bg-card);color:var(--cream-dim);font-size:.82rem;font-weight:500;cursor:pointer;max-width:220px;transition:border-color .25s ease,color .25s ease}
.sw-trigger:hover{border-color:var(--border-soft);color:var(--cream)}
.sw-ico{font-size:.95rem;line-height:1}
.sw-cur{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.sw-caret{color:var(--text-faint);font-size:.7rem}
.sw-menu{position:absolute;top:calc(100% + 8px);left:0;min-width:240px;background:var(--bg-card);border:1px solid var(--border);border-radius:12px;padding:6px;box-shadow:0 18px 50px -16px rgba(0,0,0,.8);z-index:80;display:none;flex-direction:column;gap:2px}
.sw-menu.open{display:flex}
.sw-item{display:flex;align-items:center;gap:8px;width:100%;text-align:left;padding:9px 11px;border-radius:8px;background:transparent;border:none;color:var(--text-muted);font-size:.84rem;cursor:pointer;font-family:inherit}
.sw-item:hover{background:rgba(255,255,255,.04);color:var(--cream)}
.sw-item.active{color:var(--accent)}
.sw-dot,.sw-arrow{font-size:.7rem;width:14px;flex-shrink:0;color:var(--accent)}
.sw-arrow{color:var(--text-faint)}
.sw-item span:nth-child(2){flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.sw-role{font-family:var(--font-mono);font-size:.6rem;text-transform:uppercase;letter-spacing:.06em;color:var(--text-faint)}
.sw-role::before{content:""}

/* View-only banner for employee-restricted pages. */
.vo-banner{display:flex;align-items:center;gap:10px;background:rgba(212,165,116,.08);border:1px solid var(--border-soft);color:var(--accent);padding:11px 16px;border-radius:11px;font-size:.85em;margin:0 0 22px}
.vo-banner .vo-ico{font-size:1rem}

/* ── Debug tools (Inspect + Annotate). Self-gated: only render when a
   .sidebar is present, i.e. a signed-in dashboard/admin page,
   never on the public landing or login screens. Unobtrusive amber FABs. */
#bl-debug-tools{position:fixed;right:18px;bottom:18px;z-index:2147483000;display:flex;flex-direction:column;gap:8px}
.bl-debug-fab{display:inline-flex;align-items:center;gap:6px;padding:9px 14px;border-radius:9999px;font-family:var(--font-mono);font-size:.74rem;font-weight:600;letter-spacing:.02em;cursor:pointer;border:1px solid var(--border-soft);background:var(--bg-card);color:var(--accent);box-shadow:0 8px 24px -10px rgba(0,0,0,.8);transition:filter .2s ease,transform .2s ease,background .2s ease}
.bl-debug-fab:hover{filter:brightness(1.15);transform:translateY(-1px)}
.bl-debug-fab.active{background:linear-gradient(135deg,var(--accent-bright),var(--accent));color:#1a1205;border-color:transparent}
/* Inspect hover outline (red 2px) */
.bl-inspect-on *:not(#bl-debug-tools):not(#bl-debug-tools *):not(#bl-anno-toolbar):not(#bl-anno-toolbar *):hover{outline:2px solid #ef4444!important;outline-offset:-2px!important;cursor:crosshair!important}

/* Annotation canvas overlay — full-viewport, untainted 2D canvas. Position
   is ABSOLUTE (not fixed): html2canvas mis-positions fixed elements, and we
   capture with scrollX/Y=0 so absolute-at-origin lines up correctly. Hidden
   + click-through until Annotate mode is on. */
#bl-anno-canvas{position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:2147483002;display:none}
#bl-anno-canvas.bl-anno-active{display:block;pointer-events:auto;cursor:crosshair}

/* Annotate sub-toolbar — appears top-center when Annotate mode is on.
   Holds Arrow / Rectangle / Text / Capture / Cancel. */
#bl-anno-toolbar{position:fixed;top:14px;left:50%;transform:translateX(-50%);z-index:2147483003;display:none;align-items:center;gap:6px;padding:7px 9px;background:var(--bg-card);border:1px solid var(--border-soft);border-radius:12px;box-shadow:0 10px 30px -10px rgba(0,0,0,.85)}
#bl-anno-toolbar.bl-anno-active{display:flex}
.bl-anno-btn{display:inline-flex;align-items:center;gap:5px;padding:6px 11px;border-radius:8px;font-family:var(--font-mono);font-size:.72rem;font-weight:600;cursor:pointer;border:1px solid transparent;background:transparent;color:var(--cream);transition:background .15s ease,color .15s ease}
.bl-anno-btn:hover{background:rgba(255,255,255,.05);color:var(--accent-bright)}
.bl-anno-btn.active{background:linear-gradient(135deg,var(--accent-bright),var(--accent));color:#1a1205}
.bl-anno-sep{width:1px;height:18px;background:var(--border-soft);margin:0 3px}
.bl-anno-btn.cap{color:var(--accent)}
.bl-anno-btn.cap:hover{background:rgba(212,165,116,.12)}

/* Inline text input for the Text annotation tool. */
#bl-anno-text-input{position:absolute;z-index:2147483004;font-family:var(--font-sans);font-size:14px;font-weight:600;color:#ef4444;background:rgba(10,10,18,.6);border:1px dashed #ef4444;border-radius:5px;padding:2px 6px;outline:none;min-width:120px;display:none}
/* Small status toast for capture/copy feedback */
#bl-debug-toast{position:fixed;right:18px;bottom:74px;z-index:2147483001;background:var(--bg-card);border:1px solid var(--border-soft);color:var(--cream);font-family:var(--font-mono);font-size:.72rem;padding:7px 12px;border-radius:8px;box-shadow:0 8px 24px -10px rgba(0,0,0,.8);opacity:0;transform:translateY(6px);transition:opacity .2s ease,transform .2s ease;pointer-events:none;max-width:280px}
#bl-debug-toast.show{opacity:1;transform:translateY(0)}

/* ── Scout — collapsible AI assistant panel. Lives on every signed-in /p/*
   page (gated on a .sidebar being present). Amber-monotone: #0a0a14 panel
   bg, left border, amber-tinted message accents. Collapsed by default to a
   40px tab on the right edge; expands to 300px. Proactive nudge after 30s
   of inactivity on a page. No purple, no green badges. */
#scout-tab{position:fixed;top:0;right:0;bottom:0;width:40px;background:#0a0a14;border-left:1px solid var(--border);display:flex;flex-direction:column;align-items:center;gap:6px;padding:14px 0 18px;cursor:pointer;z-index:60;color:var(--accent);font-family:var(--font-mono);transition:background .2s ease,color .2s ease;writing-mode:vertical-rl;letter-spacing:.12em;text-transform:uppercase;font-size:.72rem;font-weight:600}
#scout-tab:hover{background:var(--bg-card);color:var(--accent-bright)}
#scout-tab .scout-crab{font-size:1.2rem;writing-mode:horizontal-tb;line-height:1;margin-bottom:6px}
#scout-panel{position:fixed;top:0;right:0;bottom:0;width:300px;background:#0a0a14;border-left:1px solid var(--border);display:none;flex-direction:column;z-index:61;box-shadow:-12px 0 40px -20px rgba(0,0,0,.8)}
#scout-panel.open{display:flex;animation:scoutIn .22s cubic-bezier(.2,.7,.2,1)}
@keyframes scoutIn{from{transform:translateX(20px);opacity:0}to{transform:translateX(0);opacity:1}}
.scout-head{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:16px 16px 14px;border-bottom:1px solid var(--border);flex-shrink:0}
.scout-head .scout-title{display:flex;align-items:center;gap:9px;font-family:var(--font-serif);font-size:1.05rem;font-weight:500;color:var(--cream);letter-spacing:-.01em}
.scout-head .scout-title .scout-crab{font-size:1.2rem;color:var(--accent)}
.scout-head .scout-sub{display:block;font-family:var(--font-mono);font-size:.6rem;letter-spacing:.14em;text-transform:uppercase;color:var(--text-faint);font-weight:500;margin-top:2px}
#scout-close{flex-shrink:0;width:30px;height:30px;display:inline-flex;align-items:center;justify-content:center;border:1px solid var(--border);border-radius:8px;background:transparent;color:var(--text-muted);cursor:pointer;padding:0;transition:color .2s ease,border-color .2s ease}
#scout-close:hover{color:var(--accent);border-color:var(--border-soft)}
#scout-close svg{width:15px;height:15px}
#scout-messages{flex:1;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:12px}
#scout-messages::-webkit-scrollbar{width:6px}
#scout-messages::-webkit-scrollbar-thumb{background:var(--border-soft);border-radius:3px}
.scout-msg{max-width:88%;padding:11px 13px;border-radius:11px;font-size:.88rem;line-height:1.55;word-wrap:break-word;white-space:pre-wrap;animation:scoutFade .25s ease}
@keyframes scoutFade{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
.scout-msg.scout-ai{align-self:flex-start;background:var(--bg-card);border:1px solid var(--border);border-left:2px solid var(--accent);color:var(--text-primary);border-bottom-left-radius:4px}
.scout-msg.scout-user{align-self:flex-end;background:#13131f;border:1px solid var(--border);color:var(--cream-dim);border-bottom-right-radius:4px}
.scout-typing{align-self:flex-start;display:flex;gap:4px;padding:13px 15px;background:var(--bg-card);border:1px solid var(--border);border-left:2px solid var(--accent);border-radius:11px;border-bottom-left-radius:4px}
.scout-typing span{width:6px;height:6px;border-radius:50%;background:var(--accent);opacity:.4;animation:scoutBlink 1.2s infinite}
.scout-typing span:nth-child(2){animation-delay:.2s}
.scout-typing span:nth-child(3){animation-delay:.4s}
@keyframes scoutBlink{0%,100%{opacity:.35}50%{opacity:1}}
.scout-nudge{align-self:flex-start;background:rgba(212,165,116,.08);border:1px solid rgba(212,165,116,.28);border-left:2px solid var(--accent);border-radius:11px;padding:10px 13px;font-size:.84rem;color:var(--accent);line-height:1.5}
.scout-nudge .scout-nudge-h{display:block;font-family:var(--font-mono);font-size:.6rem;letter-spacing:.12em;text-transform:uppercase;color:var(--accent-bright);margin-bottom:4px;font-weight:600}
.scout-input-wrap{display:flex;gap:8px;padding:14px 16px;border-top:1px solid var(--border);flex-shrink:0}
#scout-input{flex:1;background:var(--bg-primary);border:1px solid var(--border);border-radius:10px;padding:11px 13px;color:var(--text-primary);font-size:.88rem;font-family:inherit;transition:border-color .2s ease,box-shadow .2s ease}
#scout-input:focus{outline:none;border-color:var(--accent);box-shadow:0 0 0 3px rgba(212,165,116,.14)}
#scout-input::placeholder{color:var(--text-faint)}
#scout-send{flex-shrink:0;width:42px;height:42px;display:inline-flex;align-items:center;justify-content:center;border:none;border-radius:10px;background:linear-gradient(135deg,var(--accent),var(--accent-deep));color:#1a1205;cursor:pointer;padding:0;transition:transform .15s ease,filter .2s ease}
#scout-send:hover{transform:translateY(-1px);filter:brightness(1.05)}
#scout-send:disabled{opacity:.5;cursor:not-allowed;transform:none}
#scout-send svg{width:17px;height:17px}
/* Mobile: Scout becomes an off-canvas overlay (full height, 86% width). */
@media(max-width:920px){#scout-panel{width:86%}#scout-tab{width:36px}}
</style></head>
<body><div class="grain" aria-hidden="true"></div>${body}<script>
// Close any open switcher dropdown on outside click / Escape.
(function(){var m=document.getElementById('sw-menu');if(!m)return;
document.addEventListener('click',function(e){if(!e.target.closest('.biz-switcher'))m.classList.remove('open')});
document.addEventListener('keydown',function(e){if(e.key==='Escape')m.classList.remove('open')});
})();
// Switch the active business: POST sets bl_business_id, then reload.
function switchBusiness(bid){var f=document.createElement('form');f.method='POST';f.action='/api/team/switch';f.innerHTML='<input type="hidden" name="business_id" value="'+bid+'">';document.body.appendChild(f);f.submit()}

// ── DEBUG TOOLS: Inspect + Annotate ────────────────────────────────────
// Self-injecting debug overlay. Gated on the presence of a .sidebar
// (rendered only on signed-in pages by sidebarNav()), so the FABs never
// appear on the public landing page or login screens.
//   • Inspect  — hover→red outline, click→capture that element + its info.
//   • Annotate — open a toolbar (Arrow / Rectangle / Text), draw marks on a
//     full-viewport canvas overlay, then Capture bakes the marks into a
//     page screenshot via html2canvas's onclone (marks injected into the
//     cloned doc, not the live page) and copies text+PNG to the clipboard.
// Image capture uses a lazily-loaded html2canvas; if unavailable it falls
// back to a text-only copy (URL + element/region info).
(function(){
  // Only signed-in dashboard/admin pages render a sidebar.
  if(!document.querySelector('.sidebar'))return;
  // Skip iframes / nested documents.
  if(window.top!==window.self)return;

  var HTML2C='https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js';
  var h2cPromise=null;
  function loadHtml2Canvas(){
    if(h2cPromise)return h2cPromise;
    if(window.html2canvas)return Promise.resolve();
    h2cPromise=new Promise(function(res,rej){
      var s=document.createElement('script');
      s.src=HTML2C;s.onload=function(){res()};s.onerror=function(){h2cPromise=null;rej(new Error('html2canvas load failed'))};
      document.head.appendChild(s);
    });
    return h2cPromise.catch(function(e){h2cPromise=null;throw e;});
  }

  // Tiny non-blocking toast for copy/capture feedback.
  var toastEl=null,toastTimer=null;
  function toast(msg){
    if(!toastEl){toastEl=document.createElement('div');toastEl.id='bl-debug-toast';document.body.appendChild(toastEl)}
    toastEl.textContent=msg;toastEl.classList.add('show');
    clearTimeout(toastTimer);toastTimer=setTimeout(function(){toastEl.classList.remove('show')},2600);
  }

  // Copy text to clipboard with graceful fallback.
  function copyText(t){
    try{
      if(navigator.clipboard&&navigator.clipboard.writeText)return navigator.clipboard.writeText(t);
    }catch(e){}
    try{var ta=document.createElement('textarea');ta.value=t;ta.style.position='fixed';ta.style.opacity='0';document.body.appendChild(ta);ta.select();document.execCommand('copy');ta.remove();}catch(e){}
    return Promise.resolve();
  }

  // Save a PNG blob as a download. <a download> works without transient
  // activation and regardless of blob size, so it is the reliable fallback
  // when clipboard image-write fails (the common case — see copyRich).
  function downloadBlob(blob,name){
    try{
      var url=URL.createObjectURL(blob);
      var a=document.createElement('a');
      a.href=url;a.download=name||'screenshot.png';a.style.display='none';
      document.body.appendChild(a);a.click();
      setTimeout(function(){a.remove();URL.revokeObjectURL(url);},1000);
      return true;
    }catch(e){return false;}
  }

  // Write rich clipboard payload (text + optional image blob).
  // IMPORTANT: image→clipboard only works inside the transient-activation
  // window from a user gesture. By the time html2canvas finishes rendering
  // (often several seconds), that window has EXPIRED and clipboard.write()
  // silently rejects in Chrome / throws in Safari. So we treat clipboard as
  // best-effort and ALWAYS fall back to an <a download> (reliable) + the text
  // copy. The user gets the image one way or another.
  function copyRich(text,blob,name){
    function clipboardAttempt(){
      if(!blob||!window.ClipboardItem||!navigator.clipboard||!navigator.clipboard.write)return Promise.resolve(false);
      var items={};
      items['text/plain']=new Blob([text],{type:'text/plain'});
      items['image/png']=blob;
      return navigator.clipboard.write([new ClipboardItem(items)]).then(function(){return true;}).catch(function(){return false;});
    }
    if(blob){
      return clipboardAttempt().then(function(clipOk){
        var didDownload=downloadBlob(blob,name);
        // Still attempt the text copy (text write survives longer / works
        // even when the image write lost activation).
        return copyText(text).then(function(){
          if(clipOk)toast('✓ Screenshot copied to clipboard');
          else if(didDownload)toast('✓ Image downloaded (clipboard blocked) + text copied');
          else toast('✓ Text copied (image save failed)');
        });
      });
    }
    return copyText(text).then(function(){toast('✓ Copied text')});
  }

  // ── Annotation canvas overlay + drawing ──────────────────────────────
  // Marks render onto an untainted 2D <canvas>. Because capture uses
  // html2canvas onclone (injecting the canvas into the CLONED doc) with
  // scrollX/Y=0 and the canvas positioned absolute at origin, the marks
  // bake into the output reliably. SVG was ruled out (html2canvas drops it
  // via an async race) and position:fixed is avoided (html2canvas
  // mis-positions fixed elements).
  var annoCanvas=null,annoCtx=null,annoToolbar=null,textInput=null;
  var annos=[];                 // committed marks: {type,x1,y1,x2,y2,text}
  var annoTool='arrow';         // 'arrow' | 'rect' | 'text'
  var DPR=window.devicePixelRatio||1;
  var drawing=false,dragAnno=null;
  var annoFont='600 14px sans-serif'; // set from body font in ensureAnnoDOM

  function ensureAnnoDOM(){
    if(annoCanvas)return;
    annoCanvas=document.createElement('canvas');annoCanvas.id='bl-anno-canvas';
    annoToolbar=document.createElement('div');annoToolbar.id='bl-anno-toolbar';
    function btn(label,key,cls){var b=document.createElement('button');b.type='button';b.className='bl-anno-btn'+(cls?' '+cls:'');b.innerHTML=label;b.setAttribute('data-tool',key);return b;}
    var arrowBtn=btn('↗ Arrow','arrow'),rectBtn=btn('▭ Rectangle','rect'),textBtn=btn('T Text','text');
    var capBtn=btn('✓ Capture','capture','cap'),cancelBtn=btn('✕ Cancel','cancel','cap');
    var sep1=document.createElement('span');sep1.className='bl-anno-sep';
    var sep2=document.createElement('span');sep2.className='bl-anno-sep';
    [arrowBtn,rectBtn,textBtn,sep1,capBtn,sep2,cancelBtn].forEach(function(n){annoToolbar.appendChild(n)});
    textInput=document.createElement('input');textInput.id='bl-anno-text-input';textInput.type='text';textInput.setAttribute('placeholder','note…');
    document.body.appendChild(annoCanvas);document.body.appendChild(annoToolbar);document.body.appendChild(textInput);
    annoCtx=annoCanvas.getContext('2d');
    try{var ff=getComputedStyle(document.body).fontFamily||'sans-serif';annoFont='600 14px '+ff;}catch(e){}
    annoToolbar.addEventListener('click',onToolbarClick);
    textInput.addEventListener('keydown',onTextKey);
    syncToolButton();
  }

  // Size the canvas backing store to the full document so marks at any scroll
  // position land correctly when captured at scrollX/Y=0.
  function resizeAnnoCanvas(){
    if(!annoCanvas)return;
    var w=document.documentElement.scrollWidth,h=document.documentElement.scrollHeight;
    annoCanvas.width=Math.max(1,Math.floor(w*DPR));
    annoCanvas.height=Math.max(1,Math.floor(h*DPR));
    annoCanvas.style.width=w+'px';annoCanvas.style.height=h+'px';
    annoCtx.setTransform(DPR,0,0,DPR,0,0);
    redrawAnno();
  }

  function syncToolButton(){
    if(!annoToolbar)return;
    Array.prototype.forEach.call(annoToolbar.querySelectorAll('.bl-anno-btn[data-tool]'),function(b){
      b.classList.toggle('active',b.getAttribute('data-tool')===annoTool);
    });
  }

  // Redraw all committed marks, plus the in-progress drag (pview) if any.
  function redrawAnno(){
    if(!annoCtx)return;
    var w=annoCanvas.width/DPR,h=annoCanvas.height/DPR;
    annoCtx.clearRect(0,0,w,h);
    annos.forEach(function(a){drawAnno(annoCtx,a)});
    if(pview)drawAnno(annoCtx,pview);
  }
  var pview=null; // current in-progress preview anno during drag

  function drawAnno(ctx,a){
    ctx.save();
    ctx.strokeStyle='#ef4444';ctx.fillStyle='#ef4444';ctx.lineWidth=3;
    ctx.lineCap='round';ctx.lineJoin='round';
    ctx.font=annoFont;
    if(a.type==='arrow')drawArrow(ctx,a.x1,a.y1,a.x2,a.y2);
    else if(a.type==='rect'){ctx.strokeRect(a.x1,a.y1,a.x2-a.x1,a.y2-a.y1);}
    else if(a.type==='text'){ctx.fillText(a.text,a.x1,a.y1+14);}
    ctx.restore();
  }

  // Straight line + a two-segment arrowhead.
  function drawArrow(ctx,x1,y1,x2,y2){
    var dx=x2-x1,dy=y2-y1,len=Math.sqrt(dx*dx+dy*dy);
    ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();
    if(len<1)return;
    var ang=Math.atan2(dy,dx),head=14;
    ctx.beginPath();
    ctx.moveTo(x2,y2);
    ctx.lineTo(x2-head*Math.cos(ang-Math.PI/7),y2-head*Math.sin(ang-Math.PI/7));
    ctx.moveTo(x2,y2);
    ctx.lineTo(x2-head*Math.cos(ang+Math.PI/7),y2-head*Math.sin(ang+Math.PI/7));
    ctx.stroke();
  }

  function clearAnnos(){annos=[];if(annoCtx){var w=annoCanvas.width/DPR,h=annoCanvas.height/DPR;annoCtx.clearRect(0,0,w,h);}}

  // Pointer coords relative to the document (so marks track scroll).
  function docXY(e){return{x:e.clientX+(window.scrollX||window.pageXOffset||0),y:e.clientY+(window.scrollY||window.pageYOffset||0)};}

  // Canvas (capture-phase) listeners, gated on annotate mode + tool.
  function onCanvasDown(e){
    if(mode!=='annotate')return;
    if(isUiTarget(e.target))return;
    if(annoTool==='text'){placeTextInput(e);return;}
    var p=docXY(e);
    drawing=true;dragAnno={type:annoTool,x1:p.x,y1:p.y,x2:p.x,y2:p.y};
    e.preventDefault();
  }
  function onCanvasMove(e){
    if(!drawing||!dragAnno)return;
    var p=docXY(e);dragAnno.x2=p.x;dragAnno.y2=p.y;
    pview=dragAnno;redrawAnno();
  }
  function onCanvasUp(e){
    if(!drawing||!dragAnno)return;drawing=false;
    var a=dragAnno;dragAnno=null;pview=null;
    if(Math.abs(a.x2-a.x1)<4&&Math.abs(a.y2-a.y1)<4){redrawAnno();return;}
    annos.push(a);redrawAnno();
  }
  // True if the target is our own UI (toolbar/FABs/text input) and should be
  // ignored by the canvas drawing handlers. The canvas itself is NOT UI — it's
  // the drawing surface, so it returns false (clicks on it are legitimate).
  function isUiTarget(t){
    if(!t||!t.closest)return false;
    return !!(t.closest('#bl-anno-toolbar')||t.closest('#bl-debug-tools')||t.id==='bl-anno-text-input');
  }

  // Text tool: drop an inline <input> at the click; Enter commits the note.
  function placeTextInput(e){
    if(textInput.style.display==='block')return; // one at a time
    var cx=e.clientX+(window.scrollX||0),cy=e.clientY+(window.scrollY||0);
    textInput.value='';
    textInput.style.left=(e.clientX)+'px';textInput.style.top=(e.clientY)+'px';textInput.style.display='block';
    textInput.dataset.dx=cx;textInput.dataset.dy=cy;
    textInput.focus();
  }
  function onTextKey(e){
    if(e.key==='Enter'){
      var v=(textInput.value||'').trim();
      var x=parseFloat(textInput.dataset.dx),y=parseFloat(textInput.dataset.dy);
      textInput.style.display='none';
      if(v&&!isNaN(x)&&!isNaN(y))annos.push({type:'text',x1:x,y1:y,text:v});
      redrawAnno();
    }else if(e.key==='Escape'){textInput.style.display='none';}
  }

  function onToolbarClick(e){
    var b=e.target.closest&&e.target.closest('.bl-anno-btn');if(!b)return;
    var key=b.getAttribute('data-tool');
    if(key==='arrow'||key==='rect'||key==='text'){annoTool=key;textInput.style.display='none';syncToolButton();}
    else if(key==='capture'){captureFromAnnotate();}
    else if(key==='cancel'){exit();}
  }

  // ── Capture ──────────────────────────────────────────────────────────
  // Render documentElement via html2canvas. onclone injects the annotation
  // canvas (absolute, origin-aligned) into the CLONE so the live page is
  // untouched; scrollX/Y=0 + windowWidth/Height keep positioning correct.
  function captureAnnotated(info){
    return loadHtml2Canvas().then(function(){
      if(!window.html2canvas)throw new Error('html2canvas missing');
      var src=annoCanvas; // may be null when called from Inspect
      return window.html2canvas(document.documentElement,{
        backgroundColor:getComputedStyle(document.body).backgroundColor||'#0a0a12',
        logging:false,useCORS:true,scale:DPR,
        scrollX:0,scrollY:0,
        windowWidth:document.documentElement.scrollWidth,
        windowHeight:document.documentElement.scrollHeight,
        onclone:function(doc){
          if(!src)return;
          var c=src.cloneNode(true);
          // Copy the painted bitmap (cloneNode doesn't carry canvas pixels).
          try{var cc=c.getContext('2d');cc.drawImage(src,0,0);}catch(e){}
          c.style.position='absolute';c.style.top='0';c.style.left='0';
          c.style.zIndex='2147483002';c.style.display='block';c.style.pointerEvents='none';
          doc.body.appendChild(c);
        }
      });
    }).then(function(canvas){
      return new Promise(function(res,rej){
        var done=false;
        var t=setTimeout(function(){if(!done){done=true;rej(new Error('toBlob timeout'))}},8000);
        try{
          canvas.toBlob(function(b){if(!done){done=true;clearTimeout(t);b?res(b):rej(new Error('toBlob empty'))}},'image/png');
        }catch(e){if(!done){done=true;clearTimeout(t);rej(e);}}
      });
    });
  }

  // Capture from Annotate mode: bake marks in, copy, then clear + exit.
  function captureFromAnnotate(){
    var info='Branch Live · Annotate\\n'
      +'URL: '+location.href+'\\n'
      +'Marks: '+annos.length+' ('+annos.filter(function(a){return a.type==='arrow'}).length+' arrow, '
      +annos.filter(function(a){return a.type==='rect'}).length+' rect, '
      +annos.filter(function(a){return a.type==='text'}).length+' text)';
    // Unique filename like branchlive-overview-2026-07-03-annotate.png.
    var p=(location.pathname.split('/').pop()||'page').replace(/[^a-z0-9]/gi,'');
    var d=new Date();var ts=d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
    var name='branchlive-'+(p||'page')+'-'+ts+'-annotate.png';
    toast('Capturing…');
    captureAnnotated(info)
      .then(function(blob){clearAnnos();exit();return copyRich(info,blob,name);})
      .catch(function(){clearAnnos();exit();return copyRich(info,null,name);});
  }

  // ── Floating button bar ──────────────────────────────────────────────
  var tools=document.createElement('div');tools.id='bl-debug-tools';
  var inspectBtn=document.createElement('button');inspectBtn.type='button';inspectBtn.className='bl-debug-fab';inspectBtn.innerHTML='🔍 Inspect';
  var annotateBtn=document.createElement('button');annotateBtn.type='button';annotateBtn.className='bl-debug-fab';annotateBtn.innerHTML='✏️ Annotate';
  tools.appendChild(inspectBtn);tools.appendChild(annotateBtn);
  document.body.appendChild(tools);

  var mode=null; // 'inspect' | 'annotate' | null
  function setMode(next){
    mode=next;
    document.body.classList.toggle('bl-inspect-on',mode==='inspect');
    inspectBtn.classList.toggle('active',mode==='inspect');
    annotateBtn.classList.toggle('active',mode==='annotate');
    if(mode==='annotate'){
      ensureAnnoDOM();resizeAnnoCanvas();
      annoCanvas.classList.add('bl-anno-active');
      annoToolbar.classList.add('bl-anno-active');
      document.addEventListener('mousedown',onCanvasDown,true);
      document.addEventListener('mousemove',onCanvasMove,true);
      document.addEventListener('mouseup',onCanvasUp,true);
      window.addEventListener('resize',resizeAnnoCanvas);
    }else{
      if(annoCanvas){annoCanvas.classList.remove('bl-anno-active');}
      if(annoToolbar){annoToolbar.classList.remove('bl-anno-active');}
      if(textInput){textInput.style.display='none';}
      drawing=false;dragAnno=null;pview=null;
      document.removeEventListener('mousedown',onCanvasDown,true);
      document.removeEventListener('mousemove',onCanvasMove,true);
      document.removeEventListener('mouseup',onCanvasUp,true);
      window.removeEventListener('resize',resizeAnnoCanvas);
      clearAnnos();
    }
  }
  function exit(){setMode(null)}

  // ESC cancels whichever mode is active (and closes the text input first).
  document.addEventListener('keydown',function(e){
    if(e.key==='Escape'){
      if(textInput&&textInput.style.display==='block'){textInput.style.display='none';return;}
      if(mode)exit();
    }
  });

  // ── Tool 1: Inspect ── hover→red outline, click→capture element bounds.
  inspectBtn.addEventListener('click',function(){setMode(mode==='inspect'?null:'inspect');if(mode==='inspect')toast('Inspect on — click an element (Esc to cancel)')});

  // Delegated click (capture phase): Inspect completion.
  document.addEventListener('click',function(e){
    if(mode!=='inspect')return;
    e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();
    var el=e.target;
    if(el&&(el===inspectBtn||el===annotateBtn||(el.closest&&el.closest('#bl-debug-tools'))))return;
    var r=el.getBoundingClientRect();
    var tag=el.tagName.toLowerCase();
    var cls=(el.className&&typeof el.className==='string')?el.className.replace(/\\s+/g,' ').trim():'';
    var id=el.id?'#'+el.id:'';
    var txt=(el.innerText||'').replace(/\\s+/g,' ').trim().slice(0,400);
    var path=cssPath(el);
    var info='Branch Live · Inspect\\n'
      +'URL: '+location.href+'\\n'
      +'Element: <'+tag+'>'+id+(cls?'.'+cls.split(/\\s+/).join('.'):'')+'\\n'
      +'Path: '+path+'\\n'
      +'Bounds: '+Math.round(r.left)+','+Math.round(r.top)+'  '+Math.round(r.width)+'x'+Math.round(r.height)+'\\n'
      +'Text: '+(txt||'(none)');
    var p=(location.pathname.split('/').pop()||'page').replace(/[^a-z0-9]/gi,'');
    var iname='branchlive-'+(p||'page')+'-inspect-'+(tag||'el')+'.png';
    exit();
    captureAnnotated(info)
      .then(function(blob){return copyRich(info,blob,iname)})
      .catch(function(){return copyRich(info,null,iname)});
  },true);

  // Build a short, readable CSS path for the captured element.
  function cssPath(el){
    var parts=[],n=el;
    while(n&&n.nodeType===1&&parts.length<6){
      var s=n.tagName.toLowerCase();
      if(n.id)s+='#'+n.id;
      else if(n.classList.length)s+='.'+Array.from(n.classList).slice(0,2).join('.');
      parts.unshift(s);
      if(n.id||n===document.body)break;
      n=n.parentElement;
    }
    return parts.join(' > ');
  }

  // ── Tool 2: Annotate ── open toolbar, draw marks, Capture bakes them in.
  annotateBtn.addEventListener('click',function(){setMode(mode==='annotate'?null:'annotate');if(mode==='annotate')toast('Annotate on — pick Arrow/Rect/Text, then ✓ Capture')});
})();

// ── SCOUT — collapsible AI assistant panel ─────────────────────────────
// Self-injecting. Gated on a .sidebar (signed-in /p/* pages only), so it
// never appears on the public landing or login screens. Collapsed to a 40px
// tab by default; click to expand to 300px. Reactive (type a question →
// POST /api/scout) + proactive (30s idle on a page → a hardcoded tip).
(function(){
  if(!document.querySelector('.sidebar'))return;
  if(window.top!==window.self)return;

  // Derive the current page key from the URL (/p/overview → "overview").
  var path=location.pathname||'';
  var pageKey=path.replace(/^\\/p\\//,'').replace(/\\/$/,'')||'overview';
  var pageKeyClean=pageKey.split('/')[0]; // "leads", "calendar", "admin/accounts" → first segment

  // Page-specific proactive tips (hardcoded fallback — no API call needed).
  // NOTE: these strings live inside a template literal, so any backslash or
  // apostrophe escape is consumed by the template before reaching the browser.
  // Keep them free of contractions (\') and backslash-escapes (\/) — rephrase
  // instead of escaping. See the regex on the pageKey line for the one
  // exception, which is double-escaped (\\/) deliberately.
  var NUDGES={
    overview:['Tip: Your Overview shows current leads and appointments at a glance. Ask me "how do I read my stats?"'],
    leads:['Tip: Click any lead to see its call transcript and AI follow-up email. Ask me "what is the difference between confirmed and pending?"'],
    calls:['Tip: Click a call row to expand the full transcript. Ask me "how does Emma decide what is urgent?"'],
    calendar:['Tip: Click any appointment to see details and reschedule. Ask me "how do I block off lunch time?"'],
    knowledge:['Tip: Add services with Category, Item, Price, and Notes. Ask me "how do I add services to my knowledge base?"'],
    billing:['Tip: Plans start at $29.95/mo after a 30-day free trial. Ask me "what add-ons are available?"'],
    settings:['Tip: Your Welcome Message is what Emma says when answering a call. Ask me "what should my greeting say?"'],
    website:['Tip: The builder creates a public site at /s/your-business. Ask me "how do I publish my website?"'],
    analytics:['Tip: This page breaks down your lead volume and revenue by month. Ask me "how is my conversion rate calculated?"'],
    social:['Tip: Generate AI post drafts from your reviews, then publish. Ask me "how does auto-posting work?"'],
    blog:['Tip: AI blog posts are generated weekly from your business info. Ask me "can I edit a generated post?"'],
    team:['Tip: Invite team members as admin, manager, or employee. Ask me "what can a manager do vs an employee?"'],
    outreach:['Tip: Search prospects by industry and location, then send an SMS blast.'],
    gallery:['Tip: Upload project photos to show on your public website.']
  };
  function nudgeFor(pg){return (NUDGES[pg]||NUDGES.overview)[0];}

  // Build the DOM once.
  var tab=document.createElement('div');tab.id='scout-tab';
  tab.innerHTML='<span class="scout-crab">🦀</span><span class="scout-tab-label">Scout</span>';
  var panel=document.createElement('div');panel.id='scout-panel';
  panel.innerHTML='<div class="scout-head">'
    +'<div><div class="scout-title"><span class="scout-crab">🦀</span> Scout</div>'
    +'<span class="scout-sub">Your Branch Live guide</span></div>'
    +'<button id="scout-close" aria-label="Collapse Scout"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg></button>'
    +'</div>'
    +'<div id="scout-messages"></div>'
    +'<div class="scout-input-wrap">'
    +'<input id="scout-input" type="text" placeholder="Ask Scout anything…" autocomplete="off">'
    +'<button id="scout-send" aria-label="Send"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg></button>'
    +'</div>';
  document.body.appendChild(tab);document.body.appendChild(panel);

  var msgEl=panel.querySelector('#scout-messages');
  var inputEl=panel.querySelector('#scout-input');
  var sendBtn=panel.querySelector('#scout-send');
  var closeBtn=panel.querySelector('#scout-close');
  var busy=false;
  var nudged=false;          // one proactive nudge per page load

  function scrollBottom(){msgEl.scrollTop=msgEl.scrollHeight;}
  function addMsg(text,cls){
    var d=document.createElement('div');d.className='scout-msg '+cls;d.textContent=text;
    msgEl.appendChild(d);scrollBottom();return d;
  }
  function addNudge(text){
    var d=document.createElement('div');d.className='scout-nudge';
    d.innerHTML='<span class="scout-nudge-h">💡 Scout tip</span>'+text;
    msgEl.appendChild(d);scrollBottom();
  }
  function typingOn(){
    var d=document.createElement('div');d.className='scout-typing';d.id='scout-typing';
    d.innerHTML='<span></span><span></span><span></span>';
    msgEl.appendChild(d);scrollBottom();
  }
  function typingOff(){var t=panel.querySelector('#scout-typing');if(t)t.remove();}

  // Opening pushes a friendly greeting the first time so the panel isn't empty.
  var greeted=false;
  function openPanel(){
    panel.classList.add('open');
    if(!greeted){
      greeted=true;
      addMsg('Hi! I am Scout 🦀 — your Branch Live guide. I see you are on the '+pageKeyClean+' page. Ask me anything about how to use your dashboard.','scout-ai');
    }
    setTimeout(function(){inputEl.focus();},120);
  }
  function closePanel(){panel.classList.remove('open');inputEl.blur();}
  tab.addEventListener('click',openPanel);
  closeBtn.addEventListener('click',closePanel);

  // Escape collapses the panel.
  document.addEventListener('keydown',function(e){if(e.key==='Escape'&&panel.classList.contains('open'))closePanel();});

  // Send a question to /api/scout and render the answer.
  async function send(){
    var q=(inputEl.value||'').trim();if(!q||busy)return;
    busy=true;sendBtn.disabled=true;
    addMsg(q,'scout-user');
    inputEl.value='';
    typingOn();
    try{
      var res=await fetch('/api/scout',{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        credentials:'same-origin',
        body:JSON.stringify({question:q,page:pageKeyClean})
      });
      var data=await res.json();
      typingOff();
      addMsg((data&&data.answer)||'Hmm, I could not come up with an answer. Try rephrasing, or email hello@branchlive.com.','scout-ai');
    }catch(e){
      typingOff();
      addMsg('Connection hiccup — please try again in a moment.','scout-ai');
    }finally{
      busy=false;sendBtn.disabled=false;inputEl.focus();
    }
  }
  sendBtn.addEventListener('click',send);
  inputEl.addEventListener('keydown',function(e){if(e.key==='Enter'){e.preventDefault();send();}});

  // Proactive nudge: 30s on this page with no interaction → suggest a tip.
  // Resets the timer on any click/keydown so active users aren't bothered.
  var idleTimer=null;
  function armNudge(){
    clearTimeout(idleTimer);
    idleTimer=setTimeout(function(){
      if(nudged)return;nudged=true;
      // Only nudge if the panel is open (don't auto-open + interrupt).
      if(panel.classList.contains('open'))addNudge(nudgeFor(pageKeyClean));
    },30000);
  }
  ['click','keydown','scroll'].forEach(function(ev){document.addEventListener(ev,armNudge,{passive:true});});
  armNudge();
})();
</script></body></html>`;
}

// ═══════════════════════════════════════════════════════════════════════
// EMAIL AUTORESPONDER — customer-facing templates, trigger endpoint, log
// ═══════════════════════════════════════════════════════════════════════

const AUTO_TEMPLATES = new Set(['lead_followup', 'appointment_confirm', 'missed_call']);

async function handleEmailsSendTemplate(request, env, uid) {
  try {
    const body = await request.json();
    const template = String(body.template || '').toLowerCase();
    if (!AUTO_TEMPLATES.has(template)) return apiError('Unknown template');
    const leadId = parseInt(body.lead_id, 10) || null;
    const apptId = parseInt(body.appointment_id, 10) || null;
    if (!leadId && !apptId) return apiError('lead_id or appointment_id is required');
    const settings = await env.DB.prepare('SELECT business_name, forwarding_number FROM settings WHERE user_id = ?').bind(uid).first();
    const businessName = (settings && settings.business_name) || '';
    const phone = (settings && settings.forwarding_number) || '';
    let lead = null, appt = null;
    if (leadId) lead = await env.DB.prepare('SELECT * FROM leads WHERE id = ? AND user_id = ?').bind(leadId, uid).first();
    if (apptId) {
      appt = await env.DB.prepare('SELECT * FROM appointments WHERE id = ? AND user_id = ?').bind(apptId, uid).first();
      if (appt && !lead) {
        const m = appt.customer_name
          ? await env.DB.prepare("SELECT * FROM leads WHERE user_id = ? AND lower(caller_name) = lower(?) AND caller_email != '' ORDER BY id DESC LIMIT 1").bind(uid, appt.customer_name).first()
          : null;
        if (m) lead = m;
      }
    }
    let to = null, subject = '', content = '', ctxLeadId = leadId, ctxApptId = apptId;
    if (template === 'lead_followup') {
      if (!lead) return apiError('Lead not found');
      to = lead.caller_email;
      if (!to) return apiError('This lead has no email address');
      subject = `Thanks for calling ${businessName || 'us'}`;
      content = leadFollowupEmailContent(businessName, lead.caller_name, lead.job_details, phone);
    } else if (template === 'appointment_confirm') {
      if (!appt) return apiError('Appointment not found');
      to = (body.to && String(body.to)) || (lead && lead.caller_email) || '';
      if (!to) return apiError('No customer email available for this appointment');
      subject = `Your appointment is confirmed — ${appt.title}`;
      content = customerAppointmentConfirmContent(businessName, appt.title, appt.date, appt.time, appt.customer_name);
    } else {
      if (!lead) return apiError('Lead not found');
      to = lead.caller_email;
      if (!to) return apiError('This lead has no email address');
      subject = `Sorry we missed your call — ${businessName || 'us'}`;
      content = missedCallEmailContent(businessName, lead.caller_name, phone);
    }
    const res = await sendAutoEmail(env, { to, subject, html: emailShell(content), uid, leadId: ctxLeadId, appointmentId: ctxApptId, template });
    if (!res.ok) return apiError('Email could not be sent', 500);
    return json({ ok: true, resend_id: res.resendId || null });
  } catch (e) {
    console.error('Emails send-template error:', e);
    return apiError('Could not send email', 500);
  }
}

async function handleEmailsList(request, env, uid) {
  try {
    const { results } = await env.DB.prepare(
      'SELECT id, lead_id, appointment_id, to_email, template, status, resend_id, created_at FROM email_log WHERE user_id = ? ORDER BY created_at DESC LIMIT 50'
    ).bind(uid).all();
    return json(results || []);
  } catch (e) {
    console.error('Emails list error:', e);
    return apiError('Could not load email log', 500);
  }
}

// ═══════════════════════════════════════════════════════════════════════
// AFFILIATE / REFERRAL PROGRAM — reps & partners earn a 20% commission
// ═══════════════════════════════════════════════════════════════════════

const AFFILIATE_PLAN_PRICE = 29.95;

async function affiliateUniqueCode(env, name) {
  const base = siteSlugify(name);
  let candidate = base || 'aff';
  let n = 1;
  for (;;) {
    const row = await env.DB.prepare('SELECT code FROM affiliate WHERE lower(code) = lower(?)').bind(candidate).first();
    if (!row) return candidate;
    n += 1;
    candidate = `${base}-${n}`;
    if (n > 999) return `aff-${Date.now().toString(36).slice(-5)}`;
  }
}

async function handleAffiliateSignup(request, env, uid) {
  try {
    let aff = await env.DB.prepare('SELECT * FROM affiliate WHERE user_id = ?').bind(uid).first();
    if (!aff) {
      const user = await env.DB.prepare('SELECT name, company FROM users WHERE id = ?').bind(uid).first();
      const seedName = (user && (user.company || user.name)) || 'affiliate';
      const code = await affiliateUniqueCode(env, seedName);
      await env.DB.prepare('INSERT INTO affiliate (user_id, code, name, commission_rate) VALUES (?, ?, ?, 0.20)').bind(uid, code, seedName).run();
      aff = await env.DB.prepare('SELECT * FROM affiliate WHERE user_id = ?').bind(uid).first();
    }
    return json({ ok: true, code: aff.code, name: aff.name, commission_rate: aff.commission_rate, share_url: `https://branchlive.com/signup?ref=${encodeURIComponent(aff.code)}` });
  } catch (e) {
    console.error('Affiliate signup error:', e);
    return apiError('Could not create affiliate account', 500);
  }
}

async function affiliateReferralRows(env, code) {
  const { results } = await env.DB.prepare(
    `SELECT r.id, r.referred_user_id, r.created_at,
            u.company AS referred_company, u.email AS referred_email,
            s.plan, s.status AS sub_status
     FROM referrals r
     LEFT JOIN users u ON r.referred_user_id = u.id
     LEFT JOIN subscriptions s ON r.referred_user_id = s.user_id
     WHERE r.affiliate_code = ?
     ORDER BY r.created_at DESC`
  ).bind(code).all();
  return results || [];
}

async function handleAffiliateStats(request, env, uid) {
  try {
    const aff = await env.DB.prepare('SELECT * FROM affiliate WHERE user_id = ?').bind(uid).first();
    if (!aff) return json({ affiliate: null });
    const referrals = await affiliateReferralRows(env, aff.code);
    const active = referrals.filter(r => r.sub_status === 'trial' || r.sub_status === 'active' || r.plan === 'free');
    const monthlyEarnings = +(active.length * AFFILIATE_PLAN_PRICE * aff.commission_rate).toFixed(2);
    return json({
      affiliate: { code: aff.code, name: aff.name, commission_rate: aff.commission_rate, share_url: `https://branchlive.com/signup?ref=${encodeURIComponent(aff.code)}` },
      total_referrals: referrals.length, active_referrals: active.length, monthly_earnings: monthlyEarnings,
      referrals: referrals.map(r => ({ id: r.id, company: r.referred_company || r.referred_email || 'Unknown', plan: r.plan || 'free', status: r.sub_status || 'trial', created_at: r.created_at })),
    });
  } catch (e) {
    console.error('Affiliate stats error:', e);
    return apiError('Could not load affiliate stats', 500);
  }
}

async function handleAffiliatePayouts(request, env) {
  try {
    const { results: affs } = await env.DB.prepare('SELECT id, user_id, code, name, commission_rate FROM affiliate ORDER BY created_at DESC').all();
    const out = [];
    for (const a of (affs || [])) {
      const referrals = await affiliateReferralRows(env, a.code);
      const active = referrals.filter(r => r.sub_status === 'trial' || r.sub_status === 'active' || r.plan === 'free');
      out.push({ affiliate_id: a.id, code: a.code, name: a.name, commission_rate: a.commission_rate, total_referrals: referrals.length, active_referrals: active.length, monthly_payout: +(active.length * AFFILIATE_PLAN_PRICE * a.commission_rate).toFixed(2) });
    }
    return json({ plan_price: AFFILIATE_PLAN_PRICE, total_affiliates: out.length, total_monthly_payout: +out.reduce((s, a) => s + a.monthly_payout, 0).toFixed(2), note: 'Tracking only — Stripe Connect payouts to be wired in next.', payouts: out });
  } catch (e) {
    console.error('Affiliate payouts error:', e);
    return apiError('Could not calculate payouts', 500);
  }
}

async function handleAffiliateDashboard(request, env) {
  try {
    const code = new URL(request.url).searchParams.get('code') || '';
    const aff = code ? await env.DB.prepare('SELECT * FROM affiliate WHERE lower(code) = lower(?)').bind(code).first() : null;
    const esc = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    if (!aff) {
      const html = '<div style="min-height:100vh;display:flex;align-items:center;justify-content:center;padding:40px 20px"><div style="text-align:center;max-width:440px"><div style="font-size:2.8em;margin-bottom:14px">🤝</div><span class="eyebrow" style="display:block;margin-bottom:12px">Affiliates</span><h1 style="font-size:2rem;margin-bottom:12px">Affiliate <em>Dashboard</em></h1><p class="sub" style="margin-top:8px">Enter your affiliate code to view your referrals and earnings.</p><form method="GET" action="/api/affiliates/dashboard" style="max-width:420px;margin:28px auto 0;display:flex;gap:8px"><input name="code" placeholder="Your affiliate code" required style="flex:1"><button type="submit" class="btn-amber">View</button></form><p style="margin-top:24px"><a href="https://branchlive.com/dashboard" style="color:var(--accent-amber)">← Back to Branch Live</a></p></div></div>';
      return new Response(simpleShell('Affiliate Dashboard', html), { headers: { 'Content-Type': 'text/html' } });
    }
    const referrals = await affiliateReferralRows(env, aff.code);
    const active = referrals.filter(r => r.sub_status === 'trial' || r.sub_status === 'active' || r.plan === 'free');
    const monthly = +(active.length * AFFILIATE_PLAN_PRICE * aff.commission_rate).toFixed(2);
    const lifetime = +(referrals.length * AFFILIATE_PLAN_PRICE * aff.commission_rate).toFixed(2);
    const shareUrl = `https://branchlive.com/signup?ref=${encodeURIComponent(aff.code)}`;
    const ratePct = Math.round((aff.commission_rate || 0.20) * 100);
    const statCardAff = (label, value, tone) => `<div class="card stat-card"><div class="stat-num ${tone}">${value}</div><div class="stat-lab">${label}</div></div>`;
    const rows = referrals.map(r => `<tr><td>${esc(r.referred_company || r.referred_email || 'Unknown')}</td><td><span class="badge ${r.sub_status === 'active' || r.plan === 'free' ? 'badge-booked' : 'badge-new'}">${esc(r.sub_status || 'trial')}</span></td><td class="mono" style="color:var(--text-muted);font-size:.85em">${esc((r.created_at || '').slice(0, 10))}</td></tr>`).join('');
    const html = `<div style="min-height:100vh;padding:48px 20px"><div style="max-width:920px;margin:0 auto">
<span class="eyebrow">Affiliates</span>
<h1>🤝 Affiliate Dashboard</h1>
<p class="sub" style="margin-bottom:24px">Welcome, ${esc(aff.name || aff.code)} — you earn <strong style="color:var(--accent-amber)">${ratePct}%</strong> of every active referral, monthly.</p>
<div class="grid2" style="margin-bottom:24px">
  ${statCardAff('Total Referrals', referrals.length, 'purple')}
  ${statCardAff('Active Referrals', active.length, '')}
  ${statCardAff('Est. Monthly', '$' + monthly, 'green')}
  ${statCardAff('Lifetime Est.', '$' + lifetime, 'blue')}
</div>
<div class="card" style="margin-bottom:28px"><div style="margin-bottom:10px;font-weight:600">Your referral link</div><div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap"><code class="mono" style="flex:1;background:var(--bg-primary);border:1px solid var(--border);border-radius:10px;padding:11px 13px;color:var(--accent-amber);word-break:break-all">${esc(shareUrl)}</code><button class="btn btn-amber btn-sm" onclick="navigator.clipboard.writeText('${shareUrl}').then(()=>{this.textContent='✓ Copied';setTimeout(()=>this.textContent='📋 Copy',1500)})">📋 Copy</button></div><div style="display:flex;gap:8px;margin-top:14px"><a class="btn btn-sm btn-ghost" href="https://wa.me/?text=${encodeURIComponent('Check out Branch Live — AI receptionist for local businesses: ' + shareUrl)}" target="_blank" rel="noopener">💬 WhatsApp</a><a class="btn btn-sm btn-ghost" href="https://twitter.com/intent/tweet?text=${encodeURIComponent('24/7 AI receptionist for your business — check out Branch Live:')}&url=${encodeURIComponent(shareUrl)}" target="_blank" rel="noopener">🐦 Share</a></div></div>
<h3>Your Referrals</h3>
${referrals.length ? '<table><thead><tr><th>Company</th><th>Status</th><th>Joined</th></tr></thead><tbody>' + rows + '</tbody></table>' : `<div class="empty-state"><div class="empty-icon">🌱</div><div class="empty-title">No referrals yet</div><div class="empty-msg">Share your link above. You'll earn ${ratePct}% of every business who signs up.</div></div>`}
<p style="margin-top:28px;color:var(--text-faint);font-size:.8em">Estimates use the standard $${AFFILIATE_PLAN_PRICE}/mo plan. Stripe payouts launch soon.</p>
</div></div>`;
    return new Response(simpleShell('Affiliate Dashboard', html), { headers: { 'Content-Type': 'text/html' } });
  } catch (e) {
    console.error('Affiliate dashboard error:', e);
    return new Response(simpleShell('Error', '<h1>⚠️ Error</h1><p style="color:#f85149">Something went wrong.</p>'), { headers: { 'Content-Type': 'text/html' }, status: 500 });
  }
}

// ═══════════════════════════════════════════════════════════════════════
// HTMX LEADS LIST (/p/leads)
// Server-rendered list of the user's leads with client-side search/filter.
// Each row links to /p/leads/:id. Urgency badges + status pills use the
// shared helpers (urgencyBadge / statusPill) defined near NAV_ITEMS.
// ═══════════════════════════════════════════════════════════════════════
async function handleLeadsHtmx(request, env, uid, ctx) {
  try {
    const { results } = await env.DB.prepare(
      'SELECT id, caller_name, caller_phone, caller_email, job_details, urgency, status, created_at FROM leads WHERE user_id = ? ORDER BY created_at DESC LIMIT 200'
    ).bind(uid).all();
    const leads = results || [];
    const counts = {
      total: leads.length,
      new: leads.filter(l => (l.status || 'new') === 'new').length,
      urgent: leads.filter(l => String(l.urgency).toLowerCase() === 'urgent' || String(l.urgency).toLowerCase() === 'high').length,
      booked: leads.filter(l => (l.status || '') === 'booked').length,
    };
    const stat = (label, value, tone) => `<div class="card stat-card"><div class="stat-num ${tone}">${value}</div><div class="stat-lab">${label}</div></div>`;
    const initials = n => { const p = String(n || '?').trim().split(/\s+/); return ((p[0] || '?')[0] + (p[1] || '')[0]).toUpperCase(); };
    const rows = leads.map(l => `<a class="lead-row" href="/p/leads/${l.id}">
  <div class="avatar">${htmxEsc(initials(l.caller_name))}</div>
  <div class="meta">
    <div class="name">${htmxEsc(l.caller_name || 'Unknown caller')}</div>
    <div class="job">${htmxEsc((l.job_details || 'No job details').slice(0, 80))}${(l.job_details || '').length > 80 ? '…' : ''}</div>
  </div>
  <div class="right">
    ${urgencyBadge(l.urgency)}
    ${statusPill(l.status)}
    <span class="chevron" style="color:var(--text-faint)">›</span>
  </div>
</a>`).join('');
    const body = `<div class="app">${sidebarNav('leads', undefined, ctx)}<div class="content">
<span class="eyebrow">Leads</span>
<h1>Your <em>leads</em></h1>
<p class="sub">Every caller Emma captures — name, job, urgency, and status.</p>
<div class="grid2" style="margin-top:24px">
  ${stat('Total leads', counts.total, 'purple')}
  ${stat('New', counts.new, '')}
  ${stat('High/urgent', counts.urgent, 'green')}
  ${stat('Booked', counts.booked, 'blue')}
</div>
<div class="toolbar">
  <div class="search">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
    <input id="lead-search" placeholder="Search by name, phone, or job…" oninput="filterLeads(this.value)">
  </div>
  <select id="lead-filter" onchange="filterLeads(document.getElementById('lead-search').value)">
    <option value="all">All statuses</option>
    <option value="new">New</option>
    <option value="contacted">Contacted</option>
    <option value="scheduled">Scheduled</option>
    <option value="booked">Booked</option>
    <option value="closed">Closed</option>
  </select>
</div>
<div id="lead-list">${rows || '<div class="empty-state"><div class="empty-icon">📞</div><div class="empty-title">No leads yet</div><div class="empty-msg">When Emma captures a caller, their details land here automatically.</div></div>'}</div>
<p id="lead-empty-hint" style="display:none;text-align:center;color:var(--text-faint);padding:32px">No leads match your search.</p>
<script>
function filterLeads(q){
  q=(q||'').toLowerCase();
  var f=document.getElementById('lead-filter').value;
  var any=false;
  document.querySelectorAll('#lead-list .lead-row').forEach(function(r){
    var name=r.getAttribute('data-name')||r.querySelector('.name').textContent.toLowerCase();
    var st=r.getAttribute('data-status')||'';
    var matchQ=!q||r.textContent.toLowerCase().indexOf(q)!==-1;
    var matchS=f==='all'||st===f;
    var show=matchQ&&matchS;
    r.style.display=show?'':'none';
    if(show)any=true;
  });
  document.getElementById('lead-empty-hint').style.display=any?'none':'';
}
</script>
</div></div>`;
    return new Response(simpleShell('Leads', body), { headers: { 'Content-Type': 'text/html' } });
  } catch (e) {
    console.error('Leads htmx error:', e);
    return new Response(simpleShell('Error', '<h1>⚠️ Error</h1><p style="color:#f85149">Could not load leads.</p>'), { headers: { 'Content-Type': 'text/html' }, status: 500 });
  }
}

// Plain-text follow-up template used to seed the lead email draft textarea
// when no transcript is available for AI generation.
function leadTemplateText(lead) {
  const name = (lead.caller_name || 'there').split(' ')[0];
  const job = lead.job_details || 'your project';
  return `Hi ${name},\n\nThanks for reaching out! We received your request regarding: ${job}.\n\nWe'd love to schedule a time to discuss your project. Give us a call or reply to this email.\n\nBest regards,\nThe team`;
}

// ═══════════════════════════════════════════════════════════════════════
// HTMX LEAD DETAIL (/p/leads/:id)
// Full record for one lead: contact info, job, urgency, status, the call
// transcript, related call history, and a notes box. Status can be advanced
// via a small inline form (POST back to the same route).
// ═══════════════════════════════════════════════════════════════════════
async function handleLeadDetailHtmx(request, env, uid, leadId, ctx) {
  try {
    const lead = await env.DB.prepare('SELECT * FROM leads WHERE id = ? AND user_id = ?').bind(leadId, uid).first();
    if (!lead) {
      const body = `<div class="app">${sidebarNav('leads', undefined, ctx)}<div class="content">
<a class="back-link" href="/p/leads">‹ Back to leads</a>
<div class="empty-state"><div class="empty-icon">🔍</div><div class="empty-title">Lead not found</div><div class="empty-msg">This lead may have been removed or doesn't belong to your account.</div>
<a class="btn btn-ghost btn-sm" href="/p/leads" style="margin-top:18px">← All leads</a></div></div></div>`;
      return new Response(simpleShell('Lead not found', body), { status: 404, headers: { 'Content-Type': 'text/html' } });
    }
    const calls = (await env.DB.prepare(
      'SELECT id, caller_phone, duration_sec, summary, created_at FROM call_logs WHERE user_id = ? AND (lead_id = ? OR caller_phone = ?) ORDER BY created_at DESC LIMIT 20'
    ).bind(uid, leadId, lead.caller_phone || '').all()).results || [];
    const timeFmt = await getTimeFormat(env, uid);
    // "Mon, Jan 2, 2024" + clock honoring the account's time_format.
    const fmtDate = d => {
      if (!d) return '—';
      const date = new Date(d + 'Z');
      if (isNaN(date.getTime())) return '—';
      const day = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      return `${day}, ${formatHour(date, timeFmt, '')}`;
    };
    const initials = n => { const p = String(n || '?').trim().split(/\s+/); return ((p[0] || '?')[0] + (p[1] || '')[0]).toUpperCase(); };
    // Wider, left-justified call list — summary, date, and duration get
    // their own lines with breathing room (was a cramped two-column row).
    const callRows = calls.map(c => {
      const dur = c.duration_sec ? Math.round(c.duration_sec / 60) + 'm ' + (c.duration_sec % 60) + 's' : '—';
      return `<li class="lead-call-item">
  <div class="lci-summary">${htmxEsc(c.summary || 'Call from ' + (c.caller_phone || 'unknown'))}</div>
  <div class="lci-meta"><span>${fmtDate(c.created_at)}</span> <span class="dot">·</span> <span class="mono">${dur}</span></div>
</li>`;
    }).join('');
    const transcript = lead.transcript
      ? `<div class="card"><h3 style="margin-top:0">Call transcript</h3><div class="transcript">${htmxEsc(lead.transcript)}</div></div>`
      : '';
    const hasEmail = !!lead.caller_email;
    const hasPhone = !!lead.caller_phone;
    // Email follow-up: when there's a transcript (on the lead or any related
    // call-log summary), the draft is AI-generated on load; otherwise we seed
    // the textarea with a plain-text template so the card is still useful.
    // (The calls query selects summary but not transcript; the draft endpoint
    // does its own richer transcript lookup server-side.)
    let draftTranscript = (lead.transcript || '').trim();
    if (!draftTranscript) {
      for (const c of calls) {
        const t = (c.summary || '').trim();
        if (t) { draftTranscript = t; break; }
      }
    }
    const hasDraftTranscript = !!draftTranscript;
    const body = `<div class="app">${sidebarNav('leads', undefined, ctx)}<div class="content">
<a class="back-link" href="/p/leads">‹ Back to leads</a>
<span class="eyebrow">Lead #${lead.id}</span>
<div style="display:flex;align-items:center;gap:16px;margin-bottom:6px">
  <div class="avatar" style="width:56px;height:56px;font-size:1.4rem">${htmxEsc(initials(lead.caller_name))}</div>
  <div>
    <h1 style="margin-bottom:6px">${htmxEsc(lead.caller_name || 'Unknown caller')}</h1>
    <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap">${urgencyBadge(lead.urgency)}${statusPill(lead.status)}</div>
  </div>
</div>
<div class="detail-grid" style="margin-top:24px">
  <div style="display:flex;flex-direction:column;gap:20px">
    <div class="card">
      <h3 style="margin-top:0">Job details</h3>
      <p style="color:var(--text-primary);line-height:1.7">${htmxEsc(lead.job_details || 'No job details captured for this lead.')}</p>
    </div>
    <div class="card">
      <h3 style="margin-top:0">Call history</h3>
      ${calls.length ? '<ul class="lead-call-list">' + callRows + '</ul>' : '<div class="note-box">No calls linked to this lead yet.</div>'}
    </div>
    ${transcript}
    <div class="card" id="lead-email-card">
      <h3 style="margin-top:0">📧 Email follow-up</h3>
      <p style="color:var(--text-muted);font-size:.85em;margin:0 0 12px">${hasEmail ? 'AI-generated draft — edit before sending.' : 'Add a customer email below to send a follow-up.'}</p>
      ${hasEmail ? '' : `<input id="lead-email-to" type="email" placeholder="customer@example.com" style="width:100%;box-sizing:border-box;margin-bottom:12px" value="${htmxEsc(lead.caller_email || '')}">`}
      <span id="lead-draft-status" style="display:block;margin-bottom:8px;font-size:.85em;color:var(--accent-amber)">${hasDraftTranscript ? '✍️ Generating draft…' : ''}</span>
      <textarea id="lead-email-body" rows="10" style="width:100%;box-sizing:border-box;${hasDraftTranscript ? 'opacity:.6' : ''}" ${hasDraftTranscript ? 'disabled' : ''}>${hasDraftTranscript ? '' : htmxEsc(leadTemplateText(lead))}</textarea>
      <div style="display:flex;gap:10px;align-items:center;margin-top:12px;flex-wrap:wrap">
        <button class="btn-amber btn-sm" id="lead-email-send" ${hasEmail ? '' : 'disabled style="opacity:.5;cursor:not-allowed"'} onclick="sendLeadEmailDraft(${lead.id})">📤 Send email</button>
        <span id="lead-email-fb" class="lead-action-fb" aria-live="polite"></span>
      </div>
    </div>
  </div>
  <div style="display:flex;flex-direction:column;gap:20px">
    <div class="card">
      <h3 style="margin-top:0">Contact</h3>
      <div class="kv"><span class="k">Phone</span><span class="v mono">${htmxEsc(lead.caller_phone || '—')}</span></div>
      <div class="kv"><span class="k">Email</span><span class="v">${lead.caller_email ? htmxEsc(lead.caller_email) : '—'}</span></div>
      <div class="kv"><span class="k">Captured</span><span class="v">${fmtDate(lead.created_at)}</span></div>
      <div class="kv"><span class="k">Updated</span><span class="v">${fmtDate(lead.updated_at)}</span></div>
    </div>
    <div class="card">
      <h3 style="margin-top:0">Actions</h3>
      <div style="display:flex;flex-direction:column;gap:10px">
        <button class="btn btn-ghost btn-sm" id="lead-sms-btn" onclick="sendLeadFollowup('sms', ${lead.id})" ${hasPhone ? '' : 'disabled style="opacity:.5;cursor:not-allowed"'}>📱 Send text${hasPhone ? '' : ' (no phone)'}</button>
        <span id="lead-sms-fb" class="lead-action-fb" aria-live="polite"></span>
      </div>
    </div>
    <div class="card">
      <h3 style="margin-top:0">Update status</h3>
      <form method="POST" action="/p/leads/${lead.id}" style="display:flex;flex-direction:column;gap:10px">
        <select name="status" style="width:100%">
          ${['new','contacted','scheduled','booked','closed'].map(s => `<option value="${s}" ${(lead.status || 'new') === s ? 'selected' : ''}>${s.charAt(0).toUpperCase() + s.slice(1)}</option>`).join('')}
        </select>
        <button type="submit" class="btn-amber btn-sm">Save status</button>
      </form>
    </div>
  </div>
</div>
<script>
// Inline feedback helper for the action buttons.
function setFb(id, ok, msg){
  var el=document.getElementById(id);
  if(!el)return;
  el.textContent = ok ? '✓ '+(msg||'Sent') : '✗ '+(msg||'Failed');
  el.style.color = ok ? 'var(--success, #34d399)' : 'var(--danger, #f85149)';
}
// SMS follow-up — cookie-authed, fire-and-forget.
async function sendLeadFollowup(kind, leadId){
  var fbId='lead-sms-fb', label='text';
  var btn=document.getElementById('lead-sms-btn');
  var orig=btn?btn.textContent:'';
  if(btn){btn.disabled=true;btn.textContent='Sending…';}
  try{
    var r=await fetch('/api/leads/'+leadId+'/followup-sms-htmx',{method:'POST',credentials:'same-origin'});
    var d=await r.json().catch(function(){return{};});
    if(d.ok){ setFb(fbId,true,label+' sent'); }
    else { setFb(fbId,false,d.error||('Could not send '+label)); }
  }catch(e){ setFb(fbId,false,'Connection error'); }
  finally{ if(btn){btn.disabled=false;btn.textContent=orig;} }
}
// Email draft card state + helpers.
function draftState(){
  return {
    ta:document.getElementById('lead-email-body'),
    status:document.getElementById('lead-draft-status'),
    sendBtn:document.getElementById('lead-email-send'),
    toInput:document.getElementById('lead-email-to')
  };
}
function enableDraftCard(){
  var s=draftState();
  if(s.ta){s.ta.disabled=false;s.ta.style.opacity='1';}
  if(s.sendBtn){s.sendBtn.disabled=false;s.sendBtn.style.opacity='1';}
}
// On load, generate an AI draft from the transcript (cookie-authed endpoint).
(async function generateLeadEmailDraft(leadId){
  var s=draftState();
  if(!s.ta) return;
  // If the textarea was seeded with a template (no transcript), there's
  // nothing to generate — just make sure the card is interactive.
  if(!s.ta.disabled){ if(s.status) s.status.textContent=''; return; }
  try{
    var r=await fetch('/api/leads/'+leadId+'/email-draft-htmx',{method:'POST',credentials:'same-origin'});
    var d=await r.json().catch(function(){return{};});
    if(d&&d.ok&&d.draft){ s.ta.value=d.draft.trim(); if(s.status) s.status.textContent=''; }
    else {
      // AI failed — keep whatever the endpoint/template offers. If empty, drop
      // in a neutral line so the textarea isn't blank.
      if(!s.ta.value.trim()) s.ta.value='(Could not generate a draft — write your own message below.)';
      if(s.status){s.status.style.color='var(--text-muted)';s.status.textContent=d&&d.error?('Using template.'):'';}
    }
  }catch(e){
    if(!s.ta.value.trim()) s.ta.value='(Could not generate a draft — write your own message below.)';
    if(s.status){s.status.style.color='var(--text-muted)';s.status.textContent='Using template.';}
  }
  enableDraftCard();
})(${lead.id});
// Send the (possibly edited) draft. Posts the message body to the existing
// cookie-authed followup-email endpoint, which renders it into the email shell.
async function sendLeadEmailDraft(leadId){
  var s=draftState();
  var fbId='lead-email-fb';
  var btn=s.sendBtn;
  var orig=btn?btn.textContent:'';
  var to=(s.toInput&&s.toInput.value.trim())||'';
  // If a manual email input exists and is empty, block the send.
  if(s.toInput && !to){ setFb(fbId,false,'Enter a customer email'); return; }
  if(btn){btn.disabled=true;btn.textContent='Sending…';}
  try{
    var payload={method:'POST',credentials:'same-origin',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({message:s.ta?s.ta.value:''})};
    var r=await fetch('/api/leads/'+leadId+'/followup-email-htmx',payload);
    var d=await r.json().catch(function(){return{};});
    if(d.ok){ setFb(fbId,true,'email sent'); }
    else { setFb(fbId,false,d.error||'Could not send email'); }
  }catch(e){ setFb(fbId,false,'Connection error'); }
  finally{ if(btn){btn.disabled=false;btn.textContent=orig;} }
}
</script>
</div></div>`;
    return new Response(simpleShell(`Lead: ${lead.caller_name || lead.id}`, body), { headers: { 'Content-Type': 'text/html' } });
  } catch (e) {
    console.error('Lead detail htmx error:', e);
    return new Response(simpleShell('Error', '<h1>⚠️ Error</h1><p style="color:#f85149">Could not load this lead.</p>'), { headers: { 'Content-Type': 'text/html' }, status: 500 });
  }
}

// ═══════════════════════════════════════════════════════════════════════
// HTMX CALL LOGS (/p/calls)
// Every call Emma handled. Each row expands inline to reveal the transcript.
// ═══════════════════════════════════════════════════════════════════════
async function handleCallsHtmx(request, env, uid, ctx) {
  try {
    const { results } = await env.DB.prepare(
      'SELECT id, lead_id, caller_phone, duration_sec, summary, transcript, created_at FROM call_logs WHERE user_id = ? ORDER BY created_at DESC LIMIT 200'
    ).bind(uid).all();
    const calls = results || [];
    const totalDur = calls.reduce((s, c) => s + (c.duration_sec || 0), 0);
    const timeFmt = await getTimeFormat(env, uid);
    // Timestamps are stored as UTC; render the date part with toLocaleString
    // and the clock part via formatHour so it honors time_format.
    const fmtDate = d => {
      if (!d) return '—';
      const date = new Date(d + 'Z');
      if (isNaN(date.getTime())) return '—';
      const day = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      return `${day}, ${formatHour(date, timeFmt, '')}`;
    };

    // ── Resolve the linked lead for every call in two batched passes ──
    // (avoids an N+1 storm on a 200-row page). call_logs.lead_id is the
    // primary link; we fall back to matching caller_phone → leads.caller_phone,
    // mirroring the join already used in handleLeadDetailHtmx.
    const byLeadId = {}, byPhone = {};
    (await env.DB.prepare(
      'SELECT id, caller_name, caller_phone, job_details, status FROM leads WHERE user_id = ?'
    ).bind(uid).all()).results.forEach(l => {
      byLeadId[l.id] = l;
      if (l.caller_phone) byPhone[String(l.caller_phone).trim()] = l;
    });
    const leadFor = c => (c.lead_id && byLeadId[c.lead_id]) || (c.caller_phone && byPhone[String(c.caller_phone).trim()]) || null;

    // ── Appointments ── appointments has no lead_id column, so the only
    // join key is the caller's phone → appointments.customer_phone. Resolve
    // the soonest upcoming (or most recent) appt per linked lead.
    const leadAppt = {};
    const linkedLeads = calls.map(leadFor).filter(Boolean);
    if (linkedLeads.length) {
      const phones = [...new Set(linkedLeads.map(l => l.caller_phone).filter(Boolean))];
      if (phones.length) {
        const placeholders = phones.map(() => '?').join(',');
        const { results: appts } = await env.DB.prepare(
          `SELECT customer_phone, date, time, title, status FROM appointments WHERE user_id = ? AND customer_phone IN (${placeholders}) ORDER BY date DESC, time DESC`
        ).bind(uid, ...phones).all();
        (appts || []).forEach(a => { const key = String(a.customer_phone || '').trim(); if (key && !leadAppt[key]) leadAppt[key] = a; });
      }
    }
    const fmtAppt = a => {
      if (!a) return '';
      const dow = a.date ? (() => { try { return new Date(a.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long' }); } catch (e) { return ''; } })() : '';
      const tm = a.time ? formatHour(a.time, timeFmt, '') : '';
      return `${dow} ${tm || a.date || ''}`.trim();
    };

    const stat = (label, value, tone) => `<div class="card stat-card"><div class="stat-num ${tone}">${value}</div><div class="stat-lab">${label}</div></div>`;
    const rows = calls.map(c => {
      const hasT = !!(c.transcript && c.transcript.trim());
      const lead = leadFor(c);
      const appt = lead ? leadAppt[String(lead.caller_phone || '').trim()] : null;
      // Linked-lead context shown above the transcript when expanded.
      const leadBlock = lead
        ? `<div class="call-lead">
  <div class="cl-line"><span class="cl-k">Caller</span> <strong>${htmxEsc(lead.caller_name || 'Unknown caller')}</strong> ${statusPill(lead.status)}</div>
  ${lead.job_details ? `<div class="cl-line"><span class="cl-k">Job</span> ${htmxEsc(lead.job_details)}</div>` : ''}
  ${appt ? `<div class="cl-line cl-appt"><span class="cl-k">📅 Appointment</span> ${htmxEsc(fmtAppt(appt))}${appt.title ? ' · ' + htmxEsc(appt.title) : ''}</div>` : ''}
  <a class="cl-link" href="/p/leads/${lead.id}">View full lead →</a>
</div>`
        : '<div class="call-lead"><div class="cl-line cl-muted">No lead linked to this call.</div></div>';
      return `<tr class="call-row" id="call-${c.id}" onclick="toggleCall(${c.id})">
  <td class="call-summary">
    <div style="display:flex;align-items:center;gap:8px">
      <span class="chevron" style="color:var(--accent-amber)">▾</span>
      <span class="mono">${htmxEsc(c.caller_phone || 'Unknown')}</span>
    </div>
  </td>
  <td class="mono">${Math.round((c.duration_sec || 0) / 60)}m ${(c.duration_sec || 0) % 60}s</td>
  <td>${htmxEsc((c.summary || '—').slice(0, 90))}${(c.summary || '').length > 90 ? '…' : ''}</td>
  <td class="mono" style="color:var(--text-muted)">${fmtDate(c.created_at)}</td>
</tr>
<tr class="call-row-body" id="call-${c.id}-body"><td colspan="4" style="padding:0;border:none"><div class="call-transcript">${leadBlock}${hasT ? '<div class="transcript" style="margin:0;border-radius:0">' + htmxEsc(c.transcript) + '</div>' : '<div class="note-box" style="margin:12px 16px">No transcript for this call.</div>'}</div></td></tr>`;
    }).join('');
    const body = `<div class="app">${sidebarNav('calls', undefined, ctx)}<div class="content">
<span class="eyebrow">Call logs</span>
<h1>Every <em>call</em> Emma handled</h1>
<p class="sub">Click any row to expand the full transcript.</p>
<div class="grid2" style="margin-top:24px">
  ${stat('Total calls', calls.length, 'purple')}
  ${stat('Talk time', Math.round(totalDur / 60) + 'm', '')}
  ${stat('Avg duration', calls.length ? Math.round(totalDur / calls.length / 60) + 'm' : '0m', 'green')}
  ${stat('With transcript', calls.filter(c => c.transcript && c.transcript.trim()).length, 'blue')}
</div>
<div class="toolbar">
  <div class="search">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
    <input id="call-search" placeholder="Search calls by phone or summary…" oninput="filterCalls(this.value)">
  </div>
</div>
${calls.length ? `<table><thead><tr><th>Caller</th><th>Duration</th><th>Summary</th><th>When</th></tr></thead><tbody id="call-tbody">${rows}</tbody></table>
<script>
function toggleCall(id){
  var row=document.getElementById('call-'+id);var body=document.getElementById('call-'+id+'-body');
  var open=row.classList.toggle('open');body.classList.toggle('open',open);
}
function filterCalls(q){
  q=(q||'').toLowerCase();
  // Match on the summary row's text, then mirror its visibility to the body
  // row beneath it (body rows carry the .call-row-body class).
  document.querySelectorAll('#call-tbody .call-row').forEach(function(r){
    var txt=(r.textContent||'').toLowerCase();
    r.style.display=(!q||txt.indexOf(q)!==-1)?'':'none';
    var body=document.getElementById(r.id+'-body');
    if(body){body.style.display=r.style.display;}
  });
}
</script>` : '<div class="empty-state"><div class="empty-icon">📞</div><div class="empty-title">No calls yet</div><div class="empty-msg">Once Emma starts answering your phone, every call lands here with a transcript.</div></div>'}
</div></div>`;
    return new Response(simpleShell('Call Logs', body), { headers: { 'Content-Type': 'text/html' } });
  } catch (e) {
    console.error('Calls htmx error:', e);
    return new Response(simpleShell('Error', '<h1>⚠️ Error</h1><p style="color:#f85149">Could not load call logs.</p>'), { headers: { 'Content-Type': 'text/html' }, status: 500 });
  }
}

// ═══════════════════════════════════════════════════════════════════════
// HTMX CALENDAR (/p/calendar)
// Month grid (with appointment dots) + a day-detail panel. ?day=YYYY-MM-DD
// selects a day; defaults to today. ?month=YYYY-MM shifts the month.
// ═══════════════════════════════════════════════════════════════════════
async function handleCalendarHtmx(request, env, uid, ctx) {
  try {
    const viewOnly = ctx && ctx.role === 'employee';
    const url = new URL(request.url);
    const today = new Date();
    let viewYear = today.getFullYear();
    let viewMonth = today.getMonth();
    const mp = url.searchParams.get('month');
    if (mp) { const [y, m] = mp.split('-').map(Number); if (y && m) { viewYear = y; viewMonth = m - 1; } }
    const viewMode = (url.searchParams.get('view') || 'month').toLowerCase();
    const VIEW = (viewMode === 'week' || viewMode === 'day') ? viewMode : 'month';
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const selDay = url.searchParams.get('day') || todayStr;
    // Fetch appointments for the view month + a 7-day window around the
    // selected day so week/day views have data even across month boundaries.
    const monthStart = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-01`;
    const monthEnd = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-31`;
    const timeFmt = await getTimeFormat(env, uid);
    const { results: appts } = await env.DB.prepare(
      `SELECT id, title, customer_name, customer_phone, date, time, duration_min, status, notes FROM appointments WHERE user_id = ? AND date >= ? AND date <= ? ORDER BY date ASC, time ASC`
    ).bind(uid, monthStart, monthEnd).all();
    const all = appts || [];
    const byDate = {};
    all.forEach(a => { (byDate[a.date] = byDate[a.date] || []).push(a); });
    const dayAppts = byDate[selDay] || [];
    const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    const DOWS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
    // Helpers shared by all views.
    const pad2 = n => String(n).padStart(2, '0');
    const dsOf = (y, m, d) => `${y}-${pad2(m + 1)}-${pad2(d)}`;
    const fmtLong = ds => { try { return new Date(ds + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }); } catch (e) { return ds; } };
    // Each appointment card links to its detail page (/p/calendar/<id>).
    // `day` is carried through so the detail page's back-link returns to the
    // same day the user was viewing.
    const apptRow = a => `<a class="day-appt" href="/p/calendar/${a.id}?day=${encodeURIComponent(a.date)}"><span class="time mono">${htmxEsc(a.time ? formatHour(a.time, timeFmt, '') : '')}</span><div style="flex:1"><div class="ttl">${htmxEsc(a.title || 'Appointment')}</div>${a.customer_name ? '<div class="cust">' + htmxEsc(a.customer_name) + (a.customer_phone ? ' · ' + htmxEsc(a.customer_phone) : '') + '</div>' : ''}</div>${a.status === 'confirmed' ? '<span class="badge badge-booked">confirmed</span>' : `<span class="status-pill">${htmxEsc(a.status || '')}</span>`}</a>`;
    // View-toggle buttons. Active view gets the amber style; the month param +
    // selected day are carried through so toggling doesn't lose position.
    const viewBtn = (label, v) => {
      const active = v === VIEW;
      const base = VIEW === 'month' ? `/p/calendar?month=${viewYear}-${pad2(viewMonth + 1)}` : `/p/calendar?day=${selDay}`;
      const href = v === 'month' ? `/p/calendar?month=${viewYear}-${pad2(viewMonth + 1)}` : `/p/calendar?view=${v}&day=${selDay}`;
      return `<a class="btn ${active ? 'btn-amber' : 'btn-ghost'} btn-sm" href="${href}">${label}</a>`;
    };
    const viewToggle = `<div class="cal-views">${viewBtn('Month','month')}${viewBtn('Week','week')}${viewBtn('Day','day')}</div>`;

    // ── Build the grid/list for the active view ──
    let gridHtml = '';
    let detailTitle = '';
    let detailHtml = '';

    if (VIEW === 'month') {
      const firstDow = new Date(viewYear, viewMonth, 1).getDay();
      const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
      const cells = [];
      for (let i = 0; i < firstDow; i++) cells.push('<div class="cal-cell empty"></div>');
      for (let d = 1; d <= daysInMonth; d++) {
        const ds = dsOf(viewYear, viewMonth, d);
        const da = byDate[ds] || [];
        const cls = ['cal-cell'];
        if (da.length) cls.push('has-appt');
        if (ds === todayStr) cls.push('today');
        if (ds === selDay) cls.push('selected');
        const dots = da.slice(0, 3).map(a => `<span class="cal-dot ${a.status === 'confirmed' ? '' : 'purple'}"></span>`).join('');
        cells.push(`<a class="${cls.join(' ')}" href="/p/calendar?month=${viewYear}-${pad2(viewMonth + 1)}&day=${ds}"><div class="day-num">${d}</div>${da.length ? '<div class="dots">' + dots + '</div>' : ''}</a>`);
      }
      const prevM = new Date(viewYear, viewMonth - 1, 1);
      const nextM = new Date(viewYear, viewMonth + 1, 1);
      gridHtml = `<div class="cal-toolbar"><div class="cal-nav">
        <a class="btn btn-ghost btn-sm" href="/p/calendar?month=${prevM.getFullYear()}-${pad2(prevM.getMonth() + 1)}">‹ Prev</a>
        <span class="cal-month">${MONTHS[viewMonth]} ${viewYear}</span>
        <a class="btn btn-ghost btn-sm" href="/p/calendar?month=${nextM.getFullYear()}-${pad2(nextM.getMonth() + 1)}">Next ›</a>
      </div><a class="btn btn-amber btn-sm" href="/p/calendar">This month</a></div>
      <div class="card" style="padding:18px;margin-top:14px"><div class="cal-grid">${DOWS.map(d => `<div class="cal-dow">${d}</div>`).join('')}${cells.join('')}</div></div>`;
      detailTitle = fmtLong(selDay);
      detailHtml = dayAppts.length ? '<div class="day-appts">' + dayAppts.map(apptRow).join('') + '</div>' : '<div class="note-box">No appointments scheduled for this day.</div>';
    } else if (VIEW === 'week') {
      // 7-day week starting Sunday containing selDay.
      const sel = new Date(selDay + 'T00:00:00');
      const start = new Date(sel); start.setDate(sel.getDate() - sel.getDay());
      const days = [];
      for (let i = 0; i < 7; i++) {
        const dt = new Date(start); dt.setDate(start.getDate() + i);
        days.push(dt);
      }
      const prevW = new Date(start); prevW.setDate(start.getDate() - 7);
      const nextW = new Date(start); nextW.setDate(start.getDate() + 7);
      const q = d => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
      const weekCells = days.map(dt => {
        const ds = q(dt);
        const da = byDate[ds] || [];
        const cls = ['cal-cell','week-cell'];
        if (da.length) cls.push('has-appt');
        if (ds === todayStr) cls.push('today');
        if (ds === selDay) cls.push('selected');
        const items = da.slice(0, 4).map(a => `<div class="wk-item"><span class="time mono">${htmxEsc(a.time ? formatHour(a.time, timeFmt, '') : '')}</span> ${htmxEsc(a.title || 'Appointment')}</div>`).join('');
        return `<a class="${cls.join(' ')}" href="/p/calendar?view=week&day=${ds}"><div class="day-num">${dt.getDate()} <span class="wk-dow">${DOWS[dt.getDay()]}</span></div><div class="wk-items">${items || '<span class="wk-empty">—</span>'}</div></a>`;
      }).join('');
      gridHtml = `<div class="cal-toolbar"><div class="cal-nav">
        <a class="btn btn-ghost btn-sm" href="/p/calendar?view=week&day=${q(prevW)}">‹ Prev</a>
        <span class="cal-month">Week of ${start.toLocaleDateString('en-US',{month:'long',day:'numeric'})}</span>
        <a class="btn btn-ghost btn-sm" href="/p/calendar?view=week&day=${q(nextW)}">Next ›</a>
      </div><a class="btn btn-amber btn-sm" href="/p/calendar?view=week&day=${todayStr}">This week</a></div>
      <div class="cal-week-grid">${weekCells}</div>`;
      detailTitle = fmtLong(selDay);
      detailHtml = dayAppts.length ? '<div class="day-appts">' + dayAppts.map(apptRow).join('') + '</div>' : '<div class="note-box">No appointments scheduled for this day.</div>';
    } else {
      // DAY view — single-day agenda list with prev/next-day navigation.
      const sel = new Date(selDay + 'T00:00:00');
      const prevD = new Date(sel); prevD.setDate(sel.getDate() - 1);
      const nextD = new Date(sel); nextD.setDate(sel.getDate() + 1);
      const q = d => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
      gridHtml = `<div class="cal-toolbar"><div class="cal-nav">
        <a class="btn btn-ghost btn-sm" href="/p/calendar?view=day&day=${q(prevD)}">‹ Prev day</a>
        <span class="cal-month">${fmtLong(selDay)}</span>
        <a class="btn btn-ghost btn-sm" href="/p/calendar?view=day&day=${q(nextD)}">Next day ›</a>
      </div><a class="btn btn-amber btn-sm" href="/p/calendar?view=day&day=${todayStr}">Today</a></div>
      <div class="card" style="padding:18px;margin-top:14px">${dayAppts.length ? '<div class="day-appts">' + dayAppts.map(apptRow).join('') + '</div>' : '<div class="note-box">No appointments scheduled for this day.</div>'}</div>`;
      detailTitle = '';
      detailHtml = '';
    }

    const heading = VIEW === 'month' ? `${MONTHS[viewMonth]} <em>${viewYear}</em>` : (VIEW === 'week' ? 'Week <em>view</em>' : 'Day <em>view</em>');
    const detailCard = (VIEW === 'day') ? '' : `<div class="card"><h3 style="margin-top:0">${detailTitle}</h3>${detailHtml}</div>`;
    const weekCss = `<style>
.cal-views{display:inline-flex;gap:6px}
.cal-week-grid{display:grid;grid-template-columns:repeat(7,1fr);gap:6px;margin-top:14px}
.cal-cell.week-cell{min-height:120px;flex-direction:column;align-items:stretch;padding:8px;justify-content:flex-start;text-align:left}
.cal-cell.week-cell .day-num{font-weight:600;display:flex;justify-content:space-between;align-items:baseline;margin-bottom:6px}
.cal-cell.week-cell .wk-dow{font-size:.72em;color:var(--text-muted);font-weight:400;text-transform:uppercase;letter-spacing:.04em}
.cal-cell.week-cell .wk-items{display:flex;flex-direction:column;gap:3px;font-size:.78em;width:100%}
.cal-cell.week-cell .wk-item{background:var(--bg-elev);padding:3px 6px;border-radius:5px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.cal-cell.week-cell .wk-empty{color:var(--text-faint)}
@media(max-width:768px){.cal-week-grid{grid-template-columns:1fr;gap:8px}.cal-cell.week-cell{min-height:auto}}
</style>`;
    const body = `${weekCss}<div class="app">${sidebarNav('calendar', undefined, ctx)}<div class="content">
<span class="eyebrow">Calendar</span>
<h1>${heading}</h1>
<p class="sub">Appointments Emma has booked — switch between Month, Week, and Day views.</p>
${viewOnly ? '<div class="vo-banner"><span class="vo-ico">👁</span>View only — contact your admin to make changes.</div>' : ''}
<div style="display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;margin-top:24px">
  ${viewToggle}
</div>
<div style="margin-top:6px">${gridHtml}</div>
${detailCard ? `<div class="detail-grid" style="margin-top:14px">${VIEW==='month'?'':''}<div></div>${detailCard}</div>` : ''}
</div></div>`;
    return new Response(simpleShell('Calendar', body), { headers: { 'Content-Type': 'text/html' } });
  } catch (e) {
    console.error('Calendar htmx error:', e);
    return new Response(simpleShell('Error', '<h1>⚠️ Error</h1><p style="color:#f85149">Could not load the calendar.</p>'), { headers: { 'Content-Type': 'text/html' }, status: 500 });
  }
}

// ═══════════════════════════════════════════════════════════════════════
// HTMX APPOINTMENT DETAIL (/p/calendar/:id)
// The day/week/month appointment cards link here. Read-only view of a single
// appointment — customer, date/time, duration, status, and notes — mirroring
// the /p/leads/:id detail-page pattern. `day` from the query string is used
// for the back-link so the user returns to the day they came from.
// ═══════════════════════════════════════════════════════════════════════
async function handleAppointmentDetailHtmx(request, env, uid, apptId, ctx) {
  try {
    const url = new URL(request.url);
    // Day the user came from (YYYY-MM-DD). Falls back to the appointment's own
    // date so the back-link always lands somewhere sensible.
    const backDay = url.searchParams.get('day') || '';
    const appt = await env.DB.prepare('SELECT * FROM appointments WHERE id = ? AND user_id = ?').bind(apptId, uid).first();
    if (!appt) {
      const body = `<div class="app">${sidebarNav('calendar', undefined, ctx)}<div class="content">
<a class="back-link" href="/p/calendar">‹ Back to calendar</a>
<div class="empty-state"><div class="empty-icon">🔍</div><div class="empty-title">Appointment not found</div><div class="empty-msg">This appointment may have been removed or doesn't belong to your account.</div>
<a class="btn btn-ghost btn-sm" href="/p/calendar" style="margin-top:18px">← Calendar</a></div></div></div>`;
      return new Response(simpleShell('Appointment not found', body), { status: 404, headers: { 'Content-Type': 'text/html' } });
    }
    const viewOnly = ctx && ctx.role === 'employee';
    const timeFmt = await getTimeFormat(env, uid);
    const initials = n => { const p = String(n || '?').trim().split(/\s+/); return ((p[0] || '?')[0] + (p[1] || '')[0]).toUpperCase(); };
    const fmtDate = ds => { try { return new Date(ds + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }); } catch (e) { return ds || '—'; } };
    const dur = appt.duration_min ? appt.duration_min + ' min' : '—';
    const notesCard = appt.notes && String(appt.notes).trim()
      ? `<div class="card"><h3 style="margin-top:0">Notes</h3><p style="color:var(--text-primary);line-height:1.7;white-space:pre-wrap">${htmxEsc(appt.notes)}</p></div>`
      : '<div class="card"><h3 style="margin-top:0">Notes</h3><div class="note-box">No notes for this appointment.</div></div>';
    const backHref = backDay ? `/p/calendar?view=day&day=${encodeURIComponent(backDay)}` : '/p/calendar';
    const phoneLine = appt.customer_phone
      ? `<div class="kv"><span class="k">Phone</span><span class="v"><a class="mono" href="tel:${encodeURIComponent(appt.customer_phone)}" style="color:var(--accent-amber)">${htmxEsc(appt.customer_phone)}</a></span></div>`
      : '<div class="kv"><span class="k">Phone</span><span class="v">—</span></div>';
    const body = `<div class="app">${sidebarNav('calendar', undefined, ctx)}<div class="content">
<a class="back-link" href="${backHref}">‹ Back to calendar</a>
<span class="eyebrow">Appointment #${appt.id}</span>
<div style="display:flex;align-items:center;gap:16px;margin-bottom:6px">
  <div class="avatar" style="width:56px;height:56px;font-size:1.4rem">${htmxEsc(initials(appt.customer_name))}</div>
  <div>
    <h1 style="margin-bottom:6px">${htmxEsc(appt.title || 'Appointment')}</h1>
    <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap">${statusPill(appt.status)}</div>
  </div>
</div>
${viewOnly ? '<div class="vo-banner"><span class="vo-ico">👁</span>View only — contact your admin to make changes.</div>' : ''}
<div class="detail-grid" style="margin-top:24px">
  <div style="display:flex;flex-direction:column;gap:20px">
    <div class="card">
      <h3 style="margin-top:0">Appointment details</h3>
      <div class="kv"><span class="k">Date</span><span class="v">${htmxEsc(fmtDate(appt.date))}</span></div>
      <div class="kv"><span class="k">Time</span><span class="v mono">${htmxEsc(appt.time ? formatHour(appt.time, timeFmt, '') : '—')}</span></div>
      <div class="kv"><span class="k">Duration</span><span class="v">${htmxEsc(dur)}</span></div>
      <div class="kv"><span class="k">Status</span><span class="v">${statusPill(appt.status)}</span></div>
    </div>
    ${notesCard}
  </div>
  <div style="display:flex;flex-direction:column;gap:20px">
    <div class="card">
      <h3 style="margin-top:0">Customer</h3>
      <div class="kv"><span class="k">Name</span><span class="v">${appt.customer_name ? htmxEsc(appt.customer_name) : '—'}</span></div>
      ${phoneLine}
    </div>
    <div class="card">
      <h3 style="margin-top:0">Actions</h3>
      <a class="btn btn-ghost btn-sm" href="${backHref}">‹ Back to calendar</a>
    </div>
  </div>
</div>
</div></div>`;
    return new Response(simpleShell('Appointment', body), { headers: { 'Content-Type': 'text/html' } });
  } catch (e) {
    console.error('Appointment detail htmx error:', e);
    return new Response(simpleShell('Error', '<h1>⚠️ Error</h1><p style="color:#f85149">Could not load this appointment.</p>'), { headers: { 'Content-Type': 'text/html' }, status: 500 });
  }
}

// ═══════════════════════════════════════════════════════════════════════
// HTMX KNOWLEDGE BASE (/p/knowledge)
// Product/service list Emma references on calls. Search + pagination +
// CSV import (posts to /api/knowledge/upload-htmx, cookie auth) + inline
// add form (posts to /api/knowledge/add-htmx, cookie auth).
// ═══════════════════════════════════════════════════════════════════════
async function handleKnowledgeHtmx(request, env, uid, ctx) {
  try {
    const { results } = await env.DB.prepare(
      'SELECT id, category, item, price, notes FROM knowledge WHERE user_id = ? ORDER BY category ASC, item ASC LIMIT 500'
    ).bind(uid).all();
    const items = results || [];
    const viewOnly = ctx && ctx.role === 'employee';
    const PAGE = 20;
    const totalPages = Math.max(1, Math.ceil(items.length / PAGE));
    const cats = [...new Set(items.map(i => i.category || 'Uncategorized').filter(Boolean))];
    const stat = (label, value, tone) => `<div class="card stat-card"><div class="stat-num ${tone}">${value}</div><div class="stat-lab">${label}</div></div>`;
    // Render all items but paginate via JS (keeps the page self-contained and
    // lets search filter instantly without a round-trip). Each item renders
    // TWICE: a mobile card (kc-) and a desktop table row (kt-) plus a hidden
    // inline edit form for each. Only one view is visible per breakpoint; the
    // JS editing model keys off the shared item id and targets both copies.
    const cards = items.map((it, i) => {
      const pageNum = Math.floor(i / PAGE) + 1;
      const search = ((it.item || '') + ' ' + (it.category || '') + ' ' + (it.notes || '')).toLowerCase();
      const price = it.price != null && it.price !== 0 ? '$' + Number(it.price).toFixed(2) : '—';
      const cat = htmxEsc(it.category || 'General');
      const name = htmxEsc(it.item || '—');
      const notes = htmxEsc(it.notes || '—');
      const editCard = viewOnly ? '' : `<div class="k-card-edit kc-edit" id="kc-edit-${it.id}" data-page="${pageNum}" style="display:none">
  <form class="k-edit-form" data-id="${it.id}" data-view="card">
    <input name="category" value="${htmxEsc(it.category || '')}" placeholder="Category">
    <input name="item" value="${htmxEsc(it.item || '')}" placeholder="Item name" required>
    <input name="price" type="number" step="0.01" value="${it.price != null ? it.price : ''}" placeholder="Price">
    <input name="notes" value="${htmxEsc(it.notes || '')}" placeholder="Notes">
    <div style="display:flex;gap:6px">
      <button type="submit" class="btn-amber btn-sm">Save</button>
      <button type="button" class="btn btn-ghost btn-sm" onclick="kCancel(${it.id})">Cancel</button>
    </div>
    <div class="k-edit-msg"></div>
  </form>
</div>`;
      const cardActions = viewOnly ? '' : `<div class="ki-actions">
    <button type="button" class="btn btn-ghost btn-sm" onclick="kEdit(${it.id})">✎ Edit</button>
    <button type="button" class="btn btn-ghost btn-sm" onclick="kDelete(${it.id})">🗑 Delete</button>
  </div>`;
      return `<div class="k-item kc-row" id="kc-${it.id}" data-page="${pageNum}" data-search="${htmxEsc(search)}">
  <span class="ki-cat">${cat}</span>
  <div class="ki-main"><span class="ki-name">${name}</span><span class="ki-price">${price}</span></div>
  <div class="ki-notes">${notes}</div>
  ${cardActions}
</div>${editCard}`;
    }).join('');
    // Desktop table rows (kt-) — mirror of the cards, dense table layout.
    const tableRows = items.map((it, i) => {
      const pageNum = Math.floor(i / PAGE) + 1;
      const search = ((it.item || '') + ' ' + (it.category || '') + ' ' + (it.notes || '')).toLowerCase();
      const price = it.price != null && it.price !== 0 ? '$' + Number(it.price).toFixed(2) : '—';
      const cat = htmxEsc(it.category || 'General');
      const name = htmxEsc(it.item || '—');
      const notes = htmxEsc((it.notes || '—').slice(0, 60)) + ((it.notes || '').length > 60 ? '…' : '');
      const editRow = viewOnly ? '' : `<tr class="kt-edit-row kt-edit" id="kt-edit-${it.id}" data-page="${pageNum}" style="display:none">
  <td colspan="5">
    <form class="k-edit-form" data-id="${it.id}" data-view="table" style="padding:6px 0">
      <input name="category" value="${htmxEsc(it.category || '')}" placeholder="Category">
      <input name="item" value="${htmxEsc(it.item || '')}" placeholder="Item name" required>
      <input name="price" type="number" step="0.01" value="${it.price != null ? it.price : ''}" placeholder="Price">
      <input name="notes" value="${htmxEsc(it.notes || '')}" placeholder="Notes">
      <div style="display:flex;gap:6px">
        <button type="submit" class="btn-amber btn-sm">Save</button>
        <button type="button" class="btn btn-ghost btn-sm" onclick="kCancel(${it.id})">Cancel</button>
      </div>
      <div class="k-edit-msg"></div>
    </form>
  </td>
</tr>`;
      const rowActions = viewOnly ? '<td class="k-actions"></td>' : `<td class="k-actions">
    <button type="button" class="k-icon-btn" title="Edit" onclick="kEdit(${it.id})">✎</button>
    <button type="button" class="k-icon-btn k-del" title="Delete" onclick="kDelete(${it.id})">🗑</button>
  </td>`;
      return `<tr class="kt-row" id="kt-${it.id}" data-page="${pageNum}" data-search="${htmxEsc(search)}">
  <td><span class="badge badge-new">${cat}</span></td>
  <td style="font-weight:500">${name}</td>
  <td class="mono" style="color:var(--accent-amber);font-weight:600">${price}</td>
  <td style="color:var(--text-muted);font-size:.88rem">${notes}</td>
  ${rowActions}
</tr>${editRow}`;
    }).join('');
    const body = `<div class="app">${sidebarNav('knowledge', undefined, ctx)}<div class="content">
<span class="eyebrow">Knowledge base</span>
<h1>What Emma <em>knows</em></h1>
<p class="sub">Products and services Emma references when callers ask about pricing.</p>
${viewOnly ? '<div class="vo-banner"><span class="vo-ico">👁</span>View only — contact your admin to make changes.</div>' : ''}
<div class="grid2" style="margin-top:24px">
  ${stat('Total items', items.length, 'purple')}
  ${stat('Categories', cats.length, '')}
  ${stat('Priced', items.filter(i => i.price != null && i.price !== 0).length, 'green')}
  ${stat('Per page', PAGE, 'blue')}
</div>
<div class="k-toolbar">
  <div class="search">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
    <input id="k-search" placeholder="Search items…" oninput="kSearch(this.value)">
  </div>
  ${viewOnly ? '' : `<label class="btn btn-sm btn-ghost" style="cursor:pointer;background:var(--bg-card);border-color:var(--accent-amber);color:var(--accent-amber);display:inline-flex;align-items:center">📁 Import CSV
    <input type="file" accept=".csv" style="display:none" onchange="kImport(this)">
  </label>
  <button class="btn btn-sm btn-ghost" style="background:var(--bg-card);border-color:var(--accent-amber);color:var(--accent-amber)" onclick="kSheetsToggle()">📊 Google Sheets</button>
  <button class="btn btn-amber btn-sm" onclick="document.getElementById('k-add').style.display=document.getElementById('k-add').style.display==='none'?'':'none'">+ Add item</button>`}
</div>
${viewOnly ? '' : `<div id="k-sheets" class="card" style="display:none;margin-bottom:18px">
  <h3 style="margin-top:0">Import from Google Sheets</h3>
  <p style="color:var(--text-muted);font-size:.85rem;margin-bottom:10px">Paste a sheet URL. The sheet must be shared as <strong>“Anyone with the link”</strong>. Columns: Category, Item, Price, Notes.</p>
  <form id="k-sheets-form" style="display:flex;gap:8px;flex-wrap:wrap">
    <input name="sheet" type="url" placeholder="https://docs.google.com/spreadsheets/d/…" style="flex:1;min-width:240px" required>
    <button type="submit" class="btn-amber btn-sm">Import</button>
  </form>
  <div id="k-sheets-msg" style="margin-top:8px;font-size:.85rem"></div>
</div>
<div id="k-add" class="card" style="display:none;margin-bottom:18px">
  <h3 style="margin-top:0">Add an item</h3>
  <form id="k-add-form" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:10px">
    <input name="category" placeholder="Category">
    <input name="item" placeholder="Item name" required>
    <input name="price" type="number" step="0.01" placeholder="Price">
    <input name="notes" placeholder="Notes">
    <button type="submit" class="btn-amber btn-sm">Add</button>
  </form>
  <div id="k-add-msg" style="margin-top:8px;font-size:.85rem"></div>
</div>
<script>
// ── These handlers work with or without existing items (their forms live
//    above the table), so they render unconditionally. The pagination /
//    edit / delete script below only loads when there are rows. ──
function kSheetsToggle(){var b=document.getElementById('k-sheets');b.style.display=b.style.display==='none'?'':'none';}
document.getElementById('k-sheets-form').addEventListener('submit',async function(e){
  e.preventDefault();var msg=document.getElementById('k-sheets-msg');var url=this.sheet.value.trim();
  var fd=new FormData();fd.append('sheet',url);
  msg.style.color='var(--text-muted)';msg.textContent='Fetching sheet…';
  try{var r=await fetch('/api/knowledge/upload-htmx',{method:'POST',body:fd});var d=await r.json();
    if(d.ok){msg.style.color='var(--success)';msg.textContent='✓ Imported '+(d.count||0)+' items — reloading…';setTimeout(function(){location.reload();},800);}
    else{msg.style.color='var(--danger)';msg.textContent='✗ '+(d.error||'Import failed');}
  }catch(err){msg.style.color='var(--danger)';msg.textContent='✗ Connection error';}
});
document.getElementById('k-add-form').addEventListener('submit',async function(e){
  e.preventDefault();var fd=new FormData(this);var msg=document.getElementById('k-add-msg');
  var body={category:fd.get('category'),item:fd.get('item'),price:parseFloat(fd.get('price'))||0,notes:fd.get('notes')};
  msg.style.color='var(--text-muted)';msg.textContent='Adding…';
  try{var r=await fetch('/api/knowledge/add-htmx',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});var d=await r.json();
    if(d.ok){msg.style.color='var(--success)';msg.textContent='✓ Added — reload to see it.';this.reset();setTimeout(function(){location.reload();},800);}
    else{msg.style.color='var(--danger)';msg.textContent='✗ '+(d.error||'Could not add');}
  }catch(err){msg.style.color='var(--danger)';msg.textContent='✗ Connection error';}
});
async function kImport(input){var f=input.files[0];if(!f)return;var fd=new FormData();fd.append('file',f);
  var orig=input.parentNode.textContent;input.parentNode.textContent='⏳ Importing…';
  try{var r=await fetch('/api/knowledge/upload-htmx',{method:'POST',body:fd});var d=await r.json();
    if(d.ok){alert('✓ Imported '+(d.count||'items')+'. Reloading…');location.reload();}
    else{alert('✗ '+(d.error||'Import failed'));input.parentNode.innerHTML=orig;}
  }catch(e){alert('✗ Connection error');input.parentNode.innerHTML=orig;}}
</script>`}
${items.length ? `<div class="k-grid" id="k-grid">${cards}</div>
<div class="k-table-wrap"><table><thead><tr><th>Category</th><th>Item</th><th>Price</th><th>Notes</th><th style="width:90px"></th></tr></thead><tbody id="k-tbody">${tableRows}</tbody></table></div>
<div class="pager" id="k-pager"></div>
<script>
var KPAGE=1,KPER=${PAGE};
// Which view is on screen? Read the card grid's computed display — it is
// 'grid' (visible) on mobile and 'none' on desktop (where the table shows).
// getComputedStyle is reliable here; offsetParent was returning null and made
// every card click silently target the hidden table view instead.
function kActiveView(){
  var g=document.getElementById('k-grid');
  if(!g){return 'card';}
  return window.getComputedStyle(g).display==='none'?'table':'card';
}
function kRowSel(id){return kActiveView()==='card'?'.kc-row':'.kt-row';}
function kEditSel(id){return kActiveView()==='card'?'.kc-edit':'.kt-edit';}
function kRenderPager(total){
  var p=document.getElementById('k-pager');p.innerHTML='';
  if(total<=1){p.style.display='none';return;}p.style.display='flex';
  for(var i=1;i<=total;i++){var b=document.createElement('button');b.textContent=i;b.className=i===KPAGE?'current':'';b.onclick=function(){KPAGE=+this.textContent;kShow();};p.appendChild(b);}
}
function kShow(){
  var vis=0;
  document.querySelectorAll(kRowSel()).forEach(function(r){
    // Skip rows the search has hidden (data-hidden set by kSearch).
    if(r.getAttribute('data-hidden')==='1'){return;}
    vis++;var show=Math.ceil(vis/KPER)===KPAGE;
    r.style.display=show?'':'none';
    // Reveal this row's inline edit form (same view) if it's being edited.
    var editEl=document.getElementById(r.id.slice(0,2)+'-edit-'+r.id.slice(3));
    if(editEl){editEl.style.display=(show&&editEl.getAttribute('data-editing')==='1')?'':'none';}
  });
}
function kSearch(q){
  q=(q||'').toLowerCase();var vis=0;
  // Mark BOTH views (cards + table) hidden/visible so switching the
  // breakpoint mid-session keeps state, but count matches only once.
  document.querySelectorAll('.kc-row,.kt-row').forEach(function(r){
    var s=r.getAttribute('data-search');var show=!q||s.indexOf(q)!==-1;
    r.setAttribute('data-hidden',show?'0':'1');
  });
  vis=document.querySelectorAll('.kc-row:not([data-hidden="1"])').length;
  KPAGE=1;var total=Math.ceil(vis/${PAGE})||1;kRenderPager(total);kShow();
}
// ── Inline edit ── swap the visible view's display node for its edit form.
//    The active view is read from the live layout; if its edit node is
//    missing we fall back to the other view so a click never silently no-ops.
function kPrefixFor(id){
  var card=kActiveView()==='card';
  if(document.getElementById((card?'kc':'kt')+'-edit-'+id)){return card?'kc':'kt';}
  if(document.getElementById((card?'kt':'kc')+'-edit-'+id)){return card?'kt':'kc';}
  return null;
}
function kEdit(id){
  var prefix=kPrefixFor(id);if(!prefix){return;}
  var row=document.getElementById(prefix+'-'+id),er=document.getElementById(prefix+'-edit-'+id);
  if(!er||!row){return;}
  row.style.display='none';er.setAttribute('data-editing','1');
  // Only reveal if the display node isn't search-hidden.
  er.style.display=(row.getAttribute('data-hidden')==='1')?'none':'';
}
function kCancel(id){
  var prefix=kPrefixFor(id);
  var row=prefix&&document.getElementById(prefix+'-'+id),er=prefix&&document.getElementById(prefix+'-edit-'+id);
  if(er){er.setAttribute('data-editing','0');er.style.display='none';}
  if(row&&row.getAttribute('data-hidden')!=='1'){kShow();}
}
document.querySelectorAll('.k-edit-form').forEach(function(f){
  f.addEventListener('submit',async function(e){
    e.preventDefault();var id=this.getAttribute('data-id');var msg=this.querySelector('.k-edit-msg');
    var fd=new FormData(this);
    var body={id:parseInt(id,10),category:fd.get('category'),item:fd.get('item'),price:parseFloat(fd.get('price'))||0,notes:fd.get('notes')};
    msg.style.color='var(--text-muted)';msg.textContent='Saving…';
    try{var r=await fetch('/api/knowledge/update-htmx',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});var d=await r.json();
      if(d.ok){msg.style.color='var(--success)';msg.textContent='✓ Saved — reloading…';setTimeout(function(){location.reload();},600);}
      else{msg.style.color='var(--danger)';msg.textContent='✗ '+(d.error||'Could not save');}
    }catch(err){msg.style.color='var(--danger)';msg.textContent='✗ Connection error';}
  });
});
// ── Delete ── confirm, then POST and remove the card AND table copies.
async function kDelete(id){
  if(!confirm("Delete this knowledge item? This can't be undone.")){return;}
  try{var r=await fetch('/api/knowledge/delete-htmx',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:id})});var d=await r.json();
    if(d.ok){
      ['kc-'+id,'kc-edit-'+id,'kt-'+id,'kt-edit-'+id].forEach(function(eid){var el=document.getElementById(eid);if(el){el.remove();}});
      KPAGE=1;kSearch(document.getElementById('k-search').value||'');
    }else{alert('✗ '+(d.error||'Could not delete'));}
  }catch(e){alert('✗ Connection error');}
}
kRenderPager(${totalPages});
</script>` : '<div class="empty-state"><div class="empty-icon">📚</div><div class="empty-title">No knowledge items yet</div><div class="empty-msg">Add products and services so Emma can quote real prices on calls. Import a CSV or Google Sheet with Category, Item, Price, Notes columns.</div><div style="margin-top:18px;display:flex;gap:10px;justify-content:center;flex-wrap:wrap"><label class="btn btn-amber btn-sm" style="cursor:pointer">📁 Import CSV<input type="file" accept=".csv" style="display:none" onchange="kImport(this)"></label><button class="btn btn-sm" onclick="kSheetsToggle()">📊 Google Sheets</button><button class="btn btn-sm" onclick="document.getElementById(\'k-add\').style.display=\'\'">+ Add item</button></div>'}
</div></div>`;
    return new Response(simpleShell('Knowledge Base', body), { headers: { 'Content-Type': 'text/html' } });
  } catch (e) {
    console.error('Knowledge htmx error:', e);
    return new Response(simpleShell('Error', '<h1>⚠️ Error</h1><p style="color:#f85149">Could not load the knowledge base.</p>'), { headers: { 'Content-Type': 'text/html' }, status: 500 });
  }
}

// ═══════════════════════════════════════════════════════════════════════
// HTMX BILLING (/p/billing)
// Pricing card ($29.95/mo base) + add-on toggles. Toggles read the current
// state from the settings row and POST to /api/settings/addon-htmx (cookie
// auth) to flip a single addon_* column. Trial status comes from subscriptions.
// ═══════════════════════════════════════════════════════════════════════
async function handleBillingHtmx(request, env, uid, ctx) {
  try {
    const [settings, sub] = await Promise.all([
      env.DB.prepare('SELECT addon_website, addon_reviews, addon_social, addon_blog, addon_email, stripe_plan FROM settings WHERE user_id = ?').bind(uid).first(),
      env.DB.prepare('SELECT plan, status, trial_start, trial_end FROM subscriptions WHERE user_id = ?').bind(uid).first(),
    ]);
    const addons = getAddons(env);
    const addonCards = Object.entries(addons).map(([key, def]) => {
      const on = !!(settings && settings[def.column]);
      const priceId = def.priceId || '';
      return `<div class="addon-card ${on ? 'on' : ''}" data-key="${key}" data-column="${def.column}" data-priceid="${priceId}">
  <div style="display:flex;align-items:center;gap:14px"><span class="ai">${def.icon}</span><div><div class="at">${def.label}</div><div class="ad">Added to Emma's plan</div></div></div>
  <div style="display:flex;align-items:center;gap:16px">
    <span class="ap">$${def.price.toFixed(2)}/mo</span>
    <label class="switch"><input type="checkbox" ${on ? 'checked' : ''} onchange="toggleAddon('${key}','${def.column}',this.checked,this)"><span class="track"></span></label>
  </div>
</div>`;
    }).join('');
    const plan = (settings && settings.stripe_plan) || 'base';
    const status = (sub && sub.status) || 'trial';
    const trialEnd = (sub && sub.trial_end) || '';
    const daysLeft = trialEnd ? Math.max(0, Math.ceil((new Date(trialEnd + 'T23:59:59') - new Date()) / 86400000)) : 0;
    const trialNote = status === 'trial' && trialEnd
      ? `<div class="note-box" style="margin-bottom:18px;border-color:rgba(212,165,116,.4);color:var(--accent-amber)">🎁 You're on a 30-day free trial${daysLeft > 0 ? ` — <strong>${daysLeft} day${daysLeft === 1 ? '' : 's'} left</strong>` : ''}. No card required yet.</div>`
      : '';
    const body = `<div class="app">${sidebarNav('billing', undefined, ctx)}<div class="content" style="max-width:760px">
<span class="eyebrow">Billing & plan</span>
<h1>Your <em>plan</em></h1>
<p class="sub">One simple price. Add what you need, when you need it.</p>
${trialNote}
<div style="display:grid;grid-template-columns:1fr;gap:20px;margin-top:24px">
  <div class="card glow" style="text-align:center;padding:36px 28px">
    <span class="eyebrow" style="display:block;margin-bottom:14px">Base plan</span>
    <div style="display:flex;align-items:flex-start;justify-content:center;gap:4px">
      <span style="font-family:var(--font-serif);font-size:1.5rem;color:var(--text-muted);margin-top:14px">$</span>
      <span style="font-family:var(--font-serif);font-size:4.5rem;font-weight:500;line-height:1;letter-spacing:-.02em;background:linear-gradient(135deg,var(--accent-amber),#e8c9a0);-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent">29</span>
      <span style="font-family:var(--font-serif);font-size:1.875rem;color:var(--text-muted);margin-top:24px">.95</span>
    </div>
    <div style="color:var(--text-muted);font-size:.9rem;margin-top:8px">per month · 24/7 AI answering · lead capture · call transcripts</div>
    <div style="margin-top:18px"><span class="badge ${status === 'active' || plan === 'paid' ? 'badge-booked' : 'badge-new'}">${status}</span></div>
  </div>
</div>
<h3>Add-ons</h3>
${addonCards}
<p style="margin-top:24px;color:var(--text-faint);font-size:.82rem">Add-ons are billed alongside your monthly plan. Toggling on a paid add-on starts it immediately. Questions? <a href="mailto:hello@branchlive.com" style="color:var(--accent-amber)">hello@branchlive.com</a></p>
<script>
async function toggleAddon(key,column,on,el){
  var card=el.closest('.addon-card');var priceId=card.getAttribute('data-priceid');
  el.disabled=true;
  try{
    var body={};body[column]=on?1:0;
    var r=await fetch('/api/settings/addon-htmx',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
    var d=await r.json();
    if(d.ok){card.classList.toggle('on',on);}
    else{alert('✗ '+(d.error||'Could not update add-on'));el.checked=!on;}
  }catch(e){alert('✗ Connection error');el.checked=!on;}
  el.disabled=false;
}
</script>
</div></div>`;
    return new Response(simpleShell('Billing', body), { headers: { 'Content-Type': 'text/html' } });
  } catch (e) {
    console.error('Billing htmx error:', e);
    return new Response(simpleShell('Error', '<h1>⚠️ Error</h1><p style="color:#f85149">Could not load billing.</p>'), { headers: { 'Content-Type': 'text/html' }, status: 500 });
  }
}

// Photo gallery — standalone page served at /p/gallery. Server-rendered grid
// with Before/During/After tabs and a click-to-expand lightbox.
async function handleGalleryHtmx(request, env, uid, ctx) {
  try {
    const { results } = await env.DB.prepare(
      'SELECT id, caption, type, created_at, data FROM photos WHERE user_id = ? ORDER BY created_at DESC'
    ).bind(uid).all();
    const viewOnly = ctx && ctx.role === 'employee';
    const photos = results || [];
    const counts = {
      before: photos.filter(p => p.type === 'before').length,
      during: photos.filter(p => p.type === 'during').length,
      after: photos.filter(p => p.type === 'after').length,
    };
    const esc = s => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    const cards = photos.map(p => `<div class="g-item" data-type="${p.type || 'during'}" onclick="glightbox(this)"><img src="${p.data}" alt="${esc(p.caption || '')}" loading="lazy" style="width:100%;height:100%;object-fit:cover;display:block"><span class="g-tag g-tag-${p.type || 'during'}">${p.type || 'during'}</span>${p.caption ? `<span class="g-cap">${esc(p.caption)}</span>` : ''}</div>`).join('');
    const style = `<style>.g-tabs{display:flex;gap:8px;margin:18px 0 24px;flex-wrap:wrap}.g-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(170px,1fr));gap:14px}.g-item{position:relative;aspect-ratio:1;overflow:hidden;border-radius:14px;border:1px solid var(--border);background:var(--bg-card);cursor:zoom-in;transition:transform .3s cubic-bezier(.2,.7,.2,1),box-shadow .3s ease}.g-item:hover{transform:translateY(-3px);box-shadow:0 12px 32px -10px rgba(0,0,0,.6)}.g-item:hover img{opacity:.9}.g-item img{transition:opacity .3s ease}.g-tag{position:absolute;top:8px;left:8px;padding:3px 9px;border-radius:9999px;font-size:.66rem;font-weight:600;text-transform:uppercase;font-family:var(--font-mono);letter-spacing:.04em;backdrop-filter:blur(4px)}.g-tag-before{background:rgba(212,165,116,.9);color:#1a1205}.g-tag-during{background:rgba(96,165,250,.9);color:#06121f}.g-tag-after{background:rgba(52,211,153,.9);color:#051a0c}.g-cap{position:absolute;left:0;right:0;bottom:0;padding:10px 12px;font-size:.78rem;color:var(--text-primary);background:linear-gradient(transparent,rgba(0,0,0,.85));line-height:1.3}.g-lightbox{position:fixed;inset:0;background:rgba(0,0,0,.94);display:flex;align-items:center;justify-content:center;z-index:100;padding:24px;cursor:zoom-out;backdrop-filter:blur(6px)}.g-lightbox img{max-width:90vw;max-height:85vh;border-radius:12px;box-shadow:0 24px 80px -20px rgba(0,0,0,.8)}</style>`;
    const body = `<div class="app">${sidebarNav('gallery', undefined, ctx)}<div class="content">
<span class="eyebrow">Gallery</span>
<h1>📸 Photo Gallery</h1>
<p class="sub">Before, during &amp; after job shots — ready for your website and socials.</p>
${viewOnly ? '<div class="vo-banner"><span class="vo-ico">👁</span>View only — contact your admin to make changes.</div>' : ''}
${style}<div class="g-tabs"><button class="btn btn-amber btn-sm" onclick="gfilter('all',this)">All (${photos.length})</button><button class="btn btn-ghost btn-sm" onclick="gfilter('before',this)">Before (${counts.before})</button><button class="btn btn-ghost btn-sm" onclick="gfilter('during',this)">During (${counts.during})</button><button class="btn btn-ghost btn-sm" onclick="gfilter('after',this)">After (${counts.after})</button></div><div class="g-grid" id="g-grid">${cards}</div>${photos.length === 0 ? '<div class="empty-state"><div class="empty-icon">📸</div><div class="empty-title">No photos yet</div><div class="empty-msg">Snap before, during, and after shots from the dashboard. They\'ll land here automatically for your portfolio.</div></div>' : ''}<script>function gfilter(type,btn){document.querySelectorAll('.g-tabs button').forEach(function(t){t.classList.add('btn-ghost');t.classList.remove('btn-amber');t.style.background=''});btn.classList.remove('btn-ghost');btn.style.background='';document.querySelectorAll('#g-grid .g-item').forEach(function(it){it.style.display=(type==='all'||it.dataset.type===type)?'':'none'})}function glightbox(el){var img=el.querySelector('img');var lb=document.createElement('div');lb.className='g-lightbox';lb.innerHTML='<img src="'+img.src+'" alt="'+(img.alt||'')+'">';lb.onclick=function(){lb.remove()};document.body.appendChild(lb)}</script>
</div></div>`;
    return new Response(simpleShell('Photo Gallery', body), { headers: { 'Content-Type': 'text/html' } });
  } catch (e) {
    return new Response(simpleShell('Error', '<h1>⚠️ Error</h1><p style="color:#f85149">Something went wrong: ' + String(e.message || e).slice(0, 200) + '</p>'), { headers: { 'Content-Type': 'text/html' }, status: 500 });
  }
}

// ── HTMX dashboard overview (/p/overview) ──
// Server-rendered landing page for the HTMX dashboard family. Mirrors the
// Bearer-authed /api/me + /api/leads numbers but is reached via the
// bl_session cookie, so it loads in a normal browser tab without a JS login.
async function handleOverviewHtmx(request, env, uid, ctx) {
  try {
    // One batched round-trip for every summary number on the page. Each query
    // is guarded by user_id, so demo/other accounts never bleed together.
    // The settings SELECT also pulls onboarding_complete + working_hours so the
    // first-login wizard trigger can be evaluated here without a second trip.
    const [leadCounts, apptCounts, callStats, user, settings, kbCount] = await Promise.all([
      env.DB.prepare(
        `SELECT
           COUNT(*) AS total,
           SUM(CASE WHEN status = 'new' THEN 1 ELSE 0 END) AS new_leads,
           SUM(CASE WHEN status = 'booked' THEN 1 ELSE 0 END) AS booked
         FROM leads WHERE user_id = ?`
      ).bind(uid).first(),
      env.DB.prepare(
        `SELECT
           COUNT(*) AS total,
           SUM(CASE WHEN date >= date('now') THEN 1 ELSE 0 END) AS upcoming
         FROM appointments WHERE user_id = ? AND status = 'confirmed'`
      ).bind(uid).first(),
      env.DB.prepare(
        `SELECT COUNT(*) AS calls, COALESCE(SUM(duration_sec), 0) AS duration
         FROM call_logs WHERE user_id = ?`
      ).bind(uid).first(),
      env.DB.prepare('SELECT name, email FROM users WHERE id = ?').bind(uid).first(),
      env.DB.prepare('SELECT business_name, onboarding_complete, working_hours FROM settings WHERE user_id = ?').bind(uid).first(),
      env.DB.prepare('SELECT COUNT(*) AS n FROM knowledge WHERE user_id = ?').bind(uid).first(),
    ]);

    // First-login wizard trigger: show the setup wizard when onboarding hasn't
    // been completed AND the account looks empty (no knowledge items OR no
    // working hours). Managers+ only — a team member on a fresh shared account
    // isn't bounced. Once the wizard flips onboarding_complete to 1, overview
    // loads normally. Reachable anytime via /p/onboarding (manual re-entry).
    const obDone = !!(settings && settings.onboarding_complete);
    const hasHours = !!(settings && settings.working_hours && settings.working_hours.trim());
    const kbTotal = (kbCount && kbCount.n) || 0;
    if (!obDone && (kbTotal === 0 || !hasHours) && ctx && roleMeets(ctx.role, 'manager')) {
      return new Response(null, { status: 302, headers: { Location: '/p/onboarding' } });
    }

    const greeting = (settings && settings.business_name)
      ? settings.business_name
      : (user && (user.name || user.email)) || 'your dashboard';
    const leadsTotal = (leadCounts && leadCounts.total) || 0;
    const newLeads = (leadCounts && leadCounts.new_leads) || 0;
    const booked = (leadCounts && leadCounts.booked) || 0;
    const apptTotal = (apptCounts && apptCounts.total) || 0;
    const upcoming = (apptCounts && apptCounts.upcoming) || 0;
    const calls = (callStats && callStats.calls) || 0;

    const statCard = (label, value, tone) =>
      `<div class="card stat-card"><div class="stat-num ${tone}">${value}</div><div class="stat-lab">${label}</div></div>`;

    const body = `<div class="app">${sidebarNav('overview', undefined, ctx)}<div class="content">
<span class="eyebrow">Overview</span>
<h1>Welcome back</h1>
<p class="sub">Here's what's happening across <strong style="color:var(--text-primary)">${htmxEsc(greeting)}</strong> today.</p>
<h3>Stats</h3>
<div class="grid2">
  ${statCard('Total leads', leadsTotal, 'purple')}
  ${statCard('New leads', newLeads, '')}
  ${statCard('Booked', booked, 'green')}
  ${statCard('Upcoming appts', upcoming, 'blue')}
</div>
${newLeads > 0 ? `<p style="margin-top:18px;display:flex;align-items:center;gap:10px"><span class="badge badge-new">${newLeads} new</span> <span style="color:var(--text-muted);font-size:.9em">lead${newLeads === 1 ? '' : 's'} waiting for a follow-up.</span></p>` : ''}
<h3>Activity</h3>
<table class="no-header">
  <tr><td>Calls answered</td><td>${calls}</td></tr>
  <tr><td>Confirmed appointments</td><td>${apptTotal}</td></tr>
  <tr><td>Upcoming (today+)</td><td>${upcoming}</td></tr>
</table>
<p style="margin-top:28px">
  <a class="btn btn-ghost btn-sm" href="/p/gallery">📸 Gallery</a>
  ${ctx && roleMeets(ctx.role, 'manager') ? '<a class="btn btn-ghost btn-sm" href="/p/onboarding">✨ Run setup wizard</a>' : ''}
</p>
</div></div>`;

    return new Response(simpleShell('Overview', body), { headers: { 'Content-Type': 'text/html' } });
  } catch (e) {
    console.error('Overview htmx error:', e);
    return new Response(simpleShell('Error', '<h1>⚠️ Error</h1><p style="color:#f85149">Could not load your dashboard overview.</p>'), { headers: { 'Content-Type': 'text/html' }, status: 500 });
  }
}

// ═══════════════════════════════════════════════════════════════════════
// ONBOARDING WIZARD (/p/onboarding)
// A 5-step setup wizard rendered inside simpleShell (no sidebar — a centered
// card). Shown automatically to first-time accounts from handleOverviewHtmx
// (onboarding_complete != 1 AND empty knowledge/hours), and reachable anytime
// for re-entry. Each step POSTs to /api/onboarding/save (cookie auth,
// manager+); step 5 flips settings.onboarding_complete to 1.
// Steps: 1 Business info · 2 Services · 3 Calendar · 4 Emma greeting · 5 Done.
// ═══════════════════════════════════════════════════════════════════════

// Industry dropdown options for Step 1. Keys are the exact labels shown in the
// <select>; the same labels key INDUSTRY_SERVICE_SUGGESTIONS so Step 2 can
// pre-suggest categories. ("business" — never the banned word.)
const ONBOARDING_INDUSTRIES = [
  'Salon/Beauty', 'Real Estate', 'Cleaning', 'Hardscape', 'Photography', 'Other',
];

// Suggested service categories per industry — populate the Step 2 category
// dropdown defaults. Each entry is [category, name, price] so the rows prefill.
const INDUSTRY_SERVICE_SUGGESTIONS = {
  'Salon/Beauty': [
    ['Hair', "Women\u2019s Haircut & Style", 65],
    ['Hair', 'Full Balayage', 225],
    ['Nails', 'Gel Manicure', 45],
    ['Beauty', 'Facial Treatment', 90],
  ],
  'Real Estate': [
    ['Services', 'Listing Consultation', 0],
    ['Services', 'CMA / Home Valuation', 0],
    ['Services', 'Buyer Tour', 0],
    ['Marketing', 'Professional Photography', 200],
  ],
  'Cleaning': [
    ['Residential', 'Standard Clean', 130],
    ['Residential', 'Deep Clean', 250],
    ['Commercial', 'Office Cleaning', 180],
    ['Add-ons', 'Move-In / Move-Out', 300],
  ],
  'Hardscape': [
    ['Pavers', 'Paver Patio (per sq ft)', 18],
    ['Walls', 'Retaining Wall (per sq ft)', 55],
    ['Services', 'On-Site Estimate', 0],
    ['Repair', 'Paver Repair (per hour)', 95],
  ],
  'Photography': [
    ['Sessions', 'Portrait Session', 250],
    ['Sessions', 'Event Coverage (per hour)', 350],
    ['Real Estate', 'Listing Photos', 200],
    ['Editing', 'Additional Edited Images', 25],
  ],
  'Other': [
    ['Services', 'Consultation', 0],
    ['Services', 'Service Call', 100],
  ],
};

// Convert a step-3 working-hours object {mon:{open,start,end}, ...} into the
// free-text format the settings form + booking-slot parser expect, e.g.
// "Mon-Fri 8am-6pm, Sat 9am-2pm". Groups consecutive identical ranges; days
// that are closed are simply omitted. Empty input → the Mon-Fri 8-6 default.
function formatWorkingHours(wh) {
  const days = [
    ['mon', 'Mon'], ['tue', 'Tue'], ['wed', 'Wed'], ['thu', 'Thu'],
    ['fri', 'Fri'], ['sat', 'Sat'], ['sun', 'Sun'],
  ];
  const to12 = (hhmm) => {
    if (!hhmm) return '';
    const [h, m] = String(hhmm).split(':').map(n => parseInt(n, 10) || 0);
    const period = h >= 12 ? 'pm' : 'am';
    const h12 = h % 12 === 0 ? 12 : h % 12;
    return m > 0 ? `${h12}:${String(m).padStart(2, '0')}${period}` : `${h12}${period}`;
  };
  // Normalize each open day to a signature string for run-grouping.
  const rows = days.map(([key, label]) => {
    const d = wh && wh[key];
    if (!d || !d.open) return { label, open: false, sig: '' };
    const start = to12(d.start || '08:00');
    const end = to12(d.end || '18:00');
    return { label, open: true, start, end, sig: `${start}-${end}` };
  });
  const parts = [];
  let run = null; // { from, to, sig }
  for (const r of rows) {
    if (!r.open) {
      if (run) { parts.push(formatRun(run, days)); run = null; }
      continue;
    }
    if (run && run.sig === r.sig) {
      run.to = r.label;
    } else {
      if (run) parts.push(formatRun(run, days));
      run = { from: r.label, to: r.label, sig: r.sig, start: r.start, end: r.end };
    }
  }
  if (run) parts.push(formatRun(run, days));
  return parts.length ? parts.join(', ') : 'Mon-Fri 8am-6pm';
  function formatRun(run, days) {
    const range = run.from === run.to ? run.from : collapseRange(run.from, run.to, days);
    return `${range} ${run.start}-${run.end}`;
  }
}

// Turn a "Mon" … "Fri" pair into "Mon-Fri" using short labels. (Consecutive
// labels collapse to the dash form; identical stays bare.)
function collapseRange(from, to, days) {
  return `${from}-${to}`;
}

// Smart default Emma greeting, templated from the business name + industry.
// Mirrors the registration seed ("Hi, thanks for calling {name}!") but adds a
// helpful second clause. Used only when the user hasn't written their own.
function defaultWelcomeMessage(businessName, industry) {
  const name = (businessName || '').trim() || 'us';
  const tag = industry && industry !== 'Other'
    ? `a ${industry.toLowerCase()} business`
    : 'here to help';
  return `Hi, thanks for calling ${name}! I\u2019m Emma, ${tag}. How can I help you today?`;
}

// GET /api/onboarding/suggestions?industry=... — returns the suggested service
// rows (category/name/price) for the given industry label. Pure lookup, no DB.
// Used by the wizard to refresh step-2 pre-filled rows when the industry on
// step 1 changes. Cookie-authed (no body, manager+ — reuses the save dispatch).
async function handleOnboardingSuggestions(request, env, uid) {
  try {
    const url = new URL(request.url);
    const industry = (url.searchParams.get('industry') || '').trim();
    const list = INDUSTRY_SERVICE_SUGGESTIONS[industry] || INDUSTRY_SERVICE_SUGGESTIONS['Other'] || [];
    return json({ ok: true, suggestions: list });
  } catch (e) {
    return json({ ok: true, suggestions: [] });
  }
}

// POST /api/onboarding/save — cookie-authed, manager+, scoped to ctx.bid.
// Body: { step: 1..5, data: {...} }. Persists per step into settings (and the
// knowledge table for step 2); step 5 flips onboarding_complete = 1 and ensures
// a sites row exists so the /s/{slug} link resolves. Returns { ok, step, slug? }.
async function handleOnboardingSave(request, env, uid) {
  try {
    const body = await request.json().catch(() => ({}));
    const step = parseInt(body.step, 10);
    const data = body.data || {};
    if (!(step >= 1 && step <= 5)) return apiError('Invalid step number');

    const s = (v) => (typeof v === 'string' ? v.trim() : (v == null ? '' : String(v)));

    // ── Step 1: business info ──
    if (step === 1) {
      const businessName = s(data.business_name);
      const industry = ONBOARDING_INDUSTRIES.includes(data.industry) ? data.industry : '';
      const phone = s(data.phone);
      const serviceArea = s(data.service_area);
      await env.DB.prepare(
        `INSERT INTO settings (user_id, business_name, industry, forwarding_number, service_area)
         VALUES (?, ?, ?, ?, ?)
         ON CONFLICT(user_id) DO UPDATE SET
           business_name = excluded.business_name,
           industry = excluded.industry,
           forwarding_number = excluded.forwarding_number,
           service_area = excluded.service_area`
      ).bind(uid, businessName, industry, phone, serviceArea).run();
      // Keep users.company/phone in sync (matches the registration seed shape).
      if (businessName || phone) {
        await env.DB.prepare(
          `UPDATE users SET company = COALESCE(NULLIF(?, ''), company), phone = COALESCE(NULLIF(?, ''), phone) WHERE id = ?`
        ).bind(businessName, phone, uid).run();
      }
      return json({ ok: true, step });
    }

    // ── Step 2: services / knowledge rows ──
    if (step === 2) {
      const rows = Array.isArray(data.services) ? data.services : [];
      const batch = [];
      for (const r of rows) {
        const item = s(r && r.name);
        if (!item) continue; // skip empty rows
        const category = s(r && r.category);
        const price = parseFloat(r && r.price);
        batch.push(env.DB.prepare(
          'INSERT INTO knowledge (user_id, category, item, price, notes) VALUES (?, ?, ?, ?, ?)'
        ).bind(uid, category, item, Number.isFinite(price) ? price : 0, ''));
      }
      if (batch.length) await env.DB.batch(batch);
      return json({ ok: true, step, added: batch.length });
    }

    // ── Step 3: calendar (working hours + buffer) ──
    if (step === 3) {
      const whText = formatWorkingHours(data.working_hours);
      const buffer = [15, 30, 60].includes(parseInt(data.buffer_min, 10)) ? parseInt(data.buffer_min, 10) : 15;
      const tz = s(data.timezone);
      await env.DB.prepare(
        `INSERT INTO settings (user_id, working_hours, buffer_min, timezone)
         VALUES (?, ?, ?, ?)
         ON CONFLICT(user_id) DO UPDATE SET
           working_hours = excluded.working_hours,
           buffer_min = excluded.buffer_min,
           timezone = excluded.timezone`
      ).bind(uid, whText, buffer, tz || 'America/New_York').run();
      return json({ ok: true, step, working_hours: whText });
    }

    // ── Step 4: Emma greeting ──
    if (step === 4) {
      const welcome = s(data.welcome_message) || '';
      await env.DB.prepare(
        `INSERT INTO settings (user_id, welcome_message)
         VALUES (?, ?)
         ON CONFLICT(user_id) DO UPDATE SET welcome_message = excluded.welcome_message`
      ).bind(uid, welcome).run();
      return json({ ok: true, step });
    }

    // ── Step 5: finalize — mark complete + ensure a public site exists ──
    if (step === 5) {
      // Read current settings so the summary is accurate.
      const row = await env.DB.prepare(
        'SELECT business_name, industry, working_hours, welcome_message, service_area FROM settings WHERE user_id = ?'
      ).bind(uid).first();
      const businessName = (row && row.business_name) || '';

      // Ensure a sites row exists for the public /s/{slug} link.
      let slug = null;
      const site = await env.DB.prepare('SELECT slug FROM sites WHERE user_id = ?').bind(uid).first();
      if (site && site.slug) {
        slug = site.slug;
      } else if (businessName) {
        slug = await siteUniqueSlug(env, businessName);
        await env.DB.prepare(
          'INSERT INTO sites (user_id, slug, published, theme) VALUES (?, ?, 0, ?)'
        ).bind(uid, slug, 'modern').run();
      }

      // Flip the completion flag so the overview redirect stops firing.
      await env.DB.prepare(
        'UPDATE settings SET onboarding_complete = 1 WHERE user_id = ?'
      ).bind(uid).run();

      const kb = await env.DB.prepare('SELECT COUNT(*) AS n FROM knowledge WHERE user_id = ?').bind(uid).first();
      return json({
        ok: true, step, slug,
        summary: {
          business_name: businessName,
          industry: (row && row.industry) || '',
          working_hours: (row && row.working_hours) || '',
          welcome_message: (row && row.welcome_message) || defaultWelcomeMessage(businessName, (row && row.industry) || ''),
          service_area: (row && row.service_area) || '',
          knowledge_count: (kb && kb.n) || 0,
        },
      });
    }
  } catch (e) {
    console.error('Onboarding save error:', e);
    return apiError('Could not save onboarding step', 500);
  }
}

// GET /p/onboarding — the 5-step wizard. Centered single card (no sidebar),
// scoped wizard CSS layered on the amber-monotone simpleShell base. All 5
// steps render in one page; a vanilla-JS controller toggles visibility and
// POSTs each step to /api/onboarding/save. Steps 3-4 are skippable.
async function onboardingWizardHtmx(request, env, uid, ctx) {
  try {
    const [user, settings, kbCount] = await Promise.all([
      env.DB.prepare('SELECT email FROM users WHERE id = ?').bind(uid).first(),
      env.DB.prepare('SELECT business_name, industry, forwarding_number, service_area, working_hours, buffer_min, timezone, welcome_message FROM settings WHERE user_id = ?').bind(uid).first(),
      env.DB.prepare('SELECT COUNT(*) AS n FROM knowledge WHERE user_id = ?').bind(uid).first(),
    ]);

    const bizName = (settings && settings.business_name) || (user && user.email) || '';
    const industry = (settings && settings.industry) || '';
    const phone = (settings && settings.forwarding_number) || '';
    const area = (settings && settings.service_area) || '';
    const savedHours = (settings && settings.working_hours) || '';
    const savedBuffer = (settings && settings.buffer_min) || 15;
    const savedTz = (settings && settings.timezone) || 'America/New_York';
    const welcome = (settings && settings.welcome_message) || defaultWelcomeMessage(bizName, industry);
    const kbTotal = (kbCount && kbCount.n) || 0;

    const esc = htmxEsc;
    // Suggested services for the chosen industry (pre-fill step 2 when empty).
    const suggest = INDUSTRY_SERVICE_SUGGESTIONS[industry] || INDUSTRY_SERVICE_SUGGESTIONS['Other'];

    const wizardStyle = `
<style>
/* Wizard shell — centered card, no sidebar. Layered over simpleShell's base. */
.ob-shell{max-width:680px;margin:0 auto;padding:64px 24px 80px;position:relative;z-index:2;animation:fadeUp .6s cubic-bezier(.2,.7,.2,1)}
.ob-head{text-align:center;margin-bottom:30px}
.ob-head .eyebrow{margin-bottom:10px}
.ob-head h1{font-size:2rem;margin-bottom:8px}
.ob-head .sub{color:var(--text-muted);font-size:.95rem;max-width:440px;margin:0 auto}

/* Progress: segmented bar + "Step X of 5". */
.ob-progress{margin:0 auto 30px;max-width:420px}
.ob-bar{display:flex;gap:6px}
.ob-seg{flex:1;height:5px;border-radius:999px;background:var(--border);transition:background-color .35s ease}
.ob-seg.done{background:var(--accent-deep)}
.ob-seg.cur{background:linear-gradient(90deg,var(--accent-deep),var(--accent))}
.ob-progress .ob-count{font-family:var(--font-mono);font-size:.7rem;letter-spacing:.14em;text-transform:uppercase;color:var(--text-muted);text-align:center;margin-top:10px}

/* Card holds one step at a time. */
.ob-card{background:var(--bg-card);border:1px solid var(--border);border-radius:18px;padding:30px 28px;min-height:340px;display:flex;flex-direction:column}
.ob-step{display:none;flex:1;flex-direction:column;animation:fadeUp .4s cubic-bezier(.2,.7,.2,1)}
.ob-step.active{display:flex}
.ob-step h2{font-family:var(--font-serif);font-weight:500;font-size:1.5rem;letter-spacing:-.02em;margin-bottom:6px}
.ob-step .ob-desc{color:var(--text-muted);font-size:.92rem;margin-bottom:22px}
.ob-fields{display:flex;flex-direction:column;gap:14px;flex:1}
.ob-field label{display:block;font-family:var(--font-mono);font-size:.66rem;letter-spacing:.12em;text-transform:uppercase;color:var(--text-faint);margin-bottom:6px;font-weight:500}
.ob-field input,.ob-field select,.ob-field textarea{width:100%;box-sizing:border-box}
.ob-grid2{display:grid;grid-template-columns:1fr 1fr;gap:14px}
@media(max-width:560px){.ob-grid2{grid-template-columns:1fr}}

/* Service rows (step 2). */
.ob-svc-head{display:grid;grid-template-columns:1.1fr 1.4fr .8fr 32px;gap:8px;font-family:var(--font-mono);font-size:.62rem;letter-spacing:.1em;text-transform:uppercase;color:var(--text-faint);margin-bottom:4px}
.ob-svc-row{display:grid;grid-template-columns:1.1fr 1.4fr .8fr 32px;gap:8px;align-items:center;margin-bottom:8px}
.ob-svc-row input{padding:9px 11px;font-size:.9rem}
.ob-svc-del{background:transparent;border:1px solid var(--border);color:var(--text-muted);border-radius:8px;width:32px;height:38px;cursor:pointer;font-size:1rem;transition:all .15s ease}
.ob-svc-del:hover{border-color:var(--danger);color:var(--danger)}
.ob-svc-add{align-self:flex-start;margin-top:6px}

/* Working hours (step 3). */
.ob-wh-row{display:grid;grid-template-columns:60px 1fr 1fr;gap:10px;align-items:center;padding:7px 0;border-bottom:1px solid var(--border)}
.ob-wh-row:last-child{border-bottom:none}
.ob-wh-row .ob-wh-day{display:flex;align-items:center;gap:8px;font-size:.9rem;color:var(--cream-dim)}
.ob-wh-row input[type=checkbox]{width:18px;height:18px;accent-color:var(--accent-amber)}
.ob-wh-row input[type=time]{padding:8px 10px;font-size:.88rem;font-family:var(--font-mono)}
.ob-wh-row.closed input[type=time]{opacity:.35}

/* Greeting preview (step 4). */
.ob-preview{background:var(--bg-primary);border:1px solid var(--border);border-radius:12px;padding:16px 18px;margin-top:6px}
.ob-preview .ob-quote{font-family:var(--font-serif);font-style:italic;font-size:1.05rem;line-height:1.6;color:var(--cream)}
.ob-preview .ob-tag{font-family:var(--font-mono);font-size:.64rem;letter-spacing:.14em;text-transform:uppercase;color:var(--text-faint);margin-bottom:8px}

/* Done (step 5). */
.ob-done{text-align:center;align-items:center}
.ob-done .ob-check{font-size:2.8rem;margin-bottom:8px}
.ob-done h2{font-size:1.9rem}
.ob-summary{width:100%;text-align:left;margin:18px 0;background:var(--bg-primary);border:1px solid var(--border);border-radius:12px;padding:6px 18px}
.ob-summary .kv{padding:12px 0}
.ob-sitelink{display:inline-flex;align-items:center;gap:8px;background:var(--bg-card);border:1px solid var(--border-soft);border-radius:10px;padding:12px 16px;font-family:var(--font-mono);font-size:.88rem;color:var(--accent-amber);text-decoration:none;margin:8px auto 4px}
.ob-sitelink:hover{text-decoration:underline}

/* Footer nav: Back / Skip / Continue. */
.ob-nav{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-top:24px;padding-top:20px;border-top:1px solid var(--border)}
.ob-nav .ob-left{display:flex;gap:8px}
.ob-nav .ob-right{display:flex;gap:8px;align-items:center;margin-left:auto}
.ob-msg{font-size:.82rem;font-family:var(--font-mono);min-height:1.1em}
.ob-msg.err{color:var(--danger)}
.ob-msg.ok{color:var(--accent-amber)}
.ob-skip{background:transparent;border:none;color:var(--text-muted);font-size:.85rem;cursor:pointer;text-decoration:underline;font-family:inherit;padding:6px 4px}
.ob-skip:hover{color:var(--cream)}
.ob-back{background:transparent;border:1px solid var(--border);color:var(--cream-dim);border-radius:9999px;padding:9px 16px;font-size:.88rem;cursor:pointer;font-family:inherit}
.ob-back:hover{border-color:var(--border-soft);color:var(--cream)}
.ob-back:disabled{opacity:.35;cursor:not-allowed}
</style>`;

    // Initial state injected for the client controller. working_hours come in
    // as free text; the client re-parses it into day toggles (best-effort).
    const initState = {
      business_name: bizName, industry, phone, service_area: area,
      working_hours: savedHours, buffer_min: savedBuffer, timezone: savedTz,
      welcome_message: welcome, kb_count: kbTotal,
      suggestions: suggest,
    };

    const body = `${wizardStyle}
<div class="ob-shell">
  <div class="ob-head">
    <span class="eyebrow">Welcome to Branch Live</span>
    <h1>Let\u2019s set up <em>Emma</em></h1>
    <p class="sub">Five quick steps and your AI receptionist will be ready to answer calls.</p>
  </div>
  <div class="ob-progress">
    <div class="ob-bar" id="ob-bar">
      <span class="ob-seg cur"></span><span class="ob-seg"></span><span class="ob-seg"></span><span class="ob-seg"></span><span class="ob-seg"></span>
    </div>
    <div class="ob-count" id="ob-count">Step 1 of 5</div>
  </div>

  <form id="ob-form" class="ob-card" onsubmit="return false">

    <!-- Step 1 — Business info -->
    <section class="ob-step active" data-step="1">
      <h2>Tell us about your business</h2>
      <p class="ob-desc">Emma uses this to greet callers and answer their questions.</p>
      <div class="ob-fields">
        <div class="ob-field">
          <label for="ob-name">Business name</label>
          <input id="ob-name" type="text" placeholder="e.g. Riverside Salon" value="${esc(bizName)}" autocomplete="organization">
        </div>
        <div class="ob-grid2">
          <div class="ob-field">
            <label for="ob-industry">Industry</label>
            <select id="ob-industry" onchange="obIndustryChanged()">
              <option value="">Select\u2026</option>
              ${ONBOARDING_INDUSTRIES.map(i => `<option value="${esc(i)}"${i === industry ? ' selected' : ''}>${esc(i)}</option>`).join('')}
            </select>
          </div>
          <div class="ob-field">
            <label for="ob-phone">Phone</label>
            <input id="ob-phone" type="tel" placeholder="(555) 123-4567" value="${esc(phone)}" autocomplete="tel">
          </div>
        </div>
        <div class="ob-field">
          <label for="ob-area">Service area</label>
          <input id="ob-area" type="text" placeholder="e.g. Lancaster, York, Harrisburg PA" value="${esc(area)}">
        </div>
      </div>
    </section>

    <!-- Step 2 — Services -->
    <section class="ob-step" data-step="2">
      <h2>Add your services</h2>
      <p class="ob-desc">These become Emma\u2019s knowledge base \u2014 what she references when callers ask about pricing.</p>
      <div class="ob-fields">
        <div class="ob-svc-head"><span>Category</span><span>Service name</span><span>Price ($)</span><span></span></div>
        <div id="ob-svc-rows"></div>
        <button type="button" class="btn btn-ghost btn-sm ob-svc-add" onclick="obAddRow()">+ Add another service</button>
      </div>
    </section>

    <!-- Step 3 — Calendar -->
    <section class="ob-step" data-step="3">
      <h2>Set your hours</h2>
      <p class="ob-desc">When Emma can book appointments. You can fine-tune this later in Settings.</p>
      <div class="ob-fields">
        <div id="ob-wh"></div>
        <div class="ob-grid2" style="margin-top:6px">
          <div class="ob-field">
            <label for="ob-buffer">Buffer time between appointments</label>
            <select id="ob-buffer">
              <option value="15"${String(savedBuffer) === '15' ? ' selected' : ''}>15 minutes</option>
              <option value="30"${String(savedBuffer) === '30' ? ' selected' : ''}>30 minutes</option>
              <option value="60"${String(savedBuffer) === '60' ? ' selected' : ''}>60 minutes</option>
            </select>
          </div>
          <div class="ob-field">
            <label for="ob-tz">Timezone</label>
            <input id="ob-tz" type="text" readonly>
          </div>
        </div>
      </div>
    </section>

    <!-- Step 4 — Emma greeting -->
    <section class="ob-step" data-step="4">
      <h2>Emma\u2019s greeting</h2>
      <p class="ob-desc">The first thing callers hear. We\u2019ve drafted a smart default \u2014 edit it to match your voice.</p>
      <div class="ob-fields">
        <div class="ob-field">
          <label for="ob-welcome">Welcome message</label>
          <textarea id="ob-welcome" rows="3" oninput="obUpdatePreview()">${esc(welcome)}</textarea>
        </div>
        <div class="ob-preview">
          <div class="ob-tag">Caller hears</div>
          <div class="ob-quote" id="ob-preview-text">${esc(welcome)}</div>
        </div>
      </div>
    </section>

    <!-- Step 5 — Done -->
    <section class="ob-step ob-done" data-step="5">
      <div class="ob-check">\u2728</div>
      <h2>You\u2019re all set</h2>
      <p class="ob-desc">Emma is ready to answer your calls. Here\u2019s what you configured:</p>
      <div class="ob-summary" id="ob-summary"></div>
      <a class="ob-sitelink" id="ob-sitelink" href="#" target="_blank" rel="noopener"></a>
    </section>

    <div class="ob-nav">
      <div class="ob-left">
        <button type="button" class="ob-back" id="ob-back" onclick="obBack()" disabled>\u2190 Back</button>
      </div>
      <span class="ob-msg" id="ob-msg"></span>
      <div class="ob-right">
        <button type="button" class="ob-skip" id="ob-skip" onclick="obSkip()" style="display:none">Skip for now</button>
        <button type="button" class="btn btn-amber" id="ob-next" onclick="obNext()">Continue \u2192</button>
      </div>
    </div>
  </form>
</div>
<script>
// Onboarding wizard controller — vanilla JS (no HTMX dependency). One page,
// five .ob-step sections; this toggles visibility, gathers inputs, and POSTs
// each step to /api/onboarding/save. Steps 3-4 are skippable. State shared
// across steps (e.g. industry \u2192 service suggestions) lives in obState.
(function () {
  var TOTAL = 5;
  var SKIPPABLE = { 3: true, 4: true };
  var state = ${JSON.stringify(initState)};
  var step = 1;

  // ── Helpers ──
  function $(id) { return document.getElementById(id); }
  function val(id) { var el = $(id); return el ? el.value.trim() : ''; }
  function showMsg(text, kind) { var m = $('ob-msg'); m.textContent = text || ''; m.className = 'ob-msg' + (kind ? ' ' + kind : ''); }

  function renderProgress() {
    var segs = $('ob-bar').children;
    for (var i = 0; i < segs.length; i++) {
      var n = i + 1;
      segs[i].className = 'ob-seg' + (n < step ? ' done' : (n === step ? ' cur' : ''));
    }
    $('ob-count').textContent = 'Step ' + step + ' of ' + TOTAL;
    $('ob-back').disabled = (step === 1);
    var next = $('ob-next');
    next.textContent = (step === TOTAL) ? 'Go to Dashboard \u2192' : 'Continue \u2192';
    // Skip is offered only on skippable steps that aren't the last.
    $('ob-skip').style.display = SKIPPABLE[step] ? '' : 'none';
  }

  function showStep(n) {
    step = n;
    var secs = document.querySelectorAll('.ob-step');
    for (var i = 0; i < secs.length; i++) secs[i].classList.remove('active');
    var cur = document.querySelector('.ob-step[data-step="' + n + '"]');
    if (cur) cur.classList.add('active');
    renderProgress();
    showMsg('');
  }

  // ── Step 2: dynamic service rows ──
  // Pre-fill with the industry suggestions on first visit, then keep whatever
  // the user has typed across step changes (rows persist in the DOM).
  var svcSeeded = false;
  function seedRows() {
    if (svcSeeded) return;
    svcSeeded = true;
    var wrap = $('ob-svc-rows');
    wrap.innerHTML = '';
    var sugg = (state.suggestions && state.suggestions.length) ? state.suggestions : [];
    sugg.forEach(function (s) { addRow(s[0], s[1], s[2]); });
    // Always offer at least 3 empty rows (spec: start with 3 empty rows when
    // there are no suggestions, e.g. "Other").
    if (sugg.length === 0) { addRow('', '', ''); addRow('', '', ''); addRow('', '', ''); }
  }
  function addRow(cat, name, price) {
    var wrap = $('ob-svc-rows');
    var div = document.createElement('div');
    div.className = 'ob-svc-row';
    div.innerHTML =
      '<input type="text" class="svc-cat" placeholder="Category" value="' + escAttr(cat) + '">' +
      '<input type="text" class="svc-name" placeholder="Service name" value="' + escAttr(name) + '">' +
      '<input type="number" step="0.01" class="svc-price" placeholder="0.00" value="' + (price ? price : '') + '">' +
      '<button type="button" class="ob-svc-del" title="Remove" onclick="this.parentNode.remove()">\u00d7</button>';
    wrap.appendChild(div);
  }
  window.obAddRow = function () { addRow('', '', ''); };

  // When the industry changes on step 1, refresh the suggested services so the
  // user sees relevant rows when they reach step 2 (only if they haven't
  // started typing yet \u2014 don't clobber their work).
  window.obIndustryChanged = function () {
    state.industry = val('ob-industry');
    fetch('/api/onboarding/suggestions?industry=' + encodeURIComponent(state.industry), { headers: { 'Accept': 'application/json' } })
      .then(function (r) { return r.json(); })
      .then(function (d) {
        if (d && d.ok && Array.isArray(d.suggestions)) {
          if (!svcSeeded) { state.suggestions = d.suggestions; }
        }
      }).catch(function () {});
  };

  // ── Step 3: working-hours toggles ──
  var DAYS = [['mon','Mon'],['tue','Tue'],['wed','Wed'],['thu','Thu'],['fri','Fri'],['sat','Sat'],['sun','Sun']];
  function buildHours() {
    var wrap = $('ob-wh');
    if (wrap.children.length) return; // build once
    // Parse the saved free-text (e.g. "Mon-Fri 8am-6pm") into a default range.
    var rng = parseHoursText(state.working_hours || 'Mon-Fri 8am-6pm');
    DAYS.forEach(function (d) {
      var open = /sat/i.test(d[1]) || /sun/i.test(d[1]) ? false : true; // weekdays default open
      var row = document.createElement('div');
      row.className = 'ob-wh-row' + (open ? '' : ' closed');
      row.innerHTML =
        '<label class="ob-wh-day"><input type="checkbox" data-day="' + d[0] + '"' + (open ? ' checked' : '') + ' onchange="obDayToggle(this)">' + d[1] + '</label>' +
        '<input type="time" data-day="' + d[0] + '" data-end="start" value="' + rng.start + '">' +
        '<input type="time" data-day="' + d[0] + '" data-end="end" value="' + rng.end + '">';
      wrap.appendChild(row);
    });
  }
  window.obDayToggle = function (cb) {
    var row = cb.closest('.ob-wh-row');
    if (row) row.classList.toggle('closed', !cb.checked);
  };
  // Best-effort parse of "Mon-Fri 8am-6pm" / "8:00-18:00" \u2192 {start,end} 24h.
  function parseHoursText(t) {
    var m = String(t || '').match(/(\\d{1,2})(?::(\\d{2}))?\\s*(am|pm)?\\s*[\\u2013\\-]\\s*(\\d{1,2})(?::(\\d{2}))?\\s*(am|pm)?/i);
    if (!m) return { start: '08:00', end: '18:00' };
    var sh = parseInt(m[1], 10), sm = m[2] ? parseInt(m[2], 10) : 0;
    var eh = parseInt(m[4], 10), em = m[5] ? parseInt(m[5], 10) : 0;
    var sp = (m[3] || '').toLowerCase(), ep = (m[6] || '').toLowerCase();
    if (sp === 'pm' && sh < 12) sh += 12; if (sp === 'am' && sh === 12) sh = 0;
    if (ep === 'pm' && eh < 12) eh += 12; if (ep === 'am' && eh === 12) eh = 0;
    if (!sp && !ep && eh <= sh) eh += 12; // "8-6" \u2192 8-18
    return { start: pad(sh) + ':' + pad(sm), end: pad(eh) + ':' + pad(em) };
  }
  function pad(n) { return String(n).padStart(2, '0'); }

  function gatherHours() {
    var out = {};
    DAYS.forEach(function (d) {
      var cb = document.querySelector('.ob-wh-row input[type=checkbox][data-day="' + d[0] + '"]');
      var sEl = document.querySelector('.ob-wh-row input[type=time][data-day="' + d[0] + '"][data-end=start]');
      var eEl = document.querySelector('.ob-wh-row input[type=time][data-day="' + d[0] + '"][data-end=end]');
      out[d[0]] = { open: !!(cb && cb.checked), start: sEl ? sEl.value : '08:00', end: eEl ? eEl.value : '18:00' };
    });
    return out;
  }

  // ── Step 4: greeting preview ──
  window.obUpdatePreview = function () {
    var t = $('ob-welcome').value || '';
    $('ob-preview-text').textContent = t;
  };

  // ── Save a step ──
  function saveStep(n, data) {
    return fetch('/api/onboarding/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ step: n, data: data || {} })
    }).then(function (r) { return r.json(); });
  }

  // ── Navigation ──
  function gatherStepData(n) {
    if (n === 1) return {
      business_name: val('ob-name'), industry: val('ob-industry'),
      phone: val('ob-phone'), service_area: val('ob-area'),
    };
    if (n === 2) {
      var rows = document.querySelectorAll('.ob-svc-row');
      var svcs = [];
      rows.forEach(function (r) {
        var name = r.querySelector('.svc-name').value.trim();
        if (!name) return;
        svcs.push({
          category: r.querySelector('.svc-cat').value.trim(),
          name: name,
          price: parseFloat(r.querySelector('.svc-price').value) || 0,
        });
      });
      return { services: svcs };
    }
    if (n === 3) return {
      working_hours: gatherHours(),
      buffer_min: parseInt(val('ob-buffer'), 10) || 15,
      timezone: (Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/New_York'),
    };
    if (n === 4) return { welcome_message: $('ob-welcome').value.trim() };
    return {};
  }

  function validateStep(n) {
    if (n === 1) {
      if (!val('ob-name')) { showMsg('Business name is required.', 'err'); $('ob-name').focus(); return false; }
    }
    if (n === 4) {
      if (!$('ob-welcome').value.trim()) { showMsg('The welcome message can\u2019t be empty.', 'err'); $('ob-welcome').focus(); return false; }
    }
    return true;
  }

  window.obNext = function () {
    var btn = $('ob-next'); btn.disabled = true;
    var goingToFinish = (step === TOTAL);

    function proceed() {
      if (step < TOTAL) { showStep(step + 1); initStep(step); }
      btn.disabled = false;
    }

    // On the final step, "Continue" becomes "Go to Dashboard".
    if (goingToFinish) { window.location.href = '/p/overview'; return; }

    if (!validateStep(step)) { btn.disabled = false; return; }

    // Persist before advancing (steps 1-4). Failure is non-fatal for skippable
    // steps so a transient save error never traps the user.
    showMsg('Saving\u2026');
    saveStep(step, gatherStepData(step)).then(function (d) {
      btn.disabled = false;
      if (d && d.ok) {
        // Step 2 may report how many rows were added; surface a soft confirmation.
        if (step === 2 && typeof d.added === 'number' && d.added > 0) {
          showMsg('Saved ' + d.added + ' service' + (d.added === 1 ? '' : 's') + '.', 'ok');
        } else {
          showMsg('');
        }
        proceed();
      } else {
        showMsg((d && d.error) || 'Saved locally (will retry on finish).', SKIPPABLE[step] ? 'ok' : 'err');
        if (SKIPPABLE[step]) proceed(); // don't block skippable steps
      }
    }).catch(function () {
      btn.disabled = false;
      showMsg('Network error \u2014 continuing anyway.', SKIPPABLE[step] ? 'ok' : 'err');
      if (SKIPPABLE[step]) proceed();
    });
  };

  window.obBack = function () {
    if (step > 1) { showStep(step - 1); initStep(step); }
  };

  // Skip is offered on steps 3-4: advance without saving that step.
  window.obSkip = function () {
    showMsg('');
    showStep(step + 1);
    initStep(step);
  };

  // Lazy-build the dynamic parts of a step the first time it's shown.
  function initStep(n) {
    if (n === 2) seedRows();
    if (n === 3) buildHours();
    if (n === 4) window.obUpdatePreview();
    if (n === 5) loadSummary();
  }

  // Step 5 loads the final summary + public link from a step-5 save (which
  // returns the account snapshot). Falls back to a plain dashboard CTA.
  function loadSummary() {
    showMsg('Finishing up\u2026');
    saveStep(5, {}).then(function (d) {
      if (!d || !d.ok) { showMsg('Done! Head to your dashboard to review.', 'ok'); return; }
      showMsg('Setup complete!', 'ok');
      var s = d.summary || {};
      $('ob-summary').innerHTML =
        kvRow('Business', s.business_name || '\u2014') +
        kvRow('Industry', s.industry || '\u2014') +
        kvRow('Services', (s.knowledge_count || 0) + ' in knowledge base') +
        kvRow('Hours', s.working_hours || '\u2014') +
        kvRow('Greeting', '\u201c' + (s.welcome_message || '').slice(0, 70) + ((s.welcome_message || '').length > 70 ? '\u2026' : '') + '\u201d');
      var link = $('ob-sitelink');
      if (d.slug) { link.href = '/s/' + encodeURIComponent(d.slug); link.textContent = 'View your public site \u2192 /s/' + d.slug; }
      else { link.style.display = 'none'; }
    }).catch(function () {
      showMsg('Done! Head to your dashboard to review.', 'ok');
    });
  }
  function kvRow(k, v) {
    return '<div class="kv"><span class="k">' + escHtml(k) + '</span><span class="v">' + escHtml(v) + '</span></div>';
  }

  // ── tiny escapers (values are server-validated; this is defense-in-depth) ──
  function escAttr(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;'); }
  function escHtml(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

  // Auto-detect timezone for the readonly field + step-3 save.
  try { var tz = Intl.DateTimeFormat().resolvedOptions().timeZone || state.timezone || 'America/New_York'; } catch (e) { tz = 'America/New_York'; }
  var tzEl = $('ob-tz'); if (tzEl) tzEl.value = tz;

  renderProgress();
})();
</script>`;

    return new Response(simpleShell('Onboarding', body), { headers: { 'Content-Type': 'text/html' } });
  } catch (e) {
    console.error('Onboarding wizard render error:', e);
    return new Response(simpleShell('Error', '<h1>\u26a0\ufe0f Error</h1><p style="color:#f85149">Could not load the onboarding wizard.</p>'), { headers: { 'Content-Type': 'text/html' }, status: 500 });
  }
}

// ═══════════════════════════════════════════════════════════════════════
// BUSINESS ANALYTICS (/p/analytics) — per-account dashboard
// Cookie-authed HTMX page. Aggregates the account's own leads, calls,
// appointments, and plan/add-on revenue into stat cards, a CSS bar chart of
// monthly lead volume, a revenue summary, and a recent-activity feed. No chart
// library — bars are inline-styled divs. Numbers come entirely from the
// account's existing D1 data, scoped by user_id.
// ═══════════════════════════════════════════════════════════════════════
async function handleAnalyticsHtmx(request, env, uid, ctx) {
  try {
    // One batched round-trip for every aggregate. The "answered" proxy for a
    // call is duration_sec > 0 (call_logs has no status column) — a call that
    // actually connected and lasted beats "row exists".
    const [leadCounts, callCounts, apptCount, settings, sub, monthly, activity] = await Promise.all([
      env.DB.prepare(
        `SELECT
           COUNT(*) AS total,
           SUM(CASE WHEN status = 'booked' THEN 1 ELSE 0 END) AS booked
         FROM leads WHERE user_id = ?`
      ).bind(uid).first(),
      env.DB.prepare(
        `SELECT COUNT(*) AS total,
                SUM(CASE WHEN duration_sec > 0 THEN 1 ELSE 0 END) AS answered
         FROM call_logs WHERE user_id = ?`
      ).bind(uid).first(),
      env.DB.prepare('SELECT COUNT(*) AS total FROM appointments WHERE user_id = ?').bind(uid).first(),
      env.DB.prepare('SELECT stripe_plan, addon_website, addon_reviews, addon_social, addon_blog, addon_email FROM settings WHERE user_id = ?').bind(uid).first(),
      env.DB.prepare('SELECT status FROM subscriptions WHERE user_id = ?').bind(uid).first(),
      env.DB.prepare(
        `SELECT strftime('%Y-%m', created_at) AS month, COUNT(*) AS count
         FROM leads WHERE user_id = ?
         GROUP BY month ORDER BY month DESC LIMIT 6`
      ).bind(uid).all(),
      env.DB.prepare(
        // `ts` (not `when`) — WHEN is a SQLite reserved word and can't be a
        // bare alias. Calls have no caller_name/status, so we synthesize both
        // (caller_phone + an answered/missed label from duration_sec).
        `SELECT 'lead' AS type, caller_name AS name, created_at AS ts, status
         FROM leads WHERE user_id = ?
         UNION ALL
         SELECT 'call', COALESCE(caller_phone, 'Unknown'), created_at,
                CASE WHEN duration_sec > 0 THEN 'answered' ELSE 'missed' END
         FROM call_logs WHERE user_id = ?
         UNION ALL
         SELECT 'appointment', customer_name, created_at, status
         FROM appointments WHERE user_id = ?
         ORDER BY ts DESC LIMIT 10`
      ).bind(uid, uid, uid).all(),
    ]);

    const leadsTotal = (leadCounts && leadCounts.total) || 0;
    const booked = (leadCounts && leadCounts.booked) || 0;
    const callsAnswered = (callCounts && callCounts.answered) || 0;
    const appts = (apptCount && apptCount.total) || 0;
    const closeRate = leadsTotal > 0 ? Math.round((booked / leadsTotal) * 100) : 0;

    // ── Monthly lead trend (CSS horizontal bars) ──
    // Build a clean 6-month axis (oldest→newest top-down) so the trend reads
    // consistently even when months have no leads. Actual counts from `monthly`
    // are mapped onto the axis; gaps fill with 0.
    const monthLabel = (ym) => {
      const [y, m] = ym.split('-');
      const names = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
      return `${names[parseInt(m, 10) - 1] || m} '${y.slice(2)}`;
    };
    const byMonth = {};
    for (const r of (monthly.results || [])) byMonth[r.month] = r.count;
    const now = new Date();
    const axis = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      axis.push({ ym, label: monthLabel(ym), count: byMonth[ym] || 0 });
    }
    const maxCount = Math.max(1, ...axis.map(a => a.count));
    const chartRows = axis.map(a => {
      const pct = Math.round((a.count / maxCount) * 100);
      return `<div class="ax-row">
  <span class="ax-month">${a.label}</span>
  <span class="ax-track"><span class="ax-fill" style="width:${pct}%"></span></span>
  <span class="ax-val">${a.count}</span>
</div>`;
    }).join('');

    // ── Revenue summary (plan + add-ons), derived locally ──
    // Mirrors mrrForAccount(): base applies when paying (active sub or paid
    // plan); trial shows $0 base with a note. Add-on prices come from ADDONS.
    const plan = (settings && settings.stripe_plan) || 'base';
    const status = (sub && sub.status) || 'trial';
    const paying = status === 'active' || plan === 'paid';
    const basePrice = paying ? ADMIN_BASE_PRICE : 0;
    const activeAddons = [];
    let addonTotal = 0;
    if (settings) {
      for (const def of Object.values(ADDONS)) {
        if (settings[def.column]) { activeAddons.push(def); addonTotal += def.price; }
      }
    }
    const grandTotal = basePrice + addonTotal;
    const money = (n) => `$${n.toFixed(2)}`;
    const addonList = activeAddons.length
      ? activeAddons.map(a => `${a.icon} ${htmxEsc(a.label)} ${money(a.price)}/mo`).join(' · ')
      : '<span style="color:var(--text-faint)">No add-ons active</span>';
    const trialNote = !paying
      ? `<div class="ax-note">🎁 Free trial — base plan is $0 until you upgrade.</div>`
      : '';

    // ── Recent activity feed ──
    const typeMeta = {
      lead:        { icon: '👤', label: 'Lead' },
      call:        { icon: '📞', label: 'Call' },
      appointment: { icon: '📅', label: 'Appt' },
    };
    const feedRows = (activity.results || []).map(r => {
      const m = typeMeta[r.type] || { icon: '•', label: r.type };
      const ts = String(r.ts || '').replace('T', ' ').slice(0, 16);
      return `<div class="ax-feed-row">
  <span class="ax-feed-icon">${m.icon}</span>
  <span class="ax-feed-main">
    <span class="ax-feed-name">${htmxEsc(r.name || 'Unknown')}</span>
    <span class="ax-feed-type">${m.label}${r.status ? ' · ' + htmxEsc(r.status) : ''}</span>
  </span>
  <span class="ax-feed-ts">${htmxEsc(ts)}</span>
</div>`;
    }).join('');

    const statCard = (label, value, tone) =>
      `<div class="ax-stat"><div class="stat-num ${tone}">${value}</div><div class="stat-lab">${label}</div></div>`;

    const body = `<div class="app">${sidebarNav('analytics', undefined, ctx)}<div class="content">
<span class="eyebrow">Analytics</span>
<h1>📊 Analytics</h1>
<p class="sub">Your leads, close rate, call volume &amp; ROI — live from your data.</p>
<h3>Snapshot</h3>
<div class="ax-stat-grid">
  ${statCard('Total leads', leadsTotal, '')}
  ${statCard('Calls answered', callsAnswered, '')}
  ${statCard('Appointments booked', appts, 'green')}
  ${statCard('Close rate', closeRate + '%', '')}
</div>

<h3>Monthly leads <span style="color:var(--text-faint);font-weight:400">last 6 months</span></h3>
<div class="ax-chart">${chartRows}</div>

<h3>Revenue</h3>
<div class="card" style="padding:24px">
  ${trialNote}
  <div class="ax-rev-line">
    <span>Base plan</span>
    <strong>${money(basePrice)}/mo</strong>
  </div>
  <div class="ax-rev-line">
    <span>Add-ons</span>
    <strong>${money(addonTotal)}/mo</strong>
  </div>
  <div class="ax-rev-line ax-rev-total">
    <span>Total</span>
    <strong>${money(grandTotal)}/mo</strong>
  </div>
  <p class="ax-rev-detail">${addonList}</p>
</div>

<h3>Recent activity</h3>
<div class="ax-feed">${feedRows || '<div class="ax-empty">No activity yet.</div>'}</div>
</div></div>`;

    return new Response(simpleShell('Analytics', body), { headers: { 'Content-Type': 'text/html' } });
  } catch (e) {
    console.error('Analytics htmx error:', e);
    return new Response(simpleShell('Error', '<h1>⚠️ Error</h1><p style="color:#f85149">Could not load your analytics dashboard.</p>'), { headers: { 'Content-Type': 'text/html' }, status: 500 });
  }
}

// ═══════════════════════════════════════════════════════════════════════
// TEAM MANAGEMENT (/p/team) + TEAM API (/api/team/*)
// Admin/manager view of members for the active business. Admins can invite,
// change roles, and remove. ctx.bid is the owning account; ctx.role is the
// viewer's role. Writes (invite/role/remove/revoke) require business admin.
// ═══════════════════════════════════════════════════════════════════════

function roleBadge(role) {
  const v = VALID_ROLES.includes(role) ? role : 'employee';
  const labels = { admin: 'Admin', manager: 'Manager', employee: 'Employee' };
  return `<span class="role-badge rb-${v}">${labels[v]}</span>`;
}

// Inline CSS for the team page (scoped; appended via simpleShell's body).
const TEAM_STYLE = `<style>
.role-badge{display:inline-flex;align-items:center;padding:3px 10px;border-radius:999px;font-family:var(--font-mono);font-size:.62rem;letter-spacing:.08em;text-transform:uppercase;font-weight:600}
.rb-admin{background:rgba(212,165,116,.16);color:var(--accent)}
.rb-manager{background:rgba(241,234,217,.08);color:var(--cream-dim)}
.rb-employee{background:rgba(255,255,255,.04);color:var(--text-muted)}
.team-card{background:var(--bg-card);border:1px solid var(--border);border-radius:14px;padding:6px 0;margin-top:18px}
.team-row{display:flex;align-items:center;gap:14px;padding:14px 22px;border-bottom:1px solid var(--border)}
.team-row:last-child{border-bottom:none}
.team-ava{width:38px;height:38px;border-radius:50%;background:var(--bg-elev);display:flex;align-items:center;justify-content:center;font-weight:600;color:var(--cream);flex-shrink:0;font-size:.9rem}
.team-meta{flex:1;min-width:0}
.team-name{color:var(--cream);font-weight:500}
.team-email{color:var(--text-faint);font-size:.82rem}
.team-actions{display:flex;align-items:center;gap:8px;flex-shrink:0}
.team-select{background:var(--bg-elev);border:1px solid var(--border);color:var(--text-primary);border-radius:8px;padding:6px 10px;font-family:inherit;font-size:.82rem;cursor:pointer}
.invite-form{display:grid;grid-template-columns:1fr auto auto;gap:10px;align-items:end}
@media(max-width:640px){.invite-form{grid-template-columns:1fr}.team-row{flex-wrap:wrap}}
.you-tag{font-size:.66rem;font-family:var(--font-mono);color:var(--text-faint);text-transform:uppercase;letter-spacing:.06em;margin-left:6px}
</style>`;

async function handleTeamHtmx(request, env, ctx) {
  try {
    const bid = ctx.bid;
    const isAdmin = ctx.role === 'admin';
    // Members of this business (join users for name/email). The owner row may
    // exist in user_roles (from the backfill) even if the user row was deleted;
    // LEFT JOIN keeps it visible with a fallback label.
    const { results: members } = await env.DB.prepare(
      `SELECT ur.user_id, ur.role, ur.created_at,
         COALESCE(u.name, u.email, 'Member #' || ur.user_id) AS name,
         u.email
       FROM user_roles ur
       LEFT JOIN users u ON u.id = ur.user_id
       WHERE ur.business_id = ?
       ORDER BY (ur.user_id = ?) DESC, (ur.role = 'admin') DESC, ur.created_at ASC`
    ).bind(bid, bid).all();
    // Pending invites for this business.
    const { results: invites } = await env.DB.prepare(
      `SELECT token, email, role, created_at FROM team_invites
       WHERE business_id = ? AND status = 'pending'
       ORDER BY created_at DESC`
    ).bind(bid).all();

    const businessName = (ctx.businesses || []).find(b => String(b.business_id) === String(bid));
    const bName = htmxEsc((businessName && businessName.business_name) || 'this business');

    const rows = (members || []).map(m => {
      const isSelf = String(m.user_id) === String(ctx.uid);
      const isOwner = String(m.user_id) === String(bid);
      const youTag = isSelf ? '<span class="you-tag">(you)</span>' : '';
      const ownerTag = isOwner ? '<span class="you-tag">(owner)</span>' : '';
      const initials = String(m.name || '?').trim().split(/\s+/).map(s => s[0]).slice(0, 2).join('').toUpperCase();
      const roleControl = isAdmin && !isOwner
        ? `<form method="POST" action="/api/team/role" style="display:flex;gap:6px;align-items:center">
            <input type="hidden" name="user_id" value="${m.user_id}">
            <select name="role" class="team-select" onchange="this.form.submit()">
              ${VALID_ROLES.map(r => `<option value="${r}"${r === m.role ? ' selected' : ''}>${r.charAt(0).toUpperCase() + r.slice(1)}</option>`).join('')}
            </select>
          </form>`
        : roleBadge(m.role);
      const removeBtn = (isAdmin && !isSelf && !isOwner)
        ? `<form method="POST" action="/api/team/remove" onsubmit="return confirm('Remove ${htmxEsc(m.name)} from this business?')" style="display:inline">
            <input type="hidden" name="user_id" value="${m.user_id}">
            <button type="submit" class="btn btn-ghost btn-sm">Remove</button>
          </form>`
        : '';
      return `<div class="team-row">
  <div class="team-ava">${htmxEsc(initials)}</div>
  <div class="team-meta"><div class="team-name">${htmxEsc(m.name)}${youTag}${ownerTag}</div><div class="team-email">${htmxEsc(m.email || '—')}</div></div>
  <div class="team-actions">${roleControl}${removeBtn}</div>
</div>`;
    }).join('');

    const inviteBlock = isAdmin ? `<div class="card" style="margin-top:24px">
  <h3 style="margin:0 0 14px">Invite a team member</h3>
  <form method="POST" action="/api/team/invite" class="invite-form">
    <div><label style="display:block;font-size:.72rem;font-family:var(--font-mono);color:var(--text-muted);margin-bottom:6px;text-transform:uppercase;letter-spacing:.06em">Email</label><input type="email" name="email" required placeholder="teammate@example.com" style="width:100%;box-sizing:border-box"></div>
    <div><label style="display:block;font-size:.72rem;font-family:var(--font-mono);color:var(--text-muted);margin-bottom:6px;text-transform:uppercase;letter-spacing:.06em">Role</label>
      <select name="role" class="team-select">${VALID_ROLES.map(r => `<option value="${r}"${r === 'employee' ? ' selected' : ''}>${r.charAt(0).toUpperCase() + r.slice(1)}</option>`).join('')}</select></div>
    <button type="submit" class="btn btn-amber" style="justify-content:center">Send invite</button>
  </form>
</div>` : '<p style="color:var(--text-muted);font-size:.9em;margin-top:18px">Only admins can invite members or change roles.</p>';

    const inviteList = (invites && invites.length) ? `<div style="margin-top:22px"><h3>Pending invites</h3>
${invites.map(iv => `<div class="team-row" style="padding:12px 22px"><div class="team-meta"><div class="team-name">${htmxEsc(iv.email)}</div><div class="team-email">Invited · ${roleBadge(iv.role)}</div></div>${isAdmin ? `<form method="POST" action="/api/team/revoke"><input type="hidden" name="token" value="${htmxEsc(iv.token)}"><button type="submit" class="btn btn-ghost btn-sm">Revoke</button></form>` : ''}</div>`).join('')}
</div>` : '';

    const body = `<div class="app">${sidebarNav('team', undefined, ctx)}<div class="content">
<span class="eyebrow">Team</span>
<h1>Team <em>members</em></h1>
<p class="sub">Manage who can access <strong style="color:var(--text-primary)">${bName}</strong>.</p>
${TEAM_STYLE}
${inviteBlock}
<div class="team-card">${rows || '<div class="team-row" style="color:var(--text-muted)">No members yet.</div>'}</div>
${inviteList}
</div></div>`;
    return new Response(simpleShell('Team', body), { headers: { 'Content-Type': 'text/html' } });
  } catch (e) {
    console.error('Team htmx error:', e);
    return new Response(simpleShell('Error', '<h1>⚠️ Error</h1><p style="color:#f85149">Could not load the team page.</p>'), { headers: { 'Content-Type': 'text/html' }, status: 500 });
  }
}

// Resolve the caller's context for a /api/team/* POST (cookie auth) and verify
// they're an admin of the active business. Returns { ctx } or an error Response.
async function requireTeamAdmin(request, env) {
  const uid = await getUidFromSessionCookie(request, env);
  if (!uid) return { error: json({ ok: false, error: 'Not logged in' }, { status: 401 }) };
  const ctx = await resolveContext(request, env, uid);
  if (ctx.role !== 'admin') {
    return { error: json({ ok: false, error: 'Admin access required' }, { status: 403 }) };
  }
  return { ctx };
}

// POST /api/team/invite { email, role } (form or JSON). Creates a team_invites
// row; if the email matches an existing user, also creates the user_roles row
// immediately so they see the business on next login. Sends the invite email.
async function handleTeamInvite(request, env, ctx) {
  let email = '', role = 'employee';
  const ct = request.headers.get('Content-Type') || '';
  try {
    if (ct.includes('application/json')) {
      const b = await request.json();
      email = (b.email || '').trim().toLowerCase();
      role = (b.role || 'employee').toLowerCase();
    } else {
      const f = await request.formData();
      email = (f.get('email') || '').trim().toLowerCase();
      role = (f.get('role') || 'employee').trim().toLowerCase();
    }
  } catch (e) { return json({ ok: false, error: 'Invalid request' }, { status: 400 }); }
  if (!email || !email.includes('@')) return json({ ok: false, error: 'A valid email is required' }, { status: 400 });
  if (!VALID_ROLES.includes(role)) return json({ ok: false, error: 'Invalid role' }, { status: 400 });

  const bid = ctx.bid;
  const now = nowISO();
  // Don't create a duplicate role row.
  const existing = await env.DB.prepare(
    'SELECT user_id FROM user_roles WHERE user_id = (SELECT id FROM users WHERE email = ?) AND business_id = ?'
  ).bind(email, bid).first();

  let linkedUser = await env.DB.prepare('SELECT id FROM users WHERE email = ?').bind(email).first();
  if (linkedUser && !existing) {
    await env.DB.prepare(
      'INSERT OR IGNORE INTO user_roles (user_id, business_id, role, invited_by, created_at) VALUES (?, ?, ?, ?, ?)'
    ).bind(linkedUser.id, bid, role, ctx.uid, now).run();
  } else if (linkedUser && existing) {
    // Already a member — bump their role to the invited one.
    await env.DB.prepare(
      'UPDATE user_roles SET role = ? WHERE user_id = ? AND business_id = ?'
    ).bind(role, linkedUser.id, bid).run();
  }

  // Always record an invite row (tracks the outstanding email + token).
  const token = crypto.randomUUID();
  await env.DB.prepare(
    'INSERT OR REPLACE INTO team_invites (token, business_id, email, role, invited_by, created_at, status) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).bind(token, bid, email, role, ctx.uid, now, 'pending').run();

  // Best-effort invite email. Never block the response on it.
  const bNameRow = await env.DB.prepare('SELECT business_name FROM settings WHERE user_id = ?').bind(bid).first();
  const bName = (bNameRow && bNameRow.business_name) || 'Branch Live';
  const signupLink = 'https://branchlive.com/signup?invite=' + token + '&email=' + encodeURIComponent(email);
  const loginLink = 'https://branchlive-portal.shane-f58.workers.dev/login-htmx?next=/p/overview';
  const bodyHtml = linkedUser
    ? `<p style="color:#94a3b8;font-size:15px;line-height:1.6;margin:0 0 16px;text-align:center;">You've been added to <strong style="color:#f1f5f9">${escapeHtml(bName)}</strong> on Branch Live as a <strong style="color:#f1f5f9">${role}</strong>. Sign in to see it in your dashboard.</p>
       <div style="text-align:center;margin-bottom:8px;"><a href="${loginLink}" style="display:inline-block;background-color:#8b5cf6;color:#fff;text-decoration:none;padding:14px 36px;border-radius:8px;font-weight:600;font-size:15px;">Sign in →</a></div>`
    : `<p style="color:#94a3b8;font-size:15px;line-height:1.6;margin:0 0 16px;text-align:center;">You've been added to <strong style="color:#f1f5f9">${escapeHtml(bName)}</strong> on Branch Live as a <strong style="color:#f1f5f9">${role}</strong>. Create your account to get started.</p>
       <div style="text-align:center;margin-bottom:8px;"><a href="${signupLink}" style="display:inline-block;background-color:#8b5cf6;color:#fff;text-decoration:none;padding:14px 36px;border-radius:8px;font-weight:600;font-size:15px;">Create account →</a></div>`;
  sendEmail(env, { to: email, subject: `You've been added to ${bName} on Branch Live`, html: emailShell(bodyHtml) }).catch(e => console.error('invite email:', e.message));

  return json({ ok: true });
}

// POST /api/team/role { user_id, role }. Update one member's role. Refuses to
// demote the sole admin (would orphan the business) and refuses the owner row.
async function handleTeamRole(request, env, ctx) {
  const ct = request.headers.get('Content-Type') || '';
  let userId, role;
  try {
    if (ct.includes('application/json')) { const b = await request.json(); userId = parseInt(b.user_id, 10); role = (b.role || '').toLowerCase(); }
    else { const f = await request.formData(); userId = parseInt(f.get('user_id'), 10); role = (f.get('role') || '').trim().toLowerCase(); }
  } catch (e) { return json({ ok: false, error: 'Invalid request' }, { status: 400 }); }
  if (!userId) return json({ ok: false, error: 'user_id required' }, { status: 400 });
  if (!VALID_ROLES.includes(role)) return json({ ok: false, error: 'Invalid role' }, { status: 400 });
  if (userId === ctx.bid) return json({ ok: false, error: 'Cannot change the owner role' }, { status: 400 });

  const bid = ctx.bid;
  // Refuse to demote the last admin.
  if (role !== 'admin') {
    const cnt = await env.DB.prepare(
      "SELECT COUNT(*) AS c FROM user_roles WHERE business_id = ? AND role = 'admin'"
    ).bind(bid).first();
    const target = await env.DB.prepare(
      'SELECT role FROM user_roles WHERE user_id = ? AND business_id = ?'
    ).bind(userId, bid).first();
    if ((cnt && cnt.c) <= 1 && target && target.role === 'admin') {
      return json({ ok: false, error: 'Cannot remove the last admin' }, { status: 400 });
    }
  }
  const res = await env.DB.prepare(
    'UPDATE user_roles SET role = ? WHERE user_id = ? AND business_id = ?'
  ).bind(role, userId, bid).run();
  if (!res.meta || res.meta.changes === 0) return json({ ok: false, error: 'Member not found' }, { status: 404 });
  return json({ ok: true });
}

// POST /api/team/remove { user_id }. Delete the membership. Refuses the owner
// and the last admin (self-lockout guard).
async function handleTeamRemove(request, env, ctx) {
  const ct = request.headers.get('Content-Type') || '';
  let userId;
  try {
    if (ct.includes('application/json')) { const b = await request.json(); userId = parseInt(b.user_id, 10); }
    else { const f = await request.formData(); userId = parseInt(f.get('user_id'), 10); }
  } catch (e) { return json({ ok: false, error: 'Invalid request' }, { status: 400 }); }
  if (!userId) return json({ ok: false, error: 'user_id required' }, { status: 400 });
  if (userId === ctx.uid) return json({ ok: false, error: 'Cannot remove yourself' }, { status: 400 });
  if (userId === ctx.bid) return json({ ok: false, error: 'Cannot remove the owner' }, { status: 400 });

  const bid = ctx.bid;
  const target = await env.DB.prepare(
    'SELECT role FROM user_roles WHERE user_id = ? AND business_id = ?'
  ).bind(userId, bid).first();
  if (!target) return json({ ok: false, error: 'Member not found' }, { status: 404 });
  if (target.role === 'admin') {
    const cnt = await env.DB.prepare(
      "SELECT COUNT(*) AS c FROM user_roles WHERE business_id = ? AND role = 'admin'"
    ).bind(bid).first();
    if ((cnt && cnt.c) <= 1) return json({ ok: false, error: 'Cannot remove the last admin' }, { status: 400 });
  }
  await env.DB.prepare(
    'DELETE FROM user_roles WHERE user_id = ? AND business_id = ?'
  ).bind(userId, bid).run();
  return json({ ok: true });
}

// POST /api/team/revoke { token }. Mark an outstanding invite as revoked.
async function handleTeamRevoke(request, env, ctx) {
  const ct = request.headers.get('Content-Type') || '';
  let token;
  try {
    if (ct.includes('application/json')) { const b = await request.json(); token = b.token; }
    else { const f = await request.formData(); token = f.get('token'); }
  } catch (e) { return json({ ok: false, error: 'Invalid request' }, { status: 400 }); }
  if (!token) return json({ ok: false, error: 'token required' }, { status: 400 });
  await env.DB.prepare(
    "UPDATE team_invites SET status = 'revoked' WHERE token = ? AND business_id = ?"
  ).bind(token, ctx.bid).run();
  return json({ ok: true });
}

// POST /api/team/switch { business_id }. Sets the bl_business_id cookie and
// redirects back to /p/overview. Used by the top-nav switcher dropdown.
async function handleTeamSwitch(request, env) {
  const uid = await getUidFromSessionCookie(request, env);
  if (!uid) return new Response(null, { status: 302, headers: { Location: '/login-htmx' } });
  let bid;
  try {
    const f = await request.formData();
    bid = parseInt(f.get('business_id'), 10);
  } catch (e) { return new Response(null, { status: 302, headers: { Location: '/p/overview' } }); }
  // Verify membership before accepting the switch.
  if (bid) {
    const member = await env.DB.prepare(
      'SELECT user_id FROM user_roles WHERE user_id = ? AND business_id = ?'
    ).bind(uid, bid).first();
    if (member) {
      const cookie = `bl_business_id=${bid}; Path=/; HttpOnly; SameSite=Lax; Max-Age=31536000`;
      return new Response(null, { status: 302, headers: { Location: '/p/overview', 'Set-Cookie': cookie } });
    }
  }
  // Invalid switch → clear the cookie + go to overview.
  const clear = 'bl_business_id=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0';
  return new Response(null, { status: 302, headers: { Location: '/p/overview', 'Set-Cookie': clear } });
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
      html: emailShell(`<p style="color:#f1f5f9;font-size:15px;line-height:1.6;white-space:pre-wrap;">${escapeHtml(body.body)}</p>`),
      uid
    });

    if (sent.ok) {
      return json({ ok: true });
    } else {
      return apiError(sent.error || 'Email could not be sent. Please try again.', 500);
    }
  } catch (e) {
    console.error('Email send error:', e);
    return apiError('Could not send email', 500);
  }
}

// ═══════════════════════════════════════════════════════════════════════
// GMAIL OAUTH
// ═══════════════════════════════════════════════════════════════════════

async function handleGmailAuth(request, env, uid) {
  const clientId = env.GOOGLE_CLIENT_ID;
  if (!clientId) return apiError('GOOGLE_CLIENT_ID not configured', 500);
  const redirectUri = 'https://branchlive-portal.shane-f58.workers.dev/api/gmail/callback';
  const scope = 'https://www.googleapis.com/auth/gmail.send';
  const state = btoa(JSON.stringify({ uid, ts: Date.now() }));
  const url = 'https://accounts.google.com/o/oauth2/v2/auth?' +
    `client_id=${encodeURIComponent(clientId)}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    '&response_type=code' +
    `&scope=${encodeURIComponent(scope)}` +
    '&access_type=offline' +
    '&prompt=consent' +
    `&state=${encodeURIComponent(state)}`;
  return Response.redirect(url, 302);
}

async function handleGmailCallback(request, env) {
  try {
    const url = new URL(request.url);
    const code = url.searchParams.get('code');
    const stateRaw = url.searchParams.get('state');
    if (!code || !stateRaw) return new Response('Missing code or state', { status: 400 });

    let state;
    try { state = JSON.parse(atob(stateRaw)); } catch (e) { return new Response('Invalid state', { status: 400 }); }
    const uid = state.uid;

    const clientId = env.GOOGLE_CLIENT_ID;
    const clientSecret = env.GOOGLE_CLIENT_SECRET;
    if (!clientId || !clientSecret) return new Response('OAuth not configured', { status: 500 });

    // Exchange code for tokens
    const tokenResp = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: 'https://branchlive-portal.shane-f58.workers.dev/api/gmail/callback',
        grant_type: 'authorization_code'
      }).toString()
    });
    const tokenData = await tokenResp.json();
    if (tokenData.error) {
      return new Response(`Google said: ${tokenData.error} — ${tokenData.error_description || ''}`, { status: 400 });
    }

    // Get email address from Google
    const profileResp = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { 'Authorization': `Bearer ${tokenData.access_token}` }
    });
    const profile = await profileResp.json();
    const email = profile.email || '';

    // Store tokens in settings
    await env.DB.prepare(
      'UPDATE settings SET gmail_email = ?, gmail_refresh_token = ? WHERE user_id = ?'
    ).bind(email, tokenData.refresh_token || '', uid).run();

    return new Response(
      '<html><body style="font-family:Inter,sans-serif;background:#06060c;color:#f1f5f9;display:flex;align-items:center;justify-content:center;height:100vh;text-align:center"><div><h1 style="color:#00d4aa">✅ Gmail Connected!</h1><p style="color:#94a3b8">' + email + '</p><p style="color:#6b7d95">You can close this window. Emails will now send from your address.</p></div></body></html>',
      { headers: { 'Content-Type': 'text/html' } }
    );
  } catch (e) {
    console.error('Gmail callback error:', e);
    return new Response('OAuth failed. Please try again.', { status: 500 });
  }
}

async function handleGmailStatus(request, env, uid) {
  const row = await env.DB.prepare(
    'SELECT gmail_email, gmail_refresh_token FROM settings WHERE user_id = ?'
  ).bind(uid).first();
  const connected = !!(row && row.gmail_refresh_token);
  return json({ connected, email: row?.gmail_email || '' });
}

async function handleGmailDisconnect(request, env, uid) {
  await env.DB.prepare(
    'UPDATE settings SET gmail_email = \'\', gmail_refresh_token = \'\' WHERE user_id = ?'
  ).bind(uid).run();
  return json({ ok: true });
}

// ── Cookie-authed Gmail wrappers for the HTMX settings page ──
// The settings page is cookie-authed (bl_session), but the Gmail endpoints
// above are Bearer-only. These -htmx variants resolve the user from the
// session cookie so the settings card works without a client-side token.
// auth-htmx    → resolves uid, then runs the same OAuth redirect as handleGmailAuth
// status-htmx  → { connected, email } for the same signed-in user
// disconnect-htmx → clears tokens, returns { ok }
async function handleGmailAuthHtmx(request, env) {
  const uid = await getUidFromSessionCookie(request, env);
  if (!uid) return json({ ok: false, error: 'Not logged in' }, 401);
  return handleGmailAuth(request, env, uid);
}

async function handleGmailStatusHtmx(request, env) {
  const uid = await getUidFromSessionCookie(request, env);
  if (!uid) return json({ ok: false, error: 'Not logged in' }, 401);
  return handleGmailStatus(request, env, uid);
}

async function handleGmailDisconnectHtmx(request, env) {
  const uid = await getUidFromSessionCookie(request, env);
  if (!uid) return json({ ok: false, error: 'Not logged in' }, 401);
  return handleGmailDisconnect(request, env, uid);
}

// Send email via Gmail API using stored refresh token
async function sendViaGmail(env, uid, { to, subject, html }) {
  const row = await env.DB.prepare(
    'SELECT gmail_email, gmail_refresh_token FROM settings WHERE user_id = ?'
  ).bind(uid).first();
  if (!row || !row.gmail_refresh_token) return { ok: false, error: 'Gmail not connected' };

  try {
    // Refresh access token
    const tokenResp = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: env.GOOGLE_CLIENT_ID,
        client_secret: env.GOOGLE_CLIENT_SECRET,
        refresh_token: row.gmail_refresh_token,
        grant_type: 'refresh_token'
      }).toString()
    });
    const tokenData = await tokenResp.json();
    if (tokenData.error) {
      // Refresh token expired — clear it
      await env.DB.prepare('UPDATE settings SET gmail_refresh_token = \'\' WHERE user_id = ?').bind(uid).run();
      return { ok: false, error: 'Gmail connection expired. Please reconnect in Settings.' };
    }

    // Build RFC 2822 email
    const raw = [
      `From: ${row.gmail_email}`,
      `To: ${to}`,
      `Subject: =?UTF-8?B?${btoa(unescape(encodeURIComponent(subject)))}?=`,
      'MIME-Version: 1.0',
      'Content-Type: text/html; charset=UTF-8',
      '',
      html
    ].join(String.fromCharCode(13,10));
    const encoded = btoa(unescape(encodeURIComponent(raw))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

    const resp = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ raw: encoded })
    });
    const data = await resp.json();
    if (resp.ok) return { ok: true, id: data.id };
    return { ok: false, error: `Gmail: ${data.error?.message || 'Unknown error'}` };
  } catch (e) {
    return { ok: false, error: 'Gmail send failed' };
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
// VAPI — AI VOICE (replaces Twilio voice)
// Vapi handles the phone number + the AI voice (Emma) in one API. No A2P
// review and no separate STT/TTS pipeline. Flow:
//   1. Provision an Assistant (Emma) from the business's settings + a
//      Vapi-provisioned phone number bound to it, both pointing their
//      serverUrl at /api/vapi/call-webhook.
//   2. Inbound calls → Vapi runs Emma → posts an end-of-call-report here →
//      we capture caller/transcript/lead details and write a lead + call log.
//   3. Outbound calls (POST /api/vapi/call) → Emma calls the customer.
// Auth: env.VAPI_API_KEY. Webhooks are validated with x-vapi-secret.
// ═══════════════════════════════════════════════════════════════════════

// Default voice/model for the Emma assistant. 11labs "Rachel" is a warm,
// professional female voice; gpt-4o is a solid default reasoning model.
const VAPI_DEFAULTS = {
  voiceProvider: '11labs',
  voiceId: '21m00Tcm4TlvDq8ikWAM', // 11labs "Rachel"
  modelProvider: 'openai',
  model: 'gpt-4o',
};

// Thin, never-throws wrapper around the Vapi REST API. Always returns
// { ok, data?, error?, status? }. Bearer auth via env.VAPI_API_KEY.
async function vapiRequest(env, path, opts = {}) {
  if (!env.VAPI_API_KEY) {
    return { ok: false, error: 'VAPI_API_KEY not configured', status: 0 };
  }
  try {
    const res = await fetch(`https://api.vapi.ai${path}`, {
      method: opts.method || 'GET',
      headers: {
        'Authorization': `Bearer ${env.VAPI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: opts.body ? JSON.stringify(opts.body) : undefined,
    });
    const text = await res.text();
    let parsed = null;
    try { parsed = JSON.parse(text); } catch (e) {}
    if (!res.ok) {
      const err = (parsed && (parsed.message || parsed.error))
        ? `${parsed.message || parsed.error} (HTTP ${res.status})`
        : `Vapi error HTTP ${res.status}: ${text.slice(0, 200)}`;
      return { ok: false, error: err, status: res.status, data: parsed };
    }
    return { ok: true, data: parsed, status: res.status };
  } catch (e) {
    console.error('Vapi request failed:', e);
    return { ok: false, error: String(e && e.message || e), status: 0 };
  }
}

// Build the serverUrl for this Worker. Used for the assistant/phone-number
// webhook target so Vapi posts call events back here. Falls back to the
// deployed Worker URL if no explicit origin is configured.
function vapiServerUrl(env) {
  if (env.VAPI_SERVER_URL) return env.VAPI_SERVER_URL.replace(/\/$/, '');
  return 'https://branchlive-portal.shane-f58.workers.dev/api/vapi/call-webhook';
}

// Compose Emma's system prompt from the business's settings, mirroring the
// brief the onboarding flow uses. Defaults keep it usable before onboarding.
function emmaSystemPrompt(s) {
  const name = (s && s.business_name) || 'this business';
  const industry = (s && s.industry) || 'home services';
  const area = (s && s.service_area) || 'our service area';
  const desc = (s && s.service_description) || '';
  return `You are Emma, the AI receptionist for ${name}, a ${industry} company serving ${area}. Be warm, professional, and efficient. Book appointments, capture lead details (name, phone, email, job, urgency), and answer questions about services from the knowledge base.${desc ? ` Services: ${desc}` : ''} Always collect the caller's name, callback number, email address, what they need done, and how urgent it is before ending the call. If they don't want to share their email, that's fine — move on.`;
}

function emmaFirstMessage(s) {
  const name = (s && s.business_name) || 'us';
  return `Hello, this is Emma with ${name}. How can I help you today?`;
}

// Extract a US area code from the business's forwarding number (the "call us"
// number set during signup/onboarding). Falls back to 717 (Lancaster, PA — the
// demo/default market) when the field is empty or has no usable digits. Vapi's
// POST /phone-number requires areaCode (3 digits) to pick a region for the
// number it provisions. Never throws; always returns a 3-digit string.
function extractAreaCode(settings) {
  const digits = String((settings && settings.forwarding_number) || '').replace(/[^0-9]/g, '');
  let code = '';
  // US numbers are NPA-NXX-XXXX = 10 digits, optionally a leading country-code 1
  // (11 digits). The area code (NPA) is the first 3 digits of the 10-digit core.
  if (digits.length === 11 && digits[0] === '1') {
    code = digits.slice(1, 4);   // 1 (717) 341-5677 → 717
  } else if (digits.length === 10) {
    code = digits.slice(0, 3);   // (415) 555-1234 → 415
  }
  // 7-digit locals and anything else have no reliable area code → default.
  return /^\d{3}$/.test(code) ? code : '717';
}

// Detect an existing Vapi phone number + assistant we can reuse, instead of
// always provisioning a fresh one. Called at the top of vapiProvision. Logic:
//   1. GET /phone-number (all numbers on this Vapi account).
//   2. Prefer a number whose id matches settings.vapi_phone_number_id.
//   3. Else pick the first number bound to an "Emma" assistant (the assistant
//      we provision for every business). This reclaims a number created in the
//      Vapi dashboard or by a prior provision whose id we never stored.
// Returns { ok:true, assistant_id, phone_number, phone_number_id } when a
// reusable number is found, or { ok:false } (no error) to signal "provision
// fresh". Never throws.
async function detectExistingVapiNumber(env, settings) {
  if (!env.VAPI_API_KEY) return { ok: false };
  const list = await vapiRequest(env, '/phone-number');
  if (!list.ok || !Array.isArray(list.data)) return { ok: false };
  const storedId = settings && settings.vapi_phone_number_id;
  // 1. exact id match
  let match = storedId ? list.data.find(p => p.id === storedId) : null;
  // 2. any number bound to an Emma assistant
  if (!match) {
    match = list.data.find(p => {
      const asst = p.assistant || {};
      const name = String(asst.name || p.name || '');
      return /emma/i.test(name) && p.number && p.id;
    });
  }
  if (!match) return { ok: false };
  return {
    ok: true,
    phone_number: match.number,
    phone_number_id: match.id,
    // Vapi nests the bound assistant under .assistant; fall back gracefully.
    assistant_id: (match.assistant && match.assistant.id) || null,
  };
}

// Provision (or re-provision) the Vapi Assistant + phone number for one
// business. Idempotent-ish: reuses an existing assistant_id when present,
// otherwise creates one, then (re)creates the phone number bound to it.
// Returns { ok, assistant_id, phone_number, phone_number_id }.
async function vapiProvision(env, settings) {
  // 0. Detect — if there's already a usable Vapi number (one we stored, or any
  //    number bound to an Emma assistant), reuse it instead of buying a new
  //    one. This both avoids re-provisioning and dodges area-code stock issues.
  const existing = await detectExistingVapiNumber(env, settings);
  if (existing.ok) {
    console.log('Vapi: reusing existing number', existing.phone_number);
    return existing;
  }

  // 1. Assistant — create or update.
  let assistantId = settings && settings.vapi_assistant_id;
  const assistantBody = {
    name: 'Emma',
    firstMessage: emmaFirstMessage(settings),
    model: {
      provider: VAPI_DEFAULTS.modelProvider,
      model: VAPI_DEFAULTS.model,
      messages: [
        { role: 'system', content: emmaSystemPrompt(settings) },
      ],
    },
    voice: {
      provider: VAPI_DEFAULTS.voiceProvider,
      voiceId: VAPI_DEFAULTS.voiceId,
    },
    serverUrl: vapiServerUrl(env),
  };
  if (assistantId) {
    const upd = await vapiRequest(env, `/assistant/${assistantId}`, {
      method: 'PATCH', body: assistantBody,
    });
    if (!upd.ok) {
      // Stale id (assistant deleted in Vapi dashboard) — recreate.
      console.log('Vapi assistant update failed, recreating:', upd.error);
      assistantId = null;
    }
  }
  if (!assistantId) {
    const created = await vapiRequest(env, '/assistant', {
      method: 'POST', body: assistantBody,
    });
    if (!created.ok) return { ok: false, error: `Assistant: ${created.error}` };
    assistantId = created.data.id;
  }

  // 2. Phone number — Vapi provisions a US number for the requested area code.
  //    We bind it to Emma so inbound calls answer with her and post events to
  //    our serverUrl. numberDesiredAreaCode is the 3-digit NPA Vapi asks for
  //    (see POST /phone-number); it comes from the business's forwarding
  //    number, defaulting to 717 (Lancaster, PA).
  const areaCode = extractAreaCode(settings);
  const phoneBody = {
    provider: 'vapi',
    name: `Emma — ${(settings && settings.business_name) || 'Branch Live'}`,
    numberDesiredAreaCode: areaCode,
    assistantId,
    serverUrl: vapiServerUrl(env),
  };
  if (env.VAPI_WEBHOOK_SECRET) phoneBody.serverUrlSecret = env.VAPI_WEBHOOK_SECRET;
  const phone = await vapiRequest(env, '/phone-number', {
    method: 'POST', body: phoneBody,
  });
  if (!phone.ok) return { ok: false, error: `Phone number: ${phone.error}` };

  return {
    ok: true,
    assistant_id: assistantId,
    phone_number: phone.data.number || '',
    phone_number_id: phone.data.id,
  };
}

// Release the Vapi phone number for a business (the "OFF" action). Calls
// DELETE /phone-number/{id} on Vapi (https://docs.vapi.ai/api-reference/
// phone-numbers/delete) — this is IRREVERSIBLE: the number is destroyed and a
// later re-provision yields a different number. We keep the assistant (Emma)
// so a re-provision doesn't have to rebuild her. Caller is responsible for
// persisting the cleared ids after this returns ok. Never throws.
// Returns { ok, error?, released_number? }.
async function vapiDeprovision(env, settings) {
  const numberId = settings && settings.vapi_phone_number_id;
  if (!numberId) {
    // Nothing to release — treat as already-off so the UI idempotently clears.
    return { ok: true, released_number: null };
  }
  if (!env.VAPI_API_KEY) {
    return { ok: false, error: 'VAPI_API_KEY not configured' };
  }
  const del = await vapiRequest(env, `/phone-number/${numberId}`, { method: 'DELETE' });
  if (!del.ok) {
    // 404 = already gone on Vapi's side; still clear locally so the UI is honest.
    if (del.status === 404) return { ok: true, released_number: settings.vapi_phone_number || null };
    return { ok: false, error: `Phone number release: ${del.error}` };
  }
  return { ok: true, released_number: settings.vapi_phone_number || null };
}

// POST /api/vapi/provision (auth required)
// Provisions/re-provisions the assistant + phone number and persists the ids.
async function handleVapiProvision(request, env, uid) {
  try {
    const settings = await env.DB.prepare(
      'SELECT * FROM settings WHERE user_id = ?'
    ).bind(uid).first();
    if (!env.VAPI_API_KEY) {
      return apiError('VAPI_API_KEY is not configured on the server', 500);
    }
    const result = await vapiProvision(env, settings || {});
    if (!result.ok) {
      return apiError(result.error || 'Vapi provisioning failed', 500);
    }
    await env.DB.prepare(
      `UPDATE settings SET
        vapi_assistant_id = ?,
        vapi_phone_number = ?,
        vapi_phone_number_id = ?
       WHERE user_id = ?`
    ).bind(result.assistant_id, result.phone_number, result.phone_number_id, uid).run();
    return json({
      ok: true,
      phone_number: result.phone_number,
      assistant_id: result.assistant_id,
    });
  } catch (e) {
    console.error('Vapi provision error:', e);
    return apiError('Could not provision Vapi', 500);
  }
}

// ── Cookie-authed Vapi endpoints for the HTMX settings page ───────────
// These mirror /api/vapi/provision (ON) but authenticate via the bl_session
// cookie (getUidFromSessionCookie) instead of a Bearer token, since the
// HTMX pages have no client-side token. They reuse the SAME provision /
// deprovision cores and persistence as the JSON API — no logic duplicated.
// POST /api/vapi/provision-htmx   → turn Emma ON (provision number)
// POST /api/vapi/deprovision-htmx → turn Emma OFF (release number)

async function handleVapiProvisionHtmx(request, env) {
  const uid = await getUidFromSessionCookie(request, env);
  if (!uid) return json({ ok: false, error: 'Not signed in' }, 401);
  try {
    const settings = await env.DB.prepare('SELECT * FROM settings WHERE user_id = ?').bind(uid).first();
    if (!env.VAPI_API_KEY) return json({ ok: false, error: 'VAPI_API_KEY is not configured on the server' }, 500);
    const result = await vapiProvision(env, settings || {});
    if (!result.ok) return json({ ok: false, error: result.error || 'Provisioning failed' }, 500);
    await env.DB.prepare(
      `UPDATE settings SET
        vapi_assistant_id = ?, vapi_phone_number = ?, vapi_phone_number_id = ?
       WHERE user_id = ?`
    ).bind(result.assistant_id, result.phone_number, result.phone_number_id, uid).run();
    return json({ ok: true, phone_number: result.phone_number });
  } catch (e) {
    console.error('Vapi provision-htmx error:', e);
    return json({ ok: false, error: 'Could not provision Vapi' }, 500);
  }
}

async function handleVapiDeprovisionHtmx(request, env) {
  const uid = await getUidFromSessionCookie(request, env);
  if (!uid) return json({ ok: false, error: 'Not signed in' }, 401);
  try {
    const settings = await env.DB.prepare('SELECT * FROM settings WHERE user_id = ?').bind(uid).first();
    // If there's no number to release, succeed idempotently WITHOUT requiring
    // the API key — the user is just turning off an already-off switch.
    if (!settings || !settings.vapi_phone_number_id) {
      return json({ ok: true, released_number: null });
    }
    if (!env.VAPI_API_KEY) return json({ ok: false, error: 'VAPI_API_KEY is not configured on the server' }, 500);
    const result = await vapiDeprovision(env, settings || {});
    if (!result.ok) return json({ ok: false, error: result.error || 'Deprovisioning failed' }, 500);
    // Clear the stored number/number_id; keep the assistant so a re-provision
    // is fast and Emma keeps her identity.
    await env.DB.prepare(
      `UPDATE settings SET vapi_phone_number = NULL, vapi_phone_number_id = NULL WHERE user_id = ?`
    ).bind(uid).run();
    return json({ ok: true, released_number: result.released_number || null });
  } catch (e) {
    console.error('Vapi deprovision-htmx error:', e);
    return json({ ok: false, error: 'Could not release phone number' }, 500);
  }
}

// Look up which business (user_id) a Vapi call belongs to. We match by the
// assistantId or phoneNumberId recorded against a settings row, since those
// are unique per business. Returns { uid, settings } or null.
async function resolveVapiOwner(env, message) {
  const assistantId = message.assistant && message.assistant.id;
  const phoneNumberId = message.phoneNumber && message.phoneNumber.id;
  let row = null;
  if (assistantId) {
    row = await env.DB.prepare(
      'SELECT * FROM settings WHERE vapi_assistant_id = ?'
    ).bind(assistantId).first();
  }
  if (!row && phoneNumberId) {
    row = await env.DB.prepare(
      'SELECT * FROM settings WHERE vapi_phone_number_id = ?'
    ).bind(phoneNumberId).first();
  }
  return row ? { uid: row.user_id, settings: row } : null;
}

// Extract a human-readable lead record from a completed call: caller number,
// name, the job, urgency, and a transcript. Vapi puts the transcript in
// artifact.transcript and a summary in analysis.summary; name/job/urgency
// come from the transcript summary when structuredData isn't configured.
function extractLeadFromVapiCall(message) {
  const callerPhone = (message.customer && message.customer.number)
    || (message.call && message.call.customer && message.call.customer.number)
    || '';
  const artifact = message.artifact || {};
  const analysis = message.analysis || {};
  const transcript = artifact.transcript || '';
  const summary = (analysis.summary || '').trim();
  const structured = analysis.structuredData || {};
  const callerName = structured.name || structured.caller_name || '';
  const jobDetails = structured.job || structured.job_details || summary || '';
  let urgency = structured.urgency || '';
  if (!urgency && /\bemergency|urgent|asap|right away|flooding|burst|no heat|no ac|sparking\b/i.test(summary + ' ' + transcript)) {
    urgency = 'high';
  } else if (!urgency) {
    urgency = 'medium';
  }
  return { callerPhone, callerName, jobDetails, urgency, summary, transcript };
}

// POST /api/vapi/call-webhook (PUBLIC — validated by x-vapi-secret)
// Vapi posts call events here. We only act on end-of-call-report (a finished
// call): resolve the owner business, create a lead, and log the call. All
// other event types are acknowledged with 200 and otherwise ignored.
async function handleVapiWebhook(request, env) {
  // Validate the shared secret Vapi sends on every webhook.
  if (env.VAPI_WEBHOOK_SECRET) {
    const sent = request.headers.get('x-vapi-secret');
    if (sent !== env.VAPI_WEBHOOK_SECRET) {
      return apiError('Unauthorized', 401);
    }
  }
  let payload;
  try {
    payload = await request.json();
  } catch (e) {
    return apiError('Invalid JSON body', 400);
  }
  const message = payload.message || payload;
  const type = message.type;
  console.log('Vapi webhook:', type);

  // Only completed calls create leads / call logs. Other events are ack'd.
  if (type !== 'end-of-call-report') {
    return json({ ok: true });
  }

  try {
    const owner = await resolveVapiOwner(env, message);
    if (!owner) {
      // No matching business — likely a call on a number we don't manage.
      console.log('Vapi webhook: no owner for assistantId/phoneNumberId');
      return json({ ok: true });
    }
    const { uid, settings } = owner;
    const lead = extractLeadFromVapiCall(message);

    // Create the lead first (so the call log can reference it).
    const now = nowISO();
    const leadRes = await env.DB.prepare(
      'INSERT INTO leads VALUES(NULL, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    ).bind(
      uid, lead.callerName, lead.callerPhone, '', lead.jobDetails,
      lead.urgency, 'new', lead.transcript, now, now
    ).run();
    const leadId = leadRes.meta && leadRes.meta.last_row_id;

    // Log the call against the lead.
    const durationSec = (message.call && message.call.durationSeconds)
      || (message.call && message.call.duration) || 0;
    await env.DB.prepare(
      'INSERT INTO call_logs VALUES(NULL, ?, ?, ?, ?, ?, ?, ?)'
    ).bind(uid, leadId, lead.callerPhone, durationSec, lead.summary || 'AI call completed', lead.transcript, now).run();

    // Phase 3 conversion: if this caller is a cold-outreach prospect we texted,
    // advance them to 'demo'. Best-effort, never blocks the webhook.
    await markProspectDemoIfTexted(env, lead.callerPhone);

    // Notify the business owner by email (best-effort, never fatal).
    try {
      const ownerUser = await env.DB.prepare(
        'SELECT email FROM users WHERE id = ?'
      ).bind(uid).first();
      if (ownerUser) {
        await sendEmail(env, {
          to: ownerUser.email,
          subject: `New Lead — ${lead.callerName || 'Caller'} (Emma)`,
          html: emailShell(leadNotificationEmailContent(
            lead.callerName, lead.callerPhone, '', lead.jobDetails, lead.urgency
          )),
        });
      }
    } catch (e) {
      console.error('Vapi lead notify error:', e.message);
    }

    return json({ ok: true, lead_id: leadId });
  } catch (e) {
    console.error('Vapi webhook error:', e);
    return apiError('Could not process webhook', 500);
  }
}

// POST /api/vapi/call (auth required) — body: { to_number, lead_id? }
// Emma calls the customer. Requires the business to have provisioned a
// number + assistant. Transcript/outcome are captured when Vapi posts the
// end-of-call-report back to /api/vapi/call-webhook.
async function handleVapiCall(request, env, uid) {
  try {
    const body = await request.json();
    if (!body.to_number) return apiError('"to_number" is required');
    const settings = await env.DB.prepare(
      'SELECT vapi_assistant_id, vapi_phone_number_id FROM settings WHERE user_id = ?'
    ).bind(uid).first();
    if (!settings || !settings.vapi_assistant_id || !settings.vapi_phone_number_id) {
      return apiError('Emma is not set up yet. Provision a phone number in Settings first.', 400);
    }
    const callBody = {
      assistantId: settings.vapi_assistant_id,
      phoneNumberId: settings.vapi_phone_number_id,
      customer: { number: body.to_number },
      // metadata round-trips into the webhook so we always know the owner.
      metadata: { uid: String(uid), lead_id: body.lead_id ? String(body.lead_id) : null },
    };
    const result = await vapiRequest(env, '/call', { method: 'POST', body: callBody });
    if (!result.ok) {
      return apiError(result.error || 'Vapi call failed', 500);
    }
    return json({ ok: true, call_id: result.data.id });
  } catch (e) {
    console.error('Vapi outbound call error:', e);
    return apiError('Could not place call', 500);
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

    const systemPrompt = `You are Emma AI, the official support assistant for Branch Live — an AI receptionist service for local businesses ($29.95/mo with a 30-day free trial, no credit card required to start).

You are helping a Branch Live customer named ${user ? user.name : 'there'} from "${businessName}". Their industry is "${industry}", they serve "${serviceArea}", their working hours are "${workingHours}", and their services include: "${serviceDesc}".

ABOUT BRANCH LIVE:
- Branch Live provides an AI receptionist named Emma that answers phone calls 24/7 for service businesses of all kinds.
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
      reply: `Sorry, something went wrong on my end. Here's a quick summary:\n\n• Branch Live is an AI receptionist for local businesses — $29.95/mo, 30-day free trial\n• Emma answers calls 24/7, captures leads, and books appointments\n• Access your dashboard at branchlive.com/dashboard\n• Support: hello@branchlive.com or (872) 829-1192\n\nWhat specific question can I help with?`
    });
  }
}

// ═══════════════════════════════════════════════════════════════════════
// SCOUT — in-dashboard AI assistant (POST /api/scout)
// ═══════════════════════════════════════════════════════════════════════
// Cookie-authed (the Scout panel lives on /p/* pages, no Bearer token).
// Accepts { question, page } and injects smart context (business name,
// industry, current page, recent activity) before calling DeepSeek Flash.
// Returns { answer }. Degrades gracefully — a canned, page-aware answer
// when DEEPSEEK_API_KEY is unset or the call fails, so Scout always replies.
async function handleScout(request, env, uid) {
  try {
    const body = await request.json().catch(() => ({}));
    const question = (body.question || '').trim();
    if (!question) return json({ ok: false, error: 'Question is required' }, 400);
    const page = (body.page || 'overview').trim();

    // ── Smart context: business name, industry, recent activity ──
    // One batched round-trip; each query is scoped to the owning account
    // (uid here is ctx.bid from the dispatcher, i.e. the business owner).
    const [settings, user, leadCounts, apptCounts, callStats] = await Promise.all([
      env.DB.prepare(
        'SELECT business_name, industry, working_hours, service_area, service_description FROM settings WHERE user_id = ?'
      ).bind(uid).first(),
      env.DB.prepare('SELECT name FROM users WHERE id = ?').bind(uid).first(),
      env.DB.prepare(
        `SELECT COUNT(*) AS total,
                SUM(CASE WHEN status='new' THEN 1 ELSE 0 END) AS new_leads,
                SUM(CASE WHEN status='booked' THEN 1 ELSE 0 END) AS booked
         FROM leads WHERE user_id = ?`
      ).bind(uid).first(),
      env.DB.prepare(
        `SELECT COUNT(*) AS total,
                SUM(CASE WHEN date >= date('now') THEN 1 ELSE 0 END) AS upcoming
         FROM appointments WHERE user_id = ? AND status='confirmed'`
      ).bind(uid).first(),
      env.DB.prepare('SELECT COUNT(*) AS calls FROM call_logs WHERE user_id = ?').bind(uid).first(),
    ]);

    const businessName = (settings && settings.business_name) || (user && user.name) || 'your business';
    const industry = (settings && settings.industry) || 'a local service business';
    const leadsTotal = (leadCounts && leadCounts.total) || 0;
    const newLeads = (leadCounts && leadCounts.new_leads) || 0;
    const booked = (leadCounts && leadCounts.booked) || 0;
    const apptTotal = (apptCounts && apptCounts.total) || 0;
    const upcoming = (apptCounts && apptCounts.upcoming) || 0;
    const calls = (callStats && callStats.calls) || 0;

    // Friendly page label for the prompt.
    const pageLabels = {
      overview: 'Overview (dashboard home)', leads: 'Leads page', calls: 'Call Logs',
      calendar: 'Calendar', knowledge: 'Knowledge Base', billing: 'Billing',
      settings: 'Settings', website: 'Website Builder', analytics: 'Analytics',
      social: 'Social Media', blog: 'Blog', team: 'Team', outreach: 'Outreach',
      gallery: 'Gallery', admin: 'Admin console',
    };
    const pageLabel = pageLabels[page] || page;

    const systemPrompt = `You are Scout, the helpful in-dashboard assistant for Branch Live — an AI receptionist (Emma) for service businesses. You answer in 1-3 short sentences (max ~80 words). Be friendly, specific, and reference the real Branch Live UI.

The user is "${user && user.name ? user.name : 'there'}" from "${businessName}" (industry: ${industry}). They are currently on the ${pageLabel}.

Their account context: ${leadsTotal} total leads (${newLeads} new, ${booked} booked), ${apptTotal} confirmed appointments (${upcoming} upcoming), ${calls} calls handled by Emma.

ABOUT BRANCH LIVE:
- Emma is an AI receptionist that answers phone calls 24/7, captures leads, books appointments, and answers pricing questions from the Knowledge Base.
- Dashboard tabs: Overview, Leads, Call Logs, Knowledge Base, Calendar, Settings (plus Analytics, Website, Social, Blog, Team for add-on features).
- Plans start at $29.95/mo after a 30-day free trial. Support: hello@branchlive.com.

HOW TO ANSWER:
- Keep it concise and actionable — reference the tab/button they should use.
- On the Knowledge Base: add items with Category, Item, Price, Notes; upload CSV for bulk.
- On Leads: each lead has status new/contacted/scheduled/booked/closed; click a lead for transcript + AI follow-up email. "Confirmed" = an appointment is booked; "pending"/"new" = a lead not yet booked.
- On Calendar: month grid + day view; click an appointment to reschedule; block time for lunch/meetings.
- On Settings: Business Name, Forwarding Number, Industry, Working Hours, Welcome Message (Emma's greeting), Google Calendar sync.
- If you don't know account-specific details, point them to the right tab or hello@branchlive.com.
- Never invent features. Never use the word "contractor".`;

    const apiKey = env.DEEPSEEK_API_KEY;
    if (!apiKey) {
      // Graceful fallback: a short, page-aware canned answer so Scout always
      // responds even before a key is configured.
      return json({ ok: true, answer: scoutFallback(page, question) });
    }

    // DeepSeek is OpenAI-compatible: https://api.deepseek.com/chat/completions
    // deepseek-chat = fast, cheap non-reasoning model.
    const response = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: question },
        ],
        max_tokens: 500,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      console.error('Scout DeepSeek error:', response.status, await response.text());
      return json({ ok: true, answer: scoutFallback(page, question) });
    }

    const data = await response.json();
    const answer = data.choices && data.choices[0] && data.choices[0].message
      ? data.choices[0].message.content.trim()
      : scoutFallback(page, question);

    return json({ ok: true, answer });
  } catch (e) {
    console.error('Scout error:', e);
    return json({ ok: true, answer: 'I had trouble answering that just now. Please try again, or email hello@branchlive.com for help.' });
  }
}

// Page-aware canned answers used when no DEEPSEEK_API_KEY is set or the API
// call fails. Keeps Scout responsive instead of erroring out.
function scoutFallback(page, question) {
  const q = (question || '').toLowerCase();
  const fallbacks = {
    knowledge: 'To add services to your Knowledge Base: open the Knowledge Base tab, then add items one at a time (Category, Item, Price, Notes) or upload a CSV to bulk-import. Emma uses these to answer pricing questions on calls.',
    calendar: 'On the Calendar, click any appointment to see its details and reschedule, or use the "+" in an empty slot to book. You can also block time for lunch or meetings.',
    leads: 'A "confirmed" lead has a booked appointment; "new" or "pending" means a lead that hasn\'t been booked yet. Click any lead to see its call transcript and an AI follow-up email.',
    settings: 'In Settings you can edit your Business Name, Forwarding Number, Industry, Working Hours, and the Welcome Message Emma says when answering. Google Calendar sync is there too.',
    overview: 'Your Overview shows today\'s stats: leads, new leads, booked appointments, and upcoming calls. Ask me about any tab to learn what it does.',
    billing: 'Plans start at $29.95/mo after a 30-day free trial — no credit card to start. Add-ons like Email Autoresponder and Custom Web Page are available on the Billing tab.',
  };
  if (/knowledge|service|pricing|price/.test(q)) return fallbacks.knowledge;
  if (/calendar|appointment|reschedule|book/.test(q)) return fallbacks.calendar;
  if (/lead|confirmed|pending|status/.test(q)) return fallbacks.leads;
  if (/setting|greeting|forward|hour/.test(q)) return fallbacks.settings;
  if (/billing|price|plan|trial|cost|addon/.test(q)) return fallbacks.billing;
  return fallbacks[page] || fallbacks.overview;
}

// Generate a personalized follow-up email draft from a call transcript using
// Cloudflare Workers AI (env.AI binding). Falls back gracefully if the AI
// binding is unavailable or errors — the caller keeps the template draft.
// Core AI draft generator — shared by the Bearer-authed /api/email/draft and
// the cookie-authed /api/leads/:id/email-draft-htmx wrapper. Returns a plain
// { ok, draft?, error? } object (NOT a Response) so callers can wrap it.
async function generateEmailDraftCore(env, uid, transcript, company, name) {
  transcript = (transcript || '').trim();
  if (!transcript) return { ok: false, error: 'Transcript is required' };

  // Pull the business name from their settings when the caller
  // didn't send one, so the email signs off correctly.
  let companyName = (company || '').trim();
  if (!companyName) {
    const s = await env.DB.prepare(
      'SELECT business_name FROM settings WHERE user_id = ?'
    ).bind(uid).first();
    const u = await env.DB.prepare(
      'SELECT name, company FROM users WHERE id = ?'
    ).bind(uid).first();
    companyName = (s && s.business_name) || (u && u.company) || (u && u.name) || 'Branch Live';
  }
  const customerName = (name || '').trim() || 'there';

  if (!env.AI) return { ok: false, error: 'AI not configured' };

  const prompt = `You are writing a follow-up email for a business. Based on the phone call transcript below, write a brief, professional email to the customer. Reference specific details from the conversation (the project, pricing mentioned, timeline, etc). Use the customer's name. Keep it 3-5 sentences. Do not make up details not in the transcript. End with the business name.

Transcript:
${transcript.slice(0, 4000)}

Company: ${companyName}
Customer name: ${customerName}

Write only the email body (no subject line, no "Subject:" prefix). Start directly with the greeting.`;

  const aiRes = await env.AI.run('@cf/meta/llama-3.3-70b-instruct-fp8-fast', {
    messages: [
      { role: 'system', content: 'You write concise, warm, professional follow-up emails for businesses. Never invent facts. Output only the email body.' },
      { role: 'user', content: prompt }
    ],
    max_tokens: 400,
    temperature: 0.6
  });

  // Workers AI returns either an OpenAI-style { choices:[{message:{content}}] }
  // (newer chat models) or { response: '...' } (classic text models), and may
  // also be a bare string depending on the binding version. Normalize to text.
  let draft = '';
  if (typeof aiRes === 'string') {
    draft = aiRes;
  } else if (aiRes && Array.isArray(aiRes.choices) && aiRes.choices[0]) {
    draft = (aiRes.choices[0].message && aiRes.choices[0].message.content) || '';
  } else if (aiRes && typeof aiRes.response === 'string') {
    draft = aiRes.response;
  } else if (aiRes && aiRes.result && typeof aiRes.result.response === 'string') {
    draft = aiRes.result.response;
  } else if (aiRes && typeof aiRes === 'object') {
    draft = (aiRes.response || aiRes.output || '').toString();
  }

  draft = (draft || '').trim();
  if (!draft) return { ok: false, error: 'Empty response from AI' };
  return { ok: true, draft };
}

// POST /api/email/draft — Bearer-authed. SPA/legacy callers send the transcript
// directly in the body.
async function handleEmailDraft(request, env, uid) {
  try {
    const body = await request.json();
    const result = await generateEmailDraftCore(env, uid, body.transcript || body.summary, body.company, body.name);
    return json(result);
  } catch (e) {
    console.error('Email draft error:', e);
    return json({ ok: false, error: 'Could not generate draft' });
  }
}

// ═══════════════════════════════════════════════════════════════════════
// ADMIN DASHBOARD — page handlers (/p/admin/*)
// ═══════════════════════════════════════════════════════════════════════

// /p/admin — Overview. MRR, account/trial/churn counts, calls today, signups
// (7d), Emma uptime + pending prospects, recent activity feed, 6-month revenue
// chart. Revenue is derived locally (base $29.95 + $9.95/add-on) — no live
// Stripe calls per page load. One batched Promise.all round-trip.
async function handleAdminOverview(request, env, uid) {
  const denied = requireAdmin(uid);
  if (denied) return denied;
  try {
    const [subRows, callsToday, signups7d, pendingProspects, recentUsers, recentTickets, totalCalls] = await Promise.all([
      // Every subscription joined to its settings (for addon flags + plan).
      env.DB.prepare(
        `SELECT s.user_id, s.status, s.plan, s.trial_end, s.created_at,
                st.addon_website, st.addon_reviews, st.addon_social, st.addon_blog, st.addon_email,
                st.stripe_plan, st.business_name
         FROM subscriptions s LEFT JOIN settings st ON st.user_id = s.user_id`
      ).all(),
      env.DB.prepare(`SELECT COUNT(*) AS c FROM call_logs WHERE date(created_at) = date('now')`).first(),
      env.DB.prepare(`SELECT COUNT(*) AS c FROM users WHERE created_at >= datetime('now','-7 days')`).first(),
      env.DB.prepare(`SELECT COUNT(*) AS c FROM outreach_prospects WHERE status = 'new'`).first(),
      env.DB.prepare(`SELECT id, name, email, created_at FROM users ORDER BY created_at DESC LIMIT 5`).all(),
      env.DB.prepare(`SELECT id, name, email, status, created_at FROM support_tickets ORDER BY created_at DESC LIMIT 5`).all(),
      env.DB.prepare(`SELECT COUNT(*) AS c FROM call_logs`).first(),
    ]);

    const subs = (subRows && subRows.results) || [];
    let mrr = 0, active = 0, trials = 0, churned = 0;
    // Revenue by month for the last 6 months — keyed 'YYYY-MM'.
    const monthMap = new Map();
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      monthMap.set(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`, 0);
    }
    for (const r of subs) {
      const status = (r && r.status) || 'trial';
      if (status === 'active') active++;
      else if (status === 'trial') trials++;
      else if (['canceled', 'past_due', 'unpaid', 'cancellation_pending'].includes(status)) churned++;
      mrr += mrrForAccount(r, r); // settings fields + sub fields both on `r`.
      // Attribute each active account's MRR to its signup month (best available
      // proxy for "when revenue started") so the chart shows growth over time.
      const created = (r && r.created_at) || '';
      const mon = created.slice(0, 7); // 'YYYY-MM'
      if (monthMap.has(mon) && status === 'active') {
        monthMap.set(mon, monthMap.get(mon) + mrrForAccount(r, r));
      }
    }

    // Revenue chart bars.
    const maxRev = Math.max(1, ...monthMap.values());
    const monthLabel = (key) => {
      const [y, m] = key.split('-');
      return new Date(y, m - 1, 1).toLocaleString('en-US', { month: 'short' });
    };
    const bars = [...monthMap.entries()].map(([key, val], i) => {
      const h = Math.round((val / maxRev) * 100);
      const isLast = i === monthMap.size - 1;
      return `<div class="rev-bar-col">
        <div class="rev-bar ${isLast ? '' : 'muted'}" style="height:${Math.max(h, 2)}%">${val > 0 ? `<span class="rev-bar-val">${fmtMoney(val)}</span>` : ''}</div>
        <span class="rev-bar-lab">${monthLabel(key)}</span>
      </div>`;
    }).join('');

    // Recent activity feed — signups + support tickets, merged + sorted.
    const feedItems = [];
    for (const u of (recentUsers.results || [])) {
      feedItems.push({ ts: u.created_at, html: `<strong>${htmxEsc(u.name || u.email)}</strong> signed up <span style="color:var(--text-faint)">· ${htmxEsc(u.email)}</span>` });
    }
    for (const t of (recentTickets.results || [])) {
      feedItems.push({ ts: t.created_at, html: `Support request from <strong>${htmxEsc(t.name || t.email)}</strong> — <span style="color:var(--text-faint)">${htmxEsc((t.message || '').slice(0, 60))}${(t.message||'').length > 60 ? '…' : ''}</span>` });
    }
    feedItems.sort((a, b) => (b.ts || '').localeCompare(a.ts || ''));
    const feedHtml = feedItems.slice(0, 8).map(it =>
      `<li>${it.html}<span class="feed-time">${it.ts || ''}</span></li>`
    ).join('') || `<li style="color:var(--text-faint)">No recent activity.</li>`;

    const statCard = (num, label, tone = '') =>
      `<div class="card stat-card"><div class="stat-num ${tone}">${num}</div><div class="stat-lab">${label}</div></div>`;

    const body = `
<span class="eyebrow">Admin · Overview</span>
<h1>Branch Live <em>at a glance</em></h1>
<p class="sub">Platform health, revenue, and recent activity across all accounts.</p>
<h3>Revenue & accounts</h3>
<div class="grid2">
  ${statCard(fmtMoney(mrr), 'MRR (monthly)', '')}
  ${statCard(active, 'Active accounts', '')}
  ${statCard(trials, 'On trial', '')}
  ${statCard(churned, 'Canceled / flagged', '')}
</div>
<p class="sub" style="margin-top:14px;font-size:.82rem;color:var(--text-faint)">MRR is derived from active subscriptions (base $${ADMIN_BASE_PRICE} + $${ADMIN_ADDON_PRICE}/add-on). Churn reflects subscriptions marked canceled/past_due — full cancel-date tracking arrives with the Stripe webhook.</p>

<h3>Revenue — last 6 months</h3>
<div class="card">
  <div class="rev-chart">${bars}</div>
  <p class="sub" style="margin-top:12px;font-size:.8rem;color:var(--text-faint)">Active-account MRR bucketed by signup month. Current month highlighted.</p>
</div>

<h3>Today</h3>
<div class="grid2">
  ${statCard((callsToday && callsToday.c) || 0, 'Calls today', '')}
  ${statCard((signups7d && signups7d.c) || 0, 'New signups (7d)', '')}
  ${statCard((totalCalls && totalCalls.c) || 0, 'Total calls', '')}
  ${statCard((pendingProspects && pendingProspects.c) || 0, 'Pending prospects', '')}
</div>

<h3>Emma status</h3>
<div class="card" style="display:flex;align-items:center;gap:14px">
  <span style="width:10px;height:10px;border-radius:50%;background:var(--accent);box-shadow:0 0 0 4px rgba(212,165,116,.15);flex-shrink:0"></span>
  <div><strong style="color:var(--cream)">Operational</strong><div class="sub" style="font-size:.84rem">AI receptionist is answering calls. (Live uptime monitoring not yet wired.)</div></div>
</div>

<h3>Recent activity</h3>
<div class="card"><ul class="feed">${feedHtml}</ul></div>

<p style="margin-top:28px"><a class="btn btn-ghost btn-sm" href="/p/admin/accounts">Manage accounts →</a></p>
`;
    return new Response(adminShell('overview', 'Admin · Overview', body), { headers: { 'Content-Type': 'text/html' } });
  } catch (e) {
    console.error('Admin overview error:', e);
    return adminErrorPage('overview', 'Could not load the admin overview.');
  }
}

// /p/admin/accounts — full list of business accounts with search + filters.
// Columns: business name, email, plan, add-ons, call volume, last login.
async function handleAdminAccounts(request, env, uid) {
  const denied = requireAdmin(uid);
  if (denied) return denied;
  try {
    const url = new URL(request.url);
    const q = (url.searchParams.get('q') || '').trim().toLowerCase();
    const planFilter = (url.searchParams.get('plan') || '').toLowerCase(); // active | trial
    const statusFilter = (url.searchParams.get('status') || '').toLowerCase(); // flagged values

    // Pull users + settings + subscription + aggregate call/lead counts. Done as
    // parallel queries then joined in JS (D1 has no convenient LEFT JOIN across
    // these for every column we need). Kept to one round-trip via Promise.all.
    const [usersRes, settingsRes, subRes, callCounts, leadCounts, lastLogin] = await Promise.all([
      env.DB.prepare(`SELECT id, email, name, company, phone, created_at FROM users ORDER BY created_at DESC LIMIT 500`).all(),
      env.DB.prepare(`SELECT user_id, business_name, stripe_plan, addon_website, addon_reviews, addon_social, addon_blog, addon_email FROM settings`).all(),
      env.DB.prepare(`SELECT user_id, status, plan, trial_end FROM subscriptions`).all(),
      env.DB.prepare(`SELECT user_id, COUNT(*) AS calls FROM call_logs GROUP BY user_id`).all(),
      env.DB.prepare(`SELECT user_id, COUNT(*) AS leads FROM leads GROUP BY user_id`).all(),
      env.DB.prepare(`SELECT user_id, MAX(created_at) AS last FROM sessions GROUP BY user_id`).all(),
    ]);

    const settingsByUid = new Map((settingsRes.results || []).map(r => [r.user_id, r]));
    const subByUid = new Map((subRes.results || []).map(r => [r.user_id, r]));
    const callsByUid = new Map((callCounts.results || []).map(r => [r.user_id, r.calls]));
    const leadsByUid = new Map((leadCounts.results || []).map(r => [r.user_id, r.leads]));
    const loginByUid = new Map((lastLogin.results || []).map(r => [r.user_id, r.last]));

    let rows = (usersRes.results || []).map(u => {
      const st = settingsByUid.get(u.id) || {};
      const sub = subByUid.get(u.id) || {};
      const status = sub.status || 'trial';
      const bizName = st.business_name || u.company || u.name || '(no business name)';
      const addonCount = countAddons(st);
      return {
        id: u.id, email: u.email, name: u.name, bizName,
        status, plan: st.stripe_plan || 'base', trialEnd: sub.trial_end || '',
        calls: callsByUid.get(u.id) || 0, leads: leadsByUid.get(u.id) || 0,
        addonCount, lastLogin: loginByUid.get(u.id) || '', createdAt: u.created_at || '',
      };
    });

    // Apply filters.
    if (q) {
      rows = rows.filter(r =>
        r.bizName.toLowerCase().includes(q) ||
        r.email.toLowerCase().includes(q) ||
        String(r.id) === q
      );
    }
    if (planFilter === 'active') rows = rows.filter(r => r.status === 'active');
    else if (planFilter === 'trial') rows = rows.filter(r => r.status === 'trial');

    const rowsHtml = rows.map(r => {
      const planBadge = r.status === 'active'
        ? `<span class="badge badge-booked">active</span>`
        : `<span class="badge badge-new">trial</span>`;
      const addons = r.addonCount > 0
        ? `+${r.addonCount} add-on${r.addonCount === 1 ? '' : 's'}`
        : `<span style="color:var(--text-faint)">—</span>`;
      const trialNote = r.status === 'trial' && r.trialEnd
        ? (() => { const dl = Math.max(0, Math.ceil((new Date(r.trialEnd + 'T23:59:59') - new Date()) / 86400000)); return dl; })()
        : null;
      return `<tr style="cursor:pointer" onclick="window.location='/p/admin/accounts/${r.id}'">
        <td><strong style="color:var(--cream)">${htmxEsc(r.bizName)}</strong><div style="font-size:.76rem;color:var(--text-faint)">user #${r.id}</div></td>
        <td>${htmxEsc(r.email)}</td>
        <td>${planBadge}${trialNote !== null && trialNote <= 3 ? ` <span class="badge badge-new">${trialNote}d left</span>` : ''}</td>
        <td style="font-family:var(--font-mono);font-size:.82rem">${addons}</td>
        <td style="font-family:var(--font-mono)">${r.calls} calls · ${r.leads} leads</td>
        <td style="font-family:var(--font-mono);font-size:.8rem;color:var(--text-muted)">${r.lastLogin ? r.lastLogin.slice(0, 10) : '—'}</td>
        <td onclick="event.stopPropagation()" style="white-space:nowrap">
          <a class="btn btn-ghost btn-sm" href="/p/admin/accounts/${r.id}/impersonate" style="font-size:.74rem;padding:5px 10px">Impersonate</a>
        </td>
      </tr>`;
    }).join('') || `<tr><td colspan="7" style="text-align:center;color:var(--text-faint);padding:32px">No accounts match.</td></tr>`;

    const sel = (val) => (cur) => cur === val ? 'selected' : '';
    const body = `
<span class="eyebrow">Admin · Accounts</span>
<h1>Business <em>accounts</em></h1>
<p class="sub">${rows.length} account${rows.length === 1 ? '' : 's'}. Click a row for full detail.</p>
<h3>Filter</h3>
<form method="get" style="display:flex;gap:12px;flex-wrap:wrap;align-items:end;margin-bottom:8px">
  <div style="flex:1;min-width:180px">
    <label style="display:block;font-size:.7rem;font-family:var(--font-mono);color:var(--text-muted);margin-bottom:6px;text-transform:uppercase">Search</label>
    <input name="q" value="${htmxEsc(q)}" placeholder="business, email, or user #" style="width:100%;box-sizing:border-box">
  </div>
  <div>
    <label style="display:block;font-size:.7rem;font-family:var(--font-mono);color:var(--text-muted);margin-bottom:6px;text-transform:uppercase">Plan</label>
    <select name="plan">
      <option value="">All</option>
      <option value="active" ${sel('active')(planFilter)}>Active</option>
      <option value="trial" ${sel('trial')(planFilter)}>Trial</option>
    </select>
  </div>
  <button class="btn btn-sm" type="submit">Filter</button>
  ${q || planFilter ? `<a class="btn btn-ghost btn-sm" href="/p/admin/accounts">Clear</a>` : ''}
</form>
<h3>Accounts</h3>
<table>
  <thead><tr><th>Business</th><th>Email</th><th>Plan</th><th>Add-ons</th><th>Activity</th><th>Last login</th><th></th></tr></thead>
  <tbody>${rowsHtml}</tbody>
</table>
`;
    return new Response(adminShell('accounts', 'Admin · Accounts', body), { headers: { 'Content-Type': 'text/html' } });
  } catch (e) {
    console.error('Admin accounts error:', e);
    return adminErrorPage('accounts', 'Could not load accounts.');
  }
}

// /p/admin/accounts/:id — full detail for one business.
async function handleAdminAccountDetail(request, env, uid, acctId) {
  const denied = requireAdmin(uid);
  if (denied) return denied;
  if (!acctId) return new Response(adminShell('accounts', 'Not found', '<h1>404</h1><p style="color:#8b949e">Invalid account.</p>'), { status: 404, headers: { 'Content-Type': 'text/html' } });
  try {
    const [user, settings, sub, callStats, leadStats, recentCalls, recentLeads] = await Promise.all([
      env.DB.prepare(`SELECT id, email, name, company, phone, created_at FROM users WHERE id = ?`).bind(acctId).first(),
      env.DB.prepare(`SELECT * FROM settings WHERE user_id = ?`).bind(acctId).first(),
      env.DB.prepare(`SELECT status, plan, trial_start, trial_end, created_at FROM subscriptions WHERE user_id = ?`).bind(acctId).first(),
      env.DB.prepare(`SELECT COUNT(*) AS calls, COALESCE(SUM(duration_sec),0) AS dur FROM call_logs WHERE user_id = ?`).bind(acctId).first(),
      env.DB.prepare(`SELECT COUNT(*) AS total, SUM(CASE WHEN status='new' THEN 1 ELSE 0 END) AS fresh FROM leads WHERE user_id = ?`).bind(acctId).first(),
      env.DB.prepare(`SELECT created_at, duration_sec, summary FROM call_logs WHERE user_id = ? ORDER BY created_at DESC LIMIT 5`).bind(acctId).all(),
      env.DB.prepare(`SELECT id, caller_name, status, created_at FROM leads WHERE user_id = ? ORDER BY created_at DESC LIMIT 5`).bind(acctId).all(),
    ]);
    if (!user) return new Response(adminShell('accounts', 'Not found', '<h1>404</h1><p style="color:#8b949e">Account not found.</p>'), { status: 404, headers: { 'Content-Type': 'text/html' } });

    const mrr = mrrForAccount(settings, sub);
    const status = (sub && sub.status) || 'trial';
    const bizName = (settings && settings.business_name) || user.company || user.name || '(no business name)';
    const addonList = Object.entries(ADDONS).map(([key, def]) => {
      const on = !!(settings && settings[def.column]);
      return `<tr><td>${def.icon} ${def.label}</td><td>${on ? `<span class="badge badge-booked">on</span>` : `<span style="color:var(--text-faint)">off</span>`}</td><td style="font-family:var(--font-mono)">${on ? '+' + fmtMoney(ADMIN_ADDON_PRICE) + '/mo' : '—'}</td></tr>`;
    }).join('');

    const callRows = (recentCalls.results || []).map(c =>
      `<tr><td style="font-family:var(--font-mono);font-size:.82rem">${(c.created_at || '').slice(0, 16)}</td><td>${c.duration_sec || 0}s</td><td style="color:var(--text-muted);font-size:.88rem">${htmxEsc((c.summary || '').slice(0, 80))}</td></tr>`
    ).join('') || `<tr><td colspan="3" style="color:var(--text-faint);text-align:center;padding:18px">No calls yet.</td></tr>`;
    const leadRows = (recentLeads.results || []).map(l =>
      `<tr style="cursor:pointer" onclick="window.location='/p/leads/${l.id}'"><td>${htmxEsc(l.caller_name || '—')}</td><td>${statusPill(l.status)}</td><td style="font-family:var(--font-mono);font-size:.82rem">${(l.created_at || '').slice(0, 10)}</td></tr>`
    ).join('') || `<tr><td colspan="3" style="color:var(--text-faint);text-align:center;padding:18px">No leads yet.</td></tr>`;

    const trialInfo = status === 'trial' && sub && sub.trial_end
      ? (() => { const dl = Math.max(0, Math.ceil((new Date(sub.trial_end + 'T23:59:59') - new Date()) / 86400000)); return dl; })()
      : null;

    const body = `
<a class="btn btn-ghost btn-sm" href="/p/admin/accounts" style="margin-bottom:18px">← All accounts</a>
<span class="eyebrow">Admin · Account #${user.id}</span>
<h1>${htmxEsc(bizName)}</h1>
<p class="sub">${htmxEsc(user.email)}${user.phone ? ` · ${htmxEsc(user.phone)}` : ''} · joined ${(user.created_at || '').slice(0, 10)}</p>

<div style="display:flex;gap:12px;flex-wrap:wrap;margin:24px 0">
  <a class="btn btn-sm" href="/p/admin/accounts/${user.id}/impersonate">👁 Log in as this account</a>
  ${trialInfo !== null && trialInfo <= 3 ? `<span class="badge badge-new">⚠ Trial ends in ${trialInfo}d</span>` : ''}
</div>

<div class="grid2">
  <div class="card stat-card"><div class="stat-num">${fmtMoney(mrr)}</div><div class="stat-lab">MRR</div></div>
  <div class="card stat-card"><div class="stat-num">${(callStats && callStats.calls) || 0}</div><div class="stat-lab">Total calls</div></div>
  <div class="card stat-card"><div class="stat-num">${(leadStats && leadStats.total) || 0}</div><div class="stat-lab">Total leads</div></div>
  <div class="card stat-card"><div class="stat-num">${(leadStats && leadStats.fresh) || 0}</div><div class="stat-lab">New leads</div></div>
</div>

<h3>Plan</h3>
<table class="no-header">
  <tr><td>Status</td><td>${status === 'active' ? `<span class="badge badge-booked">active</span>` : `<span class="badge badge-new">${status}</span>`}</td></tr>
  <tr><td>Base plan</td><td>${fmtMoney(ADMIN_BASE_PRICE)}/mo</td></tr>
  <tr><td>Trial ends</td><td>${sub && sub.trial_end ? sub.trial_end : '—'}</td></tr>
  <tr><td>Stripe customer</td><td style="font-family:var(--font-mono);font-size:.82rem">${(settings && settings.stripe_customer_id) || '—'}</td></tr>
</table>

<h3>Add-ons</h3>
<table>
  <thead><tr><th>Add-on</th><th>Status</th><th>Price</th></tr></thead>
  <tbody>${addonList}</tbody>
</table>

<h3>Recent calls</h3>
<table>
  <thead><tr><th>When</th><th>Duration</th><th>Summary</th></tr></thead>
  <tbody>${callRows}</tbody>
</table>

<h3>Recent leads</h3>
<table>
  <thead><tr><th>Name</th><th>Status</th><th>Date</th></tr></thead>
  <tbody>${leadRows}</tbody>
</table>
`;
    return new Response(adminShell('accounts', `Admin · ${bizName}`, body), { headers: { 'Content-Type': 'text/html' } });
  } catch (e) {
    console.error('Admin account detail error:', e);
    return adminErrorPage('accounts', 'Could not load this account.');
  }
}

// /p/admin/accounts/:id/impersonate — create a session for the target user
// and set the bl_session cookie, exactly like handleLoginHtmx. Redirects to
// their dashboard. (Admins: use the top nav to sign out and return.)
async function handleAdminImpersonate(request, env, uid, targetUid) {
  const denied = requireAdmin(uid);
  if (denied) return denied;
  if (!targetUid || targetUid === uid) {
    return adminRedirect(request, '/p/admin/accounts');
  }
  try {
    const user = await env.DB.prepare('SELECT id FROM users WHERE id = ?').bind(targetUid).first();
    if (!user) return new Response(adminShell('accounts', 'Not found', '<h1>404</h1><p>That account does not exist.</p>'), { status: 404, headers: { 'Content-Type': 'text/html' } });
    const token = crypto.randomUUID();
    await env.DB.prepare(
      'INSERT INTO sessions (token, user_id, created_at) VALUES (?, ?, ?)'
    ).bind(token, targetUid, nowISO()).run();
    const url = new URL(request.url);
    const isHttps = url.protocol === 'https:';
    const cookie = `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax${isHttps ? '; Secure' : ''}; Max-Age=2592000`;
    return new Response(null, {
      status: 302,
      headers: { Location: '/p/overview', 'Set-Cookie': cookie },
    });
  } catch (e) {
    console.error('Admin impersonate error:', e);
    return adminErrorPage('accounts', 'Could not impersonate this account.');
  }
}

// POST /api/admin/accounts/flag — set a flag note on an account. (Stores the
// flag as a lightweight marker; full flag persistence can expand later.) For
// now this is a no-op ack that surfaces in the admin's session — a real flag
// column can be added when needed.
async function handleAdminAccountFlag(request, env, uid) {
  const denied = requireAdmin(uid);
  if (denied) return denied;
  try {
    const form = await request.formData();
    const targetId = parseInt(form.get('user_id') || '0', 10);
    const flag = String(form.get('flag') || '').toLowerCase();
    // Ack only — flags aren't persisted yet (no column). Returns to accounts.
    return adminRedirect(request, `/p/admin/accounts/${targetId}?flagged=${encodeURIComponent(flag)}`, 303);
  } catch (e) {
    console.error('Admin flag error:', e);
    return json({ ok: false, error: 'Could not set flag.' }, 500);
  }
}

// /p/admin/support — contact form + ticket list.
async function handleAdminSupport(request, env, uid) {
  const denied = requireAdmin(uid);
  if (denied) return denied;
  try {
    const url = new URL(request.url);
    const thanks = url.searchParams.get('thanks') === '1';
    const { results } = await env.DB.prepare(
      `SELECT id, name, email, message, status, created_at FROM support_tickets ORDER BY created_at DESC LIMIT 100`
    ).all();
    const tickets = results || [];
    const ticketRows = tickets.map(t => {
      // Resolved/replied/closed/answered read as "handled" (booked badge);
      // everything else (open) reads as actionable (new badge).
      const handled = ['resolved', 'replied', 'closed', 'answered'].includes(t.status);
      const badge = handled ? 'badge-booked' : 'badge-new';
      return `<tr style="cursor:pointer" onclick="window.location='/p/admin/support/${t.id}'">
        <td style="font-family:var(--font-mono);font-size:.82rem">${(t.created_at || '').slice(0, 16)}</td>
        <td><strong style="color:var(--cream)">${htmxEsc(t.name || '—')}</strong><div style="font-size:.78rem;color:var(--text-faint)">${htmxEsc(t.email || '')}</div></td>
        <td style="color:var(--text-muted);font-size:.88rem">${htmxEsc((t.message || '').slice(0, 100))}${(t.message || '').length > 100 ? '…' : ''}</td>
        <td><span class="badge ${badge}">${htmxEsc(t.status || 'open')}</span></td>
      </tr>`;
    }).join('') || `<tr><td colspan="4" style="color:var(--text-faint);text-align:center;padding:24px">No tickets yet.</td></tr>`;

    const body = `
<span class="eyebrow">Admin · Support</span>
<h1>Support <em>inbox</em></h1>
<p class="sub">Messages route to your inbox and are logged here.</p>
${thanks ? `<div class="note-box" style="border-color:rgba(212,165,116,.4);color:var(--accent-amber);margin:18px 0">✓ Message sent. We'll respond within 24h.</div>` : ''}

<h3>New message</h3>
<form method="post" action="/api/admin/support" class="card" style="display:grid;gap:12px">
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
    <div><label style="display:block;font-size:.7rem;font-family:var(--font-mono);color:var(--text-muted);margin-bottom:6px;text-transform:uppercase">Name</label><input name="name" required style="width:100%;box-sizing:border-box"></div>
    <div><label style="display:block;font-size:.7rem;font-family:var(--font-mono);color:var(--text-muted);margin-bottom:6px;text-transform:uppercase">Email</label><input name="email" type="email" required style="width:100%;box-sizing:border-box"></div>
  </div>
  <div><label style="display:block;font-size:.7rem;font-family:var(--font-mono);color:var(--text-muted);margin-bottom:6px;text-transform:uppercase">Message</label><textarea name="message" rows="4" required style="width:100%;box-sizing:border-box"></textarea></div>
  <div><button class="btn" type="submit">Send message</button></div>
</form>

<h3>Tickets (${tickets.length})</h3>
<table>
  <thead><tr><th>Received</th><th>From</th><th>Message</th><th>Status</th></tr></thead>
  <tbody>${ticketRows}</tbody>
</table>
`;
    return new Response(adminShell('support', 'Admin · Support', body), { headers: { 'Content-Type': 'text/html' } });
  } catch (e) {
    console.error('Admin support error:', e);
    return adminErrorPage('support', 'Could not load support.');
  }
}

// POST /api/admin/support — insert ticket, email admin via Resend, send an
// auto-responder to the submitter, then redirect back to the support page.
async function handleAdminSupportSubmit(request, env, uid) {
  const denied = requireAdmin(uid);
  if (denied) return denied;
  try {
    const form = await request.formData();
    const name = (form.get('name') || '').toString().trim();
    const email = (form.get('email') || '').toString().trim();
    const message = (form.get('message') || '').toString().trim();
    if (!name || !email || !message) {
      return adminRedirect(request, '/p/admin/support?error=missing', 303);
    }
    // Persist the ticket.
    await env.DB.prepare(
      `INSERT INTO support_tickets (user_id, name, email, message, status) VALUES (?, ?, ?, ?, 'open')`
    ).bind(uid || null, name, email, message).run();

    // Email the admin.
    await sendEmail(env, {
      to: 'hello@branchlive.com',
      subject: `Support request from ${name}`,
      html: emailShell(`<h2 style="color:#f1ead9">New support request</h2><p style="color:#cdc3ad"><strong>From:</strong> ${htmxEsc(name)} &lt;${htmxEsc(email)}&gt;</p><p style="color:#cdc3ad;margin-top:14px"><strong>Message:</strong></p><p style="color:#f1ead9;background:#13131f;padding:14px;border-radius:8px;border:1px solid #211c14;white-space:pre-wrap">${htmxEsc(message)}</p>`),
    });
    // Auto-responder to the submitter.
    await sendEmail(env, {
      to: email,
      subject: 'We got your message — Branch Live',
      html: emailShell(`<h2 style="color:#f1ead9">Hi ${htmxEsc(name)},</h2><p style="color:#cdc3ad">Thanks for reaching out — we've received your message and will get back to you within 24 hours.</p><p style="color:#8b949e;margin-top:14px;font-size:.9em">— The Branch Live team</p>`),
    });

    return adminRedirect(request, '/p/admin/support?thanks=1', 303);
  } catch (e) {
    console.error('Admin support submit error:', e);
    return adminRedirect(request, '/p/admin/support?error=send', 303);
  }
}

// /p/admin/support/:id — ticket detail. Shows submitter, full message, date,
// status, a reply form (textarea → emails submitter via Resend + flips status
// to 'replied'), and a "Mark resolved" button (status → 'resolved').
async function handleAdminSupportDetail(request, env, uid, ticketId) {
  const denied = requireAdmin(uid);
  if (denied) return denied;
  if (!ticketId) return new Response(adminShell('support', 'Not found', '<h1>404</h1><p style="color:#8b949e">Invalid ticket.</p>'), { status: 404, headers: { 'Content-Type': 'text/html' } });
  try {
    const url = new URL(request.url);
    const replied = url.searchParams.get('replied') === '1';
    const resolved = url.searchParams.get('resolved') === '1';
    const sendErr = url.searchParams.get('error') === 'send';

    const t = await env.DB.prepare(
      `SELECT id, name, email, message, status, created_at FROM support_tickets WHERE id = ?`
    ).bind(ticketId).first();
    if (!t) return new Response(adminShell('support', 'Not found', '<h1>404</h1><p style="color:#8b949e">Ticket not found.</p>'), { status: 404, headers: { 'Content-Type': 'text/html' } });

    const handled = ['resolved', 'replied', 'closed', 'answered'].includes(t.status);
    const statusBadge = handled ? 'badge-booked' : 'badge-new';
    const isResolved = t.status === 'resolved';

    const body = `
<a class="btn btn-ghost btn-sm" href="/p/admin/support" style="margin-bottom:18px">← All tickets</a>
<span class="eyebrow">Admin · Ticket #${t.id}</span>
<h1>${htmxEsc(t.name || '—')}</h1>
<p class="sub">${htmxEsc(t.email || 'no email')} · received ${(t.created_at || '').slice(0, 16).replace('T', ' ')}</p>

${replied ? `<div class="note-box" style="border-color:rgba(212,165,116,.4);color:var(--accent-amber);margin:18px 0">✓ Reply sent to ${htmxEsc(t.email || 'submitter')}. Status set to replied.</div>` : ''}
${resolved ? `<div class="note-box" style="border-color:rgba(212,165,116,.4);color:var(--accent-amber);margin:18px 0">✓ Ticket marked resolved.</div>` : ''}
${sendErr ? `<div class="note-box" style="border-color:rgba(248,113,113,.4);color:#f85149;margin:18px 0">✗ Reply could not be sent. Check Resend config and try again.</div>` : ''}

<div class="grid2" style="margin-top:8px">
  <div class="card stat-card"><div class="stat-lab">Status</div><div style="margin-top:8px"><span class="badge ${statusBadge}">${htmxEsc(t.status || 'open')}</span></div></div>
  <div class="card stat-card"><div class="stat-lab">From</div><div style="margin-top:8px;color:var(--cream);font-size:1rem"><strong>${htmxEsc(t.name || '—')}</strong><div style="font-size:.82rem;color:var(--text-muted);font-weight:400;margin-top:4px">${htmxEsc(t.email || '')}</div></div></div>
</div>

<h3>Message</h3>
<div class="card"><p style="color:var(--text-primary);white-space:pre-wrap;line-height:1.7">${htmxEsc(t.message || '(empty)')}</p></div>

${isResolved ? `<p style="margin-top:24px;color:var(--text-faint)">This ticket is resolved. <a href="/p/admin/support">← Back to tickets</a></p>` : `
<h3>Reply</h3>
<form method="post" action="/api/admin/support/${t.id}/reply" class="card" style="display:grid;gap:12px">
  <div><label style="display:block;font-size:.7rem;font-family:var(--font-mono);color:var(--text-muted);margin-bottom:6px;text-transform:uppercase">To</label><div style="font-size:.9rem">${htmxEsc(t.name || '—')} &lt;${htmxEsc(t.email || '')}&gt;</div></div>
  <div><label style="display:block;font-size:.7rem;font-family:var(--font-mono);color:var(--text-muted);margin-bottom:6px;text-transform:uppercase">Your reply</label><textarea name="reply" rows="6" required placeholder="Type your response…" style="width:100%;box-sizing:border-box"></textarea></div>
  <div style="display:flex;gap:12px;flex-wrap:wrap">
    <button class="btn" type="submit">Send reply</button>
    <button class="btn btn-ghost" type="submit" formaction="/api/admin/support/${t.id}/resolve" formmethod="post">Mark resolved</button>
  </div>
</form>
`}
`;
    return new Response(adminShell('support', `Admin · Ticket #${t.id}`, body), { headers: { 'Content-Type': 'text/html' } });
  } catch (e) {
    console.error('Admin support detail error:', e);
    return adminErrorPage('support', 'Could not load this ticket.');
  }
}

// POST /api/admin/support/:id/reply — email the submitter the admin's reply
// via Resend, flip status to 'replied', redirect back to the detail page.
async function handleAdminSupportReply(request, env, uid, ticketId) {
  const denied = requireAdmin(uid);
  if (denied) return denied;
  try {
    const form = await request.formData();
    const reply = (form.get('reply') || '').toString().trim();
    const t = await env.DB.prepare(
      `SELECT id, name, email FROM support_tickets WHERE id = ?`
    ).bind(ticketId).first();
    if (!t) return adminRedirect(request, '/p/admin/support', 303);
    if (!reply) return adminRedirect(request, `/p/admin/support/${ticketId}`, 303);

    // Send the reply email. sendEmail returns {ok,error}; surface a send error
    // without losing the typed reply (admin can retry from the detail page).
    const result = await sendEmail(env, {
      to: t.email,
      subject: `Re: your Branch Live message`,
      html: emailShell(`<h2 style="color:#f1ead9">Hi ${htmxEsc(t.name || 'there')},</h2><p style="color:#cdc3ad">Thanks for reaching out. Here's our response:</p><p style="color:#f1ead9;background:#13131f;padding:14px;border-radius:8px;border:1px solid #211c14;white-space:pre-wrap;line-height:1.7">${htmxEsc(reply)}</p><p style="color:#8b949e;margin-top:18px;font-size:.9em">— The Branch Live team</p>`),
    });
    if (!result.ok) {
      console.error('Support reply email failed:', result.error);
      return adminRedirect(request, `/p/admin/support/${ticketId}?error=send`, 303);
    }

    await env.DB.prepare(
      `UPDATE support_tickets SET status = 'replied' WHERE id = ?`
    ).bind(ticketId).run();

    return adminRedirect(request, `/p/admin/support/${ticketId}?replied=1`, 303);
  } catch (e) {
    console.error('Admin support reply error:', e);
    return adminRedirect(request, `/p/admin/support/${ticketId}?error=send`, 303);
  }
}

// POST /api/admin/support/:id/resolve — mark a ticket resolved (no email).
async function handleAdminSupportResolve(request, env, uid, ticketId) {
  const denied = requireAdmin(uid);
  if (denied) return denied;
  try {
    const t = await env.DB.prepare(`SELECT id FROM support_tickets WHERE id = ?`).bind(ticketId).first();
    if (!t) return adminRedirect(request, '/p/admin/support', 303);
    await env.DB.prepare(
      `UPDATE support_tickets SET status = 'resolved' WHERE id = ?`
    ).bind(ticketId).run();
    return adminRedirect(request, `/p/admin/support/${ticketId}?resolved=1`, 303);
  } catch (e) {
    console.error('Admin support resolve error:', e);
    return adminRedirect(request, '/p/admin/support', 303);
  }
}

// /p/admin/analytics — feature adoption + trial→paid conversion.
async function handleAdminAnalytics(request, env, uid) {
  const denied = requireAdmin(uid);
  if (denied) return denied;
  try {
    const [settingsRes, subRes] = await Promise.all([
      env.DB.prepare(`SELECT user_id, addon_website, addon_reviews, addon_social, addon_blog, addon_email FROM settings`).all(),
      env.DB.prepare(`SELECT status FROM subscriptions`).all(),
    ]);
    const settings = settingsRes.results || [];
    const subs = subRes.results || [];
    const totalAccounts = settings.length || 1;

    // Add-on adoption counts.
    const adoption = Object.entries(ADDONS).map(([key, def]) => {
      const count = settings.filter(s => !!s[def.column]).length;
      return { key, label: def.label, icon: def.icon, count, pct: Math.round((count / totalAccounts) * 100), revenue: count * ADMIN_ADDON_PRICE };
    });
    const maxAdopt = Math.max(1, ...adoption.map(a => a.count));

    // Trial → paid conversion.
    const paid = subs.filter(s => s.status === 'active').length;
    const trial = subs.filter(s => s.status === 'trial').length;
    const convDenom = paid + trial;
    const convRate = convDenom > 0 ? Math.round((paid / convDenom) * 100) : 0;
    const addonRevenue = adoption.reduce((s, a) => s + a.revenue, 0);

    const adoptHtml = adoption.map(a =>
      `<div class="adopt-row">
        <span style="font-size:.9rem">${a.icon} ${a.label}</span>
        <div class="adopt-track"><div class="adopt-fill" style="width:${(a.count / maxAdopt) * 100}%"></div></div>
        <span class="adopt-num">${a.count} (${a.pct}%)</span>
      </div>`
    ).join('');

    const adoptTable = adoption.map(a =>
      `<tr><td>${a.icon} ${a.label}</td><td style="font-family:var(--font-mono)">${a.count}</td><td style="font-family:var(--font-mono)">${a.pct}%</td><td style="font-family:var(--font-mono)">${fmtMoney(a.revenue)}/mo</td></tr>`
    ).join('');

    const statCard = (num, label) =>
      `<div class="card stat-card"><div class="stat-num">${num}</div><div class="stat-lab">${label}</div></div>`;

    const body = `
<span class="eyebrow">Admin · Analytics</span>
<h1>Feature <em>adoption</em></h1>
<p class="sub">How businesses are using Branch Live across ${totalAccounts} account${totalAccounts === 1 ? '' : 's'}.</p>

<h3>Conversion</h3>
<div class="grid2">
  ${statCard(convRate + '%', 'Trial → paid')}
  ${statCard(paid, 'Paid accounts')}
  ${statCard(trial, 'On trial')}
  ${statCard(fmtMoney(addonRevenue), 'Add-on revenue/mo')}
</div>

<h3>Add-on adoption</h3>
<div class="card">${adoptHtml}</div>

<h3>Usage breakdown</h3>
<table>
  <thead><tr><th>Add-on</th><th>Accounts</th><th>% of total</th><th>Revenue</th></tr></thead>
  <tbody>${adoptTable}</tbody>
</table>
<p class="sub" style="margin-top:14px;font-size:.82rem;color:var(--text-faint)">Adoption counts accounts with each add-on enabled. Revenue uses the $${ADMIN_ADDON_PRICE}/mo add-on rate.</p>
`;
    return new Response(adminShell('analytics', 'Admin · Analytics', body), { headers: { 'Content-Type': 'text/html' } });
  } catch (e) {
    console.error('Admin analytics error:', e);
    return adminErrorPage('analytics', 'Could not load analytics.');
  }
}


// ═══════════════════════════════════════════════════════════════════════
// BUSINESS BLOG POSTS — the $14.95/mo AI Blog Posts add-on.
// Each business with addon_blog=1 gets 3 AI-generated posts per week
// (Mon/Wed/Fri), rendered on their public site at /s/{slug}/blog. The cron
// (wrangler.jsonc → */15 * * * *) drives generation; this scheduled() handler
// gates it to the right days. Reuses blogMarkdownToHtml() for rendering and
// the same env.AI model as the email-draft generator. Degrades gracefully
// when env.AI is absent (skips generation, logs a note).
// ═══════════════════════════════════════════════════════════════════════

// Three rotating prompt angles, matching the task spec. The generator picks
// the next one based on how many posts exist for this account (mod 3), so a
// business's feed cycles through all three rather than repeating one tone.
const CBLOG_TEMPLATES = [
  '5 Signs Your {industry} System Needs Maintenance',
  'How to Prepare Your {service} for {season}',
  'Why Professional {service} Beats DIY Every Time',
];

// Approximate Northern-Hemisphere season name for "now", used to localize the
// "prepare for <season>" template (e.g. "Winter", "Summer"). Purely cosmetic.
function currentSeason(date = new Date()) {
  const m = date.getUTCMonth(); // 0=Jan
  if (m === 11 || m <= 1) return 'Winter';
  if (m >= 2 && m <= 4) return 'Spring';
  if (m >= 5 && m <= 7) return 'Summer';
  return 'Fall';
}

// Slugify a title for business posts, then uniquify per-account. We suffix
// with a short counter so two posts with the same base (rare, but the
// templates can repeat across weeks) never collide, and embed user_id so
// different businesses' posts never clash. Never throws.
async function cblogUniqueSlug(env, uid, title) {
  const base = blogSlugify(title).slice(0, 60) || 'post';
  let candidate = `${base}-${uid}`;
  let n = 1;
  for (;;) {
    const row = await env.DB.prepare(
      'SELECT id FROM business_blog_posts WHERE user_id = ? AND slug = ?'
    ).bind(uid, candidate).first();
    if (!row) return candidate;
    n += 1;
    candidate = `${base}-${uid}-${n}`;
    if (n > 999) return `${base}-${uid}-${Date.now().toString(36)}`;
  }
}

// Core AI generator. Reads the business's industry / service area / services
// (from settings + knowledge base), picks a template, calls env.AI, and stores
// the post. Returns { ok, post?, error? } and never throws. Falls back to a
// templated draft (still a real, publishable post) when env.AI is unavailable,
// so the feature works in dev/preview without AI — it just won't be as rich.
async function generateBusinessBlogPost(env, uid) {
  // Gather the business context the prompt needs.
  const [settings, kbRes] = await Promise.all([
    env.DB.prepare(
      'SELECT business_name, industry, service_area, service_description FROM settings WHERE user_id = ?'
    ).bind(uid).first(),
    env.DB.prepare(
      'SELECT item FROM knowledge WHERE user_id = ? ORDER BY item LIMIT 12'
    ).bind(uid).all(),
  ]);
  const s = settings || {};
  const industry = (s.industry || 'home services').trim();
  const area = (s.service_area || '').trim();
  const businessName = (s.business_name || 'our team').trim();
  const services = (kbRes.results || []).map(k => k.item).filter(Boolean);
  const primaryService = services[0] || industry;
  const season = currentSeason();

  // Pick the next template angle by post count so they rotate.
  const countRow = await env.DB.prepare(
    'SELECT COUNT(*) AS c FROM business_blog_posts WHERE user_id = ?'
  ).bind(uid).first();
  const idx = ((countRow && countRow.c) || 0) % CBLOG_TEMPLATES.length;
  const angleTitle = CBLOG_TEMPLATES[idx]
    .replace('{industry}', industry)
    .replace('{service}', primaryService)
    .replace('{season}', season);

  let title = angleTitle;
  let content = '';

  if (env.AI) {
    const servicesList = services.length ? services.join(', ') : primaryService;
    const prompt = `You are writing a short, helpful blog post for a local ${industry} business called ${businessName}${area ? ` serving ${area}` : ''}. They offer: ${servicesList}.

Write the post titled: "${angleTitle}"

Requirements:
- 300 to 500 words.
- Plain, friendly, expert-but-approachable tone — like a trusted local pro giving practical advice.
- Markdown formatting: an opening paragraph, then 3 to 5 short sections with ## headings, a few **bold** highlights, and a closing line.
- Reference the local area (${area || 'the community'}) naturally at least once.
- Do NOT mention that this was AI-generated. Do NOT use placeholder text.
- End with a soft call to action to contact ${businessName}.
- Output ONLY the post body in markdown. Do not repeat the title as a heading on the first line (the title is rendered separately).`;

    try {
      const aiRes = await env.AI.run('@cf/meta/llama-3.3-70b-instruct-fp8-fast', {
        messages: [
          { role: 'system', content: 'You write concise, genuinely useful local-service blog posts in markdown. Never invent fake statistics or quotes. Output only the post body.' },
          { role: 'user', content: prompt }
        ],
        max_tokens: 900,
        temperature: 0.75,
      });
      // Normalize the model response to text (same ladder as the email draft).
      if (typeof aiRes === 'string') content = aiRes;
      else if (aiRes && Array.isArray(aiRes.choices) && aiRes.choices[0]) content = (aiRes.choices[0].message && aiRes.choices[0].message.content) || '';
      else if (aiRes && typeof aiRes.response === 'string') content = aiRes.response;
      else if (aiRes && aiRes.result && typeof aiRes.result.response === 'string') content = aiRes.result.response;
      else if (aiRes && typeof aiRes === 'object') content = (aiRes.response || aiRes.output || '').toString();
    } catch (e) {
      console.error(`cblog AI error (uid ${uid}):`, e && e.message);
    }
  }

  // Fallback draft when AI is absent or errored — still a real, readable post
  // built from their data so the feed is never empty in preview/dev.
  if (!content || !content.trim()) {
    const svcBullets = services.length
      ? services.slice(0, 5).map(svc => `- **${svc}** — done right, on time, by ${businessName}.`).join('\n')
      : `- **${primaryService}** — handled by ${businessName}, start to finish.`;
    content = `Keeping your ${industry} systems in good shape saves money and avoids emergencies. Here's what ${businessName} wants every ${area || 'local'} homeowner to know.\n\n## Why ${primaryService} matters\n\nA little attention now prevents a much bigger problem later. Regular care extends the life of your equipment and keeps everything running safely through ${season.toLowerCase()}.\n\n## What to watch for\n\n${svcBullets}\n\n## When to call a pro\n\nIf anything seems off — strange noises, slow performance, or a sudden spike in your utility bills — it's worth having a professional take a look before it gets worse.\n\n${businessName} is here to help${area ? ` across ${area}` : ''}. Reach out any time to schedule a visit.`;
  }

  const slug = await cblogUniqueSlug(env, uid, title);
  const now = new Date().toISOString();
  const info = await env.DB.prepare(
    `INSERT INTO business_blog_posts (user_id, title, slug, content, status, published_at)
     VALUES (?, ?, ?, ?, 'published', ?)`
  ).bind(uid, title, slug, content, now).run();
  const post = { id: info.meta && info.meta.last_row_id, user_id: uid, title, slug, content, status: 'published', published_at: now };
  return { ok: true, post };
}

// Email a short summary to the business that a new post went live.
// Best-effort: sendEmail degrades gracefully when Resend/Gmail is unconfigured.
async function notifyBusinessOfPost(env, uid, post) {
  try {
    const u = await env.DB.prepare('SELECT email, name FROM users WHERE id = ?').bind(uid).first();
    if (!u || !u.email) return;
    const settings = await env.DB.prepare('SELECT business_name, site_slug FROM settings WHERE user_id = ?').bind(uid).first() || {};
    // The public blog URL lives under their site slug. Look it up from `sites`
    // since that's the source of truth for the public URL.
    const site = await env.DB.prepare('SELECT slug FROM sites WHERE user_id = ?').bind(uid).first();
    const blogUrl = site && site.slug ? `https://branchlive-portal.shane-f58.workers.dev/s/${site.slug}/blog` : null;
    const name = (u.name || '').trim() || 'there';
    const html = emailShell(`
      <div style="max-width:560px;margin:0 auto">
        <p style="color:#f1f5f9;font-size:16px">Hi ${htmxEsc(name)},</p>
        <p style="color:#cbd5e1;font-size:15px;line-height:1.6">A new blog post just went live on your website:</p>
        <div style="background:#11162a;border:1px solid #1f2937;border-radius:12px;padding:20px 22px;margin:20px 0">
          <p style="color:#e8c9a0;font-size:13px;text-transform:uppercase;letter-spacing:.08em;margin:0 0 6px">New post</p>
          <p style="color:#f8fafc;font-size:18px;font-weight:600;margin:0">${htmxEsc(post.title)}</p>
          ${blogUrl ? `<p style="margin:14px 0 0"><a href="${blogUrl}" style="color:#d4a574;text-decoration:none">Read it on your site →</a></p>` : ''}
        </div>
        <p style="color:#94a3b8;font-size:13px;line-height:1.6">This post was auto-written and published for you — nothing to do. You're getting 3 new posts each week as part of your AI Blog Posts add-on.</p>
      </div>
    `);
    await sendEmail(env, { to: u.email, subject: `New blog post live: ${post.title}`, html, uid });
  } catch (e) {
    console.error('cblog notify error:', e && e.message);
  }
}

// ── Public business blog: /s/{slug}/blog and /s/{slug}/blog/:postslug ──
// No auth. Resolves the site by slug, then lists/posts for that site's owner.
// Reuses blogMarkdownToHtml() + a business-themed shell (amber-on-dark,
// matching their public site feel rather than the Branch Live marketing tone).

function businessBlogShell(businessName, title, body) {
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${htmxEsc(title)}${businessName ? ' — ' + htmxEsc(businessName) : ''}</title>
<link rel="icon" type="image/svg+xml" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='6' fill='%230e0e18'/%3E%3Cg fill='%23d4a574'%3E%3Crect x='5' y='14' width='2' height='4' rx='1'/%3E%3Crect x='9' y='10' width='2' height='12' rx='1'/%3E%3Crect x='13' y='6' width='2' height='20' rx='1'/%3E%3Crect x='17' y='10' width='2' height='12' rx='1'/%3E%3Crect x='21' y='14' width='2' height='4' rx='1'/%3E%3C/g%3E%3C/svg%3E">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,500;0,9..144,600;1,9..144,400;1,9..144,500&family=Inter+Tight:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
*{margin:0;padding:0;box-sizing:border-box}
:root{--bg-primary:#0a0a12;--bg-card:#0e0e18;--bg-elev:#13131f;--text-primary:#f1ead9;--text-muted:#a89a82;--text-faint:#6b6354;--cream:#f1ead9;--accent:#d4a574;--accent-bright:#e8c9a0;--border:#211c14;--font-sans:'Inter Tight',system-ui,-apple-system,sans-serif;--font-serif:'Fraunces',Georgia,serif}
body{font-family:var(--font-sans);background:var(--bg-primary);color:var(--text-primary);line-height:1.7;font-size:17px;min-height:100vh;-webkit-font-smoothing:antialiased}
a{color:var(--accent);text-decoration:none;transition:color .25s ease}a:hover{color:var(--accent-bright)}
.wrap{max-width:720px;margin:0 auto;padding:56px 24px 96px}
.top{text-align:center;margin-bottom:48px}
.top .kicker{font-family:var(--font-serif);font-style:italic;color:var(--accent);font-size:1rem}
.top h1{font-family:var(--font-serif);font-weight:500;font-size:2.4rem;letter-spacing:-.02em;line-height:1.1;margin-top:6px}
.back{display:inline-flex;align-items:center;gap:7px;color:var(--text-muted);font-size:.86rem;margin-bottom:36px}.back:hover{color:var(--accent)}
.post-list{list-style:none}.post-list li{padding:26px 0;border-bottom:1px solid var(--border)}
.post-list li:first-child{padding-top:0}
.post-list h2{font-family:var(--font-serif);font-weight:500;font-size:1.6rem;letter-spacing:-.015em;line-height:1.2;margin-bottom:8px}
.post-list h2 a{color:var(--cream)}.post-list h2 a:hover{color:var(--accent)}
.post-list .date{font-size:.74rem;color:var(--text-faint);text-transform:uppercase;letter-spacing:.08em;margin-bottom:8px;display:block}
.post-list .excerpt{color:var(--text-muted);font-size:.98rem}
.post-body h2,.post-body h3,.post-body h4{font-family:var(--font-serif);font-weight:500;letter-spacing:-.01em;line-height:1.25;margin:34px 0 12px;color:var(--cream)}
.post-body h2{font-size:1.6rem}.post-body h3{font-size:1.3rem}.post-body h4{font-size:1.08rem}
.post-body p{margin:0 0 18px;color:var(--text-primary)}
.post-body strong{color:var(--accent-bright)}
.post-body ul,.post-body ol{margin:0 0 18px;padding-left:24px}.post-body li{margin-bottom:8px}
.post-body a{text-decoration:underline;text-decoration-color:rgba(212,165,116,.4);text-underline-offset:3px}
.post-meta{color:var(--text-muted);font-size:.9rem;margin-bottom:36px}
.empty{color:var(--text-faint);text-align:center;padding:64px 0;font-size:1.02rem}
footer{padding:28px 0;text-align:center;color:var(--text-faint);font-size:.82rem;border-top:1px solid var(--border);margin-top:48px}
footer a{color:var(--accent)}
</style></head>
<body><div class="wrap">${body}</div></body></html>`;
}

// /s/{slug}/blog — list of this business's published posts.
async function handleBusinessBlogList(env, slug) {
  try {
    const site = await env.DB.prepare('SELECT * FROM sites WHERE slug = ? AND published = 1').bind(slug).first();
    if (!site) {
      return new Response(businessBlogShell('', 'Blog', '<div class="empty">This page isn\'t live yet.</div>'), { status: 404, headers: { 'Content-Type': 'text/html' } });
    }
    const uid = site.user_id;
    const [settings, { results }] = await Promise.all([
      env.DB.prepare('SELECT business_name FROM settings WHERE user_id = ?').bind(uid).first(),
      env.DB.prepare(
        `SELECT title, slug, content, published_at FROM business_blog_posts
         WHERE user_id = ? AND status = 'published'
         ORDER BY published_at DESC LIMIT 50`
      ).bind(uid).all(),
    ]);
    const businessName = (settings && settings.business_name) || 'Our Business';
    const posts = results || [];
    const backHref = `/s/${htmxEsc(slug)}`;
    if (!posts.length) {
      const body = `<a class="back" href="${backHref}">← back to ${htmxEsc(businessName)}</a>
<div class="top"><span class="kicker">Notes from</span><h1>The Blog</h1></div>
<p class="empty">No posts yet — check back soon.</p>`;
      return new Response(businessBlogShell(businessName, 'Blog', body), { headers: { 'Content-Type': 'text/html' } });
    }
    const items = posts.map(p => `<li>
  <span class="date">${(p.published_at || '').slice(0, 10)}</span>
  <h2><a href="/s/${htmxEsc(slug)}/blog/${htmxEsc(p.slug)}">${htmxEsc(p.title)}</a></h2>
  <p class="excerpt">${htmxEsc(blogExcerptFromContent(p.content))}</p>
</li>`).join('');
    const body = `<a class="back" href="${backHref}">← back to ${htmxEsc(businessName)}</a>
<div class="top"><span class="kicker">Notes from</span><h1>The Blog</h1></div>
<ul class="post-list">${items}</ul>
<footer>© ${new Date().getFullYear()} ${htmxEsc(businessName)}</footer>`;
    return new Response(businessBlogShell(businessName, 'Blog', body), { headers: { 'Content-Type': 'text/html' } });
  } catch (e) {
    console.error('Business blog list error:', e);
    return new Response(businessBlogShell('', 'Blog', '<p class="empty">Could not load the blog.</p>'), { status: 500, headers: { 'Content-Type': 'text/html' } });
  }
}

// /s/{slug}/blog/:postslug — a single published business post.
async function handleBusinessBlogPost(env, slug, postSlug) {
  try {
    const site = await env.DB.prepare('SELECT * FROM sites WHERE slug = ? AND published = 1').bind(slug).first();
    if (!site) {
      return new Response(businessBlogShell('', 'Not found', '<div class="empty">Not found.</div>'), { status: 404, headers: { 'Content-Type': 'text/html' } });
    }
    const post = await env.DB.prepare(
      `SELECT * FROM business_blog_posts WHERE user_id = ? AND slug = ? AND status = 'published'`
    ).bind(site.user_id, postSlug).first();
    if (!post) {
      const body = `<a class="back" href="/s/${htmxEsc(slug)}/blog">← all posts</a>
<div class="empty">This post doesn't exist or isn't published.</div>`;
      return new Response(businessBlogShell('', 'Not found', body), { status: 404, headers: { 'Content-Type': 'text/html' } });
    }
    const settings = await env.DB.prepare('SELECT business_name FROM settings WHERE user_id = ?').bind(site.user_id).first();
    const businessName = (settings && settings.business_name) || 'Our Business';
    const body = `<a class="back" href="/s/${htmxEsc(slug)}/blog">← all posts</a>
<h1 style="font-family:var(--font-serif);font-weight:500;font-size:2.4rem;letter-spacing:-.02em;line-height:1.15;margin-bottom:10px">${htmxEsc(post.title)}</h1>
<div class="post-meta">${(post.published_at || '').slice(0, 10)} · ${htmxEsc(businessName)}</div>
<div class="post-body">${blogMarkdownToHtml(post.content)}</div>
<footer>© ${new Date().getFullYear()} ${htmxEsc(businessName)}</footer>`;
    return new Response(businessBlogShell(businessName, post.title, body), { headers: { 'Content-Type': 'text/html' } });
  } catch (e) {
    console.error('Business blog post error:', e);
    return new Response(businessBlogShell('', 'Error', '<p class="empty">Could not load this post.</p>'), { status: 500, headers: { 'Content-Type': 'text/html' } });
  }
}

// ═══════════════════════════════════════════════════════════════════════
// SOCIAL MEDIA AUTO-POSTS (addon_social, $9.95/mo)
// Auto-generates draft posts from a business's reviews, completed jobs
// (photos), and KB items, then publishes them to Facebook/Instagram. Works
// entirely in draft-only mode when no API tokens are configured.
// ═══════════════════════════════════════════════════════════════════════

// Trims + ellipsizes review text to fit a post. Plain text (no quotes) so it
// reads cleanly inside the larger caption template.
function socialExcerpt(text, max) {
  const t = String(text || '').replace(/\s+/g, ' ').trim();
  return t.length > max ? t.slice(0, max).trimEnd() + '…' : t;
}

// generatePostFromReview — turn a 5-star review into a shareable caption.
// `review` shape: { author_name, rating, text }. Returns a generator payload.
function generatePostFromReview(review, businessName) {
  const bn = businessName || 'we';
  const who = review.author_name || 'A happy customer';
  const excerpt = socialExcerpt(review.text, 160);
  const content = `⭐⭐⭐⭐⭐\n"${excerpt}"\n— ${who}, happy customer of ${bn}.\nReady to be next? Book online or give us a call. 📞`;
  return { content, image_url: review.profile_photo_url || null, source_type: 'review', source_id: review.id || null };
}

// generatePostFromJob — a completed job (a before/after photo). `photo` shape:
// { id, data, caption, type }. The image is kept as-is (base64 data URI or URL);
// the publish step decides whether it can be sent to the platform.
function generatePostFromJob(photo, businessName, industry) {
  const bn = businessName || 'We';
  const ind = industry || 'project';
  const tag = String(bn).replace(/\s+/g, '');
  const content = `Another ${ind} project complete! 🏗️ Swipe to see the before & after.\nNeed ${ind} work? DM us or book a free estimate.\n#${tag} #Local${ind.replace(/\s+/g, '')}`;
  return { content, image_url: photo.data || null, source_type: 'job', source_id: photo.id || null };
}

// generatePostFromKB — a service / KB item. `item` shape:
// { id, item, price, notes }. Surfaces the service + starting price.
function generatePostFromKB(item, businessName, industry) {
  const bn = businessName || 'We';
  const ind = industry || 'services';
  const tag = String(bn).replace(/\s+/g, '');
  const svc = item.item || ind;
  const notes = item.notes ? ` ${item.notes}` : '';
  const priceLine = (item.price != null && item.price !== '')
    ? ` starting at $${item.price}`
    : '';
  const content = `Did you know? ${svc}:${notes}\nWe offer ${svc}${priceLine}. DM us for a quote! 💬\n#${tag} #Local${ind.replace(/\s+/g, '')}`;
  return { content, image_url: null, source_type: 'kb_item', source_id: item.id || null };
}

// publishToFacebook — POST to the Page feed via the Graph API. Returns
// { ok, postId? } on success or { ok:false, draft:true, message } when no
// token is configured (draft-only mode). One network call; never throws.
async function publishToFacebook(env, pageToken, content, imageUrl) {
  if (!pageToken) return { ok: false, draft: true, message: 'Facebook not configured. Set your Facebook Page Token in Settings.' };
  try {
    const form = new URLSearchParams();
    form.append('message', content);
    form.append('access_token', pageToken);
    // Facebook will fetch a public image URL. base64 data URIs are NOT accepted
    // by the Graph API for photo posts via /feed, so only attach real URLs.
    if (imageUrl && /^https?:\/\//i.test(imageUrl)) form.append('url', imageUrl);
    const res = await fetch(`https://graph.facebook.com/v19.0/me/feed`, {
      method: 'POST', body: form,
    });
    const data = await res.json();
    if (data.id) return { ok: true, postId: data.id };
    return { ok: false, error: (data.error && data.error.message) || 'Unknown Facebook error' };
  } catch (e) {
    return { ok: false, error: String(e && e.message || e) };
  }
}

// publishToInstagram — two-step Content Publishing API (create container,
// then publish). Requires an Instagram Business Account ID + the page token.
// Instagram mandates an image; a data-URI base64 image is uploaded via the
// /media endpoint's image_url param, which only accepts public URLs.
async function publishToInstagram(env, igUserId, accessToken, content, imageUrl) {
  if (!accessToken || !igUserId) return { ok: false, draft: true, message: 'Instagram not configured. Set your Instagram Business Account ID in Settings.' };
  // Instagram requires an image; without one the post cannot be published.
  if (!imageUrl) return { ok: false, error: 'Instagram posts require an image.' };
  try {
    // Step 1: create the media container.
    const createForm = new URLSearchParams();
    createForm.append('image_url', imageUrl);
    createForm.append('caption', content);
    createForm.append('access_token', accessToken);
    const create = await fetch(`https://graph.facebook.com/v19.0/${igUserId}/media`, {
      method: 'POST', body: createForm,
    });
    const createData = await create.json();
    if (!createData.id) return { ok: false, error: (createData.error && createData.error.message) || 'Could not create Instagram media' };

    // Step 2: publish.
    const pubForm = new URLSearchParams();
    pubForm.append('creation_id', createData.id);
    pubForm.append('access_token', accessToken);
    const pub = await fetch(`https://graph.facebook.com/v19.0/${igUserId}/media_publish`, {
      method: 'POST', body: pubForm,
    });
    const pubData = await pub.json();
    if (pubData.id) return { ok: true, postId: pubData.id };
    return { ok: false, error: (pubData.error && pubData.error.message) || 'Unknown Instagram error' };
  } catch (e) {
    return { ok: false, error: String(e && e.message || e) };
  }
}

// Publish a single queued post to its target platform. Resolves tokens from
// the business's settings row. Updates the row's status + platform_post_id.
// Returns the publish result (also stored on the row when it fails).
async function publishOneSocialPost(env, uid, post) {
  const settings = await env.DB.prepare(
    'SELECT facebook_page_token, instagram_business_id FROM settings WHERE user_id = ?'
  ).bind(uid).first();
  const fbToken = (settings && settings.facebook_page_token) || '';
  const igId = (settings && settings.instagram_business_id) || '';
  // Instagram needs the page token too (Graph API auth).
  const igToken = fbToken;

  const result = post.platform === 'instagram'
    ? await publishToInstagram(env, igId, igToken, post.content, post.image_url)
    : await publishToFacebook(env, fbToken, post.content, post.image_url);

  if (result.ok) {
    await env.DB.prepare(
      `UPDATE social_posts SET status = 'published', platform_post_id = ?, published_at = datetime('now') WHERE id = ? AND user_id = ?`
    ).bind(result.postId, post.id, uid).run();
  } else if (result.draft) {
    // No token configured → leave as draft, surface the friendly message.
    return { ok: false, draft: true, message: result.message };
  } else {
    await env.DB.prepare(
      `UPDATE social_posts SET status = 'failed' WHERE id = ? AND user_id = ?`
    ).bind(post.id, uid).run();
    return { ok: false, error: result.error };
  }
  return { ok: true, postId: result.postId };
}

// ── Social API handlers (cookie-authed) ──

// POST /api/social/generate — body { source: 'reviews'|'jobs'|'kb', count? }.
// Creates draft posts from the business's newest reviews/photos/KB items.
// Only posts to Facebook by default (Instagram needs images + extra config).
async function handleSocialGenerate(request, env, uid) {
  try {
    const body = await request.json().catch(() => ({}));
    const source = body.source;
    const count = Math.min(Math.max(parseInt(body.count, 10) || 3, 1), 10);
    if (!['reviews', 'jobs', 'kb'].includes(source)) {
      return json({ ok: false, error: "source must be 'reviews', 'jobs', or 'kb'" }, 400);
    }
    const settings = await env.DB.prepare(
      'SELECT business_name, industry FROM settings WHERE user_id = ?'
    ).bind(uid).first();
    const businessName = (settings && settings.business_name) || '';
    const industry = (settings && settings.industry) || '';

    let drafts = [];
    if (source === 'reviews') {
      const { results } = await env.DB.prepare(
        'SELECT id, author_name, rating, text, profile_photo_url FROM reviews WHERE user_id = ? ORDER BY reviewed_at DESC, created_at DESC LIMIT ?'
      ).bind(uid, count).all();
      drafts = (results || []).filter(r => r.rating >= 4).map(r => generatePostFromReview(r, businessName));
    } else if (source === 'jobs') {
      const { results } = await env.DB.prepare(
        'SELECT id, data, caption, type FROM photos WHERE user_id = ? ORDER BY created_at DESC LIMIT ?'
      ).bind(uid, count).all();
      drafts = (results || []).map(p => generatePostFromJob(p, businessName, industry));
    } else { // kb
      const { results } = await env.DB.prepare(
        'SELECT id, item, price, notes FROM knowledge WHERE user_id = ? ORDER BY id DESC LIMIT ?'
      ).bind(uid, count).all();
      drafts = (results || []).map(item => generatePostFromKB(item, businessName, industry));
    }

    if (!drafts.length) {
      const what = source === 'reviews' ? 'reviews' : (source === 'jobs' ? 'job photos' : 'services');
      return json({ ok: false, error: `No ${what} found to generate posts from yet.` });
    }

    // Insert drafts (Facebook platform by default).
    const created = [];
    for (const d of drafts) {
      const ins = await env.DB.prepare(
        `INSERT INTO social_posts (user_id, platform, content, image_url, source_type, source_id, status)
         VALUES (?, 'facebook', ?, ?, ?, ?, 'draft')`
      ).bind(uid, d.content, d.image_url, d.source_type, d.source_id).run();
      created.push({ id: ins.meta && ins.meta.last_row_id, ...d });
    }
    return json({ ok: true, created: created.length, posts: created });
  } catch (e) {
    console.error('Social generate error:', e);
    return json({ ok: false, error: 'Could not generate posts' }, 500);
  }
}

// POST /api/social/publish — body { postId }. Publishes a single draft. When
// no platform token is configured, returns a graceful draft-mode message.
async function handleSocialPublish(request, env, uid) {
  try {
    const body = await request.json().catch(() => ({}));
    const postId = parseInt(body.postId, 10);
    if (!postId) return json({ ok: false, error: 'postId is required' }, 400);
    const post = await env.DB.prepare(
      'SELECT id, platform, content, image_url, status FROM social_posts WHERE id = ? AND user_id = ?'
    ).bind(postId, uid).first();
    if (!post) return json({ ok: false, error: 'Post not found' }, 404);
    if (post.status === 'published') return json({ ok: false, error: 'Already published' });
    const result = await publishOneSocialPost(env, uid, post);
    return json(result, result.ok ? 200 : (result.draft ? 200 : 500));
  } catch (e) {
    console.error('Social publish error:', e);
    return json({ ok: false, error: 'Could not publish post' }, 500);
  }
}

// POST /api/social/publish-all — publish every draft in the queue. Returns a
// per-post summary; one failure never aborts the batch.
async function handleSocialPublishAll(request, env, uid) {
  try {
    const { results } = await env.DB.prepare(
      `SELECT id, platform, content, image_url FROM social_posts WHERE user_id = ? AND status = 'draft' ORDER BY created_at ASC`
    ).bind(uid).all();
    const drafts = results || [];
    if (!drafts.length) return json({ ok: true, published: 0, message: 'No drafts to publish.' });
    const summary = [];
    let okCount = 0;
    for (const p of drafts) {
      const r = await publishOneSocialPost(env, uid, p);
      if (r.ok) okCount++;
      summary.push({ id: p.id, ok: !!r.ok, draft: !!r.draft, error: r.error || null });
    }
    return json({ ok: true, published: okCount, total: drafts.length, summary });
  } catch (e) {
    console.error('Social publish-all error:', e);
    return json({ ok: false, error: 'Could not publish posts' }, 500);
  }
}

// DELETE /api/social/posts/:id — remove a draft from the queue.
async function handleSocialDelete(request, env, uid, postId) {
  try {
    await env.DB.prepare(
      `DELETE FROM social_posts WHERE id = ? AND user_id = ? AND status = 'draft'`
    ).bind(postId, uid).run();
    return json({ ok: true });
  } catch (e) {
    console.error('Social delete error:', e);
    return json({ ok: false, error: 'Could not delete post' }, 500);
  }
}

// ── Social dashboard page: /p/social ──
// Generate drafts from reviews / jobs / KB, then publish or delete them. The
// whole system works in draft-only mode when no platform token is configured.
async function handleSocialHtmx(request, env, uid, ctx) {
  try {
    const settings = await env.DB.prepare(
      'SELECT addon_social, business_name, facebook_page_token, instagram_business_id FROM settings WHERE user_id = ?'
    ).bind(uid).first();
    const enabled = !!(settings && settings.addon_social);
    const fbConfigured = !!(settings && settings.facebook_page_token);
    const igConfigured = !!(settings && settings.instagram_business_id && settings.facebook_page_token);

    // Add-on OFF → upgrade prompt (mirror the Blog page's gate).
    if (!enabled) {
      const body = `<div class="app">${sidebarNav('social', undefined, ctx)}<div class="content" style="max-width:680px">
<span class="eyebrow">Add-on</span>
<h1>Social Media <em>Auto-Posts</em></h1>
<p class="sub">Turn your reviews, completed jobs, and services into ready-to-publish Facebook & Instagram posts — automatically.</p>
<div class="card glow" style="margin-top:28px;padding:32px">
  <div style="display:flex;align-items:center;gap:18px;margin-bottom:18px">
    <span style="font-size:2rem">📣</span>
    <div>
      <div style="font-weight:600;font-size:1.1rem">Social Media Auto-Posts</div>
      <div style="color:var(--text-muted);font-size:.9rem">Auto-generate · one-click publish · schedule-ready</div>
    </div>
    <span style="margin-left:auto;font-family:var(--font-mono);color:var(--accent-amber);font-weight:600">$9.95/mo</span>
  </div>
  <ul style="color:var(--text-muted);font-size:.92rem;line-height:1.9;padding-left:20px;margin-bottom:24px">
    <li>Posts written from <strong style="color:var(--cream)">your reviews, jobs & services</strong></li>
    <li>Publish to Facebook & Instagram in one click</li>
    <li>Works in <strong style="color:var(--cream)">draft mode</strong> — generate & review before anything goes live</li>
  </ul>
  <a class="btn" href="/p/billing">Enable in Billing →</a>
</div>
</div></div>`;
      return new Response(simpleShell('Social Media Auto-Posts', body), { headers: { 'Content-Type': 'text/html' } });
    }

    // Add-on ON → render the composer + queue.
    const { results } = await env.DB.prepare(
      `SELECT id, platform, content, image_url, source_type, status, published_at, created_at
       FROM social_posts WHERE user_id = ? ORDER BY created_at DESC LIMIT 200`
    ).bind(uid).all();
    const posts = results || [];

    const statusBadge = (s) => {
      if (s === 'published') return '<span class="status-pill pill-booked">Published</span>';
      if (s === 'failed') return '<span class="status-pill" style="background:rgba(248,81,73,.18);color:#f87373">Failed</span>';
      return '<span class="status-pill pill-scheduled">Draft</span>';
    };
    const sourceLabel = (t) => ({ review: 'Review', job: 'Job', kb_item: 'Service', custom: 'Custom' }[t] || '—');

    const rowHtml = posts.length
      ? posts.map(p => {
          const preview = htmxEsc((p.content || '').replace(/\s+/g, ' ').slice(0, 80)) + ((p.content || '').length > 80 ? '…' : '');
          const isDraft = p.status === 'draft';
          return `<tr data-id="${p.id}">
  <td style="text-transform:capitalize">${htmxEsc(p.platform)}</td>
  <td style="max-width:360px;color:var(--text-muted)">${preview}</td>
  <td>${sourceLabel(p.source_type)}</td>
  <td>${statusBadge(p.status)}</td>
  <td style="white-space:nowrap">
    ${isDraft ? `<button class="btn btn-sm" onclick="pubOne(${p.id},this)">Post now</button>` : ''}
    ${isDraft ? ` <button class="btn btn-ghost btn-sm" onclick="delOne(${p.id})">Delete</button>` : ''}
  </td>
</tr>`;
        }).join('')
      : `<tr><td colspan="5" style="text-align:center;color:var(--text-faint);padding:32px">No posts yet. Generate some drafts above to get started.</td></tr>`;

    const configNote = (!fbConfigured && !igConfigured)
      ? `<div class="note-box" style="margin-bottom:18px;border-color:rgba(212,165,116,.4);color:var(--accent-amber)">Draft mode: no Facebook/Instagram token configured. You can still generate and review posts — add a token in <a href="/settings-htmx" style="color:var(--accent)">Settings</a> to publish.</div>`
      : (!igConfigured
        ? `<div class="note-box" style="margin-bottom:18px;color:var(--text-muted)">Facebook connected. Instagram not configured (needs a Business Account ID in Settings).</div>`
        : `<div class="note-box" style="margin-bottom:18px;border-color:rgba(63,185,80,.3);color:#7fd692">Facebook & Instagram connected — ready to publish.</div>`);

    const body = `<div class="app">${sidebarNav('social', undefined, ctx)}<div class="content" style="max-width:980px">
<span class="eyebrow">Add-on · Active</span>
<h1>Social Media <em>Auto-Posts</em></h1>
<p class="sub">Generate posts from your reviews, jobs, and services — then publish to Facebook & Instagram.</p>

<h3 style="margin-top:26px">Generate drafts</h3>
<div style="display:flex;gap:10px;flex-wrap:wrap;margin:12px 0 6px">
  <button class="btn btn-sm" id="gen-reviews" onclick="gen('reviews',this)">⭐ From reviews</button>
  <button class="btn btn-sm" id="gen-jobs" onclick="gen('jobs',this)">🏗️ From recent jobs</button>
  <button class="btn btn-sm" id="gen-kb" onclick="gen('kb',this)">💬 From services</button>
</div>
<div id="gen-msg" style="margin:10px 0"></div>

${configNote}

<h3>Post queue <span style="color:var(--text-faint);font-weight:400;font-size:.85rem">(${posts.length})</span></h3>
<div style="display:flex;gap:10px;margin:0 0 12px">
  <button class="btn btn-ghost btn-sm" onclick="pubAll(this)">Publish all drafts</button>
  <button class="btn btn-ghost btn-sm" onclick="location.reload()">↻ Refresh</button>
</div>
<table>
  <thead><tr><th>Platform</th><th>Content</th><th>Source</th><th>Status</th><th>Actions</th></tr></thead>
  <tbody id="queue">${rowHtml}</tbody>
</table>
<p class="sub" style="margin-top:18px;font-size:.82rem;color:var(--text-faint)">Posts are generated from your data (reviews, job photos, services). Review each one before publishing. Toggle this add-on in Billing.</p>
<script>
function setMsg(html){var m=document.getElementById('gen-msg');m.innerHTML=html;}
async function gen(src,btn){
  btn.disabled=true;var orig=btn.textContent;btn.textContent='Working…';
  try{
    var r=await fetch('/api/social/generate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({source:src,count:3})});
    var d=await r.json();
    if(d.ok){setMsg('<div class="note-box" style="border-color:rgba(63,185,80,.3);color:#7fd692">✓ Created '+d.created+' draft'+(d.created===1?'':'s')+'. Reloading…</div>');setTimeout(function(){location.reload();},900);}
    else{setMsg('<div class="note-box" style="border-color:rgba(248,113,113,.3);color:#f87373">✗ '+(d.error||'Could not generate')+'</div>');btn.disabled=false;btn.textContent=orig;}
  }catch(e){setMsg('<div class="note-box" style="color:#f87373">✗ Connection error</div>');btn.disabled=false;btn.textContent=orig;}
}
async function pubOne(id,btn){
  btn.disabled=true;var orig=btn.textContent;btn.textContent='Posting…';
  try{
    var r=await fetch('/api/social/publish',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({postId:id})});
    var d=await r.json();
    if(d.ok){setMsg('<div class="note-box" style="border-color:rgba(63,185,80,.3);color:#7fd692">✓ Published!</div>');setTimeout(function(){location.reload();},900);}
    else if(d.draft){alert(d.message||'Draft mode — no token configured.');btn.disabled=false;btn.textContent=orig;}
    else{setMsg('<div class="note-box" style="border-color:rgba(248,113,113,.3);color:#f87373">✗ '+(d.error||'Could not publish')+'</div>');btn.disabled=false;btn.textContent=orig;}
  }catch(e){setMsg('<div class="note-box" style="color:#f87373">✗ Connection error</div>');btn.disabled=false;btn.textContent=orig;}
}
async function pubAll(btn){
  if(!confirm('Publish all drafts now?'))return;
  btn.disabled=true;var orig=btn.textContent;btn.textContent='Publishing…';
  try{
    var r=await fetch('/api/social/publish-all',{method:'POST'});
    var d=await r.json();
    if(d.ok){setMsg('<div class="note-box" style="border-color:rgba(63,185,80,.3);color:#7fd692">✓ Published '+d.published+' of '+(d.total||0)+'.</div>');setTimeout(function(){location.reload();},1200);}
    else if(d.draft){alert(d.message||'Draft mode — no token configured.');btn.disabled=false;btn.textContent=orig;}
    else{setMsg('<div class="note-box" style="border-color:rgba(248,113,113,.3);color:#f87373">✗ '+(d.error||'Could not publish')+'</div>');btn.disabled=false;btn.textContent=orig;}
  }catch(e){setMsg('<div class="note-box" style="color:#f87373">✗ Connection error</div>');btn.disabled=false;btn.textContent=orig;}
}
async function delOne(id){
  if(!confirm('Delete this draft?'))return;
  try{
    var r=await fetch('/api/social/posts/'+id,{method:'DELETE'});
    var d=await r.json();
    if(d.ok){var tr=document.querySelector('tr[data-id="'+id+'"]');if(tr)tr.remove();}
    else{alert(d.error||'Could not delete');}
  }catch(e){alert('Connection error');}
}
</script>
</div></div>`;
    return new Response(simpleShell('Social Media Auto-Posts', body), { headers: { 'Content-Type': 'text/html' } });
  } catch (e) {
    console.error('Social htmx error:', e);
    return new Response(simpleShell('Error', '<h1>⚠️ Error</h1><p style="color:#f85149">Could not load the social dashboard.</p>'), { status: 500, headers: { 'Content-Type': 'text/html' } });
  }
}

// POST /api/cron/social-autopost — for each business with addon_social=1 and a
// configured Facebook token: generate one post from their newest review and
// publish it, skipping any business that already posted in the last 24h.
// Optionally guarded by CRON_SECRET. One failure never aborts the batch.
async function handleSocialAutopostCron(request, env) {
  const secret = request.headers.get('x-cron-secret');
  if (env.CRON_SECRET && secret !== env.CRON_SECRET) {
    return json({ ok: false, error: 'Unauthorized' }, 401);
  }
  try {
    const { results } = await env.DB.prepare(
      `SELECT user_id FROM settings WHERE addon_social = 1 AND facebook_page_token IS NOT NULL AND facebook_page_token != ""`
    ).all();
    const accounts = results || [];
    const summary = [];
    let posted = 0;
    for (const acct of accounts) {
      const uid = acct.user_id;
      try {
        // Skip if they've posted in the last 24h (any status).
        const recent = await env.DB.prepare(
          `SELECT id FROM social_posts WHERE user_id = ? AND created_at > datetime('now','-24 hours') LIMIT 1`
        ).bind(uid).first();
        if (recent) { summary.push({ user_id: uid, skipped: true }); continue; }

        const settings = await env.DB.prepare(
          'SELECT business_name FROM settings WHERE user_id = ?'
        ).bind(uid).first();
        const businessName = (settings && settings.business_name) || '';
        const { results: revs } = await env.DB.prepare(
          'SELECT id, author_name, rating, text, profile_photo_url FROM reviews WHERE user_id = ? AND rating >= 4 ORDER BY reviewed_at DESC LIMIT 1'
        ).bind(uid).all();
        if (!revs || !revs.length) { summary.push({ user_id: uid, skipped: 'no reviews' }); continue; }

        const draft = generatePostFromReview(revs[0], businessName);
        const ins = await env.DB.prepare(
          `INSERT INTO social_posts (user_id, platform, content, image_url, source_type, source_id, status)
           VALUES (?, 'facebook', ?, ?, 'review', ?, 'draft')`
        ).bind(uid, draft.content, draft.image_url, draft.source_id).run();
        const newId = ins.meta && ins.meta.last_row_id;
        const r = await publishOneSocialPost(env, uid, { id: newId, platform: 'facebook', content: draft.content, image_url: draft.image_url });
        if (r.ok) posted++;
        summary.push({ user_id: uid, ok: !!r.ok, draft: !!r.draft, error: r.error || null });
      } catch (e) {
        summary.push({ user_id: uid, error: String(e && e.message || e) });
      }
    }
    return json({ ok: true, accounts: accounts.length, posted, summary });
  } catch (e) {
    console.error('Social autopost cron error:', e);
    return json({ ok: false, error: 'Autopost cron failed' }, 500);
  }
}

// ── Business dashboard page: /p/blog ──
// Shows the business's own generated posts (read-only), confirms the add-on
// is active, links to their public blog, and has a "generate one now" button.
// Gated by addon_blog: if off, shows a warm upgrade prompt linking to billing.
async function handleBusinessBlogHtmx(request, env, uid, ctx) {
  try {
    const [settings, site, sub] = await Promise.all([
      env.DB.prepare('SELECT addon_blog, business_name FROM settings WHERE user_id = ?').bind(uid).first(),
      env.DB.prepare('SELECT slug, published FROM sites WHERE user_id = ?').bind(uid).first(),
      env.DB.prepare('SELECT status FROM subscriptions WHERE user_id = ?').bind(uid).first(),
    ]);
    const enabled = !!(settings && settings.addon_blog);
    const businessName = (settings && settings.business_name) || '';

    // Add-on OFF → upgrade prompt (don't even read posts).
    if (!enabled) {
      const body = `<div class="app">${sidebarNav('blog', undefined, ctx)}<div class="content" style="max-width:680px">
<span class="eyebrow">Add-on</span>
<h1>AI Blog <em>Posts</em></h1>
<p class="sub">Three fresh, industry-relevant blog posts published to your website every week — automatically. You do nothing.</p>
<div class="card glow" style="margin-top:28px;padding:32px">
  <div style="display:flex;align-items:center;gap:18px;margin-bottom:18px">
    <span style="font-size:2rem">✍️</span>
    <div>
      <div style="font-weight:600;font-size:1.1rem">AI Blog Posts</div>
      <div style="color:var(--text-muted);font-size:.9rem">3 posts/week · auto-written & published</div>
    </div>
    <span style="margin-left:auto;font-family:var(--font-mono);color:var(--accent-amber);font-weight:600">$14.95/mo</span>
  </div>
  <ul style="color:var(--text-muted);font-size:.92rem;line-height:1.9;padding-left:20px;margin-bottom:24px">
    <li>Posts written from <strong style="color:var(--cream)">your industry & services</strong></li>
    <li>SEO-friendly titles, local-area references</li>
    <li>Live on your website at <code style="font-family:var(--font-mono);color:var(--accent-bright)">/blog</code></li>
    <li>Email summary each time a post goes live</li>
  </ul>
  <a class="btn" href="/p/billing">Enable in Billing →</a>
</div>
</div></div>`;
      return new Response(simpleShell('AI Blog Posts', body), { headers: { 'Content-Type': 'text/html' } });
    }

    // Add-on ON → list their posts.
    const { results } = await env.DB.prepare(
      `SELECT id, title, slug, published_at FROM business_blog_posts
       WHERE user_id = ? AND status = 'published'
       ORDER BY published_at DESC LIMIT 50`
    ).bind(uid).all();
    const posts = results || [];
    const publicUrl = (site && site.slug && site.published) ? `/s/${site.slug}/blog` : null;
    const rowHtml = posts.length
      ? posts.map(p => `<tr style="cursor:pointer" onclick="window.location='/p/blog/${htmxEsc(p.slug)}'">
  <td><strong style="color:var(--cream)">${htmxEsc(p.title)}</strong></td>
  <td style="font-family:var(--font-mono);font-size:.8rem;color:var(--text-muted)">${(p.published_at || '').slice(0, 10)}</td>
</tr>`).join('')
      : `<tr><td colspan="2" style="text-align:center;color:var(--text-faint);padding:32px">No posts yet. The next one generates on Mon/Wed/Fri — or generate one now below.</td></tr>`;

    const body = `<div class="app">${sidebarNav('blog', undefined, ctx)}<div class="content" style="max-width:760px">
<span class="eyebrow">Add-on · Active</span>
<h1>AI Blog <em>Posts</em></h1>
<p class="sub">3 posts published automatically each week${businessName ? ` for ${htmxEsc(businessName)}` : ''}.</p>
<div style="display:flex;gap:10px;flex-wrap:wrap;margin:22px 0">
  <button class="btn btn-sm" id="gen-btn" onclick="genNow(this)">✨ Generate a post now</button>
  ${publicUrl ? `<a class="btn btn-ghost btn-sm" href="${publicUrl}" target="_blank" rel="noopener">View live blog →</a>` : ''}
</div>
<div id="gen-msg" style="margin:14px 0"></div>
<h3>Published posts <span style="color:var(--text-faint);font-weight:400">(${posts.length})</span></h3>
<table>
  <thead><tr><th>Title</th><th>Published</th></tr></thead>
  <tbody>${rowHtml}</tbody>
</table>
<p class="sub" style="margin-top:18px;font-size:.82rem;color:var(--text-faint)">Posts are auto-written from your settings (industry, service area, services). Edit your details in Settings to steer the content. Want more control? Toggle this off in Billing.</p>
<script>
async function genNow(btn){
  btn.disabled=true;var orig=btn.textContent;btn.textContent='Writing…';
  var msg=document.getElementById('gen-msg');
  try{
    var r=await fetch('/api/blog/generate',{method:'POST'});
    var d=await r.json();
    if(d.ok){msg.innerHTML='<div class="note-box" style="border-color:rgba(212,165,116,.4);color:var(--accent-amber)">✓ Posted: '+d.post.title+'</div>';setTimeout(function(){location.reload();},1200);}
    else{msg.innerHTML='<div class="note-box" style="border-color:rgba(248,113,113,.4);color:var(--danger)">✗ '+(d.error||'Could not generate')+'</div>';btn.disabled=false;btn.textContent=orig;}
  }catch(e){msg.innerHTML='<div class="note-box" style="color:var(--danger)">✗ Connection error</div>';btn.disabled=false;btn.textContent=orig;}
}
</script>
</div></div>`;
    return new Response(simpleShell('AI Blog Posts', body), { headers: { 'Content-Type': 'text/html' } });
  } catch (e) {
    console.error('Business blog htmx error:', e);
    return new Response(simpleShell('Error', '<h1>⚠️ Error</h1><p style="color:#f85149">Could not load your blog.</p>'), { status: 500, headers: { 'Content-Type': 'text/html' } });
  }
}

// POST /api/blog/generate — business generates one of their own posts now.
// Cookie-authed. Respects the add-on flag (must be on).
async function handleBlogGenerate(request, env, uid) {
  try {
    const settings = await env.DB.prepare('SELECT addon_blog FROM settings WHERE user_id = ?').bind(uid).first();
    if (!settings || !settings.addon_blog) return json({ ok: false, error: 'AI Blog Posts add-on is not enabled' }, 403);
    const res = await generateBusinessBlogPost(env, uid);
    if (res.ok) notifyBusinessOfPost(env, uid, res.post);
    return json(res, res.ok ? 200 : 500);
  } catch (e) {
    console.error('Blog generate error:', e);
    return json({ ok: false, error: 'Could not generate post' }, 500);
  }
}

// /p/blog/:postslug — a business reads one of their own posts in the
// dashboard (read-only). Falls back to the public blog if their site is
// published; otherwise renders inline.
async function handleBusinessBlogDetailHtmx(request, env, uid, postSlug, ctx) {
  try {
    const post = await env.DB.prepare(
      `SELECT * FROM business_blog_posts WHERE user_id = ? AND slug = ?`
    ).bind(uid, postSlug).first();
    if (!post) {
      return new Response(simpleShell('Not found', `<div class="app">${sidebarNav('blog', undefined, ctx)}<div class="content"><h1>404</h1><p style="color:var(--text-muted)">That post doesn't exist.</p><p style="margin-top:18px"><a class="btn btn-ghost btn-sm" href="/p/blog">← Back to blog</a></p></div></div>`), { status: 404, headers: { 'Content-Type': 'text/html' } });
    }
    const [settings, site] = await Promise.all([
      env.DB.prepare('SELECT business_name FROM settings WHERE user_id = ?').bind(uid).first(),
      env.DB.prepare('SELECT slug, published FROM sites WHERE user_id = ?').bind(uid).first(),
    ]);
    const businessName = (settings && settings.business_name) || '';
    const publicHref = (site && site.slug && site.published) ? `/s/${site.slug}/blog/${post.slug}` : null;
    const body = `<div class="app">${sidebarNav('blog', undefined, ctx)}<div class="content" style="max-width:720px">
<a class="btn btn-ghost btn-sm" href="/p/blog" style="margin-bottom:18px">← All posts</a>
<h1 style="font-family:var(--font-serif);font-weight:500;font-size:2.1rem;letter-spacing:-.02em;line-height:1.15;margin-bottom:8px">${htmxEsc(post.title)}</h1>
<div style="color:var(--text-muted);font-size:.88rem;margin-bottom:28px">${(post.published_at || '').slice(0, 10)}${businessName ? ' · ' + htmxEsc(businessName) : ''}</div>
<article class="kb-prose" style="color:var(--text-primary);line-height:1.7">
${blogMarkdownToHtml(post.content)}
</article>
${publicHref ? `<p style="margin-top:28px"><a class="btn btn-ghost btn-sm" href="${publicHref}" target="_blank" rel="noopener">View on your live site →</a></p>` : ''}
</div></div>`;
    return new Response(simpleShell(post.title, body), { headers: { 'Content-Type': 'text/html' } });
  } catch (e) {
    console.error('Business blog detail htmx error:', e);
    return new Response(simpleShell('Error', '<h1>⚠️ Error</h1><p style="color:#f85149">Could not load this post.</p>'), { status: 500, headers: { 'Content-Type': 'text/html' } });
  }
}

// ── Admin: /p/admin/cblogs ──
// Lists every business with the blog add-on, per-account toggle, post count,
// last-posted date, a force-generate button, and a link to their public blog.
async function handleAdminCblogs(request, env, uid) {
  const denied = requireAdmin(uid);
  if (denied) return denied;
  try {
    const url = new URL(request.url);
    const gen = url.searchParams.get('gen') === '1';
    const toggled = url.searchParams.get('toggled') === '1';
    // All accounts with the blog add-on, joined to their site + post stats.
    const { results } = await env.DB.prepare(
      `SELECT s.user_id, s.business_name, s.industry,
              st.slug AS site_slug, st.published AS site_published,
              (SELECT COUNT(*) FROM business_blog_posts cb WHERE cb.user_id = s.user_id) AS post_count,
              (SELECT MAX(published_at) FROM business_blog_posts cb WHERE cb.user_id = s.user_id) AS last_post
       FROM settings s
       LEFT JOIN sites st ON st.user_id = s.user_id
       WHERE s.addon_blog = 1
       ORDER BY (last_post IS NULL), last_post DESC, s.business_name`
    ).all();
    const rows = results || [];

    // Also surface accounts where it's OFF but they have posts (legacy), so an
    // admin can see orphaned content. Kept light: just a count line.
    const offRow = await env.DB.prepare(
      `SELECT COUNT(*) AS c FROM settings WHERE addon_blog = 0`
    ).first();
    const offCount = (offRow && offRow.c) || 0;

    const rowHtml = rows.length
      ? rows.map(r => {
          const blogHref = (r.site_slug && r.site_published) ? `/s/${r.site_slug}/blog` : null;
          return `<tr>
  <td>
    <strong style="color:var(--cream)">${htmxEsc(r.business_name || '(no name)')}</strong>
    <div style="font-size:.76rem;color:var(--text-faint)">uid ${r.user_id}${r.industry ? ' · ' + htmxEsc(r.industry) : ''}</div>
  </td>
  <td style="text-align:center;font-family:var(--font-mono)">${r.post_count || 0}</td>
  <td style="font-family:var(--font-mono);font-size:.8rem;color:var(--text-muted)">${r.last_post ? String(r.last_post).slice(0, 10) : '<span style="color:var(--text-faint)">—</span>'}</td>
  <td onclick="event.stopPropagation()" style="white-space:nowrap">
    <form method="post" action="/api/admin/cblogs/generate" style="display:inline"><input type="hidden" name="user_id" value="${r.user_id}"><button class="btn btn-ghost btn-sm" type="submit" style="font-size:.74rem;padding:5px 10px">Generate</button></form>
    ${blogHref ? `<a class="btn btn-ghost btn-sm" href="${blogHref}" target="_blank" rel="noopener" style="font-size:.74rem;padding:5px 10px">Preview</a>` : ''}
    <form method="post" action="/api/admin/cblogs/toggle" style="display:inline" onsubmit="return confirm('Turn OFF AI Blog Posts for ${htmxEsc((r.business_name || '').replace(/'/g, ''))}?')"><input type="hidden" name="user_id" value="${r.user_id}"><input type="hidden" name="enabled" value="0"><button class="btn btn-ghost btn-sm" type="submit" style="font-size:.74rem;padding:5px 10px;color:var(--danger);border-color:rgba(248,113,113,.4)">Off</button></form>
  </td>
</tr>`;
        }).join('')
      : `<tr><td colspan="4" style="text-align:center;color:var(--text-faint);padding:32px">No businesss have the AI Blog Posts add-on enabled yet.</td></tr>`;

    const body = `
<span class="eyebrow">Admin · AI Blog Posts</span>
<h1>Business <em>blogs</em></h1>
<p class="sub">${rows.length} account${rows.length === 1 ? '' : 's'} with the add-on · $14.95/mo each · auto-generates 3 posts/week (Mon/Wed/Fri)</p>
${gen ? `<div class="note-box" style="border-color:rgba(212,165,116,.4);color:var(--accent-amber);margin:18px 0">✓ Post generated.</div>` : ''}
${toggled ? `<div class="note-box" style="border-color:rgba(212,165,116,.4);color:var(--accent-amber);margin:18px 0">✓ Add-on updated.</div>` : ''}
<h3 style="margin-top:28px">Active accounts</h3>
<table>
  <thead><tr><th>Business</th><th style="text-align:center">Posts</th><th>Last post</th><th></th></tr></thead>
  <tbody>${rowHtml}</tbody>
</table>
<p class="sub" style="margin-top:14px;font-size:.82rem;color:var(--text-faint)">${offCount} other account${offCount === 1 ? '' : 's'} have the add-on off. Enable it per-account from <a href="/p/admin/accounts" style="color:var(--accent-amber)">Accounts</a>.</p>
`;
    return new Response(adminShell('cblogs', 'Admin · Business Blogs', body), { headers: { 'Content-Type': 'text/html' } });
  } catch (e) {
    console.error('Admin cblogs error:', e);
    return adminErrorPage('cblogs', 'Could not load business blogs.');
  }
}

// POST /api/admin/cblogs/toggle — admin flips addon_blog for any account.
// Body (form-encoded): user_id, enabled. Admin-only.
async function handleAdminCblogsToggle(request, env, uid) {
  const denied = requireAdmin(uid);
  if (denied) return denied;
  try {
    const form = await request.formData();
    const targetUid = parseInt(form.get('user_id'), 10);
    const enabled = form.get('enabled') === '1' || form.get('enabled') === 'on' ? 1 : 0;
    if (!targetUid) return adminRedirect(request, '/p/admin/cblogs', 303);
    await env.DB.prepare('UPDATE settings SET addon_blog = ? WHERE user_id = ?').bind(enabled, targetUid).run();
    return adminRedirect(request, '/p/admin/cblogs?toggled=1', 303);
  } catch (e) {
    console.error('Admin cblogs toggle error:', e);
    return adminRedirect(request, '/p/admin/cblogs', 303);
  }
}

// POST /api/admin/cblogs/generate — admin force-generates a post for an account.
// Body (form-encoded): user_id. Admin-only. Bypasses the add-on check so an
// admin can seed content for a trial account.
async function handleAdminCblogsGenerate(request, env, uid) {
  const denied = requireAdmin(uid);
  if (denied) return denied;
  try {
    const form = await request.formData();
    const targetUid = parseInt(form.get('user_id'), 10);
    if (!targetUid) return adminRedirect(request, '/p/admin/cblogs', 303);
    const res = await generateBusinessBlogPost(env, targetUid);
    if (res.ok) notifyBusinessOfPost(env, targetUid, res.post);
    return adminRedirect(request, '/p/admin/cblogs?gen=1', 303);
  } catch (e) {
    console.error('Admin cblogs generate error:', e);
    return adminRedirect(request, '/p/admin/cblogs', 303);
  }
}


// ═══════════════════════════════════════════════════════════════════════
// BLOG — public pages (/blog, /blog/:slug) + admin CRUD (/p/admin/blog)
// Markdown content converted to HTML server-side. Amber-monotone, Fraunces
// headings, 720px reading width. No external libraries.
// ═══════════════════════════════════════════════════════════════════════

// Slugify a title into a URL-safe slug: lowercase, hyphens, ascii-only.
// "How Emma Answers Calls!" -> "how-emma-answers-calls".
function blogSlugify(title) {
  return String(title || '')
    .toLowerCase().trim()
    .replace(/['"]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'post';
}

// Auto-derive a short plain-text excerpt from markdown content (first ~160
// chars of visible text). Used when the admin leaves excerpt blank.
function blogExcerptFromContent(content) {
  const text = String(content || '')
    .replace(/^#{1,6}\s+/gm, '')      // strip heading markers
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '') // strip images
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1') // links -> label
    .replace(/[*_`>#-]/g, ' ')         // strip emphasis/markup chars
    .replace(/\s+/g, ' ')
    .trim();
  return text.slice(0, 157) + (text.length > 157 ? '…' : '');
}

// Minimal, safe markdown -> HTML converter. HTML-escapes first (XSS-safe),
// then applies block transformations line-by-line, then inline. Supports:
// headings (#..######), blockquote (>), unordered (-/*) and ordered (1.) lists,
// horizontal rule (---), images, links, **bold**, *italic*, `code`, paragraphs.
// Not a full CommonMark parser — intentionally small for blog content.
function blogMarkdownToHtml(md) {
  const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const raw = String(md == null ? '' : md).replace(/\r\n/g, '\n');
  const lines = esc(raw).split('\n');
  const out = [];
  let i = 0;
  // Inline formatting applied to a single (already-escaped) line.
  const inline = (s) => s
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img alt="$1" src="$2" loading="lazy">')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>');

  while (i < lines.length) {
    const line = lines[i];

    // Blank line — skip (paragraph breaks come from grouping non-blank runs).
    if (/^\s*$/.test(line)) { i++; continue; }

    // Horizontal rule.
    if (/^---+\s*$/.test(line)) { out.push('<hr>'); i++; continue; }

    // Heading.
    const h = line.match(/^(#{1,6})\s+(.*)$/);
    if (h) { const lvl = h[1].length; out.push(`<h${lvl}>${inline(h[2])}</h${lvl}>`); i++; continue; }

    // Blockquote (group consecutive > lines).
    if (/^&gt;\s?/.test(line)) {
      const buf = [];
      while (i < lines.length && /^&gt;\s?/.test(lines[i])) {
        buf.push(lines[i].replace(/^&gt;\s?/, '')); i++;
      }
      out.push(`<blockquote>${inline(buf.join(' '))}</blockquote>`);
      continue;
    }

    // Unordered list (group consecutive - or * lines).
    if (/^[-*]\s+/.test(line)) {
      const items = [];
      while (i < lines.length && /^[-*]\s+/.test(lines[i])) {
        items.push(`<li>${inline(lines[i].replace(/^[-*]\s+/, ''))}</li>`); i++;
      }
      out.push(`<ul>${items.join('')}</ul>`);
      continue;
    }

    // Ordered list (group consecutive N. lines).
    if (/^\d+\.\s+/.test(line)) {
      const items = [];
      while (i < lines.length && /^\d+\.\s+/.test(lines[i])) {
        items.push(`<li>${inline(lines[i].replace(/^\d+\.\s+/, ''))}</li>`); i++;
      }
      out.push(`<ol>${items.join('')}</ol>`);
      continue;
    }

    // Paragraph (group consecutive plain lines until a blank/structural line).
    const buf = [];
    while (i < lines.length && !/^\s*$/.test(lines[i]) &&
           !/^(#{1,6})\s/.test(lines[i]) && !/^---+\s*$/.test(lines[i]) &&
           !/^&gt;\s?/.test(lines[i]) && !/^[-*]\s+/.test(lines[i]) && !/^\d+\.\s+/.test(lines[i])) {
      buf.push(lines[i]); i++;
    }
    out.push(`<p>${inline(buf.join(' '))}</p>`);
  }
  return out.join('\n');
}

// Standalone shell for public blog pages. Amber-monotone, Fraunces headings,
// same font stack as the dashboard but a clean reading layout with no nav.
function blogShell(title, body) {
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title} — Branch Live</title>
<link rel="icon" type="image/svg+xml" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='6' fill='%230e0e18'/%3E%3Cg fill='%23d4a574'%3E%3Crect x='5' y='14' width='2' height='4' rx='1'/%3E%3Crect x='9' y='10' width='2' height='12' rx='1'/%3E%3Crect x='13' y='6' width='2' height='20' rx='1'/%3E%3Crect x='17' y='10' width='2' height='12' rx='1'/%3E%3Crect x='21' y='14' width='2' height='4' rx='1'/%3E%3C/g%3E%3C/svg%3E">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,500;0,9..144,600;1,9..144,400;1,9..144,500&family=Inter+Tight:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
<style>
*{margin:0;padding:0;box-sizing:border-box}
:root{--bg-primary:#0a0a12;--bg-card:#0e0e18;--bg-elev:#13131f;--text-primary:#f1ead9;--text-muted:#a89a82;--text-faint:#6b6354;--cream:#f1ead9;--accent:#d4a574;--accent-bright:#e8c9a0;--accent-deep:#b88a5a;--border:#211c14;--font-sans:'Inter Tight',system-ui,-apple-system,sans-serif;--font-serif:'Fraunces',Georgia,serif;--font-mono:'JetBrains Mono',ui-monospace,monospace}
body{font-family:var(--font-sans);background:var(--bg-primary);color:var(--text-primary);line-height:1.7;font-size:17px;min-height:100vh;-webkit-font-smoothing:antialiased}
a{color:var(--accent);text-decoration:none;transition:color .25s ease}a:hover{color:var(--accent-bright)}
.wrap{max-width:720px;margin:0 auto;padding:64px 24px 96px}
.brand{display:flex;align-items:center;gap:10px;margin-bottom:56px;font-size:.95rem}
.brand .nm{font-weight:700;color:var(--cream)}.brand .lv{font-family:var(--font-serif);font-style:italic;color:var(--accent)}
.eyebrow{font-family:var(--font-mono);font-size:.7rem;letter-spacing:.18em;text-transform:uppercase;color:var(--accent);font-weight:500;margin-bottom:12px;display:block}
h1{font-family:var(--font-serif);font-weight:400;font-size:2.6rem;letter-spacing:-.02em;line-height:1.1;margin-bottom:10px}
h1 em{font-style:italic;color:var(--accent)}
.post-meta{color:var(--text-muted);font-size:.9rem;margin-bottom:40px;font-family:var(--font-mono)}
.back{display:inline-flex;align-items:center;gap:7px;color:var(--text-muted);font-size:.88rem;margin-bottom:40px}.back:hover{color:var(--accent)}
.post-list{list-style:none}
.post-list li{padding:28px 0;border-bottom:1px solid var(--border)}
.post-list li:first-child{padding-top:0}
.post-list h2{font-family:var(--font-serif);font-weight:500;font-size:1.7rem;letter-spacing:-.015em;line-height:1.2;margin-bottom:8px}
.post-list h2 a{color:var(--cream)}.post-list h2 a:hover{color:var(--accent)}
.post-list .date{font-family:var(--font-mono);font-size:.74rem;color:var(--text-faint);text-transform:uppercase;letter-spacing:.08em;margin-bottom:10px;display:block}
.post-list .excerpt{color:var(--text-muted);font-size:1rem}
.post-body h2,.post-body h3,.post-body h4{font-family:var(--font-serif);font-weight:500;letter-spacing:-.01em;line-height:1.25;margin:36px 0 14px;color:var(--cream)}
.post-body h2{font-size:1.7rem}.post-body h3{font-size:1.35rem}.post-body h4{font-size:1.1rem}
.post-body p{margin:0 0 20px;color:var(--text-primary)}
.post-body img{max-width:100%;height:auto;border-radius:10px;margin:24px 0;border:1px solid var(--border)}
.post-body blockquote{border-left:3px solid var(--accent);padding:6px 0 6px 20px;margin:24px 0;color:var(--text-muted);font-style:italic}
.post-body code{font-family:var(--font-mono);font-size:.88em;background:var(--bg-elev);padding:2px 6px;border-radius:5px;color:var(--accent-bright)}
.post-body ul,.post-body ol{margin:0 0 20px;padding-left:24px}.post-body li{margin-bottom:8px}
.post-body hr{border:none;border-top:1px solid var(--border);margin:32px 0}
.post-body a{text-decoration:underline;text-decoration-color:rgba(212,165,116,.4);text-underline-offset:3px}
.empty{color:var(--text-faint);text-align:center;padding:80px 0;font-size:1.05rem}
.pager{display:flex;justify-content:space-between;margin-top:48px;gap:12px}
.pager a{font-family:var(--font-mono);font-size:.82rem;padding:9px 16px;border:1px solid var(--border);border-radius:8px;color:var(--text-muted)}.pager a:hover{border-color:var(--accent);color:var(--accent)}
.pager .disabled{opacity:.3;pointer-events:none}
</style></head>
<body><div class="wrap">${body}</div></body></html>`;
}

// /blog — paginated list of published posts (10/page), newest first.
async function handleBlogList(request, env) {
  try {
    const url = new URL(request.url);
    const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10));
    const perPage = 10;
    const offset = (page - 1) * perPage;
    const { results } = await env.DB.prepare(
      `SELECT title, slug, excerpt, published_at FROM blog_posts
       WHERE status = 'published' AND published_at IS NOT NULL
       ORDER BY published_at DESC LIMIT ? OFFSET ?`
    ).bind(perPage, offset).all();
    const posts = results || [];

    const total = (await env.DB.prepare(
      `SELECT COUNT(*) AS c FROM blog_posts WHERE status = 'published' AND published_at IS NOT NULL`
    ).first() || {}).c || 0;
    const totalPages = Math.max(1, Math.ceil(total / perPage));

    if (!posts.length) {
      return new Response(blogShell('Blog', `<a class="back" href="https://branchlive.com">← branch live</a><span class="eyebrow">Blog</span><h1>Notes from the <em>field</em></h1><p class="empty">No posts yet. Check back soon.</p>`), { headers: { 'Content-Type': 'text/html' } });
    }

    const items = posts.map(p => `<li>
      <span class="date">${(p.published_at || '').slice(0, 10)}</span>
      <h2><a href="/blog/${htmxEsc(p.slug)}">${htmxEsc(p.title)}</a></h2>
      <p class="excerpt">${htmxEsc(p.excerpt || blogExcerptFromContent(p.content))}</p>
    </li>`).join('');

    const prev = page > 1 ? `<a href="/blog?page=${page - 1}">← Newer</a>` : `<span class="disabled">← Newer</span>`;
    const next = page < totalPages ? `<a href="/blog?page=${page + 1}">Older →</a>` : `<span class="disabled">Older →</span>`;

    const body = `<a class="back" href="https://branchlive.com">← branch live</a>
<span class="eyebrow">Blog</span>
<h1>Notes from the <em>field</em></h1>
<ul class="post-list">${items}</ul>
<div class="pager">${prev}${next}</div>`;
    return new Response(blogShell('Blog', body), { headers: { 'Content-Type': 'text/html' } });
  } catch (e) {
    console.error('Blog list error:', e);
    return new Response(blogShell('Blog', '<h1>⚠️ Error</h1><p style="color:var(--text-muted)">Could not load the blog.</p>'), { status: 500, headers: { 'Content-Type': 'text/html' } });
  }
}

// /blog/:slug — a single published post, markdown rendered to HTML.
async function handleBlogPost(request, env, slug) {
  try {
    const post = await env.DB.prepare(
      `SELECT * FROM blog_posts WHERE slug = ? AND status = 'published'`
    ).bind(slug).first();
    if (!post) {
      return new Response(blogShell('Not found', '<h1>404</h1><p style="color:var(--text-muted)">This post doesn\'t exist or isn\'t published.</p><p style="margin-top:24px"><a href="/blog">← Back to blog</a></p>'), { status: 404, headers: { 'Content-Type': 'text/html' } });
    }
    const body = `<a class="back" href="/blog">← All posts</a>
<span class="eyebrow">Branch Live Blog</span>
<h1>${htmxEsc(post.title)}</h1>
<div class="post-meta">${(post.published_at || post.created_at || '').slice(0, 10)}</div>
<div class="post-body">${blogMarkdownToHtml(post.content)}</div>`;
    return new Response(blogShell(post.title, body), { headers: { 'Content-Type': 'text/html' } });
  } catch (e) {
    console.error('Blog post error:', e);
    return new Response(blogShell('Error', '<h1>⚠️ Error</h1><p style="color:var(--text-muted)">Could not load this post.</p>'), { status: 500, headers: { 'Content-Type': 'text/html' } });
  }
}

// ── Admin blog CRUD ──

// /p/admin/blog — list all posts (drafts + published) with edit/delete.
async function handleAdminBlog(request, env, uid) {
  const denied = requireAdmin(uid);
  if (denied) return denied;
  try {
    const url = new URL(request.url);
    const created = url.searchParams.get('created') === '1';
    const deleted = url.searchParams.get('deleted') === '1';
    const { results } = await env.DB.prepare(
      `SELECT id, title, slug, status, published_at, updated_at FROM blog_posts ORDER BY updated_at DESC`
    ).all();
    const posts = results || [];
    const rows = posts.map(p => `<tr style="cursor:pointer" onclick="window.location='/p/admin/blog/${p.id}/edit'">
      <td><strong style="color:var(--cream)">${htmxEsc(p.title)}</strong><div style="font-size:.76rem;color:var(--text-faint)">/${htmxEsc(p.slug)}</div></td>
      <td><span class="badge ${p.status === 'published' ? 'badge-booked' : 'badge-new'}">${htmxEsc(p.status)}</span></td>
      <td style="font-family:var(--font-mono);font-size:.8rem;color:var(--text-muted)">${(p.published_at || '—').slice(0, 10)}</td>
      <td style="font-family:var(--font-mono);font-size:.8rem;color:var(--text-muted)">${(p.updated_at || '').slice(0, 16)}</td>
      <td onclick="event.stopPropagation()" style="white-space:nowrap">
        <a class="btn btn-ghost btn-sm" href="/p/admin/blog/${p.id}/edit" style="font-size:.74rem;padding:5px 10px">Edit</a>
        <form method="post" action="/api/admin/blog/${p.id}/delete" style="display:inline" onsubmit="return confirm('Delete \\'${String(p.title).replace(/'/g, '')}\\'? This cannot be undone.')"><button class="btn btn-ghost btn-sm" type="submit" style="font-size:.74rem;padding:5px 10px;color:var(--danger);border-color:rgba(248,113,113,.4)">Delete</button></form>
      </td>
    </tr>`).join('') || `<tr><td colspan="5" style="text-align:center;color:var(--text-faint);padding:32px">No posts yet.</td></tr>`;

    const body = `
<span class="eyebrow">Admin · Blog</span>
<h1>Blog <em>posts</em></h1>
<p class="sub">${posts.length} post${posts.length === 1 ? '' : 's'} · published to <a href="/blog" target="_blank" rel="noopener">branchlive.com/blog</a></p>
${created ? `<div class="note-box" style="border-color:rgba(212,165,116,.4);color:var(--accent-amber);margin:18px 0">✓ Post saved.</div>` : ''}
${deleted ? `<div class="note-box" style="border-color:rgba(212,165,116,.4);color:var(--accent-amber);margin:18px 0">✓ Post deleted.</div>` : ''}
<div style="margin:24px 0"><a class="btn btn-sm" href="/p/admin/blog/new">+ New post</a></div>
<h3>All posts</h3>
<table>
  <thead><tr><th>Title</th><th>Status</th><th>Published</th><th>Updated</th><th></th></tr></thead>
  <tbody>${rows}</tbody>
</table>
<p class="sub" style="margin-top:14px;font-size:.82rem;color:var(--text-faint)">Content is markdown — supports headings, bold/italic, links, images, lists, and quotes. Excerpts auto-generate from the first paragraph if left blank.</p>
`;
    return new Response(adminShell('blog', 'Admin · Blog', body), { headers: { 'Content-Type': 'text/html' } });
  } catch (e) {
    console.error('Admin blog error:', e);
    return adminErrorPage('blog', 'Could not load the blog.');
  }
}

// Shared form for new + edit. Renders title, slug, content (textarea), status
// select, and an auto-generated excerpt preview. `post` is null for a new post.
function blogEditForm(post) {
  const p = post || {};
  const isNew = !post;
  return `<form method="post" action="${isNew ? '/api/admin/blog/create' : '/api/admin/blog/' + p.id + '/update'}" style="display:grid;gap:16px">
  <div>
    <label style="display:block;font-size:.7rem;font-family:var(--font-mono);color:var(--text-muted);margin-bottom:6px;text-transform:uppercase">Title</label>
    <input name="title" value="${htmxEsc(p.title || '')}" required style="width:100%;box-sizing:border-box;font-size:1.05rem" oninput="autoSlug(this.value)">
  </div>
  <div>
    <label style="display:block;font-size:.7rem;font-family:var(--font-mono);color:var(--text-muted);margin-bottom:6px;text-transform:uppercase">Slug (URL)</label>
    <div style="display:flex;align-items:center;gap:8px"><span style="color:var(--text-faint);font-family:var(--font-mono);font-size:.85rem">/blog/</span><input id="slug-input" name="slug" value="${htmxEsc(p.slug || '')}" required style="flex:1;font-family:var(--font-mono);font-size:.88rem"></div>
  </div>
  <div>
    <label style="display:block;font-size:.7rem;font-family:var(--font-mono);color:var(--text-muted);margin-bottom:6px;text-transform:uppercase">Excerpt <span style="text-transform:none;color:var(--text-faint)">(optional — auto-generates if blank)</span></label>
    <input name="excerpt" value="${htmxEsc(p.excerpt || '')}" style="width:100%;box-sizing:border-box" placeholder="One-line summary shown on the blog list…">
  </div>
  <div>
    <label style="display:block;font-size:.7rem;font-family:var(--font-mono);color:var(--text-muted);margin-bottom:6px;text-transform:uppercase">Content (markdown)</label>
    <textarea name="content" rows="18" style="width:100%;box-sizing:border-box;font-family:var(--font-mono);font-size:.86rem;line-height:1.6" placeholder="# A heading&#10;&#10;Write your post in **markdown**. Supports headings, *italics*, [links](https://), images, lists, and > quotes.">${htmxEsc(p.content || '')}</textarea>
  </div>
  <div>
    <label style="display:block;font-size:.7rem;font-family:var(--font-mono);color:var(--text-muted);margin-bottom:6px;text-transform:uppercase">Status</label>
    <select name="status">
      <option value="draft" ${p.status === 'draft' || !p.status ? 'selected' : ''}>Draft (hidden)</option>
      <option value="published" ${p.status === 'published' ? 'selected' : ''}>Published (public)</option>
    </select>
  </div>
  <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:8px">
    <button class="btn" type="submit">${isNew ? 'Create post' : 'Save changes'}</button>
    <a class="btn btn-ghost" href="/p/admin/blog">Cancel</a>
  </div>
</form>
<script>
var slugTouched=${isNew ? 'false' : 'true'};
(function(){var s=document.getElementById('slug-input');if(s)s.addEventListener('input',function(){slugTouched=true});})();
function autoSlug(title){
  if(slugTouched)return;
  var s=document.getElementById('slug-input');
  if(s)s.value=title.toLowerCase().trim().replace(/['\"]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,80);
}
</script>`;
}

// /p/admin/blog/new — create form.
async function handleAdminBlogNew(request, env, uid) {
  const denied = requireAdmin(uid);
  if (denied) return denied;
  const body = `
<a class="btn btn-ghost btn-sm" href="/p/admin/blog" style="margin-bottom:18px">← All posts</a>
<span class="eyebrow">Admin · New post</span>
<h1>New <em>post</em></h1>
${blogEditForm(null)}
`;
  return new Response(adminShell('blog', 'Admin · New Post', body), { headers: { 'Content-Type': 'text/html' } });
}

// /p/admin/blog/:id/edit — edit form, pre-filled.
async function handleAdminBlogEdit(request, env, uid, postId) {
  const denied = requireAdmin(uid);
  if (denied) return denied;
  if (!postId) return new Response(adminShell('blog', 'Not found', '<h1>404</h1><p style="color:#8b949e">Invalid post.</p>'), { status: 404, headers: { 'Content-Type': 'text/html' } });
  const post = await env.DB.prepare('SELECT * FROM blog_posts WHERE id = ?').bind(postId).first();
  if (!post) return new Response(adminShell('blog', 'Not found', '<h1>404</h1><p style="color:#8b949e">Post not found.</p>'), { status: 404, headers: { 'Content-Type': 'text/html' } });
  const body = `
<a class="btn btn-ghost btn-sm" href="/p/admin/blog" style="margin-bottom:18px">← All posts</a>
<span class="eyebrow">Admin · Edit post</span>
<h1>Edit <em>post</em></h1>
${blogEditForm(post)}
${post.status === 'published' ? `<p style="margin-top:24px"><a class="btn btn-ghost btn-sm" href="/blog/${htmxEsc(post.slug)}" target="_blank" rel="noopener">View live post →</a></p>` : ''}
`;
  return new Response(adminShell('blog', `Admin · ${post.title}`, body), { headers: { 'Content-Type': 'text/html' } });
}

// POST /api/admin/blog/create — insert a new post. Sets published_at when the
// admin chooses 'published'. Returns to the list with a confirmation.
async function handleAdminBlogCreate(request, env, uid) {
  const denied = requireAdmin(uid);
  if (denied) return denied;
  try {
    const form = await request.formData();
    const title = (form.get('title') || '').toString().trim();
    let slug = (form.get('slug') || '').toString().trim() || blogSlugify(title);
    slug = blogSlugify(slug); // normalize whatever the admin typed
    const content = (form.get('content') || '').toString();
    const excerpt = (form.get('excerpt') || '').toString().trim() || blogExcerptFromContent(content);
    const status = form.get('status') === 'published' ? 'published' : 'draft';
    if (!title) return adminRedirect(request, '/p/admin/blog/new', 303);

    // Ensure slug uniqueness — append -2, -3, … if taken.
    slug = await blogUniqueSlug(env, slug);
    const now = nowISO();
    await env.DB.prepare(
      `INSERT INTO blog_posts (title, slug, content, excerpt, status, published_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).bind(title, slug, content, excerpt, status, status === 'published' ? now : null, now).run();
    return adminRedirect(request, '/p/admin/blog?created=1', 303);
  } catch (e) {
    console.error('Admin blog create error:', e);
    return adminRedirect(request, '/p/admin/blog/new', 303);
  }
}

// POST /api/admin/blog/:id/update — save edits. Updates published_at only when
// transitioning to published (keeps the original publish date on re-saves).
async function handleAdminBlogUpdate(request, env, uid, postId) {
  const denied = requireAdmin(uid);
  if (denied) return denied;
  try {
    const form = await request.formData();
    const title = (form.get('title') || '').toString().trim();
    let slug = (form.get('slug') || '').toString().trim() || blogSlugify(title);
    slug = blogSlugify(slug);
    const content = (form.get('content') || '').toString();
    const excerpt = (form.get('excerpt') || '').toString().trim() || blogExcerptFromContent(content);
    const status = form.get('status') === 'published' ? 'published' : 'draft';
    const existing = await env.DB.prepare('SELECT status, published_at, slug FROM blog_posts WHERE id = ?').bind(postId).first();
    if (!existing) return adminRedirect(request, '/p/admin/blog', 303);

    // If the slug changed, ensure the new one is unique.
    if (slug !== existing.slug) slug = await blogUniqueSlug(env, slug, postId);
    // Set published_at when newly publishing; preserve it on later edits.
    let publishedAt = existing.published_at;
    if (status === 'published' && existing.status !== 'published') publishedAt = nowISO();
    if (status === 'draft') publishedAt = null;

    await env.DB.prepare(
      `UPDATE blog_posts SET title=?, slug=?, content=?, excerpt=?, status=?, published_at=?, updated_at=? WHERE id=?`
    ).bind(title, slug, content, excerpt, status, publishedAt, nowISO(), postId).run();
    return adminRedirect(request, '/p/admin/blog?created=1', 303);
  } catch (e) {
    console.error('Admin blog update error:', e);
    return adminRedirect(request, `/p/admin/blog/${postId}/edit`, 303);
  }
}

// POST /api/admin/blog/:id/delete — remove a post.
async function handleAdminBlogDelete(request, env, uid, postId) {
  const denied = requireAdmin(uid);
  if (denied) return denied;
  try {
    await env.DB.prepare('DELETE FROM blog_posts WHERE id = ?').bind(postId).run();
    return adminRedirect(request, '/p/admin/blog?deleted=1', 303);
  } catch (e) {
    console.error('Admin blog delete error:', e);
    return adminRedirect(request, '/p/admin/blog', 303);
  }
}

// Find a unique slug. If `blog-slug` exists, try `blog-slug-2`, `-3`, …
// Pass `exceptId` to ignore the post being renamed itself.
async function blogUniqueSlug(env, base, exceptId) {
  let slug = base || 'post';
  let n = 1;
  while (true) {
    const q = exceptId
      ? env.DB.prepare('SELECT id FROM blog_posts WHERE slug = ? AND id != ?').bind(slug, exceptId)
      : env.DB.prepare('SELECT id FROM blog_posts WHERE slug = ?').bind(slug);
    const row = await q.first();
    if (!row) return slug;
    n++;
    slug = `${base}-${n}`;
    if (n > 999) return `${base}-${Date.now()}`; // safety valve
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
      // testResult is { ok, error?, id? } — surface the actual Resend reason.
      return json({
        ok: testResult.ok,
        message: testResult.ok ? 'Email sent' : 'Email failed',
        id: testResult.id || null,
        error: testResult.ok ? null : (testResult.error || 'Unknown error'),
      });
    }

    try {
      // ── Public routes ──
      // Public auto-generated website — /s/{slug}. No auth; rendered server-side.
      if (method === 'GET') {
        // Business AI blog — must be matched BEFORE the /s/{slug} exact
        // match below, since /s/{slug}/blog is a longer path.
        const cblogListMatch = path.match(/^\/s\/([a-z0-9-]+)\/blog$/);
        if (cblogListMatch) return handleBusinessBlogList(env, cblogListMatch[1]);
        const cblogPostMatch = path.match(/^\/s\/([a-z0-9-]+)\/blog\/([a-z0-9-]+)$/);
        if (cblogPostMatch) return handleBusinessBlogPost(env, cblogPostMatch[1], cblogPostMatch[2]);
        const siteMatch = path.match(/^\/s\/([a-z0-9-]+)$/);
        if (siteMatch) return handlePublicSite(request, env, siteMatch[1]);
        // Sitemap of all published business sites — submitted to search engines.
        if (path === '/sitemap-sites.xml') return handleSitesSitemap(request, env);
        // Public blog — /blog (list) and /blog/:slug (post). No auth.
        if (path === '/blog') return handleBlogList(request, env);
        const blogMatch = path.match(/^\/blog\/([a-z0-9-]+)$/);
        if (blogMatch) return handleBlogPost(request, env, blogMatch[1]);
        // Affiliate earnings dashboard — resolves the affiliate by ?code=.
        if (path === '/api/affiliates/dashboard') return handleAffiliateDashboard(request, env);
        // Server-rendered login + logout pages for the HTMX dashboard family.
        if (path === '/login-htmx') return handleLoginHtmx(request, env);
        if (path === '/logout-htmx') return handleLogoutHtmx(request, env);
        // Settings page — resolves the user via the session cookie (not a
        // hardcoded uid), so it shows the signed-in user's data, not demo's.
        if (path === '/settings-htmx') return handleSettingsHtmx(request, env);

        // ── HTMX dashboard pages — /p/* ──
        // Browser tabs carry the bl_session cookie, never a Bearer header, so
        // every /p/* GET route resolves the user via getUidFromSessionCookie()
        // and bounces to /login-htmx (returning here) when there's no valid
        // session. This is what stops the "Not logged in" 401 on the dashboard.
        if (path.startsWith('/p/')) {
          let pUid = await getUidFromSessionCookie(request, env);
          // /p/gallery still accepts ?token=<bearer> for shared/legacy links.
          if (!pUid && path === '/p/gallery') {
            const tok = new URL(request.url).searchParams.get('token');
            if (tok) {
              try { pUid = (await env.DB.prepare('SELECT user_id FROM sessions WHERE token = ?').bind(tok).first() || {}).user_id || null; } catch (e) {}
            }
          }
          if (!pUid) {
            // Preserve the requested path so login returns the user here.
            return new Response(null, {
              status: 302,
              headers: { Location: '/login-htmx?next=' + encodeURIComponent(path + (url.search || '')) },
            });
          }
          // ── Role/permission gate ──
          // resolveContext honors bl_business_id (switcher cookie) and returns
          // { uid, bid, role }. bid is the owning account — handlers query by
          // it so a team member sees the business's shared data, not their own
          // (empty) rows. Roles gate page access; employees are view-only on a
          // few pages. /p/admin/* below stays on requireAdmin(pUid) untouched.
          const pCtx = await resolveContext(request, env, pUid);
          // Attach the list of businesses the user belongs to, so the top-nav
          // switcher + nav filtering can render. One extra query per page load;
          // empty for single-business accounts (the switcher then stays hidden).
          pCtx.businesses = await userBusinesses(env, pUid);
          const minRole = ROUTE_MIN_ROLE[path];
          if (minRole && !roleMeets(pCtx.role, minRole)) {
            // Insufficient role → back to overview (keeps the app shell usable).
            return new Response(null, { status: 302, headers: { Location: '/p/overview' } });
          }
          // Handlers receive ctx.bid as their "uid" arg (owner-scoped queries)
          // plus pCtx where role-aware rendering is needed.
          // Onboarding wizard — manager+ only (employees can't configure the
          // business). Auto-triggered from /p/overview for empty accounts.
          if (path === '/p/onboarding') {
            if (!roleMeets(pCtx.role, 'manager')) {
              return new Response(null, { status: 302, headers: { Location: '/p/overview' } });
            }
            return onboardingWizardHtmx(request, env, pCtx.bid, pCtx);
          }
          if (path === '/p/overview') return handleOverviewHtmx(request, env, pCtx.bid, pCtx);
          if (path === '/p/gallery') return handleGalleryHtmx(request, env, pCtx.bid, pCtx);
          if (path === '/p/leads') return handleLeadsHtmx(request, env, pCtx.bid, pCtx);
          if (path === '/p/calls') return handleCallsHtmx(request, env, pCtx.bid, pCtx);
          if (path === '/p/calendar') return handleCalendarHtmx(request, env, pCtx.bid, pCtx);
          // /p/calendar/:id — single-appointment detail page (the appointment
          // cards on the calendar link here). Trailing-slash startsWith keeps
          // it from shadowing the exact /p/calendar match above.
          if (path.startsWith('/p/calendar/')) {
            const apptId = parseInt(path.split('/')[3], 10);
            if (!apptId) return new Response(simpleShell('Not found', '<h1>404</h1><p style="color:#8b949e">Invalid appointment.</p>'), { status: 404, headers: { 'Content-Type': 'text/html' } });
            return handleAppointmentDetailHtmx(request, env, pCtx.bid, apptId, pCtx);
          }
          if (path === '/p/knowledge') return handleKnowledgeHtmx(request, env, pCtx.bid, pCtx);
          if (path === '/p/billing') return handleBillingHtmx(request, env, pCtx.bid, pCtx);
          if (path === '/p/blog') return handleBusinessBlogHtmx(request, env, pCtx.bid, pCtx);
          if (path === '/p/social') return handleSocialHtmx(request, env, pCtx.bid, pCtx);
          if (path === '/p/website') return handleWebsiteBuilderHtmx(request, env, pCtx.bid, pCtx);
          if (path === '/p/outreach') return handleOutreachHtmx(request, env, pCtx.bid, pCtx);
          if (path === '/p/analytics') return handleAnalyticsHtmx(request, env, pCtx.bid, pCtx);
          if (path === '/p/team') return handleTeamHtmx(request, env, pCtx);
          // /p/leads/:id — list (GET) + status update (POST, manager+).
          if (path.startsWith('/p/leads/')) {
            const leadId = parseInt(path.split('/')[3], 10);
            if (!leadId) return new Response(simpleShell('Not found', '<h1>404</h1><p style="color:#8b949e">Invalid lead.</p>'), { status: 404, headers: { 'Content-Type': 'text/html' } });
            if (method === 'POST') {
              if (!roleMeets(pCtx.role, 'manager')) return new Response(null, { status: 302, headers: { Location: '/p/leads/' + leadId } });
              return handleLeadStatusHtmx(request, env, pCtx.bid, leadId);
            }
            return handleLeadDetailHtmx(request, env, pCtx.bid, leadId, pCtx);
          }
          // /p/blog/:postslug — a business reading their own generated post
          // in the dashboard (read-only preview, links back to the public site).
          if (path.startsWith('/p/blog/')) {
            const postSlug = decodeURIComponent(path.split('/')[3] || '');
            return handleBusinessBlogDetailHtmx(request, env, pCtx.bid, postSlug, pCtx);
          }
          // ── Admin dashboard — /p/admin/* (admin-only, uid === 1) ──
          // Every handler re-checks requireAdmin(pUid) so the gate holds even
          // if a route is reached another way. /p/admin/outreach just redirects
          // to the existing /p/outreach page (already built).
          if (path === '/p/admin') return handleAdminOverview(request, env, pUid);
          if (path === '/p/admin/accounts') return handleAdminAccounts(request, env, pUid);
          if (path === '/p/admin/outreach') return handleAdminOutreachHtmx(request, env, pUid);
          if (path === '/p/admin/support') return handleAdminSupport(request, env, pUid);
          // /p/admin/support/:id — ticket detail (full message, reply form, resolve).
          if (path.startsWith('/p/admin/support/')) {
            const ticketId = parseInt(path.split('/')[4], 10);
            return handleAdminSupportDetail(request, env, pUid, ticketId);
          }
          if (path === '/p/admin/analytics') return handleAdminAnalytics(request, env, pUid);
          // ── Admin blog — /p/admin/blog, /new, /:id/edit ──
          if (path === '/p/admin/blog') return handleAdminBlog(request, env, pUid);
          if (path === '/p/admin/blog/new') return handleAdminBlogNew(request, env, pUid);
          const blogEditMatch = path.match(/^\/p\/admin\/blog\/(\d+)\/edit$/);
          if (blogEditMatch) return handleAdminBlogEdit(request, env, pUid, parseInt(blogEditMatch[1], 10));
          // ── Admin business blogs (AI add-on) — /p/admin/cblogs ──
          if (path === '/p/admin/cblogs') return handleAdminCblogs(request, env, pUid);
          // ── Admin business websites — /p/admin/sites ──
          if (path === '/p/admin/sites') return handleAdminSites(request, env, pUid);
          if (path.startsWith('/p/admin/accounts/')) {
            // /p/admin/accounts/:id  and  /p/admin/accounts/:id/impersonate
            const parts = path.split('/');
            const acctId = parseInt(parts[4], 10);
            if (path.endsWith('/impersonate')) return handleAdminImpersonate(request, env, pUid, acctId);
            return handleAdminAccountDetail(request, env, pUid, acctId);
          }
          return new Response(simpleShell('Not found', '<h1>404</h1><p style="color:#8b949e">This page doesn\'t exist in the HTMX dashboard.</p>'), { status: 404, headers: { 'Content-Type': 'text/html' } });
        }
      }

      // HTMX login form submission (form-encoded POST → cookie + redirect).
      if (path === '/login-htmx' && method === 'POST') {
        return handleLoginHtmx(request, env);
      }
      // HTMX settings form submission (form-encoded POST → UPSERT + re-render).
      if (path === '/settings-htmx' && method === 'POST') {
        return handleSettingsHtmx(request, env);
      }
      // Cookie-authed Vapi toggle for the HTMX settings page (no Bearer token
      // available client-side). Reuse the same provision/deprovision cores.
      if (path === '/api/vapi/provision-htmx' && method === 'POST') {
        const vUid = await getUidFromSessionCookie(request, env);
        if (!vUid) return json({ ok: false, error: 'Not logged in' });
        const vCtx = await resolveContext(request, env, vUid);
        if (vCtx.role !== 'admin') return json({ ok: false, error: 'Admin access required' }, { status: 403 });
        return handleVapiProvisionHtmx(request, env);
      }
      if (path === '/api/vapi/deprovision-htmx' && method === 'POST') {
        const vUid = await getUidFromSessionCookie(request, env);
        if (!vUid) return json({ ok: false, error: 'Not logged in' });
        const vCtx = await resolveContext(request, env, vUid);
        if (vCtx.role !== 'admin') return json({ ok: false, error: 'Admin access required' }, { status: 403 });
        return handleVapiDeprovisionHtmx(request, env);
      }
      // Cookie-authed Gmail wrappers for the settings Email-Sending card.
      // The Bearer-only /api/gmail/* endpoints can't be called from the cookie
      // page, so these resolve the user from the session cookie instead.
      if (path === '/api/gmail/auth-htmx' && method === 'GET') {
        return handleGmailAuthHtmx(request, env);
      }
      if (path === '/api/gmail/status-htmx' && method === 'GET') {
        return handleGmailStatusHtmx(request, env);
      }
      if (path === '/api/gmail/disconnect-htmx' && method === 'POST') {
        const gUid = await getUidFromSessionCookie(request, env);
        if (!gUid) return json({ ok: false, error: 'Not logged in' });
        const gCtx = await resolveContext(request, env, gUid);
        if (gCtx.role !== 'admin') return json({ ok: false, error: 'Admin access required' }, { status: 403 });
        return handleGmailDisconnectHtmx(request, env);
      }
      // Cookie-authed writes for the new HTMX dashboard pages (knowledge +
      // billing). Resolve the user from the session cookie, not a Bearer token.
      // These writes are role-gated (manager+ for knowledge, admin for billing
      // toggles) and scoped to ctx.bid so a team member edits the business's
      // data, not their own (empty) rows.
      // ── Onboarding wizard writes (cookie auth, manager+, ctx.bid-scoped) ──
      // The 5-step wizard at /p/onboarding POSTs each step here. Step 5 flips
      // settings.onboarding_complete = 1, which stops the first-login redirect.
      if (path === '/api/onboarding/save' && method === 'POST') {
        const oUid = await getUidFromSessionCookie(request, env);
        if (!oUid) return json({ ok: false, error: 'Not logged in' });
        const oCtx = await resolveContext(request, env, oUid);
        if (!roleMeets(oCtx.role, 'manager')) return json({ ok: false, error: 'Manager access required' }, { status: 403 });
        return handleOnboardingSave(request, env, oCtx.bid);
      }
      // Industry → service suggestions (GET, cookie auth). Pure lookup, no DB.
      if (path === '/api/onboarding/suggestions' && method === 'GET') {
        const oUid = await getUidFromSessionCookie(request, env);
        if (!oUid) return json({ ok: false, error: 'Not logged in' });
        return handleOnboardingSuggestions(request, env, oUid);
      }
      if (path === '/api/knowledge/add-htmx' && method === 'POST') {
        const kUid = await getUidFromSessionCookie(request, env);
        if (!kUid) return json({ ok: false, error: 'Not logged in' });
        const kCtx = await resolveContext(request, env, kUid);
        if (!roleMeets(kCtx.role, 'manager')) return json({ ok: false, error: 'Manager access required' }, { status: 403 });
        return handleKnowledgeAddHtmx(request, env, kCtx.bid);
      }
      if (path === '/api/knowledge/upload-htmx' && method === 'POST') {
        const kUid = await getUidFromSessionCookie(request, env);
        if (!kUid) return json({ ok: false, error: 'Not logged in' });
        const kCtx = await resolveContext(request, env, kUid);
        if (!roleMeets(kCtx.role, 'manager')) return json({ ok: false, error: 'Manager access required' }, { status: 403 });
        return handleKnowledgeUploadHtmx(request, env, kCtx.bid);
      }
      // Edit one knowledge item (cookie auth).
      if (path === '/api/knowledge/update-htmx' && method === 'POST') {
        const kUid = await getUidFromSessionCookie(request, env);
        if (!kUid) return json({ ok: false, error: 'Not logged in' });
        const kCtx = await resolveContext(request, env, kUid);
        if (!roleMeets(kCtx.role, 'manager')) return json({ ok: false, error: 'Manager access required' }, { status: 403 });
        return handleKnowledgeUpdateHtmx(request, env, kCtx.bid);
      }
      // Delete one knowledge item (cookie auth).
      if (path === '/api/knowledge/delete-htmx' && method === 'POST') {
        const kUid = await getUidFromSessionCookie(request, env);
        if (!kUid) return json({ ok: false, error: 'Not logged in' });
        const kCtx = await resolveContext(request, env, kUid);
        if (!roleMeets(kCtx.role, 'manager')) return json({ ok: false, error: 'Manager access required' }, { status: 403 });
        return handleKnowledgeDeleteHtmx(request, env, kCtx.bid);
      }
      if (path === '/api/settings/addon-htmx' && method === 'POST') {
        const sUid = await getUidFromSessionCookie(request, env);
        if (!sUid) return json({ ok: false, error: 'Not logged in' });
        const sCtx = await resolveContext(request, env, sUid);
        if (sCtx.role !== 'admin') return json({ ok: false, error: 'Admin access required' }, { status: 403 });
        return handleSettingsAddonHtmx(request, env, sCtx.bid);
      }
      // Cookie-authed follow-up actions for the lead detail page
      // (/p/leads/:id). The buttons can't use Bearer, so they hit these
      // -htmx wrappers which resolve uid from the session cookie. Manager+
      // only (lead management); scoped to ctx.bid (the business's leads).
      const followupEmailMatch = path.match(/^\/api\/leads\/(\d+)\/followup-email-htmx$/);
      if (followupEmailMatch && method === 'POST') {
        const fUid = await getUidFromSessionCookie(request, env);
        if (!fUid) return json({ ok: false, error: 'Not logged in' });
        const fCtx = await resolveContext(request, env, fUid);
        if (!roleMeets(fCtx.role, 'manager')) return json({ ok: false, error: 'Manager access required' }, { status: 403 });
        return handleLeadFollowupEmailHtmx(request, env, fCtx.bid, parseInt(followupEmailMatch[1]));
      }
      const followupSmsMatch = path.match(/^\/api\/leads\/(\d+)\/followup-sms-htmx$/);
      if (followupSmsMatch && method === 'POST') {
        const fUid = await getUidFromSessionCookie(request, env);
        if (!fUid) return json({ ok: false, error: 'Not logged in' });
        const fCtx = await resolveContext(request, env, fUid);
        if (!roleMeets(fCtx.role, 'manager')) return json({ ok: false, error: 'Manager access required' }, { status: 403 });
        return handleLeadFollowupSmsHtmx(request, env, fCtx.bid, parseInt(followupSmsMatch[1]));
      }
      // AI email draft for the lead detail page — cookie-authed.
      const emailDraftMatch = path.match(/^\/api\/leads\/(\d+)\/email-draft-htmx$/);
      if (emailDraftMatch && method === 'POST') {
        const fUid = await getUidFromSessionCookie(request, env);
        if (!fUid) return json({ ok: false, error: 'Not logged in' });
        const fCtx = await resolveContext(request, env, fUid);
        if (!roleMeets(fCtx.role, 'manager')) return json({ ok: false, error: 'Manager access required' }, { status: 403 });
        return handleLeadEmailDraftHtmx(request, env, fCtx.bid, parseInt(emailDraftMatch[1]));
      }

      // ── Admin POST routes — cookie-authed + admin-only (uid === 1) ──
      // Support form submission (inserts ticket, emails admin + auto-responder).
      if (path === '/api/admin/support' && method === 'POST') {
        const aUid = await getUidFromSessionCookie(request, env);
        if (!aUid) return json({ ok: false, error: 'Not logged in' });
        return handleAdminSupportSubmit(request, env, aUid);
      }
      // Reply to a ticket (emails the submitter via Resend, status → 'replied').
      const supportReplyMatch = path.match(/^\/api\/admin\/support\/(\d+)\/reply$/);
      if (supportReplyMatch && method === 'POST') {
        const aUid = await getUidFromSessionCookie(request, env);
        if (!aUid) return json({ ok: false, error: 'Not logged in' });
        return handleAdminSupportReply(request, env, aUid, parseInt(supportReplyMatch[1], 10));
      }
      // Mark a ticket resolved (status → 'resolved').
      const supportResolveMatch = path.match(/^\/api\/admin\/support\/(\d+)\/resolve$/);
      if (supportResolveMatch && method === 'POST') {
        const aUid = await getUidFromSessionCookie(request, env);
        if (!aUid) return json({ ok: false, error: 'Not logged in' });
        return handleAdminSupportResolve(request, env, aUid, parseInt(supportResolveMatch[1], 10));
      }
      // ── Admin blog writes (cookie-authed + admin-only) ──
      // Create / update / delete posts.
      if (path === '/api/admin/blog/create' && method === 'POST') {
        const aUid = await getUidFromSessionCookie(request, env);
        if (!aUid) return json({ ok: false, error: 'Not logged in' });
        return handleAdminBlogCreate(request, env, aUid);
      }
      const blogUpdateMatch = path.match(/^\/api\/admin\/blog\/(\d+)\/update$/);
      if (blogUpdateMatch && method === 'POST') {
        const aUid = await getUidFromSessionCookie(request, env);
        if (!aUid) return json({ ok: false, error: 'Not logged in' });
        return handleAdminBlogUpdate(request, env, aUid, parseInt(blogUpdateMatch[1], 10));
      }
      const blogDeleteMatch = path.match(/^\/api\/admin\/blog\/(\d+)\/delete$/);
      if (blogDeleteMatch && method === 'POST') {
        const aUid = await getUidFromSessionCookie(request, env);
        if (!aUid) return json({ ok: false, error: 'Not logged in' });
        return handleAdminBlogDelete(request, env, aUid, parseInt(blogDeleteMatch[1], 10));
      }
      // ── Admin business blogs (AI add-on) — toggle + generate ──
      if (path === '/api/admin/cblogs/toggle' && method === 'POST') {
        const aUid = await getUidFromSessionCookie(request, env);
        if (!aUid) return json({ ok: false, error: 'Not logged in' });
        return handleAdminCblogsToggle(request, env, aUid);
      }
      if (path === '/api/admin/cblogs/generate' && method === 'POST') {
        const aUid = await getUidFromSessionCookie(request, env);
        if (!aUid) return json({ ok: false, error: 'Not logged in' });
        return handleAdminCblogsGenerate(request, env, aUid);
      }
      // Account flag toggle (payment failed / trial expiring / inactive).
      if (path === '/api/admin/accounts/flag' && method === 'POST') {
        const aUid = await getUidFromSessionCookie(request, env);
        if (!aUid) return json({ ok: false, error: 'Not logged in' });
        return handleAdminAccountFlag(request, env, aUid);
      }
      // ── Cookie-authed photo routes for the website builder ──
      // The builder page is cookie-authed (no Bearer token client-side), so
      // upload/tag/delete resolve the user from the session cookie here.
      if (path === '/api/photos/upload-htmx' && method === 'POST') {
        const phUid = await getUidFromSessionCookie(request, env);
        if (!phUid) return json({ ok: false, error: 'Not logged in' });
        return handlePhotoUploadHtmx(request, env, phUid);
      }
      if (path === '/api/photos/tag-htmx' && method === 'POST') {
        const phUid = await getUidFromSessionCookie(request, env);
        if (!phUid) return json({ ok: false, error: 'Not logged in' });
        const phBody = await request.json().catch(() => ({}));
        return handlePhotoTagHtmx(request, env, phUid, phBody);
      }
      if (path === '/api/photos/delete-htmx' && method === 'POST') {
        const phUid = await getUidFromSessionCookie(request, env);
        if (!phUid) return json({ ok: false, error: 'Not logged in' });
        const phBody = await request.json().catch(() => ({}));
        return handlePhotoDeleteHtmx(request, env, phUid, phBody);
      }
      // Cookie-authed review sync for the website builder's "Sync reviews"
      // button (no Bearer token available client-side). Resolves the user from
      // the session cookie, requires the Review Monitoring add-on.
      if (path === '/api/reviews/sync' && method === 'POST') {
        const rvUid = await getUidFromSessionCookie(request, env);
        if (!rvUid) return json({ ok: false, error: 'Not logged in' });
        return handleReviewsSyncHtmx(request, env, rvUid);
      }
      // Bulk review sync for an external cron service. Optionally guarded by a
      // shared secret (CRON_SECRET) when set; public-but-loggable otherwise.
      if (path === '/api/cron/reviews-sync' && method === 'POST') {
        return handleReviewsSyncCron(request, env);
      }
      // Social Media auto-post cron — for each business with the add-on on and
      // a configured Facebook token, generate one post from their newest
      // review and publish it (skipping any that posted in the last 24h).
      if (path === '/api/cron/social-autopost' && method === 'POST') {
        return handleSocialAutopostCron(request, env);
      }
      // ── Social Media add-on — cookie-authed (the /p/social page has no Bearer
      // token). Generate drafts, publish, publish-all, delete.
      if (path === '/api/social/generate' && method === 'POST') {
        const soUid = await getUidFromSessionCookie(request, env);
        if (!soUid) return json({ ok: false, error: 'Not logged in' });
        return handleSocialGenerate(request, env, soUid);
      }
      if (path === '/api/social/publish' && method === 'POST') {
        const soUid = await getUidFromSessionCookie(request, env);
        if (!soUid) return json({ ok: false, error: 'Not logged in' });
        return handleSocialPublish(request, env, soUid);
      }
      if (path === '/api/social/publish-all' && method === 'POST') {
        const soUid = await getUidFromSessionCookie(request, env);
        if (!soUid) return json({ ok: false, error: 'Not logged in' });
        return handleSocialPublishAll(request, env, soUid);
      }
      const socialDeleteMatch = path.match(/^\/api\/social\/posts\/(\d+)$/);
      if (socialDeleteMatch && method === 'DELETE') {
        const soUid = await getUidFromSessionCookie(request, env);
        if (!soUid) return json({ ok: false, error: 'Not logged in' });
        return handleSocialDelete(request, env, soUid, parseInt(socialDeleteMatch[1], 10));
      }
      // Cookie-authed wrapper for the full Stripe-syncing add-on toggle. The
      // public-site preview's unlock button lives in an iframe (cookie-authed,
      // no Bearer token), so it calls this -htmx variant which resolves the
      // owner from the session cookie then runs handleAddonToggle (Stripe sync
      // + local flag flip). Body: { addon, enabled }.
      if (path === '/api/addon/unlock-htmx' && method === 'POST') {
        const uUid = await getUidFromSessionCookie(request, env);
        if (!uUid) return json({ ok: false, error: 'Not logged in' });
        return handleAddonToggle(request, env, uUid);
      }

      // ── Scout AI assistant (cookie-authed; the panel lives on /p/* pages).
      // Resolves the active business via resolveContext (honors bl_business_id)
      // so a team member gets the business's context, not their own empty rows.
      if (path === '/api/scout' && method === 'POST') {
        const scUid = await getUidFromSessionCookie(request, env);
        if (!scUid) return json({ ok: false, error: 'Not logged in' });
        const scCtx = await resolveContext(request, env, scUid);
        return handleScout(request, env, scCtx.bid);
      }

      // ── Team / roles API (cookie-authed via bl_session) ──
      // switch works for any logged-in member; the rest require business admin.
      if (path === '/api/team/switch' && method === 'POST') {
        return handleTeamSwitch(request, env);
      }
      if (path === '/api/team/invite' && method === 'POST') {
        const { ctx, error } = await requireTeamAdmin(request, env);
        if (error) return error;
        const r = await handleTeamInvite(request, env, ctx);
        // Form posts come from /p/team; redirect back so the page re-renders.
        const isForm = (request.headers.get('Content-Type') || '').includes('application/x-www-form-urlencoded');
        return isForm ? new Response(null, { status: 303, headers: { Location: '/p/team' } }) : r;
      }
      if (path === '/api/team/role' && method === 'POST') {
        const { ctx, error } = await requireTeamAdmin(request, env);
        if (error) return error;
        const r = await handleTeamRole(request, env, ctx);
        const isForm = (request.headers.get('Content-Type') || '').includes('application/x-www-form-urlencoded');
        return isForm ? new Response(null, { status: 303, headers: { Location: '/p/team' } }) : r;
      }
      if (path === '/api/team/remove' && method === 'POST') {
        const { ctx, error } = await requireTeamAdmin(request, env);
        if (error) return error;
        const r = await handleTeamRemove(request, env, ctx);
        const isForm = (request.headers.get('Content-Type') || '').includes('application/x-www-form-urlencoded');
        return isForm ? new Response(null, { status: 303, headers: { Location: '/p/team' } }) : r;
      }
      if (path === '/api/team/revoke' && method === 'POST') {
        const { ctx, error } = await requireTeamAdmin(request, env);
        if (error) return error;
        const r = await handleTeamRevoke(request, env, ctx);
        const isForm = (request.headers.get('Content-Type') || '').includes('application/x-www-form-urlencoded');
        return isForm ? new Response(null, { status: 303, headers: { Location: '/p/team' } }) : r;
      }

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
      // Stripe webhook — public (no Bearer auth); verified by signature.
      if (path === '/api/stripe/webhook' && method === 'POST') {
        return handleStripeWebhook(request, env);
      }
      // Vapi call webhook — public; verified by x-vapi-secret header.
      if (path === '/api/vapi/call-webhook' && method === 'POST') {
        return handleVapiWebhook(request, env);
      }
      // Gmail OAuth callback — public (Google redirects here)
      if (path === '/api/gmail/callback' && method === 'GET') {
        return handleGmailCallback(request, env);
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
      // Gmail OAuth (auth-required)
      if (path === '/api/gmail/auth' && method === 'GET') {
        return handleGmailAuth(request, env, uid);
      }
      if (path === '/api/gmail/status' && method === 'GET') {
        return handleGmailStatus(request, env, uid);
      }
      if (path === '/api/gmail/disconnect' && method === 'POST') {
        return handleGmailDisconnect(request, env, uid);
      }

      // SMS send (via Twilio)
      if (path === '/api/send-sms' && method === 'POST') {
        return handleSendSms(request, env, uid);
      }

      // Vapi AI voice — provision Emma + phone number, and place outbound calls.
      if (path === '/api/vapi/provision' && method === 'POST') {
        return handleVapiProvision(request, env, uid);
      }
      if (path === '/api/vapi/call' && method === 'POST') {
        return handleVapiCall(request, env, uid);
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
      // Stripe add-on toggle: { addon, enabled } → { ok, message, addons }
      if (path === '/api/settings/addon' && method === 'POST') {
        return handleAddonToggle(request, env, uid);
      }
      // Stripe Checkout: { plan?, addons?: string[] } → { ok, url }
      if (path === '/api/stripe/checkout' && method === 'POST') {
        return handleStripeCheckout(request, env, uid);
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
      // AI email draft — generates a personalized follow-up from a transcript
      if (path === '/api/email/draft' && method === 'POST') {
        return handleEmailDraft(request, env, uid);
      }
      // AI Blog Posts add-on — generate one post now (business's own account).
      if (path === '/api/blog/generate' && method === 'POST') {
        return handleBlogGenerate(request, env, uid);
      }

      // Job photos — before / during / after
      if (path === '/api/photos/upload' && method === 'POST') {
        return handlePhotoUpload(request, env, uid);
      }
      if (path === '/api/photos' && method === 'GET') {
        return handlePhotosList(request, env, uid);
      }

      // Public website builder — publish / status / config
      if (path === '/api/sites/publish' && method === 'POST') {
        return handleSitesPublish(request, env, uid);
      }
      if (path === '/api/sites/config' && method === 'POST') {
        return handleSitesConfig(request, env, uid);
      }
      if (path === '/api/sites' && method === 'GET') {
        return handleSitesStatus(request, env, uid);
      }

      // Email autoresponder — trigger + history
      if (path === '/api/emails/send-template' && method === 'POST') {
        return handleEmailsSendTemplate(request, env, uid);
      }
      if (path === '/api/emails' && method === 'GET') {
        return handleEmailsList(request, env, uid);
      }

      // Affiliate / referral program
      if (path === '/api/affiliates/signup' && method === 'POST') {
        return handleAffiliateSignup(request, env, uid);
      }
      if (path === '/api/affiliates/stats' && method === 'GET') {
        return handleAffiliateStats(request, env, uid);
      }
      if (path === '/api/affiliates/payouts' && method === 'GET') {
        return handleAffiliatePayouts(request, env);
      }

      // Cold outreach pipeline — Apollo prospect search + TextMagic SMS blast.
      if (path === '/api/outreach/search' && method === 'POST') {
        return handleOutreachSearch(request, env, uid);
      }
      if (path === '/api/outreach/text-blast' && method === 'POST') {
        return handleOutreachTextBlast(request, env, uid);
      }

      // Fallback
      return apiError('Not found', 404);

    } catch (e) {
      console.error('Unhandled error:', e);
      return apiError('Internal server error', 500);
    }
  },

  // ── Cron handler ──
  // wrangler.jsonc declares `*/15 * * * *` (every 15 min). We only act on it
  // for the AI Blog Posts add-on: generate up to 3 posts/week for each
  // business with addon_blog=1, publishing on Mon/Wed/Fri. The 15-min cadence
  // means this fires 4×/hour, so we gate on "top of the hour" (minute 0-14) and
  // Mon/Wed/Fri to avoid over-generating. Each account is isolated in its own
  // try/catch so one failure never aborts the batch.
  async scheduled(controller, env, ctx) {
    try {
      await initDB(env);
      // Day gate: 1=Mon, 3=Wed, 5=Fri (UTC). The cron is hourly at worst, and
      // generating once per such day is enough for 3/week.
      const now = new Date();
      const dow = now.getUTCDay();
      if (dow !== 1 && dow !== 3 && dow !== 5) {
        console.log('cblog cron: not a publish day (dow=' + dow + '), skipping.');
        return;
      }

      // Pull every business with the blog add-on on.
      const { results } = await env.DB.prepare(
        'SELECT user_id FROM settings WHERE addon_blog = 1'
      ).all();
      const accounts = results || [];
      console.log(`cblog cron: ${accounts.length} account(s) with the add-on.`);

      let generated = 0;
      for (const acct of accounts) {
        const uid = acct.user_id;
        try {
          // Cap at 3 posts in the rolling last 7 days. If they already have 3,
          // skip — this is the "3/week" goal from the spec.
          const weekCount = await env.DB.prepare(
            `SELECT COUNT(*) AS c FROM business_blog_posts
             WHERE user_id = ? AND published_at >= datetime('now', '-7 days')`
          ).bind(uid).first();
          const have = (weekCount && weekCount.c) || 0;
          if (have >= 3) continue;

          const res = await generateBusinessBlogPost(env, uid);
          if (res.ok) {
            generated += 1;
            console.log(`cblog cron: generated "${res.post.title}" for uid ${uid}.`);
            // Best-effort notify (degrades gracefully if email unset).
            notifyBusinessOfPost(env, uid, res.post);
          } else {
            console.log(`cblog cron: skipped uid ${uid}: ${res.error || 'unknown'}`);
          }
        } catch (e) {
          // Isolate per-account failures so the loop keeps going.
          console.error(`cblog cron error (uid ${uid}):`, e && e.message);
        }
      }
      console.log(`cblog cron: done. ${generated} post(s) generated.`);
    } catch (e) {
      console.error('Scheduled handler error:', e);
    }
  },
};

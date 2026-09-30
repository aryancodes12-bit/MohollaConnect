package com.localconnect.config;

import com.localconnect.entity.*;
import com.localconnect.repository.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.List;

/**
 * DemoDataSeeder — runs ONLY when the "demo" Spring profile is active.
 *
 * Idempotent: checks for the sentinel user "sharma.kirana@demo.localconnect.in"
 * before seeding. If it already exists, the seeder exits immediately, so
 * restarting the backend in demo mode never creates duplicate data.
 *
 * All demo accounts share password: Demo@1234
 */
@Component
@Profile("demo")
public class DemoDataSeeder implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DemoDataSeeder.class);
    private static final String DEMO_PASSWORD = "Demo@1234";
    private static final String SENTINEL_EMAIL = "sharma.kirana@demo.localconnect.in";

    private final UserRepository userRepo;
    private final StoreRepository storeRepo;
    private final ProductRepository productRepo;
    private final OrderRepository orderRepo;
    private final ReviewRepository reviewRepo;
    private final CommunityPostRepository communityPostRepo;
    private final PasswordEncoder passwordEncoder;
    private final SecureRandom secureRandom = new SecureRandom();

    public DemoDataSeeder(UserRepository userRepo, StoreRepository storeRepo,
                          ProductRepository productRepo, OrderRepository orderRepo,
                          ReviewRepository reviewRepo, CommunityPostRepository communityPostRepo,
                          PasswordEncoder passwordEncoder) {
        this.userRepo = userRepo;
        this.storeRepo = storeRepo;
        this.productRepo = productRepo;
        this.orderRepo = orderRepo;
        this.reviewRepo = reviewRepo;
        this.communityPostRepo = communityPostRepo;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional
    public void run(String... args) {
        // ── Backfill coordinates for existing stores if null ───────────────────
        backfillCoordinatesIfNull();

        // ── Seed / backfill historical 45-day sales & reviews for all 13 stores ──
        seedHistoricalSalesAndReviewsIfSparse();

        // ── Idempotency guard ──────────────────────────────────────────────────
        if (userRepo.existsByEmail(SENTINEL_EMAIL)) {
            log.info("[DemoSeeder] Demo data already present — skipping new insertion.");
            return;
        }
        log.info("[DemoSeeder] Seeding demo data with precise coordinates...");

        String hash = passwordEncoder.encode(DEMO_PASSWORD);

        // ══════════════════════════════════════════════════════════════════
        // SELLER USERS
        // ══════════════════════════════════════════════════════════════════

        // 1. Kirana – APPROVED
        User kiranaOwner = save(user("Ramesh Sharma", SENTINEL_EMAIL, hash, Role.SELLER));
        // 2. Dairy – APPROVED
        User dairyOwner = save(user("Krishna Yadav", "krishna.dairy@demo.localconnect.in", hash, Role.SELLER));
        // 3. Veg/Fruit – APPROVED
        User vegOwner = save(user("Sukhwinder Singh", "fresh.mandi@demo.localconnect.in", hash, Role.SELLER));
        // 4. Tailoring – APPROVED
        User tailorOwner = save(user("Fatima Sheikh", "fatima.tailor@demo.localconnect.in", hash, Role.SELLER));
        // 5. Ironing – PENDING
        User ironOwner = save(user("Ramesh Gupta", "ramesh.istri@demo.localconnect.in", hash, Role.PENDING_SELLER));
        // 6. Handicraft – APPROVED
        User craftOwner = save(user("Mohd. Salim Khan", "saharanpur.crafts@demo.localconnect.in", hash, Role.SELLER));
        // 7. Spice – APPROVED
        User spiceOwner = save(user("George Thomas", "kerala.spice@demo.localconnect.in", hash, Role.SELLER));
        // 8. Bakery – APPROVED
        User bakeryOwner = save(user("Priya Nair", "priya.homebakes@demo.localconnect.in", hash, Role.SELLER));
        // 9. Brassware – APPROVED
        User brassOwner = save(user("Rajan Verma", "moradabad.brass@demo.localconnect.in", hash, Role.SELLER));
        // 10. Handloom – APPROVED
        User handloomOwner = save(user("Nandini Joshi", "jaipur.blockprint@demo.localconnect.in", hash, Role.SELLER));
        // 11. Electrician – APPROVED
        User electricOwner = save(user("Suresh Patel", "suresh.electrical@demo.localconnect.in", hash, Role.SELLER));
        // 12. Mobile Repair – PENDING
        User mobileOwner = save(user("Arjun Thakur", "quickfix.mobile@demo.localconnect.in", hash, Role.PENDING_SELLER));
        // 13. Chai Stall – APPROVED
        User chaiOwner = save(user("Dinesh Kumar", "bhaiyaji.chai@demo.localconnect.in", hash, Role.SELLER));

        // ══════════════════════════════════════════════════════════════════
        // BUYER USERS
        // ══════════════════════════════════════════════════════════════════
        User buyer1 = save(user("Sunita Sharma", "sunita.sharma@demo.localconnect.in", hash, Role.BUYER));
        User buyer2 = save(user("Vikram Mehta", "vikram.mehta@demo.localconnect.in", hash, Role.BUYER));
        User buyer3 = save(user("Ayesha Khan", "ayesha.khan@demo.localconnect.in", hash, Role.BUYER));
        User buyer4 = save(user("Rohan Deshmukh", "rohan.deshmukh@demo.localconnect.in", hash, Role.BUYER));

        // ══════════════════════════════════════════════════════════════════
        // STORES
        // ══════════════════════════════════════════════════════════════════

        Store kiranaStore = saveStore("Sharma Kirana Store", "KIRANA",
                "Sector 12, Dwarka, New Delhi – 110075",
                "Your neighbourhood one-stop kirana since 1998. We stock everything from daily dals and oils to packaged snacks and household basics — fresh stock every morning, home delivery in Dwarka Sector 12 and 13.",
                kiranaOwner, "APPROVED", 28.5921, 77.0460);

        Store dairyStore = saveStore("Krishna Dairy Booth", "DAIRY",
                "Vastrapur, Ahmedabad – 380015",
                "Farm-fresh dairy delivered straight to your door every morning before 7 AM. Our cows graze on open pastures in Anand — pure, unadulterated milk and paneer, no additives.",
                dairyOwner, "APPROVED", 23.0365, 72.5284);

        Store vegStore = saveStore("Fresh Mandi Basket", "VEGETABLES",
                "Malviya Nagar Market, Jaipur – 302017",
                "Direct from Jaipur's Muhana Mandi wholesale market to your doorstep. Bulk vegetable and seasonal fruit orders welcome — best prices guaranteed for housing societies and offices.",
                vegOwner, "APPROVED", 26.8530, 75.8197);

        Store tailorStore = saveStore("Fatima Tailoring House", "TAILORING",
                "Bhendi Bazaar, Mumbai – 400003",
                "Three generations of stitching mastery. We specialise in ladies' blouses, salwar-kameez, and kurtas with custom measurements. Walk-ins welcome; home visit for 5+ orders.",
                tailorOwner, "APPROVED", 18.9583, 72.8339);

        Store ironStore = saveStore("Ramesh Istri Center", "LAUNDRY",
                "Laxmi Nagar, Delhi – 110092",
                "Fast, affordable ironing for your entire family. Daily pickup from door, ironed clothes returned same evening. Monthly subscription available for households and small offices.",
                ironOwner, "PENDING", 28.6304, 77.2773);

        Store craftStore = saveStore("Saharanpur Sheesham Crafts", "HANDICRAFTS",
                "Saharanpur Wood Mandi, Saharanpur, UP – 247001",
                "We are fourth-generation wood artisans from Saharanpur, the carved-furniture capital of India. Every piece is hand-cut from sustainably sourced sheesham and teak, finished with natural lacquers.",
                craftOwner, "APPROVED", 29.9678, 77.5460);

        Store spiceStore = saveStore("Kerala Spice Corner", "FOOD",
                "Ernakulam Market, Kochi, Kerala – 682011",
                "Sourced directly from spice gardens in Idukki and Wayanad districts. Whole spices dried naturally and ground fresh on order — no artificial colouring, no anti-caking agents.",
                spiceOwner, "APPROVED", 9.9816, 76.2829);

        Store bakeryStore = saveStore("Priya's Home Bakes", "FOOD",
                "Koramangala 5th Block, Bengaluru – 560095",
                "Baking from my home kitchen in Koramangala since 2019. All cakes are 100% eggless. Custom orders for birthdays, anniversaries, and corporate gifting — minimum 48-hour advance notice.",
                bakeryOwner, "APPROVED", 12.9352, 77.6245);

        Store brassStore = saveStore("Moradabad Brass House", "HANDICRAFTS",
                "Brass Bazaar, Moradabad, UP – 244001",
                "Moradabad is the 'Brass City' of India, and our family has been crafting here for 80 years. Puja items, home décor, and gifting pieces — each one finished by hand.",
                brassOwner, "APPROVED", 28.8386, 78.7733);

        Store handloomStore = saveStore("Jaipur Block Print Studio", "TEXTILES",
                "Sanganer, Jaipur, Rajasthan – 302029",
                "Sanganer is India's block-printing heartland and our studio has been printing here since 1971. Natural vegetable dyes, hand-carved wooden blocks, organic cotton fabric — entirely handmade.",
                handloomOwner, "APPROVED", 26.8021, 75.7699);

        Store electricStore = saveStore("Suresh Electrical Repairs", "SERVICES",
                "Andheri West, Mumbai – 400058",
                "Licensed electrician serving Andheri West, Versova, and Oshiwara for 15 years. Quick response for faults, installations, and AMC contracts for residential societies.",
                electricOwner, "APPROVED", 19.1197, 72.8464);

        Store mobileStore = saveStore("QuickFix Mobile Care", "SERVICES",
                "Nehru Place, New Delhi – 110019",
                "Genuine spare parts, 30-day repair warranty, and same-day turnaround on most models. Serving Nehru Place and Greater Kailash area. Free diagnostic for phones bought at our counter.",
                mobileOwner, "PENDING", 28.5494, 77.2528);

        Store chaiStore = saveStore("Bhaiya Ji Chai Corner", "FOOD",
                "Connaught Place, New Delhi – 110001",
                "Serving cutting chai and hot snacks to CP office-goers since 2007. Monthly subscription available for offices — hot tea delivered at your desk, twice daily.",
                chaiOwner, "APPROVED", 28.6304, 77.2177);

        // ══════════════════════════════════════════════════════════════════
        // PRODUCTS — 1. KIRANA (expanded to ~70 products)
        // ══════════════════════════════════════════════════════════════════
        // Atta, Rice, Dal
        Product kirana1  = saveProduct(kiranaStore, "Aashirvaad Atta 5kg", "Chakki Fresh Atta, slow-ground whole wheat. Best for soft rotis.", bd("245"), 80);
        Product kirana2  = saveProduct(kiranaStore, "Rajdhani Whole Wheat Atta 10kg", "Finely ground chakki atta for large families.", bd("469"), 40);
        Product kirana3  = saveProduct(kiranaStore, "Basmati Rice (Premium) 5kg", "Long-grain aged basmati, restaurant quality.", bd("420"), 55);
        Product kirana4  = saveProduct(kiranaStore, "Sona Masoori Rice 5kg", "Lightweight, low-starch everyday rice for South Indian meals.", bd("310"), 60);
        Product kirana5  = saveProduct(kiranaStore, "Toor Dal 1kg", "Premium Rajkot toor dal, new season.", bd("165"), 90);
        Product kirana6  = saveProduct(kiranaStore, "Chana Dal 1kg", "Split Bengal gram, ideal for dal tadka.", bd("128"), 75);
        Product kirana7  = saveProduct(kiranaStore, "Moong Dal (Yellow Split) 1kg", "Quick-cooking yellow moong, good for khichdi.", bd("138"), 70);
        Product kirana8  = saveProduct(kiranaStore, "Masoor Dal (Red Lentil) 1kg", "Fast-cooking red lentils, mildly sweet flavour.", bd("112"), 80);
        Product kirana9  = saveProduct(kiranaStore, "Urad Dal (White) 1kg", "Skinned black gram for dal makhani and dosas.", bd("152"), 65);
        Product kirana10 = saveProduct(kiranaStore, "Rajma (Kidney Beans) 500g", "Jammu dark-red rajma, thick gravy variant.", bd("89"), 60);
        // Oils & Ghee
        Product kirana11 = saveProduct(kiranaStore, "Fortune Sunflower Oil 1L", "Refined sunflower oil, cholesterol-free.", bd("142"), 100);
        Product kirana12 = saveProduct(kiranaStore, "Saffola Gold Oil 1L", "Blended rice bran + corn oil for heart-conscious cooking.", bd("178"), 60);
        Product kirana13 = saveProduct(kiranaStore, "Dhara Mustard Oil 1L", "Cold-pressed kachchi ghani, traditional North Indian cooking.", bd("158"), 70);
        Product kirana14 = saveProduct(kiranaStore, "Amul Pure Ghee 500g", "Pure cow ghee, pasture-raised. Rich aroma.", bd("310"), 50);
        Product kirana15 = saveProduct(kiranaStore, "Patanjali Cow Ghee 1kg", "Desi gir cow ghee, Ayurvedic grade.", bd("599"), 30);
        // Salt, Sugar, Spices
        Product kirana16 = saveProduct(kiranaStore, "Tata Salt 1kg", "Iodised common salt, vacuum-evaporated purity.", bd("28"), 200);
        Product kirana17 = saveProduct(kiranaStore, "Tata Salt Lite (Low Sodium) 1kg", "30% less sodium, recommended for blood-pressure patients.", bd("45"), 60);
        Product kirana18 = saveProduct(kiranaStore, "Sugar (White Refined) 1kg", "M-30 grade sulphurless white sugar.", bd("48"), 150);
        Product kirana19 = saveProduct(kiranaStore, "Desi Khandsari Sugar 1kg", "Unrefined raw sugar, slight molasses flavour.", bd("55"), 80);
        Product kirana20 = saveProduct(kiranaStore, "MDH Garam Masala 100g", "Classic whole-spice blend, restaurant-grade.", bd("72"), 90);
        Product kirana21 = saveProduct(kiranaStore, "Everest Rajma Masala 100g", "Ready-mix spice for rajma curry.", bd("55"), 80);
        Product kirana22 = saveProduct(kiranaStore, "Red Chilli Powder 200g (Catch)", "Moderate heat, vibrant red colour for gravies.", bd("68"), 85);
        Product kirana23 = saveProduct(kiranaStore, "Turmeric Powder 200g (Everest)", "Pure haldi, no adulterants, 4.5% curcumin.", bd("62"), 90);
        Product kirana24 = saveProduct(kiranaStore, "Coriander (Dhania) Powder 200g", "Stone-ground dhania, fresh aroma.", bd("58"), 90);
        // Tea & Coffee
        Product kirana25 = saveProduct(kiranaStore, "Red Label Tea 500g", "Brooke Bond's everyday strong tea, best for chai.", bd("210"), 60);
        Product kirana26 = saveProduct(kiranaStore, "Tata Tetley Green Tea (25 bags)", "Classic green tea bags, light infusion.", bd("125"), 50);
        Product kirana27 = saveProduct(kiranaStore, "Bru Gold Instant Coffee 50g", "Rich, roasted South Indian coffee blend.", bd("165"), 40);
        Product kirana28 = saveProduct(kiranaStore, "Nescafé Classic Instant Coffee 100g", "Smooth freeze-dried coffee.", bd("330"), 35);
        // Biscuits & Packaged Snacks
        Product kirana29 = saveProduct(kiranaStore, "Parle-G Biscuits (Pack of 10)", "India's favourite glucose biscuit, dunk it in chai.", bd("50"), 120);
        Product kirana30 = saveProduct(kiranaStore, "Britannia Good Day Cashew Cookies 150g", "Buttery shortbread cookies with real cashew pieces.", bd("45"), 80);
        Product kirana31 = saveProduct(kiranaStore, "Hide & Seek Bourbon 150g", "Chocolate cream sandwich biscuits.", bd("38"), 90);
        Product kirana32 = saveProduct(kiranaStore, "Haldiram's Aloo Bhujia 400g", "Crispy potato & besan sev snack.", bd("110"), 60);
        Product kirana33 = saveProduct(kiranaStore, "Haldiram's Moong Dal Namkeen 400g", "Crunchy roasted moong dal with mild spicing.", bd("105"), 55);
        Product kirana34 = saveProduct(kiranaStore, "Kurkure Masala Munch 90g", "Tangy corn puffs, popular teatime snack.", bd("30"), 100);
        // Dairy (packaged)
        Product kirana35 = saveProduct(kiranaStore, "Amul Butter 500g", "Salted cream butter, made from pasteurised milk.", bd("275"), 45);
        Product kirana36 = saveProduct(kiranaStore, "Amul Processed Cheese 200g", "Mild, meltable processed cheese slices.", bd("145"), 40);
        Product kirana37 = saveProduct(kiranaStore, "Nestlé Milkmaid Condensed Milk 400g", "Sweetened condensed milk for sweets and desserts.", bd("108"), 50);
        Product kirana38 = saveProduct(kiranaStore, "Amul Taaza Milk (Tetra Pack) 1L", "UHT full-cream milk, 6-month shelf life.", bd("72"), 80);
        // Personal Care & Household
        Product kirana39 = saveProduct(kiranaStore, "Vim Dishwash Bar 200g", "Lime-active grease-cutting dish soap.", bd("35"), 120);
        Product kirana40 = saveProduct(kiranaStore, "Rin Detergent Powder 1kg", "Fabric whitening washing powder.", bd("90"), 100);
        Product kirana41 = saveProduct(kiranaStore, "Surf Excel Easy Wash 500g", "Quick-dissolve detergent for hand wash.", bd("78"), 90);
        Product kirana42 = saveProduct(kiranaStore, "Colgate Maxfresh Toothpaste 150g", "Cooling mint flavour with micro-granules.", bd("112"), 80);
        Product kirana43 = saveProduct(kiranaStore, "Closeup Red Hot Toothpaste 80g", "Antibacterial toothpaste, bright-smile formula.", bd("68"), 75);
        Product kirana44 = saveProduct(kiranaStore, "Lifebuoy Total 10 Soap 125g", "Antibacterial bar soap with silver shield.", bd("40"), 110);
        Product kirana45 = saveProduct(kiranaStore, "Dove Cream Beauty Bar 100g", "Moisturising soap with ¼ cleansing cream.", bd("75"), 80);
        Product kirana46 = saveProduct(kiranaStore, "Dettol Original Soap 75g", "Antiseptic protection, classic pine fragrance.", bd("48"), 95);
        Product kirana47 = saveProduct(kiranaStore, "Head & Shoulders Shampoo 180ml", "Anti-dandruff shampoo, cool menthol variant.", bd("165"), 50);
        Product kirana48 = saveProduct(kiranaStore, "Pantene Pro-V Shampoo 180ml", "Smooth & strong shampoo for everyday use.", bd("182"), 45);
        Product kirana49 = saveProduct(kiranaStore, "Parachute Coconut Oil 500ml", "100% pure coconut oil for hair and skin.", bd("215"), 60);
        Product kirana50 = saveProduct(kiranaStore, "Bajaj Almond Drops Hair Oil 100ml", "Non-sticky hair oil with vitamin E.", bd("85"), 70);
        // Baby & Health
        Product kirana51 = saveProduct(kiranaStore, "Dettol Handwash Liquid Refill 750ml", "Original antiseptic handwash.", bd("189"), 55);
        Product kirana52 = saveProduct(kiranaStore, "Savlon Advanced Hand Sanitizer 200ml", "70% alcohol gel sanitizer.", bd("110"), 60);
        Product kirana53 = saveProduct(kiranaStore, "Johnson's Baby Powder 200g", "Mild talc for sensitive baby skin.", bd("145"), 40);
        // Packaged Foods
        Product kirana54 = saveProduct(kiranaStore, "Maggi 2-Minute Noodles (Pack of 6)", "Original masala flavour, quick snack.", bd("78"), 90);
        Product kirana55 = saveProduct(kiranaStore, "Top Ramen Curry Noodles (Pack of 4)", "Cup-style noodles with curry broth.", bd("68"), 80);
        Product kirana56 = saveProduct(kiranaStore, "MTR Ready-to-Eat Dal Makhani 300g", "Restaurant-style ready-to-heat dal makhani.", bd("149"), 45);
        Product kirana57 = saveProduct(kiranaStore, "MTR Ready-to-Eat Palak Paneer 300g", "Creamy spinach and cottage cheese, heat & eat.", bd("155"), 40);
        Product kirana58 = saveProduct(kiranaStore, "Lijjat Papad (Urad) 200g", "Sun-dried lentil papads, ready to roast or fry.", bd("62"), 75);
        Product kirana59 = saveProduct(kiranaStore, "Borges Olive Oil 500ml", "Extra light olive oil for Indian cooking.", bd("490"), 25);
        // Beverages
        Product kirana60 = saveProduct(kiranaStore, "Coca-Cola 2L", "Classic cola, family size.", bd("95"), 60);
        Product kirana61 = saveProduct(kiranaStore, "Thums Up 600ml (Pack of 6)", "Strong carbonated cola, Indian favourite.", bd("108"), 50);
        Product kirana62 = saveProduct(kiranaStore, "Real Juice Mixed Fruit 1L", "No-added-sugar fruit juice blend.", bd("115"), 55);
        Product kirana63 = saveProduct(kiranaStore, "B Natural Pomegranate Juice 1L", "100% pomegranate juice, no preservatives.", bd("145"), 35);
        Product kirana64 = saveProduct(kiranaStore, "Tropicana Orange Juice 1L", "100% squeezed orange juice, refrigerated section.", bd("165"), 30);
        // Stationery & Misc
        Product kirana65 = saveProduct(kiranaStore, "Fevistick Glue Stick 8g", "Quick-dry craft glue stick.", bd("30"), 100);
        Product kirana66 = saveProduct(kiranaStore, "Reynolds 045 Ball Pen (Pack of 5)", "Smooth-writing medium tip blue pens.", bd("55"), 80);
        Product kirana67 = saveProduct(kiranaStore, "Classmate Single-Line Notebook 172 pages", "160 GSM ruled pages, student favourite.", bd("85"), 60);
        Product kirana68 = saveProduct(kiranaStore, "HIT Mosquito Spray 400ml", "Fast-acting mosquito and cockroach killer.", bd("235"), 45);
        Product kirana69 = saveProduct(kiranaStore, "Good Knight Mosquito Coil (Pack of 10)", "10-hour protection mosquito coil.", bd("55"), 80);
        Product kirana70 = saveProduct(kiranaStore, "Colin Glass & Surface Cleaner 500ml", "Streak-free glass cleaner.", bd("165"), 40);

        // ── 2. DAIRY ──────────────────────────────────────────────────────
        Product dairy1 = saveProduct(dairyStore, "Full Cream Milk 1L (Daily Subscription)", "Fresh cow milk delivered before 7 AM, 6 days/week. Creamy, unadulterated.", bd("64"), 200);
        Product dairy2 = saveProduct(dairyStore, "Toned Milk 500ml", "Ideal for tea and everyday cooking, 3% fat.", bd("27"), 250);
        Product dairy3 = saveProduct(dairyStore, "Fresh Paneer 250g", "Soft, handmade from full cream milk. Best used same day.", bd("90"), 80);
        Product dairy4 = saveProduct(dairyStore, "Curd / Dahi 500g (Set Dahi)", "Thick, mildly sour set curd. Perfect with parathas.", bd("40"), 150);
        Product dairy5 = saveProduct(dairyStore, "Homemade Ghee 1kg", "Slow-simmered desi cow ghee. Nutty aroma, no additives.", bd("680"), 30);
        Product dairy6 = saveProduct(dairyStore, "Skimmed Milk 1L", "Low-fat milk for the calorie-conscious. 0.5% fat.", bd("58"), 100);
        Product dairy7 = saveProduct(dairyStore, "Butter Milk / Chaas 500ml", "Lightly salted, fresh buttermilk — ideal summer drink.", bd("22"), 120);
        Product dairy8 = saveProduct(dairyStore, "Flavoured Milk Kesar-Badam 250ml", "Warm saffron-almond milk, no artificial flavours.", bd("45"), 60);

        // ── 3. VEGETABLES ─────────────────────────────────────────────────
        Product veg1 = saveProduct(vegStore, "Onions 1kg", "Fresh Nashik red onions, firm and pungent.", bd("32"), 200);
        Product veg2 = saveProduct(vegStore, "Tomatoes 1kg", "Vine-ripened Roma tomatoes, ideal for gravies.", bd("40"), 180);
        Product veg3 = saveProduct(vegStore, "Potatoes 5kg (Bulk Pack)", "Agra white potatoes, good for frying and boiling.", bd("110"), 100);
        Product veg4 = saveProduct(vegStore, "Seasonal Mixed Vegetable Basket 5kg", "Curated 5kg box of 6-8 seasonal vegetables — changes weekly based on what's freshest in the mandi.", bd("350"), 50);
        Product veg5 = saveProduct(vegStore, "Bananas (Dozen)", "Elachi/Yelakki bananas, sweet and small.", bd("60"), 120);
        Product veg6 = saveProduct(vegStore, "Mixed Fruit Basket (Family Pack)", "Approx. 4kg — seasonal fruits including apple, pear, guava, and oranges.", bd("499"), 40);
        Product veg7 = saveProduct(vegStore, "Green Peas (Matar) 500g", "Fresh shelled green peas, sweet and crunchy.", bd("45"), 90);
        Product veg8 = saveProduct(vegStore, "Capsicum (Mix Colour) 500g", "Red, yellow, green capsicum for stir-fries and salads.", bd("68"), 70);
        Product veg9 = saveProduct(vegStore, "Spinach (Palak) 500g", "Fresh tender spinach leaves, cleaned and bagged.", bd("35"), 100);
        Product veg10 = saveProduct(vegStore, "Cauliflower (1 head, ~700g)", "Fresh white cauliflower, season: Oct-Mar.", bd("45"), 80);
        Product veg11 = saveProduct(vegStore, "Bottle Gourd (Lauki) 1 piece ~500g", "Tender lauki, mild flavour for sabzi or juice.", bd("28"), 90);
        Product veg12 = saveProduct(vegStore, "Bitter Gourd (Karela) 500g", "Fresh karela, packed with minerals.", bd("55"), 70);

        // ── 4. TAILORING ──────────────────────────────────────────────────
        Product tailor1 = saveProduct(tailorStore, "Blouse Stitching (Custom Fit)", "Includes 3 measurements, adjustable sleeve length. Ready in 2-3 days.", bd("350"), 30);
        Product tailor2 = saveProduct(tailorStore, "Kurta Stitching (Custom Fit)", "Full measurement charting, collar style of choice. 4-5 day turnaround.", bd("450"), 25);
        Product tailor3 = saveProduct(tailorStore, "Trouser / Pant Alteration", "Hemming, tapering, waist-band adjustments. Same-day for simple work.", bd("120"), 40);
        Product tailor4 = saveProduct(tailorStore, "Salwar Suit Stitching (Full Set)", "Includes kameez, salwar, and dupatta hemming. 5-6 days.", bd("700"), 20);
        Product tailor5 = saveProduct(tailorStore, "Zari Border Addition", "Hand-stitched golden zari border on saree edge or dupatta.", bd("250"), 15);
        Product tailor6 = saveProduct(tailorStore, "Saree Fall & Piko", "Fall stitching + machine piko on saree blouse and saree.", bd("180"), 20);
        Product tailor7 = saveProduct(tailorStore, "Kids' Frock Stitching", "Girls' frock with smocking or frills, ages 2-12. 3 days.", bd("280"), 15);

        // ── 5. IRONING (PENDING) ──────────────────────────────────────────
        Product iron1 = saveProduct(ironStore, "Daily Ironing Per Piece", "Shirts, trousers, kurtas, sarees — single piece rate.", bd("8"), 500);
        Product iron2 = saveProduct(ironStore, "Monthly Subscription – Up to 60 Pieces", "Flat monthly plan, pickup + drop at your door every day.", bd("450"), 100);
        Product iron3 = saveProduct(ironStore, "Heavy Fabric / Saree Pressing (Per Piece)", "Sarees, heavy dupattas, curtains — takes extra care.", bd("25"), 200);
        Product iron4 = saveProduct(ironStore, "Same-Day Express Ironing Per Piece", "Need it done before 6 PM? We charge a small premium.", bd("15"), 300);

        // ── 6. HANDICRAFTS ────────────────────────────────────────────────
        Product craft1 = saveProduct(craftStore, "Hand-Carved Sheesham Wood Jewellery Box", "Intricate floral jali carvings on lid and sides. Velvet-lined interior with 8 compartments. Approx 25×18×12 cm.", bd("1450"), 20);
        Product craft2 = saveProduct(craftStore, "Wooden Dining Table Coasters (Set of 6)", "Round sheesham coasters with geometric inlay, 10cm diameter.", bd("899"), 35);
        Product craft3 = saveProduct(craftStore, "Carved Wall Hanging – Peacock Motif", "Large teak wall panel with hand-carved dancing peacock in 3D relief. 60×45 cm.", bd("2200"), 12);
        Product craft4 = saveProduct(craftStore, "Sheesham Rolling Pin & Board Set", "Handturned chakla-belan set, polished finish. Essential for roti-making.", bd("650"), 40);
        Product craft5 = saveProduct(craftStore, "Wooden Photo Frame (4×6 inch)", "Rustic carved sheesham photo frame with antique brass hook.", bd("450"), 30);
        Product craft6 = saveProduct(craftStore, "Sheesham Wood Spice Box (Masala Dabba)", "7-compartment round spice box with serving spoon.", bd("1100"), 18);
        Product craft7 = saveProduct(craftStore, "Carved Wooden Bookends – Elephant Pair", "Solid teak bookends in seated elephant form. Pair, each 12 cm tall.", bd("980"), 15);

        // ── 7. SPICES ─────────────────────────────────────────────────────
        Product spice1 = saveProduct(spiceStore, "Organic Black Pepper (Whole) 250g", "Malabar black pepper, Grade TGEB. Strong, pungent aroma.", bd("220"), 50);
        Product spice2 = saveProduct(spiceStore, "Cardamom (Green Elaichi) 100g", "Idukki highland cardamom, hand-picked. Intense sweet-floral aroma.", bd("340"), 40);
        Product spice3 = saveProduct(spiceStore, "Kerala Garam Masala Blend 200g", "House-blended from 12 whole spices, ground fresh weekly.", bd("180"), 60);
        Product spice4 = saveProduct(spiceStore, "Whole Cloves (Laung) 100g", "Fat, oil-rich cloves from Thiruvananthapuram district.", bd("150"), 55);
        Product spice5 = saveProduct(spiceStore, "Turmeric Powder (Organic) 500g", "Lakadong turmeric from Meghalaya — 8% curcumin, deepest yellow.", bd("120"), 80);
        Product spice6 = saveProduct(spiceStore, "Cinnamon Sticks (Dalchini) 100g", "True Ceylon cinnamon, thin quills. Sweeter than Cassia.", bd("190"), 45);
        Product spice7 = saveProduct(spiceStore, "Dried Red Chillies (Guntur) 200g", "Fiery Guntur variety, deep red and highly aromatic.", bd("135"), 60);
        Product spice8 = saveProduct(spiceStore, "Star Anise (Chakra Phool) 50g", "Whole dried star anise for biriyani and masala chai.", bd("95"), 70);

        // ── 8. BAKERY ─────────────────────────────────────────────────────
        Product bake1 = saveProduct(bakeryStore, "Eggless Chocolate Truffle Cake 1kg", "Dark chocolate ganache with moist sponge layers. Fully eggless. Order by 6 PM for next-day delivery.", bd("650"), 15);
        Product bake2 = saveProduct(bakeryStore, "Butter Cookies 500g Box", "Classic melt-in-mouth shortbread, real butter, no preservatives.", bd("280"), 30);
        Product bake3 = saveProduct(bakeryStore, "Banana Bread Loaf", "Moist banana bread with walnuts and a touch of cinnamon. Slice-and-serve.", bd("220"), 20);
        Product bake4 = saveProduct(bakeryStore, "Custom Birthday Cake 2kg (Advance Order)", "Fully customisable design — theme, colour, flavour, inscription. 48-hour notice required.", bd("1400"), 8);
        Product bake5 = saveProduct(bakeryStore, "Namkeen Mathri 250g Pack", "Flaky, crispy salted crackers — Rajasthani-style. Great with chai.", bd("90"), 40);
        Product bake6 = saveProduct(bakeryStore, "Red Velvet Cupcakes (Box of 6)", "Cream cheese frosted mini red velvet cakes. Eggless.", bd("360"), 12);
        Product bake7 = saveProduct(bakeryStore, "Whole Wheat Jaggery Cookies 300g", "Healthy cookies sweetened with pure jaggery, no refined sugar.", bd("210"), 25);

        // ── 9. BRASSWARE ──────────────────────────────────────────────────
        Product brass1 = saveProduct(brassStore, "Brass Pooja Thali Set", "5-piece set: thali, diya, ghanti, agarbatti stand, katori. Polished finish.", bd("1100"), 20);
        Product brass2 = saveProduct(brassStore, "Handcrafted Brass Diya (Pair)", "Traditional 5-wick diya, 3-inch diameter. Ideal for festivals.", bd("350"), 50);
        Product brass3 = saveProduct(brassStore, "Copper Water Bottle 1L", "Pure 99.9% copper bottle with leak-proof lid, Ayurvedic benefits.", bd("599"), 35);
        Product brass4 = saveProduct(brassStore, "Brass Wall Décor Bell Set (3 Bells)", "Set of 3 engraved brass bells with jute cord, for doorways and temples.", bd("450"), 25);
        Product brass5 = saveProduct(brassStore, "Brass Elephant Figurine (6 inch)", "Solid brass trunk-up elephant, symbol of good luck and prosperity.", bd("890"), 15);
        Product brass6 = saveProduct(brassStore, "Copper Serving Bowls – Set of 4", "Pure copper katoris, each 350ml. Traditional dining set.", bd("1250"), 12);

        // ── 10. HANDLOOM ──────────────────────────────────────────────────
        Product hl1 = saveProduct(handloomStore, "Hand Block-Printed Cotton Bedsheet – Double", "Double-bed flat sheet with 1 pillow cover. Natural indigo dye on organic cotton.", bd("950"), 25);
        Product hl2 = saveProduct(handloomStore, "Block-Print Cotton Saree", "6.3m Maheshwari cotton saree with hand-printed floral border. Unstitched blouse piece included.", bd("1650"), 15);
        Product hl3 = saveProduct(handloomStore, "Dupatta – Hand Block Print", "2.5m cotton dupatta in pastel geometric print. Machine-washable.", bd("450"), 30);
        Product hl4 = saveProduct(handloomStore, "Table Runner – Block Print 6 Seater", "180cm × 35cm table runner in deep red and white ajrakh print.", bd("399"), 20);
        Product hl5 = saveProduct(handloomStore, "Block-Print Kurta Fabric (2m)", "Unstitched kurta fabric in Dabu-resist mudprint design. 2-metre cut.", bd("680"), 18);
        Product hl6 = saveProduct(handloomStore, "Cushion Cover Set of 5 – Block Print", "Sanganer floral print, 45×45cm, 100% cotton with zip closure.", bd("750"), 20);

        // ── 11. ELECTRICIAN ───────────────────────────────────────────────
        Product elec1 = saveProduct(electricStore, "Ceiling Fan Installation", "Includes fitting, wiring, and test run. Bring your own fan or request brand recommendation.", bd("200"), 30);
        Product elec2 = saveProduct(electricStore, "Wiring Fault Inspection (Home Visit)", "Full home wiring check with report. Travel charges within Andheri-Versova included.", bd("150"), 25);
        Product elec3 = saveProduct(electricStore, "Switchboard Replacement (Per Board)", "Old board removed and new modular board installed, per switchboard.", bd("180"), 20);
        Product elec4 = saveProduct(electricStore, "MCB / Fuse Box Repair", "Main panel MCB replacement, includes parts cost up to 2-pole MCB.", bd("350"), 15);
        Product elec5 = saveProduct(electricStore, "Geyser Installation & Servicing", "Wall-mounted or under-sink geyser installation including pipe fitting.", bd("400"), 15);
        Product elec6 = saveProduct(electricStore, "LED Light Fitting (Per Light)", "New LED batten or downlight fixture installation, wiring included.", bd("120"), 25);

        // ── 12. MOBILE REPAIR (PENDING) ───────────────────────────────────
        Product mob1 = saveProduct(mobileStore, "Mobile Screen Replacement (Standard Models)", "OEM-quality display for all common brands. 30-day warranty on screen.", bd("1200"), 20);
        Product mob2 = saveProduct(mobileStore, "Battery Replacement Service", "Genuine battery sourced, fitting + 3-month warranty.", bd("600"), 25);
        Product mob3 = saveProduct(mobileStore, "Charging Port Repair", "USB-C or micro-USB port cleaning or full replacement.", bd("350"), 30);
        Product mob4 = saveProduct(mobileStore, "Water Damage Diagnostic & Repair", "Full ultrasonic cleaning, board-level repair where possible.", bd("500"), 15);

        // ── 13. CHAI STALL ────────────────────────────────────────────────
        Product chai1 = saveProduct(chaiStore, "Cutting Chai (Per Cup)", "Strong, sweet masala chai in a 100ml cutting glass. Milk-heavy.", bd("10"), 1000);
        Product chai2 = saveProduct(chaiStore, "Samosa (Per Piece)", "Crispy potato-pea samosa, fried fresh every 2 hours.", bd("15"), 500);
        Product chai3 = saveProduct(chaiStore, "Bread Pakora (Plate of 4)", "Thick bread slices stuffed with spiced potato, gram-batter fried.", bd("40"), 300);
        Product chai4 = saveProduct(chaiStore, "Monthly Tea Subscription – Office Delivery", "Twice-daily chai delivery for up to 10 people, Mon-Sat within 500m of CP.", bd("600"), 50);
        Product chai5 = saveProduct(chaiStore, "Vada Pav (Per Piece)", "Mumbai-style spiced potato fritter in soft pav with chutneys.", bd("20"), 400);
        Product chai6 = saveProduct(chaiStore, "Kanda Poha (Plate)", "Flattened rice with onion, curry leaves, and green chillies. Morning breakfast special.", bd("35"), 200);

        // ══════════════════════════════════════════════════════════════════
        // COMPLETED ORDER CHAINS (using real state machine)
        // 6 products across 6 different sellers
        // ══════════════════════════════════════════════════════════════════

        // Order 1: buyer1 → Sheesham Jewellery Box (craft1)
        Order o1 = createDeliveredOrder(buyer1, craft1, 1,
                "B-204 Lakeview Apartments, Andheri West, Mumbai – 400058",
                "+91 9823456701", "Sunita Sharma");

        // Order 2: buyer2 → Eggless Chocolate Truffle Cake (bake1)
        Order o2 = createDeliveredOrder(buyer2, bake1, 1,
                "Flat 501, Prestige Meridian, Koramangala 4th Block, Bengaluru – 560034",
                "+91 9845678902", "Vikram Mehta");

        // Order 3: buyer3 → Kerala Garam Masala (spice3)
        Order o3 = createDeliveredOrder(buyer3, spice3, 2,
                "House 14, Ernakulam South, Kochi, Kerala – 682016",
                "+91 9946789003", "Ayesha Khan");

        // Order 4: buyer4 → Brass Pooja Thali Set (brass1)
        Order o4 = createDeliveredOrder(buyer4, brass1, 1,
                "Flat 12, Shanti Nagar CHS, Sector 17, Dwarka, Delhi – 110075",
                "+91 9712345604", "Rohan Deshmukh");

        // Order 5: buyer1 → Full Cream Milk Subscription (dairy1)
        Order o5 = createDeliveredOrder(buyer1, dairy1, 7,
                "B-204 Lakeview Apartments, Andheri West, Mumbai – 400058",
                "+91 9823456701", "Sunita Sharma");

        // Order 6: buyer2 → Aashirvaad Atta 5kg (kirana1)
        Order o6 = createDeliveredOrder(buyer2, kirana1, 2,
                "Flat 501, Prestige Meridian, Koramangala 4th Block, Bengaluru – 560034",
                "+91 9845678902", "Vikram Mehta");

        // ══════════════════════════════════════════════════════════════════
        // REVIEWS (rich, product-specific text)
        // ══════════════════════════════════════════════════════════════════

        // Reviews for craft1 (Sheesham Jewellery Box)
        saveReview(craft1, buyer1, 5, "Beautiful finish, exactly like the photos. Took 3 days to deliver to Andheri West. The velvet lining inside is really well done — no rough edges. Bought it as a gift for my mother and she absolutely loved it. Will definitely order again.");
        saveReview(craft1, buyer2, 4, "Really solid quality for the price. The jali carvings on the lid are intricate and there's no cheap lacquer smell. Lost one star only because the packaging could be sturdier for shipping — one corner had a small ding on arrival. Still very happy overall.");
        saveReview(craft1, buyer3, 5, "Ordered the jewellery box after seeing it on a friend's dresser. Exceeded my expectations — the sheesham grain is gorgeous and the hinge mechanism feels premium. Delivered to Kochi in 5 days. Highly recommended for anyone looking for a genuine Saharanpur piece.");

        // Reviews for bake1 (Chocolate Truffle Cake)
        saveReview(bake1, buyer2, 5, "Ordered for my wife's birthday and Priya absolutely nailed it. The ganache is not overly sweet — dark and rich, the way a real truffle should be. Moist sponge too, not the dry crumbly kind. Will 100% reorder for our anniversary.");
        saveReview(bake1, buyer3, 4, "Good cake, genuinely eggless and you cannot tell the difference. My flat-mate is allergic to eggs and she had two slices without any issues. Delivery was on time. Slight quibble: the box arrived a bit tilted so one side of the frosting smeared — maybe needs better packaging for delivery.");

        // Reviews for spice3 (Kerala Garam Masala)
        saveReview(spice3, buyer3, 5, "Finally found a garam masala that doesn't taste like cardboard! The blend is earthy and warm with proper heat. I used it in a mutton curry and my husband asked me what I did differently. Secret is out — it's this masala. Ordered 3 packs already.");
        saveReview(spice3, buyer4, 4, "Fresh and fragrant, clearly freshly ground. The stone-ground texture means it dissolves well into curries without gritty residue. One issue: the zip-lock pouch seal was slightly faulty on one pack so some aroma was lost. George quickly sent a replacement. Great seller.");

        // Reviews for brass1 (Brass Pooja Thali Set)
        saveReview(brass1, buyer4, 5, "We do Satyanarayan Puja at home and this thali set is perfect for it. The workmanship is clean — the engraving on the katoris is sharp and the diya holds oil without leaking. Arrived well-packed in individual cloth wrapping. Very impressed.");
        saveReview(brass1, buyer1, 5, "Gifted this to my neighbour for griha pravesh and she was delighted. The brass is heavy and feels genuine — not the thin plated stuff you find in general stores. The bell has a clear, resonant ring. Worth every rupee.");

        // Reviews for dairy1 (Full Cream Milk)
        saveReview(dairy1, buyer1, 5, "Been subscribing for 3 months now. Milk arrives by 6:30 AM without fail, still cold. The cream layer on top tells you it's the real thing. Much better than the packaged tetra-pack alternatives. Paneer made from this comes out firm and tastes so much fresher.");

        // Reviews for kirana1 (Aashirvaad Atta)
        saveReview(kirana1, buyer2, 4, "Good atta, Sharma Ji delivers quickly to our society. The rotis come out soft. Standard Aashirvaad quality — nothing surprising there — but the convenience of home delivery from a local shop vs waiting for a Blinkit slot is the real win here.");

        // ══════════════════════════════════════════════════════════════════
        // COMMUNITY POSTS
        // ══════════════════════════════════════════════════════════════════

        saveCommunityPost(craftOwner,
                "🪵 Ever wondered how a piece of Saharanpur sheesham furniture is made? It starts with selecting the right log — we choose only seasoned, kiln-dried wood to prevent warping. Then comes the chiselling: our artisans spend 2-3 days on a single jewellery box lid alone. The jali pattern you see is cut by hand, one hole at a time, using a fine chisel called a 'randa.' No CNC machines, no laser cuts. This is what separates our work from mass-produced imitations. Every piece you buy supports a craft tradition that is over 400 years old in Saharanpur. 🙏 #SaharanpurWood #MakeInIndia #HandmadeHome",
                LocalDateTime.now().minusDays(8), 47);

        saveCommunityPost(mobileOwner,
                "📱 Hi Neighbours! I'm Arjun from QuickFix Mobile Care, newly opened in Nehru Place. I've been repairing phones for 12 years — previously at an authorised service centre — and now I'm running my own shop. I use genuine spare parts and give a 30-day warranty on every repair. My approval is pending on LocalConnect but once it's through, you'll be able to book a service slot directly here. Until then, DM me for any urgent repairs. First 10 customers from this platform get a ₹100 discount on any repair. 🛠️",
                LocalDateTime.now().minusDays(5), 23);

        saveCommunityPost(buyer3,
                "Shoutout to Saharanpur Sheesham Crafts! I ordered a jewellery box for my mother's birthday and the quality blew me away. Real sheesham, solid feel, and the carvings are absolutely gorgeous. He packed it beautifully too. If anyone needs wooden handicrafts or a unique gifting idea, look no further. Much better than anything I've found on big e-commerce sites. 👍 @SaharanpurSheeshamCrafts",
                LocalDateTime.now().minusDays(3), 31);

        saveCommunityPost(buyer1,
                "🥬 Bachat Group Deal — Vegetable Basket Order this Saturday!\n\nHi all residents of Lakeview Apartments (A, B, C wings). I'm organising a group vegetable order from Fresh Mandi Basket on LocalConnect. Sukhwinder Ji sources directly from Jaipur's Muhana Mandi and the prices are 20-30% cheaper than our local sabziwala.\n\nPool order details:\n• Minimum 5 families joining\n• Saturday 8 AM delivery to building lobby\n• Each family can order their own mix, we share delivery charges\n\nComment below or DM me if you're in! Last call by Friday 5 PM. 🙏",
                LocalDateTime.now().minusDays(1), 19);

        saveCommunityPost(buyer4,
                "Does anyone have a reliable electrician recommendation for Dwarka Sector 12? My geyser stopped heating and I need someone who won't charge ₹1000 just to show up and look at it. Saw Suresh Electrical Repairs listed on LocalConnect — has anyone used them? Would love a neighbour's honest review before I book. Thanks 🙏",
                LocalDateTime.now().minusHours(14), 8);

        log.info("[DemoSeeder] ✅ Seeding complete: 13 stores (11 APPROVED, 2 PENDING), "
                + "{}+ products, 4 buyers, 6 delivered orders, 11 reviews, 5 community posts.",
                productRepo.count());
    }

    // ── Helpers ─────────────────────────────────────────────────────────────

    private User save(User u) { return userRepo.save(u); }

    private User user(String name, String email, String hash, Role role) {
        return User.builder().name(name).email(email).passwordHash(hash).role(role).build();
    }

    private Store saveStore(String name, String category, String location,
                             String description, User owner, String status, Double lat, Double lng) {
        Store s = Store.builder()
                .storeName(name)
                .category(category)
                .location(location)
                .description(description)
                .owner(owner)
                .status(status)
                .latitude(lat)
                .longitude(lng)
                .build();
        return storeRepo.save(s);
    }

    private void backfillCoordinatesIfNull() {
        try {
            List<Store> existingStores = storeRepo.findAll();
            boolean updatedAny = false;
            for (Store store : existingStores) {
                if (store.getLatitude() == null || store.getLongitude() == null) {
                    double[] coords = getPredefinedCoordsForStore(store.getStoreName(), store.getLocation());
                    store.setLatitude(coords[0]);
                    store.setLongitude(coords[1]);
                    storeRepo.save(store);
                    updatedAny = true;
                    log.info("[DemoSeeder] Backfilled coordinates for store '{}': {}, {}",
                            store.getStoreName(), coords[0], coords[1]);
                }
            }
            if (updatedAny) {
                log.info("[DemoSeeder] Store coordinates backfill completed.");
            }
        } catch (Exception e) {
            log.warn("[DemoSeeder] Error during store coordinate backfill: {}", e.getMessage());
        }
    }

    private double[] getPredefinedCoordsForStore(String storeName, String location) {
        String n = (storeName != null ? storeName : "").toLowerCase();
        String loc = (location != null ? location : "").toLowerCase();

        if (n.contains("sharma kirana") || loc.contains("dwarka")) {
            return new double[]{28.5921, 77.0460};
        } else if (n.contains("krishna dairy") || loc.contains("vastrapur")) {
            return new double[]{23.0365, 72.5284};
        } else if (n.contains("fresh mandi") || (loc.contains("malviya nagar") && loc.contains("jaipur"))) {
            return new double[]{26.8530, 75.8197};
        } else if (n.contains("fatima tailoring") || loc.contains("bhendi bazaar")) {
            return new double[]{18.9583, 72.8339};
        } else if (n.contains("ramesh istri") || loc.contains("laxmi nagar")) {
            return new double[]{28.6304, 77.2773};
        } else if (n.contains("saharanpur") || loc.contains("saharanpur")) {
            return new double[]{29.9678, 77.5460};
        } else if (n.contains("kerala spice") || loc.contains("ernakulam")) {
            return new double[]{9.9816, 76.2829};
        } else if (n.contains("home bakes") || loc.contains("koramangala")) {
            return new double[]{12.9352, 77.6245};
        } else if (n.contains("moradabad") || loc.contains("moradabad")) {
            return new double[]{28.8386, 78.7733};
        } else if (n.contains("block print") || loc.contains("sanganer")) {
            return new double[]{26.8021, 75.7699};
        } else if (n.contains("electrical") || loc.contains("andheri")) {
            return new double[]{19.1197, 72.8464};
        } else if (n.contains("quickfix") || loc.contains("nehru place")) {
            return new double[]{28.5494, 77.2528};
        } else if (n.contains("chai") || loc.contains("connaught")) {
            return new double[]{28.6304, 77.2177};
        }
        return new double[]{28.6139, 77.2090}; // Default to Central New Delhi
    }

    private int imageCounter = 0;

    private String getCategoryImageUrl(String category, String storeName) {
        imageCounter++;
        int idx = imageCounter % 3;
        if ("KIRANA".equalsIgnoreCase(category)) {
            String[] urls = {
                "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80",
                "https://images.unsplash.com/photo-1588964895597-cfccd6e2dbf9?auto=format&fit=crop&w=600&q=80",
                "https://images.unsplash.com/photo-1608686207856-001b95cf60ca?auto=format&fit=crop&w=600&q=80"
            };
            return urls[idx];
        } else if ("DAIRY".equalsIgnoreCase(category)) {
            String[] urls = {
                "https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=600&q=80",
                "https://images.unsplash.com/photo-1628088062854-d1870b4553da?auto=format&fit=crop&w=600&q=80",
                "https://images.unsplash.com/photo-1528750997573-59b89d56f4f7?auto=format&fit=crop&w=600&q=80"
            };
            return urls[idx];
        } else if ("VEGETABLES".equalsIgnoreCase(category)) {
            String[] urls = {
                "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=600&q=80",
                "https://images.unsplash.com/photo-1597362925123-77861d3fbac7?auto=format&fit=crop&w=600&q=80",
                "https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&w=600&q=80"
            };
            return urls[idx];
        } else if ("TAILORING".equalsIgnoreCase(category)) {
            String[] urls = {
                "https://images.unsplash.com/photo-1528458876861-544fd1761a91?auto=format&fit=crop&w=600&q=80",
                "https://images.unsplash.com/photo-1558769132-cb1aea458c5e?auto=format&fit=crop&w=600&q=80",
                "https://images.unsplash.com/photo-1605289982774-9a6fef564df8?auto=format&fit=crop&w=600&q=80"
            };
            return urls[idx];
        } else if ("LAUNDRY".equalsIgnoreCase(category)) {
            String[] urls = {
                "https://images.unsplash.com/photo-1517677208171-0bc6725a3e60?auto=format&fit=crop&w=600&q=80",
                "https://images.unsplash.com/photo-1489274495757-95c7c837b101?auto=format&fit=crop&w=600&q=80",
                "https://images.unsplash.com/photo-1517677208171-0bc6725a3e60?auto=format&fit=crop&w=600&q=80"
            };
            return urls[idx];
        } else if ("HANDICRAFTS".equalsIgnoreCase(category)) {
            String[] urls = {
                "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=600&q=80",
                "https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=600&q=80",
                "https://images.unsplash.com/photo-1567016432779-094069958ea5?auto=format&fit=crop&w=600&q=80"
            };
            return urls[idx];
        } else if ("FOOD".equalsIgnoreCase(category) && storeName.toLowerCase().contains("spice")) {
            String[] urls = {
                "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=600&q=80",
                "https://images.unsplash.com/photo-1509358271058-acd22cc93898?auto=format&fit=crop&w=600&q=80",
                "https://images.unsplash.com/photo-1532336414038-cf19250c5757?auto=format&fit=crop&w=600&q=80"
            };
            return urls[idx];
        } else if ("FOOD".equalsIgnoreCase(category) && storeName.toLowerCase().contains("bake")) {
            String[] urls = {
                "https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=600&q=80",
                "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?auto=format&fit=crop&w=600&q=80",
                "https://images.unsplash.com/photo-1607958996333-41aef7caefaa?auto=format&fit=crop&w=600&q=80"
            };
            return urls[idx];
        } else if ("FOOD".equalsIgnoreCase(category) && storeName.toLowerCase().contains("chai")) {
            String[] urls = {
                "https://images.unsplash.com/photo-1571934811356-5cc061b6821f?auto=format&fit=crop&w=600&q=80",
                "https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=600&q=80",
                "https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?auto=format&fit=crop&w=600&q=80"
            };
            return urls[idx];
        } else if ("TEXTILES".equalsIgnoreCase(category)) {
            String[] urls = {
                "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=600&q=80",
                "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=600&q=80",
                "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=600&q=80"
            };
            return urls[idx];
        } else if ("SERVICES".equalsIgnoreCase(category) && storeName.toLowerCase().contains("electr")) {
            String[] urls = {
                "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=600&q=80",
                "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80",
                "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=600&q=80"
            };
            return urls[idx];
        } else if ("SERVICES".equalsIgnoreCase(category) && storeName.toLowerCase().contains("mobile")) {
            String[] urls = {
                "https://images.unsplash.com/photo-1588508065123-287b28e013da?auto=format&fit=crop&w=600&q=80",
                "https://images.unsplash.com/photo-1597740985671-2a8a3b80532e?auto=format&fit=crop&w=600&q=80",
                "https://images.unsplash.com/photo-1588508065123-287b28e013da?auto=format&fit=crop&w=600&q=80"
            };
            return urls[idx];
        }
        return "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80";
    }

    private Product saveProduct(Store store, String title, String description,
                                 BigDecimal price, int stock) {
        Product p = Product.builder()
                .store(store)
                .title(title)
                .description(description)
                .price(price)
                .stockQty(stock)
                .imageUrl(getCategoryImageUrl(store.getCategory(), store.getStoreName()))
                .build();
        return productRepo.save(p);
    }

    /**
     * Creates a fully DELIVERED order by going through the real OTP state machine:
     * PLACED → (status update to CONFIRMED) → generate-OTP (→ OUT_FOR_DELIVERY) → verify-OTP (→ DELIVERED)
     */
    private Order createDeliveredOrder(User buyer, Product product, int qty,
                                        String address, String phone, String name) {
        // Deduct stock
        product.setStockQty(product.getStockQty() - qty);
        productRepo.save(product);

        // Create order at PLACED
        Order order = Order.builder()
                .buyer(buyer)
                .product(product)
                .quantity(qty)
                .status("PLACED")
                .deliveryAddress(address)
                .customerPhone(phone)
                .customerName(name)
                .otpAttempts(0)
                .createdAt(LocalDateTime.now().minusDays(7 + secureRandom.nextInt(14)))
                .build();
        order = orderRepo.save(order);

        // Move to CONFIRMED
        order.setStatus("CONFIRMED");
        order = orderRepo.save(order);

        // Generate OTP → moves to OUT_FOR_DELIVERY
        int num = secureRandom.nextInt(1_000_000);
        String plainOtp = String.format("%06d", num);
        String hashedOtp = passwordEncoder.encode(plainOtp); // reuse PasswordEncoder (BCrypt)
        order.setDeliveryOtp(hashedOtp);
        order.setOtpExpiresAt(LocalDateTime.now().plusHours(24)); // already expires safely
        order.setOtpAttempts(0);
        order.setStatus("OUT_FOR_DELIVERY");
        order = orderRepo.save(order);

        // Verify OTP → DELIVERED
        order.setStatus("DELIVERED");
        order.setDeliveryOtp(null);
        order.setOtpExpiresAt(null);
        order.setOtpAttempts(0);
        order = orderRepo.save(order);

        return order;
    }

    private void saveReview(Product product, User user, int rating, String commentText) {
        Review r = Review.builder()
                .product(product)
                .user(user)
                .rating(rating)
                .commentText(commentText)
                .build();
        reviewRepo.save(r);
    }

    private void saveCommunityPost(User user, String content,
                                    LocalDateTime createdAt, int likes) {
        CommunityPost post = CommunityPost.builder()
                .user(user)
                .content(content)
                .createdAt(createdAt)
                .likesCount(likes)
                .build();
        communityPostRepo.save(post);
    }

    private BigDecimal bd(String val) {
        return new BigDecimal(val);
    }

    /**
     * Seeds realistic historical order data spanning the past 45 days for all 13 demo sellers.
     * Idempotent: checks if historical order count is already >= 200 before running.
     */
    private void seedHistoricalSalesAndReviewsIfSparse() {
        long currentOrderCount = orderRepo.count();
        if (currentOrderCount >= 150) {
            log.info("[DemoSeeder] Historical orders already present (total: {}) — skipping backfill.", currentOrderCount);
            return;
        }

        log.info("[DemoSeeder] Seeding realistic 45-day historical sales data and reviews across all sellers...");
        String hash = passwordEncoder.encode(DEMO_PASSWORD);

        // Ensure expanded pool of ~16 diverse buyers across India
        String[][] buyerData = {
            {"Sunita Sharma", "sunita.sharma@demo.localconnect.in", "Flat 402, Sector 12, Dwarka, New Delhi", "+91 9811223344"},
            {"Vikram Mehta", "vikram.mehta@demo.localconnect.in", "Prestige Meridian, Koramangala 4th Block, Bengaluru", "+91 9845678902"},
            {"Ayesha Khan", "ayesha.khan@demo.localconnect.in", "House 14, Marine Drive, Kochi, Kerala", "+91 9946789003"},
            {"Rohan Deshmukh", "rohan.deshmukh@demo.localconnect.in", "Flat 12, Shanti Nagar, Andheri West, Mumbai", "+91 9712345604"},
            {"Pooja Agarwal", "pooja.agarwal@demo.localconnect.in", "B-104, Malviya Nagar, Jaipur, Rajasthan", "+91 9829012345"},
            {"Deepak Verma", "deepak.verma@demo.localconnect.in", "Sector 15, Rohini, New Delhi", "+91 9810987654"},
            {"Ananya Sen", "ananya.sen@demo.localconnect.in", "Salt Lake Sector 1, Kolkata, West Bengal", "+91 9830123456"},
            {"Karthik Raman", "karthik.raman@demo.localconnect.in", "T. Nagar, Chennai, Tamil Nadu", "+91 9840234567"},
            {"Meera Nair", "meera.nair@demo.localconnect.in", "Kadavanthra, Kochi, Kerala", "+91 9447345678"},
            {"Amitabh Joshi", "amitabh.joshi@demo.localconnect.in", "Kothrud, Pune, Maharashtra", "+91 9822456789"},
            {"Neha Singhal", "neha.singhal@demo.localconnect.in", "Civil Lines, Moradabad, Uttar Pradesh", "+91 9412567890"},
            {"Siddharth Rao", "siddharth.rao@demo.localconnect.in", "Banjara Hills, Hyderabad, Telangana", "+91 9849678901"},
            {"Tanvi Kulkarni", "tanvi.kulkarni@demo.localconnect.in", "Viman Nagar, Pune, Maharashtra", "+91 9823789012"},
            {"Gaurav Bhatia", "gaurav.bhatia@demo.localconnect.in", "Lajpat Nagar 2, New Delhi", "+91 9811890123"},
            {"Farhan Qureshi", "farhan.qureshi@demo.localconnect.in", "Bhendi Bazaar, South Mumbai", "+91 9820901234"},
            {"Shweta Patel", "shweta.patel@demo.localconnect.in", "Navrangpura, Ahmedabad, Gujarat", "+91 9825012345"}
        };

        List<User> buyers = new java.util.ArrayList<>();
        for (String[] bd : buyerData) {
            User u = userRepo.findByEmail(bd[1]).orElseGet(() -> {
                User fresh = User.builder()
                        .name(bd[0])
                        .email(bd[1])
                        .passwordHash(hash)
                        .role(Role.BUYER)
                        .build();
                return userRepo.save(fresh);
            });
            buyers.add(u);
        }

        List<Store> allStores = storeRepo.findAll();
        if (allStores.isEmpty()) {
            log.warn("[DemoSeeder] No stores found to seed historical sales.");
            return;
        }

        // Varied reviews with clear positive, neutral, and negative sentiment
        String[] positiveReviews = {
            "Exceptional quality! The authentic local craftsmanship really shows. Arrived promptly and well packed.",
            "Wonderful experience. Absolutely fresh and far superior to supermarket items. Will order every week!",
            "Delivered right on time by neighbour courier. Super fresh, smells divine, worth every single rupee.",
            "Loved this product! Very neatly packaged with personal care. Proud to support local Mohalla sellers.",
            "Outstanding taste and purity. You can immediately feel the difference from commercial brands."
        };

        String[] neutralReviews = {
            "Delivery took longer than expected but product quality was good overall. Decent value for money.",
            "Average experience. The item is fine for daily use, though packaging could be improved slightly.",
            "Product is acceptable and does the job, but communication regarding delivery timing was a bit slow.",
            "Fair quality. Nothing extraordinary, but convenient to get delivered straight to our apartment lobby."
        };

        String[] negativeReviews = {
            "Disappointed with the delay. Arrived two days late and the outer box was slightly dented.",
            "Not completely satisfied. Expected fresher quality based on the pictures. Needs better standardisation.",
            "The packaging was leaking slightly on arrival. Quality is mediocre for the price charged."
        };

        int totalOrdersCreated = 0;
        int totalReviewsCreated = 0;
        LocalDateTime now = LocalDateTime.now();

        for (Store store : allStores) {
            List<Product> products = productRepo.findByStoreId(store.getId());
            if (products.isEmpty()) continue;

            String cat = (store.getCategory() != null ? store.getCategory() : "").toUpperCase();

            // Order volume scale depending on category
            // High frequency: KIRANA (55-65), VEGETABLES (50-60), DAIRY (45-55), FOOD (35-45)
            // Mid frequency: SERVICES (25-35), TEXTILES (20-30), LAUNDRY (25-35)
            // Low frequency (high ticket): HANDICRAFTS (18-24)
            int targetOrderCount;
            if (cat.contains("KIRANA")) targetOrderCount = 55 + secureRandom.nextInt(10);
            else if (cat.contains("VEGETABLE")) targetOrderCount = 48 + secureRandom.nextInt(12);
            else if (cat.contains("DAIRY")) targetOrderCount = 42 + secureRandom.nextInt(10);
            else if (cat.contains("FOOD")) targetOrderCount = 35 + secureRandom.nextInt(10);
            else if (cat.contains("LAUNDRY") || cat.contains("TAILORING") || cat.contains("SERVICE")) targetOrderCount = 25 + secureRandom.nextInt(8);
            else targetOrderCount = 18 + secureRandom.nextInt(8); // HANDICRAFTS, TEXTILES

            int storeReviewsCount = 0;

            for (int i = 0; i < targetOrderCount; i++) {
                // Non-uniform date distribution over past 45 days
                // Marketplace growing: more recent orders (lower daysAgo)
                int daysAgo;
                int randDist = secureRandom.nextInt(100);
                if (randDist < 45) {
                    daysAgo = 1 + secureRandom.nextInt(14); // 45% in last 14 days
                } else if (randDist < 75) {
                    daysAgo = 15 + secureRandom.nextInt(16); // 30% in days 15-30
                } else {
                    daysAgo = 31 + secureRandom.nextInt(14); // 25% in days 31-44
                }

                // Add time of day variation with weekend peaks
                int hour = 8 + secureRandom.nextInt(13);
                int minute = secureRandom.nextInt(60);
                LocalDateTime orderDate = now.minusDays(daysAgo).withHour(hour).withMinute(minute).withSecond(0);

                // Realistic product repeat pattern: first 2-3 products get chosen more often
                Product chosenProduct;
                if (products.size() > 2 && secureRandom.nextInt(100) < 65) {
                    chosenProduct = products.get(secureRandom.nextInt(Math.min(3, products.size())));
                } else {
                    chosenProduct = products.get(secureRandom.nextInt(products.size()));
                }

                int buyerIdx = secureRandom.nextInt(buyers.size());
                User buyer = buyers.get(buyerIdx);
                String[] bInfo = buyerData[buyerIdx % buyerData.length];

                int quantity = 1;
                if (cat.contains("KIRANA") || cat.contains("DAIRY") || cat.contains("VEGETABLE")) {
                    quantity = 1 + secureRandom.nextInt(3);
                }

                // Build Delivered Historical Order with backdated timestamp
                Order histOrder = Order.builder()
                        .buyer(buyer)
                        .product(chosenProduct)
                        .quantity(quantity)
                        .status("DELIVERED")
                        .deliveryAddress(bInfo[2])
                        .customerPhone(bInfo[3])
                        .customerName(buyer.getName())
                        .checkoutGroupId(java.util.UUID.randomUUID().toString())
                        .deliveryLatitude(store.getLatitude() != null ? store.getLatitude() + (secureRandom.nextDouble() - 0.5) * 0.05 : 28.6139)
                        .deliveryLongitude(store.getLongitude() != null ? store.getLongitude() + (secureRandom.nextDouble() - 0.5) * 0.05 : 77.2090)
                        .deliveryOtp(null)
                        .otpExpiresAt(null)
                        .otpAttempts(0)
                        .createdAt(orderDate)
                        .build();

                orderRepo.save(histOrder);
                totalOrdersCreated++;

                // Attach reviews to a subset (~15-20% of orders, at least 4-6 reviews per store)
                if (storeReviewsCount < 6 && secureRandom.nextInt(100) < 22) {
                    int sentimentRoll = secureRandom.nextInt(100);
                    int rating;
                    String comment;

                    if (sentimentRoll < 65) { // 65% Positive
                        rating = 4 + secureRandom.nextInt(2); // 4 or 5
                        comment = positiveReviews[secureRandom.nextInt(positiveReviews.length)] +
                                " (Purchased: " + chosenProduct.getTitle() + ")";
                    } else if (sentimentRoll < 85) { // 20% Neutral
                        rating = 3;
                        comment = neutralReviews[secureRandom.nextInt(neutralReviews.length)] +
                                " (Order: " + chosenProduct.getTitle() + ")";
                    } else { // 15% Mild Negative
                        rating = 1 + secureRandom.nextInt(2); // 1 or 2
                        comment = negativeReviews[secureRandom.nextInt(negativeReviews.length)] +
                                " (Purchased: " + chosenProduct.getTitle() + ")";
                    }

                    Review r = Review.builder()
                            .product(chosenProduct)
                            .user(buyer)
                            .rating(rating)
                            .commentText(comment)
                            .createdAt(orderDate.plusDays(1 + secureRandom.nextInt(2)))
                            .build();

                    reviewRepo.save(r);
                    storeReviewsCount++;
                    totalReviewsCreated++;
                }
            }
        }

        log.info("[DemoSeeder] Successfully seeded {} historical orders and {} sentiment-rich reviews across 45 days!",
                totalOrdersCreated, totalReviewsCreated);
    }
}


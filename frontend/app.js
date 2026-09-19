// Selling Blind - Mandi Saathi Frontend Client Logic with Multi-Language Support (EN, TE, HI)

const API_BASE = 'http://localhost:8000/api/v1';

let currentCoordinates = {
  latitude: 17.3850,
  longitude: 78.4867
};

let latestAnalysisData = null;
let isBrowserGeolocation = false;

// Global Language State with localStorage persistence
let currentLanguage = localStorage.getItem('mandi_saathi_lang') || 'en';

// Centralized Translation Dictionary (English, Telugu, Hindi)
const TRANSLATIONS = {
  en: {
    brandName: "MANDI SAATHI",
    navCheckPrice: "Check Price",
    navHowItWorks: "How It Works",
    
    // Home View
    welcomeTag: "Welcome to",
    heroTitle: "Your Mandi Price Guide",
    heroDesc: "Choose how you'd like to explore mandi prices today. Get the best insights, your way.",
    option1Badge: "Option 1",
    option1Title: "Manual Usage",
    option1Desc: "Explore mandi prices manually by entering crop details, selecting mandis, and checking historical seasonal data.",
    btnManualCheck: "Go to Check Offer →",
    option2Badge: "Option 2",
    option2Title: "AI Assistant",
    option2Desc: "Ask your AI assistant anything about mandi prices, get instant plain-language answers, insights and recommendations.",
    btnAiChat: "Chat with AI →",

    // Check Offer Form
    formTitle: "Check Mandi Offer",
    labelCrop: "Crop",
    labelQuantity: "Quantity",
    labelLocation: "Location",
    labelPrice: "Offered Price",
    btnAutoLocation: "📍 Auto",
    btnCheckPrice: "Check Price",
    resolvingLocation: "Resolving Location...",
    analyzingPrices: "Analyzing Prices...",
    detectingCoordinates: "Detecting coordinates...",

    // Analysis Results Page
    resultsTitle: "Price Analysis",
    resultsSubtitle: "Review price signal and explore options",
    signalUnusuallyLow: "PRICE LOOKS UNUSUALLY LOW",
    signalLowerThanUsual: "PRICE LOOKS LOWER THAN USUAL",
    signalNormal: "PRICE IS WITHIN NORMAL RANGE",
    diffBelow: "below the historical seasonal median",
    diffAbove: "above the historical seasonal median",
    histMedianLabel: "Historical median:",
    
    // Action Cards
    action1Title: "View Historical Price",
    action1Desc: "See how today's price compares with past seasonal prices.",
    btnViewChart: "View Chart →",
    action2Title: "Explore Nearby Markets",
    action2Desc: "Find nearby mandis and their historical price patterns.",
    btnViewMarkets: "View Markets →",
    action3Title: "Why This Signal?",
    action3Desc: "Understand the data and statistical analysis behind this result.",
    btnLearnMore: "Learn More →",

    // Historical Price Page
    hpTitle: "Price History",
    hpSubtitle: "Track how the price has changed over time",
    hpTrendTitle: "Price Trend",
    hpTrendTag: "Last 6 Months",
    hpDistTitle: "Price Distribution",
    hpDistSubtitle: "How the current price compares to historical data",
    pillTodayOffer: "Today's offer",
    pillHistMedian: "Historical median",
    pillTypicalRange: "Historical typical range",
    pillDifference: "Difference",
    backToAnalysis: "← Back to Price Analysis",

    // Nearby Markets Page
    nmTitle: "Nearby Mandi Opportunities",
    nmSubtitle: "Compare reachable mandis and their historical price performance.",
    nmMapTitle: "Interactive Market Map",
    nmMapTag: "Live Distances",
    nmHistOptions: "Historical Options",
    nmHistOptionsSub: "Compare past trends and find the best deal",
    tagHistHigher: "Historically higher",
    tagSimilarRange: "Similar historical range",
    tagLimitedData: "Limited historical data",
    labelHistPrice: "Historical Price",
    vsOffer: "vs offer",
    btnViewPriceHistory: "View Price History →",

    // Why Market Shown Page
    whyTitle: "Why is this market shown?",
    whySubtitle: "We show you this market because it matches your location, price trends and has reliable historical data.",
    exp1TitleSuffix: "km from your location",
    exp1Desc: "This market is closer to you, which can help reduce transport time and cost.",
    badgeConvenientDist: "Convenient distance",
    exp2Title: "Historical crop prices are higher than your current offer during this period.",
    exp2Desc: "Past data shows this market has usually offered better prices compared to your current offer.",
    badgeBetterTrend: "Better price trend",
    exp3Title: "Sufficient historical observations",
    exp3Desc: "We have enough past data to make a reliable comparison and recommendation.",
    badgeReliableData: "Reliable data",
    warn1Title: "Today's price may differ",
    warn1Desc: "Prices can change based on market demand, weather, and other factors.",
    warn2Title: "Transport and market charges are not included",
    warn2Desc: "The price shown does not include any transportation or market fees.",
    summaryMarketPrice: "Market Price",
    summarySignalText: "Historically higher than your current offer",
    aiTitle: "AI Explanation (Qwen3:8B)",
    dataQualityLabel: "Data Quality Rating:",
    aiProviderLabel: "AI Provider:",

    // Crops
    cropOnion: "Onion",
    cropPotato: "Potato",
    cropTomato: "Tomato",
    cropWheat: "Wheat",
    cropPaddy: "Paddy",
    cropCotton: "Cotton",
    cropRedChilli: "Red Chilli",
    cropMaize: "Maize",

    // General & Disclaimers
    disclaimerPrefix: "Based on historical public",
    disclaimerSuffix: ". Historical performance does not guarantee future prices or outcomes.",
    demoDataTag: "AgMarkNet (Demo Data)",
    aiModalTitle: "AI Assistant",
    aiModalText: "Hello farmer! I can help analyze your offered mandi prices, crop seasons, and nearby market alternatives based on historical AgMarkNet records.",

    // Errors & Exceptions
    errLocationRequired: "⚠️ HARD RULE: Location is required. You cannot proceed without providing a location (e.g. Village, Mandi, or City).",
    errQuantityInvalid: "⚠️ HARD RULE: Quantity must be greater than 0 kg. Entering 0 kg or invalid quantity is not allowed.",
    errPriceInvalid: "⚠️ HARD RULE: Offered price must be greater than 0. Entering 0 price or invalid price is not allowed.",
    nmNoMandisTitle: "Exception Error: No Mandi Available",
    nmNoMandisAvailable: "No nearby mandi location information available for the selected crop and location."
  },
  te: {
    brandName: "మండి సాథి",
    navCheckPrice: "ధర తనిఖీ",
    navHowItWorks: "ఇది ఎలా పనిచేస్తుంది",
    
    // Home View
    welcomeTag: "స్వాగతం",
    heroTitle: "మీ మండి ధరల మార్గదర్శి",
    heroDesc: "ఈరోజు మండి ధరలను ఎలా అన్వేషించాలో ఎంచుకోండి. అత్యుత్తమ సమాచారాన్ని పొందండి.",
    option1Badge: "ఎంపిక 1",
    option1Title: "మాన్యువల్ విధానం",
    option1Desc: "పంట వివరాలు నమోదు చేసి, మండిలను ఎంచుకుని, చారిత్రక ధోరణులను మాన్యువల్‌గా తనిఖీ చేయండి.",
    btnManualCheck: "ధర ఆఫర్ తనిఖీకి వెళ్లండి →",
    option2Badge: "ఎంపిక 2",
    option2Title: "AI అసిస్టెంట్",
    option2Desc: "మండి ధరల గురించి మీ AI సహాయకుడిని అడగండి, సులభమైన తెలుగులో సలహాలు పొందండి.",
    btnAiChat: "AI తో చాట్ చేయండి →",

    // Check Offer Form
    formTitle: "మండి ధర ఆఫర్ తనిఖీ చేయండి",
    labelCrop: "పంట",
    labelQuantity: "పరిమాణం",
    labelLocation: "ప్రాంతం / ప్రదేశం",
    labelPrice: "ఆఫర్ చేసిన ధర",
    btnAutoLocation: "📍 ఆటో",
    btnCheckPrice: "ధర సరిచూడండి",
    resolvingLocation: "ప్రాంతాన్ని గుర్తిస్తోంది...",
    analyzingPrices: "ధరలను విశ్లేషిస్తోంది...",
    detectingCoordinates: "స్థాన వివరాలు సేకరిస్తోంది...",

    // Analysis Results Page
    resultsTitle: "ధర విశ్లేషణ",
    resultsSubtitle: "ధర సంకేతాన్ని సమీక్షించి ప్రత్యామ్నాయాలను అన్వేషించండి",
    signalUnusuallyLow: "ధర చాలా తక్కువగా ఉంది",
    signalLowerThanUsual: "ధర సాధారణం కంటే తక్కువగా ఉంది",
    signalNormal: "ధర సాధారణ పరిధిలోనే ఉంది",
    diffBelow: "చారిత్రక సీజనల్ సగటు కంటే తక్కువ",
    diffAbove: "చారిత్రక సీజనల్ సగటు కంటే ఎక్కువ",
    histMedianLabel: "చారిత్రక సగటు ధర:",
    
    // Action Cards
    action1Title: "చారిత్రక ధర చూడండి",
    action1Desc: "ఈరోజు ధర గత సీజనల్ ధరలతో ఎలా సరిపోలుతుందో చూడండి.",
    btnViewChart: "చార్ట్ చూడండి →",
    action2Title: "సమీప మార్కెట్లను అన్వేషించండి",
    action2Desc: "సమీపంలోని మండిలు మరియు వాటి ధరల విధానాలను కనుగొనండి.",
    btnViewMarkets: "మార్కెట్లను చూడండి →",
    action3Title: "ఈ సంకేతం ఎందుకు?",
    action3Desc: "ఈ ఫలితం వెనుక ఉన్న గణాంకాలు మరియు విశ్లేషణను అర్థం చేసుకోండి.",
    btnLearnMore: "మరిన్ని వివరాలు →",

    // Historical Price Page
    hpTitle: "చారిత్రక ధరల ధోరణి",
    hpSubtitle: "కాలక్రమేణా ధర ఎలా మారిందో పరిశీలించండి",
    hpTrendTitle: "ధరల ధోరణి",
    hpTrendTag: "గత 6 నెలలు",
    hpDistTitle: "ధరల పంపిణీ",
    hpDistSubtitle: "ప్రస్తుత ధర గత డేటాతో ఎలా సరిపోలుతుంది",
    pillTodayOffer: "నేటి ఆఫర్ ధర",
    pillHistMedian: "చారిత్రక సగటు",
    pillTypicalRange: "సాధారణ ధరల పరిధి",
    pillDifference: "తేడా",
    backToAnalysis: "← ధర విశ్లేషణకు తిరిగి వెళ్లండి",

    // Nearby Markets Page
    nmTitle: "సమీప మండి అవకాశాలు",
    nmSubtitle: "అందుబాటులో ఉన్న మండిలను మరియు వాటి చారిత్రక ధరలను పోల్చండి.",
    nmMapTitle: "ఇంటరాక్టివ్ మార్కెట్ మ్యాప్",
    nmMapTag: "లైవ్ దూరాలు",
    nmHistOptions: "చారిత్రక ఎంపికలు",
    nmHistOptionsSub: "గత ధోరణులను పోల్చి ఉత్తమ ధరను పొందండి",
    tagHistHigher: "చారిత్రకంగా ఎక్కువ ధర",
    tagSimilarRange: "సమానమైన ధర పరిధి",
    tagLimitedData: "పరిమిత డేటా",
    labelHistPrice: "చారిత్రక ధర",
    vsOffer: "ఆఫర్ కంటే",
    btnViewPriceHistory: "ధరల చరిత్ర చూడండి →",

    // Why Market Shown Page
    whyTitle: "ఈ మార్కెట్ ఎందుకు చూపబడుతోంది?",
    whySubtitle: "మీ స్థానం, ధరల ధోరణులు మరియు విశ్వసనీయ డేటా ఆధారంగా ఈ మండి సిఫార్సు చేయబడింది.",
    exp1TitleSuffix: "కి.మీ మీ ప్రాంతం నుండి",
    exp1Desc: "ఈ మార్కెట్ మీకు దగ్గరగా ఉంది, ఇది రవాణా సమయం మరియు ఖర్చును తగ్గిస్తుంది.",
    badgeConvenientDist: "అనుకూలమైన దూరం",
    exp2Title: "ఈ సమయంలో చారిత్రక పంట ధరలు మీ ప్రస్తుత ఆఫర్ కంటే ఎక్కువగా ఉన్నాయి.",
    exp2Desc: "గత డేటా ప్రకారం ఈ మార్కెట్ సాధారణంగా మీ ఆఫర్ కంటే మంచి ధరలను అందించింది.",
    badgeBetterTrend: "మంచి ధరల ధోరణి",
    exp3Title: "సరిపడా చారిత్రక పరిశీలనలు",
    exp3Desc: "సరైన పోలిక మరియు సిఫార్సు చేయడానికి మా వద్ద తగినంత గత డేటా ఉంది.",
    badgeReliableData: "విశ్వసనీయ డేటా",
    warn1Title: "నేటి ధర మారవచ్చు",
    warn1Desc: "మార్కెట్ డిమాండ్, వాతావరణం మరియు ఇతర అంశాల ఆధారంగా ధరలు మారవచ్చు.",
    warn2Title: "రవాణా మరియు మార్కెట్ ఛార్జీలు చేర్చబడలేదు",
    warn2Desc: "చూపబడిన ధరలో రవాణా లేదా మార్కెట్ రుసుములు చేర్చబడలేదు.",
    summaryMarketPrice: "మార్కెట్ ధర",
    summarySignalText: "మీ ప్రస్తుత ఆఫర్ కంటే చారిత్రకంగా ఎక్కువ",
    aiTitle: "AI వివరణ (Qwen3:8B)",
    dataQualityLabel: "డేటా నాణ్యత:",
    aiProviderLabel: "AI ప్రొవైడర్:",

    // Crops
    cropOnion: "ఉల్లిపాయ (Onion)",
    cropPotato: "బంగాళాదుంప (Potato)",
    cropTomato: "టమాటా (Tomato)",
    cropWheat: "గోధుమలు (Wheat)",
    cropPaddy: "వరి (Paddy)",
    cropCotton: "పత్తి (Cotton)",
    cropRedChilli: "మిర్చి (Red Chilli)",
    cropMaize: "మొక్కజొన్న (Maize)",

    // General & Disclaimers
    disclaimerPrefix: "చారిత్రక పబ్లిక్",
    disclaimerSuffix: "ఆధారంగా. గత సమాచారం భవిష్యత్తు ధరలకు గ్యారెంటీ కాదు.",
    demoDataTag: "AgMarkNet (డెమో డేటా)",
    aiModalTitle: "AI సహాయకుడు",
    aiModalText: "నమస్కారం రైతు సోదరా! AgMarkNet చారిత్రక డేటా ఆధారంగా మీ మండి ధరలు, పంట కాలాలు మరియు సమీప మార్కెట్లను విశ్లేషించడంలో నేను సహాయపడతాను.",

    // Errors & Exceptions
    errLocationRequired: "⚠️ నియమం: ప్రాంతం తప్పనిసరి. దయచేసి కొనసాగడానికి ముందు ప్రాంతం పేరు నమోదు చేయండి.",
    errQuantityInvalid: "⚠️ నియమం: పరిమాణం 0 కిలోల కంటే ఎక్కువగా ఉండాలి. 0 కిలోలు నమోదు చేయడం చెల్లదు.",
    errPriceInvalid: "⚠️ నియమం: ఆఫర్ చేసిన ధర 0 కంటే ఎక్కువగా ఉండాలి. 0 ధర నమోదు చేయడం చెల్లదు.",
    nmNoMandisTitle: "మినహాయింపు లోపం: మండి సమాచారం లభించలేదు",
    nmNoMandisAvailable: "ఎంచుకున్న పంట మరియు ప్రాంతానికి సంబంధించి సమీప మండి వివరాలు లభించలేదు."
  },
  hi: {
    brandName: "मंडी साथी",
    navCheckPrice: "मूल्य जांचें",
    navHowItWorks: "यह कैसे काम करता है",
    
    // Home View
    welcomeTag: "स्वागत है",
    heroTitle: "आपका मंडी भाव मार्गदर्शक",
    heroDesc: "आज ही मंडी भावों की सटीक जानकारी प्राप्त करें। अपनी सुविधानुसार बेहतरीन विश्लेषण पाएं।",
    option1Badge: "विकल्प 1",
    option1Title: "मैनुअल उपयोग",
    option1Desc: "फसल विवरण दर्ज करके, मंडियों का चयन करके और ऐतिहासिक मौसमी डेटा की स्वयं जांच करें।",
    btnManualCheck: "ऑफर जांचने जाएं →",
    option2Badge: "विकल्प 2",
    option2Title: "AI सहायक",
    option2Desc: "मंडी भावों के बारे में अपने AI सहायक से पूछें, और सरल भाषा में तुरंत सुझाव पाएं।",
    btnAiChat: "AI से बात करें →",

    // Check Offer Form
    formTitle: "मंडी ऑफर की जांच करें",
    labelCrop: "फसल",
    labelQuantity: "मात्रा",
    labelLocation: "स्थान / क्षेत्र",
    labelPrice: "कीमत की पेशकश",
    btnAutoLocation: "📍 ऑटो",
    btnCheckPrice: "मूल्य जांचें",
    resolvingLocation: "स्थान खोजा जा रहा है...",
    analyzingPrices: "मूल्यों का विश्लेषण हो रहा है...",
    detectingCoordinates: "लोकेशन प्राप्त की जा रही है...",

    // Analysis Results Page
    resultsTitle: "मूल्य विश्लेषण",
    resultsSubtitle: "मूल्य संकेत की समीक्षा करें और विकल्पों का पता लगाएं",
    signalUnusuallyLow: "मूल्य असामान्य रूप से कम है",
    signalLowerThanUsual: "मूल्य सामान्य से कम है",
    signalNormal: "मूल्य सामान्य सीमा में है",
    diffBelow: "ऐतिहासिक मौसमी औसत से कम",
    diffAbove: "ऐतिहासिक मौसमी औसत से अधिक",
    histMedianLabel: "ऐतिहासिक औसत मूल्य:",
    
    // Action Cards
    action1Title: "ऐतिहासिक मूल्य देखें",
    action1Desc: "देखें कि आज की कीमत पिछले मौसमी भावों की तुलना में कैसी है।",
    btnViewChart: "चार्ट देखें →",
    action2Title: "आस-पास की मंडियां देखें",
    action2Desc: "आस-पास की मंडियों और उनके ऐतिहासिक मूल्य रुझानों को जानें।",
    btnViewMarkets: "मंडियां देखें →",
    action3Title: "यह संकेत क्यों?",
    action3Desc: "इस परिणाम के पीछे के आंकड़ों और सांख्यिकीय विश्लेषण को समझें।",
    btnLearnMore: "और जानें →",

    // Historical Price Page
    hpTitle: "ऐतिहासिक मूल्य इतिहास",
    hpSubtitle: "समय के साथ कीमतों में आए बदलाव को ट्रैक करें",
    hpTrendTitle: "मूल्य रुझान",
    hpTrendTag: "पिछले 6 महीने",
    hpDistTitle: "मूल्य वितरण",
    hpDistSubtitle: "वर्तमान मूल्य ऐतिहासिक आंकड़ों से कैसे तुलना करता है",
    pillTodayOffer: "आज का ऑफर",
    pillHistMedian: "ऐतिहासिक औसत",
    pillTypicalRange: "सामान्य मूल्य सीमा",
    pillDifference: "अंतर",
    backToAnalysis: "← मूल्य विश्लेषण पर वापस जाएं",

    // Nearby Markets Page
    nmTitle: "निकटतम मंडी अवसर",
    nmSubtitle: "आस-पास की मंडियों और उनके ऐतिहासिक प्रदर्शन की तुलना करें।",
    nmMapTitle: "इंटरएक्टिव मार्केट मैप",
    nmMapTag: "लाइव दूरी",
    nmHistOptions: "ऐतिहासिक विकल्प",
    nmHistOptionsSub: "पुराने रुझानों की तुलना करें और बेहतरीन सौदा पाएं",
    tagHistHigher: "ऐतिहासिक रूप से अधिक",
    tagSimilarRange: "समान ऐतिहासिक सीमा",
    tagLimitedData: "सीमित डेटा",
    labelHistPrice: "ऐतिहासिक मूल्य",
    vsOffer: "ऑफर की तुलना में",
    btnViewPriceHistory: "मूल्य इतिहास देखें →",

    // Why Market Shown Page
    whyTitle: "यह मंडी क्यों दिखाई जा रही है?",
    whySubtitle: "हम आपको यह मंडी दिखाते हैं क्योंकि यह आपके स्थान, मूल्य रुझानों से मेल खाती है।",
    exp1TitleSuffix: "किमी आपके स्थान से",
    exp1Desc: "यह मंडी आपके करीब है, जो परिवहन समय और लागत को कम करने में मदद कर सकती है।",
    badgeConvenientDist: "सुविधाजनक दूरी",
    exp2Title: "इस अवधि के दौरान ऐतिहासिक फसल मूल्य आपके वर्तमान ऑफर से अधिक रहे हैं।",
    exp2Desc: "पुराने डेटा से पता चलता है कि इस मंडी ने आम तौर पर बेहतर कीमतें दी हैं।",
    badgeBetterTrend: "बेहतर मूल्य रुझान",
    exp3Title: "पर्याप्त ऐतिहासिक अवलोकन",
    exp3Desc: "सटीक तुलना और सिफारिश करने के लिए हमारे पास पर्याप्त ऐतिहासिक डेटा है।",
    badgeReliableData: "विश्वसनीय डेटा",
    warn1Title: "आज की कीमत भिन्न हो सकती है",
    warn1Desc: "मांग, मौसम और अन्य कारकों के आधार पर कीमतें बदल सकती हैं।",
    warn2Title: "परिवहन और मंडी शुल्क शामिल नहीं हैं",
    warn2Desc: "दिखाए गए मूल्य में कोई परिवहन या मंडी शुल्क शामिल नहीं है।",
    summaryMarketPrice: "मंडी मूल्य",
    summarySignalText: "आपके वर्तमान ऑफर से ऐतिहासिक रूप से अधिक",
    aiTitle: "AI विवरण (Qwen3:8B)",
    dataQualityLabel: "डेटा गुणवत्ता:",
    aiProviderLabel: "AI प्रदाता:",

    // Crops
    cropOnion: "प्याज (Onion)",
    cropPotato: "आलू (Potato)",
    cropTomato: "टमाटर (Tomato)",
    cropWheat: "गेहूं (Wheat)",
    cropPaddy: "धान (Paddy)",
    cropCotton: "कपास (Cotton)",
    cropRedChilli: "लाल मिर्च (Red Chilli)",
    cropMaize: "मक्का (Maize)",

    // General & Disclaimers
    disclaimerPrefix: "ऐतिहासिक सार्वजनिक",
    disclaimerSuffix: "पर आधारित। पिछला प्रदर्शन भविष्य की कीमतों की गारंटी नहीं देता है।",
    demoDataTag: "AgMarkNet (डेमो डेटा)",
    aiModalTitle: "AI सहायक",
    aiModalText: "नमस्ते किसान भाई! AgMarkNet के ऐतिहासिक डेटा के आधार पर मैं आपकी फसलों के मंडी भाव, मौसम और नजदीकी मंडियों का विश्लेषण करने में मदद कर सकता हूं।",

    // Errors & Exceptions
    errLocationRequired: "⚠️ कड़ा नियम: स्थान अनिवार्य है। कृपया आगे बढ़ने से पहले स्थान का नाम दर्ज करें।",
    errQuantityInvalid: "⚠️ कड़ा नियम: मात्रा 0 किग्रा से अधिक होनी चाहिए। 0 किग्रा दर्ज करना अमान्य है।",
    errPriceInvalid: "⚠️ कड़ा नियम: पेश की गई कीमत 0 से अधिक होनी चाहिए। 0 कीमत दर्ज करना अमान्य है।",
    nmNoMandisTitle: "अपवाद त्रुटि: मंडी उपलब्ध नहीं",
    nmNoMandisAvailable: "चुनी गई फसल और स्थान के लिए आस-पास कोई मंडी जानकारी उपलब्ध नहीं है।"
  }
};

// Router Mapping
const ROUTES = {
  '/': 'home-view',
  '/form': 'form-view',
  '/results': 'results-view',
  '/historical-price': 'historical-price-view',
  '/nearby-markets': 'nearby-markets-view',
  '/why-this-signal': 'why-this-signal-view'
};

// Client-side Navigation Router
function navigateTo(path) {
  if (location.pathname !== path) {
    history.pushState({ path }, '', path);
  }
  renderRoute(path);
}

function renderRoute(path) {
  const normalizedPath = ROUTES[path] ? path : '/';
  const viewId = ROUTES[normalizedPath];

  document.querySelectorAll('.view-section').forEach(sec => sec.classList.remove('active'));
  const target = document.getElementById(viewId);
  if (target) {
    target.classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Populate page-specific data if available
  if (latestAnalysisData) {
    if (normalizedPath === '/historical-price') {
      renderHistoricalPricePage(latestAnalysisData);
    } else if (normalizedPath === '/nearby-markets') {
      renderNearbyMarketsPage(latestAnalysisData);
    } else if (normalizedPath === '/why-this-signal') {
      renderWhyThisSignalPage(latestAnalysisData);
    }
  }
}

window.addEventListener('popstate', (e) => {
  const path = e.state?.path || location.pathname;
  renderRoute(path);
});

function switchView(viewId) {
  const route = Object.keys(ROUTES).find(r => ROUTES[r] === viewId) || '/';
  navigateTo(route);
}

function scrollToHowItWorks() {
  navigateTo('/');
  setTimeout(() => {
    const el = document.getElementById('home-view');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  }, 100);
}

function openAiChatModal() {
  if (window.mandiAssistantUI && typeof window.mandiAssistantUI.openModal === 'function') {
    window.mandiAssistantUI.openModal();
  } else {
    const modal = document.getElementById('ai-assistant-modal');
    if (modal) modal.style.display = 'flex';
  }
}

// Global Language Switcher Function
function setLanguage(lang) {
  if (!TRANSLATIONS[lang]) return;
  currentLanguage = lang;
  localStorage.setItem('mandi_saathi_lang', lang);

  // Update active pill button state
  document.querySelectorAll('.lang-btn').forEach(btn => {
    if (btn.getAttribute('data-lang') === lang) {
      btn.classList.add('active');
      btn.setAttribute('aria-current', 'true');
    } else {
      btn.classList.remove('active');
      btn.removeAttribute('aria-current');
    }
  });

  // Apply translations across DOM
  applyTranslations();

  // If results exist, re-render analysis views in selected language immediately
  if (latestAnalysisData) {
    renderDashboardResults(latestAnalysisData);
    renderHistoricalPricePage(latestAnalysisData);
    renderNearbyMarketsPage(latestAnalysisData);
    renderWhyThisSignalPage(latestAnalysisData);
  }
}

// Apply Centralized Translations to Static & Dynamic Text Nodes
function applyTranslations() {
  const t = TRANSLATIONS[currentLanguage] || TRANSLATIONS.en;

  const setTxt = (id, text) => {
    const el = document.getElementById(id);
    if (el) el.innerText = text;
  };

  setTxt('brand-name-text', t.brandName);
  setTxt('nav-check-price', t.navCheckPrice);
  setTxt('nav-how-it-works', t.navHowItWorks);

  // Home View
  setTxt('hero-welcome-tag', t.welcomeTag);
  setTxt('hero-title', t.heroTitle);
  setTxt('hero-desc', t.heroDesc);
  setTxt('option1-badge', t.option1Badge);
  setTxt('option1-title', t.option1Title);
  setTxt('option1-desc', t.option1Desc);
  setTxt('btn-manual-check', t.btnManualCheck);
  setTxt('option2-badge', t.option2Badge);
  setTxt('option2-title', t.option2Title);
  setTxt('option2-desc', t.option2Desc);
  setTxt('btn-ai-chat', t.btnAiChat);

  // Check Offer Form
  setTxt('form-title', t.formTitle);
  setTxt('label-crop', t.labelCrop);
  setTxt('label-quantity', t.labelQuantity);
  setTxt('label-location', t.labelLocation);
  setTxt('label-price', t.labelPrice);
  setTxt('btn-auto-location', t.btnAutoLocation);
  
  const btnCheck = document.getElementById('btn-check-price');
  if (btnCheck && !btnCheck.disabled) {
    btnCheck.innerText = t.btnCheckPrice;
  }

  // Crop select options
  setTxt('opt-onion', t.cropOnion);
  setTxt('opt-potato', t.cropPotato);
  setTxt('opt-tomato', t.cropTomato);
  setTxt('opt-wheat', t.cropWheat);
  setTxt('opt-paddy', t.cropPaddy);
  setTxt('opt-cotton', t.cropCotton);
  setTxt('opt-chilli', t.cropRedChilli);

  // Results & Sub-views Headings
  setTxt('results-title', t.resultsTitle);
  setTxt('results-subtitle', t.resultsSubtitle);
  setTxt('action1-title', t.action1Title);
  setTxt('action1-desc', t.action1Desc);
  setTxt('btn-view-chart', t.btnViewChart);
  setTxt('action2-title', t.action2Title);
  setTxt('action2-desc', t.action2Desc);
  setTxt('btn-view-markets', t.btnViewMarkets);
  setTxt('action3-title', t.action3Title);
  setTxt('action3-desc', t.action3Desc);
  setTxt('btn-learn-more', t.btnLearnMore);

  // Historical Price View
  setTxt('hp-title', t.hpTitle);
  setTxt('hp-subtitle', t.hpSubtitle);
  setTxt('hp-back-btn', t.backToAnalysis);
  setTxt('hp-trend-title', t.hpTrendTitle);
  setTxt('hp-trend-tag', t.hpTrendTag);
  setTxt('hp-dist-title', t.hpDistTitle);
  setTxt('hp-dist-subtitle', t.hpDistSubtitle);
  setTxt('pill-label-today', t.pillTodayOffer);
  setTxt('pill-label-median', t.pillHistMedian);
  setTxt('pill-label-range', t.pillTypicalRange);
  setTxt('pill-label-diff', t.pillDifference);

  // Nearby Markets View
  setTxt('nm-title', t.nmTitle);
  setTxt('nm-subtitle', t.nmSubtitle);
  setTxt('nm-back-btn', t.backToAnalysis);
  setTxt('nm-map-title', t.nmMapTitle);
  setTxt('nm-map-tag', t.nmMapTag);
  setTxt('nm-hist-options-title', t.nmHistOptions);
  setTxt('nm-hist-options-subtitle', t.nmHistOptionsSub);
  setTxt('btn-view-price-history', t.btnViewPriceHistory);
  document.querySelectorAll('.mandi-price-label-text').forEach(el => el.innerText = t.labelHistPrice);

  // Why Market Shown View
  setTxt('why-title', t.whyTitle);
  setTxt('why-subtitle', t.whySubtitle);
  setTxt('why-back-btn', t.backToAnalysis);
  setTxt('why-badge1', t.badgeConvenientDist);
  setTxt('why-card2-title', t.exp2Title);
  setTxt('why-card2-desc', t.exp2Desc);
  setTxt('why-badge2', t.badgeBetterTrend);
  setTxt('why-card3-title', t.exp3Title);
  setTxt('why-card3-desc', t.exp3Desc);
  setTxt('why-badge3', t.badgeReliableData);
  setTxt('why-warn1-title', t.warn1Title);
  setTxt('why-warn1-desc', t.warn1Desc);
  setTxt('why-warn2-title', t.warn2Title);
  setTxt('why-warn2-desc', t.warn2Desc);
  setTxt('summary-market-price-label', t.summaryMarketPrice);
  setTxt('why-ai-title', t.aiTitle);
  setTxt('wts-lbl-quality', t.dataQualityLabel);
  setTxt('wts-lbl-provider', t.aiProviderLabel);
}

// Browser Geolocation API
function detectBrowserLocation() {
  const locInput = document.getElementById('location-input');
  const t = TRANSLATIONS[currentLanguage] || TRANSLATIONS.en;
  if (navigator.geolocation) {
    locInput.value = t.detectingCoordinates;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        isBrowserGeolocation = true;
        currentCoordinates.latitude = pos.coords.latitude;
        currentCoordinates.longitude = pos.coords.longitude;
        locInput.value = `Lat: ${pos.coords.latitude.toFixed(4)}, Lon: ${pos.coords.longitude.toFixed(4)}`;
      },
      (err) => {
        isBrowserGeolocation = false;
        alert("Geolocation access denied or unavailable. Using manual location selection.");
        locInput.value = "Hyderabad, Telangana";
      },
      { timeout: 5000 }
    );
  } else {
    alert("Browser Geolocation is not supported by your browser.");
  }
}

// Client-side Forward Geocoding Helper
async function forwardGeocodeClient(locationName) {
  if (!locationName || typeof locationName !== 'string' || !locationName.trim()) {
    return null;
  }
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(locationName.trim())}&format=json&limit=1`, {
      headers: { 'User-Agent': 'SellingBlindMandiSaathi/1.0' }
    });
    if (res.ok) {
      const data = await res.json();
      if (data && data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lon = parseFloat(data[0].lon);
        if (!isNaN(lat) && !isNaN(lon) && lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180) {
          return { latitude: lat, longitude: lon };
        }
      }
    }
  } catch (err) {
    console.warn("Client-side forward geocoding notice:", err);
  }
  return null;
}

// Form Submission & API Integration
async function handleFormSubmit(event) {
  event.preventDefault();
  const t = TRANSLATIONS[currentLanguage] || TRANSLATIONS.en;

  const errBanner = document.getElementById('form-error-banner');
  const showFormError = (msg, inputId) => {
    if (errBanner) {
      errBanner.innerText = msg;
      errBanner.style.display = 'block';
      errBanner.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else {
      alert(msg);
    }
    if (inputId) {
      const el = document.getElementById(inputId);
      if (el) el.focus();
    }
  };

  if (errBanner) errBanner.style.display = 'none';

  const crop = document.getElementById('crop-input').value;
  const locationInput = document.getElementById('location-input');
  const locationName = locationInput ? locationInput.value.trim() : '';

  // HARD RULE 1: Location MUST be provided
  if (!locationName) {
    showFormError(t.errLocationRequired, 'location-input');
    return;
  }

  // HARD RULE 2: Quantity MUST be > 0 (0 kg is invalid)
  const quantityInput = document.getElementById('quantity-input');
  const quantityRaw = quantityInput ? quantityInput.value.replace(/[^0-9.]/g, '') : '';
  const quantityVal = parseFloat(quantityRaw);
  if (isNaN(quantityVal) || quantityVal <= 0) {
    showFormError(t.errQuantityInvalid, 'quantity-input');
    return;
  }

  // HARD RULE 3: Offered Price MUST be > 0 (0 price is invalid)
  const priceInput = document.getElementById('price-input');
  const priceRaw = priceInput ? priceInput.value.replace(/[^0-9.]/g, '') : '';
  const priceVal = parseFloat(priceRaw);
  if (isNaN(priceVal) || priceVal <= 0) {
    showFormError(t.errPriceInvalid, 'price-input');
    return;
  }

  const btnCheck = document.getElementById('btn-check-price');
  btnCheck.disabled = true;

  // If user entered location text manually (not active geolocation coordinates string)
  if (!isBrowserGeolocation || !locationName.toLowerCase().startsWith('lat:')) {
    if (locationName) {
      btnCheck.innerText = t.resolvingLocation;
      const resolved = await forwardGeocodeClient(locationName);
      if (resolved) {
        currentCoordinates = resolved;
      } else {
        showFormError(`Location resolution failed: Unable to geocode "${locationName}". Please enter a valid village, town, or city name.`, 'location-input');
        btnCheck.innerText = t.btnCheckPrice;
        btnCheck.disabled = false;
        return;
      }
    }
  }

  btnCheck.innerText = t.analyzingPrices;

  const loaderOverlay = document.getElementById('analysis-loader-overlay');
  if (loaderOverlay) {
    loaderOverlay.style.display = 'flex';
  }

  const payload = {
    crop: crop,
    quantity: quantityVal,
    current_offered_price: priceVal,
    price_unit: priceVal > 500 ? "qtl" : "kg",
    location: {
      latitude: currentCoordinates.latitude,
      longitude: currentCoordinates.longitude,
      name: locationName
    },
    language: currentLanguage
  };

  try {
    const res = await fetch(`${API_BASE}/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      const data = await res.json();
      latestAnalysisData = data;
      renderDashboardResults(data);
      navigateTo('/results');
    } else {
      const errorData = await res.json().catch(() => ({}));
      showFormError(errorData.message || errorData.detail || "Failed to analyze price. Please check input parameters.");
    }
  } catch (err) {
    console.error("API error:", err);
    renderDemoFallback(payload);
    navigateTo('/results');
  } finally {
    if (loaderOverlay) {
      loaderOverlay.style.display = 'none';
    }
    btnCheck.innerText = t.btnCheckPrice;
    btnCheck.disabled = false;
  }
}

// Render Dashboard Data
function renderDashboardResults(data) {
  latestAnalysisData = data;
  const t = TRANSLATIONS[currentLanguage] || TRANSLATIONS.en;
  const priceSig = data.price_signal || {};
  const hist = data.historical || {};

  const currentKg = Number(priceSig.current_price || 18.0);
  const medianKg = Number(priceSig.historical_median || 24.0);
  const diffPct = Number(priceSig.deviation_percent || -20.0);
  const lowKg = Number(hist.typical_low || (medianKg * 0.85));
  const highKg = Number(hist.typical_high || (medianKg * 1.15));

  let signalTheme = 'green';
  let signalLabelText = t.signalNormal;

  if (priceSig.label === 'UNUSUALLY_LOW' || diffPct <= -15.0) {
    signalLabelText = t.signalUnusuallyLow;
    signalTheme = 'red';
  } else if (priceSig.label === 'LOWER_THAN_USUAL' || diffPct <= -5.0) {
    signalLabelText = t.signalLowerThanUsual;
    signalTheme = 'yellow';
  } else if (diffPct > 30.0) {
    signalTheme = 'green';
  }

  // 1. Top Header & Status Pill
  const statusPill = document.getElementById('hero-status-pill');
  if (statusPill) statusPill.className = `hero-status-pill ${signalTheme}`;
  
  const badgeText = document.getElementById('anomaly-badge-text');
  if (badgeText) badgeText.innerText = signalLabelText;

  // Crop Icon & Location Subtitle
  const cropIcons = { Onion: '🧅', Potato: '🥔', Tomato: '🍅', Wheat: '🌾', Paddy: '🌾', Cotton: '🌾', 'Red Chilli': '🌶️', Maize: '🌽' };
  const cName = data.crop || 'Onion';
  const cIcon = cropIcons[cName] || '🌾';
  
  const cropTag = document.getElementById('hero-crop-tag');
  if (cropTag) cropTag.innerText = cName;
  
  const cropBubble = document.getElementById('hero-crop-bubble');
  if (cropBubble) cropBubble.innerText = cIcon;
  
  const locNameEl = document.getElementById('hero-location-name');
  if (locNameEl) locNameEl.innerText = data.location?.name || currentCoordinates.name || 'Hyderabad, Telangana';

  // 2. Tile 1: Current Offer & Speedometer Gauge
  const priceDisplay = document.getElementById('display-offered-price');
  if (priceDisplay) priceDisplay.innerText = `₹${currentKg.toFixed(2)}`;

  const diffBadge = document.getElementById('display-diff-badge');
  if (diffBadge) diffBadge.className = `offer-diff-badge ${signalTheme}`;

  const diffArrow = document.getElementById('display-diff-arrow');
  if (diffArrow) diffArrow.innerText = diffPct < 0 ? '↓' : '↑';

  const diffText = document.getElementById('display-diff-text');
  if (diffText) diffText.innerText = `${Math.abs(diffPct).toFixed(1)}%`;

  const offerSubtext = document.getElementById('hero-offer-subtext');
  if (offerSubtext) offerSubtext.innerText = diffPct < 0 ? 'BELOW SEASONAL NORMAL' : 'ABOVE SEASONAL NORMAL';

  // Speedometer Needle & Pill
  const gaugeNeedle = document.getElementById('gauge-needle');
  if (gaugeNeedle) {
    let needleDeg = 115;
    if (diffPct <= -15.0) needleDeg = 25;
    else if (diffPct <= -5.0) needleDeg = 65;
    else if (diffPct >= 15.0) needleDeg = 155;
    gaugeNeedle.style.transform = `rotate(${needleDeg}deg)`;
  }

  const gaugePill = document.getElementById('hero-gauge-pill');
  if (gaugePill) {
    const arrow = document.getElementById('hero-gauge-arrow');
    const txt = document.getElementById('hero-gauge-text');
    if (arrow) arrow.innerText = diffPct < 0 ? '↓' : '↑';
    if (txt) txt.innerText = diffPct <= -15.0 ? 'Unusually Low' : (diffPct <= -5.0 ? 'Lower than expected' : 'Within normal range');
  }

  // 3. Tile 2: Price Position Gradient Bar Pins
  const pinVal = document.getElementById('hero-pin-val');
  if (pinVal) pinVal.innerText = `₹${currentKg.toFixed(1)}`;

  const tickVal = document.getElementById('hero-tick-val');
  if (tickVal) tickVal.innerText = `₹${medianKg.toFixed(1)}`;

  const minAxis = Math.min(currentKg, lowKg) * 0.85;
  const maxAxis = Math.max(currentKg, highKg) * 1.15;
  const spanAxis = maxAxis - minAxis || 1;

  const offerPct = Math.max(8, Math.min(92, ((currentKg - minAxis) / spanAxis) * 100));
  const medianPct = Math.max(12, Math.min(88, ((medianKg - minAxis) / spanAxis) * 100));

  const offerPin = document.getElementById('hero-offer-pin');
  if (offerPin) offerPin.style.left = `${offerPct}%`;

  const medianTick = document.getElementById('hero-median-tick');
  if (medianTick) medianTick.style.left = `${medianPct}%`;

  // 4. Tile 3: Historical Benchmark
  const benchMedian = document.getElementById('dash-bench-median');
  if (benchMedian) benchMedian.innerText = `₹${medianKg.toFixed(2)}/kg`;

  const benchCurrent = document.getElementById('dash-bench-current');
  if (benchCurrent) benchCurrent.innerText = `₹${currentKg.toFixed(2)}/kg`;

  // 5. Tile 4: Price Gap & Live Open-Meteo Weather
  const diffKg = currentKg - medianKg;
  const gapVal = document.getElementById('dash-gap-diff');
  if (gapVal) {
    const signStr = diffKg >= 0 ? `+₹${diffKg.toFixed(2)}` : `-₹${Math.abs(diffKg).toFixed(2)}`;
    gapVal.innerText = `${signStr}/kg`;
  }

  const gapSub = document.getElementById('dash-gap-sub');
  if (gapSub) gapSub.innerText = diffKg < 0 ? 'below typical' : 'above typical';

  // Open-Meteo Weather Data
  const weather = data.weather || {};
  const tempEl = document.getElementById('dash-weather-temp');
  const condEl = document.getElementById('dash-weather-cond');
  const weatherIcon = document.getElementById('dash-weather-icon');

  if (weather && weather.available) {
    if (tempEl) tempEl.innerText = `${weather.temperature}°C`;
    if (condEl) condEl.innerText = weather.condition || 'Clear';
    if (weatherIcon) {
      const condLower = (weather.condition || '').toLowerCase();
      if (condLower.includes('rain')) weatherIcon.innerText = '🌧️';
      else if (condLower.includes('cloud')) weatherIcon.innerText = '⛅';
      else weatherIcon.innerText = '☀️';
    }
  } else {
    if (tempEl) tempEl.innerText = '26°C';
    if (condEl) condEl.innerText = weather.message || 'Partly cloudy';
    if (weatherIcon) weatherIcon.innerText = '⛅';
  }

  // Disclaimer
  const sourceLabel = data.data_info?.source || t.demoDataTag;
  const disclaimerEl = document.getElementById('disclaimer-text');
  if (disclaimerEl) disclaimerEl.innerText = `${t.disclaimerPrefix} ${sourceLabel}${t.disclaimerSuffix}`;
}

// Dedicated Page Renderers
function renderHistoricalPricePage(data) {
  const t = TRANSLATIONS[currentLanguage] || TRANSLATIONS.en;
  const priceSig = data.price_signal || {};
  const hist = data.historical || {};
  const currentKg = priceSig.current_price || 18.0;
  const medianKg = priceSig.historical_median || 24.0;
  const diffPct = priceSig.deviation_percent || -20.0;
  const lowerRange = hist.typical_low || 20.0;
  const upperRange = hist.typical_high || 26.0;

  document.getElementById('hp-current-price').innerText = `₹${currentKg}/kg`;
  document.getElementById('hp-historical-median').innerText = `₹${medianKg.toFixed(1)}/kg`;
  document.getElementById('hp-typical-range').innerText = `₹${lowerRange}-₹${upperRange}/kg`;
  document.getElementById('hp-difference').innerText = `${diffPct}%`;
  document.getElementById('hp-disclaimer-text').innerText = `${t.disclaimerPrefix} ${data.data_info?.source || t.demoDataTag}${t.disclaimerSuffix}`;

  drawTrendChart('hpTrendChartCanvas', currentKg, medianKg);
  drawDistributionChart('hpDistributionChartCanvas', currentKg, medianKg, lowerRange, upperRange);
}

function renderNearbyMarketsPage(data) {
  const t = TRANSLATIONS[currentLanguage] || TRANSLATIONS.en;
  const mandis = Array.isArray(data.nearby_mandis) ? data.nearby_mandis : [];
  const optionsList = document.getElementById('mandi-options-list');

  if (optionsList) {
    if (mandis.length === 0) {
      optionsList.innerHTML = `
        <div class="mandi-exception-card" style="background:#fef2f2; border: 1.5px solid #fca5a5; border-radius: 12px; padding: 24px 20px; text-align: center; color: #991b1b; margin-top: 12px;">
          <div style="font-size: 36px; margin-bottom: 8px;">⚠️</div>
          <h4 style="font-size: 16px; font-weight: 700; margin-bottom: 6px;" id="nm-exception-title">${t.nmNoMandisTitle || "Exception Error: No Mandi Available"}</h4>
          <p style="font-size: 13px; line-height: 1.5; color: #7f1d1d;" id="nm-exception-msg">${t.nmNoMandisAvailable}</p>
        </div>
      `;
    } else {
      let cardsHtml = '';
      mandis.forEach(mandi => {
        const isHigher = mandi.signal === 'HISTORICALLY_HIGHER' || mandi.difference_percent > 0;
        const colorClass = isHigher ? 'green' : (mandi.difference_percent >= -10 ? 'yellow' : 'blue');
        const tagText = isHigher ? t.tagHistHigher : (mandi.difference_percent >= -10 ? t.tagSimilarRange : t.tagLimitedData);
        const diffSign = mandi.difference_percent > 0 ? '+' : '';
        
        cardsHtml += `
          <div class="mandi-option-card ${colorClass}">
            <div class="mandi-card-header">
              <div>
                <h4 class="mandi-name">${mandi.name}</h4>
                <span class="mandi-dist-badge">${mandi.distance_km} km</span>
              </div>
              <span class="mandi-status-tag ${colorClass}">${tagText}</span>
            </div>
            <div class="mandi-card-footer">
              <div>
                <span class="mandi-price-label mandi-price-label-text">${t.labelHistPrice}</span>
                <div class="mandi-price-val">₹${mandi.historical_median}/kg</div>
              </div>
              <span class="mandi-diff-badge ${colorClass}">${diffSign}${mandi.difference_percent}% ${t.vsOffer}</span>
            </div>
          </div>
        `;
      });
      optionsList.innerHTML = cardsHtml;
    }
  }

  const disclaimerEl = document.getElementById('nm-disclaimer-text');
  if (disclaimerEl) {
    disclaimerEl.innerText = `${t.disclaimerPrefix} ${data.data_info?.source || t.demoDataTag}${t.disclaimerSuffix}`;
  }

  // Initialize or update Leaflet Map
  initOrUpdateLeafletMap(data.user_location || currentCoordinates, mandis);
}

// LEAFLET LIVE INTERACTIVE MAP ENGINE
let leafletMap = null;
let leafletMarkers = [];
let leafletLines = [];

function initOrUpdateLeafletMap(userCoords, mandis) {
  const mapContainer = document.getElementById('interactive-leaflet-map');
  if (!mapContainer || typeof L === 'undefined') return;

  const userLat = Number(userCoords?.latitude || currentCoordinates.latitude || 17.3850);
  const userLon = Number(userCoords?.longitude || currentCoordinates.longitude || 78.4867);

  if (!leafletMap) {
    leafletMap = L.map('interactive-leaflet-map', {
      center: [userLat, userLon],
      zoom: 7,
      zoomControl: false
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18,
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(leafletMap);
  } else {
    leafletMarkers.forEach(m => leafletMap.removeLayer(m));
    leafletLines.forEach(l => leafletMap.removeLayer(l));
    leafletMarkers = [];
    leafletLines = [];
  }

  setTimeout(() => {
    if (leafletMap) leafletMap.invalidateSize();
  }, 250);

  const boundsPoints = [[userLat, userLon]];

  // User Location Marker
  const userMarkerIcon = L.divIcon({
    className: 'leaflet-user-marker-icon',
    html: `<div style="background:#18181b; color:#ffffff; font-weight:800; padding:6px 12px; border-radius:14px; font-size:11px; border:2px solid #ffffff; box-shadow:0 4px 14px rgba(0,0,0,0.3); text-align:center; cursor:pointer;">📍 YOU</div>`,
    iconSize: [64, 32],
    iconAnchor: [32, 16]
  });

  const userMarker = L.marker([userLat, userLon], { icon: userMarkerIcon })
    .addTo(leafletMap)
    .bindPopup(`<b>📍 Your Location</b><br/>Coordinates: (${userLat.toFixed(4)}, ${userLon.toFixed(4)})`);

  leafletMarkers.push(userMarker);

  const offsets = [
    { lat: 0.18, lon: 0.22 },
    { lat: -0.32, lon: 0.45 },
    { lat: 0.42, lon: -0.25 }
  ];

  const mandiCoords = [];

  mandis.forEach((mandi, idx) => {
    let mLat = mandi.latitude;
    let mLon = mandi.longitude;

    if (!mLat || !mLon) {
      const off = offsets[idx % offsets.length];
      const approxOffsetScale = (mandi.distance_km || 20) / 80;
      mLat = userLat + (off.lat * Math.max(0.5, approxOffsetScale));
      mLon = userLon + (off.lon * Math.max(0.5, approxOffsetScale));
    }

    mLat = Number(mLat);
    mLon = Number(mLon);
    mandiCoords.push({ name: mandi.name, lat: mLat, lon: mLon, data: mandi });

    boundsPoints.push([mLat, mLon]);

    const isHigher = mandi.signal === 'HISTORICALLY_HIGHER' || mandi.difference_percent > 0;
    const badgeColor = isHigher ? '#047857' : '#18181b';
    const bgBadge = isHigher ? '#ecfdf5' : '#ffffff';

    const mandiIcon = L.divIcon({
      className: 'leaflet-mandi-marker-icon',
      html: `<div style="background:${bgBadge}; color:${badgeColor}; font-weight:800; padding:6px 12px; border-radius:14px; font-size:11px; border:2px solid ${badgeColor}; box-shadow:0 4px 14px rgba(0,0,0,0.2); white-space:nowrap; cursor:pointer;">🏪 ${mandi.name.split(' ')[0]} (${mandi.distance_km} km)</div>`,
      iconSize: [130, 32],
      iconAnchor: [65, 16]
    });

    const mMarker = L.marker([mLat, mLon], { icon: mandiIcon }).addTo(leafletMap);

    const popupHtml = `
      <div style="font-family: Inter, sans-serif; padding: 4px;">
        <h4 style="font-size: 13px; font-weight: 800; color: #18181b; margin-bottom: 4px;">🏪 ${mandi.name}</h4>
        <div style="font-size: 12px; color: #52525b; margin-bottom: 4px;">📏 Distance from YOU: <b>${mandi.distance_km} km</b></div>
        <div style="font-size: 12px; color: #52525b; margin-bottom: 4px;">💰 Historical Price: <b>₹${mandi.historical_median}/kg</b></div>
        <div style="font-size: 11px; font-weight: 700; color: ${badgeColor};">📈 ${mandi.difference_percent > 0 ? '+' : ''}${mandi.difference_percent}% vs offer</div>
      </div>
    `;

    mMarker.bindPopup(popupHtml);
    leafletMarkers.push(mMarker);

    // Route line from User to Mandi with live distance label
    const routeLine = L.polyline([[userLat, userLon], [mLat, mLon]], {
      color: badgeColor,
      weight: 3,
      dashArray: '6, 8',
      opacity: 0.85
    }).addTo(leafletMap);

    routeLine.bindTooltip(`<b>${mandi.name.split(' ')[0]} ↔ YOU</b><br/>📏 ${mandi.distance_km} km`, {
      permanent: true,
      direction: 'center',
      className: 'distance-polyline-tooltip'
    });

    leafletLines.push(routeLine);
  });

  // Inter-mandi distance connections between mandis!
  if (mandiCoords.length >= 2) {
    for (let i = 0; i < mandiCoords.length; i++) {
      for (let j = i + 1; j < mandiCoords.length; j++) {
        const m1 = mandiCoords[i];
        const m2 = mandiCoords[j];
        const interDist = calculateHaversineKm(m1.lat, m1.lon, m2.lat, m2.lon);

        const interLine = L.polyline([[m1.lat, m1.lon], [m2.lat, m2.lon]], {
          color: '#71717a',
          weight: 2,
          dashArray: '4, 6',
          opacity: 0.6
        }).addTo(leafletMap);

        interLine.bindTooltip(`<b>${m1.name.split(' ')[0]} ↔ ${m2.name.split(' ')[0]}</b><br/>📏 ${interDist.toFixed(1)} km`, {
          permanent: false,
          direction: 'center'
        });

        leafletLines.push(interLine);
      }
    }
  }

  if (boundsPoints.length > 1) {
    const bounds = L.latLngBounds(boundsPoints);
    leafletMap.fitBounds(bounds, { padding: [50, 50] });
  } else {
    leafletMap.setView([userLat, userLon], 9);
  }
}

function calculateHaversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function zoomInteractiveMap(delta) {
  if (leafletMap) {
    if (delta > 0) leafletMap.zoomIn();
    else leafletMap.zoomOut();
  }
}

function recenterInteractiveMap() {
  if (leafletMap && latestAnalysisData) {
    const userLat = Number(latestAnalysisData.user_location?.latitude || currentCoordinates.latitude || 17.3850);
    const userLon = Number(latestAnalysisData.user_location?.longitude || currentCoordinates.longitude || 78.4867);
    leafletMap.setView([userLat, userLon], 8);
  }
}

function renderWhyThisSignalPage(data) {
  const t = TRANSLATIONS[currentLanguage] || TRANSLATIONS.en;
  const priceSig = data.price_signal || {};
  const explanation = data.explanation || {};
  const conf = data.confidence || {};
  const mandis = Array.isArray(data.nearby_mandis) ? data.nearby_mandis : [];
  const topMandi = mandis[0] || { name: data.location?.name || "Selected Location", distance_km: 15.0, historical_median: priceSig.historical_median || 24.0, difference_percent: 29.0 };

  const offerKg = Number(priceSig.current_price || 18.0);
  const medianKg = Number(topMandi.historical_median || 23.20);
  const diffVal = medianKg - offerKg;
  const diffSign = diffVal >= 0 ? '+' : '-';
  const diffPctSign = topMandi.difference_percent >= 0 ? '+' : '';

  // Tier 1: Hero Comparison Cards
  const offerEl = document.getElementById('wts-offer-price');
  if (offerEl) offerEl.innerText = `₹${offerKg.toFixed(2)}/kg`;

  const diffValEl = document.getElementById('wts-diff-diff');
  if (diffValEl) diffValEl.innerText = `${diffSign}₹${Math.abs(diffVal).toFixed(2)}/kg`;

  const badgeMain = document.getElementById('wts-badge-main');
  const isHigher = topMandi.difference_percent >= 0;
  if (badgeMain) badgeMain.className = `wts-signal-badge ${isHigher ? 'green' : 'red'}`;

  const arrowEl = document.getElementById('wts-badge-arrow');
  if (arrowEl) arrowEl.innerText = isHigher ? '↗' : '↘';

  const pctEl = document.getElementById('wts-badge-pct');
  if (pctEl) pctEl.innerText = `${diffPctSign}${topMandi.difference_percent}%`;

  const subEl = document.getElementById('wts-badge-sub');
  if (subEl) subEl.innerText = isHigher ? 'HISTORICALLY HIGHER' : 'HISTORICALLY LOWER';

  const medianEl = document.getElementById('wts-summary-price');
  if (medianEl) medianEl.innerText = `₹${medianKg.toFixed(2)}/kg`;

  // Tier 2: 3 Factors Row & Target Mandi Pill
  const distEl = document.getElementById('wts-summary-mandi-dist');
  if (distEl) distEl.innerText = `${topMandi.distance_km} km`;

  const signalEl = document.getElementById('wts-factor-signal');
  if (signalEl) signalEl.innerText = `${diffPctSign}${topMandi.difference_percent}%`;

  const obsEl = document.getElementById('wts-obs-count');
  if (obsEl) obsEl.innerText = `${data.historical?.observation_count || 120}+`;

  const mandiNameEl = document.getElementById('wts-summary-mandi-name');
  if (mandiNameEl) mandiNameEl.innerText = topMandi.name;

  // Tier 3: AI Explanation, Context & Disclaimers
  const expTextEl = document.getElementById('wts-explanation-text');
  if (expTextEl) expTextEl.innerText = explanation.text || "Analyzed against historical seasonal records.";

  const qualityEl = document.getElementById('wts-quality-rating');
  if (qualityEl) qualityEl.innerText = `${conf.level || 'HIGH'} (${conf.score || 0.86})`;

  const providerEl = document.getElementById('wts-ai-provider');
  if (providerEl) providerEl.innerText = `${explanation.source || 'ollama'} (Qwen3:8B)`;

  const disclaimerEl = document.getElementById('why-disclaimer-text');
  if (disclaimerEl) disclaimerEl.innerText = `${t.disclaimerPrefix} ${data.data_info?.source || t.demoDataTag}${t.disclaimerSuffix}`;
}

// Demo Fallback Renderer
function renderDemoFallback(payload) {
  latestAnalysisData = {
    price_signal: {
      label: "UNUSUALLY_LOW",
      display: "Price looks unusually low",
      current_price: payload.current_offered_price,
      historical_median: 24.0,
      deviation_percent: -25.0,
      unit: "₹/kg"
    },
    historical: {
      typical_low: 21.5,
      typical_high: 26.0,
      percentile: 0,
      observation_count: 27,
      season: "Sep-Oct"
    },
    nearby_mandis: [
      { name: "Bowenpally Agricultural Market", distance_km: 9.1, historical_median: 25.2, difference_percent: 40.0, signal: "HISTORICALLY_HIGHER" },
      { name: "Solapur Agriculture Market", distance_km: 275.3, historical_median: 26.5, difference_percent: 47.2, signal: "HISTORICALLY_HIGHER" }
    ],
    confidence: { level: "HIGH", score: 0.86 },
    explanation: {
      text: "The offered price is about 25% below the historical seasonal median based on available public mandi data.",
      source: "fallback"
    },
    data_info: { source: "AgMarkNet (Demo Data)", historical_period: "2020-2026" }
  };
  renderDashboardResults(latestAnalysisData);
}

// Draw Trend Chart (HTML5 Canvas)
function drawTrendChart(canvasId, currentPrice, medianPrice) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  
  canvas.width = canvas.parentElement.clientWidth || 500;
  canvas.height = 240;

  const w = canvas.width;
  const h = canvas.height;

  ctx.clearRect(0, 0, w, h);

  const months = ['Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov'];
  const dataPoints = [18, 22, 26, 24, 25, currentPrice];

  const padding = 40;
  const chartW = w - padding * 2;
  const chartH = h - padding * 2;

  const minVal = 14;
  const maxVal = 30;

  // Grid lines
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 1;
  ctx.font = '11px sans-serif';
  ctx.fillStyle = '#94a3b8';

  for (let v = 16; v <= 30; v += 4) {
    const y = h - padding - ((v - minVal) / (maxVal - minVal)) * chartH;
    ctx.beginPath();
    ctx.moveTo(padding, y);
    ctx.lineTo(w - padding, y);
    ctx.stroke();
    ctx.fillText(`₹${v}`, 8, y + 4);
  }

  // Draw smooth curve
  ctx.beginPath();
  const step = chartW / (months.length - 1);
  const points = dataPoints.map((val, i) => ({
    x: padding + i * step,
    y: h - padding - ((val - minVal) / (maxVal - minVal)) * chartH
  }));

  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 0; i < points.length - 1; i++) {
    const xc = (points[i].x + points[i + 1].x) / 2;
    const yc = (points[i].y + points[i + 1].y) / 2;
    ctx.quadraticCurveTo(points[i].x, points[i].y, xc, yc);
  }
  ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y);

  ctx.strokeStyle = '#8b5cf6';
  ctx.lineWidth = 3;
  ctx.stroke();

  // Draw points & labels
  points.forEach((pt, i) => {
    ctx.beginPath();
    ctx.arc(pt.x, pt.y, 5, 0, Math.PI * 2);
    ctx.fillStyle = '#8b5cf6';
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#64748b';
    ctx.fillText(months[i], pt.x - 10, h - 12);

    ctx.fillStyle = '#7c3aed';
    ctx.font = 'bold 11px sans-serif';
    ctx.fillText(`₹${dataPoints[i]}`, pt.x - 8, pt.y - 10);
  });
}

// Draw Distribution Chart (Bar comparison)
function drawDistributionChart(canvasId, todayOffer, histMedian, lowerRange, upperRange) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  canvas.width = canvas.parentElement.clientWidth || 300;
  canvas.height = 140;

  const w = canvas.width;
  const h = canvas.height;

  ctx.clearRect(0, 0, w, h);

  const t = TRANSLATIONS[currentLanguage] || TRANSLATIONS.en;
  const labels = [t.pillTodayOffer, t.pillHistMedian, "Range"];
  const values = [todayOffer, histMedian, (lowerRange + upperRange) / 2];
  const colors = ['#10b981', '#3b82f6', '#a855f7'];

  const barW = 40;
  const gap = (w - 60 - barW * 3) / 2;

  values.forEach((val, i) => {
    const x = 30 + i * (barW + gap);
    const barH = (val / 30) * (h - 40);
    const y = h - 25 - barH;

    ctx.fillStyle = colors[i];
    ctx.beginPath();
    ctx.roundRect ? ctx.roundRect(x, y, barW, barH, 6) : ctx.rect(x, y, barW, barH);
    ctx.fill();

    ctx.fillStyle = '#1e293b';
    ctx.font = 'bold 12px sans-serif';
    ctx.fillText(`₹${val}`, x + 6, y - 6);

    ctx.fillStyle = '#64748b';
    ctx.font = '10px sans-serif';
    ctx.fillText(labels[i].slice(0, 12), x - 5, h - 8);
  });
}

// ClickSpark Canvas Animation Effect
function initClickSpark() {
  const sparkCanvas = document.createElement('canvas');
  sparkCanvas.id = 'sparkCanvasOverlay';
  sparkCanvas.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;pointer-events:none;z-index:9999;';
  document.body.appendChild(sparkCanvas);

  const ctx = sparkCanvas.getContext('2d');
  let sparks = [];

  function resize() {
    sparkCanvas.width = window.innerWidth;
    sparkCanvas.height = window.innerHeight;
  }
  window.addEventListener('resize', resize);
  resize();

  function easeOut(t) {
    return t * (2 - t);
  }

  function draw(timestamp) {
    ctx.clearRect(0, 0, sparkCanvas.width, sparkCanvas.height);
    const duration = 400;
    const sparkRadius = 20;
    const sparkSize = 10;

    sparks = sparks.filter(spark => {
      const elapsed = timestamp - spark.startTime;
      if (elapsed >= duration) return false;

      const progress = elapsed / duration;
      const eased = easeOut(progress);

      const distance = eased * sparkRadius;
      const lineLength = sparkSize * (1 - eased);

      const x1 = spark.x + distance * Math.cos(spark.angle);
      const y1 = spark.y + distance * Math.sin(spark.angle);
      const x2 = spark.x + (distance + lineLength) * Math.cos(spark.angle);
      const y2 = spark.y + (distance + lineLength) * Math.sin(spark.angle);

      ctx.strokeStyle = spark.color;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();

      return true;
    });

    requestAnimationFrame(draw);
  }
  requestAnimationFrame(draw);

  window.addEventListener('click', (e) => {
    const x = e.clientX;
    const y = e.clientY;
    const now = performance.now();
    const sparkCount = 8;
    const colors = ['#10b981', '#2563eb', '#363B45', '#8b5cf6'];
    const color = colors[Math.floor(Math.random() * colors.length)];

    for (let i = 0; i < sparkCount; i++) {
      sparks.push({
        x: x,
        y: y,
        angle: (2 * Math.PI * i) / sparkCount,
        startTime: now,
        color: color
      });
    }
  });
}

// Initialize default view, language & click spark
document.addEventListener('DOMContentLoaded', () => {
  setLanguage(currentLanguage);
  renderRoute(location.pathname);
  initClickSpark();
});

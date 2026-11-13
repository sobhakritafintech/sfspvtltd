/* ==========================================================================
   sobhi — simple website assistant for Sobhakrita Fintech Solutions
   - No API keys. Uses Puter.js for optional free AI generation and falls
     back to a local retrieval answer built from the site's own pages.
   - Language is chosen first, then sobhi offers support options.
   - Unanswered questions can be sent to the team through /api/chat/lead.
   ========================================================================== */
(function () {
  "use strict";

  var root = document.querySelector("[data-sobhi-chat]");
  if (!root) return;

  var panel = root.querySelector("[data-sobhi-panel]");
  var messagesEl = root.querySelector("[data-sobhi-messages]");
  var chipsEl = root.querySelector("[data-sobhi-chips]");
  var form = root.querySelector("[data-sobhi-form]");
  var input = root.querySelector("[data-sobhi-input]");
  var launcher = document.querySelector("[data-sobhi-toggle]");
  var closeBtn = root.querySelector("[data-sobhi-close]");
  var langBtn = root.querySelector("[data-sobhi-lang]");
  var langLabel = root.querySelector("[data-sobhi-lang-label]");

  var state = {
    booted: false,
    busy: false,
    stage: "language",
    lang: "en",
    langName: "English",
    history: [],
    pendingQuestion: "",
    awaitingEscalation: false,
    knowledge: [],
    knowledgePromise: null
  };

  var LANGUAGES = [
    { code: "en", name: "English", native: "English", dir: "ltr" },
    { code: "te", name: "Telugu", native: "తెలుగు", dir: "ltr" },
    { code: "hi", name: "Hindi", native: "हिन्दी", dir: "ltr" },
    { code: "ta", name: "Tamil", native: "தமிழ்", dir: "ltr" },
    { code: "kn", name: "Kannada", native: "ಕನ್ನಡ", dir: "ltr" },
    { code: "ml", name: "Malayalam", native: "മലയാളം", dir: "ltr" },
    { code: "mr", name: "Marathi", native: "मराठी", dir: "ltr" },
    { code: "bn", name: "Bengali", native: "বাংলা", dir: "ltr" },
    { code: "gu", name: "Gujarati", native: "ગુજરાતી", dir: "ltr" },
    { code: "pa", name: "Punjabi", native: "ਪੰਜਾਬੀ", dir: "ltr" },
    { code: "or", name: "Odia", native: "ଓଡ଼ିଆ", dir: "ltr" },
    { code: "ur", name: "Urdu", native: "اردو", dir: "rtl" },
    { code: "other", name: "Other language", native: "Other / अन्य", dir: "ltr" }
  ];

  var OPTIONS = [
    { key: "loans", page: "loans", query: "What loan products does Sobhakrita offer? Please list them with amounts and interest rates." },
    { key: "eligibility", page: "eligibility", query: "What are the eligibility criteria and documents required for loans?" },
    { key: "fees", page: "fees", query: "What fees and charges does Sobhakrita charge? Are there any hidden charges?" },
    { key: "emi", page: "emi calculator", query: "How do EMI, tenure, repayment and prepayment work?" },
    { key: "apply", page: "apply", query: "How do I apply for a loan or book a call with Sobhakrita?" },
    { key: "advisor", query: "I want to talk to an advisor." },
    { key: "other", query: "" }
  ];

  var UI = {
    en: {
      langPrompt: "Please choose your language.",
      welcome: "Welcome to Sobhakrita Fintech. I'm sobhi. How can I help you today?",
      choose: "Choose an option below or type your question.",
      opts: ["Loan information", "Eligibility & documents", "Fees & charges", "EMI & repayment", "Apply or book a call", "Talk to a human"],
      noContext: "I'm sorry, I don't have that information in the website content.",
      askSubmit: "Would you like to submit your question to our team? Reply Yes or No.",
      yes: "Yes",
      no: "No",
      formIntro: "Please share your details and our team will contact you.",
      name: "Your name",
      phone: "Mobile number",
      email: "Email (optional)",
      question: "Your question",
      submit: "Send to Sobhakrita",
      sending: "Sending...",
      success: "Thank you! Your query has been sent to our team. We will contact you soon.",
      failure: "I could not send it automatically. Please email services@sobhakrita.com or call +91 88866 33119.",
      invalid: "Please check the highlighted details.",
      otherPrompt: "Please type the name of your language. I will reply in that language.",
      humanIntro: "Sure. Please share your details below and our advisor will call you."
    },
    te: {
      langPrompt: "దయచేసి మీ భాషను ఎంచుకోండి.",
      welcome: "సోభకృత ఫిన్‌టెక్‌కు స్వాగతం. నేను షోబీ. ఈరోజు మీకు ఎలా సహాయం చేయగలను?",
      choose: "క్రింద ఒక ఎంపికను ఎంచుకోండి లేదా మీ ప్రశ్నను టైప్ చేయండి.",
      opts: ["రుణ సమాచారం", "అర్హత & పత్రాలు", "రుసుములు & ఛార్జీలు", "EMI & తిరిగి చెల్లింపు", "దరఖాస్తు లేదా కాల్ బుక్ చేయండి", "మనిషితో మాట్లాడండి"],
      noContext: "క్షమించండి, వెబ్‌సైట్ సమాచారంలో ఆ వివరాలు నాకు లేవు.",
      askSubmit: "మీ ప్రశ్నను మా బృందానికి పంపాలా? అవును లేదా కాదు అని సమాధానం ఇవ్వండి.",
      yes: "అవును",
      no: "కాదు",
      formIntro: "దయచేసి మీ వివరాలను ఇవ్వండి, మా బృందం మీతో సంప్రదిస్తుంది.",
      name: "మీ పేరు",
      phone: "మొబైల్ నంబర్",
      email: "ఇమెయిల్ (ఐచ్ఛికం)",
      question: "మీ ప్రశ్న",
      submit: "సోభకృతకు పంపండి",
      sending: "పంపుతోంది...",
      success: "ధన్యవాదాలు! మీ ప్రశ్న మా బృందానికి పంపబడింది. మేము త్వరలో సంప్రదిస్తాము.",
      failure: "స్వయంచాలకంగా పంపలేకపోయాను. దయచేసి services@sobhakrita.com కు ఇమెయిల్ చేయండి లేదా +91 88866 33119 కు కాల్ చేయండి.",
      invalid: "దయచేసి హైలైట్ చేసిన వివరాలను తనిఖీ చేయండి.",
      otherPrompt: "దయచేసి మీ భాష పేరును టైప్ చేయండి. నేను ఆ భాషలో సమాధానం ఇస్తాను.",
      humanIntro: "సరే. దయచేసి క్రింద మీ వివరాలను ఇవ్వండి, మా బృందం మీకు కాల్ చేస్తుంది."
    },
    hi: {
      langPrompt: "कृपया अपनी भाषा चुनें।",
      welcome: "सोभकृता फिनटेक में आपका स्वागत है। मैं शोबी हूँ। आज मैं आपकी कैसे मदद कर सकती हूँ?",
      choose: "नीचे एक विकल्प चुनें या अपना सवाल लिखें।",
      opts: ["ऋण की जानकारी", "पात्रता और दस्तावेज़", "शुल्क और चार्ज", "EMI और पुनर्भुगतान", "आवेदन करें या कॉल बुक करें", "किसी व्यक्ति से बात करें"],
      noContext: "क्षमा करें, वेबसाइट की जानकारी में मुझे यह जानकारी नहीं मिली।",
      askSubmit: "क्या आप अपना सवाल हमारी टीम को भेजना चाहते हैं? हाँ या नहीं लिखें।",
      yes: "हाँ",
      no: "नहीं",
      formIntro: "कृपया अपनी जानकारी दें, हमारी टीम आपसे संपर्क करेगी।",
      name: "आपका नाम",
      phone: "मोबाइल नंबर",
      email: "ईमेल (वैकल्पिक)",
      question: "आपका सवाल",
      submit: "सोभकृता को भेजें",
      sending: "भेज रहे हैं...",
      success: "धन्यवाद! आपका सवाल हमारी टीम को भेज दिया गया है। हम जल्द संपर्क करेंगे।",
      failure: "मैं इसे अपने आप नहीं भेज सकी। कृपया services@sobhakrita.com पर ईमेल करें या +91 88866 33119 पर कॉल करें।",
      invalid: "कृपया चिह्नित जानकारी जाँचें।",
      otherPrompt: "कृपया अपनी भाषा का नाम लिखें। मैं उसी भाषा में जवाब दूँगी।",
      humanIntro: "ठीक है। कृपया नीचे अपनी जानकारी दें, हमारी टीम आपको कॉल करेगी।"
    },
    ta: {
      langPrompt: "உங்கள் மொழியைத் தேர்ந்தெடுக்கவும்.",
      welcome: "சோபகிருத ஃபின்டெக்கிற்கு வருக. நான் ஷோபி. இன்று நான் எப்படி உதவலாம்?",
      choose: "கீழே ஒரு விருப்பத்தைத் தேர்ந்தெடுக்கவும் அல்லது உங்கள் கேள்வியைத் தட்டச்சு செய்யவும்.",
      opts: ["கடன் தகவல்", "தகுதி & ஆவணங்கள்", "கட்டணங்கள் & கட்டண விவரங்கள்", "EMI & திருப்பிச் செலுத்துதல்", "விண்ணப்பிக்க அல்லது அழைப்பு பதிவு", "மனிதரிடம் பேசுங்கள்"],
      noContext: "மன்னிக்கவும், வலைத்தளத் தகவலில் அந்த விவரம் என்னிடம் இல்லை.",
      askSubmit: "உங்கள் கேள்வியை எங்கள் குழுவுக்கு அனுப்ப விரும்புகிறீர்களா? ஆம் அல்லது இல்லை என்று பதிலளிக்கவும்.",
      yes: "ஆம்",
      no: "இல்லை",
      formIntro: "உங்கள் விவரங்களைப் பகிரவும், எங்கள் குழு உங்களைத் தொடர்பு கொள்ளும்.",
      name: "உங்கள் பெயர்",
      phone: "மொபைல் எண்",
      email: "மின்னஞ்சல் (விருப்பம்)",
      question: "உங்கள் கேள்வி",
      submit: "சோபகிருதாவுக்கு அனுப்பு",
      sending: "அனுப்பப்படுகிறது...",
      success: "நன்றி! உங்கள் கேள்வி எங்கள் குழுவுக்கு அனுப்பப்பட்டது. விரைவில் தொடர்பு கொள்வோம்.",
      failure: "தானாக அனுப்ப முடியவில்லை. services@sobhakrita.com க்கு மின்னஞ்சல் செய்யவும் அல்லது +91 88866 33119 க்கு அழைக்கவும்.",
      invalid: "குறிக்கப்பட்ட விவரங்களைச் சரிபார்க்கவும்.",
      otherPrompt: "உங்கள் மொழியின் பெயரைத் தட்டச்சு செய்யவும். அந்த மொழியில் பதிலளிப்பேன்.",
      humanIntro: "சரி. கீழே உங்கள் விவரங்களைப் பகிரவும், எங்கள் குழு உங்களை அழைக்கும்."
    },
    kn: {
      langPrompt: "ದಯವಿಟ್ಟು ನಿಮ್ಮ ಭಾಷೆಯನ್ನು ಆಯ್ಕೆಮಾಡಿ.",
      welcome: "ಸೋಭಕೃತ ಫಿನ್‌ಟೆಕ್‌ಗೆ ಸ್ವಾಗತ. ನಾನು ಶೋಬಿ. ಇಂದು ನಾನು ನಿಮಗೆ ಹೇಗೆ ಸಹಾಯ ಮಾಡಬಹುದು?",
      choose: "ಕೆಳಗಿನ ಆಯ್ಕೆಯನ್ನು ಆರಿಸಿ ಅಥವಾ ನಿಮ್ಮ ಪ್ರಶ್ನೆಯನ್ನು ಟೈಪ್ ಮಾಡಿ.",
      opts: ["ಸಾಲದ ಮಾಹಿತಿ", "ಅರ್ಹತೆ ಮತ್ತು ದಾಖಲೆಗಳು", "ಶುಲ್ಕ ಮತ್ತು ಶುಲ್ಕಗಳು", "EMI ಮತ್ತು ಮರುಪಾವತಿ", "ಅರ್ಜಿ ಸಲ್ಲಿಸಿ ಅಥವಾ ಕರೆ ಬುಕ್ ಮಾಡಿ", "ಮನುಷ್ಯರೊಂದಿಗೆ ಮಾತನಾಡಿ"],
      noContext: "ಕ್ಷಮಿಸಿ, ವೆಬ್‌ಸೈಟ್ ಮಾಹಿತಿಯಲ್ಲಿ ಆ ವಿವರ ನನಗೆ ಇಲ್ಲ.",
      askSubmit: "ನಿಮ್ಮ ಪ್ರಶ್ನೆಯನ್ನು ನಮ್ಮ ತಂಡಕ್ಕೆ ಕಳುಹಿಸಬೇಕೇ? ಹೌದು ಅಥವಾ ಇಲ್ಲ ಎಂದು ಉತ್ತರಿಸಿ.",
      yes: "ಹೌದು",
      no: "ಇಲ್ಲ",
      formIntro: "ದಯವಿಟ್ಟು ನಿಮ್ಮ ವಿವರಗಳನ್ನು ಹಂಚಿಕೊಳ್ಳಿ, ನಮ್ಮ ತಂಡ ನಿಮ್ಮನ್ನು ಸಂಪರ್ಕಿಸುತ್ತದೆ.",
      name: "ನಿಮ್ಮ ಹೆಸರು",
      phone: "ಮೊಬೈಲ್ ಸಂಖ್ಯೆ",
      email: "ಇಮೇಲ್ (ಐಚ್ಛಿಕ)",
      question: "ನಿಮ್ಮ ಪ್ರಶ್ನೆ",
      submit: "ಸೋಭಕೃತಕ್ಕೆ ಕಳುಹಿಸಿ",
      sending: "ಕಳುಹಿಸುತ್ತಿದೆ...",
      success: "ಧನ್ಯವಾದಗಳು! ನಿಮ್ಮ ಪ್ರಶ್ನೆಯನ್ನು ನಮ್ಮ ತಂಡಕ್ಕೆ ಕಳುಹಿಸಲಾಗಿದೆ. ನಾವು ಶೀಘ್ರದಲ್ಲೇ ಸಂಪರ್ಕಿಸುತ್ತೇವೆ.",
      failure: "ನಾನು ಅದನ್ನು ಸ್ವಯಂಚಾಲಿತವಾಗಿ ಕಳುಹಿಸಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ. ದಯವಿಟ್ಟು services@sobhakrita.com ಗೆ ಇಮೇಲ್ ಮಾಡಿ ಅಥವಾ +91 88866 33119 ಗೆ ಕರೆ ಮಾಡಿ.",
      invalid: "ದಯವಿಟ್ಟು ಗುರುತಿಸಿದ ವಿವರಗಳನ್ನು ಪರಿಶೀಲಿಸಿ.",
      otherPrompt: "ದಯವಿಟ್ಟು ನಿಮ್ಮ ಭಾಷೆಯ ಹೆಸರನ್ನು ಟೈಪ್ ಮಾಡಿ. ನಾನು ಆ ಭಾಷೆಯಲ್ಲಿ ಉತ್ತರಿಸುತ್ತೇನೆ.",
      humanIntro: "ಸರಿ. ದಯವಿಟ್ಟು ಕೆಳಗೆ ನಿಮ್ಮ ವಿವರಗಳನ್ನು ನೀಡಿ, ನಮ್ಮ ತಂಡ ನಿಮಗೆ ಕರೆ ಮಾಡುತ್ತದೆ."
    },
    ml: {
      langPrompt: "ദയവായി നിങ്ങളുടെ ഭാഷ തിരഞ്ഞെടുക്കുക.",
      welcome: "സോഭകൃത ഫിൻടെക്കിലേക്ക് സ്വാഗതം. ഞാൻ ഷോബി. ഇന്ന് ഞാൻ നിങ്ങളെ എങ്ങനെ സഹായിക്കാം?",
      choose: "ചുവടെയുള്ള ഒരു ഓപ്ഷൻ തിരഞ്ഞെടുക്കുക അല്ലെങ്കിൽ നിങ്ങളുടെ ചോദ്യം ടൈപ്പ് ചെയ്യുക.",
      opts: ["വായ്പ വിവരങ്ങൾ", "യോഗ്യതയും രേഖകളും", "ഫീസുകളും ചാർജുകളും", "EMIയും തിരിച്ചടവും", "അപേക്ഷിക്കുക അല്ലെങ്കിൽ കോൾ ബുക്ക് ചെയ്യുക", "ഒരു വ്യക്തിയോട് സംസാരിക്കുക"],
      noContext: "ക്ഷമിക്കണം, വെബ്സൈറ്റ് വിവരങ്ങളിൽ ആ വിവരം എനിക്കില്ല.",
      askSubmit: "നിങ്ങളുടെ ചോദ്യം ഞങ്ങളുടെ ടീമിന് അയയ്ക്കണോ? അതെ അല്ലെങ്കിൽ ഇല്ല എന്ന് മറുപടി നൽകുക.",
      yes: "അതെ",
      no: "ഇല്ല",
      formIntro: "ദയവായി നിങ്ങളുടെ വിവരങ്ങൾ പങ്കിടുക, ഞങ്ങളുടെ ടീം നിങ്ങളെ ബന്ധപ്പെടും.",
      name: "നിങ്ങളുടെ പേര്",
      phone: "മൊബൈൽ നമ്പർ",
      email: "ഇമെയിൽ (ഓപ്ഷണൽ)",
      question: "നിങ്ങളുടെ ചോദ്യം",
      submit: "സോഭകൃതയ്ക്ക് അയയ്ക്കുക",
      sending: "അയയ്ക്കുന്നു...",
      success: "നന്ദി! നിങ്ങളുടെ ചോദ്യം ഞങ്ങളുടെ ടീമിന് അയച്ചു. ഞങ്ങൾ ഉടൻ ബന്ധപ്പെടും.",
      failure: "എനിക്ക് അത് യാന്ത്രികമായി അയയ്ക്കാൻ കഴിഞ്ഞില്ല. ദയവായി services@sobhakrita.com ഇമെയിൽ ചെയ്യുക അല്ലെങ്കിൽ +91 88866 33119 വിളിക്കുക.",
      invalid: "ദയവായി അടയാളപ്പെടുത്തിയ വിവരങ്ങൾ പരിശോധിക്കുക.",
      otherPrompt: "ദയവായി നിങ്ങളുടെ ഭാഷയുടെ പേര് ടൈപ്പ് ചെയ്യുക. ഞാൻ ആ ഭാഷയിൽ മറുപടി നൽകും.",
      humanIntro: "ശരി. ദയവായി താഴെ നിങ്ങളുടെ വിവരങ്ങൾ നൽകുക, ഞങ്ങളുടെ ടീം നിങ്ങളെ വിളിക്കും."
    },
    mr: {
      langPrompt: "कृपया तुमची भाषा निवडा.",
      welcome: "सोभकृता फिनटेकमध्ये आपले स्वागत आहे. मी शोबी आहे. आज मी आपली कशी मदत करू शकते?",
      choose: "खालील पर्याय निवडा किंवा तुमचा प्रश्न टाइप करा.",
      opts: ["कर्जाची माहिती", "पात्रता आणि कागदपत्रे", "शुल्क आणि शुल्के", "EMI आणि परतफेड", "अर्ज करा किंवा कॉल बुक करा", "माणसाशी बोला"],
      noContext: "क्षमस्व, वेबसाइटच्या माहितीत मला ही माहिती मिळाली नाही.",
      askSubmit: "तुमचा प्रश्न आमच्या टीमला पाठवायचा आहे का? होय किंवा नाही असे उत्तर द्या.",
      yes: "होय",
      no: "नाही",
      formIntro: "कृपया तुमची माहिती द्या, आमची टीम तुमच्याशी संपर्क करेल.",
      name: "तुमचे नाव",
      phone: "मोबाइल नंबर",
      email: "ईमेल (ऐच्छिक)",
      question: "तुमचा प्रश्न",
      submit: "सोभकृताला पाठवा",
      sending: "पाठवत आहे...",
      success: "धन्यवाद! तुमचा प्रश्न आमच्या टीमला पाठवला आहे. आम्ही लवकरच संपर्क करू.",
      failure: "मी तो स्वयंचलितपणे पाठवू शकले नाही. कृपया services@sobhakrita.com वर ईमेल करा किंवा +91 88866 33119 वर कॉल करा.",
      invalid: "कृपया चिन्हांकित माहिती तपासा.",
      otherPrompt: "कृपया तुमच्या भाषेचे नाव टाइप करा. मी त्या भाषेत उत्तर देईन.",
      humanIntro: "ठीक आहे. कृपया खाली तुमची माहिती द्या, आमची टीम तुम्हाला कॉल करेल."
    },
    bn: {
      langPrompt: "অনুগ্রহ করে আপনার ভাষা বেছে নিন।",
      welcome: "সোভাকৃতা ফিনটেকে স্বাগতম। আমি শোভী। আজ আমি আপনাকে কীভাবে সাহায্য করতে পারি?",
      choose: "নিচে একটি বিকল্প বেছে নিন বা আপনার প্রশ্ন টাইপ করুন।",
      opts: ["ঋণের তথ্য", "যোগ্যতা ও নথি", "ফি ও চার্জ", "EMI ও পরিশোধ", "আবেদন করুন বা কল বুক করুন", "একজন মানুষের সাথে কথা বলুন"],
      noContext: "দুঃখিত, ওয়েবসাইটের তথ্যে আমার কাছে সেই তথ্য নেই।",
      askSubmit: "আপনার প্রশ্ন আমাদের টিমে পাঠাতে চান? হ্যাঁ বা না লিখুন।",
      yes: "হ্যাঁ",
      no: "না",
      formIntro: "অনুগ্রহ করে আপনার তথ্য দিন, আমাদের টিম আপনার সাথে যোগাযোগ করবে।",
      name: "আপনার নাম",
      phone: "মোবাইল নম্বর",
      email: "ইমেল (ঐচ্ছিক)",
      question: "আপনার প্রশ্ন",
      submit: "সোভাকৃতাকে পাঠান",
      sending: "পাঠানো হচ্ছে...",
      success: "ধন্যবাদ! আপনার প্রশ্ন আমাদের টিমে পাঠানো হয়েছে। আমরা শীঘ্রই যোগাযোগ করব।",
      failure: "আমি এটি স্বয়ংক্রিয়ভাবে পাঠাতে পারিনি। অনুগ্রহ করে services@sobhakrita.com এ ইমেল করুন বা +91 88866 33119 এ কল করুন।",
      invalid: "অনুগ্রহ করে চিহ্নিত তথ্য পরীক্ষা করুন।",
      otherPrompt: "অনুগ্রহ করে আপনার ভাষার নাম টাইপ করুন। আমি সেই ভাষায় উত্তর দেব।",
      humanIntro: "ঠিক আছে। অনুগ্রহ করে নিচে আপনার তথ্য দিন, আমাদের টিম আপনাকে কল করবে।"
    },
    gu: {
      langPrompt: "કૃપા કરીને તમારી ભાષા પસંદ કરો.",
      welcome: "સોભકૃતા ફિનટેકમાં આપનું સ્વાગત છે. હું શોબી છું. આજે હું તમને કેવી રીતે મદદ કરી શકું?",
      choose: "નીચેનો વિકલ્પ પસંદ કરો અથવા તમારો પ્રશ્ન લખો.",
      opts: ["લોન માહિતી", "પાત્રતા અને દસ્તાવેજો", "ફી અને ચાર્જ", "EMI અને ચુકવણી", "અરજી કરો અથવા કૉલ બુક કરો", "વ્યક્તિ સાથે વાત કરો"],
      noContext: "માફ કરશો, વેબસાઇટની માહિતીમાં મને આ માહિતી મળી નથી.",
      askSubmit: "તમારો પ્રશ્ન અમારી ટીમને મોકલવો છે? હા અથવા ના લખો.",
      yes: "હા",
      no: "ના",
      formIntro: "કૃપા કરીને તમારી માહિતી આપો, અમારી ટીમ તમારો સંપર્ક કરશે.",
      name: "તમારું નામ",
      phone: "મોબાઇલ નંબર",
      email: "ઇમેઇલ (વૈકલ્પિક)",
      question: "તમારો પ્રશ્ન",
      submit: "સોભકૃતાને મોકલો",
      sending: "મોકલી રહ્યું છે...",
      success: "આભાર! તમારો પ્રશ્ન અમારી ટીમને મોકલવામાં આવ્યો છે. અમે ટૂંક સમયમાં સંપર્ક કરીશું.",
      failure: "હું તેને આપમેળે મોકલી શકી નથી. કૃપા કરીને services@sobhakrita.com પર ઇમેઇલ કરો અથવા +91 88866 33119 પર કૉલ કરો.",
      invalid: "કૃપા કરીને ચિહ્નિત માહિતી તપાસો.",
      otherPrompt: "કૃપા કરીને તમારી ભાષાનું નામ લખો. હું તે ભાષામાં જવાબ આપીશ.",
      humanIntro: "ઠીક છે. કૃપા કરીને નીચે તમારી માહિતી આપો, અમારી ટીમ તમને કૉલ કરશે."
    },
    pa: {
      langPrompt: "ਕਿਰਪਾ ਕਰਕੇ ਆਪਣੀ ਭਾਸ਼ਾ ਚੁਣੋ।",
      welcome: "ਸੋਭਕ੍ਰਿਤਾ ਫਿਨਟੈਕ ਵਿੱਚ ਤੁਹਾਡਾ ਸਵਾਗਤ ਹੈ। ਮੈਂ ਸ਼ੋਬੀ ਹਾਂ। ਅੱਜ ਮੈਂ ਤੁਹਾਡੀ ਕਿਵੇਂ ਮਦਦ ਕਰ ਸਕਦੀ ਹਾਂ?",
      choose: "ਹੇਠਾਂ ਇੱਕ ਵਿਕਲਪ ਚੁਣੋ ਜਾਂ ਆਪਣਾ ਸਵਾਲ ਲਿਖੋ।",
      opts: ["ਕਰਜ਼ੇ ਦੀ ਜਾਣਕਾਰੀ", "ਯੋਗਤਾ ਅਤੇ ਦਸਤਾਵੇਜ਼", "ਫੀਸ ਅਤੇ ਚਾਰਜ", "EMI ਅਤੇ ਭੁਗਤਾਨ", "ਅਰਜ਼ੀ ਦਿਓ ਜਾਂ ਕਾਲ ਬੁੱਕ ਕਰੋ", "ਕਿਸੇ ਵਿਅਕਤੀ ਨਾਲ ਗੱਲ ਕਰੋ"],
      noContext: "ਮਾਫ਼ ਕਰਨਾ, ਵੈੱਬਸਾਈਟ ਦੀ ਜਾਣਕਾਰੀ ਵਿੱਚ ਮੈਨੂੰ ਇਹ ਜਾਣਕਾਰੀ ਨਹੀਂ ਮਿਲੀ।",
      askSubmit: "ਕੀ ਤੁਸੀਂ ਆਪਣਾ ਸਵਾਲ ਸਾਡੀ ਟੀਮ ਨੂੰ ਭੇਜਣਾ ਚਾਹੁੰਦੇ ਹੋ? ਹਾਂ ਜਾਂ ਨਹੀਂ ਲਿਖੋ।",
      yes: "ਹਾਂ",
      no: "ਨਹੀਂ",
      formIntro: "ਕਿਰਪਾ ਕਰਕੇ ਆਪਣੀ ਜਾਣਕਾਰੀ ਦਿਓ, ਸਾਡੀ ਟੀਮ ਤੁਹਾਡੇ ਨਾਲ ਸੰਪਰਕ ਕਰੇਗੀ।",
      name: "ਤੁਹਾਡਾ ਨਾਮ",
      phone: "ਮੋਬਾਈਲ ਨੰਬਰ",
      email: "ਈਮੇਲ (ਵਿਕਲਪਿਕ)",
      question: "ਤੁਹਾਡਾ ਸਵਾਲ",
      submit: "ਸੋਭਕ੍ਰਿਤਾ ਨੂੰ ਭੇਜੋ",
      sending: "ਭੇਜ ਰਿਹਾ ਹੈ...",
      success: "ਧੰਨਵਾਦ! ਤੁਹਾਡਾ ਸਵਾਲ ਸਾਡੀ ਟੀਮ ਨੂੰ ਭੇਜ ਦਿੱਤਾ ਗਿਆ ਹੈ। ਅਸੀਂ ਜਲਦੀ ਸੰਪਰਕ ਕਰਾਂਗੇ।",
      failure: "ਮੈਂ ਇਸਨੂੰ ਆਪਣੇ ਆਪ ਭੇਜ ਨਹੀਂ ਸਕੀ। ਕਿਰਪਾ ਕਰਕੇ services@sobhakrita.com 'ਤੇ ਈਮੇਲ ਕਰੋ ਜਾਂ +91 88866 33119 'ਤੇ ਕਾਲ ਕਰੋ।",
      invalid: "ਕਿਰਪਾ ਕਰਕੇ ਨਿਸ਼ਾਨ ਲੱਗੀ ਜਾਣਕਾਰੀ ਦੀ ਜਾਂਚ ਕਰੋ।",
      otherPrompt: "ਕਿਰਪਾ ਕਰਕੇ ਆਪਣੀ ਭਾਸ਼ਾ ਦਾ ਨਾਮ ਲਿਖੋ। ਮੈਂ ਉਸ ਭਾਸ਼ਾ ਵਿੱਚ ਜਵਾਬ ਦਿਆਂਗੀ।",
      humanIntro: "ਠੀਕ ਹੈ। ਕਿਰਪਾ ਕਰਕੇ ਹੇਠਾਂ ਆਪਣੀ ਜਾਣਕਾਰੀ ਦਿਓ, ਸਾਡੀ ਟੀਮ ਤੁਹਾਨੂੰ ਕਾਲ ਕਰੇਗੀ।"
    },
    or: {
      langPrompt: "ଦୟାକରି ଆପଣଙ୍କ ଭାଷା ବାଛନ୍ତୁ।",
      welcome: "ସୋଭକୃତା ଫିନଟେକକୁ ସ୍ୱାଗତ। ମୁଁ ଶୋବୀ। ଆଜି ମୁଁ ଆପଣଙ୍କୁ କିପରି ସାହାଯ୍ୟ କରିପାରିବି?",
      choose: "ତଳେ ଏକ ବିକଳ୍ପ ବାଛନ୍ତୁ କିମ୍ବା ଆପଣଙ୍କ ପ୍ରଶ୍ନ ଲେଖନ୍ତୁ।",
      opts: ["ଋଣ ସୂଚନା", "ଯୋଗ୍ୟତା ଓ ଦଲିଲ", "ଫି ଓ ଚାର୍ଜ", "EMI ଓ ପରିଶୋଧ", "ଆବେଦନ କରନ୍ତୁ କିମ୍ବା କଲ ବୁକ କରନ୍ତୁ", "ଜଣେ ବ୍ୟକ୍ତିଙ୍କ ସହ କଥା ହୁଅନ୍ତୁ"],
      noContext: "କ୍ଷମା କରନ୍ତୁ, ୱେବସାଇଟ ସୂଚନାରେ ମୋତେ ଏହି ତଥ୍ୟ ମିଳିଲା ନାହିଁ।",
      askSubmit: "ଆପଣଙ୍କ ପ୍ରଶ୍ନ ଆମ ଦଳକୁ ପଠାଇବାକୁ ଚାହାଁନ୍ତି କି? ହଁ କିମ୍ବା ନା ଲେଖନ୍ତୁ।",
      yes: "ହଁ",
      no: "ନା",
      formIntro: "ଦୟାକରି ଆପଣଙ୍କ ସୂଚନା ଦିଅନ୍ତୁ, ଆମ ଦଳ ଆପଣଙ୍କ ସହ ଯୋଗାଯୋଗ କରିବ।",
      name: "ଆପଣଙ୍କ ନାମ",
      phone: "ମୋବାଇଲ ନମ୍ବର",
      email: "ଇମେଲ (ଇଚ୍ଛାଧୀନ)",
      question: "ଆପଣଙ୍କ ପ୍ରଶ୍ନ",
      submit: "ସୋଭକୃତାକୁ ପଠାନ୍ତୁ",
      sending: "ପଠାଉଛି...",
      success: "ଧନ୍ୟବାଦ! ଆପଣଙ୍କ ପ୍ରଶ୍ନ ଆମ ଦଳକୁ ପଠାଯାଇଛି। ଆମେ ଶୀଘ୍ର ଯୋଗାଯୋଗ କରିବୁ।",
      failure: "ମୁଁ ଏହାକୁ ସ୍ୱୟଂଚାଳିତଭାବେ ପଠାଇ ପାରିଲି ନାହିଁ। ଦୟାକରି services@sobhakrita.com କୁ ଇମେଲ କରନ୍ତୁ କିମ୍ବା +91 88866 33119 କୁ କଲ କରନ୍ତୁ।",
      invalid: "ଦୟାକରି ଚିହ୍ନିତ ସୂଚନା ଯାଞ୍ଚ କରନ୍ତୁ।",
      otherPrompt: "ଦୟାକରି ଆପଣଙ୍କ ଭାଷାର ନାମ ଲେଖନ୍ତୁ। ମୁଁ ସେହି ଭାଷାରେ ଉତ୍ତର ଦେବି।",
      humanIntro: "ଠିକ୍ ଅଛି। ଦୟାକରି ତଳେ ଆପଣଙ୍କ ସୂଚନା ଦିଅନ୍ତୁ, ଆମ ଦଳ ଆପଣଙ୍କୁ କଲ କରିବ।"
    },
    ur: {
      langPrompt: "براہ کرم اپنی زبان منتخب کریں۔",
      welcome: "سوبھکریتا فنٹیک میں آپ کا خیر مقدم ہے۔ میں شوبی ہوں۔ آج میں آپ کی کیسے مدد کر سکتی ہوں؟",
      choose: "نیچے کوئی آپشن منتخب کریں یا اپنا سوال لکھیں۔",
      opts: ["قرض کی معلومات", "اہلیت اور دستاویزات", "فیس اور چارجز", "EMI اور ادائیگی", "درخواست دیں یا کال بک کریں", "کسی شخص سے بات کریں"],
      noContext: "معاف کریں، ویب سائٹ کی معلومات میں مجھے یہ معلومات نہیں ملیں۔",
      askSubmit: "کیا آپ اپنا سوال ہماری ٹیم کو بھیجنا چاہتے ہیں؟ ہاں یا نہیں لکھیں۔",
      yes: "ہاں",
      no: "نہیں",
      formIntro: "براہ کرم اپنی معلومات دیں، ہماری ٹیم آپ سے رابطہ کرے گی۔",
      name: "آپ کا نام",
      phone: "موبائل نمبر",
      email: "ای میل (اختیاری)",
      question: "آپ کا سوال",
      submit: "سوبھکریتا کو بھیجیں",
      sending: "بھیجا جا رہا ہے...",
      success: "شکریہ! آپ کا سوال ہماری ٹیم کو بھیج دیا گیا ہے۔ ہم جلد رابطہ کریں گے۔",
      failure: "میں اسے خودکار طور پر نہیں بھیج سکی۔ براہ کرم services@sobhakrita.com پر ای میل کریں یا +91 88866 33119 پر کال کریں۔",
      invalid: "براہ کرم نشان زدہ معلومات چیک کریں۔",
      otherPrompt: "براہ کرم اپنی زبان کا نام لکھیں۔ میں اسی زبان میں جواب دوں گی۔",
      humanIntro: "ٹھیک ہے۔ براہ کرم نیچے اپنی معلومات دیں، ہماری ٹیم آپ کو کال کرے گی۔"
    }
  };

  var LOCAL_INTRO = {
    en: "Here's what our website says:",
    te: "మా వెబ్‌సైట్ నుండి సమాచారం ఇది (ఇంగ్లీషులో):",
    hi: "हमारी वेबसाइट पर यह जानकारी है (अंग्रेज़ी में):",
    ta: "எங்கள் வலைத்தளத்தில் உள்ள தகவல் (ஆங்கிலத்தில்):",
    kn: "ನಮ್ಮ ವೆಬ್‌ಸೈಟ್‌ನಲ್ಲಿರುವ ಮಾಹಿತಿ (ಇಂಗ್ಲಿಷ್‌ನಲ್ಲಿ):",
    ml: "ഞങ്ങളുടെ വെബ്സൈറ്റിലുള്ള വിവരം (ഇംഗ്ലീഷിൽ):",
    mr: "आमच्या वेबसाइटवरील माहिती (इंग्रजीत):",
    bn: "আমাদের ওয়েবসাইটে থাকা তথ্য (ইংরেজিতে):",
    gu: "અમારી વેબસાઇટ પરની માહિતી (અંગ્રેજીમાં):",
    pa: "ਸਾਡੀ ਵੈੱਬਸਾਈਟ 'ਤੇ ਇਹ ਜਾਣਕਾਰੀ ਹੈ (ਅੰਗਰੇਜ਼ੀ ਵਿੱਚ):",
    or: "ଆମ ୱେବସାଇଟରେ ଥିବା ସୂଚନା (ଇଂରାଜୀରେ):",
    ur: "ہماری ویب سائٹ پر یہ معلومات ہیں (انگریزی میں):"
  };

  function localIntro() {
    return LOCAL_INTRO[state.lang] || LOCAL_INTRO.en;
  }

  var ADVISOR_LABELS = {
    en: "Talk to our advisor",
    te: "మా సలహాదారుని సంప్రదించండి",
    hi: "हमारे सलाहकार से बात करें",
    ta: "எங்கள் ஆலோசகரை அணுகுங்கள்",
    kn: "ನಮ್ಮ ಸಲಹೆಗಾರರನ್ನು ಸಂಪರ್ಕಿಸಿ",
    ml: "ഞങ്ങളുടെ ഉപദേശകനെ ബന്ധപ്പെടുക",
    mr: "आमच्या सल्लागाराशी बोला",
    bn: "আমাদের উপদেষ্টার সাথে কথা বলুন",
    gu: "અમારા સલાહકાર સાથે વાત કરો",
    pa: "ਸਾਡੇ ਸਲਾਹਕਾਰ ਨਾਲ ਗੱਲ ਕਰੋ",
    or: "ଆମ ସଲାହକାରଙ୍କ ସହ କଥା ହୁଅନ୍ତୁ",
    ur: "ہمارے مشیر سے بات کریں"
  };

  var MORE_LABELS = {
    en: "Other question",
    te: "ఇతర ప్రశ్న",
    hi: "अन्य प्रश्न",
    ta: "மற்ற கேள்வி",
    kn: "ಇತರ ಪ್ರಶ್ನೆ",
    ml: "മറ്റ് ചോദ്യം",
    mr: "इतर प्रश्न",
    bn: "অন্য প্রশ্ন",
    gu: "અન્ય પ્રશ્ન",
    pa: "ਹੋਰ ਸਵਾਲ",
    or: "ଅନ୍ୟ ପ୍ରଶ୍ନ",
    ur: "دوسرا سوال"
  };

  var TYPE_QUESTION = {
    en: "Please type your question below and I will look it up.",
    te: "దయచేసి మీ ప్రశ్నను క్రింద టైప్ చేయండి, నేను చూస్తాను.",
    hi: "कृपया अपना सवाल नीचे लिखें, मैं देखती हूँ।",
    ta: "உங்கள் கேள்வியைக் கீழே தட்டச்சு செய்யவும், நான் பார்க்கிறேன்.",
    kn: "ದಯವಿಟ್ಟು ನಿಮ್ಮ ಪ್ರಶ್ನೆಯನ್ನು ಕೆಳಗೆ ಟೈಪ್ ಮಾಡಿ, ನಾನು ನೋಡುತ್ತೇನೆ.",
    ml: "ദയവായി നിങ്ങളുടെ ചോദ്യം താഴെ ടൈപ്പ് ചെയ്യുക, ഞാൻ നോക്കാം.",
    mr: "कृपया तुमचा प्रश्न खाली टाइप करा, मी पाहते.",
    bn: "অনুগ্রহ করে আপনার প্রশ্ন নিচে লিখুন, আমি দেখছি।",
    gu: "કૃપા કરીને તમારો પ્રશ્ન નીચે લખો, હું જોઈશ.",
    pa: "ਕਿਰਪਾ ਕਰਕੇ ਆਪਣਾ ਸਵਾਲ ਹੇਠਾਂ ਲਿਖੋ, ਮੈਂ ਵੇਖਦੀ ਹਾਂ।",
    or: "ଦୟାକରି ଆପଣଙ୍କ ପ୍ରଶ୍ନ ତଳେ ଲେଖନ୍ତୁ, ମୁଁ ଦେଖିବି।",
    ur: "براہ کرم اپنا سوال نیچے لکھیں، میں دیکھتی ہوں۔"
  };

  function advisorLabel() {
    return ADVISOR_LABELS[state.lang] || ADVISOR_LABELS.en;
  }

  function moreLabel() {
    return MORE_LABELS[state.lang] || MORE_LABELS.en;
  }

  function typeQuestion() {
    return TYPE_QUESTION[state.lang] || TYPE_QUESTION.en;
  }

  var SITE_ORIGIN = "https://www.sobhakritafintech.com/";

  var FALLBACK_KB = [
    { page: "About", text: "Sobhakrita Fintech Solutions Private Limited is a loan facilitator and Direct Selling Agent based in Chittoor, Andhra Pradesh. It is not a bank or NBFC and does not lend in its own name. It helps customers compare loans from partner banks and RBI-regulated NBFCs." },
    { page: "Contact", text: "Sobhakrita office is at #20-90B/1, Naidu Buildings, Behind Dominos, Mittoor, Chittoor, Andhra Pradesh 517001. Phone +91 88866 33119 and +91 88866 33118. Email services@sobhakrita.com. Office hours are Monday to Saturday, 9:00 AM to 6:00 PM. Sunday closed." },
    { page: "Loans", text: "Sobhakrita offers personal loan from ₹50,000 to ₹50 lakh, business loan from ₹1 lakh to ₹75 lakh, home loan from ₹5 lakh to ₹2 crore, mortgage or loan against property from ₹5 lakh to ₹5 crore, car loan from ₹75,000 to ₹50 lakh, education loan from ₹50,000 to ₹75 lakh, agriculture loan from ₹50,000 to ₹50 lakh, and industrial or MSME loan from ₹2 lakh to ₹2 crore." },
    { page: "Fees", text: "Sobhakrita does not charge an application, consultation, file, advance fee or security deposit in its own name. A minimal service fee applies only after disbursal, with written consent, and is quoted in writing before documentation. Lender charges such as processing fee, legal or technical verification, stamp duty, CERSAI, insurance and statutory charges are separate and disclosed in the Key Fact Statement." },
    { page: "Process", text: "The usual process is: share the requirement, get a shortlist of suitable lenders, verify KYC and income documents once, review the sanction and Key Fact Statement, then receive funds from the lender. Personal and business loans may get an indicative decision in 48 to 72 working hours. Home and mortgage loans often take 7 to 15 working days." },
    { page: "Eligibility", text: "Indicative personal loan eligibility: age 21 to 60 years at application; salaried with at least 6 months in the current job, or self-employed with at least 2 years in business; minimum net monthly income of ₹15,000, which varies by lender and city; CIBIL score of 700+ preferred, with 650+ considered by select NBFCs; and existing EMIs within 40 to 50 percent of net income. Each partner lender sets its own final policy, and Sobhakrita matches your file to the lender most likely to approve it." },
    { page: "Documents", text: "Documents usually needed for a loan: PAN card and Aadhaar card; recent address proof such as a utility bill, rent agreement or Aadhaar; for salaried applicants, the last 3 months' salary slips and 6 months' bank statement; for self-employed applicants, 2 years' ITR, computation and 6 to 12 months' bank statement; and a passport-size photograph plus employment or office ID. KYC and income documents are submitted once and routed securely to the lender." },
    { page: "EMI", text: "The EMI calculator estimates monthly EMI, total interest and total repayment for home, personal, car, business, education and agriculture loans. EMI depends on the loan amount, interest rate and tenure." },
    { page: "Apply", text: "Customers can apply online at https://www.sobhakritafintech.com/apply.html, book a free call at https://www.sobhakritafintech.com/book-a-call.html, call +91 88866 33119 or email services@sobhakrita.com." },
    { page: "Service area", text: "Our office is in Chittoor, Andhra Pradesh. We regularly serve Chittoor, Tirupati, Madanapalle, Punganur, Palamaner, Kuppam, Nellore and nearby towns. Several partner lenders can process applications across India." }
  ];

  var SITE_PAGES = [
    "index.html", "about.html", "loans.html", "personal-loan.html", "business-loan.html",
    "home-loan.html", "mortgage-loan.html", "car-loan.html", "education-loan.html",
    "agriculture-loan.html", "industrial-loan.html", "emi-calculator.html", "fees.html",
    "apply.html", "book-a-call.html", "contact.html", "insurance-services.html",
    "careers.html", "privacy-policy.html", "terms-conditions.html", "disclaimer.html"
  ];

  var STOP_WORDS = {
    the: 1, and: 1, for: 1, with: 1, from: 1, that: 1, this: 1, what: 1, which: 1,
    how: 1, can: 1, you: 1, your: 1, are: 1, is: 1, do: 1, does: 1, i: 1, me: 1,
    my: 1, we: 1, our: 1, about: 1, please: 1, tell: 1, give: 1, show: 1, any: 1,
    have: 1, has: 1, there: 1, it: 1, of: 1, to: 1, in: 1, on: 1, at: 1, or: 1,
    an: 1, a: 1, be: 1, will: 1, would: 1, should: 1, could: 1, help: 1
  };

  function t(key) {
    var pack = UI[state.lang] || UI.en;
    return Object.prototype.hasOwnProperty.call(pack, key) ? pack[key] : UI.en[key];
  }

  function optionLabels() {
    var pack = UI[state.lang] || UI.en;
    var labels = (pack.opts || UI.en.opts).slice();
    if (labels.length) labels[labels.length - 1] = advisorLabel();
    labels.push(moreLabel());
    return labels;
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  var pageLinkPattern = null;
  function pageLinks() {
    if (!pageLinkPattern) {
      var names = SITE_PAGES.map(function (page) {
        return page.replace(/\.html$/i, "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      });
      pageLinkPattern = "\\b(?:" + names.join("|") + ")\\.html(?:#[\\w-]+)?\\b";
    }
    return pageLinkPattern;
  }

  function linkify(text) {
    text = String(text || "")
      .replace(/\*\*(.*?)\*\*/g, "$1")
      .replace(/`([^`]+)`/g, "$1")
      .trim();

    var pattern = new RegExp(
      "(https?:\\/\\/[^\\s<>\"']+|www\\.[^\\s<>\"']+|[\\w.+-]+@[\\w-]+\\.[\\w.-]+|\\+?\\d[\\d\\s-]{8,}\\d|" +
        pageLinks() + ")",
      "gi"
    );
    var last = 0;
    var match;
    var html = "";

    while ((match = pattern.exec(text)) !== null) {
      html += escapeHtml(text.slice(last, match.index));
      var raw = match[0];
      var value = raw;
      var trailing = "";

      // URLs are greedy; keep sentence punctuation outside the link.
      var punct = /[.,;:!?)\]}]+$/.exec(value);
      if (punct) {
        trailing = punct[0];
        value = value.slice(0, -trailing.length);
      }

      var href = value;

      if (/^[\w.+-]+@[\w-]+\.[\w.-]+$/.test(value)) {
        href = "mailto:" + value;
      } else if (/^\+?\d[\d\s-]{8,}\d$/.test(value)) {
        href = "tel:" + value.replace(/\s/g, "");
      } else if (!/^https?:\/\//i.test(value) && !/^www\./i.test(value) && /\.html(?:#[\w-]+)?$/i.test(value)) {
        value = SITE_ORIGIN + value.replace(/^\/+/, "");
        href = value;
      } else if (!/^https?:\/\//i.test(value)) {
        href = "https://" + value;
      }

      html += '<a href="' + escapeHtml(href) + '" target="_blank" rel="noopener">' + escapeHtml(value) + "</a>" + escapeHtml(trailing);
      last = match.index + raw.length;
    }

    html += escapeHtml(text.slice(last));
    return html.replace(/\n/g, "<br>");
  }

  function scrollToBottom() {
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function addMessage(role, text, options) {
    var row = document.createElement("div");
    row.className = "sobhi-msg sobhi-msg--" + role;

    if (role === "assistant") {
      var avatar = document.createElement("span");
      avatar.className = "sobhi-msg-avatar";
      avatar.setAttribute("aria-hidden", "true");
      avatar.textContent = "S";
      row.appendChild(avatar);
    }

    var bubble = document.createElement("div");
    bubble.className = "sobhi-bubble";
    bubble.innerHTML = linkify(text);
    row.appendChild(bubble);
    messagesEl.appendChild(row);
    scrollToBottom();

    if (!options || !options.skipHistory) {
      state.history.push({ role: role, text: String(text || "") });
      if (state.history.length > 30) state.history.shift();
    }
    return row;
  }

  function showTyping() {
    var row = document.createElement("div");
    row.className = "sobhi-msg sobhi-msg--assistant sobhi-typing";
    row.innerHTML = '<span class="sobhi-msg-avatar" aria-hidden="true">S</span><div class="sobhi-bubble"><span class="sobhi-dots"><i></i><i></i><i></i></span></div>';
    messagesEl.appendChild(row);
    scrollToBottom();
    return row;
  }

  function clearChips() {
    chipsEl.innerHTML = "";
    chipsEl.hidden = true;
  }

  function showChips(items) {
    clearChips();
    items.forEach(function (item) {
      var button = document.createElement("button");
      button.type = "button";
      button.className = "sobhi-chip";
      button.textContent = item.label;
      button.addEventListener("click", function () {
        if (state.busy && !item.force) return;
        clearChips();
        item.onClick();
      });
      chipsEl.appendChild(button);
    });
    chipsEl.hidden = false;
    scrollToBottom();
  }

  function renderLanguageChips() {
    showChips(LANGUAGES.map(function (lang) {
      return {
        label: lang.native,
        force: true,
        onClick: function () { selectLanguage(lang); }
      };
    }));
  }

  function selectLanguage(lang) {
    if (lang.code === "other") {
      state.lang = "other";
      state.langName = "Other language";
      state.stage = "language-other";
      addMessage("user", lang.native);
      addMessage("assistant", UI.en.otherPrompt);
      input.focus();
      return;
    }

    state.lang = lang.code;
    state.langName = lang.name;
    state.stage = "chat";
    state.awaitingEscalation = false;
    root.setAttribute("lang", lang.code);
    root.setAttribute("dir", lang.dir);
    if (langLabel) langLabel.textContent = lang.code.toUpperCase();
    addMessage("user", lang.native);
    addMessage("assistant", t("welcome"));
    addMessage("assistant", t("choose"));
    showOptions();
  }

  function showOptions() {
    state.stage = "chat";
    var labels = optionLabels();
    showChips(OPTIONS.map(function (option, index) {
      return {
        label: labels[index],
        force: true,
        onClick: function () {
          if (option.key === "advisor") {
            addMessage("user", labels[index]);
            startEscalation(t("humanIntro"));
            return;
          }
          if (option.key === "other") {
            addMessage("user", labels[index]);
            addMessage("assistant", typeQuestion());
            input.focus();
            return;
          }
          sendQuery(option.query, labels[index], option.page);
        }
      };
    }));
  }

  function isYes(text) {
    var value = text.toLowerCase().trim();
    return /^(yes|yep|yeah|y|haan|han|ha|avunu|aama|howdu|athe|hoy|hyan|sari|ok|okay|हाँ|हां|हो|అవును|ஆம்|ಹೌದು|അതെ|होय|হ্যাঁ|હા|ਹਾਂ|ہاں|ହଁ)/i.test(value);
  }

  function isNo(text) {
    var value = text.toLowerCase().trim();
    return /^(no|nope|n|nahi|nahin|ledu|illa|beda|alla|na|नहीं|नही|నా|కాదు|இல்லை|ಇಲ್ಲ|ഇല്ല|नाही|না|ના|نہیں|ନା)/i.test(value);
  }

  function isGreeting(text) {
    return /^(hi|hello|hey|namaste|namaskar|vanakkam|namaskara|namaskaram|salaam|assalam|good morning|good evening|నమస్తే|नमस्ते|வணக்கம்|ನಮಸ್ಕಾರ|നമസ്കാരം)/i.test(text.trim());
  }

  function normalizeText(text) {
    return String(text || "").toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").replace(/\s+/g, " ").trim();
  }

  function tokenize(text) {
    return normalizeText(text)
      .split(" ")
      .filter(function (word) {
        return word.length >= 2 && !STOP_WORDS[word];
      });
  }

  function loadKnowledge() {
    if (state.knowledgePromise) return state.knowledgePromise;

    state.knowledge = FALLBACK_KB.slice();

    state.knowledgePromise = Promise.all(SITE_PAGES.map(function (page) {
      return fetch(page, { credentials: "same-origin" })
        .then(function (response) { return response.ok ? response.text() : ""; })
        .then(function (html) {
          if (!html) return null;
          var doc = new DOMParser().parseFromString(html, "text/html");
          var junk = doc.querySelectorAll("script, style, noscript, svg, header, footer, .topbar, .site-footer, .float-actions, .drawer, .cta-band, .partners-band, .no-print");
          Array.prototype.forEach.call(junk, function (node) { node.parentNode.removeChild(node); });
          var main = doc.querySelector("main") || doc.body;
          var label = page.replace(".html", "").replace(/-/g, " ");
          var seen = {};
          var items = [];
          var nodes = main.querySelectorAll("h1, h2, h3, h4, p, li, td, th");
          Array.prototype.forEach.call(nodes, function (node) {
            if (node.querySelector("p, li, td, th")) return;
            var text = node.textContent.replace(/\s+/g, " ").trim();
            if (text.length < 25 || text.length > 1200) return;
            var key = normalizeText(text);
            if (seen[key]) return;
            seen[key] = true;
            items.push({ page: label, text: text });
          });
          return items;
        })
        .catch(function () { return null; });
    })).then(function (pageSets) {
      pageSets.forEach(function (items) {
        if (items) state.knowledge = state.knowledge.concat(items);
      });
      return state.knowledge;
    });

    return state.knowledgePromise;
  }

  function splitForTranslation(text, max) {
    var chunks = [];
    var rest = String(text);
    while (rest.length > max) {
      var cut = rest.slice(0, max);
      var at = Math.max(cut.lastIndexOf("\n"), cut.lastIndexOf(". "), cut.lastIndexOf("? "), cut.lastIndexOf("! "));
      if (at < max * 0.5) at = max;
      chunks.push(rest.slice(0, at));
      rest = rest.slice(at);
    }
    if (rest) chunks.push(rest);
    return chunks;
  }

  function googleTranslate(text, source, target) {
    var chunks = splitForTranslation(text, 1400);
    return Promise.all(chunks.map(function (chunk) {
      var url = "https://translate.googleapis.com/translate_a/single?client=gtx&sl=" +
        encodeURIComponent(source) + "&tl=" + encodeURIComponent(target) + "&dt=t&q=" +
        encodeURIComponent(chunk);
      return withTimeout(fetch(url), 6000, "Translation")
        .then(function (response) { return response.ok ? response.json() : null; })
        .then(function (body) {
          if (!body || !body[0]) return chunk;
          return body[0].map(function (part) { return part && part[0] ? part[0] : ""; }).join("");
        })
        .catch(function () { return chunk; });
    })).then(function (parts) { return parts.join(""); });
  }

  function translateToEnglish(text) {
    if (state.lang === "en") return Promise.resolve(text);
    var source = state.lang === "other" ? "auto" : state.lang;
    return googleTranslate(String(text).slice(0, 900), source, "en")
      .then(function (translated) { return translated && translated.length > 1 ? translated : text; })
      .catch(function () { return text; });
  }

  var translationCache = {};

  function translateToLang(text) {
    if (!text || state.lang === "en" || state.lang === "other") return Promise.resolve("");
    var key = state.lang + "|" + text.length + "|" + text.slice(0, 60);
    if (translationCache[key]) return Promise.resolve(translationCache[key]);
    return googleTranslate(text, "en", state.lang).then(function (translated) {
      if (translated && translated.length > 1) translationCache[key] = translated;
      return translated && translated.length > 1 ? translated : "";
    }).catch(function () { return ""; });
  }

  var LEGAL_PAGES = { disclaimer: 1, "terms conditions": 1, "privacy policy": 1 };

  function retrieve(question, preferredPage) {
    return loadKnowledge()
      .then(function () { return translateToEnglish(question); })
      .then(function (englishQuestion) {
        var queryTokens = tokenize(question + " " + englishQuestion + " " + state.pendingQuestion);
        if (!queryTokens.length) return { items: [], score: 0, query: englishQuestion };
        var preferred = normalizeText(preferredPage || "");

        var scored = state.knowledge.map(function (item) {
          var pageText = normalizeText(item.page);
          var haystack = normalizeText(item.page + " " + item.text);
          var score = 0;
          var pageHits = 0;
          var unique = {};
          queryTokens.forEach(function (token) {
            if (unique[token]) return;
            unique[token] = true;
            if (haystack.indexOf(token) !== -1) {
              score += token.length > 5 ? 2 : 1;
            }
            if (pageText.indexOf(token) !== -1) pageHits += 1;
          });

          // Pages whose own name matches the question are usually the best source.
          score += pageHits * 5;

          // An option chip knows which page is authoritative for that topic.
          if (preferred && pageText === preferred) score += 40;

          // Legal pages should only surface when the question is actually about them.
          if (LEGAL_PAGES[item.page] && pageHits === 0) score = 0;

          return { item: item, score: score };
        }).filter(function (row) { return row.score > 0; })
          .sort(function (a, b) { return b.score - a.score; });

        var top = scored.slice(0, 7);
        return {
          items: top.map(function (row) { return row.item; }),
          score: top.length ? top[0].score : 0,
          query: englishQuestion
        };
      });
  }

  function withTimeout(promise, ms, label) {
    return new Promise(function (resolve, reject) {
      var timer = setTimeout(function () { reject(new Error(label + " timed out")); }, ms);
      promise.then(function (value) {
        clearTimeout(timer);
        resolve(value);
      }, function (error) {
        clearTimeout(timer);
        reject(error);
      });
    });
  }

  function loadPuter() {
    if (window.puter && window.puter.ai) return Promise.resolve(window.puter);

    return new Promise(function (resolve, reject) {
      var existing = document.querySelector('script[data-puter-js]');
      var script = existing || document.createElement("script");
      var timer = setTimeout(function () { reject(new Error("Puter.js timed out")); }, 7000);

      function done() {
        clearTimeout(timer);
        if (window.puter && window.puter.ai) resolve(window.puter);
        else reject(new Error("Puter.js unavailable"));
      }

      script.addEventListener("load", done, { once: true });
      script.addEventListener("error", function () {
        clearTimeout(timer);
        reject(new Error("Puter.js failed to load"));
      }, { once: true });

      if (!existing) {
        script.src = "https://js.puter.com/v2/";
        script.async = true;
        script.setAttribute("data-puter-js", "true");
        document.head.appendChild(script);
      }
    });
  }

  function extractModelText(result) {
    if (!result) return "";
    if (typeof result === "string") return result;
    var content = result.message && result.message.content;
    if (typeof content === "string") return content;
    if (Array.isArray(content)) {
      return content.map(function (part) {
        return typeof part === "string" ? part : (part && part.text) || "";
      }).join("");
    }
    if (typeof result.text === "string") return result.text;
    return "";
  }

  function buildSystemPrompt() {
    return [
      "You are sobhi, the friendly customer-support assistant for Sobhakrita Fintech Solutions Private Limited, a loan facilitator in Chittoor, Andhra Pradesh.",
      "Answer ONLY from the WEBSITE CONTEXT below. Never invent or guess loan amounts, rates, fees, eligibility, policies, phone numbers or addresses.",
      "If the answer is not clearly present in the context, reply with exactly [NO_CONTEXT] and nothing else.",
      "If the context contains general or partial eligibility or document information, share it and say the lender confirms the final criteria. Do not claim information is missing when relevant context is present.",
      "Keep replies short, warm and practical, ideally under 100 words. Use simple sentences.",
      "Always reply in " + state.langName + ". If the customer wrote in another language, still reply in " + state.langName + ".",
      "Do not mention that you are an AI, that you use a context, or that you cannot browse. Do not give legal or financial advice. For final terms, ask the customer to confirm with the lender.",
      "Write the answer in your own words and do not add source labels. When useful, refer to a full page link such as https://www.sobhakritafintech.com/apply.html or https://www.sobhakritafintech.com/book-a-call.html."
    ].join(" ");
  }

  function askServer(question, context) {
    return withTimeout(fetch("/api/chat/ask", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        question: question,
        context: context,
        language: state.langName
      })
    }).then(function (response) {
      return response.json().catch(function () { return {}; }).then(function (body) {
        if (response.ok && body.ok && body.answer) return body.answer;
        var error = new Error(body.error || "Assistant unavailable");
        // The server was reachable, so use the site content next instead of
        // waiting on the slower browser model.
        error.assistantBusy = true;
        throw error;
      });
    }), 9000, "Assistant reply");
  }

  function askPuter(question, context) {
    return withTimeout(loadPuter().then(function (puter) {
      return puter.ai.chat([
        { role: "system", content: buildSystemPrompt() },
        { role: "user", content: "WEBSITE CONTEXT:\n" + context + "\n\nCUSTOMER QUESTION:\n" + question }
      ]);
    }), 12000, "Assistant reply").then(extractModelText);
  }

  function askModel(question, context) {
    return askServer(question, context).catch(function () {
      // Server down, rate-limited or timed out: try the keyless browser model
      // before falling back to the curated site content.
      return askPuter(question, context);
    });
  }

  function shorten(text, max) {
    if (text.length <= max) return text;
    var cut = text.slice(0, max);
    var end = Math.max(cut.lastIndexOf(". "), cut.lastIndexOf("! "), cut.lastIndexOf("? "));
    if (end > max * 0.55) return cut.slice(0, end + 1);
    return cut.replace(/\s+\S*$/, "") + "…";
  }

  var DOCS_PAGE = /document|kyc|paper/i;

  function localAnswer(retrieval) {
    var items = [];
    var seenPages = {};
    retrieval.items.forEach(function (item) {
      if (items.length >= 2 || seenPages[item.page]) return;
      seenPages[item.page] = true;
      items.push(item);
    });
    if (!items.length) return "";

    // If the question is about documents, make sure the documents summary is included.
    if (DOCS_PAGE.test(retrieval.query || "")) {
      var hasDocs = items.some(function (item) { return DOCS_PAGE.test(item.page); });
      if (!hasDocs) {
        var docs = retrieval.items.find(function (item) {
          return DOCS_PAGE.test(item.page) && !seenPages[item.page];
        });
        if (docs) items.push(docs);
      }
    }

    return items.map(function (item) {
      return shorten(item.text, 600);
    }).join("\n\n");
  }

  function sendQuery(question, displayText, preferredPage) {
    if (state.busy) return;

    state.busy = true;
    state.awaitingEscalation = false;
    state.pendingQuestion = question;
    state.stage = "chat";
    addMessage("user", displayText || question);
    var typing = showTyping();

    retrieve(question, preferredPage).then(function (retrieval) {
      var context;
      if (retrieval.items.length && retrieval.score >= 2) {
        context = retrieval.items.map(function (item) {
          return "[" + item.page + "] " + item.text;
        }).join("\n\n");
      } else {
        // Even when keyword matching is weak (for example a question typed in
        // another script), still let the assistant use the core site facts so
        // it can answer simple questions in any language.
        context = FALLBACK_KB.map(function (item) {
          return "[" + item.page + "] " + item.text;
        }).join("\n\n");
      }

      return askModel(question, context)
        .then(function (answer) {
          typing.remove();
          state.busy = false;
          answer = String(answer || "").trim();
          if (!answer || /\[NO_CONTEXT\]/i.test(answer)) {
            noContext(question);
            return;
          }
          addMessage("assistant", answer);
          showOptions();
        })
        .catch(function () {
          var fallback = localAnswer(retrieval);
          if (!fallback) {
            typing.remove();
            state.busy = false;
            noContext(question);
            return;
          }
          // Model unavailable: share the site content in the chosen language.
          translateToLang(fallback).then(function (translated) {
            typing.remove();
            state.busy = false;
            addMessage("assistant", translated || (localIntro() + "\n" + fallback));
            showOptions();
          });
        });
    }).catch(function () {
      typing.remove();
      state.busy = false;
      noContext(question);
    });
  }

  function noContext(question) {
    state.awaitingEscalation = true;
    state.pendingQuestion = question || state.pendingQuestion;
    addMessage("assistant", t("noContext") + "\n" + t("askSubmit"));
    showChips([
      {
        label: t("yes"),
        force: true,
        onClick: function () { startEscalation(t("formIntro")); }
      },
      {
        label: t("no"),
        force: true,
        onClick: function () {
          state.awaitingEscalation = false;
          addMessage("assistant", t("choose"));
          showOptions();
        }
      }
    ]);
  }

  function startEscalation(intro) {
    if (state.busy) return;
    state.stage = "form";
    state.awaitingEscalation = false;
    clearChips();
    addMessage("assistant", intro || t("formIntro"));
    showLeadForm();
  }

  function fieldRow(labelText, name, type, required, value) {
    var wrap = document.createElement("label");
    wrap.className = "sobhi-field";
    var label = document.createElement("span");
    label.textContent = labelText + (required ? " *" : "");
    var field = document.createElement(type === "textarea" ? "textarea" : "input");
    field.name = name;
    field.required = !!required;
    if (type !== "textarea") field.type = type;
    if (type === "tel") field.inputMode = "tel";
    if (type === "email") field.autocomplete = "email";
    if (type === "tel") field.autocomplete = "tel";
    if (type === "text") field.autocomplete = "name";
    if (value) field.value = value;
    if (type === "textarea") field.rows = 3;
    wrap.appendChild(label);
    wrap.appendChild(field);
    return wrap;
  }

  function showLeadForm() {
    var leadForm = document.createElement("form");
    leadForm.className = "sobhi-lead";
    leadForm.noValidate = true;

    leadForm.appendChild(fieldRow(t("name"), "name", "text", true, ""));
    leadForm.appendChild(fieldRow(t("phone"), "phone", "tel", true, ""));
    leadForm.appendChild(fieldRow(t("email"), "email", "email", false, ""));
    leadForm.appendChild(fieldRow(t("question"), "question", "textarea", true, state.pendingQuestion || ""));

    var honeypot = document.createElement("input");
    honeypot.type = "text";
    honeypot.name = "company_website";
    honeypot.className = "sobhi-honeypot";
    honeypot.tabIndex = -1;
    honeypot.autocomplete = "off";
    leadForm.appendChild(honeypot);

    var error = document.createElement("p");
    error.className = "sobhi-form-error";
    error.setAttribute("role", "alert");
    leadForm.appendChild(error);

    var submit = document.createElement("button");
    submit.type = "submit";
    submit.className = "btn btn-primary btn-block sobhi-submit";
    submit.textContent = t("submit");
    leadForm.appendChild(submit);

    leadForm.addEventListener("submit", function (event) {
      event.preventDefault();
      error.textContent = "";

      var data = {
        name: leadForm.elements.name.value.trim(),
        phone: leadForm.elements.phone.value.trim(),
        email: leadForm.elements.email.value.trim(),
        question: leadForm.elements.question.value.trim(),
        language: state.langName,
        page: window.location.pathname,
        transcript: state.history.slice(-20),
        company_website: leadForm.elements.company_website.value
      };

      var digits = data.phone.replace(/\D/g, "");
      if (data.name.length < 2 || digits.length < 10 || digits.length > 15 || data.question.length < 3 ||
          (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email))) {
        error.textContent = t("invalid");
        return;
      }

      submit.disabled = true;
      submit.textContent = t("sending");

      postLead(data).then(function () {
        leadForm.remove();
        addMessage("assistant", t("success"));
        state.stage = "chat";
        state.pendingQuestion = "";
        showOptions();
      }).catch(function (err) {
        submit.disabled = false;
        submit.textContent = t("submit");
        error.textContent = err && err.message ? err.message : t("failure");
        addMessage("assistant", t("failure"));
      });
    });

    messagesEl.appendChild(leadForm);
    scrollToBottom();
    var first = leadForm.querySelector("input[name='name']");
    if (first) first.focus({ preventScroll: true });
  }

  function sendViaFormSubmit(payload) {
    return fetch("https://formsubmit.co/ajax/services@sobhakrita.com", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        _subject: "sobhi chat query from " + payload.name,
        _template: "table",
        _captcha: "false",
        Name: payload.name,
        Phone: payload.phone,
        Email: payload.email || "Not provided",
        Language: payload.language,
        Page: payload.page,
        Question: payload.question,
        Transcript: payload.transcript.map(function (item) {
          return item.role + ": " + item.text;
        }).join("\n")
      })
    }).then(function (response) {
      return response.json().catch(function () { return {}; }).then(function (body) {
        if (!response.ok || body.success === "false" || body.success === false) {
          throw new Error("Email delivery is not configured yet.");
        }
        return body;
      });
    });
  }

  function postLead(payload) {
    return fetch("/api/chat/lead", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    }).then(function (response) {
      return response.json().catch(function () { return {}; }).then(function (body) {
        if (!response.ok || !body.ok) {
          throw new Error(body.error || "Server could not accept the query.");
        }
        if (body.emailSent === false) {
          // The query is saved on the server but the email relay failed.
          return sendViaFormSubmit(payload).catch(function () { return body; });
        }
        return body;
      });
    }).catch(function () {
      // Static hosting fallback: FormSubmit delivers the same details by email.
      return sendViaFormSubmit(payload);
    });
  }

  function boot() {
    if (state.booted) return;
    state.booted = true;
    loadKnowledge();
    addMessage("assistant", "Namaste! 🙏 I'm sobhi, Sobhakrita's virtual assistant.");
    addMessage("assistant", UI.en.langPrompt);
    renderLanguageChips();
  }

  function openChat() {
    panel.hidden = false;
    root.classList.add("is-open");
    if (launcher) {
      launcher.setAttribute("aria-expanded", "true");
      launcher.classList.add("is-active");
    }
    boot();
    setTimeout(function () { input.focus({ preventScroll: true }); }, 120);
  }

  function closeChat() {
    panel.hidden = true;
    root.classList.remove("is-open");
    if (launcher) {
      launcher.setAttribute("aria-expanded", "false");
      launcher.classList.remove("is-active");
      launcher.focus({ preventScroll: true });
    }
  }

  function toggleChat() {
    if (panel.hidden) openChat();
    else closeChat();
  }

  if (launcher) {
    launcher.setAttribute("aria-expanded", "false");
    launcher.addEventListener("click", toggleChat);
  }
  if (closeBtn) closeBtn.addEventListener("click", closeChat);
  if (langBtn) {
    langBtn.addEventListener("click", function () {
      state.stage = "language";
      state.awaitingEscalation = false;
      clearChips();
      addMessage("assistant", UI.en.langPrompt);
      renderLanguageChips();
    });
  }

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && !panel.hidden) closeChat();
  });

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    var value = input.value.trim();
    if (!value) return;
    input.value = "";

    if (state.stage === "language") {
      var match = LANGUAGES.filter(function (lang) {
        return lang.name.toLowerCase() === value.toLowerCase() ||
          lang.native.toLowerCase() === value.toLowerCase() ||
          lang.code === value.toLowerCase();
      })[0];
      if (match) {
        selectLanguage(match);
      } else {
        state.lang = "other";
        state.langName = value;
        state.stage = "chat";
        root.setAttribute("lang", "other");
        addMessage("user", value);
        addMessage("assistant", UI.en.welcome.replace("English", value));
        addMessage("assistant", UI.en.choose);
        showOptions();
      }
      return;
    }

    if (state.stage === "language-other") {
      state.lang = "other";
      state.langName = value;
      state.stage = "chat";
      root.setAttribute("lang", "other");
      addMessage("user", value);
      addMessage("assistant", UI.en.welcome);
      addMessage("assistant", UI.en.choose);
      showOptions();
      return;
    }

    if (state.awaitingEscalation) {
      if (isYes(value)) {
        startEscalation(t("formIntro"));
        return;
      }
      if (isNo(value)) {
        addMessage("user", value);
        state.awaitingEscalation = false;
        addMessage("assistant", t("choose"));
        showOptions();
        return;
      }
    }

    if (state.stage === "form") {
      addMessage("assistant", t("formIntro"));
      return;
    }

    if (isGreeting(value) && state.lang === "en") {
      addMessage("user", value);
      addMessage("assistant", t("welcome"));
      showOptions();
      return;
    }

    sendQuery(value, value);
  });

  panel.hidden = true;
  root.setAttribute("data-sobhi-ready", "1");
})();

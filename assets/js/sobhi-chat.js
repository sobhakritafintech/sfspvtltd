/* ==========================================================================
   sobhi — simple website assistant for Sobhakrita Fintech Solutions
   - No API keys. Retrieval runs in the browser over the site FAQ and facts;
     free-form replies stream from /api/chat/ask with a fast local fallback.
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
  var micBtn = root.querySelector("[data-sobhi-mic]");
  var attachBtn = root.querySelector("[data-sobhi-attach]");
  var fileInput = root.querySelector("[data-sobhi-file-input]");
  var sendBtn = root.querySelector(".sobhi-send");
  var launcher = document.querySelector("[data-sobhi-toggle]");
  var closeBtn = root.querySelector("[data-sobhi-close]");
  var newChatBtn = root.querySelector("[data-sobhi-new-chat]");
  var langBtn = root.querySelector("[data-sobhi-lang]");
  var langLabel = root.querySelector("[data-sobhi-lang-label]");

  var state = {
    booted: false,
    busy: false,
    stage: "chat",
    lang: "en",
    langName: "English",
    history: [],
    pendingQuestion: "",
    awaitingEscalation: false,
    awaitingFeedback: false,
    awaitingClarification: false,
    awaitingMoreHelp: false,
    knowledge: [],
    knowledgePromise: null,
    knowledgePromises: {},
    knowledgeLang: "en",
    lastQuestion: "",
    lastMatchPage: "",
    lastWasTyped: false,
    translateCode: "",
    langPicked: false,
    requestId: 0,
    restoring: false,
    mediaRecorder: null,
    audioPlayer: null,
    audioObjectUrl: "",
    audioText: "",
    audioButton: null,
    recordingStream: null,
    recordingTimer: null,
    recordingStartedAt: 0,
    voiceSubmitRequested: false,
    recordingStatus: null,
    recordingRequestId: 0
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
    { key: "eligibility", page: "eligibility", query: "What are the basic eligibility criteria for a loan?" },
    { key: "documents", page: "documents", query: "What documents do I need to apply?" },
    { key: "fees", page: "fees", query: "What fees and charges does Sobhakrita charge? Are there any hidden charges?" },
    { key: "emi", page: "emi calculator", query: "How do EMI, tenure, repayment and prepayment work?" },
    { key: "apply", page: "apply", query: "How do I apply online?" },
    { key: "book", page: "book-a-call", query: "How do I book a free call?" },
    { key: "advisor", query: "Can I talk to a real person?" },
    { key: "other", query: "" }
  ];

  var UI = {
    en: {
      langPrompt: "Please choose your language.",
      welcome: "Hi there! 👋 I'm Sobhi, your virtual assistant from Sobhakrita Fintech Solutions. I'm here to help you explore our loan services, understand application requirements, and find answers to your questions. How can I help you today?",
      choose: "Choose an option below or type your question.",
      opts: ["Loan information", "Eligibility", "Documents", "Fees & charges", "EMI & repayment", "Apply for a loan", "Book a call"],
      noContext: "I'm sorry, I don't have that information in the website content.",
      offTopic: "I can help with questions about Sobhakrita's loan services — eligibility, documents, fees, EMI, applications and contact details. Please choose an option below or ask about one of these topics.",
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
      success: "Thanks! We’ve received your query. Our team will acknowledge it within one working day (Mon–Sat, 9 AM–6 PM IST).",
      failure: "Sorry, a technical issue stopped us from submitting your query. Please try again, or email services@sobhakrita.com or call +91 88866 33119.",
      invalid: "Please check the highlighted details.",
      otherPrompt: "Please type the name of your language. I will reply in that language.",
      humanIntro: "Sure. Please share your details below and our advisor will call you."
    },
    te: {
      langPrompt: "దయచేసి మీ భాషను ఎంచుకోండి.",
      welcome: "సోభకృత ఫిన్‌టెక్‌కు స్వాగతం. నేను షోబీ. ఈరోజు మీకు ఎలా సహాయం చేయగలను?",
      choose: "క్రింద ఒక ఎంపికను ఎంచుకోండి లేదా మీ ప్రశ్నను టైప్ చేయండి.",
      opts: ["రుణ సమాచారం", "అర్హత", "పత్రాలు", "రుసుములు & ఛార్జీలు", "EMI & తిరిగి చెల్లింపు", "రుణానికి దరఖాస్తు", "కాల్ బుక్ చేయండి"],
      noContext: "క్షమించండి, వెబ్‌సైట్ సమాచారంలో ఆ వివరాలు నాకు లేవు.",
      offTopic: "సోభకృత రుణ సేవల గురించి — అర్హత, పత్రాలు, రుసుములు, EMI, దరఖాస్తులు మరియు సంప్రదింపు వివరాలు — నేను సహాయం చేయగలను. దయచేసి క్రింద ఒక ఎంపికను ఎంచుకోండి లేదా ఈ అంశాల గురించి అడగండి.",
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
      success: "ధన్యవాదాలు! మీ ప్రశ్న మాకు అందింది. మా బృందం ఒక పని దినంలో (సోమ–శని, ఉదయం 9–సాయంత్రం 6 IST) అందినట్లు తెలియజేస్తుంది.",
      failure: "క్షమించండి, సాంకేతిక సమస్య వల్ల మీ ప్రశ్నను పంపలేకపోయాము. మళ్లీ ప్రయత్నించండి లేదా services@sobhakrita.com కు ఇమెయిల్ చేయండి, లేక +91 88866 33119 కు కాల్ చేయండి.",
      invalid: "దయచేసి హైలైట్ చేసిన వివరాలను తనిఖీ చేయండి.",
      otherPrompt: "దయచేసి మీ భాష పేరును టైప్ చేయండి. నేను ఆ భాషలో సమాధానం ఇస్తాను.",
      humanIntro: "సరే. దయచేసి క్రింద మీ వివరాలను ఇవ్వండి, మా బృందం మీకు కాల్ చేస్తుంది."
    },
    hi: {
      langPrompt: "कृपया अपनी भाषा चुनें।",
      welcome: "सोभकृता फिनटेक में आपका स्वागत है। मैं शोबी हूँ। आज मैं आपकी कैसे मदद कर सकती हूँ?",
      choose: "नीचे एक विकल्प चुनें या अपना सवाल लिखें।",
      opts: ["ऋण की जानकारी", "पात्रता", "दस्तावेज़", "शुल्क और चार्ज", "EMI और पुनर्भुगतान", "ऋण के लिए आवेदन करें", "कॉल बुक करें"],
      noContext: "क्षमा करें, वेबसाइट की जानकारी में मुझे यह जानकारी नहीं मिली।",
      offTopic: "मैं सोभकृता की ऋण सेवाओं — पात्रता, दस्तावेज़, शुल्क, EMI, आवेदन और संपर्क विवरण — के बारे में मदद कर सकता हूँ। कृपया नीचे कोई विकल्प चुनें या इन विषयों में से कुछ पूछें।",
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
      success: "धन्यवाद! आपका सवाल हमें मिल गया है। हमारी टीम एक कार्यदिवस के भीतर (सोम–शनि, सुबह 9–शाम 6 IST) प्राप्ति की पुष्टि करेगी।",
      failure: "क्षमा करें, तकनीकी समस्या के कारण आपका सवाल भेजा नहीं जा सका। कृपया फिर से कोशिश करें या services@sobhakrita.com पर ईमेल करें अथवा +91 88866 33119 पर कॉल करें।",
      invalid: "कृपया चिह्नित जानकारी जाँचें।",
      otherPrompt: "कृपया अपनी भाषा का नाम लिखें। मैं उसी भाषा में जवाब दूँगी।",
      humanIntro: "ठीक है। कृपया नीचे अपनी जानकारी दें, हमारी टीम आपको कॉल करेगी।"
    },
    ta: {
      langPrompt: "உங்கள் மொழியைத் தேர்ந்தெடுக்கவும்.",
      welcome: "சோபகிருத ஃபின்டெக்கிற்கு வருக. நான் ஷோபி. இன்று நான் எப்படி உதவலாம்?",
      choose: "கீழே ஒரு விருப்பத்தைத் தேர்ந்தெடுக்கவும் அல்லது உங்கள் கேள்வியைத் தட்டச்சு செய்யவும்.",
      opts: ["கடன் தகவல்", "தகுதி", "ஆவணங்கள்", "கட்டணங்கள் & கட்டண விவரங்கள்", "EMI & திருப்பிச் செலுத்துதல்", "கடனுக்கு விண்ணப்பிக்கவும்", "அழைப்பை பதிவு செய்யவும்"],
      noContext: "மன்னிக்கவும், வலைத்தளத் தகவலில் அந்த விவரம் என்னிடம் இல்லை.",
      offTopic: "சோபகிருதாவின் கடன் சேவைகள் — தகுதி, ஆவணங்கள், கட்டணங்கள், EMI, விண்ணப்பங்கள் மற்றும் தொடர்பு விவரங்கள் — பற்றி நான் உதவ முடியும். கீழே ஒரு விருப்பத்தைத் தேர்ந்தெடுக்கவும் அல்லது இந்தத் தலைப்புகளில் ஏதாவது கேளுங்கள்.",
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
      success: "நன்றி! உங்கள் கேள்வி எங்களுக்கு கிடைத்தது. எங்கள் குழு ஒரு வேலை நாளுக்குள் (திங்கள்–சனி, காலை 9–மாலை 6 IST) பெற்றதை உறுதிப்படுத்தும்.",
      failure: "மன்னிக்கவும், தொழில்நுட்பக் கோளாறால் உங்கள் கேள்வியை அனுப்ப முடியவில்லை. மீண்டும் முயற்சிக்கவும் அல்லது services@sobhakrita.com க்கு மின்னஞ்சல் செய்யவும், அல்லது +91 88866 33119 க்கு அழைக்கவும்.",
      invalid: "குறிக்கப்பட்ட விவரங்களைச் சரிபார்க்கவும்.",
      otherPrompt: "உங்கள் மொழியின் பெயரைத் தட்டச்சு செய்யவும். அந்த மொழியில் பதிலளிப்பேன்.",
      humanIntro: "சரி. கீழே உங்கள் விவரங்களைப் பகிரவும், எங்கள் குழு உங்களை அழைக்கும்."
    },
    kn: {
      langPrompt: "ದಯವಿಟ್ಟು ನಿಮ್ಮ ಭಾಷೆಯನ್ನು ಆಯ್ಕೆಮಾಡಿ.",
      welcome: "ಸೋಭಕೃತ ಫಿನ್‌ಟೆಕ್‌ಗೆ ಸ್ವಾಗತ. ನಾನು ಶೋಬಿ. ಇಂದು ನಾನು ನಿಮಗೆ ಹೇಗೆ ಸಹಾಯ ಮಾಡಬಹುದು?",
      choose: "ಕೆಳಗಿನ ಆಯ್ಕೆಯನ್ನು ಆರಿಸಿ ಅಥವಾ ನಿಮ್ಮ ಪ್ರಶ್ನೆಯನ್ನು ಟೈಪ್ ಮಾಡಿ.",
      opts: ["ಸಾಲದ ಮಾಹಿತಿ", "ಅರ್ಹತೆ", "ದಾಖಲೆಗಳು", "ಶುಲ್ಕ ಮತ್ತು ಶುಲ್ಕಗಳು", "EMI ಮತ್ತು ಮರುಪಾವತಿ", "ಸಾಲಕ್ಕೆ ಅರ್ಜಿ ಸಲ್ಲಿಸಿ", "ಕರೆ ಬುಕ್ ಮಾಡಿ"],
      noContext: "ಕ್ಷಮಿಸಿ, ವೆಬ್‌ಸೈಟ್ ಮಾಹಿತಿಯಲ್ಲಿ ಆ ವಿವರ ನನಗೆ ಇಲ್ಲ.",
      offTopic: "ಸೋಭಕೃತದ ಸಾಲ ಸೇವೆಗಳು — ಅರ್ಹತೆ, ದಾಖಲೆಗಳು, ಶುಲ್ಕಗಳು, EMI, ಅರ್ಜಿಗಳು ಮತ್ತು ಸಂಪರ್ಕ ವಿವರಗಳು — ಬಗ್ಗೆ ನಾನು ಸಹಾಯ ಮಾಡಬಲ್ಲೆ. ದಯವಿಟ್ಟು ಕೆಳಗೆ ಒಂದು ಆಯ್ಕೆಯನ್ನು ಆರಿಸಿ ಅಥವಾ ಈ ವಿಷಯಗಳ ಬಗ್ಗೆ ಕೇಳಿ.",
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
      success: "ಧನ್ಯವಾದಗಳು! ನಿಮ್ಮ ಪ್ರಶ್ನೆ ನಮಗೆ ತಲುಪಿದೆ. ನಮ್ಮ ತಂಡ ಒಂದು ಕೆಲಸದ ದಿನದೊಳಗೆ (ಸೋಮ–ಶನಿ, ಬೆಳಿಗ್ಗೆ 9–ಸಂಜೆ 6 IST) ಸ್ವೀಕೃತಿಯನ್ನು ದೃಢೀಕರಿಸುತ್ತದೆ.",
      failure: "ಕ್ಷಮಿಸಿ, ತಾಂತ್ರಿಕ ಸಮಸ್ಯೆಯಿಂದ ನಿಮ್ಮ ಪ್ರಶ್ನೆಯನ್ನು ಸಲ್ಲಿಸಲಾಗಲಿಲ್ಲ. ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ ಅಥವಾ services@sobhakrita.com ಗೆ ಇಮೇಲ್ ಮಾಡಿ, ಇಲ್ಲವೇ +91 88866 33119 ಗೆ ಕರೆ ಮಾಡಿ.",
      invalid: "ದಯವಿಟ್ಟು ಗುರುತಿಸಿದ ವಿವರಗಳನ್ನು ಪರಿಶೀಲಿಸಿ.",
      otherPrompt: "ದಯವಿಟ್ಟು ನಿಮ್ಮ ಭಾಷೆಯ ಹೆಸರನ್ನು ಟೈಪ್ ಮಾಡಿ. ನಾನು ಆ ಭಾಷೆಯಲ್ಲಿ ಉತ್ತರಿಸುತ್ತೇನೆ.",
      humanIntro: "ಸರಿ. ದಯವಿಟ್ಟು ಕೆಳಗೆ ನಿಮ್ಮ ವಿವರಗಳನ್ನು ನೀಡಿ, ನಮ್ಮ ತಂಡ ನಿಮಗೆ ಕರೆ ಮಾಡುತ್ತದೆ."
    },
    ml: {
      langPrompt: "ദയവായി നിങ്ങളുടെ ഭാഷ തിരഞ്ഞെടുക്കുക.",
      welcome: "സോഭകൃത ഫിൻടെക്കിലേക്ക് സ്വാഗതം. ഞാൻ ഷോബി. ഇന്ന് ഞാൻ നിങ്ങളെ എങ്ങനെ സഹായിക്കാം?",
      choose: "ചുവടെയുള്ള ഒരു ഓപ്ഷൻ തിരഞ്ഞെടുക്കുക അല്ലെങ്കിൽ നിങ്ങളുടെ ചോദ്യം ടൈപ്പ് ചെയ്യുക.",
      opts: ["വായ്പ വിവരങ്ങൾ", "യോഗ്യത", "രേഖകൾ", "ഫീസുകളും ചാർജുകളും", "EMIയും തിരിച്ചടവും", "വായ്പയ്ക്ക് അപേക്ഷിക്കുക", "കോൾ ബുക്ക് ചെയ്യുക"],
      noContext: "ക്ഷമിക്കണം, വെബ്സൈറ്റ് വിവരങ്ങളിൽ ആ വിവരം എനിക്കില്ല.",
      offTopic: "സോഭകൃതയുടെ വായ്പാ സേവനങ്ങൾ — യോഗ്യത, രേഖകൾ, ഫീസ്, EMI, അപേക്ഷകൾ, ബന്ധപ്പെടാനുള്ള വിവരങ്ങൾ — എന്നിവയെക്കുറിച്ച് എനിക്ക് സഹായിക്കാം. താഴെ ഒരു ഓപ്ഷൻ തിരഞ്ഞെടുക്കുകയോ ഈ വിഷയങ്ങളിൽ എന്തെങ്കിലും ചോദിക്കുകയോ ചെയ്യുക.",
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
      success: "നന്ദി! നിങ്ങളുടെ ചോദ്യം ഞങ്ങൾക്ക് ലഭിച്ചു. ഒരു പ്രവൃത്തി ദിവസത്തിനുള്ളിൽ (തിങ്കൾ–ശനി, രാവിലെ 9–വൈകിട്ട് 6 IST) ഞങ്ങളുടെ ടീം ലഭിച്ചതായി അറിയിക്കും.",
      failure: "ക്ഷമിക്കണം, സാങ്കേതിക പ്രശ്നം കാരണം നിങ്ങളുടെ ചോദ്യം സമർപ്പിക്കാനായില്ല. വീണ്ടും ശ്രമിക്കുക, അല്ലെങ്കിൽ services@sobhakrita.com-ലേക്ക് ഇമെയിൽ ചെയ്യുക അല്ലെങ്കിൽ +91 88866 33119-ൽ വിളിക്കുക.",
      invalid: "ദയവായി അടയാളപ്പെടുത്തിയ വിവരങ്ങൾ പരിശോധിക്കുക.",
      otherPrompt: "ദയവായി നിങ്ങളുടെ ഭാഷയുടെ പേര് ടൈപ്പ് ചെയ്യുക. ഞാൻ ആ ഭാഷയിൽ മറുപടി നൽകും.",
      humanIntro: "ശരി. ദയവായി താഴെ നിങ്ങളുടെ വിവരങ്ങൾ നൽകുക, ഞങ്ങളുടെ ടീം നിങ്ങളെ വിളിക്കും."
    },
    mr: {
      langPrompt: "कृपया तुमची भाषा निवडा.",
      welcome: "सोभकृता फिनटेकमध्ये आपले स्वागत आहे. मी शोबी आहे. आज मी आपली कशी मदत करू शकते?",
      choose: "खालील पर्याय निवडा किंवा तुमचा प्रश्न टाइप करा.",
      opts: ["कर्जाची माहिती", "पात्रता", "कागदपत्रे", "शुल्क आणि शुल्के", "EMI आणि परतफेड", "कर्जासाठी अर्ज करा", "कॉल बुक करा"],
      noContext: "क्षमस्व, वेबसाइटच्या माहितीत मला ही माहिती मिळाली नाही.",
      offTopic: "मी सोभकृताच्या कर्ज सेवा — पात्रता, कागदपत्रे, शुल्क, EMI, अर्ज आणि संपर्क तपशील — याबद्दल मदत करू शकतो. कृपया खालील पर्याय निवडा किंवा यापैकी काही विचारा.",
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
      success: "धन्यवाद! तुमचा प्रश्न आम्हाला मिळाला आहे. आमची टीम एका कामकाजाच्या दिवसात (सोम–शनि, सकाळी 9–संध्याकाळी 6 IST) पोहोचल्याची पुष्टी करेल.",
      failure: "क्षमस्व, तांत्रिक समस्येमुळे तुमचा प्रश्न पाठवता आला नाही. पुन्हा प्रयत्न करा किंवा services@sobhakrita.com वर ईमेल करा अथवा +91 88866 33119 वर कॉल करा.",
      invalid: "कृपया चिन्हांकित माहिती तपासा.",
      otherPrompt: "कृपया तुमच्या भाषेचे नाव टाइप करा. मी त्या भाषेत उत्तर देईन.",
      humanIntro: "ठीक आहे. कृपया खाली तुमची माहिती द्या, आमची टीम तुम्हाला कॉल करेल."
    },
    bn: {
      langPrompt: "অনুগ্রহ করে আপনার ভাষা বেছে নিন।",
      welcome: "সোভাকৃতা ফিনটেকে স্বাগতম। আমি শোভী। আজ আমি আপনাকে কীভাবে সাহায্য করতে পারি?",
      choose: "নিচে একটি বিকল্প বেছে নিন বা আপনার প্রশ্ন টাইপ করুন।",
      opts: ["ঋণের তথ্য", "যোগ্যতা", "নথিপত্র", "ফি ও চার্জ", "EMI ও পরিশোধ", "ঋণের জন্য আবেদন করুন", "কল বুক করুন"],
      noContext: "দুঃখিত, ওয়েবসাইটের তথ্যে আমার কাছে সেই তথ্য নেই।",
      offTopic: "আমি সোভাকৃতার ঋণ পরিষেবা — যোগ্যতা, নথি, ফি, EMI, আবেদন এবং যোগাযোগের বিবরণ — সম্পর্কে সাহায্য করতে পারি। অনুগ্রহ করে নিচে একটি বিকল্প বেছে নিন বা এই বিষয়গুলোর মধ্যে কিছু জিজ্ঞাসা করুন।",
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
      success: "ধন্যবাদ! আপনার প্রশ্ন আমরা পেয়েছি। আমাদের টিম এক কর্মদিবসের মধ্যে (সোম–শনি, সকাল ৯টা–সন্ধ্যা ৬টা IST) প্রাপ্তি নিশ্চিত করবে।",
      failure: "দুঃখিত, প্রযুক্তিগত সমস্যার কারণে আপনার প্রশ্নটি জমা দেওয়া যায়নি। আবার চেষ্টা করুন, অথবা services@sobhakrita.com এ ইমেল করুন বা +91 88866 33119 এ কল করুন।",
      invalid: "অনুগ্রহ করে চিহ্নিত তথ্য পরীক্ষা করুন।",
      otherPrompt: "অনুগ্রহ করে আপনার ভাষার নাম টাইপ করুন। আমি সেই ভাষায় উত্তর দেব।",
      humanIntro: "ঠিক আছে। অনুগ্রহ করে নিচে আপনার তথ্য দিন, আমাদের টিম আপনাকে কল করবে।"
    },
    gu: {
      langPrompt: "કૃપા કરીને તમારી ભાષા પસંદ કરો.",
      welcome: "સોભકૃતા ફિનટેકમાં આપનું સ્વાગત છે. હું શોબી છું. આજે હું તમને કેવી રીતે મદદ કરી શકું?",
      choose: "નીચેનો વિકલ્પ પસંદ કરો અથવા તમારો પ્રશ્ન લખો.",
      opts: ["લોન માહિતી", "પાત્રતા", "દસ્તાવેજો", "ફી અને ચાર્જ", "EMI અને ચુકવણી", "લોન માટે અરજી કરો", "કૉલ બુક કરો"],
      noContext: "માફ કરશો, વેબસાઇટની માહિતીમાં મને આ માહિતી મળી નથી.",
      offTopic: "હું સોભકૃતાની લોન સેવાઓ — પાત્રતા, દસ્તાવેજો, ફી, EMI, અરજીઓ અને સંપર્ક વિગતો — વિશે મદદ કરી શકું છું. કૃપા કરીને નીચે એક વિકલ્પ પસંદ કરો અથવા આ વિષયોમાંથી કંઈક પૂછો.",
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
      success: "આભાર! અમને તમારો પ્રશ્ન મળી ગયો છે. અમારી ટીમ એક કામકાજના દિવસમાં (સોમ–શનિ, સવારે 9થી સાંજે 6 IST) મળ્યાની પુષ્ટિ કરશે.",
      failure: "માફ કરશો, તકનીકી સમસ્યાને કારણે તમારો પ્રશ્ન મોકલી શકાયો નથી. ફરી પ્રયાસ કરો અથવા services@sobhakrita.com પર ઇમેઇલ કરો, અથવા +91 88866 33119 પર કૉલ કરો.",
      invalid: "કૃપા કરીને ચિહ્નિત માહિતી તપાસો.",
      otherPrompt: "કૃપા કરીને તમારી ભાષાનું નામ લખો. હું તે ભાષામાં જવાબ આપીશ.",
      humanIntro: "ઠીક છે. કૃપા કરીને નીચે તમારી માહિતી આપો, અમારી ટીમ તમને કૉલ કરશે."
    },
    pa: {
      langPrompt: "ਕਿਰਪਾ ਕਰਕੇ ਆਪਣੀ ਭਾਸ਼ਾ ਚੁਣੋ।",
      welcome: "ਸੋਭਕ੍ਰਿਤਾ ਫਿਨਟੈਕ ਵਿੱਚ ਤੁਹਾਡਾ ਸਵਾਗਤ ਹੈ। ਮੈਂ ਸ਼ੋਬੀ ਹਾਂ। ਅੱਜ ਮੈਂ ਤੁਹਾਡੀ ਕਿਵੇਂ ਮਦਦ ਕਰ ਸਕਦੀ ਹਾਂ?",
      choose: "ਹੇਠਾਂ ਇੱਕ ਵਿਕਲਪ ਚੁਣੋ ਜਾਂ ਆਪਣਾ ਸਵਾਲ ਲਿਖੋ।",
      opts: ["ਕਰਜ਼ੇ ਦੀ ਜਾਣਕਾਰੀ", "ਯੋਗਤਾ", "ਦਸਤਾਵੇਜ਼", "ਫੀਸ ਅਤੇ ਚਾਰਜ", "EMI ਅਤੇ ਭੁਗਤਾਨ", "ਕਰਜ਼ੇ ਲਈ ਅਰਜ਼ੀ ਦਿਓ", "ਕਾਲ ਬੁੱਕ ਕਰੋ"],
      noContext: "ਮਾਫ਼ ਕਰਨਾ, ਵੈੱਬਸਾਈਟ ਦੀ ਜਾਣਕਾਰੀ ਵਿੱਚ ਮੈਨੂੰ ਇਹ ਜਾਣਕਾਰੀ ਨਹੀਂ ਮਿਲੀ।",
      offTopic: "ਮੈਂ ਸੋਭਕ੍ਰਿਤਾ ਦੀਆਂ ਕਰਜ਼ਾ ਸੇਵਾਵਾਂ — ਯੋਗਤਾ, ਦਸਤਾਵੇਜ਼, ਫੀਸ, EMI, ਅਰਜ਼ੀਆਂ ਅਤੇ ਸੰਪਰਕ ਵੇਰਵੇ — ਬਾਰੇ ਮਦਦ ਕਰ ਸਕਦਾ ਹਾਂ। ਕਿਰਪਾ ਕਰਕੇ ਹੇਠਾਂ ਇੱਕ ਵਿਕਲਪ ਚੁਣੋ ਜਾਂ ਇਨ੍ਹਾਂ ਵਿਸ਼ਿਆਂ ਵਿੱਚੋਂ ਕੁਝ ਪੁੱਛੋ।",
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
      success: "ਧੰਨਵਾਦ! ਸਾਨੂੰ ਤੁਹਾਡਾ ਸਵਾਲ ਮਿਲ ਗਿਆ ਹੈ। ਸਾਡੀ ਟੀਮ ਇੱਕ ਕੰਮਕਾਜੀ ਦਿਨ ਦੇ ਅੰਦਰ (ਸੋਮ–ਸ਼ਨੀ, ਸਵੇਰੇ 9–ਸ਼ਾਮ 6 IST) ਪ੍ਰਾਪਤੀ ਦੀ ਪੁਸ਼ਟੀ ਕਰੇਗੀ।",
      failure: "ਮਾਫ਼ ਕਰਨਾ, ਤਕਨੀਕੀ ਸਮੱਸਿਆ ਕਰਕੇ ਤੁਹਾਡਾ ਸਵਾਲ ਜਮ੍ਹਾਂ ਨਹੀਂ ਹੋ ਸਕਿਆ। ਮੁੜ ਕੋਸ਼ਿਸ਼ ਕਰੋ ਜਾਂ services@sobhakrita.com 'ਤੇ ਈਮੇਲ ਕਰੋ, ਜਾਂ +91 88866 33119 'ਤੇ ਕਾਲ ਕਰੋ।",
      invalid: "ਕਿਰਪਾ ਕਰਕੇ ਨਿਸ਼ਾਨ ਲੱਗੀ ਜਾਣਕਾਰੀ ਦੀ ਜਾਂਚ ਕਰੋ।",
      otherPrompt: "ਕਿਰਪਾ ਕਰਕੇ ਆਪਣੀ ਭਾਸ਼ਾ ਦਾ ਨਾਮ ਲਿਖੋ। ਮੈਂ ਉਸ ਭਾਸ਼ਾ ਵਿੱਚ ਜਵਾਬ ਦਿਆਂਗੀ।",
      humanIntro: "ਠੀਕ ਹੈ। ਕਿਰਪਾ ਕਰਕੇ ਹੇਠਾਂ ਆਪਣੀ ਜਾਣਕਾਰੀ ਦਿਓ, ਸਾਡੀ ਟੀਮ ਤੁਹਾਨੂੰ ਕਾਲ ਕਰੇਗੀ।"
    },
    or: {
      langPrompt: "ଦୟାକରି ଆପଣଙ୍କ ଭାଷା ବାଛନ୍ତୁ।",
      welcome: "ସୋଭକୃତା ଫିନଟେକକୁ ସ୍ୱାଗତ। ମୁଁ ଶୋବୀ। ଆଜି ମୁଁ ଆପଣଙ୍କୁ କିପରି ସାହାଯ୍ୟ କରିପାରିବି?",
      choose: "ତଳେ ଏକ ବିକଳ୍ପ ବାଛନ୍ତୁ କିମ୍ବା ଆପଣଙ୍କ ପ୍ରଶ୍ନ ଲେଖନ୍ତୁ।",
      opts: ["ଋଣ ସୂଚନା", "ଯୋଗ୍ୟତା", "ଦଲିଲ", "ଫି ଓ ଚାର୍ଜ", "EMI ଓ ପରିଶୋଧ", "ଋଣ ପାଇଁ ଆବେଦନ", "କଲ ବୁକ କରନ୍ତୁ"],
      noContext: "କ୍ଷମା କରନ୍ତୁ, ୱେବସାଇଟ ସୂଚନାରେ ମୋତେ ଏହି ତଥ୍ୟ ମିଳିଲା ନାହିଁ।",
      offTopic: "ମୁଁ ସୋଭକୃତାର ଋଣ ସେବା — ଯୋଗ୍ୟତା, ଦଲିଲ, ଫି, EMI, ଆବେଦନ ଏବଂ ଯୋଗାଯୋଗ ବିବରଣୀ — ବିଷୟରେ ସାହାଯ୍ୟ କରିପାରିବି। ଦୟାକରି ତଳେ ଏକ ବିକଳ୍ପ ବାଛନ୍ତୁ କିମ୍ବା ଏହି ବିଷୟଗୁଡ଼ିକ ମଧ୍ୟରୁ କିଛି ପଚାରନ୍ତୁ।",
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
      success: "ଧନ୍ୟବାଦ! ଆମେ ଆପଣଙ୍କ ପ୍ରଶ୍ନ ପାଇଛୁ। ଆମ ଦଳ ଗୋଟିଏ କାର୍ଯ୍ୟଦିବସ ମଧ୍ୟରେ (ସୋମ–ଶନି, ସକାଳ 9–ସନ୍ଧ୍ୟା 6 IST) ପ୍ରାପ୍ତି ନିଶ୍ଚିତ କରିବ।",
      failure: "ଦୁଃଖିତ, ବୈଷୟିକ ସମସ୍ୟା ଯୋଗୁଁ ଆପଣଙ୍କ ପ୍ରଶ୍ନ ଦାଖଲ ହୋଇପାରିଲା ନାହିଁ। ପୁଣି ଚେଷ୍ଟା କରନ୍ତୁ କିମ୍ବା services@sobhakrita.com କୁ ଇମେଲ କରନ୍ତୁ, ନଚେତ +91 88866 33119 କୁ କଲ କରନ୍ତୁ।",
      invalid: "ଦୟାକରି ଚିହ୍ନିତ ସୂଚନା ଯାଞ୍ଚ କରନ୍ତୁ।",
      otherPrompt: "ଦୟାକରି ଆପଣଙ୍କ ଭାଷାର ନାମ ଲେଖନ୍ତୁ। ମୁଁ ସେହି ଭାଷାରେ ଉତ୍ତର ଦେବି।",
      humanIntro: "ଠିକ୍ ଅଛି। ଦୟାକରି ତଳେ ଆପଣଙ୍କ ସୂଚନା ଦିଅନ୍ତୁ, ଆମ ଦଳ ଆପଣଙ୍କୁ କଲ କରିବ।"
    },
    ur: {
      langPrompt: "براہ کرم اپنی زبان منتخب کریں۔",
      welcome: "سوبھکریتا فنٹیک میں آپ کا خیر مقدم ہے۔ میں شوبی ہوں۔ آج میں آپ کی کیسے مدد کر سکتی ہوں؟",
      choose: "نیچے کوئی آپشن منتخب کریں یا اپنا سوال لکھیں۔",
      opts: ["قرض کی معلومات", "اہلیت", "دستاویزات", "فیس اور چارجز", "EMI اور ادائیگی", "قرض کے لیے درخواست دیں", "کال بک کریں"],
      noContext: "معاف کریں، ویب سائٹ کی معلومات میں مجھے یہ معلومات نہیں ملیں۔",
      offTopic: "میں سوبھکریتا کی قرضہ خدمات — اہلیت، دستاویزات، فیس، EMI، درخواستیں اور رابطہ تفصیلات — کے بارے میں مدد کر سکتا ہوں۔ براہ کرم نیچے کوئی آپشن منتخب کریں یا ان موضوعات میں سے کچھ پوچھیں۔",
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
      success: "شکریہ! ہمیں آپ کا سوال موصول ہو گیا ہے۔ ہماری ٹیم ایک کاروباری دن کے اندر (پیر تا ہفتہ، صبح 9 سے شام 6 بجے IST) وصولی کی تصدیق کرے گی۔",
      failure: "معذرت، تکنیکی مسئلے کی وجہ سے آپ کا سوال جمع نہیں ہو سکا۔ دوبارہ کوشش کریں، یا services@sobhakrita.com پر ای میل کریں یا +91 88866 33119 پر کال کریں۔",
      invalid: "براہ کرم نشان زدہ معلومات چیک کریں۔",
      otherPrompt: "براہ کرم اپنی زبان کا نام لکھیں۔ میں اسی زبان میں جواب دوں گی۔",
      humanIntro: "ٹھیک ہے۔ براہ کرم نیچے اپنی معلومات دیں، ہماری ٹیم آپ کو کال کرے گی۔"
    }
  };

  var FEEDBACK_COPY = {
    en: { prompt: "Did this answer your question?", thanks: "Thanks for letting me know.", clarify: "Tell me what I should clarify, or submit your question to our team.", addDetails: "Add more details", submitQuery: "Submit a query", sendOptions: "Thanks for sharing your query. Choose WhatsApp or email below to send it to our team.", moreHelpPrompt: "Is there anything else I can help you with?", goodbye: "Great! Thank you for reaching out to Sobhakrita. Have a nice day! 👋" },
    te: { prompt: "ఈ సమాధానం మీ ప్రశ్నకు సమాధానమిచ్చిందా?", thanks: "తెలియజేసినందుకు ధన్యవాదాలు.", clarify: "ఏమి వివరించాలో చెప్పండి లేదా మీ ప్రశ్నను మా బృందానికి పంపండి.", addDetails: "మరిన్ని వివరాలు జోడించండి", submitQuery: "ప్రశ్నను పంపండి", sendOptions: "మీ ప్రశ్నను పంచుకున్నందుకు ధన్యవాదాలు. మా బృందానికి పంపడానికి క్రింద WhatsApp లేదా ఇమెయిల్ ఎంచుకోండి.", moreHelpPrompt: "మీకు ఇంకా ఏదైనా సహాయం కావాలా?", goodbye: "బాగుంది! సోభకృతను సంప్రదించినందుకు ధన్యవాదాలు. మీకు శుభదినం! 👋" },
    hi: { prompt: "क्या इस जवाब से आपका सवाल हल हुआ?", thanks: "बताने के लिए धन्यवाद।", clarify: "बताएँ कि किस बात को स्पष्ट करना है, या अपना सवाल हमारी टीम को भेजें।", addDetails: "और जानकारी दें", submitQuery: "सवाल भेजें", sendOptions: "अपना सवाल साझा करने के लिए धन्यवाद। इसे हमारी टीम को भेजने के लिए नीचे WhatsApp या ईमेल चुनें।", moreHelpPrompt: "क्या आपको किसी और चीज़ में मदद चाहिए?", goodbye: "बहुत बढ़िया! सोभकृता से संपर्क करने के लिए धन्यवाद। आपका दिन शुभ हो! 👋" },
    ta: { prompt: "இந்தப் பதில் உங்கள் கேள்விக்கு உதவியதா?", thanks: "தெரிவித்ததற்கு நன்றி.", clarify: "எதைத் தெளிவுபடுத்த வேண்டும் என்று கூறுங்கள் அல்லது உங்கள் கேள்வியை எங்கள் குழுவுக்கு அனுப்புங்கள்.", addDetails: "மேலும் விவரங்களைச் சேர்க்கவும்", submitQuery: "கேள்வியை அனுப்பவும்", sendOptions: "உங்கள் கேள்வியைப் பகிர்ந்ததற்கு நன்றி. எங்கள் குழுவுக்கு அனுப்ப கீழே WhatsApp அல்லது மின்னஞ்சலைத் தேர்ந்தெடுக்கவும்.", moreHelpPrompt: "உங்களுக்கு வேறு ஏதாவது உதவி தேவையா?", goodbye: "நன்று! சோபகிருதாவைத் தொடர்பு கொண்டதற்கு நன்றி. உங்களுக்கு இனிய நாள்! 👋" },
    kn: { prompt: "ಈ ಉತ್ತರ ನಿಮ್ಮ ಪ್ರಶ್ನೆಗೆ ಉತ್ತರಿಸಿತೇ?", thanks: "ತಿಳಿಸಿದ್ದಕ್ಕಾಗಿ ಧನ್ಯವಾದಗಳು.", clarify: "ಏನನ್ನು ಸ್ಪಷ್ಟಪಡಿಸಬೇಕೆಂದು ತಿಳಿಸಿ ಅಥವಾ ನಿಮ್ಮ ಪ್ರಶ್ನೆಯನ್ನು ನಮ್ಮ ತಂಡಕ್ಕೆ ಕಳುಹಿಸಿ.", addDetails: "ಇನ್ನಷ್ಟು ವಿವರ ಸೇರಿಸಿ", submitQuery: "ಪ್ರಶ್ನೆ ಕಳುಹಿಸಿ", sendOptions: "ನಿಮ್ಮ ಪ್ರಶ್ನೆಯನ್ನು ಹಂಚಿಕೊಂಡಿದ್ದಕ್ಕೆ ಧನ್ಯವಾದಗಳು. ನಮ್ಮ ತಂಡಕ್ಕೆ ಕಳುಹಿಸಲು ಕೆಳಗೆ WhatsApp ಅಥವಾ ಇಮೇಲ್ ಆಯ್ಕೆಮಾಡಿ.", moreHelpPrompt: "ನಿಮಗೆ ಬೇರೆ ಏನಾದರೂ ಸಹಾಯ ಬೇಕೇ?", goodbye: "ಚೆನ್ನಾಗಿದೆ! ಸೋಭಕೃತವನ್ನು ಸಂಪರ್ಕಿಸಿದ್ದಕ್ಕಾಗಿ ಧನ್ಯವಾದಗಳು. ನಿಮಗೆ ಶುಭ ದಿನ! 👋" },
    ml: { prompt: "ഈ മറുപടി നിങ്ങളുടെ ചോദ്യത്തിന് ഉത്തരം നൽകിയോ?", thanks: "അറിയിച്ചതിന് നന്ദി.", clarify: "എന്താണ് വ്യക്തമാക്കേണ്ടതെന്ന് പറയുക, അല്ലെങ്കിൽ നിങ്ങളുടെ ചോദ്യം ഞങ്ങളുടെ ടീമിന് അയയ്ക്കുക.", addDetails: "കൂടുതൽ വിവരങ്ങൾ ചേർക്കുക", submitQuery: "ചോദ്യം അയയ്ക്കുക", sendOptions: "നിങ്ങളുടെ ചോദ്യം പങ്കുവെച്ചതിന് നന്ദി. ടീമിന് അയയ്ക്കാൻ താഴെ WhatsApp അല്ലെങ്കിൽ ഇമെയിൽ തിരഞ്ഞെടുക്കുക.", moreHelpPrompt: "നിങ്ങൾക്ക് മറ്റെന്തെങ്കിലും സഹായം വേണോ?", goodbye: "കൊള്ളാം! സോഭകൃതയെ ബന്ധപ്പെട്ടതിന് നന്ദി. നിങ്ങൾക്ക് ശുഭദിനം! 👋" },
    mr: { prompt: "या उत्तराने तुमच्या प्रश्नाचे समाधान झाले का?", thanks: "कळवल्याबद्दल धन्यवाद.", clarify: "काय स्पष्ट करायचे ते सांगा किंवा तुमचा प्रश्न आमच्या टीमला पाठवा.", addDetails: "अधिक माहिती जोडा", submitQuery: "प्रश्न पाठवा", sendOptions: "तुमचा प्रश्न शेअर केल्याबद्दल धन्यवाद. टीमला पाठवण्यासाठी खाली WhatsApp किंवा ईमेल निवडा.", moreHelpPrompt: "तुम्हाला अजून काही मदत हवी आहे का?", goodbye: "छान! सोभकृताशी संपर्क केल्याबद्दल धन्यवाद. तुमचा दिवस चांगला जावो! 👋" },
    bn: { prompt: "এই উত্তরটি কি আপনার প্রশ্নের সমাধান করেছে?", thanks: "জানানোর জন্য ধন্যবাদ।", clarify: "কোন বিষয়টি পরিষ্কার করা দরকার বলুন, অথবা আপনার প্রশ্নটি আমাদের টিমে পাঠান।", addDetails: "আরও তথ্য যোগ করুন", submitQuery: "প্রশ্ন পাঠান", sendOptions: "আপনার প্রশ্নটি শেয়ার করার জন্য ধন্যবাদ। টিমে পাঠাতে নিচে WhatsApp বা ইমেল বেছে নিন।", moreHelpPrompt: "আপনার আরও কিছু সাহায্যের প্রয়োজন আছে কি?", goodbye: "দারুণ! সোভাকৃতার সাথে যোগাযোগ করার জন্য ধন্যবাদ। আপনার দিন শুভ হোক! 👋" },
    gu: { prompt: "શું આ જવાબથી તમારા પ્રશ્નનો ઉકેલ આવ્યો?", thanks: "જણાવવા બદલ આભાર.", clarify: "શું સ્પષ્ટ કરવું તે જણાવો અથવા તમારો પ્રશ્ન અમારી ટીમને મોકલો.", addDetails: "વધુ વિગતો ઉમેરો", submitQuery: "પ્રશ્ન મોકલો", sendOptions: "તમારો પ્રશ્ન શેર કરવા બદલ આભાર. અમારી ટીમને મોકલવા માટે નીચે WhatsApp અથવા ઇમેઇલ પસંદ કરો.", moreHelpPrompt: "તમને બીજી કોઈ મદદની જરૂર છે?", goodbye: "સરસ! સોભકૃતાનો સંપર્ક કરવા બદલ આભાર. તમારો દિવસ શુભ રહે! 👋" },
    pa: { prompt: "ਕੀ ਇਸ ਜਵਾਬ ਨਾਲ ਤੁਹਾਡਾ ਸਵਾਲ ਹੱਲ ਹੋਇਆ?", thanks: "ਦੱਸਣ ਲਈ ਧੰਨਵਾਦ।", clarify: "ਦੱਸੋ ਕਿ ਕੀ ਸਪੱਸ਼ਟ ਕਰਨਾ ਹੈ ਜਾਂ ਆਪਣਾ ਸਵਾਲ ਸਾਡੀ ਟੀਮ ਨੂੰ ਭੇਜੋ।", addDetails: "ਹੋਰ ਜਾਣਕਾਰੀ ਦਿਓ", submitQuery: "ਸਵਾਲ ਭੇਜੋ", sendOptions: "ਆਪਣਾ ਸਵਾਲ ਸਾਂਝਾ ਕਰਨ ਲਈ ਧੰਨਵਾਦ। ਸਾਡੀ ਟੀਮ ਨੂੰ ਭੇਜਣ ਲਈ ਹੇਠਾਂ WhatsApp ਜਾਂ ਈਮੇਲ ਚੁਣੋ।", moreHelpPrompt: "ਕੀ ਤੁਹਾਨੂੰ ਹੋਰ ਕੋਈ ਮਦਦ ਚਾਹੀਦੀ ਹੈ?", goodbye: "ਵਧੀਆ! ਸੋਭਕ੍ਰਿਤਾ ਨਾਲ ਸੰਪਰਕ ਕਰਨ ਲਈ ਧੰਨਵਾਦ। ਤੁਹਾਡਾ ਦਿਨ ਸ਼ੁਭ ਹੋਵੇ! 👋" },
    or: { prompt: "ଏହି ଉତ୍ତର ଆପଣଙ୍କ ପ୍ରଶ୍ନର ସମାଧାନ କଲା କି?", thanks: "ଜଣାଇଥିବାରୁ ଧନ୍ୟବାଦ।", clarify: "କ’ଣ ସ୍ପଷ୍ଟ କରିବାକୁ ହେବ କୁହନ୍ତୁ କିମ୍ବା ଆପଣଙ୍କ ପ୍ରଶ୍ନ ଆମ ଦଳକୁ ପଠାନ୍ତୁ।", addDetails: "ଅଧିକ ବିବରଣୀ ଯୋଡ଼ନ୍ତୁ", submitQuery: "ପ୍ରଶ୍ନ ପଠାନ୍ତୁ", sendOptions: "ଆପଣଙ୍କ ପ୍ରଶ୍ନ ସେୟାର କରିଥିବାରୁ ଧନ୍ୟବାଦ। ଆମ ଦଳକୁ ପଠାଇବା ପାଇଁ ତଳେ WhatsApp କିମ୍ବା ଇମେଲ୍ ବାଛନ୍ତୁ।", moreHelpPrompt: "ଆପଣଙ୍କୁ ଆଉ କିଛି ସାହାଯ୍ୟ ଦରକାର କି?", goodbye: "ବହୁତ ଭଲ! ସୋଭକୃତା ସହ ଯୋଗାଯୋଗ କରିଥିବାରୁ ଧନ୍ୟବାଦ। ଆପଣଙ୍କ ଦିନ ଶୁଭ ହେଉ! 👋" },
    ur: { prompt: "کیا اس جواب سے آپ کا سوال حل ہوا؟", thanks: "بتانے کا شکریہ۔", clarify: "بتائیں کہ کیا واضح کرنا ہے، یا اپنا سوال ہماری ٹیم کو بھیجیں۔", addDetails: "مزید تفصیل شامل کریں", submitQuery: "سوال بھیجیں", sendOptions: "اپنا سوال شیئر کرنے کا شکریہ۔ ہماری ٹیم کو بھیجنے کے لیے نیچے WhatsApp یا ای میل منتخب کریں۔", moreHelpPrompt: "کیا آپ کو کسی اور چیز میں مدد چاہیے؟", goodbye: "بہت خوب! سوبھکریتا سے رابطہ کرنے کا شکریہ۔ آپ کا دن اچھا گزرے! 👋" }
  };

  function feedbackText(key) {
    var copy = FEEDBACK_COPY[state.lang] || FEEDBACK_COPY.en;
    return copy[key] || FEEDBACK_COPY.en[key];
  }

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

  var EXTRA_COPY = {
    en: { more: "Read more", less: "Show less", placeholder: "Type your message…", call: "Call", whatsapp: "WhatsApp", apply: "Apply" },
    te: { more: "మరిన్ని చూడండి", less: "తక్కువ చూడండి", placeholder: "మీ సందేశాన్ని టైప్ చేయండి…", call: "కాల్", whatsapp: "WhatsApp", apply: "దరఖాస్తు" },
    hi: { more: "और पढ़ें", less: "कम दिखाएँ", placeholder: "अपना संदेश लिखें…", call: "कॉल", whatsapp: "WhatsApp", apply: "आवेदन करें" },
    ta: { more: "மேலும் படிக்க", less: "குறைவாகக் காட்டு", placeholder: "உங்கள் செய்தியைத் தட்டச்சு செய்யவும்…", call: "அழைப்பு", whatsapp: "WhatsApp", apply: "விண்ணப்பிக்கவும்" },
    kn: { more: "ಇನ್ನಷ್ಟು ಓದಿ", less: "ಕಡಿಮೆ ತೋರಿಸಿ", placeholder: "ನಿಮ್ಮ ಸಂದೇಶವನ್ನು ಟೈಪ್ ಮಾಡಿ…", call: "ಕರೆ", whatsapp: "WhatsApp", apply: "ಅರ್ಜಿ ಸಲ್ಲಿಸಿ" },
    ml: { more: "കൂടുതൽ വായിക്കുക", less: "കുറച്ച് കാണിക്കുക", placeholder: "നിങ്ങളുടെ സന്ദേശം ടൈപ്പ് ചെയ്യുക…", call: "വിളിക്കുക", whatsapp: "WhatsApp", apply: "അപേക്ഷിക്കുക" },
    mr: { more: "अधिक वाचा", less: "कमी दाखवा", placeholder: "तुमचा संदेश टाइप करा…", call: "कॉल", whatsapp: "WhatsApp", apply: "अर्ज करा" },
    bn: { more: "আরও পড়ুন", less: "কম দেখান", placeholder: "আপনার বার্তা লিখুন…", call: "কল", whatsapp: "WhatsApp", apply: "আবেদন করুন" },
    gu: { more: "વધુ વાંચો", less: "ઓછું બતાવો", placeholder: "તમારો સંદેશ લખો…", call: "કૉલ", whatsapp: "WhatsApp", apply: "અરજી કરો" },
    pa: { more: "ਹੋਰ ਪੜ੍ਹੋ", less: "ਘੱਟ ਦਿਖਾਓ", placeholder: "ਆਪਣਾ ਸੁਨੇਹਾ ਲਿਖੋ…", call: "ਕਾਲ", whatsapp: "WhatsApp", apply: "ਅਰਜ਼ੀ ਦਿਓ" },
    or: { more: "ଅଧିକ ପଢ଼ନ୍ତୁ", less: "କମ୍ ଦେଖାନ୍ତୁ", placeholder: "ଆପଣଙ୍କ ସନ୍ଦେଶ ଲେଖନ୍ତୁ…", call: "କଲ", whatsapp: "WhatsApp", apply: "ଆବେଦନ କରନ୍ତୁ" },
    ur: { more: "مزید پڑھیں", less: "کم دکھائیں", placeholder: "اپنا پیغام لکھیں…", call: "کال", whatsapp: "WhatsApp", apply: "درخواست دیں" }
  };

  function copy(key) {
    var pack = EXTRA_COPY[state.lang] || EXTRA_COPY.en;
    return pack[key] || EXTRA_COPY.en[key];
  }

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

  var SESSION_KEY = "sobhi.session.v2";
  var ANSWER_CACHE_KEY = "sobhi.answers.v7";
  var ANSWER_TTL_MS = 30 * 60 * 1000;

  function hashText(value) {
    var text = String(value || "");
    var hash = 5381;
    for (var i = 0; i < text.length; i += 1) {
      hash = ((hash << 5) + hash + text.charCodeAt(i)) >>> 0;
    }
    return hash.toString(36) + "-" + text.length;
  }

  function saveSession() {
    if (state.restoring) return;
    try {
      window.sessionStorage.setItem(SESSION_KEY, JSON.stringify({
        lang: state.lang,
        langName: state.langName,
        translateCode: state.translateCode,
        history: state.history.slice(-30)
      }));
    } catch (error) { /* storage may be unavailable */ }
  }

  function readSession() {
    try {
      var raw = window.sessionStorage.getItem(SESSION_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (error) {
      return null;
    }
  }

  function translationCode() {
    if (state.lang === "en") return "en";
    if (state.lang === "other") return state.translateCode || "";
    return state.lang;
  }

  function answerCacheKey(question) {
    return (translationCode() || "en") + "|" + state.knowledgeLang + "|" + normalizeText(question);
  }

  function readCachedAnswer(question) {
    try {
      var raw = window.sessionStorage.getItem(ANSWER_CACHE_KEY);
      var map = raw ? JSON.parse(raw) : {};
      var entry = map[answerCacheKey(question)];
      if (!entry || Date.now() - entry.time > ANSWER_TTL_MS) return "";
      return entry.answer || "";
    } catch (error) {
      return "";
    }
  }

  function writeCachedAnswer(question, answer) {
    if (!answer) return;
    try {
      var raw = window.sessionStorage.getItem(ANSWER_CACHE_KEY);
      var map = raw ? JSON.parse(raw) : {};
      var keys = Object.keys(map);
      if (keys.length >= 40) delete map[keys[0]];
      map[answerCacheKey(question)] = { answer: answer, time: Date.now() };
      window.sessionStorage.setItem(ANSWER_CACHE_KEY, JSON.stringify(map));
    } catch (error) { /* ignore quota errors */ }
  }

  var FALLBACK_KB = [
    { page: "About", text: "Sobhakrita Fintech Solutions Private Limited is a loan facilitator and Direct Selling Agent based in Chittoor, Andhra Pradesh. It is not a bank or NBFC and does not lend in its own name. It helps customers compare loans from partner banks and RBI-regulated NBFCs." },
    { page: "Contact", text: "Sobhakrita office is at #20-90B/1, Naidu Buildings, Behind Dominos, Mittoor, Chittoor, Andhra Pradesh 517001. Phone +91 88866 33119 and +91 88866 33118. Email services@sobhakrita.com. Office hours are Monday to Saturday, 9:00 AM to 6:00 PM. Sunday closed." },
    { page: "Loans", text: "Sobhakrita offers personal loan from ₹50,000 to ₹50 lakh, business loan from ₹1 lakh to ₹75 lakh, home loan from ₹5 lakh to ₹2 crore, mortgage or loan against property from ₹5 lakh to ₹5 crore, car loan from ₹75,000 to ₹50 lakh, education loan from ₹50,000 to ₹75 lakh, agriculture loan from ₹50,000 to ₹50 lakh, and industrial or MSME loan from ₹2 lakh to ₹2 crore." },
    { page: "Fees", text: "Sobhakrita does not charge an application, consultation, file, advance fee or security deposit in its own name. A minimal service fee applies only after disbursal, with written consent, and is quoted in writing before documentation. Lender charges such as processing fee, legal or technical verification, stamp duty, CERSAI, insurance and statutory charges are separate and disclosed in the Key Fact Statement." },
    { page: "Process", text: "The usual process is: share the requirement, get a shortlist of suitable lenders, verify KYC and income documents once, review the sanction and Key Fact Statement, then receive funds from the lender. Personal and business loans may get an indicative decision in 48 to 72 working hours. Home and mortgage loans often take 7 to 15 working days." },
    { page: "Eligibility", text: "Indicative personal loan eligibility: age 21 to 60 years at application; salaried with at least 6 months in the current job, or self-employed with at least 2 years in business; minimum net monthly income of ₹15,000, which varies by lender and city; CIBIL score of 700+ preferred, with 650+ considered by select NBFCs; and existing EMIs within 40 to 50 percent of net income. Each partner lender sets its own final policy, and Sobhakrita matches your file to the lender most likely to approve it." },
    { page: "Documents", text: "Commonly requested documents include PAN, Aadhaar or other accepted identity/address proof, recent bank statements, income proof, employment or business proof and a photograph. Salaried applicants may be asked for recent salary slips and employment details. Self-employed applicants may be asked for business proof, ITR and financial records. The exact checklist depends on the loan and partner lender; we will confirm it before you submit documents. Share sensitive documents only through an authorised channel." },
    { page: "EMI", text: "The EMI calculator estimates monthly EMI, total interest and total repayment for home, personal, car, business, education and agriculture loans. EMI depends on the loan amount, interest rate and tenure." },
    { page: "Apply", text: "You can apply online for a loan, book a free consultation call, speak with our team on +91 88866 33119, or email services@sobhakrita.com for personalised assistance." },
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
    an: 1, a: 1, be: 1, will: 1, would: 1, should: 1, could: 1, help: 1,
    who: 1, whom: 1, whose: 1, why: 1, when: 1, where: 1, was: 1, were: 1
  };

  var FAQ_FILE = "data/chat-faqs.txt";

  var TOKEN_SYNONYMS = {
    "apply": "apply",
    "application": "apply",
    "applying": "apply",
    "book": "call",
    "booking": "call",
    "call": "call",
    "consultation": "call",
    "appointment": "call",
    "loan": "loan",
    "loans": "loan",
    "borrow": "loan",
    "finance": "loan",
    "credit": "credit",
    "score": "score",
    "cibil": "cibil",
    "eligibility": "eligibility",
    "eligible": "eligibility",
    "documents": "documents",
    "doc": "documents",
    "fee": "fees",
    "fees": "fees",
    "charges": "fees",
    "cost": "fees",
    "emi": "emi",
    "emis": "emi",
    "repayment": "emi",
    "repay": "emi",
    "rate": "interest",
    "rates": "interest",
    "interest": "interest",
    "contact": "contact",
    "phone": "contact",
    "email": "contact",
    "office": "contact",
    "address": "contact",
    "support": "support",
    "help": "support",
    "human": "advisor",
    "person": "advisor",
    "advisor": "advisor",
    "talk": "advisor",
    "grievance": "grievance",
    "complaint": "grievance",
    "home": "home",
    "mortgage": "mortgage",
    "property": "mortgage",
    "business": "business",
    "car": "car",
    "vehicle": "car",
    "education": "education",
    "agriculture": "agriculture",
    "farm": "agriculture",
    "msme": "msme",
    "industrial": "msme",
    "sobhakrita": "sobhakrita",
    "sobhakritafintech": "sobhakrita",
    "company": "sobhakrita"
  };

  function t(key) {
    var pack = UI[state.lang] || UI.en;
    return Object.prototype.hasOwnProperty.call(pack, key) ? pack[key] : UI.en[key];
  }

  function optionLabels() {
    var pack = UI[state.lang] || UI.en;
    var labels = (pack.opts || UI.en.opts).slice();
    labels.push(advisorLabel());
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

  var PAGE_LABELS = {
    "": "Home",
    apply: "Apply online",
    "book-a-call": "Book a call",
    contact: "Contact us",
    loans: "View loan options",
    "emi-calculator": "EMI calculator",
    fees: "Fees & charges",
    "personal-loan": "Personal loan details",
    "business-loan": "Business loan details",
    "home-loan": "Home loan details",
    "car-loan": "Car loan details",
    "education-loan": "Education loan details",
    "agriculture-loan": "Agriculture loan details",
    "industrial-loan": "Industrial loan details",
    "mortgage-loan": "Mortgage loan details",
    "insurance-services": "Insurance services",
    about: "About us",
    careers: "Careers",
    disclaimer: "Disclaimer",
    "privacy-policy": "Privacy policy",
    "terms-conditions": "Terms & conditions"
  };

  function titleCase(value) {
    var words = String(value || "").replace(/[-_]+/g, " ").trim();
    if (!words) return "";
    return words.charAt(0).toUpperCase() + words.slice(1);
  }

  function pageLabel(href) {
    var path = String(href || "")
      .replace(/^https?:\/\/[^/]+/i, "")
      .replace(/[?#].*$/, "")
      .replace(/^\/+/, "")
      .replace(/\.html$/i, "")
      .replace(/\/+$/, "");
    if (Object.prototype.hasOwnProperty.call(PAGE_LABELS, path)) return PAGE_LABELS[path];
    return titleCase(path.split("/").pop()) || "Open page";
  }

  // Show a short, readable label instead of a long raw URL.
  function linkLabel(value, href) {
    if (/^mailto:/i.test(href)) return value.replace(/^mailto:/i, "");
    if (/^tel:/i.test(href)) return value;
    if (/wa\.me|whatsapp/i.test(href)) return "WhatsApp";
    if (/sobhakritafintech\.com/i.test(href) || /\.html(?:[?#].*)?$/i.test(value)) {
      return pageLabel(href);
    }
    var host = /^https?:\/\/([^/]+)/i.exec(href);
    if (host) return host[1].replace(/^www\./i, "");
    return value;
  }

  function linkify(text) {
    text = String(text || "")
      .replace(/\*\*(.*?)\*\*/g, "$1")
      .replace(/`([^`]+)`/g, "$1")
      .replace(/^\s*#{1,6}\s+/gm, "")
      .replace(/^\s*[-*+]\s+/gm, "• ")
      .replace(/^\s*\d+[.)]\s+/gm, "• ")
      .replace(/^\s*---+\s*$/gm, "")
      .trim();

    var pattern = new RegExp(
      "(https?:\\/\\/[^\\s<>\"']+|www\\.[^\\s<>\"']+|[\\w.+-]+@[\\w-]+\\.[\\w.-]+|\\+?\\d[\\d\\s-]{8,}\\d|" +
        pageLinks() + ")",
      "gi"
    );
    var last = 0;
    var match;
    var html = "";
    var mdLinks = [];

    // Preserve model-style [label](url) links and render only the label.
    text = text.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/gi, function (_, label, url) {
      var index = mdLinks.length;
      mdLinks.push({ label: label, url: url });
      return "\u0000md" + index + "\u0000";
    });

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

      var visible = linkLabel(value, href);
      html += '<a href="' + escapeHtml(href) + '" title="' + escapeHtml(href) +
        '" target="_blank" rel="noopener">' + escapeHtml(visible) + "</a>" +
        escapeHtml(trailing);
      last = match.index + raw.length;
    }

    html += escapeHtml(text.slice(last));
    html = html.replace(/\u0000md(\d+)\u0000/g, function (_, index) {
      var link = mdLinks[Number(index)];
      if (!link) return "";
      var label = link.label || linkLabel(link.url, link.url);
      return '<a href="' + escapeHtml(link.url) + '" title="' + escapeHtml(link.url) +
        '" target="_blank" rel="noopener">' + escapeHtml(label) + "</a>";
    });
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
    var body = document.createElement("div");
    body.className = "sobhi-bubble-text";
    body.innerHTML = linkify(text);
    bubble.appendChild(body);
    row.appendChild(bubble);
    messagesEl.appendChild(row);

    if (role === "assistant") state.lastAssistantRow = row;
    if (role === "assistant") applyReadMore(bubble, body, text);
    scrollToBottom();

    if (!options || !options.skipHistory) {
      state.history.push({ role: role, text: String(text || "") });
      if (state.history.length > 30) state.history.shift();
      saveSession();
    }
    return row;
  }

  function applyReadMore(bubble, body, text) {
    var raw = String(text || "");
    if (raw.length < 420 && raw.split("\n").length < 8) return;
    bubble.classList.add("is-clamped");

    var button = document.createElement("button");
    button.type = "button";
    button.className = "sobhi-more";
    button.textContent = copy("more");
    button.setAttribute("aria-expanded", "false");
    button.addEventListener("click", function () {
      var clamped = bubble.classList.toggle("is-clamped");
      button.textContent = clamped ? copy("more") : copy("less");
      button.setAttribute("aria-expanded", clamped ? "false" : "true");
      scrollToBottom();
    });
    bubble.appendChild(button);
  }

  function createStreamingRow() {
    var row = document.createElement("div");
    row.className = "sobhi-msg sobhi-msg--assistant";
    var avatar = document.createElement("span");
    avatar.className = "sobhi-msg-avatar";
    avatar.setAttribute("aria-hidden", "true");
    avatar.textContent = "S";
    row.appendChild(avatar);
    var bubble = document.createElement("div");
    bubble.className = "sobhi-bubble";
    var body = document.createElement("div");
    body.className = "sobhi-bubble-text";
    bubble.appendChild(body);
    row.appendChild(bubble);
    messagesEl.appendChild(row);
    scrollToBottom();

    return {
      update: function (text) {
        body.innerHTML = linkify(text);
        scrollToBottom();
      },
      finish: function (text) {
        body.innerHTML = linkify(text);
        applyReadMore(bubble, body, text);
        state.lastAssistantRow = row;
        state.history.push({ role: "assistant", text: String(text || "") });
        if (state.history.length > 30) state.history.shift();
        saveSession();
        scrollToBottom();
      },
      remove: function () {
        if (row.parentNode) row.parentNode.removeChild(row);
      }
    };
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

  // Drop any in-flight reply so a language change cannot leave the composer
  // stuck in the busy state or append a stale answer in the old language.
  function cancelPending() {
    state.requestId += 1;
    state.busy = false;
    var pending = messagesEl.querySelectorAll(".sobhi-typing");
    Array.prototype.forEach.call(pending, function (node) {
      if (node.parentNode) node.parentNode.removeChild(node);
    });
  }

  function showChips(items) {
    clearChips();
    items.forEach(function (item) {
      var button = document.createElement("button");
      button.type = "button";
      button.className = "sobhi-chip" + (item.modifier ? " " + item.modifier : "");
      if (item.icon) {
        button.innerHTML = item.icon;
        button.setAttribute("aria-label", item.ariaLabel || item.label || "");
        if (item.label) button.title = item.label;
      } else {
        button.textContent = item.label;
      }
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
    cancelPending();
    if (lang.code === "other") {
      state.lang = "other";
      state.langName = "Other language";
      state.stage = "language-other";
      addMessage("user", lang.native);
      addMessage("assistant", UI.en.otherPrompt);
      input.focus();
      return;
    }

    var switching = state.langPicked;
    state.lang = lang.code;
    state.langName = lang.name;
    state.translateCode = lang.code;
    state.langPicked = true;
    state.stage = "chat";
    state.awaitingEscalation = false;
    state.awaitingFeedback = false;
    state.awaitingClarification = false;
    state.awaitingMoreHelp = false;
    root.setAttribute("lang", lang.code);
    root.setAttribute("dir", lang.dir);
    if (langLabel) langLabel.textContent = lang.code.toUpperCase();
    input.placeholder = copy("placeholder");

    if (!switching) addMessage("user", lang.native);
    if (!switching) {
      addMessage("assistant", t("welcome"));
      addMessage("assistant", t("choose"));
    }
    showOptions();
    loadKnowledge();
    saveSession();
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
            sendQuery(option.query, labels[index]);
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
    appendCtaChips();
  }

  function appendCtaChips() {
    var ctas = [
      { label: copy("call"), href: "tel:+918886633119" },
      { label: copy("whatsapp"), href: "https://wa.me/918886633119?text=Hi%20Sobhakrita%2C%20I%20would%20like%20to%20know%20more%20about%20a%20loan." },
      { label: copy("apply"), href: "apply.html" }
    ];
    ctas.forEach(function (item) {
      var link = document.createElement("a");
      link.className = "sobhi-chip sobhi-chip--cta";
      link.href = item.href;
      link.textContent = item.label;
      if (/^https?:/i.test(item.href)) {
        link.target = "_blank";
        link.rel = "noopener";
      }
      chipsEl.appendChild(link);
    });
    chipsEl.hidden = false;
  }

  function resolveAnswerFeedback(isHelpful, userReply) {
    state.awaitingFeedback = false;
    addMessage("user", userReply);
    if (isHelpful) {
      addMessage("assistant", feedbackText("thanks"));
      askMoreHelp();
      return;
    }

    state.awaitingClarification = true;
    addMessage("assistant", feedbackText("clarify"));
    showChips([
      {
        label: feedbackText("addDetails"),
        force: true,
        onClick: function () { input.focus(); }
      },
      {
        label: feedbackText("submitQuery"),
        force: true,
        onClick: function () { startEscalation(t("formIntro")); }
      }
    ]);
  }

  function askMoreHelp() {
    state.awaitingMoreHelp = true;
    addMessage("assistant", feedbackText("moreHelpPrompt"));
    showChips([
      {
        label: t("yes"),
        force: true,
        onClick: function () { resolveMoreHelp(true, t("yes")); }
      },
      {
        label: t("no"),
        force: true,
        onClick: function () { resolveMoreHelp(false, t("no")); }
      }
    ]);
  }

  function resolveMoreHelp(wantsMore, userReply) {
    state.awaitingMoreHelp = false;
    addMessage("user", userReply);
    if (wantsMore) {
      addMessage("assistant", t("choose"));
      showOptions();
      return;
    }

    addMessage("assistant", feedbackText("goodbye"));
    state.stage = "closed";
    clearChips();
    // Give the visitor a moment to read the goodbye before closing the chat.
    setTimeout(closeChat, 2200);
  }

  var COPY_SVG = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><rect x="8" y="8" width="13" height="13" rx="2"/><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3"/></svg>';
  var THUMBS_UP_SVG = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M7 10v12"/><path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2a3.13 3.13 0 0 1 3 3.88Z"/></svg>';
  var THUMBS_DOWN_SVG = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M17 14V2"/><path d="M9 18.12 10 14H4.17a2 2 0 0 1-1.92-2.56l2.33-8A2 2 0 0 1 6.5 2H20a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2.76a2 2 0 0 0-1.79 1.11L12 22a3.13 3.13 0 0 1-3-3.88Z"/></svg>';

  function copyAnswerText(value) {
    var textToCopy = String(value || "").trim();
    if (!textToCopy) return;
    function fallbackCopy() {
      var field = document.createElement("textarea");
      field.value = textToCopy;
      field.setAttribute("readonly", "readonly");
      field.style.position = "fixed";
      field.style.opacity = "0";
      document.body.appendChild(field);
      field.select();
      try { document.execCommand("copy"); } catch (error) { /* clipboard may be blocked */ }
      document.body.removeChild(field);
    }
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(textToCopy).catch(fallbackCopy);
    } else {
      fallbackCopy();
    }
  }

  function latestAssistantAnswer() {
    for (var i = state.history.length - 1; i >= 0; i -= 1) {
      if (state.history[i].role === "assistant") {
        var value = String(state.history[i].text || "");
        if (value !== t("choose") && value !== t("welcome")) return value;
      }
    }
    return "";
  }

  function installFeedbackStyles() {
    if (document.getElementById("sobhi-answer-action-styles")) return;
    var style = document.createElement("style");
    style.id = "sobhi-answer-action-styles";
    style.textContent = [
      ".sobhi-answer-actions{width:100%;margin:10px 0 2px;display:flex;flex-direction:column;align-items:flex-start;gap:8px;box-sizing:border-box}",
      ".sobhi-answer-icon-row{display:flex;align-items:center;gap:8px}",
      ".sobhi-answer-icon{width:34px;height:34px;min-width:34px;padding:0;display:inline-flex;align-items:center;justify-content:center;border:1px solid #d8dde5;border-radius:50%;background:#fff;color:#596579;cursor:pointer;box-shadow:none}",
      ".sobhi-answer-icon svg{display:block;width:17px;height:17px}",
      ".sobhi-answer-icon:hover{background:#f3f6fb;border-color:#aebbd0;color:#26364d}",
      ".sobhi-answer-actions button{font-family:inherit}",
      ".sobhi-answer-icon--listen{width:auto;min-width:34px;padding:0 10px;border-radius:18px;gap:6px;font-size:12px}",
      ".sobhi-answer-icon--listen span{white-space:nowrap}",
      ".sobhi-compose{display:flex;align-items:center;gap:6px;position:relative}",
      ".sobhi-compose [data-sobhi-input]{flex:1;min-width:0}",
      ".sobhi-recording-status{display:none;position:absolute;left:44px;right:48px;top:-34px;align-items:center;gap:7px;padding:6px 10px;border:1px solid #b9d8c4;border-radius:18px;background:#f0faf3;color:#176b3a;font-size:12px;z-index:2;box-shadow:0 2px 8px rgba(0,0,0,.06)}",
      ".sobhi-recording-status.is-active{display:flex}",
      ".sobhi-recording-cancel{width:22px;height:22px;min-width:22px;margin-left:auto;padding:0;border:0;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;background:transparent;color:#b42318;font:600 17px/1 Arial,sans-serif;cursor:pointer}",
      ".sobhi-recording-cancel:hover{background:#fee4e2}",
      ".sobhi-recording-cancel:focus-visible{outline:2px solid #b42318;outline-offset:2px}",
      ".sobhi-recording-dot{width:7px;height:7px;border-radius:50%;background:#dc4545;box-shadow:0 0 0 4px rgba(220,69,69,.13);animation:sobhi-record-pulse 1.2s infinite}",
      "@keyframes sobhi-record-pulse{50%{opacity:.35;box-shadow:0 0 0 7px rgba(220,69,69,0)}}",
      ".sobhi-tool-btn.is-recording{background:#fff1f1;border-color:#e7a0a0;color:#b42318}",
      ".sobhi-send.is-voice-send{background:#176b3a;color:#fff;border-color:#176b3a}",
      ".sobhi-voice-notice{margin:8px auto;padding:8px 12px;max-width:92%;border:1px solid #e6c98d;border-radius:10px;background:#fff9e9;color:#765515;font-size:12px;line-height:1.4;text-align:center}",
      ".sobhi-tool-btn{width:36px;height:36px;min-width:36px;border:1px solid #d8dde5;border-radius:50%;background:#fff;color:#526174;display:inline-flex;align-items:center;justify-content:center;cursor:pointer}",
      ".sobhi-tool-btn:hover,.sobhi-tool-btn.is-recording{background:#eef5ff;border-color:#8da9d4;color:#234b82}",
      ".sobhi-tool-btn:disabled{opacity:.45;cursor:not-allowed}",
      "@media(max-width:420px){.sobhi-tool-btn{width:32px;height:32px;min-width:32px}.sobhi-compose{gap:4px}}"
    ].join("\n");
    document.head.appendChild(style);
  }

  function showAnswerFeedback() {
    installFeedbackStyles();
    state.awaitingFeedback = true;
    state.awaitingClarification = false;
    state.awaitingMoreHelp = false;

    var answerRow = state.lastAssistantRow;
    if (!answerRow) return;
    var answerBubble = answerRow.querySelector(".sobhi-bubble");
    if (!answerBubble) return;

    // Prevent duplicate controls if the same answer completion callback fires twice.
    if (answerBubble.querySelector(".sobhi-answer-actions")) {
      showOptions(false);
      return;
    }

    // Read only the customer-facing answer in this exact message. Do not pull
    // from the conversation history, which also contains welcome prompts,
    // language instructions, feedback prompts, and other assistant UI text.
    var answerBody = answerBubble.querySelector(".sobhi-bubble-text");
    // Read only this answer's content. Strip controls/hidden UI before TTS;
    // never build speech text from the conversation history or surrounding UI.
    var speechClone = answerBody ? answerBody.cloneNode(true) : null;
    if (speechClone) {
      speechClone.querySelectorAll("button, script, style, [aria-hidden='true'], .sobhi-more, .sobhi-answer-actions").forEach(function (node) {
        node.remove();
      });
    }
    var answerToCopy = speechClone ? String(speechClone.innerText || speechClone.textContent || "").trim() : "";
    var actions = document.createElement("div");
    actions.className = "sobhi-answer-actions";
    var iconRow = document.createElement("div");
    iconRow.className = "sobhi-answer-icon-row";
    var buttons = [
      { label: "Copy answer", aria: "Copy answer", icon: COPY_SVG, onClick: function (button) {
        copyAnswerText(answerToCopy);
        button.title = "Copied";
        button.setAttribute("aria-label", "Copied");
        setTimeout(function () {
          if (button.isConnected) {
            button.title = "Copy answer";
            button.setAttribute("aria-label", "Copy answer");
          }
        }, 1400);
      }},
      { label: "Helpful", aria: "This answer was helpful", icon: THUMBS_UP_SVG, onClick: function () { resolveAnswerFeedback(true, "👍"); }},
      { label: "Not helpful", aria: "This answer was not helpful", icon: THUMBS_DOWN_SVG, onClick: function () { resolveAnswerFeedback(false, "👎"); }}
    ];
    buttons.push({ label: "Listen to answer", aria: "Listen to answer", icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 5 6 9H3v6h3l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7m3-10a9 9 0 0 1 0 13"/></svg><span>Listen</span>', onClick: function (button) {
      speakAnswer(answerToCopy, button);
    }});
    buttons.forEach(function (item) {
      var button = document.createElement("button");
      button.type = "button";
      button.className = "sobhi-answer-icon" + (item.aria === "Listen to answer" ? " sobhi-answer-icon--listen" : "");
      button.innerHTML = item.icon;
      button.title = item.label;
      button.setAttribute("aria-label", item.aria);
      button.addEventListener("click", function () { item.onClick(button); });
      iconRow.appendChild(button);
    });
    actions.appendChild(iconRow);
    answerBubble.appendChild(actions);

    // Keep the suggested follow-up chips in the existing shared quick-reply area.
    showOptions(false);
    scrollToBottom();
  }

  function languageForSpeech() {
    var map = { en: 'en-IN', te: 'te-IN', hi: 'hi-IN', ta: 'ta-IN', kn: 'kn-IN', ml: 'ml-IN', mr: 'mr-IN', bn: 'bn-IN', gu: 'gu-IN', pa: 'pa-IN', or: 'or-IN', ur: 'ur-IN' };
    var code = state.lang === 'other' ? state.translateCode : state.lang;
    return map[code] || (code && /^[a-z]{2,3}(-[A-Z]{2})?$/.test(code) ? code : '');
  }

  function speakAnswer(text, button) {
    var answer = String(text || '').trim();
    if (!answer) return;
    if (state.audioPlayer && state.audioText === answer) {
      if (!state.audioPlayer.paused) {
        state.audioPlayer.pause();
        button.title = 'Listen to answer';
        button.setAttribute('aria-label', 'Listen to answer');
      } else {
        state.audioPlayer.play().catch(function () {});
        button.title = 'Pause audio';
        button.setAttribute('aria-label', 'Pause audio');
      }
      return;
    }
    if (state.audioPlayer) { state.audioPlayer.pause(); state.audioPlayer = null; }
    if (state.audioButton && state.audioButton !== button) {
      state.audioButton.title = 'Listen to answer';
      state.audioButton.setAttribute('aria-label', 'Listen to answer');
      state.audioButton.disabled = false;
    }
    state.audioButton = button;
    if (state.audioObjectUrl) { URL.revokeObjectURL(state.audioObjectUrl); state.audioObjectUrl = ''; }
    button.disabled = true;
    button.title = 'Preparing audio…';
    fetch('/api/chat/speak', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: answer, language: languageForSpeech() })
    }).then(function (response) {
      return response.json().catch(function () { return {}; }).then(function (body) {
        if (!response.ok || !body.ok || !body.audioBase64) throw new Error(body.error || 'Read-aloud unavailable');
        return body;
      });
    }).then(function (body) {
      if (state.audioPlayer) { state.audioPlayer.pause(); state.audioPlayer = null; }
      if (state.audioObjectUrl) URL.revokeObjectURL(state.audioObjectUrl);
      var raw = atob(body.audioBase64);
      var bytes = new Uint8Array(raw.length);
      for (var i = 0; i < raw.length; i += 1) bytes[i] = raw.charCodeAt(i);
      var blob = new Blob([bytes], { type: body.mimeType || 'audio/wav' });
      state.audioObjectUrl = URL.createObjectURL(blob);
      state.audioText = answer;
      state.audioPlayer = new Audio(state.audioObjectUrl);
      state.audioPlayer.addEventListener('ended', function () {
        button.disabled = false; button.title = 'Listen to answer'; button.setAttribute('aria-label', 'Listen to answer');
        state.audioPlayer = null;
        state.audioText = '';
        state.audioButton = null;
        if (state.audioObjectUrl) URL.revokeObjectURL(state.audioObjectUrl);
        state.audioObjectUrl = '';
      });
      state.audioPlayer.addEventListener('error', function () {
        button.disabled = false; button.title = 'Listen to answer'; button.setAttribute('aria-label', 'Listen to answer');
      });
      button.disabled = false; button.title = 'Pause audio'; button.setAttribute('aria-label', 'Pause audio');
      return state.audioPlayer.play();
    }).catch(function (error) {
      button.disabled = false; button.title = 'Listen to answer'; button.setAttribute('aria-label', 'Listen to answer');
      // Playback/API errors are status notices, not chatbot answers. Keeping
      // them out of the conversation also prevents them getting read aloud.
      showVoiceNotice(error && error.message ? error.message : 'Read-aloud is unavailable right now.');
    });
  }

  function fileToBase64(file) {
    return new Promise(function (resolve, reject) {
      var reader = new FileReader();
      reader.onload = function () {
        var value = String(reader.result || '');
        resolve(value.slice(value.indexOf(',') + 1));
      };
      reader.onerror = function () { reject(new Error('Could not read the selected file.')); };
      reader.readAsDataURL(file);
    });
  }

  function analyzeUploadedFile(file) {
    if (state.busy) return;
    if (!file) return;
    var allowed = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (allowed.indexOf(file.type) === -1) {
      addMessage('assistant', 'Please upload a JPG, PNG, WEBP image or a PDF.');
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      addMessage('assistant', 'Please keep the file under 8 MB.');
      return;
    }
    var consentText = 'Before uploading: this file will be sent to Google Gemini for analysis and is not saved by Sobhi on its server. Gemini API free-tier content may be used by Google to improve its products. Avoid uploading PAN, Aadhaar, bank statements, salary slips, account numbers, OTPs, PINs, passwords or other sensitive financial information. Scanned PDFs may not be readable; clear images or text-based PDFs work best. Continue only if the file does not contain sensitive personal or financial data.';
    if (!window.confirm(consentText)) return;
    state.busy = true;
    state.awaitingFeedback = false;
    state.pendingQuestion = 'Please summarize this file and explain any relevant loan-related information. Do not determine loan approval or eligibility.';
    var requestId = ++state.requestId;
    addMessage('user', 'Uploaded: ' + file.name);
    var typing = showTyping();
    Promise.all([
      fileToBase64(file),
      retrieve('loan documents and verification requirements', 'documents', state.lastQuestion).catch(function () { return { items: [] }; })
    ]).then(function (results) {
      var context = (results[1].items || []).slice(0, 3).map(function (item) { return '[' + item.page + '] ' + item.text; }).join('\n\n');
      return fetch('/api/chat/analyze-file', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileBase64: results[0], mimeType: file.type, question: state.pendingQuestion, context: context, language: state.langName })
      }).then(function (response) {
        return response.json().catch(function () { return {}; }).then(function (body) {
          if (!response.ok || !body.ok || !body.answer) throw new Error(body.error || 'Document processing failed.');
          return body.answer;
        });
      });
    }).then(function (answer) {
      if (requestId !== state.requestId) return;
      typing.remove(); state.busy = false;
      addMessage('assistant', answer);
      finishAnswer(true);
    }).catch(function (error) {
      if (requestId !== state.requestId) return;
      typing.remove(); state.busy = false;
      addMessage('assistant', error && error.message ? error.message : 'I could not process that file. Please try again.');
      finishAnswer(true);
    });
  }

  function ensureRecordingStatus() {
    installFeedbackStyles();
    if (state.recordingStatus && state.recordingStatus.isConnected) return state.recordingStatus;
    var status = document.createElement('div');
    status.className = 'sobhi-recording-status';
    status.setAttribute('role', 'status');
    status.setAttribute('aria-live', 'polite');
    status.innerHTML = '<span class="sobhi-recording-dot" aria-hidden="true"></span><span>Sobhi is listening</span><strong data-sobhi-record-time>00:00</strong><button type="button" class="sobhi-recording-cancel" data-sobhi-cancel-recording aria-label="Cancel voice recording" title="Cancel recording">&times;</button>';
    var cancelBtn = status.querySelector('[data-sobhi-cancel-recording]');
    if (cancelBtn) cancelBtn.addEventListener('click', cancelVoiceRecording);
    if (form) form.insertBefore(status, form.firstChild);
    state.recordingStatus = status;
    return status;
  }

  function updateRecordingClock() {
    var elapsed = Math.max(0, Math.floor((Date.now() - state.recordingStartedAt) / 1000));
    var clock = state.recordingStatus && state.recordingStatus.querySelector('[data-sobhi-record-time]');
    if (clock) clock.textContent = String(Math.floor(elapsed / 60)).padStart(2, '0') + ':' + String(elapsed % 60).padStart(2, '0');
  }

  function resetRecordingUi() {
    if (state.recordingTimer) { clearInterval(state.recordingTimer); state.recordingTimer = null; }
    if (state.recordingStatus) state.recordingStatus.classList.remove('is-active');
    if (input) input.placeholder = 'Type your message…';
    if (micBtn) { micBtn.classList.remove('is-recording'); micBtn.title = 'Record a voice question'; micBtn.setAttribute('aria-label', 'Record a voice question'); micBtn.disabled = false; }
    if (sendBtn) {
      sendBtn.classList.remove('is-voice-send');
      sendBtn.setAttribute('aria-label', 'Send message');
      sendBtn.title = 'Send message';
      sendBtn.disabled = false;
    }
  }

  function cancelVoiceRecording() {
    // Invalidate a pending getUserMedia request as well as any active recording.
    state.recordingRequestId += 1;
    state.voiceSubmitRequested = false;
    if (state.mediaRecorder && state.mediaRecorder.state !== 'inactive') {
      state.mediaRecorder.stop();
    } else {
      if (state.recordingStream) {
        state.recordingStream.getTracks().forEach(function (track) { track.stop(); });
      }
      state.recordingStream = null;
      state.mediaRecorder = null;
      resetRecordingUi();
    }
  }

  function startVoiceRecording() {
    if (state.busy || (state.mediaRecorder && state.mediaRecorder.state === 'recording')) return;
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia || typeof MediaRecorder === 'undefined') {
      showVoiceNotice('Voice recording is not supported in this browser. Please type your question instead.');
      return;
    }
    var requestId = ++state.recordingRequestId;
    navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } }).then(function (stream) {
      // The user may have cancelled while the browser permission prompt was open.
      if (requestId !== state.recordingRequestId) {
        stream.getTracks().forEach(function (track) { track.stop(); });
        return;
      }
      state.recordingStream = stream;
      var mimeCandidates = ['audio/webm;codecs=opus', 'audio/ogg;codecs=opus', 'audio/mp4'];
      var mime = mimeCandidates.filter(function (candidate) { return MediaRecorder.isTypeSupported(candidate); })[0] || '';
      var recorder = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream);
      var chunks = [];
      state.mediaRecorder = recorder;
      state.voiceSubmitRequested = false;
      recorder.ondataavailable = function (event) { if (event.data && event.data.size) chunks.push(event.data); };
      recorder.onerror = function () {
        resetRecordingUi();
        stream.getTracks().forEach(function (track) { track.stop(); });
        state.recordingStream = null; state.mediaRecorder = null;
        showVoiceNotice('Recording failed. Please try again or type your question.');
      };
      recorder.onstop = function () {
        var shouldSubmit = state.voiceSubmitRequested;
        resetRecordingUi();
        stream.getTracks().forEach(function (track) { track.stop(); });
        state.recordingStream = null; state.mediaRecorder = null;
        state.voiceSubmitRequested = false;
        if (!shouldSubmit) {
          // Discard the captured audio locally; never transcribe a cancelled recording.
          chunks.length = 0;
          return;
        }
        var blob = new Blob(chunks, { type: recorder.mimeType || 'audio/webm' });
        if (!blob.size) { showVoiceNotice('No audio was captured. Please try recording again.'); return; }
        if (blob.size > 8 * 1024 * 1024) { showVoiceNotice('That recording is too large. Please record a shorter question.'); return; }
        state.busy = true;
        if (sendBtn) sendBtn.disabled = true;
        var typing = showTyping();
        fileToBase64(blob).then(function (audioBase64) {
          var actualMime = (recorder.mimeType || blob.type || 'audio/webm').split(';')[0].toLowerCase();
          return fetch('/api/chat/transcribe', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ audioBase64: audioBase64, mimeType: actualMime })
          }).then(function (response) {
            return response.json().catch(function () { return {}; }).then(function (body) {
              if (!response.ok || !body.ok || !body.transcript) {
                var errorText = body.error || ('Voice transcription failed (HTTP ' + response.status + ').');
                throw new Error(errorText);
              }
              typing.remove();
              state.busy = false;
              if (sendBtn) sendBtn.disabled = false;
              sendQuery(body.transcript, body.transcript, null, true);
            });
          });
        }).catch(function (error) {
          typing.remove();
          state.busy = false;
          if (sendBtn) sendBtn.disabled = false;
          showVoiceNotice(error && error.message ? error.message : 'Voice processing failed. Please try again.');
        });
      };
      recorder.start(250);
      state.recordingStartedAt = Date.now();
      var status = ensureRecordingStatus();
      status.classList.add('is-active');
      updateRecordingClock();
      state.recordingTimer = setInterval(updateRecordingClock, 250);
      if (micBtn) { micBtn.classList.add('is-recording'); micBtn.title = 'Recording in progress'; micBtn.setAttribute('aria-label', 'Recording in progress'); micBtn.disabled = true; }
      if (sendBtn) {
        sendBtn.disabled = false;
        sendBtn.classList.add('is-voice-send');
        sendBtn.setAttribute('aria-label', 'Send recorded voice question');
        sendBtn.title = 'Send recorded voice question';
      }
      if (input) input.placeholder = 'Sobhi is listening…';
      // Safety cap: submit automatically at 60 seconds rather than leaving the mic open.
      setTimeout(function () {
        if (state.mediaRecorder === recorder && recorder.state === 'recording') {
          state.voiceSubmitRequested = true;
          recorder.stop();
        }
      }, 60000);
    }).catch(function () {
      if (requestId !== state.recordingRequestId) return;
      resetRecordingUi();
      showVoiceNotice('Microphone access was blocked. Please allow microphone permission or type your question.');
    });
  }

  function showVoiceNotice(message) {
    installFeedbackStyles();
    // Keep technical voice errors out of the assistant conversation and its Read Aloud controls.
    var notice = document.createElement('div');
    notice.className = 'sobhi-voice-notice';
    notice.setAttribute('role', 'status');
    notice.textContent = message;
    if (messagesEl) {
      messagesEl.appendChild(notice);
      scrollToBottom();
      setTimeout(function () { if (notice.isConnected) notice.remove(); }, 7000);
    }
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
    var value = normalizeText(text);
    return /^(hi|hello|hey|namaste|namaskar|vanakkam|namaskara|namaskaram|salaam|assalam|good morning|good afternoon|good evening|నమస్తే|नमस्ते|வணக்கம்|ನಮಸ್ಕಾರ|നമസ്കാരം)(?:\s|$)/.test(value);
  }

  function isFollowUpQuestion(text) {
    var value = normalizeText(text);
    if (!value) return false;
    if (/^(and|what about|how about|what if|for me|in my case|also|does that|will that|can i still)\b/i.test(value)) return true;
    if (/(?:^|\s)(it|its|this|that|them|these|those|same|also|too)(?:\s|$)/i.test(value)) return true;
    if (/^(और|उसका|इसका|वही|అది|దాని|இது|அதன்|ಅದು|അത്|এটা|તે|ਇਹ|ଏହା|اس)/.test(value)) return true;
    return false;
  }

  var DOMAIN_TOKENS = {
    loan: 1, loans: 1, lending: 1, lend: 1, borrow: 1, borrowing: 1, emi: 1,
    eligibility: 1, eligible: 1, document: 1, documents: 1, fee: 1, fees: 1,
    charge: 1, charges: 1, apply: 1, application: 1, interest: 1, rate: 1,
    rates: 1, tenure: 1, repayment: 1, repay: 1, cibil: 1, credit: 1,
    mortgage: 1, insurance: 1, msme: 1, sobhakrita: 1, advisor: 1, contact: 1,
    whatsapp: 1, email: 1, office: 1, address: 1, appointment: 1, grievance: 1,
    complaint: 1, salary: 1, income: 1, bank: 1, kyc: 1, pan: 1, aadhaar: 1,
    property: 1, vehicle: 1, education: 1, agriculture: 1, customer: 1,
    service: 1, services: 1, timing: 1, timings: 1, branch: 1, location: 1,
    call: 1, book: 1, personal: 1, business: 1, home: 1, car: 1, gold: 1,
    industrial: 1, study: 1, farm: 1, nbfc: 1, dsa: 1, sobha: 1, krita: 1,
    fintech: 1, lender: 1, lenders: 1, hours: 1, open: 1, closed: 1,
    timing: 1, document: 1, paperwork: 1, qualification: 1,
    nach: 1, nache: 1, npci: 1, ecs: 1, mandate: 1
  };

  function looksDomainRelated(text) {
    return tokenize(text).some(function (token) {
      return !!DOMAIN_TOKENS[token];
    });
  }

  function looksLikeTest(text) {
    var value = normalizeText(text);
    if (!value) return false;
    if (/^(test|testing|test test|testing testing|asdf|asdfgh|qwerty|abcd?|xyz+|foo|bar|sample|demo)\b/.test(value)) return true;
    var squashed = value.replace(/\s+/g, "");
    return squashed.length >= 4 && /^(.)\1+$/.test(squashed);
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

  // Conservative FAQ-aware typo correction. Only correct a word when there is
  // one clearly closest term in the loaded Sobhakrita FAQ vocabulary.
  var QUERY_CORRECTION_ALIASES = {
    documnt: "document", documnts: "documents", documets: "documents", documet: "document",
    bussiness: "business", buisness: "business", busines: "business",
    eligiblity: "eligibility", eligibilty: "eligibility",
    intrest: "interest", interst: "interest", requred: "required", requird: "required",
    lon: "loan",
    requried: "required", aplicaton: "application", aplication: "application",
    aplications: "applications", reciept: "receipt", recieve: "receive",
    adress: "address", addres: "address", statemnt: "statement",
    statments: "statements", salariedd: "salaried", empr: "employer"
  };
  var queryCorrectionVocabulary = null;

  function buildQueryCorrectionVocabulary() {
    if (queryCorrectionVocabulary) return queryCorrectionVocabulary;
    var counts = {};
    (state.knowledge || []).forEach(function (entry) {
      // Questions, tags and page names are the strongest vocabulary signals.
      var source = [entry.question, entry.tags, entry.page, entry.answer].join(" ");
      tokenize(source).forEach(function (word) {
        if (word.length >= 4) counts[word] = (counts[word] || 0) + 1;
      });
    });
    Object.keys(QUERY_CORRECTION_ALIASES).forEach(function (wrong) {
      var right = QUERY_CORRECTION_ALIASES[wrong];
      counts[right] = Math.max(counts[right] || 0, 3);
    });
    queryCorrectionVocabulary = {};
    Object.keys(counts).forEach(function (word) {
      if (counts[word] >= 2) {
        var length = word.length;
        (queryCorrectionVocabulary[length] || (queryCorrectionVocabulary[length] = [])).push(word);
      }
    });
    return queryCorrectionVocabulary;
  }

  function editDistanceWithin(a, b, limit) {
    if (Math.abs(a.length - b.length) > limit) return limit + 1;
    var previous = [];
    for (var j = 0; j <= b.length; j += 1) previous[j] = j;
    for (var i = 1; i <= a.length; i += 1) {
      var current = [i];
      var rowMin = i;
      for (var k = 1; k <= b.length; k += 1) {
        var cost = a.charAt(i - 1) === b.charAt(k - 1) ? 0 : 1;
        current[k] = Math.min(current[k - 1] + 1, previous[k] + 1, previous[k - 1] + cost);
        if (current[k] < rowMin) rowMin = current[k];
      }
      if (rowMin > limit) return limit + 1;
      previous = current;
    }
    return previous[b.length];
  }

  function correctQueryText(text) {
    var vocabulary = buildQueryCorrectionVocabulary();
    return String(text || "").replace(/[A-Za-z][A-Za-z'-]*/g, function (rawWord) {
      var word = rawWord.toLowerCase().replace(/^'+|'+$/g, "");
      if (QUERY_CORRECTION_ALIASES[word]) {
        var alias = QUERY_CORRECTION_ALIASES[word];
        return rawWord.charAt(0) === rawWord.charAt(0).toUpperCase()
          ? alias.charAt(0).toUpperCase() + alias.slice(1) : alias;
      }
      if (word.length < 4 || /^([a-z])\1+$/.test(word)) return rawWord;
      var sameLength = vocabulary[word.length] || [];
      if (sameLength.indexOf(word) !== -1) return rawWord;
      var maxDistance = word.length >= 7 ? 2 : 1;
      var candidates = [];
      for (var delta = -maxDistance; delta <= maxDistance; delta += 1) {
        (vocabulary[word.length + delta] || []).forEach(function (candidate) {
          var distance = editDistanceWithin(word, candidate, maxDistance);
          if (distance <= maxDistance) candidates.push({ word: candidate, distance: distance });
        });
      }
      if (!candidates.length) return rawWord;
      candidates.sort(function (a, b) { return a.distance - b.distance; });
      var bestDistance = candidates[0].distance;
      var best = candidates.filter(function (item) { return item.distance === bestDistance; });
      // A tie is ambiguous; leave the customer's spelling untouched.
      if (best.length !== 1) return rawWord;
      var corrected = best[0].word;
      return rawWord.charAt(0) === rawWord.charAt(0).toUpperCase()
        ? corrected.charAt(0).toUpperCase() + corrected.slice(1) : corrected;
    });
  }

  function parseFaqKnowledge(text) {
    if (!text) return [];
    var blocks = text.split(/\n\s*---\s*\n/);
    return blocks
      .map(function (block) {
        var lines = block.split(/\r?\n/);
        var entry = { question: "", answer: "", page: "General", tags: "" };
        var current = "question";

        lines.forEach(function (line) {
          var trimmed = line.trim();
          if (!trimmed || /^#/.test(trimmed)) return;
          if (/^Q:/i.test(trimmed)) {
            entry.question = trimmed.replace(/^Q:\s*/i, "");
            current = "question";
            return;
          }
          if (/^A:/i.test(trimmed)) {
            entry.answer = trimmed.replace(/^A:\s*/i, "");
            current = "answer";
            return;
          }
          if (/^PAGE:/i.test(trimmed)) {
            entry.page = trimmed.replace(/^PAGE:\s*/i, "").trim() || "General";
            return;
          }
          if (/^TAGS:/i.test(trimmed)) {
            entry.tags = trimmed.replace(/^TAGS:\s*/i, "").trim();
            return;
          }
          if (current === "question") {
            entry.question += (entry.question ? " " : "") + trimmed;
          } else {
            entry.answer += (entry.answer ? " " : "") + trimmed;
          }
        });

        if (!entry.question || !entry.answer) return null;
        return {
          page: entry.page || "General",
          question: entry.question.trim(),
          answer: entry.answer.trim(),
          tags: entry.tags,
          text: entry.question.trim() + " " + entry.answer.trim()
        };
      })
      .filter(Boolean);
  }

  function expandTokens(tokens) {
    var expanded = [];
    tokens.forEach(function (token) {
      expanded.push(token);
      if (TOKEN_SYNONYMS[token]) expanded.push(TOKEN_SYNONYMS[token]);
    });
    return expanded;
  }

  function tokenSet(tokens) {
    var set = {};
    tokens.forEach(function (token) { if (token) set[token] = 1; });
    return set;
  }

  function toEntry(entry) {
    return {
      page: entry.page || "General",
      question: entry.question || "",
      answer: entry.answer || "",
      tags: entry.tags || "",
      text: entry.text || ((entry.question || "") + " " + (entry.answer || ""))
    };
  }

  function buildIndex(entries) {
    return entries.map(toEntry).map(function (entry) {
      entry._normQuestion = normalizeText(entry.question);
      entry._normText = normalizeText(entry.question + " " + entry.answer + " " + entry.page + " " + entry.tags);
      entry._tokens = expandTokens(tokenize(entry._normText));
      entry._tokenSet = tokenSet(entry._tokens);
      entry._questionTokens = expandTokens(tokenize(entry.question));
      entry._questionSet = tokenSet(entry._questionTokens);
      entry._pageNorm = normalizeText(entry.page);
      entry._pageTokens = tokenize(entry.page);
      return entry;
    });
  }

  function mergeWithFallback(faqEntries) {
    var merged = [];
    var seen = {};

    (faqEntries || []).forEach(function (item) {
      var key = normalizeText(item.question);
      if (!key || seen[key]) return;
      seen[key] = 1;
      merged.push(toEntry(item));
    });

    FALLBACK_KB.forEach(function (item) {
      var key = normalizeText(item.page + " " + String(item.text).slice(0, 80));
      if (seen[key]) return;
      seen[key] = 1;
      merged.push({
        page: item.page,
        question: item.page + " information",
        answer: item.text,
        tags: item.page,
        text: item.text
      });
    });

    return merged;
  }

  function escapeRegExp(value) {
    return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  function containsPhrase(haystack, needle) {
    if (!haystack || !needle || needle.length < 4) return false;
    var pattern = new RegExp(
      "(?:^|[^\\p{L}\\p{N}])" + escapeRegExp(needle) + "(?:$|[^\\p{L}\\p{N}])",
      "u"
    );
    return pattern.test(haystack);
  }

  function similarityScore(question, entry, contextTokens) {
    var normalizedQuestion = normalizeText(question);
    var score = 0;

    if (!normalizedQuestion) return 0;

    // Word-boundary matching avoids false hits such as "test" inside "latest".
    if (containsPhrase(entry._normText, normalizedQuestion)) score += 55;
    if (containsPhrase(entry._normQuestion, normalizedQuestion)) score += 18;

    var queryTokens = expandTokens(tokenize(question));
    var seen = {};
    queryTokens.forEach(function (token) {
      if (!token || seen[token]) return;
      seen[token] = true;
      if (entry._tokenSet[token]) {
        score += token.length > 5 ? 8 : 4;
      }
      if (entry._questionSet[token]) score += 20;
    });

    if (/\bcibil\b|credit score|credit history/i.test(normalizedQuestion)) {
      if (/\bcibil\b|credit score|credit history/i.test(entry._normText)) score += 42;
      else score -= 20;
    }

    var phrasePatterns = [
      /personal loan|personal loan application/i,
      /business loan|business lending/i,
      /home loan|housing loan/i,
      /mortgage|loan against property/i,
      /car loan|vehicle loan|auto loan/i,
      /education loan|study loan/i,
      /agriculture loan|farm loan/i,
      /industrial loan|msme loan|msme/i,
      /emi|equated monthly installment/i,
      /eligibility|documents|required documents/i,
      /fees|charges|processing fee|service fee/i,
      /apply|application|book a call|appointment/i,
      /contact|phone|email|whatsapp|office/i,
      /human|advisor|real person|talk to a person/i,
      /grievance|complaint|redressal/i,
      /cibil|credit score|credit history/i
    ];

    phrasePatterns.forEach(function (pattern) {
      if (pattern.test(normalizedQuestion) && pattern.test(entry._normText)) {
        score += 18;
      }
    });

    var pageHit = 0;
    entry._pageTokens.forEach(function (token) {
      if (normalizedQuestion.indexOf(token) !== -1) pageHit += 1;
    });
    score += pageHit * 10;

    if (entry._pageNorm && entry._pageNorm === normalizedQuestion.split(" ")[0]) {
      score += 12;
    }

    if (contextTokens && contextTokens.length) {
      var contextSeen = {};
      var contextHits = 0;
      contextTokens.forEach(function (token) {
        if (!token || contextSeen[token]) return;
        contextSeen[token] = 1;
        if (entry._tokenSet[token]) contextHits += 1;
      });
      score += Math.min(contextHits * 2, 8);
    }

    return score;
  }

  function loadKnowledge() {
    var code = translationCode() || "en";
    if (state.knowledgePromises[code]) return state.knowledgePromises[code];

    function fetchText(url) {
      return fetch(url, { credentials: "same-origin" })
        .then(function (response) { return response.ok ? response.text() : ""; });
    }

    function applyEntries(entries, langCode) {
      state.knowledge = buildIndex(entries);
      state.knowledgeLang = langCode;
      return state.knowledge;
    }

    function englishKnowledge() {
      return fetchText(FAQ_FILE).then(function (text) {
        return applyEntries(mergeWithFallback(parseFaqKnowledge(text)), "en");
      }).catch(function () {
        return applyEntries(mergeWithFallback([]), "en");
      });
    }

    // Show the built-in facts immediately while the FAQ file loads.
    if (!state.knowledge.length) state.knowledge = buildIndex(mergeWithFallback([]));

    var promise;
    if (code !== "en") {
      promise = fetchText("data/chat-faqs." + code + ".txt")
        .then(function (text) {
          var entries = parseFaqKnowledge(text);
          if (entries.length) return applyEntries(entries, code);
          return englishKnowledge();
        })
        .catch(englishKnowledge);
    } else {
      promise = englishKnowledge();
    }

    state.knowledgePromises[code] = promise;
    state.knowledgePromise = promise;
    return promise;
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
    var code = translationCode();
    if (!code || code === "en") return Promise.resolve(text);
    return googleTranslate(String(text).slice(0, 900), code, "en")
      .then(function (translated) { return translated && translated.length > 1 ? translated : text; })
      .catch(function () { return text; });
  }

  var TRANSLATION_CACHE_KEY = "sobhi.translations.v2";
  var TRANSLATION_CACHE_MAX = 200;
  var translationCache = null;

  function loadTranslationCache() {
    if (translationCache) return translationCache;
    try {
      var raw = window.localStorage.getItem(TRANSLATION_CACHE_KEY);
      translationCache = raw ? JSON.parse(raw) : {};
    } catch (error) {
      translationCache = {};
    }
    return translationCache;
  }

  function saveTranslationCache() {
    try {
      var cache = loadTranslationCache();
      var keys = Object.keys(cache);
      if (keys.length > TRANSLATION_CACHE_MAX) {
        keys.slice(0, keys.length - TRANSLATION_CACHE_MAX).forEach(function (key) {
          delete cache[key];
        });
      }
      window.localStorage.setItem(TRANSLATION_CACHE_KEY, JSON.stringify(cache));
    } catch (error) { /* storage may be full */ }
  }

  function translateToLang(text) {
    if (!text) return Promise.resolve("");
    var target = translationCode();
    if (!target || target === "en") return Promise.resolve("");
    if (state.knowledgeLang === target) return Promise.resolve(text);

    var cache = loadTranslationCache();
    var key = target + "|" + hashText(text);
    if (cache[key]) return Promise.resolve(cache[key]);

    return googleTranslate(text, "en", target).then(function (translated) {
      if (translated && translated.length > 1 && translated !== text) {
        cache[key] = translated;
        saveTranslationCache();
        return translated;
      }
      return "";
    }).catch(function () { return ""; });
  }

  var LANGUAGE_NAME_CODES = {
    english: "en", telugu: "te", hindi: "hi", tamil: "ta", kannada: "kn",
    malayalam: "ml", marathi: "mr", bengali: "bn", gujarati: "gu",
    punjabi: "pa", odia: "or", oriya: "or", urdu: "ur",
    french: "fr", german: "de", spanish: "es", portuguese: "pt", arabic: "ar",
    japanese: "ja", korean: "ko", chinese: "zh-CN", russian: "ru", italian: "it",
    dutch: "nl", turkish: "tr", thai: "th", vietnamese: "vi", indonesian: "id",
    malay: "ms", sinhala: "si", nepali: "ne", assamese: "as", konkani: "gom"
  };

  function detectLangCode(text) {
    var value = String(text || "");
    var scripts = [
      [/[\u0C00-\u0C7F]/, "te"],
      [/[\u0B80-\u0BFF]/, "ta"],
      [/[\u0C80-\u0CFF]/, "kn"],
      [/[\u0D00-\u0D7F]/, "ml"],
      [/[\u0980-\u09FF]/, "bn"],
      [/[\u0A80-\u0AFF]/, "gu"],
      [/[\u0A00-\u0A7F]/, "pa"],
      [/[\u0B00-\u0B7F]/, "or"],
      [/[\u0600-\u06FF]/, "ur"],
      [/[\u0900-\u097F]/, "hi"]
    ];
    for (var i = 0; i < scripts.length; i += 1) {
      if (scripts[i][0].test(value)) return scripts[i][1];
    }
    var normalized = normalizeText(value);
    if (LANGUAGE_NAME_CODES[normalized]) return LANGUAGE_NAME_CODES[normalized];
    if (/^[a-z\s-]+$/i.test(value) && /[a-z]/i.test(value)) return "en";
    return "";
  }

  var LEGAL_PAGES = { disclaimer: 1, "terms conditions": 1, "privacy policy": 1 };
  var MATCH_FLOOR = 24;

  function recentUserQuestions(question) {
    var list = [];
    for (var i = state.history.length - 1; i >= 0 && list.length < 3; i -= 1) {
      var item = state.history[i];
      if (item.role !== "user") continue;
      if (item.text === question) continue;
      list.unshift(item.text);
    }
    return list;
  }

  function retrieve(question, preferredPage, previousQuestion) {
    return loadKnowledge()
      .then(function () { return translateToEnglish(question); })
      .then(function (englishQuestion) {
        var recent = recentUserQuestions(question);
        if (previousQuestion) recent.push(previousQuestion);
        var contextText = recent.slice(-3).join(" ");
        var correctedQuestion = correctQueryText(englishQuestion || question || "");
        // Search with the corrected wording, not the misspelled token sequence.
        var queryText = correctedQuestion;
        var queryTokens = tokenize(queryText);
        var contextTokens = expandTokens(tokenize(contextText)).slice(0, 24);

        if (!queryTokens.length) {
          if (isFollowUpQuestion(question) && contextText) {
            // "what about that?" carries the previous topic forward.
            queryText = contextText;
            queryTokens = expandTokens(tokenize(contextText)).slice(0, 12);
          }
          if (!queryTokens.length) {
            return { items: [], ranked: [], score: 0, query: correctedQuestion, correctedQuery: correctedQuestion, originalQuery: question };
          }
        }

        // Only carry the previous page forward when this is a true follow-up
        // (a pronoun/lead-in or a shared term). Short unrelated queries like
        // "testing" must not inherit the previous topic.
        var explicitPage = normalizeText(preferredPage || "");
        var recentTokens = tokenize(contextText);
        var sharesRecent = queryTokens.some(function (token) {
          return recentTokens.indexOf(token) !== -1;
        });
        var useLastPage = !explicitPage && (isFollowUpQuestion(question) || sharesRecent);
        var preferred = explicitPage || (useLastPage ? normalizeText(state.lastMatchPage || "") : "");

        var scored = state.knowledge.map(function (item) {
          var score = similarityScore(queryText, item, contextTokens);

          var matchedTokens = 0;
          var unique = {};
          queryTokens.forEach(function (token) {
            if (unique[token]) return;
            unique[token] = true;
            if (item._tokenSet[token]) matchedTokens += 1;
          });

          var pageMatch = !!preferred && item._pageNorm === preferred;
          if (pageMatch) score += 45;
          score += matchedTokens * 4;

          if (LEGAL_PAGES[item.page] && matchedTokens === 0 && !/disclaimer|privacy|terms|grievance|complaint/i.test(queryText)) {
            score = 0;
          }

          return {
            item: item,
            score: score,
            queryHit: matchedTokens > 0,
            pageMatch: pageMatch
          };
        }).filter(function (row) {
          // A match must share at least one real query term. Page/context
          // bonuses alone are not enough to treat an unrelated question as
          // relevant.
          return row.score > 0 && (row.queryHit || (explicitPage && row.pageMatch));
        }).sort(function (a, b) { return b.score - a.score; });

        var top = scored.slice(0, 6);
        if (top.length && top[0].queryHit && top[0].score >= 20) {
          state.lastMatchPage = top[0].item.page;
        }
        return {
          items: top.map(function (row) { return row.item; }),
          ranked: top,
          score: top.length ? top[0].score : 0,
          query: correctedQuestion,
          correctedQuery: correctedQuestion,
          originalQuery: question
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

  function readSseAnswer(body, onDelta) {
    var reader = body.getReader();
    var decoder = new TextDecoder();
    var buffer = "";
    var answer = "";

    function parseEvent(chunk) {
      var lines = chunk.split("\n");
      var data = lines.filter(function (line) { return line.indexOf("data:") === 0; })
        .map(function (line) { return line.slice(5).trim(); })
        .join("\n");
      if (!data) return null;
      if (data === "[DONE]") return { done: true };
      try { return JSON.parse(data); } catch (error) { return null; }
    }

    function pump() {
      return reader.read().then(function (result) {
        if (result.done) {
          if (!answer) throw new Error("Empty assistant reply");
          return answer;
        }
        buffer += decoder.decode(result.value, { stream: true });
        var parts = buffer.split("\n\n");
        buffer = parts.pop();
        for (var i = 0; i < parts.length; i += 1) {
          var event = parseEvent(parts[i]);
          if (!event) continue;
          if (event.error) throw new Error(event.error);
          if (event.delta) {
            answer += event.delta;
            if (onDelta) onDelta(answer);
          }
          if (event.done) {
            if (event.answer) answer = event.answer;
            if (!answer) throw new Error("Empty assistant reply");
            return answer;
          }
        }
        return pump();
      });
    }

    return pump();
  }

  function askServer(question, context, onDelta) {
    var controller = typeof AbortController !== "undefined" ? new AbortController() : null;
    var timer = setTimeout(function () {
      if (controller) controller.abort();
    }, 45000);

    var request = fetch("/api/chat/ask", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        question: question,
        context: context,
        language: state.langName,
        stream: true
      }),
      signal: controller ? controller.signal : undefined
    }).then(function (response) {
      var type = response.headers.get("content-type") || "";
      if (!response.ok) {
        return response.json().catch(function () { return {}; }).then(function (body) {
          var error = new Error(body.error || "Assistant unavailable");
          error.assistantBusy = true;
          throw error;
        });
      }
      if (type.indexOf("text/event-stream") !== -1 && response.body && response.body.getReader && typeof TextDecoder !== "undefined") {
        return readSseAnswer(response.body, onDelta);
      }
      return response.json().catch(function () { return {}; }).then(function (body) {
        if (body.ok && body.answer) {
          if (onDelta) onDelta(body.answer);
          return body.answer;
        }
        var error = new Error(body.error || "Assistant unavailable");
        error.assistantBusy = true;
        throw error;
      });
    }).then(function (answer) {
      clearTimeout(timer);
      return answer;
    }, function (error) {
      clearTimeout(timer);
      throw error;
    });

    request.abort = function () {
      if (controller) controller.abort();
    };
    return request;
  }

  function askModel(question, context, onDelta) {
    return askServer(question, context, onDelta);
  }

  function shorten(text, max) {
    if (text.length <= max) return text;
    var cut = text.slice(0, max);
    var end = Math.max(cut.lastIndexOf(". "), cut.lastIndexOf("! "), cut.lastIndexOf("? "));
    if (end > max * 0.55) return cut.slice(0, end + 1);
    return cut.replace(/\s+\S*$/, "") + "…";
  }

  function composeLocalAnswer(retrieval) {
    var ranked = retrieval.ranked || [];
    if (!ranked.length) {
      ranked = (retrieval.items || []).map(function (item) {
        return { item: item, score: retrieval.score || 0 };
      });
    }
    if (!ranked.length) return "";

    var top = ranked[0];
    var parts = [];
    var seen = {};
    var total = 0;

    for (var i = 0; i < ranked.length && parts.length < 2; i += 1) {
      var row = ranked[i];
      // Only combine a second entry when it independently matched the query.
      if (i > 0 && (!row.queryHit || row.score < top.score * 0.8)) break;
      var text = String(row.item.answer || row.item.text || "").replace(/\s+/g, " ").trim();
      var key = normalizeText(text);
      if (!text || seen[key]) continue;
      seen[key] = 1;
      var max = parts.length === 0 ? 420 : 260;
      var piece = shorten(text, max);
      if (total + piece.length > 650) break;
      parts.push(piece);
      total += piece.length;
    }

    return parts.join("\n\n");
  }

  function prepareLocalAnswer(text) {
    var target = translationCode();
    if (!target || target === "en" || state.knowledgeLang === target) {
      return Promise.resolve(text);
    }
    return translateToLang(text).then(function (translated) {
      return translated || text;
    });
  }

  function finishAnswer(wasTyped) {
    // Keep answer actions (Copy, feedback and Listen) directly under every answer.
    showAnswerFeedback();
  }

  function sendQuery(question, displayText, preferredPage, isTyped) {
    if (state.busy) return;

    if (state.lang === "other" && !state.translateCode) {
      state.translateCode = detectLangCode(displayText || question);
    }

    var wasTyped = !!isTyped;
    var requestId = ++state.requestId;
    var previousQuestion = state.lastQuestion;
    state.busy = true;
    state.awaitingEscalation = false;
    state.awaitingFeedback = false;
    state.awaitingClarification = false;
    state.awaitingMoreHelp = false;
    state.pendingQuestion = question;
    state.lastQuestion = question;
    state.lastWasTyped = wasTyped;
    state.stage = "chat";
    addMessage("user", displayText || question);
    var typing = showTyping();

    function stillCurrent() {
      return requestId === state.requestId;
    }

    function showLocal(fallbackText) {
      return prepareLocalAnswer(fallbackText).then(function (answer) {
        if (!stillCurrent()) return;
        typing.remove();
        state.busy = false;
        addMessage("assistant", answer);
        finishAnswer(wasTyped);
      });
    }

    // A broad Documents request should show a category-wise overview. If the
    // visitor names a specific loan category or applicant type, let retrieval
    // find the more specific FAQ instead.
    if (normalizeText(preferredPage) === "documents") {
      var normalizedDocumentQuestion = normalizeText(question);
      var namesSpecificCategory = /personal|business|msme|industrial|home|mortgage|property|lap|car|vehicle|education|student|agricultur|farm|crop|salaried|salary|self.?employed|employee|business owner/.test(normalizedDocumentQuestion);
      if (!namesSpecificCategory) {
        var categoryDocuments = "The documents depend on the loan and your income profile. These are the usual starting points:\n\n" +
          "Personal loan\n" +
          "• PAN, Aadhaar or accepted KYC/address proof\n" +
          "• Salaried: latest 3 months' salary slips, around 6 months' bank statements and employment details\n" +
          "• Self-employed: business proof, around 2 years' ITR and computation, and 6–12 months' bank statements\n\n" +
          "Business / MSME / industrial loan\n" +
          "• PAN and accepted KYC for the applicant/business\n" +
          "• Business proof, bank statements, ITR and financial records\n" +
          "• GST returns or Udyam details, where applicable\n\n" +
          "Home loan / loan against property\n" +
          "• Applicant KYC, income proof and bank statements\n" +
          "• Property ownership, title and related property papers for lender checks\n\n" +
          "Car loan\n" +
          "• Applicant KYC, income proof and bank statements\n" +
          "• Vehicle or dealer details requested by the lender\n\n" +
          "Education loan\n" +
          "• Student KYC and academic records\n" +
          "• Admission/course details and fee information\n" +
          "• Co-applicant income documents, if required\n\n" +
          "Agriculture loan\n" +
          "• Applicant KYC and available income/bank records\n" +
          "• Farming activity details and land/lease information where relevant\n" +
          "• Crop or equipment details, depending on the purpose\n\n" +
          "This is a general overview, not a final checklist. The lender may ask for additional documents based on the product and your profile. Please share documents only through a channel verified by our team or the lender; never share OTPs, PINs or passwords.\n\n" +
          "Which loan are you considering? I can narrow this down to the relevant checklist.";
        showLocal(categoryDocuments);
        return;
      }
    }

    retrieve(question, preferredPage, previousQuestion).then(function (retrieval) {
      if (!stillCurrent()) return;

      var top = retrieval.ranked && retrieval.ranked[0];
      var second = retrieval.ranked && retrieval.ranked[1];
      var confident = !!top && top.score >= 34 &&
        (!second || top.score - second.score >= 8 || top.item.page === second.item.page);
      var fallbackText = composeLocalAnswer(retrieval);

      if (looksLikeTest(question)) {
        typing.remove();
        state.busy = false;
        offTopic(question);
        return;
      }

      if (!top || top.score < MATCH_FLOOR) {
        typing.remove();
        state.busy = false;
        var topicText = (question || "") + " " + (retrieval.query || "");
        if (looksLikeTest(question) || !looksDomainRelated(topicText)) {
          offTopic(question);
        } else {
          noContext(question);
        }
        return;
      }

      var modelQuestion = retrieval.correctedQuery || question;
      var cached = readCachedAnswer(modelQuestion);
      if (cached) {
        typing.remove();
        state.busy = false;
        addMessage("assistant", cached);
        finishAnswer(wasTyped);
        return;
      }

      // Give the model only the matched site content. Never send the whole
      // knowledge base, which made unrelated questions produce generic
      // summaries of every loan product.
      var context = retrieval.items.slice(0, 3).map(function (item) {
        return "[" + item.page + "] " + item.text;
      }).join("\n\n");

      var settled = false;
      var streamRow = null;

      function clearEarly() {
        // Kept as a no-op for the existing settle flow.
      }

      function settle(answer, fromModel) {
        if (settled) return;
        settled = true;
        clearEarly();
        typing.remove();
        state.busy = false;
        answer = String(answer || "").trim();

        var offTopicAnswer = /\[OFF_TOPIC\]/i.test(answer);
        if (!answer || /\[NO_CONTEXT\]/i.test(answer) || offTopicAnswer) {
          if (streamRow) streamRow.remove();
          if (fallbackText) {
            prepareLocalAnswer(fallbackText).then(function (text) {
              if (!stillCurrent()) return;
              addMessage("assistant", text);
              finishAnswer(wasTyped);
            });
          } else if (offTopicAnswer) {
            offTopic(question);
          } else {
            noContext(question);
          }
          return;
        }

        if (streamRow) streamRow.finish(answer);
        else addMessage("assistant", answer);
        if (fromModel) writeCachedAnswer(modelQuestion, answer);
        finishAnswer(wasTyped);
      }

      askModel(modelQuestion, context, function (partial) {
        if (settled || !stillCurrent()) return;
        clearEarly();
        if (!streamRow) {
          typing.remove();
          streamRow = createStreamingRow();
        }
        streamRow.update(partial);
      }).then(function (answer) {
        if (!stillCurrent()) return;
        settle(answer, true);
      }).catch(function () {
        if (!stillCurrent()) return;
        if (settled) return;
        settled = true;
        clearEarly();
        typing.remove();
        state.busy = false;
        if (fallbackText) showLocal(fallbackText);
        else noContext(question);
      });
    }).catch(function () {
      if (!stillCurrent()) return;
      typing.remove();
      state.busy = false;
      noContext(question);
    });
  }

  function noContext(question) {
    state.awaitingEscalation = false;
    state.awaitingFeedback = false;
    state.awaitingClarification = false;
    state.awaitingMoreHelp = false;
    state.pendingQuestion = question || state.pendingQuestion;
    addMessage("assistant", t("noContext") + " You can call +91 88866 33119 or +91 88866 33118, email services@sobhakrita.com, or book a call at https://www.sobhakritafintech.com/book-a-call.html.");
    // Ask for a quick thumbs up/down so the visitor can still escalate when
    // the website content did not cover their question.
    showAnswerFeedback();
  }

  function offTopic(question) {
    state.awaitingEscalation = false;
    state.awaitingFeedback = false;
    state.awaitingClarification = false;
    state.awaitingMoreHelp = false;
    state.lastMatchPage = "";
    state.pendingQuestion = question || state.pendingQuestion;
    addMessage("assistant", t("offTopic"));
    showOptions();
  }

  function startEscalation(intro) {
    if (state.busy) return;
    state.stage = "form";
    state.awaitingEscalation = false;
    state.awaitingFeedback = false;
    state.awaitingClarification = false;
    state.awaitingMoreHelp = false;
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

      postLead(data).then(function (result) {
        if (!result || (!result.emailSent && !result.whatsappSent)) {
          submit.disabled = false;
          submit.textContent = t("submit");
          error.textContent = t("failure");
          return;
        }

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

  function postLead(payload) {
    if (window.location.protocol === "file:") {
      return Promise.reject(new Error(t("failure")));
    }

    return fetch("/api/chat/lead", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    }).then(function (response) {
      return response.json().catch(function () { return {}; }).then(function (body) {
        if (!response.ok || !body.ok) {
          throw new Error(body.error || "Server could not accept the query.");
        }
        return body;
      });
    });
  }

  function applyLanguageAttrs() {
    var lang = LANGUAGES.filter(function (item) { return item.code === state.lang; })[0];
    var dir = lang ? lang.dir : "ltr";
    if (state.lang === "other" && state.translateCode === "ur") dir = "rtl";
    root.setAttribute("lang", state.lang === "other" ? "en" : state.lang);
    root.setAttribute("dir", dir);
    if (langLabel) {
      langLabel.textContent = state.lang === "other" ? "•" : state.lang.toUpperCase();
    }
    input.placeholder = copy("placeholder");
  }

  function boot() {
    if (state.booted) return;
    installFeedbackStyles();
    state.booted = true;
    state.stage = "chat";

    var saved = readSession();
    if (saved && saved.history && saved.history.length) {
      state.lang = saved.lang || "en";
      state.langName = saved.langName || "English";
      state.translateCode = saved.translateCode || "";
      state.langPicked = true;
      state.restoring = true;
      saved.history.slice(-30).forEach(function (item) {
        var role = item.role === "user" ? "user" : "assistant";
        addMessage(role, item.text, { skipHistory: true });
      });
      state.restoring = false;
      state.history = saved.history.slice(-30);
      applyLanguageAttrs();
      loadKnowledge();
      var last = state.history[state.history.length - 1];
      if (!last || last.role !== "assistant" || last.text !== t("choose")) {
        addMessage("assistant", t("choose"));
      }
      showOptions();
      saveSession();
      return;
    }

    applyLanguageAttrs();
    loadKnowledge();
    addMessage("assistant", t("welcome"));
    addMessage("assistant", t("choose"));
    showOptions();
  }

  function openChat() {
    panel.hidden = false;
    root.classList.add("is-open");
    if (launcher) {
      launcher.setAttribute("aria-expanded", "true");
      launcher.classList.add("is-active");
    }
    boot();
    applyLanguageAttrs();
    setTimeout(function () { input.focus({ preventScroll: true }); }, 120);
  }

  function closeChat() {
    if (state.mediaRecorder && state.mediaRecorder.state === 'recording') { state.voiceSubmitRequested = false; state.mediaRecorder.stop(); }
    else if (!state.mediaRecorder) { state.recordingRequestId += 1; } // Cancel a pending microphone permission request.
    if (state.audioPlayer) { state.audioPlayer.pause(); state.audioPlayer = null; }
    panel.hidden = true;
    root.classList.remove("is-open");
    saveSession();
    if (launcher) {
      launcher.setAttribute("aria-expanded", "false");
      launcher.classList.remove("is-active");
      launcher.focus({ preventScroll: true });
    }
  }

  function startNewChat() {
    // Keep the selected language, but reset all active conversation state.
    cancelPending();
    state.busy = false;
    state.stage = "chat";
    state.history = [];
    state.pendingQuestion = "";
    state.awaitingEscalation = false;
    state.awaitingFeedback = false;
    state.awaitingClarification = false;
    state.awaitingMoreHelp = false;
    state.lastQuestion = "";
    state.lastMatchPage = "";
    state.lastWasTyped = false;
    state.knowledgePromise = null;
    input.value = "";
    messagesEl.innerHTML = "";
    clearChips();
    applyLanguageAttrs();
    addMessage("assistant", t("welcome"));
    addMessage("assistant", t("choose"));
    showOptions();
    saveSession();
    input.focus({ preventScroll: true });
  }

  function toggleChat() {
    if (panel.hidden) {
      openChat();
    }
  }

  if (launcher) {
    launcher.setAttribute("aria-expanded", "false");
    launcher.addEventListener("click", toggleChat);
  }
  if (closeBtn) closeBtn.addEventListener("click", closeChat);
  if (newChatBtn) newChatBtn.addEventListener("click", startNewChat);
  if (langBtn) {
    langBtn.addEventListener("click", function () {
      cancelPending();
      state.stage = "language";
      state.awaitingEscalation = false;
      state.awaitingFeedback = false;
      state.awaitingClarification = false;
      state.awaitingMoreHelp = false;
      clearChips();
      addMessage("assistant", t("langPrompt"));
      renderLanguageChips();
    });
  }

  panel.addEventListener("keydown", function (event) {
    if (event.key !== "Tab" || panel.hidden) return;
    var nodes = panel.querySelectorAll('a[href], button:not([disabled]), input, textarea, select, [tabindex]:not([tabindex="-1"])');
    var list = Array.prototype.filter.call(nodes, function (node) {
      return !node.hidden && node.offsetParent !== null;
    });
    if (!list.length) return;
    var first = list[0];
    var last = list[list.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && !panel.hidden) closeChat();
  });

  window.addEventListener("sobhi:open", openChat);

  if (attachBtn && fileInput) {
    attachBtn.addEventListener('click', function () { fileInput.click(); });
    fileInput.addEventListener('change', function () {
      if (fileInput.files && fileInput.files[0]) analyzeUploadedFile(fileInput.files[0]);
      fileInput.value = '';
    });
  }
  if (micBtn) micBtn.addEventListener('click', startVoiceRecording);

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    if (state.mediaRecorder && state.mediaRecorder.state === 'recording') {
      // The regular Send button doubles as the voice-send control: stop and submit in one tap.
      state.voiceSubmitRequested = true;
      if (sendBtn) sendBtn.disabled = true;
      state.mediaRecorder.stop();
      return;
    }
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
        state.stage = "chat";
        sendQuery(value, value, null, true);
      }
      return;
    }

    if (state.stage === "language-other") {
      state.lang = "other";
      state.langName = value;
      state.translateCode = detectLangCode(value) || "";
      state.langPicked = true;
      state.stage = "chat";
      applyLanguageAttrs();
      loadKnowledge();
      addMessage("user", value);
      addMessage("assistant", UI.en.welcome);
      addMessage("assistant", UI.en.choose);
      showOptions();
      saveSession();
      return;
    }

    if (state.awaitingFeedback) {
      if (isYes(value)) {
        resolveAnswerFeedback(true, value);
        return;
      }
      if (isNo(value)) {
        resolveAnswerFeedback(false, value);
        return;
      }
      state.awaitingFeedback = false;
      sendQuery(value, value, null, true);
      return;
    }

    if (state.awaitingMoreHelp) {
      if (isYes(value)) {
        resolveMoreHelp(true, value);
        return;
      }
      if (isNo(value)) {
        resolveMoreHelp(false, value);
        return;
      }
      state.awaitingMoreHelp = false;
      sendQuery(value, value, null, true);
      return;
    }

    if (state.awaitingClarification) {
      state.awaitingClarification = false;
      var originalQuestion = state.pendingQuestion;
      sendQuery(value, value, null, true);
      if (originalQuestion) {
        state.pendingQuestion = originalQuestion + "\nAdditional details: " + value;
      }
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

    if (isGreeting(value)) {
      addMessage("user", value);
      addMessage("assistant", t("welcome"));
      showOptions();
      return;
    }

    sendQuery(value, value, null, true);
  });

  panel.hidden = true;
  root.setAttribute("data-sobhi-ready", "1");
})();

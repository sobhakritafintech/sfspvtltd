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
  var greetingPill = document.getElementById("sfsGreetingPill");

  if (greetingPill) {
    setTimeout(function () {
      greetingPill.classList.add("is-hidden");
    }, 5000);
  }

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
    knowledge: [],
    knowledgePromise: null,
    lastQuestion: ""
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
    { key: "documents", page: "apply", query: "What documents do I need to apply?" },
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
    en: { prompt: "Did this answer your question?", thanks: "Thanks for letting me know.", clarify: "Tell me what I should clarify, or submit your question to our team.", addDetails: "Add more details", submitQuery: "Submit a query", sendOptions: "Thanks for sharing your query. Choose WhatsApp or email below to send it to our team." },
    te: { prompt: "ఈ సమాధానం మీ ప్రశ్నకు సమాధానమిచ్చిందా?", thanks: "తెలియజేసినందుకు ధన్యవాదాలు.", clarify: "ఏమి వివరించాలో చెప్పండి లేదా మీ ప్రశ్నను మా బృందానికి పంపండి.", addDetails: "మరిన్ని వివరాలు జోడించండి", submitQuery: "ప్రశ్నను పంపండి", sendOptions: "మీ ప్రశ్నను పంచుకున్నందుకు ధన్యవాదాలు. మా బృందానికి పంపడానికి క్రింద WhatsApp లేదా ఇమెయిల్ ఎంచుకోండి." },
    hi: { prompt: "क्या इस जवाब से आपका सवाल हल हुआ?", thanks: "बताने के लिए धन्यवाद।", clarify: "बताएँ कि किस बात को स्पष्ट करना है, या अपना सवाल हमारी टीम को भेजें।", addDetails: "और जानकारी दें", submitQuery: "सवाल भेजें", sendOptions: "अपना सवाल साझा करने के लिए धन्यवाद। इसे हमारी टीम को भेजने के लिए नीचे WhatsApp या ईमेल चुनें।" },
    ta: { prompt: "இந்தப் பதில் உங்கள் கேள்விக்கு உதவியதா?", thanks: "தெரிவித்ததற்கு நன்றி.", clarify: "எதைத் தெளிவுபடுத்த வேண்டும் என்று கூறுங்கள் அல்லது உங்கள் கேள்வியை எங்கள் குழுவுக்கு அனுப்புங்கள்.", addDetails: "மேலும் விவரங்களைச் சேர்க்கவும்", submitQuery: "கேள்வியை அனுப்பவும்", sendOptions: "உங்கள் கேள்வியைப் பகிர்ந்ததற்கு நன்றி. எங்கள் குழுவுக்கு அனுப்ப கீழே WhatsApp அல்லது மின்னஞ்சலைத் தேர்ந்தெடுக்கவும்." },
    kn: { prompt: "ಈ ಉತ್ತರ ನಿಮ್ಮ ಪ್ರಶ್ನೆಗೆ ಉತ್ತರಿಸಿತೇ?", thanks: "ತಿಳಿಸಿದ್ದಕ್ಕಾಗಿ ಧನ್ಯವಾದಗಳು.", clarify: "ಏನನ್ನು ಸ್ಪಷ್ಟಪಡಿಸಬೇಕೆಂದು ತಿಳಿಸಿ ಅಥವಾ ನಿಮ್ಮ ಪ್ರಶ್ನೆಯನ್ನು ನಮ್ಮ ತಂಡಕ್ಕೆ ಕಳುಹಿಸಿ.", addDetails: "ಇನ್ನಷ್ಟು ವಿವರ ಸೇರಿಸಿ", submitQuery: "ಪ್ರಶ್ನೆ ಕಳುಹಿಸಿ", sendOptions: "ನಿಮ್ಮ ಪ್ರಶ್ನೆಯನ್ನು ಹಂಚಿಕೊಂಡಿದ್ದಕ್ಕೆ ಧನ್ಯವಾದಗಳು. ನಮ್ಮ ತಂಡಕ್ಕೆ ಕಳುಹಿಸಲು ಕೆಳಗೆ WhatsApp ಅಥವಾ ಇಮೇಲ್ ಆಯ್ಕೆಮಾಡಿ." },
    ml: { prompt: "ഈ മറുപടി നിങ്ങളുടെ ചോദ്യത്തിന് ഉത്തരം നൽകിയോ?", thanks: "അറിയിച്ചതിന് നന്ദി.", clarify: "എന്താണ് വ്യക്തമാക്കേണ്ടതെന്ന് പറയുക, അല്ലെങ്കിൽ നിങ്ങളുടെ ചോദ്യം ഞങ്ങളുടെ ടീമിന് അയയ്ക്കുക.", addDetails: "കൂടുതൽ വിവരങ്ങൾ ചേർക്കുക", submitQuery: "ചോദ്യം അയയ്ക്കുക", sendOptions: "നിങ്ങളുടെ ചോദ്യം പങ്കുവെച്ചതിന് നന്ദി. ടീമിന് അയയ്ക്കാൻ താഴെ WhatsApp അല്ലെങ്കിൽ ഇമെയിൽ തിരഞ്ഞെടുക്കുക." },
    mr: { prompt: "या उत्तराने तुमच्या प्रश्नाचे समाधान झाले का?", thanks: "कळवल्याबद्दल धन्यवाद.", clarify: "काय स्पष्ट करायचे ते सांगा किंवा तुमचा प्रश्न आमच्या टीमला पाठवा.", addDetails: "अधिक माहिती जोडा", submitQuery: "प्रश्न पाठवा", sendOptions: "तुमचा प्रश्न शेअर केल्याबद्दल धन्यवाद. टीमला पाठवण्यासाठी खाली WhatsApp किंवा ईमेल निवडा." },
    bn: { prompt: "এই উত্তরটি কি আপনার প্রশ্নের সমাধান করেছে?", thanks: "জানানোর জন্য ধন্যবাদ।", clarify: "কোন বিষয়টি পরিষ্কার করা দরকার বলুন, অথবা আপনার প্রশ্নটি আমাদের টিমে পাঠান।", addDetails: "আরও তথ্য যোগ করুন", submitQuery: "প্রশ্ন পাঠান", sendOptions: "আপনার প্রশ্নটি শেয়ার করার জন্য ধন্যবাদ। টিমে পাঠাতে নিচে WhatsApp বা ইমেল বেছে নিন।" },
    gu: { prompt: "શું આ જવાબથી તમારા પ્રશ્નનો ઉકેલ આવ્યો?", thanks: "જણાવવા બદલ આભાર.", clarify: "શું સ્પષ્ટ કરવું તે જણાવો અથવા તમારો પ્રશ્ન અમારી ટીમને મોકલો.", addDetails: "વધુ વિગતો ઉમેરો", submitQuery: "પ્રશ્ન મોકલો", sendOptions: "તમારો પ્રશ્ન શેર કરવા બદલ આભાર. અમારી ટીમને મોકલવા માટે નીચે WhatsApp અથવા ઇમેઇલ પસંદ કરો." },
    pa: { prompt: "ਕੀ ਇਸ ਜਵਾਬ ਨਾਲ ਤੁਹਾਡਾ ਸਵਾਲ ਹੱਲ ਹੋਇਆ?", thanks: "ਦੱਸਣ ਲਈ ਧੰਨਵਾਦ।", clarify: "ਦੱਸੋ ਕਿ ਕੀ ਸਪੱਸ਼ਟ ਕਰਨਾ ਹੈ ਜਾਂ ਆਪਣਾ ਸਵਾਲ ਸਾਡੀ ਟੀਮ ਨੂੰ ਭੇਜੋ।", addDetails: "ਹੋਰ ਜਾਣਕਾਰੀ ਦਿਓ", submitQuery: "ਸਵਾਲ ਭੇਜੋ", sendOptions: "ਆਪਣਾ ਸਵਾਲ ਸਾਂਝਾ ਕਰਨ ਲਈ ਧੰਨਵਾਦ। ਸਾਡੀ ਟੀਮ ਨੂੰ ਭੇਜਣ ਲਈ ਹੇਠਾਂ WhatsApp ਜਾਂ ਈਮੇਲ ਚੁਣੋ।" },
    or: { prompt: "ଏହି ଉତ୍ତର ଆପଣଙ୍କ ପ୍ରଶ୍ନର ସମାଧାନ କଲା କି?", thanks: "ଜଣାଇଥିବାରୁ ଧନ୍ୟବାଦ।", clarify: "କ’ଣ ସ୍ପଷ୍ଟ କରିବାକୁ ହେବ କୁହନ୍ତୁ କିମ୍ବା ଆପଣଙ୍କ ପ୍ରଶ୍ନ ଆମ ଦଳକୁ ପଠାନ୍ତୁ।", addDetails: "ଅଧିକ ବିବରଣୀ ଯୋଡ଼ନ୍ତୁ", submitQuery: "ପ୍ରଶ୍ନ ପଠାନ୍ତୁ", sendOptions: "ଆପଣଙ୍କ ପ୍ରଶ୍ନ ସେୟାର କରିଥିବାରୁ ଧନ୍ୟବାଦ। ଆମ ଦଳକୁ ପଠାଇବା ପାଇଁ ତଳେ WhatsApp କିମ୍ବା ଇମେଲ୍ ବାଛନ୍ତୁ।" },
    ur: { prompt: "کیا اس جواب سے آپ کا سوال حل ہوا؟", thanks: "بتانے کا شکریہ۔", clarify: "بتائیں کہ کیا واضح کرنا ہے، یا اپنا سوال ہماری ٹیم کو بھیجیں۔", addDetails: "مزید تفصیل شامل کریں", submitQuery: "سوال بھیجیں", sendOptions: "اپنا سوال شیئر کرنے کا شکریہ۔ ہماری ٹیم کو بھیجنے کے لیے نیچے WhatsApp یا ای میل منتخب کریں۔" }
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
    an: 1, a: 1, be: 1, will: 1, would: 1, should: 1, could: 1, help: 1
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
  }

  function resolveAnswerFeedback(isHelpful, userReply) {
    state.awaitingFeedback = false;
    addMessage("user", userReply);
    if (isHelpful) {
      addMessage("assistant", feedbackText("thanks"));
      showOptions();
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

  function showAnswerFeedback() {
    state.awaitingFeedback = true;
    state.awaitingClarification = false;
    addMessage("assistant", feedbackText("prompt"));
    showChips([
      {
        label: t("yes"),
        force: true,
        onClick: function () { resolveAnswerFeedback(true, t("yes")); }
      },
      {
        label: t("no"),
        force: true,
        onClick: function () { resolveAnswerFeedback(false, t("no")); }
      }
    ]);
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

  function isFollowUpQuestion(text) {
    return /^(and|what about|how about|what if|for me|in my case|also|does that|will that|can i still)\b/i.test(normalizeText(text));
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

  function similarityScore(question, entry) {
    var normalizedQuestion = normalizeText(question);
    var combinedText = normalizeText((entry.question || "") + " " + (entry.answer || "") + " " + (entry.page || "") + " " + (entry.tags || ""));
    var preferred = normalizeText(entry.page || "");
    var score = 0;

    if (!normalizedQuestion) return 0;

    if (combinedText.indexOf(normalizedQuestion) !== -1) score += 55;
    if ((entry.question || "").toLowerCase().indexOf(question.toLowerCase()) !== -1) score += 18;

    var queryTokens = expandTokens(tokenize(question));
    var answerTokens = expandTokens(tokenize(combinedText));
    var entryQuestionTokens = expandTokens(tokenize(entry.question || ""));
    var seen = {};
    queryTokens.forEach(function (token) {
      if (!token || seen[token]) return;
      seen[token] = true;
      if (answerTokens.indexOf(token) !== -1) {
        score += token.length > 5 ? 8 : 4;
      }
      if (entryQuestionTokens.indexOf(token) !== -1) score += 12;
    });

    if (/\bcibil\b|credit score|credit history/i.test(normalizedQuestion)) {
      if (/\bcibil\b|credit score|credit history/i.test(combinedText)) score += 42;
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
      if (pattern.test(normalizedQuestion) && pattern.test(combinedText)) {
        score += 18;
      }
    });

    var pageTokens = tokenize(preferred);
    var pageHit = 0;
    pageTokens.forEach(function (token) {
      if (normalizedQuestion.indexOf(token) !== -1) pageHit += 1;
    });
    score += pageHit * 10;

    if (entry.page && String(entry.page).toLowerCase() === normalizeText(question).split(" ")[0]) {
      score += 12;
    }

    return score;
  }

  function loadKnowledge() {
    if (state.knowledgePromise) return state.knowledgePromise;

    state.knowledge = FALLBACK_KB.slice();

    state.knowledgePromise = fetch(FAQ_FILE, { credentials: "same-origin" })
      .then(function (response) {
        if (!response.ok) return [];
        return response.text();
      })
      .then(function (text) {
        var faqEntries = parseFaqKnowledge(text);
        if (faqEntries && faqEntries.length) {
          state.knowledge = faqEntries.map(function (entry) {
            return {
              page: entry.page,
              question: entry.question,
              answer: entry.answer,
              tags: entry.tags,
              text: entry.text
            };
          });
        }
        return state.knowledge;
      })
      .catch(function () {
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

  function retrieve(question, preferredPage, previousQuestion) {
    return loadKnowledge()
      .then(function () { return translateToEnglish(question); })
      .then(function (englishQuestion) {
        var followUpContext = isFollowUpQuestion(question) ? previousQuestion || "" : "";
        var queryText = (question || "") + " " + (englishQuestion || "");
        if (followUpContext && tokenize(queryText).length < 2) {
          queryText += " " + followUpContext;
        }
        var queryTokens = tokenize(queryText);
        var preferred = normalizeText(preferredPage || "");

        if (!queryTokens.length) {
          return { items: state.knowledge.slice(0, 3), score: 0, query: englishQuestion };
        }

        var scored = state.knowledge.map(function (item) {
          var pageText = normalizeText(item.page || "");
          var score = similarityScore(queryText, item);

          var pageHits = 0;
          var unique = {};
          queryTokens.forEach(function (token) {
            if (unique[token]) return;
            unique[token] = true;
            if (normalizeText(item.page + " " + item.text).indexOf(token) !== -1) {
              pageHits += 1;
            }
          });

          if (preferred && pageText === preferred) score += 45;
          score += pageHits * 4;

          if (LEGAL_PAGES[item.page] && pageHits === 0 && !/disclaimer|privacy|terms|grievance|complaint/i.test(queryText)) {
            score = 0;
          }

          return { item: item, score: score };
        }).filter(function (row) { return row.score > 0; })
          .sort(function (a, b) { return b.score - a.score; });

        var top = scored.slice(0, 6);
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
    return Promise.reject(new Error("Puter AI fallback disabled"));
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
      // Browser-side AI is intentionally disabled on the public site to avoid
      // forcing any visitor into a Puter login flow. Fall back to the curated
      // website content instead.
      return Promise.reject(new Error("Browser AI disabled"));
    });
  }

  function shorten(text, max) {
    if (text.length <= max) return text;
    var cut = text.slice(0, max);
    var end = Math.max(cut.lastIndexOf(". "), cut.lastIndexOf("! "), cut.lastIndexOf("? "));
    if (end > max * 0.55) return cut.slice(0, end + 1);
    return cut.replace(/\s+\S*$/, "") + "…";
  }

  function localAnswer(retrieval) {
    var item = retrieval.items[0];
    if (!item) return "";
    var answer = String(item.answer || item.text || "").replace(/\s+/g, " ").trim();
    return answer ? shorten(answer, 480) : "";
  }

  function sendQuery(question, displayText, preferredPage) {
    if (state.busy) return;

    var previousQuestion = state.lastQuestion;
    state.busy = true;
    state.awaitingEscalation = false;
    state.awaitingFeedback = false;
    state.awaitingClarification = false;
    state.pendingQuestion = question;
    state.lastQuestion = question;
    state.stage = "chat";
    addMessage("user", displayText || question);
    var typing = showTyping();

    retrieve(question, preferredPage, previousQuestion).then(function (retrieval) {
      var directAnswer = retrieval.score >= 18 ? localAnswer(retrieval) : "";
      if (directAnswer) {
        return translateToLang(directAnswer).then(function (translated) {
          typing.remove();
          state.busy = false;
          addMessage("assistant", translated || directAnswer);
          showAnswerFeedback();
        });
      }

      var context;
      if (retrieval.items.length && retrieval.score >= 2) {
        context = retrieval.items.slice(0, 3).map(function (item) {
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
          showAnswerFeedback();
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
            addMessage("assistant", translated || fallback);
            showAnswerFeedback();
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
    state.awaitingFeedback = false;
    state.awaitingClarification = false;
    state.pendingQuestion = question || state.pendingQuestion;
    addMessage("assistant", t("noContext") + " You can call +91 88866 33119 or +91 88866 33118, email services@sobhakrita.com, or book a call at https://www.sobhakritafintech.com/book-a-call.html.\n\n" + t("askSubmit"));
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
    state.awaitingFeedback = false;
    state.awaitingClarification = false;
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

  function boot() {
    if (state.booted) return;
    state.booted = true;
    state.stage = "chat";
    root.setAttribute("lang", "en");
    root.setAttribute("dir", "ltr");
    if (langLabel) langLabel.textContent = "EN";
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
    if (panel.hidden) {
      openChat();
    }
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
        state.stage = "chat";
        sendQuery(value, value);
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
      sendQuery(value, value);
      return;
    }

    if (state.awaitingClarification) {
      state.awaitingClarification = false;
      var originalQuestion = state.pendingQuestion;
      sendQuery(value, value);
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

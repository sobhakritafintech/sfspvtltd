module.exports = {
  contactEmail: "services@sobhakrita.com",
  smtp: {
    host: "smtpout.secureserver.net",
    port: 587,
    secure: false,
    user: "services@sobhakrita.com",
    from: "services@sobhakrita.com"
  },
  emailBrand: {
    name: "Sobhakrita Fintech Solutions",
    accent: "#126b57",
    background: "#f3f7f5",
    watermarkOpacity: "0.10",
    logoUrl: "https://www.sobhakritafintech.com/assets/img/logo-mark.png"
  },
  formEmails: {
    callback: {
      to: "services@sobhakrita.com",
      requiredFields: ["name", "phone", "loanType", "city", "consent"],
      title: "Callback request",
      subject: "Callback request | {{name}}",
      body: "A customer has requested a callback. Review their contact and loan details below."
    },
    application: {
      to: "services@sobhakrita.com",
      requiredFields: ["loan_type", "loan_amount", "name", "phone", "city", "employment", "consent"],
      title: "Loan enquiry",
      subject: "Loan enquiry | {{name}} | {{loan_type}}",
      body: "A customer has submitted a loan enquiry. Review the requested loan and applicant details below."
    },
    booking: {
      to: "services@sobhakrita.com",
      requiredFields: ["name", "phone", "topic", "preferred_date", "preferred_time", "mode", "consent"],
      title: "Call booking request",
      subject: "Consultation request | {{name}} | {{preferred_date}}",
      body: "A customer has requested a consultation. Review their preferred date, time, and contact details below."
    },
    contact: {
      to: "services@sobhakrita.com",
      requiredFields: ["name", "phone", "subject", "message", "consent"],
      title: "Customer enquiry",
      subject: "Customer enquiry | {{name}} | {{subject}}",
      body: "A customer has sent an enquiry. Their message and contact details are below."
    },
    careers: {
      to: "hr@sobhakrita.com",
      requiredFields: ["name", "phone", "email", "role", "location", "cover_note", "consent"],
      title: "Careers application",
      subject: "[Sobhakrita Careers] Application | {{name}} | {{role}}",
      body: "A candidate has submitted an application. Review their contact details, experience, and note below."
    }
  },
  formFieldLabels: {
    name: "Full name",
    phone: "Mobile number",
    email: "Email address",
    loanType: "Loan type",
    amount: "Loan amount",
    loan_amount: "Loan amount needed",
    loan_type: "Loan type",
    city: "City or town",
    employment: "Employment type",
    monthly_income: "Net monthly income",
    existing_emi: "Existing monthly EMIs",
    pan_available: "PAN available",
    message: "Message",
    topic: "Call topic",
    preferred_date: "Preferred date",
    preferred_time: "Preferred time",
    mode: "Meeting mode",
    language: "Preferred language",
    notes: "Discussion notes",
    subject: "Reason for contact",
    role: "Role applying for",
    experience: "Total experience",
    location: "Current location",
    resume_link: "CV, LinkedIn, or portfolio link",
    resume_file: "CV attachment",
    resume_file: "CV attachment",
    cover_note: "Why this role",
    consent: "Contact or data-use consent"
  }
};
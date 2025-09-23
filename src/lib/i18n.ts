import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      // Navigation
      "home": "Home",
      "postIssue": "Post Issue",
      "settings": "Settings",
      "profile": "Profile",
      "signOut": "Sign Out",
      
      // Auth
      "signIn": "Sign In",
      "signUp": "Sign Up",
      "email": "Email",
      "password": "Password",
      "confirmPassword": "Confirm Password",
      "role": "Role",
      "citizen": "Citizen",
      "official": "Government Official",
      "createAccount": "Create Account",
      "alreadyHaveAccount": "Already have an account?",
      "dontHaveAccount": "Don't have an account?",
      
      // Issues
      "title": "Title",
      "description": "Description",
      "images": "Images",
      "location": "Location",
      "submit": "Submit",
      "upvote": "Upvote",
      "comment": "Comment",
      "comments": "Comments",
      "addComment": "Add Comment",
      "communityIssues": "Community Issues",
      "reportAndTrackCivicIssues": "Report and track civic issues in your area",
      "noIssuesPostedYet": "No issues posted yet",
      "beTheFirstToPostAnIssue": "Be the first to post an issue",
      "locationNotAvailable": "Location not available",
      "by": "by",
      
      // Settings
      "language": "Language",
      "save": "Save",
      
      // Common
      "loading": "Loading...",
      "error": "Error",
      "success": "Success",
      "cancel": "Cancel",
      "delete": "Delete",
      "edit": "Edit"
    }
  },
  hi: {
    translation: {
      // Navigation
      "home": "होम",
      "postIssue": "समस्या पोस्ट करें",
      "settings": "सेटिंग्स",
      "profile": "प्रोफाइल",
      "signOut": "साइन आउट",
      
      // Auth
      "signIn": "साइन इन",
      "signUp": "साइन अप",
      "email": "ईमेल",
      "password": "पासवर्ड",
      "confirmPassword": "पासवर्ड की पुष्टि करें",
      "role": "भूमिका",
      "citizen": "नागरिक",
      "official": "सरकारी अधिकारी",
      "createAccount": "खाता बनाएं",
      "alreadyHaveAccount": "पहले से खाता है?",
      "dontHaveAccount": "खाता नहीं है?",
      
      // Issues
      "title": "शीर्षक",
      "description": "विवरण",
      "images": "चित्र",
      "location": "स्थान",
      "submit": "जमा करें",
      "upvote": "अपवोट",
      "comment": "टिप्पणी",
      "comments": "टिप्पणियां",
      "addComment": "टिप्पणी जोड़ें",
      "communityIssues": "सामुदायिक मुद्दे",
      "reportAndTrackCivicIssues": "अपने क्षेत्र में नागरिक मुद्दों की रिपोर्ट करें और ट्रैक करें",
      "noIssuesPostedYet": "अभी तक कोई समस्या पोस्ट नहीं की गई है",
      "beTheFirstToPostAnIssue": "समस्या पोस्ट करने वाले पहले व्यक्ति बनें",
      "locationNotAvailable": "स्थान उपलब्ध नहीं है",
      "by": "द्वारा",
      
      // Settings
      "language": "भाषा",
      "save": "सेव करें",
      
      // Common
      "loading": "लोड हो रहा है...",
      "error": "त्रुटि",
      "success": "सफलता",
      "cancel": "रद्द करें",
      "delete": "हटाएं",
      "edit": "संपादित करें"
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
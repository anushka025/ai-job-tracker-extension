# 🚀 LinkedIn Job Tracker + AI Assistant

Chrome extension to save LinkedIn jobs in one click and analyze them with AI to improve job search decisions.

---

## ✨ Features

- One-click **“Save to JobTracker”** button on LinkedIn jobs  
- Extracts job title, company, location, and link  
- Prevents duplicate job entries  
- Stores data in Supabase backend  

---

## 🤖 AI Features

- **Resume ↔ Job Match Score**  
  Match %, missing skills, and resume improvement suggestions  

- **Auto Notes Generation**  
  “Why I applied” + interview talking points  

- **Smart Tagging**  
  Categorizes jobs into Good Fit, Stretch, Low Priority  

---

## 🧠 Technical Highlights

- Robust DOM parsing for LinkedIn’s dynamic and obfuscated UI  
- MutationObserver-based injection for real-time UI updates  
- Fallback extraction strategies for inconsistent job cards  
- Integrated Groq LLM APIs for AI-powered insights  

---

## 🛠 Tech Stack

- JavaScript (Chrome Extension APIs)  
- Supabase (Database + Auth)  
- HTML/CSS  
- Groq API  

---

## ⚡ Challenges

- Extracting reliable data from obfuscated and inconsistent DOM  
- Avoiding incorrect fields like “About” or generic locations  
- Handling duplicate detection via normalized job links  

---

## 📌 Future Improvements

- Full application pipeline tracking  
- Cross-device sync  
- AI-powered job recommendations  

---

## 👤 Author

Anushka Pandey

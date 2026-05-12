import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore, collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";


const firebaseConfig = {
  apiKey: "AIzaSyDYZmNpah2WuEocd5IrEB6sT_RDaP_jl54",
  authDomain: "wdaa-89a45.firebaseapp.com",
  projectId: "wdaa-89a45",
  storageBucket: "wdaa-89a45.firebasestorage.app",
  messagingSenderId: "626118744624",
  appId: "1:626118744624:web:e412bf44f028494a86abf5",
  measurementId: "G-FSJQ7LQWW9"
};


const app = initializeApp(firebaseConfig);
const db = getFirestore(app);


// Expose to window so onclick="setLanguage(...)" works with type="module"
window.setLanguage = function(lang) {
    document.body.className = 'lang-' + lang;
    const btnEn = document.getElementById('btn-en');
    const btnFil = document.getElementById('btn-fil');
    if (btnEn && btnFil) {
        btnEn.classList.remove('active');
        btnFil.classList.remove('active');
        document.getElementById('btn-' + lang).classList.add('active');
    }
    localStorage.setItem('preferredLang', lang);
}


window.onload = () => {
    const savedLang = localStorage.getItem('preferredLang') || 'en';
    window.setLanguage(savedLang);
};


// Only attach form listener if a form exists (survey page only)
const form = document.querySelector('form');
if (form) {
    form.addEventListener('submit', async (e) => {
        e.preventDefault();


        const atmosphereChecked = [...form.querySelectorAll('input[name="atmosphere"]:checked')]
            .map(cb => cb.value);
        const otherAtmosphere = form.querySelector('input[name="other_atmosphere"]').value.trim();
        if (otherAtmosphere) atmosphereChecked.push('other: ' + otherAtmosphere);


        const surveyData = {
            name:                form.querySelector('input[type="text"]').value.trim() || 'Anonymous',
            ageGroup:            form.querySelector('select[name="age_group"]').value,
            touristType:         form.querySelector('select[name="tourist_type"]').value,
            origin:              form.querySelectorAll('input[type="text"]')[1].value.trim(),
            visitDate:           form.querySelector('input[name="visit_date"]').value,
            architectureRating:  form.querySelector('input[name="q1_1"]:checked')?.value || null,
            preservationNote:    form.querySelector('textarea').value.trim(),
            atmosphereElements:  atmosphereChecked,
            maintenanceRating:   form.querySelector('input[name="q2"]:checked')?.value || null,
            affordabilityRating: form.querySelector('input[name="q3"]:checked')?.value || null,
            navigationRating: form.querySelector('input[name="q4"]').value || null,
            submittedAt:         serverTimestamp()
        };


        try {
            await addDoc(collection(db, 'survey_responses'), surveyData);
            document.getElementById('thankYouModal').style.display = 'flex';
            form.reset();
        } catch (error) {
            console.error('Error saving response:', error);
            alert('Something went wrong. Please try again.');
            console.error('Firebase error code:', error.code);
            console.error('Firebase error message:', error.message);
            alert('Something went wrong: ' + error.message);
        }
       
    });
}


// take the survey
const agreeCheckbox = document.getElementById("agree-checkbox");
const surveyLink = document.getElementById("survey-link");

if (agreeCheckbox && surveyLink) {
    function toggleSurveyButton() {
        if (agreeCheckbox.checked) {
            surveyLink.classList.remove("disabled");
        } else {
            surveyLink.classList.add("disabled");
        }
    }
    agreeCheckbox.addEventListener("change", toggleSurveyButton);
    toggleSurveyButton();
}


// Enable/disable survey button based on checkbox
 document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("survey-form");
    const submitBtn = document.querySelector(".submit-btn");
    if (!form || !submitBtn) return;
    function validateForm() {
        submitBtn.disabled = !form.checkValidity();
    }
    form.addEventListener("input", validateForm);
    form.addEventListener("change", validateForm);
    validateForm();
});



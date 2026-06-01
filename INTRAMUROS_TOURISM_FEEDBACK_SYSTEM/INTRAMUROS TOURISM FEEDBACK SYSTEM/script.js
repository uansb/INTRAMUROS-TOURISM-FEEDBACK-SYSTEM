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
    const visitDateInput = document.querySelector('input[name="visit_date"]');
    if (visitDateInput) {
        const today = new Date().toISOString().split('T')[0];
        visitDateInput.setAttribute('max', today);
    }        
     initAddressDropdowns();
     initTouristTypeToggle(); 
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
            const firstName = form.querySelector('input[name="first_name"]')?.value.trim() || '';
            const lastName  = form.querySelector('input[name="last_name"]')?.value.trim()  || '';
            const fullName  = [firstName, lastName].filter(Boolean).join(' ') || 'Anonymous';         
            const isInternational = form.querySelector('select[name="tourist_type"]').value === 'international';

            const surveyData = {
                name:                fullName,
                ageGroup:            form.querySelector('select[name="age_group"]').value,
                touristType:         form.querySelector('select[name="tourist_type"]').value,
                origin:              isInternational
                                     ? (form.querySelector('input[name="origin_country"]')?.value.trim() || 'Unknown')
                                     : [
                                         form.querySelector('select[name="origin_region"]')?.selectedOptions[0]?.text,
                                         form.querySelector('select[name="origin_province"]')?.selectedOptions[0]?.text,
                                         form.querySelector('select[name="origin_city"]')?.selectedOptions[0]?.text,
                                         form.querySelector('select[name="origin_barangay"]')?.selectedOptions[0]?.text,
                                         form.querySelector('input[name="origin_street"]')?.value.trim()
                                       ].filter(Boolean).join(', '),
                visitDate:           form.querySelector('input[name="visit_date"]').value,
                architectureRating:  Number(form.querySelector('input[name="q1_1"]:checked')?.value) || null,
                preservationNote:    form.querySelector('textarea').value.trim(),
                atmosphereElements:  atmosphereChecked,
                otherAtmosphere:     otherAtmosphere || null,
                maintenanceRating:   Number(form.querySelector('input[name="q2"]:checked')?.value)   || null,
                affordabilityRating: Number(form.querySelector('input[name="q3"]:checked')?.value)   || null,
                navigationRating:    Number(form.querySelector('input[name="q4"]:checked')?.value)   || null,
                submittedAt:         serverTimestamp()
            };

    //for catching errors and successfull survey submission
            try {
                const today = new Date().toISOString().split('T')[0];
                if (surveyData.visitDate && surveyData.visitDate > today) {
                    alert('Visit date cannot be in the future.');
                    return;
                }
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

async function initAddressDropdowns() {
    const selRegion   = document.getElementById('sel-region');
    const selProvince = document.getElementById('sel-province');
    const selCity     = document.getElementById('sel-city');
    const selBarangay = document.getElementById('sel-barangay');
    const provinceRow = document.getElementById('province-row');
    if (!selRegion) return; // not on survey page

    // ── Fetch helpers ──────────────────────────────────────────────
    const BASE = 'https://psgc.gitlab.io/api';

    async function fetchJSON(url) {
        const res = await fetch(url);
        return res.json();
    }

    function populate(sel, items, valueKey, labelKey, enableAfter) {
        sel.innerHTML = '<option value="" disabled selected>' + sel.options[0].text + '</option>';
        items
            .sort((a, b) => a[labelKey].localeCompare(b[labelKey]))
            .forEach(item => {
                const opt = document.createElement('option');
                opt.value = item[valueKey];
                opt.textContent = item[labelKey];
                sel.appendChild(opt);
            });
        sel.disabled = false;
        if (enableAfter) enableAfter.disabled = true;
    }

    // ── Load Regions ───────────────────────────────────────────────
    const regions = await fetchJSON(`${BASE}/regions/`);
    populate(selRegion, regions, 'code', 'regionName', selCity);

    // ── Region → Province or City ──────────────────────────────────
    selRegion.addEventListener('change', async () => {
        const code = selRegion.value;

        // Reset downstream
        selCity.innerHTML     = '<option value="" disabled selected>Select City / Municipality</option>';
        selBarangay.innerHTML = '<option value="" disabled selected>Select Barangay</option>';
        selCity.disabled      = true;
        selBarangay.disabled  = true;

        // NCR has no provinces — go straight to cities
        const regionData = regions.find(r => r.code === code);
        const isNCR = regionData && regionData.regionName.includes('NCR');

        if (isNCR) {
            provinceRow.style.display = 'none';
            selProvince.removeAttribute('required');
            const cities = await fetchJSON(`${BASE}/regions/${code}/cities-municipalities/`);
            populate(selCity, cities, 'code', 'name', selBarangay);
        } else {
            provinceRow.style.display = 'block';
            selProvince.setAttribute('required', '');
            selProvince.innerHTML = '<option value="" disabled selected>Select Province</option>';
            selProvince.disabled  = false;
            const provinces = await fetchJSON(`${BASE}/regions/${code}/provinces/`);
            populate(selProvince, provinces, 'code', 'name', selCity);
        }
    });

    // ── Province → City ────────────────────────────────────────────
    selProvince.addEventListener('change', async () => {
        selBarangay.innerHTML = '<option value="" disabled selected>Select Barangay</option>';
        selBarangay.disabled  = true;
        const cities = await fetchJSON(`${BASE}/provinces/${selProvince.value}/cities-municipalities/`);
        populate(selCity, cities, 'code', 'name', selBarangay);
    });

    // ── City → Barangay ────────────────────────────────────────────
    selCity.addEventListener('change', async () => {
        const barangays = await fetchJSON(`${BASE}/cities-municipalities/${selCity.value}/barangays/`);
        populate(selBarangay, barangays, 'code', 'name', null);
        selBarangay.disabled = false;
    });
}

//function for international tourist type
function initTouristTypeToggle() {
    const touristTypeSelect = document.querySelector('select[name="tourist_type"]');
    const internationalDiv = document.getElementById('international-origin');
    const localDiv = document.getElementById('local-origin');
    const countryInput = document.getElementById('origin-country-input');
    const selRegion = document.getElementById('sel-region');
    const selCity = document.getElementById('sel-city');
    const selBarangay = document.getElementById('sel-barangay');
    if (!touristTypeSelect) return;

    touristTypeSelect.addEventListener('change', () => {
        const isInternational = touristTypeSelect.value === 'international';

        internationalDiv.style.display = isInternational ? 'block' : 'none';
        localDiv.style.display = isInternational ? 'none' : 'block';

        // Swap required + disabled attributes so form validation works correctly
        countryInput.disabled = !isInternational;
        countryInput.required = isInternational;

        selRegion.required = !isInternational;
        selCity.required = !isInternational;
        selBarangay.required = !isInternational;
    });
}

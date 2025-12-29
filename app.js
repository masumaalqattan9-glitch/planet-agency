// ================================
// Supabase setup
// ================================
const sb = window.sb;
const BUCKET = window.SB_BUCKET;

// ✅ اسم الفنكشن الصحيح عندك
const EMAIL_FN_NAME = "email-notify";

// صور + PDF فقط
const allowedTypes = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/pdf",
];

const MAX_MB = 10;

function ensureSupabaseReady() {
  if (!sb) {
    alert("Supabase غير مهيأ. تأكدي من وضع SUPABASE_URL و SUPABASE_ANON_KEY في index.html");
    return false;
  }
  return true;
}

// ================================
// ✅ إرسال الإيميل (Edge Function)
// ================================
async function sendVisaEmail(visa_request_id) {
  if (!visa_request_id) throw new Error("visa_request_id مفقود لإرسال الإيميل");

  const { data, error } = await sb.functions.invoke(EMAIL_FN_NAME, {
    body: { visa_request_id },
  });

  if (error) throw error;
  return data;
}

async function uploadToSupabase(file, folder) {
  if (!file) return null;

  if (!allowedTypes.includes(file.type)) {
    throw new Error("❌ مسموح فقط صور (JPG/PNG/WEBP/GIF) أو PDF");
  }

  if (file.size > MAX_MB * 1024 * 1024) {
    throw new Error(`❌ حجم الملف لازم أقل من ${MAX_MB}MB`);
  }

  const safeName = file.name.replace(/[^\w.\-]+/g, "_");
  const path = `${folder}/${Date.now()}-${safeName}`;

  const { error } = await sb.storage.from(BUCKET).upload(path, file, { upsert: false });
  if (error) throw error;

  return path;
}

// ================================
// التنقّل بين الأقسام (هذا اللي كان يخرب)
// ================================
const menuButtons = document.querySelectorAll(".menu-btn");
const sections = document.querySelectorAll(".section");
const homeOptions = document.querySelectorAll(".option-card");

function showSection(id) {
  sections.forEach((sec) => sec.classList.remove("active"));
  const target = document.getElementById(id);
  if (target) target.classList.add("active");
}

menuButtons.forEach((btn) => {
  btn.addEventListener("click", () => showSection(btn.dataset.section));
});

homeOptions.forEach((card) => {
  card.addEventListener("click", () => showSection(card.dataset.section));
});

// ================================
// إنشاء حقول الأشخاص (للشنغن فقط) + عنوانين + ملفين
// ================================
const numPersonsInput = document.getElementById("numPersons");
const personsContainer = document.getElementById("personsContainer");

function createAddressFields(prefixLabel, prefixName) {
  return `
    <p class="note-title" style="margin-top:10px;">${prefixLabel}</p>

    <div class="field-group">
      <label>المدينة</label>
      <input type="text" name="${prefixName}_city" placeholder="مثال: الرياض">
    </div>

    <div class="field-group">
      <label>الحي</label>
      <input type="text" name="${prefixName}_district" placeholder="مثال: العليا">
    </div>

    <div class="field-group">
      <label>الشارع</label>
      <input type="text" name="${prefixName}_street" placeholder="اسم الشارع">
    </div>

    <div class="field-group">
      <label>الرمز البريدي</label>
      <input type="text" name="${prefixName}_postalCode" placeholder="مثال: 12345">
    </div>

    <div class="field-group">
      <label>رقم المبنى</label>
      <input type="text" name="${prefixName}_buildingNo" placeholder="مثال: 1234">
    </div>

    <div class="field-group">
      <label>الرقم الإضافي</label>
      <input type="text" name="${prefixName}_additionalNo" placeholder="مثال: 6789">
    </div>
  `;
}

function createAddressProofField(label, name) {
  return `
    <div class="field-group">
      <label>${label} (صورة أو PDF)</label>
      <input type="file" name="${name}" accept=".png,.jpg,.jpeg,.webp,.gif,.pdf,application/pdf">
    </div>
  `;
}

function createPersonFields(index) {
  const wrapper = document.createElement("div");
  wrapper.className = "person-card";

  const naPrefix = `person_${index}_na`;
  const workPrefix = `person_${index}_work`;

  wrapper.innerHTML = `
    <p class="person-title">بيانات الشخص رقم ${index + 1}</p>

    <div class="field-group">
      <label>الاسم الكامل</label>
      <input type="text" name="person_${index}_fullName" required>
    </div>

    <div class="field-group">
      <label>الحالة الاجتماعية</label>
      <select name="person_${index}_maritalStatus" required>
        <option value="">اختر الحالة</option>
        <option value="single">Single</option>
        <option value="married">Married</option>
        <option value="divorced">Divorced</option>
      </select>
    </div>

    <div class="field-group">
      <label>إيميلك الشخصي</label>
      <input type="email" name="person_${index}_personalEmail" required>
    </div>

    <div class="field-group">
      <label>إيميل جهة العمل (إيميل الشركة)</label>
      <input type="email" name="person_${index}_workEmail" required>
    </div>

    <div class="field-group">
      <label>هاتف أو جوال جهة العمل</label>
      <input type="text" name="person_${index}_workPhone" pattern="[0-9]+" placeholder="أرقام فقط" required>
    </div>

    <div class="field-group">
      <label>المسمى الوظيفي</label>
      <input type="text" name="person_${index}_jobTitle" required>
    </div>

    <div class="field-group">
      <label>قطاع العمل والتخصص</label>
      <input type="text" name="person_${index}_sector" placeholder="مثال: التعليم - معلمة" required>
    </div>

    <div class="field-group">
      <label>هل استخرجت فيزا شنغن سابقاً؟</label>
      <select name="person_${index}_hadSchengen" required>
        <option value="">اختر</option>
        <option value="no">لا</option>
        <option value="yes">نعم</option>
      </select>
    </div>

    <hr>

    ${createAddressFields("العنوان الوطني", naPrefix)}
    ${createAddressProofField("رفع إثبات العنوان الوطني", `person_${index}_na_proof`)}

    <hr>

    ${createAddressFields("عنوان العمل", workPrefix)}
    ${createAddressProofField("رفع إثبات عنوان العمل", `person_${index}_work_proof`)}
  `;

  return wrapper;
}

function renderPersons() {
  if (!personsContainer || !numPersonsInput) return;
  personsContainer.innerHTML = "";
  const count = parseInt(numPersonsInput.value, 10) || 1;
  for (let i = 0; i < count; i++) {
    personsContainer.appendChild(createPersonFields(i));
  }
}

if (numPersonsInput && personsContainer) {
  renderPersons();
  numPersonsInput.addEventListener("change", () => {
    if (parseInt(numPersonsInput.value, 10) < 1) numPersonsInput.value = 1;
    renderPersons();
  });
}

// ================================
// إظهار/إخفاء + required حسب نوع الفيزا
// ================================
const visaTypeEl = document.getElementById("visaType");

const visaRequirements = document.getElementById("visaRequirements");
const schengenRequirements = document.getElementById("schengenRequirements");
const russianRequirements = document.getElementById("russianRequirements");
const schengenNotes = document.getElementById("schengenNotes");

const regionWrap = document.getElementById("regionWrap");
const numPersonsWrap = document.getElementById("numPersonsWrap");
const regionInput = document.getElementById("customerRegion");

const passportFileInput = document.getElementById("passportFile");
const idFileInput = document.getElementById("idFile");
const familyCardFileInput = document.getElementById("familyCardFile");
const oldSchengenFileInput = document.getElementById("oldSchengenFile");
const personalPhotoFileInput = document.getElementById("personalPhotoFile");

function setRequired(el, val) {
  if (!el) return;
  if (val) el.setAttribute("required", "required");
  else el.removeAttribute("required");
}

function applyVisaUI() {
  const v = (visaTypeEl && visaTypeEl.value) ? visaTypeEl.value : "";

  if (visaRequirements) visaRequirements.style.display = v ? "" : "none";

  if (schengenRequirements) schengenRequirements.style.display = "none";
  if (russianRequirements) russianRequirements.style.display = "none";
  if (schengenNotes) schengenNotes.style.display = "none";

  setRequired(passportFileInput, !!v);

  setRequired(regionInput, false);
  setRequired(numPersonsInput, false);
  setRequired(personalPhotoFileInput, false);

  if (v === "schengen") {
    if (schengenRequirements) schengenRequirements.style.display = "";
    if (schengenNotes) schengenNotes.style.display = "";

    if (regionWrap) regionWrap.style.display = "";
    if (numPersonsWrap) numPersonsWrap.style.display = "";
    if (personsContainer) personsContainer.style.display = "";

    setRequired(regionInput, true);
    setRequired(numPersonsInput, true);

    // (حسب تصميمك) خليها optional
    setRequired(idFileInput, false);
    setRequired(familyCardFileInput, false);
    setRequired(oldSchengenFileInput, false);

    renderPersons();
  }

  if (v === "russian") {
    if (russianRequirements) russianRequirements.style.display = "";

    if (regionWrap) regionWrap.style.display = "none";
    if (numPersonsWrap) numPersonsWrap.style.display = "none";
    if (personsContainer) personsContainer.style.display = "none";

    if (regionInput) regionInput.value = "";
    if (numPersonsInput) numPersonsInput.value = 1;
    if (personsContainer) personsContainer.innerHTML = "";

    setRequired(personalPhotoFileInput, true);

    setRequired(idFileInput, false);
    setRequired(familyCardFileInput, false);
    setRequired(oldSchengenFileInput, false);
  }
}

if (visaTypeEl) {
  visaTypeEl.addEventListener("change", applyVisaUI);
  applyVisaUI();
}

// ================================
// Helpers
// ================================
function getFileFromFormData(formData, name) {
  const f = formData.get(name);
  return (f instanceof File && f.name) ? f : null;
}

// ================================
// حفظ فورم الفيزا في Supabase + رفع الملفات
// ================================
const visaForm = document.getElementById("visaForm");

if (visaForm) {
  visaForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!ensureSupabaseReady()) return;

    const submitBtn = visaForm.querySelector('button[type="submit"]');
    const oldBtnText = submitBtn ? submitBtn.textContent : "";

    try {
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = "جاري الإرسال...";
      }

      const formData = new FormData(visaForm);
      const visaType = formData.get("visaType");

      const passportFile = passportFileInput && passportFileInput.files ? passportFileInput.files[0] : null;

      if (!visaType) {
        alert("اختار نوع الفيزا اولاً");
        return;
      }

     // ========== روسي ==========
if (visaType === "russian") {
  const personalPhotoFile = personalPhotoFileInput && personalPhotoFileInput.files
    ? personalPhotoFileInput.files[0]
    : null;

  const passport_path = await uploadToSupabase(passportFile, "visa/russian/passport");
  const personal_photo_path = await uploadToSupabase(personalPhotoFile, "visa/russian/photo");

  const payload = {
    visa_type: "russian",
    contact_phone: formData.get("customerPhone"),
    travel_date: formData.get("travelDate"),
    passport_path,
    personal_photo_path,
  };

  // 🔍 حطي السطرين هنا بالضبط
  const s = await sb.auth.getSession();
  console.log("session?", !!s.data.session, s.data.session?.user?.id);

  // ✅ لازم نجيب id عشان نرسل الإيميل
  const { data: reqData, error } = await sb
    .from("visa_requests")
    .insert(payload)
    .select("id")
    .single();

  if (error) throw error;

  // ✅ إرسال الإيميل
  await sendVisaEmail(reqData.id);

  alert("تم إرسال طلب الفيزا الروسية ✅");
  visaForm.reset();
  applyVisaUI();
  return;
}

      // ========== شنغن ==========
      if (visaType === "schengen") {
        const numPersons = parseInt(formData.get("numPersons"), 10) || 1;

        const idFile = idFileInput && idFileInput.files ? idFileInput.files[0] : null;
        const familyCardFile = familyCardFileInput && familyCardFileInput.files ? familyCardFileInput.files[0] : null;
        const oldSchengenFile = oldSchengenFileInput && oldSchengenFileInput.files ? oldSchengenFileInput.files[0] : null;

        // رفع ملفات الطلب العامة
        const passport_path = await uploadToSupabase(passportFile, "visa/schengen/request/passport");
        const id_path = await uploadToSupabase(idFile, "visa/schengen/request/id");
        const family_card_path = await uploadToSupabase(familyCardFile, "visa/schengen/request/family");
        const old_schengen_path = await uploadToSupabase(oldSchengenFile, "visa/schengen/request/old_schengen");

        // إنشاء الطلب الرئيسي + جلب id
        const reqPayload = {
          visa_type: "schengen",
          num_persons: numPersons,
          contact_phone: formData.get("customerPhone"),
          region: formData.get("customerRegion"),
          travel_date: formData.get("travelDate"),
          passport_path,
          id_path,
          family_card_path,
          old_schengen_path,
        };

        const { data: reqData, error: reqErr } = await sb
          .from("visa_requests")
          .insert(reqPayload)
          .select("id")
          .single();

        if (reqErr) throw reqErr;

        const requestId = reqData && reqData.id ? reqData.id : null;
        if (!requestId) throw new Error("تعذر الحصول على رقم الطلب (request id)");

        // تجهيز صفوف الأشخاص
        const personRows = [];

        for (let i = 0; i < numPersons; i++) {
          const naProofFile = getFileFromFormData(formData, `person_${i}_na_proof`);
          const workProofFile = getFileFromFormData(formData, `person_${i}_work_proof`);

          const na_proof_path = await uploadToSupabase(
            naProofFile,
            `visa/schengen/request_${requestId}/person_${i + 1}/national_address_proof`
          );

          const work_proof_path = await uploadToSupabase(
            workProofFile,
            `visa/schengen/request_${requestId}/person_${i + 1}/work_address_proof`
          );

          personRows.push({
            visa_request_id: requestId,
            person_index: i + 1,

            full_name: formData.get(`person_${i}_fullName`) || "",
            marital_status: formData.get(`person_${i}_maritalStatus`) || "",
            personal_email: formData.get(`person_${i}_personalEmail`) || "",
            work_email: formData.get(`person_${i}_workEmail`) || "",
            work_phone: formData.get(`person_${i}_workPhone`) || "",
            job_title: formData.get(`person_${i}_jobTitle`) || "",
            sector: formData.get(`person_${i}_sector`) || "",
            had_schengen: formData.get(`person_${i}_hadSchengen`) || "",

            na_city: formData.get(`person_${i}_na_city`) || "",
            na_district: formData.get(`person_${i}_na_district`) || "",
            na_street: formData.get(`person_${i}_na_street`) || "",
            na_postal_code: formData.get(`person_${i}_na_postalCode`) || "",
            na_building_no: formData.get(`person_${i}_na_buildingNo`) || "",
            na_additional_no: formData.get(`person_${i}_na_additionalNo`) || "",
            na_proof_path: na_proof_path,

            work_city: formData.get(`person_${i}_work_city`) || "",
            work_district: formData.get(`person_${i}_work_district`) || "",
            work_street: formData.get(`person_${i}_work_street`) || "",
            work_postal_code: formData.get(`person_${i}_work_postalCode`) || "",
            work_building_no: formData.get(`person_${i}_work_buildingNo`) || "",
            work_additional_no: formData.get(`person_${i}_work_additionalNo`) || "",
            work_proof_path: work_proof_path,
          });
        }

        const { error: personsErr } = await sb.from("visa_persons").insert(personRows);
        if (personsErr) throw personsErr;

        // ✅ إرسال الإيميل بعد حفظ الطلب + الأشخاص
        await sendVisaEmail(requestId);

        alert("تم إرسال طلب فيزا شنغن ✅");
        visaForm.reset();

        if (numPersonsInput) {
          numPersonsInput.value = 1;
          renderPersons();
        }

        applyVisaUI();
        return;
      }

      alert("اختار نوع الفيزا اولًاً");
    } catch (err) {
      console.error("خطأ:", err);
      alert("صار خطأ: " + (err.message || "غير معروف"));
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = oldBtnText || "إرسال طلب الفيزا";
      }
    }
  });
}

// ================================
// حفظ فورم الباقة في Supabase
// ================================
const packageForm = document.getElementById("packageForm");

if (packageForm) {
  packageForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!ensureSupabaseReady()) return;

    const submitBtn = packageForm.querySelector('button[type="submit"]');
    const oldBtnText = submitBtn ? submitBtn.textContent : "";

    try {
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = "جاري الإرسال...";
      }

      const formData = new FormData(packageForm);

      const payload = {
        destination: formData.get("destination"),
        adults: parseInt(formData.get("adults"), 10) || 0,
        children: parseInt(formData.get("children"), 10) || 0,
        infants: parseInt(formData.get("infants"), 10) || 0,
        departure_airport: formData.get("departureAirport"),
        budget: parseFloat(formData.get("budget")) || 0,
        special_requests: formData.get("specialRequests"),
		contact_phone: formData.get("packagePhone"),
      };

      const { data, error } = await sb
  .from("trip_packages")
  .insert(payload)
  .select("id")
  .single();

if (error) throw error;

// إرسال الإيميل عبر نفس الفنكشن
await sb.functions.invoke("email-notify", {
  body: { type: "package", trip_package_id: data.id },
});


      alert("تم إرسال طلب الباقة 🎉");
      packageForm.reset();
    } catch (err) {
      console.error("خطأ:", err);
      alert("خطأ في حفظ طلب الباقة: " + (err.message || "غير معروف"));
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = oldBtnText || "إرسال";
      }
    }
  });
}

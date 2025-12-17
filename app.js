// ================================
// Supabase setup
// ================================
const sb = window.sb;
const BUCKET = window.SB_BUCKET;

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

async function uploadToSupabase(file, folder) {
  if (!file) return null;

  // تحقق النوع
  if (!allowedTypes.includes(file.type)) {
    throw new Error("❌ مسموح فقط صور (JPG/PNG/WEBP/GIF) أو PDF");
  }

  // تحقق الحجم
  if (file.size > MAX_MB * 1024 * 1024) {
    throw new Error(`❌ حجم الملف لازم أقل من ${MAX_MB}MB`);
  }

  const safeName = file.name.replace(/[^\w.\-]+/g, "_");
  const path = `${folder}/${Date.now()}-${safeName}`;

  const { error } = await sb.storage.from(BUCKET).upload(path, file, { upsert: false });
  if (error) throw error;

  // نخزن المسار فقط لأن البكت Private
  return path;
}

// ================================
// التنقّل بين الأقسام
// ================================
const menuButtons = document.querySelectorAll(".menu-btn");
const sections = document.querySelectorAll(".section");
const homeOptions = document.querySelectorAll(".option-card");

function showSection(id) {
  sections.forEach((sec) => sec.classList.remove("active"));
  const target = document.getElementById(id);
  if (target) target.classList.add("active");
}

// أزرار القائمة العلوية
menuButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    const sectionId = btn.dataset.section;
    showSection(sectionId);
  });
});

// كروت الخيارات في الصفحة الرئيسية
homeOptions.forEach((card) => {
  card.addEventListener("click", () => {
    const sectionId = card.dataset.section;
    showSection(sectionId);
  });
});

// ================================
// إنشاء حقول الأشخاص في فورم الفيزا
// ================================
const numPersonsInput = document.getElementById("numPersons");
const personsContainer = document.getElementById("personsContainer");

function createPersonFields(index) {
  const wrapper = document.createElement("div");
  wrapper.className = "person-card";

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
  `;

  return wrapper;
}

function renderPersons() {
  if (!personsContainer || !numPersonsInput) return;
  personsContainer.innerHTML = "";
  const count = parseInt(numPersonsInput.value) || 1;
  for (let i = 0; i < count; i++) {
    personsContainer.appendChild(createPersonFields(i));
  }
}

if (numPersonsInput && personsContainer) {
  renderPersons();

  numPersonsInput.addEventListener("change", () => {
    if (numPersonsInput.value < 1) numPersonsInput.value = 1;
    renderPersons();
  });
}

// ================================
// حفظ فورم الفيزا في Supabase + رفع الملفات
// ================================
const visaForm = document.getElementById("visaForm");

if (visaForm) {
  visaForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!ensureSupabaseReady()) return;

    const formData = new FormData(visaForm);
    const numPersons = parseInt(formData.get("numPersons")) || 1;

    // ملفات الفيزا (من HTML)
    const passportFile = document.getElementById("passportFile")?.files?.[0] || null;
    const idFile = document.getElementById("idFile")?.files?.[0] || null;
    const familyCardFile = document.getElementById("familyCardFile")?.files?.[0] || null;

    try {
      // 1) رفع الملفات
      const passport_path = await uploadToSupabase(passportFile, "visa/passport");
      const id_path = await uploadToSupabase(idFile, "visa/id");
      const family_card_path = await uploadToSupabase(familyCardFile, "visa/family");

      // 2) الأشخاص
      const persons = [];
      for (let i = 0; i < numPersons; i++) {
        persons.push({
          fullName: formData.get(`person_${i}_fullName`),
          maritalStatus: formData.get(`person_${i}_maritalStatus`),
          personalEmail: formData.get(`person_${i}_personalEmail`),
          workEmail: formData.get(`person_${i}_workEmail`),
          workPhone: formData.get(`person_${i}_workPhone`),
          jobTitle: formData.get(`person_${i}_jobTitle`),
          sector: formData.get(`person_${i}_sector`),
          hadSchengen: formData.get(`person_${i}_hadSchengen`),
        });
      }

      // 3) حفظ الطلب في جدول visa_requests
      const payload = {
        visa_type: formData.get("visaType"),
        num_persons: numPersons,
        contact_phone: formData.get("customerPhone"),
        region: formData.get("customerRegion"),
        passport_path,
        id_path,
        family_card_path,
        persons, // jsonb
      };

      const { error } = await sb.from("visa_requests").insert(payload);
      if (error) throw error;

      alert("تم إرسال طلب الفيزا ✅");

      visaForm.reset();
      if (numPersonsInput) {
        numPersonsInput.value = 1;
        renderPersons();
      }
    } catch (err) {
      console.error("خطأ:", err);
      alert("صار خطأ: " + (err.message || "غير معروف"));
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

    const formData = new FormData(packageForm);

    const payload = {
      destination: formData.get("destination"),
      adults: parseInt(formData.get("adults")) || 0,
      children: parseInt(formData.get("children")) || 0,
      infants: parseInt(formData.get("infants")) || 0,
      departure_airport: formData.get("departureAirport"),
      budget: parseFloat(formData.get("budget")) || 0,
      special_requests: formData.get("specialRequests"),
    };

    try {
      const { error } = await sb.from("trip_packages").insert(payload);
      if (error) throw error;

      alert("تم إرسال طلب الباقة 🎉");
      packageForm.reset();
    } catch (err) {
      console.error("خطأ:", err);
      alert("خطأ في حفظ طلب الباقة: " + (err.message || "غير معروف"));
    }
  });
}

// ==== التنقّل بين الأقسام ====
const menuButtons = document.querySelectorAll(".menu-btn");
const sections = document.querySelectorAll(".section");
const homeOptions = document.querySelectorAll(".option-card");

function showSection(id) {
  sections.forEach(sec => sec.classList.remove("active"));
  const target = document.getElementById(id);
  if (target) target.classList.add("active");
}

// أزرار القائمة
menuButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    const sectionId = btn.dataset.section;
    showSection(sectionId);
  });
});

// كروت الصفحة الرئيسية
homeOptions.forEach(card => {
  card.addEventListener("click", () => {
    const sectionId = card.dataset.section;
    showSection(sectionId);
  });
});

// ==== إنشاء حقول الأشخاص في فورم الفيزا ====
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
        <label>اسم الزوج/الزوجة (إذا متزوج)</label>
        <input type="text" name="person_${index}_spouseName" placeholder="اتركه فاضي إذا غير متزوج">
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
  personsContainer.innerHTML = "";
  const count = parseInt(numPersonsInput.value) || 1;
  for (let i = 0; i < count; i++) {
    personsContainer.appendChild(createPersonFields(i));
  }
}

renderPersons();

numPersonsInput.addEventListener("change", () => {
  if (numPersonsInput.value < 1) numPersonsInput.value = 1;
  renderPersons();
});

// ==== حفظ فورم الفيزا في Firestore ====
const visaForm = document.getElementById("visaForm");

visaForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const formData = new FormData(visaForm);
  const numPersons = parseInt(formData.get("numPersons")) || 1;

  const payload = {
    createdAt: new Date().toISOString(),
    visaType: formData.get("visaType"),
    numPersons,
    persons: []
  };

  for (let i = 0; i < numPersons; i++) {
    const person = {
      fullName: formData.get(`person_${i}_fullName`),
      maritalStatus: formData.get(`person_${i}_maritalStatus`),
      spouseName: formData.get(`person_${i}_spouseName`),
      personalEmail: formData.get(`person_${i}_personalEmail`),
      workEmail: formData.get(`person_${i}_workEmail`),
      workPhone: formData.get(`person_${i}_workPhone`),
      jobTitle: formData.get(`person_${i}_jobTitle`),
      sector: formData.get(`person_${i}_sector`),
      hadSchengen: formData.get(`person_${i}_hadSchengen`)
    };
    payload.persons.push(person);
  }

  try {
    await db.collection("visaRequests").add(payload);
    alert("تم إرسال طلب الفيزا وحفظه في قاعدة البيانات ✅");
    visaForm.reset();
    numPersonsInput.value = 1;
    renderPersons();
  } catch (err) {
    console.error("خطأ في حفظ طلب الفيزا:", err);
    alert("خطأ في حفظ طلب الفيزا: " + err.message);
  }
});

// ==== حفظ فورم الباقة في Firestore ====
const packageForm = document.getElementById("packageForm");

packageForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const formData = new FormData(packageForm);

  const payload = {
    createdAt: new Date().toISOString(),
    destination: formData.get("destination"),
    adults: parseInt(formData.get("adults")) || 0,
    children: parseInt(formData.get("children")) || 0,
    infants: parseInt(formData.get("infants")) || 0,
    departureAirport: formData.get("departureAirport"),
    budget: parseFloat(formData.get("budget")) || 0,
    specialRequests: formData.get("specialRequests")
  };

  try {
    await db.collection("tripPackages").add(payload);
    alert("تم إرسال طلب الباقة وحفظه في قاعدة البيانات 🎉");
    packageForm.reset();
  } catch (err) {
    console.error("خطأ في حفظ طلب الباقة:", err);
    alert("خطأ في حفظ طلب الباقة: " + err.message);
  }
});

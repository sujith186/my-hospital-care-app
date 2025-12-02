/* Navigation (unchanged behaviour) */
document.addEventListener('click', function(e){
  const target = e.target;
  if(target.dataset && target.dataset.show){
    showLay(target.dataset.show);
  }
});
function showLay(id){
  document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));
  const screen = document.getElementById(id);
  if(screen) screen.classList.add('active');
}

/* --- Registration validation and storage --- */
const regForm = document.getElementById('regForm');
regForm && regForm.addEventListener('submit', function(ev){
  ev.preventDefault();
  const form = new FormData(regForm);
  const name = (form.get('name')||'').trim();
  const role = form.get('role')||'';
  const id = (form.get('id')||'').trim();
  const age = Number(form.get('age'));
  const password = form.get('password') || '';

  // validations requested
  if(!name){ alert('Enter name'); return; }
  if(!(role === 'Doctor' || role === 'Nurse')){ alert('Role must be Doctor or Nurse'); return; }

  // ID must be numeric
  if(!/^\d+$/.test(id)){ alert('ID must contain only numbers'); return; }
  // ID should not be strictly increasing or decreasing sequence of digits
  if(isStrictStepSequence(id, 1) || isStrictStepSequence(id, -1)){
    alert('ID must not be a strictly increasing or decreasing sequence (e.g. 1234 or 4321). Choose a different numeric ID.');
    return;
  }

  // age must be positive (start with 1)
  if(!Number.isFinite(age) || age < 1){ alert('Age must be a positive number (>=1)'); return; }

  // password complexity
  if(!validatePassword(password)){
    alert('Password must be at least 8 characters and include lowercase, uppercase, number, and special character.');
    return;
  }

  // build user object (store password too for demo)
  const user = {
    name, role, id, age, password
  };

  // optional: handle photo
  const photoFile = form.get('photo');
  if(photoFile && photoFile.size){
    const reader = new FileReader();
    reader.onload = () => {
      user.photo = reader.result;
      finalizeRegistration(user);
    };
    reader.readAsDataURL(photoFile);
  } else {
    finalizeRegistration(user);
  }
});

function finalizeRegistration(user){
  window.demoUser = user; // demo store
  fillProfile(user);
  alert('Registered successfully (demo).');
  showLay('lay4');
}

/* helper: check if digit string forms strict step sequence +1 or -1 */
function isStrictStepSequence(digits, step){
  if(digits.length < 2) return false;
  for(let i=1;i<digits.length;i++){
    const prev = Number(digits[i-1]);
    const cur = Number(digits[i]);
    if(cur - prev !== step) return false;
  }
  return true;
}

/* password validation */
function validatePassword(pw){
  if(typeof pw !== 'string') return false;
  if(pw.length < 8) return false;
  if(!/[a-z]/.test(pw)) return false;
  if(!/[A-Z]/.test(pw)) return false;
  if(!/[0-9]/.test(pw)) return false;
  if(!/[^A-Za-z0-9]/.test(pw)) return false;
  return true;
}

/* fill profile UI (address removed) */
function fillProfile(user){
  document.getElementById('profileName').textContent = 'Name: ' + (user.name || '—');
  document.getElementById('profileRole').textContent = 'Role: ' + (user.role || '—');
  document.getElementById('profileId').textContent = 'ID: ' + (user.id || '—');
  document.getElementById('profileAge').textContent = 'Age: ' + (user.age || '—');
  // profile photo if present
  const img = document.getElementById('profilePic');
  if(user.photo){
    img.src = user.photo;
    img.style.display = 'block';
    img.style.maxWidth = '120px';
    img.style.borderRadius = '8px';
  } else {
    img.style.display = 'none';
  }
}

/* Edit profile prefill */
const editProfileBtn = document.getElementById('editProfileBtn');
if(editProfileBtn){
  editProfileBtn.addEventListener('click', () => {
    const u = window.demoUser || {};
    const form = document.getElementById('regForm');
    form.name.value = u.name || '';
    form.role.value = u.role || '';
    form.id.value = u.id || '';
    form.age.value = u.age || '';
    // do NOT prefill password for security demo (left blank)
    showLay('lay3');
  });
}

/* --- Login: require ID and password match registration --- */
const loginForm = document.getElementById('loginForm');
loginForm && loginForm.addEventListener('submit', function(ev){
  ev.preventDefault();
  const form = new FormData(loginForm);
  const id = (form.get('loginId')||'').trim();
  const password = form.get('password') || '';

  const u = window.demoUser;
  if(!u){
    alert('No registered user in this demo. Please register first.');
    return;
  }
  if(u.id !== id){
    alert('ID not recognized. Please use the registered ID.');
    return;
  }
  if(u.password !== password){
    alert('Password incorrect. Please use the same password you provided during registration.');
    return;
  }
  // success
  fillProfile(u);
  showLay('lay4');
});

/* --- Patient upload validations (age >=1) and storing --- */
const patients = {}; // keyed by bedNo or patientID
const patientForm = document.getElementById('patientForm');
patientForm && patientForm.addEventListener('submit', function(ev){
  ev.preventDefault();
  const f = new FormData(patientForm);
  const pName = (f.get('pName')||'').trim();
  const pId = (f.get('pId')||'').trim();
  const mobile = (f.get('mobile')||'').trim();
  const gmobile = (f.get('gmobile')||'').trim();
  const age = Number(f.get('page'));
  const bedNo = (f.get('bedNo')||'').trim() || 'unassigned';
  const prescription = (f.get('prescription')||'').trim();

  if(!pName){ alert('Patient name required'); return; }
  if(!Number.isFinite(age) || age < 1){ alert('Patient age must be a positive number (>=1)'); return; }

  const rec = { name: pName, id: pId, mobile, gmobile, age, bedNo, prescription };

  const photoFile = f.get('pPhoto');
  if(photoFile && photoFile.size){
    const reader = new FileReader();
    reader.onload = () => {
      rec.photo = reader.result;
      patients[rec.bedNo || rec.id] = rec;
      renderBeds();
      alert('Patient saved (demo).');
      showLay('lay4');
    };
    reader.readAsDataURL(photoFile);
  } else {
    patients[rec.bedNo || rec.id] = rec;
    renderBeds();
    alert('Patient saved (demo).');
    showLay('lay4');
  }
});

/* preview patient image */
const pPhoto = document.getElementById('pPhoto');
const pPreview = document.getElementById('pPreview');
if(pPhoto){
  pPhoto.addEventListener('change', function(){
    const file = pPhoto.files[0];
    if(!file) return;
    const r = new FileReader();
    r.onload = () => {
      pPreview.innerHTML = '<img src="'+r.result+'" style="max-width:100%;border-radius:8px"/>';
    };
    r.readAsDataURL(file);
  });
}

/* Beds grid: 12 beds B1..B12 */
function renderBeds(){
  const grid = document.getElementById('bedsGrid');
  grid.innerHTML = '';
  for(let i=1;i<=12;i++){
    const id = 'B'+i;
    const occupied = !!patients[id];
    const div = document.createElement('div');
    div.className = 'bed ' + (occupied? 'occupied' : 'available');
    div.textContent = id + (occupied? ' • Occupied' : ' • Available');
    div.dataset.bedNo = id;
    div.addEventListener('click', () => openBedDetail(id));
    grid.appendChild(div);
  }
}
function openBedDetail(bedNo){
  const rec = patients[bedNo];
  document.getElementById('bd_bedno').textContent = 'Bed No: ' + bedNo;
  if(rec){
    document.getElementById('bd_patient').textContent = 'Patient: ' + rec.name;
    document.getElementById('bd_id').textContent = 'Patient ID: ' + (rec.id||'—');
    document.getElementById('bd_age').textContent = 'Age: ' + (rec.age||'—');
    document.getElementById('bd_mobile').textContent = 'Mobile: ' + (rec.mobile||'—');
    document.getElementById('bd_presc').textContent = 'Prescription: ' + (rec.prescription||'—');
  } else {
    document.getElementById('bd_patient').textContent = 'Patient: —';
    document.getElementById('bd_id').textContent = 'Patient ID: —';
    document.getElementById('bd_age').textContent = 'Age: —';
    document.getElementById('bd_mobile').textContent = 'Mobile: —';
    document.getElementById('bd_presc').textContent = 'Prescription: —';
  }
  showLay('lay10');
}

/* --- Shift timings: include doctor and nurse names --- */
const shiftBody = document.getElementById('shiftBody');
let shiftData = [
  { role: 'Doctor', name: 'Dr. Arun', start: '09:00', end: '17:00' },
  { role: 'Nurse', name: 'Nurse Meera', start: '08:00', end: '16:00' }
];
function renderShifts(){
  shiftBody.innerHTML = '';
  shiftData.forEach(s => {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${s.role}</td><td>${s.name}</td><td>${s.start}</td><td>${s.end}</td>`;
    shiftBody.appendChild(tr);
  });
}
renderShifts();

/* Change Shift Timing -> reason box logic */
const changeShiftBtn = document.getElementById('changeShiftBtn');
const changeShiftArea = document.getElementById('changeShiftArea');
const saveShiftChange = document.getElementById('saveShiftChange');
const cancelShiftChange = document.getElementById('cancelShiftChange');
changeShiftBtn && changeShiftBtn.addEventListener('click', ()=> {
  changeShiftArea.style.display = 'block';
});
cancelShiftChange && cancelShiftChange.addEventListener('click', ()=> {
  changeShiftArea.style.display = 'none';
  document.getElementById('shiftReason').value = '';
});
saveShiftChange && saveShiftChange.addEventListener('click', ()=> {
  const reason = (document.getElementById('shiftReason').value || '').trim();
  if(!reason){ alert('Please provide a reason for the shift change'); return; }
  // For demo, just show a toast alert and hide area. In real app you'll record it.
  alert('Shift change requested (demo). Reason saved: ' + reason);
  document.getElementById('shiftReason').value = '';
  changeShiftArea.style.display = 'none';
});

/* --- Settings / Logout only here --- */
const logoutBtn = document.getElementById('logoutBtn');
logoutBtn && logoutBtn.addEventListener('click', ()=>{
  window.demoUser = null;
  alert('Logged out (demo)');
  showLay('lay1');
});

/* App Info button demo */
const appInfoBtn = document.getElementById('appInfoBtn');
appInfoBtn && appInfoBtn.addEventListener('click', ()=> {
  alert('MyCare v1 (demo). Simple ward/patient front-end prototype.');
});

/* Initialize beds grid */
renderBeds();

/* Utility: prevent default form Enter navigation from switching pages accidentally */
document.querySelectorAll('form').forEach(f=>f.addEventListener('keydown', function(e){
  if(e.key === 'Enter' && e.target.tagName !== 'TEXTAREA'){
    // allow enter inside textarea, but for other inputs prevent accidental submit if needed
  }
}));

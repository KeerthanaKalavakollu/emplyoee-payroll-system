const storageKey = "payroll-web-employees";
const OT_RATE = 100;

const state = {
  employees: loadEmployees(),
};

const nodes = {
  addForm: document.querySelector("#add-form"),
  updateForm: document.querySelector("#update-form"),
  slipForm: document.querySelector("#slip-form"),
  totalBtn: document.querySelector("#total-payout-btn"),
  highestBtn: document.querySelector("#highest-paid-btn"),
  employeeGrid: document.querySelector("#employee-grid"),
  emptyState: document.querySelector("#empty-state"),
  totalPayout: document.querySelector("#total-payout"),
  avgNetPay: document.querySelector("#avg-net-pay"),
  topEmployee: document.querySelector("#top-employee"),
  employeeCount: document.querySelector("#employee-count"),
  resultTitle: document.querySelector("#result-title"),
  resultBody: document.querySelector("#result-body"),
  wasmBadge: document.querySelector("#wasm-badge"),
};

initialize();

async function initialize() {
  wireEvents();
  render();
  await tryLoadWasm();
}

function wireEvents() {
  nodes.addForm.addEventListener("submit", handleAddEmployee);
  nodes.updateForm.addEventListener("submit", handleUpdateOt);
  nodes.slipForm.addEventListener("submit", handleGenerateSlip);
  nodes.totalBtn.addEventListener("click", showTotalPayout);
  nodes.highestBtn.addEventListener("click", showHighestPaid);
}

function loadEmployees() {
  const raw = localStorage.getItem(storageKey);
  if (!raw) {
    return [
      { empId: 101, name: "Aarav", basicPay: 42000, otHours: 8 },
      { empId: 102, name: "Diya", basicPay: 31500, otHours: 14 },
    ];
  }

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveEmployees() {
  localStorage.setItem(storageKey, JSON.stringify(state.employees));
}

function calculateGross(employee) {
  return employee.basicPay + employee.otHours * OT_RATE;
}

function calculateTax(employee) {
  const gross = calculateGross(employee);
  if (gross <= 30000) return gross * 0.05;
  if (gross <= 60000) return gross * 0.1;
  return gross * 0.15;
}

function calculateNet(employee) {
  return calculateGross(employee) - calculateTax(employee);
}

function formatMoney(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(value);
}

function handleAddEmployee(event) {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  const employee = {
    empId: Number(form.get("empId")),
    name: String(form.get("name")).trim(),
    basicPay: Number(form.get("basicPay")),
    otHours: Number(form.get("otHours")),
  };

  if (!employee.empId || !employee.name || employee.basicPay < 0 || employee.otHours < 0) {
    setResult("Invalid input", "Please enter a valid employee ID, name, basic pay, and OT hours.");
    return;
  }

  if (state.employees.some((item) => item.empId === employee.empId)) {
    setResult("Duplicate ID", "Employee ID must be unique, just like in your original C++ program.");
    return;
  }

  state.employees.unshift(employee);
  saveEmployees();
  event.currentTarget.reset();
  render();
  setResult("Employee added", `${employee.name} was added successfully.`);
}

function handleUpdateOt(event) {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  const empId = Number(form.get("empId"));
  const otHours = Number(form.get("otHours"));
  const employee = state.employees.find((item) => item.empId === empId);

  if (!employee) {
    setResult("Employee not found", `No employee with ID ${empId} exists right now.`);
    return;
  }

  if (otHours < 0) {
    setResult("Invalid OT hours", "OT hours cannot be negative.");
    return;
  }

  employee.otHours = otHours;
  saveEmployees();
  render();
  setResult("OT updated", `${employee.name}'s overtime hours were updated to ${otHours}.`);
}

function handleGenerateSlip(event) {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  const empId = Number(form.get("empId"));
  const employee = state.employees.find((item) => item.empId === empId);

  if (!employee) {
    setResult("Employee not found", `No payslip could be generated for employee ID ${empId}.`);
    return;
  }

  setResult(
    `Salary Slip: ${employee.name}`,
    [
      `Employee ID: ${employee.empId}`,
      `Basic Pay: ${formatMoney(employee.basicPay)}`,
      `OT Hours: ${employee.otHours}`,
      `Gross Pay: ${formatMoney(calculateGross(employee))}`,
      `Tax: ${formatMoney(calculateTax(employee))}`,
      `Net Pay: ${formatMoney(calculateNet(employee))}`,
    ].join("\n")
  );
}

function showTotalPayout() {
  const total = state.employees.reduce((sum, employee) => sum + calculateNet(employee), 0);
  setResult("Total Salary Payout", formatMoney(total));
}

function showHighestPaid() {
  if (!state.employees.length) {
    setResult("Highest Paid Employee", "No employees available.");
    return;
  }

  const employee = [...state.employees].sort((a, b) => calculateNet(b) - calculateNet(a))[0];
  setResult(
    "Highest Paid Employee",
    [
      `Employee ID: ${employee.empId}`,
      `Name: ${employee.name}`,
      `Gross Pay: ${formatMoney(calculateGross(employee))}`,
      `Net Pay: ${formatMoney(calculateNet(employee))}`,
    ].join("\n")
  );
}

function setResult(title, body) {
  nodes.resultTitle.textContent = title;
  nodes.resultBody.textContent = body;
}

function render() {
  renderCards();
  renderSummary();
}

function renderCards() {
  nodes.employeeGrid.innerHTML = "";

  if (!state.employees.length) {
    nodes.emptyState.hidden = false;
    return;
  }

  nodes.emptyState.hidden = true;

  for (const employee of state.employees) {
    const article = document.createElement("article");
    article.className = "employee-card";
    article.innerHTML = `
      <div class="employee-card__top">
        <div>
          <p class="eyebrow">Employee #${employee.empId}</p>
          <h3>${escapeHtml(employee.name)}</h3>
        </div>
        <span class="pill">${employee.otHours}h OT</span>
      </div>
      <div class="stat-row">
        <span>Basic Pay</span>
        <strong>${formatMoney(employee.basicPay)}</strong>
      </div>
      <div class="stat-row">
        <span>Gross Pay</span>
        <strong>${formatMoney(calculateGross(employee))}</strong>
      </div>
      <div class="stat-row">
        <span>Tax</span>
        <strong>${formatMoney(calculateTax(employee))}</strong>
      </div>
      <div class="stat-row stat-row--net">
        <span>Net Pay</span>
        <strong>${formatMoney(calculateNet(employee))}</strong>
      </div>
    `;
    nodes.employeeGrid.appendChild(article);
  }
}

function renderSummary() {
  const total = state.employees.reduce((sum, employee) => sum + calculateNet(employee), 0);
  const highest = state.employees.length
    ? [...state.employees].sort((a, b) => calculateNet(b) - calculateNet(a))[0]
    : null;
  const average = state.employees.length ? total / state.employees.length : 0;

  nodes.employeeCount.textContent = String(state.employees.length).padStart(2, "0");
  nodes.totalPayout.textContent = formatMoney(total);
  nodes.avgNetPay.textContent = formatMoney(average);
  nodes.topEmployee.textContent = highest ? `${highest.name} (${formatMoney(calculateNet(highest))})` : "None yet";
}

async function tryLoadWasm() {
  try {
    const response = await fetch("index.wasm");
    const bytes = await response.arrayBuffer();
    await WebAssembly.instantiate(bytes);
    nodes.wasmBadge.textContent = "WASM asset ready";
  } catch {
    nodes.wasmBadge.textContent = "JS mode active";
  }
}

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

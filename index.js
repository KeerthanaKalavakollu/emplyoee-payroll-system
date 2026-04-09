const storageKey = "banksphere-state";
const LOW_BALANCE_THRESHOLD = 1000;

const state = loadState();

const nodes = {
  createForm: document.querySelector("#create-form"),
  transactionForm: document.querySelector("#transaction-form"),
  balanceForm: document.querySelector("#balance-form"),
  totalMoneyBtn: document.querySelector("#total-money-btn"),
  lowBalanceBtn: document.querySelector("#low-balance-btn"),
  seedDemoBtn: document.querySelector("#seed-demo-btn"),
  totalAccounts: document.querySelector("#total-accounts"),
  totalMoney: document.querySelector("#total-money"),
  lastTransaction: document.querySelector("#last-transaction"),
  lowBalanceCount: document.querySelector("#low-balance-count"),
  accountsGrid: document.querySelector("#accounts-grid"),
  accountsEmpty: document.querySelector("#accounts-empty"),
  transactionsList: document.querySelector("#transactions-list"),
  transactionsEmpty: document.querySelector("#transactions-empty"),
  resultTitle: document.querySelector("#result-title"),
  resultBody: document.querySelector("#result-body"),
  wasmBadge: document.querySelector("#wasm-badge"),
};

initialize();

function initialize() {
  wireEvents();
  render();
  loadWasm();
}

function wireEvents() {
  nodes.createForm.addEventListener("submit", handleCreateAccount);
  nodes.transactionForm.addEventListener("submit", handleTransaction);
  nodes.balanceForm.addEventListener("submit", handleBalanceEnquiry);
  nodes.totalMoneyBtn.addEventListener("click", showTotalMoney);
  nodes.lowBalanceBtn.addEventListener("click", showLowBalanceAccounts);
  nodes.seedDemoBtn.addEventListener("click", seedDemoAccounts);
}

function loadState() {
  const fallback = {
    accounts: [],
    transactions: [],
  };

  const raw = localStorage.getItem(storageKey);
  if (!raw) {
    return fallback;
  }

  try {
    const parsed = JSON.parse(raw);
    return {
      accounts: Array.isArray(parsed.accounts) ? parsed.accounts : [],
      transactions: Array.isArray(parsed.transactions) ? parsed.transactions : [],
    };
  } catch {
    return fallback;
  }
}

function saveState() {
  localStorage.setItem(storageKey, JSON.stringify(state));
}

function findAccount(accNo) {
  return state.accounts.find((account) => account.accNo === accNo) ?? null;
}

function formatMoney(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(value);
}

function formatDate(value) {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function addTransaction(accNo, type, amount) {
  state.transactions.push({
    accNo,
    type,
    amount,
    time: new Date().toISOString(),
  });
}

function handleCreateAccount(event) {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  const accNo = Number(form.get("accNo"));
  const name = String(form.get("name")).trim();

  if (!accNo || !name) {
    setResult("Invalid account details", "Please enter a valid account number and account holder name.");
    return;
  }

  if (findAccount(accNo)) {
    setResult("Account already exists", `Account number ${accNo} is already in the system.`);
    return;
  }

  state.accounts.push({
    accNo,
    name,
    balance: 0,
  });

  saveState();
  event.currentTarget.reset();
  render();
  setResult("Account created", `Account ${accNo} for ${name} was created successfully.`);
}

function handleTransaction(event) {
  event.preventDefault();
  const submitter = event.submitter;
  const action = submitter?.dataset.action;
  const form = new FormData(event.currentTarget);
  const accNo = Number(form.get("accNo"));
  const amount = Number(form.get("amount"));
  const account = findAccount(accNo);

  if (!account) {
    setResult("Account not found", `No account with number ${accNo} exists.`);
    return;
  }

  if (!amount || amount <= 0) {
    setResult("Invalid amount", "Enter an amount greater than zero.");
    return;
  }

  if (action === "withdraw") {
    if (amount > account.balance) {
      setResult("Insufficient balance", `${account.name} does not have enough balance for this withdrawal.`);
      return;
    }

    account.balance -= amount;
    addTransaction(accNo, "Withdraw", amount);
    setResult("Withdrawal successful", `${formatMoney(amount)} was withdrawn from account ${accNo}.`);
  } else {
    account.balance += amount;
    addTransaction(accNo, "Deposit", amount);
    setResult("Deposit successful", `${formatMoney(amount)} was added to account ${accNo}.`);
  }

  saveState();
  event.currentTarget.reset();
  render();
}

function handleBalanceEnquiry(event) {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  const accNo = Number(form.get("accNo"));
  const account = findAccount(accNo);

  if (!account) {
    setResult("Account not found", `No account with number ${accNo} exists.`);
    return;
  }

  setResult(
    `Balance Enquiry: ${account.name}`,
    [
      `Account Number: ${account.accNo}`,
      `Account Holder: ${account.name}`,
      `Current Balance: ${formatMoney(account.balance)}`,
    ].join("\n")
  );
}

function showTotalMoney() {
  const total = state.accounts.reduce((sum, account) => sum + account.balance, 0);
  setResult("Total Money in Bank", formatMoney(total));
}

function showLowBalanceAccounts() {
  const lowAccounts = state.accounts.filter((account) => account.balance < LOW_BALANCE_THRESHOLD);

  if (!lowAccounts.length) {
    setResult("Low Balance Accounts", `No accounts are below ${formatMoney(LOW_BALANCE_THRESHOLD)}.`);
    return;
  }

  setResult(
    "Low Balance Accounts",
    lowAccounts
      .map((account) => `${account.accNo} | ${account.name} | ${formatMoney(account.balance)}`)
      .join("\n")
  );
}

function seedDemoAccounts() {
  if (state.accounts.length) {
    setResult("Demo skipped", "Demo accounts were not loaded because accounts already exist in storage.");
    return;
  }

  state.accounts.push(
    { accNo: 1001, name: "Aarav Mehta", balance: 12500 },
    { accNo: 1002, name: "Siya Kapoor", balance: 840 },
    { accNo: 1003, name: "Kabir Shah", balance: 27200 }
  );

  addTransaction(1001, "Deposit", 12500);
  addTransaction(1002, "Deposit", 840);
  addTransaction(1003, "Deposit", 27200);

  saveState();
  render();
  setResult("Demo accounts loaded", "Three sample accounts were added so you can explore the dashboard immediately.");
}

function render() {
  renderSummary();
  renderAccounts();
  renderTransactions();
}

function renderSummary() {
  const total = state.accounts.reduce((sum, account) => sum + account.balance, 0);
  const lowCount = state.accounts.filter((account) => account.balance < LOW_BALANCE_THRESHOLD).length;
  const last = state.transactions.at(-1);

  nodes.totalAccounts.textContent = String(state.accounts.length).padStart(2, "0");
  nodes.totalMoney.textContent = formatMoney(total);
  nodes.lowBalanceCount.textContent = String(lowCount);
  nodes.lastTransaction.textContent = last ? `${last.type} | ${formatMoney(last.amount)}` : "None yet";
}

function renderAccounts() {
  nodes.accountsGrid.innerHTML = "";

  if (!state.accounts.length) {
    nodes.accountsEmpty.hidden = false;
    return;
  }

  nodes.accountsEmpty.hidden = true;

  const sortedAccounts = [...state.accounts].sort((a, b) => b.balance - a.balance);

  for (const account of sortedAccounts) {
    const card = document.createElement("article");
    card.className = "account-card";
    card.innerHTML = `
      <div class="account-top">
        <div>
          <p class="eyebrow">Account #${account.accNo}</p>
          <h3>${escapeHtml(account.name)}</h3>
        </div>
        <span class="chip">${account.balance < LOW_BALANCE_THRESHOLD ? "Low balance" : "Healthy"}</span>
      </div>
      <div class="account-meta">
        <span>Current Balance</span>
        <strong>${formatMoney(account.balance)}</strong>
      </div>
    `;
    nodes.accountsGrid.appendChild(card);
  }
}

function renderTransactions() {
  nodes.transactionsList.innerHTML = "";

  const latest = [...state.transactions].slice(-5).reverse();
  if (!latest.length) {
    nodes.transactionsEmpty.hidden = false;
    return;
  }

  nodes.transactionsEmpty.hidden = true;

  for (const item of latest) {
    const card = document.createElement("article");
    card.className = `transaction-card ${item.type.toLowerCase()}`;
    card.innerHTML = `
      <div class="account-top">
        <div>
          <p class="eyebrow">Account #${item.accNo}</p>
          <h3>${item.type}</h3>
        </div>
        <span class="chip">${formatMoney(item.amount)}</span>
      </div>
      <div class="transaction-meta">
        <span>Recorded</span>
        <strong>${formatDate(item.time)}</strong>
      </div>
    `;
    nodes.transactionsList.appendChild(card);
  }
}

async function loadWasm() {
  try {
    const response = await fetch("index.wasm");
    const bytes = await response.arrayBuffer();
    const { instance } = await WebAssembly.instantiate(bytes);
    const score = instance.exports.add(2, 3);
    nodes.wasmBadge.textContent = `WASM online | ${score}`;
  } catch {
    nodes.wasmBadge.textContent = "WASM unavailable";
  }
}

function setResult(title, body) {
  nodes.resultTitle.textContent = title;
  nodes.resultBody.textContent = body;
}

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

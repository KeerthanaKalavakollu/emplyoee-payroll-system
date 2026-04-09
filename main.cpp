#include <ctime>
#include <sstream>
#include <string>
#include <vector>

using namespace std;

class Transaction {
public:
    int accNo;
    string type;
    double amount;
    string timestamp;

    Transaction(int accountNumber, const string &transactionType, double transactionAmount)
        : accNo(accountNumber), type(transactionType), amount(transactionAmount) {
        time_t now = std::time(nullptr);
        timestamp = ctime(&now);
    }
};

class Account {
private:
    int accNo;
    string name;
    double balance;

public:
    Account(int accountNumber, const string &accountName, double openingBalance = 0.0)
        : accNo(accountNumber), name(accountName), balance(openingBalance) {}

    int getAccNo() const { return accNo; }
    const string &getName() const { return name; }
    double getBalance() const { return balance; }

    void deposit(double amount) {
        balance += amount;
    }

    bool withdraw(double amount) {
        if (amount > balance) {
            return false;
        }
        balance -= amount;
        return true;
    }
};

class BankSystem {
private:
    vector<Account> accounts;
    vector<Transaction> transactions;

    int findAccountIndex(int accNo) const {
        for (size_t i = 0; i < accounts.size(); ++i) {
            if (accounts[i].getAccNo() == accNo) {
                return static_cast<int>(i);
            }
        }
        return -1;
    }

public:
    bool createAccount(int accNo, const string &name) {
        if (accNo <= 0 || name.empty() || findAccountIndex(accNo) != -1) {
            return false;
        }

        accounts.emplace_back(accNo, name);
        return true;
    }

    bool deposit(int accNo, double amount) {
        int index = findAccountIndex(accNo);
        if (index == -1 || amount <= 0) {
            return false;
        }

        accounts[index].deposit(amount);
        transactions.emplace_back(accNo, "Deposit", amount);
        return true;
    }

    bool withdraw(int accNo, double amount) {
        int index = findAccountIndex(accNo);
        if (index == -1 || amount <= 0) {
            return false;
        }

        if (!accounts[index].withdraw(amount)) {
            return false;
        }

        transactions.emplace_back(accNo, "Withdraw", amount);
        return true;
    }

    string balanceEnquiry(int accNo) const {
        int index = findAccountIndex(accNo);
        if (index == -1) {
            return "Account not found";
        }

        const Account &account = accounts[index];
        ostringstream out;
        out << "AccNo: " << account.getAccNo() << "\n";
        out << "Name: " << account.getName() << "\n";
        out << "Balance: " << account.getBalance();
        return out.str();
    }

    string lastTransactions(int accNo, int limit = 5) const {
        ostringstream out;
        int count = 0;

        for (int i = static_cast<int>(transactions.size()) - 1; i >= 0 && count < limit; --i) {
            if (transactions[i].accNo == accNo) {
                out << transactions[i].type
                    << " | Amount: " << transactions[i].amount
                    << " | Time: " << transactions[i].timestamp;
                ++count;
            }
        }

        if (count == 0) {
            return "No transactions found";
        }

        return out.str();
    }

    double totalMoney() const {
        double sum = 0.0;
        for (const auto &account : accounts) {
            sum += account.getBalance();
        }
        return sum;
    }

    vector<Account> lowBalanceAccounts(double threshold) const {
        vector<Account> filtered;
        for (const auto &account : accounts) {
            if (account.getBalance() < threshold) {
                filtered.push_back(account);
            }
        }
        return filtered;
    }
};

int main() {
    return 0;
}

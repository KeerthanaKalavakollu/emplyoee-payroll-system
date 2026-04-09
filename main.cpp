#include <algorithm>
#include <sstream>
#include <string>
#include <vector>

using namespace std;

class Employee {
private:
    int empId;
    string name;
    double basicPay;
    int otHours;

public:
    Employee() : empId(0), basicPay(0), otHours(0) {}

    Employee(int id, const string &n, double bp, int ot) {
        empId = id;
        name = n;
        basicPay = bp;
        otHours = ot;
    }

    int getEmpId() const { return empId; }
    const string &getName() const { return name; }
    double getBasicPay() const { return basicPay; }
    int getOTHours() const { return otHours; }

    bool setOTHours(int ot) {
        if (ot < 0) {
            return false;
        }
        otHours = ot;
        return true;
    }

    double calculateGross() const {
        const double otRate = 100.0;
        return basicPay + (otHours * otRate);
    }

    double calculateTax() const {
        double gross = calculateGross();
        if (gross <= 30000) return gross * 0.05;
        if (gross <= 60000) return gross * 0.10;
        return gross * 0.15;
    }

    double calculateNet() const {
        return calculateGross() - calculateTax();
    }
};

class PayrollSystem {
private:
    vector<Employee> employees;

    int findEmployeeIndex(int id) const {
        for (size_t i = 0; i < employees.size(); i++) {
            if (employees[i].getEmpId() == id) {
                return static_cast<int>(i);
            }
        }
        return -1;
    }

public:
    bool addEmployee(int id, const string &name, double basic, int ot) {
        if (id <= 0 || name.empty() || basic < 0 || ot < 0) {
            return false;
        }
        if (findEmployeeIndex(id) != -1) {
            return false;
        }
        employees.emplace_back(id, name, basic, ot);
        return true;
    }

    bool updateOT(int id, int ot) {
        int index = findEmployeeIndex(id);
        if (index == -1) {
            return false;
        }
        return employees[index].setOTHours(ot);
    }

    string generatePayslip(int id) const {
        int index = findEmployeeIndex(id);
        if (index == -1) {
            return "Employee not found";
        }

        const Employee &employee = employees[index];
        ostringstream out;
        out << "Employee ID: " << employee.getEmpId() << "\n";
        out << "Name: " << employee.getName() << "\n";
        out << "Basic Pay: " << employee.getBasicPay() << "\n";
        out << "OT Hours: " << employee.getOTHours() << "\n";
        out << "Gross Pay: " << employee.calculateGross() << "\n";
        out << "Tax: " << employee.calculateTax() << "\n";
        out << "Net Pay: " << employee.calculateNet();
        return out.str();
    }

    double totalPayout() const {
        double total = 0;
        for (const auto &employee : employees) {
            total += employee.calculateNet();
        }
        return total;
    }

    string highestPaidSummary() const {
        if (employees.empty()) {
            return "No employees available";
        }

        const Employee *maxEmp = &employees[0];
        for (const auto &employee : employees) {
            if (employee.calculateNet() > maxEmp->calculateNet()) {
                maxEmp = &employee;
            }
        }

        ostringstream out;
        out << "Highest Paid Employee\n";
        out << "Employee ID: " << maxEmp->getEmpId() << "\n";
        out << "Name: " << maxEmp->getName() << "\n";
        out << "Net Pay: " << maxEmp->calculateNet();
        return out.str();
    }
};

int main() {
    return 0;
}

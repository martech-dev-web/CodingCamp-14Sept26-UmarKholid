// Expenses & Budget Visualizer - Main Application
(function() {
    'use strict';

    // DOM Elements
    const elements = {
        form: document.getElementById('transaction-form'),
        itemNameInput: document.getElementById('item-name'),
        amountInput: document.getElementById('amount'),
        categorySelect: document.getElementById('category'),
        balanceDisplay: document.querySelector('.balance-amount'),
        transactionList: document.getElementById('transaction-list'),
        chartCanvas: document.getElementById('expense-chart'),
        currentYear: document.getElementById('current-year'),
        
        // Validation error elements
        itemNameError: document.getElementById('item-name-error'),
        amountError: document.getElementById('amount-error'),
        categoryError: document.getElementById('category-error'),
        
        // Spending limits elements
        foodLimitInput: document.getElementById('food-limit'),
        transportLimitInput: document.getElementById('transport-limit'),
        funLimitInput: document.getElementById('fun-limit'),
        saveLimitsButton: document.getElementById('save-limits'),
        resetLimitsButton: document.getElementById('reset-limits'),
        limitsStatusList: document.getElementById('limits-status-list'),
        foodLimitError: document.getElementById('food-limit-error'),
        transportLimitError: document.getElementById('transport-limit-error'),
        funLimitError: document.getElementById('fun-limit-error')
    };

    // State Management
    let state = {
        transactions: [],
        totalBalance: 0,
        spendingLimits: {
            Food: 0,
            Transport: 0,
            Fun: 0
        },
        chart: null
    };

    // Storage Module
    const storage = {
        TRANSACTIONS_KEY: 'expenses_budget_visualizer_transactions',
        LIMITS_KEY: 'expenses_budget_visualizer_limits',
        
        getTransactions() {
            try {
                const data = localStorage.getItem(this.TRANSACTIONS_KEY);
                return data ? JSON.parse(data) : [];
            } catch (error) {
                console.error('Error loading transactions from storage:', error);
                return [];
            }
        },
        
        saveTransactions(transactions) {
            try {
                localStorage.setItem(this.TRANSACTIONS_KEY, JSON.stringify(transactions));
                return true;
            } catch (error) {
                console.error('Error saving transactions to storage:', error);
                return false;
            }
        },
        
        getSpendingLimits() {
            try {
                const data = localStorage.getItem(this.LIMITS_KEY);
                return data ? JSON.parse(data) : {
                    Food: 0,
                    Transport: 0,
                    Fun: 0
                };
            } catch (error) {
                console.error('Error loading spending limits from storage:', error);
                return {
                    Food: 0,
                    Transport: 0,
                    Fun: 0
                };
            }
        },
        
        saveSpendingLimits(limits) {
            try {
                localStorage.setItem(this.LIMITS_KEY, JSON.stringify(limits));
                return true;
            } catch (error) {
                console.error('Error saving spending limits to storage:', error);
                return false;
            }
        },
        
        clearAllData() {
            try {
                localStorage.removeItem(this.TRANSACTIONS_KEY);
                localStorage.removeItem(this.LIMITS_KEY);
                return true;
            } catch (error) {
                console.error('Error clearing data from storage:', error);
                return false;
            }
        }
    };

    // Form Validation Module
    const validator = {
        validateItemName(name) {
            name = name.trim();
            if (!name) {
                return { valid: false, message: 'Item name is required' };
            }
            if (name.length > 100) {
                return { valid: false, message: 'Item name must be less than 100 characters' };
            }
            return { valid: true, message: '' };
        },
        
        validateAmount(amount) {
            if (!amount && amount !== 0) {
                return { valid: false, message: 'Amount is required' };
            }
            
            const num = parseFloat(amount);
            if (isNaN(num)) {
                return { valid: false, message: 'Amount must be a positive number' };
            }
            if (num <= 0) {
                return { valid: false, message: 'Amount must be positive' };
            }
            if (num > 1000000) {
                return { valid: false, message: 'Amount is too large' };
            }
            return { valid: true, message: '', value: num };
        },
        
        validateCategory(category) {
            if (!category) {
                return { valid: false, message: 'Please select a category' };
            }
            
            const validCategories = ['Food', 'Transport', 'Fun'];
            if (!validCategories.includes(category)) {
                return { valid: false, message: 'Invalid category selected' };
            }
            return { valid: true, message: '' };
        },
        
        validateForm(formData) {
            const itemNameResult = this.validateItemName(formData.itemName);
            const amountResult = this.validateAmount(formData.amount);
            const categoryResult = this.validateCategory(formData.category);
            
            return {
                valid: itemNameResult.valid && amountResult.valid && categoryResult.valid,
                errors: {
                    itemName: itemNameResult.message,
                    amount: amountResult.message,
                    category: categoryResult.message
                },
                validatedData: {
                    itemName: formData.itemName.trim(),
                    amount: amountResult.value || 0,
                    category: formData.category
                }
            };
        }
    };

    // Spending Limits Validation Module
    const limitsValidator = {
        validateLimitAmount(amount, field) {
            amount = amount.trim();
            if (!amount) {
                return { valid: false, message: `${field} limit is required` };
            }
            
            const num = parseFloat(amount);
            if (isNaN(num)) {
                return { valid: false, message: `${field} limit must be a valid number` };
            }
            if (num < 0) {
                return { valid: false, message: `${field} limit must be positive or zero` };
            }
            if (num > 1000000) {
                return { valid: false, message: `${field} limit is too large` };
            }
            return { valid: true, message: '', value: num };
        },
        
        validateLimits(limitsData) {
            const foodResult = this.validateLimitAmount(limitsData.food, 'Food');
            const transportResult = this.validateLimitAmount(limitsData.transport, 'Transport');
            const funResult = this.validateLimitAmount(limitsData.fun, 'Fun');
            
            return {
                valid: foodResult.valid && transportResult.valid && funResult.valid,
                errors: {
                    food: foodResult.message,
                    transport: transportResult.message,
                    fun: funResult.message
                },
                validatedData: {
                    Food: foodResult.value || 0,
                    Transport: transportResult.value || 0,
                    Fun: funResult.value || 0
                }
            };
        }
    };

    // Transaction Management Module
    const transactionManager = {
        createTransaction(itemName, amount, category) {
            return {
                id: Date.now().toString(),
                itemName: itemName,
                amount: parseFloat(amount.toFixed(2)),
                category: category,
                date: new Date().toISOString(),
                timestamp: Date.now()
            };
        },
        
        addTransaction(transaction) {
            state.transactions.push(transaction);
            return this.saveTransactions();
        },
        
        deleteTransaction(id) {
            state.transactions = state.transactions.filter(t => t.id !== id);
            return this.saveTransactions();
        },
        
        saveTransactions() {
            const success = storage.saveTransactions(state.transactions);
            if (success) {
                this.updateBalance();
                return true;
            }
            return false;
        },
        
        loadTransactions() {
            state.transactions = storage.getTransactions();
            this.updateBalance();
            return state.transactions;
        },
        
        updateBalance() {
            state.totalBalance = state.transactions.reduce((total, transaction) => {
                return total + transaction.amount;
            }, 0);
        },
        
        getTransactionsByCategory(category) {
            return state.transactions.filter(t => t.category === category);
        },
        
        getCategoryTotals() {
            const categories = ['Food', 'Transport', 'Fun'];
            const totals = {};
            
            categories.forEach(category => {
                const categoryTransactions = this.getTransactionsByCategory(category);
                totals[category] = categoryTransactions.reduce((sum, t) => sum + t.amount, 0);
            });
            
            return totals;
        },
        
        getCategoryStatus() {
            const categoryTotals = this.getCategoryTotals();
            const status = {};
            
            Object.keys(state.spendingLimits).forEach(category => {
                const total = categoryTotals[category] || 0;
                const limit = state.spendingLimits[category] || 0;
                const percentage = limit > 0 ? (total / limit) * 100 : 0;
                
                let statusType = 'no-limit';
                if (limit > 0) {
                    if (total > limit) {
                        statusType = 'exceeded';
                    } else if (percentage >= 80) {
                        statusType = 'warning';
                    } else if (total > 0) {
                        statusType = 'within-limit';
                    }
                }
                
                status[category] = {
                    total: total,
                    limit: limit,
                    percentage: percentage,
                    status: statusType,
                    remaining: limit > 0 ? limit - total : null
                };
            });
            
            return status;
        },
        
        checkLimitExceeded(category, amount) {
            const currentTotal = this.getCategoryTotals()[category] || 0;
            const limit = state.spendingLimits[category] || 0;
            
            if (limit === 0) return false;
            return (currentTotal + amount) > limit;
        },
        
        checkLimitWarning(category, amount) {
            const currentTotal = this.getCategoryTotals()[category] || 0;
            const limit = state.spendingLimits[category] || 0;
            
            if (limit === 0) return false;
            const newTotal = currentTotal + amount;
            const percentage = (newTotal / limit) * 100;
            return percentage >= 80;
        }
    };

    // Balance Display Module
    const balanceDisplay = {
        update() {
            const formattedBalance = this.formatCurrency(state.totalBalance);
            elements.balanceDisplay.textContent = formattedBalance;
            
            // Update color based on balance
            if (state.totalBalance > 0) {
                elements.balanceDisplay.style.color = '#27ae60'; // Green
            } else if (state.totalBalance < 0) {
                elements.balanceDisplay.style.color = '#e74c3c'; // Red
            } else {
                elements.balanceDisplay.style.color = '#7f8c8d'; // Gray
            }
        },
        
        formatCurrency(amount) {
            return '$' + amount.toFixed(2);
        }
    };

    // Limits Management Module
    const limitsManager = {
        loadLimits() {
            state.spendingLimits = storage.getSpendingLimits();
            this.updateLimitsUI();
            return state.spendingLimits;
        },
        
        saveLimits(limits) {
            state.spendingLimits = limits;
            const success = storage.saveSpendingLimits(limits);
            if (success) {
                this.updateLimitsUI();
                transactionListManager.updateLimitWarnings();
                chartManager.update();
            }
            return success;
        },
        
        resetLimits() {
            const defaultLimits = {
                Food: 0,
                Transport: 0,
                Fun: 0
            };
            return this.saveLimits(defaultLimits);
        },
        
        updateLimitsUI() {
            // Update input fields
            elements.foodLimitInput.value = state.spendingLimits.Food || '';
            elements.transportLimitInput.value = state.spendingLimits.Transport || '';
            elements.funLimitInput.value = state.spendingLimits.Fun || '';
            
            // Update status display
            this.renderLimitsStatus();
        },
        
        renderLimitsStatus() {
            const categoryStatus = transactionManager.getCategoryStatus();
            const statusList = elements.limitsStatusList;
            
            // Clear existing content
            statusList.innerHTML = '';
            
            let hasLimits = false;
            
            Object.entries(categoryStatus).forEach(([category, status]) => {
                if (status.limit > 0) {
                    hasLimits = true;
                    const statusItem = this.createStatusItem(category, status);
                    statusList.appendChild(statusItem);
                }
            });
            
            if (!hasLimits) {
                statusList.innerHTML = `
                    <div class="no-limits">
                        <p>No spending limits set. Set limits above to track your spending.</p>
                    </div>
                `;
            }
        },
        
        createStatusItem(category, status) {
            const element = document.createElement('div');
            element.className = `status-item ${status.status}`;
            
            const formattedTotal = balanceDisplay.formatCurrency(status.total);
            const formattedLimit = balanceDisplay.formatCurrency(status.limit);
            const percentageText = status.limit > 0 ? `${Math.round(status.percentage)}%` : 'N/A';
            
            element.innerHTML = `
                <div class="status-category">${category}</div>
                <div class="status-details">
                    <span class="status-amount">${formattedTotal}</span>
                    <span>of</span>
                    <span class="status-amount">${formattedLimit}</span>
                    <span class="status-percentage">${percentageText}</span>
                </div>
            `;
            
            return element;
        },
        
        handleSaveLimits() {
            const limitsData = {
                food: elements.foodLimitInput.value,
                transport: elements.transportLimitInput.value,
                fun: elements.funLimitInput.value
            };
            
            const validationResult = limitsValidator.validateLimits(limitsData);
            
            // Clear validation errors
            this.hideValidationError('food');
            this.hideValidationError('transport');
            this.hideValidationError('fun');
            
            if (!validationResult.valid) {
                // Show validation errors
                Object.entries(validationResult.errors).forEach(([field, message]) => {
                    if (message) {
                        this.showValidationError(field, message);
                    }
                });
                return;
            }
            
            const success = this.saveLimits(validationResult.validatedData);
            
            if (success) {
                this.showSuccessFeedback();
            } else {
                alert('Failed to save spending limits. Please try again.');
            }
        },
        
        showValidationError(field, message) {
            const errorElement = elements[`${field}LimitError`];
            let inputElement;
            if (field === 'food') inputElement = elements.foodLimitInput;
            else if (field === 'transport') inputElement = elements.transportLimitInput;
            else if (field === 'fun') inputElement = elements.funLimitInput;
            
            if (errorElement) {
                errorElement.textContent = message;
                errorElement.classList.add('show');
            }
            if (inputElement) {
                inputElement.setAttribute('aria-invalid', 'true');
            }
        },
        
        hideValidationError(field) {
            const errorElement = elements[`${field}LimitError`];
            let inputElement;
            if (field === 'food') inputElement = elements.foodLimitInput;
            else if (field === 'transport') inputElement = elements.transportLimitInput;
            else if (field === 'fun') inputElement = elements.funLimitInput;
            
            if (errorElement) {
                errorElement.textContent = '';
                errorElement.classList.remove('show');
            }
            if (inputElement) {
                inputElement.setAttribute('aria-invalid', 'false');
            }
        },
        
        clearValidationErrors() {
            this.hideValidationError('food');
            this.hideValidationError('transport');
            this.hideValidationError('fun');
        },
        
        showSuccessFeedback() {
            const originalText = elements.saveLimitsButton.textContent;
            
            elements.saveLimitsButton.textContent = '✓ Saved!';
            elements.saveLimitsButton.style.backgroundColor = '#27ae60';
            
            setTimeout(() => {
                elements.saveLimitsButton.textContent = originalText;
                elements.saveLimitsButton.style.backgroundColor = '';
            }, 1500);
        }
    };

    // Chart Module
    const chartManager = {
        init() {
            if (!elements.chartCanvas) return;
            
            const ctx = elements.chartCanvas.getContext('2d');
            const categoryTotals = transactionManager.getCategoryTotals();
            const categoryStatus = transactionManager.getCategoryStatus();
            
            // Get colors based on limit status
            const colors = this.getChartColors(categoryStatus);
            
            state.chart = new Chart(ctx, {
                type: 'pie',
                data: {
                    labels: this.getChartLabels(categoryStatus),
                    datasets: [{
                        data: Object.values(categoryTotals),
                        backgroundColor: colors,
                        borderColor: '#fff',
                        borderWidth: 2,
                        hoverOffset: 15
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'bottom',
                            labels: {
                                padding: 20,
                                font: {
                                    size: 14
                                }
                            }
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    const label = context.label || '';
                                    const value = context.raw || 0;
                                    const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                    const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
                                    
                                    // Add limit info to tooltip if available
                                    const category = label.replace(' ⚠️', '').replace(' ❌', '');
                                    const limit = state.spendingLimits[category] || 0;
                                    let tooltipText = `${label}: $${value.toFixed(2)} (${percentage}%)`;
                                    
                                    if (limit > 0) {
                                        const limitPercentage = Math.round((value / limit) * 100);
                                        tooltipText += `\nLimit: $${limit.toFixed(2)} (${limitPercentage}%)`;
                                    }
                                    
                                    return tooltipText;
                                }
                            }
                        }
                    }
                }
            });
        },
        
        getChartColors(categoryStatus) {
            const colors = [];
            const categories = ['Food', 'Transport', 'Fun'];
            
            categories.forEach(category => {
                const status = categoryStatus[category];
                if (status.status === 'exceeded') {
                    colors.push('#e74c3c'); // Red for exceeded
                } else if (status.status === 'warning') {
                    colors.push('#f39c12'); // Orange for warning
                } else if (category === 'Food') {
                    colors.push('#3498db'); // Blue for Food
                } else if (category === 'Transport') {
                    colors.push('#2ecc71'); // Green for Transport
                } else if (category === 'Fun') {
                    colors.push('#9b59b6'); // Purple for Fun
                }
            });
            
            return colors;
        },
        
        getChartLabels(categoryStatus) {
            const labels = [];
            const categories = ['Food', 'Transport', 'Fun'];
            
            categories.forEach(category => {
                const status = categoryStatus[category];
                let label = category;
                
                if (status.status === 'exceeded') {
                    label += ' ❌'; // Exceeded indicator
                } else if (status.status === 'warning') {
                    label += ' ⚠️'; // Warning indicator
                }
                
                labels.push(label);
            });
            
            return labels;
        },
        
        update() {
            if (!state.chart) {
                this.init();
                return;
            }
            
            const categoryTotals = transactionManager.getCategoryTotals();
            
            state.chart.data.labels = Object.keys(categoryTotals);
            state.chart.data.datasets[0].data = Object.values(categoryTotals);
            state.chart.update();
        },
        
        destroy() {
            if (state.chart) {
                state.chart.destroy();
                state.chart = null;
            }
        }
    };

    // Transaction List Module
    const transactionListManager = {
        render() {
            if (state.transactions.length === 0) {
                elements.transactionList.innerHTML = `
                    <div class="no-transactions">
                        <p>No transactions yet. Add your first transaction above!</p>
                    </div>
                `;
                return;
            }
            
            // Clear existing content
            elements.transactionList.innerHTML = '';
            
            // Sort transactions by timestamp (newest first)
            const sortedTransactions = [...state.transactions].sort((a, b) => b.timestamp - a.timestamp);
            
            // Render each transaction
            sortedTransactions.forEach(transaction => {
                const transactionElement = this.createTransactionElement(transaction);
                elements.transactionList.appendChild(transactionElement);
            });
        },
        
        createTransactionElement(transaction) {
            const element = document.createElement('div');
            element.className = 'transaction-item';
            element.dataset.id = transaction.id;
            
            const formattedAmount = balanceDisplay.formatCurrency(transaction.amount);
            
            element.innerHTML = `
                <div class="transaction-info">
                    <div class="transaction-name">${this.escapeHtml(transaction.itemName)}</div>
                    <span class="transaction-category">${this.escapeHtml(transaction.category)}</span>
                </div>
                <div class="transaction-amount">${formattedAmount}</div>
                <button class="transaction-delete" aria-label="Delete transaction">×</button>
            `;
            
            // Add delete event listener
            const deleteButton = element.querySelector('.transaction-delete');
            deleteButton.addEventListener('click', () => {
                this.handleDeleteTransaction(transaction.id);
            });
            
            return element;
        },
        
        handleDeleteTransaction(id) {
            if (confirm('Are you sure you want to delete this transaction?')) {
                const success = transactionManager.deleteTransaction(id);
                if (success) {
                    this.render();
                    balanceDisplay.update();
                    chartManager.update();
                } else {
                    alert('Failed to delete transaction. Please try again.');
                }
            }
        },
        
        escapeHtml(text) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        },
        
        updateLimitWarnings() {
            const transactionItems = document.querySelectorAll('.transaction-item');
            const categoryTotals = {};
            
            // Calculate current totals for each category
            state.transactions.forEach(transaction => {
                if (!categoryTotals[transaction.category]) {
                    categoryTotals[transaction.category] = 0;
                }
                categoryTotals[transaction.category] += transaction.amount;
            });
            
            // Apply limit warnings
            transactionItems.forEach(item => {
                const id = item.dataset.id;
                const transaction = state.transactions.find(t => t.id === id);
                
                if (transaction) {
                    // Remove existing limit classes
                    item.classList.remove('limit-warning', 'limit-exceeded');
                    
                    // Check if limits are set for this category
                    const limit = state.spendingLimits[transaction.category] || 0;
                    if (limit > 0) {
                        const total = categoryTotals[transaction.category] || 0;
                        const percentage = (total / limit) * 100;
                        
                        if (total > limit) {
                            item.classList.add('limit-exceeded');
                        } else if (percentage >= 80) {
                            item.classList.add('limit-warning');
                        }
                    }
                }
            });
        }
    };

    // Form Handler Module
    const formHandler = {
        getFormData() {
            return {
                itemName: elements.itemNameInput.value,
                amount: elements.amountInput.value,
                category: elements.categorySelect.value
            };
        },
        
        showValidationError(field, message) {
            const errorElement = elements[`${field}Error`];
            let inputElement;
            if (field === 'itemName') inputElement = elements.itemNameInput;
            else if (field === 'amount') inputElement = elements.amountInput;
            else if (field === 'category') inputElement = elements.categorySelect;
            
            if (errorElement) {
                errorElement.textContent = message;
                errorElement.classList.add('show');
            }
            if (inputElement) {
                inputElement.setAttribute('aria-invalid', 'true');
            }
        },
        
        hideValidationError(field) {
            const errorElement = elements[`${field}Error`];
            let inputElement;
            if (field === 'itemName') inputElement = elements.itemNameInput;
            else if (field === 'amount') inputElement = elements.amountInput;
            else if (field === 'category') inputElement = elements.categorySelect;
            
            if (errorElement) {
                errorElement.textContent = '';
                errorElement.classList.remove('show');
            }
            if (inputElement) {
                inputElement.setAttribute('aria-invalid', 'false');
            }
        },
        
        clearValidationErrors() {
            this.hideValidationError('itemName');
            this.hideValidationError('amount');
            this.hideValidationError('category');
        },
        
        resetForm() {
            elements.form.reset();
            this.clearValidationErrors();
            elements.itemNameInput.focus();
        },
        
        handleFormSubmit(event) {
            event.preventDefault();
            
            const formData = this.getFormData();
            const validationResult = validator.validateForm(formData);
            
            this.clearValidationErrors();
            
            if (!validationResult.valid) {
                // Show validation errors
                Object.entries(validationResult.errors).forEach(([field, message]) => {
                    if (message) {
                        this.showValidationError(field, message);
                    }
                });
                return;
            }
            
            // Create and save transaction
            const transaction = transactionManager.createTransaction(
                validationResult.validatedData.itemName,
                validationResult.validatedData.amount,
                validationResult.validatedData.category
            );
            
            const success = transactionManager.addTransaction(transaction);
            
            if (success) {
                // Update UI
                transactionListManager.render();
                balanceDisplay.update();
                chartManager.update();
                this.resetForm();
                
                // Check limits and show warnings if needed
                const limitExceeded = transactionManager.checkLimitExceeded(
                    validationResult.validatedData.category,
                    validationResult.validatedData.amount
                );
                
                const limitWarning = transactionManager.checkLimitWarning(
                    validationResult.validatedData.category,
                    validationResult.validatedData.amount
                );
                
                // Update limit warnings on transaction list
                transactionListManager.updateLimitWarnings();
                
                // Show success feedback with limit warning if needed
                this.showSuccessFeedback(limitExceeded, limitWarning);
            } else {
                alert('Failed to save transaction. Please try again.');
            }
        },
        
        showSuccessFeedback(limitExceeded = false, limitWarning = false) {
            const submitButton = elements.form.querySelector('.submit-button');
            const originalText = submitButton.textContent;
            
            if (limitExceeded) {
                submitButton.textContent = '⚠️ Exceeded!';
                submitButton.style.backgroundColor = '#e74c3c';
            } else if (limitWarning) {
                submitButton.textContent = '⚠️ Warning!';
                submitButton.style.backgroundColor = '#f39c12';
            } else {
                submitButton.textContent = '✓ Added!';
                submitButton.style.backgroundColor = '#27ae60';
            }
            
            setTimeout(() => {
                submitButton.textContent = originalText;
                submitButton.style.backgroundColor = '';
            }, 1500);
        },
        
        setupInputValidation() {
            // Real-time validation for item name
            elements.itemNameInput.addEventListener('blur', () => {
                const result = validator.validateItemName(elements.itemNameInput.value);
                if (!result.valid) {
                    this.showValidationError('itemName', result.message);
                } else {
                    this.hideValidationError('itemName');
                }
            });
            
            // Real-time validation for amount
            elements.amountInput.addEventListener('blur', () => {
                const result = validator.validateAmount(elements.amountInput.value);
                if (!result.valid) {
                    this.showValidationError('amount', result.message);
                } else {
                    this.hideValidationError('amount');
                }
            });
            
            // Real-time validation for category
            elements.categorySelect.addEventListener('change', () => {
                const result = validator.validateCategory(elements.categorySelect.value);
                if (!result.valid) {
                    this.showValidationError('category', result.message);
                } else {
                    this.hideValidationError('category');
                }
            });
        }
    };

    // Main Application Functions
    function loadTransactions() {
        transactionManager.loadTransactions();
        transactionListManager.render();
        balanceDisplay.update();
    }
    
    function loadLimits() {
        limitsManager.loadLimits();
    }
    
    function updateUI() {
        transactionListManager.render();
        balanceDisplay.update();
        limitsManager.updateLimitsUI();
        chartManager.update();
        transactionListManager.updateLimitWarnings();
    }
    
    function setupEventListeners() {
        // Form submission
        elements.form.addEventListener('submit', (e) => formHandler.handleFormSubmit(e));
        
        // Setup real-time validation
        formHandler.setupInputValidation();
        
        // Clear validation errors when user starts typing
        elements.itemNameInput.addEventListener('input', () => {
            formHandler.hideValidationError('itemName');
        });
        
        elements.amountInput.addEventListener('input', () => {
            formHandler.hideValidationError('amount');
        });
    }
    
    function initializeCurrentYear() {
        if (elements.currentYear) {
            elements.currentYear.textContent = new Date().getFullYear();
        }
    }

    // Initialization
    function init() {
        initializeCurrentYear();
        loadTransactions();
        chartManager.init();
        setupEventListeners();
        
        console.log('Expenses & Budget Visualizer initialized successfully');
    }

    // Initialize application when DOM is loaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Expose some functionality for debugging (optional)
    window.app = {
        state,
        transactionManager,
        balanceDisplay,
        chartManager,
        formHandler,
        validator
    };

})();
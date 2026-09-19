# Design Document

## System Overview

The Expenses & Budget Visualizer is a client-side web application built with vanilla JavaScript, HTML, and CSS. The application allows users to track expenses, visualize spending patterns, and maintain financial records entirely in the browser using Local Storage.

## Architecture

### High-Level Architecture
```
┌─────────────────────────────────────────────────────────────┐
│                    Browser Environment                       │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │   HTML      │  │    CSS      │  │   JavaScript        │  │
│  │  (Structure)│  │  (Styling)  │  │   (Logic & Data)    │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
│          │               │                     │             │
│          └───────────────┼─────────────────────┘             │
│                          │                                   │
│                  ┌───────▼───────┐                           │
│                  │    DOM Tree   │                           │
│                  └───────┬───────┘                           │
│                          │                                   │
│                  ┌───────▼───────┐                           │
│                  │ Local Storage │                           │
│                  │  (Persistent  │                           │
│                  │    Storage)   │                           │
│                  └───────────────┘                           │
└─────────────────────────────────────────────────────────────┘
```

### Component Architecture
```
┌─────────────────────────────────────────────────────────────┐
│                 Expenses & Budget Visualizer                 │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │  UI Layer   │  │ Data Layer  │  │  Visualization      │  │
│  │  (HTML/CSS) │  │ (JS/Storage)│  │   Layer (Chart.js)  │  │
│  └──────┬──────┘  └──────┬──────┘  └──────────┬──────────┘  │
│         │                │                     │             │
│  ┌──────▼──────┐  ┌─────▼──────┐     ┌───────▼─────────┐    │
│  │ Input Form  │  │Transaction │     │   Pie Chart     │    │
│  │ Balance     │  │ Management │     │   Generator     │    │
│  │ Transaction │  │ Local      │     │   Updater       │    │
│  │ List        │  │ Storage    │     └─────────────────┘    │
│  └─────────────┘  │ Operations │                            │
│                   └────────────┘                            │
└─────────────────────────────────────────────────────────────┘
```

## Data Model

### Transaction Schema
```javascript
{
  id: string,          // Unique identifier (Date.now().toString())
  itemName: string,    // Name of the expense item
  amount: number,      // Positive numeric value
  category: string,    // 'Food', 'Transport', 'Fun' (or custom)
  date: string,        // ISO date string
  timestamp: number    // Unix timestamp for sorting
}
```

### Storage Schema
```javascript
{
  transactions: Transaction[],  // Array of transaction objects
  categories: string[],         // Default: ['Food', 'Transport', 'Fun']
  settings: {                   // User preferences
    currency: string,           // Default: '$'
    theme: 'light' | 'dark',    // Default: 'light'
    spendingLimits: {           // Optional feature
      Food: number,
      Transport: number,
      Fun: number
    }
  }
}
```

## User Interface Design

### Layout Structure
```
┌─────────────────────────────────────────────────────────────┐
│                    Expenses & Budget Visualizer              │
├─────────────────────────────────────────────────────────────┤
│  ┌───────────────────────────────────────────────────────┐  │
│  │  Total Balance: $XXX                                  │  │
│  │  [Color-coded: green for positive, red for negative]  │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌─────────────┐  ┌─────────────────────────────────────┐  │
│  │             │  │                                     │  │
│  │   INPUT     │  │           PIE CHART                │  │
│  │   FORM      │  │  (Visual breakdown by category)    │  │
│  │             │  │                                     │  │
│  └─────────────┘  └─────────────────────────────────────┘  │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐  │
│  │              TRANSACTION LIST                         │  │
│  │  [Scrollable list with delete buttons]                │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Input Form Design
```
┌─────────────────────────────────────────────────────────────┐
│                     Add New Transaction                      │
├─────────────────────────────────────────────────────────────┤
│ Item Name: [_____________________________]                   │
│                                                             │
│ Amount:    [$ _______________]                              │
│                                                             │
│ Category:  [▼ Food ▼ Transport ▼ Fun]                       │
│                                                             │
│                 [Add Transaction]                           │
│                                                             │
│ (Validation messages appear below relevant fields)          │
└─────────────────────────────────────────────────────────────┘
```

### Transaction List Design
```
┌─────────────────────────────────────────────────────────────┐
│                    Recent Transactions                       │
├─────────────────────────────────────────────────────────────┤
│ Coffee Shop      $12.50    Food       [×]                   │
│ Uber Ride        $25.00    Transport  [×]                   │
│ Movie Tickets    $40.00    Fun        [×]                   │
│ Groceries        $85.30    Food       [×]                   │
│ Gas              $45.00    Transport  [×]                   │
│ Restaurant       $65.00    Food       [×]                   │
└─────────────────────────────────────────────────────────────┘
```

## Component Design

### 1. Input Form Component
**Responsibilities:**
- Collect transaction data from user
- Validate input fields
- Submit valid data to transaction manager

**Methods:**
- `validateForm()`: Check all fields meet requirements
- `resetForm()`: Clear form after submission
- `showValidationError(field, message)`: Display error messages
- `hideValidationError(field)`: Remove error messages

### 2. Transaction Manager Component
**Responsibilities:**
- CRUD operations for transactions
- Local Storage integration
- Data persistence management

**Methods:**
- `addTransaction(transaction)`: Add new transaction
- `deleteTransaction(id)`: Remove transaction by ID
- `getAllTransactions()`: Retrieve all transactions
- `calculateTotal()`: Compute sum of all amounts
- `getTransactionsByCategory(category)`: Filter by category

### 3. Balance Display Component
**Responsibilities:**
- Display total balance
- Update automatically on data changes
- Apply color coding (green/red)

**Methods:**
- `updateBalance(total)`: Refresh balance display
- `formatCurrency(amount)`: Format with currency symbol
- `getBalanceColor(total)`: Determine color based on value

### 4. Pie Chart Component
**Responsibilities:**
- Generate pie chart visualization
- Update chart on data changes
- Handle chart interactions

**Methods:**
- `renderChart(data)`: Create/update pie chart
- `getChartData()`: Process transactions for chart format
- `updateChart()`: Refresh chart with latest data
- `destroyChart()`: Clean up chart instance

### 5. Transaction List Component
**Responsibilities:**
- Display scrollable list of transactions
- Handle delete operations
- Support sorting (optional feature)

**Methods:**
- `renderList(transactions)`: Display transaction list
- `createTransactionElement(transaction)`: Create DOM element for transaction
- `sortList(criteria, order)`: Sort transactions (optional)

## File Structure
```
project/
├── index.html          # Main HTML file
├── css/
│   └── style.css       # Single CSS file (all styles)
├── js/
│   └── app.js          # Single JavaScript file (all logic)
└── assets/             # Optional: images, fonts, etc.
```

## Implementation Details

### CSS Structure
```css
/* style.css - Organized by component */
:root {
  /* CSS Variables for theming */
  --primary-color: #3498db;
  --secondary-color: #2ecc71;
  --danger-color: #e74c3c;
  --text-color: #333;
  --bg-color: #f8f9fa;
  --card-bg: #ffffff;
  --border-color: #e0e0e0;
}

/* Reset and base styles */
* { box-sizing: border-box; margin: 0; padding: 0; }

/* Layout components */
.container { max-width: 1200px; margin: 0 auto; padding: 20px; }
.header { /* ... */ }
.main-content { /* ... */ }
.footer { /* ... */ }

/* Form styles */
.form-group { /* ... */ }
.form-input { /* ... */ }
.form-select { /* ... */ }
.form-button { /* ... */ }
.validation-error { /* ... */ }

/* Transaction list styles */
.transaction-list { /* ... */ }
.transaction-item { /* ... */ }
.transaction-delete { /* ... */ }

/* Balance display styles */
.balance-display { /* ... */ }
.balance-positive { /* ... */ }
.balance-negative { /* ... */ }

/* Responsive design */
@media (max-width: 768px) { /* Mobile styles */ }
@media (min-width: 769px) and (max-width: 1024px) { /* Tablet styles */ }
@media (min-width: 1025px) { /* Desktop styles */ }
```

### JavaScript Module Structure
```javascript
// app.js - Organized by component
(function() {
  'use strict';

  // DOM Elements
  const elements = {
    form: document.getElementById('transaction-form'),
    itemNameInput: document.getElementById('item-name'),
    amountInput: document.getElementById('amount'),
    categorySelect: document.getElementById('category'),
    balanceDisplay: document.getElementById('total-balance'),
    transactionList: document.getElementById('transaction-list'),
    chartCanvas: document.getElementById('expense-chart')
  };

  // State Management
  let state = {
    transactions: [],
    totalBalance: 0,
    chart: null
  };

  // Storage Module
  const storage = {
    getTransactions() { /* ... */ },
    saveTransaction(transaction) { /* ... */ },
    deleteTransaction(id) { /* ... */ },
    // ... other storage methods
  };

  // Form Module
  const form = {
    validate() { /* ... */ },
    getFormData() { /* ... */ },
    reset() { /* ... */ },
    // ... other form methods
  };

  // Balance Module
  const balance = {
    calculate() { /* ... */ },
    updateDisplay() { /* ... */ },
    // ... other balance methods
  };

  // Chart Module
  const chart = {
    init() { /* ... */ },
    update() { /* ... */ },
    destroy() { /* ... */ },
    // ... other chart methods
  };

  // Transaction List Module
  const transactionList = {
    render() { /* ... */ },
    addItem(transaction) { /* ... */ },
    removeItem(id) { /* ... */ },
    // ... other list methods
  };

  // Initialization
  function init() {
    loadTransactions();
    setupEventListeners();
    updateUI();
  }

  // Event Listeners
  function setupEventListeners() {
    elements.form.addEventListener('submit', handleFormSubmit);
    // ... other event listeners
  }

  // Main Functions
  function loadTransactions() { /* ... */ }
  function handleFormSubmit(event) { /* ... */ }
  function updateUI() { /* ... */ }

  // Initialize application
  document.addEventListener('DOMContentLoaded', init);
})();
```

## Technical Implementation Notes

### Local Storage Strategy
- Use `localStorage.setItem('expenses', JSON.stringify(data))` for saving
- Use `JSON.parse(localStorage.getItem('expenses'))` for loading
- Implement error handling for storage limits and permissions
- Add data migration strategy for future schema changes

### Chart.js Integration
- Include Chart.js via CDN: `<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>`
- Initialize pie chart with category data
- Implement responsive chart sizing
- Add tooltips and interactivity

### Responsive Design Implementation
- Mobile-first CSS approach
- Flexible grid layout using CSS Grid/Flexbox
- Responsive typography (rem units, viewport units)
- Touch-friendly interface elements
- Progressive enhancement for older browsers

### Performance Optimizations
- Debounce chart updates during rapid data changes
- Virtual scrolling for large transaction lists (optional)
- Lazy loading for optional features
- Minify production CSS/JS (build step optional)

### Error Handling
- Form validation with user-friendly messages
- Local Storage failure handling (fallback to session)
- Chart.js load failure fallback
- Network error handling for CDN resources

## Testing Strategy

### Unit Tests
- Form validation logic
- Transaction calculations
- Local Storage operations
- Data transformation functions

### Integration Tests
- Form submission flow
- Chart updates with new data
- Transaction deletion flow
- Responsive layout testing

### Manual Testing Checklist
- [ ] Form validation works correctly
- [ ] Transactions persist across page reloads
- [ ] Balance updates automatically
- [ ] Chart reflects current data
- [ ] Mobile responsive design works
- [ ] All optional features function (if implemented)

## Deployment

### Requirements
- Modern web browser with Local Storage support
- Internet connection for Chart.js CDN (optional: include locally)
- No server requirements - can run from file system

### Browser Support
- Chrome 50+
- Firefox 45+
- Safari 10+
- Edge 79+

## Optional Features Implementation

If implementing optional challenges, consider:

1. **Custom Categories**: Add form to create new categories, store in settings
2. **Monthly Summary**: Add date filtering and aggregation logic
3. **Transaction Sorting**: Add sort buttons and sorting algorithms
4. **Spending Limits**: Add settings form and visual indicators
5. **Dark/Light Mode**: Add theme toggle and CSS variable updates
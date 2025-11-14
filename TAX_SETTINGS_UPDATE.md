# Tax Settings Feature Implementation

## Overview
Added a default tax percentage setting in the Settings page with an enable/disable toggle. When enabled, the tax automatically applies to all bills. The tax is loaded and applied dynamically on the billing page.

## Changes Made

### 1. Settings Page (index.html)
- Added "Enable Default Tax" checkbox to turn the feature on/off
- Added "Default Tax Percentage (%)" field in the Business Information section
- Input allows decimal values from 0 to 100
- Tax input is disabled when checkbox is unchecked (visual feedback with reduced opacity)
- Includes helpful description text explaining the feature

### 2. Settings Management (renderer.js)
- Added `loadBusinessSettings()` function to load saved settings from localStorage
- Added `saveBusinessSettings()` function to save settings to localStorage
- Added checkbox state management to enable/disable tax input field
- Settings include:
  - Business Name
  - Address
  - Phone
  - GST Number
  - **Enable Default Tax** (NEW - checkbox)
  - **Default Tax Percentage** (NEW - only applies when enabled)

### 3. Billing Calculation (renderer.js - updateBillSummary)
- Checks if default tax is enabled before applying it
- Only applies tax if `enableDefaultTax` is true in settings
- Calculates default tax on the subtotal: `(subtotal × defaultTaxPercentage) / 100`
- Adds default tax to product-specific taxes
- Updates tax info label to show when default tax is applied
- Example: "Tax: (incl. 18% default tax)"

### 4. Tax Display (index.html - Billing Page)
- Added a dynamic label next to the Tax field showing the applied default tax percentage
- Label only shows when default tax is enabled and greater than 0
- Format: "Tax: (incl. X% default tax) ₹amount"

## How It Works

1. **Enabling and Setting Tax:**
   - Navigate to Settings page
   - Check the "Enable Default Tax" checkbox
   - Enter desired tax percentage in "Default Tax Percentage (%)" field (e.g., 18)
   - Click "Save Changes"
   - Settings are saved to localStorage

2. **Disabling Tax:**
   - Uncheck the "Enable Default Tax" checkbox
   - Tax percentage field becomes disabled
   - Click "Save Changes"
   - No default tax will be applied to bills

3. **Applying Tax to Bills:**
   - When default tax is enabled, the system automatically:
     - Calculates subtotal from all items
     - Adds product-specific taxes (if any)
     - Adds default tax percentage to the subtotal
     - Displays total tax amount with info label
   - When disabled, only product-specific taxes are shown (the ₹200 you saw was product taxes)

4. **Real-time Updates:**
   - When you enable/disable or change the tax percentage in settings and save, it immediately updates on the billing page if it's active
   - Tax calculation happens dynamically whenever:
     - Items are added/removed from the bill
     - Quantities are changed
     - Discount is modified

## Example Scenarios

### Scenario 1: Default Tax Disabled (Your Current Issue)
**Settings:**
- Enable Default Tax: ☐ (unchecked)
- Default Tax Percentage: 0%

**Billing:**
- Subtotal: ₹1000
- Product-specific tax: ₹200 (20%)
- Default tax: ₹0 (disabled)
- **Total tax: ₹200** ← This is what you see!
- Display: "Tax: ₹200.00" (no label shown)

### Scenario 2: Default Tax Enabled
**Settings:**
- Enable Default Tax: ☑ (checked)
- Default Tax Percentage: 18%

**Billing:**
- Subtotal: ₹1000
- Product-specific tax: ₹200 (20%)
- Default tax: ₹180 (18% of ₹1000)
- **Total tax: ₹380**
- Display: "Tax: (incl. 18% default tax) ₹380.00"

### Scenario 3: Only Default Tax (No Product Taxes)
**Settings:**
- Enable Default Tax: ☑ (checked)
- Default Tax Percentage: 18%

**Billing:**
- Subtotal: ₹1000
- Product-specific tax: ₹0
- Default tax: ₹180 (18% of ₹1000)
- **Total tax: ₹180**
- Display: "Tax: (incl. 18% default tax) ₹180.00"

## Features

✅ Enable/Disable toggle for default tax
✅ Persistent settings stored in localStorage
✅ Real-time tax calculation
✅ Visual indicator showing applied tax percentage
✅ Works alongside product-specific taxes
✅ Decimal precision support (e.g., 18.5%)
✅ Automatic update when settings change
✅ Zero tax option (uncheck to disable)
✅ Disabled input field when feature is off (visual feedback)

## Usage Tips

- **To disable default tax:** Uncheck "Enable Default Tax" and save
- **The ₹200 you saw:** This is from your products' individual tax settings, not the default tax
- Useful for GST, VAT, or other standard taxes
- Combines with product-specific taxes when enabled
- Changes apply immediately to new bills
- Does not affect existing/historical bills

## Files Modified

1. `src/index.html` - Added checkbox and tax input field with enable/disable functionality
2. `src/renderer.js` - Added settings management, checkbox handling, and updated billing calculation logic

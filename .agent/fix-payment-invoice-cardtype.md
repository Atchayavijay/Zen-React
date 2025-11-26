# Payment & Invoice Card Type Fixes

## Summary
Fixed payment and invoice handling to properly display only relevant fee fields based on the selected card type in both EditLeadForm and PaymentsInvoices module.

## Issues Fixed

### 1. EditLeadForm - Card Type Visibility
**Problem**: When editing a lead, the payment section showed ALL fee data (both training and placement) regardless of the selected card type. If you updated a lead from "Training Only" to "Placement Only", the old training fee data was still visible.

**Solution**: 
- Added card type IDs mapping (TRAINING, PLACEMENT, BOTH) similar to AddLeadModal
- Implemented conditional visibility logic in the Payment Info step (Step 3)
- Now only shows:
  - **Training fees** when card type is "Training Only" or "Training + Placement"
  - **Placement fees** when card type is "Placement Only" or "Training + Placement"
  - Nothing if no card type is selected (with helpful message)

**Files Changed**: 
- `Frontend/src/features/leads/modals/EditLeadForm.jsx`

### 2. PaymentsInvoices - Missing Discounted Fee
**Problem**: The Placement Fee section in PaymentsInvoicesMain only displayed "Placement Fee" (actual fee) without showing the "Placement Discounted Fee" field. This was inconsistent with the Training Fee section which properly shows both "Actual Fee" and "Discounted Fee".

**Solution**: 
- Updated `renderPlacementFeeContent()` function to display both:
  - **Placement Actual Fee** (`placement_fee`)
  - **Placement Discounted Fee** (`placement_discounted_fee`)
- Updated balance calculation to use discounted fee when available, otherwise fall back to actual fee
- Reorganized fields to match the training fee layout

**Files Changed**: 
- `Frontend/src/features/PaymentsInvoices/PaymentsInvoicesMain.jsx`

### 3. PaymentsInvoices - Tab Visibility Logic
**Problem**: The Payment & Invoices page did not automatically update the visible tabs (Course vs Placement) when a lead's card type was changed. It would show tabs irrelevant to the current card type or fail to switch to the correct one.

**Solution**:
- Updated `selectLead` to check the lead's `card_type_name` and automatically set the active `feeTab` to "placement" if the card type is "Placement Only", otherwise default to "course".
- Updated the tab rendering logic to conditionally show/hide "Course Fees" and "Placement Fees" buttons based on whether the card type includes "training" or "placement".

**Files Changed**:
- `Frontend/src/features/PaymentsInvoices/PaymentsInvoicesMain.jsx`

## Technical Details

### Card Type Mapping
The system recognizes three card type categories:
- **Training Only**: Shows only training fee fields
- **Placement Only**: Shows only placement fee fields  
- **Training + Placement** (or "Both"): Shows both training and placement fee fields

### Payment Information Display

#### Training Fee Information (when applicable)
- Actual Fee (editable)
- Discounted Fee (editable)
- Fee Paid (read-only, managed via payment recording)
- Fee Balance (read-only, auto-calculated)
- Paid Status (editable)

#### Placement Fee Information (when applicable)
- Placement Actual Fee (editable)
- Placement Discounted Fee (editable)
- Placement Paid (read-only, managed via payment recording)
- Placement Balance (read-only, auto-calculated)
- Placement Paid Status (editable)

## Testing Recommendations

1. **EditLeadForm**:
   - Create a lead with "Training Only" card type → verify only training fees show
   - Update the same lead to "Placement Only" → verify only placement fees show
   - Update to "Training + Placement" → verify both sections show
   - Verify old data doesn't appear when switching card types

2. **PaymentsInvoices**:
   - Open payment recording modal for a lead with placement fees
   - Switch to "Placement" tab
   - Verify both "Placement Actual Fee" and "Placement Discounted Fee" are displayed
   - Verify balance calculation uses discounted fee when available

3. **PaymentsInvoices - Card Type Updates**:
   - Select a lead with "Placement Only" card type → Verify only "Placement Fees" tab is visible
   - Go to Edit Lead, change card type to "Training Only"
   - Return to PaymentsInvoices and select the same lead → Verify only "Course Fees" tab is visible
   - Verify the tab automatically switches to the valid one

## Related Files
- Backend: `backend/src/controllers/leads/leadController.js` (no changes needed - already stores all fee data)
- Frontend: 
  - `Frontend/src/features/leads/modals/EditLeadForm.jsx` (updated)
  - `Frontend/src/features/leads/modals/AddLeadModal.jsx` (reference - already working correctly)
  - `Frontend/src/features/PaymentsInvoices/PaymentsInvoicesMain.jsx` (updated)

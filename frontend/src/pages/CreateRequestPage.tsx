import React, { useState } from 'react';
import { RequestType, RequestCategory, Priority, CreateReimbursementDto, CreateCashAdvanceDto, CreateLiquidationDto, User, CashAdvanceRequest } from '../types/types';
import { api } from '../services/api';
import { Card, CardHeader, CardTitle, CardContent, Button, Dialog, DialogHeader, DialogTitle, DialogContent, DialogFooter, Input, Textarea, Label, Select } from '../components/ui';
import { REQUEST_TYPE_LABELS } from '../utils/constants';
import { formatPeso } from '../utils/formatters';

interface RequestFormProps {
  currentUser: User;
  onRequestCreated: () => void;
  pendingAdvances?: CashAdvanceRequest[];
}

const RequestCreationForms: React.FC<RequestFormProps> = ({ 
  currentUser, 
  onRequestCreated, 
  pendingAdvances = [] 
}) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<RequestType>('REIMBURSEMENT');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Form data for each request type
  const [reimbursementData, setReimbursementData] = useState<Partial<CreateReimbursementDto>>({
    employeeId: currentUser.id,
    amount: 0,
    category: 'Office Supplies',
    description: '',
    expenseDate: '',
    businessPurpose: '',
    priority: 'Medium',
    attachments: []
  });

  const [advanceData, setAdvanceData] = useState<Partial<CreateCashAdvanceDto>>({
    employeeId: currentUser.id,
    estimatedAmount: 0,
    category: 'Travel',
    description: '',
    plannedExpenseDate: '',
    advancePurpose: '',
    expectedLiquidationDate: '',
    priority: 'Medium'
  });

  const [liquidationData, setLiquidationData] = useState<Partial<CreateLiquidationDto>>({
    advanceId: '',
    actualAmount: 0,
    description: '',
    liquidationSummary: '',
    attachments: []
  });

  const categories: RequestCategory[] = [
    'Office Supplies', 'Travel', 'Marketing', 'Software', 
    'Equipment', 'Meals', 'Transportation', 'Other'
  ];

  const priorities: Priority[] = ['Low', 'Medium', 'High', 'Urgent'];

  const openForm = (type: RequestType) => {
    setSelectedType(type);
    setIsFormOpen(true);
    setErrors({});
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setErrors({});
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (selectedType === 'REIMBURSEMENT') {
      if (!reimbursementData.amount || reimbursementData.amount <= 0) {
        newErrors.amount = 'Amount must be greater than 0';
      }
      if (!reimbursementData.description?.trim()) {
        newErrors.description = 'Description is required';
      }
      if (!reimbursementData.expenseDate) {
        newErrors.expenseDate = 'Expense date is required';
      }
      if (!reimbursementData.businessPurpose?.trim()) {
        newErrors.businessPurpose = 'Business purpose is required';
      }
    }

    if (selectedType === 'CASH_ADVANCE') {
      if (!advanceData.estimatedAmount || advanceData.estimatedAmount <= 0) {
        newErrors.estimatedAmount = 'Estimated amount must be greater than 0';
      }
      if (!advanceData.description?.trim()) {
        newErrors.description = 'Description is required';
      }
      if (!advanceData.plannedExpenseDate) {
        newErrors.plannedExpenseDate = 'Planned expense date is required';
      }
      if (!advanceData.advancePurpose?.trim()) {
        newErrors.advancePurpose = 'Advance purpose is required';
      }
      if (!advanceData.expectedLiquidationDate) {
        newErrors.expectedLiquidationDate = 'Expected liquidation date is required';
      }
      if (advanceData.plannedExpenseDate && advanceData.expectedLiquidationDate) {
        if (new Date(advanceData.expectedLiquidationDate) <= new Date(advanceData.plannedExpenseDate)) {
          newErrors.expectedLiquidationDate = 'Liquidation date must be after planned expense date';
        }
      }
    }

    if (selectedType === 'LIQUIDATION') {
      if (!liquidationData.advanceId) {
        newErrors.advanceId = 'Please select an advance to liquidate';
      }
      if (!liquidationData.actualAmount || liquidationData.actualAmount <= 0) {
        newErrors.actualAmount = 'Actual amount must be greater than 0';
      }
      if (!liquidationData.description?.trim()) {
        newErrors.description = 'Description is required';
      }
      if (!liquidationData.liquidationSummary?.trim()) {
        newErrors.liquidationSummary = 'Liquidation summary is required';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsSubmitting(true);
    
    try {
      if (selectedType === 'REIMBURSEMENT') {
        await api.createReimbursementRequest(reimbursementData as CreateReimbursementDto);
        setReimbursementData({
          employeeId: currentUser.id,
          amount: 0,
          category: 'Office Supplies',
          description: '',
          expenseDate: '',
          businessPurpose: '',
          priority: 'Medium',
          attachments: []
        });
      } else if (selectedType === 'CASH_ADVANCE') {
        await api.createCashAdvanceRequest(advanceData as CreateCashAdvanceDto);
        setAdvanceData({
          employeeId: currentUser.id,
          estimatedAmount: 0,
          category: 'Travel',
          description: '',
          plannedExpenseDate: '',
          advancePurpose: '',
          expectedLiquidationDate: '',
          priority: 'Medium'
        });
      } else if (selectedType === 'LIQUIDATION') {
        await api.createLiquidationRequest(liquidationData as CreateLiquidationDto);
        setLiquidationData({
          advanceId: '',
          actualAmount: 0,
          description: '',
          liquidationSummary: '',
          attachments: []
        });
      }
      
      closeForm();
      onRequestCreated();
      
    } catch (error) {
      console.error('Failed to create request:', error);
      setErrors({ submit: 'Failed to create request. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderReimbursementForm = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="amount">Amount *</Label>
          <Input
            id="amount"
            type="number"
            step="0.01"
            min="0"
            value={reimbursementData.amount || ''}
            onChange={(e) => setReimbursementData({...reimbursementData, amount: parseFloat(e.target.value) || 0})}
            className={errors.amount ? 'border-red-500' : ''}
          />
          {errors.amount && <p className="text-red-500 text-sm mt-1">{errors.amount}</p>}
        </div>
        <div>
          <Label htmlFor="category">Category *</Label>
          <select 
            id="category"
            value={reimbursementData.category || ''}
            onChange={(e) => setReimbursementData({...reimbursementData, category: e.target.value as RequestCategory})}
            className="w-full px-3 py-2 border rounded-md"
          >
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="expenseDate">Expense Date *</Label>
          <Input
            id="expenseDate"
            type="date"
            value={reimbursementData.expenseDate || ''}
            onChange={(e) => setReimbursementData({...reimbursementData, expenseDate: e.target.value})}
            className={errors.expenseDate ? 'border-red-500' : ''}
          />
          {errors.expenseDate && <p className="text-red-500 text-sm mt-1">{errors.expenseDate}</p>}
        </div>
        <div>
          <Label htmlFor="priority">Priority *</Label>
          <select 
            id="priority"
            value={reimbursementData.priority || 'Medium'}
            onChange={(e) => setReimbursementData({...reimbursementData, priority: e.target.value as Priority})}
            className="w-full px-3 py-2 border rounded-md"
          >
            {priorities.map(p => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <Label htmlFor="businessPurpose">Business Purpose *</Label>
        <Input
          id="businessPurpose"
          value={reimbursementData.businessPurpose || ''}
          onChange={(e) => setReimbursementData({...reimbursementData, businessPurpose: e.target.value})}
          placeholder="Why was this expense necessary for business?"
          className={errors.businessPurpose ? 'border-red-500' : ''}
        />
        {errors.businessPurpose && <p className="text-red-500 text-sm mt-1">{errors.businessPurpose}</p>}
      </div>

      <div>
        <Label htmlFor="description">Description *</Label>
        <Textarea
          id="description"
          value={reimbursementData.description || ''}
          onChange={(e) => setReimbursementData({...reimbursementData, description: e.target.value})}
          placeholder="Detailed description of the expense..."
          rows={3}
          className={errors.description ? 'border-red-500' : ''}
        />
        {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
      </div>
    </div>
  );

  const renderAdvanceForm = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="estimatedAmount">Estimated Amount *</Label>
          <Input
            id="estimatedAmount"
            type="number"
            step="0.01"
            min="0"
            value={advanceData.estimatedAmount || ''}
            onChange={(e) => setAdvanceData({...advanceData, estimatedAmount: parseFloat(e.target.value) || 0})}
            className={errors.estimatedAmount ? 'border-red-500' : ''}
          />
          {errors.estimatedAmount && <p className="text-red-500 text-sm mt-1">{errors.estimatedAmount}</p>}
        </div>
        <div>
          <Label htmlFor="category">Category *</Label>
          <select 
            id="category"
            value={advanceData.category || ''}
            onChange={(e) => setAdvanceData({...advanceData, category: e.target.value as RequestCategory})}
            className="w-full px-3 py-2 border rounded-md"
          >
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="plannedExpenseDate">Planned Expense Date *</Label>
          <Input
            id="plannedExpenseDate"
            type="date"
            value={advanceData.plannedExpenseDate || ''}
            onChange={(e) => setAdvanceData({...advanceData, plannedExpenseDate: e.target.value})}
            className={errors.plannedExpenseDate ? 'border-red-500' : ''}
          />
          {errors.plannedExpenseDate && <p className="text-red-500 text-sm mt-1">{errors.plannedExpenseDate}</p>}
        </div>
        <div>
          <Label htmlFor="expectedLiquidationDate">Expected Liquidation Date *</Label>
          <Input
            id="expectedLiquidationDate"
            type="date"
            value={advanceData.expectedLiquidationDate || ''}
            onChange={(e) => setAdvanceData({...advanceData, expectedLiquidationDate: e.target.value})}
            className={errors.expectedLiquidationDate ? 'border-red-500' : ''}
          />
          {errors.expectedLiquidationDate && <p className="text-red-500 text-sm mt-1">{errors.expectedLiquidationDate}</p>}
        </div>
      </div>

      <div>
        <Label htmlFor="priority">Priority *</Label>
        <select 
          id="priority"
          value={advanceData.priority || 'Medium'}
          onChange={(e) => setAdvanceData({...advanceData, priority: e.target.value as Priority})}
          className="w-full px-3 py-2 border rounded-md"
        >
          {priorities.map(p => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
      </div>

      <div>
        <Label htmlFor="advancePurpose">Advance Purpose *</Label>
        <Input
          id="advancePurpose"
          value={advanceData.advancePurpose || ''}
          onChange={(e) => setAdvanceData({...advanceData, advancePurpose: e.target.value})}
          placeholder="What will this advance be used for?"
          className={errors.advancePurpose ? 'border-red-500' : ''}
        />
        {errors.advancePurpose && <p className="text-red-500 text-sm mt-1">{errors.advancePurpose}</p>}
      </div>

      <div>
        <Label htmlFor="description">Description *</Label>
        <Textarea
          id="description"
          value={advanceData.description || ''}
          onChange={(e) => setAdvanceData({...advanceData, description: e.target.value})}
          placeholder="Detailed description of planned expenses..."
          rows={3}
          className={errors.description ? 'border-red-500' : ''}
        />
        {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
      </div>
    </div>
  );

  const renderLiquidationForm = () => {
    const selectedAdvance = pendingAdvances.find(adv => adv.id === liquidationData.advanceId);
    
    return (
      <div className="space-y-4">
        <div>
          <Label htmlFor="advanceId">Select Advance to Liquidate *</Label>
          <select 
            id="advanceId"
            value={liquidationData.advanceId || ''}
            onChange={(e) => setLiquidationData({...liquidationData, advanceId: e.target.value})}
            className={`w-full px-3 py-2 border rounded-md ${errors.advanceId ? 'border-red-500' : ''}`}
          >
            <option value="">Select an advance...</option>
            {pendingAdvances.map(advance => (
              <option key={advance.id} value={advance.id}>
                {advance.id} - {formatPeso(advance.amount)} - {advance.description}
              </option>
            ))}
          </select>
          {errors.advanceId && <p className="text-red-500 text-sm mt-1">{errors.advanceId}</p>}
        </div>

        {selectedAdvance && (
          <div className="bg-blue-50 p-3 rounded-md">
            <p className="text-sm"><strong>Original Advance:</strong> {formatPeso(selectedAdvance.amount)}</p>
            <p className="text-sm"><strong>Purpose:</strong> {selectedAdvance.advancePurpose}</p>
            <p className="text-sm"><strong>Planned Date:</strong> {new Date(selectedAdvance.plannedExpenseDate).toLocaleDateString()}</p>
          </div>
        )}

        <div>
          <Label htmlFor="actualAmount">Actual Amount Spent *</Label>
          <Input
            id="actualAmount"
            type="number"
            step="0.01"
            min="0"
            value={liquidationData.actualAmount || ''}
            onChange={(e) => setLiquidationData({...liquidationData, actualAmount: parseFloat(e.target.value) || 0})}
            className={errors.actualAmount ? 'border-red-500' : ''}
          />
          {errors.actualAmount && <p className="text-red-500 text-sm mt-1">{errors.actualAmount}</p>}
          
          {selectedAdvance && liquidationData.actualAmount && (
            <div className="mt-2 text-sm">
              {liquidationData.actualAmount > selectedAdvance.amount ? (
                <p className="text-red-600">
                  <strong>Over budget:</strong> {formatPeso(liquidationData.actualAmount - selectedAdvance.amount)} additional needed
                </p>
              ) : liquidationData.actualAmount < selectedAdvance.amount ? (
                <p className="text-green-600">
                  <strong>Under budget:</strong> {formatPeso(selectedAdvance.amount - liquidationData.actualAmount)} to return
                </p>
              ) : (
                <p className="text-blue-600"><strong>Exact amount used</strong></p>
              )}
            </div>
          )}
        </div>

        <div>
          <Label htmlFor="liquidationSummary">Liquidation Summary *</Label>
          <Textarea
            id="liquidationSummary"
            value={liquidationData.liquidationSummary || ''}
            onChange={(e) => setLiquidationData({...liquidationData, liquidationSummary: e.target.value})}
            placeholder="Breakdown of how the advance money was spent (e.g., Hotel: ₱5,000, Meals: ₱2,000, Transportation: ₱1,500)..."
            rows={4}
            className={errors.liquidationSummary ? 'border-red-500' : ''}
          />
          {errors.liquidationSummary && <p className="text-red-500 text-sm mt-1">{errors.liquidationSummary}</p>}
        </div>

        <div>
          <Label htmlFor="description">Description *</Label>
          <Textarea
            id="description"
            value={liquidationData.description || ''}
            onChange={(e) => setLiquidationData({...liquidationData, description: e.target.value})}
            placeholder="Overall description of the liquidation..."
            rows={3}
            className={errors.description ? 'border-red-500' : ''}
          />
          {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Create New Request</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <Button
              variant="outline"
              className="p-6 h-auto flex flex-col items-center space-y-2 hover:bg-blue-50 hover:border-blue-300"
              onClick={() => openForm('REIMBURSEMENT')}
            >
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-2xl">💳</span>
              </div>
              <div className="text-center">
                <p className="font-semibold">Reimbursement</p>
                <p className="text-sm text-muted-foreground">Get money back for expenses you've already paid</p>
              </div>
            </Button>

            <Button
              variant="outline"
              className="p-6 h-auto flex flex-col items-center space-y-2 hover:bg-green-50 hover:border-green-300"
              onClick={() => openForm('CASH_ADVANCE')}
            >
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-2xl">💰</span>
              </div>
              <div className="text-center">
                <p className="font-semibold">Cash Advance</p>
                <p className="text-sm text-muted-foreground">Request money upfront for upcoming expenses</p>
              </div>
            </Button>

            <Button
              variant="outline"
              className="p-6 h-auto flex flex-col items-center space-y-2 hover:bg-purple-50 hover:border-purple-300"
              onClick={() => openForm('LIQUIDATION')}
              disabled={pendingAdvances.length === 0}
            >
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <span className="text-2xl">📊</span>
              </div>
              <div className="text-center">
                <p className="font-semibold">Liquidation</p>
                <p className="text-sm text-muted-foreground">
                  Account for advance money you've received
                  {pendingAdvances.length === 0 && " (No advances to liquidate)"}
                </p>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>

      <Dialog isOpen={isFormOpen} onClose={closeForm}>
        <DialogHeader>
          <DialogTitle>Create {REQUEST_TYPE_LABELS[selectedType]} Request</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <DialogContent className="max-w-2xl">
            <div className="space-y-4">
              <div className="bg-gray-50 p-3 rounded-md">
                <p className="text-sm text-muted-foreground">
                  <strong>Submitting as:</strong> {currentUser.name} ({currentUser.role})
                </p>
              </div>

              {selectedType === 'REIMBURSEMENT' && renderReimbursementForm()}
              {selectedType === 'CASH_ADVANCE' && renderAdvanceForm()}
              {selectedType === 'LIQUIDATION' && renderLiquidationForm()}
            </div>
            {errors.submit && <p className="text-red-500 text-sm mt-4">{errors.submit}</p>}
          </DialogContent>
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={closeForm} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : `Create ${REQUEST_TYPE_LABELS[selectedType]}`}
            </Button>
          </DialogFooter>
        </form>
      </Dialog>
    </div>
  );
};

export default RequestCreationForms;
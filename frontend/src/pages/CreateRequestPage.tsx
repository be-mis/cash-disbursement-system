import React, { useState, useEffect } from 'react';
import { RequestType, RequestCategory, Priority, CreateReimbursementDto, CreateCashAdvanceDto, CreateLiquidationDto, User, CashAdvanceRequest } from '../types/types';
import { api } from '../services/api';
import { Card, CardHeader, CardTitle, CardContent, Button, Dialog, DialogHeader, DialogTitle, DialogContent, DialogFooter, Input, Textarea, Label, Select } from '../components/ui';
import { REQUEST_TYPE_LABELS } from '../utils/constants';
import { formatPeso } from '../utils/formatters';

interface RequestFormProps {
  currentUser: User;
  onRequestCreated: () => void;
}

const RequestCreationForms: React.FC<RequestFormProps> = ({ 
  currentUser, 
  onRequestCreated,
}) => {
  // Simple toast function
  const showToast = (message: string) => {
    // Create toast element
    const toast = document.createElement('div');
    toast.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-md shadow-lg z-50 transition-opacity';
    toast.textContent = message;
    
    document.body.appendChild(toast);
    
    // Remove after 3 seconds
    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => document.body.removeChild(toast), 300);
    }, 3000);
  };

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<RequestType>('REIMBURSEMENT');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pendingAdvances, setPendingAdvances] = useState<CashAdvanceRequest[]>([]);
  const [loadingAdvances, setLoadingAdvances] = useState(true);

  useEffect(() => {
    const fetchPendingAdvances = async () => {
      if (currentUser.role === 'Employee' || currentUser.role === 'Manager') {
        try {
          const advances = await api.getPendingAdvancesForUser(currentUser.id);
          setPendingAdvances(advances);
        } catch (error) {
          console.error('Failed to fetch pending advances:', error);
          setPendingAdvances([]);
        } finally {
          setLoadingAdvances(false);
        }
      } else {
        setPendingAdvances([]);
        setLoadingAdvances(false);
      }
    };

    fetchPendingAdvances();
  }, [currentUser.id, isFormOpen, selectedType]);

  const requiresEnhancedDocs = currentUser.role === 'Manager' || currentUser.role === 'Finance';

  const [reimbursementData, setReimbursementData] = useState<Partial<CreateReimbursementDto>>({
    employeeId: currentUser.id,
    amount: undefined,  // ✅ CORRECT
    category: 'Office Supplies',
    description: '',
    expenseStartDate: '',      // NEW
    expenseEndDate: '',         // NEW
    businessPurpose: '',
    department: '',             // NEW
    company: '',                // NEW
    priority: 'Medium',
    attachments: [],
    managerJustification: '',
    budgetImpactAssessment: '',
    alternativesSought: '',
    complianceNotes: ''
  });

  const [advanceData, setAdvanceData] = useState<Partial<CreateCashAdvanceDto>>({
    employeeId: currentUser.id,
    estimatedAmount: undefined,  // ✅ FIXED
    category: 'Travel',
    description: '',
    plannedExpenseDate: '',
    advancePurpose: '',
    expectedLiquidationDate: '',
    destination: '',            // NEW
    remarks: '',                // NEW
    department: '',             // NEW
    company: '',                // NEW
    priority: 'Medium',
    managerJustification: '',
    budgetImpactAssessment: '',
    riskAssessment: '',
    expectedROI: ''
  });

  const [liquidationData, setLiquidationData] = useState<Partial<CreateLiquidationDto>>({
    advanceId: '',
    actualAmount: undefined,  // ✅ FIXED
    description: '',
    liquidationSummary: '',
    attachments: [],
    varianceExplanation: '',
    lessonsLearned: ''
  });

  const categories: RequestCategory[] = [
    'Office Supplies', 
    'Travel', 
    'Marketing', 
    'Marketing Expense',           // NEW
    'Software', 
    'Equipment', 
    'Meals', 
    'Transportation', 
    'Research and Development',    // NEW
    'Other'
  ];

  const departments = [
    'MIS',
    'Sales', 
    'Marketing',
    'HR',
    'Finance',
    'Operations',
    'Other'
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
    if (selectedType === 'LIQUIDATION') {
      setLiquidationData({
        advanceId: '',
        actualAmount: undefined,  // ✅ FIXED
        description: '',
        liquidationSummary: '',
        attachments: [],
        varianceExplanation: '',
        lessonsLearned: ''
      });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (selectedType === 'REIMBURSEMENT') {
      if (!reimbursementData.amount && reimbursementData.amount !== 0) {
        newErrors.amount = 'Amount must be greater than 0';
      }
      if (!reimbursementData.description?.trim()) {
        newErrors.description = 'Please explain the purpose (e.g., "Q3 team offsite")';
      }
      if (!reimbursementData.expenseStartDate) {
        newErrors.expenseStartDate = 'Expense start date is required';
      }
      if (!reimbursementData.expenseEndDate) {
        newErrors.expenseEndDate = 'Expense end date is required';
      }
      if (reimbursementData.expenseStartDate && reimbursementData.expenseEndDate) {
        if (new Date(reimbursementData.expenseEndDate) < new Date(reimbursementData.expenseStartDate)) {
          newErrors.expenseEndDate = 'End date cannot be before start date';
        }
      }
      if (!reimbursementData.businessPurpose?.trim()) {
        newErrors.businessPurpose = 'Business purpose is required';
      }
      if (!reimbursementData.department) {
        newErrors.department = 'Department is required';
      }
      if (!reimbursementData.company?.trim()) {
        newErrors.company = 'Company name is required';
      }

      if (requiresEnhancedDocs) {
        if (!reimbursementData.managerJustification?.trim()) {
          newErrors.managerJustification = 'Executive justification is required';
        }
        if (!reimbursementData.budgetImpactAssessment?.trim()) {
          newErrors.budgetImpactAssessment = 'Budget impact assessment is required';
        }
        if (!reimbursementData.alternativesSought?.trim()) {
          newErrors.alternativesSought = 'Documentation of alternatives sought is required';
        }
        if (reimbursementData.amount && reimbursementData.amount > 10000 && !reimbursementData.complianceNotes?.trim()) {
          newErrors.complianceNotes = 'Compliance notes required for amounts over ₱10,000';
        }
        if (!reimbursementData.attachments || reimbursementData.attachments.length === 0) {
          newErrors.attachments = 'Receipt/document upload is mandatory for executives';
        }
      }
    }

    if (selectedType === 'CASH_ADVANCE') {
      if (!advanceData.estimatedAmount && advanceData.estimatedAmount !== 0) {
        newErrors.estimatedAmount = 'Estimated amount must be greater than 0';
      }
      if (!advanceData.description?.trim()) {
        newErrors.description = 'Please explain the purpose (e.g., "Q3 team offsite")';
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
      if (!advanceData.destination?.trim()) {
        newErrors.destination = 'Destination/Location is required';
      }
      if (!advanceData.remarks?.trim()) {
        newErrors.remarks = 'Remarks (Store/Vendor Name) is required';
      }
      if (!advanceData.department) {
        newErrors.department = 'Department is required';
      }
      if (!advanceData.company?.trim()) {
        newErrors.company = 'Company name is required';
      }

      if (requiresEnhancedDocs) {
        if (!advanceData.managerJustification?.trim()) {
          newErrors.managerJustification = 'Executive justification is required';
        }
        if (!advanceData.budgetImpactAssessment?.trim()) {
          newErrors.budgetImpactAssessment = 'Budget impact assessment is required';
        }
        if (!advanceData.riskAssessment?.trim()) {
          newErrors.riskAssessment = 'Risk assessment is required';
        }
        if (advanceData.estimatedAmount && advanceData.estimatedAmount > 25000 && !advanceData.expectedROI?.trim()) {
          newErrors.expectedROI = 'Expected ROI justification required for advances over ₱25,000';
        }
      }
    }

    if (selectedType === 'LIQUIDATION') {
      if (!liquidationData.advanceId) {
        newErrors.advanceId = 'Please select an advance to liquidate';
      }
      if (!liquidationData.actualAmount && liquidationData.actualAmount !== 0) {
        newErrors.actualAmount = 'Actual amount must be greater than 0';
      }
      if (!liquidationData.description?.trim()) {
        newErrors.description = 'Please explain the purpose (e.g., "Q3 team offsite")';
      }
      if (!liquidationData.liquidationSummary?.trim()) {
        newErrors.liquidationSummary = 'Provide expense breakdown (e.g., "Hotel: ₱5,000...")';
      }

      if (requiresEnhancedDocs) {
        const selectedAdvance = pendingAdvances.find(adv => adv.id === liquidationData.advanceId);
        if (selectedAdvance && liquidationData.actualAmount) {
          const variance = Math.abs(liquidationData.actualAmount - selectedAdvance.amount);
          const variancePercentage = (variance / selectedAdvance.amount) * 100;
          
          if (variancePercentage > 10 && !liquidationData.varianceExplanation?.trim()) {
            newErrors.varianceExplanation = 'Variance explanation required when actual differs by >10% from estimated';
          }
        }
        if (!liquidationData.lessonsLearned?.trim()) {
          newErrors.lessonsLearned = 'Lessons learned documentation is required';
        }
        if (!liquidationData.attachments || liquidationData.attachments.length === 0) {
          newErrors.attachments = 'Receipt/document upload is mandatory for executives';
        }
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
          amount: undefined,  // ✅ CORRECT
          category: 'Office Supplies',
          description: '',
          expenseStartDate: '',      // NEW
          expenseEndDate: '',         // NEW
          businessPurpose: '',
          department: '',             // NEW
          company: '',                // NEW
          priority: 'Medium',
          attachments: [],
          managerJustification: '',
          budgetImpactAssessment: '',
          alternativesSought: '',
          complianceNotes: ''
        });
      } else if (selectedType === 'CASH_ADVANCE') {
        await api.createCashAdvanceRequest(advanceData as CreateCashAdvanceDto);
        setAdvanceData({
          employeeId: currentUser.id,
          estimatedAmount: undefined,  // ✅ FIXED
          category: 'Travel',
          description: '',
          plannedExpenseDate: '',
          advancePurpose: '',
          expectedLiquidationDate: '',
          destination: '',            // NEW
          remarks: '',                // NEW
          department: '',             // NEW
          company: '',                // NEW
          priority: 'Medium',
          managerJustification: '',
          budgetImpactAssessment: '',
          riskAssessment: '',
          expectedROI: ''
        });
      } else if (selectedType === 'LIQUIDATION') {
        await api.createLiquidationRequest(liquidationData as CreateLiquidationDto);
        setLiquidationData({
          advanceId: '',
          actualAmount: undefined,  // ✅ FIXED
          description: '',
          liquidationSummary: '',
          attachments: [],
          varianceExplanation: '',
          lessonsLearned: ''
        });
      }
      
      closeForm();
      onRequestCreated();
      // Show success toast
      showToast(`✅ ${REQUEST_TYPE_LABELS[selectedType]} request submitted successfully!`);
      
    } catch (error) {
      console.error('Failed to create request:', error);
      setErrors({ submit: 'Failed to create request. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderEnhancedDocumentationAlert = () => {
    if (!requiresEnhancedDocs) return null;

    return (
      <div className="bg-amber-50 border border-amber-200 rounded-md p-4 mb-4">
        <div className="flex items-center">
          <div className="text-amber-600 mr-3">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-amber-800">Enhanced Documentation Required</h3>
            <p className="text-sm text-amber-700">
              As a {currentUser.role}, you must provide additional justification and mandatory receipt uploads for accountability and compliance.
            </p>
          </div>
        </div>
      </div>
    );
  };

  const renderFileUpload = (
    value: string[] | undefined,
    onChange: (files: string[]) => void,
    fieldName: string
  ) => (
    <div>
      <Label htmlFor={fieldName}>
        {requiresEnhancedDocs ? 'Receipt/Document Upload *' : 'Attachments (Optional)'}
      </Label>
      <Input
        id={fieldName}
        type="file"
        multiple
        accept=".jpg,.jpeg,.png,.pdf,.doc,.docx"
        onChange={(e) => {
          const files = Array.from(e.target.files || []).map(f => f.name);
          onChange(files);
        }}
        className={errors[fieldName] ? 'border-red-500' : ''}
      />
      {requiresEnhancedDocs && (
        <p className="text-xs text-muted-foreground mt-1">
          Mandatory for executives. Accepted: JPG, PNG, PDF, DOC, DOCX
        </p>
      )}
      {errors[fieldName] && <p className="text-red-500 text-sm mt-1">{errors[fieldName]}</p>}
    </div>
  );

  const renderReimbursementForm = () => (
    <div className="space-y-4">
      {renderEnhancedDocumentationAlert()}
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="amount">Amount *</Label>
          <Input
            id="amount"
            type="number"
            step="0.01"
            min="0"
            value={reimbursementData.amount ?? ''}
            onChange={(e) => setReimbursementData({
              ...reimbursementData, 
              amount: e.target.value ? parseFloat(e.target.value) : undefined
            })}
            className={errors.amount ? 'border-red-500' : ''}
          />
          {errors.amount && <p className="text-red-500 text-sm mt-1">{errors.amount}</p>}
          {reimbursementData.amount && reimbursementData.amount > 20000 && (
            <div className="bg-amber-50 border-l-4 border-amber-400 p-2 text-sm text-amber-700 mt-2">
              ⚠️ Amount exceeds ₱20,000 — CEO approval required.
            </div>
          )}
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
          <Label htmlFor="expenseStartDate">Expense Start Date *</Label>
          <Input
            id="expenseStartDate"
            type="date"
            value={reimbursementData.expenseStartDate || ''}
            onChange={(e) => setReimbursementData({...reimbursementData, expenseStartDate: e.target.value})}
            className={errors.expenseStartDate ? 'border-red-500' : ''}
          />
          {errors.expenseStartDate && <p className="text-red-500 text-sm mt-1">{errors.expenseStartDate}</p>}
        </div>
        <div>
          <Label htmlFor="expenseEndDate">Expense End Date *</Label>
          <Input
            id="expenseEndDate"
            type="date"
            value={reimbursementData.expenseEndDate || ''}
            onChange={(e) => setReimbursementData({...reimbursementData, expenseEndDate: e.target.value})}
            className={errors.expenseEndDate ? 'border-red-500' : ''}
          />
          {errors.expenseEndDate && <p className="text-red-500 text-sm mt-1">{errors.expenseEndDate}</p>}
          <p className="text-xs text-muted-foreground mt-1">
            For multi-day expenses (e.g., 1-week trip)
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="department">Department *</Label>
          <select 
            id="department"
            value={reimbursementData.department || ''
            }
            onChange={(e) => setReimbursementData({...reimbursementData, department: e.target.value})}
            className={`w-full px-3 py-2 border rounded-md ${errors.department ? 'border-red-500' : ''}`}
          >
            <option value="">Select Department</option>
            {departments.map(dept => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>
          {errors.department && <p className="text-red-500 text-sm mt-1">{errors.department}</p>}
        </div>
        <div>
          <Label htmlFor="company">Company *</Label>
          <Input
            id="company"
            value={reimbursementData.company || ''}
            onChange={(e) => setReimbursementData({...reimbursementData, company: e.target.value})}
            placeholder="Company name"
            className={errors.company ? 'border-red-500' : ''}
          />
          {errors.company && <p className="text-red-500 text-sm mt-1">{errors.company}</p>}
        </div>
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
          value={reimbursementData.description || ''
          }
          onChange={(e) => setReimbursementData({...reimbursementData, description: e.target.value})}
          placeholder="Detailed description of the expense..."
          rows={3}
          className={errors.description ? 'border-red-500' : ''}
        />
        {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
      </div>

      {requiresEnhancedDocs && (
        <>
          <div className="border-t pt-4">
            <h4 className="font-semibold text-gray-800 mb-3">Enhanced Documentation Required</h4>
            
            <div>
              <Label htmlFor="managerJustification">Executive Justification *</Label>
              <Textarea
                id="managerJustification"
                value={reimbursementData.managerJustification || ''}
                onChange={(e) => setReimbursementData({...reimbursementData, managerJustification: e.target.value})}
                placeholder="As an executive, provide detailed justification for why this expense was necessary and how it aligns with business objectives..."
                rows={3}
                className={errors.managerJustification ? 'border-red-500' : ''}
              />
              {errors.managerJustification && <p className="text-red-500 text-sm mt-1">{errors.managerJustification}</p>}
            </div>

            <div>
              <Label htmlFor="budgetImpactAssessment">Budget Impact Assessment *</Label>
              <Textarea
                id="budgetImpactAssessment"
                value={reimbursementData.budgetImpactAssessment || ''}
                onChange={(e) => setReimbursementData({...reimbursementData, budgetImpactAssessment: e.target.value})}
                placeholder="Assess the impact on departmental/company budget, including which budget line this affects..."
                rows={2}
                className={errors.budgetImpactAssessment ? 'border-red-500' : ''}
              />
              {errors.budgetImpactAssessment && <p className="text-red-500 text-sm mt-1">{errors.budgetImpactAssessment}</p>}
            </div>

            <div>
              <Label htmlFor="alternativesSought">Alternatives Considered *</Label>
              <Textarea
                id="alternativesSought"
                value={reimbursementData.alternativesSought || ''}
                onChange={(e) => setReimbursementData({...reimbursementData, alternativesSought: e.target.value})}
                placeholder="Document what alternative solutions or vendors were considered and why this option was chosen..."
                rows={2}
                className={errors.alternativesSought ? 'border-red-500' : ''}
              />
              {errors.alternativesSought && <p className="text-red-500 text-sm mt-1">{errors.alternativesSought}</p>}
            </div>

            {reimbursementData.amount && reimbursementData.amount > 10000 && (
              <div>
                <Label htmlFor="complianceNotes">Compliance Notes *</Label>
                <Textarea
                  id="complianceNotes"
                  value={reimbursementData.complianceNotes || ''}
                  onChange={(e) => setReimbursementData({...reimbursementData, complianceNotes: e.target.value})}
                  placeholder="For high-value expenses, document compliance with company policies and any approvals obtained..."
                  rows={2}
                  className={errors.complianceNotes ? 'border-red-500' : ''}
                />
                {errors.complianceNotes && <p className="text-red-500 text-sm mt-1">{errors.complianceNotes}</p>}
              </div>
            )}
          </div>
        </>
      )}

      {renderFileUpload(
        reimbursementData.attachments,
        (files) => setReimbursementData({...reimbursementData, attachments: files}),
        'attachments'
      )}
    </div>
  );

  const renderAdvanceForm = () => (
    <div className="space-y-4">
      {renderEnhancedDocumentationAlert()}
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="estimatedAmount">Estimated Amount *</Label>
          <Input
            id="estimatedAmount"
            type="number"
            step="0.01"
            min="0"
            value={advanceData.estimatedAmount ?? ''}
            onChange={(e) => setAdvanceData({...advanceData, estimatedAmount: e.target.value ? parseFloat(e.target.value) : undefined})}
            className={errors.estimatedAmount ? 'border-red-500' : ''}
          />
          {errors.estimatedAmount && <p className="text-red-500 text-sm mt-1">{errors.estimatedAmount}</p>}
          {advanceData.estimatedAmount && advanceData.estimatedAmount > 20000 && (
            <div className="bg-amber-50 border-l-4 border-amber-400 p-2 text-sm text-amber-700 mt-2">
              ⚠️ Amount exceeds ₱20,000 — CEO approval required.
            </div>
          )}
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
        <Label htmlFor="destination">Destination/Location *</Label>
        <Input
          id="destination"
          value={advanceData.destination || ''}
          onChange={(e) => setAdvanceData({...advanceData, destination: e.target.value})}
          placeholder="e.g., Manila, Cebu, Client Office"
          className={errors.destination ? 'border-red-500' : ''}
        />
        {errors.destination && <p className="text-red-500 text-sm mt-1">{errors.destination}</p>}
      </div>

      <div>
        <Label htmlFor="remarks">Remarks (Store/Vendor Name) *</Label>
        <Input
          id="remarks"
          value={advanceData.remarks || ''}
          onChange={(e) => setAdvanceData({...advanceData, remarks: e.target.value})}
          placeholder="Name of store/vendor you will visit"
          className={errors.remarks ? 'border-red-500' : ''}
        />
        {errors.remarks && <p className="text-red-500 text-sm mt-1">{errors.remarks}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="department">Department *</Label>
          <select 
            id="department"
            value={advanceData.department || ''}
            onChange={(e) => setAdvanceData({...advanceData, department: e.target.value})}
            className={`w-full px-3 py-2 border rounded-md ${errors.department ? 'border-red-500' : ''}`}
          >
            <option value="">Select Department</option>
            {departments.map(dept => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>
          {errors.department && <p className="text-red-500 text-sm mt-1">{errors.department}</p>}
        </div>
        <div>
          <Label htmlFor="company">Company *</Label>
          <Input
            id="company"
            value={advanceData.company || ''}   
            onChange={(e) => setAdvanceData({...advanceData, company: e.target.value})}
            placeholder="Company name"
            className={errors.company ? 'border-red-500' : ''}
          />
          {errors.company && <p className="text-red-500 text-sm mt-1">{errors.company}</p>}
        </div>
      </div>

      <div>
        <Label htmlFor="advancePurpose">Advance Purpose *</Label>
        <Input
          id="advancePurpose"
          value={advanceData.advancePurpose || ''
          }
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
          value={advanceData.description || ''
          }
          onChange={(e) => setAdvanceData({...advanceData, description: e.target.value})}
          placeholder="Detailed description of planned expenses..."
          rows={3}
          className={errors.description ? 'border-red-500' : ''}
        />
        {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
      </div>

      {requiresEnhancedDocs && (
        <>
          <div className="border-t pt-4">
            <h4 className="font-semibold text-gray-800 mb-3">Enhanced Documentation Required</h4>
            
            <div>
              <Label htmlFor="managerJustification">Executive Justification *</Label>
              <Textarea
                id="managerJustification"
                value={advanceData.managerJustification || ''}
                onChange={(e) => setAdvanceData({...advanceData, managerJustification: e.target.value})}
                placeholder="Provide detailed justification for why this advance is necessary and how it supports business objectives..."
                rows={3}
                className={errors.managerJustification ? 'border-red-500' : ''}
              />
              {errors.managerJustification && <p className="text-red-500 text-sm mt-1">{errors.managerJustification}</p>}
            </div>

            <div>
              <Label htmlFor="budgetImpactAssessment">Budget Impact Assessment *</Label>
              <Textarea
                id="budgetImpactAssessment"
                value={advanceData.budgetImpactAssessment || ''
                }
                onChange={(e) => setAdvanceData({...advanceData, budgetImpactAssessment: e.target.value})}
                placeholder="Assess budget impact and cash flow implications of this advance..."
                rows={2}
                className={errors.budgetImpactAssessment ? 'border-red-500' : ''}
              />
              {errors.budgetImpactAssessment && <p className="text-red-500 text-sm mt-1">{errors.budgetImpactAssessment}</p>}
            </div>

            <div>
              <Label htmlFor="riskAssessment">Risk Assessment *</Label>
              <Textarea
                id="riskAssessment"
                value={advanceData.riskAssessment || ''
                }
                onChange={(e) => setAdvanceData({...advanceData, riskAssessment: e.target.value})}
                placeholder="Identify potential risks and mitigation strategies for this advance..."
                rows={2}
                className={errors.riskAssessment ? 'border-red-500' : ''}
              />
              {errors.riskAssessment && <p className="text-red-500 text-sm mt-1">{errors.riskAssessment}</p>}
            </div>

            {advanceData.estimatedAmount && advanceData.estimatedAmount > 25000 && (
              <div>
                <Label htmlFor="expectedROI">Expected ROI/Business Value *</Label>
                <Textarea
                  id="expectedROI"
                  value={advanceData.expectedROI || ''
                  }
                  onChange={(e) => setAdvanceData({...advanceData, expectedROI: e.target.value})}
                  placeholder="For high-value advances, document expected return on investment or business value..."
                  rows={2}
                  className={errors.expectedROI ? 'border-red-500' : ''}
                />
                {errors.expectedROI && <p className="text-red-500 text-sm mt-1">{errors.expectedROI}</p>}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );

  const renderLiquidationForm = () => {
    const selectedAdvance = pendingAdvances.find(adv => adv.id === liquidationData.advanceId);
    
    return (
      <div className="space-y-4">
        {renderEnhancedDocumentationAlert()}
        
        <div>
          <Label htmlFor="advanceId">Select Advance to Liquidate *</Label>
          <select 
            id="advanceId"
            value={liquidationData.advanceId || ''}
            onChange={(e) => setLiquidationData({...liquidationData, advanceId: e.target.value})}
            className={`w-full px-3 py-2 border rounded-md ${errors.advanceId ? 'border-red-500' : ''}`}
            disabled={loadingAdvances}
          >
            <option value="">Select an advance...</option>
            {pendingAdvances.map(advance => (
              <option key={advance.id} value={advance.id}>
                {advance.id} - {formatPeso(advance.amount)} - {advance.description}
              </option>
            ))}
          </select>
          {loadingAdvances && <p className="text-sm text-muted-foreground">Loading advances...</p>}
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
            value={liquidationData.actualAmount ?? ''}
            onChange={(e) => setLiquidationData({...liquidationData, actualAmount: e.target.value ? parseFloat(e.target.value) : undefined})}
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
            value={liquidationData.description || ''
            }
            onChange={(e) => setLiquidationData({...liquidationData, description: e.target.value})}
            placeholder="Overall description of the liquidation..."
            rows={3}
            className={errors.description ? 'border-red-500' : ''}
          />
          {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
        </div>

        {requiresEnhancedDocs && (
          <>
            <div className="border-t pt-4">
              <h4 className="font-semibold text-gray-800 mb-3">Enhanced Documentation Required</h4>
              
              {selectedAdvance && liquidationData.actualAmount && (
                (() => {
                  const variance = Math.abs(liquidationData.actualAmount - selectedAdvance.amount);
                  const variancePercentage = (variance / selectedAdvance.amount) * 100;
                  
                  return variancePercentage > 10 ? (
                    <div>
                      <Label htmlFor="varianceExplanation">Variance Explanation *</Label>
                      <Textarea
                        id="varianceExplanation"
                        value={liquidationData.varianceExplanation || ''
                        }
                        onChange={(e) => setLiquidationData({...liquidationData, varianceExplanation: e.target.value})}
                        placeholder="Explain why actual spending differed significantly from the estimated amount..."
                        rows={3}
                        className={errors.varianceExplanation ? 'border-red-500' : ''}
                      />
                      {errors.varianceExplanation && <p className="text-red-500 text-sm mt-1">{errors.varianceExplanation}</p>}
                      <p className="text-sm text-amber-600 mt-1">
                        <strong>Variance: {variancePercentage.toFixed(1)}%</strong> - Explanation required for variances over 10%
                      </p>
                    </div>
                  ) : null;
                })()
              )}

              <div>
                <Label htmlFor="lessonsLearned">Lessons Learned *</Label>
                <Textarea
                  id="lessonsLearned"
                  value={liquidationData.lessonsLearned || ''
                  }
                  onChange={(e) => setLiquidationData({...liquidationData, lessonsLearned: e.target.value})}
                  placeholder="Document key insights and lessons learned from this expense that could improve future planning..."
                  rows={3}
                  className={errors.lessonsLearned ? 'border-red-500' : ''}
                />
                {errors.lessonsLearned && <p className="text-red-500 text-sm mt-1">{errors.lessonsLearned}</p>}
              </div>
            </div>
          </>
        )}

        {renderFileUpload(
          liquidationData.attachments,
          (files) => setLiquidationData({...liquidationData, attachments: files}),
          'attachments'
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Create New Request</CardTitle>
          {requiresEnhancedDocs && (
            <div className="text-sm text-amber-700 bg-amber-50 p-2 rounded-md mt-2">
              <strong>Enhanced Documentation Required:</strong> As a {currentUser.role}, you must provide additional justification and mandatory documentation for all requests.
            </div>
          )}
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
                {requiresEnhancedDocs && (
                  <p className="text-xs text-amber-600 mt-1">⚠️ Enhanced docs required</p>
                )}
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
                {requiresEnhancedDocs && (
                  <p className="text-xs text-amber-600 mt-1">⚠️ Enhanced docs required</p>
                )}
              </div>
            </Button>

            <Button
              variant="outline"
              className="p-6 h-auto flex flex-col items-center space-y-2 hover:bg-purple-50 hover:border-purple-300"
              onClick={() => openForm('LIQUIDATION')}
              disabled={loadingAdvances || pendingAdvances.length === 0}
            >
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <span className="text-2xl">📊</span>
              </div>
              <div className="text-center">
                <p className="font-semibold">Liquidation</p>
                <p className="text-sm text-muted-foreground">
                  {loadingAdvances 
                    ? "Loading..." 
                    : pendingAdvances.length === 0 
                      ? "No advances to liquidate" 
                      : "Account for advance money you've received"}
                </p>
                {requiresEnhancedDocs && pendingAdvances.length > 0 && (
                  <p className="text-xs text-amber-600 mt-1">⚠️ Enhanced docs required</p>
                )}
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
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <div className="space-y-4">
              <div className="bg-gray-50 p-3 rounded-md">
                <p className="text-sm text-muted-foreground">
                  <strong>Submitting as:</strong> {currentUser.name} ({currentUser.role})
                  {requiresEnhancedDocs && (
                    <span className="ml-2 text-amber-600 font-medium">• Enhanced Documentation Required</span>
                  )}
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
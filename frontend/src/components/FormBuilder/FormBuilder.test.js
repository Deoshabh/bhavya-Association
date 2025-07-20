import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../../context/AuthContext';
import EnhancedFormBuilder from '../FormBuilder/EnhancedFormBuilder';
import EnhancedSubmissionManagement from '../FormBuilder/EnhancedSubmissionManagement';
import FormEmbedder from '../FormBuilder/FormEmbedder';
import FormPreview from '../FormBuilder/FormPreview';

// Mock API responses
const mockFormData = {
  _id: 'form123',
  title: 'Test Form',
  description: 'Test form description',
  fields: [
    {
      id: 'field1',
      type: 'text',
      label: 'Name',
      placeholder: 'Enter your name',
      required: true,
      validation: {
        minLength: 2,
        maxLength: 50
      }
    },
    {
      id: 'field2',
      type: 'email',
      label: 'Email',
      placeholder: 'Enter your email',
      required: true
    },
    {
      id: 'field3',
      type: 'select',
      label: 'Category',
      options: ['Option 1', 'Option 2', 'Option 3'],
      required: false
    }
  ],
  styling: {
    theme: 'modern',
    primaryColor: '#3B82F6',
    backgroundColor: '#ffffff'
  },
  settings: {
    allowMultipleSubmissions: false,
    showProgressBar: true,
    requireLogin: false
  },
  isActive: true,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01')
};

const mockSubmissions = [
  {
    _id: 'sub1',
    formId: 'form123',
    data: {
      field1: 'John Doe',
      field2: 'john@example.com',
      field3: 'Option 1'
    },
    submittedAt: new Date('2024-01-15'),
    submittedBy: {
      _id: 'user1',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com'
    }
  },
  {
    _id: 'sub2',
    formId: 'form123',
    data: {
      field1: 'Jane Smith',
      field2: 'jane@example.com',
      field3: 'Option 2'
    },
    submittedAt: new Date('2024-01-16'),
    submittedBy: {
      _id: 'user2',
      firstName: 'Jane',
      lastName: 'Smith',
      email: 'jane@example.com'
    }
  }
];

// Mock context
const mockAuthContext = {
  user: { _id: 'admin1', planType: 'admin', firstName: 'Admin', lastName: 'User' },
  api: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn()
  }
};

// Test wrapper component
const TestWrapper = ({ children }) => (
  <BrowserRouter>
    <AuthProvider value={mockAuthContext}>
      {children}
    </AuthProvider>
  </BrowserRouter>
);

describe('Enhanced Form Builder System', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default API responses
    mockAuthContext.api.get.mockImplementation((url) => {
      if (url.includes('/forms/admin/')) {
        return Promise.resolve({ data: { form: mockFormData } });
      }
      if (url.includes('/forms/submissions/')) {
        return Promise.resolve({ data: { submissions: mockSubmissions } });
      }
      if (url.includes('/forms/admin')) {
        return Promise.resolve({ data: { forms: [mockFormData] } });
      }
      return Promise.resolve({ data: {} });
    });

    mockAuthContext.api.post.mockResolvedValue({ 
      data: { 
        form: { ...mockFormData, _id: 'newform123' },
        message: 'Form created successfully'
      } 
    });

    mockAuthContext.api.put.mockResolvedValue({ 
      data: { 
        form: mockFormData,
        message: 'Form updated successfully'
      } 
    });
  });

  describe('EnhancedFormBuilder Component', () => {
    test('renders form builder interface correctly', async () => {
      render(
        <TestWrapper>
          <EnhancedFormBuilder />
        </TestWrapper>
      );

      // Check for main interface elements
      expect(screen.getByText('Enhanced Form Builder')).toBeInTheDocument();
      expect(screen.getByText('Field Toolbox')).toBeInTheDocument();
      expect(screen.getByText('Form Canvas')).toBeInTheDocument();
      expect(screen.getByText('Form Settings')).toBeInTheDocument();
    });

    test('allows adding fields from toolbox', async () => {
      render(
        <TestWrapper>
          <EnhancedFormBuilder />
        </TestWrapper>
      );

      // Wait for component to load
      await waitFor(() => {
        expect(screen.getByText('Text Input')).toBeInTheDocument();
      });

      // Click on text input field type
      const textInputButton = screen.getByText('Text Input');
      fireEvent.click(textInputButton);

      // Should add field to canvas
      await waitFor(() => {
        expect(screen.getByPlaceholderText('Field Label')).toBeInTheDocument();
      });
    });

    test('allows form customization', async () => {
      render(
        <TestWrapper>
          <EnhancedFormBuilder />
        </TestWrapper>
      );

      // Wait for form to load
      await waitFor(() => {
        expect(screen.getByLabelText('Form Title')).toBeInTheDocument();
      });

      // Update form title
      const titleInput = screen.getByLabelText('Form Title');
      fireEvent.change(titleInput, { target: { value: 'Custom Form Title' } });

      expect(titleInput.value).toBe('Custom Form Title');
    });

    test('validates required fields before saving', async () => {
      render(
        <TestWrapper>
          <EnhancedFormBuilder />
        </TestWrapper>
      );

      // Try to save without title
      const saveButton = screen.getByText('Save Form');
      fireEvent.click(saveButton);

      // Should show validation error
      await waitFor(() => {
        expect(screen.getByText('Form title is required')).toBeInTheDocument();
      });
    });
  });

  describe('FormPreview Component', () => {
    test('renders form preview correctly', async () => {
      render(
        <TestWrapper>
          <FormPreview formId="form123" />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Test Form')).toBeInTheDocument();
      });
      
      expect(screen.getByText('Test form description')).toBeInTheDocument();
    });

    test('shows responsive preview modes', async () => {
      render(
        <TestWrapper>
          <FormPreview formId="form123" />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Desktop')).toBeInTheDocument();
      });
      
      expect(screen.getByText('Tablet')).toBeInTheDocument();
      expect(screen.getByText('Mobile')).toBeInTheDocument();
    });

    test('validates form submission', async () => {
      render(
        <TestWrapper>
          <FormPreview formId="form123" />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByLabelText('Name')).toBeInTheDocument();
      });

      // Try to submit without required field
      const submitButton = screen.getByText('Submit');
      fireEvent.click(submitButton);

      // Should show validation error
      await waitFor(() => {
        expect(screen.getByText('This field is required')).toBeInTheDocument();
      });
    });
  });

  describe('EnhancedSubmissionManagement Component', () => {
    test('renders submission management interface', async () => {
      render(
        <TestWrapper>
          <EnhancedSubmissionManagement />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Submission Management')).toBeInTheDocument();
      });
      
      expect(screen.getByText('Total Submissions')).toBeInTheDocument();
    });

    test('displays submission statistics', async () => {
      render(
        <TestWrapper>
          <EnhancedSubmissionManagement />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('2')).toBeInTheDocument(); // Total submissions
      });
    });

    test('allows filtering submissions', async () => {
      render(
        <TestWrapper>
          <EnhancedSubmissionManagement />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Search submissions...')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Search submissions...');
      fireEvent.change(searchInput, { target: { value: 'john' } });

      // Should filter submissions
      expect(searchInput.value).toBe('john');
    });

    test('supports bulk actions', async () => {
      render(
        <TestWrapper>
          <EnhancedSubmissionManagement />
        </TestWrapper>
      );

      await waitFor(() => {
        const checkboxes = screen.getAllByRole('checkbox');
        expect(checkboxes.length).toBeGreaterThan(0);
      });

      // Select submissions
      const firstCheckbox = screen.getAllByRole('checkbox')[1]; // Skip "select all"
      fireEvent.click(firstCheckbox);

      // Should show bulk actions
      await waitFor(() => {
        expect(screen.getByText('Bulk Actions')).toBeInTheDocument();
      });
    });
  });

  describe('FormEmbedder Component', () => {
    test('renders embed code generator', async () => {
      render(
        <TestWrapper>
          <FormEmbedder formId="form123" onClose={() => {}} />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Embed Form')).toBeInTheDocument();
      });
      
      expect(screen.getByText('Embed Type')).toBeInTheDocument();
    });

    test('generates different embed types', async () => {
      render(
        <TestWrapper>
          <FormEmbedder formId="form123" onClose={() => {}} />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Inline')).toBeInTheDocument();
      });
      
      expect(screen.getByText('Popup Modal')).toBeInTheDocument();
      expect(screen.getByText('Sidebar')).toBeInTheDocument();

      // Test popup embed type
      const popupRadio = screen.getByLabelText('Popup Modal');
      fireEvent.click(popupRadio);

      await waitFor(() => {
        expect(screen.getByText('Copy Code')).toBeInTheDocument();
      });
    });

    test('allows customization of embed settings', async () => {
      render(
        <TestWrapper>
          <FormEmbedder formId="form123" onClose={() => {}} />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Display Options')).toBeInTheDocument();
      });

      // Toggle show title
      const showTitleCheckbox = screen.getByLabelText('Show form title');
      fireEvent.click(showTitleCheckbox);

      expect(showTitleCheckbox.checked).toBe(false);
    });
  });

  describe('Integration Tests', () => {
    test('form creation to submission workflow', async () => {
      // Test complete workflow from form creation to viewing submissions
      const { rerender } = render(
        <TestWrapper>
          <EnhancedFormBuilder />
        </TestWrapper>
      );

      // Create form
      await waitFor(() => {
        expect(screen.getByLabelText('Form Title')).toBeInTheDocument();
      });

      const titleInput = screen.getByLabelText('Form Title');
      fireEvent.change(titleInput, { target: { value: 'Integration Test Form' } });

      const saveButton = screen.getByText('Save Form');
      fireEvent.click(saveButton);

      // Wait for save
      await waitFor(() => {
        expect(mockAuthContext.api.post).toHaveBeenCalled();
      });

      // Switch to submission management
      rerender(
        <TestWrapper>
          <EnhancedSubmissionManagement />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Submission Management')).toBeInTheDocument();
      });
    });

    test('form preview and embed generation', async () => {
      const { rerender } = render(
        <TestWrapper>
          <FormPreview formId="form123" />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Test Form')).toBeInTheDocument();
      });

      // Switch to embed generator
      rerender(
        <TestWrapper>
          <FormEmbedder formId="form123" onClose={() => {}} />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Embed Form')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    test('handles API errors gracefully', async () => {
      mockAuthContext.api.get.mockRejectedValue(new Error('API Error'));

      render(
        <TestWrapper>
          <FormPreview formId="form123" />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Failed to fetch form data')).toBeInTheDocument();
      });
    });

    test('shows loading states', async () => {
      // Mock slow API response
      mockAuthContext.api.get.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({ data: { form: mockFormData } }), 100))
      );

      render(
        <TestWrapper>
          <FormPreview formId="form123" />
        </TestWrapper>
      );

      expect(screen.getByText('Loading form...')).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.getByText('Test Form')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    test('form builder is keyboard navigable', async () => {
      render(
        <TestWrapper>
          <EnhancedFormBuilder />
        </TestWrapper>
      );

      await waitFor(() => {
        const firstButton = screen.getByText('Text Input');
        expect(firstButton).toBeInTheDocument();
      });

      // Test keyboard navigation
      const firstButton = screen.getByText('Text Input');
      firstButton.focus();
      expect(firstButton).toHaveFocus();
    });

    test('form preview has proper ARIA labels', async () => {
      render(
        <TestWrapper>
          <FormPreview formId="form123" />
        </TestWrapper>
      );

      await waitFor(() => {
        const nameInput = screen.getByLabelText('Name');
        expect(nameInput).toHaveAttribute('aria-required', 'true');
      });
    });
  });
});

// Performance Tests
describe('Performance Tests', () => {
  test('renders large forms efficiently', async () => {
    const largeForm = {
      ...mockFormData,
      fields: Array.from({ length: 50 }, (_, i) => ({
        id: `field${i}`,
        type: 'text',
        label: `Field ${i}`,
        required: false
      }))
    };

    mockAuthContext.api.get.mockResolvedValue({ data: { form: largeForm } });

    const startTime = performance.now();
    
    render(
      <TestWrapper>
        <FormPreview formId="form123" />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Test Form')).toBeInTheDocument();
    });

    const endTime = performance.now();
    const renderTime = endTime - startTime;

    // Should render within reasonable time (adjust threshold as needed)
    expect(renderTime).toBeLessThan(1000); // 1 second
  });
});

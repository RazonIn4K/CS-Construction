'use client';

/**
 * ==============================================================================
 * Lead Submission Form Component
 * ==============================================================================
 * Comprehensive form for capturing lead information with:
 * - Client details (name, email, phone)
 * - Property information (address)
 * - Service type selection
 * - Project details
 * - Full client-side validation with Zod
 * - Optimistic UI with loading states
 * - Accessible (WCAG 2.1 AA compliant)
 * ==============================================================================
 */

import { useState } from 'react';
import { LeadSubmissionSchema } from '@/types/schemas';
import { z } from 'zod';

type LeadFormData = z.infer<typeof LeadSubmissionSchema>;

interface LeadFormProps {
  onSuccess?: () => void;
  className?: string;
}

const SERVICE_TYPES = [
  'Kitchen Remodel',
  'Bathroom Remodel',
  'Deck Installation',
  'Window Installation',
  'Siding',
  'Roofing',
  'Basement Finishing',
  'Other',
] as const;

const US_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
];

export default function LeadForm({ onSuccess, className = '' }: LeadFormProps) {
  // Form state
  const [formData, setFormData] = useState<Partial<LeadFormData>>({
    state: 'IL', // Default to Illinois (Rockford area)
    service_type: '',
  });

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  /**
   * Handle input changes
   */
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear validation error for this field
    if (validationErrors[name]) {
      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  /**
   * Validate form data with Zod
   */
  const validateForm = (): boolean => {
    try {
      LeadSubmissionSchema.parse(formData);
      setValidationErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors: Record<string, string> = {};
        error.issues.forEach((err) => {
          const path = err.path.join('.');
          errors[path] = err.message;
        });
        setValidationErrors(errors);
      }
      return false;
    }
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Reset status
    setSubmitStatus('idle');
    setErrorMessage('');

    // Validate
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit lead');
      }

      // Success!
      setSubmitStatus('success');

      // Reset form
      setFormData({
        state: 'IL',
        service_type: '',
      });

      // Call success callback
      if (onSuccess) {
        onSuccess();
      }

      // Auto-hide success message after 5 seconds
      setTimeout(() => {
        setSubmitStatus('idle');
      }, 5000);

    } catch (error) {
      console.error('Error submitting lead:', error);
      setSubmitStatus('error');
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'An unexpected error occurred. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={`max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-6 md:p-8 ${className}`}
      noValidate
    >
      {/* Form Title */}
      <div className="mb-6">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
          Get Your Free Quote
        </h2>
        <p className="text-gray-600">
          Fill out the form below and we'll get back to you within 24 hours with a detailed estimate.
        </p>
      </div>

      {/* Success Message */}
      {submitStatus === 'success' && (
        <div
          className="mb-6 p-4 bg-green-50 border border-green-200 rounded-md"
          role="alert"
        >
          <div className="flex items-start">
            <svg
              className="w-5 h-5 text-green-600 mt-0.5 mr-3 flex-shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <div>
              <h3 className="text-sm font-medium text-green-800">
                Quote Request Submitted!
              </h3>
              <p className="mt-1 text-sm text-green-700">
                Thank you! We've received your request and will email you a detailed quote within 24 hours.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {submitStatus === 'error' && (
        <div
          className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md"
          role="alert"
        >
          <div className="flex items-start">
            <svg
              className="w-5 h-5 text-red-600 mt-0.5 mr-3 flex-shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
            <div>
              <h3 className="text-sm font-medium text-red-800">
                Submission Failed
              </h3>
              <p className="mt-1 text-sm text-red-700">
                {errorMessage}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Personal Information Section */}
      <fieldset className="mb-6">
        <legend className="text-lg font-semibold text-gray-900 mb-4">
          Your Information
        </legend>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* First Name */}
          <div>
            <label
              htmlFor="first_name"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              First Name <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              id="first_name"
              name="first_name"
              value={formData.first_name || ''}
              onChange={handleChange}
              required
              className={`w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                validationErrors.first_name
                  ? 'border-red-500'
                  : 'border-gray-300'
              }`}
              aria-invalid={!!validationErrors.first_name}
              aria-describedby={validationErrors.first_name ? 'first_name-error' : undefined}
            />
            {validationErrors.first_name && (
              <p id="first_name-error" className="mt-1 text-sm text-red-600">
                {validationErrors.first_name}
              </p>
            )}
          </div>

          {/* Last Name */}
          <div>
            <label
              htmlFor="last_name"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Last Name <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              id="last_name"
              name="last_name"
              value={formData.last_name || ''}
              onChange={handleChange}
              required
              className={`w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                validationErrors.last_name
                  ? 'border-red-500'
                  : 'border-gray-300'
              }`}
              aria-invalid={!!validationErrors.last_name}
              aria-describedby={validationErrors.last_name ? 'last_name-error' : undefined}
            />
            {validationErrors.last_name && (
              <p id="last_name-error" className="mt-1 text-sm text-red-600">
                {validationErrors.last_name}
              </p>
            )}
          </div>

          {/* Email */}
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Email Address <span className="text-red-600">*</span>
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email || ''}
              onChange={handleChange}
              required
              className={`w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                validationErrors.email
                  ? 'border-red-500'
                  : 'border-gray-300'
              }`}
              aria-invalid={!!validationErrors.email}
              aria-describedby={validationErrors.email ? 'email-error' : undefined}
            />
            {validationErrors.email && (
              <p id="email-error" className="mt-1 text-sm text-red-600">
                {validationErrors.email}
              </p>
            )}
          </div>

          {/* Phone */}
          <div>
            <label
              htmlFor="phone"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Phone Number
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone || ''}
              onChange={handleChange}
              placeholder="(815) 555-1234"
              className={`w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                validationErrors.phone
                  ? 'border-red-500'
                  : 'border-gray-300'
              }`}
              aria-invalid={!!validationErrors.phone}
              aria-describedby={validationErrors.phone ? 'phone-error' : undefined}
            />
            {validationErrors.phone && (
              <p id="phone-error" className="mt-1 text-sm text-red-600">
                {validationErrors.phone}
              </p>
            )}
          </div>
        </div>
      </fieldset>

      {/* Property Information Section */}
      <fieldset className="mb-6">
        <legend className="text-lg font-semibold text-gray-900 mb-4">
          Property Address
        </legend>

        <div className="space-y-4">
          {/* Street Address */}
          <div>
            <label
              htmlFor="street_address"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Street Address <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              id="street_address"
              name="address1"
              value={formData.address1 || ''}
              onChange={handleChange}
              required
              placeholder="123 Main Street"
              className={`w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                validationErrors.street_address
                  ? 'border-red-500'
                  : 'border-gray-300'
              }`}
              aria-invalid={!!validationErrors.street_address}
              aria-describedby={validationErrors.street_address ? 'street_address-error' : undefined}
            />
            {validationErrors.street_address && (
              <p id="street_address-error" className="mt-1 text-sm text-red-600">
                {validationErrors.street_address}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* City */}
            <div>
              <label
                htmlFor="city"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                City <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                id="city"
                name="city"
                value={formData.city || ''}
                onChange={handleChange}
                required
                placeholder="Rockford"
                className={`w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  validationErrors.city
                    ? 'border-red-500'
                    : 'border-gray-300'
                }`}
                aria-invalid={!!validationErrors.city}
                aria-describedby={validationErrors.city ? 'city-error' : undefined}
              />
              {validationErrors.city && (
                <p id="city-error" className="mt-1 text-sm text-red-600">
                  {validationErrors.city}
                </p>
              )}
            </div>

            {/* State */}
            <div>
              <label
                htmlFor="state"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                State <span className="text-red-600">*</span>
              </label>
              <select
                id="state"
                name="state"
                value={formData.state || 'IL'}
                onChange={handleChange}
                required
                className={`w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  validationErrors.state
                    ? 'border-red-500'
                    : 'border-gray-300'
                }`}
                aria-invalid={!!validationErrors.state}
                aria-describedby={validationErrors.state ? 'state-error' : undefined}
              >
                {US_STATES.map((state) => (
                  <option key={state} value={state}>
                    {state}
                  </option>
                ))}
              </select>
              {validationErrors.state && (
                <p id="state-error" className="mt-1 text-sm text-red-600">
                  {validationErrors.state}
                </p>
              )}
            </div>

            {/* ZIP Code */}
            <div>
              <label
                htmlFor="zip_code"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                ZIP Code <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                id="zip_code"
                name="zip"
                value={formData.zip || ''}
                onChange={handleChange}
                required
                placeholder="61101"
                maxLength={5}
                className={`w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  validationErrors.zip_code
                    ? 'border-red-500'
                    : 'border-gray-300'
                }`}
                aria-invalid={!!validationErrors.zip_code}
                aria-describedby={validationErrors.zip_code ? 'zip_code-error' : undefined}
              />
              {validationErrors.zip_code && (
                <p id="zip_code-error" className="mt-1 text-sm text-red-600">
                  {validationErrors.zip_code}
                </p>
              )}
            </div>
          </div>
        </div>
      </fieldset>

      {/* Project Details Section */}
      <fieldset className="mb-6">
        <legend className="text-lg font-semibold text-gray-900 mb-4">
          Project Details
        </legend>

        <div className="space-y-4">
          {/* Service Type */}
          <div>
            <label
              htmlFor="service_type"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Service Type <span className="text-red-600">*</span>
            </label>
            <select
              id="service_type"
              name="service_type"
              value={formData.service_type || ''}
              onChange={handleChange}
              required
              className={`w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                validationErrors.service_type
                  ? 'border-red-500'
                  : 'border-gray-300'
              }`}
              aria-invalid={!!validationErrors.service_type}
              aria-describedby={validationErrors.service_type ? 'service_type-error' : undefined}
            >
              <option value="">-- Select a Service --</option>
              {SERVICE_TYPES.map((service) => (
                <option key={service} value={service}>
                  {service}
                </option>
              ))}
            </select>
            {validationErrors.service_type && (
              <p id="service_type-error" className="mt-1 text-sm text-red-600">
                {validationErrors.service_type}
              </p>
            )}
          </div>

          {/* Message */}
          <div>
            <label
              htmlFor="message"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Project Details
            </label>
            <textarea
              id="message"
              name="intake_notes"
              value={formData.intake_notes || ''}
              onChange={handleChange}
              rows={4}
              placeholder="Tell us about your project... (dimensions, materials, timeline, etc.)"
              className={`w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                validationErrors.message
                  ? 'border-red-500'
                  : 'border-gray-300'
              }`}
              aria-invalid={!!validationErrors.message}
              aria-describedby={validationErrors.message ? 'message-error' : undefined}
            />
            {validationErrors.message && (
              <p id="message-error" className="mt-1 text-sm text-red-600">
                {validationErrors.message}
              </p>
            )}
          </div>
        </div>
      </fieldset>

      {/* Submit Button */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">
          <span className="text-red-600">*</span> Required fields
        </p>

        <button
          type="submit"
          disabled={isSubmitting}
          className={`px-8 py-3 rounded-md font-semibold text-white transition-colors ${
            isSubmitting
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 focus:ring-4 focus:ring-blue-300'
          }`}
        >
          {isSubmitting ? (
            <span className="flex items-center">
              <svg
                className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Submitting...
            </span>
          ) : (
            'Get Free Quote'
          )}
        </button>
      </div>

      {/* Privacy Note */}
      <p className="mt-4 text-xs text-gray-500 text-center">
        By submitting this form, you agree to our{' '}
        <a href="/privacy" className="text-blue-600 hover:underline">
          Privacy Policy
        </a>
        . We will never share your information with third parties.
      </p>
    </form>
  );
}

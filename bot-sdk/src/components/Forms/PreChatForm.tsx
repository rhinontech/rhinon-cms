// Pre-Chat Form Component - Collects user info before starting chat
import React from 'react';
import type { ChatbotConfig, FormField } from '@/types';

export interface PreChatFormProps {
  preChatForm: FormField[] | { fields: FormField[] };
  isConversationActive: boolean;
  handleSaveEmail: (values: Record<string, string>) => void;
  chatbot_config: ChatbotConfig;
}

export const PreChatForm: React.FC<PreChatFormProps> = ({
  preChatForm,
  isConversationActive,
  handleSaveEmail,
  chatbot_config,
}) => {
  const fields = Array.isArray(preChatForm)
    ? preChatForm
    : (preChatForm as { fields: FormField[] }).fields || [];

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!isConversationActive) {
      alert('This conversation has expired. Please start a new conversation.');
      return;
    }

    const formData = new FormData(e.currentTarget);
    const values: Record<string, string> = {};

    fields.forEach((field) => {
      values[field.id] = formData.get(field.id)?.toString() || '';
    });

    // Validate email if present
    const emailField = fields.find((f) => f.type === 'email');
    if (emailField) {
      const emailValue = values[emailField.id];
      if (!emailValue) {
        alert('Please enter your email!');
        return;
      }
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailPattern.test(emailValue)) {
        alert('Please enter a valid email!');
        return;
      }
    }

    handleSaveEmail(values);
  };

  return (
    <div className='overlay'>
      <div className='ticket-screen'>
        <div className='ticket-body'>
          <form className='ticket-form' onSubmit={handleSubmit}>
            <div className='ticket-inputs'>
              {fields.map((field) => (
                <div
                  key={field.id}
                  className='ticket-input-group'
                  style={{
                    ['--primary-color' as any]: chatbot_config.primaryColor,
                  }}
                >
                  <label htmlFor={field.id}>{field.label}</label>
                  <input
                    id={field.id}
                    type={field.type === 'name' ? 'text' : field.type}
                    name={field.id}
                    placeholder={field.placeholder || ''}
                    required={field.required}
                    disabled={!isConversationActive}
                  />
                </div>
              ))}
            </div>

            <button
              type='submit'
              className='submit-form-btn'
              style={{
                ['--primary-color' as any]: chatbot_config.primaryColor,
              }}
            >
              Start Chat
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PreChatForm;

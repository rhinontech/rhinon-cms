// Post-Chat Form Component - Collects feedback after chat ends
import React from 'react';
import { X } from 'lucide-react';
import type { ChatbotConfig, PostChatFormConfig } from '@/types';
import StarRating from '../StarRating/StarRating';

export interface PostChatFormProps {
  postChatForm: PostChatFormConfig;
  handlePostFormSubmit: (values: Record<string, string>) => void;
  chatbot_config: ChatbotConfig;
  handleCancel: () => void;
}

export const PostChatForm: React.FC<PostChatFormProps> = ({
  postChatForm,
  handlePostFormSubmit,
  chatbot_config,
  handleCancel,
}) => {
  const fields = Array.isArray(postChatForm.elements)
    ? postChatForm.elements
    : postChatForm.fields || [];

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const values: Record<string, string> = {};

    fields.forEach((field: any) => {
      values[field.id] = formData.get(field.id)?.toString() || '';
    });

    handlePostFormSubmit(values);
  };

  const renderField = (field: any) => {
    const primaryColorStyle = {
      ['--primary-color' as any]: chatbot_config.primaryColor,
    };

    switch (field.type) {
      case 'rating':
        return (
          <div key={field.id} className='rating-group'>
            <label style={{ textAlign: 'center', marginBottom: '10px' }} htmlFor={field.id}>
              {field.label}
            </label>
            <StarRating name={field.id} required={field.required} />
          </div>
        );

      case 'choice':
        return (
          <div key={field.id} className='ticket-input-group' style={primaryColorStyle}>
            <label htmlFor={field.id}>{field.label}</label>
            <select
              id={field.id}
              name={field.id}
              required={field.required}
              style={{ padding: '12px 2px', borderRadius: '6px', width: '100%' }}
            >
              <option value=''>-- Select an option --</option>
              {field.options?.map((option: string, idx: number) => (
                <option key={idx} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        );

      case 'multiple-choice':
        return (
          <div key={field.id} className='ticket-input-group' style={primaryColorStyle}>
            <label>{field.label}</label>
            <div style={{ display: 'flex', flexDirection: 'row', gap: '6px', flexWrap: 'wrap' }}>
              {field.options?.map((option: string, idx: number) => (
                <label key={idx} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <input type='checkbox' name={field.id} value={option} />
                  {option}
                </label>
              ))}
            </div>
          </div>
        );

      default:
        return (
          <div key={field.id} className='ticket-input-group' style={primaryColorStyle}>
            <label htmlFor={field.id}>{field.label}</label>
            <input
              id={field.id}
              type='text'
              name={field.id}
              placeholder={field.placeholder || ''}
              required={field.required}
            />
          </div>
        );
    }
  };

  return (
    <div className='overlay'>
      <div className='ticket-screen'>
        <div className='ticket-body'>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '10px',
            }}
          >
            <h3>Feedback</h3>
            <button
              onClick={handleCancel}
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--text-primary)',
              }}
            >
              <X size={20} />
            </button>
          </div>
          <form className='ticket-form' onSubmit={handleSubmit}>
            <div className='ticket-inputs'>{fields.map(renderField)}</div>

            <button
              type='submit'
              className='submit-form-btn'
              style={{
                ['--primary-color' as any]: chatbot_config.primaryColor,
              }}
            >
              Submit Feedback
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PostChatForm;

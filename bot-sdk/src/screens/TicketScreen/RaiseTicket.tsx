import React, { useState, useRef } from 'react';
import './RaiseTicket.scss';
import { ChevronLeft } from 'lucide-react';

// New imports from restructured modules
import type { TicketField, ChatbotConfig, TicketScreenProps } from '@/types';
import { submitTicket } from '@/services/ticket';

const RaiseTicket: React.FC<TicketScreenProps> = ({
  appId,
  setIsTicketRaised,
  chatbot_config,
  ticketForm,
  setOpenTicket,
}) => {
  const [formValues, setFormValues] = useState<{ [key: string]: string }>({});
  const fieldRefs: any = useRef({});
  const handleChange = (id: string, value: string) => {
    setFormValues((prev) => ({ ...prev, [id]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Find first required field that's empty
    for (const field of ticketForm) {
      if (field.required && !formValues[field.id]) {
        // Scroll into view
        fieldRefs.current[field.id]?.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });

        // Optional: add focus
        fieldRefs.current[field.id]?.focus();

        return; // stop checking after first invalid field
      }
    }

    // Validate required fields
    for (const field of ticketForm) {
      if (field.required && !formValues[field.id]) {
        alert(`${field.label} is required`);
        return;
      }
    }

    // MAPPING FOR LIVE + LOCAL
    const emailField = ticketForm.find((f) =>
      ['email', 'email_input'].includes(f.type),
    );

    const subjectField = ticketForm.find((f) =>
      ['subject', 'text', 'short_text'].includes(f.type),
    );

    const descField = ticketForm.find((f) =>
      ['description', 'textarea', 'long_text'].includes(f.type),
    );

    // BUILD PAYLOAD
    const payload: any = {
      chatbot_id: appId,
      customer_email: emailField ? formValues[emailField.id] || '' : '',
      subject: subjectField ? formValues[subjectField.id] || 'No Subject' : '',
      conversations: [
        {
          role: 'customer',
          text: descField ? formValues[descField.id] || '' : '',
        },
      ],
      custom_data: {},
    };

    // EXTRA FIELDS
    ticketForm.forEach((field) => {
      const type = field.type;

      const isEmail = ['email', 'email_input'].includes(type);
      const isSubject = ['subject', 'text', 'short_text'].includes(type);
      const isDescription = ['description', 'textarea', 'long_text'].includes(
        type,
      );

      if (!isEmail && !isSubject && !isDescription) {
        payload.custom_data[
          field.label.trim().toLowerCase().replace(/\s+/g, '_')
        ] = formValues[field.id] || '';
      }
    });

    console.log('Ticket submitted:', payload);

    try {
      await submitTicket(payload);
      setIsTicketRaised(true);
      setOpenTicket(false);
    } catch (error) {
      console.error('Ticket submission failed:', error);
      alert('Failed to submit ticket. Please try again.');
    }
  };

  return (
    <div className='ticket-screen' onClick={(e) => e.stopPropagation()}>
      {/* <div
        className='ticket-header'
        style={{ ['--primary-color' as any]: chatbot_config.primaryColor }}
      >
        <div
          onClick={() => goBackClick()}
          style={{
            cursor: 'pointer',
            height: 36,
            width: 36,
            border: '1px solid #BEBEBE',
            borderRadius: 8,
            display: 'flex',
            position: 'absolute',
            left: '20px',
            top: '50%',              // push to middle
            transform: 'translateY(-50%)',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10
          }}
        >
          <ChevronLeft size={18} />
        </div>
        <h2>Raise Ticket</h2>
      </div> */}

      <div className='ticket-body'>
        <form className='ticket-form' onSubmit={handleSubmit}>
          {/* <p className='ticket-info'>
            Messages and ticket updates will be sent to your email address.
          </p> */}
          <div className='ticket-inputs'>
            {ticketForm.map((field) => (
              <div key={field.id} className='ticket-input-group'>
                <label>
                  {field.label}
                  {field.required && <span className='required'>*</span>}
                </label>
                {field.label.toLowerCase().includes('description') ? (
                  <textarea
                    ref={(el) => (fieldRefs.current[field.id] = el)}
                    placeholder={field.placeholder}
                    value={formValues[field.id] || ''}
                    onChange={(e) => handleChange(field.id, e.target.value)}
                  />
                ) : (
                  <input
                    ref={(el) => (fieldRefs.current[field.id] = el)} // attach ref
                    type='text'
                    placeholder={field.placeholder}
                    value={formValues[field.id] || ''}
                    onChange={(e) => handleChange(field.id, e.target.value)}
                  />
                )}
              </div>
            ))}
          </div>

          <div className='ticket-actions'>
            <button
              type='submit'
              className='ticket-submit'
              style={{
                ['--primary-color' as any]: chatbot_config.primaryColor,
              }}
            >
              Create ticket
            </button>
            <button
              type='button'
              className='ticket-cancel'
              onClick={() => setOpenTicket(false)}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RaiseTicket;

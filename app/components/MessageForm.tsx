'use client';

import { useState } from 'react';

const MessageForm = () => {
  const [formData, setFormData] = useState({ name: '', content: '' });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setLoading(true);

  try {
    const res = await fetch('/api/messages', {
      method: 'POST',
      body: JSON.stringify(formData),
    });

    if (res.ok) {
      setSubmitted(true);
      setFormData({ name: '', content: '' });
    } else {
      console.error('Error:', await res.json());
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    setLoading(false);
  }
};
  return (
    <div className="max-w-2xl mx-auto p-8 my-16 bg-white/20 backdrop-blur-md border border-white/30 rounded-2xl shadow-2xl transition">
      <h3 className="text-3xl font-bold text-white text-center mb-6">Leave a Message</h3>

      {submitted && (
        <div className="mb-4 text-center text-green-200 font-medium">
          Thank you! Your message has been received.
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <input
          type="text"
          name="name"
          value={formData.name}
          placeholder="Your name"
          onChange={handleChange}
          required
          className="w-full px-5 py-3 rounded-lg bg-white/80 text-gray-700 placeholder-gray-400 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-pink-400 transition"
        />

        <textarea
          name="content"
          value={formData.content}
          placeholder="Write your message here..."
          onChange={handleChange}
          required
          rows={4}
          className="w-full px-5 py-3 rounded-lg bg-white/80 text-gray-700 placeholder-gray-400 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-pink-400 transition"
        />

        <button
          type="submit"
          className="w-full py-3 bg-gradient-to-r from-pink-500 to-rose-500 text-white font-bold rounded-lg shadow-md hover:shadow-lg hover:scale-105 transition transform"
          disabled={loading}
        >
          {loading ? 'Sending...' : 'Submit'}
        </button>
      </form>
    </div>
  );
};

export default MessageForm;

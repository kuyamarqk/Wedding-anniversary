'use client';

import { useEffect, useState } from 'react';

type Message = {
  id: number;
  name: string;
  content: string; 
  created_at: string;
};

const MessageWall = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const res = await fetch('/api/messages/list');
        const data = await res.json();

        // ✅ Ensure it's an array
        if (Array.isArray(data)) {
          setMessages(data);
        } else {
          console.error('Unexpected response:', data);
          setMessages([]); // fallback to empty
        }
      } catch (err) {
        console.error('Error loading messages:', err);
        setMessages([]); // fallback to empty
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
  }, []);

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h3 className="text-3xl font-bold text-white text-center mb-8">Messages from Loved Ones</h3>
      {loading ? (
        <p className="text-white text-center">Loading messages...</p>
      ) : (
        <div className="space-y-6">
          {messages.length === 0 ? (
            <p className="text-white text-center opacity-70">No messages yet. Be the first!</p>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className="bg-white/20 backdrop-blur-md p-5 rounded-lg shadow-md border border-white/30"
              >
                <p className="text-white text-lg font-semibold">{msg.name}</p>
                <p className="text-white/90">{msg.content}</p>
                <p className="text-sm text-white/50 mt-2">
                  {new Date(msg.created_at).toLocaleString()}
                </p>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default MessageWall;
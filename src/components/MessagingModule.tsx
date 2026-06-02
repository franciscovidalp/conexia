import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, 
  Search, 
  MessageSquare, 
  Inbox,
  Clock
} from 'lucide-react';
import { dbService } from '../firebase';
import type { ChatMessage, Staff, SchoolType } from '../types';
import toast from 'react-hot-toast';

interface MessagingModuleProps {
  activeSchool: SchoolType;
  loggedInUser: Staff | null;
  staff: Staff[];
}

export const MessagingModule: React.FC<MessagingModuleProps> = ({
  activeSchool,
  loggedInUser,
  staff
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedColleague, setSelectedColleague] = useState<Staff | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessageText, setNewMessageText] = useState('');
  const [loadingMessages, setLoadingMessages] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Filter staff to get colleagues of the same school, excluding the current logged-in user
  const colleagues = staff.filter(st => {
    const isSameSchool = st.school === activeSchool;
    const isNotMe = loggedInUser ? st.id !== loggedInUser.id && st.email !== loggedInUser.email : true;
    return isSameSchool && isNotMe;
  });

  const filteredColleagues = colleagues.filter(st => 
    `${st.firstName} ${st.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    st.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Poll messages
  useEffect(() => {
    if (!loggedInUser) return;

    loadMessages();

    // Set up polling interval every 4 seconds
    const interval = setInterval(() => {
      loadMessages(true); // silent load
    }, 4000);

    return () => clearInterval(interval);
  }, [selectedColleague, activeSchool, loggedInUser]);

  // Scroll to bottom when messages list changes
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadMessages = async (silent = false) => {
    if (!loggedInUser) return;
    if (!selectedColleague) {
      setMessages([]);
      return;
    }

    if (!silent) setLoadingMessages(true);
    try {
      const allMsgs = await dbService.getMessages(activeSchool);
      
      // Filter messages between loggedInUser and selectedColleague
      const myId = loggedInUser.id;
      const myEmail = loggedInUser.email;
      const theirId = selectedColleague.id;
      const theirEmail = selectedColleague.email;

      const filtered = allMsgs.filter(m => {
        const isFromMeToThem = (m.senderId === myId || m.senderId === myEmail) && 
                               (m.recipientId === theirId || m.recipientId === theirEmail);
        const isFromThemToMe = (m.senderId === theirId || m.senderId === theirEmail) && 
                               (m.recipientId === myId || m.recipientId === myEmail);
        return isFromMeToThem || isFromThemToMe;
      });

      setMessages(filtered);
    } catch (e) {
      console.error(e);
      if (!silent) toast.error('Error al cargar mensajes.');
    } finally {
      if (!silent) setLoadingMessages(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loggedInUser || !selectedColleague) return;
    if (!newMessageText.trim()) return;

    const textToSend = newMessageText.trim();
    setNewMessageText(''); // Clear input early for responsive feel

    try {
      const msgPayload = {
        senderId: loggedInUser.id,
        senderName: `${loggedInUser.firstName} ${loggedInUser.lastName}`,
        recipientId: selectedColleague.id,
        recipientName: `${selectedColleague.firstName} ${selectedColleague.lastName}`,
        school: activeSchool,
        message: textToSend
      };

      const sentMsg = await dbService.sendMessage(msgPayload);
      setMessages(prev => [...prev, sentMsg]);
    } catch (e) {
      toast.error('Error al enviar el mensaje.');
      setNewMessageText(textToSend); // Restore text on failure
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Helper to format messages time
  const formatMsgTime = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return '';
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden h-[600px] flex">
      {/* Left Panel: Contact Directory */}
      <div className="w-80 border-r border-slate-100 flex flex-col h-full bg-slate-50/30">
        <div className="p-4 border-b border-slate-100 bg-white">
          <h3 className="font-bold text-slate-800 text-base mb-3 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-indigo-600" />
            Mensajería Interna
          </h3>
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Buscar funcionario o rol..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-xl border border-slate-200 pl-9 pr-4 py-2 text-sm focus:border-indigo-500 focus:outline-none transition-shadow bg-slate-50"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {filteredColleagues.length === 0 ? (
            <div className="text-center py-12 px-4">
              <Inbox className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-xs text-slate-400 font-medium">No se encontraron funcionarios en tu establecimiento.</p>
            </div>
          ) : (
            filteredColleagues.map((st) => {
              const isSelected = selectedColleague?.id === st.id;
              const initials = `${st.firstName[0] || ''}${st.lastName[0] || ''}`.toUpperCase();

              return (
                <div
                  key={st.id}
                  onClick={() => setSelectedColleague(st)}
                  className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all hover:bg-white/80 ${
                    isSelected 
                      ? 'bg-indigo-50/60 border border-indigo-100/50 shadow-sm' 
                      : 'border border-transparent'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                    isSelected 
                      ? 'bg-indigo-600 text-white' 
                      : 'bg-indigo-50 text-indigo-700'
                  }`}>
                    {initials}
                  </div>
                  <div className="overflow-hidden">
                    <h4 className={`font-semibold text-sm truncate ${isSelected ? 'text-indigo-900' : 'text-slate-800'}`}>
                      {st.firstName} {st.lastName}
                    </h4>
                    <span className="text-xs text-slate-500 font-medium block truncate">
                      {st.role}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Right Panel: Chat Area */}
      <div className="flex-1 flex flex-col h-full bg-slate-50/20">
        {selectedColleague ? (
          <>
            {/* Header */}
            <div className="p-4 border-b border-slate-100 bg-white flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center font-bold text-xs text-indigo-700">
                  {`${selectedColleague.firstName[0] || ''}${selectedColleague.lastName[0] || ''}`.toUpperCase()}
                </div>
                <div>
                  <h4 className="font-semibold text-slate-800 text-sm">
                    {selectedColleague.firstName} {selectedColleague.lastName}
                  </h4>
                  <span className="text-xs text-indigo-600 font-semibold">{selectedColleague.role}</span>
                </div>
              </div>
            </div>

            {/* Conversation Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/30">
              {loadingMessages && messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
                  <p className="text-xs text-slate-400 mt-2">Cargando conversación...</p>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full py-12 text-center">
                  <MessageSquare className="w-8 h-8 text-slate-300 mb-2" />
                  <p className="text-xs text-slate-500 font-semibold">¡Comienza la conversación!</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Envía un mensaje privado a tu colega.</p>
                </div>
              ) : (
                messages.map((m) => {
                  const isMe = loggedInUser ? m.senderId === loggedInUser.id || m.senderId === loggedInUser.email : false;
                  
                  return (
                    <div 
                      key={m.id} 
                      className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                    >
                      <div className={`max-w-[70%] p-3.5 rounded-2xl text-sm leading-relaxed shadow-sm ${
                        isMe 
                          ? 'bg-gradient-to-br from-indigo-600 to-indigo-700 text-white rounded-tr-none' 
                          : 'bg-white text-slate-700 rounded-tl-none border border-slate-100'
                      }`}>
                        <p className="break-words">{m.message}</p>
                      </div>
                      <span className="text-[9px] text-slate-400 mt-1 flex items-center gap-0.5 px-1.5 font-medium">
                        <Clock className="w-2.5 h-2.5" />
                        {formatMsgTime(m.createdAt)}
                      </span>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input Bar */}
            <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-100 bg-white flex gap-2">
              <input
                type="text"
                placeholder="Escribe un mensaje..."
                value={newMessageText}
                onChange={(e) => setNewMessageText(e.target.value)}
                className="flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none transition-shadow"
              />
              <button
                type="submit"
                disabled={!newMessageText.trim()}
                className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 text-white p-3 rounded-xl shadow-sm transition-all flex items-center justify-center shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-6 bg-slate-50/10">
            <div className="bg-indigo-50 p-4 rounded-full mb-4">
              <MessageSquare className="w-10 h-10 text-indigo-600" />
            </div>
            <h3 className="text-slate-700 font-bold text-base">Bandeja de Entrada Privada</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm leading-relaxed">
              Selecciona un colega de tu establecimiento en la lista lateral para iniciar un chat confidencial.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

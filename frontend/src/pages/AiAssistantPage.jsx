import { useState, useRef, useEffect } from 'react'
import { Send, Bot, User, Sparkles, MessageSquareHeart } from 'lucide-react'
import { queryAiAssistant } from '../api/aiApi'
import Button from '../components/common/Button'
import Input from '../components/common/Input'
import Spinner from '../components/feedback/Spinner'

export default function AiAssistantPage() {
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'assistant',
      text: "Hello! I'm your Ethara Assistant. Ask me questions about employees, seat allocations, project utilization, floor configurations, or neighboring seats. Try clicking one of the suggestions below!",
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef(null)

  const suggestions = [
    "Where is employee Employee 1 seated?",
    "Which project is Employee 1 assigned to?",
    "Show available seats on Floor 3.",
    "Who sits near Employee 1?",
    "Seat utilization for Project Indigo.",
    "Release seat 11101"
  ]

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  async function handleSend(queryText) {
    const textToSend = queryText || input
    if (!textToSend.trim()) return

    if (!queryText) {
      setInput('')
    }

    // Add user message
    const userMsg = { id: Date.now().toString(), role: 'user', text: textToSend }
    setMessages((prev) => [...prev, userMsg])
    setLoading(true)

    try {
      const response = await queryAiAssistant(textToSend)
      const assistantMsg = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        text: response.response || response.data?.response || "I didn't receive a valid answer."
      }
      setMessages((prev) => [...prev, assistantMsg])
    } catch (err) {
      const errorMsg = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        text: `Error: Unable to connect to AI Assistant. (${err.message})`
      }
      setMessages((prev) => [...prev, errorMsg])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex h-[calc(100vh-12rem)] flex-col gap-4">
      <div>
        <h3 className="text-2xl font-semibold text-white flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-cyan-400 animate-pulse" />
          AI Assistant
        </h3>
        <p className="mt-1 text-sm text-slate-400">Ask natural language queries to search, allocate, or manage seats instantly.</p>
      </div>

      <div className="flex flex-1 flex-col overflow-hidden rounded-4xl border border-slate-800 bg-slate-900/60 backdrop-blur-md">
        {/* Chat History */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg) => {
            const isAI = msg.role === 'assistant'
            return (
              <div
                key={msg.id}
                className={`flex gap-3 max-w-[85%] ${isAI ? 'self-start' : 'self-end flex-row-reverse ml-auto'}`}
              >
                <div className={`flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-xl border ${isAI ? 'border-cyan-400/20 bg-cyan-400/10 text-cyan-300' : 'border-purple-400/20 bg-purple-400/10 text-purple-300'}`}>
                  {isAI ? <Bot className="h-4 w-4" /> : <User className="h-4 w-4" />}
                </div>
                <div className={`rounded-3xl px-4 py-3 text-sm shadow-md leading-relaxed whitespace-pre-line ${isAI ? 'bg-slate-950/80 text-slate-100 border border-slate-800/80 rounded-tl-none' : 'bg-cyan-400 text-slate-950 font-medium rounded-tr-none'}`}>
                  {msg.text}
                </div>
              </div>
            )
          })}

          {loading ? (
            <div className="flex gap-3 max-w-[85%]">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-cyan-400/20 bg-cyan-400/10 text-cyan-300">
                <Bot className="h-4 w-4 animate-bounce" />
              </div>
              <div className="rounded-3xl rounded-tl-none bg-slate-950/80 px-4 py-3 text-sm text-slate-400 border border-slate-800/80 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-cyan-400 animate-bounce" />
                <span className="h-2 w-2 rounded-full bg-cyan-400 animate-bounce [animation-delay:0.2s]" />
                <span className="h-2 w-2 rounded-full bg-cyan-400 animate-bounce [animation-delay:0.4s]" />
              </div>
            </div>
          ) : null}
          <div ref={messagesEndRef} />
        </div>

        {/* Suggestion Chips */}
        {messages.length === 1 && !loading ? (
          <div className="px-4 py-2 border-t border-slate-800/50 bg-slate-950/20">
            <p className="text-xs uppercase tracking-wider text-slate-500 mb-2 font-semibold">Suggestions</p>
            <div className="flex flex-wrap gap-2">
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => handleSend(suggestion)}
                  className="rounded-full border border-slate-800 bg-slate-900/50 px-3 py-1.5 text-xs text-cyan-300/80 hover:border-cyan-400/40 hover:bg-cyan-400/10 hover:text-cyan-200 transition-all duration-200"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {/* Chat Input */}
        <form
          onSubmit={(e) => { e.preventDefault(); handleSend(); }}
          className="border-t border-slate-800 bg-slate-950/40 p-4"
        >
          <div className="flex gap-2">
            <div className="flex-1">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask me a query... (e.g. Where is Employee 1 seated?)"
                disabled={loading}
                className="w-full bg-slate-900 border-slate-800 text-white rounded-2xl focus:border-cyan-400/50"
              />
            </div>
            <Button
              type="submit"
              disabled={loading || !input.trim()}
              className="px-5 flex items-center justify-center gap-2 rounded-2xl text-slate-950 bg-cyan-400 hover:bg-cyan-300 disabled:opacity-50 transition"
            >
              <Send className="h-4 w-4" />
              <span className="hidden sm:inline">Send</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

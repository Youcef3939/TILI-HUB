import React, { useState, useRef, useEffect } from 'react';
import {
    Box,
    Typography,
    IconButton,
    TextField,
    Button,
    CircularProgress,
    Paper,
    Link,
    Divider,
    Chip,
    Avatar,
    Tooltip,
    LinearProgress,
    Drawer,
    List,
    ListItemText,
    ListItemButton,
    useMediaQuery,
    Skeleton,
    Container,
} from '@mui/material';
import { styled, alpha, useTheme } from '@mui/material/styles';
import SendIcon from '@mui/icons-material/Send';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import ThumbDownIcon from '@mui/icons-material/ThumbDown';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import PersonIcon from '@mui/icons-material/Person';
import ReplayIcon from '@mui/icons-material/Replay';
import ArticleIcon from '@mui/icons-material/Article';
import CloseIcon from '@mui/icons-material/Close';
import MicIcon from '@mui/icons-material/Mic';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import MenuIcon from '@mui/icons-material/Menu';
import HistoryIcon from '@mui/icons-material/History';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Axios from './Axios.jsx';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import dayjs from 'dayjs';

// ============================================================================
// CONSTANTS
// ============================================================================
const LOADING_MESSAGES = [
    "Je recherche les articles juridiques pertinents...",
    "J'analyse le contexte juridique...",
    "Je formule une réponse précise...",
    "Je vérifie les références légales..."
];

const SUGGESTED_QUESTIONS = [
    "Comment créer une association en Tunisie?",
    "Quels documents sont requis pour les statuts?",
    "Comment financer une association?",
    "Quelles sont les conditions pour être membre?",
    "Comment dissoudre une association?",
    "Quels sont les droits d'une association?"
];

// ============================================================================
// STYLED COMPONENTS (matching Home page with proper spacing)
// ============================================================================

// Main container with proper spacing for drawer
const PageContainer = styled(Box)(({ theme }) => ({
    padding: theme.spacing(3),
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    maxWidth: '1400px',
    margin: '0 auto',
    [theme.breakpoints.down('md')]: {
        padding: theme.spacing(2),
    },
    [theme.breakpoints.down('sm')]: {
        padding: theme.spacing(1.5),
    },
}));

const SectionTitle = styled(Typography)(({ theme }) => ({
    fontWeight: 700,
    marginBottom: theme.spacing(2),
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1),
    color: theme.palette.text.primary,
    fontSize: '1.1rem',
    letterSpacing: '-0.5px',
    '& svg': {
        color: theme.palette.primary.main,
        width: 24,
        height: 24,
    },
}));

const Header = styled(Paper)(({ theme }) => ({
    padding: theme.spacing(2.5),
    marginBottom: theme.spacing(3),
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: theme.shape.borderRadius * 2,
    border: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
    transition: 'all 300ms cubic-bezier(0.4, 0, 0.2, 1)',
    background: theme.palette.background.paper,
}));

const ChatCard = styled(Paper)(({ theme }) => ({
    borderRadius: theme.shape.borderRadius * 2,
    flexGrow: 1,
    border: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
    transition: 'all 300ms cubic-bezier(0.4, 0, 0.2, 1)',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    background: theme.palette.background.paper,
    height: 'calc(100vh - 280px)', // Fixed height to prevent overflow
    minHeight: '500px',
}));

const MessageBubble = styled(Paper)(({ isUser, theme, isCached }) => ({
    maxWidth: '85%',
    padding: theme.spacing(2),
    borderRadius: isUser ? '18px 18px 0 18px' : '18px 18px 18px 0',
    backgroundColor: isUser
        ? theme.palette.primary.main
        : isCached
            ? alpha(theme.palette.info.light, 0.15)
            : theme.palette.mode === 'dark'
                ? alpha(theme.palette.background.paper, 0.8)
                : alpha(theme.palette.grey[100], 0.8),
    color: isUser ? 'white' : theme.palette.text.primary,
    boxShadow: theme.shadows[2],
    position: 'relative',
    border: isCached ? `1px solid ${alpha(theme.palette.info.main, 0.3)}` : 'none',
    transition: 'all 200ms ease',
    '&:hover': {
        boxShadow: theme.shadows[4],
    },
    '& a': {
        color: isUser ? '#FFFFFF' : theme.palette.primary.main,
        textDecoration: 'underline',
        fontWeight: 500,
    },
    '& pre': {
        background: isUser ? alpha('#000', 0.2) : alpha('#000', 0.05),
        padding: theme.spacing(1.5),
        borderRadius: theme.shape.borderRadius,
        overflowX: 'auto',
    },
}));

const InputContainer = styled(Paper)(({ theme, focused }) => ({
    display: 'flex',
    padding: theme.spacing(1.5),
    borderRadius: theme.shape.borderRadius * 2,
    background: theme.palette.background.paper,
    boxShadow: focused ? theme.shadows[4] : theme.shadows[2],
    border: `1px solid ${alpha(theme.palette.primary.main, focused ? 0.5 : 0.1)}`,
    transition: 'all 300ms cubic-bezier(0.4, 0, 0.2, 1)',
}));

const HistoryDrawer = styled(Drawer)(({ theme }) => ({
    '& .MuiDrawer-paper': {
        width: 320,
        padding: theme.spacing(2),
        background: theme.palette.background.default,
        borderRight: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
    }
}));

const QuestionChip = styled(Chip)(({ theme }) => ({
    margin: theme.spacing(0.5),
    borderRadius: theme.shape.borderRadius * 2,
    transition: 'all 200ms ease',
    border: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
    '&:hover': {
        transform: 'translateY(-2px)',
        boxShadow: theme.shadows[4],
        borderColor: theme.palette.primary.main,
    },
}));

const InfoCard = styled(Paper)(({ theme }) => ({
    padding: theme.spacing(2),
    marginBottom: theme.spacing(2),
    borderRadius: theme.shape.borderRadius * 2,
    border: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
    background: theme.palette.background.paper,
}));

const ActionButton = styled(Button)(({ theme }) => ({
    borderRadius: theme.shape.borderRadius * 1.5,
    textTransform: 'none',
    fontWeight: 600,
    padding: theme.spacing(1, 2),
    transition: 'all 200ms ease',
}));

// ============================================================================
// MAIN COMPONENT
// ============================================================================
const EnhancedNGOChatbot = () => {
    const theme = useTheme();
    const navigate = useNavigate();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    // State
    const [chatbotSettings, setChatbotSettings] = useState({
        name: "Assistant Juridique pour les ONG",
        greeting: "Bonjour! Je suis votre assistant virtuel spécialisé dans la législation tunisienne sur les associations.",
    });

    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState('');
    const [loadingProgress, setLoadingProgress] = useState(0);
    const [conversationId, setConversationId] = useState(null);
    const [inputFocused, setInputFocused] = useState(false);
    const [copiedMessageId, setCopiedMessageId] = useState(null);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [historyDrawerOpen, setHistoryDrawerOpen] = useState(false);
    const [conversations, setConversations] = useState([]);
    const [showSources, setShowSources] = useState(false);
    const [articleHighlights, setArticleHighlights] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(true);
    const [isInitializing, setIsInitializing] = useState(true);

    // Refs
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);
    const loadingIntervalRef = useRef(null);

    // Load settings and initialize
    useEffect(() => {
        loadChatbotSettings();
        initializeConversation();
        return () => clearInterval(loadingIntervalRef.current);
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        if (isLoading) {
            let counter = 0;
            loadingIntervalRef.current = setInterval(() => {
                setLoadingMessage(LOADING_MESSAGES[counter % LOADING_MESSAGES.length]);
                setLoadingProgress((prev) => Math.min(prev + 3, 95));
                counter++;
            }, 2000);
        } else {
            clearInterval(loadingIntervalRef.current);
            setTimeout(() => setLoadingProgress(0), 300);
        }
        return () => clearInterval(loadingIntervalRef.current);
    }, [isLoading]);

    // API functions
    const loadChatbotSettings = async () => {
        try {
            const response = await Axios.get('/chatbot/conversations/get_chatbot_settings/');
            if (response.data) {
                setChatbotSettings(prev => ({
                    ...prev,
                    name: response.data.name || prev.name,
                    greeting: response.data.greeting || prev.greeting,
                }));
            }
        } catch (error) {
            console.warn("Could not fetch settings:", error);
        } finally {
            setIsInitializing(false);
        }
    };

    const initializeConversation = async () => {
        const convId = await createNewConversation();
        setTimeout(() => {
            setMessages([{
                id: 'greeting',
                role: 'assistant',
                content: chatbotSettings.greeting
            }]);
        }, 500);
    };

    const createNewConversation = async () => {
        try {
            setIsLoading(true);
            const response = await Axios.post('/chatbot/conversations/');
            const convId = response.data.id;

            setConversationId(convId);
            setMessages([]);
            setArticleHighlights([]);
            setShowSuggestions(true);
            loadConversationHistory();

            return convId;
        } catch (error) {
            console.error('Error creating conversation:', error);
            const fallbackId = "fallback-mode";
            setConversationId(fallbackId);
            return fallbackId;
        } finally {
            setIsLoading(false);
        }
    };

    const loadConversationHistory = async () => {
        try {
            const response = await Axios.get('/chatbot/conversations/');
            setConversations(response.data.results || response.data || []);
        } catch (error) {
            console.error('Error loading conversations:', error);
        }
    };

    const loadConversation = async (convId) => {
        try {
            setIsLoading(true);
            const response = await Axios.get(`/chatbot/conversations/${convId}/history/`);

            setConversationId(convId);
            setMessages(response.data.messages.map(msg => ({
                id: msg.id,
                role: msg.role,
                content: msg.content,
                created_at: msg.created_at
            })));

            setHistoryDrawerOpen(false);
            setShowSuggestions(false);
        } catch (error) {
            console.error('Error loading conversation:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();
        const currentInput = input.trim();
        if (!currentInput || !conversationId || isLoading) return;

        const userMessage = {
            id: `user-${Date.now()}`,
            role: 'user',
            content: currentInput
        };

        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);
        setShowSuggestions(false);

        try {
            const response = await Axios.post(`/chatbot/conversations/${conversationId}/chat/`, {
                message: currentInput
            });

            const content = response.data.content || response.data.response;
            const sources = response.data.relevant_documents || response.data.sources || [];
            const messageId = response.data.message_id || `assistant-${Date.now()}`;
            const isCached = response.data.cached || false;
            const responseLanguage = response.data.language || 'fr';

            const articleNumbers = extractArticleReferences(content);
            if (articleNumbers.length > 0) {
                setArticleHighlights(prev => [...new Set([...prev, ...articleNumbers])]);
            }

            setMessages(prev => [...prev, {
                id: messageId,
                role: 'assistant',
                content: content,
                sources: sources,
                isCached: isCached,
                language: responseLanguage
            }]);
        } catch (error) {
            console.error('Error querying chatbot:', error);
            setMessages(prev => [...prev, {
                id: `error-${Date.now()}`,
                role: 'assistant',
                content: "Désolé, j'ai rencontré un problème. Veuillez réessayer.",
                isError: true
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSuggestedQuestion = (question) => {
        setInput(question);
        setTimeout(() => handleSubmit(), 100);
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const extractArticleReferences = (text) => {
        const articleRegex = /(?:article|art\.|l'article)\s+(\d+)/gi;
        const matches = [...text.matchAll(articleRegex)];
        return [...new Set(matches.map(m => m[1]))];
    };

    const handleCopyMessage = async (content) => {
        try {
            await navigator.clipboard.writeText(content);
            setCopiedMessageId(content.substring(0, 20));
            setTimeout(() => setCopiedMessageId(null), 2000);
        } catch (err) {
            console.error('Copy failed:', err);
        }
    };

    const speakText = (text, language) => {
        if (window.speechSynthesis.speaking) {
            window.speechSynthesis.cancel();
            setIsSpeaking(false);
            return;
        }

        const utterance = new SpeechSynthesisUtterance(text);
        const langMap = { 'fr': 'fr-FR', 'en': 'en-US', 'ar': 'ar-SA' };
        utterance.lang = langMap[language] || 'fr-FR';
        utterance.rate = 0.9;

        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = () => setIsSpeaking(false);

        window.speechSynthesis.speak(utterance);
    };

    const startVoiceInput = () => {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            const recognition = new SpeechRecognition();
            recognition.lang = 'fr-FR';
            recognition.continuous = false;
            recognition.interimResults = false;
            recognition.onresult = (event) => {
                setInput(event.results[0][0].transcript);
            };
            recognition.start();
        } else {
            alert("La reconnaissance vocale n'est pas supportée.");
        }
    };

    const provideFeedback = async (messageId, isPositive) => {
        if (!messageId || !conversationId) return;
        try {
            await Axios.post(`/chatbot/conversations/${conversationId}/feedback/`, {
                message_id: messageId,
                rating: isPositive ? 5 : 1,
                comment: isPositive ? "Réponse utile" : "Réponse à améliorer"
            });
            setMessages(prev =>
                prev.map(msg =>
                    msg.id === messageId
                        ? { ...msg, feedbackGiven: true, feedbackPositive: isPositive }
                        : msg
                )
            );
        } catch (error) {
            console.error('Error submitting feedback:', error);
        }
    };

    const renderMessage = (message) => (
        <Box
            key={message.id}
            component={motion.div}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: message.role === 'user' ? 'flex-end' : 'flex-start',
                mb: 2.5,
            }}
        >
            <Box sx={{ display: 'flex', alignItems: 'flex-end', mb: 0.5 }}>
                {message.role === 'assistant' && (
                    <Avatar sx={{ width: 36, height: 36, mr: 1.5, bgcolor: message.isError ? 'error.main' : 'primary.main', boxShadow: theme.shadows[2] }}>
                        <SmartToyIcon sx={{ fontSize: 20 }} />
                    </Avatar>
                )}

                <MessageBubble isUser={message.role === 'user'} isCached={message.isCached} elevation={0}>
                    <Markdown remarkPlugins={[remarkGfm]}>{message.content}</Markdown>

                    {!message.isError && (
                        <Box sx={{ display: 'flex', gap: 0.5, mt: 1.5, opacity: 0.6, transition: 'opacity 200ms', '&:hover': { opacity: 1 } }}>
                            {message.role === 'assistant' && (
                                <Tooltip title={isSpeaking ? "Arrêter" : "Écouter"}>
                                    <IconButton size="small" onClick={() => speakText(message.content, message.language || 'fr')} sx={{ color: isSpeaking ? 'primary.main' : 'text.secondary' }}>
                                        <VolumeUpIcon fontSize="small" />
                                    </IconButton>
                                </Tooltip>
                            )}
                            <Tooltip title="Copier">
                                <IconButton size="small" onClick={() => handleCopyMessage(message.content)} sx={{ color: 'text.secondary' }}>
                                    {copiedMessageId === message.content.substring(0, 20) ? <CheckCircleIcon fontSize="small" color="success" /> : <ContentCopyIcon fontSize="small" />}
                                </IconButton>
                            </Tooltip>
                        </Box>
                    )}

                    {showSources && message.sources && message.sources.length > 0 && (
                        <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider', fontSize: '0.875rem' }}>
                            <Typography variant="caption" sx={{ fontWeight: 600, display: 'block', mb: 1 }}>
                                <InfoOutlinedIcon sx={{ fontSize: 14, mr: 0.5, verticalAlign: 'middle' }} />Sources:
                            </Typography>
                            {message.sources.map((source, idx) => (
                                <Typography key={idx} variant="caption" display="block" sx={{ mb: 0.5 }}>
                                    • <strong>{source.title}</strong>: {source.excerpt}
                                </Typography>
                            ))}
                        </Box>
                    )}
                </MessageBubble>

                {message.role === 'user' && (
                    <Avatar sx={{ width: 36, height: 36, ml: 1.5, bgcolor: 'primary.dark', boxShadow: theme.shadows[2] }}>
                        <PersonIcon sx={{ fontSize: 20 }} />
                    </Avatar>
                )}
            </Box>

            {message.role === 'assistant' && message.id !== 'greeting' && !message.isError && (
                <Box sx={{ ml: 5, mt: 0.5 }}>
                    {message.feedbackGiven ? (
                        <Chip size="small" label={message.feedbackPositive ? "Merci!" : "Merci"} color={message.feedbackPositive ? "success" : "default"} sx={{ borderRadius: 2 }} />
                    ) : (
                        <Box sx={{ display: 'flex', gap: 1 }}>
                            <Tooltip title="Utile">
                                <IconButton size="small" onClick={() => provideFeedback(message.id, true)} sx={{ color: 'success.main', '&:hover': { bgcolor: alpha(theme.palette.success.main, 0.1) } }}>
                                    <ThumbUpIcon fontSize="small" />
                                </IconButton>
                            </Tooltip>
                            <Tooltip title="Peu utile">
                                <IconButton size="small" onClick={() => provideFeedback(message.id, false)} sx={{ color: 'error.main', '&:hover': { bgcolor: alpha(theme.palette.error.main, 0.1) } }}>
                                    <ThumbDownIcon fontSize="small" />
                                </IconButton>
                            </Tooltip>
                        </Box>
                    )}
                </Box>
            )}
        </Box>
    );

    return (
        <PageContainer>
            <Header elevation={0}>
                <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                    <IconButton onClick={() => isMobile ? setHistoryDrawerOpen(true) : navigate('/home')} sx={{ mr: 1 }}>
                        {isMobile ? <MenuIcon /> : <ArrowBackIcon />}
                    </IconButton>
                    <Avatar sx={{ bgcolor: 'primary.main', mr: 2, width: 40, height: 40 }}>
                        <SmartToyIcon />
                    </Avatar>
                    <Box sx={{ flex: 1 }}>
                        <Typography variant="h6" sx={{ fontWeight: 700, letterSpacing: '-0.5px' }}>
                            {chatbotSettings.name}
                        </Typography>
                    </Box>
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <Tooltip title="Historique">
                        <IconButton onClick={() => { loadConversationHistory(); setHistoryDrawerOpen(true); }}>
                            <HistoryIcon />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title={showSources ? "Masquer sources" : "Afficher sources"}>
                        <IconButton onClick={() => setShowSources(!showSources)}>
                            <InfoOutlinedIcon />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Nouvelle conversation">
                        <IconButton onClick={createNewConversation}>
                            <ReplayIcon />
                        </IconButton>
                    </Tooltip>
                </Box>
            </Header>

            {articleHighlights.length > 0 && (
                <InfoCard elevation={0}>
                    <SectionTitle variant="subtitle1" sx={{ mb: 1.5 }}>
                        <ArticleIcon />Articles mentionnés
                    </SectionTitle>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {articleHighlights.map((num, idx) => (
                            <QuestionChip key={idx} label={`Article ${num}`} size="small" variant="outlined" color="primary" onClick={() => handleSuggestedQuestion(`Que dit l'article ${num}?`)} />
                        ))}
                    </Box>
                </InfoCard>
            )}

            {showSuggestions && messages.length <= 1 && (
                <InfoCard elevation={0}>
                    <SectionTitle variant="subtitle1" sx={{ mb: 1.5 }}>
                        <AutoAwesomeIcon />Questions fréquentes
                    </SectionTitle>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {SUGGESTED_QUESTIONS.map((q, idx) => (
                            <QuestionChip key={idx} label={q} variant="outlined" onClick={() => handleSuggestedQuestion(q)} />
                        ))}
                    </Box>
                </InfoCard>
            )}

            <ChatCard elevation={0}>
                <Box sx={{ flexGrow: 1, p: 3, overflowY: 'auto', bgcolor: theme.palette.mode === 'dark' ? 'background.default' : alpha(theme.palette.grey[50], 0.4) }}>
                    {isInitializing ? (
                        <Box>
                            {[1, 2, 3].map((i) => (
                                <Box key={i} sx={{ display: 'flex', mb: 2 }}>
                                    <Skeleton variant="circular" width={36} height={36} sx={{ mr: 1.5 }} />
                                    <Skeleton variant="rounded" width="60%" height={80} sx={{ borderRadius: 2 }} />
                                </Box>
                            ))}
                        </Box>
                    ) : messages.map(renderMessage)}

                    {isLoading && (
                        <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
                            <Avatar sx={{ width: 36, height: 36, mr: 1.5, bgcolor: 'primary.main' }}>
                                <SmartToyIcon sx={{ fontSize: 20 }} />
                            </Avatar>
                            <MessageBubble elevation={0}>
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                                    <CircularProgress size={18} sx={{ mr: 1.5 }} />
                                    <Typography variant="body2">{loadingMessage}</Typography>
                                </Box>
                                <LinearProgress variant="determinate" value={loadingProgress} sx={{ borderRadius: 1 }} />
                            </MessageBubble>
                        </Box>
                    )}
                    <div ref={messagesEndRef} />
                </Box>

                <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
                    <InputContainer component="form" onSubmit={handleSubmit} focused={inputFocused} elevation={0}>
                        <TextField
                            fullWidth
                            variant="standard"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onFocus={() => setInputFocused(true)}
                            onBlur={() => setInputFocused(false)}
                            placeholder="Posez une question juridique..."
                            disabled={isLoading}
                            inputRef={inputRef}
                            InputProps={{
                                disableUnderline: true,
                                endAdornment: (
                                    <IconButton onClick={startVoiceInput} disabled={isLoading}>
                                        <MicIcon />
                                    </IconButton>
                                )
                            }}
                            sx={{ mr: 1 }}
                        />
                        <IconButton
                            type="submit"
                            disabled={isLoading || !input.trim()}
                            sx={{
                                bgcolor: 'primary.main',
                                color: 'white',
                                '&:hover': { bgcolor: 'primary.dark' },
                                '&.Mui-disabled': { bgcolor: 'action.disabledBackground', color: 'action.disabled' }
                            }}
                        >
                            <SendIcon />
                        </IconButton>
                    </InputContainer>
                </Box>
            </ChatCard>

            <HistoryDrawer anchor="left" open={historyDrawerOpen} onClose={() => setHistoryDrawerOpen(false)}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <IconButton onClick={() => setHistoryDrawerOpen(false)} sx={{ mr: 1 }}>
                        <CloseIcon />
                    </IconButton>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                        Historique
                    </Typography>
                </Box>
                <Divider sx={{ mb: 2 }} />
                <ActionButton fullWidth variant="outlined" startIcon={<ReplayIcon />} onClick={() => { createNewConversation(); setHistoryDrawerOpen(false); }} sx={{ mb: 2 }}>
                    Nouvelle conversation
                </ActionButton>
                <List>
                    {conversations.map((conv) => (
                        <ListItemButton
                            key={conv.id}
                            selected={conv.id === conversationId}
                            onClick={() => loadConversation(conv.id)}
                            sx={{
                                borderRadius: 2,
                                mb: 0.5,
                                '&.Mui-selected': {
                                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                                    '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.15) }
                                }
                            }}
                        >
                            <ListItemText
                                primary={conv.title || 'Conversation'}
                                secondary={dayjs(conv.updated_at).format('DD/MM/YYYY HH:mm')}
                                primaryTypographyProps={{ fontWeight: conv.id === conversationId ? 600 : 400, noWrap: true }}
                            />
                        </ListItemButton>
                    ))}
                </List>
            </HistoryDrawer>

            <Box sx={{ textAlign: 'center', mt: 2 }}>
                <Typography variant="caption" color="text.secondary">
                    Vous êtes administrateur?{' '}
                    <Link href="/home" sx={{ fontWeight: 600, color: 'primary.main', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}>
                        Connectez-vous
                    </Link>
                </Typography>
            </Box>
        </PageContainer>
    );
};

export default EnhancedNGOChatbot;
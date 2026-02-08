import os
import logging
from django.conf import settings
from .models import Conversation, Message
from .rag_service import RAGService
from .conversation_handlers import conversation_manager

from langdetect import detect, LangDetectException

logger = logging.getLogger(__name__)

_GLOBAL_RAG_SERVICE = None
_GLOBAL_LLM = None


def detect_language(text: str) -> str:

    try:
        detected_lang = detect(text)

        lang_mapping = {
            'fr': 'fr',
            'en': 'en',
            'ar': 'ar',
            'de': 'en',
            'es': 'en',
            'it': 'en',
        }

        language = lang_mapping.get(detected_lang, 'fr')  # Default to French
        logger.info(f" Detected language: {detected_lang} → {language}")
        return language

    except LangDetectException:
        logger.warning("Could not detect language, defaulting to French")
        return 'fr'


class LanguagePrompts:

    PROMPTS = {
        'fr': """Tu es un assistant juridique spécialisé en droit tunisien des associations.

 RÈGLES ABSOLUES (NON-NÉGOCIABLES):

1. RÉPONDS TOUJOURS EN FRANÇAIS - Ta réponse DOIT être entièrement en français
2. UTILISE UNIQUEMENT LE CONTEXTE FOURNI - Aucune autre source d'information
3. SI L'INFO N'EST PAS DANS LE CONTEXTE → Réponds: "Cette information n'est pas disponible dans les documents que je possède."
4. INTERDICTION TOTALE d'inventer:
   - Dates
   - Noms de ministères
   - Articles de loi
   - Procédures
   - Tout autre détail
5. CITE EXACTEMENT le texte du contexte (copie-colle des phrases pertinentes)
6. SI TU AS UN DOUTE → Dis que tu ne sais pas

Exemple de BONNE réponse: "Selon le document, [citation exacte du contexte]..."
Exemple de MAUVAISE réponse: Inventer des dates ou procédures non mentionnées.""",

        'en': """You are a legal assistant specialized in Tunisian association law.

ABSOLUTE RULES (NON-NEGOTIABLE):

1. ALWAYS RESPOND IN FRENCH - Your entire response MUST be in French
2. USE ONLY THE PROVIDED CONTEXT - No other information sources
3. IF INFO IS NOT IN CONTEXT → Respond: "This information is not available in the documents I have."
4. TOTAL PROHIBITION on inventing:
   - Dates
   - Ministry names
   - Law articles
   - Procedures
   - Any other details
5. QUOTE EXACTLY from the context (copy-paste relevant phrases)
6. IF IN DOUBT → Say you don't know

Example of GOOD response: "According to the document, [exact quote from context]..."
Example of BAD response: Making up dates or procedures not mentioned.""",

        'ar': """أنت مساعد قانوني متخصص في القانون التونسي للجمعيات.

  القواعد المطلقة (غير قابلة للتفاوض):

1. رد دائماً باللغة العربية - يجب أن تكون ردك بالكامل باللغة العربية
2. استخدم فقط السياق المقدم - لا مصادر أخرى
3. إذا لم تكن المعلومة في السياق → رد: "هذه المعلومات غير متوفرة في المستندات التي أملكها."
4. حظر تام على الاختراع:
   - التواريخ
   - أسماء الوزارات
   - مواد القانون
   - الإجراءات
   - أي تفاصيل أخرى
5. اقتبس بالضبط من السياق (انسخ العبارات ذات الصلة)
6. في حالة الشك → قل أنك لا تعرف

مثال على رد جيد: "وفقاً للمستند، [اقتباس دقيق من السياق]..."
مثال على رد سيء: اختراع تواريخ أو إجراءات غير مذكورة."""
    }

    @classmethod
    def get_prompt(cls, language: str) -> str:
        return cls.PROMPTS.get(language, cls.PROMPTS['fr'])


def get_rag_service():
    global _GLOBAL_RAG_SERVICE
    if _GLOBAL_RAG_SERVICE is None:
        _GLOBAL_RAG_SERVICE = RAGService()
        logger.info(" RAG Service initialized")
    return _GLOBAL_RAG_SERVICE


def get_llm():
    global _GLOBAL_LLM
    if _GLOBAL_LLM is None:
        try:
            from llama_cpp import Llama

            model_path = os.path.join(settings.MEDIA_ROOT, 'models', 'mistral-7b-instruct-v0.1.Q4_K_M.gguf')

            if not os.path.exists(model_path):
                logger.warning(f"Model file not found at {model_path}")
                return None

            logger.info(f"Loading LLM from {model_path}...")
            _GLOBAL_LLM = Llama(
                model_path=model_path,
                n_ctx=4096,
                n_gpu_layers=-1,
                n_batch=512,
                verbose=False
            )
            logger.info("LLM loaded successfully")
        except Exception as e:
            logger.warning(f"LLM not available: {e}")
            logger.warning("You can still ingest documents. LLM will be needed for chat later.")
            return None

    return _GLOBAL_LLM


class ChatbotService:

    def __init__(self):
        self.rag_service = get_rag_service()
        self.llm = get_llm()

    def process_message(self, conversation: Conversation, user_message: str) -> dict:
        try:
            user_language = detect_language(user_message)
            logger.info(f"User language: {user_language.upper()}")

            Message.objects.create(
                conversation=conversation,
                role='user',
                content=user_message
            )

            history = list(
                conversation.messages
                .values('role', 'content')
                .order_by('-created_at')[:5]
            )
            history.reverse()

            relevant_chunks = self.rag_service.retrieve_relevant_chunks(
                query=user_message,
                top_k=3
            )

            logger.info("=" * 80)
            logger.info(f" USER QUERY ({user_language.upper()}): {user_message}")
            logger.info(f" RETRIEVED {len(relevant_chunks)} CHUNKS:")
            for i, chunk in enumerate(relevant_chunks):
                logger.info(f"\n--- Chunk {i + 1} (Relevance Score: {chunk['score']:.4f}) ---")
                logger.info(f"Source: {chunk['title']}")
                logger.info(f"Text Preview: {chunk['text'][:400]}...")
            logger.info("=" * 80)

            if relevant_chunks:
                context = "\n\n".join([
                    f"[Document: {chunk['title']}]\n{chunk['text']}"
                    for chunk in relevant_chunks
                ])
            else:
                no_context_msg = {
                    'fr': "Aucun document pertinent trouvé.",
                    'en': "No relevant documents found.",
                    'ar': "لم يتم العثور على مستندات ذات صلة."
                }
                context = no_context_msg.get(user_language, no_context_msg['fr'])
                logger.warning(f"No relevant chunks retrieved!")

            history_text = "\n".join([
                f"{msg['role'].upper()}: {msg['content']}"
                for msg in history[:-1]
            ])

            if self.llm is None:
                error_msg = {
                    'fr': "Désolé, le modèle n'est pas disponible.",
                    'en': "Sorry, the model is not available.",
                    'ar': "عذرا، النموذج غير متاح."
                }
                response_text = error_msg.get(user_language, error_msg['fr'])
            else:
                response_text = self._generate_response(
                    user_message=user_message,
                    context=context,
                    history=history_text,
                    language=user_language
                )

            logger.info(f"GENERATED RESPONSE ({user_language.upper()}): {response_text[:200]}...")

            Message.objects.create(
                conversation=conversation,
                role='assistant',
                content=response_text
            )

            return {
                "response": response_text,
                "success": True,
                "sources": [chunk['title'] for chunk in relevant_chunks],
                "language": user_language
            }

        except Exception as e:
            logger.error(f"Error processing message: {e}", exc_info=True)
            try:
                error_lang = detect_language(user_message)
            except:
                error_lang = 'fr'

            error_msg = {
                'fr': "Désolé, une erreur s'est produite.",
                'en': "Sorry, an error occurred.",
                'ar': "عذرا، حدث خطأ."
            }

            return {
                "response": error_msg.get(error_lang, error_msg['fr']),
                "success": False,
                "error": str(e)
            }

    def _generate_response(self, user_message: str, context: str, history: str, language: str = 'fr') -> str:

        system_prompt = LanguagePrompts.get_prompt(language)

        instructions_dict = {
            'fr': {
                'context_label': 'CONTEXTE JURIDIQUE (SEULE SOURCE AUTORISÉE)',
                'history_label': 'Historique de la conversation',
                'question_label': 'QUESTION DE L\'UTILISATEUR',
                'instructions': '- Réponds en te basant UNIQUEMENT sur le contexte ci-dessus\n- Cite les passages exacts quand c\'est possible\n- Si l\'information n\'existe pas dans le contexte, dis-le clairement\n- Reste factuel et précis',
                'response_label': 'Réponse (basée strictement sur le contexte)',
            },
            'en': {
                'context_label': 'LEGAL CONTEXT (ONLY AUTHORIZED SOURCE)',
                'history_label': 'Conversation History',
                'question_label': 'USER QUESTION',
                'instructions': '- Answer based ONLY on the context above\n- Quote exact passages when possible\n- If the information doesn\'t exist in the context, state it clearly\n- Stay factual and precise',
                'response_label': 'Response (based strictly on context)',
            },
            'ar': {
                'context_label': 'السياق القانوني (المصدر الوحيد المصرح به)',
                'history_label': 'سجل المحادثة',
                'question_label': 'سؤال المستخدم',
                'instructions': '- رد بناءً على السياق أعلاه فقط\n- اقتبس الفقرات الدقيقة عند الإمكان\n- إذا لم توجد المعلومة في السياق، اذكرها بوضوح\n- ابق واقعياً ودقيقاً',
                'response_label': 'الرد (بناءً بدقة على السياق)',
            }
        }

        instr = instructions_dict.get(language, instructions_dict['fr'])

        prompt = f"""<s>[INST] <<SYS>>
{system_prompt}
<</SYS>>

{instr['context_label']}:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
{context}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

{f"{instr['history_label']}:{history}" if history.strip() else ""}

{instr['question_label']}: {user_message}

{instr['instructions']}

[/INST]

{instr['response_label']}:"""

        logger.info(f"Generating response in: {language.upper()}")
        logger.info(f"System prompt language: {language}")

        response = self.llm(
            prompt,
            max_tokens=512,
            temperature=0.05,
            top_p=0.85,
            top_k=20,
            repeat_penalty=1.15,
            frequency_penalty=0.1,
            presence_penalty=0.1,
            stop=["</s>", "[INST]", "Question:", "QUESTION:", "CONTEXTE:", "<s>", "[/INST]"]
        )

        generated_text = response['choices'][0]['text'].strip()

        if any(label in generated_text for label in [instr['response_label'], "Réponse", "Response", "الرد"]):
            for label in [instr['response_label'], "Réponse", "Response", "الرد"]:
                if label in generated_text:
                    generated_text = generated_text.split(label, 1)[-1]
                    break

        generated_text = generated_text.lstrip(': ')

        logger.info(f"Response language: {language}")
        return generated_text.strip()

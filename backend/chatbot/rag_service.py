import os
import logging
from typing import List, Dict, Any
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams, PointStruct
from sentence_transformers import SentenceTransformer
from chonkie import TokenChunker

logger = logging.getLogger(__name__)


class RAGService:

    def __init__(self):
        self.qdrant_client = QdrantClient(path="./qdrant_data")

        # sentence-transformers for embeddings
        self.embedding_model = SentenceTransformer('paraphrase-multilingual-mpnet-base-v2')

        self.chunker = TokenChunker(
            chunk_size=512,
            chunk_overlap=128
        )

        self.collection_name = "legal_documents"
        self._ensure_collection_exists()

    def _ensure_collection_exists(self):
        collections = self.qdrant_client.get_collections().collections
        collection_names = [c.name for c in collections]

        if self.collection_name not in collection_names:
            self.qdrant_client.create_collection(
                collection_name=self.collection_name,
                vectors_config=VectorParams(
                    size=768,  # paraphrase-multilingual-mpnet-base-v2 dimension
                    distance=Distance.COSINE
                )
            )
            logger.info(f"Created Qdrant collection: {self.collection_name}")

    def embed_text(self, text: str) -> List[float]:
        embedding = self.embedding_model.encode(text)
        return embedding.tolist()

    def process_and_store_document(self, document_id: int, title: str, content: str):

        # Chunk with Chonkie
        chunks = self.chunker.chunk(content)

        logger.info(f"Document '{title}' split into {len(chunks)} chunks")

        points = []

        for idx, chunk in enumerate(chunks):
            numeric_id = document_id * 10000 + idx
            chunk_text = chunk.text if hasattr(chunk, 'text') else str(chunk)
            embedding = self.embed_text(chunk_text)

            points.append(
                PointStruct(
                    id=numeric_id,
                    vector=embedding,
                    payload={
                        "document_id": document_id,
                        "chunk_index": idx,
                        "text": chunk_text,
                        "title": title
                    }
                )
            )

        # Batch insert to Qdrant
        self.qdrant_client.upsert(
            collection_name=self.collection_name,
            points=points
        )

        logger.info(f" Stored {len(chunks)} chunks for document {document_id}")

    def retrieve_relevant_chunks(self, query: str, top_k: int = 3) -> List[Dict[str, Any]]:
        try:
            try:
                collection_info = self.qdrant_client.get_collection(self.collection_name)
                logger.info(f"🗄️ Collection '{self.collection_name}' has {collection_info.points_count} points")

                if collection_info.points_count == 0:
                    logger.error("Collection is EMPTY! Run: python manage.py ingest_documents")
                    return []
            except Exception as e:
                logger.error(f"Collection check failed: {e}")
                return []

            # Embed the query
            logger.info(f"Embedding query: {query[:100]}...")
            query_embedding = self.embed_text(query)
            logger.info(f"Query embedded, vector size: {len(query_embedding)}")

            # Search in Qdrant using query_points (more reliable than search())
            logger.info(f"Searching in Qdrant for top {top_k} results...")

            try:
                search_results = self.qdrant_client.query_points(
                    collection_name=self.collection_name,
                    query=query_embedding,
                    limit=top_k,
                    with_payload=True
                ).points
                logger.info("Using query_points API")

            except AttributeError:
                logger.warning("query_points not available, falling back to search()")
                search_results = self.qdrant_client.search(
                    collection_name=self.collection_name,
                    query_vector=query_embedding,
                    limit=top_k
                )

            logger.info(f" Search results type: {type(search_results)}")
            logger.info(f" Number of results: {len(search_results) if search_results else 0}")

            if search_results is None:
                logger.warning("Qdrant search returned None")
                return []

            if len(search_results) == 0:
                logger.warning("Qdrant search returned empty list")
                return []

            relevant_chunks = []
            for hit in search_results:
                try:
                    if hasattr(hit, 'payload'):
                        payload = hit.payload
                        score = hit.score
                    else:
                        payload = hit.get('payload', {}) if isinstance(hit, dict) else {}
                        score = hit.get('score', 0) if isinstance(hit, dict) else 0

                    logger.info(f" Hit: score={score:.4f}, title={payload.get('title', 'N/A')}")

                    relevant_chunks.append({
                        "text": payload.get("text", ""),
                        "title": payload.get("title", "Unknown"),
                        "score": score,
                        "document_id": payload.get("document_id", 0)
                    })
                except (KeyError, AttributeError, TypeError) as e:
                    logger.error(f" Error processing hit: {e}, hit type: {type(hit)}")
                    continue

            logger.info(f" Retrieved {len(relevant_chunks)} relevant chunks")
            return relevant_chunks

        except Exception as e:
            logger.error(f" Error retrieving chunks: {e}", exc_info=True)
            return []

    def debug_collection_contents(self):
        try:
            collection_info = self.qdrant_client.get_collection(self.collection_name)
            logger.info(f"Collection '{self.collection_name}' stats:")
            logger.info(f"   - Total points: {collection_info.points_count}")

            if collection_info.points_count == 0:
                logger.warning("collection is empty!")
                return

            try:
                points, _ = self.qdrant_client.scroll(
                    collection_name=self.collection_name,
                    limit=100,
                    with_payload=True
                )

                logger.info(f"retrieved {len(points)} points via scroll")
                for i, point in enumerate(points[:5]):
                    if hasattr(point, 'payload'):
                        payload = point.payload
                        logger.info(f"\n   Point {i} (ID={point.id}):")
                        logger.info(f"     Title: {payload.get('title', 'N/A')}")
                        logger.info(f"     Text preview: {payload.get('text', '')[:200]}...")
                        logger.info(f"     Document ID: {payload.get('document_id', 'N/A')}")

            except Exception as scroll_error:
                logger.error(f"scroll failed: {scroll_error}")

        except Exception as e:
            logger.error(f"debug collection failed: {e}", exc_info=True)
import os
import chromadb
from pathlib import Path

COLLECTION_NAME    = "company_knowledge"
CHROMA_PERSIST_DIR = os.getenv("CHROMA_PERSIST_DIR", "./chroma_db")

def _get_collection():
    client = chromadb.PersistentClient(path=CHROMA_PERSIST_DIR)
    collection = client.get_or_create_collection(
        name=COLLECTION_NAME,
        metadata={"hnsw:space": "cosine"}
    )
    return collection

def retrieve_chunks(query: str, top_k: int = 5) -> list[str]:
    try:
        collection = _get_collection()
        if collection.count() == 0:
            return []
        results = collection.query(
            query_texts=[query],
            n_results=min(top_k, collection.count())
        )
        return results["documents"][0] if results["documents"] else []
    except Exception as e:
        print(f"Retrieval error: {e}")
        return []

def ingest_document(text: str, doc_id: str, metadata: dict = None) -> bool:
    try:
        collection = _get_collection()
        chunks = [text[i:i+500] for i in range(0, len(text), 500)]
        ids    = [f"{doc_id}_chunk_{i}" for i in range(len(chunks))]
        metas  = [metadata or {} for _ in chunks]
        collection.upsert(documents=chunks, ids=ids, metadatas=metas)
        return True
    except Exception as e:
        print(f"Ingest error: {e}")
        return False

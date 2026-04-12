import { Pinecone } from '@pinecone-database/pinecone';

export const pinecone = process.env.PINECONE_API_KEY 
  ? new Pinecone({ apiKey: process.env.PINECONE_API_KEY })
  : null;

export const getPineconeIndex = () => {
  if (!pinecone) {
    console.warn("Pinecone API key is not defined. Index operations will fail.");
    return null;
  }
  return pinecone.index({ host: process.env.PINECONE_HOST || '' });
};
